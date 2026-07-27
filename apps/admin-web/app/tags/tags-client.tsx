'use client'

import { useMemo, useState } from 'react'
import type { TagsPageSnapshot } from './tags-page-data'
import SnapshotRefreshCard from '../components/snapshot-refresh-card'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

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

export default function TagsClient({ snapshot }: { snapshot: TagsPageSnapshot }) {
  const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [activeTab, setActiveTab] = useState<'all' | '消费行为' | '兴趣偏好' | '会员等级'>('all')

  const filteredTags = useMemo(() => {
    if (activeTab === 'all') return snapshot.tags
    return snapshot.tags.filter((tag) => tag.category === activeTab)
  }, [activeTab, snapshot.tags])

  const topTag = useMemo(() => {
    return [...snapshot.tags].sort((left, right) => right.memberCount - left.memberCount)[0]
  }, [snapshot.tags])

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <div style={cardStyle}><div>总标签数</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{snapshot.tags.length}</div></div>
        <div style={cardStyle}><div>启用中</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{snapshot.tags.filter((tag) => tag.active).length}</div></div>
        <div style={cardStyle}><div>最高关联标签</div><div style={{ marginTop: 8, fontSize: 24, fontWeight: 700 }}>{topTag?.name ?? '—'}</div></div>
      </div>

      <div style={{ ...cardStyle, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'all' as const, label: '全部' },
            { key: '消费行为' as const, label: '消费行为' },
            { key: '兴趣偏好' as const, label: '兴趣偏好' },
            { key: '会员等级' as const, label: '会员等级' },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              style={{
                ...buttonStyle,
                background: activeTab === item.key ? 'rgba(59, 130, 246, 0.22)' : buttonStyle.background,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ paddingBottom: 12 }}>标签名称</th>
                <th style={{ paddingBottom: 12 }}>分类</th>
                <th style={{ paddingBottom: 12 }}>门店数</th>
                <th style={{ paddingBottom: 12 }}>关联会员数</th>
                <th style={{ paddingBottom: 12 }}>创建人</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.map((tag) => (
                <tr key={tag.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                  <td style={{ padding: '12px 0' }}>{tag.name}</td>
                  <td>{tag.category}</td>
                  <td>{tag.storesCount}</td>
                  <td>{tag.memberCount.toLocaleString('zh-CN')}</td>
                  <td>{tag.creator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
