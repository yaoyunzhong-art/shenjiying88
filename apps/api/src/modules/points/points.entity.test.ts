import { describe, it, expect } from 'vitest'
import type {
  PointsRecord,
  PointsAccount,
  PointsRedemptionRule,
  PointsIssuanceRule,
  PointsTransactionRequest,
  PointsTransferRequest,
  PointsBatchAwardRequest,
  PointsOperationResult,
  PointsRiskOverview,
  RiskAlertRecord,
  PointsExpiryReminder,
  PointsStatistics
} from './points.entity'

describe('Points Entity Types', () => {
  describe('PointsRecord', () => {
    it('创建积分流水记录', () => {
      const record: PointsRecord = {
        id: 'rec_001',
        memberId: 'm1',
        type: 'award',
        delta: 100,
        balanceAfter: 200,
        reason: '签到奖励',
        transactionId: 'tx_001',
        createdAt: '2026-07-05T12:00:00Z'
      }

      expect(record.id).toBe('rec_001')
      expect(record.memberId).toBe('m1')
      expect(record.type).toBe('award')
      expect(record.delta).toBe(100)
      expect(record.balanceAfter).toBe(200)
      expect(record.reason).toBe('签到奖励')
      expect(record.transactionId).toBe('tx_001')
    })

    it('支持可选的 orderId 字段', () => {
      const withOrder: PointsRecord = {
        id: 'rec_002',
        memberId: 'm1',
        type: 'redeem',
        delta: -50,
        balanceAfter: 150,
        reason: '订单抵扣',
        orderId: 'order_001',
        transactionId: 'tx_002',
        createdAt: '2026-07-05T13:00:00Z'
      }

      expect(withOrder.orderId).toBe('order_001')

      const withoutOrder: PointsRecord = {
        id: 'rec_003',
        memberId: 'm2',
        type: 'award',
        delta: 200,
        balanceAfter: 200,
        reason: '推荐奖励',
        transactionId: 'tx_003',
        createdAt: '2026-07-05T14:00:00Z'
      }

      expect(withoutOrder.orderId).toBeUndefined()
    })
  })

  describe('PointsAccount', () => {
    it('创建积分账户', () => {
      const account: PointsAccount = {
        memberId: 'm1',
        balance: 500,
        totalEarned: 1000,
        totalSpent: 500,
        expiringPoints: 100,
        nextExpireDate: '2026-08-01',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-07-05T12:00:00Z'
      }

      expect(account.memberId).toBe('m1')
      expect(account.balance).toBe(500)
      expect(account.status).toBe('active')
      expect(account.expiringPoints).toBe(100)
    })

    it('支持冻结和关闭状态', () => {
      const frozen: PointsAccount = {
        memberId: 'm2',
        balance: 0,
        totalEarned: 200,
        totalSpent: 200,
        expiringPoints: 0,
        status: 'frozen',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z'
      }

      expect(frozen.status).toBe('frozen')

      const closed: PointsAccount = {
        memberId: 'm3',
        balance: 0,
        totalEarned: 500,
        totalSpent: 500,
        expiringPoints: 0,
        status: 'closed',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }

      expect(closed.status).toBe('closed')
    })
  })

  describe('PointsRedemptionRule', () => {
    it('创建积分兑换规则', () => {
      const rule: PointsRedemptionRule = {
        id: 'rule_001',
        name: '10元现金券',
        pointsRequired: 1000,
        rewardType: 'cash',
        rewardValue: 1000,
        dailyLimit: 3,
        perMemberLimit: 10,
        enabled: true,
        startAt: '2026-01-01T00:00:00Z',
        endAt: '2026-12-31T23:59:59Z'
      }

      expect(rule.name).toBe('10元现金券')
      expect(rule.pointsRequired).toBe(1000)
      expect(rule.enabled).toBe(true)
    })
  })

  describe('PointsIssuanceRule', () => {
    it('创建积分发放规则 - 签到类型', () => {
      const rule: PointsIssuanceRule = {
        id: 'issue_001',
        name: '每日签到',
        trigger: 'signin',
        pointsAmount: 10,
        dailyMax: 10,
        enabled: true
      }

      expect(rule.trigger).toBe('signin')
      expect(rule.pointsAmount).toBe(10)
    })

    it('创建积分发放规则 - 消费比例类型', () => {
      const rule: PointsIssuanceRule = {
        id: 'issue_002',
        name: '消费积分',
        trigger: 'purchase',
        pointsAmount: 0,
        rate: 0.01,
        singleMax: 1000,
        dailyMax: 5000,
        monthlyMax: 50000,
        enabled: true
      }

      expect(rule.rate).toBe(0.01)
      expect(rule.singleMax).toBe(1000)
    })
  })

  describe('Transaction Requests', () => {
    it('创建积分交易请求', () => {
      const req: PointsTransactionRequest = {
        memberId: 'm1',
        delta: 100,
        reason: '签到奖励',
        transactionId: 'tx_001'
      }

      expect(req.memberId).toBe('m1')
      expect(req.delta).toBe(100)
    })

    it('创建积分转账请求', () => {
      const req: PointsTransferRequest = {
        fromMemberId: 'm1',
        toMemberId: 'm2',
        amount: 50,
        reason: '好友转账',
        transactionId: 'tx_002'
      }

      expect(req.fromMemberId).toBe('m1')
      expect(req.toMemberId).toBe('m2')
      expect(req.amount).toBe(50)
    })

    it('创建批量发放请求', () => {
      const req: PointsBatchAwardRequest = {
        memberIds: ['m1', 'm2', 'm3'],
        pointsEach: 100,
        reason: '活动奖励',
        transactionId: 'tx_003'
      }

      expect(req.memberIds).toHaveLength(3)
      expect(req.pointsEach).toBe(100)
    })
  })

  describe('PointsRiskOverview', () => {
    it('创建风控总览', () => {
      const overview: PointsRiskOverview = {
        inflationIndex: 1.5,
        inflating: true,
        circuitStatuses: [
          { endpoint: 'transaction', state: 'closed', failures: 0, remainingMs: null }
        ],
        activeReminders: 3,
        recentAlerts: []
      }

      expect(overview.inflationIndex).toBe(1.5)
      expect(overview.inflating).toBe(true)
      expect(overview.activeReminders).toBe(3)
    })
  })

  describe('RiskAlertRecord', () => {
    it('创建风控告警记录', () => {
      const alert: RiskAlertRecord = {
        id: 'alert_001',
        type: 'inflation',
        level: 'warning',
        message: '通胀指数过高',
        threshold: 1.5,
        actual: 2.0,
        resolved: false,
        createdAt: '2026-07-05T12:00:00Z'
      }

      expect(alert.type).toBe('inflation')
      expect(alert.level).toBe('warning')
      expect(alert.actual).toBe(2.0)

      const resolved: RiskAlertRecord = {
        ...alert,
        id: 'alert_002',
        resolved: true,
        resolvedAt: '2026-07-05T13:00:00Z'
      }

      expect(resolved.resolved).toBe(true)
      expect(resolved.resolvedAt).toBe('2026-07-05T13:00:00Z')
    })
  })

  describe('PointsStatistics', () => {
    it('创建积分统计', () => {
      const stats: PointsStatistics = {
        totalMembers: 100,
        totalIssued: 50000,
        totalRedeemed: 20000,
        activeAccounts: 80,
        averageBalance: 300,
        issuanceTrend: [
          { date: '2026-07-01', amount: 10000 },
          { date: '2026-07-02', amount: 15000 }
        ],
        redemptionTrend: [
          { date: '2026-07-01', amount: 5000 },
          { date: '2026-07-02', amount: 8000 }
        ]
      }

      expect(stats.totalMembers).toBe(100)
      expect(stats.issuanceTrend).toHaveLength(2)
      expect(stats.redemptionTrend[0].amount).toBe(5000)
    })
  })
})
