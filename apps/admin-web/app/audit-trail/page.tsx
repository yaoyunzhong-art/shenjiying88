import { PageShell, StatCard } from '@m5/ui'
import type { AuditRiskLevel, AuditTrailQuery } from '@m5/types'
import AuditTrailClient from './audit-trail-client'
import { loadAuditTrail } from '../audit-trail-view-model'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AuditTrailPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function readRiskLevelParam(value: string | string[] | undefined): AuditRiskLevel | undefined {
  const raw = readQueryParam(value)
  if (raw === 'low' || raw === 'medium' || raw === 'high') {
    return raw
  }
  return undefined
}

function readLimitParam(value: string | string[] | undefined): number | undefined {
  const raw = readQueryParam(value)
  if (!raw) return undefined
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined
  }
  return Math.min(parsed, 100)
}

export default async function AuditLogsPage({ searchParams }: AuditTrailPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const query: AuditTrailQuery = {
    riskLevel: readRiskLevelParam(resolvedSearchParams?.riskLevel),
    source: readQueryParam(resolvedSearchParams?.source),
    limit: readLimitParam(resolvedSearchParams?.limit),
  }
  const snapshot = await loadAuditTrail(query, { cache: 'no-store' })
  const records = snapshot.trail.records
  const byRiskLevel = snapshot.summary?.byRiskLevel ?? { low: 0, medium: 0, high: 0 }
  const uniqueSources = new Set(records.map((record) => record.source).filter(Boolean)).size

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell title="审计日志" subtitle="查看所有租户配置变更与操作审计记录，支持风险和来源筛选。">
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 24 }}>
            <StatCard label="总记录" value={snapshot.trail.total} helper="当前快照匹配结果" />
            <StatCard label="高风险" value={byRiskLevel.high} helper={`${byRiskLevel.medium} 中风险 / ${byRiskLevel.low} 低风险`} tone={byRiskLevel.high > 0 ? 'warning' : 'neutral'} />
            <StatCard label="来源数" value={uniqueSources} helper="当前结果中的 source 去重计数" tone="info" />
            <StatCard label="Delivery" value={snapshot.deliveryMode} helper={snapshot.generatedAt} tone={snapshot.deliveryMode === 'api' ? 'success' : 'warning'} />
          </div>

          <AuditTrailClient
            records={snapshot.trail.records}
            total={snapshot.trail.total}
            query={snapshot.query}
          />
        </PageShell>
    </main>
  )
}
