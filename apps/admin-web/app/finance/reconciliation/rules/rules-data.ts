import { apiFetchJson } from '../../../api/_client'

export interface ReconciliationRule {
  id: string
  name: string
  description: string
  matchKey: string
  toleranceCents: number
  autoResolve: boolean
  autoResolveThresholdCents: number
  enabled: boolean
  priority: number
  createdAt: string
  updatedAt: string
  lastMatchedCount?: number
  matchRate?: number
}

export interface ReconciliationRulesSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  rules: ReconciliationRule[]
  generatedAt: string
  error?: string
}

export const defaultRules: ReconciliationRule[] = [
  {
    id: 'rule-1',
    name: '订单号精确匹配',
    description: '按内部订单号与外部交易单号完全匹配，自动标记已对账',
    matchKey: 'orderNo',
    toleranceCents: 0,
    autoResolve: true,
    autoResolveThresholdCents: 0,
    enabled: true,
    priority: 1,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
    lastMatchedCount: 1248,
    matchRate: 96.5,
  },
  {
    id: 'rule-2',
    name: '金额容差匹配',
    description: '金额差异在容差范围内自动匹配（微信支付手续费场景）',
    matchKey: 'amount+date',
    toleranceCents: 100,
    autoResolve: false,
    autoResolveThresholdCents: 50,
    enabled: true,
    priority: 2,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-14T14:00:00Z',
    lastMatchedCount: 389,
    matchRate: 88.2,
  },
  {
    id: 'rule-3',
    name: '模糊搜索匹配',
    description: '按备注关键词模糊匹配（适用于无订单号场景）',
    matchKey: 'note+amount',
    toleranceCents: 200,
    autoResolve: false,
    autoResolveThresholdCents: 0,
    enabled: false,
    priority: 3,
    createdAt: '2026-07-05T00:00:00Z',
    updatedAt: '2026-07-12T09:00:00Z',
    lastMatchedCount: 56,
    matchRate: 42.1,
  },
  {
    id: 'rule-4',
    name: '重复单据检测',
    description: '检测同一笔交易的多条外部记录，合并标记',
    matchKey: 'transactionId',
    toleranceCents: 0,
    autoResolve: true,
    autoResolveThresholdCents: 0,
    enabled: true,
    priority: 4,
    createdAt: '2026-07-03T00:00:00Z',
    updatedAt: '2026-07-15T08:00:00Z',
    lastMatchedCount: 23,
    matchRate: 100,
  },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveReconciliationRulesApiBaseUrl(): string {
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

async function fetchReconciliationRules(): Promise<ReconciliationRule[]> {
  const upstreamUrl = new URL('finance/reconciliation/rules', resolveReconciliationRulesApiBaseUrl()).toString()
  const data = await apiFetchJson<{ rules: ReconciliationRule[] }>(upstreamUrl)
  return data.rules
}

function getLatestRuleTimestamp(rules: ReconciliationRule[]): string {
  if (rules.length === 0) return '—'
  return rules.reduce(
    (latest, rule) => (rule.updatedAt > latest ? rule.updatedAt : latest),
    rules[0]!.updatedAt
  )
}

export async function loadReconciliationRulesSnapshot(): Promise<ReconciliationRulesSnapshotDelivery> {
  try {
    const rules = await fetchReconciliationRules()
    return {
      deliveryMode: 'api',
      rules,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      rules: defaultRules,
      generatedAt: getLatestRuleTimestamp(defaultRules),
      error: '对账规则实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
