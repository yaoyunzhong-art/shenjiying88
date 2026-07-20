import { describe, it, expect } from 'vitest'
import {
  BrandAssetTypeEnum,
  CampaignStatusEnum,
} from './brand-operations.dto'

describe('BrandOperations DTO Enums', () => {
  it('should have all asset types', () => {
    const types = Object.values(BrandAssetTypeEnum)
    expect(types).toEqual(['logo', 'banner', 'video', 'copy'])
  })

  it('should have all campaign statuses', () => {
    const statuses = Object.values(CampaignStatusEnum)
    expect(statuses).toEqual(['draft', 'active', 'ended', 'cancelled'])
  })
})
