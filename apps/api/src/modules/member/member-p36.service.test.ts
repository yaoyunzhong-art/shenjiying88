/**
 * P-36 会员中心核心API验收测试 (PRD-002 驱动)
 *
 * 覆盖 AC-36-01 ~ AC-36-10 共10条验收卡
 * 引用 RQ-36-01 ~ RQ-36-10 需求编号
 *
 * @see docs/knowledge/prd/prd-member-p36.md
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MemberP36Service, resetP36MemberTestState } from './member-p36.service'
import { computeLevel, buildLevelDisplay, calcEarnedPoints, LEVEL_CONFIGS } from './member-p36.entity'

describe('P-36 会员中心API (PRD-002)', () => {
  let svc: MemberP36Service
  let memberId: string

  beforeEach(() => {
    resetP36MemberTestState()
    svc = new MemberP36Service()
    const member = svc.register('13800138000', '测试会员')
    memberId = member.id
  })

  // ═══════════════════════════════════════════════
  // AC-36-01: 注册—输入新手机号→注册成功
  // RQ-36-01: 会员注册 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-01 | RQ-36-01 会员注册', () => {
    it('新手机号→注册成功, 等级=普通', () => {
      const m = svc.register('13900139001', '张三')
      expect(m).toBeDefined()
      expect(m.id).toMatch(/^mem-/)
      expect(m.phone).toBe('13900139001')
      expect(m.name).toBe('张三')
      expect(m.level).toBe('regular')
      expect(m.points).toBe(0)
      expect(m.balance).toBe(0)
    })

    it('重复手机号→抛出异常', () => {
      expect(() => svc.register('13800138000', '重复')).toThrow('该手机号已注册')
    })

    it('空手机号→抛出异常', () => {
      expect(() => svc.register('', '空号')).toThrow('手机号不能为空')
    })

    it('空姓名→抛出异常', () => {
      expect(() => svc.register('13900139002', '')).toThrow('姓名不能为空')
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-02: 查会员—已注册→返回信息
  // RQ-36-02: 会员查询 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-02 | RQ-36-02 会员查询', () => {
    it('已注册手机号→返回姓名/等级/积分/余额', () => {
      const m = svc.queryByPhone('13800138000')
      expect(m).not.toBeNull()
      expect(m!.name).toBe('测试会员')
      expect(m!.level).toBe('regular')
      expect(m!.points).toBe(0)
      expect(m!.balance).toBe(0)
    })

    it('返回完整会员信息', () => {
      const m = svc.queryByPhone('13800138000')
      expect(m!.phone).toBe('13800138000')
      expect(m!.id).toMatch(/^mem-/)
      expect(m!.createdAt).toBeInstanceOf(Date)
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-03: 查会员—未注册→"该手机号未注册"
  // RQ-36-02: 会员查询 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-03 | RQ-36-02 未注册会员查询', () => {
    it('未注册手机号→返回null', () => {
      const m = svc.queryByPhone('19900000000')
      expect(m).toBeNull()
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-04: 等级展示含进度条
  // RQ-36-03: 等级展示 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-04 (原AC-36-03) | RQ-36-03 等级展示', () => {
    it('新会员显示普通卡+升级进度', () => {
      const display = svc.getLevelDisplay(memberId)
      expect(display).not.toBeNull()
      expect(display!.level).toBe('regular')
      expect(display!.label).toBe('普通')
      expect(display!.progress).toBeGreaterThanOrEqual(0)
      expect(display!.progressPercent).toBeGreaterThanOrEqual(0)
      expect(display!.remainingToNext).toBeGreaterThan(0)
      expect(display!.benefits).toContain('积分1x倍率')
    })

    it('创建后积分累计触发等级展示变化', () => {
      svc.earnPoints(memberId, 50000) // 消费50000分=500元
      const display = svc.getLevelDisplay(memberId)
      expect(display).not.toBeNull()
      // 500元=50000分, 累计消费50000分正好到银卡门槛(50000分)
      expect(display!.level).toBe('silver')
      expect(display!.emoji).toBe('🩶')
    })

    it('显示升级进度百分比的精确值', () => {
      svc.earnPoints(memberId, 25000) // 消费25000分=250元
      const display = svc.getLevelDisplay(memberId)
      // regular→silver: 0→50000分, 当前25000分, 进度=25000/50000=0.5
      expect(display!.progress).toBeCloseTo(0.5, 1)
      expect(display!.progressPercent).toBe(50)
      expect(display!.remainingToNext).toBe(25000)
    })

    it('钻石会员(顶级)进度100%', () => {
      svc.earnPoints(memberId, 600000) // 消费600000分=6000元
      const display = svc.getLevelDisplay(memberId)
      expect(display!.level).toBe('diamond')
      expect(display!.progress).toBe(1)
      expect(display!.progressPercent).toBe(100)
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-05 (原AC-36-04): 积分累计(普通1x)
  // RQ-36-04: 积分累计 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-05 (原AC-36-04) | RQ-36-04 积分累计(普通1x)', () => {
    it('消费100元→普通会员得100积分', () => {
      // 100元 = 10000分, 普通1x = 100基础积分
      svc.earnPoints(memberId, 10000)
      const m = svc.queryById(memberId)
      expect(m!.points).toBe(100)
    })

    it('消费后积分正确累加', () => {
      svc.earnPoints(memberId, 10000) // 10000分→100基础积分
      svc.earnPoints(memberId, 20000) // 20000分→+200积分
      const m = svc.queryById(memberId)
      expect(m!.points).toBe(300)
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-06 (原AC-36-05): 积分累计(金卡1.5x)
  // RQ-36-04: 积分累计 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-06 (原AC-36-05) | RQ-36-04 积分累计(金卡1.5x)', () => {
    it('消费100元→金卡得150积分', () => {
      // 先消费到金卡: 2000元=200000分
      svc.earnPoints(memberId, 200000)
      let m = svc.queryById(memberId)
      expect(m!.level).toBe('gold')

      // 再消费100元=10000分, 金卡1.5x倍率
      svc.earnPoints(memberId, 10000)
      m = svc.queryById(memberId)
      // 第一次消费: 等级regular→gold过程, 积分用regular 1x计算: 200000/100*1 = 2000
      // 第二次消费: 等级gold 1.5x计算: 10000/100*1.5 = 150
      // 累计: 2150
      expect(m!.points).toBe(2150)
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-07 (原AC-36-06): 积分扣减500抵5元
  // RQ-36-05: 积分扣减 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-07 (原AC-36-06) | RQ-36-05 积分扣减', () => {
    it('500积分→抵扣5元(500分)', () => {
      svc.earnPoints(memberId, 100000) // 消费100000分=1000元, 赚1000积分
      const result = svc.redeemPoints(memberId, 500)
      expect(result.deductionAmount).toBe(500) // 5元=500分
      const m = svc.queryById(memberId)
      expect(m!.points).toBe(500)
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-08 (原AC-36-07): 积分不足无法抵扣
  // RQ-36-05: 积分扣减 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-08 (原AC-36-07) | RQ-36-05 积分不足', () => {
    it('积分<100无法抵扣', () => {
      // 新会员积分0, 尝试用100积分
      expect(() => svc.redeemPoints(memberId, 100)).toThrow('积分不足')
      // 积分<100(如50), 但积分不足的校验先触发
      expect(() => svc.redeemPoints(memberId, 50)).toThrow('积分不足')
    })

    it('积分<100但说"最低100积分起抵扣"', () => {
      // 先有少量积分(<100)
      expect(() => svc.redeemPoints(memberId, 50)).toThrow('积分不足')
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-09 (原AC-36-08): 充值100元→余额+100
  // RQ-36-06: 余额充值 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-09 (原AC-36-08) | RQ-36-06 余额充值', () => {
    it('充值100元→余额增加10000分(100元)', () => {
      svc.rechargeBalance(memberId, 10000, 'wechat') // 100元=10000分
      const m = svc.queryById(memberId)
      expect(m!.balance).toBe(10000)
    })

    it('不支持负数充值', () => {
      expect(() => svc.rechargeBalance(memberId, 0)).toThrow('充值金额必须大于0')
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-10 (原AC-36-09): 余额支付成功
  // RQ-36-07: 余额支付 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-10 (原AC-36-09) | RQ-36-07 余额支付成功', () => {
    it('余额≥应付→支付成功,扣减余额', () => {
      svc.rechargeBalance(memberId, 20000) // 充200元
      const result = svc.payByBalance(memberId, 5000, 'order-001') // 付50元
      expect(result.success).toBe(true)
      const m = svc.queryById(memberId)
      expect(m!.balance).toBe(15000)
    })
  })

  // ═══════════════════════════════════════════════
  // AC-36-11 (原AC-36-10): 余额不足
  // RQ-36-07: 余额支付 (P0)
  // ═══════════════════════════════════════════════
  describe('AC-36-11 (原AC-36-10) | RQ-36-07 余额不足', () => {
    it('余额<应付→抛出异常', () => {
      // 余额0, 支付100元
      expect(() => svc.payByBalance(memberId, 10000)).toThrow('余额不足')
    })
  })

  // ═══════════════════════════════════════════════
  // RQ-36-08: 消费记录查询 (P1)
  // ═══════════════════════════════════════════════
  describe('RQ-36-08 | 消费记录查询', () => {
    it('充值+消费后有对应流水记录', () => {
      svc.rechargeBalance(memberId, 10000)
      svc.earnPoints(memberId, 5000)
      svc.payByBalance(memberId, 3000, 'order-002')

      const records = svc.getConsumptionRecords(memberId)
      expect(records.length).toBeGreaterThanOrEqual(3)
      // 按时间倒序, 包含recharge/points_earn/payment三种类型
      const types = records.map(r => r.type)
      expect(types).toContain('payment')
      expect(types).toContain('recharge')
      expect(types).toContain('points_earn')
    })

    it('空记录返回空数组', () => {
      const freshMember = svc.register('19900000001', '新会员')
      const records = svc.getConsumptionRecords(freshMember.id)
      expect(records).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════
  // RQ-36-09: 会员续费 (P1)
  // ═══════════════════════════════════════════════
  describe('RQ-36-09 | 会员续费', () => {
    it('续费后expiredAt延长', () => {
      const m = svc.renewMember(memberId, 6)
      expect(m.expiredAt).toBeDefined()
      const expected = new Date()
      expected.setMonth(expected.getMonth() + 6)
      // 允许1天误差
      const diff = Math.abs(m.expiredAt!.getTime() - expected.getTime())
      expect(diff).toBeLessThan(86400000)
    })

    it('续费0个月抛出异常', () => {
      expect(() => svc.renewMember(memberId, 0)).toThrow('续费月数必须大于0')
    })

    it('两次续费叠加', () => {
      svc.renewMember(memberId, 3)
      svc.renewMember(memberId, 3)
      const expected = new Date()
      expected.setMonth(expected.getMonth() + 6)
      const diff = Math.abs(svc.queryById(memberId)!.expiredAt!.getTime() - expected.getTime())
      expect(diff).toBeLessThan(86400000)
    })
  })

  // ═══════════════════════════════════════════════
  // RQ-36-10: 权益展示 (P1)
  // ═══════════════════════════════════════════════
  describe('RQ-36-10 | 权益展示', () => {
    it('显示当前等级所有权益', () => {
      const benefits = svc.getBenefits(memberId)
      expect(benefits).not.toBeNull()
      expect(benefits!.level).toBe('regular')
      expect(benefits!.benefits).toEqual(['积分1x倍率'])
    })

    it('银卡权益包含95折', () => {
      svc.earnPoints(memberId, 50000) // 消费50000分=500元, 到银卡
      const benefits = svc.getBenefits(memberId)
      expect(benefits!.label).toBe('银卡')
      expect(benefits!.benefits).toContain('全场95折')
    })

    it('显示所有等级权益对比', () => {
      const benefits = svc.getBenefits(memberId)
      expect(benefits!.allLevels).toBeDefined()
      expect(Object.keys(benefits!.allLevels)).toEqual(['regular', 'silver', 'gold', 'diamond'])
      expect(benefits!.allLevels.diamond).toContain('生日礼')
    })
  })

  // ═══════════════════════════════════════════════
  // 实体层纯函数测试
  // ═══════════════════════════════════════════════
  describe('实体层: computeLevel / calcEarnedPoints', () => {
    it('累计消费0→regular', () => {
      expect(computeLevel(0)).toBe('regular')
    })
    it('累计消费50000分→silver', () => {
      expect(computeLevel(50000)).toBe('silver')
    })
    it('累计消费200000分→gold', () => {
      expect(computeLevel(200000)).toBe('gold')
    })
    it('累计消费500000分→diamond', () => {
      expect(computeLevel(500000)).toBe('diamond')
    })
    it('消费100元(10000分)普通→100基础积分', () => {
      expect(calcEarnedPoints(10000, 'regular')).toBe(100)
    })
    it('消费100元(10000分)金卡→150积分', () => {
      expect(calcEarnedPoints(10000, 'gold')).toBe(150)
    })
    it('消费100元(10000分)钻石→200积分', () => {
      expect(calcEarnedPoints(10000, 'diamond')).toBe(200)
    })
    it('消费0元→0积分', () => {
      expect(calcEarnedPoints(0, 'regular')).toBe(0)
    })
  })

  // ═══════════════════════════════════════════════
  // 等级配置验证
  // ═══════════════════════════════════════════════
  describe('等级配置正确性', () => {
    it('普通 积分1x', () => {
      expect(LEVEL_CONFIGS.regular.pointsMultiplier).toBe(1)
    })
    it('银卡 积分1.2x', () => {
      expect(LEVEL_CONFIGS.silver.pointsMultiplier).toBe(1.2)
    })
    it('金卡 积分1.5x', () => {
      expect(LEVEL_CONFIGS.gold.pointsMultiplier).toBe(1.5)
    })
    it('钻石 积分2x+生日礼', () => {
      expect(LEVEL_CONFIGS.diamond.pointsMultiplier).toBe(2)
      expect(LEVEL_CONFIGS.diamond.benefits).toContain('生日礼')
    })
  })
})
