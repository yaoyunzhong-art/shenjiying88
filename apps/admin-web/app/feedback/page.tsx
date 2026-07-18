'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  MOCK_FEEDBACKS,
  FEEDBACK_TYPE_MAP,
  FEEDBACK_STATUS_MAP,
  getFeedbackTypeLabel,
  getFeedbackStatusLabel,
  renderStars,
  type FeedbackItem,
  type FeedbackType,
} from '../feedback-data';
import {
  FEEDBACK_TABS,
  fullFilterChain,
  type FeedbackTab,
} from '../feedback-page';

export default function FeedbackPage() {
  const [tab, setTab] = useState<FeedbackTab>('all');
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');

  const allItems = MOCK_FEEDBACKS;
  const stats = useMemo(() => {
    const total = allItems.length;
    const pendingCount = allItems.filter((f) => f.status === 'pending').length;
    const processingCount = allItems.filter((f) => f.status === 'processing').length;
    const resolvedCount = allItems.filter((f) => f.status === 'resolved').length;
    const thisMonth = '2026-07';
    const thisMonthItems = allItems.filter((f) => f.createdAt.startsWith(thisMonth));
    const totalRating = thisMonthItems.reduce((s, f) => s + f.rating, 0);
    const monthlyAvgRating = thisMonthItems.length > 0
      ? Math.round((totalRating / thisMonthItems.length) * 10) / 10
      : 0;
    return { total, pendingCount, processingCount, resolvedCount, monthlyAvgRating };
  }, [allItems]);

  const filtered = useMemo(
    () => fullFilterChain(allItems, tab, keyword, typeFilter),
    [allItems, tab, keyword, typeFilter],
  );

  const handleRefresh = useCallback(() => {
    setTab('all');
    setKeyword('');
    setTypeFilter('all');
  }, []);

  const isFiltered = tab !== 'all' || keyword !== '' || typeFilter !== 'all';
  const showEmptyState = filtered.length === 0;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>客户反馈管理</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            查看和处理来自各门店的客户反馈信息
          </p>
        </div>
        <button
          onClick={handleRefresh}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            color: '#374151',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M1 8a7 7 0 0 1 13.2-3.5M15 1v4h-4m4 3a7 7 0 0 1-13.2 3.5M1 15v-4h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          刷新
        </button>
      </div>

      {/* 概览统计 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard label="总反馈数" value={String(stats.total)} />
        <StatCard label="待处理" value={String(stats.pendingCount)} variant="danger" />
        <StatCard label="本月平均评级" value={String(stats.monthlyAvgRating)} suffix="星" />
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
        {FEEDBACK_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#2563eb' : '#6b7280',
              borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {t.label}
            {t.key !== 'all' && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 12,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background:
                    t.key === 'pending'
                      ? '#fef2f2'
                      : t.key === 'processing'
                        ? '#fffbeb'
                        : '#f0fdf4',
                  color:
                    t.key === 'pending'
                      ? '#dc2626'
                      : t.key === 'processing'
                        ? '#d97706'
                        : '#16a34a',
                }}
              >
                {t.key === 'pending'
                  ? stats.pendingCount
                  : t.key === 'processing'
                    ? stats.processingCount
                    : stats.resolvedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 搜索和类型筛选 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="搜索客户名 / 门店 / 内容..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 360,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as FeedbackType | 'all')}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            background: '#fff',
          }}
        >
          <option value="all">全部类型</option>
          <option value="complaint">投诉</option>
          <option value="suggestion">建议</option>
          <option value="praise">表扬</option>
          <option value="inquiry">咨询</option>
        </select>
        {isFiltered && (
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            共 {filtered.length} 条结果
          </span>
        )}
      </div>

      {/* 反馈列表 */}
      {showEmptyState ? (
        <EmptyState onReset={handleRefresh} keyword={keyword} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((item) => (
            <FeedbackCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}

// ---- 子组件 ----

function StatCard({
  label,
  value,
  variant,
  suffix,
}: {
  label: string;
  value: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  suffix?: string;
}) {
  const bgMap: Record<string, string> = {
    danger: '#fef2f2',
    warning: '#fffbeb',
    success: '#f0fdf4',
    info: '#eff6ff',
  };
  const colorMap: Record<string, string> = {
    danger: '#dc2626',
    warning: '#d97706',
    success: '#16a34a',
    info: '#2563eb',
  };

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: variant ? bgMap[variant] : '#f9fafb',
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: variant ? colorMap[variant] : '#111827',
        }}
      >
        {value}
        {suffix && (
          <span style={{ fontSize: 18, fontWeight: 400, color: '#6b7280', marginLeft: 2 }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ item }: { item: FeedbackItem }) {
  const typeInfo = FEEDBACK_TYPE_MAP[item.type];
  const statusInfo = FEEDBACK_STATUS_MAP[item.status];

  const tagColors: Record<string, { bg: string; color: string }> = {
    danger: { bg: '#fef2f2', color: '#dc2626' },
    warning: { bg: '#fffbeb', color: '#d97706' },
    success: { bg: '#f0fdf4', color: '#16a34a' },
    info: { bg: '#eff6ff', color: '#2563eb' },
  };

  const typeStyle = tagColors[typeInfo.variant] ?? tagColors.info;
  const statusStyle = tagColors[statusInfo.variant] ?? { bg: '#f3f4f6', color: '#6b7280' };
  if (statusInfo.variant === 'neutral') {
    statusStyle.bg = '#f3f4f6';
    statusStyle.color = '#6b7280';
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{item.customerName}</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>|</span>
          <span style={{ fontSize: 13, color: '#374151' }}>{item.storeName}</span>
          <span
            style={{
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 10,
              background: typeStyle.bg,
              color: typeStyle.color,
            }}
          >
            {getFeedbackTypeLabel(item.type)}
          </span>
          <span
            style={{
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 10,
              background: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {getFeedbackStatusLabel(item.status)}
          </span>
        </div>
        <span style={{ fontSize: 18, color: '#f59e0b', letterSpacing: 2 }}>
          {renderStars(item.rating)}
        </span>
      </div>
      <p style={{ margin: '4px 0', fontSize: 14, color: '#4b5563', lineHeight: 1.5 }}>
        {item.content}
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>{item.createdAt}</span>
        {item.handler && (
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            处理人: {item.handler}
            {item.remark && ` · ${item.remark}`}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  onReset,
  keyword,
}: {
  onReset: () => void;
  keyword: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      {/* SVG 空态图 */}
      <svg
        width="160"
        height="120"
        viewBox="0 0 160 120"
        fill="none"
        style={{ marginBottom: 24, opacity: 0.6 }}
      >
        <rect x="20" y="30" width="120" height="80" rx="8" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="1.5" />
        <line x1="40" y1="50" x2="80" y2="50" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="62" x2="100" y2="62" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="74" x2="90" y2="74" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="86" x2="70" y2="86" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        <circle cx="120" cy="95" r="16" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5" />
        <line x1="120" y1="87" x2="120" y2="103" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
        <line x1="112" y1="95" x2="128" y2="95" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
        {keyword ? '没有搜索到相关反馈' : '暂无反馈记录'}
      </h3>
      <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 16px', maxWidth: 320 }}>
        {keyword
          ? `未找到包含「${keyword}」的反馈，请尝试其他关键词`
          : '当前筛选条件下没有客户反馈数据，点击下方按钮重置筛选'}
      </p>
      <button
        onClick={onReset}
        style={{
          padding: '8px 20px',
          border: '1px solid #2563eb',
          borderRadius: 6,
          background: '#2563eb',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        重置筛选
      </button>
    </div>
  );
}
