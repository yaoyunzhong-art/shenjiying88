export interface ReconciliationStatus {
  inProgress: boolean
  lastRunAt: string | null
  lastRunDate: string | null
  totalRuns: number
  lastError: string | null
  lastReportSummary: {
    date: string
    internalTotal: number
    externalTotal: number
    matchedCount: number
    exactMatchCount: number
    totalDiffCents: number
    diffCount: number
    toleranceCents: number
    matchRate?: number
  } | null
}

export interface DiffRecord {
  kind: string
  orderNo?: string
  internalId?: string
  externalId?: string
  internalAmountCents?: number
  externalAmountCents?: number
  diffCents: number
  duplicateIds?: string[]
  note?: string
}

export interface DiffDetailRecord extends DiffRecord {
  diffKey: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  resolveNote?: string
}

export interface SummaryResponse {
  date: string
  internalTotal: number
  externalTotal: number
  matchedCount: number
  exactMatchCount: number
  matchRate: number
  internalTotalCents: number
  externalTotalCents: number
  totalDiffCents: number
  diffRate: number
  diffKindBreakdown: Array<{ kind: string; count: number; totalDiffCents: number }>
  resolvedCount: number
  unresolvedCount: number
  durationMs: number
  totalRuns: number
}

export interface ReconciliationSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  status: ReconciliationStatus
  summary: SummaryResponse | null
  diffs: DiffRecord[]
  details: DiffDetailRecord[]
  generatedAt: string
  error?: string
}

export const defaultReconciliationStatus: ReconciliationStatus = {
  inProgress: false,
  lastRunAt: '2026-07-25T10:00:00.000Z',
  lastRunDate: '2026-07-25',
  totalRuns: 5,
  lastError: null,
  lastReportSummary: {
    date: '2026-07-25',
    internalTotal: 48,
    externalTotal: 48,
    matchedCount: 45,
    exactMatchCount: 44,
    totalDiffCents: 1200,
    diffCount: 3,
    toleranceCents: 100,
    matchRate: 93.8,
  },
}

export const defaultDiffs: DiffRecord[] = [
  {
    kind: 'amount-mismatch',
    orderNo: 'ord-2026-0701',
    internalAmountCents: 12900,
    externalAmountCents: 11700,
    diffCents: 1200,
    note: '渠道手续费差异',
  },
  {
    kind: 'missing-external',
    orderNo: 'ord-2026-0702',
    internalAmountCents: 8800,
    diffCents: 8800,
    note: '外部流水未到达',
  },
]

export const defaultDetails: DiffDetailRecord[] = [
  {
    diffKey: 'diff-001',
    kind: 'amount-mismatch',
    orderNo: 'ord-2026-0701',
    internalAmountCents: 12900,
    externalAmountCents: 11700,
    diffCents: 1200,
    note: '渠道手续费差异',
    resolved: false,
  },
  {
    diffKey: 'diff-002',
    kind: 'missing-external',
    orderNo: 'ord-2026-0702',
    internalAmountCents: 8800,
    diffCents: 8800,
    note: '外部流水未到达',
    resolved: true,
    resolvedAt: '2026-07-25T11:00:00.000Z',
    resolvedBy: 'finance-manager',
    resolveNote: '已人工补录外部渠道流水',
  },
]

export const defaultSummary: SummaryResponse = {
  date: '2026-07-25',
  internalTotal: 48,
  externalTotal: 48,
  matchedCount: 45,
  exactMatchCount: 44,
  matchRate: 93.8,
  internalTotalCents: 1580000,
  externalTotalCents: 1578800,
  totalDiffCents: 1200,
  diffRate: 2.5,
  diffKindBreakdown: [
    { kind: 'amount-mismatch', count: 1, totalDiffCents: 1200 },
    { kind: 'missing-external', count: 1, totalDiffCents: 8800 },
  ],
  resolvedCount: 1,
  unresolvedCount: 1,
  durationMs: 3800,
  totalRuns: 5,
}

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveReconciliationApiBaseUrl(): string {
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

async function fetchStatus(): Promise<ReconciliationStatus> {
  const upstreamUrl = new URL('finance/reconciliation/status', resolveReconciliationApiBaseUrl())
  const response = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`reconciliation status upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  return unwrapApiPayload<ReconciliationStatus>(payload)
}

async function fetchDiffs(): Promise<DiffRecord[]> {
  const upstreamUrl = new URL('finance/reconciliation/diffs', resolveReconciliationApiBaseUrl())
  const response = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`reconciliation diffs upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<{ diffs: DiffRecord[] }>(payload)
  return data.diffs
}

async function fetchDetails(): Promise<DiffDetailRecord[]> {
  const upstreamUrl = new URL('finance/reconciliation/details', resolveReconciliationApiBaseUrl())
  const response = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`reconciliation details upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<{ details: DiffDetailRecord[] }>(payload)
  return data.details
}

async function fetchSummary(date: string): Promise<SummaryResponse | null> {
  const upstreamUrl = new URL('finance/reconciliation/summary', resolveReconciliationApiBaseUrl())
  upstreamUrl.searchParams.set('date', date)
  const response = await fetch(upstreamUrl.toString(), {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`reconciliation summary upstream failed: ${response.status}`)
  }
  const payload = (await response.json()) as { success?: boolean; data?: SummaryResponse | null }
  if (!payload.success) {
    return null
  }
  return payload.data ?? null
}

export async function loadReconciliationSnapshot(): Promise<ReconciliationSnapshotDelivery> {
  try {
    const status = await fetchStatus()
    const [diffs, details, summary] = await Promise.all([
      fetchDiffs(),
      fetchDetails(),
      status.lastRunDate ? fetchSummary(status.lastRunDate) : Promise.resolve(null),
    ])

    return {
      deliveryMode: 'api',
      status,
      summary,
      diffs,
      details,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      status: defaultReconciliationStatus,
      summary: defaultSummary,
      diffs: defaultDiffs,
      details: defaultDetails,
      generatedAt: defaultReconciliationStatus.lastRunAt ?? defaultSummary.date,
      error: '财务对账实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
