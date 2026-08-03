'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { RecommendationDetailSnapshot, RecommendationStatus } from './recommendation-detail-data'
import SnapshotRefreshCard from '../../components/snapshot-refresh-card'

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  active: '运行中',
  paused: '已暂停',
  draft: '草稿',
  archived: '已归档',
}

const cardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: 'rgba(15, 23, 42, 0.42)',
  padding: 20,
  color: '#e2e8f0',
} as const

const buttonStyle = {
  borderRadius: 8,
  border: '1px solid rgba(96, 165, 250, 0.35)',
  background: 'rgba(59, 130, 246, 0.12)',
  color: '#bfdbfe',
  padding: '8px 14px',
  cursor: 'pointer',
} as const

export default function RecommendationDetailClient({ snapshot }: { snapshot: RecommendationDetailSnapshot }) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [status, setStatus] = useState(snapshot.strategy.status)

  const metrics = useMemo(() => {
    return [
      { label: '累计推荐', value: snapshot.strategy.totalRecommendations.toLocaleString('zh-CN') },
      { label: '转化率', value: `${snapshot.strategy.conversionRate}%` },
      { label: '点击率', value: `${snapshot.strategy.avgCtr}%` },
      { label: '平均收入', value: `¥${snapshot.strategy.avgRevenue.toLocaleString('zh-CN')}` },
    ]
  }, [snapshot.strategy])

  

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        contextLabel="客户端快照上下文"
        loadingLabel="刷新中..."
        idleLabel="刷新快照"
      />

      <div style={{ ...cardStyle, display: 'grid', gap: 12 }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{snapshot.strategy.name}</div>
        <div style={{ color: '#94a3b8' }}>{snapshot.strategy.description}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>状态: {STATUS_LABEL[status]}</span>
          <span>版本: v{snapshot.strategy.version}</span>
          <span>负责人: {snapshot.strategy.createdBy}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setStatus('active')} style={buttonStyle}>发布</button>
          <button type="button" onClick={() => setStatus('paused')} style={buttonStyle}>暂停</button>
          <button type="button" onClick={() => setStatus('archived')} style={buttonStyle}>归档</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={cardStyle}>
            <div>{metric.label}</div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <div style={{ marginBottom: 12, fontSize: 18, fontWeight: 700 }}>规则清单</div>
        <div style={{ display: 'grid', gap: 10 }}>
          {snapshot.strategy.rules.map((rule) => (
            <div key={rule.key} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: 10 }}>
              <span>{rule.key}</span>
              <span>{rule.value} · {rule.enabled ? '启用' : '禁用'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
