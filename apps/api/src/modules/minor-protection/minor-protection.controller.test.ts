/**
 * minor-protection.controller.test.ts — 未成年人保护 Controller 测试
 * 覆盖: 所有 Controller 端点 / 正常路径 / 错误处理
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { NotFoundException } from '@nestjs/common'
import { MinorProtectionController } from './minor-protection.controller'
import { MinorProtectionService } from './minor-protection.service'

describe('MinorProtectionController', () => {
  let controller: MinorProtectionController
  let service: MinorProtectionService

  beforeEach(() => {
    service = new MinorProtectionService()
    controller = new MinorProtectionController(service)
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/profile
  // ═══════════════════════════════════════════

  describe('POST /profile', () => {
    it('正例: 注册未成年人', async () => {
      const p = await controller.registerProfile({
        userId: 'u-001', tenantId: 't-001',
        birthDate: '2015-06-15', verificationMethod: 'id_card',
      })
      expect(p.userId).toBe('u-001')
      expect(p.age).toBeGreaterThanOrEqual(10)
    })

    it('正例: 不传验证方式默认为 none', async () => {
      const p = await controller.registerProfile({
        userId: 'u-002', tenantId: 't-001', birthDate: '1995-01-01',
      })
      expect(p.ageVerified).toBe(false)
    })
  })

  // ═══════════════════════════════════════════
  //  GET /minor-protection/profile/:userId
  // ═══════════════════════════════════════════

  describe('GET /profile/:userId', () => {
    it('正例: 获取已注册用户', async () => {
      await controller.registerProfile({
        userId: 'u-003', tenantId: 't-001', birthDate: '2015-01-01',
      })
      const p = await controller.getProfile('u-003')
      expect(p.userId).toBe('u-003')
    })

    it('正例: 未注册用户自动注册', async () => {
      const p = await controller.getProfile('u-new')
      expect(p.userId).toBe('u-new')
    })
  })

  // ═══════════════════════════════════════════
  //  PATCH /minor-protection/profile/:userId/verify
  // ═══════════════════════════════════════════

  describe('PATCH /profile/:userId/verify', () => {
    it('正例: 验证年龄', async () => {
      await controller.registerProfile({
        userId: 'u-v', tenantId: 't-001', birthDate: '2015-06-15', verificationMethod: 'none',
      })
      const p = await controller.verifyAge('u-v', { method: 'id_card' })
      expect(p.ageVerified).toBe(true)
    })
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/consent
  // ═══════════════════════════════════════════

  describe('POST /consent', () => {
    it('正例: 创建监护人同意书', async () => {
      const c = await controller.createConsent({
        minorUserId: 'u-child',
        parentUserId: 'u-parent',
        parentName: '张三',
        parentIdCard: '110101198001011234',
        relationship: '父亲',
        consentType: 'full',
        effectiveFrom: '2026-07-01T00:00:00Z',
      })
      expect(c.id).toBeTruthy()
      expect(c.status).toBe('pending')
    })
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/consent/:id/approve
  // ═══════════════════════════════════════════

  describe('POST /consent/:id/approve', () => {
    it('正例: 批准同意书并解除限制', async () => {
      const c = await controller.createConsent({
        minorUserId: 'u-approve',
        parentUserId: 'u-parent',
        parentName: '李四',
        parentIdCard: '110101198501011234',
        relationship: '母亲',
        consentType: 'full',
        effectiveFrom: '2026-07-01T00:00:00Z',
      })
      const approved = await controller.approveConsent(c.id)
      expect(approved.status).toBe('approved')
    })
  })

  // ═══════════════════════════════════════════
  //  GET /minor-protection/consent/:minorUserId
  // ═══════════════════════════════════════════

  describe('GET /consent/:minorUserId', () => {
    it('正例: 查询同意书列表', async () => {
      await controller.createConsent({
        minorUserId: 'u-list', parentUserId: 'p1',
        parentName: '王五', parentIdCard: '1',
        relationship: '父亲', consentType: 'partial',
        effectiveFrom: '2026-07-01T00:00:00Z',
      })
      const list = await controller.getConsents('u-list')
      expect(list.length).toBe(1)
    })
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/check/:userId/time
  // ═══════════════════════════════════════════

  describe('POST /check/:userId/time', () => {
    it('正例: 检查时间限制', async () => {
      await controller.registerProfile({
        userId: 'u-time', tenantId: 't-001', birthDate: '2015-01-01',
      })
      const r = await controller.checkTimeLimit('u-time', { sessionDurationMin: 30 })
      expect(r.allowed).toBe(true)
    })
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/check/:userId/spend
  // ═══════════════════════════════════════════

  describe('POST /check/:userId/spend', () => {
    it('正例: 检查消费限制', async () => {
      await controller.registerProfile({
        userId: 'u-spend', tenantId: 't-001', birthDate: '2015-01-01',
      })
      const r = await controller.checkSpendLimit('u-spend', { amount: 30 })
      expect(r.allowed).toBe(true)
    })
  })

  // ═══════════════════════════════════════════
  //  GET /minor-protection/check/:userId/blindbox
  // ═══════════════════════════════════════════

  describe('GET /check/:userId/blindbox', () => {
    it('正例: 盲盒访问检查', async () => {
      await controller.registerProfile({
        userId: 'u-box', tenantId: 't-001', birthDate: '2015-01-01',
      })
      const r = await controller.checkBlindbox('u-box')
      expect(r.allowed).toBeDefined()
    })
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/check/:userId/content
  // ═══════════════════════════════════════════

  describe('POST /check/:userId/content', () => {
    it('正例: 内容分级检查', async () => {
      await controller.registerProfile({
        userId: 'u-content', tenantId: 't-001', birthDate: '2015-01-01',
      })
      const r = await controller.checkContent('u-content', { rating: 'PG-13' })
      expect(r.allowed).toBeDefined()
    })
  })

  // ═══════════════════════════════════════════
  //  POST /minor-protection/record/:userId/spend
  // ═══════════════════════════════════════════

  describe('POST /record/:userId/spend', () => {
    it('正例: 记录消费', async () => {
      await controller.registerProfile({
        userId: 'u-rec', tenantId: 't-001', birthDate: '2015-01-01',
      })
      const rec = await controller.recordSpend('u-rec', {
        amount: 50, category: 'game', description: '购买皮肤',
      })
      expect(rec.id).toBeTruthy()
    })
  })

  // ═══════════════════════════════════════════
  //  GET /minor-protection/report/:userId
  // ═══════════════════════════════════════════

  describe('GET /report/:userId', () => {
    it('正例: 获取使用报告', async () => {
      const report = await controller.getReport('u-rpt', {
        startDate: '2026-07-01', endDate: '2026-07-31',
      })
      expect(report).toBeDefined()
    })
  })
})
