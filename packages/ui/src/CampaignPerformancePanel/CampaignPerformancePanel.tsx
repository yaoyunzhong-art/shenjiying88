'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 活动效果指标 */
export interface CampaignMetric {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  delta?: string;
  color?: string;
}

/** 活动数据点（趋势图用） */
export interface CampaignDataPoint {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

/** AI 活动建议 */
export interface CampaignInsight {
  type: 'positive' | 'negative' | 'info' | 'warning';
  message: string;
  recommendation?: string;
}

/** 活动性能面板 Props */
export interface CampaignPerformancePanelProps {
  /** 活动名称 */
  campaignName: string;
  /** 活动状态 */
  status: 'active' | 'scheduled' | 'ended' | 'draft';
  /** 核心指标 */
  metrics: CampaignMetric[];
  /** 趋势数据 */
  trendData?: CampaignDataPoint[];
  /** AI 洞察/建议 */
  insights?: CampaignInsight[];
  /** 加载中 */
  loading?: boolean;
  /** 空状态文案 */
  emptyText?: string;
  /** 类名 */
  className?: string;
  /** 测试 ID */
  'data-testid'?: string;
}

// ==================== 子组件: 指标卡 ====================

function MetricCard({ metric }: { metric: CampaignMetric }) {
  const trendIcon = metric.trend === 'up' ? '📈' : metric.trend === 'down' ? '📉' : '➡️';
  const trendColor = metric.trend === 'up' ? '#16a34a' : metric.trend === 'down' ? '#dc2626' : '#6b7280';
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        padding: '16px 20px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, fontWeight: 500 }}>
        {metric.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: metric.color ?? '#111827' }}>
          {metric.value}
          {metric.unit && <span style={{ fontSize: 14, fontWeight: 400, color: '#9ca3af', marginLeft: 2 }}>{metric.unit}</span>}
        </span>
        {metric.delta && (
          <span style={{ fontSize: 13, fontWeight: 600, color: trendColor, display: 'flex', alignItems: 'center', gap: 2 }}>
            {trendIcon} {metric.delta}
          </span>
        )}
      </div>
    </div>
  );
}

// ==================== 子组件: 简化趋势柱形图 ====================

function MiniTrendBars({ data }: { data: CampaignDataPoint[] }) {
  const maxValue = useMemo(() => Math.max(...data.map((d) => d.conversions), 1), [data]);
  if (!data.length) return <div style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>暂无趋势数据</div>;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, padding: '8px 0' }}>
      {data.slice(-14).map((d, i) => {
        const h = Math.max((d.conversions / maxValue) * 100, 4);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>{d.conversions}</span>
            <div
              style={{
                width: '100%',
                height: h,
                background: `linear-gradient(to top, #3b82f6, #60a5fa)`,
                borderRadius: '3px 3px 0 0',
                minHeight: 4,
                transition: 'height 0.3s',
              }}
              title={`${d.date}: ${d.conversions} conversions`}
            />
            {data.length <= 14 && (
              <span style={{ fontSize: 9, color: '#9ca3af', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                {d.date.slice(5)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * CampaignPerformancePanel — AI 增强型活动效果分析面板
 *
 * 展示活动核心指标、转化趋势、AI 洞察建议。
 * 适用于 店长工作台/营销面板/活动详情页。
 */
export function CampaignPerformancePanel({
  campaignName,
  status,
  metrics,
  trendData,
  insights,
  loading = false,
  emptyText = '暂无活动数据',
  className = '',
  'data-testid': dataTestId = 'campaign-perf-panel',
}: CampaignPerformancePanelProps) {
  if (loading) {
    return (
      <div
        data-testid={`${dataTestId}-loading`}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ height: 22, width: '40%', background: '#f3f4f6', borderRadius: 4, marginBottom: 16 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 80, background: '#f3f4f6', borderRadius: 8 }} />
          ))}
        </div>
        <div style={{ height: 120, background: '#f3f4f6', borderRadius: 8, marginTop: 16 }} />
      </div>
    );
  }

  const statusStyle: Record<string, React.CSSProperties> = {
    active: { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
    scheduled: { background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' },
    ended: { background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb' },
    draft: { background: '#fef9c3', color: '#854d0e', border: '1px solid #fef08a' },
  };

  const statusLabel: Record<string, string> = {
    active: '进行中',
    scheduled: '待开始',
    ended: '已结束',
    draft: '草稿',
  };

  return (
    <div
      className={className}
      data-testid={dataTestId}
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* 标题区 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
            🎯 {campaignName}
          </h2>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: '2px 10px',
              borderRadius: 20,
              ...statusStyle[status],
            }}
          >
            {statusLabel[status]}
          </span>
        </div>
        <span style={{ fontSize: 13, color: '#6b7280' }}>AI 效果分析</span>
      </div>

      {/* 核心指标 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {metrics.map((m, i) => (
          <MetricCard key={i} metric={m} />
        ))}
      </div>

      {/* 双栏布局: 趋势 + AI 洞察 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* 转化趋势 */}
        <div
          style={{
            background: '#f9fafb',
            borderRadius: 10,
            padding: 16,
            border: '1px solid #f3f4f6',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 8px 0' }}>
            📊 转化趋势 (近14天)
          </h3>
          {trendData && trendData.length > 0 ? (
            <MiniTrendBars data={trendData} />
          ) : (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 40, fontSize: 14 }}>
              {emptyText}
            </div>
          )}
        </div>

        {/* AI 洞察 */}
        <div
          style={{
            background: '#f0f9ff',
            borderRadius: 10,
            padding: 16,
            border: '1px solid #e0f2fe',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0369a1', margin: '0 0 12px 0' }}>
            🤖 AI 洞察建议
          </h3>
          {insights && insights.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {insights.map((insight, i) => {
                const iconMap = { positive: '✅', negative: '⚠️', info: '💡', warning: '🔔' };
                const bgMap = { positive: '#f0fdf4', negative: '#fef2f2', info: '#eff6ff', warning: '#fffbeb' };
                const borderMap = { positive: '#bbf7d0', negative: '#fecaca', info: '#bfdbfe', warning: '#fde68a' };
                return (
                  <div
                    key={i}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: bgMap[insight.type],
                      border: `1px solid ${borderMap[insight.type]}`,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                      {iconMap[insight.type]} {insight.message}
                    </div>
                    {insight.recommendation && (
                      <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
                        💬 {insight.recommendation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 30, fontSize: 13 }}>
              暂无分析建议
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
