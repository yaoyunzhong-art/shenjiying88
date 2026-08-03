import { describe, it, expect } from 'vitest'
import {
  ChannelTypeEnum,
  ChannelStatusEnum,
  KpiCategoryEnum,
  KpiPeriodEnum,
} from './brand-operations.channel-kpi.dto'

describe('BrandOperations Channel-KPI DTO Enums', () => {
  it('should have all channel types', () => {
    const types = Object.values(ChannelTypeEnum)
    expect(types).toContain('social_media')
    expect(types).toContain('search_engine')
    expect(types).toContain('display_ad')
    expect(types).toContain('offline_store')
    expect(types).toContain('email')
    expect(types).toContain('sms')
    expect(types).toContain('app_push')
    expect(types).toContain('affiliate')
    expect(types).toContain('other')
    expect(types).toHaveLength(9)
  })

  it('should have all channel statuses', () => {
    const statuses = Object.values(ChannelStatusEnum)
    expect(statuses).toEqual(['active', 'inactive', 'paused'])
  })

  it('should have all KPI categories', () => {
    const categories = Object.values(KpiCategoryEnum)
    expect(categories).toContain('exposure')
    expect(categories).toContain('engagement')
    expect(categories).toContain('conversion')
    expect(categories).toContain('revenue')
    expect(categories).toContain('retention')
    expect(categories).toContain('brand_awareness')
    expect(categories).toHaveLength(6)
  })

  it('should have all KPI periods', () => {
    const periods = Object.values(KpiPeriodEnum)
    expect(periods).toEqual(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
  })
})
