import React, { useMemo } from 'react';

// ---- Types ----

export interface AgentPerformanceMetric {
  /** 指标标识 */
  key: string;
  /** 指标名称 */
  label: string;
  /** 当前值 */
  value: number;
  /** 单位 */
  unit?: string;
  /** 较前期的变化百分比 (正=上升 负=下降) */
  changePercent?: number;
  /** 阈值 (超过则告警) */
  threshold?: number;
  /** 是否处于异常 */
  breached?: boolean;
}

export interface AgentLatencyBucket {
  /** 延迟区间标签 e.g. '<100ms' */
  label: string;
  /** 该区间请求数 */
  count: number;
  /** 区间颜色 */
  color?: string;
}

export interface AgentPerformanceSummary {
  /** 总请求数 */
  totalRequests: number;
  /** 成功数 */
  successCount: number;
  /** 失败数 */
  failureCount: number;
  /** 平均延迟 ms */
  avgLatencyMs: number;
  /** P95 延迟 ms */
  p95LatencyMs: number;
  /** P99 延迟 ms */
  p99LatencyMs: number;
}

export interface AIAgentPerformancePanelProps {
  /** 面板标题 */
  title?: string;
  /** 性能摘要 */
  summary: AgentPerformanceSummary;
  /** 关键指标列表 */
  metrics: AgentPerformanceMetric[];
  /** 延迟分布 */
  latencyBuckets?: AgentLatencyBucket[];
  /** 面板 className */
  className?: string;
  /** 加载态 */
  loading?: boolean;
  /** 空态文本 */
  emptyText?: string;
}

// ---- Helpers ----

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

function formatPercent(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

// ---- Component ----

export function AIAgentPerformancePanel({
  title = 'AI Agent 性能监控',
  summary,
  metrics,
  latencyBuckets,
  className = '',
  loading = false,
  emptyText = '暂无性能数据',
}: AIAgentPerformancePanelProps) {
  const successRate = useMemo(() => {
    if (summary.totalRequests === 0) return 0;
    return (summary.successCount / summary.totalRequests) * 100;
  }, [summary]);

  const failureRate = useMemo(() => {
    if (summary.totalRequests === 0) return 0;
    return (summary.failureCount / summary.totalRequests) * 100;
  }, [summary]);

  const maxBucketCount = useMemo(() => {
    if (!latencyBuckets || latencyBuckets.length === 0) return 0;
    return Math.max(...latencyBuckets.map((b) => b.count), 1);
  }, [latencyBuckets]);

  if (loading) {
    return (
      <div
        className={className}
        style={{
          borderRadius: 12,
          padding: 24,
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#e2e8f0',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>{title}</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 140,
                padding: 16,
                borderRadius: 8,
                background: '#1e293b',
                border: '1px solid #334155',
              }}
            >
              <div
                style={{
                  height: 12,
                  width: '60%',
                  background: '#334155',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 24,
                  width: '40%',
                  background: '#334155',
                  borderRadius: 4,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (summary.totalRequests === 0) {
    return (
      <div
        className={className}
        style={{
          borderRadius: 12,
          padding: 24,
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#94a3b8',
          textAlign: 'center',
          fontSize: 14,
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        borderRadius: 12,
        padding: 24,
        background: '#1e293b',
        border: '1px solid #334155',
        color: '#e2e8f0',
      }}
    >
      {/* 标题 */}
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>{title}</div>

      {/* 摘要卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <SummaryCard label="总请求" value={summary.totalRequests.toLocaleString()} />
        <SummaryCard
          label="成功率"
          value={`${successRate.toFixed(1)}%`}
          color={successRate >= 99 ? '#22c55e' : successRate >= 95 ? '#eab308' : '#ef4444'}
        />
        <SummaryCard
          label="失败数"
          value={summary.failureCount.toLocaleString()}
          color={summary.failureCount > 0 ? '#ef4444' : '#94a3b8'}
        />
        <SummaryCard label="平均延迟" value={formatMs(summary.avgLatencyMs)} />
        <SummaryCard label="P95 延迟" value={formatMs(summary.p95LatencyMs)} />
        <SummaryCard label="P99 延迟" value={formatMs(summary.p99LatencyMs)} />
      </div>

      {/* 指标列表 */}
      {metrics.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: '#94a3b8' }}>
            关键指标
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {metrics.map((m) => (
              <MetricRow key={m.key} metric={m} />
            ))}
          </div>
        </div>
      )}

      {/* 延迟分布 */}
      {latencyBuckets && latencyBuckets.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: '#94a3b8' }}>
            延迟分布
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {latencyBuckets.map((bucket) => (
              <LatencyBar
                key={bucket.label}
                bucket={bucket}
                maxCount={maxBucketCount}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Sub-components ----

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: 8,
        background: '#0f172a',
        border: '1px solid #334155',
      }}
    >
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          color: color ?? '#e2e8f0',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function MetricRow({ metric }: { metric: AgentPerformanceMetric }) {
  const barColor = metric.breached
    ? '#ef4444'
    : metric.changePercent != null && metric.changePercent < 0
    ? '#22c55e'
    : '#3b82f6';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '8px 12px',
        borderRadius: 6,
        background: '#0f172a',
      }}
    >
      <div style={{ flex: 1, fontSize: 13, color: '#cbd5e1' }}>{metric.label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          color: barColor,
        }}
      >
        {metric.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        {metric.unit ? <span style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>{metric.unit}</span> : null}
      </div>
      {metric.changePercent != null && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: metric.changePercent >= 0 ? '#22c55e' : '#ef4444',
            minWidth: 50,
            textAlign: 'right',
          }}
        >
          {formatPercent(metric.changePercent)}
        </div>
      )}
      {metric.breached && (
        <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>⚠</span>
      )}
    </div>
  );
}

function LatencyBar({
  bucket,
  maxCount,
}: {
  bucket: AgentLatencyBucket;
  maxCount: number;
}) {
  const pct = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 64, fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>
        {bucket.label}
      </div>
      <div
        style={{
          flex: 1,
          height: 16,
          borderRadius: 4,
          background: '#0f172a',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(pct, 2)}%`,
            borderRadius: 4,
            background: bucket.color ?? '#3b82f6',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div
        style={{
          width: 48,
          fontSize: 12,
          color: '#94a3b8',
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}
      >
        {bucket.count.toLocaleString()}
      </div>
    </div>
  );
}
