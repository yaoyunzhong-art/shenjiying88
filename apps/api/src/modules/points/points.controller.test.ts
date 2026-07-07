import { describe, it, expect, beforeEach } from 'vitest'
import { PointsController } from './points.controller'
import { PointsAtomicService, resetTestState } from './points-atomic.service'
import { PointsRiskService } from './points-risk.service'
import type { PointsTransactionDto, PointsTransferDto, PointsBatchAwardDto, PointsDeductDto } from './points.dto'

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

  // ================================================================== 正常流程

  describe('POST /points/transaction - 积分变动', () => {
    it('增加积分返回成功和余额', async () => {
      const dto: PointsTransactionDto = {
        memberId: 'm1',
        delta: 100,
        reason: '签到奖励',
        transactionId: 'tx_001'
      }

      const result = await controller.transaction(dto)
      expect(result.success).toBe(true)
      expect(result.data?.newBalance).toBe(100)
    })

    it('扣减积分返回成功和余额', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')
      const dto: PointsTransactionDto = {
        memberId: 'm1',
        delta: -50,
        reason: '兑换商品',
        transactionId: 'tx_002'
      }

      const result = await controller.transaction(dto)
      expect(result.success).toBe(true)
      expect(result.data?.newBalance).toBe(150)
    })
  })

  describe('POST /points/transfer - 积分转账', () => {
    it('成功转账并更新双方余额', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')
      await atomicService.incrementPointsAtomic('m2', 100, 'init')

      const dto: PointsTransferDto = {
        fromMemberId: 'm1',
        toMemberId: 'm2',
        amount: 50,
        reason: '好友转账',
        transactionId: 'tx_003'
      }

      const result = await controller.transfer(dto)
      expect(result.success).toBe(true)
      expect(result.data?.fromNewBalance).toBe(150)
      expect(result.data?.toNewBalance).toBe(150)
    })
  })

  describe('POST /points/deduct - 积分抵扣', () => {
    it('成功抵扣并标记幂等', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')

      const dto: PointsDeductDto = {
        memberId: 'm1',
        amount: 50,
        orderId: 'order_001',
        reason: '订单抵扣'
      }

      const result = await controller.deduct(dto)
      expect(result.success).toBe(true)
      expect(result.data?.newBalance).toBe(150)
      expect(result.data?.alreadyProcessed).toBe(false)
    })

    it('同一订单重复抵扣返回幂等结果', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')

      const dto: PointsDeductDto = {
        memberId: 'm1',
        amount: 50,
        orderId: 'order_001',
        reason: '订单抵扣'
      }

      await controller.deduct(dto)
      const result = await controller.deduct(dto)
      expect(result.success).toBe(true)
      expect(result.data?.alreadyProcessed).toBe(true)
    })
  })

  describe('POST /points/batch-award - 批量发放', () => {
    it('批量发放成功', async () => {
      const dto: PointsBatchAwardDto = {
        memberIds: ['m1', 'm2', 'm3'],
        pointsEach: 100,
        reason: '活动奖励',
        transactionId: 'tx_004'
      }

      const result = await controller.batchAward(dto)
      expect(result.success).toBe(true)
      expect(result.data?.awardedCount).toBe(3)

      expect(atomicService.getBalance('m1')).toBe(100)
      expect(atomicService.getBalance('m2')).toBe(100)
      expect(atomicService.getBalance('m3')).toBe(100)
    })
  })

  // ================================================================== 边界情况

  describe('POST /points/transaction - 边界', () => {
    it('余额不足扣减返回失败', async () => {
      // m1 余额为 0，扣减 100 应失败
      const dto: PointsTransactionDto = {
        memberId: 'm1',
        delta: -100,
        reason: '余额不足测试',
        transactionId: 'tx_fail'
      }

      const result = await controller.transaction(dto)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient balance')
    })
  })

  describe('POST /points/transfer - 边界', () => {
    it('余额不足转账失败', async () => {
      const dto: PointsTransferDto = {
        fromMemberId: 'm1',
        toMemberId: 'm2',
        amount: 100,
        reason: '余额不足',
        transactionId: 'tx_fail2'
      }

      const result = await controller.transfer(dto)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient balance for transfer')
    })

    it('自身转账失败', async () => {
      const dto: PointsTransferDto = {
        fromMemberId: 'm1',
        toMemberId: 'm1',
        amount: 50,
        reason: '自己转自己',
        transactionId: 'tx_fail3'
      }

      const result = await controller.transfer(dto)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot transfer to self')
    })
  })

  // ================================================================== 查询接口

  describe('GET /points/balance/:memberId', () => {
    it('查询积分余额', async () => {
      await atomicService.incrementPointsAtomic('m1', 300, 'init')
      const result = controller.getBalance('m1')
      expect(result.success).toBe(true)
      expect(result.data.balance).toBe(300)
    })

    it('未初始化会员返回 0', async () => {
      const result = controller.getBalance('nonexistent')
      expect(result.success).toBe(true)
      expect(result.data.balance).toBe(0)
    })
  })

  describe('GET /points/records', () => {
    it('查询有流水时返回记录', async () => {
      const dto: PointsTransactionDto = {
        memberId: 'm1',
        delta: 100,
        reason: '签到',
        transactionId: 'tx_rec'
      }
      await controller.transaction(dto)

      const query = { memberId: 'm1' } as any
      const result = controller.getRecords(query)
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThanOrEqual(1)
      expect(result.data[0].memberId).toBe('m1')
      expect(result.data[0].type).toBe('award')
    })
  })

  // ================================================================== 风控接口

  describe('GET /points/risk-status', () => {
    it('返回风控状态概览', async () => {
      const result = controller.getRiskStatus()
      expect(result.success).toBe(true)
      expect(result.data.inflationIndex).toBeDefined()
      expect(result.data.circuitStatuses).toHaveLength(3)
      expect(result.data.activeReminders).toBe(0)
    })
  })

  describe('POST /points/risk/schedule-reminder', () => {
    it('安排过期提醒成功', () => {
      const result = controller.scheduleReminder({
        memberId: 'm1',
        points: 100,
        expireAt: '2026-08-01T00:00:00Z'
      })
      expect(result.success).toBe(true)
      expect(result.message).toContain('m1')
    })

    it('缺少必填字段应抛错', () => {
      expect(() => controller.scheduleReminder({
        memberId: '',
        points: 100,
        expireAt: '2026-08-01T00:00:00Z'
      })).toThrow()
    })
  })

  describe('POST /points/risk/send-reminder', () => {
    it('发送过期提醒', () => {
      controller.scheduleReminder({
        memberId: 'm1',
        points: 100,
        expireAt: '2026-08-01T00:00:00Z'
      })

      const result = controller.sendReminder({ memberId: 'm1', points: 100 })
      expect(result.success).toBe(true)
      expect(result.sent).toBe(true)
    })
  })

  describe('POST /points/risk/reset', () => {
    it('重置风控状态', () => {
      // 先创建一些状态
      controller.sendReminder({ memberId: 'm1', points: 100 })

      const result = controller.resetRisk()
      expect(result.success).toBe(true)

      const status = controller.getRiskStatus()
      expect(status.data.activeReminders).toBe(0)
    })
  })
})
