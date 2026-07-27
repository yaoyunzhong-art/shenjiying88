export interface BrandRecord {
  id: string
  name: string
  domain: string
  status: 'active' | 'pending' | 'expired'
  templates: number
  campaigns: number
  emailCount: number
  created: string
  [key: string]: unknown
}

export interface BrandSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'dev-tools-brand-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  brands: BrandRecord[]
}

const BRANDS: BrandRecord[] = [
  { id: 'B-01', name: '火星蹦床公园', domain: 'mars.venuetech.com', status: 'active', templates: 5, campaigns: 12, emailCount: 8, created: '2026-01' },
  { id: 'B-02', name: '银河电竞馆', domain: 'galaxy.venuetech.com', status: 'active', templates: 3, campaigns: 8, emailCount: 5, created: '2026-02' },
  { id: 'B-03', name: '星际儿童乐园', domain: 'star.venuetech.com', status: 'pending', templates: 2, campaigns: 3, emailCount: 2, created: '2026-04' },
  { id: 'B-04', name: '极速卡丁车', domain: 'speed.venuetech.com', status: 'active', templates: 4, campaigns: 15, emailCount: 6, created: '2026-01' },
]

export async function loadBrandSnapshot(): Promise<BrandSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'dev-tools-brand-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadBrandSnapshot -> local E54 snapshot shell',
    businessDataSource: 'brand-data.ts mock brand rows',
    refreshPath: 'BrandPage -> loadBrandSnapshot',
    note: '当前页面已按 E54 三层模板壳层化，品牌列表与统计仍使用本地 mock 数据。',
    brands: BRANDS,
  }
}
