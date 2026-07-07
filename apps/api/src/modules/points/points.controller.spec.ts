/**
 * points controller spec test
 * Tests controller routes with atomic service and risk service integration
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { PointsController } from './points.controller'
import { PointsAtomicService, resetTestState } from './points-atomic.service'
import { PointsRiskService } from './points-risk.service'
import type {
  PointsTransactionDto,
  PointsTransferDto,
  PointsBatchAwardDto,
  PointsDeductDto,
  PointsRecordQueryDto,
} from './points.dto'

describe('PointsController', () => {
  let controller: PointsController
  let atomicService: PointsAtomicService
  let riskService: PointsRiskService

  beforeEach(() => {
    resetTestState()
    atomicService = new PointsAtomicService()
    riskService = new PointsRiskService()
    controller = new PointsController(atomicService, riskService)
  })

  // =========================================================================
  // POST /points/transaction - 积分变动
  // =========================================================================

  describe('transaction (POST /points/transaction)', () => {
    it('should award points and return new balance on positive delta', async () => {
      const dto: PointsTransactionDto = {
        memberId: 'm1',
        delta: 200,
        reason: '签到奖励',
        transactionId: 'tx_award_01',
      }

      const result = await controller.transaction(dto)

      expect(result.success).toBe(true)
      expect(result.data!.newBalance).toBe(200)
    })

    it('should deduct points and return reduced balance on negative delta', async () => {
      await atomicService.incrementPointsAtomic('m1', 500, 'init')

      const dto: PointsTransactionDto = {
        memberId: 'm1',
        delta: -150,
        reason: '兑换商品',
        transactionId: 'tx_deduct_01',
      }

      const result = await controller.transaction(dto)

      expect(result.success).toBe(true)
      expect(result.data!.newBalance).toBe(350)
    })

    it('should return failure when balance insufficient for deduction', async () => {
      const dto: PointsTransactionDto = {
        memberId: 'm1',
        delta: -50,
        reason: '余额不足测试',
        transactionId: 'tx_insufficient',
      }

      const result = await controller.transaction(dto)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient balance')
    })

    it('should handle zero delta transaction as successful (no-op balance)', async () => {
      const dto: PointsTransactionDto = {
        memberId: 'm1',
        delta: 0,
        reason: '零值变动',
        transactionId: 'tx_zero',
      }

      const result = await controller.transaction(dto)

      expect(result.success).toBe(true)
      expect(result.data!.newBalance).toBe(0)
    })
  })

  // =========================================================================
  // POST /points/transfer - 积分转账
  // =========================================================================

  describe('transfer (POST /points/transfer)', () => {
    it('should complete transfer and update both parties balances', async () => {
      await atomicService.incrementPointsAtomic('m1', 300, 'init')
      await atomicService.incrementPointsAtomic('m2', 50, 'init')

      const dto: PointsTransferDto = {
        fromMemberId: 'm1',
        toMemberId: 'm2',
        amount: 100,
        reason: '好友间转账',
        transactionId: 'tf_ok_01',
      }

      const result = await controller.transfer(dto)

      expect(result.success).toBe(true)
      expect(result.data!.fromNewBalance).toBe(200)
      expect(result.data!.toNewBalance).toBe(150)
    })

    it('should fail when sender has insufficient balance', async () => {
      await atomicService.incrementPointsAtomic('m2', 500, 'init')

      const dto: PointsTransferDto = {
        fromMemberId: 'm1',
        toMemberId: 'm2',
        amount: 10,
        reason: '余额不足',
        transactionId: 'tf_insufficient',
      }

      const result = await controller.transfer(dto)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient balance for transfer')
    })

    it('should fail when transferring to self', async () => {
      await atomicService.incrementPointsAtomic('m1', 100, 'init')

      const dto: PointsTransferDto = {
        fromMemberId: 'm1',
        toMemberId: 'm1',
        amount: 50,
        reason: '自己转自己',
        transactionId: 'tf_self',
      }

      const result = await controller.transfer(dto)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot transfer to self')
    })

    it('should fail when amount is zero or negative', async () => {
      await atomicService.incrementPointsAtomic('m1', 100, 'init')
      await atomicService.incrementPointsAtomic('m2', 100, 'init')

      const dto: PointsTransferDto = {
        fromMemberId: 'm1',
        toMemberId: 'm2',
        amount: 0,
        reason: '零值转账',
        transactionId: 'tf_zero',
      }

      const result = await controller.transfer(dto)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // =========================================================================
  // POST /points/deduct - 积分抵扣（带幂等）
  // =========================================================================

  describe('deduct (POST /points/deduct)', () => {
    it('should deduct points and return new balance', async () => {
      await atomicService.incrementPointsAtomic('m1', 300, 'init')

      const dto: PointsDeductDto = {
        memberId: 'm1',
        amount: 120,
        orderId: 'order_alpha',
        reason: '订单抵扣',
      }

      const result = await controller.deduct(dto)

      expect(result.success).toBe(true)
      expect(result.data!.newBalance).toBe(180)
      expect(result.data!.alreadyProcessed).toBe(false)
    })

    it('should return idempotent alreadyProcessed for same order', async () => {
      await atomicService.incrementPointsAtomic('m1', 300, 'init')

      const dto: PointsDeductDto = {
        memberId: 'm1',
        amount: 120,
        orderId: 'order_alpha',
        reason: '订单抵扣',
      }

      await controller.deduct(dto)
      const result = await controller.deduct(dto)

      expect(result.success).toBe(true)
      expect(result.data!.alreadyProcessed).toBe(true)
    })

    it('should fail when balance is insufficient for deduction', async () => {
      await atomicService.incrementPointsAtomic('m1', 10, 'init')

      const dto: PointsDeductDto = {
        memberId: 'm1',
        amount: 100,
        orderId: 'order_beta',
        reason: '超额抵扣',
      }

      const result = await controller.deduct(dto)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // =========================================================================
  // POST /points/batch-award - 批量发放积分
  // =========================================================================

  describe('batchAward (POST /points/batch-award)', () => {
    it('should award points to multiple members', async () => {
      const dto: PointsBatchAwardDto = {
        memberIds: ['m1', 'm2', 'm3', 'm4'],
        pointsEach: 50,
        reason: '新会员活动',
        transactionId: 'batch_01',
      }

      const result = await controller.batchAward(dto)

      expect(result.success).toBe(true)
      expect(result.data!.awardedCount).toBe(4)
      expect(atomicService.getBalance('m1')).toBe(50)
      expect(atomicService.getBalance('m4')).toBe(50)
    })

    it('should return error for empty member list', async () => {
      const dto: PointsBatchAwardDto = {
        memberIds: [],
        pointsEach: 50,
        reason: '空列表测试',
        transactionId: 'batch_empty',
      }

      const result = await controller.batchAward(dto)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should fail on zero points each', async () => {
      const dto: PointsBatchAwardDto = {
        memberIds: ['m1'],
        pointsEach: 0,
        reason: '零积分发放',
        transactionId: 'batch_zero',
      }

      const result = await controller.batchAward(dto)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // =========================================================================
  // GET /points/balance/:memberId - 查询积分余额
  // =========================================================================

  describe('getBalance (GET /points/balance/:memberId)', () => {
    it('should return correct balance for existing member', async () => {
      await atomicService.incrementPointsAtomic('m1', 999, 'init')

      const result = controller.getBalance('m1')

      expect(result.success).toBe(true)
      expect(result.data.balance).toBe(999)
      expect(result.data.memberId).toBe('m1')
    })

    it('should return zero balance for new / non-existent member', async () => {
      const result = controller.getBalance('no_such_member')

      expect(result.success).toBe(true)
      expect(result.data.balance).toBe(0)
      expect(result.data.memberId).toBe('no_such_member')
    })
  })

  // =========================================================================
  // GET /points/records - 查询积分流水
  // =========================================================================

  describe('getRecords (GET /points/records)', () => {
    it('should return all records for a member', async () => {
      await controller.transaction({
        memberId: 'm1',
        delta: 100,
        reason: '签到',
        transactionId: 'rec_01',
      })
      await controller.transaction({
        memberId: 'm1',
        delta: 200,
        reason: '消费返利',
        transactionId: 'rec_02',
      })

      const query: PointsRecordQueryDto = { memberId: 'm1' }
      const result = controller.getRecords(query)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.data.every(r => r.memberId === 'm1')).toBe(true)
    })

    it('should filter records by type', async () => {
      await atomicService.incrementPointsAtomic('m1', 500, 'init')
      await controller.transaction({
        memberId: 'm1',
        delta: 100,
        reason: '奖励',
        transactionId: 'rec_type_01',
      })
      await controller.transaction({
        memberId: 'm1',
        delta: -50,
        reason: '兑换',
        transactionId: 'rec_type_02',
      })

      const query: PointsRecordQueryDto = { memberId: 'm1', type: 'redeem' }
      const result = controller.getRecords(query)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data[0].type).toBe('redeem')
    })

    it('should return empty array when no records match filter', async () => {
      const query: PointsRecordQueryDto = { memberId: 'ghost' }
      const result = controller.getRecords(query)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should paginate records correctly', async () => {
      for (let i = 0; i < 5; i++) {
        await controller.transaction({
          memberId: 'm1',
          delta: 10,
          reason: `签到#${i}`,
          transactionId: `rec_page_${i}`,
        })
      }

      const page1: PointsRecordQueryDto = { memberId: 'm1', page: 1, limit: 2 }
      const r1 = controller.getRecords(page1)
      expect(r1.data).toHaveLength(2)

      const page2: PointsRecordQueryDto = { memberId: 'm1', page: 2, limit: 2 }
      const r2 = controller.getRecords(page2)
      expect(r2.data).toHaveLength(2)

      const page3: PointsRecordQueryDto = { memberId: 'm1', page: 3, limit: 2 }
      const r3 = controller.getRecords(page3)
      expect(r3.data).toHaveLength(1)
    })
  })

  // =========================================================================
  // GET /points/risk-status - 获取风控状态
  // =========================================================================

  describe('getRiskStatus (GET /points/risk-status)', () => {
    it('should return default risk status with closed circuits', () => {
      const result = controller.getRiskStatus()

      expect(result.success).toBe(true)
      expect(typeof result.data.inflationIndex).toBe('number')
      expect(result.data.circuitStatuses).toHaveLength(3)
      result.data.circuitStatuses.forEach(cs => {
        expect(cs.state).toBe('closed')
        expect(cs.failures).toBe(0)
      })
      expect(result.data.activeReminders).toBe(0)
    })

    it('should return updated status after multiple transactions', async () => {
      // Issue many points to trigger inflation
      for (let i = 0; i < 5; i++) {
        await controller.transaction({
          memberId: 'm1',
          delta: 10000,
          reason: '批量发放',
          transactionId: `infl_tx_${i}`,
        })
      }

      const result = controller.getRiskStatus()
      expect(result.data.inflationIndex).toBeGreaterThan(0)
    })
  })

  // =========================================================================
  // POST /points/risk/reset - 重置风控状态
  // =========================================================================

  describe('resetRisk (POST /points/risk/reset)', () => {
    it('should reset all risk state to defaults', () => {
      // Prime some state
      controller.sendReminder({ memberId: 'm1', points: 50 })

      const resetResult = controller.resetRisk()
      expect(resetResult.success).toBe(true)

      const status = controller.getRiskStatus()
      expect(status.data.activeReminders).toBe(0)
      expect(status.data.recentAlerts).toHaveLength(0)
    })
  })

  // =========================================================================
  // POST /points/risk/schedule-reminder - 安排过期提醒
  // =========================================================================

  describe('scheduleReminder (POST /points/risk/schedule-reminder)', () => {
    it('should schedule a reminder for a member', () => {
      const result = controller.scheduleReminder({
        memberId: 'm1',
        points: 200,
        expireAt: '2026-07-15T00:00:00Z',
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('m1')
    })

    it('should throw BadRequestException when required fields are missing', () => {
      expect(() =>
        controller.scheduleReminder({
          memberId: '',
          points: 100,
          expireAt: '2026-07-15T00:00:00Z',
        })
      ).toThrow()
    })

    it('should throw for invalid expire date', () => {
      expect(() =>
        controller.scheduleReminder({
          memberId: 'm1',
          points: 100,
          expireAt: '',
        })
      ).toThrow()
    })
  })

  // =========================================================================
  // POST /points/risk/send-reminder - 手动发送提醒
  // =========================================================================

  describe('sendReminder (POST /points/risk/send-reminder)', () => {
    it('should send reminder for a scheduled expiration', () => {
      controller.scheduleReminder({
        memberId: 'm1',
        points: 150,
        expireAt: '2026-07-20T00:00:00Z',
      })

      const result = controller.sendReminder({ memberId: 'm1', points: 150 })

      expect(result.success).toBe(true)
      expect(result.sent).toBe(true)
    })

    it('should return sent=false when no matching reminder exists', () => {
      const result = controller.sendReminder({ memberId: 'ghost', points: 999 })

      expect(result.success).toBe(true)
      expect(result.sent).toBe(false)
    })
  })
})
