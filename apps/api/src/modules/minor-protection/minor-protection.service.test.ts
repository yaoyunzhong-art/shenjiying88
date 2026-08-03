/**
 * minor-protection.service.test.ts — 未成年人保护 Service 测试 (补充覆盖)
 * 覆盖: 边缘案例 / 接口一致性
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MinorProtectionService } from './minor-protection.service'

describe('MinorProtectionService — old API compat', () => {
  let svc: MinorProtectionService

  beforeEach(() => {
    svc = new MinorProtectionService()
  })

  describe('registerProfile', () => {
    it('正例: 注册成年人', async () => {
      const p = await svc.registerProfile('u-adult', 't-1', '1995-05-10', 'none')
      expect(p.ageGroup).toBe('adult')
      expect(p.ageVerified).toBe(false)
      expect(p.restrictions).toEqual([])
    })

    it('正例: Teen 年龄组有完整限制', async () => {
      const p = await svc.registerProfile('u-teen', 't-1', '2012-03-01', 'id_card')
      expect(p.ageGroup).toBe('teen' as string)
      expect(p.restrictions).toContain('time_limit')
      expect(p.restrictions).toContain('spend_limit')
    })

    it('边界: 刚满 8 岁为 child', async () => {
      const p = await svc.registerProfile('u-child', 't-1', '2018-07-28', 'id_card')
      expect(p.age).toBe(8)
      expect(p.ageGroup).toBe('child')
    })

    it('边界: 刚满 14 岁为 teen', async () => {
      const p = await svc.registerProfile('u-teen2', 't-1', '2012-07-28', 'id_card')
      expect(p.age).toBe(14)
      expect(p.ageGroup).toBe('teen' as string)
    })

    it('边界: 刚满 18 岁为 adult', async () => {
      const p = await svc.registerProfile('u-adult2', 't-1', '2008-07-28', 'none')
      expect(p.age).toBe(18)
      expect(p.ageGroup).toBe('adult')
    })
  })

  describe('verifyAge', () => {
    it('正例: 验证年龄后标志更新', async () => {
      await svc.registerProfile('u-v', 't-1', '2015-06-01', 'none')
      const updated = await svc.verifyAge('u-v', 'id_card')
      expect(updated.ageVerified).toBe(true)
      expect(updated.verificationMethod).toBe('id_card')
      expect(updated.verifiedAt).toBeDefined()
    })

    it('反例: 验证不存在的用户抛异常', async () => {
      await expect(svc.verifyAge('no-user', 'id_card')).rejects.toThrow()
    })
  })

  describe('checkTimeLimit', () => {
    it('正例: 新用户允许访问', async () => {
      await svc.registerProfile('u-t1', 't-1', '2015-01-01', 'none')
      const result = await svc.checkTimeLimit('u-t1', 30)
      expect(result.allowed).toBe(true)
    })

    it('正例: 超过限制后禁止', async () => {
      await svc.registerProfile('u-t2', 't-1', '2015-01-01', 'none')
      // child: 40 min/day, 30 min session already uses time
      await svc.recordTimeUsage('u-t2', 30)
      const r = await svc.checkTimeLimit('u-t2', 30)
      // 30 + 30 = 60 > 40, so not allowed
      expect(r.allowed).toBe(false)
    })
  })

  describe('checkSpendLimit', () => {
    it('正例: 新用户允许消费', async () => {
      await svc.registerProfile('u-s1', 't-1', '2015-01-01', 'none')
      const r = await svc.checkSpendLimit('u-s1', 30)
      expect(r.allowed).toBe(true)
    })
  })

  describe('createParentalConsent with effectiveFrom', () => {
    it('正例: 创建监护人同意书含生效日期', async () => {
      const c = await svc.createParentalConsent({
        minorUserId: 'u-minor',
        parentUserId: 'u-parent',
        parentName: '张三',
        parentIdCard: '110101198001011234',
        relationship: '父亲',
        consentType: 'full',
        effectiveFrom: new Date(),
      })
      expect(c.id).toBeTruthy()
      expect(c.status).toBe('pending')
      expect(c.effectiveFrom).toBeDefined()
    })
  })
})
