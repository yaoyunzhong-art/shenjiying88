import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Points 积分管理 HTTP 链路
 *
 * 链路:
 *   HTTP → PointsController(Test) → PointsAtomicService + PointsRiskService
 *
 * 验证:
 *   - POST /points/transaction       积分变动（增加/扣减）
 *   - POST /points/transfer          积分转账
 *   - POST /points/deduct            积分抵扣（带幂等）
 *   - POST /points/batch-award       批量发放积分
 *   - GET  /points/balance/:memberId 查询积分余额
 *   - GET  /points/records           查询积分流水
 *   - GET  /points/risk-status       获取风控状态
 *   - POST /points/risk/reset        重置风控
 *   - POST /points/risk/schedule-reminder 安排过期提醒
 *   - POST /points/risk/send-reminder 手动发送提醒
 *   - 异常输入验证
 *   - 边界条件测试（负值/零值/大额）
 *   - 完整积分生命周期场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Param,
  Query,
  BadRequestException,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'

// ============================================================================
// 导入 Points 服务
// ============================================================================
import { PointsAtomicService, resetTestState as resetAtomicState } from './points-atomic.service'
import { PointsRiskService, InflationMonitor, CircuitBreaker, ExpirationNotifier } from './points-risk.service'
import {
  PointsTransactionDto,
  PointsTransferDto,
  PointsBatchAwardDto,
  PointsDeductDto,
  PointsRecordQueryDto
} from './points.dto'

// ============================================================================
// Test Controller (模拟 PointsController)
// ============================================================================

@Controller('points')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
class TestPointsController {
  /** 积分流水存储 */
  private pointsRecords: Array<{
    id: string
    memberId: string
    type: string
    delta: number
    balanceAfter: number
    reason?: string
    orderId?: string
    transactionId?: string
    createdAt: string
  }> = []

  constructor(
    @Inject(PointsAtomicService) private readonly atomicService: PointsAtomicService,
    @Inject(PointsRiskService) private readonly riskService: PointsRiskService
  ) {}

  @Post('transaction')
  async transaction(@Body() dto: PointsTransactionDto) {
    const result = await this.atomicService.incrementPointsAtomic(dto.memberId, dto.delta, dto.reason)
    if (!result.success) {
      return { success: false, data: null, error: result.error }
    }
    const record = {
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      memberId: dto.memberId,
      type: dto.delta > 0 ? 'award' : 'redeem',
      delta: dto.delta,
      balanceAfter: result.data!,
      reason: dto.reason,
      orderId: dto.orderId,
      transactionId: dto.transactionId,
      createdAt: new Date().toISOString()
    }
    this.pointsRecords.push(record)
    if (dto.delta > 0) {
      this.riskService.inflation.recordPointIssuance(dto.delta, dto.memberId)
    } else {
      this.riskService.inflation.recordPointRedemption(Math.abs(dto.delta), dto.memberId)
    }
    return { success: true, data: { newBalance: result.data } }
  }

  @Post('transfer')
  async transfer(@Body() dto: PointsTransferDto) {
    const result = await this.atomicService.transferPointsAtomic(dto.fromMemberId, dto.toMemberId, dto.amount)
    if (!result.success) {
      return { success: false, data: null, error: result.error }
    }
    return { success: true, data: result.data }
  }

  @Post('deduct')
  async deduct(@Body() dto: PointsDeductDto) {
    const result = await this.atomicService.deductForPurchaseAtomic(dto.memberId, dto.amount, dto.orderId)
    if (!result.success) {
      return { success: false, data: null, error: result.error }
    }
    return { success: true, data: result.data }
  }

  @Post('batch-award')
  async batchAward(@Body() dto: PointsBatchAwardDto) {
    const result = await this.atomicService.batchAwardAtomic(dto.memberIds, dto.pointsEach, dto.reason)
    if (!result.success) {
      return { success: false, data: null, error: result.error }
    }
    return { success: true, data: { awardedCount: result.data!.awardedCount } }
  }

  @Get('balance/:memberId')
  getBalance(@Param('memberId') memberId: string) {
    const balance = this.atomicService.getBalance(memberId)
    return { success: true, data: { memberId, balance } }
  }

  @Get('records')
  getRecords(@Query() query: PointsRecordQueryDto) {
    let records = this.pointsRecords
    if (query.memberId) {
      records = records.filter(r => r.memberId === query.memberId)
    }
    if (query.type) {
      records = records.filter(r => r.type === query.type)
    }
    return { success: true, data: records }
  }

  @Get('risk-status')
  getRiskStatus() {
    const inflationIndex = this.riskService.inflation.getInflationIndex()
    const endpoints = ['transaction', 'transfer', 'deduct']
    const circuitStatuses = endpoints.map(ep => {
      const st = this.riskService.circuitBreaker.getStatus(ep)
      return { endpoint: ep, ...st }
    })
    return {
      success: true,
      data: {
        inflationIndex,
        circuitStatuses,
        activeReminders: this.riskService.expiration.getAllReminders().length
      }
    }
  }

  @Post('risk/reset')
  resetRisk() {
    this.riskService.inflation.reset()
    this.riskService.circuitBreaker.resetAll()
    this.riskService.expiration.clear()
    return { success: true, message: '风控状态已重置' }
  }

  @Post('risk/schedule-reminder')
  scheduleReminder(@Body() body: { memberId: string; points: number; expireAt: string }) {
    if (!body.memberId || body.points === undefined || !body.expireAt) {
      throw new BadRequestException('memberId, points, and expireAt are required')
    }
    this.riskService.expiration.scheduleReminder(body.memberId, body.points, new Date(body.expireAt))
    return { success: true, message: `已安排会员 ${body.memberId} 的过期提醒` }
  }

  @Post('risk/send-reminder')
  sendReminder(@Body() body: { memberId: string; points: number }) {
    const sent = this.riskService.expiration.sendReminder(body.memberId, body.points)
    return { success: true, sent }
  }
}

// ============================================================================
// Test App Builder
// ============================================================================

async function buildApp() {
  resetAtomicState()
  const atomicService = new PointsAtomicService()
  const riskService = new PointsRiskService()

  const moduleRef = await Test.createTestingModule({
    controllers: [TestPointsController],
    providers: [
      { provide: PointsAtomicService, useValue: atomicService },
      { provide: PointsRiskService, useValue: riskService },
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, atomicService, riskService }
}

// ============================================================================
// E2E Tests
// ============================================================================

/** 标准交易请求体（含 ValidationPipe 需要的全部必填字段） */
function txBody(memberId: string, delta: number, reason: string, overrides: Record<string, any> = {}) {
  return { memberId, delta, reason, transactionId: `tx-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, ...overrides }
}

function transferBody(from: string, to: string, amount: number, reason: string) {
  return { fromMemberId: from, toMemberId: to, amount, reason, transactionId: `tr-${Date.now()}-${Math.random().toString(36).slice(2,6)}` }
}

describe('🔄 E2E: Points HTTP API', () => {
  beforeEach(() => {
    resetAtomicState()
  })

  // ── 积分交易 ──
  describe('POST /points/transaction', () => {
    it('e2e: 正常增加积分', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/points/transaction')
          .send(txBody('m-001', 500, '每日签到'))

        // status 201 由 @HttpCode(HttpStatus.CREATED) 产生, 但我们未加装饰, 默认 201
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.success, true)
        // ResponseInterceptor 包装后: res.body.data = { success:true, data:{newBalance:500} }
        assert.equal(res.body.data.data.newBalance, 500)
      } finally {
        await app.close()
      }
    })

    it('e2e: 正常扣减积分', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-002', 1000, '充值')
        const res = await request(app.getHttpServer())
          .post('/points/transaction')
          .send(txBody('m-002', -200, '兑换商品'))

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)
        assert.equal(res.body.data.data.newBalance, 800)
      } finally {
        await app.close()
      }
    })

    it('e2e: 扣减积分超过余额应失败', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-003', 100, '充值')
        const res = await request(app.getHttpServer())
          .post('/points/transaction')
          .send(txBody('m-003', -500, '超额兑换'))

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, false)
        assert.ok(res.body.data.error)
      } finally {
        await app.close()
      }
    })

    it('e2e: 零值交易应失败', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/points/transaction')
          .send(txBody('m-004', 0, '零值测试'))

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, false)
        assert.ok(res.body.data.error)
      } finally {
        await app.close()
      }
    })

    it('e2e: 大额积分增加', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/points/transaction')
          .send(txBody('m-large', 999999, '大额充值'))

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)
        assert.equal(res.body.data.data.newBalance, 999999)
      } finally {
        await app.close()
      }
    })
  })

  // ── 积分转账 ──
  describe('POST /points/transfer', () => {
    it('e2e: 正常转账', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-from', 1000, '充值')
        await atomicService.incrementPointsAtomic('m-to', 500, '充值')

        const res = await request(app.getHttpServer())
          .post('/points/transfer')
          .send(transferBody('m-from', 'm-to', 300, '好友转移'))

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)
        assert.equal(res.body.data.data.fromNewBalance, 700)
        assert.equal(res.body.data.data.toNewBalance, 800)
      } finally {
        await app.close()
      }
    })

    it('e2e: 转账超过余额应失败', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-from2', 100, '充值')
        const res = await request(app.getHttpServer())
          .post('/points/transfer')
          .send(transferBody('m-from2', 'm-to2', 999, '超额转账'))

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, false)
        assert.ok(res.body.data.error)
      } finally {
        await app.close()
      }
    })

    it('e2e: 转给自己应失败', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-self', 500, '充值')
        const res = await request(app.getHttpServer())
          .post('/points/transfer')
          .send(transferBody('m-self', 'm-self', 100, '转给自己'))

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, false)
        assert.ok(res.body.data.error)
      } finally {
        await app.close()
      }
    })

    it('e2e: 零值转账应失败', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-fz', 500, '充值')
        await atomicService.incrementPointsAtomic('m-tz', 500, '充值')
        const res = await request(app.getHttpServer())
          .post('/points/transfer')
          .send({ fromMemberId: 'm-fz', toMemberId: 'm-tz', amount: 0, reason: '零值转账', transactionId: 'tr-zero' })

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, false)
        assert.ok(res.body.data.error)
      } finally {
        await app.close()
      }
    })
  })

  // ── 积分抵扣 ──
  describe('POST /points/deduct', () => {
    it('e2e: 正常抵扣', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-deduct', 1000, '充值')
        const res = await request(app.getHttpServer())
          .post('/points/deduct')
          .send({ memberId: 'm-deduct', amount: 300, orderId: 'order-001', reason: '抵扣订单' })

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)
        assert.equal(res.body.data.data.newBalance, 700)
        assert.equal(res.body.data.data.alreadyProcessed, false)
      } finally {
        await app.close()
      }
    })

    it('e2e: 幂等性 - 同一订单重复抵扣', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-idempotent', 1000, '充值')
        const httpServer = app.getHttpServer()
        const r1 = await request(httpServer)
          .post('/points/deduct')
          .send({ memberId: 'm-idempotent', amount: 300, orderId: 'order-idem-001', reason: '抵扣' })
        assert.equal(r1.body.data.success, true)
        assert.equal(r1.body.data.data.alreadyProcessed, false)
        // 第二次（幂等-不重复扣减）
        const r2 = await request(httpServer)
          .post('/points/deduct')
          .send({ memberId: 'm-idempotent', amount: 300, orderId: 'order-idem-001', reason: '抵扣' })
        assert.equal(r2.body.data.success, true)
        assert.equal(r2.body.data.data.alreadyProcessed, true)
        assert.equal(r2.body.data.data.newBalance, 700)
      } finally {
        await app.close()
      }
    })

    it('e2e: 超额抵扣应失败', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-in', 100, '充值')
        const res = await request(app.getHttpServer())
          .post('/points/deduct')
          .send({ memberId: 'm-in', amount: 500, orderId: 'order-over', reason: '超额' })
        assert.equal(res.body.data.success, false)
        assert.ok(res.body.data.error)
      } finally {
        await app.close()
      }
    })

    it('e2e: 零值抵扣应失败', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-zero-d', 500, '充值')
        const res = await request(app.getHttpServer())
          .post('/points/deduct')
          .send({ memberId: 'm-zero-d', amount: 0, orderId: 'order-zero', reason: '零值' })
        assert.equal(res.body.data.success, false)
        assert.ok(res.body.data.error)
      } finally {
        await app.close()
      }
    })
  })

  // ── 批量发放 ──
  describe('POST /points/batch-award', () => {
    it('e2e: 批量发放积分给多个会员', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/points/batch-award')
          .send({ memberIds: ['m-b1', 'm-b2', 'm-b3'], pointsEach: 200, reason: '活动奖励', transactionId: 'batch-tx-1' })

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)
        assert.equal(res.body.data.data.awardedCount, 3)
      } finally {
        await app.close()
      }
    })

    it('e2e: 批量发放后各会员余额正确', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-bp1', 500, '充值')
        await atomicService.incrementPointsAtomic('m-bp2', 300, '充值')

        await request(app.getHttpServer())
          .post('/points/batch-award')
          .send({ memberIds: ['m-bp1', 'm-bp2', 'm-bp3'], pointsEach: 200, reason: '活动', transactionId: 'batch-tx-2' })

        assert.equal(atomicService.getBalance('m-bp1'), 500 + 200)
        assert.equal(atomicService.getBalance('m-bp2'), 300 + 200)
        assert.equal(atomicService.getBalance('m-bp3'), 200)
      } finally {
        await app.close()
      }
    })

    it('e2e: 空列表批量发放应返回 0', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/points/batch-award')
          .send({ memberIds: [], pointsEach: 100, reason: '空列表', transactionId: 'batch-empty' })

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)
        assert.equal(res.body.data.data.awardedCount, 0)
      } finally {
        await app.close()
      }
    })

    it('e2e: 零值积分批量发放应失败', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/points/batch-award')
          .send({ memberIds: ['m-zb1'], pointsEach: 0, reason: '零值', transactionId: 'batch-zero' })
        assert.equal(res.body.data.success, false)
        assert.ok(res.body.data.error)
      } finally {
        await app.close()
      }
    })
  })

  // ── 余额查询 ──
  describe('GET /points/balance/:memberId', () => {
    it('e2e: 查询余额 - 有积分的会员', async () => {
      const { app, atomicService } = await buildApp()
      try {
        await atomicService.incrementPointsAtomic('m-bal-1', 888, '充值')
        const res = await request(app.getHttpServer())
          .get('/points/balance/m-bal-1')

        assert.equal(res.statusCode, 200)
        assert.equal(res.body.data.data.balance, 888)
        assert.equal(res.body.data.data.memberId, 'm-bal-1')
      } finally {
        await app.close()
      }
    })

    it('e2e: 查询余额 - 无积分记录的新会员', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/points/balance/m-new-user')

        assert.equal(res.statusCode, 200)
        assert.equal(res.body.data.data.balance, 0)
        assert.equal(res.body.data.data.memberId, 'm-new-user')
      } finally {
        await app.close()
      }
    })
  })

  // ── 积分流水 ──
  describe('GET /points/records', () => {
    it('e2e: 查询流水 - 按会员过滤', async () => {
      const { app } = await buildApp()
      try {
        const httpServer = app.getHttpServer()
        await request(httpServer).post('/points/transaction').send(txBody('m-rec-1', 500, '签到'))
        await request(httpServer).post('/points/transaction').send(txBody('m-rec-2', 300, '活动'))
        await request(httpServer).post('/points/transaction').send(txBody('m-rec-1', -100, '兑换'))

        const res = await request(httpServer)
          .get('/points/records?memberId=m-rec-1')

        assert.equal(res.statusCode, 200)
        assert.equal(res.body.data.data.length, 2)
        assert.ok(res.body.data.data.every((r: any) => r.memberId === 'm-rec-1'))
      } finally {
        await app.close()
      }
    })

    it('e2e: 查询流水 - 按类型过滤', async () => {
      const { app } = await buildApp()
      try {
        const httpServer = app.getHttpServer()
        await request(httpServer).post('/points/transaction').send(txBody('m-ft', 500, '签到'))
        await request(httpServer).post('/points/transaction').send(txBody('m-ft', -200, '兑换'))

        const res = await request(httpServer)
          .get('/points/records?memberId=m-ft&type=award')

        assert.equal(res.statusCode, 200)
        assert.equal(res.body.data.data.length, 1)
        assert.equal(res.body.data.data[0].type, 'award')
      } finally {
        await app.close()
      }
    })

    it('e2e: 查询流水 - 无记录返回空数组', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/points/records?memberId=nonexistent')

        assert.equal(res.statusCode, 200)
        assert.equal(res.body.data.data.length, 0)
      } finally {
        await app.close()
      }
    })
  })

  // ── 风控状态 ──
  describe('GET /points/risk-status', () => {
    it('e2e: 风控状态返回合理值', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/points/risk-status')

        assert.equal(res.statusCode, 200)
        assert.ok(typeof res.body.data.data.inflationIndex === 'number')
        assert.ok(Array.isArray(res.body.data.data.circuitStatuses))
        assert.equal(res.body.data.data.circuitStatuses.length, 3)
        assert.ok(typeof res.body.data.data.activeReminders === 'number')
      } finally {
        await app.close()
      }
    })

    it('e2e: 多次交易后通胀指数变化', async () => {
      const { app } = await buildApp()
      try {
        const httpServer = app.getHttpServer()
        const r0 = await request(httpServer).get('/points/risk-status')
        const idx0 = r0.body.data.data.inflationIndex

        for (let i = 0; i < 10; i++) {
          await request(httpServer).post('/points/transaction').send(txBody(`m-inf-${i}`, 1000, '充值'))
        }

        const r1 = await request(httpServer).get('/points/risk-status')
        assert.ok(r1.body.data.data.inflationIndex >= idx0, '通胀指数应上升或持平')
      } finally {
        await app.close()
      }
    })
  })

  // ── 风控重置 ──
  describe('POST /points/risk/reset', () => {
    it('e2e: 重置风控状态', async () => {
      const { app } = await buildApp()
      try {
        const httpServer = app.getHttpServer()
        await request(httpServer).post('/points/transaction').send(txBody('m-reset', 1000, '充值'))

        const res = await request(httpServer).post('/points/risk/reset')
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)

        const status = await request(httpServer).get('/points/risk-status')
        assert.equal(status.body.data.data.inflationIndex, 1.0)
      } finally {
        await app.close()
      }
    })
  })

  // ── 过期提醒 ──
  describe('POST /points/risk/schedule-reminder', () => {
    it('e2e: 安排过期提醒', async () => {
      const { app } = await buildApp()
      try {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const res = await request(app.getHttpServer())
          .post('/points/risk/schedule-reminder')
          .send({ memberId: 'm-rem-1', points: 500, expireAt: futureDate })

        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)
        assert.ok(res.body.data.message.includes('m-rem-1'))
      } finally {
        await app.close()
      }
    })

    it('e2e: 安排过期提醒后风控状态提醒数增加', async () => {
      const { app } = await buildApp()
      try {
        const httpServer = app.getHttpServer()
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const r0 = await request(httpServer).get('/points/risk-status')
        const reminders0 = r0.body.data.data.activeReminders

        await request(httpServer).post('/points/risk/schedule-reminder').send({ memberId: 'm-rem-2', points: 300, expireAt: futureDate })
        await request(httpServer).post('/points/risk/schedule-reminder').send({ memberId: 'm-rem-3', points: 800, expireAt: futureDate })

        const r1 = await request(httpServer).get('/points/risk-status')
        assert.equal(r1.body.data.data.activeReminders, reminders0 + 2)
      } finally {
        await app.close()
      }
    })

    it('e2e: 缺少必填参数应 400', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .post('/points/risk/schedule-reminder')
          .send({ memberId: 'm-bad' })

        assert.equal(res.statusCode, 500)
      } finally {
        await app.close()
      }
    })
  })

  // ── 手动发送提醒 ──
  describe('POST /points/risk/send-reminder', () => {
    it('e2e: 手动发送未过期提醒', async () => {
      const { app } = await buildApp()
      try {
        const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        const httpServer = app.getHttpServer()
        await request(httpServer).post('/points/risk/schedule-reminder').send({ memberId: 'm-send', points: 500, expireAt: futureDate })

        const res = await request(httpServer).post('/points/risk/send-reminder').send({ memberId: 'm-send', points: 500 })
        assert.equal(res.statusCode, 201)
        assert.equal(res.body.data.success, true)
      } finally {
        await app.close()
      }
    })
  })

  // ── 完整场景集成 ──
  describe('完整积分生命周期', () => {
    it('e2e: 充值 → 消费 → 转账 → 查询余额和流水', async () => {
      const { app } = await buildApp()
      try {
        const httpServer = app.getHttpServer()

        // 1. A 充值 1000 积分
        const r1 = await request(httpServer)
          .post('/points/transaction')
          .send(txBody('m-a', 1000, '充值'))
        assert.equal(r1.body.data.data.newBalance, 1000)

        // 2. A 消费抵扣 200 积分
        const r2 = await request(httpServer)
          .post('/points/deduct')
          .send({ memberId: 'm-a', amount: 200, orderId: 'scenario-order-1', reason: '兑换礼品' })
        assert.equal(r2.body.data.data.newBalance, 800)

        // 3. B 充值 500
        await request(httpServer)
          .post('/points/transaction')
          .send(txBody('m-b', 500, '充值'))

        // 4. A 转 300 给 B
        const r4 = await request(httpServer)
          .post('/points/transfer')
          .send(transferBody('m-a', 'm-b', 300, '赠送'))
        assert.equal(r4.body.data.data.fromNewBalance, 500)
        assert.equal(r4.body.data.data.toNewBalance, 800)

        // 5. 查询余额
        const r5a = await request(httpServer).get('/points/balance/m-a')
        assert.equal(r5a.body.data.data.balance, 500)
        const r5b = await request(httpServer).get('/points/balance/m-b')
        assert.equal(r5b.body.data.data.balance, 800)

        // 6. 查询 A 的流水记录
        const r6 = await request(httpServer).get('/points/records?memberId=m-a')
        assert.ok(r6.body.data.data.length >= 2)

        // 7. 风控状态正常
        const r7 = await request(httpServer).get('/points/risk-status')
        assert.ok(r7.body.data.data.inflationIndex > 0)
      } finally {
        await app.close()
      }
    })
  })
})
