import 'reflect-metadata'
import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  GetKPIDto, TrackKPIDto, TrackMentionDto, UpdateHealthDto,
  TrackContentDto, GenerateReportDto, ROIDto,
  AnalyticsQueryDto, CompareBrandsDto, CompetitorQueryDto,
  TopContentQueryDto, HealthTrendQueryDto, ContentSuggestionsDto,
} from './brand-analytics.dto'

describe('GetKPIDto', () => {
  it('passes with valid dates', async () => {
    const dto = new GetKPIDto()
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-12-31'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('fails with invalid date format', async () => {
    const dto = new GetKPIDto()
    dto.startDate = '01-01-2026'
    dto.endDate = '2026-12-31'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('TrackKPIDto', () => {
  it('passes with required fields', async () => {
    const dto = new TrackKPIDto()
    dto.brandId = 'brand-1'
    dto.tenantId = 't1'
    dto.metrics = { impressions: 1000 }
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('fails without brandId', async () => {
    const dto = new TrackKPIDto()
    dto.tenantId = 't1'
    dto.metrics = {}
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('TrackMentionDto', () => {
  it('passes with all required fields', async () => {
    const dto = new TrackMentionDto()
    dto.brandId = 'brand-1'
    dto.date = '2026-07-29'
    dto.platform = 'weibo'
    dto.mentionCount = 100
    dto.positiveCount = 60
    dto.negativeCount = 10
    dto.neutralCount = 30
    dto.sentimentScore = 0.5
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('GenerateReportDto', () => {
  it('passes with valid reportType', async () => {
    const dto = new GenerateReportDto()
    dto.reportType = 'weekly'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('passes with reportType as string (controller accepts string)', async () => {
    const dto = new GenerateReportDto()
    dto.reportType = 'daily'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('ROIDto', () => {
  it('passes with valid dates', async () => {
    const dto = new ROIDto()
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-12-31'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('AnalyticsQueryDto', () => {
  it('passes with valid granularity', async () => {
    const dto = new AnalyticsQueryDto()
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    dto.granularity = 'month' as any
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('fails without granularity', async () => {
    const dto = new AnalyticsQueryDto()
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('CompareBrandsDto', () => {
  it('requires at least 2 brandIds', async () => {
    const dto = new CompareBrandsDto()
    dto.brandIds = ['b1']
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('passes with 2 brandIds', async () => {
    const dto = new CompareBrandsDto()
    dto.brandIds = ['b1', 'b2']
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('CompetitorQueryDto', () => {
  it('passes with valid fields', async () => {
    const dto = new CompetitorQueryDto()
    dto.brandId = 'brand-1'
    dto.competitorIds = ['comp-1', 'comp-2']
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('fails with empty competitorIds', async () => {
    const dto = new CompetitorQueryDto()
    dto.brandId = 'brand-1'
    dto.competitorIds = []
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('fails without brandId', async () => {
    const dto = new CompetitorQueryDto()
    dto.competitorIds = ['comp-1']
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('TopContentQueryDto', () => {
  it('passes with only required date fields', async () => {
    const dto = new TopContentQueryDto()
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('passes with optional contentType', async () => {
    const dto = new TopContentQueryDto()
    dto.startDate = '2026-01-01'
    dto.endDate = '2026-06-30'
    dto.contentType = 'video' as any
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('HealthTrendQueryDto', () => {
  it('passes when empty', async () => {
    const dto = new HealthTrendQueryDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('passes with digits-only months', async () => {
    const dto = new HealthTrendQueryDto()
    dto.months = '6'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('fails with non-numeric months', async () => {
    const dto = new HealthTrendQueryDto()
    dto.months = 'abc'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('ContentSuggestionsDto', () => {
  it('passes when empty', async () => {
    const dto = new ContentSuggestionsDto()
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('passes with contentType', async () => {
    const dto = new ContentSuggestionsDto()
    dto.contentType = 'video'
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})
