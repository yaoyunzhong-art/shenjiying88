const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface MarketItem {
  id: string
  code: string
  name: string
  locale: string
  currency: string
  timezone: string
  status: 'active' | 'inactive' | 'pending'
  tenantCount: number
  brandCount: number
  storeCount: number
  lastDeployed: string
  region: 'asia-pacific' | 'north-america' | 'europe' | 'middle-east' | 'latin-america'
}

export interface MarketDetail extends MarketItem {
  description: string
  defaultLanguage: string
  dateFormat: string
  numberFormat: string
  regulatoryBodies: string[]
  paymentMethods: string[]
  activatedAt: string
  contactName: string
  contactEmail: string
}

export interface MarketsSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  markets: MarketItem[]
  generatedAt: string
  error?: string
}

export type MarketStatus = MarketItem['status']
export type MarketRegion = MarketItem['region']

export const MARKET_STATUSES: MarketStatus[] = ['active', 'inactive', 'pending']

export const MARKET_REGIONS: MarketRegion[] = [
  'asia-pacific',
  'north-america',
  'europe',
  'middle-east',
  'latin-america',
]

export const MARKET_STATUS_MAP: Record<
  MarketStatus,
  { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }
> = {
  active: { label: '运营中', variant: 'success' },
  inactive: { label: '已停用', variant: 'neutral' },
  pending: { label: '待激活', variant: 'warning' },
}

export const MARKET_REGION_MAP: Record<
  MarketRegion,
  { label: string; variant: 'success' | 'neutral' | 'warning' | 'danger' }
> = {
  'asia-pacific': { label: '亚太', variant: 'success' },
  'north-america': { label: '北美', variant: 'neutral' },
  europe: { label: '欧洲', variant: 'warning' },
  'middle-east': { label: '中东', variant: 'danger' },
  'latin-america': { label: '拉美', variant: 'neutral' },
}

export const MOCK_MARKETS: MarketItem[] = [
  { id: 'm1', code: 'cn-mainland', name: '中国大陆', locale: 'zh-CN', currency: 'CNY', timezone: 'Asia/Shanghai', status: 'active', tenantCount: 8, brandCount: 7, storeCount: 12, lastDeployed: '2026-06-12 14:30', region: 'asia-pacific' },
  { id: 'm2', code: 'cn-hk', name: '中国香港', locale: 'zh-HK', currency: 'HKD', timezone: 'Asia/Hong_Kong', status: 'active', tenantCount: 3, brandCount: 2, storeCount: 4, lastDeployed: '2026-06-12 10:15', region: 'asia-pacific' },
  { id: 'm3', code: 'us-default', name: '美国', locale: 'en-US', currency: 'USD', timezone: 'America/New_York', status: 'active', tenantCount: 5, brandCount: 4, storeCount: 6, lastDeployed: '2026-06-12 08:30', region: 'north-america' },
  { id: 'm4', code: 'uk-default', name: '英国', locale: 'en-GB', currency: 'GBP', timezone: 'Europe/London', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 2, lastDeployed: '2026-06-11 15:20', region: 'europe' },
  { id: 'm5', code: 'jp-default', name: '日本', locale: 'ja-JP', currency: 'JPY', timezone: 'Asia/Tokyo', status: 'pending', tenantCount: 2, brandCount: 1, storeCount: 2, lastDeployed: '2026-06-11 09:00', region: 'asia-pacific' },
  { id: 'm6', code: 'kr-default', name: '韩国', locale: 'ko-KR', currency: 'KRW', timezone: 'Asia/Seoul', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-10 11:00', region: 'asia-pacific' },
  { id: 'm7', code: 'sg-default', name: '新加坡', locale: 'en-SG', currency: 'SGD', timezone: 'Asia/Singapore', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 3, lastDeployed: '2026-06-12 16:45', region: 'asia-pacific' },
  { id: 'm8', code: 'de-default', name: '德国', locale: 'de-DE', currency: 'EUR', timezone: 'Europe/Berlin', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-10 14:00', region: 'europe' },
  { id: 'm9', code: 'fr-default', name: '法国', locale: 'fr-FR', currency: 'EUR', timezone: 'Europe/Paris', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-09 18:00', region: 'europe' },
  { id: 'm10', code: 'ae-default', name: '阿联酋', locale: 'ar-AE', currency: 'AED', timezone: 'Asia/Dubai', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'middle-east' },
  { id: 'm11', code: 'au-default', name: '澳大利亚', locale: 'en-AU', currency: 'AUD', timezone: 'Australia/Sydney', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 2, lastDeployed: '2026-06-12 13:45', region: 'asia-pacific' },
  { id: 'm12', code: 'br-default', name: '巴西', locale: 'pt-BR', currency: 'BRL', timezone: 'America/Sao_Paulo', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'latin-america' },
  { id: 'm13', code: 'ca-default', name: '加拿大', locale: 'en-CA', currency: 'CAD', timezone: 'America/Toronto', status: 'active', tenantCount: 2, brandCount: 1, storeCount: 2, lastDeployed: '2026-06-12 09:30', region: 'north-america' },
  { id: 'm14', code: 'th-default', name: '泰国', locale: 'th-TH', currency: 'THB', timezone: 'Asia/Bangkok', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-11 14:00', region: 'asia-pacific' },
  { id: 'm15', code: 'in-default', name: '印度', locale: 'hi-IN', currency: 'INR', timezone: 'Asia/Kolkata', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'asia-pacific' },
]

export const MOCK_MARKET_DETAILS: Record<string, MarketDetail> = {
  m1: { id: 'm1', code: 'cn-mainland', name: '中国大陆', locale: 'zh-CN', currency: 'CNY', timezone: 'Asia/Shanghai', status: 'active', tenantCount: 8, brandCount: 7, storeCount: 12, lastDeployed: '2026-06-12 14:30', region: 'asia-pacific', description: 'M5 中国核心市场，承载最多品牌租户与门店资源，支持微信支付与支付宝。', defaultLanguage: 'zh-CN', dateFormat: 'yyyy-MM-dd', numberFormat: '#,###.##', regulatoryBodies: ['国家市场监管总局', '中国消费者协会'], paymentMethods: ['微信支付', '支付宝', '银联', '数字人民币'], activatedAt: '2023-06-01', contactName: '张大陆', contactEmail: 'zhangdl@m5.cn.com' },
  m2: { id: 'm2', code: 'cn-hk', name: '中国香港', locale: 'zh-HK', currency: 'HKD', timezone: 'Asia/Hong_Kong', status: 'active', tenantCount: 3, brandCount: 2, storeCount: 4, lastDeployed: '2026-06-12 10:15', region: 'asia-pacific', description: '亚太金融中心，支持港币结算与国际支付标准。', defaultLanguage: 'zh-HK', dateFormat: 'dd/MM/yyyy', numberFormat: '#,###.##', regulatoryBodies: ['香港海关', '消费者委员会'], paymentMethods: ['Visa', 'Mastercard', '八达通', '支付宝香港'], activatedAt: '2023-08-15', contactName: '陈香港', contactEmail: 'chenhk@m5.hk.com' },
  m3: { id: 'm3', code: 'us-default', name: '美国', locale: 'en-US', currency: 'USD', timezone: 'America/New_York', status: 'active', tenantCount: 5, brandCount: 4, storeCount: 6, lastDeployed: '2026-06-12 08:30', region: 'north-america', description: '北美核心市场，美元结算，支持主流信用卡与移动支付。', defaultLanguage: 'en-US', dateFormat: 'MM/dd/yyyy', numberFormat: '#,###.##', regulatoryBodies: ['FTC', 'BBB'], paymentMethods: ['Visa', 'Mastercard', 'Amex', 'Apple Pay', 'Google Pay'], activatedAt: '2023-09-20', contactName: 'John Market', contactEmail: 'john.m@m5.us.com' },
  m4: { id: 'm4', code: 'uk-default', name: '英国', locale: 'en-GB', currency: 'GBP', timezone: 'Europe/London', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 2, lastDeployed: '2026-06-11 15:20', region: 'europe', description: '欧洲门户市场，GDPR合规，英镑结算。', defaultLanguage: 'en-GB', dateFormat: 'dd/MM/yyyy', numberFormat: '#,###.##', regulatoryBodies: ['ICO', 'FCA', 'CMA'], paymentMethods: ['Visa', 'Mastercard', 'Apple Pay', 'PayPal'], activatedAt: '2023-10-01', contactName: 'Emma London', contactEmail: 'emma.l@m5.uk.com' },
  m7: { id: 'm7', code: 'sg-default', name: '新加坡', locale: 'en-SG', currency: 'SGD', timezone: 'Asia/Singapore', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 3, lastDeployed: '2026-06-12 16:45', region: 'asia-pacific', description: '东盟门户市场，中英双语支持，新币结算。', defaultLanguage: 'en-SG', dateFormat: 'dd/MM/yyyy', numberFormat: '#,###.##', regulatoryBodies: ['IMDA', 'PDPC'], paymentMethods: ['Visa', 'Mastercard', 'PayNow', 'GrabPay'], activatedAt: '2024-01-10', contactName: '林新加坡', contactEmail: 'lin.sg@m5.sg.com' },
}

export const MARKET_LIST_SEARCH_FIELDS: (keyof MarketItem)[] = ['code', 'name', 'region', 'currency', 'timezone']

export const MARKET_LIST_COLUMN_KEYS = [
  'code',
  'name',
  'region',
  'locale',
  'currency',
  'status',
  'tenantCount',
  'brandCount',
  'storeCount',
  'lastDeployed',
] as const

export const MARKET_LIST_PRESET = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 15, 20] as const,
  searchFields: MARKET_LIST_SEARCH_FIELDS,
  statuses: ['active', 'pending', 'inactive'] as const,
  regions: ['asia-pacific', 'north-america', 'europe', 'middle-east', 'latin-america'] as const,
}

export const MARKET_DETAIL_LABELS = {
  overviewTitle: '市场信息',
  code: '市场编码',
  name: '市场名称',
  region: '区域',
  locale: '语言',
  currency: '货币',
  timezone: '时区',
  status: '运营状态',
  tenantCount: '关联租户数',
  brandCount: '关联品牌数',
  storeCount: '关联门店数',
  lastDeployed: '最后部署',
  description: '描述',
  defaultLanguage: '默认语言',
  dateFormat: '日期格式',
  numberFormat: '数字格式',
  regulatoryBodies: '监管机构',
  paymentMethods: '支付方式',
  activatedAt: '激活时间',
  contactName: '联系人',
  contactEmail: '联系邮箱',
  editTitle: '编辑市场信息',
  saveButton: '保存修改',
  cancelButton: '取消',
  notFound: (id: string) => `市场 ${id} 不存在`,
  backToList: '返回市场列表',
} as const

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveMarketsApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

function mapApiMarket(record: Partial<MarketItem>, index: number): MarketItem {
  return {
    id: record.id ?? `market-${index + 1}`,
    code: record.code ?? `market-${index + 1}`,
    name: record.name ?? `市场 ${index + 1}`,
    locale: record.locale ?? 'zh-CN',
    currency: record.currency ?? 'CNY',
    timezone: record.timezone ?? 'Asia/Shanghai',
    status: record.status ?? 'pending',
    tenantCount: Number(record.tenantCount ?? 0),
    brandCount: Number(record.brandCount ?? 0),
    storeCount: Number(record.storeCount ?? 0),
    lastDeployed: record.lastDeployed ?? '—',
    region: record.region ?? 'asia-pacific',
  }
}

async function fetchMarkets(): Promise<MarketItem[]> {
  const upstreamUrl = new URL('markets', resolveMarketsApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`markets upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<{ items?: Partial<MarketItem>[]; markets?: Partial<MarketItem>[] } | Partial<MarketItem>[]>(payload)
  const items = Array.isArray(data) ? data : data.markets ?? data.items ?? []
  return items.map(mapApiMarket)
}

function getLatestMarketTimestamp(markets: MarketItem[]): string {
  const deployed = markets
    .map((market) => market.lastDeployed)
    .filter((value) => value && value !== '-')
    .sort()
  return deployed.at(-1) ?? new Date().toISOString()
}

export async function loadMarketsSnapshot(): Promise<MarketsSnapshotDelivery> {
  try {
    const markets = await fetchMarkets()
    if (markets.length > 0) {
      return {
        deliveryMode: 'api',
        markets,
        generatedAt: new Date().toISOString(),
      }
    }
  } catch {
    // fall through to fallback snapshot
  }

  return {
    deliveryMode: 'fallback',
    markets: MOCK_MARKETS,
    generatedAt: getLatestMarketTimestamp(MOCK_MARKETS),
    error: '市场实时接口不可达，已切换到 fallback 样本数据。',
  }
}

export function getMarketById(id: string): MarketDetail | undefined {
  return MOCK_MARKET_DETAILS[id]
}

export function computeMarketStats(markets: MarketItem[]) {
  return {
    total: markets.length,
    active: markets.filter((market) => market.status === 'active').length,
    pending: markets.filter((market) => market.status === 'pending').length,
    regionCount: new Set(markets.map((market) => market.region)).size,
    totalResources: markets.reduce(
      (sum, market) => sum + market.tenantCount + market.brandCount + market.storeCount,
      0
    ),
  }
}

export function computeMarketRegionDistribution(markets: MarketItem[]): Record<string, number> {
  const distribution: Record<string, number> = {}
  for (const market of markets) {
    distribution[market.region] = (distribution[market.region] || 0) + 1
  }
  return distribution
}

export function getMarketStatusLabel(status: MarketStatus): string {
  return MARKET_STATUS_MAP[status]?.label ?? status
}

export function getMarketRegionLabel(region: MarketRegion): string {
  return MARKET_REGION_MAP[region]?.label ?? region
}

export function getMarketStatusVariant(status: MarketStatus): string {
  return MARKET_STATUS_MAP[status]?.variant ?? 'neutral'
}

export function getMarketRegionVariant(region: MarketRegion): string {
  return MARKET_REGION_MAP[region]?.variant ?? 'neutral'
}

export const adminMarketRoute = {
  href: '/markets',
  title: '市场管理中心',
  description: '统一管理全球市场配置，包括语言、货币、时区与区域覆盖。',
} as const
