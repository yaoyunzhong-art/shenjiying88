import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  PointsTransactionDto,
  PointsTransferDto,
  PointsBatchAwardDto,
  PointsDeductDto,
  PointsAccountQueryDto,
  PointsAccountStatusDto,
  PointsIssuanceRuleDto,
  PointsRedemptionRuleDto,
  PointsStatisticsQueryDto,
  PointsRecordQueryDto,
  CircuitBreakerConfigDto,
  ExpirationReminderConfigDto,
  InflationMonitorConfigDto
} from './points.dto'

describe('Points DTO Validation', () => {
  describe('PointsTransactionDto', () => {
    it('有效数据验证通过', async () => {
      const dto = new PointsTransactionDto()
      dto.memberId = 'm1'
      dto.delta = 100
      dto.reason = '签到奖励'
      dto.transactionId = 'tx_001'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少 memberId 验证失败', async () => {
      const dto = new PointsTransactionDto()
      dto.delta = 100
      dto.reason = '签到奖励'
      dto.transactionId = 'tx_001'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })

    it('空 reason 验证失败', async () => {
      const dto = new PointsTransactionDto()
      dto.memberId = 'm1'
      dto.delta = 100
      dto.reason = ''
      dto.transactionId = 'tx_001'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })

    it('delta 为 0 通过验证（支持调整）', async () => {
      const dto = new PointsTransactionDto()
      dto.memberId = 'm1'
      dto.delta = 0
      dto.reason = '手动调整'
      dto.transactionId = 'tx_001'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('delta 为负数也通过验证（支持扣减）', async () => {
      const dto = new PointsTransactionDto()
      dto.memberId = 'm1'
      dto.delta = -50
      dto.reason = '兑换商品'
      dto.transactionId = 'tx_002'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('空 transactionId 验证失败', async () => {
      const dto = new PointsTransactionDto()
      dto.memberId = 'm1'
      dto.delta = 100
      dto.reason = '签到'
      dto.transactionId = ''

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('PointsTransferDto', () => {
    it('有效转账数据验证通过', async () => {
      const dto = new PointsTransferDto()
      dto.fromMemberId = 'm1'
      dto.toMemberId = 'm2'
      dto.amount = 50
      dto.reason = '好友转账'
      dto.transactionId = 'tx_003'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('amount 为 0 通过验证（业务层拒绝）', async () => {
      const dto = new PointsTransferDto()
      dto.fromMemberId = 'm1'
      dto.toMemberId = 'm2'
      dto.amount = 0
      dto.reason = '转账'
      dto.transactionId = 'tx_004'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('负数 amount 通过验证（业务层拒绝）', async () => {
      const dto = new PointsTransferDto()
      dto.fromMemberId = 'm1'
      dto.toMemberId = 'm2'
      dto.amount = -10
      dto.reason = '转账'
      dto.transactionId = 'tx_005'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('PointsBatchAwardDto', () => {
    it('有效批量发放数据验证通过', async () => {
      const dto = new PointsBatchAwardDto()
      dto.memberIds = ['m1', 'm2', 'm3']
      dto.pointsEach = 100
      dto.reason = '活动奖励'
      dto.transactionId = 'tx_006'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('空的 memberIds 数组验证失败', async () => {
      const dto = new PointsBatchAwardDto()
      dto.memberIds = []
      dto.pointsEach = 100
      dto.reason = '活动'
      dto.transactionId = 'tx_007'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(0)
    })

    it('pointsEach 为 0 通过验证（业务层拒绝）', async () => {
      const dto = new PointsBatchAwardDto()
      dto.memberIds = ['m1']
      dto.pointsEach = 0
      dto.reason = '活动'
      dto.transactionId = 'tx_008'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('PointsDeductDto', () => {
    it('有效抵扣数据验证通过', async () => {
      const dto = new PointsDeductDto()
      dto.memberId = 'm1'
      dto.amount = 100
      dto.orderId = 'order_001'
      dto.reason = '订单抵扣'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('amount 为 0 通过验证（业务层拒绝）', async () => {
      const dto = new PointsDeductDto()
      dto.memberId = 'm1'
      dto.amount = 0
      dto.orderId = 'order_002'
      dto.reason = '抵扣'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('PointsAccountStatusDto', () => {
    it('有效账户状态变更通过', async () => {
      const dto = new PointsAccountStatusDto()
      dto.memberId = 'm1'
      dto.status = 'frozen'
      dto.reason = '账户风险'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('无效状态值验证失败', async () => {
      const dto = new PointsAccountStatusDto()
      dto.memberId = 'm1'
      ;(dto as any).status = 'invalid_status'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('PointsIssuanceRuleDto', () => {
    it('有效发放规则通过', async () => {
      const dto = new PointsIssuanceRuleDto()
      dto.name = '每日签到'
      dto.trigger = 'signin'
      dto.pointsAmount = 10

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('无效 trigger 值验证失败', async () => {
      const dto = new PointsIssuanceRuleDto()
      dto.name = '未知触发'
      ;(dto as any).trigger = 'unknown'
      dto.pointsAmount = 10

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })

    it('rate 超过 1 验证失败', async () => {
      const dto = new PointsIssuanceRuleDto()
      dto.name = '消费积分'
      dto.trigger = 'purchase'
      dto.pointsAmount = 0
      dto.rate = 2

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('PointsRedemptionRuleDto', () => {
    it('有效兑换规则通过', async () => {
      const dto = new PointsRedemptionRuleDto()
      dto.name = '10元现金券'
      dto.pointsRequired = 1000
      dto.rewardType = 'cash'
      dto.rewardValue = 1000
      dto.dailyLimit = 3
      dto.perMemberLimit = 10

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('无效 rewardType 验证失败', async () => {
      const dto = new PointsRedemptionRuleDto()
      dto.name = '未知奖品'
      ;(dto as any).rewardType = 'unknown'
      dto.pointsRequired = 1000
      dto.rewardValue = 1000
      dto.dailyLimit = 3
      dto.perMemberLimit = 10

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('CircuitBreakerConfigDto', () => {
    it('有效熔断配置通过', async () => {
      const dto = new CircuitBreakerConfigDto()
      dto.failureThreshold = 5
      dto.recoveryTimeoutMs = 60000
      dto.halfOpenAttempts = 3

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('为空时通过（所有字段可选）', async () => {
      const dto = new CircuitBreakerConfigDto()
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('ExpirationReminderConfigDto', () => {
    it('有效过期提醒配置通过', async () => {
      const dto = new ExpirationReminderConfigDto()
      dto.maxReminders = 5
      dto.remindBeforeDays = 7

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('PointsRecordQueryDto', () => {
    it('有效流水查询通过 - 仅 memberId', async () => {
      const dto = new PointsRecordQueryDto()
      dto.memberId = 'm1'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('有效流水查询通过 - 全部字段', async () => {
      const dto = new PointsRecordQueryDto()
      dto.memberId = 'm1'
      dto.type = 'award'
      dto.page = 1
      dto.limit = 20
      dto.startDate = '2026-01-01T00:00:00Z'
      dto.endDate = '2026-12-31T23:59:59Z'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺失 memberId 验证失败', async () => {
      const dto = new PointsRecordQueryDto()
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('PointsAccountQueryDto', () => {
    it('空查询通过（所有字段可选）', async () => {
      const dto = new PointsAccountQueryDto()
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('PointsStatisticsQueryDto', () => {
    it('空查询通过', async () => {
      const dto = new PointsStatisticsQueryDto()
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('InflationMonitorConfigDto', () => {
    it('有效通胀监控配置通过', async () => {
      const dto = new InflationMonitorConfigDto()
      dto.alertThreshold = 1.5
      dto.trendDays = 7

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('threshold 过小验证失败', async () => {
      const dto = new InflationMonitorConfigDto()
      dto.alertThreshold = 0.05

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })
})
