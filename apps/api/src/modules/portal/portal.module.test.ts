import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { PortalModule } from './portal.module'
import { PortalController } from './portal.controller'
import { PortalService } from './portal.service'
import { CircuitBreaker } from '../foundation/resilience-operations/circuit-breaker'
import { TokenBucket } from '../foundation/resilience-operations/rate-limiter'
import { HeterogeneousChannelRouter } from '../foundation/resilience-operations/heterogeneous-router'
import { OutboxRelay } from '../foundation/outbox/outbox.relay'
import { OutboxReplayService } from '../foundation/outbox/outbox-replay.service'
import { InMemoryOutboxStore } from '../foundation/outbox/in-memory-outbox.store'

const stubCircuitBreaker = {
  exec: async (fn: () => Promise<any>) => fn(),
  getState: () => 'CLOSED',
  getStats: () => ({ name: 'stub', state: 'CLOSED', consecutiveFailures: 0, consecutiveSuccesses: 0, totalCalls: 0, totalSuccesses: 0, totalFailures: 0, totalShortCircuited: 0, openedAt: null, lastFailureAt: null, lastError: null }),
  reset: () => {},
  forceOpen: () => {},
} as unknown as CircuitBreaker

const stubTokenBucket = {
  tryAcquire: () => true,
  consume: () => {},
  reset: () => {},
} as unknown as TokenBucket

const stubHeterogeneousChannelRouter = {
  route: async (req: any) => ({ channel: 'default', accepted: true }),
  registerChannel: () => {},
  unregisterChannel: () => {},
} as unknown as HeterogeneousChannelRouter

const stubOutboxRelay = {
  register: () => {},
  start: () => {},
  stop: () => {},
  getStats: () => ({}),
  replayNow: async (_id: string) => null,
  onApplicationBootstrap: () => {},
  onApplicationShutdown: () => {},
} as unknown as OutboxRelay

const stubOutboxReplayService = {
  list: async () => [],
  replay: async (_id: string) => ({ replayed: null, delivered: false }),
  replayMany: async (_ids: string[]) => [],
} as unknown as OutboxReplayService

const stubOutboxStore = {
  append: async () => ({}),
  claimBatch: async () => [],
  markDelivered: async () => {},
  markFailed: async () => {},
  moveToDeadLetter: async () => {},
  listDeadLetter: async () => [],
  getByIdempotencyKey: async () => null,
} as unknown as InMemoryOutboxStore

const stubConfigService = {
  get: () => ({}),
}

const stubMarketService = {
  getMergedProfile: () => ({
    marketCode: 'cn-mainland',
    locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
    timezone: { timezone: 'Asia/Shanghai' },
    currency: { currencyCode: 'CNY', symbol: '¥' },
    tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
    network: { networkRegion: 'MAINLAND_CHINA' },
    email: { provider: 'ALIYUN_DM', fromName: 'test', fromAddress: 'test@local', replyTo: 'test@local' },
  }),
  getOverrides: () => [],
}

const stubFoundationService = {
  getDependencySummary: () => ({}),
}

describe('PortalModule', () => {
  let moduleRef: TestingModule

  const buildModule = () =>
    Test.createTestingModule({
      imports: [PortalModule],
    })
      .overrideProvider('MarketService')
      .useValue(stubMarketService)
      .overrideProvider('FoundationService')
      .useValue(stubFoundationService)
      .overrideProvider(CircuitBreaker)
      .useValue(stubCircuitBreaker)
      .overrideProvider(TokenBucket)
      .useValue(stubTokenBucket)
      .overrideProvider(HeterogeneousChannelRouter)
      .useValue(stubHeterogeneousChannelRouter)
      .overrideProvider(OutboxRelay)
      .useValue(stubOutboxRelay)
      .overrideProvider(OutboxReplayService)
      .useValue(stubOutboxReplayService)
      .overrideProvider(InMemoryOutboxStore)
      .useValue(stubOutboxStore)
      .compile()

  it('should compile and instantiate', async () => {
    moduleRef = await buildModule()
    assert.ok(moduleRef)
  })

  it('should provide PortalController', async () => {
    moduleRef = await buildModule()
    const controller = moduleRef.get<PortalController>(PortalController)
    assert.ok(controller)
    assert.ok(controller instanceof PortalController)
  })

  it('should provide PortalService', async () => {
    moduleRef = await buildModule()
    const service = moduleRef.get<PortalService>(PortalService)
    assert.ok(service)
    assert.ok(service instanceof PortalService)
  })
})
