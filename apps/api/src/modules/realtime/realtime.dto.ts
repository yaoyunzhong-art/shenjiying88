/**
 * Phase-T126: Realtime 模块 DTO
 *
 * 涵盖: CRDT 操作 DTO / 会话 DTO / 同步 DTO / 协同编辑 DTO
 */
import type {
  OperationType,
  RealtimeCRDTOperation,
  RealtimeCollabOperation,
  PresenceStatus,
  RealtimeComment,
  RealtimeCollabDocument,
  RealtimeSession,
  RealtimeDeviceState,
  RealtimeSyncStatus,
  RealtimeCRDTDocumentState,
} from './realtime.entity'

// ─── CRDT 操作 DTO ──────────────────────────────────────────────────────────

export class CreateDocumentDto {
  docId!: string
}

export class ApplyOperationDto {
  docId!: string
  operation!: Omit<RealtimeCRDTOperation, 'id' | 'timestamp'>
}

export class MergeDocumentDto {
  remoteDoc!: RealtimeCRDTDocumentState
}

// ─── 协同编辑 DTO ───────────────────────────────────────────────────────────

export class CreateCollabDocumentDto {
  title!: string
  ownerId!: string
}

export class InviteEditorsDto {
  docId!: string
  userIds!: string[]
}

export class UpdateContentDto {
  docId!: string
  delta!: string
  userId!: string
}

// ─── 会话 DTO ────────────────────────────────────────────────────────────────

export class CreateSessionDto {
  docId!: string
  userId!: string
}

export class JoinSessionDto {
  sessionId!: string
  userId!: string
}

export class LeaveSessionDto {
  sessionId!: string
  userId!: string
}

export class BroadcastMessageDto {
  sessionId!: string
  message!: {
    type: 'operation' | 'join' | 'leave' | 'sync' | 'ack' | 'error'
    payload?: unknown
  }
  excludeUserId?: string
}

// ─── 在线状态 DTO ───────────────────────────────────────────────────────────

export class HeartbeatDto {
  userId!: string
  docId?: string
}

export class SetUserStatusDto {
  userId!: string
  status!: PresenceStatus
}

export class SetCursorDto {
  userId!: string
  docId!: string
  cursor!: { line: number; column: number }
}

// ─── 冲突解决 DTO ───────────────────────────────────────────────────────────

export class DetectConflictDto {
  localOp!: RealtimeCollabOperation
  remoteOp!: RealtimeCollabOperation
}

// ─── 多设备同步 DTO ─────────────────────────────────────────────────────────

export class SyncToDeviceDto {
  userId!: string
  deviceId!: string
  state!: RealtimeCRDTDocumentState
}

export class ResolveDeviceConflictDto {
  userId!: string
  deviceId1!: string
  deviceId2!: string
}

export class AddPendingOpDto {
  userId!: string
  deviceId!: string
  op!: RealtimeCRDTOperation
}

// ─── 评论 DTO ────────────────────────────────────────────────────────────────

export class AddCommentDto {
  sessionId!: string
  userId!: string
  comment!: {
    content: string
    selection: { start: number; end: number }
  }
}

// ─── 响应 DTO ────────────────────────────────────────────────────────────────

export class RealtimeDocumentResponse {
  success!: boolean
  data?: RealtimeCollabDocument | RealtimeCRDTDocumentState | RealtimeSession
  error?: string
}

export class RealtimeListResponse {
  success!: boolean
  data?: unknown[]
  total?: number
  error?: string
}
