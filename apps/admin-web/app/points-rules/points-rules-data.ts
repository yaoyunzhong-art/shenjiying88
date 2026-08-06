import { apiFetchJson } from '../api/_client'

export interface PointsRule {
  id: string
  name: string
  description: string
  category: 'earn' | 'redeem' | 'expire' | 'bonus'
  triggerType: 'purchase' | 'checkin' | 'referral' | 'birthday' | 'activity' | 'manual'
  rateNumerator: number
  rateDenominator: number
  earnPoints: number
  minAmountCents: number
  maxPerDay: number
  memberLevels: string[]
  enabled: boolean
  startDate?: string
  endDate?: string
  priority: number
  createdAt: string
  updatedAt: string
}

export interface PointsSummary {
  totalRules: number
  enabledRules: number
  avgEarnRate: number
  monthlyIssued: number
  monthlyRedeemed: number
  totalMembers: number
}

export interface PointsRulesSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  rules: PointsRule[]
  summary: PointsSummary
  generatedAt: string
  error?: string
}

export const defaultRules: PointsRule[] = [
  {
    id: 'pr-1',
    name: '消费积分',
    description: '每消费¥1得1积分',
    category: 'earn',
    triggerType: 'purchase',
    rateNumerator: 1,
    rateDenominator: 100,
    earnPoints: 0,
    minAmountCents: 0,
    maxPerDay: 0,
    memberLevels: [],
    enabled: true,
    priority: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'pr-2',
    name: '签到积分',
    description: '每日签到得10积分',
    category: 'earn',
    triggerType: 'checkin',
    rateNumerator: 10,
    rateDenominator: 0,
    earnPoints: 10,
    minAmountCents: 0,
    maxPerDay: 10,
    memberLevels: [],
    enabled: true,
    priority: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'pr-3',
    name: '推荐奖励',
    description: '推荐好友注册双方各得200积分',
    category: 'bonus',
    triggerType: 'referral',
    rateNumerator: 200,
    rateDenominator: 0,
    earnPoints: 200,
    minAmountCents: 0,
    maxPerDay: 1000,
    memberLevels: ['gold', 'platinum'],
    enabled: true,
    priority: 3,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-06-15T00:00:00Z',
  },
  {
    id: 'pr-4',
    name: '生日倍率',
    description: '生日当天消费积3倍',
    category: 'bonus',
    triggerType: 'birthday',
    rateNumerator: 3,
    rateDenominator: 0,
    earnPoints: 0,
    minAmountCents: 0,
    maxPerDay: 0,
    memberLevels: ['platinum', 'diamond'],
    enabled: true,
    priority: 4,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-07-10T00:00:00Z',
  },
  {
    id: 'pr-5',
    name: '积分兑换',
    description: '100积分=¥1兑换券',
    category: 'redeem',
    triggerType: 'purchase',
    rateNumerator: 100,
    rateDenominator: 100,
    earnPoints: 0,
    minAmountCents: 500,
    maxPerDay: 5000,
    memberLevels: [],
    enabled: true,
    priority: 10,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'pr-6',
    name: '老带新活动',
    description: '7月拉新季，邀请好友得500积分',
    category: 'bonus',
    triggerType: 'activity',
    rateNumerator: 500,
    rateDenominator: 0,
    earnPoints: 500,
    minAmountCents: 0,
    maxPerDay: 2000,
    memberLevels: [],
    enabled: true,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    priority: 5,
    createdAt: '2026-06-25T00:00:00Z',
    updatedAt: '2026-06-25T00:00:00Z',
  },
]

export const defaultSummary: PointsSummary = {
  totalRules: 12,
  enabledRules: 10,
  avgEarnRate: 1.2,
  monthlyIssued: 320000,
  monthlyRedeemed: 185000,
  totalMembers: 45600,
}

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolvePointsRulesApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) return `${DEFAULT_API_ORIGIN}/api/v1/`
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

async function fetchPointsRules(): Promise<PointsRule[]> {
  const upstreamUrl = new URL('member/points-rules', resolvePointsRulesApiBaseUrl()).toString()
  const data = await apiFetchJson<{ rules: PointsRule[] }>(upstreamUrl)
  return data.rules
}

async function fetchPointsSummary(): Promise<PointsSummary> {
  const upstreamUrl = new URL('member/points-summary', resolvePointsRulesApiBaseUrl()).toString()
  return apiFetchJson<PointsSummary>(upstreamUrl)
}

function getLatestPointsRuleTimestamp(rules: PointsRule[]): string {
  if (rules.length === 0) return '—'
  return rules.reduce(
    (latest, rule) => (rule.updatedAt > latest ? rule.updatedAt : latest),
    rules[0]!.updatedAt
  )
}

export async function loadPointsRulesSnapshot(): Promise<PointsRulesSnapshotDelivery> {
  try {
    const [rules, summary] = await Promise.all([fetchPointsRules(), fetchPointsSummary()])
    return {
      deliveryMode: 'api',
      rules,
      summary,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      rules: defaultRules,
      summary: defaultSummary,
      generatedAt: getLatestPointsRuleTimestamp(defaultRules),
      error: '积分规则实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
