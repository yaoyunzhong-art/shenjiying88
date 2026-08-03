export interface MetadataRow {
  id: string
  path: string
  title: string
  description: string
  canonical: string
  locale: string
  keywords: string
  owner: string
}

export interface MetadataSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'seo-metadata-api' | 'seo-metadata-fallback'
  tenantId: string
  rows: MetadataRow[]
  totalRows: number
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

const METADATA_ROWS: MetadataRow[] = [
  {
    id: 'M1',
    path: '/stores/shanghai-xuhui',
    title: '上海徐汇旗舰店 | 品牌',
    description: '上海徐汇区最好的电玩城',
    canonical: 'https://domain.com/stores/shanghai-xuhui',
    locale: 'zh-CN',
    keywords: '上海电玩城,徐汇娱乐',
    owner: '城市站运营组',
  },
  {
    id: 'M2',
    path: '/stores/beijing-chaoyang',
    title: '北京朝阳店 | 品牌',
    description: '北京朝阳区娱乐好去处',
    canonical: 'https://domain.com/stores/beijing-chaoyang',
    locale: 'zh-CN',
    keywords: '北京电玩城,朝阳',
    owner: '城市站运营组',
  },
  {
    id: 'M3',
    path: '/activities/summer-2026',
    title: '2026暑期狂欢活动',
    description: '暑假特惠套餐',
    canonical: 'https://domain.com/activities/summer-2026',
    locale: 'zh-CN',
    keywords: '暑期活动,特惠',
    owner: '营销活动组',
  },
]

export async function loadMetadataSnapshot(
  tenantId = 'tenant-seo'
): Promise<MetadataSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'seo-metadata-fallback',
    tenantId,
    rows: METADATA_ROWS,
    totalRows: METADATA_ROWS.length,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadMetadataSnapshot fallback -> metadata registry snapshot',
    businessDataSource: 'local metadata rows + owner mapping samples',
    refreshPath: 'SEOMetadataPage -> loadMetadataSnapshot',
    note: '当前页面展示 SEO 元数据 fallback 快照，后续切换到真实元数据配置中心。',
  }
}
