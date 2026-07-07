import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * E2E: Shared 共享模块 HTTP 链路
 *
 * 链路:
 *   HTTP → TestSharedController → AuditService, ViewModelService
 *
 * 测试覆盖:
 *   - 健康检查
 *   - 审计日志查询 (按租户 / 全部 / 单条)
 *   - 跨租户隔离
 *   - action 过滤 / limit 截断
 *   - 租户校验
 *   - 版本查询
 *
 * 注意: 响应经过 ResponseInterceptor 包装, 实际数据在 .data 中
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Post, Body, Query, Param, HttpCode, HttpStatus, Inject } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AuditService } from './audit.service'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import type { INestApplication } from '@nestjs/common'

/** 临时控制器: 代理真实 SharedController 的逻辑 */
@Controller('shared')
class TestSharedController {
  private readonly startedAt = Date.now()
  private readonly version = '1.0.0'

  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  getHealth() {
    return {
      status: 'healthy',
      uptimeMs: Date.now() - this.startedAt,
      auditLogCount: this.auditService.size(),
      version: this.version,
    }
  }

  @Get('audit')
  async getAuditLog(@Query() query: Record<string, string>) {
    const tenantId: string = query.tenantId ?? ''
    const entries = await this.auditService.getAuditLog(tenantId)

    let filtered = [...entries]
    if (query.action) {
      filtered = entries.filter((e: { action?: string }) => e.action === query.action)
    }
    if (query.limit) {
      const limit = Number.parseInt(query.limit, 10)
      if (limit > 0) filtered = filtered.slice(0, limit)
    }

    const dtos = filtered.map((e: any) => ({
      id: e.id, occurredAt: e.occurredAt, actor: e.actor,
      tenantId: e.tenantId, resource: e.resource, action: e.action, metadata: e.metadata,
    }))
    return { entries: dtos, total: entries.length }
  }

  @Get('audit/all')
  async getAllAuditLog() {
    const all = await this.auditService.getAllAuditLog()
    const dtos = all.map((e: any) => ({
      id: e.id, occurredAt: e.occurredAt, actor: e.actor,
      tenantId: e.tenantId, resource: e.resource, action: e.action, metadata: e.metadata,
    }))
    return { entries: dtos, total: all.length }
  }

  @Get('audit/:id')
  async getAuditEntry(@Param('id') id: string) {
    const entryId = Number(id)
    const all = await this.auditService.getAllAuditLog()
    const entry = all.find((e: { id: number }) => e.id === entryId)
    if (!entry) return { found: false, message: `Audit entry not found: ${id}` }
    return { found: true, entry }
  }

  @Post('validate-tenant')
  @HttpCode(HttpStatus.OK)
  validateTenant(@Body() body: { tenantId: string }) {
    if (body.tenantId && /^[a-zA-Z0-9_-]{3,64}$/.test(body.tenantId)) {
      return { valid: true, tenantId: body.tenantId }
    }
    return { valid: false, tenantId: body.tenantId ?? '', error: 'invalid_tenant_id' }
  }

  @Get('version')
  getVersion() {
    return { version: this.version, startedAt: new Date(this.startedAt).toISOString() }
  }
}

describe('Shared E2E', () => {
  let app: INestApplication
  let auditService: AuditService

  beforeEach(async () => {
    auditService = new AuditService()
    auditService.clear()
    const moduleRef = await Test.createTestingModule({
      controllers: [TestSharedController],
      providers: [
        { provide: AuditService, useValue: auditService },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalInterceptors(new ResponseInterceptor())
    await app.init()
  })

  it('GET /shared/health — 返回 200 + 健康状态', async () => {
    const res = await request(app.getHttpServer())
      .get('/shared/health')
      .expect(200)

    assert.equal(res.body.success, true)
    const data = res.body.data
    assert.equal(data.status, 'healthy')
    assert.equal(typeof data.uptimeMs, 'number')
    assert.equal(typeof data.auditLogCount, 'number')
    assert.equal(data.version, '1.0.0')
  })

  it('GET /shared/audit — 空日志返回空数组', async () => {
    const res = await request(app.getHttpServer())
      .get('/shared/audit?tenantId=t-001')
      .expect(200)

    const data = res.body.data
    assert.ok(Array.isArray(data.entries))
    assert.equal(data.entries.length, 0)
    assert.equal(data.total, 0)
  })

  it('GET /shared/audit — 有日志返回正确', async () => {
    await auditService.logCrossTenantAttempt({ actor: 'user-test', tenantId: 't-001', resource: 'agent:1' })

    const res = await request(app.getHttpServer())
      .get('/shared/audit?tenantId=t-001')
      .expect(200)

    const data = res.body.data
    assert.equal(data.entries.length, 1)
    assert.equal(data.total, 1)
    assert.equal(data.entries[0].actor, 'user-test')
    assert.equal(data.entries[0].tenantId, 't-001')
  })

  it('GET /shared/audit — 跨租户隔离', async () => {
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    await auditService.logCrossTenantAttempt({ actor: 'u2', tenantId: 't-002', resource: 'r2' })

    const res1 = await request(app.getHttpServer())
      .get('/shared/audit?tenantId=t-001')
      .expect(200)
    const res2 = await request(app.getHttpServer())
      .get('/shared/audit?tenantId=t-002')
      .expect(200)

    assert.equal(res1.body.data.entries.length, 1)
    assert.equal(res1.body.data.entries[0].actor, 'u1')
    assert.equal(res2.body.data.entries.length, 1)
    assert.equal(res2.body.data.entries[0].actor, 'u2')
  })

  it('GET /shared/audit — action 过滤', async () => {
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    await auditService.logCrossTenantAttempt({ actor: 'u2', tenantId: 't-001', resource: 'cfg:1', action: 'config_read' })

    const res = await request(app.getHttpServer())
      .get('/shared/audit?tenantId=t-001&action=config_read')
      .expect(200)

    const data = res.body.data
    assert.equal(data.entries.length, 1)
    assert.equal(data.entries[0].action, 'config_read')
  })

  it('GET /shared/audit — limit 截断', async () => {
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    await auditService.logCrossTenantAttempt({ actor: 'u2', tenantId: 't-001', resource: 'r2' })

    const res = await request(app.getHttpServer())
      .get('/shared/audit?tenantId=t-001&limit=1')
      .expect(200)

    const data = res.body.data
    assert.equal(data.entries.length, 1)
    assert.equal(data.total, 2)
  })

  it('GET /shared/audit/all — 查询全部日志', async () => {
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    await auditService.logCrossTenantAttempt({ actor: 'u2', tenantId: 't-002', resource: 'r2' })

    const res = await request(app.getHttpServer())
      .get('/shared/audit/all')
      .expect(200)

    const data = res.body.data
    assert.equal(data.entries.length, 2)
    assert.equal(data.total, 2)
  })

  it('GET /shared/audit/:id — 存在返回 found', async () => {
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })

    const res = await request(app.getHttpServer())
      .get('/shared/audit/1')
      .expect(200)

    const data = res.body.data
    assert.equal(data.found, true)
    assert.equal(data.entry.actor, 'u1')
  })

  it('GET /shared/audit/:id — 不存在返回 not found', async () => {
    const res = await request(app.getHttpServer())
      .get('/shared/audit/999')
      .expect(200)

    const data = res.body.data
    assert.equal(data.found, false)
    assert.ok(data.message.includes('not found'))
  })

  it('POST /shared/validate-tenant — 合法 tenantId', async () => {
    const res = await request(app.getHttpServer())
      .post('/shared/validate-tenant')
      .send({ tenantId: 'tenant-abc' })
      .expect(200)

    const data = res.body.data
    assert.equal(data.valid, true)
    assert.equal(data.tenantId, 'tenant-abc')
  })

  it('POST /shared/validate-tenant — 空 tenantId', async () => {
    const res = await request(app.getHttpServer())
      .post('/shared/validate-tenant')
      .send({ tenantId: '' })
      .expect(200)

    const data = res.body.data
    assert.equal(data.valid, false)
    assert.equal(typeof data.error, 'string')
  })

  it('GET /shared/version — 返回版本信息', async () => {
    const res = await request(app.getHttpServer())
      .get('/shared/version')
      .expect(200)

    const data = res.body.data
    assert.equal(typeof data.version, 'string')
    assert.equal(typeof data.startedAt, 'string')
    assert.equal(data.version, '1.0.0')
  })
})
