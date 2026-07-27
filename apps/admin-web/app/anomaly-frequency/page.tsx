import type { Metadata } from 'next'

import { AdminPermissionGate } from '../components/admin-permission-gate'
import { loadAnomalyFrequencySnapshot } from './anomaly-frequency-data'
import AnomalyFrequencyClient from './anomaly-frequency-client'

export const metadata: Metadata = {
  title: '异常时序频率 - M5 指挥台',
  description:
    '门店/系统异常的时间分布监控。支持按严重程度（严重/警告/提示）和时间范围（24h/7d/30d）筛选，跟踪异常趋势和平均响应时长。',
  openGraph: {
    title: '异常时序频率 | 异常趋势监控',
    description: '门店/系统异常的时间分布监控，支持严重程度和时间范围筛选',
    type: 'website',
  },
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AnomalyFrequencyPage() {
  const permissionGate = {
    requiredPermission: 'foundation.governance.read',
    title: '异常频率访问受限',
    description:
      '异常时序频率页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看治理告警时序、严重度筛选与处理率统计。',
  } as const

  const snapshot = await loadAnomalyFrequencySnapshot()
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    sourceLabel: snapshot.sourceLabel,
    controlPlaneSource: snapshot.controlPlaneSource,
    businessDataSource: snapshot.businessDataSource,
    refreshPath: snapshot.refreshPath,
    generatedAt: snapshot.generatedAt,
    note: snapshot.note,
  } as const

  return (
    <AdminPermissionGate {...permissionGate}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: 24 }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: '异常时序频率监控',
              applicationCategory: 'BusinessApplication',
              description:
                '门店/系统异常的时间分布监控。支持严重程度和时间范围筛选。',
            }),
          }}
        />
        <div
          style={{
            marginBottom: 24,
            borderRadius: 16,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(248, 250, 252, 0.92)',
            padding: 16,
            color: '#334155',
            fontSize: 12,
            lineHeight: 1.8,
          }}
        >
          <div>
            Delivery {sourceEvidence.deliveryMode} · 来源标签: {sourceEvidence.sourceLabel} · 控制面来源:{' '}
            {sourceEvidence.controlPlaneSource}
          </div>
          <div>
            业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
          </div>
          <div>
            generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
          </div>
        </div>
        <AnomalyFrequencyClient snapshot={snapshot} />
      </div>
    </AdminPermissionGate>
  )
}
