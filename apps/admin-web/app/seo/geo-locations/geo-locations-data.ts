export interface GeoRow {
  id: string
  city: string
  district: string
  landmark: string
  lat: number
  lng: number
  radiusKm: number
  coverageTier: 'core' | 'growth'
}

export interface GeoLocationsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'seo-geo-locations-api' | 'seo-geo-locations-fallback'
  tenantId: string
  rows: GeoRow[]
  totalRows: number
  cityCount: number
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

const GEO_ROWS: GeoRow[] = [
  {
    id: 'G1',
    city: '上海',
    district: '徐汇',
    landmark: '徐家汇',
    lat: 31.19,
    lng: 121.44,
    radiusKm: 3,
    coverageTier: 'core',
  },
  {
    id: 'G2',
    city: '上海',
    district: '浦东',
    landmark: '陆家嘴',
    lat: 31.24,
    lng: 121.51,
    radiusKm: 3,
    coverageTier: 'core',
  },
  {
    id: 'G3',
    city: '北京',
    district: '朝阳',
    landmark: '三里屯',
    lat: 39.93,
    lng: 116.45,
    radiusKm: 2,
    coverageTier: 'core',
  },
  {
    id: 'G4',
    city: '深圳',
    district: '南山',
    landmark: '海岸城',
    lat: 22.52,
    lng: 113.94,
    radiusKm: 2,
    coverageTier: 'growth',
  },
  {
    id: 'G5',
    city: '成都',
    district: '锦江',
    landmark: '春熙路',
    lat: 30.66,
    lng: 104.08,
    radiusKm: 2,
    coverageTier: 'growth',
  },
]

export async function loadGeoLocationsSnapshot(
  tenantId = 'tenant-seo'
): Promise<GeoLocationsSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'seo-geo-locations-fallback',
    tenantId,
    rows: GEO_ROWS,
    totalRows: GEO_ROWS.length,
    cityCount: new Set(GEO_ROWS.map((row) => row.city)).size,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadGeoLocationsSnapshot fallback -> geo targeting registry snapshot',
    businessDataSource: 'local geo rows + city and radius samples',
    refreshPath: 'GeoLocationsPage -> loadGeoLocationsSnapshot',
    note: '当前页面展示 GEO 地域标签 fallback 快照，后续切换到真实地域定向配置中心。',
  }
}
