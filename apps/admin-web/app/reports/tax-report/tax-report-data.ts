import { apiFetchJson } from '../../api/_client'

export type TaxRecordStatus = 'paid' | 'pending' | 'overdue'

export interface TaxRecord {
  period: string
  revenue: number
  taxRate: number
  taxAmount: number
  deductible: number
  netTax: number
  status: TaxRecordStatus
}

export interface TaxReportStats {
  revenue: number
  tax: number
  netTax: number
  averageTaxRate: number
  pendingCount: number
  overdueCount: number
}

export interface TaxReportSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'tax-report-api-live' | 'tax-report-local-snapshot'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
  records: TaxRecord[]
  stats: TaxReportStats
}

export const TAX_RECORD_STATUSES: TaxRecordStatus[] = ['paid', 'pending', 'overdue']

export const TAX_STATUS_LABELS: Record<TaxRecordStatus, string> = {
  paid: '已缴',
  pending: '待缴',
  overdue: '逾期',
}

export const MOCK_TAX_RECORDS: TaxRecord[] = [
  { period: '2026-06', revenue: 1285600, taxRate: 6, taxAmount: 77136, deductible: 15820, netTax: 61316, status: 'paid' },
  { period: '2026-05', revenue: 1152400, taxRate: 6, taxAmount: 69144, deductible: 14350, netTax: 54794, status: 'paid' },
  { period: '2026-04', revenue: 1089300, taxRate: 6, taxAmount: 65358, deductible: 12980, netTax: 52378, status: 'paid' },
  { period: '2026-03', revenue: 985600, taxRate: 3, taxAmount: 29568, deductible: 11200, netTax: 18368, status: 'paid' },
  { period: '2026-02', revenue: 892300, taxRate: 3, taxAmount: 26769, deductible: 9850, netTax: 16919, status: 'paid' },
  { period: '2026-01', revenue: 756800, taxRate: 3, taxAmount: 22704, deductible: 8200, netTax: 14504, status: 'paid' },
  { period: '2026-07', revenue: 423500, taxRate: 6, taxAmount: 25410, deductible: 5600, netTax: 19810, status: 'pending' },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

type TaxReportApiPayload = TaxRecord[] | { records?: TaxRecord[]; generatedAt?: string }

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveTaxReportApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) return `${DEFAULT_API_ORIGIN}/api/`
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) return ensureTrailingSlash(normalized)
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized.replace(/\/v1\/?$/, '/'))
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) throw new Error(wrapped.message ?? 'API error')
    return wrapped.data as T
  }
  return payload as T
}

async function fetchTaxReportPayload(): Promise<TaxReportApiPayload> {
  const upstreamUrl = new URL('reports/tax-report', resolveTaxReportApiBaseUrl()).toString()
  return apiFetchJson<TaxReportApiPayload>(upstreamUrl)
}

function extractTaxRecords(payload: TaxReportApiPayload): TaxRecord[] {
  if (Array.isArray(payload)) return payload
  return Array.isArray(payload.records) ? payload.records : []
}

function getGeneratedAt(records: TaxRecord[], fallback?: string): string {
  if (fallback) return fallback
  const latestPeriod = [...records].map((record) => record.period).sort().at(-1)
  return latestPeriod ? `${latestPeriod}-01T08:00:00Z` : new Date().toISOString()
}

function buildFallbackSnapshot(error?: string): TaxReportSnapshotDelivery {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'tax-report-local-snapshot',
    generatedAt: '2026-07-27T08:00:00Z',
    controlPlaneSource: 'loadTaxReportSnapshot -> MOCK_TAX_RECORDS fallback',
    businessDataSource: 'local tax-report workspace samples',
    refreshPath: 'TaxReportPage -> loadTaxReportSnapshot',
    note: '当前税务报表展示的是本地样本快照，不可作为实时完税复签证据。',
    error,
    records: MOCK_TAX_RECORDS,
    stats: computeTaxReportStats(MOCK_TAX_RECORDS),
  }
}

export function computeTaxReportStats(records: TaxRecord[]): TaxReportStats {
  const revenue = records.reduce((sum, record) => sum + record.revenue, 0)
  const tax = records.reduce((sum, record) => sum + record.taxAmount, 0)
  const netTax = records.reduce((sum, record) => sum + record.netTax, 0)
  const averageTaxRate =
    records.length > 0 ? Math.round((records.reduce((sum, record) => sum + record.taxRate, 0) / records.length) * 10) / 10 : 0

  return {
    revenue,
    tax,
    netTax,
    averageTaxRate,
    pendingCount: records.filter((record) => record.status === 'pending').length,
    overdueCount: records.filter((record) => record.status === 'overdue').length,
  }
}

export function filterTaxRecords(
  records: TaxRecord[],
  search: string,
  statusFilter: TaxRecordStatus | 'all'
): TaxRecord[] {
  let result = records
  if (statusFilter !== 'all') result = result.filter((record) => record.status === statusFilter)
  if (search.trim()) result = result.filter((record) => record.period.includes(search.trim()))
  return result
}

export async function loadTaxReportSnapshot(): Promise<TaxReportSnapshotDelivery> {
  try {
    const payload = await fetchTaxReportPayload()
    const records = extractTaxRecords(payload)
    if (records.length > 0) {
      return {
        deliveryMode: 'api',
        sourceLabel: 'tax-report-api-live',
        generatedAt: getGeneratedAt(records, Array.isArray(payload) ? undefined : payload.generatedAt),
        controlPlaneSource: 'loadTaxReportSnapshot -> reports/tax-report',
        businessDataSource: 'reports/tax-report upstream response',
        refreshPath: 'TaxReportPage -> loadTaxReportSnapshot',
        note: '当前税务报表已优先接入真实报税快照，接口异常时会显式降级为 fallback 样本。',
        records,
        stats: computeTaxReportStats(records),
      }
    }
  } catch (error) {
    return buildFallbackSnapshot(
      error instanceof Error
        ? `${error.message}，已切换到 fallback 样本数据。`
        : '税务报表实时接口不可达，已切换到 fallback 样本数据。'
    )
  }

  return buildFallbackSnapshot('税务报表实时接口返回空列表，已切换到 fallback 样本数据。')
}
