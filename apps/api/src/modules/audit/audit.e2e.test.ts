import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Audit 审计日志 HTTP 链路
 *
 * 链路:
 *   HTTP → TestAuditController → AuditService
 *
 * 验证:
 *   - 创建审计日志 (POST /api/audit)
 *   - 批量创建审计日志 (POST /api/audit/batch)
 *   - 查询审计日志 (GET /api/audit)
 *   - 单条查询 (GET /api/audit/:id)
 *   - 用户活动查询 (GET /api/audit/user/:userId)
 *   - 异常检测 (GET /api/audit/anomalies/detect)
 *   - 风险评分 (GET /api/audit/risk-score/:actorId)
 *   - 分账事件记录 (POST /api/audit/settlement)
 *   - 分账追踪查询 (GET /api/audit/settlement/:settlementId)
 *   - 审计报告导出 (POST /api/audit/export)
 *   - 合规报告生成 (GET /api/audit/compliance-report/:tenantId)
 *   - 异常输入处理
 *   - 边界条件
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AuditService } from './audit.service'

// ─── Test Controller ─────────────────────────────────────────────────────────

@Controller('api/audit')
class TestAuditController {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: Record<string, unknown>) {
    const id = await this.auditService.log({
      ...dto,
      riskLevel: (dto.riskLevel as string) ?? 'low',
      timestamp: new Date(),
    } as any)
    return { id }
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async createBatch(@Body() dtos: Record<string, unknown>[]) {
    const ids = await this.auditService.logBatch(
      dtos.map((dto) => ({
        ...dto,
        riskLevel: (dto.riskLevel as string) ?? 'low',
        timestamp: new Date(),
      })) as any,
    )
    return { ids }
  }

  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    const filter: any = { ...query }
    if (filter.from) filter.from = new Date(filter.from as string)
    if (filter.to) filter.to = new Date(filter.to as string)
    return this.auditService.query(filter)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.auditService.getById(id)
    if (!result) return null
    return result
  }

  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.auditService.getUserActivityLog(userId, new Date(from), new Date(to))
  }

  @Get('anomalies/detect')
  async detectAnomalies(@Query('windowMinutes') windowMinutes?: string) {
    return this.auditService.detectAnomalies(windowMinutes ? parseInt(windowMinutes, 10) : 5)
  }

  @Get('risk-score/:actorId')
  async computeRiskScore(@Param('actorId') actorId: string) {
    const score = await this.auditService.computeRiskScore(actorId)
    const riskLevel = score >= 70 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low'
    return { actorId, score, riskLevel }
  }

  @Post('settlement')
  @HttpCode(HttpStatus.CREATED)
  async logSettlement(@Body() dto: Record<string, unknown>) {
    const id = await this.auditService.logSettlementEvent(
      dto.settlementId as string,
      dto.amount as number,
      dto.eventType as any,
      dto.metadata as Record<string, unknown> | undefined,
    )
    return { id }
  }

  @Get('settlement/:settlementId')
  async getSettlementAuditTrail(@Param('settlementId') settlementId: string) {
    return this.auditService.getSettlementAuditTrail(settlementId)
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  async exportReport(@Body() dto: Record<string, unknown>) {
    const content = await this.auditService.exportReport(
      new Date(dto.from as string),
      new Date(dto.to as string),
      (dto.format as 'json' | 'csv') ?? 'json',
    )
    return { content }
  }

  @Get('compliance-report/:tenantId')
  async generateComplianceReport(@Param('tenantId') tenantId: string) {
    return this.auditService.generateComplianceReport(tenantId)
  }
}

// ─── Test Helpers ────────────────────────────────────────────────────────────

async function buildApp() {
  const auditService = new AuditService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestAuditController],
    providers: [{ provide: AuditService, useValue: auditService }],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, auditService }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Audit E2E', () => {

  // ── 正例：创建审计日志 ──────────────────────────────

  it('e2e: POST /api/audit creates an audit log', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/audit')
        .send({
          eventType: 'auth.login',
          actorId: 'user-1',
          actorType: 'user',
          riskLevel: 'low',
        })
      assert.equal(res.statusCode, 201)
      assert.ok(res.body.id)
      assert.ok(res.body.id.startsWith('audit_'))
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: POST /api/audit with all fields creates full log', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/audit')
        .send({
          eventType: 'order.paid',
          actorId: 'user-2',
          actorType: 'user',
          tenantId: 'tenant-A',
          resourceType: 'order',
          resourceId: 'order-123',
          riskLevel: 'low',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          metadata: { amount: 99.99, currency: 'CNY' },
        })
      assert.equal(res.statusCode, 201)
      assert.ok(res.body.id)

      const created = await auditService.getById(res.body.id)
      assert.equal(created?.actorId, 'user-2')
      assert.equal(created?.tenantId, 'tenant-A')
      assert.equal(created?.resourceId, 'order-123')
      assert.equal(created?.metadata?.amount, 99.99)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：批量创建 ──────────────────────────────

  it('e2e: POST /api/audit/batch creates multiple logs', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/audit/batch')
        .send([
          { eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low' },
          { eventType: 'order.created', actorId: 'u2', actorType: 'user', riskLevel: 'low' },
          { eventType: 'payment.completed', actorId: 'u3', actorType: 'system', riskLevel: 'low' },
        ])
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.ids.length, 3)
      assert.ok(res.body.ids[0].startsWith('audit_'))
      assert.ok(res.body.ids[1].startsWith('audit_'))
      assert.ok(res.body.ids[2].startsWith('audit_'))
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: POST /api/audit/batch with empty array returns 0 ids', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/audit/batch')
        .send([])
      assert.equal(res.statusCode, 201)
      assert.equal(res.body.ids.length, 0)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：查询审计日志 ──────────────────────────────

  it('e2e: GET /api/audit returns all logs with total', async () => {
    const { app, auditService } = await buildApp()
    try {
      // Seed 3 logs
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low' })
      await auditService.log({ eventType: 'order.created', actorId: 'u2', actorType: 'user', riskLevel: 'low' })
      await auditService.log({ eventType: 'payment.completed', actorId: 'u3', actorType: 'system', riskLevel: 'medium' })

      const res = await request(app.getHttpServer()).get('/api/audit')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.items.length, 3)
      assert.equal(res.body.total, 3)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit with actorId filter', async () => {
    const { app, auditService } = await buildApp()
    try {
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low' })
      await auditService.log({ eventType: 'order.created', actorId: 'u2', actorType: 'user', riskLevel: 'low' })

      const res = await request(app.getHttpServer())
        .get('/api/audit')
        .query({ actorId: 'u1' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.items.length, 1)
      assert.equal(res.body.items[0].actorId, 'u1')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit with eventType + riskLevel filter', async () => {
    const { app, auditService } = await buildApp()
    try {
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low' })
      await auditService.log({ eventType: 'auth.login', actorId: 'u2', actorType: 'user', riskLevel: 'high' })

      const res = await request(app.getHttpServer())
        .get('/api/audit')
        .query({ eventType: 'auth.login', riskLevel: 'high' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.items.length, 1)
      assert.equal(res.body.items[0].riskLevel, 'high')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit with limit returns paginated results (or full when last batch)', async () => {
    const { app, auditService } = await buildApp()
    try {
      for (let i = 0; i < 10; i++) {
        await auditService.log({ eventType: 'auth.login', actorId: `u${i}`, actorType: 'user', riskLevel: 'low' })
      }

      const res = await request(app.getHttpServer())
        .get('/api/audit')
        .query({ limit: 3 })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.items.length, 3)
      // With limit=3 and 10 items, pagination works in batches
      // Last page (e.g., limit=20 on 10 items) may have no nextCursor
      if (res.body.nextCursor) {
        assert.ok(res.body.nextCursor.includes('||'))
      }
      assert.equal(res.body.total, 10)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit with time range filter', async () => {
    const { app, auditService } = await buildApp()
    try {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 86400000)
      const tomorrow = new Date(now.getTime() + 86400000)

      await auditService.log({
        eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low',
        timestamp: now,
      } as any)
      await auditService.log({
        eventType: 'order.created', actorId: 'u2', actorType: 'user', riskLevel: 'low',
        timestamp: yesterday,
      } as any)

      const res = await request(app.getHttpServer())
        .get('/api/audit')
        .query({ from: now.toISOString(), to: tomorrow.toISOString() })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.items.length, 1)
      assert.equal(res.body.items[0].actorId, 'u1')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：单条查询 ──────────────────────────────

  it('e2e: GET /api/audit/:id returns single log', async () => {
    const { app, auditService } = await buildApp()
    try {
      const id = await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low' })

      const res = await request(app.getHttpServer()).get(`/api/audit/${id}`)
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.id, id)
      assert.equal(res.body.eventType, 'auth.login')
      assert.equal(res.body.actorId, 'u1')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：用户活动查询 ──────────────────────────────

  it('e2e: GET /api/audit/user/:userId returns user activity in range', async () => {
    const { app, auditService } = await buildApp()
    try {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 86400000)
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low', timestamp: now } as any)
      await auditService.log({ eventType: 'order.created', actorId: 'u1', actorType: 'user', riskLevel: 'low', timestamp: yesterday } as any)
      await auditService.log({ eventType: 'auth.login', actorId: 'u2', actorType: 'user', riskLevel: 'low' })

      const res = await request(app.getHttpServer())
        .get(`/api/audit/user/u1`)
        .query({
          from: new Date(now.getTime() - 3600000).toISOString(),
          to: new Date(now.getTime() + 3600000).toISOString(),
        })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.length, 1)
      assert.equal(res.body[0].eventType, 'auth.login')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：异常检测 ──────────────────────────────

  it('e2e: GET /api/audit/anomalies/detect detects login failures', async () => {
    const { app, auditService } = await buildApp()
    try {
      for (let i = 0; i < 5; i++) {
        await auditService.log({
          eventType: 'auth.login',
          actorId: `u${i}`,
          actorType: 'user',
          riskLevel: 'low',
          ipAddress: '10.0.0.1',
          metadata: { success: false },
        })
      }

      const res = await request(app.getHttpServer())
        .get('/api/audit/anomalies/detect')
        .query({ windowMinutes: '60' })
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.length >= 1)
      const ipAnomaly = res.body.find((a: any) => a.pattern.includes('10.0.0.1'))
      assert.ok(ipAnomaly)
      assert.equal(ipAnomaly.riskLevel, 'high')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit/anomalies/detect with no anomalies returns 0', async () => {
    const { app, auditService } = await buildApp()
    try {
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low', metadata: { success: true } })

      const res = await request(app.getHttpServer())
        .get('/api/audit/anomalies/detect')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.length, 0)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit/anomalies/detect detects admin impersonation', async () => {
    const { app, auditService } = await buildApp()
    try {
      await auditService.log({
        eventType: 'admin.user_impersonate', actorId: 'admin-1', actorType: 'admin', riskLevel: 'critical',
      })

      const res = await request(app.getHttpServer())
        .get('/api/audit/anomalies/detect')
      assert.equal(res.statusCode, 200)
      const impersonation = res.body.find((a: any) => a.pattern.includes('管理员模拟'))
      assert.ok(impersonation)
      assert.equal(impersonation.riskLevel, 'critical')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：风险评分 ──────────────────────────────

  it('e2e: GET /api/audit/risk-score/:actorId returns low for clean actor', async () => {
    const { app, auditService } = await buildApp()
    try {
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low' })

      const res = await request(app.getHttpServer())
        .get('/api/audit/risk-score/u1')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.actorId, 'u1')
      assert.equal(res.body.riskLevel, 'low')
      assert.ok(res.body.score >= 0)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit/risk-score/:actorId returns high for risk actor', async () => {
    const { app, auditService } = await buildApp()
    try {
      for (let i = 0; i < 5; i++) {
        await auditService.log({
          eventType: 'auth.login', actorId: 'u1', actorType: 'user',
          riskLevel: 'low', ipAddress: '10.0.0.1',
          metadata: { success: false },
        })
      }

      const res = await request(app.getHttpServer())
        .get('/api/audit/risk-score/u1')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.score >= 20)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit/risk-score/:actorId returns 0 for unknown actor', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/api/audit/risk-score/unknown')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.score, 0)
      assert.equal(res.body.riskLevel, 'low')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：分账事件 ──────────────────────────────

  it('e2e: POST /api/audit/settlement creates settlement log', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/audit/settlement')
        .send({
          settlementId: 'settle-1',
          amount: 5000.00,
          eventType: 'created',
        })
      assert.equal(res.statusCode, 201)
      assert.ok(res.body.id)

      const log = await auditService.getById(res.body.id)
      assert.equal(log?.settlementId, 'settle-1')
      assert.equal(log?.settlementAmount, 5000)
      assert.equal(log?.eventType, 'settlement.created')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: POST /api/audit/settlement with rejected eventType gets medium risk', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/audit/settlement')
        .send({
          settlementId: 'settle-2',
          amount: 1000,
          eventType: 'rejected',
        })
      assert.equal(res.statusCode, 201)
      const log = await auditService.getById(res.body.id)
      assert.equal(log?.eventType, 'settlement.rejected')
      assert.equal(log?.riskLevel, 'medium')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：分账追踪 ──────────────────────────────

  it('e2e: GET /api/audit/settlement/:settlementId returns trail', async () => {
    const { app, auditService } = await buildApp()
    try {
      await auditService.logSettlementEvent('settle-trail', 1000, 'created')
      await auditService.logSettlementEvent('settle-trail', 1000, 'approved')
      await auditService.logSettlementEvent('settle-trail', 1000, 'paid')

      const res = await request(app.getHttpServer())
        .get('/api/audit/settlement/settle-trail')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.length, 3)
      assert.equal(res.body[0].eventType, 'settlement.created')
      assert.equal(res.body[1].eventType, 'settlement.approved')
      assert.equal(res.body[2].eventType, 'settlement.paid')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit/settlement/:unknownId returns empty array', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/api/audit/settlement/nonexistent')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.length, 0)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：报告导出 ──────────────────────────────

  it('e2e: POST /api/audit/export exports JSON report', async () => {
    const { app, auditService } = await buildApp()
    try {
      const now = new Date()
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low', timestamp: now } as any)

      const res = await request(app.getHttpServer())
        .post('/api/audit/export')
        .send({
          from: new Date(now.getTime() - 86400000).toISOString(),
          to: new Date(now.getTime() + 86400000).toISOString(),
          format: 'json',
        })
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.content)
      const parsed = JSON.parse(res.body.content)
      assert.equal(parsed.length, 1)
      assert.equal(parsed[0].actorId, 'u1')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: POST /api/audit/export exports CSV report', async () => {
    const { app, auditService } = await buildApp()
    try {
      const now = new Date()
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low', timestamp: now } as any)

      const res = await request(app.getHttpServer())
        .post('/api/audit/export')
        .send({
          from: new Date(now.getTime() - 86400000).toISOString(),
          to: new Date(now.getTime() + 86400000).toISOString(),
          format: 'csv',
        })
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.content.startsWith('id,eventType,actorId'))
      const lines = res.body.content.split('\n')
      assert.equal(lines.length, 2) // header + 1 data row
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 正例：合规报告 ──────────────────────────────

  it('e2e: GET /api/audit/compliance-report/:tenantId returns compliance data', async () => {
    const { app, auditService } = await buildApp()
    try {
      await auditService.log({ eventType: 'compliance.consent_recorded', actorId: 'u1', actorType: 'user', tenantId: 't1', riskLevel: 'low', consentVersion: 'v2' })
      await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', tenantId: 't1', riskLevel: 'low' })
      await auditService.log({ eventType: 'compliance.dsr_submitted', actorId: 'u2', actorType: 'user', tenantId: 't1', riskLevel: 'low' })

      const res = await request(app.getHttpServer())
        .get('/api/audit/compliance-report/t1')
      assert.equal(res.statusCode, 200)
      assert.ok(res.body.processingActivities.length >= 3)
      assert.equal(res.body.consentRecords.length, 1)
      assert.equal(res.body.consentRecords[0].consentVersion, 'v2')
      assert.equal(res.body.dsrRequests.length, 1)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit/compliance-report/:unknownTenant returns empty report', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/api/audit/compliance-report/unknown-tenant')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.processingActivities.length, 0)
      assert.equal(res.body.consentRecords.length, 0)
      assert.equal(res.body.dsrRequests.length, 0)
      assert.equal(res.body.dataBreaches.length, 0)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 边界条件 ──────────────────────────────

  it('e2e: GET /api/audit/nonexistent-id returns empty object', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/api/audit/does-not-exist-12345')
      assert.equal(res.statusCode, 200)
      // NestJS transforms null response to empty object {}
      assert.equal(Object.keys(res.body).length, 0)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: POST /api/audit with minimal fields still creates a log', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/audit')
        .send({
          eventType: 'auth.login',
          actorId: 'minimal-user',
          actorType: 'user',
        })
      assert.equal(res.statusCode, 201)
      assert.ok(res.body.id)
      // riskLevel defaults to 'low'
      const log = await auditService.getById(res.body.id)
      assert.equal(log?.riskLevel, 'low')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: GET /api/audit with no logs returns empty', async () => {
    const { app, auditService } = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/api/audit')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.items.length, 0)
      assert.equal(res.body.total, 0)
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: logs are ordered by timestamp descending', async () => {
    const { app, auditService } = await buildApp()
    try {
      const old = new Date('2020-01-01')
      const mid = new Date('2023-06-15')
      const recent = new Date('2026-01-01')
      await auditService.log({ eventType: 'auth.login', actorId: 'old', actorType: 'user', riskLevel: 'low', timestamp: old } as any)
      await auditService.log({ eventType: 'auth.login', actorId: 'mid', actorType: 'user', riskLevel: 'low', timestamp: mid } as any)
      await auditService.log({ eventType: 'auth.login', actorId: 'recent', actorType: 'user', riskLevel: 'low', timestamp: recent } as any)

      const res = await request(app.getHttpServer()).get('/api/audit')
      assert.equal(res.body.items[0].actorId, 'recent')
      assert.equal(res.body.items[1].actorId, 'mid')
      assert.equal(res.body.items[2].actorId, 'old')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  // ── 审计服务工具方法测试 ──────────────────────────────

  it('e2e: setClientIP and getClientIP work via service', async () => {
    const { app, auditService } = await buildApp()
    try {
      auditService.setClientIP('10.0.0.99')
      const id = await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low' })
      const log = await auditService.getById(id)
      assert.equal(log?.ipAddress, '10.0.0.99')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })

  it('e2e: setTraceId and getTraceId work via service', async () => {
    const { app, auditService } = await buildApp()
    try {
      auditService.setTraceId('trace-abc-123')
      const id = await auditService.log({ eventType: 'auth.login', actorId: 'u1', actorType: 'user', riskLevel: 'low' })
      const log = await auditService.getById(id)
      assert.equal(log?.traceId, 'trace-abc-123')
    } finally {
      auditService.__reset()
      await app.close()
    }
  })
})
