const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface MemberConfig {
  points: {
    earnRate: number
    redeemRate: number
    enabled: boolean
    expiryDays: number
  }
  levels: {
    thresholds: {
      BRONZE: number
      SILVER: number
      GOLD: number
      PLATINUM: number
      DIAMOND: number
    }
  }
  lifecycle: {
    dormantDays: number
    churnedDays: number
  }
  phoneUniqueScope: 'global' | 'tenant'
  crossTenantEnabled: boolean
}

export interface MemberConfigSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'member-config-api' | 'member-config-fallback'
  config: MemberConfig
  historyCount: number
  lastChangedAt: string
  lastChangedBy: string
  generatedAt: string
  error?: string
}

interface MemberConfigHistoryRecord {
  changeId: string
  changedBy: string
  changedAt: string
  reason: string
}

export const DEFAULT_MEMBER_CONFIG: MemberConfig = {
  points: { earnRate: 1, redeemRate: 100, enabled: true, expiryDays: 365 },
  levels: {
    thresholds: {
      BRONZE: 0,
      SILVER: 500,
      GOLD: 2000,
      PLATINUM: 10000,
      DIAMOND: 50000,
    },
  },
  lifecycle: { dormantDays: 90, churnedDays: 180 },
  phoneUniqueScope: 'global',
  crossTenantEnabled: true,
}

export const DEFAULT_MEMBER_CONFIG_HISTORY: MemberConfigHistoryRecord[] = [
  {
    changeId: 'cfg-fallback-bootstrap',
    changedBy: 'system-bootstrap',
    changedAt: '2026-07-26T09:30:00.000Z',
    reason: 'bootstrap default seed',
  },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveMemberConfigApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return ensureTrailingSlash(DEFAULT_API_ORIGIN)
  }
  return ensureTrailingSlash(normalized.replace(/\/$/, ''))
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function normalizePhoneUniqueScope(value: unknown): MemberConfig['phoneUniqueScope'] {
  return value === 'tenant' ? 'tenant' : 'global'
}

function mapMemberConfig(value: unknown): MemberConfig {
  const record = isRecord(value) ? value : {}
  const points = isRecord(record.points) ? record.points : {}
  const levels = isRecord(record.levels) ? record.levels : {}
  const thresholds = isRecord(levels.thresholds) ? levels.thresholds : {}
  const lifecycle = isRecord(record.lifecycle) ? record.lifecycle : {}

  return {
    points: {
      earnRate: readNumber(points.earnRate, DEFAULT_MEMBER_CONFIG.points.earnRate),
      redeemRate: readNumber(points.redeemRate, DEFAULT_MEMBER_CONFIG.points.redeemRate),
      enabled: readBoolean(points.enabled, DEFAULT_MEMBER_CONFIG.points.enabled),
      expiryDays: readNumber(points.expiryDays, DEFAULT_MEMBER_CONFIG.points.expiryDays),
    },
    levels: {
      thresholds: {
        BRONZE: readNumber(thresholds.BRONZE, DEFAULT_MEMBER_CONFIG.levels.thresholds.BRONZE),
        SILVER: readNumber(thresholds.SILVER, DEFAULT_MEMBER_CONFIG.levels.thresholds.SILVER),
        GOLD: readNumber(thresholds.GOLD, DEFAULT_MEMBER_CONFIG.levels.thresholds.GOLD),
        PLATINUM: readNumber(
          thresholds.PLATINUM,
          DEFAULT_MEMBER_CONFIG.levels.thresholds.PLATINUM
        ),
        DIAMOND: readNumber(thresholds.DIAMOND, DEFAULT_MEMBER_CONFIG.levels.thresholds.DIAMOND),
      },
    },
    lifecycle: {
      dormantDays: readNumber(lifecycle.dormantDays, DEFAULT_MEMBER_CONFIG.lifecycle.dormantDays),
      churnedDays: readNumber(lifecycle.churnedDays, DEFAULT_MEMBER_CONFIG.lifecycle.churnedDays),
    },
    phoneUniqueScope: normalizePhoneUniqueScope(record.phoneUniqueScope),
    crossTenantEnabled: readBoolean(
      record.crossTenantEnabled,
      DEFAULT_MEMBER_CONFIG.crossTenantEnabled
    ),
  }
}

function extractConfig(payload: unknown): MemberConfig {
  if (isRecord(payload) && isRecord(payload.config)) {
    return mapMemberConfig(payload.config)
  }
  if (isRecord(payload) && isRecord(payload.data) && isRecord(payload.data.config)) {
    return mapMemberConfig(payload.data.config)
  }
  return mapMemberConfig(payload)
}

function mapHistoryRecord(value: unknown): MemberConfigHistoryRecord | null {
  if (!isRecord(value)) {
    return null
  }
  return {
    changeId: readString(value.changeId, 'cfg-unknown'),
    changedBy: readString(value.changedBy, 'unknown'),
    changedAt: readString(value.changedAt, '—'),
    reason: readString(value.reason, '未提供原因'),
  }
}

function extractHistoryRecords(payload: unknown): MemberConfigHistoryRecord[] {
  if (Array.isArray(payload)) {
    return payload.map(mapHistoryRecord).filter(Boolean) as MemberConfigHistoryRecord[]
  }
  if (!isRecord(payload)) {
    return []
  }

  const directHistory = Array.isArray(payload.history) ? payload.history : []
  if (directHistory.length > 0) {
    return directHistory.map(mapHistoryRecord).filter(Boolean) as MemberConfigHistoryRecord[]
  }

  if (isRecord(payload.data) && Array.isArray(payload.data.history)) {
    return payload.data.history
      .map(mapHistoryRecord)
      .filter(Boolean) as MemberConfigHistoryRecord[]
  }

  return []
}

async function fetchMemberConfigPart<T>(path: string): Promise<T> {
  const upstreamUrl = new URL(path, resolveMemberConfigApiBaseUrl()).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`member config upstream failed: ${response.status}`)
  }
  return unwrapApiPayload<T>(await response.json())
}

function getLatestHistoryRecord(history: MemberConfigHistoryRecord[]): MemberConfigHistoryRecord {
  return history[0] ?? DEFAULT_MEMBER_CONFIG_HISTORY[0]!
}

export async function loadMemberConfigSnapshot(): Promise<MemberConfigSnapshotDelivery> {
  try {
    const [configPayload, historyPayload] = await Promise.all([
      fetchMemberConfigPart<unknown>('api/member/config'),
      fetchMemberConfigPart<unknown>('api/member/config/history?limit=1').catch(() => ({
        history: [],
      })),
    ])
    const history = extractHistoryRecords(historyPayload)
    const latest = getLatestHistoryRecord(history)

    return {
      deliveryMode: 'api',
      sourceLabel: 'member-config-api',
      config: extractConfig(configPayload),
      historyCount: history.length,
      lastChangedAt: latest.changedAt,
      lastChangedBy: latest.changedBy,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    const latest = getLatestHistoryRecord(DEFAULT_MEMBER_CONFIG_HISTORY)
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'member-config-fallback',
      config: DEFAULT_MEMBER_CONFIG,
      historyCount: DEFAULT_MEMBER_CONFIG_HISTORY.length,
      lastChangedAt: latest.changedAt,
      lastChangedBy: latest.changedBy,
      generatedAt: latest.changedAt,
      error: '会员配置实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
