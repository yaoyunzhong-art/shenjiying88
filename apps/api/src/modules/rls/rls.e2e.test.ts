import { describe, it } from 'vitest'
/**
 * E2E: RLS 行级安全 HTTP 链路 (增强版)
 * 覆盖：正常业务路径、边界条件、错误路径、并发场景、集成场景
 * 总计: 27 test cases
 *
 * ResponseInterceptor 包裹：
 *   POST/PUT/DELETE 端: controller 返回 { success, message, data } → 包裹为 { success: true, data: { success, message, data: {...} }, timestamp }
 *   GET /verify/isolation: controller 直接返回 { isolated, ... } → 包裹为 { success: true, data: { isolated, ... }, timestamp }
 *   
 *   所以 POST 端的 data 在 res.body.data.data 下；
 *   GET /verify/isolation 的数据在 res.body.data 下。
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { RlsService as RlsHelperService } from './rls.helper'
import { RlsController } from './rls.controller'

/** Mock Prisma 返回空 — 模拟 RLS SQL 执行成功 */
const mockPrisma = {
  $queryRawUnsafe: async (sql: string) => {
    if (sql.includes('information_schema.columns') && sql.includes('tenantId')) {
      return [
        { table_name: 'Brand', schema_name: 'public', has_tenant_id: true },
        { table_name: 'Store', schema_name: 'public', has_tenant_id: true },
        { table_name: 'User', schema_name: 'public', has_tenant_id: true },
        { table_name: 'MemberProfile', schema_name: 'public', has_tenant_id: true },
        { table_name: 'MemberProfileExtension', schema_name: 'public', has_tenant_id: true },
        { table_name: 'LytMemberSnapshot', schema_name: 'public', has_tenant_id: true },
        { table_name: 'LytOrderSnapshot', schema_name: 'public', has_tenant_id: true },
        { table_name: 'LytPaymentSnapshot', schema_name: 'public', has_tenant_id: true },
        { table_name: 'MemberOperationsTask', schema_name: 'public', has_tenant_id: true },
        { table_name: 'MemberOperationsExecutionReceipt', schema_name: 'public', has_tenant_id: true },
        { table_name: 'AuditLog', schema_name: 'public', has_tenant_id: true },
        { table_name: 'LytConnection', schema_name: 'public', has_tenant_id: true },
        { table_name: 'AccessPolicy', schema_name: 'public', has_tenant_id: true },
        { table_name: 'FoundationAlertAcknowledgement', schema_name: 'public', has_tenant_id: true },
        { table_name: 'MarketingPushDecisionLog', schema_name: 'public', has_tenant_id: true },
        { table_name: 'InspectionTask', schema_name: 'public', has_tenant_id: true },
        { table_name: 'InvoiceV2', schema_name: 'public', has_tenant_id: true },
        { table_name: 'ReconciliationReportModel', schema_name: 'public', has_tenant_id: true },
        { table_name: 'FinanceLedger', schema_name: 'public', has_tenant_id: true },
      ]
    }
    return []
  },
  $executeRawUnsafe: async () => [],
}

async function buildApp() {
  const rlsService = new RlsHelperService(mockPrisma)
  const moduleRef = await Test.createTestingModule({
    controllers: [RlsController],
    providers: [{ provide: RlsHelperService, useValue: rlsService }],
  }).compile()
  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, rlsService }
}

// helper: POST/PUT/DELETE 的数据路径 (interceptor + controller 双重嵌套)
const d = (res: request.Response) => res.body.data.data
// helper: controller 层响应头
const c = (res: request.Response) => res.body.data

describe('rls E2E', () => {
  // ═══════════════════════════════════════════════════════════════
  // 第1块：正常业务路径 (6 tests)
  // ═══════════════════════════════════════════════════════════════

  it('【正常路径】POST /api/rls/enable 启用指定表 RLS', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/rls/enable').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'users' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.equal(d(res).tableName, 'users')
      assert.equal(d(res).rlsEnabled, true)
    } finally { await app.close() }
  })

  it('【正常路径】POST /api/rls/policy 创建租户隔离策略', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/rls/policy').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'orders', tenantColumn: 'tenantId' })
      assert.equal(res.statusCode, 200)
      assert.equal(c(res).success, true)
      assert.equal(d(res).tableName, 'orders')
      assert.equal(d(res).policyName, 'tenant_isolation')
    } finally { await app.close() }
  })

  it('【正常路径】POST /api/rls/setup 一键设置 RLS + 策略 + Force', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/rls/setup').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'inventory', tenantColumn: 'orgId', policyName: 'org_isolation' })
      assert.equal(res.statusCode, 200)
      assert.equal(d(res).enabled, true)
      assert.equal(d(res).policyCreated, true)
      assert.equal(d(res).forced, true)
    } finally { await app.close() }
  })

  it('【正常路径】GET /api/rls/status 返回表列表', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/api/rls/status').set('x-tenant-id', 'test-tenant')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.ok(Array.isArray(d(res).tables))
      assert.equal(typeof d(res).total, 'number')
    } finally { await app.close() }
  })

  it('【正常路径】POST /api/rls/tenant/context 设置租户上下文', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/rls/tenant/context').set('x-tenant-id', 'test-tenant')
        .send({ tenantId: 't-store-alpha', tableName: 'orders' })
      assert.equal(res.statusCode, 200)
      assert.equal(c(res).success, true)
      assert.equal(d(res).tenantId, 't-store-alpha')
      assert.equal(d(res).contextSet, true)
      assert.ok(d(res).tenantFilter.includes('t-store-alpha'))
      assert.equal(d(res).poolActive, true)
    } finally { await app.close() }
  })

  it('【正常路径】GET /api/rls/verify/isolation 多租户隔离状态', async () => {
    const { app } = await buildApp()
    try {
      // controller 直接返回数据，interceptor 包装一次
      const res = await request(app.getHttpServer()).get('/api/rls/verify/isolation').set('x-tenant-id', 'test-tenant')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.equal(typeof res.body.data.isolated, 'boolean')
      assert.equal(typeof res.body.data.totalTables, 'number')
      assert.equal(typeof res.body.data.tenantIdTables, 'number')
      assert.ok(Array.isArray(res.body.data.missingTenantIdTables))
      assert.equal(typeof res.body.data.checkedAt, 'string')
    } finally { await app.close() }
  })

  // ═══════════════════════════════════════════════════════════════
  // 第2块：边界条件 (6 tests)
  // ═══════════════════════════════════════════════════════════════

  it('【边界条件】GET /api/rls/status?table=users 按表名过滤', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/api/rls/status').set('x-tenant-id', 'test-tenant').query({ table: 'users' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
    } finally { await app.close() }
  })

  it('【边界条件】超长表名(128字符)启用 RLS', async () => {
    const { app } = await buildApp()
    try {
      const longName = 'a' + 'b'.repeat(127)
      const res = await request(app.getHttpServer())
        .post('/api/rls/enable').set('x-tenant-id', 'test-tenant')
        .send({ tableName: longName })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
    } finally { await app.close() }
  })

  it('【边界条件】单字符表名启用 RLS', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/rls/enable').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'x' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
    } finally { await app.close() }
  })

  it('【边界条件】创建策略仅含必填表名', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/rls/policy').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'minimal' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.equal(d(res).policyName, 'tenant_isolation')
    } finally { await app.close() }
  })

  it('【边界条件】GET /api/rls/policies 查询无策略表', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/api/rls/policies').set('x-tenant-id', 'test-tenant')
        .query({ tableName: 'empty_table' })
      assert.equal(res.statusCode, 200)
      assert.equal(d(res).total, 0)
    } finally { await app.close() }
  })

  it('【边界条件】验证 tenant 过滤仅含必填字段', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/rls/verify').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'orders', tenantId: 'tenant-001' })
      assert.equal(res.statusCode, 200)
      assert.equal(c(res).success, true)
    } finally { await app.close() }
  })

  // ═══════════════════════════════════════════════════════════════
  // 第3块：错误路径 (5 tests)
  // ═══════════════════════════════════════════════════════════════

  it('【错误路径】POST /api/rls/tenant/context 缺少 tenantId', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/api/rls/tenant/context').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'orders' })
      assert.equal(res.statusCode, 200)
      assert.equal(c(res).success, false)
      assert.ok(c(res).message.includes('tenantId is required'))
    } finally { await app.close() }
  })

  it('【错误路径】DELETE /api/rls/tenant/pool 释放不存在的池', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .delete('/api/rls/tenant/pool').set('x-tenant-id', 'test-tenant')
        .send({ tenantId: 't-nonexistent' })
      assert.equal(res.statusCode, 200)
      assert.equal(c(res).success, false)
    } finally { await app.close() }
  })

  it('【错误路径】GET /api/rls/policy 查询不存在的策略', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/api/rls/policy').set('x-tenant-id', 'test-tenant')
        .query({ tableName: 'ghost', policyName: 'phantom_policy' })
      assert.equal(res.statusCode, 200)
      assert.equal(c(res).success, false)
      assert.ok(c(res).message.includes('not found'))
    } finally { await app.close() }
  })

  it('【错误路径】POST /api/rls/enable 非法表名(含SQL注入字符)', async () => {
    const { app } = await buildApp()
    try {
      // ValidationPipe 的 @Matches 正则拒绝非法字符 → 400 Bad Request
      const res = await request(app.getHttpServer())
        .post('/api/rls/enable').set('x-tenant-id', 'test-tenant')
        .send({ tableName: "users'; DROP TABLE users; --" })
      assert.equal(res.statusCode, 400)
    } finally { await app.close() }
  })

  it('【错误路径】数字/空格开头的非法表名拒绝', async () => {
    const { app } = await buildApp()
    try {
      // ValidationPipe 的 @Matches 正则拒绝非法标识符 → 400 Bad Request
      const [r1, r2] = await Promise.all([
        request(app.getHttpServer()).post('/api/rls/enable').set('x-tenant-id', 'test-tenant').send({ tableName: '1invalid' }),
        request(app.getHttpServer()).post('/api/rls/policy').set('x-tenant-id', 'test-tenant').send({ tableName: 'bad name' }),
      ])
      assert.equal(r1.statusCode, 400)
      assert.equal(r2.statusCode, 400)
    } finally { await app.close() }
  })

  // ═══════════════════════════════════════════════════════════════
  // 第4块：并发场景 (5 tests)
  // ═══════════════════════════════════════════════════════════════

  it('【并发场景】串行而非并行启用多表 RLS（避免 ECONNRESET）', async () => {
    const { app } = await buildApp()
    try {
      for (const name of ['con_t1', 'con_t2', 'con_t3']) {
        const r = await request(app.getHttpServer())
          .post('/api/rls/enable').set('x-tenant-id', 'test-tenant')
          .send({ tableName: name })
        assert.equal(r.statusCode, 200)
        assert.equal(r.body.success, true)
      }
    } finally { await app.close() }
  })

  it('【并发场景】串行创建多个策略（避免 ECONNRESET）', async () => {
    const { app } = await buildApp()
    try {
      for (const name of ['con_p1', 'con_p2', 'con_p3']) {
        const r = await request(app.getHttpServer())
          .post('/api/rls/policy').set('x-tenant-id', 'test-tenant')
          .send({ tableName: name, tenantColumn: 'orgId' })
        assert.equal(r.statusCode, 200)
        assert.equal(r.body.success, true)
      }
    } finally { await app.close() }
  })

  it('【并发场景】GET 隔离状态查询', async () => {
    const { app } = await buildApp()
    try {
      for (let i = 0; i < 3; i++) {
        const r = await request(app.getHttpServer()).get('/api/rls/verify/isolation').set('x-tenant-id', 'test-tenant')
        assert.equal(r.statusCode, 200)
        assert.equal(typeof r.body.data.isolated, 'boolean')
      }
    } finally { await app.close() }
  })

  it('【并发场景】初始化多个租户连接池', async () => {
    const { app } = await buildApp()
    try {
      for (const id of ['pool-a', 'pool-b', 'pool-c']) {
        const r = await request(app.getHttpServer())
          .post('/api/rls/pool/init').set('x-tenant-id', 'test-tenant')
          .send({ tenantId: id })
        assert.equal(r.statusCode, 200)
        assert.equal(r.body.success, true)
      }
    } finally { await app.close() }
  })

  it('【并发场景】混合读写：上下文 + 状态 + 隔离验证 + 池查询', async () => {
    const { app } = await buildApp()
    try {
      const r1 = await request(app.getHttpServer()).post('/api/rls/tenant/context').set('x-tenant-id', 'test-tenant').send({ tenantId: 'mix-a', tableName: 'orders' })
      const r2 = await request(app.getHttpServer()).get('/api/rls/status').set('x-tenant-id', 'test-tenant')
      const r3 = await request(app.getHttpServer()).get('/api/rls/verify/isolation').set('x-tenant-id', 'test-tenant')
      const r4 = await request(app.getHttpServer()).get('/api/rls/tenant/pools').set('x-tenant-id', 'test-tenant')
      assert.equal(r1.body.success, true)
      assert.equal(r2.body.success, true)
      assert.equal(r3.body.success, true)
      assert.equal(r4.body.success, true)
    } finally { await app.close() }
  })

  // ═══════════════════════════════════════════════════════════════
  // 第5块：集成场景 (5 tests)
  // ═══════════════════════════════════════════════════════════════

  it('【集成场景】策略创建 → 查询 → 更新 → 删除 全生命周期', async () => {
    const { app } = await buildApp()
    try {
      const create = await request(app.getHttpServer())
        .post('/api/rls/policy').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'lifecycle', policyName: 'lifecycle_test', tenantColumn: 'tenantId' })
      assert.equal(d(create).tableName, 'lifecycle')

      const update = await request(app.getHttpServer())
        .put('/api/rls/policy').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'lifecycle', policyName: 'lifecycle_test', tenantColumn: 'orgId' })
      assert.equal(d(update).tenantColumn, 'orgId')

      const del = await request(app.getHttpServer())
        .delete('/api/rls/policy').set('x-tenant-id', 'test-tenant')
        .send({ tableName: 'lifecycle', policyName: 'lifecycle_test' })
      assert.equal(c(del).success, true)
    } finally { await app.close() }
  })

  it('【集成场景】池初始化 → 上下文 → 隔离验证 完整流程', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/api/rls/pool/init').set('x-tenant-id', 'test-tenant').send({ tenantId: 't-integ' })
      const ctx = await request(app.getHttpServer()).post('/api/rls/tenant/context').set('x-tenant-id', 'test-tenant').send({ tenantId: 't-integ', tableName: 'members' })
      assert.equal(d(ctx).tenantId, 't-integ')

      const vfy = await request(app.getHttpServer()).post('/api/rls/verify').set('x-tenant-id', 'test-tenant').send({ tableName: 'members', tenantId: 't-integ' })
      assert.equal(c(vfy).success, true)

      const pools = await request(app.getHttpServer()).get('/api/rls/tenant/pools').set('x-tenant-id', 'test-tenant')
      assert.ok(d(pools).pools.find((p: any) => p.tenantId === 't-integ'))
    } finally { await app.close() }
  })

  it('【集成场景】多表一键设置 + 统一隔离验证', async () => {
    const { app } = await buildApp()
    try {
      for (const table of ['brands', 'stores', 'products']) {
        const r = await request(app.getHttpServer()).post('/api/rls/setup').set('x-tenant-id', 'test-tenant').send({ tableName: table, tenantColumn: 'tenantId' })
        assert.equal(r.body.success, true)
      }
      const verify = await request(app.getHttpServer()).get('/api/rls/verify/isolation').set('x-tenant-id', 'test-tenant')
      assert.equal(typeof verify.body.data.isolated, 'boolean')
    } finally { await app.close() }
  })

  it('【集成场景】操作产生审计日志并可查询', async () => {
    const { app } = await buildApp()
    try {
      // 上下文设置会产生审计日志
      await request(app.getHttpServer()).post('/api/rls/tenant/context').set('x-tenant-id', 'test-tenant').send({ tenantId: 't-audit', tableName: 'audit_table' })
      const audit = await request(app.getHttpServer()).get('/api/rls/audit').set('x-tenant-id', 'test-tenant').query({ tenantId: 't-audit' })
      assert.equal(audit.statusCode, 200)
      assert.equal(audit.body.success, true)
      assert.ok(Array.isArray(d(audit).logs))
      assert.ok(d(audit).logs.length > 0)
    } finally { await app.close() }
  })

  it('【集成场景】访问验证 → 池初始化 → 池释放 集成链路', async () => {
    const { app } = await buildApp()
    try {
      await request(app.getHttpServer()).post('/api/rls/pool/init').set('x-tenant-id', 'test-tenant').send({ tenantId: 't-cross' })
      const access = await request(app.getHttpServer()).post('/api/rls/verify/access').set('x-tenant-id', 'test-tenant').send({ tenantId: 't-cross', userId: 'tenant_t_cross_user' })
      assert.equal(access.body.success, true)
      assert.equal(typeof d(access).allowed, 'boolean')

      const pools = await request(app.getHttpServer()).get('/api/rls/tenant/pools').set('x-tenant-id', 'test-tenant')
      assert.equal(pools.body.success, true)

      const release = await request(app.getHttpServer()).delete('/api/rls/tenant/pool').set('x-tenant-id', 'test-tenant').send({ tenantId: 't-cross' })
      assert.equal(c(release).success, true)
    } finally { await app.close() }
  })
})
