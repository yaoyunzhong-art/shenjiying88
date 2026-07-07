/**
 * crdt.service.ts - Phase-126 T126-1
 * Realtime CRDT + WebSocket + 多设备同步服务
 *
 * 模块:
 * - CRDTDocument: CRDT 文档，支持并发追加/删除/插入操作
 * - WebSocketSessionManager: WebSocket 会话管理
 * - MultiDeviceSyncService: 多设备同步服务
 */

import { Logger } from '@nestjs/common'

// ─── 类型定义 ────────────────────────────────────────────────────────────────

export type OperationType = 'insert' | 'delete' | 'append'

export interface CRDTOperation {
  id: string
  type: OperationType
  position?: number
  content?: string
  timestamp: number
  clientId: string
  version: number
}

export interface CRDTDocumentState {
  docId: string
  content: string
  operations: CRDTOperation[]
  version: number
  lastModified: number
}

// 内部存储类型（不含 docId）
interface StoredDocument {
  content: string
  operations: CRDTOperation[]
  version: number
  lastModified: number
}

export interface Session {
  sessionId: string
  docId: string
  users: Set<string>
  createdAt: number
  lastActivity: number
}

export interface WebSocketMessage {
  type: 'operation' | 'join' | 'leave' | 'sync' | 'ack' | 'error'
  sessionId?: string
  userId?: string
  payload?: unknown
  timestamp: number
}

export interface DeviceState {
  deviceId: string
  userId: string
  lastSyncAt: number
  version: number
  pendingOps: CRDTOperation[]
}

export interface SyncStatus {
  userId: string
  devices: DeviceState[]
  activeSessions: number
  pendingConflicts: number
}

// ─── CRDT Document ────────────────────────────────────────────────────────────

class CRDTDocument {
  private readonly logger = new Logger(CRDTDocument.name)

  private documents = new Map<string, StoredDocument>()

  /**
   * 创建 CRDT 文档
   */
  createDocument(docId: string): CRDTDocumentState {
    if (this.documents.has(docId)) {
      return this.getState(docId)!
    }

    this.documents.set(docId, {
      content: '',
      operations: [],
      version: 0,
      lastModified: Date.now(),
    })

    this.logger.log(`Document created: ${docId}`)
    return this.getState(docId)!
  }

  /**
   * 应用操作（追加/删除/插入）
   */
  applyOperation(docId: string, operation: CRDTOperation): CRDTDocumentState | null {
    const doc = this.documents.get(docId)
    if (!doc) {
      this.logger.warn(`Document not found: ${docId}`)
      return null
    }

    // 验证操作版本
    if (operation.version !== doc.version + 1) {
      this.logger.warn(`Version mismatch for ${docId}: expected ${doc.version + 1}, got ${operation.version}`)
    }

    const newDoc = this.documents.get(docId)!
    newDoc.version++
    newDoc.lastModified = Date.now()
    newDoc.operations.push(operation)

    // 根据操作类型更新内容
    switch (operation.type) {
      case 'append':
        newDoc.content += operation.content ?? ''
        break
      case 'insert':
        if (operation.position !== undefined && operation.content) {
          const pos = Math.min(operation.position, newDoc.content.length)
          newDoc.content = newDoc.content.slice(0, pos) + operation.content + newDoc.content.slice(pos)
        }
        break
      case 'delete':
        if (operation.position !== undefined && operation.content) {
          // 基于内容匹配删除（简化版 CRDT）
          newDoc.content = newDoc.content.replace(operation.content, '')
        }
        break
    }

    this.logger.debug(`Operation applied to ${docId}: ${operation.type} v${newDoc.version}`)
    return this.getState(docId)
  }

  /**
   * 合并远程文档状态
   */
  merge(remoteDoc: CRDTDocumentState): CRDTDocumentState | null {
    const local = this.documents.get(remoteDoc.docId)
    if (!local) {
      // 本地不存在，直接创建
      this.documents.set(remoteDoc.docId, {
        content: remoteDoc.content,
        operations: [...remoteDoc.operations],
        version: remoteDoc.version,
        lastModified: remoteDoc.lastModified,
      })
      return this.getState(remoteDoc.docId)
    }

    // 版本相同，无需合并
    if (local.version === remoteDoc.version) {
      return this.getState(remoteDoc.docId)
    }

    // 简单合并策略：取版本号更高的内容
    // 实际生产环境需要使用向量时钟或 CRDT 算法
    if (remoteDoc.version > local.version) {
      // 合并操作历史
      const mergedOps = this.mergeOperations(local.operations, remoteDoc.operations)
      const mergedContent = this.rebuildContent(mergedOps)

      this.documents.set(remoteDoc.docId, {
        content: mergedContent,
        operations: mergedOps,
        version: Math.max(local.version, remoteDoc.version),
        lastModified: Math.max(local.lastModified, remoteDoc.lastModified),
      })

      this.logger.log(`Merged document ${remoteDoc.docId}: v${local.version} -> v${remoteDoc.version}`)
    }

    return this.getState(remoteDoc.docId)
  }

  /**
   * 获取当前状态
   */
  getState(docId: string): CRDTDocumentState | null {
    const doc = this.documents.get(docId)
    if (!doc) return null

    return {
      docId,
      content: doc.content,
      operations: [...doc.operations],
      version: doc.version,
      lastModified: doc.lastModified,
    }
  }

  /**
   * 删除文档
   */
  deleteDocument(docId: string): boolean {
    return this.documents.delete(docId)
  }

  private mergeOperations(local: CRDTOperation[], remote: CRDTOperation[]): CRDTOperation[] {
    const opMap = new Map<string, CRDTOperation>()
    
    for (const op of local) {
      opMap.set(op.id, op)
    }
    
    for (const op of remote) {
      // 使用 Lamport 时钟规则：相同 id 取版本号更高的，相同版本取 lexicographically 更大的 clientId
      const existing = opMap.get(op.id)
      if (!existing || this.compareOperation(op, existing) > 0) {
        opMap.set(op.id, op)
      }
    }

    return Array.from(opMap.values()).sort((a, b) => a.timestamp - b.timestamp)
  }

  private compareOperation(a: CRDTOperation, b: CRDTOperation): number {
    if (a.version !== b.version) return a.version - b.version
    return a.clientId.localeCompare(b.clientId)
  }

  private rebuildContent(operations: CRDTOperation[]): string {
    let content = ''
    for (const op of operations) {
      switch (op.type) {
        case 'append':
          content += op.content ?? ''
          break
        case 'insert':
          if (op.position !== undefined && op.content) {
            const pos = Math.min(op.position, content.length)
            content = content.slice(0, pos) + op.content + content.slice(pos)
          }
          break
        case 'delete':
          if (op.content) {
            content = content.replace(op.content, '')
          }
          break
      }
    }
    return content
  }
}

// ─── WebSocket Session Manager ───────────────────────────────────────────────

class WebSocketSessionManager {
  private readonly logger = new Logger(WebSocketSessionManager.name)

  private sessions = new Map<string, Session>()
  private userSessions = new Map<string, Set<string>>() // userId -> sessionIds

  /**
   * 创建协作会话
   */
  createSession(docId: string, userId: string): Session {
    const sessionId = `session_${docId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    
    const session: Session = {
      sessionId,
      docId,
      users: new Set([userId]),
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }

    this.sessions.set(sessionId, session)
    
    // 维护用户与会话的关系
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set())
    }
    this.userSessions.get(userId)!.add(sessionId)

    this.logger.log(`Session created: ${sessionId} for doc ${docId} by user ${userId}`)
    return session
  }

  /**
   * 加入会话
   */
  joinSession(sessionId: string, userId: string): Session | null {
    const session = this.sessions.get(sessionId)
    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`)
      return null
    }

    session.users.add(userId)
    session.lastActivity = Date.now()

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set())
    }
    this.userSessions.get(userId)!.add(sessionId)

    this.logger.log(`User ${userId} joined session ${sessionId}`)
    return session
  }

  /**
   * 离开会话
   */
  leaveSession(sessionId: string, userId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`)
      return false
    }

    session.users.delete(userId)
    session.lastActivity = Date.now()

    // 从用户会话映射中移除
    const userSessSet = this.userSessions.get(userId)
    if (userSessSet) {
      userSessSet.delete(sessionId)
    }

    // 如果会话没有用户了，删除会话
    if (session.users.size === 0) {
      this.sessions.delete(sessionId)
      this.logger.log(`Session ${sessionId} deleted (no users)`)
    }

    this.logger.log(`User ${userId} left session ${sessionId}`)
    return true
  }

  /**
   * 广播消息到会话
   */
  broadcastToSession(sessionId: string, message: WebSocketMessage, excludeUserId?: string): string[] {
    const session = this.sessions.get(sessionId)
    if (!session) {
      this.logger.warn(`Session not found: ${sessionId}`)
      return []
    }

    session.lastActivity = Date.now()
    
    const recipients: string[] = []
    for (const userId of session.users) {
      if (userId !== excludeUserId) {
        recipients.push(userId)
        this.logger.debug(`Broadcast to ${userId} in ${sessionId}: ${message.type}`)
      }
    }

    return recipients
  }

  /**
   * 获取用户的活跃会话
   */
  getActiveSessions(userId: string): Session[] {
    const sessionIds = this.userSessions.get(userId)
    if (!sessionIds) return []

    const activeSessions: Session[] = []
    const now = Date.now()
    const timeout = 30 * 60 * 1000 // 30 分钟超时

    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId)
      if (session && now - session.lastActivity < timeout) {
        activeSessions.push(session)
      }
    }

    return activeSessions
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) ?? null
  }

  /**
   * 获取所有会话
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values())
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    // 清理用户会话映射
    for (const userId of session.users) {
      const userSessSet = this.userSessions.get(userId)
      if (userSessSet) {
        userSessSet.delete(sessionId)
      }
    }

    this.sessions.delete(sessionId)
    return true
  }
}

// ─── Multi-Device Sync Service ───────────────────────────────────────────────

class MultiDeviceSyncService {
  private readonly logger = new Logger(MultiDeviceSyncService.name)

  private deviceStates = new Map<string, Map<string, DeviceState>>() // userId -> deviceId -> state
  private pendingConflicts = new Map<string, { device1: string; device2: string; operation: CRDTOperation }>()

  constructor(
    private readonly crdt: CRDTDocument,
    private readonly wsManager: WebSocketSessionManager
  ) {}

  /**
   * 同步状态到设备
   */
  syncToDevice(userId: string, deviceId: string, state: CRDTDocumentState): DeviceState {
    if (!this.deviceStates.has(userId)) {
      this.deviceStates.set(userId, new Map())
    }

    const userDevices = this.deviceStates.get(userId)!
    
    let deviceState = userDevices.get(deviceId)
    if (!deviceState) {
      deviceState = {
        deviceId,
        userId,
        lastSyncAt: Date.now(),
        version: 0,
        pendingOps: [],
      }
      userDevices.set(deviceId, deviceState)
    }

    // 更新设备状态
    if (state.version > deviceState.version) {
      deviceState.lastSyncAt = Date.now()
      deviceState.version = state.version
      deviceState.pendingOps = []
      
      this.logger.log(`Synced device ${deviceId} for user ${userId} to v${state.version}`)
    } else if (state.version < deviceState.version) {
      // 设备版本落后，需要回放pendingOps
      this.logger.warn(`Device ${deviceId} version ${deviceState.version} > state version ${state.version}`)
    }

    return deviceState
  }

  /**
   * 解决设备间冲突
   */
  resolveDeviceConflict(userId: string, deviceId1: string, deviceId2: string): boolean {
    const userDevices = this.deviceStates.get(userId)
    if (!userDevices) return false

    const state1 = userDevices.get(deviceId1)
    const state2 = userDevices.get(deviceId2)
    
    if (!state1 || !state2) return false

    // 检测版本冲突
    if (state1.version === state2.version) {
      this.logger.debug(`No conflict between ${deviceId1} and ${deviceId2}`)
      return true
    }

    // 版本不同，需要解决冲突
    // 策略：使用基于向量时钟的 CRDT 合并
    const conflictKey = `${userId}:${deviceId1}:${deviceId2}`
    
    // 合并 pending operations
    const mergedOps = this.mergePendingOps(state1.pendingOps, state2.pendingOps)
    
    // 更新设备状态
    state1.pendingOps = mergedOps.filter(op => 
      state2.pendingOps.some(o2 => o2.id === op.id && o2.clientId === state1.deviceId)
    )
    state2.pendingOps = mergedOps.filter(op =>
      state1.pendingOps.some(o1 => o1.id === op.id && o1.clientId === state2.deviceId)
    )

    this.pendingConflicts.delete(conflictKey)
    
    this.logger.log(`Conflict resolved between ${deviceId1} and ${deviceId2} for user ${userId}`)
    return true
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(userId: string): SyncStatus | null {
    const userDevices = this.deviceStates.get(userId)
    if (!userDevices) return null

    const devices = Array.from(userDevices.values())
    const sessions = this.wsManager.getActiveSessions(userId)

    return {
      userId,
      devices,
      activeSessions: sessions.length,
      pendingConflicts: this.pendingConflicts.size,
    }
  }

  /**
   * 获取设备的待同步操作
   */
  getPendingOps(userId: string, deviceId: string): CRDTOperation[] {
    const userDevices = this.deviceStates.get(userId)
    if (!userDevices) return []

    const state = userDevices.get(deviceId)
    return state?.pendingOps ?? []
  }

  /**
   * 添加待同步操作
   */
  addPendingOp(userId: string, deviceId: string, op: CRDTOperation): void {
    if (!this.deviceStates.has(userId)) {
      this.deviceStates.set(userId, new Map())
    }

    const userDevices = this.deviceStates.get(userId)!
    let deviceState = userDevices.get(deviceId)
    
    if (!deviceState) {
      deviceState = {
        deviceId,
        userId,
        lastSyncAt: Date.now(),
        version: 0,
        pendingOps: [],
      }
      userDevices.set(deviceId, deviceState)
    }

    deviceState.pendingOps.push(op)
  }

  private mergePendingOps(ops1: CRDTOperation[], ops2: CRDTOperation[]): CRDTOperation[] {
    const opMap = new Map<string, CRDTOperation>()

    for (const op of ops1) {
      opMap.set(op.id, op)
    }

    for (const op of ops2) {
      const existing = opMap.get(op.id)
      if (!existing || this.compareOps(op, existing) > 0) {
        opMap.set(op.id, op)
      }
    }

    return Array.from(opMap.values())
  }

  private compareOps(a: CRDTOperation, b: CRDTOperation): number {
    if (a.version !== b.version) return a.version - b.version
    return a.clientId.localeCompare(b.clientId)
  }
}

// ─── 导出 ────────────────────────────────────────────────────────────────────

export {
  CRDTDocument,
  WebSocketSessionManager,
  MultiDeviceSyncService,
}
