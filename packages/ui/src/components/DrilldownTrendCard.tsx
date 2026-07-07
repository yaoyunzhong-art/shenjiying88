'use client';

import React, { useState, useCallback } from 'react';

// ==================== 类型定义 ====================

export interface SparklinePoint {
  label: string;
  value: number;
}

export interface DrilldownDetail {
  /** 钻取后的详细条目 */
  items: DrilldownDetailItem[];
  /** 钻取标题 */
  title: string;
  /** 钻取描述 */
  description?: string;
}

export interface DrilldownDetailItem {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
  onClick?: () => void;
}

export type TrendDirection = 'up' | 'down' | 'stable';

export interface DrilldownTrendCardProps {
  /** 主指标标签 */
  label: string;
  /** 主指标值 */
  value: string | number;
  /** 趋势方向 */
  trendDirection: TrendDirection;
  /** 趋势变化文本（如 +12.5%） */
  trendValue?: string;
  /** 趋势是否反转颜色 */
  trendInvert?: boolean;
  /** 图标 */
  icon?: React.ReactNode;
  /** 变体样式 */
  variant?: 'default' | 'info' | 'warning' | 'error' | 'success';
  /** 迷你 Sparkline 数据 */
  sparklineData?: SparklinePoint[];
  /** 附加描述文本（显示在指标下方） */
  description?: string;
  /** 钻取详情 — 点击卡片后展开 */
  drilldownDetail?: DrilldownDetail;
  /** 是否默认展开钻取 */
  defaultExpanded?: boolean;
  /** 是否允许钻取展开 */
  expandable?: boolean;
  /** 类名 */
  className?: string;
}

// ==================== 样式工具 ====================

const ACCENTS: Record<string, string> = {
  default: '#3b82f6',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#22c55e',
};

const TREND_COLORS: Record<TrendDirection, { fg: string; bg: string }> = {
  up: { fg: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  down: { fg: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  stable: { fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

const ITEM_VARIANT_ACCENTS: Record<string, string> = {
  default: '#3b82f6',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  success: '#22c55e',
};

// ==================== 迷你 Sparkline 图 ====================

function Sparkline({ data, accent }: { data: SparklinePoint[]; accent: string }) {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const padding = 2;
  const chartW = w - padding * 2;
  const chartH = h - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * chartW;
    const y = padding + chartH - ((d.value - min) / range) * chartH;
    return `${x},${y}`;
  });

  const pathD = `M${points.join(' L')}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sparkline-fill-${accent.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity={0.25} />
          <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L${padding + chartW},${padding + chartH} L${padding},${padding + chartH} Z`}
        fill={`url(#sparkline-fill-${accent.replace('#', '')})`}
      />
      <path d={pathD} fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ==================== 主组件 ====================

/**
 * DrilldownTrendCard — 带钻取功能的趋势指标卡片
 *
 * 在决策面板/仪表盘上展示核心 KPI 指标，支持：
 * - 迷你 Sparkline 趋势图
 * - 方向性趋势指示器
 * - 点击展开钻取详情
 */
export function DrilldownTrendCard({
  label,
  value,
  trendDirection,
  trendValue,
  trendInvert = false,
  icon,
  variant = 'default',
  sparklineData,
  description,
  drilldownDetail,
  defaultExpanded = false,
  expandable = true,
  className = '',
}: DrilldownTrendCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const accent: string = ACCENTS[variant] ?? ACCENTS['default']!;
  const trendColor = TREND_COLORS[trendDirection] ?? TREND_COLORS.stable;
  const canExpand = expandable && !!drilldownDetail;

  const handleToggle = useCallback(() => {
    if (canExpand) setExpanded((prev) => !prev);
  }, [canExpand]);

  const trendArrow =
    trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→';

  return (
    <div className={className}>
      {/* 主卡片 */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={!canExpand}
        style={{
          width: '100%',
          textAlign: 'left',
          cursor: canExpand ? 'pointer' : 'default',
          background: 'rgba(15,23,42,0.5)',
          border: `1px solid rgba(148,163,184,0.12)`,
          borderRadius: 12,
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
          fontFamily: 'inherit',
          ...(canExpand
            ? { ':hover': { borderColor: accent, boxShadow: `0 0 0 1px ${accent}40` } }
            : {}),
        }}
        onMouseEnter={(e) => {
          if (canExpand) {
            e.currentTarget.style.borderColor = accent;
            e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}40`;
          }
        }}
        onMouseLeave={(e) => {
          if (canExpand) {
            e.currentTarget.style.borderColor = 'rgba(148,163,184,0.12)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
        aria-expanded={expanded}
        aria-label={`${label}: ${value}`}
      >
        {/* 标题行 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon && <span style={{ color: accent }}>{icon}</span>}
            {canExpand && (
              <span style={{ fontSize: 12, color: '#64748b', transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            )}
          </div>
        </div>

        {/* 数值 + 趋势行 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#f8fafc' }}>{value}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: trendInvert ? trendColor.bg : trendColor.fg, display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 16,
              height: 16,
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 700,
              color: trendColor.fg,
              background: trendColor.bg,
            }}>
              {trendArrow}
            </span>
            {trendValue && <span style={{ color: trendColor.fg }}>{trendValue}</span>}
          </span>
        </div>

        {/* 描述 + Sparkline */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
          {description ? (
            <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{description}</span>
          ) : (
            <span />
          )}
          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline data={sparklineData} accent={accent} />
          )}
        </div>
      </button>

      {/* 钻取详情展开区域 */}
      {canExpand && expanded && drilldownDetail && (
        <div
          style={{
            marginTop: 8,
            borderRadius: 12,
            padding: 16,
            background: 'rgba(30,41,59,0.5)',
            border: '1px solid rgba(148,163,184,0.08)',
          }}
        >
          {/* 钻取标题 */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{drilldownDetail.title}</div>
            {drilldownDetail.description && (
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{drilldownDetail.description}</div>
            )}
          </div>

          {/* 钻取条目网格 */}
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {drilldownDetail.items.map((item, index) => {
              const itemAccent: string = ITEM_VARIANT_ACCENTS[item.variant ?? 'default'] ?? ITEM_VARIANT_ACCENTS['default']!;
              return (
                <div
                  key={index}
                  onClick={item.onClick}
                  style={{
                    borderRadius: 8,
                    padding: '10px 12px',
                    background: 'rgba(15,23,42,0.3)',
                    border: '1px solid rgba(148,163,184,0.08)',
                    cursor: item.onClick ? 'pointer' : 'default',
                    transition: 'border-color 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (item.onClick) e.currentTarget.style.borderColor = itemAccent;
                  }}
                  onMouseLeave={(e) => {
                    if (item.onClick) e.currentTarget.style.borderColor = 'rgba(148,163,184,0.08)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</span>
                    {item.icon && <span style={{ color: itemAccent, fontSize: 14 }}>{item.icon}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>{item.value}</span>
                    {item.trend && (
                      <span style={{ fontSize: 11, fontWeight: 500, color: item.trend.positive ? '#22c55e' : '#ef4444' }}>
                        {item.trend.positive ? '↑' : '↓'} {item.trend.value}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
