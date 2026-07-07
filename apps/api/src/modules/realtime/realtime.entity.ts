/**
 * Phase-T126: Realtime 协同编辑实体定义
 *
 * 涵盖: CRDT 操作 / 文档状态 / WebSocket 会话 / 多设备同步 / 协同编辑 / 在线状态 / 冲突解决
 */

// ─── CRDT 实体 ───────────────────────────────────────────────────────────────

export type OperationType = 'insert' | 'delete' | 'append'

export interface RealtimeCRDTOperation {
  id: string
  type: OperationType
  position?: number
  content?: string
  timestamp: number
  clientId: string
  version: number
}

export interface RealtimeCRDTDocumentState {
  docId: string
  content: string
  operations: RealtimeCRDTOperation[]
  version: number
  lastModified: number
}

// ─── 协同编辑实体 ────────────────────────────────────────────────────────────

export type DeltaType = 'insert' | 'delete' | 'retain'

export interface RealtimeCollabOperation {
  id: string
  docId: string
  userId: string
  delta: string
  version: number
  timestamp: number
  type: DeltaType
}

export interface RealtimeCollabDocument {
  id: string
  title: string
  ownerId: string
  content: string
  version: number
  editors: string[]
  createdAt: number
  updatedAt: number
}

// ─── 在线状态 ────────────────────────────────────────────────────────────────

export type PresenceStatus = 'online' | 'away' | 'busy'

export interface RealtimePresence {
  userId: string
  docId: string
  status: PresenceStatus
  lastActive: number
  cursor?: { line: number; column: number }
}

// ─── 冲突 ────────────────────────────────────────────────────────────────────

export type ConflictResolutionType = 'local' | 'remote' | 'merged'

export interface RealtimeConflictInfo {
  docId: string
  localOp: RealtimeCollabOperation
  remoteOp: RealtimeCollabOperation
  type: 'concurrent' | 'overlapping'
  resolved: boolean
  resolution?: ConflictResolutionType
  timestamp: number
}

// ─── WebSocket 会话 ──────────────────────────────────────────────────────────

export interface RealtimeSession {
  sessionId: string
  docId: string
  users: string[]
  createdAt: number
  lastActivity: number
}

export interface RealtimeWebSocketMessage {
  type: 'operation' | 'join' | 'leave' | 'sync' | 'ack' | 'error'
  sessionId?: string
  userId?: string
  payload?: unknown
  timestamp: number
}

// ─── 多设备同步 ──────────────────────────────────────────────────────────────

export interface RealtimeDeviceState {
  deviceId: string
  userId: string
  lastSyncAt: number
  version: number
  pendingOps: RealtimeCRDTOperation[]
}

export interface RealtimeSyncStatus {
  userId: string
  devices: RealtimeDeviceState[]
  activeSessions: number
  pendingConflicts: number
}

// ─── 评论 ────────────────────────────────────────────────────────────────────

export interface RealtimeComment {
  id: string
  userId: string
  sessionId: string
  content: string
  selection: { start: number; end: number }
  resolved: boolean
  createdAt: string
}
