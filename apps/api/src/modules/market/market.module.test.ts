import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import { MarketModule } from './market.module'
import { MarketController } from './market.controller'
import { MarketService } from './market.service'
import { FoundationService } from '../foundation/foundation.service'

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

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MarketModule],
    })
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
      .compile()

    assert.ok(moduleRef)
  })

  it('should provide MarketController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MarketModule],
    })
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
      .compile()

    const controller = moduleRef.get<MarketController>(MarketController)
    assert.ok(controller)
    assert.ok(controller instanceof MarketController)
  })

  it('should provide MarketService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [MarketModule],
    })
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider('PrismaService')
      .useValue(stubPrismaService)
      .compile()

    const service = moduleRef.get<MarketService>(MarketService)
    assert.ok(service)
    assert.ok(service instanceof MarketService)
  })
})
