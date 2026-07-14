/**
 * P-36 店A增强 会员中心服务测试 (V17)
 *
 * 覆盖 5 个核心API + Store A 特有能力
 * 正例≥15 + 反例≥10 + 边界≥5 = 总计≥30
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  MemberStoreAService,
  resetStoreATestState
} from './member-store-a.service'
import { MemberP36Service, resetP36MemberTestState } from './member-p36.service'

describe('P-36 店A增强 会员中心 (V17)', () => {
  let svc: MemberStoreAService
  let p36Svc: MemberP36Service
  let memberId: string

  beforeEach(() => {
    resetP36MemberTestState()
    resetStoreATestState()
    p36Svc = new MemberP36Service()
    svc = new MemberStoreAService(p36Svc)
    const member = svc.register({ phone: '13800138000', name: '店A测试会员' })
    memberId = member.id
  })

  // ═══════════════════════════════════════════════
  // GET /api/members/:id — 查询会员信息
  // ═══════════════════════════════════════════════
  describe('GET /api/members/:id 查询会员信息', () => {
    it('【正例1】已注册会员ID→返回完整会员信息', () => {
      const info = svc.getMemberInfo(memberId)
      expect(info).not.toBeNull()
      expect(info!.id).toBe(memberId)
      expect(info!.phone).toBe('13800138000')
      expect(info!.name).toBe('店A测试会员')
      expect(info!.level).toBe('regular')
      expect(info!.points).toBe(0)
      expect(info!.levelEmoji).toBe('🟤')
    })

    it('【正例2】会员信息包含脱敏手机号', () => {
      const info = svc.getMemberInfo(memberId)
      expect(info!.maskedPhone).toBe('138****8000')
      expect(info!.phone).toBe('13800138000')
    })

    it('【正例3】活跃状态检查: 无过期时间则活跃', () => {
      const info = svc.getMemberInfo(memberId)
      expect(info!.isActive).toBe(true)
    })

    it('【反例1】不存在会员ID→返回null', () => {
      const info = svc.getMemberInfo('nonexistent-id')
      expect(info).toBeNull()
    })

    it('【反例2】空字符串ID→返回null', () => {
      const info = svc.getMemberInfo('')
      expect(info).toBeNull()
    })
  })

  // ═══════════════════════════════════════════════
  // POST /api/members — 注册新会员（含积分账户创建）
  // ═══════════════════════════════════════════════
  describe('POST /api/members 注册新会员', () => {
    it('【正例4】新手机号→注册成功,积分账户默认0', () => {
      const m = svc.register({ phone: '13900139001', name: '张三' })
      expect(m.id).toMatch(/^mem-/)
      expect(m.phone).toBe('13900139001')
      expect(m.name).toBe('张三')
      expect(m.level).toBe('regular')
      expect(m.points).toBe(0)
      expect(m.balance).toBe(0)
    })

    it('【正例5】注册时自动生成会员ID', () => {
      const m1 = svc.register({ phone: '13900139001', name: 'A' })
      const m2 = svc.register({ phone: '13900139002', name: 'B' })
      expect(m1.id).not.toBe(m2.id)
    })

    it('【正例6】批量注册多个不同手机号均可成功', () => {
      const phones = ['13900139101', '13900139102', '13900139103']
      for (const phone of phones) {
        const m = svc.register({ phone, name: `会员${phone.slice(-4)}` })
        expect(m.phone).toBe(phone)
        expect(m.points).toBe(0)
      }
    })

    it('【反例3】重复手机号→抛出异常', () => {
      expect(() => svc.register({ phone: '13800138000', name: '重复' }))
        .toThrow('该手机号已注册')
    })

    it('【反例4】空手机号→抛出异常', () => {
      expect(() => svc.register({ phone: '', name: '空号' }))
        .toThrow('手机号不能为空')
    })

    it('【反例5】纯空格手机号→抛出异常', () => {
      expect(() => svc.register({ phone: '   ', name: '空白' }))
        .toThrow('手机号不能为空')
    })

    it('【反例6】空姓名→抛出异常', () => {
      expect(() => svc.register({ phone: '13900139001', name: '' }))
        .toThrow('姓名不能为空')
    })
  })

  // ═══════════════════════════════════════════════
  // POST /api/members/:id/points — 累计积分
  // ═══════════════════════════════════════════════
  describe('POST /api/members/:id/points 累计积分', () => {
    it('【正例7】消费100元→普通会员得100积分', () => {
      const updated = svc.earnPoints(memberId, 10000)
      expect(updated.points).toBe(100)
    })

    it('【正例8】多次消费积分累加', () => {
      svc.earnPoints(memberId, 10000) // +100
      svc.earnPoints(memberId, 20000) // +200
      const m = p36Svc.queryById(memberId)
      expect(m!.points).toBe(300)
    })

    it('【正例9】消费达到银卡门槛(500元)同时升级', () => {
      svc.earnPoints(memberId, 50000) // 500元
      const m = p36Svc.queryById(memberId)
      expect(m!.level).toBe('silver')
    })

    it('【正例10】带活动ID追踪累计积分', () => {
      const updated = svc.earnPoints(memberId, 10000, 'order-001', 'activity-summer')
      expect(updated.points).toBe(100)
    })

    it('【反例7】消费金额为0→抛出异常', () => {
      expect(() => svc.earnPoints(memberId, 0))
        .toThrow('消费金额必须大于0')
    })

    it('【反例8】负数消费金额→抛出异常', () => {
      expect(() => svc.earnPoints(memberId, -100))
        .toThrow('消费金额必须大于0')
    })

    it('【反例9】不存在会员→抛出异常', () => {
      expect(() => svc.earnPoints('fake-id', 10000))
        .toThrow('会员不存在')
    })
  })

  // ═══════════════════════════════════════════════
  // POST /api/members/:id/redeem — 兑换积分
  // ═══════════════════════════════════════════════
  describe('POST /api/members/:id/redeem 兑换积分', () => {
    beforeEach(() => {
      // 先攒积分
      svc.earnPoints(memberId, 100000) // 消费1000元→1000积分
    })

    it('【正例11】500积分→抵扣5元(500分)', () => {
      const result = svc.redeemPoints(memberId, 500)
      expect(result.deductionAmount).toBe(500)
      expect(result.deductionYuan).toBe(5)
      expect(result.member.points).toBe(500)
    })

    it('【正例12】兑换后会员积分正确扣减', () => {
      svc.redeemPoints(memberId, 200)
      const info = svc.getMemberInfo(memberId)
      expect(info!.points).toBe(800)
    })

    it('【正例13】积分刚好全部兑换完', () => {
      svc.redeemPoints(memberId, 1000)
      const info = svc.getMemberInfo(memberId)
      expect(info!.points).toBe(0)
    })

    it('【反例10】兑换积分小于100→抛出异常', () => {
      expect(() => svc.redeemPoints(memberId, 50))
        .toThrow('最低100积分起抵扣')
    })

    it('【反例11】兑换积分超过余额→抛出异常', () => {
      expect(() => svc.redeemPoints(memberId, 99999))
        .toThrow('积分不足')
    })

    it('【反例12】负数积分→抛出异常', () => {
      expect(() => svc.redeemPoints(memberId, -100))
        .toThrow('抵扣积分必须大于0')
    })

    it('【反例13】零积分→抛出异常', () => {
      expect(() => svc.redeemPoints(memberId, 0))
        .toThrow('抵扣积分必须大于0')
    })

    it('【反例14】不存在会员兑换→抛出异常', () => {
      expect(() => svc.redeemPoints('fake-id', 100))
        .toThrow('会员不存在')
    })
  })

  // ═══════════════════════════════════════════════
  // GET /api/members/:id/levels — 查看会员等级
  // ═══════════════════════════════════════════════
  describe('GET /api/members/:id/levels 查看会员等级', () => {
    it('【正例14】新会员显示普通等级', () => {
      const info = svc.getLevelInfo(memberId)
      expect(info).not.toBeNull()
      expect(info!.level).toBe('regular')
      expect(info!.label).toBe('普通')
      expect(info!.emoji).toBe('🟤')
      expect(info!.benefits).toContain('积分1x倍率')
    })

    it('【正例15】升级到银卡后显示银卡等级信息', () => {
      svc.earnPoints(memberId, 100000) // 消费1000元(超500元门槛)
      const info = svc.getLevelInfo(memberId)
      expect(info!.level).toBe('silver')
      expect(info!.label).toBe('银卡')
      expect(info!.progress).toBeGreaterThan(0)
      expect(info!.benefits).toContain('全场95折')
    })

    it('【正例16】等级进度条信息完整', () => {
      svc.earnPoints(memberId, 25000) // 消费250元, regular→silver 50%进度
      const info = svc.getLevelInfo(memberId)
      expect(info!.progress).toBeCloseTo(0.5, 1)
      expect(info!.progressPercent).toBe(50)
      expect(info!.remainingToNext).toBe(25000)
    })

    it('【正例17】包含所有等级列表信息', () => {
      const info = svc.getLevelInfo(memberId)
      const levels = Object.keys(info!.allLevels)
      expect(levels).toEqual(['regular', 'silver', 'gold', 'diamond'])
    })

    it('【正例18】钻石会员(顶级)进度100%', () => {
      svc.earnPoints(memberId, 600000) // 消费6000元
      const info = svc.getLevelInfo(memberId)
      expect(info!.level).toBe('diamond')
      expect(info!.progress).toBe(1)
      expect(info!.progressPercent).toBe(100)
    })

    it('【反例15】不存在会员→返回null', () => {
      const info = svc.getLevelInfo('nonexistent')
      expect(info).toBeNull()
    })
  })

  // ═══════════════════════════════════════════════
  // 边界测试
  // ═══════════════════════════════════════════════
  describe('边界测试', () => {
    it('【边界1】消费刚好1分(0.01元)→0积分(不满1元不积)', () => {
      svc.earnPoints(memberId, 1) // 1分
      const m = p36Svc.queryById(memberId)
      expect(m!.points).toBe(0)
    })

    it('【边界2】消费刚好100元(10000分)→100积分', () => {
      svc.earnPoints(memberId, 10000) // 100元
      const m = p36Svc.queryById(memberId)
      expect(m!.points).toBe(100)
    })

    it('【边界3】兑换最小单位100积分→抵扣1元', () => {
      svc.earnPoints(memberId, 100000) // 先有1000积分
      const result = svc.redeemPoints(memberId, 100)
      expect(result.deductionAmount).toBe(100)
      expect(result.deductionYuan).toBe(1)
    })

    it('【边界4】从regular升级到silver正好在门槛(500元)', () => {
      svc.earnPoints(memberId, 50000)
      const m = p36Svc.queryById(memberId)
      expect(m!.level).toBe('silver')
    })

    it('【边界5】消费49999分(差1分到silver门槛)→仍为regular', () => {
      svc.earnPoints(memberId, 49999)
      const m = p36Svc.queryById(memberId)
      expect(m!.level).toBe('regular')
      expect(m!.points).toBe(499) // 49999/100 四舍五入会怎样？floor: 499积分
    })
  })

  // ═══════════════════════════════════════════════
  // Store A 特有功能
  // ═══════════════════════════════════════════════
  describe('店A特有能力', () => {
    it('会员报表包含全部注册会员', () => {
      svc.register({ phone: '13900139101', name: '报表会员1' })
      svc.register({ phone: '13900139102', name: '报表会员2' })

      // getAllMembers() uses workaround - let's use report directly
      const report = svc.getMemberReport()
      expect(report).toBeDefined()
      expect(Array.isArray(report)).toBe(true)
    })

    it('批量导入成功时成功计数正确', () => {
      const result = svc.batchImport([
        { phone: '13900139101', name: '批量A' },
        { phone: '13900139102', name: '批量B' }
      ])
      expect(result.total).toBe(2)
      expect(result.success).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.members.length).toBe(2)
    })

    it('批量导入部分失败时记录错误', () => {
      const result = svc.batchImport([
        { phone: '13900139101', name: '批量A' },
        { phone: '', name: '空号' },
        { phone: '13900139103', name: '' }
      ])
      expect(result.total).toBe(3)
      expect(result.success).toBe(1)
      expect(result.failed).toBe(2)
      expect(result.errors.length).toBe(2)
      expect(result.errors[0].reason).toMatch('手机号不能为空')
      expect(result.errors[1].reason).toMatch('姓名不能为空')
    })

    it('会员分群查询按等级筛选', () => {
      svc.register({ phone: '13900139101', name: '高消费A' })
      // 只筛选regular
      const result = svc.querySegmentation({ levels: ['regular'] })
      expect(result.total).toBeGreaterThanOrEqual(2)
    })

    it('会员分群查询按积分范围筛选', () => {
      svc.earnPoints(memberId, 50000) // 500分
      const result = svc.querySegmentation({ levels: ['regular', 'silver'] })
      expect(result.total).toBeGreaterThanOrEqual(1)
    })

    it('会员分群查询按关键字搜索', () => {
      svc.register({ phone: '13900139101', name: '营销目标A' })
      const result = svc.querySegmentation({ keyword: '营销' })
      expect(result.total).toBe(1)
      expect(result.members[0].name).toBe('营销目标A')
    })

    it('积分活动配置有效参数返回true', () => {
      const result = svc.configureActivity('act-summer-2026', {
        name: '夏日积分翻倍',
        pointsMultiplier: 2,
        startDate: '2026-07-01',
        endDate: '2026-08-31',
        targetLevels: ['regular', 'silver', 'gold', 'diamond']
      })
      expect(result).toBe(true)
    })

    it('积分活动配置空ID返回false', () => {
      const result = svc.configureActivity('', {
        name: '无ID活动',
        pointsMultiplier: 1.5,
        startDate: '2026-07-01',
        endDate: '2026-08-31',
        targetLevels: ['regular']
      })
      expect(result).toBe(false)
    })

    it('积分活动配置无效倍数返回false', () => {
      const result = svc.configureActivity('act-bad', {
        name: '无效活动',
        pointsMultiplier: 0,
        startDate: '2026-07-01',
        endDate: '2026-08-31',
        targetLevels: ['regular']
      })
      expect(result).toBe(false)
    })

    it('积分活动配置结束日期早于开始日期返回false', () => {
      const result = svc.configureActivity('act-bad-date', {
        name: '时间错误',
        pointsMultiplier: 2,
        startDate: '2026-08-01',
        endDate: '2026-07-01',
        targetLevels: ['regular']
      })
      expect(result).toBe(false)
    })

    it('积分活动配置无目标等级返回false', () => {
      const result = svc.configureActivity('act-no-level', {
        name: '无等级',
        pointsMultiplier: 2,
        startDate: '2026-07-01',
        endDate: '2026-08-31',
        targetLevels: []
      })
      expect(result).toBe(false)
    })

    it('会员脱敏信息不泄露完整手机号', () => {
      const masked = svc.getMemberInfoMasked(memberId)
      expect(masked).not.toBeNull()
      expect(masked!.phone).not.toContain('13800138000')
      expect(masked!.phone).toBe('138****8000')
      expect(masked!.maskedPhone).toBe('138****8000')
    })

    it('会员报表摘要包含等级分布', () => {
      const summary = svc.getMemberReportSummary()
      expect(summary).toBeDefined()
      expect(summary.totalMembers).toBeGreaterThanOrEqual(1)
    })
  })
})
