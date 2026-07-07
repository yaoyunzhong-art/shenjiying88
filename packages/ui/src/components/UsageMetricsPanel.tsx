'use client';

import React from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export interface UsageMetric {
  /** Metric identifier */
  key: string;
  /** Display label */
  label: string;
  /** Current value */
  value: number;
  /** Unit suffix */
  unit?: string;
  /** Percentage change vs previous period */
  changePercent?: number;
  /** Trend direction hint */
  trend?: 'up' | 'down' | 'flat';
  /** Color variant */
  color: 'info' | 'warning' | 'error' | 'success' | 'default';
}

export interface UsageMetricsPanelProps {
  /** Panel title */
  title: string;
  /** Array of metrics to display */
  metrics: UsageMetric[];
  /** Optional time range label (e.g. "过去7天") */
  timeRange?: string;
  /** Optional className override */
  className?: string;
}

// ── Color / icon helpers ────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#22c55e',
  default: '#6b7280',
};

const TREND_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  flat: '→',
};

const TREND_COLORS: Record<string, string> = {
  up: '#22c55e',
  down: '#ef4444',
  flat: '#94a3b8',
};

// ── Sparkline-style mini bar ────────────────────────────────────────────────

function MiniBar({ value, color }: { value: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        width: '100%',
        height: 4,
        background: 'rgba(148,163,184,0.15)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 6,
      }}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

// ── Single metric card ──────────────────────────────────────────────────────

function MetricCard({ metric }: { metric: UsageMetric }) {
  const accent = COLOR_MAP[metric.color]!;
  const displayValue = metric.unit
    ? `${metric.value.toLocaleString()}${metric.unit}`
    : metric.value.toLocaleString();

  return (
    <div
      style={{
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Label */}
      <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{metric.label}</span>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
          {displayValue}
        </span>
        {metric.changePercent != null && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: TREND_COLORS[metric.trend ?? 'flat'],
              marginLeft: 'auto',
            }}
          >
            {TREND_ICONS[metric.trend ?? 'flat']} {Math.abs(metric.changePercent ?? 0).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Mini bar */}
      <MiniBar value={metric.value < 0 ? 0 : metric.value > 100 ? 100 : metric.value} color={accent} />
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function UsageMetricsPanel({ title, metrics, timeRange, className }: UsageMetricsPanelProps) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{title}</h3>
        {timeRange && (
          <span style={{ fontSize: 12, color: '#64748b' }}>{timeRange}</span>
        )}
      </div>

      {/* Metrics grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {metrics.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </div>
    </div>
  );
}
