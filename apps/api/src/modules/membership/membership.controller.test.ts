/**
 * MembershipController 集成测试
 *
 * 策略: 使用真实的 MembershipService 实例注入 Controller
 * 覆盖:
 *   - 会员注册 / 查询 / 更新 / 删除 / 列表
 *   - 手机号查询
 *   - 等级管理 (等级配置 / 升级进度 / 刷新等级)
 *   - 积分管理 (累计 / 扣减 / 流水 / 不足)
 *   - 余额管理 (充值 / 支付 / 不足)
 *   - 统计
 */
import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { MembershipController } from './membership.controller'
import { MembershipService } from './membership.service'

describe('MembershipController', () => {
  let controller: MembershipController
  let svc: MembershipService

  function ok<T>(v: T | undefined | null): asserts v is T {
    assert.ok(v)
  }

  beforeEach(() => {
    svc = new MembershipService()
    controller = new MembershipController(svc)
  })

  // ─── 1. 会员注册 ──────────────────────────────────────────

  describe('POST /membership/register', () => {
    it('should register a new member successfully', () => {
      const result = controller.register(
        { phone: '13800138001', name: '张三' },
        'tenant-1',
      )

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.phone, '13800138001')
      assert.equal(result.data.name, '张三')
      assert.equal(result.data.level, 'regular')
      assert.equal(result.data.points, 0)
      assert.equal(result.data.balance, 0)
    })

    it('should create member with default name when name is empty', () => {
      const result = controller.register(
        { phone: '13800138002' },
        'tenant-1',
      )

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.name, '未知客户')
    })

    it('should reject duplicate phone registration', () => {
      controller.register({ phone: '13800138001', name: '张三' }, 'tenant-1')
      const result = controller.register(
        { phone: '13800138001', name: '张三重复' },
        'tenant-1',
      )

      assert.equal(result.success, false)
      assert.ok(result.message?.includes('已注册'))
    })

    it('should accept same phone in different tenant', () => {
      const r1 = controller.register({ phone: '13800138001', name: '张三' }, 'tenant-1')
      const r2 = controller.register({ phone: '13800138001', name: '张三其它店' }, 'tenant-2')

      assert.equal(r1.success, true)
      assert.equal(r2.success, true)
      ok(r1.data)
      ok(r2.data)
      assert.notEqual(r1.data.id, r2.data.id)
    })
  })

  // ─── 2. 会员查询 ──────────────────────────────────────────

  describe('GET /membership/:id', () => {
    it('should return member by id', () => {
      const reg = controller.register(
        { phone: '13800138001', name: '张三' },
        'tenant-1',
      )
      ok(reg.data)

      const result = controller.getById(reg.data.id)
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.id, reg.data.id)
      assert.equal(result.data.phone, '13800138001')
    })

    it('should return not found for non-existent id', () => {
      const result = controller.getById('NONEXISTENT')
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('不存在'))
    })
  })

  describe('GET /membership/phone/:phone', () => {
    it('should find member by phone', () => {
      controller.register({ phone: '13800138001', name: '张三' }, 'tenant-1')

      const result = controller.findByPhone('13800138001', 'tenant-1')
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.phone, '13800138001')
    })

    it('should return not found for unregistered phone', () => {
      const result = controller.findByPhone('13900000000', 'tenant-1')
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('未注册'))
    })
  })

  // ─── 3. 更新会员 ──────────────────────────────────────────

  describe('PUT /membership/:id', () => {
    it('should update member name and level', () => {
      const reg = controller.register(
        { phone: '13800138001', name: '张三' },
        'tenant-1',
      )
      ok(reg.data)

      const result = controller.update(reg.data.id, {
        name: '张三新名',
        level: 'gold',
      })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.name, '张三新名')
      assert.equal(result.data.level, 'gold')
    })

    it('should fail for non-existent member', () => {
      const result = controller.update('NONEXISTENT', { name: '测试' })
      assert.equal(result.success, false)
    })
  })

  // ─── 4. 删除会员 ──────────────────────────────────────────

  describe('DELETE /membership/:id', () => {
    it('should delete a member', () => {
      const reg = controller.register(
        { phone: '13800138001', name: '张三' },
        'tenant-1',
      )
      ok(reg.data)

      const delResult = controller.delete(reg.data.id)
      assert.equal(delResult.success, true)
      ok(delResult.data)
      assert.equal(delResult.data.deleted, true)

      // Verify gone
      const getResult = controller.getById(reg.data.id)
      assert.equal(getResult.success, false)
    })
  })

  // ─── 5. 会员列表 ──────────────────────────────────────────

  describe('GET /membership', () => {
    it('should list all members', () => {
      controller.register({ phone: '13800138001' }, 'tenant-1')
      controller.register({ phone: '13800138002' }, 'tenant-1')
      controller.register({ phone: '13800138003' }, 'tenant-1')

      const result = controller.list({})
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.total, 3)
    })

    it('should filter by level', () => {
      const r1 = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(r1.data)
      svc.update(r1.data.id, { level: 'gold' })

      controller.register({ phone: '13800138002' }, 'tenant-1')

      const result = controller.list({ level: 'gold' })
      ok(result.data)
      assert.equal(result.data.total, 1)
    })

    it('should search by name or phone', () => {
      controller.register({ phone: '13800138001', name: '张三' }, 'tenant-1')
      controller.register({ phone: '13800138002', name: '李四' }, 'tenant-1')

      const r1 = controller.list({ search: '张三' })
      ok(r1.data)
      assert.equal(r1.data.total, 1)

      const r2 = controller.list({ phone: '13800138001' })
      ok(r2.data)
      assert.equal(r2.data.total, 1)
    })
  })

  // ─── 6. 等级管理 ──────────────────────────────────────────

  describe('GET /membership/levels', () => {
    it('should return all level configs', () => {
      const result = controller.getLevels()
      assert.equal(result.success, true)
      ok(result.data)
      assert.ok(Array.isArray(result.data))
      assert.equal(result.data.length, 4)
    })
  })

  describe('GET /membership/:id/level', () => {
    it('should return level info for member', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      const result = controller.getLevel(reg.data.id)
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.level, 'regular')
      assert.equal(result.data.config.discountRate, 1.0)
    })
  })

  describe('GET /membership/:id/upgrade', () => {
    it('should return upgrade progress for a member', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      const result = controller.getUpgradeProgress(reg.data.id)
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.currentLevel, 'regular')
      assert.equal(result.data.nextLevel, 'silver')
    })
  })

  describe('POST /membership/:id/refresh-level', () => {
    it('should upgrade member when totalSpent crosses threshold', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      // Earn enough to reach silver (50000 cents = 500 yuan)
      svc.earnPoints(reg.data.id, 60000)

      const result = controller.refreshLevel(reg.data.id)
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.level, 'silver')
    })
  })

  // ─── 7. 积分管理 ──────────────────────────────────────────

  describe('POST /membership/:id/points/earn', () => {
    it('should earn points when consuming', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      // Consume 100 yuan = 10000 cents, regular gets 1x = 100 points
      const result = controller.earnPoints(reg.data.id, {
        memberId: reg.data.id,
        amount: 10000,
        orderId: 'ORD-001',
      })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.amount, 100)
      assert.equal(result.data.type, 'earn')

      // Check member points updated
      const getResult = controller.getById(reg.data.id)
      ok(getResult.data)
      assert.equal(getResult.data.points, 100)
    })

    it('should earn bonus points for gold member', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)
      svc.update(reg.data.id, { level: 'gold' })

      // Gold gets 1.5x → 100 * 1.5 = 150 points
      const result = controller.earnPoints(reg.data.id, {
        memberId: reg.data.id,
        amount: 10000,
      })
      ok(result.data)
      assert.equal(result.data.amount, 150)
    })
  })

  describe('POST /membership/:id/points/redeem', () => {
    it('should redeem points for discount', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      // Seed points
      svc.earnPoints(reg.data.id, 50000)
      const getResult = controller.getById(reg.data.id)
      ok(getResult.data)
      assert.ok(getResult.data.points >= 500)

      // Redeem 300 points = 3 yuan
      const result = controller.redeemPoints(reg.data.id, {
        memberId: reg.data.id,
        points: 300,
      })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.pointsUsed, 300)
      assert.equal(result.data.centsDiscounted, 3)
    })

    it('should reject redemption when points insufficient', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      const result = controller.redeemPoints(reg.data.id, {
        memberId: reg.data.id,
        points: 50, // Less than 100 minimum
      })
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('积分不足'))
    })
  })

  describe('GET /membership/:id/points/history', () => {
    it('should return points transaction history', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      svc.earnPoints(reg.data.id, 10000)
      svc.earnPoints(reg.data.id, 20000)

      const result = controller.pointsHistory(reg.data.id, {})
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.total, 2)
    })
  })

  describe('POST /membership/:id/points/adjust', () => {
    it('should admin adjust points', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      const result = controller.adjustPoints(reg.data.id, {
        memberId: reg.data.id,
        amount: 1000,
        remark: '活动赠送',
      })
      assert.equal(result.success, true)

      const getResult = controller.getById(reg.data.id)
      ok(getResult.data)
      assert.equal(getResult.data.points, 1000)
    })
  })

  // ─── 8. 余额管理 ──────────────────────────────────────────

  describe('POST /membership/:id/balance/recharge', () => {
    it('should recharge balance', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      // Recharge 100 yuan = 10000 cents
      const result = controller.recharge(reg.data.id, {
        memberId: reg.data.id,
        amount: 10000,
        paymentMethod: 'wechat',
      })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.balance, 10000)
    })

    it('should reject recharge of zero or negative', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      const result = controller.recharge(reg.data.id, {
        memberId: reg.data.id,
        amount: 0,
      })
      assert.equal(result.success, false)
    })
  })

  describe('POST /membership/:id/balance/pay', () => {
    it('should pay with balance', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      svc.recharge(reg.data.id, 10000)

      // Pay 50 yuan = 5000 cents
      const result = controller.payWithBalance(reg.data.id, {
        memberId: reg.data.id,
        amount: 5000,
      })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.paid, 5000)

      const getResult = controller.getById(reg.data.id)
      ok(getResult.data)
      assert.equal(getResult.data.balance, 5000)
    })

    it('should reject payment when balance insufficient', () => {
      const reg = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(reg.data)

      svc.recharge(reg.data.id, 1000)

      const result = controller.payWithBalance(reg.data.id, {
        memberId: reg.data.id,
        amount: 9999,
      })
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('余额不足'))
    })
  })

  // ─── 9. 统计 ──────────────────────────────────────────────

  describe('GET /membership/stats', () => {
    it('should return statistics', () => {
      const r1 = controller.register({ phone: '13800138001' }, 'tenant-1')
      ok(r1.data)
      svc.update(r1.data.id, { level: 'gold' })

      controller.register({ phone: '13800138002' }, 'tenant-1')

      const result = controller.stats()
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.totalMembers, 2)
      assert.equal(result.data.byLevel.gold, 1)
      assert.equal(result.data.byLevel.regular, 1)
    })

    it('should return zero stats when no members', () => {
      const result = controller.stats()
      ok(result.data)
      assert.equal(result.data.totalMembers, 0)
      assert.equal(result.data.totalBalance, 0)
      assert.equal(result.data.totalRecharge, 0)
    })
  })
})
