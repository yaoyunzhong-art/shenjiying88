import type { AnomalyTimeBucket } from '@m5/ui'

import { loadAdminGovernanceReadModel, type AdminGovernanceReadModel } from '../bootstrap'

export type AnomalyTimeRange = '6h' | '24h' | '7d' | '30d'
export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low'
export type AnomalySeverityFilter = 'all' | AnomalySeverity

interface SeverityTotals {
  critical: number
  high: number
  medium: number
  low: number
}

export interface AnomalyFrequencyStats {
  totalAlerts: number
  criticalAlerts: number
  handledAlerts: number
  responseRate: number
}

export interface AnomalyFrequencySnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'anomaly-frequency-api' | 'anomaly-frequency-fallback'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  governance: AdminGovernanceReadModel | null
  stats: AnomalyFrequencyStats
  bucketsByRange: Record<AnomalyTimeRange, AnomalyTimeBucket[]>
  hasData: boolean
}

const RANGE_CONFIG: Record<
  AnomalyTimeRange,
  {
    bucketCount: number
    stepMs: number
    labelKind: 'time' | 'date'
  }
> = {
  '6h': { bucketCount: 12, stepMs: 30 * 60 * 1000, labelKind: 'time' },
  '24h': { bucketCount: 24, stepMs: 60 * 60 * 1000, labelKind: 'time' },
  '7d': { bucketCount: 14, stepMs: 12 * 60 * 60 * 1000, labelKind: 'date' },
  '30d': { bucketCount: 30, stepMs: 24 * 60 * 60 * 1000, labelKind: 'date' },
}

function sumCountsBySeverity(governance: AdminGovernanceReadModel | null) {
  const totals = { high: 0, medium: 0, low: 0 }

  for (const alert of governance?.overviewAlerts ?? []) {
    if (alert.severity === 'high') totals.high += Math.max(alert.count ?? 0, 0)
    if (alert.severity === 'medium') totals.medium += Math.max(alert.count ?? 0, 0)
    if (alert.severity === 'low') totals.low += Math.max(alert.count ?? 0, 0)
  }

  return totals
}

function deriveSeverityTotals(governance: AdminGovernanceReadModel | null): SeverityTotals {
  const counts = sumCountsBySeverity(governance)
  const summary = governance?.summary

  const derivedCritical = Math.min(
    counts.high,
    Math.max(
      0,
      (summary?.highRiskAudits ?? 0)
        + (summary?.runtimeBlockedActions ?? 0)
        + (summary?.approvalsWithFailures ?? 0),
    ),
  )

  return {
    critical: derivedCritical,
    high: Math.max(0, counts.high - derivedCritical),
    medium: counts.medium,
    low: counts.low,
  }
}

function buildStats(
  governance: AdminGovernanceReadModel | null,
  totals: SeverityTotals,
): AnomalyFrequencyStats {
  const catalogSize = governance?.alerts.length ?? 0
  const handledAlerts = (governance?.alerts ?? []).filter((item) => {
    return Boolean(item.acknowledgement) || item.triageState === 'acknowledged' || item.triageState === 'muted'
  }).length

  const totalAlerts =
    catalogSize > 0
      ? catalogSize
      : totals.critical + totals.high + totals.medium + totals.low

  return {
    totalAlerts,
    criticalAlerts: totals.critical,
    handledAlerts,
    responseRate: totalAlerts > 0 ? Math.round((handledAlerts / totalAlerts) * 100) : 0,
  }
}

function buildBucketLabel(date: Date, labelKind: 'time' | 'date') {
  if (labelKind === 'time') {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}

function createBucketSkeleton(range: AnomalyTimeRange, generatedAt: string) {
  const config = RANGE_CONFIG[range]
  const endTime = new Date(generatedAt).getTime()
  const safeEndTime = Number.isFinite(endTime) ? endTime : Date.now()

  return Array.from({ length: config.bucketCount }, (_, index) => {
    const timestamp = safeEndTime - (config.bucketCount - 1 - index) * config.stepMs
    return {
      label: buildBucketLabel(new Date(timestamp), config.labelKind),
      total: 0,
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      bucketId: `${range}-bucket-${index + 1}`,
    } satisfies AnomalyTimeBucket
  })
}

function distributeTotal(total: number, bucketCount: number, seed: number) {
  const values = Array.from({ length: bucketCount }, () => 0)
  if (total <= 0) return values

  for (let index = 0; index < total; index += 1) {
    const slot = Math.abs((seed + index * 7 + Math.floor(index / 3)) % bucketCount)
    values[slot] += 1
  }

  return values
}

function buildBucketsForRange(
  range: AnomalyTimeRange,
  totals: SeverityTotals,
  generatedAt: string,
): AnomalyTimeBucket[] {
  const skeleton = createBucketSkeleton(range, generatedAt)
  const config = RANGE_CONFIG[range]
  const seedBase = generatedAt.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + config.bucketCount

  const criticalValues = distributeTotal(totals.critical, config.bucketCount, seedBase + 11)
  const highValues = distributeTotal(totals.high, config.bucketCount, seedBase + 17)
  const mediumValues = distributeTotal(totals.medium, config.bucketCount, seedBase + 23)
  const lowValues = distributeTotal(totals.low, config.bucketCount, seedBase + 29)

  return skeleton.map((bucket, index) => {
    const critical = criticalValues[index] ?? 0
    const high = highValues[index] ?? 0
    const medium = mediumValues[index] ?? 0
    const low = lowValues[index] ?? 0

    return {
      ...bucket,
      total: critical + high + medium + low,
      bySeverity: {
        critical,
        high,
        medium,
        low,
      },
    }
  })
}

function buildBucketsByRange(
  totals: SeverityTotals,
  generatedAt: string,
): Record<AnomalyTimeRange, AnomalyTimeBucket[]> {
  return {
    '6h': buildBucketsForRange('6h', totals, generatedAt),
    '24h': buildBucketsForRange('24h', totals, generatedAt),
    '7d': buildBucketsForRange('7d', totals, generatedAt),
    '30d': buildBucketsForRange('30d', totals, generatedAt),
  }
}

function buildFallbackSnapshot(note: string): AnomalyFrequencySnapshot {
  const generatedAt = new Date().toISOString()
  const totals = { critical: 0, high: 0, medium: 0, low: 0 }

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'anomaly-frequency-fallback',
    generatedAt,
    controlPlaneSource: 'loadAnomalyFrequencySnapshot fallback -> governance snapshot unavailable',
    businessDataSource: 'empty anomaly-frequency fallback buckets',
    refreshPath: 'loadAnomalyFrequencySnapshot()',
    note,
    governance: null,
    stats: buildStats(null, totals),
    bucketsByRange: buildBucketsByRange(totals, generatedAt),
    hasData: false,
  }
}

export async function loadAnomalyFrequencySnapshot(): Promise<AnomalyFrequencySnapshot> {
  try {
    const governance = await loadAdminGovernanceReadModel()
    const totals = deriveSeverityTotals(governance)
    const stats = buildStats(governance, totals)

    return {
      deliveryMode: governance.deliveryMode,
      sourceLabel:
        governance.deliveryMode === 'api'
          ? 'anomaly-frequency-api'
          : 'anomaly-frequency-fallback',
      generatedAt: governance.generatedAt ?? new Date().toISOString(),
      controlPlaneSource: 'loadAdminGovernanceReadModel / snapshot.governance',
      businessDataSource:
        'governance.overviewAlerts count distribution + governance.summary critical projection',
      refreshPath: 'loadAnomalyFrequencySnapshot()',
      note:
        governance.deliveryMode === 'api'
          ? '异常频率页已完成 E54 三层拆分，当前使用治理读模型生成异常频率快照；时序桶为服务端确定性投影，便于首屏固证与后续真替换。'
          : '异常频率页当前命中治理 fallback 快照，时序桶仍由服务端确定性投影生成，但已保持来源态透明与刷新链路一致。',
      governance,
      stats,
      bucketsByRange: buildBucketsByRange(totals, governance.generatedAt ?? new Date().toISOString()),
      hasData: stats.totalAlerts > 0,
    }
  } catch {
    return buildFallbackSnapshot(
      '治理读模型暂不可达，异常频率页保留 E54 三层壳层、来源态证据与空数据降级。',
    )
  }
}
