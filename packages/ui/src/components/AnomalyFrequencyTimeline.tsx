'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 时间桶中的异常统计 */
export interface AnomalyTimeBucket {
  /** 时间标签 (e.g. "06-26 08:00", "周一") */
  label: string;
  /** 该时段异常总数 */
  total: number;
  /** 各严重程度计数 */
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** 可选点击回调数据 */
  bucketId?: string;
}

/** 异常时序频率图 Props */
export interface AnomalyFrequencyTimelineProps {
  /** 按时间分桶的数据 */
  buckets: AnomalyTimeBucket[];
  /** 面板标题 */
  title?: string;
  /** 图表高度 px */
  height?: number;
  /** 最大显示桶数 */
  maxBuckets?: number;
  /** 加载中 */
  loading?: boolean;
  /** 空状态文本 */
  emptyText?: string;
  /** 测试 ID */
  'data-testid'?: string;
}

// ==================== 样式常量 ====================

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',   // red-500
  high: '#f97316',       // orange-500
  medium: '#eab308',     // yellow-500
  low: '#22c55e',        // green-500
};

const SEVERITY_LABELS: Record<string, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

// ==================== 组件 ====================

/**
 * AnomalyFrequencyTimeline — 异常时序频率图
 * 以堆叠条形图展示各时间段内不同严重程度异常的分布频率。
 */
export function AnomalyFrequencyTimeline({
  buckets,
  title = '异常时序频率',
  height = 200,
  maxBuckets = 24,
  loading = false,
  emptyText = '暂无异常时序数据',
  'data-testid': dataTestId = 'anomaly-frequency-timeline',
}: AnomalyFrequencyTimelineProps) {
  const displayed = useMemo(
    () => (buckets ?? []).slice(-maxBuckets),
    [buckets, maxBuckets],
  );

  const maxTotal = useMemo(
    () => Math.max(...displayed.map((b) => b.total), 1),
    [displayed],
  );

  const chartHeight = height - 40; // leave room for labels

  if (loading) {
    return (
      <div data-testid={dataTestId} role="region" aria-label={title}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>
          {title}
        </div>
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
          加载中...
        </div>
      </div>
    );
  }

  if (!displayed.length) {
    return (
      <div data-testid={dataTestId} role="region" aria-label={title}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>
          {title}
        </div>
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 13 }}>
          {emptyText}
        </div>
      </div>
    );
  }

  return (
    <div data-testid={dataTestId} role="region" aria-label={title}>
      {/* 标题 */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>
        {title}
      </div>

      {/* 图例 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (
          <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: SEVERITY_COLORS[sev], display: 'inline-block' }} />
            {SEVERITY_LABELS[sev]}
          </div>
        ))}
      </div>

      {/* 图表区 */}
      <div style={{ height: chartHeight, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
        {displayed.map((bucket, idx) => {
          const barHeight = Math.max((bucket.total / maxTotal) * (chartHeight - 20), bucket.total > 0 ? 4 : 0);
          const criticalH = (bucket.bySeverity.critical / maxTotal) * (chartHeight - 20);
          const highH = (bucket.bySeverity.high / maxTotal) * (chartHeight - 20);
          const mediumH = (bucket.bySeverity.medium / maxTotal) * (chartHeight - 20);
          const lowH = (bucket.bySeverity.low / maxTotal) * (chartHeight - 20);
          const totalH = criticalH + highH + mediumH + lowH;

          return (
            <div
              key={bucket.label + idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 28,
              }}
              title={`${bucket.label}: ${bucket.total} 条异常`}
            >
              {/* 堆叠条 */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 36,
                  height: Math.max(totalH, barHeight),
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  borderRadius: '3px 3px 0 0',
                  overflow: 'hidden',
                  background: 'rgba(148,163,184,0.08)',
                }}
              >
                {lowH > 0 && (
                  <div style={{ height: `${(lowH / Math.max(totalH, 1)) * 100}%`, background: SEVERITY_COLORS.low, minHeight: 1 }} />
                )}
                {mediumH > 0 && (
                  <div style={{ height: `${(mediumH / Math.max(totalH, 1)) * 100}%`, background: SEVERITY_COLORS.medium, minHeight: 1 }} />
                )}
                {highH > 0 && (
                  <div style={{ height: `${(highH / Math.max(totalH, 1)) * 100}%`, background: SEVERITY_COLORS.high, minHeight: 1 }} />
                )}
                {criticalH > 0 && (
                  <div style={{ height: `${(criticalH / Math.max(totalH, 1)) * 100}%`, background: SEVERITY_COLORS.critical, minHeight: 1 }} />
                )}
              </div>
              {/* 数值标签 */}
              {bucket.total > 0 && (
                <span style={{ fontSize: 9, color: '#64748b', marginTop: 2, lineHeight: 1 }}>
                  {bucket.total}
                </span>
              )}
              {/* X轴标签 */}
              <span style={{
                fontSize: 9,
                color: '#475569',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 40,
              }}>
                {bucket.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnomalyFrequencyTimeline;
