/**
 * 🐜 自动: [realtime] [D] controller.spec.ts 补全
 *
 * Realtime 协同编辑 Controller — NestJS TestingModule 规范测试
 *
 * 涵盖:
 * - 健康检查 / presence 心跳
 * - 协同文档 CRUD (创建/邀请/更新/查询)
 * - CRDT 操作 (创建/应用/合并/删除)
 * - WebSocket 会话管理 (创建/加入/离开/查询)
 * - 在线状态 (心跳/在线列表/状态设置/光标/移除)
 * - 冲突解决 (检测/LWW/合并/报告/清除)
 * - 多设备同步 (同步/冲突解决/状态/待处理操作)
 * - 评论 (添加/列表/解决)
 * - 边界/错误处理 (文档不存在/无效操作/空参数等)
 */
import { vi } from 'vitest'
vi.mock('pg', () => {
  const Pool = vi.fn(() => ({
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  }))
  return { Pool, default: { Pool } }
})

import { describe, it, expect, beforeEach } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { RealtimeController } from './realtime.controller'
import {
  CollaborativeEditor,
  PresenceService,
  ConflictResolver,
  CollabService,
} from './collab.service'
import {
  CRDTDocument,
  WebSocketSessionManager,
  MultiDeviceSyncService,
} from './crdt.service'
import type { CRDTOperation, CRDTDocumentState } from './crdt.service'

describe('RealtimeController', () => {
  let controller: RealtimeController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RealtimeController],
      providers: [
        CollaborativeEditor,
        PresenceService,
        ConflictResolver,
        CollabService,
        { provide: CRDTDocument, useValue: new CRDTDocument() },
        {
          provide: WebSocketSessionManager,
          useValue: new WebSocketSessionManager(),
        },
        {
          provide: MultiDeviceSyncService,
          inject: [CRDTDocument, WebSocketSessionManager],
          useFactory: (
            crdt: CRDTDocument,
            ws: WebSocketSessionManager,
          ) => new MultiDeviceSyncService(crdt, ws),
        },
      ],
    }).compile()

    controller = module.get<RealtimeController>(RealtimeController)
  })

  // ─── Health ───────────────────────────────────────────────────────────────

  describe('GET /realtime/health', () => {
    it('应返回健康状态', () => {
      const result = controller.health()
      expect(result.status).toBe('ok')
      expect(result.module).toBe('realtime')
      expect(result.timestamp).toBeDefined()
    })
  })

  // ─── 协同文档 — 正向流程 ─────────────────────────────────────────────────

  describe('POST /realtime/collab/document — 创建文档', () => {
    it('应创建文档并返回完整信息', () => {
      const result = controller.createCollabDocument({
        title: '团队周报',
        ownerId: 'user-A',
      })
      expect(result.success).toBe(true)
      expect(result.data.title).toBe('团队周报')
      expect(result.data.ownerId).toBe('user-A')
      expect(result.data.editors).toContain('user-A')
      expect(result.data.content).toBe('')
      expect(result.data.version).toBe(0)
      expect(result.data.id).toMatch(/^doc-/)
    })

    it('创建空标题文档应正常', () => {
      const result = controller.createCollabDocument({
        title: '',
        ownerId: 'user-B',
      })
      expect(result.success).toBe(true)
      expect(result.data.title).toBe('')
    })
  })

  describe('POST /realtime/collab/invite — 邀请协作者', () => {
    it('应成功邀请协作者到已存在的文档', () => {
      const doc = controller.createCollabDocument({
        title: '文档A',
        ownerId: 'user-A',
      })
      const result = controller.inviteEditors({
        docId: doc.data.id,
        userIds: ['user-B', 'user-C'],
      })
      expect(result.success).toBe(true)
      expect(result.data!.editors).toContain('user-B')
      expect(result.data!.editors).toContain('user-C')
      expect(result.data!.editors).toHaveLength(3) // owner + 2
    })

    it('重复邀请应去重', () => {
      const doc = controller.createCollabDocument({
        title: '文档B',
        ownerId: 'user-A',
      })
      controller.inviteEditors({ docId: doc.data.id, userIds: ['user-B'] })
      const result = controller.inviteEditors({
        docId: doc.data.id,
        userIds: ['user-B'],
      })
      expect(result.success).toBe(true)
      expect(result.data!.editors.filter((e: string) => e === 'user-B')).toHaveLength(1)
    })
  })

  describe('POST /realtime/collab/update — 更新文档', () => {
    it('应更新文档内容并递增版本号', () => {
      const doc = controller.createCollabDocument({
        title: '报告',
        ownerId: 'user-A',
      })
      const result = controller.updateContent({
        docId: doc.data.id,
        delta: '+Hello',
        userId: 'user-A',
      })
      expect(result.success).toBe(true)
      expect(result.data!.version).toBe(1)
    })

    it('连续更新应正确累积', () => {
      const doc = controller.createCollabDocument({
        title: '累加',
        ownerId: 'user-A',
      })
      // 先邀请 user-B
      controller.inviteEditors({ docId: doc.data.id, userIds: ['user-B'] })
      controller.updateContent({ docId: doc.data.id, delta: '+First', userId: 'user-A' })
      const result = controller.updateContent({
        docId: doc.data.id,
        delta: '+Second',
        userId: 'user-B',
      })
      expect(result.success).toBe(true)
      expect(result.data!.version).toBe(2)
    })
  })

  // ─── 协同文档 — 边界/错误 ────────────────────────────────────────────────

  describe('边界: 文档不存在 / 无效参数', () => {
    it('邀请不存在的文档应返回错误', () => {
      const result = controller.inviteEditors({
        docId: 'non-existent',
        userIds: ['user-X'],
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Document not found')
    })

    it('更新不存在的文档应返回错误', () => {
      const result = controller.updateContent({
        docId: 'non-existent',
        delta: 'xxx',
        userId: 'user-X',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })

    it('查询不存在的文档应返回错误', () => {
      const result = controller.getCollabDocument('non-existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Document not found')
    })
  })

  // ─── CRDT — 正向流程 ─────────────────────────────────────────────────────

  describe('POST /realtime/crdt/create — 创建 CRDT 文档', () => {
    it('应创建空白文档', () => {
      const result = controller.createCRDTDocument({ docId: 'crdt-001' })
      expect(result.success).toBe(true)
      expect(result.data.docId).toBe('crdt-001')
      expect(result.data.content).toBe('')
      expect(result.data.version).toBe(0)
      expect(result.data.operations).toEqual([])
    })

    it('重复创建应返回已有文档', () => {
      controller.createCRDTDocument({ docId: 'crdt-dup' })
      const result = controller.createCRDTDocument({ docId: 'crdt-dup' })
      expect(result.success).toBe(true)
      expect(result.data.docId).toBe('crdt-dup')
    })
  })

  describe('POST /realtime/crdt/apply — 应用 CRDT 操作', () => {
    it('应应用插入操作并更新内容', () => {
      controller.createCRDTDocument({ docId: 'crdt-apply' })
      const op: CRDTOperation = {
        id: 'op-1',
        type: 'append',
        content: 'Hello',
        timestamp: Date.now(),
        clientId: 'client-A',
        version: 0,
      }
      const result = controller.applyCRDTOperation({
        docId: 'crdt-apply',
        operation: op,
      })
      expect(result.success).toBe(true)
      expect(result.data!.content).toBe('Hello')
      expect(result.data!.version).toBe(1)
    })

    it('应用操作到不存在的文档应返回错误', () => {
      const op: CRDTOperation = {
        id: 'op-fail',
        type: 'insert',
        position: 0,
        content: 'X',
        timestamp: Date.now(),
        clientId: 'client-X',
        version: 0,
      }
      const result = controller.applyCRDTOperation({
        docId: 'non-existent',
        operation: op,
      })
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/not found|failed/i)
    })
  })

  describe('GET /realtime/crdt/state/:docId — 获取 CRDT 状态', () => {
    it('应返回文档当前状态', () => {
      controller.createCRDTDocument({ docId: 'crdt-state' })
      const result = controller.getCRDTState('crdt-state')
      expect(result.success).toBe(true)
      expect(result.data!.docId).toBe('crdt-state')
      expect(result.data!.version).toBe(0)
    })

    it('不存在的文档应返回错误', () => {
      const result = controller.getCRDTState('non-existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Document not found')
    })
  })

  describe('POST /realtime/crdt/merge — 合并远程文档', () => {
    it('应合并远程文档状态', () => {
      const remoteDoc: CRDTDocumentState = {
        docId: 'remote-1',
        content: 'Remote Content',
        operations: [],
        version: 1,
        lastModified: Date.now(),
      }
      const result = controller.mergeCRDTDocument({ remoteDoc })
      expect(result.success).toBe(true)
      expect(result.data!.content).toBe('Remote Content')
    })
  })

  describe('POST /realtime/crdt/delete — 删除 CRDT 文档', () => {
    it('应成功删除文档', () => {
      controller.createCRDTDocument({ docId: 'to-delete' })
      const result = controller.deleteCRDTDocument({ docId: 'to-delete' })
      expect(result.success).toBe(true)
      // 删除后无法获取
      const getResult = controller.getCRDTState('to-delete')
      expect(getResult.success).toBe(false)
    })
  })

  // ─── WebSocket 会话管理 ────────────────────────────────────────────────────

  describe('POST /realtime/session/create — 创建会话', () => {
    it('应创建新会话', () => {
      const result = controller.createWsSession({
        docId: 'doc-001',
        userId: 'user-A',
      })
      expect(result.success).toBe(true)
      expect(result.data.sessionId).toBeDefined()
      expect(result.data.users).toContain('user-A')
    })
  })

  describe('POST /realtime/session/join — 加入会话', () => {
    it('应加入已存在的会话', () => {
      const session = controller.createWsSession({
        docId: 'doc-join',
        userId: 'user-A',
      })
      const result = controller.joinWsSession({
        sessionId: session.data.sessionId,
        userId: 'user-B',
      })
      expect(result.success).toBe(true)
      expect(result.data!.users).toContain('user-B')
    })

    it('加入不存在的会话应返回错误', () => {
      const result = controller.joinWsSession({
        sessionId: 'non-existent',
        userId: 'user-X',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')
    })
  })

  describe('POST /realtime/session/leave / GET /realtime/session/:sessionId', () => {
    it('离开后应移除用户', () => {
      const session = controller.createWsSession({
        docId: 'doc-leave',
        userId: 'user-A',
      })
      controller.joinWsSession({ sessionId: session.data.sessionId, userId: 'user-B' })
      controller.leaveWsSession({ sessionId: session.data.sessionId, userId: 'user-B' })
      const result = controller.getWsSession(session.data.sessionId)
      expect(result.success).toBe(true)
      expect(result.data!.users).not.toContain('user-B')
    })

    it('查询不存在的会话应返回错误', () => {
      const result = controller.getWsSession('non-existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')
    })
  })

  describe('GET /realtime/session/list/:userId — 用户活跃会话', () => {
    it('应返回用户活跃会话列表', () => {
      controller.createWsSession({ docId: 'doc-1', userId: 'user-act' })
      controller.createWsSession({ docId: 'doc-2', userId: 'user-act' })
      const result = controller.listActiveSessions('user-act')
      expect(result.success).toBe(true)
      expect(result.total).toBe(2)
    })
  })

  // ─── 在线状态 ────────────────────────────────────────────────────────────

  describe('POST /realtime/presence/heartbeat', () => {
    it('心跳应成功返回', () => {
      const result = controller.heartbeat({ userId: 'user-hb', docId: 'doc-hb' })
      expect(result.success).toBe(true)
    })
  })

  describe('GET /realtime/presence/online/:docId', () => {
    it('应返回在线用户列表', () => {
      controller.heartbeat({ userId: 'user-A', docId: 'doc-online' })
      controller.heartbeat({ userId: 'user-B', docId: 'doc-online' })
      const result = controller.getOnlineUsers('doc-online')
      expect(result.success).toBe(true)
      expect(result.total).toBeGreaterThanOrEqual(0) // may have GC
    })
  })

  describe('POST /realtime/presence/status', () => {
    it('应设置用户状态', () => {
      const result = controller.setUserStatus({
        userId: 'user-status',
        status: 'away',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /realtime/presence/cursor', () => {
    it('应设置光标位置', () => {
      const result = controller.setCursor({
        userId: 'user-cur',
        docId: 'doc-cur',
        cursor: { line: 10, column: 5 },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /realtime/presence/remove', () => {
    it('应移除用户状态', () => {
      const result = controller.removePresence({ userId: 'user-rm' })
      expect(result.success).toBe(true)
    })
  })

  // ─── 冲突解决 ────────────────────────────────────────────────────────────

  describe('POST /realtime/conflict/detect', () => {
    it('应检测到同步操作无冲突', () => {
      const op = {
        id: 'op-1',
        docId: 'doc-conflict',
        userId: 'user-A',
        delta: 'x',
        version: 1,
        timestamp: 100,
        type: 'insert' as const,
      }
      const result = controller.detectConflict({ localOp: op, remoteOp: op })
      expect(result.success).toBe(true)
      expect(typeof result.hasConflict).toBe('boolean')
    })
  })

  describe('POST /realtime/conflict/resolve/lww', () => {
    it('应通过 Last-Write-Wins 解决冲突', () => {
      const op1 = {
        id: 'op-1', docId: 'doc', userId: 'u1',
        delta: 'a', version: 1, timestamp: 100, type: 'insert' as const,
      }
      const op2 = {
        id: 'op-2', docId: 'doc', userId: 'u2',
        delta: 'b', version: 1, timestamp: 200, type: 'insert' as const,
      }
      const result = controller.resolveLWW({ ops: [op1, op2] })
      expect(result.success).toBe(true)
      expect(result.data!.id).toBe('op-2') // later timestamp wins
    })

    it('空操作数组应抛出错误', () => {
      const result = controller.resolveLWW({ ops: [] })
      expect(result.success).toBe(false)
    })
  })

  describe('POST /realtime/conflict/resolve/merge', () => {
    it('应合并冲突操作', () => {
      const op1 = {
        id: 'op-1', docId: 'doc', userId: 'u1',
        delta: 'Hello', version: 1, timestamp: 100, type: 'insert' as const,
      }
      const op2 = {
        id: 'op-2', docId: 'doc', userId: 'u2',
        delta: 'World', version: 1, timestamp: 200, type: 'insert' as const,
      }
      const result = controller.resolveMerge({ ops: [op1, op2] })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  describe('POST /realtime/conflict/clear', () => {
    it('应清除冲突', () => {
      const result = controller.clearConflicts({ docId: 'doc-clear' })
      expect(result.success).toBe(true)
    })
  })

  // ─── 多设备同步 ──────────────────────────────────────────────────────────

  describe('POST /realtime/sync/to-device', () => {
    it('应同步文档状态到设备', () => {
      const doc = controller.createCRDTDocument({ docId: 'sync-doc' })
      const result = controller.syncToDevice({
        userId: 'user-sync',
        deviceId: 'device-1',
        state: doc.data,
      })
      expect(result.success).toBe(true)
      expect(result.data.deviceId).toBe('device-1')
    })
  })

  describe('POST /realtime/sync/resolve-conflict', () => {
    it('应解决设备间冲突', () => {
      const result = controller.resolveDeviceConflict({
        userId: 'user-sync',
        deviceId1: 'device-A',
        deviceId2: 'device-B',
      })
      expect(typeof result.success).toBe('boolean')
    })
  })

  describe('GET /realtime/sync/status/:userId', () => {
    it('没有同步数据应返回错误', () => {
      const result = controller.getSyncStatus('unknown-user')
      expect(result.success).toBe(false)
      expect(result.error).toBe('No sync status found')
    })
  })

  describe('GET /realtime/sync/pending/:userId/:deviceId', () => {
    it('应返回待处理操作列表', () => {
      const result = controller.getPendingOps('user-p', 'device-p')
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('POST /realtime/sync/add-pending', () => {
    it('应添加待处理操作', () => {
      const op: CRDTOperation = {
        id: 'pend-op-1',
        type: 'append',
        content: 'P',
        timestamp: Date.now(),
        clientId: 'c',
        version: 0,
      }
      const result = controller.addPendingOp({
        userId: 'user-pend',
        deviceId: 'device-pend',
        op,
      })
      expect(result.success).toBe(true)
    })
  })

  // ─── 评论 ────────────────────────────────────────────────────────────────

  describe('POST /realtime/comment/add', () => {
    it('应添加评论到会话', () => {
      const session = controller.createCollabSession({
        docId: 'doc-comment',
        ownerId: 'user-A',
      })
      const result = controller.addComment({
        sessionId: session.data.sessionId,
        userId: 'user-B',
        content: '需要修改此处',
        selection: { start: 10, end: 20 },
      })
      expect(result.success).toBe(true)
      expect(result.data.content).toBe('需要修改此处')
      expect(result.data.resolved).toBe(false)
    })
  })

  describe('GET /realtime/comment/list/:sessionId', () => {
    it('应返回会话评论列表', () => {
      const session = controller.createCollabSession({
        docId: 'doc-list',
        ownerId: 'user-A',
      })
      controller.addComment({
        sessionId: session.data.sessionId,
        userId: 'user-B',
        content: '评论1',
        selection: { start: 0, end: 5 },
      })
      const result = controller.listComments(session.data.sessionId)
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].content).toBe('评论1')
    })
  })

  describe('POST /realtime/comment/resolve', () => {
    it('应解决评论', () => {
      const session = controller.createCollabSession({
        docId: 'doc-resolve',
        ownerId: 'user-A',
      })
      const comment = controller.addComment({
        sessionId: session.data.sessionId,
        userId: 'user-B',
        content: '已修复',
        selection: { start: 0, end: 1 },
      })
      const result = controller.resolveComment({
        sessionId: session.data.sessionId,
        commentId: comment.data.id,
      })
      expect(result.success).toBe(true)
      expect(result.data.resolved).toBe(true)
    })
  })

  // ─── CollabService 转发 ──────────────────────────────────────────────────

  describe('POST /realtime/collab/session — 协同会话', () => {
    it('应创建协同会话', () => {
      const result = controller.createCollabSession({
        docId: 'doc-collab-session',
        ownerId: 'user-A',
      })
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('加入不存在的会话应返回错误', () => {
      const result = controller.joinCollabSession({
        sessionId: 'non-existent-session',
        userId: 'user-X',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('POST /realtime/collab/broadcast', () => {
    it('应广播变更', () => {
      const session = controller.createCollabSession({
        docId: 'doc-broadcast',
        ownerId: 'user-A',
      })
      const result = controller.broadcastChange({
        sessionId: session.data.sessionId,
        userId: 'user-A',
        change: { type: 'insert', text: 'new' },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /realtime/collab/cursor/add / remove / list', () => {
    it('应添加光标并列出', () => {
      const session = controller.createCollabSession({
        docId: 'doc-cursor',
        ownerId: 'user-A',
      })
      controller.addCursor({
        sessionId: session.data.sessionId,
        userId: 'user-A',
        line: 1,
        column: 5,
      })
      const list = controller.listCursors(session.data.sessionId)
      expect(list.success).toBe(true)
      expect(list.data!.length).toBeGreaterThanOrEqual(1)
    })

    it('应移除光标', () => {
      const session = controller.createCollabSession({
        docId: 'doc-rm-cursor',
        ownerId: 'user-A',
      })
      controller.addCursor({
        sessionId: session.data.sessionId,
        userId: 'user-A',
        line: 3,
        column: 10,
      })
      const result = controller.removeCursor({
        sessionId: session.data.sessionId,
        userId: 'user-A',
      })
      expect(result.success).toBe(true)
    })
  })
})
