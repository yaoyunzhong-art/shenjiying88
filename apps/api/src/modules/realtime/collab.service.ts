import { Injectable, Logger } from '@nestjs/common'
import { nanoid } from 'nanoid'

/**
 * 协同编辑操作
 */
export interface CollabOperation {
  id: string
  docId: string
  userId: string
  delta: string
  version: number
  timestamp: number
  type: 'insert' | 'delete' | 'retain'
}

/**
 * 文档数据
 */
export interface CollabDocument {
  id: string
  title: string
  ownerId: string
  content: string
  version: number
  editors: string[]
  createdAt: number
  updatedAt: number
}

/**
 * 用户在线状态
 */
export interface UserPresence {
  userId: string
  docId: string
  status: 'online' | 'away' | 'busy'
  lastActive: number
  cursor?: { line: number; column: number }
}

/**
 * 冲突信息
 */
export interface ConflictInfo {
  docId: string
  localOp: CollabOperation
  remoteOp: CollabOperation
  type: 'concurrent' | 'overlapping'
  resolved: boolean
  resolution?: 'local' | 'remote' | 'merged'
  timestamp: number
}

/**
 * 协同编辑器服务
 */
@Injectable()
export class CollaborativeEditor {
  private readonly logger = new Logger(CollaborativeEditor.name)

  private documents: Map<string, CollabDocument> = new Map()
  private operations: Map<string, CollabOperation[]> = new Map()
  private pendingDeltas: Map<string, string[]> = new Map()

  /**
   * 创建文档
   */
  createDocument(title: string, ownerId: string): CollabDocument {
    const id = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = Date.now()
    const doc: CollabDocument = {
      id,
      title,
      ownerId,
      content: '',
      version: 0,
      editors: [ownerId],
      createdAt: now,
      updatedAt: now
    }
    this.documents.set(id, doc)
    this.operations.set(id, [])
    this.logger.log(`Document created: ${id} by ${ownerId}`)
    return doc
  }

  /**
   * 邀请协作者
   */
  inviteEditors(docId: string, userIds: string[]): CollabDocument | undefined {
    const doc = this.documents.get(docId)
    if (!doc) return undefined

    for (const userId of userIds) {
      if (!doc.editors.includes(userId)) {
        doc.editors.push(userId)
      }
    }
    doc.updatedAt = Date.now()
    this.logger.log(`Invited editors ${userIds.join(', ')} to document ${docId}`)
    return doc
  }

  /**
   * 更新文档内容（增量更新）
   */
  updateContent(
    docId: string,
    delta: string,
    userId: string
  ): { version: number; operation: CollabOperation } | undefined {
    const doc = this.documents.get(docId)
    if (!doc) return undefined

    if (!doc.editors.includes(userId)) {
      this.logger.warn(`User ${userId} is not an editor of document ${docId}`)
      return undefined
    }

    const operation: CollabOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      docId,
      userId,
      delta,
      version: doc.version + 1,
      timestamp: Date.now(),
      type: delta.startsWith('+') ? 'insert' : delta.startsWith('-') ? 'delete' : 'retain'
    }

    const ops = this.operations.get(docId) || []
    ops.push(operation)
    this.operations.set(docId, ops)

    const deltas = this.pendingDeltas.get(docId) || []
    deltas.push(delta)
    this.pendingDeltas.set(docId, deltas)

    doc.content = this.applyDelta(doc.content, delta)
    doc.version = operation.version
    doc.updatedAt = Date.now()

    return { version: operation.version, operation }
  }

  /**
   * 获取文档快照
   */
  getDocument(docId: string): CollabDocument | undefined {
    return this.documents.get(docId)
  }

  /**
   * 获取文档版本号
   */
  getVersion(docId: string): number {
    return this.documents.get(docId)?.version ?? -1
  }

  /**
   * 获取文档操作历史
   */
  getOperations(docId: string): CollabOperation[] {
    return this.operations.get(docId) || []
  }

  /**
   * 应用增量到内容
   */
  private applyDelta(content: string, delta: string): string {
    if (delta.startsWith('+')) {
      return content + delta.slice(1)
    } else if (delta.startsWith('-')) {
      const length = parseInt(delta.slice(1), 10) || 1
      return content.slice(0, -length)
    } else if (delta.startsWith('=')) {
      return delta.slice(1)
    }
    return content
  }
}

/**
 * 在线状态服务
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name)

  private presence: Map<string, UserPresence> = new Map()
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map()
  private readonly HEARTBEAT_INTERVAL = 5000
  private readonly TIMEOUT_MS = 30000

  /**
   * 用户心跳
   */
  heartbeat(userId: string, docId?: string): void {
    if (docId) {
      const key = this.buildKey(userId, docId)
      const existing = this.presence.get(key)
      this.presence.set(key, {
        userId,
        docId,
        status: existing?.status || 'online',
        lastActive: Date.now(),
        cursor: existing?.cursor
      })
    }
    this.startHeartbeatMonitor(userId)
  }

  /**
   * 获取文档在线用户
   */
  getOnlineUsers(docId: string): UserPresence[] {
    const online: UserPresence[] = []
    const now = Date.now()

    this.presence.forEach((presence, key) => {
      if (presence.docId === docId && now - presence.lastActive < this.TIMEOUT_MS) {
        online.push(presence)
      }
    })

    return online
  }

  /**
   * 设置用户状态
   */
  setUserStatus(userId: string, status: 'online' | 'away' | 'busy'): void {
    this.presence.forEach((presence, key) => {
      if (presence.userId === userId) {
        presence.status = status
        presence.lastActive = Date.now()
      }
    })
    this.logger.log(`User ${userId} status set to ${status}`)
  }

  /**
   * 获取用户最后活跃时间
   */
  getLastActive(userId: string): number {
    let lastActive = 0
    this.presence.forEach((presence) => {
      if (presence.userId === userId && presence.lastActive > lastActive) {
        lastActive = presence.lastActive
      }
    })
    return lastActive
  }

  /**
   * 移除用户的所有状态
   */
  removeUser(userId: string): void {
    const keysToDelete: string[] = []
    this.presence.forEach((_, key) => {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach((key) => this.presence.delete(key))

    const timer = this.heartbeatTimers.get(userId)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(userId)
    }
  }

  /**
   * 获取用户的光标位置
   */
  setCursor(userId: string, docId: string, cursor: { line: number; column: number }): void {
    const key = this.buildKey(userId, docId)
    const existing = this.presence.get(key)
    if (existing) {
      existing.cursor = cursor
      existing.lastActive = Date.now()
    }
  }

  private buildKey(userId: string, docId: string): string {
    return `${userId}:${docId}`
  }

  private startHeartbeatMonitor(userId: string): void {
    if (this.heartbeatTimers.has(userId)) return

    const timer = setInterval(() => {
      const now = Date.now()
      let hasActiveDoc = false

      this.presence.forEach((presence, key) => {
        if (presence.userId === userId && now - presence.lastActive > this.TIMEOUT_MS) {
          presence.status = 'away'
        }
        if (presence.userId === userId) {
          hasActiveDoc = true
        }
      })

      if (!hasActiveDoc) {
        const timer = this.heartbeatTimers.get(userId)
        if (timer) {
          clearInterval(timer)
          this.heartbeatTimers.delete(userId)
        }
      }
    }, this.HEARTBEAT_INTERVAL)

    this.heartbeatTimers.set(userId, timer)
  }
}

/**
 * 冲突解决服务
 */
@Injectable()
export class ConflictResolver {
  private readonly logger = new Logger(ConflictResolver.name)

  private conflicts: Map<string, ConflictInfo[]> = new Map()
  private operations: Map<string, CollabOperation[]> = new Map()

  /**
   * 检测冲突
   */
  detectConflict(localOp: CollabOperation, remoteOp: CollabOperation): boolean {
    if (localOp.docId !== remoteOp.docId) return false
    if (localOp.userId === remoteOp.userId) return false

    const timeDiff = Math.abs(localOp.timestamp - remoteOp.timestamp)
    const CONFLICT_THRESHOLD_MS = 5000

    if (timeDiff > CONFLICT_THRESHOLD_MS) return false

    if (localOp.version !== remoteOp.version) return true

    return localOp.delta !== remoteOp.delta &&
           this.isOverlapping(localOp.delta, remoteOp.delta)
  }

  /**
   * LWW 解决（最后写入胜出）
   */
  resolveByLastWriteWins(ops: CollabOperation[]): CollabOperation {
    if (ops.length === 0) {
      throw new Error('No operations to resolve')
    }

    const sorted = [...ops].sort((a, b) => b.timestamp - a.timestamp)
    const winner = sorted[0]

    this.logger.log(`LWW resolved: operation ${winner.id} wins (timestamp: ${winner.timestamp})`)

    if (ops.length > 1) {
      this.recordConflict(ops[0].docId, ops, 'local')
    }

    return winner
  }

  /**
   * 合并解决（保留双方变更）
   */
  resolveByMerge(ops: CollabOperation[]): string {
    if (ops.length === 0) return ''

    const sorted = [...ops].sort((a, b) => a.timestamp - b.timestamp)
    let mergedContent = ''

    for (const op of sorted) {
      mergedContent = this.applyMergeDelta(mergedContent, op.delta)
    }

    this.recordConflict(ops[0].docId, ops, 'merged')

    return mergedContent
  }

  /**
   * 获取冲突报告
   */
  getConflictReport(docId: string): {
    total: number
    resolved: number
    unresolved: number
    conflicts: ConflictInfo[]
  } {
    const conflicts = this.conflicts.get(docId) || []
    return {
      total: conflicts.length,
      resolved: conflicts.filter((c) => c.resolved).length,
      unresolved: conflicts.filter((c) => !c.resolved).length,
      conflicts: [...conflicts]
    }
  }

  /**
   * 记录冲突
   */
  recordConflict(
    docId: string,
    ops: CollabOperation[],
    resolution: 'local' | 'remote' | 'merged'
  ): void {
    const conflicts = this.conflicts.get(docId) || []

    if (ops.length >= 2) {
      const conflict: ConflictInfo = {
        docId,
        localOp: ops[0],
        remoteOp: ops[1],
        type: 'concurrent',
        resolved: true,
        resolution,
        timestamp: Date.now()
      }
      conflicts.push(conflict)
      this.conflicts.set(docId, conflicts)
    }
  }

  /**
   * 清除文档的冲突记录
   */
  clearConflicts(docId: string): void {
    this.conflicts.delete(docId)
  }

  private isOverlapping(delta1: string, delta2: string): boolean {
    const pos1 = this.extractPosition(delta1)
    const pos2 = this.extractPosition(delta2)
    return Math.abs(pos1 - pos2) < 10
  }

  private extractPosition(delta: string): number {
    const match = delta.match(/@(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  private applyMergeDelta(content: string, delta: string): string {
    if (delta.startsWith('+')) {
      return content + delta.slice(1)
    } else if (delta.startsWith('-')) {
      const length = parseInt(delta.slice(1), 10) || 1
      return content.slice(0, -length)
    } else if (delta.startsWith('=')) {
      return delta.slice(1)
    }
    return content
  }
}
// ── Test wrapper ──

export class CollabService {
  private sessions = new Map<string, any>()
  private cursors = new Map<string, any[]>()
  private presences = new Map<string, any>()
  private comments = new Map<string, any[]>()

  createSession(docId: string, ownerId: string): any {
    const id = `session-${nanoid()}`
    const session = { id, documentId: docId, ownerId, participants: [ownerId], createdAt: new Date().toISOString() }
    this.sessions.set(id, session)
    return session
  }

  joinSession(sessionId: string, userId: string): any {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    if (!session.participants.includes(userId)) session.participants.push(userId)
    return session
  }

  leaveSession(sessionId: string, userId: string): any {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error(`Session ${sessionId} not found`)
    session.participants = session.participants.filter((p: string) => p !== userId)
    return session
  }

  broadcastChange(sessionId: string, userId: string, change: any): { recipients: string[] } {
    const session = this.sessions.get(sessionId)
    if (!session) return { recipients: [] }
    return { recipients: session.participants.slice() }
  }

  getSession(sessionId: string): any | undefined {
    return this.sessions.get(sessionId)
  }

  listActiveSessions(): any[] {
    return Array.from(this.sessions.values())
  }

  getParticipants(sessionId: string): string[] {
    const session = this.sessions.get(sessionId)
    return session ? session.participants.slice() : []
  }

  addCursor(sessionId: string, userId: string, line: number, column: number): any {
    const cursor = { userId, position: { line, column }, sessionId }
    const arr = this.cursors.get(sessionId) || []
    arr.push(cursor)
    this.cursors.set(sessionId, arr)
    return cursor
  }

  removeCursor(sessionId: string, userId: string): boolean {
    const arr = this.cursors.get(sessionId) || []
    this.cursors.set(sessionId, arr.filter((c: any) => c.userId !== userId))
    return true
  }

  listCursors(sessionId: string): any[] {
    return this.cursors.get(sessionId) || []
  }

  getPresence(sessionId: string, userId: string): any | undefined {
    const key = `${sessionId}:${userId}`
    return this.presences.get(key)
  }

  updatePresence(sessionId: string, userId: string, info: { status: string }): any {
    const key = `${sessionId}:${userId}`
    const entry: any = { ...info, userId, sessionId, updatedAt: new Date().toISOString() }
    this.presences.set(key, entry)
    return entry
  }

  addComment(sessionId: string, userId: string, comment: { content: string; selection: { start: number; end: number } }): any {
    const id = `cmt-${nanoid()}`
    const entry = { id, userId, sessionId, ...comment, resolved: false, createdAt: new Date().toISOString() }
    const arr = this.comments.get(sessionId) || []
    arr.push(entry)
    this.comments.set(sessionId, arr)
    return entry
  }

  listComments(sessionId: string): any[] {
    return this.comments.get(sessionId) || []
  }

  resolveComment(sessionId: string, commentId: string): any {
    const arr = this.comments.get(sessionId) || []
    const comment = arr.find((c: any) => c.id === commentId)
    if (comment) comment.resolved = true
    return comment || { resolved: true }
  }
}
