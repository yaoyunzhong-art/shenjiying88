import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  RegisterPartnerDto,
  UpdatePartnerDto,
  ListPartnerQueryDto,
  AssignGradeDto,
  CreateSettlementDto,
  SettlementParticipantDto,
  SetMetricsDto,
  ScanUnlinkedOrdersDto,
  LinkOrderDto,
} from './alliance.dto'

describe('Alliance DTOs', () => {
  // ─── RegisterPartnerDto ──────────────────────────────────────
  describe('RegisterPartnerDto', () => {
    it('应通过有效的注册数据', async () => {
      const dto = new RegisterPartnerDto()
      dto.name = '测试合作商户'
      dto.businessType = 'RETAIL' as any
      dto.contact = '13800138000'
      dto.address = '上海市浦东新区'
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('name 为空时应失败', async () => {
      const dto = new RegisterPartnerDto()
      dto.name = ''
      dto.businessType = 'RETAIL' as any
      dto.contact = '13800138000'
      dto.address = '上海市浦东新区'
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
      expect(errors.some((e) => e.property === 'name')).toBe(true)
    })

    it('businessType 无效时应失败', async () => {
      const dto = new RegisterPartnerDto()
      dto.name = '测试商户'
      dto.businessType = 'INVALID' as any
      dto.contact = '13800138000'
      dto.address = '上海市浦东新区'
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
      expect(errors.some((e) => e.property === 'businessType')).toBe(true)
    })

    it('contact 为空时应失败', async () => {
      const dto = new RegisterPartnerDto()
      dto.name = '测试商户'
      dto.businessType = 'RETAIL' as any
      dto.contact = ''
      dto.address = '上海市浦东新区'
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'contact')).toBe(true)
    })
  })

  // ─── UpdatePartnerDto ────────────────────────────────────────
  describe('UpdatePartnerDto', () => {
    it('应接受部分更新数据', async () => {
      const dto = new UpdatePartnerDto()
      dto.name = '更新名'
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('所有字段都是可选的', async () => {
      const dto = new UpdatePartnerDto()
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('无效 businessType 时应失败', async () => {
      const dto = new UpdatePartnerDto()
      dto.businessType = 'BAD' as any
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'businessType')).toBe(true)
    })
  })

  // ─── ListPartnerQueryDto ─────────────────────────────────────
  describe('ListPartnerQueryDto', () => {
    it('应接受空查询', async () => {
      const dto = new ListPartnerQueryDto()
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('无效枚举值应失败', async () => {
      const dto = new ListPartnerQueryDto()
      dto.businessType = 'INVALID' as any
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'businessType')).toBe(true)
    })
  })

  // ─── AssignGradeDto ──────────────────────────────────────────
  describe('AssignGradeDto', () => {
    it('有效等级应通过', async () => {
      for (const g of ['S', 'A', 'B', 'C']) {
        const dto = new AssignGradeDto()
        dto.grade = g as any
        const errors = await validate(dto)
        expect(errors.length).toBe(0)
      }
    })

    it('无效等级应失败', async () => {
      const dto = new AssignGradeDto()
      dto.grade = 'D' as any
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── SettlementParticipantDto ────────────────────────────────
  describe('SettlementParticipantDto', () => {
    it('有效参与方应通过', async () => {
      const dto = new SettlementParticipantDto()
      dto.partnerId = 'p-001'
      dto.partnerName = '伙伴1'
      dto.ratio = 0.5
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('ratio 为负数时应失败', async () => {
      const dto = new SettlementParticipantDto()
      dto.partnerId = 'p-001'
      dto.partnerName = '伙伴1'
      dto.ratio = -0.1
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'ratio')).toBe(true)
    })

    it('ratio > 1 时应失败', async () => {
      const dto = new SettlementParticipantDto()
      dto.partnerId = 'p-001'
      dto.partnerName = '伙伴1'
      dto.ratio = 1.5
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'ratio')).toBe(true)
    })
  })

  // ─── CreateSettlementDto ─────────────────────────────────────
  describe('CreateSettlementDto', () => {
    it('有效数据应通过', async () => {
      const p = new SettlementParticipantDto()
      p.partnerId = 'p-001'
      p.partnerName = '伙伴1'
      p.ratio = 0.5

      const dto = new CreateSettlementDto()
      dto.orderId = 'order-001'
      dto.type = 'ratio' as any
      dto.totalAmount = 10000
      dto.participants = [p]
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('totalAmount 为 0 时应失败', async () => {
      const dto = new CreateSettlementDto()
      dto.orderId = 'order-001'
      dto.type = 'ratio' as any
      dto.totalAmount = 0
      dto.participants = []
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })

    it('participants 为空数组时应失败', async () => {
      const dto = new CreateSettlementDto()
      dto.orderId = 'order-001'
      dto.type = 'ratio' as any
      dto.totalAmount = 10000
      dto.participants = []
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'participants')).toBe(true)
    })
  })

  // ─── SetMetricsDto ───────────────────────────────────────────
  describe('SetMetricsDto', () => {
    it('空对象应通过', async () => {
      const dto = new SetMetricsDto()
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('activeDays 为负数应失败', async () => {
      const dto = new SetMetricsDto()
      dto.activeDays = -1
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'activeDays')).toBe(true)
    })

    it('activeDays > 31 应失败', async () => {
      const dto = new SetMetricsDto()
      dto.activeDays = 32
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'activeDays')).toBe(true)
    })
  })

  // ─── ScanUnlinkedOrdersDto ───────────────────────────────────
  describe('ScanUnlinkedOrdersDto', () => {
    it('有效数据应通过', async () => {
      const dto = new ScanUnlinkedOrdersDto()
      dto.storeId = 'store-A'
      dto.since = '2026-01-01T00:00:00Z'
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('storeId 为空时应失败', async () => {
      const dto = new ScanUnlinkedOrdersDto()
      dto.storeId = ''
      dto.since = '2026-01-01T00:00:00Z'
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'storeId')).toBe(true)
    })
  })

  // ─── LinkOrderDto ────────────────────────────────────────────
  describe('LinkOrderDto', () => {
    it('有效数据应通过', async () => {
      const dto = new LinkOrderDto()
      dto.partnerId = 'p-001'
      const errors = await validate(dto)
      expect(errors.length).toBe(0)
    })

    it('partnerId 为空时应失败', async () => {
      const dto = new LinkOrderDto()
      dto.partnerId = ''
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'partnerId')).toBe(true)
    })
  })
})
