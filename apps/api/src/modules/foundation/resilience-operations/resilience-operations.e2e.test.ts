import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
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

async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    controllers: [TestResilienceOperationsController],
    providers: [ResilienceOperationsService]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}

describe('Resilience Operations - E2E HTTP', () => {
  it('e2e: exposes observability, retry policies, and recovery plans', async () => {
    const app = await createTestApp()
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

  it('e2e: management-metadata contains exactly 4 governance entries', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/management-metadata')
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 4)
      const operations = payload.map((m: { operation: string }) => m.operation).sort()
      assert.deepEqual(operations, ['edge-replay.write', 'observability.read', 'recovery-plan.read', 'retry-policy.read'])
    } finally {
      await app.close()
    }
  })

  it('e2e: observability filter returns only healthy signals', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/foundation/resilience-operations/observability')
        .query({ status: 'healthy' })
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 1)
      assert.equal(payload[0].signal, 'metrics')
      assert.equal(payload[0].status, 'healthy')
    } finally {
      await app.close()
    }
  })

  it('e2e: observability without filter returns all 3 signals', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/observability')
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 3)
      const signalTypes = payload.map((s: { signal: string }) => s.signal).sort()
      assert.deepEqual(signalTypes, ['logs', 'metrics', 'traces'])
    } finally {
      await app.close()
    }
  })

  it('e2e: observability with non-matching status returns empty', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/foundation/resilience-operations/observability')
        .query({ status: 'critical' })
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(Array.isArray(payload), true)
      assert.equal(payload.length, 0)
    } finally {
      await app.close()
    }
  })

  it('e2e: retry policies filtered by capability', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/foundation/resilience-operations/retry-policies')
        .query({ capability: 'backup-restore' })
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 1)
      assert.equal(payload[0].key, 'backup-restore-validation')
    } finally {
      await app.close()
    }
  })

  it('e2e: retry policies filtered by non-existent capability returns empty', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/foundation/resilience-operations/retry-policies')
        .query({ capability: 'non-existent-capability' })
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 0)
    } finally {
      await app.close()
    }
  })

  it('e2e: retry policies without filter returns all 3', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/retry-policies')
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 3)
    } finally {
      await app.close()
    }
  })

  it('e2e: recovery plans filtered by status attention', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/foundation/resilience-operations/recovery-plans')
        .query({ status: 'attention' })
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 1)
      assert.equal(payload[0].resource, 'edge-sync-pipeline')
    } finally {
      await app.close()
    }
  })

  it('e2e: recovery plans filtered by status ready', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/foundation/resilience-operations/recovery-plans')
        .query({ status: 'ready' })
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 2)
    } finally {
      await app.close()
    }
  })

  it('e2e: recovery plans unfiltered returns all 3', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/recovery-plans')
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.length, 3)
    } finally {
      await app.close()
    }
  })

  it('e2e: describe recovery plan for existing resource returns plan details', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get(
        '/foundation/resilience-operations/recovery-plans/postgres-primary'
      )
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.plan.resource, 'postgres-primary')
      assert.equal(payload.plan.status, 'ready')
      assert.equal(payload.plan.rtoMinutes, 30)
    } finally {
      await app.close()
    }
  })

  it('e2e: describe recovery plan for non-existent resource returns attention status with null plan', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get(
        '/foundation/resilience-operations/recovery-plans/non-existent-resource'
      )
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.equal(payload.resource, 'non-existent-resource')
      assert.equal(payload.status, 'attention')
      assert.equal(payload.plan, null)
    } finally {
      await app.close()
    }
  })

  it('e2e: stage edge replay with minimal operation count', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).post('/foundation/resilience-operations/edge-replay/stage').send({
        storeId: 'store-sg-001',
        operationCount: 1
      })
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 201)
      assert.equal(payload.status, 'staged')
      assert.equal(payload.storeId, 'store-sg-001')
      assert.equal(payload.operationCount, 1)
    } finally {
      await app.close()
    }
  })

  it('e2e: stage edge replay with large operation count', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).post('/foundation/resilience-operations/edge-replay/stage').send({
        storeId: 'store-hk-001',
        operationCount: 5000
      })
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 201)
      assert.equal(payload.operationCount, 5000)
      assert.equal(payload.replayPipeline.length, 4)
    } finally {
      await app.close()
    }
  })

  it('e2e: overview contains generatedAt timestamp', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/overview')
      const payload = res.body.data ?? res.body
      assert.equal(res.statusCode, 200)
      assert.notEqual(payload.generatedAt, undefined)
      assert.equal(typeof payload.generatedAt, 'string')
    } finally {
      await app.close()
    }
  })

  it('e2e: overview has observability, retries, and recovery sections', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/overview')
      const payload = res.body.data ?? res.body
      assert.notEqual(payload.observability, undefined)
      assert.notEqual(payload.retries, undefined)
      assert.notEqual(payload.recovery, undefined)
    } finally {
      await app.close()
    }
  })

  it('e2e: overview observability has degraded signals count', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/overview')
      const payload = res.body.data ?? res.body
      assert.equal(payload.observability.degradedSignals, 2)
    } finally {
      await app.close()
    }
  })

  it('e2e: management metadata each entry has rbac field', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/management-metadata')
      const payload = res.body.data ?? res.body
      for (const entry of payload) {
        assert.notEqual(entry.rbac, undefined)
        assert.notEqual(entry.rbac.resource, undefined)
        assert.notEqual(entry.rbac.action, undefined)
        assert.equal(Array.isArray(entry.rbac.requiredRoles), true)
        assert.equal(Array.isArray(entry.rbac.requiredPermissions), true)
      }
    } finally {
      await app.close()
    }
  })

  it('e2e: edge replay returns expected pipeline steps', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).post('/foundation/resilience-operations/edge-replay/stage').send({
        storeId: 'store-test',
        operationCount: 100
      })
      const payload = res.body.data ?? res.body
      assert.deepEqual(payload.replayPipeline, ['local-queue', 'network-recovery', 'reconciliation', 'conflict-review'])
    } finally {
      await app.close()
    }
  })

  it('e2e: edge replay returns expected observability hooks', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).post('/foundation/resilience-operations/edge-replay/stage').send({
        storeId: 'store-hooks-test',
        operationCount: 50
      })
      const payload = res.body.data ?? res.body
      assert.deepEqual(payload.observabilityHooks, [
        'metrics:edge_sync_backlog',
        'logs:edge-replay',
        'traces:edge-sync-replay'
      ])
    } finally {
      await app.close()
    }
  })

  it('e2e: retry policies each have maxAttempts field', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/retry-policies')
      const payload = res.body.data ?? res.body
      for (const policy of payload) {
        assert.equal(typeof policy.maxAttempts, 'number')
        assert.ok(policy.maxAttempts > 0)
        assert.notEqual(policy.backoff, undefined)
        assert.notEqual(policy.recoveryAction, undefined)
      }
    } finally {
      await app.close()
    }
  })

  it('e2e: recovery plans each have RTO/RPO metrics', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/recovery-plans')
      const payload = res.body.data ?? res.body
      for (const plan of payload) {
        assert.equal(typeof plan.rtoMinutes, 'number')
        assert.equal(typeof plan.rpoMinutes, 'number')
        assert.ok(plan.rtoMinutes >= plan.rpoMinutes)
      }
    } finally {
      await app.close()
    }
  })

  it('e2e: observability signals have evidence arrays', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/observability')
      const payload = res.body.data ?? res.body
      for (const signal of payload) {
        assert.equal(Array.isArray(signal.evidence), true)
        assert.ok(signal.evidence.length > 0)
        assert.notEqual(signal.owner, undefined)
      }
    } finally {
      await app.close()
    }
  })

  it('e2e: overview recovery section shows attentionRequired count', async () => {
    const app = await createTestApp()
    try {
      const res = await request(app.getHttpServer()).get('/foundation/resilience-operations/overview')
      const payload = res.body.data ?? res.body
      assert.equal(payload.recovery.totalPlans, 3)
      assert.equal(payload.recovery.attentionRequired, 1)
    } finally {
      await app.close()
    }
  })
})
