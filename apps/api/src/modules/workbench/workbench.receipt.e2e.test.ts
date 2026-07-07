import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Workbench → EventBus → Notification 跨模块集成 (Phase-13 task 12)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test, type TestingModule } from '@nestjs/testing'
import { CacheModule, CACHE_SERVICE, InMemoryCacheService, type CacheService } from '../../infrastructure/cache/cache.module'
import {
  EventBusModule,
  EVENT_BUS_SERVICE,
  InMemoryEventBus,
  type EventBusService
} from '../../infrastructure/event-bus/event-bus.module'
import {
  NotificationService,
  NOTIFICATION_COMPLETED_EVENT,
  resetNotificationServiceTestState
} from '../notification/notification.service'
import {
  RECEIPT_COMPLETED_EVENT,
  WorkbenchService
} from './workbench.service'
import { FoundationService } from '../foundation/foundation.service'
import { MarketService } from '../market/market.service'
import { PortalService } from '../portal/portal.service'
import { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { NotificationChannelType, FoundationScopeType } from '../notification/notification.entity'
import type { CurrentActorValue } from '../foundation/identity-access/identity-access.decorator'

const mockTenantContext: RequestTenantContext = {
  tenantId: 't-wb',
  brandId: 'b-wb',
  storeId: 's-wb',
  marketCode: 'cn-mainland'
}

const mockActorContext = {
  actorId: 'actor-wb-001',
  actorType: 'admin',
  actorName: 'Workbench Admin',
  tenantId: 't-wb',
  roles: ['SUPER_ADMIN'],
  permissions: ['foundation.runtime-governance.execute'],
  authenticated: true,
  source: 'headers'
} as unknown as CurrentActorValue

function makeMockRuntimeGovernanceService() {
  return {
    submitAction: async () => ({
      receiptCode: `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      app: 'admin-web',
      action: 'unknown',
      state: 'accepted',
      nextStep: 'awaiting-sync',
      riskLevel: 'high',
      recommendedAction: 'execute',
      requestEndpoint: '/api/test',
      payloadSummary: '{}',
      ticket: { status: 'open' },
      sync: { ready: false },
      callback: { callbackStatus: 'awaiting-callback' },
      ledger: {},
      retry: { attempt: 0, maxAttempts: 3 },
      rateLimit: { allowed: true },
      events: [],
      generatedAt: new Date().toISOString()
    }),
    getActionReceipt: async () => ({}),
    syncAction: async () => ({}),
    recordCallback: async () => ({}),
    replayAction: async () => ({})
  } as unknown as RuntimeGovernanceService
}

async function buildWorkbenchApp(): Promise<{
  moduleRef: TestingModule
  workbench: WorkbenchService
  notification: NotificationService
  cache: InMemoryCacheService
  bus: InMemoryEventBus
}> {
  resetNotificationServiceTestState()

  const moduleRef = await Test.createTestingModule({
    imports: [CacheModule.forRootInMemory(), EventBusModule.forRootInMemory()],
    providers: [
      NotificationService,
      { provide: WorkbenchService, useFactory: (rg: RuntimeGovernanceService, ms: MarketService, ps: PortalService, fs: FoundationService, bus: EventBusService | undefined) =>
        new WorkbenchService(ms, ps, fs, rg, bus), inject: [RuntimeGovernanceService, MarketService, PortalService, FoundationService, { token: EVENT_BUS_SERVICE, optional: true }] },
      { provide: RuntimeGovernanceService, useValue: makeMockRuntimeGovernanceService() },
      { provide: FoundationService, useValue: { getDependencySummary: () => ({}) } as unknown as FoundationService },
      { provide: MarketService, useValue: { getMergedProfile: () => ({ locale: { supportedLanguages: ['zh-CN'] } }) } as unknown as MarketService },
      { provide: PortalService, useValue: { getBootstrap: () => ({ tenantPortal: { loginEntry: {} }, storePortal: {}, brandPortal: {} }) } as unknown as PortalService }
    ]
  }).compile()

  const workbench = moduleRef.get(WorkbenchService)
  const notification = moduleRef.get(NotificationService)
  const cache = moduleRef.get<CacheService>(CACHE_SERVICE) as InMemoryCacheService
  const bus = moduleRef.get<EventBusService>(EVENT_BUS_SERVICE) as InMemoryEventBus

  notification.onModuleInit()

  return { moduleRef, workbench, notification, cache, bus }
}

beforeEach(() => {
  resetNotificationServiceTestState()
})

it('e2e: WorkbenchService.submitApprovalExecution 后 publish ReceiptCompleted', async () => {
  const { moduleRef, workbench, bus } = await buildWorkbenchApp()
  try {
    const published: Array<{ event: string; payload: unknown }> = []
    bus.subscribe(RECEIPT_COMPLETED_EVENT, (payload) => {
      published.push({ event: RECEIPT_COMPLETED_EVENT, payload })
    })

    const receipt = await workbench.submitApprovalExecution(
      { approvalCode: 'ap-001', operatorNote: 'e2e test', idempotencyKey: 'idem-001' },
      mockTenantContext,
      mockActorContext
    )

    assert.ok(receipt.receiptCode)
    assert.equal(published.length, 1)
    const evt = published[0].payload as { receiptCode: string; tenantId?: string }
    assert.equal(evt.receiptCode, receipt.receiptCode)
    assert.equal(evt.tenantId, 't-wb')
  } finally {
    await moduleRef.close()
  }
})

it('e2e: submitSecretRotation 同样 publish ReceiptCompleted', async () => {
  const { moduleRef, workbench, bus } = await buildWorkbenchApp()
  try {
    const published: unknown[] = []
    bus.subscribe(RECEIPT_COMPLETED_EVENT, (payload) => {
      published.push(payload)
    })

    await workbench.submitSecretRotation(
      { secretName: 'jwt-signing-key', rotationReason: 'scheduled', idempotencyKey: 'idem-rot-001' },
      mockTenantContext,
      mockActorContext
    )

    assert.equal(published.length, 1)
  } finally {
    await moduleRef.close()
  }
})

it('e2e: submitRuntimeReplay 同样 publish ReceiptCompleted', async () => {
  const { moduleRef, workbench, bus } = await buildWorkbenchApp()
  try {
    const published: unknown[] = []
    bus.subscribe(RECEIPT_COMPLETED_EVENT, (payload) => {
      published.push(payload)
    })

    await workbench.submitRuntimeReplay(
      { sourceReceiptCode: 'rcpt-source', operatorNote: 'replay', idempotencyKey: 'idem-replay-001' },
      mockTenantContext,
      mockActorContext
    )

    assert.equal(published.length, 1)
  } finally {
    await moduleRef.close()
  }
})

it('e2e: WorkbenchService 无 EventBus 时不抛错', async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [CacheModule.forRootInMemory()],
    providers: [
      { provide: WorkbenchService, useFactory: (rg: RuntimeGovernanceService, ms: MarketService, ps: PortalService, fs: FoundationService) =>
        new WorkbenchService(ms, ps, fs, rg, undefined), inject: [RuntimeGovernanceService, MarketService, PortalService, FoundationService] },
      { provide: RuntimeGovernanceService, useValue: makeMockRuntimeGovernanceService() },
      { provide: FoundationService, useValue: {} as FoundationService },
      { provide: MarketService, useValue: {} as MarketService },
      { provide: PortalService, useValue: {} as PortalService }
    ]
  }).compile()

  try {
    const workbench = moduleRef.get(WorkbenchService)
    const receipt = await workbench.submitApprovalExecution(
      { approvalCode: 'ap-no-bus', operatorNote: 'no bus', idempotencyKey: 'idem-no-bus' },
      mockTenantContext,
      mockActorContext
    )
    assert.ok(receipt.receiptCode)
  } finally {
    await moduleRef.close()
  }
})

it('e2e: NotificationService 订阅 RECEIPT_COMPLETED 后自动派发', async () => {
  const { moduleRef, workbench, notification, bus } = await buildWorkbenchApp()
  try {
    notification.registerTemplate({
      code: 'receipt_done',
      channel: NotificationChannelType.Email,
      scopeType: FoundationScopeType.Tenant,
      tenantId: 't-wb',
      locale: 'zh-CN',
      bodyTemplate: 'Receipt {{receiptCode}} done'
    })

    bus.subscribe(RECEIPT_COMPLETED_EVENT, (payload) => {
      const evt = payload as { receiptCode: string; tenantId?: string; storeId?: string }
      notification.enqueue({
        templateCode: 'receipt_done',
        channel: NotificationChannelType.Email,
        scopeType: evt.storeId ? FoundationScopeType.Store : FoundationScopeType.Tenant,
        tenantId: evt.tenantId,
        storeId: evt.storeId,
        recipient: 'admin@example.com',
        payload: { receiptCode: evt.receiptCode }
      })
    })

    const completedIds: string[] = []
    bus.subscribe(NOTIFICATION_COMPLETED_EVENT, (payload) => {
      completedIds.push((payload as { id: string }).id)
    })

    await workbench.submitApprovalExecution(
      { approvalCode: 'ap-e2e', operatorNote: 'e2e', idempotencyKey: 'idem-e2e' },
      mockTenantContext,
      mockActorContext
    )

    assert.ok(completedIds.length >= 1, `Expected >=1, got ${completedIds.length}`)
  } finally {
    await moduleRef.close()
  }
})

it('e2e: WorkbenchService publish 失败不阻断主流程', async () => {
  const brokenBus: EventBusService = {
    backend: 'memory',
    publish: async () => { throw new Error('publish boom') },
    subscribe: () => {},
    ping: async () => true
  }

  const moduleRef = await Test.createTestingModule({
    imports: [CacheModule.forRootInMemory()],
    providers: [
      { provide: WorkbenchService, useFactory: (rg: RuntimeGovernanceService, ms: MarketService, ps: PortalService, fs: FoundationService, bus: EventBusService) =>
        new WorkbenchService(ms, ps, fs, rg, bus), inject: [RuntimeGovernanceService, MarketService, PortalService, FoundationService, EVENT_BUS_SERVICE] },
      { provide: RuntimeGovernanceService, useValue: makeMockRuntimeGovernanceService() },
      { provide: FoundationService, useValue: {} as FoundationService },
      { provide: MarketService, useValue: {} as MarketService },
      { provide: PortalService, useValue: {} as PortalService },
      { provide: EVENT_BUS_SERVICE, useValue: brokenBus }
    ]
  }).compile()

  try {
    const workbench = moduleRef.get(WorkbenchService)
    const receipt = await workbench.submitApprovalExecution(
      { approvalCode: 'ap-boom', operatorNote: 'boom', idempotencyKey: 'idem-boom' },
      mockTenantContext,
      mockActorContext
    )
    assert.ok(receipt.receiptCode)
  } finally {
    await moduleRef.close()
  }
})
