import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { Body, Controller, Get, Inject, Param, Post, Query, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import {
  ObservabilityQueryDto,
  RecoveryPlanQueryDto,
  RetryPolicyQueryDto,
  StageEdgeReplayDto
} from './resilience-operations.dto'
import { ResilienceOperationsService } from './resilience-operations.service'

@Controller('foundation/resilience-operations')
class TestResilienceOperationsController {
  constructor(
    @Inject(ResilienceOperationsService)
    private readonly resilienceOperationsService: ResilienceOperationsService
  ) {}

  @Get('management-metadata')
  getManagementMetadata() {
    return this.resilienceOperationsService.getManagementMetadata()
  }

  @Get('overview')
  getOverview() {
    return this.resilienceOperationsService.getOperationsOverview()
  }

  @Get('observability')
  getObservability(@Query() query: ObservabilityQueryDto) {
    return this.resilienceOperationsService.getObservabilitySignals(query)
  }

  @Get('retry-policies')
  getRetryPolicies(@Query() query: RetryPolicyQueryDto) {
    return this.resilienceOperationsService.listRetryPolicies(query)
  }

  @Get('recovery-plans')
  getRecoveryPlans(@Query() query: RecoveryPlanQueryDto) {
    return this.resilienceOperationsService.listRecoveryPlans(query)
  }

  @Get('recovery-plans/:resource')
  getRecoveryPlan(@Param('resource') resource: string) {
    return this.resilienceOperationsService.describeRecoveryPlan(resource)
  }

  @Post('edge-replay/stage')
  stageEdgeReplay(@Body() body: StageEdgeReplayDto) {
    return this.resilienceOperationsService.stageEdgeReplay(body.storeId, body.operationCount)
  }
}

test('e2e: resilience operations exposes observability, retry policies, and recovery plans', async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestResilienceOperationsController],
    providers: [ResilienceOperationsService]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()

  try {
    const metadata = await request(app.getHttpServer()).get('/foundation/resilience-operations/management-metadata')
    const metadataPayload = metadata.body.data ?? metadata.body
    assert.equal(metadata.statusCode, 200)
    assert.equal(metadataPayload.length, 4)

    const overview = await request(app.getHttpServer()).get('/foundation/resilience-operations/overview')
    const overviewPayload = overview.body.data ?? overview.body
    assert.equal(overview.statusCode, 200)
    assert.equal(overviewPayload.observability.totalSignals >= 3, true)
    assert.equal(overviewPayload.retries.totalPolicies >= 3, true)
    assert.equal(overviewPayload.recovery.attentionRequired >= 1, true)

    const observability = await request(app.getHttpServer())
      .get('/foundation/resilience-operations/observability')
      .query({ status: 'warning' })
    const observabilityPayload = observability.body.data ?? observability.body
    assert.equal(observability.statusCode, 200)
    assert.equal(observabilityPayload.length >= 1, true)
    assert.equal(observabilityPayload.every((signal: { status: string }) => signal.status === 'warning'), true)

    const retryPolicies = await request(app.getHttpServer())
      .get('/foundation/resilience-operations/retry-policies')
      .query({ capability: 'edge-sync' })
    const retryPoliciesPayload = retryPolicies.body.data ?? retryPolicies.body
    assert.equal(retryPolicies.statusCode, 200)
    assert.equal(retryPoliciesPayload.length, 1)
    assert.equal(retryPoliciesPayload[0].key, 'edge-sync-retry')

    const recoveryPlans = await request(app.getHttpServer())
      .get('/foundation/resilience-operations/recovery-plans')
      .query({ status: 'attention' })
    const recoveryPlansPayload = recoveryPlans.body.data ?? recoveryPlans.body
    assert.equal(recoveryPlans.statusCode, 200)
    assert.equal(recoveryPlansPayload.length, 1)
    assert.equal(recoveryPlansPayload[0].resource, 'edge-sync-pipeline')

    const recoveryPlan = await request(app.getHttpServer()).get(
      '/foundation/resilience-operations/recovery-plans/edge-sync-pipeline'
    )
    const recoveryPlanPayload = recoveryPlan.body.data ?? recoveryPlan.body
    assert.equal(recoveryPlan.statusCode, 200)
    assert.equal(recoveryPlanPayload.plan.resource, 'edge-sync-pipeline')

    const replay = await request(app.getHttpServer()).post('/foundation/resilience-operations/edge-replay/stage').send({
      storeId: 'store-sh-001',
      operationCount: 12
    })
    const replayPayload = replay.body.data ?? replay.body
    assert.equal(replay.statusCode, 201)
    assert.equal(replayPayload.status, 'staged')
    assert.equal(replayPayload.retryPolicy.key, 'edge-sync-retry')
    assert.equal(replayPayload.recoveryPlan.resource, 'edge-sync-pipeline')
  } finally {
    await app.close()
  }
})
