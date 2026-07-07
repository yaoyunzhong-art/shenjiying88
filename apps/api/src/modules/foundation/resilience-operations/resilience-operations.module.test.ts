import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { ResilienceOperationsModule } from './resilience-operations.module'
import { ResilienceOperationsController } from './resilience-operations.controller'
import { ResilienceOperationsService } from './resilience-operations.service'
import { CircuitBreaker } from './circuit-breaker'
import { TokenBucket } from './rate-limiter'
import { HeterogeneousChannelRouter } from './heterogeneous-router'

describe('ResilienceOperationsModule', () => {
  let moduleRef: TestingModule

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [ResilienceOperationsModule]
    })
      .overrideProvider(CircuitBreaker)
      .useFactory({ factory: () => new CircuitBreaker({ name: 'test-breaker' }) })
      .overrideProvider(TokenBucket)
      .useFactory({ factory: () => new TokenBucket({ capacity: 10, refillPerSecond: 2, name: 'test-bucket' }) })
      .overrideProvider(HeterogeneousChannelRouter)
      .useFactory({ factory: () => new HeterogeneousChannelRouter({ strategy: 'round_robin', channels: [] }) })
      .compile()

    assert.ok(moduleRef)
  })

  it('should provide ResilienceOperationsController', () => {
    const controller = moduleRef.get<ResilienceOperationsController>(ResilienceOperationsController)
    assert.ok(controller)
    assert.ok(controller instanceof ResilienceOperationsController)
  })

  it('should provide ResilienceOperationsService', () => {
    const service = moduleRef.get<ResilienceOperationsService>(ResilienceOperationsService)
    assert.ok(service)
    assert.ok(service instanceof ResilienceOperationsService)
  })

  it('should export ResilienceOperationsService for cross-module use', () => {
    const service = moduleRef.get<ResilienceOperationsService>(ResilienceOperationsService)
    assert.ok(service)
  })

  it('should compile and instantiate', () => {
    assert.ok(moduleRef)
  })
})
