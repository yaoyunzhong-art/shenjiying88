/**
 * points.service.test.ts - points.service.ts 单元测试
 *
 * 覆盖：
 *   - 积分交易编排（正常+风控预检拒绝）
 *   - 积分转账（正常+熔断降级）
 *   - 积分抵扣（正常+幂等）
 *   - 批量发放（正常+通胀风控拒绝）
 *   - 账户概览 & 统计
 *   - 流水查询
 *   - 规则管理
 *   - 风控接口
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PointsService, resetPointsServiceTestState } from './points.service'
import { PointsAtomicService, resetTestState as resetAtomicTestState } from './points-atomic.service'
import { PointsRiskService } from './points-risk.service'
import type { PointsIssuanceRule, PointsRedemptionRule } from './points.entity'

describe('PointsService', () => {
  let pointsService: PointsService
  let atomicService: PointsAtomicService
  let riskService: PointsRiskService

  beforeEach(() => {
    resetAtomicTestState()
    resetPointsServiceTestState()
    atomicService = new PointsAtomicService()
    riskService = new PointsRiskService()
    pointsService = new PointsService(atomicService, riskService)
  })

  // ========================================================================
  // 积分交易编排
  // ========================================================================

  describe('transaction() - 积分交易编排', () => {
    it('正常增加积分返回余额', async () => {
      const result = await pointsService.transaction('m1', 100, '签到奖励')
      expect(result.success).toBe(true)
      expect(result.data?.newBalance).toBe(100)
    })

    it('正常扣减积分返回余额', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')
      const result = await pointsService.transaction('m1', -50, '兑换商品')
      expect(result.success).toBe(true)
      expect(result.data?.newBalance).toBe(150)
    })

    it('余额不足返回失败', async () => {
      const result = await pointsService.transaction('m1', -100, '余额不足测试')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient balance')
    })

    it('通胀指数过高时拒绝发放积分', async () => {
      // 模拟高通胀场景：大量发放（> 1000 且无兑换）
      riskService.inflation.recordPointIssuance(2000, 'bulk_issue')
      const result = await pointsService.transaction('m1', 10, '通胀拒绝测试')
      expect(result.success).toBe(false)
      expect(result.error).toContain('通胀指数过高')
    })
  })

  // ========================================================================
  // 积分转账
  // ========================================================================

  describe('transfer() - 积分转账', () => {
    it('正常转账更新双方余额', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')
      await atomicService.incrementPointsAtomic('m2', 100, 'init')

      const result = await pointsService.transfer('m1', 'm2', 50, '好友转账')
      expect(result.success).toBe(true)
      expect(result.data?.fromNewBalance).toBe(150)
      expect(result.data?.toNewBalance).toBe(150)
    })

    it('余额不足转账失败', async () => {
      const result = await pointsService.transfer('m1', 'm2', 100, '余额不足')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient balance for transfer')
    })

    it('熔断开启时拒绝转账', async () => {
      // 模拟熔断：连续失败达到阈值
      await atomicService.incrementPointsAtomic('m1', 200, 'init')
      await atomicService.incrementPointsAtomic('m2', 100, 'init')

      // 模拟 5 次转账失败触发熔断
      for (let i = 0; i < 5; i++) {
        riskService.circuitBreaker.recordFailure('transfer')
      }

      const result = await pointsService.transfer('m1', 'm2', 10, '熔断测试')
      expect(result.success).toBe(false)
      expect(result.error).toContain('熔断')
    })
  })

  // ========================================================================
  // 积分抵扣
  // ========================================================================

  describe('deduct() - 积分抵扣', () => {
    it('正常抵扣并记录流水', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')

      const result = await pointsService.deduct('m1', 50, 'order_001', '订单抵扣')
      expect(result.success).toBe(true)
      expect(result.data?.newBalance).toBe(150)
      expect(result.data?.alreadyProcessed).toBe(false)
    })

    it('同一订单重复抵扣返回幂等结果', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')

      await pointsService.deduct('m1', 50, 'order_001', '订单抵扣')
      const result = await pointsService.deduct('m1', 50, 'order_001', '重复请求')
      expect(result.success).toBe(true)
      expect(result.data?.alreadyProcessed).toBe(true)
    })

    it('余额不足抵扣失败', async () => {
      const result = await pointsService.deduct('m1', 100, 'order_fail', '余额不足')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient balance')
    })

    it('熔断时拒绝抵扣', async () => {
      await atomicService.incrementPointsAtomic('m1', 200, 'init')
      for (let i = 0; i < 5; i++) {
        riskService.circuitBreaker.recordFailure('deduct')
      }

      const result = await pointsService.deduct('m1', 10, 'order_cb', '熔断测试')
      expect(result.success).toBe(false)
      expect(result.error).toContain('熔断')
    })
  })

  // ========================================================================
  // 批量发放
  // ========================================================================

  describe('batchAward() - 批量发放', () => {
    it('正常批量发放成功', async () => {
      const result = await pointsService.batchAward(['m1', 'm2', 'm3'], 100, '活动奖励')
      expect(result.success).toBe(true)
      expect(result.data?.awardedCount).toBe(3)

      expect(atomicService.getBalance('m1')).toBe(100)
      expect(atomicService.getBalance('m2')).toBe(100)
      expect(atomicService.getBalance('m3')).toBe(100)
    })

    it('通胀偏高且发放金额过大时拒绝', async () => {
      // 模拟高通胀（> 1000 totalIssued + Inflation > 1.8）
      riskService.inflation.recordPointIssuance(2000, 'bulk')
      const result = await pointsService.batchAward(['m1', 'm2', 'm3'], 5000, '大额发放')
      expect(result.success).toBe(false)
      expect(result.error).toContain('通胀')
    })
  })

  // ========================================================================
  // 会员积分概览
  // ========================================================================

  describe('getAccountOverview() - 账户概览', () => {
    it('返回账户信息和最近流水', async () => {
      await pointsService.transaction('m1', 200, '签到')
      await pointsService.transaction('m1', -50, '消费')

      const overview = await pointsService.getAccountOverview('m1')
      expect(overview.account.memberId).toBe('m1')
      expect(overview.account.balance).toBe(150)
      expect(overview.recentRecords.length).toBeGreaterThanOrEqual(2)
      expect(overview.riskStatus.inflationIndex).toBeDefined()
    })

    it('未初始化会员返回 0 余额', async () => {
      const overview = await pointsService.getAccountOverview('nonexistent')
      expect(overview.account.balance).toBe(0)
      expect(overview.recentRecords).toHaveLength(0)
    })
  })

  describe('getBalance() - 余额查询', () => {
    it('返回准确余额', async () => {
      await atomicService.incrementPointsAtomic('m1', 300, 'init')
      expect(pointsService.getBalance('m1')).toBe(300)
    })
  })

  // ========================================================================
  // 积分统计
  // ========================================================================

  describe('getStatistics() - 积分统计', () => {
    it('发送积分后统计包含发放数据', async () => {
      // 重置通胀状态（避免前序测试残留）
      riskService.inflation.reset()

      await pointsService.transaction('m1', 200, '签到', { transactionId: 'stats_s1' })
      await pointsService.transaction('m2', 100, '推荐', { transactionId: 'stats_s2' })

      const stats = await pointsService.getStatistics()
      expect(stats.totalIssued).toBe(300)
      expect(stats.totalRedeemed).toBe(0)
      expect(stats.totalMembers).toBeGreaterThanOrEqual(2)
      expect(stats.issuanceTrend.length).toBe(7)
    })

    it('按日期过滤统计数据', async () => {
      const stats = await pointsService.getStatistics({
        trendDays: 3
      })
      expect(stats.issuanceTrend.length).toBe(3)
    })
  })

  // ========================================================================
  // 流水查询
  // ========================================================================

  describe('queryRecords() - 流水查询', () => {
    it('按会员过滤流水', async () => {
      await pointsService.transaction('m1', 100, '签到')
      await pointsService.transaction('m2', 200, '推荐')

      const records = pointsService.queryRecords({ memberId: 'm1' })
      expect(records.length).toBe(1)
      expect(records[0].memberId).toBe('m1')
    })

    it('按类型过滤流水', async () => {
      await pointsService.transaction('m1', 100, '签到')
      await pointsService.transaction('m1', -50, '兑换')

      const awardRecords = pointsService.queryRecords({ memberId: 'm1', type: 'award' })
      expect(awardRecords.length).toBe(1)
      expect(awardRecords[0].type).toBe('award')
    })

    it('分页返回流水 - 独立测试环境', async () => {
      // 重置通胀
      riskService.inflation.reset()

      for (let i = 0; i < 10; i++) {
        await pointsService.transaction(`p_m1`, 10 * (i + 1), `交易${i}`, { transactionId: `pg_${i}` })
      }

      const page1 = pointsService.queryRecords({ memberId: 'p_m1', page: 1, limit: 3 })
      expect(page1.length).toBe(3)
    })
  })

  // ========================================================================
  // 规则管理
  // ========================================================================

  describe('createIssuanceRule() / getIssuanceRules()', () => {
    it('创建并返回发放规则', () => {
      const rule: PointsIssuanceRule = {
        id: '',
        name: '签到奖励',
        trigger: 'signin',
        pointsAmount: 10,
        enabled: true
      }

      const created = pointsService.createIssuanceRule(rule)
      expect(created.id).toBeDefined()
      expect(created.name).toBe('签到奖励')

      const rules = pointsService.getIssuanceRules()
      expect(rules.length).toBe(1)
    })
  })

  describe('createRedemptionRule() / getRedemptionRules()', () => {
    it('创建并返回兑换规则', () => {
      const rule: PointsRedemptionRule = {
        id: '',
        name: '10元优惠券',
        pointsRequired: 100,
        rewardType: 'cash',
        rewardValue: 1000,
        dailyLimit: 10,
        perMemberLimit: 1,
        enabled: true
      }

      const created = pointsService.createRedemptionRule(rule)
      expect(created.id).toBeDefined()
      expect(created.pointsRequired).toBe(100)

      const rules = pointsService.getRedemptionRules()
      expect(rules.length).toBe(1)
    })
  })

  // ========================================================================
  // 风控接口
  // ========================================================================

  describe('getRiskOverview() - 风控概览', () => {
    it('返回完整风控状态', () => {
      const overview = pointsService.getRiskOverview()
      expect(overview.inflationIndex).toBeDefined()
      expect(overview.circuitStatuses).toHaveLength(3)
      expect(overview.activeReminders).toBe(0)
    })
  })

  describe('scheduleReminder() - 安排提醒', () => {
    it('正常安排过期提醒', () => {
      const result = pointsService.scheduleReminder('m1', 100, new Date('2026-08-01'))
      expect(result.success).toBe(true)
      expect(result.message).toContain('m1')
    })

    it('参数无效时抛异常', () => {
      expect(() => pointsService.scheduleReminder('', 0, new Date())).toThrow()
    })
  })

  describe('sendReminder() - 发送提醒', () => {
    it('已安排提醒的会员可发送', () => {
      pointsService.scheduleReminder('m1', 100, new Date('2026-08-01'))
      const result = pointsService.sendReminder('m1', 100)
      expect(result.success).toBe(true)
      expect(result.sent).toBe(true)
    })

    it('未安排提醒的会员发送失败', () => {
      const result = pointsService.sendReminder('nonexistent', 100)
      expect(result.success).toBe(true)
      expect(result.sent).toBe(false)
    })
  })

  describe('resetRisk() - 重置风控', () => {
    it('重置后风控回归初始状态', () => {
      // 制造一些风控状态
      pointsService.scheduleReminder('m1', 100, new Date('2026-08-01'))
      pointsService.sendReminder('m1', 100)

      pointsService.resetRisk()
      const overview = pointsService.getRiskOverview()
      expect(overview.activeReminders).toBe(0)
    })
  })
})
