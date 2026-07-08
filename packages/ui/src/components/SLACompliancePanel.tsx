'use client';

import React, { useMemo, useState } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export type SLAStatus = 'compliant' | 'warning' | 'breached';
export type SLAPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface SLAMetric {
  /** 指标 ID */
  id: string;
  /** 指标名称 */
  name: string;
  /** SLA 目标值 (如 "99.9%", "2h", "95%") */
  target: string;
  /** 当前实际值 */
  current: string;
  /** 达标率 0-100 */
  complianceRate: number;
  /** 当前状态 */
  status: SLAStatus;
  /** 统计周期 */
  period: SLAPeriod;
  /** 总请求/样本数 */
  totalCount: number;
  /** 达标数 */
  compliantCount: number;
  /** 违规数 */
  breachCount: number;
  /** 趋势方向 */
  trend?: 'up' | 'down' | 'stable';
  /** 趋势变化百分比 */
  trendDelta?: number;
  /** 违规模板链接 */
  breachDetailUrl?: string;
}

export interface SLACompliancePanelProps {
  /** SLA 指标列表 */
  metrics: SLAMetric[];
  /** 面板标题 */
  title?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 仅显示警告/违规项 */
  showOnlyWarnings?: boolean;
  /** 点击行回调 */
  onMetricClick?: (metric: SLAMetric) => void;
  /** 查看违规详情回调 */
  onViewBreachDetail?: (metric: SLAMetric) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SLAStatus, { label: string; bg: string; fg: string; icon: string }> = {
  compliant: { label: '达标', bg: '#f6ffed', fg: '#52c41a', icon: '✓' },
  warning: { label: '预警', bg: '#fffbe6', fg: '#faad14', icon: '⚠' },
  breached: { label: '违规', bg: '#fff2f0', fg: '#ff4d4f', icon: '✗' },
};

const TREND_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
};

function complianceBarColor(rate: number): string {
  if (rate >= 99) return '#52c41a';
  if (rate >= 95) return '#1677ff';
  if (rate >= 90) return '#faad14';
  return '#ff4d4f';
}

// ── Sub Components ──────────────────────────────────────────────────────────

function SLAIndicator({
  status,
  rate,
}: {
  status: SLAStatus;
  rate: number;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div data-testid={`sla-status-${status}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: cfg.bg,
          color: cfg.fg,
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {cfg.icon}
      </span>
      <span
        style={{
          fontSize: 12,
          color: cfg.fg,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {cfg.label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginLeft: 4 }}>
        {rate.toFixed(1)}%
      </span>
    </div>
  );
}

function ComplianceBar({ rate }: { rate: number }) {
  return (
    <div
      data-testid="compliance-bar"
      style={{
        width: '100%',
        height: 6,
        borderRadius: 3,
        background: '#f0f0f0',
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      <div
        style={{
          width: `${Math.min(rate, 100)}%`,
          height: '100%',
          borderRadius: 3,
          background: complianceBarColor(rate),
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

function SLAMetricRow({
  metric,
  expanded,
  onToggle,
}: {
  metric: SLAMetric;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[metric.status];
  const trendIcon = metric.trend ? TREND_ICONS[metric.trend] : '';

  return (
    <div
      data-testid={`sla-row-${metric.id}`}
      style={{
        borderBottom: '1px solid #f0f0f0',
        padding: '12px 16px',
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onClick={onToggle}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {/* 第一行：指标名称 + 状态 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {metric.name}
          </span>
          <span style={{ fontSize: 12, color: '#888' }}>目标: {metric.target}</span>
        </div>
        <SLAIndicator status={metric.status} rate={metric.complianceRate} />
      </div>

      {/* 第二行：当前值 + 趋势 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 13, color: '#555' }}>
          当前值: <strong style={{ color: '#1a1a1a' }}>{metric.current}</strong>
          {metric.period && (
            <span style={{ marginLeft: 8, fontSize: 11, color: '#999', background: '#f5f5f5', padding: '1px 6px', borderRadius: 3 }}>
              {metric.period === 'daily' ? '日' : metric.period === 'weekly' ? '周' : metric.period === 'monthly' ? '月' : '季'}
            </span>
          )}
        </div>
        {metric.trend && (
          <span
            style={{
              fontSize: 13,
              color: metric.trend === 'up' ? '#52c41a' : metric.trend === 'down' ? '#ff4d4f' : '#999',
              fontWeight: 500,
            }}
            data-testid={`sla-trend-${metric.id}`}
          >
            {trendIcon} {metric.trendDelta != null ? `${metric.trendDelta > 0 ? '+' : ''}${metric.trendDelta.toFixed(1)}%` : ''}
          </span>
        )}
      </div>

      {/* 进度条 */}
      <ComplianceBar rate={metric.complianceRate} />

      {/* 展开详情 */}
      {expanded && (
        <div
          data-testid={`sla-expanded-${metric.id}`}
          style={{
            marginTop: 10,
            padding: '10px 12px',
            background: '#fafafa',
            borderRadius: 6,
            fontSize: 13,
            color: '#555',
            lineHeight: 1.8,
          }}
        >
          <div>总请求数: <strong>{metric.totalCount.toLocaleString()}</strong></div>
          <div>达标数: <strong style={{ color: '#52c41a' }}>{metric.compliantCount.toLocaleString()}</strong></div>
          <div>违规数: <strong style={{ color: '#ff4d4f' }}>{metric.breachCount.toLocaleString()}</strong></div>
          <div>达标率: <strong>{metric.complianceRate.toFixed(1)}%</strong></div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function SLACompliancePanel({
  metrics,
  title = 'SLA 合规监控',
  emptyText = '暂无 SLA 指标数据',
  showOnlyWarnings = false,
  onMetricClick,
  onViewBreachDetail,
  onRefresh,
}: SLACompliancePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMetrics = useMemo(() => {
    if (!showOnlyWarnings || !metrics) return metrics || [];
    return metrics.filter((m) => m.status !== 'compliant');
  }, [metrics, showOnlyWarnings]);

  const summary = useMemo(() => {
    const list = Array.isArray(metrics) ? metrics : [];
    const total = list.length;
    const compliant = list.filter((m) => m.status === 'compliant').length;
    const warned = list.filter((m) => m.status === 'warning').length;
    const breached = list.filter((m) => m.status === 'breached').length;
    const avgRate = total > 0 ? list.reduce((s, m) => s + m.complianceRate, 0) / total : 0;
    return { total, compliant, warned, breached, avgRate };
  }, [metrics]);

  if (!metrics || metrics.length === 0) {
    return (
      <div
        data-testid="sla-empty"
        style={{
          padding: 48,
          textAlign: 'center',
          color: '#999',
          fontSize: 14,
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      data-testid="sla-compliance-panel"
      style={{
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{title}</span>
          <span style={{ fontSize: 12, color: '#888', background: '#f5f5f5', padding: '1px 8px', borderRadius: 4 }}>
            {summary.total} 项指标
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            <span style={{ color: '#52c41a' }}>达标 {summary.compliant}</span>
            <span style={{ color: '#faad14' }}>预警 {summary.warned}</span>
            <span style={{ color: '#ff4d4f' }}>违规 {summary.breached}</span>
          </div>
          {onRefresh && (
            <button
              data-testid="sla-refresh-btn"
              onClick={onRefresh}
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                background: '#fff',
                padding: '3px 10px',
                fontSize: 12,
                cursor: 'pointer',
                color: '#555',
              }}
            >
              刷新
            </button>
          )}
        </div>
      </div>

      {/* 总体达标率 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#555' }}>综合达标率</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: complianceBarColor(summary.avgRate) }}>
            {summary.avgRate.toFixed(1)}%
          </span>
        </div>
        <ComplianceBar rate={summary.avgRate} />
      </div>

      {/* 指标列表 */}
      <div data-testid="sla-metric-list">
        {filteredMetrics.map((metric) => (
          <SLAMetricRow
            key={metric.id}
            metric={metric}
            expanded={expandedId === metric.id}
            onToggle={() => {
              setExpandedId(expandedId === metric.id ? null : metric.id);
              if (onMetricClick) onMetricClick(metric);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default SLACompliancePanel;
