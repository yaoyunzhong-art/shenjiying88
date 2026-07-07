import { describe, it, expect } from 'vitest'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  CampaignTypeEnum,
  ChannelEnum,
  ROIAnalysisDto,
  CompareROIDto,
  ProjectROIDto,
  CopyGenerationDto,
  HeadlineOptimizeDto,
  LocalizeCopyDto,
  ABTestDto,
  SuggestCampaignDto,
  BudgetAllocationDto,
  ReachEstimateDto,
  PlanTimelineDto,
  MarketingAnalysisDto,
  BatchCopyGenerationDto,
} from './ai-marketing.dto'

describe('ai-marketing DTO validation', () => {
  // ─── ROIAnalysisDto ──────────────────────────────────────────

  describe('ROIAnalysisDto', () => {
    it('should validate a valid campaignId', async () => {
      const dto = plainToInstance(ROIAnalysisDto, { campaignId: 'camp-001' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty campaignId', async () => {
      const dto = plainToInstance(ROIAnalysisDto, { campaignId: '' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing campaignId', async () => {
      const dto = plainToInstance(ROIAnalysisDto, {})
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── CompareROIDto ───────────────────────────────────────────

  describe('CompareROIDto', () => {
    it('should validate with campaignIds array', async () => {
      const dto = plainToInstance(CompareROIDto, { campaignIds: ['camp-001', 'camp-002'] })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty array', async () => {
      const dto = plainToInstance(CompareROIDto, { campaignIds: [] })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing campaignIds', async () => {
      const dto = plainToInstance(CompareROIDto, {})
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── ProjectROIDto ───────────────────────────────────────────

  describe('ProjectROIDto', () => {
    it('should validate with required fields', async () => {
      const dto = plainToInstance(ProjectROIDto, {
        type: 'performance',
        budget: 50000,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject negative budget', async () => {
      const dto = plainToInstance(ProjectROIDto, {
        type: 'brand',
        budget: -100,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject invalid campaign type', async () => {
      const dto = plainToInstance(ProjectROIDto, {
        type: 'invalid',
        budget: 1000,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should accept optional expected fields', async () => {
      const dto = plainToInstance(ProjectROIDto, {
        type: 'performance',
        budget: 50000,
        expectedCPM: 100,
        expectedCTR: 0.03,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  // ─── CopyGenerationDto ───────────────────────────────────────

  describe('CopyGenerationDto', () => {
    it('should validate with required fields', async () => {
      const dto = plainToInstance(CopyGenerationDto, {
        product: '新品',
        goal: 'conversion',
        audience: '年轻用户',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject invalid goal', async () => {
      const dto = plainToInstance(CopyGenerationDto, {
        product: '新品',
        goal: 'invalid',
        audience: '用户',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject empty product', async () => {
      const dto = plainToInstance(CopyGenerationDto, {
        product: '',
        goal: 'awareness',
        audience: '用户',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── HeadlineOptimizeDto ─────────────────────────────────────

  describe('HeadlineOptimizeDto', () => {
    it('should validate with headline', async () => {
      const dto = plainToInstance(HeadlineOptimizeDto, { headline: '新品发布' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty headline', async () => {
      const dto = plainToInstance(HeadlineOptimizeDto, { headline: '' })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── LocalizeCopyDto ─────────────────────────────────────────

  describe('LocalizeCopyDto', () => {
    it('should validate with all fields', async () => {
      const dto = plainToInstance(LocalizeCopyDto, {
        headline: '新品',
        body: '正文',
        cta: '购买',
        taglines: ['品质'],
        locale: 'en-US',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject invalid locale', async () => {
      const dto = plainToInstance(LocalizeCopyDto, {
        headline: '新品',
        body: '正文',
        cta: '购买',
        taglines: ['品质'],
        locale: 'invalid',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── ABTestDto ───────────────────────────────────────────────

  describe('ABTestDto', () => {
    it('should validate minimal ab test', async () => {
      const dto = plainToInstance(ABTestDto, {
        brief: { product: 'P', goal: 'conversion', audience: 'A' },
        count: 3,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject count less than 2', async () => {
      const dto = plainToInstance(ABTestDto, {
        brief: { product: 'P', goal: 'conversion', audience: 'A' },
        count: 1,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── SuggestCampaignDto ──────────────────────────────────────

  describe('SuggestCampaignDto', () => {
    it('should validate with valid goal', async () => {
      const dto = plainToInstance(SuggestCampaignDto, {
        goal: 'awareness',
        budget: 100000,
        audience: '白领',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject invalid goal', async () => {
      const dto = plainToInstance(SuggestCampaignDto, {
        goal: 'unknown',
        budget: 50000,
        audience: '用户',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── BudgetAllocationDto ─────────────────────────────────────

  describe('BudgetAllocationDto', () => {
    it('should validate with campaignType enum', async () => {
      const dto = plainToInstance(BudgetAllocationDto, {
        campaignType: 'performance',
        totalBudget: 100000,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject negative budget', async () => {
      const dto = plainToInstance(BudgetAllocationDto, {
        campaignType: 'brand',
        totalBudget: -1,
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── ReachEstimateDto ────────────────────────────────────────

  describe('ReachEstimateDto', () => {
    it('should validate with valid channel', async () => {
      const dto = plainToInstance(ReachEstimateDto, {
        audience: 50000,
        channel: 'wechat',
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject invalid channel', async () => {
      const dto = plainToInstance(ReachEstimateDto, {
        audience: 100,
        channel: 'invalid',
      })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── PlanTimelineDto ─────────────────────────────────────────

  describe('PlanTimelineDto', () => {
    it('should validate with valid goal', async () => {
      const dto = plainToInstance(PlanTimelineDto, { goal: 'brand' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  // ─── MarketingAnalysisDto ────────────────────────────────────

  describe('MarketingAnalysisDto', () => {
    it('should validate with required campaignId', async () => {
      const dto = plainToInstance(MarketingAnalysisDto, { campaignId: 'camp-001' })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should accept optional boolean flags', async () => {
      const dto = plainToInstance(MarketingAnalysisDto, {
        campaignId: 'camp-001',
        includeROI: true,
        includeTimeline: false,
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  // ─── BatchCopyGenerationDto ──────────────────────────────────

  describe('BatchCopyGenerationDto', () => {
    it('should validate with items array', async () => {
      const dto = plainToInstance(BatchCopyGenerationDto, {
        items: [
          { product: 'P1', goal: 'conversion', audience: 'A1' },
          { product: 'P2', goal: 'awareness', audience: 'A2' },
        ],
      })
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty items', async () => {
      const dto = plainToInstance(BatchCopyGenerationDto, { items: [] })
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  // ─── Enum values ─────────────────────────────────────────────

  describe('enum values', () => {
    it('should have 6 campaign types', () => {
      expect(Object.values(CampaignTypeEnum)).toHaveLength(6)
    })

    it('should have 8 channels', () => {
      expect(Object.values(ChannelEnum)).toHaveLength(8)
    })
  })
})
