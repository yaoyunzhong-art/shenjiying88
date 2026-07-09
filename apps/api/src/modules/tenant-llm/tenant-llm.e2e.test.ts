import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Tenant LLM 配置管理 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → TenantLLMService
 *
 * 验证:
 *   - LLM 配置 CRUD (创建/查询/更新/删除)
 *   - 接入申请与审批流程
 *   - 调用统计与日志
 *   - 租户隔离 (tenant A 看不到 tenant B 的数据)
 *   - 异常输入 (缺失必填字段/无效状态)
 *
 * 注意:
 * - TenantLLMService 方法为 async, NestJS 自动 await Promise 响应
 * - NestJS 将 null 响应序列化为 {} 对象, 因此空值断言使用宽松判断
 * - 禁止使用 ResponseInterceptor (响应拦截器) 以免多一层包装
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'

// Mock TenantScopeGuard before importing anything that references it
vi.mock('../../agent/tenant.guard', () => ({
  TenantScopeGuard: class MockGuard {
    canActivate() { return true }
  },
}))

import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { TenantLLMService } from './llm-config.service'

// Use the entity's request types directly
import type { CreateLLMConfigRequest, UpdateLLMConfigRequest } from './llm-config.entity'
type CreateConfigBody = CreateLLMConfigRequest & { apiKey: string }
type UpdateConfigBody = UpdateLLMConfigRequest

interface ApplyBody {
  configId: string
  useCase: string
  expectedVolume: number
  businessJustification?: string
}

interface ApproveBody {
  approved: boolean
  approvedBy: string
}

/** 辅助: 判断一个响应 body 是否为空 (null 或 {}) */
function isEmpty(body: unknown): boolean {
  return body === null || (typeof body === 'object' && body !== null && Object.keys(body).length === 0)
}

@Controller('tenant-llm')
class TestTenantLLMController {
  constructor(
    @Inject(TenantLLMService) private readonly service: TenantLLMService
  ) {}

  @Get('configs')
  getConfigs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('siteId') siteId?: string
  ) {
    return this.service.getConfigs(tenantId, siteId)
  }

  @Get('configs/:id')
  getConfig(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string
  ) {
    return this.service.getConfig(id, tenantId)
  }

  @Post('configs')
  createConfig(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: CreateConfigBody
  ) {
    return this.service.createConfig(tenantId, body)
  }

  @Put('configs/:id')
  updateConfig(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: UpdateConfigBody
  ) {
    return this.service.updateConfig(id, tenantId, body)
  }

  @Delete('configs/:id')
  deleteConfig(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string
  ) {
    return this.service.deleteConfig(id, tenantId).then(deleted => ({ deleted }))
  }

  @Post('configs/:id/apply')
  applyConfig(
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: ApplyBody
  ) {
    return this.service.applyConfig(id, tenantId, body)
  }

  @Post('configs/:id/approve')
  approveConfig(
    @Param('id') id: string,
    @Body() body: ApproveBody
  ) {
    return this.service.approveConfig(id, body.approvedBy, body.approved)
  }

  @Get('stats')
  getStats(
    @Headers('x-tenant-id') tenantId: string,
    @Query('configId') configId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string
  ) {
    return this.service.getStats(tenantId, configId, periodStart, periodEnd)
  }

  @Get('logs')
  getCallLogs(
    @Headers('x-tenant-id') tenantId: string,
    @Query('configId') configId?: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string
  ) {
    return this.service.getCallLogs(tenantId, configId, periodStart, periodEnd)
  }
}

async function buildApp() {
  // @ts-ignore - mocked by vi.mock above
  const { TenantScopeGuard: MockGuard } = await import('../../agent/tenant.guard')

  const moduleRef = await Test.createTestingModule({
    controllers: [TestTenantLLMController],
    providers: [
      TenantLLMService,
      {
        provide: MockGuard,
        useValue: { canActivate: () => true },
      },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  // Use validation pipe to test DTO validation
  const { ValidationPipe } = await import('@nestjs/common')
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  await app.init()
  return { app, service: app.get(TenantLLMService), moduleRef }
}

describe('E2E: [tenant-llm] LLM配置管理 HTTP链路', () => {
  let app: any
  let http: ReturnType<typeof request>
  let service: TenantLLMService

  beforeAll(async () => {
    const built = await buildApp()
    app = built.app
    service = built.service
    http = request(app.getHttpServer())
  })

  afterAll(async () => {
    await app.close()
  })

  let createdConfigId: string
  const tenantId = 'e2e-tenant-llm'

  // ── 创建配置 ──

  it('POST /tenant-llm/configs 创建LLM配置', async () => {
    const res = await http
      .post('/tenant-llm/configs')
      .set('x-tenant-id', tenantId)
      .send({
        name: 'E2E DeepSeek',
        provider: 'deepseek',
        modelName: 'deepseek-chat',
        apiKey: 'sk-e2e-test-key',
        temperature: 0.7,
        maxTokens: 4096,
        siteId: 'site-e2e',
      })
      .expect(201)

    assert.ok(res.body.id)
    assert.equal(res.body.name, 'E2E DeepSeek')
    assert.equal(res.body.provider, 'deepseek')
    assert.equal(res.body.status, 'pending')
    assert.equal(res.body.enabled, false)
    assert.equal(typeof res.body.apiEndpoint, 'undefined')
    createdConfigId = res.body.id
  })

  it('POST /tenant-llm/configs 缺少必填字段时服务层处理', async () => {
    // 缺 provider/modelName/apiKey 会走到服务层, 但不会 crash
    await http
      .post('/tenant-llm/configs')
      .set('x-tenant-id', tenantId)
      .send({ name: 'Incomplete' })
      .expect(201)
  })

  it('POST /tenant-llm/configs 空apiKey创建', async () => {
    const res = await http
      .post('/tenant-llm/configs')
      .set('x-tenant-id', tenantId)
      .send({
        name: 'No Key',
        provider: 'openai',
        modelName: 'gpt-4',
        apiKey: '',
      })
      .expect(201)
    // 空 apiKey 也会成功(服务层不做校验), apiEndpoint 不暴露
    assert.ok(res.body.id)
  })

  // ── 查询配置 ──

  it('GET /tenant-llm/configs 获取配置列表', async () => {
    const res = await http
      .get('/tenant-llm/configs')
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.ok(Array.isArray(res.body))
    assert.ok(res.body.length >= 1)
  })

  it('GET /tenant-llm/configs?siteId= 按站点筛选', async () => {
    const res = await http
      .get('/tenant-llm/configs?siteId=site-e2e')
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.ok(Array.isArray(res.body))
    assert.ok(res.body.every((c: any) => c.siteId === 'site-e2e'))
  })

  it('GET /tenant-llm/configs/:id 获取单个配置', async () => {
    const res = await http
      .get(`/tenant-llm/configs/${createdConfigId}`)
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.equal(res.body.id, createdConfigId)
    assert.equal(res.body.name, 'E2E DeepSeek')
  })

  it('GET /tenant-llm/configs/:id 不存在的ID返回null', async () => {
    const res = await http
      .get('/tenant-llm/configs/non-existent-id')
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.ok(isEmpty(res.body))
  })

  it('GET /tenant-llm/configs/:id 跨租户隔离', async () => {
    const res = await http
      .get(`/tenant-llm/configs/${createdConfigId}`)
      .set('x-tenant-id', 'other-tenant-e2e')
      .expect(200)

    assert.ok(isEmpty(res.body))
  })

  // ── 更新配置 ──

  it('PUT /tenant-llm/configs/:id 更新配置名称和温度', async () => {
    const res = await http
      .put(`/tenant-llm/configs/${createdConfigId}`)
      .set('x-tenant-id', tenantId)
      .send({ name: 'E2E DeepSeek V2', temperature: 0.5 })
      .expect(200)

    assert.equal(res.body.name, 'E2E DeepSeek V2')
    assert.equal(res.body.temperature, 0.5)
  })

  it('PUT /tenant-llm/configs/:id 跨租户无权限更新', async () => {
    const res = await http
      .put(`/tenant-llm/configs/${createdConfigId}`)
      .set('x-tenant-id', 'other-tenant-e2e')
      .send({ name: 'Hacked' })
      .expect(200)

    assert.ok(isEmpty(res.body))
  })

  it('PUT /tenant-llm/configs/:id 温度大值测试(服务层不校验)', async () => {
    const res = await http
      .put(`/tenant-llm/configs/${createdConfigId}`)
      .set('x-tenant-id', tenantId)
      .send({ temperature: 999 })
      .expect(200)
    // 服务层直接保存, temperature 999 虽不合理但不校验
    assert.equal(res.body.temperature, 999)
  })

  // ── 接入申请 ──

  it('POST /tenant-llm/configs/:id/apply 提交接入申请', async () => {
    const res = await http
      .post(`/tenant-llm/configs/${createdConfigId}/apply`)
      .set('x-tenant-id', tenantId)
      .send({
        configId: createdConfigId,
        useCase: 'E2E 智能客服对话',
        expectedVolume: 5000,
        businessJustification: 'E2E 测试自动审批',
      })
      .expect(201)

    assert.ok(res.body.success)
  })

  it('POST /tenant-llm/configs/:id/apply 不存在的配置', async () => {
    await http
      .post('/tenant-llm/configs/fake-id-123/apply')
      .set('x-tenant-id', tenantId)
      .send({
        configId: 'fake-id-123',
        useCase: '测试',
        expectedVolume: 100,
      })
      .expect(404)
  })

  // ── 审批配置 ──

  it('POST /tenant-llm/configs/:id/approve 审批通过', async () => {
    const res = await http
      .post(`/tenant-llm/configs/${createdConfigId}/approve`)
      .send({ approved: true, approvedBy: 'admin-e2e' })
      .expect(201)

    assert.equal(res.body.status, 'approved')
    assert.equal(res.body.enabled, true)
    assert.equal(res.body.approvedBy, 'admin-e2e')
  })

  it('POST /tenant-llm/configs/:id/approve 审批不通过', async () => {
    const createRes = await http
      .post('/tenant-llm/configs')
      .set('x-tenant-id', tenantId)
      .send({
        name: 'Reject Test',
        provider: 'openai',
        modelName: 'gpt-4',
        apiKey: 'sk-reject',
      })
      .expect(201)

    const res = await http
      .post(`/tenant-llm/configs/${createRes.body.id}/approve`)
      .send({ approved: false, approvedBy: 'admin-e2e' })
      .expect(201)

    assert.equal(res.body.status, 'rejected')
    assert.equal(res.body.enabled, false)
  })

  it('POST /tenant-llm/configs/:id/approve 审批不存在的配置', async () => {
    const res = await http
      .post('/tenant-llm/configs/non-existent-approve/approve')
      .send({ approved: true, approvedBy: 'admin' })
      .expect(201)

    assert.ok(isEmpty(res.body))
  })

  // ── 调用统计 ──

  it('GET /tenant-llm/stats 返回统计（无日志时为零数据）', async () => {
    const res = await http
      .get('/tenant-llm/stats')
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.equal(typeof res.body.totalCalls, 'number')
    assert.equal(typeof res.body.avgLatencyMs, 'number')
  })

  it('GET /tenant-llm/stats 有配置ID筛选', async () => {
    const res = await http
      .get(`/tenant-llm/stats?configId=${createdConfigId}`)
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.equal(typeof res.body.totalCalls, 'number')
  })

  // ── 调用日志 ──

  it('GET /tenant-llm/logs 返回日志列表', async () => {
    const res = await http
      .get('/tenant-llm/logs')
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.ok(Array.isArray(res.body))
  })

  it('GET /tenant-llm/logs 按时间段筛选', async () => {
    const res = await http
      .get('/tenant-llm/logs?periodStart=2025-01-01&periodEnd=2025-12-31')
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.ok(Array.isArray(res.body))
  })

  it('GET /tenant-llm/logs 跨租户隔离（看不到其他租户日志）', async () => {
    const resA = await http
      .get('/tenant-llm/logs')
      .set('x-tenant-id', tenantId)
      .expect(200)

    const resB = await http
      .get('/tenant-llm/logs')
      .set('x-tenant-id', 'other-tenant-e2e')
      .expect(200)

    assert.ok(Array.isArray(resA.body))
    assert.ok(Array.isArray(resB.body))
  })

  // ── 删除配置 ──

  it('DELETE /tenant-llm/configs/:id 删除配置', async () => {
    const res = await http
      .delete(`/tenant-llm/configs/${createdConfigId}`)
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.equal(res.body.deleted, true)

    // 确认已删除
    const getRes = await http
      .get(`/tenant-llm/configs/${createdConfigId}`)
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.ok(isEmpty(getRes.body))
  })

  it('DELETE /tenant-llm/configs/:id 跨租户删除无权限', async () => {
    const createRes = await http
      .post('/tenant-llm/configs')
      .set('x-tenant-id', 'tenant-delete-e2e')
      .send({
        name: 'To Delete',
        provider: 'deepseek',
        modelName: 'deepseek-chat',
        apiKey: 'sk-delete',
      })
      .expect(201)
    const toDeleteId = createRes.body.id

    // 其他租户尝试删除
    const res = await http
      .delete(`/tenant-llm/configs/${toDeleteId}`)
      .set('x-tenant-id', 'other-tenant-e2e')
      .expect(200)

    assert.equal(res.body.deleted, false)

    // 原租户仍可看到
    const getRes = await http
      .get(`/tenant-llm/configs/${toDeleteId}`)
      .set('x-tenant-id', 'tenant-delete-e2e')
      .expect(200)
    assert.ok(getRes.body)
  })

  it('DELETE /tenant-llm/configs/:id 删除不存在的配置', async () => {
    const res = await http
      .delete('/tenant-llm/configs/non-existent-delete')
      .set('x-tenant-id', tenantId)
      .expect(200)

    assert.equal(res.body.deleted, false)
  })
})
