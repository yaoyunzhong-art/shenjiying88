export interface CampaignRecord {
  id: string
  name: string
  channel: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  roi: string
  status: 'active' | 'paused' | 'ended'
  [key: string]: unknown
}

export interface BrandCampaignsSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'dev-tools-brand-campaigns-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  campaigns: CampaignRecord[]
  channels: string[]
}

const CAMPAIGNS: CampaignRecord[] = [
  { id: 'CM-01', name: '暑期档抖音推广', channel: '抖音', budget: 15000, spent: 9800, impressions: 120000, clicks: 3600, conversions: 480, roi: '65%', status: 'active' },
  { id: 'CM-02', name: '会员日营销', channel: '短信', budget: 5000, spent: 3200, impressions: 45000, clicks: 1200, conversions: 180, roi: '56%', status: 'active' },
  { id: 'CM-03', name: '开学季活动', channel: '公众号', budget: 8000, spent: 7600, impressions: 68000, clicks: 1800, conversions: 240, roi: '48%', status: 'ended' },
  { id: 'CM-04', name: '周末特惠推送', channel: '小程序', budget: 3000, spent: 1800, impressions: 28000, clicks: 900, conversions: 120, roi: '67%', status: 'active' },
  { id: 'CM-05', name: '短视频团购', channel: '抖音', budget: 12000, spent: 8500, impressions: 95000, clicks: 2800, conversions: 350, roi: '62%', status: 'active' },
]

export async function loadBrandCampaignsSnapshot(): Promise<BrandCampaignsSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'dev-tools-brand-campaigns-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadBrandCampaignsSnapshot -> local E54 snapshot shell',
    businessDataSource: 'brand-campaigns-data.ts mock campaign rows',
    refreshPath: 'CampaignPage -> loadBrandCampaignsSnapshot',
    note: '当前页面已按 E54 三层模板壳层化，活动列表、渠道筛选与创建弹窗仍使用本地 mock 数据。',
    campaigns: CAMPAIGNS,
    channels: [...new Set(CAMPAIGNS.map((campaign) => campaign.channel))],
  }
}
