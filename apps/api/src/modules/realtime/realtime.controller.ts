/**
 * Phase-T126: Realtime 协同编辑 Controller
 *
 * REST 接口:
 *  POST   /realtime/collab/document          创建协作文档
 *  POST   /realtime/collab/invite            邀请协作者
 *  POST   /realtime/collab/update            更新文档内容
 *  GET    /realtime/collab/document/:docId   获取文档
 *  GET    /realtime/collab/operations/:docId 获取操作历史
 *
 *  POST   /realtime/crdt/create              创建 CRDT 文档
 *  POST   /realtime/crdt/apply               应用 CRDT 操作
 *  GET    /realtime/crdt/state/:docId        获取 CRDT 状态
 *  POST   /realtime/crdt/merge               合并远程文档
 *
 *  POST   /realtime/session/create           创建会话
 *  POST   /realtime/session/join             加入会话
 *  POST   /realtime/session/leave            离开会话
 *  GET    /realtime/session/:sessionId       获取会话
 *  GET    /realtime/session/list/:userId     获取用户活跃会话
 *
 *  POST   /realtime/presence/heartbeat       心跳
 *  POST   /realtime/presence/status          设置状态
 *  GET    /realtime/presence/online/:docId   获取在线用户
 *  POST   /realtime/presence/cursor          设置光标
 *
 *  POST   /realtime/conflict/detect          检测冲突
 *  POST   /realtime/conflict/resolve         解决冲突
 *  GET    /realtime/conflict/report/:docId   冲突报告
 *
 *  POST   /realtime/sync/to-device           同步到设备
 *  POST   /realtime/sync/resolve-conflict    解决设备冲突
 *  GET    /realtime/sync/status/:userId      同步状态
 *
 *  POST   /realtime/comment/add              添加评论
 *  GET    /realtime/comment/list/:sessionId  评论列表
 *  POST   /realtime/comment/resolve          解决评论
 *
 *  GET    /realtime/health                   健康检查
 */

import { Controller, Get, Post, Body, Param, Injectable } from '@nestjs/common'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService, type CRDTOperation, type CRDTDocumentState } from './crdt.service'
import type { RealtimeCollabOperation } from './realtime.entity'

@Controller('realtime')
@Injectable()
export class RealtimeController {
  constructor(
    private readonly collabEditor: CollaborativeEditor,
    private readonly presenceService: PresenceService,
    private readonly conflictResolver: ConflictResolver,
    private readonly collabService: CollabService,
    private readonly crdtDocument: CRDTDocument,
    private readonly wsManager: WebSocketSessionManager,
    private readonly syncService: MultiDeviceSyncService,
  ) {}

  // ─── Health ────────────────────────────────────────────────────────────────

  @Get('health')
  health() {
    return {
      status: 'ok',
      module: 'realtime',
      timestamp: new Date().toISOString(),
    }
  }

  // ─── CollaborativeEditor ─────────────────────────────────────────────────

  @Post('collab/document')
  createCollabDocument(@Body() body: { title: string; ownerId: string }) {
    const doc = this.collabEditor.createDocument(body.title, body.ownerId)
    return { success: true, data: doc }
  }

  @Post('collab/invite')
  inviteEditors(@Body() body: { docId: string; userIds: string[] }) {
    const doc = this.collabEditor.inviteEditors(body.docId, body.userIds)
    if (!doc) return { success: false, error: 'Document not found' }
    return { success: true, data: doc }
  }

  @Post('collab/update')
  updateContent(@Body() body: { docId: string; delta: string; userId: string }) {
    const result = this.collabEditor.updateContent(body.docId, body.delta, body.userId)
    if (!result) return { success: false, error: 'Update failed' }
    return { success: true, data: result }
  }

  @Get('collab/document/:docId')
  getCollabDocument(@Param('docId') docId: string) {
    const doc = this.collabEditor.getDocument(docId)
    if (!doc) return { success: false, error: 'Document not found' }
    return { success: true, data: doc }
  }

  @Get('collab/operations/:docId')
  getCollabOperations(@Param('docId') docId: string) {
    const ops = this.collabEditor.getOperations(docId)
    return { success: true, data: ops, total: ops.length }
  }

  // ─── CollabService ────────────────────────────────────────────────────────

  @Post('collab/session')
  createCollabSession(@Body() body: { docId: string; ownerId: string }) {
    const session = this.collabService.createSession(body.docId, body.ownerId)
    return { success: true, data: session }
  }

  @Post('collab/join')
  joinCollabSession(@Body() body: { sessionId: string; userId: string }) {
    try {
      const session = this.collabService.joinSession(body.sessionId, body.userId)
      return { success: true, data: session }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  @Post('collab/leave')
  leaveCollabSession(@Body() body: { sessionId: string; userId: string }) {
    return { success: true, data: this.collabService.leaveSession(body.sessionId, body.userId) }
  }

  @Post('collab/broadcast')
  broadcastChange(@Body() body: { sessionId: string; userId: string; change: unknown }) {
    return { success: true, data: this.collabService.broadcastChange(body.sessionId, body.userId, body.change) }
  }

  @Get('collab/participants/:sessionId')
  getParticipants(@Param('sessionId') sessionId: string) {
    return { success: true, data: this.collabService.getParticipants(sessionId) }
  }

  // ─── CRDT ─────────────────────────────────────────────────────────────────

  @Post('crdt/create')
  createCRDTDocument(@Body() body: { docId: string }) {
    const state = this.crdtDocument.createDocument(body.docId)
    return { success: true, data: state }
  }

  @Post('crdt/apply')
  applyCRDTOperation(@Body() body: { docId: string; operation: CRDTOperation }) {
    const state = this.crdtDocument.applyOperation(body.docId, body.operation)
    if (!state) return { success: false, error: 'Document not found or operation failed' }
    return { success: true, data: state }
  }

  @Get('crdt/state/:docId')
  getCRDTState(@Param('docId') docId: string) {
    const state = this.crdtDocument.getState(docId)
    if (!state) return { success: false, error: 'Document not found' }
    return { success: true, data: state }
  }

  @Post('crdt/merge')
  mergeCRDTDocument(@Body() body: { remoteDoc: CRDTDocumentState }) {
    const state = this.crdtDocument.merge(body.remoteDoc)
    if (!state) return { success: false, error: 'Merge failed' }
    return { success: true, data: state }
  }

  @Post('crdt/delete')
  deleteCRDTDocument(@Body() body: { docId: string }) {
    const deleted = this.crdtDocument.deleteDocument(body.docId)
    return { success: deleted }
  }

  // ─── WebSocket 会话管理 ──────────────────────────────────────────────────

  @Post('session/create')
  createWsSession(@Body() body: { docId: string; userId: string }) {
    const session = this.wsManager.createSession(body.docId, body.userId)
    return { success: true, data: session }
  }

  @Post('session/join')
  joinWsSession(@Body() body: { sessionId: string; userId: string }) {
    const session = this.wsManager.joinSession(body.sessionId, body.userId)
    if (!session) return { success: false, error: 'Session not found' }
    return { success: true, data: session }
  }

  @Post('session/leave')
  leaveWsSession(@Body() body: { sessionId: string; userId: string }) {
    const success = this.wsManager.leaveSession(body.sessionId, body.userId)
    return { success }
  }

  @Get('session/:sessionId')
  getWsSession(@Param('sessionId') sessionId: string) {
    const session = this.wsManager.getSession(sessionId)
    if (!session) return { success: false, error: 'Session not found' }
    return { success: true, data: session }
  }

  @Get('session/list/:userId')
  listActiveSessions(@Param('userId') userId: string) {
    const sessions = this.wsManager.getActiveSessions(userId)
    return { success: true, data: sessions, total: sessions.length }
  }

  @Get('session/all')
  listAllSessions() {
    const all = this.wsManager.getAllSessions()
    return { success: true, data: all, total: all.length }
  }

  // ─── 在线状态 ────────────────────────────────────────────────────────────

  @Post('presence/heartbeat')
  heartbeat(@Body() body: { userId: string; docId?: string }) {
    this.presenceService.heartbeat(body.userId, body.docId)
    return { success: true }
  }

  @Get('presence/online/:docId')
  getOnlineUsers(@Param('docId') docId: string) {
    const users = this.presenceService.getOnlineUsers(docId)
    return { success: true, data: users, total: users.length }
  }

  @Post('presence/status')
  setUserStatus(@Body() body: { userId: string; status: 'online' | 'away' | 'busy' }) {
    this.presenceService.setUserStatus(body.userId, body.status)
    return { success: true }
  }

  @Get('presence/last-active/:userId')
  getLastActive(@Param('userId') userId: string) {
    return { success: true, lastActive: this.presenceService.getLastActive(userId) }
  }

  @Post('presence/cursor')
  setCursor(@Body() body: { userId: string; docId: string; cursor: { line: number; column: number } }) {
    this.presenceService.setCursor(body.userId, body.docId, body.cursor)
    return { success: true }
  }

  @Post('presence/remove')
  removePresence(@Body() body: { userId: string }) {
    this.presenceService.removeUser(body.userId)
    return { success: true }
  }

  // ─── 冲突解决 ────────────────────────────────────────────────────────────

  @Post('conflict/detect')
  detectConflict(@Body() body: { localOp: RealtimeCollabOperation; remoteOp: RealtimeCollabOperation }) {
    const hasConflict = this.conflictResolver.detectConflict(body.localOp, body.remoteOp)
    return { success: true, hasConflict }
  }

  @Post('conflict/resolve/lww')
  resolveLWW(@Body() body: { ops: RealtimeCollabOperation[] }) {
    try {
      const winner = this.conflictResolver.resolveByLastWriteWins(body.ops)
      return { success: true, data: winner }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  @Post('conflict/resolve/merge')
  resolveMerge(@Body() body: { ops: RealtimeCollabOperation[] }) {
    const merged = this.conflictResolver.resolveByMerge(body.ops)
    return { success: true, data: merged }
  }

  @Get('conflict/report/:docId')
  getConflictReport(@Param('docId') docId: string) {
    return { success: true, data: this.conflictResolver.getConflictReport(docId) }
  }

  @Post('conflict/clear')
  clearConflicts(@Body() body: { docId: string }) {
    this.conflictResolver.clearConflicts(body.docId)
    return { success: true }
  }

  // ─── 多设备同步 ──────────────────────────────────────────────────────────

  @Post('sync/to-device')
  syncToDevice(@Body() body: { userId: string; deviceId: string; state: CRDTDocumentState }) {
    const deviceState = this.syncService.syncToDevice(body.userId, body.deviceId, body.state)
    return { success: true, data: deviceState }
  }

  @Post('sync/resolve-conflict')
  resolveDeviceConflict(@Body() body: { userId: string; deviceId1: string; deviceId2: string }) {
    const success = this.syncService.resolveDeviceConflict(body.userId, body.deviceId1, body.deviceId2)
    return { success }
  }

  @Get('sync/status/:userId')
  getSyncStatus(@Param('userId') userId: string) {
    const status = this.syncService.getSyncStatus(userId)
    if (!status) return { success: false, error: 'No sync status found' }
    return { success: true, data: status }
  }

  @Get('sync/pending/:userId/:deviceId')
  getPendingOps(@Param('userId') userId: string, @Param('deviceId') deviceId: string) {
    return { success: true, data: this.syncService.getPendingOps(userId, deviceId) }
  }

  @Post('sync/add-pending')
  addPendingOp(@Body() body: { userId: string; deviceId: string; op: CRDTOperation }) {
    this.syncService.addPendingOp(body.userId, body.deviceId, body.op)
    return { success: true }
  }

  // ─── Cursor 管理 ──────────────────────────────────────────────────────────

  @Post('collab/cursor/add')
  addCursor(@Body() body: { sessionId: string; userId: string; line: number; column: number }) {
    return { success: true, data: this.collabService.addCursor(body.sessionId, body.userId, body.line, body.column) }
  }

  @Post('collab/cursor/remove')
  removeCursor(@Body() body: { sessionId: string; userId: string }) {
    return { success: true, data: this.collabService.removeCursor(body.sessionId, body.userId) }
  }

  @Get('collab/cursor/:sessionId')
  listCursors(@Param('sessionId') sessionId: string) {
    return { success: true, data: this.collabService.listCursors(sessionId) }
  }

  // ─── 评论 ────────────────────────────────────────────────────────────────

  @Post('comment/add')
  addComment(@Body() body: { sessionId: string; userId: string; content: string; selection: { start: number; end: number } }) {
    const comment = this.collabService.addComment(body.sessionId, body.userId, { content: body.content, selection: body.selection })
    return { success: true, data: comment }
  }

  @Get('comment/list/:sessionId')
  listComments(@Param('sessionId') sessionId: string) {
    return { success: true, data: this.collabService.listComments(sessionId) }
  }

  @Post('comment/resolve')
  resolveComment(@Body() body: { sessionId: string; commentId: string }) {
    return { success: true, data: this.collabService.resolveComment(body.sessionId, body.commentId) }
  }
}
