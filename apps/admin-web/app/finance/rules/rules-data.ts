export interface FinanceRule {
  id: string
  name: string
  description: string
  module: 'RECONCILIATION' | 'APPROVAL' | 'AUDIT' | 'SETTLEMENT'
  matchField: string
  toleranceCents: number
  autoApply: boolean
  autoApplyThresholdCents: number
  enabled: boolean
  priority: number
  createdAt: string
  updatedAt: string
  lastAppliedCount?: number
  applyRate?: number | null
}

export interface FinanceRulesSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  rules: FinanceRule[]
  generatedAt: string
  error?: string
}

export const defaultFinanceRules: FinanceRule[] = [
  {
    id: 'fr-1',
    name: '对账 — 订单号精确匹配',
    description: '按内部订单号与渠道交易号完全匹配',
    module: 'RECONCILIATION',
    matchField: 'orderNo',
    toleranceCents: 0,
    autoApply: true,
    autoApplyThresholdCents: 0,
    enabled: true,
    priority: 1,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-16T10:00:00Z',
    lastAppliedCount: 1248,
    applyRate: 96.5,
  },
  {
    id: 'fr-2',
    name: '对账 — 金额容差匹配',
    description: '金额差异在容差范围内自动匹配（渠道手续费场景）',
    module: 'RECONCILIATION',
    matchField: 'amount+date',
    toleranceCents: 100,
    autoApply: false,
    autoApplyThresholdCents: 50,
    enabled: true,
    priority: 2,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-15T14:00:00Z',
    lastAppliedCount: 389,
    applyRate: 88.2,
  },
  {
    id: 'fr-3',
    name: '审批 — 大额人工审核',
    description: '单笔金额超过500元的退款需要人工审批',
    module: 'APPROVAL',
    matchField: 'amountCents',
    toleranceCents: 50_000,
    autoApply: false,
    autoApplyThresholdCents: 0,
    enabled: true,
    priority: 3,
    createdAt: '2026-07-02T00:00:00Z',
    updatedAt: '2026-07-15T09:00:00Z',
    lastAppliedCount: 45,
    applyRate: 100,
  },
  {
    id: 'fr-4',
    name: '审计 — 大额交易标记',
    description: '超过10万元的交易自动标记审计关注',
    module: 'AUDIT',
    matchField: 'amountCents',
    toleranceCents: 10_000_00,
    autoApply: true,
    autoApplyThresholdCents: 0,
    enabled: true,
    priority: 4,
    createdAt: '2026-07-03T00:00:00Z',
    updatedAt: '2026-07-14T08:00:00Z',
    lastAppliedCount: 23,
    applyRate: 100,
  },
  {
    id: 'fr-5',
    name: '对账 — 模糊搜索匹配',
    description: '按备注关键词模糊匹配（适用于无订单号场景）',
    module: 'RECONCILIATION',
    matchField: 'note+amount',
    toleranceCents: 200,
    autoApply: false,
    autoApplyThresholdCents: 0,
    enabled: false,
    priority: 5,
    createdAt: '2026-07-05T00:00:00Z',
    updatedAt: '2026-07-12T09:00:00Z',
    lastAppliedCount: 56,
    applyRate: 42.1,
  },
  {
    id: 'fr-6',
    name: '结算 — 分账规则',
    description: '按商户分成比例自动结算分账款项',
    module: 'SETTLEMENT',
    matchField: 'ratio',
    toleranceCents: 0,
    autoApply: true,
    autoApplyThresholdCents: 0,
    enabled: false,
    priority: 6,
    createdAt: '2026-07-04T00:00:00Z',
    updatedAt: '2026-07-11T10:00:00Z',
    lastAppliedCount: 0,
    applyRate: null,
  },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveFinanceRulesApiBaseUrl(): string {
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

async function fetchFinanceRules(): Promise<FinanceRule[]> {
  const upstreamUrl = new URL('finance/rules', resolveFinanceRulesApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`finance rules upstream failed: ${response.status}`)
  }
  const payload = await response.json()
  const data = unwrapApiPayload<{ rules: FinanceRule[] }>(payload)
  return data.rules
}

function getLatestRuleTimestamp(rules: FinanceRule[]): string {
  if (rules.length === 0) return '—'
  return rules.reduce(
    (latest, rule) => (rule.updatedAt > latest ? rule.updatedAt : latest),
    rules[0]!.updatedAt
  )
}

export async function loadFinanceRulesSnapshot(): Promise<FinanceRulesSnapshotDelivery> {
  try {
    const rules = await fetchFinanceRules()
    return {
      deliveryMode: 'api',
      rules,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      rules: defaultFinanceRules,
      generatedAt: getLatestRuleTimestamp(defaultFinanceRules),
      error: '财务规则实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
