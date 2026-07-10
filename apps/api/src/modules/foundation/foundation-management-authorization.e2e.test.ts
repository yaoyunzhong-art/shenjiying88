import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Get, Inject, Param, Post, ValidationPipe } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import type { NextFunction, Response } from 'express'
import request from 'supertest'
import { TenantContext } from '../tenant/tenant.decorator'
import { UpsertConfigEntryDto } from './configuration-governance/configuration-governance.dto'
import { IdentityAccessGuard } from './identity-access/identity-access.guard'
import {
  CurrentActor,
  RequirePermissions,
  RequireRoles,
  RequireTenantScope,
  type CurrentActorValue
} from './identity-access/identity-access.decorator'
import { IdentityAccessService } from './identity-access/identity-access.service'
import type { RequestActorContext, TenantAwareRequest } from '../tenant/tenant.types'
import { FoundationService } from './foundation.service'
import { ConfigurationGovernanceService } from './configuration-governance/configuration-governance.service'
import {
  RecordRuntimeGovernanceCallbackDto,
  ReplayRuntimeGovernanceActionDto,
  SubmitRuntimeGovernanceActionDto,
  SyncRuntimeGovernanceActionDto
} from './runtime-governance/runtime-governance.dto'
import { RuntimeGovernanceService } from './runtime-governance/runtime-governance.service'
import { ResetQuotaLedgerDto } from './trust-governance/trust-governance.dto'
import { TrustGovernanceService } from './trust-governance/trust-governance.service'

function attachRequestContext(req: TenantAwareRequest) {
  req.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-demo'
  }

  const actorId = req.header('x-actor-id') as string | undefined
  const rolesHeader = ((req.header('x-roles') as string | undefined) ?? '').split(',').map((item) => item.trim()).filter(Boolean)
  const permissionsHeader = ((req.header('x-permissions') as string | undefined) ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (actorId) {
    req.actorContext = {
      actorId,
      actorType: 'tenant-user',
      tenantId: req.tenantContext.tenantId,
      roles: rolesHeader,
      permissions: permissionsHeader,
      authenticated: true,
      source: 'headers'
    } satisfies RequestActorContext
  }
}

@Controller('foundation/configuration-governance')
@RequireTenantScope()
class TestAuthorizedConfigurationController {
  constructor(
    @Inject(ConfigurationGovernanceService)
    private readonly configurationGovernanceService: ConfigurationGovernanceService
  ) {}

  @Post('config-entries')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN')
  @RequirePermissions('foundation.config.write')
  saveConfigEntry(@Body() body: UpsertConfigEntryDto) {
    return this.configurationGovernanceService.saveConfigEntry(body)
  }
}

@Controller('foundation/trust-governance')
@RequireTenantScope()
class TestAuthorizedTrustController {
  constructor(
    @Inject(TrustGovernanceService)
    private readonly trustGovernanceService: TrustGovernanceService
  ) {}

  @Post('rate-limit/ledgers/reset')
  @RequireRoles('SUPER_ADMIN', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.quota-ledger.reset')
  reset(@Body() body: ResetQuotaLedgerDto) {
    return this.trustGovernanceService.resetQuotaLedgers(body)
  }
}

@Controller('foundation')
@RequireTenantScope()
class TestAuthorizedFoundationAlertsController {
  constructor(@Inject(FoundationService) private readonly foundationService: FoundationService) {}

  @Post('overview/alerts/:code/ack')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.operations.alerts.write')
  acknowledge(@Param('code') code: string, @Body() body: { note?: string }) {
    return this.foundationService.acknowledgeOperationsAlert(
      code,
      { tenantId: 'tenant-demo' },
      {
        actorId: 'ops-admin',
        actorType: 'tenant-user',
        tenantId: 'tenant-demo',
        roles: ['OPERATIONS'],
        permissions: ['foundation.operations.alerts.write'],
        authenticated: true,
        source: 'headers'
      },
      body.note
    )
  }

  @Post('overview/alerts/:code/mute')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.operations.alerts.write')
  mute(@Param('code') code: string, @Body() body: { mutedUntil?: string; note?: string }) {
    return this.foundationService.muteOperationsAlert(
      code,
      { tenantId: 'tenant-demo' },
      {
        actorId: 'ops-admin',
        actorType: 'tenant-user',
        tenantId: 'tenant-demo',
        roles: ['OPERATIONS'],
        permissions: ['foundation.operations.alerts.write'],
        authenticated: true,
        source: 'headers'
      },
      body
    )
  }

  @Post('overview/alerts/:code/unmute')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.operations.alerts.write')
  unmute(@Param('code') code: string, @Body() body: { note?: string }) {
    return this.foundationService.unmuteOperationsAlert(
      code,
      { tenantId: 'tenant-demo' },
      {
        actorId: 'ops-admin',
        actorType: 'tenant-user',
        tenantId: 'tenant-demo',
        roles: ['OPERATIONS'],
        permissions: ['foundation.operations.alerts.write'],
        authenticated: true,
        source: 'headers'
      },
      body.note
    )
  }
}

@Controller('foundation')
class TestFoundationOverviewController {
  constructor(@Inject(FoundationService) private readonly foundationService: FoundationService) {}

  @Get('overview')
  getOverview() {
    return this.foundationService.getOperationsOverview()
  }

  @Get('overview/alerts')
  getAlerts() {
    return this.foundationService.getOperationsAlerts()
  }

  @Get('overview/alerts/catalog')
  getAlertsCatalog() {
    return this.foundationService.getOperationsAlertsCatalog()
  }

  @Get('overview/alerts/:code/drilldown')
  getAlertDrilldown(@Param('code') code: string) {
    return this.foundationService.getOperationsAlertDrilldown(code)
  }

  @Get('overview/modules/:moduleKey')
  getModuleDetail(
    @Param('moduleKey') moduleKey: 'trust-governance' | 'configuration-governance' | 'resilience-operations' | 'runtime-governance'
  ) {
    return this.foundationService.getOperationsModuleDetail(moduleKey)
  }
}

@Controller('foundation/runtime-governance')
@RequireTenantScope()
class TestAuthorizedRuntimeGovernanceController {
  constructor(
    @Inject(RuntimeGovernanceService)
    private readonly runtimeGovernanceService: RuntimeGovernanceService
  ) {}

  @Post('actions')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.write')
  submitAction(
    @Body() body: SubmitRuntimeGovernanceActionDto,
    @TenantContext() tenantContext: { tenantId?: string; brandId?: string; storeId?: string; marketCode?: string } | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.submitAction({
      ...body,
      actorId: actorContext?.actorId,
      tenantId: tenantContext?.tenantId,
      brandId: tenantContext?.brandId,
      storeId: tenantContext?.storeId,
      marketCode: tenantContext?.marketCode
    })
  }

  @Get('actions/:receiptCode')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.read')
  getActionReceipt(@Param('receiptCode') receiptCode: string) {
    return this.runtimeGovernanceService.getActionReceipt(receiptCode)
  }

  @Post('actions/:receiptCode/sync')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.write')
  syncAction(
    @Param('receiptCode') receiptCode: string,
    @Body() body: SyncRuntimeGovernanceActionDto,
    @TenantContext() tenantContext: { tenantId?: string } | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.syncAction(receiptCode, {
      ...body,
      actorId: actorContext?.actorId,
      tenantId: tenantContext?.tenantId
    })
  }

  @Post('actions/:receiptCode/callback')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.write')
  recordCallback(
    @Param('receiptCode') receiptCode: string,
    @Body() body: RecordRuntimeGovernanceCallbackDto,
    @TenantContext() tenantContext: { tenantId?: string } | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.recordCallback(receiptCode, {
      ...body,
      actorId: actorContext?.actorId,
      tenantId: tenantContext?.tenantId
    })
  }

  @Post('actions/:receiptCode/replay')
  @RequireRoles('SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS', 'SECURITY_ADMIN')
  @RequirePermissions('foundation.runtime-governance.write')
  replayAction(
    @Param('receiptCode') receiptCode: string,
    @Body() body: ReplayRuntimeGovernanceActionDto,
    @TenantContext() tenantContext: { tenantId?: string } | undefined,
    @CurrentActor() actorContext: CurrentActorValue
  ) {
    return this.runtimeGovernanceService.replayAction(receiptCode, {
      ...body,
      actorId: actorContext?.actorId,
      tenantId: tenantContext?.tenantId
    })
  }
}

it('e2e: runtime governance endpoints enforce read/write permissions and tenant context', async () => {
  const runtimeCalls: Array<Record<string, unknown>> = []
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAuthorizedRuntimeGovernanceController],
    providers: [
      Reflector,
      IdentityAccessService,
      {
        provide: RuntimeGovernanceService,
        useValue: {
          submitAction: async (input: Record<string, unknown>) => {
            runtimeCalls.push({ kind: 'submit', input })
            return { status: 'submitted', input }
          },
          getActionReceipt: async (receiptCode: string) => {
            runtimeCalls.push({ kind: 'query', receiptCode })
            return { receiptCode, status: 'loaded' }
          },
          syncAction: async () => ({ status: 'synced' }),
          recordCallback: async () => ({ status: 'callback-recorded' }),
          replayAction: async () => ({ status: 'replay-scheduled' })
        }
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use((req: unknown, _res: Response, next: NextFunction) => {
    attachRequestContext(req as unknown as TenantAwareRequest)
    next()
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalGuards(new IdentityAccessGuard(app.get(Reflector), app.get(IdentityAccessService)))
  await app.init()

  try {
    const denied = await request(app.getHttpServer()).post('/foundation/runtime-governance/actions').send({
      app: 'miniapp',
      action: 'booking-submit',
      nextStep: 'PROCEED',
      riskLevel: 'medium',
      requestEndpoint: '/api/v1/storefront/bookings',
      payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
      payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
      recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
      handlerName: 'miniapp-booking-submit-handler',
      idempotencyKey: 'miniapp-sync:auth-001'
    })
    assert.equal(denied.statusCode, 401)

    const forbidden = await request(app.getHttpServer())
      .post('/foundation/runtime-governance/actions')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.runtime-governance.read')
      .send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'miniapp-sync:auth-001'
      })
    assert.equal(forbidden.statusCode, 403)

    const allowed = await request(app.getHttpServer())
      .post('/foundation/runtime-governance/actions')
      .set('x-tenant-id', 'tenant-runtime')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.runtime-governance.write')
      .send({
        app: 'miniapp',
        action: 'booking-submit',
        nextStep: 'PROCEED',
        riskLevel: 'medium',
        requestEndpoint: '/api/v1/storefront/bookings',
        payload: { bookingSlot: '2026-06-12T10:00:00+08:00' },
        payloadSummary: '{"bookingSlot":"2026-06-12T10:00:00+08:00"}',
        recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
        handlerName: 'miniapp-booking-submit-handler',
        idempotencyKey: 'miniapp-sync:auth-002'
      })
    const allowedPayload = allowed.body.data ?? allowed.body
    assert.equal(allowed.statusCode, 201)
    assert.equal(allowedPayload.status, 'submitted')
    assert.equal((allowedPayload.input as Record<string, unknown>).tenantId, 'tenant-runtime')
    assert.equal((allowedPayload.input as Record<string, unknown>).actorId, 'ops-admin')

    const queryForbidden = await request(app.getHttpServer())
      .get('/foundation/runtime-governance/actions/RECEIPT-001')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.runtime-governance.write')
    assert.equal(queryForbidden.statusCode, 403)

    const queryAllowed = await request(app.getHttpServer())
      .get('/foundation/runtime-governance/actions/RECEIPT-001')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.runtime-governance.read')
    const queryPayload = queryAllowed.body.data ?? queryAllowed.body
    assert.equal(queryAllowed.statusCode, 200)
    assert.equal(queryPayload.receiptCode, 'RECEIPT-001')
    assert.equal(runtimeCalls.some((item) => item.kind === 'query'), true)
  } finally {
    await app.close()
  }
})

it('e2e: configuration management endpoints enforce role and permission metadata', async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAuthorizedConfigurationController],
    providers: [
      Reflector,
      IdentityAccessService,
      {
        provide: ConfigurationGovernanceService,
        useValue: {
          saveConfigEntry: async () => ({ status: 'created' })
        }
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use((req: unknown, _res: Response, next: NextFunction) => {
    attachRequestContext(req as unknown as TenantAwareRequest)
    next()
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalGuards(new IdentityAccessGuard(app.get(Reflector), app.get(IdentityAccessService)))
  await app.init()

  try {
    const denied = await request(app.getHttpServer()).post('/foundation/configuration-governance/config-entries').send({
      namespace: 'checkout',
      key: 'paymentChannels',
      valueType: 'JSON',
      scopeType: 'TENANT',
      value: { channels: ['wechat-pay'] }
    })

    assert.equal(denied.statusCode, 401)

    const allowed = await request(app.getHttpServer())
      .post('/foundation/configuration-governance/config-entries')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'TENANT_ADMIN')
      .set('x-permissions', 'foundation.config.write')
      .send({
        namespace: 'checkout',
        key: 'paymentChannels',
        valueType: 'JSON',
        scopeType: 'TENANT',
        value: { channels: ['wechat-pay'] }
      })

    const payload = allowed.body.data ?? allowed.body
    assert.equal(allowed.statusCode, 201)
    assert.equal(payload.status, 'created')
  } finally {
    await app.close()
  }
})

it('e2e: trust governance management endpoints enforce role and permission metadata', async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAuthorizedTrustController],
    providers: [
      Reflector,
      IdentityAccessService,
      {
        provide: TrustGovernanceService,
        useValue: {
          resetQuotaLedgers: async () => ({ status: 'reset-bulk', count: 1, ledgers: [] })
        }
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use((req: unknown, _res: Response, next: NextFunction) => {
    attachRequestContext(req as unknown as TenantAwareRequest)
    next()
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalGuards(new IdentityAccessGuard(app.get(Reflector), app.get(IdentityAccessService)))
  await app.init()

  try {
    const denied = await request(app.getHttpServer())
      .post('/foundation/trust-governance/rate-limit/ledgers/reset')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'TENANT_ADMIN')
      .set('x-permissions', 'foundation.quota-ledger.reset')
      .send({ policyCode: 'login-ip', subjectKey: 'tenant-demo:login:127.0.0.1' })

    assert.equal(denied.statusCode, 403)

    const allowed = await request(app.getHttpServer())
      .post('/foundation/trust-governance/rate-limit/ledgers/reset')
      .set('x-actor-id', 'sec-admin')
      .set('x-roles', 'SECURITY_ADMIN')
      .set('x-permissions', 'foundation.quota-ledger.reset')
      .send({ policyCode: 'login-ip', subjectKey: 'tenant-demo:login:127.0.0.1' })

    const payload = allowed.body.data ?? allowed.body
    assert.equal(allowed.statusCode, 201)
    assert.equal(payload.status, 'reset-bulk')
  } finally {
    await app.close()
  }
})

it('e2e: foundation alert acknowledgement endpoints enforce role and permission metadata', async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAuthorizedFoundationAlertsController],
    providers: [
      Reflector,
      IdentityAccessService,
      {
        provide: FoundationService,
        useValue: {
          acknowledgeOperationsAlert: async () => ({ status: 'acked' }),
          muteOperationsAlert: async () => ({ status: 'muted' }),
          unmuteOperationsAlert: async () => ({ status: 'unmuted' })
        }
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use((req: unknown, _res: Response, next: NextFunction) => {
    attachRequestContext(req as unknown as TenantAwareRequest)
    next()
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalGuards(new IdentityAccessGuard(app.get(Reflector), app.get(IdentityAccessService)))
  await app.init()

  try {
    const denied = await request(app.getHttpServer()).post('/foundation/overview/alerts/approvals-pending/ack').send({ note: 'ops' })
    assert.equal(denied.statusCode, 401)

    const forbidden = await request(app.getHttpServer())
      .post('/foundation/overview/alerts/approvals-pending/ack')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.config.write')
      .send({ note: 'ops' })
    assert.equal(forbidden.statusCode, 403)

    const allowed = await request(app.getHttpServer())
      .post('/foundation/overview/alerts/approvals-pending/ack')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.operations.alerts.write')
      .send({ note: 'ops' })
    const payload = allowed.body.data ?? allowed.body
    assert.equal(allowed.statusCode, 201)
    assert.equal(payload.status, 'acked')

    const unmuted = await request(app.getHttpServer())
      .post('/foundation/overview/alerts/approvals-pending/unmute')
      .set('x-actor-id', 'ops-admin')
      .set('x-roles', 'OPERATIONS')
      .set('x-permissions', 'foundation.operations.alerts.write')
      .send({ note: 'restore visibility' })
    const unmutedPayload = unmuted.body.data ?? unmuted.body
    assert.equal(unmuted.statusCode, 201)
    assert.equal(unmutedPayload.status, 'unmuted')
  } finally {
    await app.close()
  }
})

it('e2e: foundation overview aggregates trust and configuration governance modules', async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestFoundationOverviewController],
    providers: [
      {
        provide: FoundationService,
        useValue: {
          getOperationsOverview: async () => ({
            generatedAt: new Date().toISOString(),
            summary: {
              approvalsPending: 2,
              approvalsWithFailures: 1,
              highRiskAudits: 1,
              blockedLedgers: 1,
              rotationDueSecrets: 1,
              expiredSecrets: 0,
              expiringCertificates: 1,
              expiredCertificates: 0,
              degradedSignals: 2,
              attentionRecoveryPlans: 1,
              staleDrills: 1,
              runtimeGovernanceBacklog: 2,
              stalledRuntimeCallbacks: 1,
              highRiskRuntimeBacklog: 1,
              runtimeBlockedActions: 1
            },
            alerts: [
              {
                severity: 'medium',
                code: 'approvals-pending',
                count: 2,
                summary: '存在待处理审批单'
              },
              {
                severity: 'high',
                code: 'runtime-callback-stalled',
                count: 1,
                summary: '存在等待 callback 回写的 runtime receipt'
              },
              {
                severity: 'medium',
                code: 'observability-degradation',
                count: 2,
                summary: '存在异常的 metrics/logs/traces 信号'
              }
            ],
            topFailures: [{ module: 'trust-governance', code: 'reset-bulk-failed', count: 1 }],
            topRisks: [
              {
                severity: 'medium',
                code: 'approvals-pending',
                count: 2,
                summary: '存在待处理审批单'
              },
              {
                severity: 'high',
                code: 'runtime-callback-stalled',
                count: 1,
                summary: '存在等待 callback 回写的 runtime receipt'
              }
            ],
            moduleHealth: {
              trustGovernance: { score: 82, status: 'warning' },
              configurationGovernance: { score: 91, status: 'healthy' },
              resilienceOperations: { score: 74, status: 'warning' },
              runtimeGovernance: { score: 63, status: 'warning' }
            },
            modules: {
              trustGovernance: { approvals: { total: 2 }, audits: { total: 1 } },
              configurationGovernance: { approvals: { total: 1 }, audits: { total: 1 } },
              resilienceOperations: { observability: { degradedSignals: 2 }, recovery: { attentionRequired: 1 } },
              runtimeGovernance: {
                summary: { backlog: 2, stalledCallbacks: 1, highRiskBacklog: 1, blockedActions: 1 },
                receipts: [{ receiptCode: 'RUNTIME-001' }]
              }
            }
          }),
          getOperationsAlerts: async () => ({
            generatedAt: new Date().toISOString(),
            alerts: [
              {
                severity: 'medium',
                code: 'approvals-pending',
                count: 2,
                summary: '存在待处理审批单'
              },
              {
                severity: 'medium',
                code: 'observability-degradation',
                count: 2,
                summary: '存在异常的 metrics/logs/traces 信号'
              },
              {
                severity: 'high',
                code: 'runtime-callback-stalled',
                count: 1,
                summary: '存在等待 callback 回写的 runtime receipt'
              }
            ],
            topRisks: [
              {
                severity: 'medium',
                code: 'approvals-pending',
                count: 2,
                summary: '存在待处理审批单'
              },
              {
                severity: 'high',
                code: 'runtime-callback-stalled',
                count: 1,
                summary: '存在等待 callback 回写的 runtime receipt'
              }
            ]
          }),
          getOperationsAlertsCatalog: async () => ({
            generatedAt: new Date().toISOString(),
            alerts: [
              {
                code: 'approvals-pending',
                defaultSummary: '存在待处理审批单',
                severityPolicy: '待处理审批单数量 >= 5 时为 high，否则为 medium',
                sourceModules: ['trust-governance', 'configuration-governance'],
                drilldownEnabled: true,
                acknowledgementEnabled: true,
                drilldownPath: '/foundation/overview/alerts/approvals-pending/drilldown',
                ackPath: '/foundation/overview/alerts/approvals-pending/ack',
                mutePath: '/foundation/overview/alerts/approvals-pending/mute',
                unmutePath: '/foundation/overview/alerts/approvals-pending/unmute'
              },
              {
                code: 'observability-degradation',
                defaultSummary: '存在异常的 metrics/logs/traces 信号',
                severityPolicy: 'critical 信号存在时为 high，否则为 medium',
                sourceModules: ['resilience-operations'],
                drilldownEnabled: true,
                acknowledgementEnabled: true,
                drilldownPath: '/foundation/overview/alerts/observability-degradation/drilldown',
                ackPath: '/foundation/overview/alerts/observability-degradation/ack',
                mutePath: '/foundation/overview/alerts/observability-degradation/mute',
                unmutePath: '/foundation/overview/alerts/observability-degradation/unmute'
              },
              {
                code: 'runtime-callback-stalled',
                defaultSummary: '存在等待 callback 回写的 runtime receipt',
                severityPolicy: '只要存在等待 callback 的 receipt 即为 high',
                sourceModules: ['runtime-governance'],
                drilldownEnabled: true,
                acknowledgementEnabled: true,
                drilldownPath: '/foundation/overview/alerts/runtime-callback-stalled/drilldown',
                ackPath: '/foundation/overview/alerts/runtime-callback-stalled/ack',
                mutePath: '/foundation/overview/alerts/runtime-callback-stalled/mute',
                unmutePath: '/foundation/overview/alerts/runtime-callback-stalled/unmute'
              }
            ]
          }),
          getOperationsAlertDrilldown: async (code: string) => ({
            generatedAt: new Date().toISOString(),
            code,
            alert: {
              severity: 'medium',
              code,
              count: 2,
              summary: '存在待处理审批单'
            },
            detail: {
              total: 2,
              receipts: [{ receiptCode: 'RUNTIME-001', callback: { callbackStatus: 'awaiting-callback' } }]
            }
          }),
          getOperationsModuleDetail: async (
            moduleKey: 'trust-governance' | 'configuration-governance' | 'resilience-operations' | 'runtime-governance'
          ) => ({
            generatedAt: new Date().toISOString(),
            moduleKey,
            health:
              moduleKey === 'trust-governance'
                ? { score: 82, status: 'warning' }
                : moduleKey === 'configuration-governance'
                  ? { score: 91, status: 'healthy' }
                  : moduleKey === 'resilience-operations'
                    ? { score: 74, status: 'warning' }
                    : { score: 63, status: 'warning' },
            detail:
              moduleKey === 'trust-governance'
                ? { approvals: { total: 2 } }
                : moduleKey === 'configuration-governance'
                  ? { approvals: { total: 1 } }
                  : moduleKey === 'resilience-operations'
                    ? { observability: { degradedSignals: 2 } }
                    : { summary: { backlog: 2 }, receipts: [{ receiptCode: 'RUNTIME-001' }] }
          })
        }
      }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()

  try {
    const overview = await request(app.getHttpServer()).get('/foundation/overview')
    const payload = overview.body.data ?? overview.body
    assert.equal(overview.statusCode, 200)
    assert.equal(payload.summary.approvalsPending, 2)
    assert.equal(payload.summary.rotationDueSecrets, 1)
    assert.equal(payload.summary.degradedSignals, 2)
    assert.equal(payload.summary.runtimeGovernanceBacklog, 2)
    assert.equal(payload.alerts[0].code, 'approvals-pending')
    assert.equal(payload.topFailures[0].code, 'reset-bulk-failed')
    assert.equal(payload.moduleHealth.trustGovernance.status, 'warning')
    assert.equal(payload.moduleHealth.runtimeGovernance.status, 'warning')
    assert.equal(payload.modules.trustGovernance.approvals.total, 2)
    assert.equal(payload.modules.resilienceOperations.observability.degradedSignals, 2)
    assert.equal(payload.modules.runtimeGovernance.summary.backlog, 2)

    const alerts = await request(app.getHttpServer()).get('/foundation/overview/alerts')
    const alertsPayload = alerts.body.data ?? alerts.body
    assert.equal(alerts.statusCode, 200)
    assert.equal(alertsPayload.alerts[0].code, 'approvals-pending')

    const catalog = await request(app.getHttpServer()).get('/foundation/overview/alerts/catalog')
    const catalogPayload = catalog.body.data ?? catalog.body
    assert.equal(catalog.statusCode, 200)
    assert.equal(catalogPayload.alerts[0].code, 'approvals-pending')
    assert.equal(catalogPayload.alerts.some((item: { code: string }) => item.code === 'runtime-callback-stalled'), true)

    const drilldown = await request(app.getHttpServer()).get('/foundation/overview/alerts/runtime-callback-stalled/drilldown')
    const drilldownPayload = drilldown.body.data ?? drilldown.body
    assert.equal(drilldown.statusCode, 200)
    assert.equal(drilldownPayload.code, 'runtime-callback-stalled')
    assert.equal(drilldownPayload.detail.total, 2)

    const moduleDetail = await request(app.getHttpServer()).get('/foundation/overview/modules/trust-governance')
    const moduleDetailPayload = moduleDetail.body.data ?? moduleDetail.body
    assert.equal(moduleDetail.statusCode, 200)
    assert.equal(moduleDetailPayload.moduleKey, 'trust-governance')
    assert.equal(moduleDetailPayload.health.status, 'warning')

    const resilienceModuleDetail = await request(app.getHttpServer()).get('/foundation/overview/modules/resilience-operations')
    const resilienceModuleDetailPayload = resilienceModuleDetail.body.data ?? resilienceModuleDetail.body
    assert.equal(resilienceModuleDetail.statusCode, 200)
    assert.equal(resilienceModuleDetailPayload.moduleKey, 'resilience-operations')
    assert.equal(resilienceModuleDetailPayload.health.status, 'warning')

    const runtimeModuleDetail = await request(app.getHttpServer()).get('/foundation/overview/modules/runtime-governance')
    const runtimeModuleDetailPayload = runtimeModuleDetail.body.data ?? runtimeModuleDetail.body
    assert.equal(runtimeModuleDetail.statusCode, 200)
    assert.equal(runtimeModuleDetailPayload.moduleKey, 'runtime-governance')
    assert.equal(runtimeModuleDetailPayload.health.status, 'warning')
  } finally {
    await app.close()
  }
})
