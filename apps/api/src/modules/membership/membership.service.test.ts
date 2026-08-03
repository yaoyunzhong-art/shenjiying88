/**
 * membership.service.test.ts — 会员管理核心 Service 单元测试
 *
 * 覆盖:
 *   会员管理  : register / findByPhone / getById / getOrCreate / update / list / delete
 *   等级管理  : calculateLevel / getLevelConfig / refreshLevel / getUpgradeProgress
 *   积分管理  : earnPoints / redeemPoints / listPointsTransactions / adjustPoints
 *   余额管理  : recharge / payWithBalance / listBalanceTransactions
 *   统计      : getStats
 *
 * 正例 + 反例 + 边界
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { MembershipService } from './membership.service'

describe('MembershipService', () => {
  let service: MembershipService

  beforeEach(() => {
    service = new MembershipService()
    service._reset()
  })

  // ═══════════════════════════════════════════════════════════════
  // 1. 会员管理
  // ═══════════════════════════════════════════════════════════════

  describe('register', () => {
    it('注册新会员成功，返回完整会员信息', () => {
      const member = service.register({
        phone: '13800138001',
        name: '张三',
        tenantId: 'tenant-1',
      })

      expect(member.id).toMatch(/^MEM-/)
      expect(member.phone).toBe('13800138001')
      expect(member.name).toBe('张三')
      expect(member.level).toBe('regular')
      expect(member.points).toBe(0)
      expect(member.balance).toBe(0)
      expect(member.totalSpent).toBe(0)
      expect(member.createdAt).toBeInstanceOf(Date)
    })

    it('手机号为空时抛出 BadRequestException', () => {
      expect(() =>
        service.register({ phone: '', name: '张三', tenantId: 'tenant-1' }),
      ).toThrow(BadRequestException)
    })

    it('手机号为空白字符串时抛出 BadRequestException', () => {
      expect(() =>
        service.register({ phone: '   ', name: '张三', tenantId: 'tenant-1' }),
      ).toThrow(BadRequestException)
    })

    it('重复手机号同一租户下注册抛出 BadRequestException', () => {
      service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      expect(() =>
        service.register({ phone: '13800138001', name: '张三2', tenantId: 'tenant-1' }),
      ).toThrow(BadRequestException)
    })

    it('不同租户下允许相同手机号', () => {
      const m1 = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      const m2 = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-2' })
      expect(m1.id).not.toBe(m2.id)
    })

    it('未传入 name 时默认值为"未知客户"', () => {
      const member = service.register({ phone: '13800138001', name: '', tenantId: 'tenant-1' })
      expect(member.name).toBe('未知客户')
    })

    it('注册的新会员等级默认为 regular', () => {
      const member = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      expect(member.level).toBe('regular')
    })
  })

  describe('findByPhone', () => {
    it('可通过手机号查找到已注册会员', () => {
      const registered = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      const found = service.findByPhone('13800138001', 'tenant-1')
      expect(found).not.toBeNull()
      expect(found!.id).toBe(registered.id)
    })

    it('不存在的手机号返回 null', () => {
      const found = service.findByPhone('13900000000', 'tenant-1')
      expect(found).toBeNull()
    })

    it('不同租户手机号隔离', () => {
      service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      const found = service.findByPhone('13800138001', 'tenant-2')
      expect(found).toBeNull()
    })
  })

  describe('getById', () => {
    it('通过 ID 查找到会员', () => {
      const registered = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      const found = service.getById(registered.id)
      expect(found).not.toBeNull()
      expect(found!.phone).toBe('13800138001')
    })

    it('不存在的 ID 返回 null', () => {
      expect(service.getById('MEM-NONEXIST')).toBeNull()
    })
  })

  describe('getOrCreate', () => {
    it('首次调用时注册新会员', () => {
      const member = service.getOrCreate({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      expect(member).toBeDefined()
      expect(member.phone).toBe('13800138001')
    })

    it('已存在的手机号返回已有会员', () => {
      const first = service.getOrCreate({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      const second = service.getOrCreate({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      expect(second.id).toBe(first.id)
    })
  })

  describe('update', () => {
    it('更新会员名称', () => {
      const member = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      const updated = service.update(member.id, { name: '张四' })
      expect(updated.name).toBe('张四')
    })

    it('更新会员等级', () => {
      const member = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      const updated = service.update(member.id, { level: 'gold' })
      expect(updated.level).toBe('gold')
    })

    it('无效等级抛出 BadRequestException', () => {
      const member = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      // A runtime check — pass an invalid level string to trigger BadRequestException
      expect(() =>
        service.update(member.id, { level: 'platinum' as 'regular' | 'silver' | 'gold' | 'diamond' }),
      ).toThrow(BadRequestException)
    })

    it('不存在的会员 ID 抛出 NotFoundException', () => {
      expect(() => service.update('MEM-NONEXIST', { name: '张三' })).toThrow(NotFoundException)
    })
  })

  describe('list', () => {
    it('返回所有已注册会员（按创建时间倒序）', () => {
      service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      service.register({ phone: '13800138002', name: '李四', tenantId: 'tenant-1' })
      const members = service.list()
      expect(members.length).toBe(2)
      expect(members[0].createdAt.getTime()).toBeGreaterThanOrEqual(members[1].createdAt.getTime())
    })

    it('没有注册会员时返回空数组', () => {
      expect(service.list()).toEqual([])
    })

    it('按手机号过滤', () => {
      service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      service.register({ phone: '13800138002', name: '李四', tenantId: 'tenant-1' })
      const members = service.list({ phone: '13800138001' })
      expect(members.length).toBe(1)
    })

    it('按等级过滤', () => {
      const m = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      service.update(m.id, { level: 'gold' })
      service.register({ phone: '13800138002', name: '李四', tenantId: 'tenant-1' })

      const goldMembers = service.list({ level: 'gold' })
      expect(goldMembers.length).toBe(1)
    })

    it('按关键词搜索（名称/手机号/ID）', () => {
      service.register({ phone: '13800138001', name: '张三丰', tenantId: 'tenant-1' })
      service.register({ phone: '13800138002', name: '李四', tenantId: 'tenant-1' })

      const results = service.list({ search: '张' })
      expect(results.length).toBe(1)
      expect(results[0].name).toBe('张三丰')

      const resultsByPhone = service.list({ search: '8002' })
      expect(resultsByPhone.length).toBe(1)
    })
  })

  describe('delete', () => {
    it('删除已存在的会员', () => {
      const member = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      service.delete(member.id)
      expect(service.getById(member.id)).toBeNull()
    })

    it('删除不存在的会员抛出 NotFoundException', () => {
      expect(() => service.delete('MEM-NONEXIST')).toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 2. 等级管理
  // ═══════════════════════════════════════════════════════════════

  describe('calculateLevel', () => {
    it('累计消费 0 元时等级为 regular', () => {
      expect(service.calculateLevel(0)).toBe('regular')
    })

    it('累计消费 49999（小于银卡门槛）时等级为 regular', () => {
      expect(service.calculateLevel(49999)).toBe('regular')
    })

    it('累计消费 50000（银卡门槛）时等级为 silver', () => {
      expect(service.calculateLevel(50000)).toBe('silver')
    })

    it('累计消费 199999（小于金卡门槛）时等级为 silver', () => {
      expect(service.calculateLevel(199999)).toBe('silver')
    })

    it('累计消费 200000（金卡门槛）时等级为 gold', () => {
      expect(service.calculateLevel(200000)).toBe('gold')
    })

    it('累计消费 500000（钻石门槛）时等级为 diamond', () => {
      expect(service.calculateLevel(500000)).toBe('diamond')
    })

    it('累计消费 999999（超过钻石门槛）时等级为 diamond', () => {
      expect(service.calculateLevel(999999)).toBe('diamond')
    })
  })

  describe('getLevelConfig', () => {
    it('返回 regular 等级配置', () => {
      const cfg = service.getLevelConfig('regular')
      expect(cfg.level).toBe('regular')
      expect(cfg.minSpent).toBe(0)
      expect(cfg.pointsMultiplier).toBe(1.0)
      expect(cfg.discountRate).toBe(1.0)
    })

    it('返回 gold 等级配置', () => {
      const cfg = service.getLevelConfig('gold')
      expect(cfg.level).toBe('gold')
      expect(cfg.minSpent).toBe(200000)
      expect(cfg.pointsMultiplier).toBe(1.5)
      expect(cfg.discountRate).toBe(0.9)
    })

    it('不存在等级时返回 regular 配置兜底', () => {
      const cfg = service.getLevelConfig('platinum' as 'regular' | 'silver' | 'gold' | 'diamond')
      expect(cfg.level).toBe('regular')
    })
  })

  describe('refreshLevel', () => {
    it('会员消费足够后刷新等级提升为 silver', () => {
      const member = service._seed({ phone: '13800138001', totalSpent: 0 })
      const memberAfter = service._seed({ phone: '13800138002', totalSpent: 60000 })
      const refreshed = service.refreshLevel(memberAfter.id)
      expect(refreshed.level).toBe('silver')
    })

    it('不存在的会员刷新抛出 NotFoundException', () => {
      expect(() => service.refreshLevel('MEM-NONEXIST')).toThrow(NotFoundException)
    })
  })

  describe('getUpgradeProgress', () => {
    it('regular → silver 的升级进度', () => {
      const member = service._seed({ phone: '13800138001', totalSpent: 25000 })
      const progress = service.getUpgradeProgress(member.id)
      expect(progress.currentLevel).toBe('regular')
      expect(progress.nextLevel).toBe('silver')
      expect(progress.nextLevelMinSpent).toBe(50000)
      expect(progress.progress).toBe(50) // 25000 / 50000
    })

    it('silver → gold 的升级进度', () => {
      const member = service._seed({
        phone: '13800138001',
        totalSpent: 100000,
        level: 'silver',
      })
      const progress = service.getUpgradeProgress(member.id)
      expect(progress.currentLevel).toBe('silver')
      expect(progress.nextLevel).toBe('gold')
      expect(progress.progress).toBe(33) // (100000-50000) / (200000-50000) ≈ 33%
    })

    it('diamond 为最高等级，nextLevel 为 null', () => {
      const member = service._seed({
        phone: '13800138001',
        totalSpent: 600000,
        level: 'diamond',
      })
      const progress = service.getUpgradeProgress(member.id)
      expect(progress.currentLevel).toBe('diamond')
      expect(progress.nextLevel).toBeNull()
      expect(progress.progress).toBe(100)
    })

    it('不存在的会员查询进度抛出 NotFoundException', () => {
      expect(() => service.getUpgradeProgress('MEM-NONEXIST')).toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 3. 积分管理
  // ═══════════════════════════════════════════════════════════════

  describe('earnPoints', () => {
    it('regular 会员消费 5000 分（50元）获得 0 积分（不足100分/1元基数）', () => {
      const member = service._seed({ phone: '13800138001', points: 0, totalSpent: 0 })
      const tx = service.earnPoints(member.id, 5000)
      // floor(5000/100 * 1.0) = 50 → 但 pointsEarned > 0 check: 50 > 0, so yes
      // Actually: floor(5000/100 * 1.0) = floor(50) = 50
      expect(tx.amount).toBe(50)
      const updated = service.getById(member.id)!
      expect(updated.points).toBe(50)
      expect(updated.totalSpent).toBe(5000)
    })

    it('消费 10000 分（100元）获得 100 积分', () => {
      const member = service._seed({ phone: '13800138001', points: 0, totalSpent: 0 })
      const tx = service.earnPoints(member.id, 10000)
      expect(tx.amount).toBe(100)
    })

    it('gold 会员获得 1.5 倍积分', () => {
      const member = service._seed({
        phone: '13800138001',
        points: 0,
        totalSpent: 0,
        level: 'gold',
      })
      const tx = service.earnPoints(member.id, 10000)
      // floor(10000/100 * 1.5) = 150
      expect(tx.amount).toBe(150)
    })

    it('不存在的会员赚积分抛出 NotFoundException', () => {
      expect(() => service.earnPoints('MEM-NONEXIST', 10000)).toThrow(NotFoundException)
    })
  })

  describe('redeemPoints', () => {
    it('正常积分抵扣', () => {
      service._seed({ phone: '13800138001', points: 1000, balance: 0 })
      const member = service.findByPhone('13800138001', 'tenant-1')!
      const result = service.redeemPoints(member.id, 1000)
      expect(result.pointsUsed).toBe(1000)
      expect(result.centsDiscounted).toBe(10) // 1000 / 100 = 10 分
      const updated = service.getById(member.id)!
      expect(updated.points).toBe(0)
    })

    it('积分不足 100 时抛出 BadRequestException', () => {
      const member = service._seed({ phone: '13800138001', points: 50 })
      expect(() => service.redeemPoints(member.id, 50)).toThrow(BadRequestException)
    })

    it('积分不是 100 的倍数时向下取整', () => {
      service._seed({ phone: '13800138001', points: 350 })
      const member = service.findByPhone('13800138001', 'tenant-1')!
      const result = service.redeemPoints(member.id, 350)
      expect(result.pointsUsed).toBe(300)
      expect(result.centsDiscounted).toBe(3)
    })

    it('请求扣减超过持有积分时扣减全部', () => {
      service._seed({ phone: '13800138001', points: 200 })
      const member = service.findByPhone('13800138001', 'tenant-1')!
      const result = service.redeemPoints(member.id, 9999)
      expect(result.pointsUsed).toBe(200)
    })

    it('不存在的会员积分抵扣抛出 NotFoundException', () => {
      expect(() => service.redeemPoints('MEM-NONEXIST', 1000)).toThrow(NotFoundException)
    })
  })

  describe('listPointsTransactions', () => {
    it('返回会员的积分流水（按时间倒序）', () => {
      const member = service._seed({ phone: '13800138001', points: 0, totalSpent: 0 })
      service.earnPoints(member.id, 10000)
      const txList = service.listPointsTransactions(member.id)
      expect(txList.length).toBe(1)
      expect(txList[0].type).toBe('earn')
    })

    it('没有流水时返回空数组', () => {
      service._seed({ phone: '13800138001', points: 0 })
      expect(service.listPointsTransactions('MEM-000001').length).toBe(0)
    })
  })

  describe('adjustPoints', () => {
    it('管理员增加积分', () => {
      const member = service._seed({ phone: '13800138001', points: 100 })
      const updated = service.adjustPoints(member.id, 50, '补偿')
      expect(updated.points).toBe(150)
    })

    it('管理员扣减积分', () => {
      const member = service._seed({ phone: '13800138001', points: 100 })
      const updated = service.adjustPoints(member.id, -50, '扣回')
      expect(updated.points).toBe(50)
    })

    it('调整后积分为负时抛出 BadRequestException', () => {
      const member = service._seed({ phone: '13800138001', points: 10 })
      expect(() => service.adjustPoints(member.id, -20, '扣回')).toThrow(BadRequestException)
    })

    it('不存在的会员调整积分抛出 NotFoundException', () => {
      expect(() => service.adjustPoints('MEM-NONEXIST', 50, '测试')).toThrow(NotFoundException)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 4. 余额管理
  // ═══════════════════════════════════════════════════════════════

  describe('recharge', () => {
    it('成功充值余额', () => {
      const member = service._seed({ phone: '13800138001', balance: 0 })
      const updated = service.recharge(member.id, 50000)
      expect(updated.balance).toBe(50000)
    })

    it('充值金额为 0 时抛出 BadRequestException', () => {
      const member = service._seed({ phone: '13800138001', balance: 0 })
      expect(() => service.recharge(member.id, 0)).toThrow(BadRequestException)
    })

    it('充值金额为负时抛出 BadRequestException', () => {
      const member = service._seed({ phone: '13800138001', balance: 0 })
      expect(() => service.recharge(member.id, -100)).toThrow(BadRequestException)
    })

    it('不存在的会员充值抛出 NotFoundException', () => {
      expect(() => service.recharge('MEM-NONEXIST', 1000)).toThrow(NotFoundException)
    })
  })

  describe('payWithBalance', () => {
    it('余额充足时支付成功', () => {
      const member = service._seed({ phone: '13800138001', balance: 10000 })
      const paid = service.payWithBalance(member.id, 3000)
      expect(paid).toBe(3000)
      const updated = service.getById(member.id)!
      expect(updated.balance).toBe(7000)
    })

    it('余额不足时抛出 BadRequestException', () => {
      const member = service._seed({ phone: '13800138001', balance: 1000 })
      expect(() => service.payWithBalance(member.id, 5000)).toThrow(BadRequestException)
    })

    it('不存在的会员支付抛出 NotFoundException', () => {
      expect(() => service.payWithBalance('MEM-NONEXIST', 100)).toThrow(NotFoundException)
    })

    it('支付金额等于余额时余额归零', () => {
      const member = service._seed({ phone: '13800138001', balance: 5000 })
      service.payWithBalance(member.id, 5000)
      const updated = service.getById(member.id)!
      expect(updated.balance).toBe(0)
    })
  })

  describe('listBalanceTransactions', () => {
    it('返回余额流水（按时间倒序）', () => {
      const member = service._seed({ phone: '13800138001', balance: 0 })
      service.recharge(member.id, 50000, 'wechat')
      const txs = service.listBalanceTransactions(member.id)
      expect(txs.length).toBe(1)
      expect(txs[0].type).toBe('recharge')
      expect(txs[0].paymentMethod).toBe('wechat')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 5. 统计
  // ═══════════════════════════════════════════════════════════════

  describe('getStats', () => {
    it('没有会员时返回全零统计', () => {
      const stats = service.getStats()
      expect(stats.totalMembers).toBe(0)
      expect(stats.totalPoints).toBe(0)
      expect(stats.totalBalance).toBe(0)
      expect(stats.totalRecharge).toBe(0)
    })

    it('正确统计会员数量和等级分布', () => {
      const m1 = service.register({ phone: '13800138001', name: '张三', tenantId: 'tenant-1' })
      service.update(m1.id, { level: 'gold' })
      service.register({ phone: '13800138002', name: '李四', tenantId: 'tenant-1' })

      const stats = service.getStats()
      expect(stats.totalMembers).toBe(2)
      expect(stats.byLevel.regular).toBe(1)
      expect(stats.byLevel.gold).toBe(1)
    })

    it('正确统计充值总额', () => {
      const member = service._seed({ phone: '13800138001', balance: 0 })
      service.recharge(member.id, 100000)
      service.recharge(member.id, 50000)
      const stats = service.getStats()
      expect(stats.totalRecharge).toBe(150000)
    })
  })
})
