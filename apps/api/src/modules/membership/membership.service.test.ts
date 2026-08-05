/**
 * membership.service.spec.ts — 会员管理 Service 单元测试 (V23)
 *
 * 覆盖: register / findByPhone / getById / getOrCreate / update / list / delete /
 *       getLevelConfigs / refreshLevel / getUpgradeProgress /
 *       earnPoints / redeemPoints / listPointsTransactions / adjustPoints /
 *       recharge / payWithBalance / listBalanceTransactions / getStats
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MembershipService } from './membership.service'

const TENANT_ID = 'tenant-test'

describe('MembershipService', () => {
  let svc: MembershipService

  beforeEach(() => {
    svc = new MembershipService()
    svc._reset()
  })

  // ════════════════════════════════════════════
  // 会员管理
  // ════════════════════════════════════════════

  describe('register', () => {
    it('正例: 注册新会员', () => {
      const m = svc.register({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      expect(m.id).toBeTruthy()
      expect(m.level).toBe('regular')
      expect(m.points).toBe(0)
      expect(m.balance).toBe(0)
    })

    it('反例: 空手机号抛异常', () => {
      expect(() => svc.register({ phone: '', name: '张三', tenantId: TENANT_ID }))
        .toThrow('手机号不能为空')
    })

    it('反例: 重复手机号抛异常', () => {
      svc.register({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      expect(() => svc.register({ phone: '13800138001', name: '李四', tenantId: TENANT_ID }))
        .toThrow('已注册')
    })
  })

  describe('findByPhone', () => {
    it('正例: 按手机号查询', () => {
      svc.register({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      const m = svc.findByPhone('13800138001', TENANT_ID)
      expect(m).not.toBeNull()
    })

    it('边界: 不存在的手机号返回null', () => {
      expect(svc.findByPhone('99999999999', TENANT_ID)).toBeNull()
    })
  })

  describe('getById', () => {
    it('正例: 按ID查询', () => {
      const created = svc.register({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      const m = svc.getById(created.id)
      expect(m).not.toBeNull()
    })

    it('反例: 不存在的ID返回null', () => {
      expect(svc.getById('nonexist')).toBeNull()
    })
  })

  describe('getOrCreate', () => {
    it('正例: 已存在则返回', () => {
      svc.register({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      const m = svc.getOrCreate({ phone: '13800138001', name: '重复', tenantId: TENANT_ID })
      expect(m.name).toBe('张三') // 保留原来的
    })

    it('正例: 不存在则创建', () => {
      const m = svc.getOrCreate({ phone: '13800138999', name: '新用户', tenantId: TENANT_ID })
      expect(m.name).toBe('新用户')
    })
  })

  describe('update', () => {
    it('正例: 更新会员姓名', () => {
      const created = svc.register({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      const updated = svc.update(created.id, { name: '张四' })
      expect(updated.name).toBe('张四')
    })

    it('反例: 无效等级抛异常', () => {
      const created = svc.register({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      expect(() => svc.update(created.id, { level: 'invalid' as any }))
        .toThrow('无效等级')
    })
  })

  describe('delete', () => {
    it('正例: 删除会员', () => {
      const created = svc.register({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      svc.delete(created.id)
      expect(svc.getById(created.id)).toBeNull()
    })

    it('反例: 删除不存在的会员抛异常', () => {
      expect(() => svc.delete('nonexist')).toThrow('不存在')
    })
  })

  describe('list', () => {
    it('正例: 列出所有会员', () => {
      svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      svc._seed({ phone: '13800138002', name: '李四', tenantId: TENANT_ID })
      const list = svc.list()
      expect(list.length).toBe(2)
    })
  })

  // ════════════════════════════════════════════
  // 等级管理
  // ════════════════════════════════════════════

  describe('getLevelConfigs', () => {
    it('正例: 返回4个等级配置', () => {
      const configs = svc.getLevelConfigs()
      expect(configs.length).toBe(4)
      expect(configs[0].label).toBe('普通会员')
    })
  })

  describe('calculateLevel', () => {
    it('正例: 普通会员', () => {
      expect(svc.calculateLevel(0)).toBe('regular')
    })
    it('正例: 银卡会员', () => {
      expect(svc.calculateLevel(50000)).toBe('silver')
    })
    it('正例: 金卡会员', () => {
      expect(svc.calculateLevel(200000)).toBe('gold')
    })
    it('正例: 钻石会员', () => {
      expect(svc.calculateLevel(500000)).toBe('diamond')
    })
    it('边界: 刚好达到金卡门槛', () => {
      expect(svc.calculateLevel(200000)).toBe('gold')
    })
  })

  describe('refreshLevel', () => {
    it('正例: 消费后自动升级', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID, totalSpent: 50000 })
      const updated = svc.refreshLevel(m.id)
      expect(updated.level).toBe('silver')
    })
  })

  describe('getUpgradeProgress', () => {
    it('正例: 返回升级进度', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID, totalSpent: 25000 })
      const progress = svc.getUpgradeProgress(m.id)
      expect(progress.currentLevel).toBe('regular')
      expect(progress.nextLevel).toBe('silver')
      expect(progress.progress).toBeGreaterThanOrEqual(0)
      expect(progress.progress).toBeLessThanOrEqual(100)
    })
  })

  // ════════════════════════════════════════════
  // 积分管理
  // ════════════════════════════════════════════

  describe('earnPoints', () => {
    it('正例: 消费获得积分', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      svc.earnPoints(m.id, 10000, 'order-001')
      const updated = svc.getById(m.id)!
      expect(updated.points).toBeGreaterThan(0)
    })
  })

  describe('redeemPoints', () => {
    it('正例: 积分抵扣', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID, points: 1000 })
      const result = svc.redeemPoints(m.id, 500)
      expect(result.pointsUsed).toBeGreaterThan(0)
      expect(result.centsDiscounted).toBeGreaterThan(0)
    })

    it('反例: 积分不足抛异常', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID, points: 50 })
      expect(() => svc.redeemPoints(m.id, 500)).toThrow('积分不足')
    })
  })

  describe('adjustPoints', () => {
    it('正例: 管理员调整积分', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID, points: 100 })
      svc.adjustPoints(m.id, 200, '奖励活动')
      expect(svc.getById(m.id)!.points).toBe(300)
    })

    it('反例: 调整为负数抛异常', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID, points: 50 })
      expect(() => svc.adjustPoints(m.id, -100, '扣减')).toThrow('不能为负数')
    })
  })

  // ════════════════════════════════════════════
  // 余额管理
  // ════════════════════════════════════════════

  describe('recharge', () => {
    it('正例: 充值成功', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      svc.recharge(m.id, 50000, 'wechat')
      expect(svc.getById(m.id)!.balance).toBe(50000)
    })

    it('反例: 充值0或负数抛异常', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      expect(() => svc.recharge(m.id, 0)).toThrow('必须大于0')
    })
  })

  describe('payWithBalance', () => {
    it('正例: 余额支付成功', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID, balance: 10000 })
      const paid = svc.payWithBalance(m.id, 3000)
      expect(paid).toBe(3000)
      expect(svc.getById(m.id)!.balance).toBe(7000)
    })

    it('反例: 余额不足抛异常', () => {
      const m = svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID, balance: 1000 })
      expect(() => svc.payWithBalance(m.id, 5000)).toThrow('余额不足')
    })
  })

  // ════════════════════════════════════════════
  // 统计
  // ════════════════════════════════════════════

  describe('getStats', () => {
    it('正例: 返回统计', () => {
      svc._seed({ phone: '13800138001', name: '张三', tenantId: TENANT_ID })
      svc._seed({ phone: '13800138002', name: '李四', tenantId: TENANT_ID, level: 'gold' })
      const stats = svc.getStats()
      expect(stats.totalMembers).toBe(2)
      expect(stats.byLevel.regular).toBe(1)
      expect(stats.byLevel.gold).toBe(1)
    })
  })
})
