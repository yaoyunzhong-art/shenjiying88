import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { MarketModule } from './market.module'
import { MarketController } from './market.controller'
import { MarketService } from './market.service'
import { FoundationService } from '../foundation/foundation.service'
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

const stubFoundationService = {
  getDependencySummary: (_module: string) => ({
    module: 'foundation',
    generatedAt: '2026-01-01',
    dependencies: [],
    contracts: []
  })
} as unknown as FoundationService

const stubPrismaService = {
  domainEvent: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
  governanceApproval: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
  featureFlag: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
  trustedAudit: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
  runtimePolicy: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
}

describe('MarketModule', () => {
  let moduleRef: TestingModule

  const buildModule = () =>
    Test.createTestingModule({
      imports: [MarketModule],
    })
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
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

  it('should provide MarketController', async () => {
    moduleRef = await buildModule()
    const controller = moduleRef.get<MarketController>(MarketController)
    assert.ok(controller)
    assert.ok(controller instanceof MarketController)
  })

  it('should provide MarketService', async () => {
    moduleRef = await buildModule()
    const service = moduleRef.get<MarketService>(MarketService)
    assert.ok(service)
    assert.ok(service instanceof MarketService)
  })
})
