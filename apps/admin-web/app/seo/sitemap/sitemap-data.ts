export interface SitemapRow {
  id: string
  path: string
  changefreq: 'daily' | 'weekly' | 'monthly'
  priority: number
  lastmod: string
  bucket: string
}

export interface SitemapSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'seo-sitemap-api' | 'seo-sitemap-fallback'
  tenantId: string
  rows: SitemapRow[]
  totalRows: number
  dailyCount: number
  weeklyCount: number
  monthlyCount: number
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

const SITEMAP_ROWS: SitemapRow[] = [
  { id: 'S1', path: '/', changefreq: 'daily', priority: 0.9, lastmod: '2026-07-19', bucket: 'home' },
  {
    id: 'S2',
    path: '/stores/shanghai-xuhui',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: '2026-07-18',
    bucket: 'store',
  },
  {
    id: 'S3',
    path: '/stores/beijing-chaoyang',
    changefreq: 'weekly',
    priority: 0.8,
    lastmod: '2026-07-18',
    bucket: 'store',
  },
  {
    id: 'S4',
    path: '/activities/summer-2026',
    changefreq: 'daily',
    priority: 0.7,
    lastmod: '2026-07-19',
    bucket: 'campaign',
  },
  {
    id: 'S5',
    path: '/deals/weekend-special',
    changefreq: 'daily',
    priority: 0.6,
    lastmod: '2026-07-19',
    bucket: 'campaign',
  },
  { id: 'S6', path: '/about', changefreq: 'monthly', priority: 0.5, lastmod: '2026-06-01', bucket: 'brand' },
]

function countByFrequency(rows: SitemapRow[], changefreq: SitemapRow['changefreq']): number {
  return rows.filter((row) => row.changefreq === changefreq).length
}

export async function loadSitemapSnapshot(
  tenantId = 'tenant-seo'
): Promise<SitemapSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'seo-sitemap-fallback',
    tenantId,
    rows: SITEMAP_ROWS,
    totalRows: SITEMAP_ROWS.length,
    dailyCount: countByFrequency(SITEMAP_ROWS, 'daily'),
    weeklyCount: countByFrequency(SITEMAP_ROWS, 'weekly'),
    monthlyCount: countByFrequency(SITEMAP_ROWS, 'monthly'),
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadSitemapSnapshot fallback -> sitemap registry snapshot',
    businessDataSource: 'local sitemap rows + frequency summary samples',
    refreshPath: 'SitemapPage -> loadSitemapSnapshot',
    note: '当前页面展示 Sitemap fallback 快照，后续切换到真实站点地图编排服务。',
  }
}
