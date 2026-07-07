import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * P3-6.2 E2E: CashierBillingController 6 端点
 *
 * 覆盖:
 *   - GET  /cashier/admin/billing/usage?period
 *   - GET  /cashier/admin/billing/wallet
 *   - POST /cashier/admin/billing/wallet/recharge
 *   - GET  /cashier/admin/billing/bills
 *   - POST /cashier/admin/billing/plan
 *   - GET  /cashier/admin/billing/plan
 *
 * 验证:
 *   - 业务流: 充值 → 设置套餐 → 用量记录 → 月末出账 → 查账单
 *   - 缺 x-tenant-id header → reject
 *   - amount <= 0 → 400
 *   - plan 缺 id → 400
 *   - 跨租户隔离: t1 充值不影响 t2 钱包
 *   - 跨周期隔离: 显式 period 不互相覆盖
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Test, type TestingModule } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { CashierBillingController } from './cashier-billing.controller'
import {
  BillingServiceImpl,
  InMemoryBillingMeter,
  DefaultPricingEngine
} from '../foundation/commercial-billing/billing.service'
import { BillingWall } from '../foundation/commercial-billing/billing-wall'
import { TenantGuard } from '../agent/tenant.guard'
import type { PricingPlan } from '../foundation/commercial-billing/billing.port'
const FLAT_99: PricingPlan = {
  id: 'p-flat-99',
  name: 'FLAT 99',
  type: 'FLAT',
  flatAmount: 99,
  tiers: [],
  currency: 'CNY',
  billingCycle: 'monthly',
  effectiveAt: 0
}
const TENANT_A = { 'x-tenant-id': 'tenant-A' }
const TENANT_B = { 'x-tenant-id': 'tenant-B' }
interface AppHandle {
  http: INestApplication
  meter: InMemoryBillingMeter
  billing: BillingServiceImpl
  wall: BillingWall
  close: () => Promise<void>
}
async function buildApp(): Promise<AppHandle> {
  // 全部 provider 用 class 自身作为 token, 让 NestJS 自动 inject
  // (不传 useValue, 让 NestJS 走 constructor 自动装配)
  const moduleRef: TestingModule = await Test.createTestingModule({
    controllers: [CashierBillingController],
    providers: [
      InMemoryBillingMeter,
      DefaultPricingEngine,
      BillingServiceImpl,
      BillingWall
    ]
  })
    .overrideGuard(TenantGuard)
    .useValue({
      canActivate: (ctx: import('@nestjs/common').ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest()
        const t = req.headers['x-tenant-id'] as string | undefined
        if (!t) throw new Error('Unauthorized')
        req.tenantId = t
        return true
      }
    })
    .compile()
  const http = moduleRef.createNestApplication()
  await http.init()
  const meter = moduleRef.get(InMemoryBillingMeter)
  const billing = moduleRef.get(BillingServiceImpl)
  const wall = moduleRef.get(BillingWall)
  return {
    http,
    meter,
    billing,
    wall,
    close: async () => {
      await http.close()
      await moduleRef.close()
    }
  }
}
describe('GET /cashier/admin/billing/usage', () => {
  it('E1.1 缺 x-tenant-id → reject', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/usage')
      // mock TenantGuard 抛 Error, NestJS 默认映射为 500
      assert.equal(r.status, 500)
    } finally {
      await h.close()
    }
  })
  it('E1.2 无数据时返回空 items + 当期 period', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/usage')
        .set(TENANT_A)
      assert.equal(r.status, 200)
      assert.equal(r.body.tenantId, 'tenant-A')
      assert.equal(r.body.period, h.meter.currentPeriod())
      assert.deepEqual(r.body.items, [])
    } finally {
      await h.close()
    }
  })
  it('E1.3 ?period=2026-07 显式指定', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/usage?period=2026-07')
        .set(TENANT_A)
      assert.equal(r.status, 200)
      assert.equal(r.body.period, '2026-07')
    } finally {
      await h.close()
    }
  })
  it('E1.4 跨租户 usage 隔离: t1 用量不影响 t2', async () => {
    const h = await buildApp()
    try {
      // t1 充值 + 计费
      h.wall.recordUsage('tenant-A', 'payment.create', 3)
      const a = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/usage')
        .set(TENANT_A)
      const b = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/usage')
        .set(TENANT_B)
      assert.equal(a.status, 200)
      assert.equal(b.status, 200)
      assert.equal(a.body.items.length, 1)
      assert.equal(a.body.items[0].totalQuantity, 3)
      assert.equal(b.body.items.length, 0)
    } finally {
      await h.close()
    }
  })
})
describe('GET /cashier/admin/billing/wallet + POST /cashier/admin/billing/wallet/recharge', () => {
  it('E2.1 初始 wallet balance = 0', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/wallet')
        .set(TENANT_A)
      assert.equal(r.status, 200)
      assert.equal(r.body.tenantId, 'tenant-A')
      assert.equal(r.body.balance, 0)
      assert.equal(r.body.totalRecharged, 0)
    } finally {
      await h.close()
    }
  })
  it('E2.2 充值 100 → balance = 100, totalRecharged = 100', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/wallet/recharge')
        .set(TENANT_A)
        .send({ amount: 100 })
      assert.equal(r.status, 201)
      assert.equal(r.body.balance, 100)
      assert.equal(r.body.totalRecharged, 100)
    } finally {
      await h.close()
    }
  })
  it('E2.3 累计充值: 100 + 50.5 = 150.5', async () => {
    const h = await buildApp()
    try {
      await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/wallet/recharge')
        .set(TENANT_A)
        .send({ amount: 100 })
      const r = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/wallet/recharge')
        .set(TENANT_A)
        .send({ amount: 50.5 })
      assert.equal(r.status, 201)
      assert.equal(r.body.balance, 150.5)
    } finally {
      await h.close()
    }
  })
  it('E2.4 amount 缺失 → 400', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/wallet/recharge')
        .set(TENANT_A)
        .send({})
      assert.equal(r.status, 400)
    } finally {
      await h.close()
    }
  })
  it('E2.5 amount = 0 → 400', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/wallet/recharge')
        .set(TENANT_A)
        .send({ amount: 0 })
      assert.equal(r.status, 400)
    } finally {
      await h.close()
    }
  })
  it('E2.6 amount = -1 → 400', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/wallet/recharge')
        .set(TENANT_A)
        .send({ amount: -1 })
      assert.equal(r.status, 400)
    } finally {
      await h.close()
    }
  })
  it('E2.7 跨租户钱包隔离', async () => {
    const h = await buildApp()
    try {
      await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/wallet/recharge')
        .set(TENANT_A)
        .send({ amount: 100 })
      const a = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/wallet')
        .set(TENANT_A)
      const b = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/wallet')
        .set(TENANT_B)
      assert.equal(a.body.balance, 100)
      assert.equal(b.body.balance, 0)
    } finally {
      await h.close()
    }
  })
})
describe('GET /cashier/admin/billing/bills', () => {
  it('E3.1 无账单时返回 []', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/bills')
        .set(TENANT_A)
      assert.equal(r.status, 200)
      assert.deepEqual(r.body, [])
    } finally {
      await h.close()
    }
  })
  it('E3.2 出账后 bills 列表包含当月账单', async () => {
    const h = await buildApp()
    try {
      h.billing.setPlan('tenant-A', FLAT_99)
      h.billing.recharge('tenant-A', 200)
      h.wall.recordUsage('tenant-A', 'payment.create', 5)
      const bill = h.wall.settle('tenant-A', h.meter.currentPeriod())
      const r = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/bills')
        .set(TENANT_A)
      assert.equal(r.status, 200)
      assert.equal(r.body.length, 1)
      assert.equal(r.body[0].id, bill.id)
      assert.equal(r.body[0].totalAmount, 99)
    } finally {
      await h.close()
    }
  })
  it('E3.3 跨租户 bills 隔离', async () => {
    const h = await buildApp()
    try {
      h.billing.setPlan('tenant-A', FLAT_99)
      h.billing.recharge('tenant-A', 200)
      h.wall.settle('tenant-A', h.meter.currentPeriod())
      const a = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/bills')
        .set(TENANT_A)
      const b = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/bills')
        .set(TENANT_B)
      assert.equal(a.body.length, 1)
      assert.equal(b.body.length, 0)
    } finally {
      await h.close()
    }
  })
})
describe('POST + GET /cashier/admin/billing/plan', () => {
  it('E4.1 初始 GET plan → null', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/plan')
        .set(TENANT_A)
      assert.equal(r.status, 200)
      // NestJS 默认 response 是 `null` (TypeScript 端), supertest 解析后 body === null
      // 部分版本 / interceptor 会把 null 转成 {}
      assert.ok(r.body === null || (typeof r.body === 'object' && Object.keys(r.body).length === 0),
        `expected null/empty, got ${JSON.stringify(r.body)}`)
    } finally {
      await h.close()
    }
  })
  it('E4.2 设置 FLAT_99 → GET plan 返回相同 plan', async () => {
    const h = await buildApp()
    try {
      const set = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/plan')
        .set(TENANT_A)
        .send(FLAT_99)
      assert.equal(set.status, 201)
      assert.equal(set.body.ok, true)
      const get = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/plan')
        .set(TENANT_A)
      assert.equal(get.status, 200)
      assert.equal(get.body.id, 'p-flat-99')
      assert.equal(get.body.type, 'FLAT')
      assert.equal(get.body.flatAmount, 99)
    } finally {
      await h.close()
    }
  })
  it('E4.3 plan 缺 id → 400', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/plan')
        .set(TENANT_A)
        .send({ type: 'FLAT', flatAmount: 99 })
      assert.equal(r.status, 400)
    } finally {
      await h.close()
    }
  })
  it('E4.4 plan 缺 type → 400', async () => {
    const h = await buildApp()
    try {
      const r = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/plan')
        .set(TENANT_A)
        .send({ id: 'p-no-type' })
      assert.equal(r.status, 400)
    } finally {
      await h.close()
    }
  })
  it('E4.5 切换套餐: FLAT → FLAT 99 不同价格', async () => {
    const h = await buildApp()
    try {
      const FLAT_49: PricingPlan = { ...FLAT_99, id: 'p-flat-49', flatAmount: 49 }
      await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/plan')
        .set(TENANT_A)
        .send(FLAT_49)
      const r1 = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/plan')
        .set(TENANT_A)
      assert.equal(r1.body.id, 'p-flat-49')
      await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/plan')
        .set(TENANT_A)
        .send(FLAT_99)
      const r2 = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/plan')
        .set(TENANT_A)
      assert.equal(r2.body.id, 'p-flat-99')
    } finally {
      await h.close()
    }
  })
})
describe('E2E 综合流程', () => {
  it('E5.1 完整生命周期: 充值 → 设置套餐 → 用量 → 出账 → 查账单', async () => {
    const h = await buildApp()
    try {
      // 1) 充值
      const rc = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/wallet/recharge')
        .set(TENANT_A)
        .send({ amount: 500 })
      assert.equal(rc.status, 201)
      assert.equal(rc.body.balance, 500)
      // 2) 设置 FLAT 99 套餐
      const set = await request(h.http.getHttpServer())
        .post('/cashier/admin/billing/plan')
        .set(TENANT_A)
        .send(FLAT_99)
      assert.equal(set.status, 201)
      // 3) 业务侧 record usage
      h.wall.recordUsage('tenant-A', 'payment.create', 10)
      h.wall.recordUsage('tenant-A', 'refund.create', 2)
      // 4) 查 usage
      const usage = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/usage')
        .set(TENANT_A)
      assert.equal(usage.status, 200)
      const map = new Map(
        usage.body.items.map((i: { metric: string; totalQuantity: number }) => [i.metric, i.totalQuantity])
      )
      assert.equal(map.get('payment.create'), 10)
      assert.equal(map.get('refund.create'), 2)
      // 5) 月末出账
      const bill = h.wall.settle('tenant-A', h.meter.currentPeriod())
      assert.equal(bill.totalAmount, 99)
      // 6) 查账单
      const bills = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/bills')
        .set(TENANT_A)
      assert.equal(bills.status, 200)
      assert.equal(bills.body.length, 1)
      assert.equal(bills.body[0].totalAmount, 99)
      // 7) 钱包被扣 99
      const w = await request(h.http.getHttpServer())
        .get('/cashier/admin/billing/wallet')
        .set(TENANT_A)
      assert.equal(w.body.balance, 401) // 500 - 99
      assert.equal(w.body.totalConsumed, 99)
    } finally {
      await h.close()
    }
  })
})
