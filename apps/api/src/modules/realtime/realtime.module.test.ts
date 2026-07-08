/**
 * Phase-T126: RealtimeModule 模块结构测试
 *
 * 验证模块可编译、依赖注入正确、所有 provider/controller 均正确注册。
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import { RealtimeModule } from './realtime.module'
import { RealtimeController } from './realtime.controller'
import { CollaborativeEditor, PresenceService, ConflictResolver, CollabService } from './collab.service'
import { CRDTDocument, WebSocketSessionManager, MultiDeviceSyncService } from './crdt.service'

describe('RealtimeModule', () => {
  it('should be defined', () => {
    assert.ok(RealtimeModule)
  })

  it('should compile the module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    assert.ok(moduleRef)
  })

  it('should provide RealtimeController', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    const controller = m.get<RealtimeController>(RealtimeController)
    assert.ok(controller)
    assert.ok(controller instanceof RealtimeController)
  })

  it('should provide CollaborativeEditor', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    const svc = m.get<CollaborativeEditor>(CollaborativeEditor)
    assert.ok(svc)
    assert.ok(svc instanceof CollaborativeEditor)
  })

  it('should provide PresenceService', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    const svc = m.get<PresenceService>(PresenceService)
    assert.ok(svc)
    assert.ok(svc instanceof PresenceService)
  })

  it('should provide ConflictResolver', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    const svc = m.get<ConflictResolver>(ConflictResolver)
    assert.ok(svc)
    assert.ok(svc instanceof ConflictResolver)
  })

  it('should provide CollabService', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    const svc = m.get<CollabService>(CollabService)
    assert.ok(svc)
    assert.ok(svc instanceof CollabService)
  })

  it('should provide CRDTDocument as value', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    const doc = m.get<CRDTDocument>(CRDTDocument)
    assert.ok(doc)
    assert.ok(doc instanceof CRDTDocument)
  })

  it('should provide WebSocketSessionManager as value', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    const mgr = m.get<WebSocketSessionManager>(WebSocketSessionManager)
    assert.ok(mgr)
    assert.ok(mgr instanceof WebSocketSessionManager)
  })

  it('should provide MultiDeviceSyncService via factory', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()
    const svc = m.get<MultiDeviceSyncService>(MultiDeviceSyncService)
    assert.ok(svc)
    assert.ok(svc instanceof MultiDeviceSyncService)
  })

  it('should wire controller with DI services (manual instantiation verification)', () => {
    const editor = new CollaborativeEditor()
    const presence = new PresenceService()
    const resolver = new ConflictResolver()
    const collab = new CollabService()
    const crdt = new CRDTDocument()
    const wsMgr = new WebSocketSessionManager()
    const sync = new MultiDeviceSyncService(crdt, wsMgr)

    const controller = new RealtimeController(
      editor, presence, resolver, collab, crdt, wsMgr, sync,
    )
    assert.ok(controller)
    assert.ok(controller instanceof RealtimeController)

    // 验证 health 端点可调用
    const health = controller.health()
    assert.ok(health)
    assert.equal(health.status, 'ok')
    assert.equal(health.module, 'realtime')
  })

  it('should export all providers for other modules to consume', async () => {
    const m = await Test.createTestingModule({
      imports: [RealtimeModule],
    }).compile()

    // 所有 exported provider 应可通过 DI 拿到
    const providers = [
      CollaborativeEditor,
      PresenceService,
      ConflictResolver,
      CollabService,
      CRDTDocument,
      WebSocketSessionManager,
      MultiDeviceSyncService,
    ]
    for (const prov of providers) {
      const instance = m.get(prov)
      assert.ok(instance, `Provider ${prov.name} should be resolvable`)
    }
  })
})
