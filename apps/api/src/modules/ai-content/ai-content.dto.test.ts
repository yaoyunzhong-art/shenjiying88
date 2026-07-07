/**
 * ai-content.dto.test.ts - DTO validation tests for ai-content module
 */
import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  AiContentGenerateDto,
  ContentModerationDto,
  VideoDeduplicationDto,
  ProgressAnalysisDto,
  BatchModerationItemDto,
  BatchModerationDto,
  AddHighlightsDto,
  ShareReportDto,
  RecordMetricDto,
  ReviewActionDto,
  ContentTypeEnum,
} from './ai-content.dto'

describe('AiContentGenerateDto', () => {
  it('DTO-1 should accept valid generate request', async () => {
    const dto = new AiContentGenerateDto()
    dto.eventId = 'evt-001'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-2 should reject empty eventId', async () => {
    const dto = new AiContentGenerateDto()
    dto.eventId = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('eventId')
  })

  it('DTO-3 should accept optional template field', async () => {
    const dto = new AiContentGenerateDto()
    dto.eventId = 'evt-001'
    dto.template = 'detailed'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('ContentModerationDto', () => {
  it('DTO-4 should accept valid moderation request', async () => {
    const dto = new ContentModerationDto()
    dto.content = '今天天气真好'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-5 should reject empty content', async () => {
    const dto = new ContentModerationDto()
    dto.content = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('content')
  })

  it('DTO-6 should accept optional type field', async () => {
    const dto = new ContentModerationDto()
    dto.content = 'test'
    dto.type = ContentTypeEnum.IMAGE_DESCRIPTION
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('VideoDeduplicationDto', () => {
  it('DTO-7 should accept valid dedup request', async () => {
    const dto = new VideoDeduplicationDto()
    dto.videoId = 'video-001'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-8 should reject empty videoId', async () => {
    const dto = new VideoDeduplicationDto()
    dto.videoId = ''
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('DTO-9 should accept targetVideoIds array', async () => {
    const dto = new VideoDeduplicationDto()
    dto.videoId = 'video-001'
    dto.targetVideoIds = ['video-002', 'video-003']
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('ProgressAnalysisDto', () => {
  it('DTO-10 should accept valid progress analysis request', async () => {
    const dto = new ProgressAnalysisDto()
    dto.memberId = 'm-001'
    dto.metric = 'sales'
    dto.beforePeriod = '2024-Q1'
    dto.afterPeriod = '2024-Q2'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-11 should reject missing fields', async () => {
    const dto = new ProgressAnalysisDto()
    dto.memberId = 'm-001'
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThanOrEqual(3)
  })
})

describe('BatchModerationDto', () => {
  it('DTO-12 should accept valid batch request', async () => {
    const item = new BatchModerationItemDto()
    item.id = '1'
    item.content = 'test content'
    item.type = ContentTypeEnum.TEXT

    const dto = new BatchModerationDto()
    dto.items = [item]
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-13 should reject empty batch', async () => {
    const dto = new BatchModerationDto()
    dto.items = []
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('DTO-14 should reject items with empty content', async () => {
    const item = new BatchModerationItemDto()
    item.id = '1'
    item.content = ''
    item.type = ContentTypeEnum.TEXT

    const dto = new BatchModerationDto()
    dto.items = [item]
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('AddHighlightsDto', () => {
  it('DTO-15 should accept valid highlights array', async () => {
    const dto = new AddHighlightsDto()
    dto.highlights = ['团队协作出色', '氛围活跃']
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-16 should reject empty highlights array', async () => {
    const dto = new AddHighlightsDto()
    dto.highlights = []
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('ShareReportDto', () => {
  it('DTO-17 should accept valid recipients array', async () => {
    const dto = new ShareReportDto()
    dto.recipients = ['user@test.com']
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-18 should reject empty recipients', async () => {
    const dto = new ShareReportDto()
    dto.recipients = []
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('RecordMetricDto', () => {
  it('DTO-19 should accept valid metric record', async () => {
    const dto = new RecordMetricDto()
    dto.memberId = 'm-001'
    dto.period = '2024-Q1'
    dto.metric = 'sales'
    dto.value = 80
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-20 should reject negative value', async () => {
    const dto = new RecordMetricDto()
    dto.memberId = 'm-001'
    dto.period = '2024-Q1'
    dto.metric = 'sales'
    dto.value = -1
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].property).toBe('value')
  })
})

describe('ReviewActionDto', () => {
  it('DTO-21 should accept approve action', async () => {
    const dto = new ReviewActionDto()
    dto.action = 'approve'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-22 should accept reject action', async () => {
    const dto = new ReviewActionDto()
    dto.action = 'reject'
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('DTO-23 should reject invalid action', async () => {
    const dto = new ReviewActionDto()
    dto.action = 'delete' as any
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})
