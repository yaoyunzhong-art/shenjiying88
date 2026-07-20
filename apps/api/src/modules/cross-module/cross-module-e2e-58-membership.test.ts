/**
 * E2E: Cross-module #58 — 会员管理全链路测试
 *
 * 链路:
 *   1. 会员注册（新手机号→创建）
 *   2. 手机号查询（已注册手机号→返回信息）
 *   3. 手机号查询（未注册手机号→提示未注册）
 *   4. 积分累计（消费→积分增加，普通会员1x）
 *   5. 积分累计（消费→金卡会员1.5x）
 *   6. 积分扣减（≥100积分→抵扣成功）
 *   7. 积分不足（<100积分→失败）
 *   8. 余额充值→余额增加
 *   9. 余额支付（足够→成功）
 *   10. 余额不足（不够→失败）
 *   11. 等级升级（消费达标→自动升级）
 *   12. 会员列表/搜索/过滤
 *   13. 升级进度查询
 *   14. 统计
 *   15. 积分流水/余额流水
 *
 * PRD 验收卡覆盖: AC-36-01 ~ AC-36-10
 */

import { describe, it, expect } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { MembershipService, type MemberLevel, type Member } from '../membership/membership.service'
import type { LevelConfig } from '../membership/membership.service'

// ─── Test Controller ──────────────────────────────────────────

@Controller('membership-e2e-58')
class TestE2eController {
  constructor(
    @Inject(MembershipService) private readonly svc: MembershipService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: { phone: string; name?: string }, @Headers('x-tenant-id') tenantId: string = 'tenant-1') {
    try {
      const member = this.svc.register({
        phone: body.phone,
        name: body.name ?? '未知客户',
        tenantId,
      })
      return { success: true, data: member }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Post('get-or-create')
  @HttpCode(HttpStatus.CREATED)
  getOrCreate(@Body() body: { phone: string; name?: string }, @Headers('x-tenant-id') tenantId: string = 'tenant-1') {
    const member = this.svc.getOrCreate({
      phone: body.phone,
      name: body.name ?? '未知客户',
      tenantId,
    })
    return { success: true, data: member }
  }

  // ── Static GET routes (MUST be before :id) ─────────────────

  @Get()
  list(@Query('level') level?: MemberLevel, @Query('search') search?: string, @Query('phone') phone?: string) {
    const members = this.svc.list({ phone, level, search })
    return { success: true, data: { members, total: members.length } }
  }

  @Get('stats')
  stats() {
    return { success: true, data: this.svc.getStats() }
  }

  @Get('levels')
  getLevels() {
    return { success: true, data: this.svc.getLevelConfigs() }
  }

  @Get('phone/:phone')
  findByPhone(@Param('phone') phone: string, @Headers('x-tenant-id') tenantId: string = 'tenant-1') {
    const member = this.svc.findByPhone(phone, tenantId)
    if (!member) return { success: false, message: `手机号 ${phone} 未注册` }
    return { success: true, data: member }
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    const member = this.svc.getById(id)
    if (!member) return { success: false, message: `会员 ${id} 不存在` }
    return { success: true, data: member }
  }

  // ── Mutations ─────────────────────────────────────────────

  @Put(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; level?: MemberLevel }) {
    try {
      const member = this.svc.update(id, body)
      return { success: true, data: member }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string) {
    try {
      this.svc.delete(id)
      return { success: true, data: { id, deleted: true } }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Get(':id/level')
  getLevel(@Param('id') id: string) {
    const member = this.svc.getById(id)
    if (!member) return { success: false, message: `会员 ${id} 不存在` }
    const cfg = this.svc.getLevelConfig(member.level)
    return { success: true, data: { level: member.level, config: cfg } }
  }

  @Get(':id/upgrade')
  getUpgrade(@Param('id') id: string) {
    try {
      return { success: true, data: this.svc.getUpgradeProgress(id) }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Post(':id/refresh-level')
  refreshLevel(@Param('id') id: string) {
    try {
      return { success: true, data: this.svc.refreshLevel(id) }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Post(':id/points/earn')
  earnPoints(@Param('id') id: string, @Body() body: { amount: number; orderId?: string }) {
    try {
      return { success: true, data: this.svc.earnPoints(id, body.amount, body.orderId) }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Post(':id/points/redeem')
  redeemPoints(@Param('id') id: string, @Body() body: { points: number; orderId?: string }) {
    try {
      return { success: true, data: this.svc.redeemPoints(id, body.points, body.orderId) }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Get(':id/points/history')
  pointsHistory(@Param('id') id: string, @Query('limit') limit?: string) {
    const maxLimit = limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50
    const txs = this.svc.listPointsTransactions(id, maxLimit)
    return { success: true, data: { transactions: txs, total: txs.length } }
  }

  @Post(':id/points/adjust')
  adjustPoints(@Param('id') id: string, @Body() body: { amount: number; remark: string }) {
    try {
      return { success: true, data: this.svc.adjustPoints(id, body.amount, body.remark) }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Post(':id/balance/recharge')
  recharge(@Param('id') id: string, @Body() body: { amount: number; paymentMethod?: string }) {
    try {
      return { success: true, data: this.svc.recharge(id, body.amount, body.paymentMethod) }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Post(':id/balance/pay')
  payBalance(@Param('id') id: string, @Body() body: { amount: number; orderId?: string }) {
    try {
      const paid = this.svc.payWithBalance(id, body.amount, body.orderId)
      return { success: true, data: { paid } }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  @Get(':id/balance/history')
  balanceHistory(@Param('id') id: string, @Query('limit') limit?: string) {
    const maxLimit = limit ? Math.min(parseInt(limit, 10) || 50, 200) : 50
    const txs = this.svc.listBalanceTransactions(id, maxLimit)
    return { success: true, data: { transactions: txs, total: txs.length } }
  }

}

async function buildApp() {
  const svc = new MembershipService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestE2eController],
    providers: [{ provide: MembershipService, useValue: svc }],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, svc }
}

async function registerMember(app: any, phone: string, name?: string) {
  return request(app.getHttpServer())
    .post('/membership-e2e-58/register')
    .send({ phone, name: name ?? `会员${phone.slice(-4)}` })
    .set('x-tenant-id', 'tenant-1')
}

async function getFirstMemberId(app: any): Promise<string> {
  const res = await request(app.getHttpServer()).get('/membership-e2e-58')
  return res.body.data.members[0].id
}

// ═══════════════════════════ E2E Tests ═══════════════════════════

// ─── AC-36-01: 注册 ──────────────────────────────────────────

it('e2e-58: [AC-36-01] 新手机号注册成功', async () => {
  const { app } = await buildApp()
  try {
    const res = await registerMember(app, '13800138001', '张三')
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, true)
    assert.equal(res.body.data.phone, '13800138001')
    assert.equal(res.body.data.name, '张三')
    assert.equal(res.body.data.level, 'regular')
    assert.equal(res.body.data.points, 0)
    assert.equal(res.body.data.balance, 0)
  } finally {
    await app.close()
  }
})

it('e2e-58: [AC-36-01] 重复手机号注册失败', async () => {
  const { app } = await buildApp()
  try {
    await registerMember(app, '13800138001', '张三')
    const res = await registerMember(app, '13800138001', '张三重复')
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.success, false)
    assert.ok(res.body.message?.includes('已注册'))
  } finally {
    await app.close()
  }
})

// ─── AC-36-02: 查询已注册手机号 ──────────────────────────────

it('e2e-58: [AC-36-02] 已注册手机号能查到会员信息', async () => {
  const { app } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const memberId = reg.body.data.id

    const res = await request(app.getHttpServer())
      .get(`/membership-e2e-58/${memberId}`)
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.phone, '13800138001')
    assert.equal(res.body.data.name, '张三')
    assert.ok(typeof res.body.data.level === 'string')
    assert.ok(typeof res.body.data.points === 'number')
  } finally {
    await app.close()
  }
})

// ─── AC-36-03: 查询未注册手机号 ──────────────────────────────

it('e2e-58: [AC-36-03] 未注册手机号提示未注册', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/membership-e2e-58/phone/13900000000')
      .set('x-tenant-id', 'tenant-1')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.success, false)
    assert.ok(res.body.message?.includes('未注册'))
  } finally {
    await app.close()
  }
})

// ─── AC-36-04: 普通会员积分累计 ──────────────────────────────

it('e2e-58: [AC-36-04] 普通会员消费100元得100积分', async () => {
  const { app } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    // 消费100元 = 10000分，regular 1x = 100积分
    const earnRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/points/earn`)
      .send({ amount: 10000, orderId: 'ORD-001' })
    assert.equal(earnRes.body.data.amount, 100)

    const getRes = await request(app.getHttpServer()).get(`/membership-e2e-58/${mid}`)
    assert.equal(getRes.body.data.points, 100)
  } finally {
    await app.close()
  }
})

// ─── AC-36-05: 金卡会员多倍积分 ──────────────────────────────

it('e2e-58: [AC-36-05] 金卡会员消费100元得150积分', async () => {
  const { app, svc } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    // Promote to gold manually
    svc.update(mid, { level: 'gold' })

    // gold 1.5x → 100 * 1.5 = 150
    const earnRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/points/earn`)
      .send({ amount: 10000 })
    assert.equal(earnRes.body.data.amount, 150)
  } finally {
    await app.close()
  }
})

// ─── AC-36-06: 积分扣减成功 ─────────────────────────────────

it('e2e-58: [AC-36-06] 500积分抵扣5元', async () => {
  const { app, svc } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    // Seed points: 消费50000分 = 500元 → regular 1x = 500积分
    svc.earnPoints(mid, 50000)

    // Redeem 500 points = 5元
    const redeemRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/points/redeem`)
      .send({ points: 500, orderId: 'ORD-002' })
    assert.equal(redeemRes.body.data.pointsUsed, 500)
    assert.equal(redeemRes.body.data.centsDiscounted, 5)

    // Verify points deducted
    const getRes = await request(app.getHttpServer()).get(`/membership-e2e-58/${mid}`)
    assert.equal(getRes.body.data.points, 0)
  } finally {
    await app.close()
  }
})

// ─── AC-36-07: 积分不足 ─────────────────────────────────────

it('e2e-58: [AC-36-07] 积分<100无法抵扣', async () => {
  const { app } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    const redeemRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/points/redeem`)
      .send({ points: 50 })
    assert.equal(redeemRes.body.success, false)
    assert.ok(redeemRes.body.message?.includes('积分不足'))
  } finally {
    await app.close()
  }
})

// ─── AC-36-08: 充值 ─────────────────────────────────────────

it('e2e-58: [AC-36-08] 充值100元余额增加', async () => {
  const { app } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    const rechargeRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/balance/recharge`)
      .send({ amount: 10000, paymentMethod: 'wechat' })
    assert.equal(rechargeRes.body.data.balance, 10000)

    // Verify balance persists
    const getRes = await request(app.getHttpServer()).get(`/membership-e2e-58/${mid}`)
    assert.equal(getRes.body.data.balance, 10000)
  } finally {
    await app.close()
  }
})

// ─── AC-36-09: 余额支付成功 ─────────────────────────────────

it('e2e-58: [AC-36-09] 余额足够时支付成功', async () => {
  const { app, svc } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    svc.recharge(mid, 10000)

    const payRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/balance/pay`)
      .send({ amount: 5000, orderId: 'ORD-003' })
    assert.equal(payRes.body.data.paid, 5000)

    const getRes = await request(app.getHttpServer()).get(`/membership-e2e-58/${mid}`)
    assert.equal(getRes.body.data.balance, 5000)
  } finally {
    await app.close()
  }
})

// ─── AC-36-10: 余额不足 ─────────────────────────────────────

it('e2e-58: [AC-36-10] 余额不足时提示其他支付方式', async () => {
  const { app, svc } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    svc.recharge(mid, 1000) // 10元

    const payRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/balance/pay`)
      .send({ amount: 9999 }) // 需要99.99元
    assert.equal(payRes.body.success, false)
    assert.ok(payRes.body.message?.includes('余额不足'))
  } finally {
    await app.close()
  }
})

// ─── 附加测试: 等级升级 ─────────────────────────────────────

it('e2e-58: 消费达标后自动升级', async () => {
  const { app } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    // Earn enough to reach silver (50000 cents = 500元)
    const earnRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/points/earn`)
      .send({ amount: 60000, orderId: 'ORD-004' })
    assert.equal(earnRes.body.success, true)

    // Refresh level
    const refreshRes = await request(app.getHttpServer())
      .post(`/membership-e2e-58/${mid}/refresh-level`)
    assert.equal(refreshRes.body.data.level, 'silver')

    // Verify
    const getRes = await request(app.getHttpServer()).get(`/membership-e2e-58/${mid}`)
    assert.equal(getRes.body.data.level, 'silver')
  } finally {
    await app.close()
  }
})

// ─── 附加测试: 会员列表 ─────────────────────────────────────

it('e2e-58: 会员列表支持搜索和过滤', async () => {
  const { app } = await buildApp()
  try {
    await registerMember(app, '13800138001', '张三')
    await registerMember(app, '13800138002', '李四')
    await registerMember(app, '13800138003', '王五')

    // List all
    const allRes = await request(app.getHttpServer()).get('/membership-e2e-58')
    assert.equal(allRes.body.data.total, 3)

    // Search by name
    const searchRes = await request(app.getHttpServer())
      .get('/membership-e2e-58?search=张三')
    assert.equal(searchRes.body.data.total, 1)
    assert.equal(searchRes.body.data.members[0].name, '张三')
  } finally {
    await app.close()
  }
})

// ─── 附加测试: 升级进度 ─────────────────────────────────────

it('e2e-58: 升级进度返回正确信息', async () => {
  const { app } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    const progressRes = await request(app.getHttpServer())
      .get(`/membership-e2e-58/${mid}/upgrade`)
    assert.equal(progressRes.body.data.currentLevel, 'regular')
    assert.equal(progressRes.body.data.nextLevel, 'silver')
    assert.equal(progressRes.body.data.nextLevelMinSpent, 50000)
  } finally {
    await app.close()
  }
})

// ─── 附加测试: 积分流水 ─────────────────────────────────────

it('e2e-58: 积分流水查询', async () => {
  const { app, svc } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    svc.earnPoints(mid, 10000)
    svc.earnPoints(mid, 20000)

    const historyRes = await request(app.getHttpServer())
      .get(`/membership-e2e-58/${mid}/points/history`)
    assert.equal(historyRes.body.data.total, 2)
    assert.equal(historyRes.body.data.transactions[0].type, 'earn')
  } finally {
    await app.close()
  }
})

// ─── 附加测试: 余额流水 ─────────────────────────────────────

it('e2e-58: 余额流水查询', async () => {
  const { app, svc } = await buildApp()
  try {
    const reg = await registerMember(app, '13800138001', '张三')
    const mid = reg.body.data.id

    svc.recharge(mid, 10000, 'wechat')
    svc.payWithBalance(mid, 3000)

    const historyRes = await request(app.getHttpServer())
      .get(`/membership-e2e-58/${mid}/balance/history`)
    assert.equal(historyRes.body.data.total, 2)
  } finally {
    await app.close()
  }
})

// ─── 附加测试: 统计接口 ─────────────────────────────────────

it('e2e-58: 统计接口返回汇总数据', async () => {
  const { app, svc } = await buildApp()
  try {
    await registerMember(app, '13800138001', '张三')
    await registerMember(app, '13800138002', '李四')

    const mid = await getFirstMemberId(app)
    svc.update(mid, { level: 'gold' })

    const statsRes = await request(app.getHttpServer())
      .get('/membership-e2e-58/stats')
    assert.equal(statsRes.body.data.totalMembers, 2)
    assert.equal(statsRes.body.data.byLevel.gold, 1)
    assert.equal(statsRes.body.data.byLevel.regular, 1)
  } finally {
    await app.close()
  }
})
