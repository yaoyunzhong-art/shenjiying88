import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { WorkbenchModule } from './workbench.module'
import { WorkbenchController } from './workbench.controller'
import { WorkbenchService } from './workbench.service'
import { FoundationService } from '../foundation/foundation.service'
import { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service'
import { MarketService } from '../market/market.service'
import { PortalService } from '../portal/portal.service'

const stubFoundationService = {
  getDependencySummary: (_module: string) => ({
    module: 'foundation',
    generatedAt: '2026-01-01',
    dependencies: [],
    contracts: [],
  }),
} as unknown as FoundationService

const stubMarketService = {
  getMergedProfile: () => ({
    locale: { supportedLanguages: ['zh-CN', 'en-US'] },
    marketCode: 'cn-mainland',
  }),
} as unknown as MarketService

const stubPortalService = {
  getBootstrap: () => ({
    storePortal: {},
    tenantPortal: {
      loginEntry: { loginPath: '/login', ssoEnabled: false },
    },
    brandPortal: {},
  }),
} as unknown as PortalService

const stubRuntimeGovernanceService = {
  submitAction: async () => ({ receiptCode: 'REC-001', state: 'submitted' }),
  getActionReceipt: async () => ({ receiptCode: 'REC-001', state: 'submitted' }),
  syncAction: async () => ({ receiptCode: 'REC-001', state: 'submitted' }),
  recordCallback: async () => ({ receiptCode: 'REC-001', state: 'callback-recorded' }),
  replayAction: async () => ({ receiptCode: 'REC-001', state: 'replay-scheduled' }),
} as unknown as RuntimeGovernanceService

describe('WorkbenchModule', () => {
  let moduleRef: TestingModule

  test('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [WorkbenchModule],
    })
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider(RuntimeGovernanceService)
      .useValue(stubRuntimeGovernanceService)
      .overrideProvider(MarketService)
      .useValue(stubMarketService)
      .overrideProvider(PortalService)
      .useValue(stubPortalService)
      .compile()

    assert.ok(moduleRef)
  })

  test('should provide WorkbenchController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [WorkbenchModule],
    })
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider(RuntimeGovernanceService)
      .useValue(stubRuntimeGovernanceService)
      .overrideProvider(MarketService)
      .useValue(stubMarketService)
      .overrideProvider(PortalService)
      .useValue(stubPortalService)
      .compile()

    const controller = moduleRef.get<WorkbenchController>(WorkbenchController)
    assert.ok(controller)
    assert.ok(controller instanceof WorkbenchController)
  })

  test('should provide WorkbenchService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [WorkbenchModule],
    })
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider(RuntimeGovernanceService)
      .useValue(stubRuntimeGovernanceService)
      .overrideProvider(MarketService)
      .useValue(stubMarketService)
      .overrideProvider(PortalService)
      .useValue(stubPortalService)
      .compile()

    const service = moduleRef.get<WorkbenchService>(WorkbenchService)
    assert.ok(service)
    assert.ok(service instanceof WorkbenchService)
  })
})
