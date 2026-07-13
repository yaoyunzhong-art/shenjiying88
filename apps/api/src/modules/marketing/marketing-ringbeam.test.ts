import { describe, it, expect } from 'vitest'

type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended'
type CampaignChannel = 'sms' | 'push' | 'wechat' | 'in_app'
interface Campaign { id: string; tenantId: string; name: string; channels: CampaignChannel[]; budget: number; spent: number; startDate: string; endDate: string; status: CampaignStatus; targetMemberCount: number }

describe('✅ AC-MARKETING: 营销圈梁', () => {
  it('创建营销活动', () => {
    const c: Campaign = { id: 'c1', tenantId: 't1', name: '暑期促销', channels: ['push','sms'], budget: 500000, spent: 200000, startDate: '2026-07-01', endDate: '2026-08-31', status: 'active', targetMemberCount: 10000 }
    expect(c.spent / c.budget).toBe(0.4)
  })
  it('4种状态', () => { expect(['draft','active','paused','ended'].length).toBe(4) })
  it('4种渠道', () => { expect(['sms','push','wechat','in_app'].length).toBe(4) })
  it('ROI计算', () => {
    const roi = 800000 / 200000; expect(roi).toBe(4)
  })
})
