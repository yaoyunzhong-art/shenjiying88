'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import {
  FEEDBACK_STATUS_MAP,
  FEEDBACK_TABS,
  FEEDBACK_TYPE_MAP,
  REPLY_TABS,
  computeFeedbackStats,
  filterFeedbackItems,
  type FeedbackItem,
  type FeedbackSnapshotDelivery,
  type FeedbackTab,
  type FeedbackType,
  type ReplyTab,
} from './feedback-data'

function renderStars(rating: number): string {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}

function StatCard({
  label,
  value,
  variant,
  suffix,
}: {
  label: string
  value: string
  variant?: 'danger' | 'warning' | 'success' | 'info'
  suffix?: string
}) {
  const bgMap: Record<string, string> = { danger: '#fef2f2', warning: '#fffbeb', success: '#f0fdf4', info: '#eff6ff' }
  const colorMap: Record<string, string> = { danger: '#dc2626', warning: '#d97706', success: '#16a34a', info: '#2563eb' }
  return (
    <div style={{ padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', background: variant ? bgMap[variant] : '#f9fafb' }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: variant ? colorMap[variant] : '#111827' }}>
        {value}
        {suffix && <span style={{ fontSize: 18, fontWeight: 400, color: '#6b7280', marginLeft: 2 }}>{suffix}</span>}
      </div>
    </div>
  )
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const typeInfo = FEEDBACK_TYPE_MAP[item.type]
  const statusInfo = FEEDBACK_STATUS_MAP[item.status]
  const tagColors: Record<string, { bg: string; color: string }> = {
    danger: { bg: '#fef2f2', color: '#dc2626' },
    warning: { bg: '#fffbeb', color: '#d97706' },
    success: { bg: '#f0fdf4', color: '#16a34a' },
    info: { bg: '#eff6ff', color: '#2563eb' },
  }
  const typeStyle = tagColors[typeInfo.variant]
  const statusStyle = tagColors[statusInfo.variant]

  return (
    <div style={{ padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{item.customerName}</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>|</span>
          <span style={{ fontSize: 13, color: '#374151' }}>{item.storeName}</span>
          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: typeStyle.bg, color: typeStyle.color }}>{typeInfo.label}</span>
          <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: statusStyle.bg, color: statusStyle.color }}>{statusInfo.label}</span>
        </div>
        <span style={{ fontSize: 18, color: '#f59e0b', letterSpacing: 2 }}>{renderStars(item.rating)}</span>
      </div>
      <p style={{ margin: '4px 0', fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>{item.content}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{item.createdAt}</span>
        {item.handler && <span style={{ fontSize: 12, color: '#6b7280' }}>处理人: {item.handler}{item.remark && ` · ${item.remark}`}</span>}
      </div>
    </div>
  )
}

function EmptyState({ onReset, keyword }: { onReset: () => void; keyword: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
      <svg width="160" height="120" viewBox="0 0 160 120" fill="none" style={{ marginBottom: 24, opacity: 0.6 }}>
        <rect x="20" y="30" width="120" height="80" rx="8" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
        <line x1="40" y1="50" x2="80" y2="50" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="62" x2="100" y2="62" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="74" x2="90" y2="74" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <circle cx="120" cy="95" r="16" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5" />
        <line x1="120" y1="87" x2="120" y2="103" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        <line x1="112" y1="95" x2="128" y2="95" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>{keyword ? '没有搜索到相关反馈' : '暂无反馈记录'}</h3>
      <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 16px', maxWidth: 320 }}>
        {keyword ? `未找到包含「${keyword}」的反馈，请尝试其他关键词` : '当前筛选条件下没有客户反馈数据，点击下方按钮重置筛选'}
      </p>
      <button onClick={onReset} style={{ padding: '8px 20px', border: '1px solid #2563eb', borderRadius: 6, background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 14 }}>重置筛选</button>
    </div>
  )
}

export default function FeedbackClient({
  snapshot,
}: {
  snapshot: FeedbackSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [replyTab, setReplyTab] = useState<ReplyTab>('all')
  const [statusTab, setStatusTab] = useState<FeedbackTab>('all')
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all')
  const feedbacks = snapshot.feedbacks
  const stats = useMemo(() => computeFeedbackStats(feedbacks), [feedbacks])
  const filtered = useMemo(
    () => filterFeedbackItems(feedbacks, replyTab, statusTab, keyword, typeFilter),
    [feedbacks, keyword, replyTab, statusTab, typeFilter]
  )
  const showEmptyState = filtered.length === 0
  const isFiltered = replyTab !== 'all' || statusTab !== 'all' || keyword !== '' || typeFilter !== 'all'

  function handleReset() {
    setReplyTab('all')
    setStatusTab('all')
    setKeyword('')
    setTypeFilter('all')
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>客户反馈管理</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>查看和处理来自各门店的客户反馈信息</p>
        </div>
        <button
          type="button"
          onClick={() => {
            handleReset()
            handleRefresh()
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, color: '#374151' }}
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="总反馈数" value={String(stats.total)} />
        <StatCard label={`待处理 (${stats.pendingCount})`} value={String(stats.pendingCount)} variant="danger" />
        <StatCard label="本月平均评级" value={String(stats.monthlyAvgRating)} suffix="星" />
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '2px solid #e5e7eb' }} data-testid="reply-tab-bar">
        {REPLY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            data-testid={`reply-tab-${tab.key}`}
            onClick={() => setReplyTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: replyTab === tab.key ? 600 : 400,
              color: replyTab === tab.key ? '#2563eb' : '#6b7280',
              borderBottom: replyTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
        {FEEDBACK_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusTab(tab.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: statusTab === tab.key ? 600 : 400,
              color: statusTab === tab.key ? '#2563eb' : '#6b7280',
              borderBottom: statusTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="搜索客户名 / 门店 / 内容..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          style={{ flex: 1, maxWidth: 360, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        />
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as FeedbackType | 'all')}
          style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, background: '#fff' }}
        >
          <option value="all">全部类型</option>
          <option value="complaint">投诉</option>
          <option value="suggestion">建议</option>
          <option value="praise">表扬</option>
          <option value="inquiry">咨询</option>
        </select>
        {isFiltered && <span style={{ fontSize: 13, color: '#6b7280' }}>共 {filtered.length} 条结果</span>}
      </div>

      {showEmptyState ? (
        <EmptyState onReset={handleReset} keyword={keyword} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  )
}
