'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { RecommendationSnapshotDelivery } from './recommendations-data'

type RecTab = 'overview' | 'funnel' | 'reasons' | 'coldstart' | 'coverage'

const tabs: Array<{ key: RecTab; label: string }> = [
  { key: 'overview', label: '策略权重' },
  { key: 'funnel', label: '转化漏斗' },
  { key: 'reasons', label: '推荐理由' },
  { key: 'coldstart', label: '冷启动' },
  { key: 'coverage', label: '覆盖热力' },
]

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
}

export default function RecommendationsClient({
  snapshot,
}: {
  snapshot: RecommendationSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tab, setTab] = useState<RecTab>('overview')
  const summary = snapshot.summary

  const sortedWeights = useMemo(
    () => Object.entries(summary.strategyWeights).sort((left, right) => right[1] - left[1]),
    [summary.strategyWeights]
  )

  return (
    <div style={{ padding: 24, background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>推荐中心</h1>
          <div style={{ display: 'flex', gap: 16, color: '#6b7280', fontSize: 13, marginTop: 8, flexWrap: 'wrap' }}>
            <span>Tenant: {summary.tenantId}</span>
            <span>请求总数: {summary.metadata.totalRequests}</span>
            <span>平均耗时: {summary.metadata.avgExecutionMs}ms</span>
            <span>缓存命中率: {(summary.metadata.cacheHitRate * 100).toFixed(1)}%</span>
            <span>Fallback 占比: {(summary.metadata.fallbackRate * 100).toFixed(1)}%</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff' }}
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </header>

      <nav style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: tab === item.key ? '1px solid #2563eb' : '1px solid #cbd5e1',
              background: tab === item.key ? '#dbeafe' : '#fff',
              color: tab === item.key ? '#1d4ed8' : '#475569',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {sortedWeights.map(([key, value]) => (
            <div key={key} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong>{key}</strong>
                <span>{(value * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: '#e2e8f0' }}>
                <div
                  style={{
                    width: `${value * 100}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: '#2563eb',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'funnel' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {summary.funnel.map((item, index) => {
            const ratio = (item.count / summary.funnel[0].count) * 100
            return (
              <div key={item.stage} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong>{item.stage}</strong>
                  <span>{item.count.toLocaleString()}</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: '#e2e8f0' }}>
                  <div
                    style={{
                      width: `${ratio}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'][index],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'reasons' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {summary.topReasons.map((item) => (
            <div key={item.reason} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.reason}</span>
                <strong>{item.count.toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'coldstart' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
          <div style={cardStyle}>
            <div style={{ color: '#f59e0b', fontSize: 13 }}>Cold Start</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.coldStart.cold}</div>
          </div>
          <div style={cardStyle}>
            <div style={{ color: '#2563eb', fontSize: 13 }}>Warm</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.coldStart.warm}</div>
          </div>
        </div>
      )}

      {tab === 'coverage' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {summary.heatmap.map((item) => (
            <div key={`${item.strategy}-${item.category}`} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {item.strategy} × {item.category}
                </span>
                <strong>{item.count}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
