import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import assert from 'node:assert/strict'
import { AuditLogEntity } from '../audit/audit.entity'
import { WorkbenchModule } from './workbench.module'
import { WorkbenchController } from './workbench.controller'
import { WorkbenchService } from './workbench.service'
import { FoundationService } from '../foundation/foundation.service'
import { RuntimeGovernanceService } from '../foundation/runtime-governance/runtime-governance.service'
import { MarketService } from '../market/market.service'
import { PortalService } from '../portal/portal.service'
import { TrustGovernanceService } from '../foundation/trust-governance/trust-governance.service'
import { IntegrationOrchestrationService } from '../foundation/integration-orchestration/integration-orchestration.service'
import { PrismaService } from '../../prisma/prisma.service'

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

const stubTrustGovernanceService = {
  evaluateTrust: async () => ({}),
  verifyToken: async () => ({}),
  signPayload: async () => ({}),
} as unknown as TrustGovernanceService

const stubIntegrationOrchestrationService = {
  receive: async () => ({}),
  registerHandler: () => {},
  invokeWebhook: async () => ({}),
} as unknown as IntegrationOrchestrationService

const stubPrismaService = {
  domainEvent: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
  governanceApproval: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
  featureFlag: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
  trustedAudit: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
  runtimePolicy: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
}

describe('WorkbenchModule', () => {
  let moduleRef: TestingModule

  it('should compile and instantiate', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [WorkbenchModule],
    })
      .overrideProvider(getRepositoryToken(AuditLogEntity))
      .useValue({})
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider(RuntimeGovernanceService)
      .useValue(stubRuntimeGovernanceService)
      .overrideProvider(MarketService)
      .useValue(stubMarketService)
      .overrideProvider(PortalService)
      .useValue(stubPortalService)
      .overrideProvider(TrustGovernanceService)
      .useValue(stubTrustGovernanceService)
      .overrideProvider(IntegrationOrchestrationService)
      .useValue(stubIntegrationOrchestrationService)
      .overrideProvider(PrismaService)
      .useValue(stubPrismaService)
      .compile()

    assert.ok(moduleRef)
  })

  it('should provide WorkbenchController', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [WorkbenchModule],
    })
      .overrideProvider(getRepositoryToken(AuditLogEntity))
      .useValue({})
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider(RuntimeGovernanceService)
      .useValue(stubRuntimeGovernanceService)
      .overrideProvider(MarketService)
      .useValue(stubMarketService)
      .overrideProvider(PortalService)
      .useValue(stubPortalService)
      .overrideProvider(TrustGovernanceService)
      .useValue(stubTrustGovernanceService)
      .overrideProvider(IntegrationOrchestrationService)
      .useValue(stubIntegrationOrchestrationService)
      .overrideProvider(PrismaService)
      .useValue(stubPrismaService)
      .compile()

    const controller = moduleRef.get<WorkbenchController>(WorkbenchController)
    assert.ok(controller)
    assert.ok(controller instanceof WorkbenchController)
  })

  it('should provide WorkbenchService', async () => {
    moduleRef = await Test.createTestingModule({
      imports: [WorkbenchModule],
    })
      .overrideProvider(getRepositoryToken(AuditLogEntity))
      .useValue({})
      .overrideProvider(FoundationService)
      .useValue(stubFoundationService)
      .overrideProvider(RuntimeGovernanceService)
      .useValue(stubRuntimeGovernanceService)
      .overrideProvider(MarketService)
      .useValue(stubMarketService)
      .overrideProvider(PortalService)
      .useValue(stubPortalService)
      .overrideProvider(TrustGovernanceService)
      .useValue(stubTrustGovernanceService)
      .overrideProvider(IntegrationOrchestrationService)
      .useValue(stubIntegrationOrchestrationService)
      .overrideProvider(PrismaService)
      .useValue(stubPrismaService)
      .compile()

    const service = moduleRef.get<WorkbenchService>(WorkbenchService)
    assert.ok(service)
    assert.ok(service instanceof WorkbenchService)
  })
})
