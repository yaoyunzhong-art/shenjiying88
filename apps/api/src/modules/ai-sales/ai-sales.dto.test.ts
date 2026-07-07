import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'
import {
  RecommendationRequestDto,
  UpsellRequestDto,
  CrossSellRequestDto,
  ObjectionClassifyRequestDto,
  ObjectionResponseRequestDto,
  SimulateConversationRequestDto,
  ScheduleFollowUpRequestDto,
  MarkCompletedRequestDto,
  SetBirthdayRequestDto,
  RecordPurchaseDto
} from './ai-sales.dto'

describe('RecommendationRequestDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = plainToInstance(RecommendationRequestDto, {
      customerId: 'cust-001',
      recentViewed: ['prod-001']
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('空customerId应报错', async () => {
    const dto = plainToInstance(RecommendationRequestDto, {
      customerId: '',
      recentViewed: []
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('非法scenario应报错', async () => {
    const dto = plainToInstance(RecommendationRequestDto, {
      customerId: 'cust-001',
      recentViewed: [],
      scenario: 'invalid-scenario'
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('UpsellRequestDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = plainToInstance(UpsellRequestDto, { productId: 'prod-001' })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('空productId应报错', async () => {
    const dto = plainToInstance(UpsellRequestDto, { productId: '' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('ObjectionClassifyRequestDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = plainToInstance(ObjectionClassifyRequestDto, { customerReply: '太贵了' })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('ObjectionResponseRequestDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = plainToInstance(ObjectionResponseRequestDto, {
      customerId: 'cust-001',
      productId: 'prod-001',
      objectionType: 'price'
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('非法objectionType应报错', async () => {
    const dto = plainToInstance(ObjectionResponseRequestDto, {
      customerId: 'cust-001',
      productId: 'prod-001',
      objectionType: 'invalid'
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('SimulateConversationRequestDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = plainToInstance(SimulateConversationRequestDto, {
      objection: '太贵了',
      response: '现在8折'
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('ScheduleFollowUpRequestDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = plainToInstance(ScheduleFollowUpRequestDto, {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'birthday',
      scheduledAt: new Date().toISOString()
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })

  it('非法type应报错', async () => {
    const dto = plainToInstance(ScheduleFollowUpRequestDto, {
      customerId: 'cust-001',
      salesId: 'sales-001',
      type: 'invalid-type',
      scheduledAt: new Date().toISOString()
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('MarkCompletedRequestDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = plainToInstance(MarkCompletedRequestDto, { followUpId: 'fu-001' })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})

describe('RecordPurchaseDto', () => {
  it('有效数据应通过验证', async () => {
    const dto = plainToInstance(RecordPurchaseDto, {
      customerId: 'cust-001',
      productId: 'prod-001'
    })
    const errors = await validate(dto)
    expect(errors.length).toBe(0)
  })
})
