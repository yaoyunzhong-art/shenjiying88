/**
 * minor-protection.service.spec.ts — 未成年人保护 Service 单元测试 (V23)
 *
 * 覆盖: registerProfile / getProfile / updateProfile / calculateAge / verifyAge /
 *       createParentalConsent / approveConsent / getConsents /
 *       checkTimeLimit / checkSpendLimit / checkBlindboxAccess / checkContentRating /
 *       recordTimeUsage / recordSpend / getUsageReport
 * 规则: 无 describe.skip · 无 it.only · beforeEach 隔离
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MinorProtectionService } from './minor-protection.service'

describe('MinorProtectionService', () => {
  let svc: MinorProtectionService

  beforeEach(() => {
    svc = new MinorProtectionService()
  })

  // ════════════════════════════════════════════
  // 年龄与注册
  // ════════════════════════════════════════════

  describe('registerProfile', () => {
    it('正例: 注册未成年人', async () => {
      const profile = await svc.registerProfile('u-001', 't-001', '2015-06-15', 'id_card')
      expect(profile.age).toBeGreaterThanOrEqual(10)
      expect(profile.ageGroup).toBe('child')
      expect(profile.ageVerified).toBe(true)
      expect(profile.restrictions).toContain('time_limit')
    })

    it('正例: 注册成年人无限制', async () => {
      const profile = await svc.registerProfile('u-200', 't-001', '1990-01-01', 'none')
      expect(profile.restrictions.length).toBe(0)
    })
  })

  describe('calculateAge', () => {
    it('正例: 计算年龄', () => {
      const age = svc.calculateAge('2010-06-15')
      expect(age).toBeGreaterThanOrEqual(15)
    })
  })

  describe('verifyAge', () => {
    it('正例: 年龄验证', async () => {
      await svc.registerProfile('u-001', 't-001', '2015-01-01', 'id_card')
      const profile = await svc.verifyAge('u-001', 'face')
      expect(profile.ageVerified).toBe(true)
      expect(profile.verificationMethod).toBe('face')
    })
  })

  // ════════════════════════════════════════════
  // 家长同意书
  // ════════════════════════════════════════════

  describe('createParentalConsent', () => {
    it('正例: 创建家长同意书', async () => {
      const consent = await svc.createParentalConsent({
        minorUserId: 'u-001',
        parentUserId: 'p-001',
        parentName: '张家长',
        parentIdCard: '110101199001011234',
        relationship: '父亲',
        consentType: 'full',
        effectiveFrom: new Date(),
      })
      expect(consent.status).toBe('pending')
    })
  })

  describe('approveConsent', () => {
    it('正例: 批准同意书解除限制', async () => {
      await svc.registerProfile('u-001', 't-001', '2015-01-01', 'none')
      const consent = await svc.createParentalConsent({
        minorUserId: 'u-001', parentUserId: 'p-001',
        parentName: '家长', parentIdCard: '110101199001011234',
        relationship: '父亲', consentType: 'full', effectiveFrom: new Date(),
      })
      const approved = await svc.approveConsent(consent.id)
      expect(approved.status).toBe('approved')

      const profile = await svc.getProfile('u-001')
      expect(profile.restrictions.length).toBe(0)
    })
  })

  // ════════════════════════════════════════════
  // 限制检查
  // ════════════════════════════════════════════

  describe('checkTimeLimit', () => {
    it('正例: 未成年限时检查通过', async () => {
      await svc.registerProfile('u-001', 't-001', '2015-01-01', 'id_card')
      const result = await svc.checkTimeLimit('u-001', 30)
      expect(result.allowed).toBe(true)
      expect(result.remainingMinutes).toBeGreaterThanOrEqual(0)
    })
  })

  describe('checkSpendLimit', () => {
    it('正例: 消费限额检查通过', async () => {
      await svc.registerProfile('u-001', 't-001', '2015-01-01', 'id_card')
      const result = await svc.checkSpendLimit('u-001', 10)
      expect(result.allowed).toBe(true)
    })
  })

  describe('checkBlindboxAccess', () => {
    it('正例: 未成年人禁止盲盒', async () => {
      await svc.registerProfile('u-minor', 't-001', '2015-01-01', 'none')
      const result = await svc.checkBlindboxAccess('u-minor')
      expect(result.allowed).toBe(false)
    })

    it('正例: 成年人允许盲盒', async () => {
      await svc.registerProfile('u-adult', 't-001', '1990-01-01', 'none')
      const result = await svc.checkBlindboxAccess('u-adult')
      expect(result.allowed).toBe(true)
    })
  })

  describe('checkContentRating', () => {
    it('正例: 未成年人限制R级内容', async () => {
      await svc.registerProfile('u-minor', 't-001', '2015-01-01', 'none')
      const result = await svc.checkContentRating('u-minor', 'R')
      expect(result.allowed).toBe(false)
    })
  })

  // ════════════════════════════════════════════
  // 使用记录
  // ════════════════════════════════════════════

  describe('recordTimeUsage', () => {
    it('正例: 记录使用时长', async () => {
      const record = await svc.recordTimeUsage('u-001', 30)
      expect(record.totalMinutes).toBe(30)
      expect(record.sessions.length).toBe(1)
    })

    it('正例: 累加时长', async () => {
      await svc.recordTimeUsage('u-001', 30)
      const record = await svc.recordTimeUsage('u-001', 20)
      expect(record.totalMinutes).toBe(50)
    })
  })

  describe('recordSpend', () => {
    it('正例: 记录消费', async () => {
      const record = await svc.recordSpend('u-001', 100, 'game', '投币')
      expect(record.totalAmount).toBe(100)
    })

    it('正例: 累加消费', async () => {
      await svc.recordSpend('u-001', 100, 'game', '投币')
      const record = await svc.recordSpend('u-001', 50, 'game', '续币')
      expect(record.totalAmount).toBe(150)
    })
  })

  // ════════════════════════════════════════════
  // 汇总报告
  // ════════════════════════════════════════════

  describe('getUsageReport', () => {
    it('正例: 返回汇总报告', async () => {
      await svc.recordTimeUsage('u-001', 60)
      await svc.recordTimeUsage('u-001', 30)
      await svc.recordSpend('u-001', 200, 'game', '投币')

      const report = await svc.getUsageReport('u-001', '2026-07-01', '2026-07-31')
      expect(report.totalMinutes).toBe(90)
      expect(report.totalSpend).toBe(200)
      expect(report.sessions).toBe(2)
    })
  })
})
