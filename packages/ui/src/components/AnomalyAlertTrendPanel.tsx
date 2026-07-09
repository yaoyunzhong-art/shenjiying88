'use client';

import React, { useState, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════════════

export interface AlertTrendDataPoint {
  /** 日期/时间标签 */
  date: string;
  /** 异常总数 */
  total: number;
  /** critical 数量 */
  critical: number;
  /** high 数量 */
  high: number;
  /** medium 数量 */
  medium: number;
  /** low 数量 */
  low: number;
  /** 已解决数量 */
  resolved: number;
}

export type TrendGranularity = 'day' | 'week' | 'month';

export interface AnomalyAlertTrendPanelProps {
  /** 趋势数据 */
  data: AlertTrendDataPoint[];
  /** 数据粒度 */
  granularity?: TrendGranularity;
  /** 面板标题 */
  title?: string;
  /** 自定义类名 */
  className?: string;
  /** 自适应高度，默认 280px */
  height?: number;
  /** 宽度 */
  width?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// 颜色方案
// ═══════════════════════════════════════════════════════════════════════════

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
  resolved: '#22c55e',
  total: '#8b5cf6',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// 基础图表组件 (纯 SVG)
// ═══════════════════════════════════════════════════════════════════════════

interface TrendChartProps {
  data: AlertTrendDataPoint[];
  dataKey: 'total' | 'critical' | 'high' | 'medium' | 'low' | 'resolved';
  color: string;
  width: number;
  height: number;
  /** 是否填充面积 */
  filled?: boolean;
  /** 是否显示数据点 */
  showDots?: boolean;
}

const TrendLine: React.FC<TrendChartProps> = ({
  data,
  dataKey,
  color,
  width,
  height,
  filled = false,
  showDots = true,
}) => {
  const padding = { top: 8, right: 8, bottom: 8, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map(d => d[dataKey]);
  const maxVal = Math.max(...values, 1);
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((d[dataKey] - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, label: d.date, value: d[dataKey] };
  });

  if (points.length === 0) return null;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    filled && points.length > 1
      ? linePath +
        ` L${points[points.length - 1]!.x.toFixed(1)},${padding.top + chartH}` +
        ` L${points[0]!.x.toFixed(1)},${padding.top + chartH} Z`
      : '';

  return (
    <g>
      {filled && areaPath && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={color}
            stroke="#1e293b"
            strokeWidth={1.5}
          />
        ))}
    </g>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 图例组件
// ═══════════════════════════════════════════════════════════════════════════

type NumericKey = 'total' | 'critical' | 'high' | 'medium' | 'low' | 'resolved';

const LEGEND_ITEMS: { key: NumericKey; label: string; color: string }[] = [
  { key: 'total', label: '总异常', color: SEVERITY_COLORS.total! },
  { key: 'critical', label: '严重', color: SEVERITY_COLORS.critical! },
  { key: 'high', label: '高危', color: SEVERITY_COLORS.high! },
  { key: 'medium', label: '中危', color: SEVERITY_COLORS.medium! },
  { key: 'resolved', label: '已解决', color: SEVERITY_COLORS.resolved! },
];

// ═══════════════════════════════════════════════════════════════════════════
// 摘要统计卡片
// ═══════════════════════════════════════════════════════════════════════════

interface StatItem {
  label: string;
  value: number | string;
  color: string;
  delta?: string;
  subtitle?: string;
}

interface StatSummaryProps {
  data: AlertTrendDataPoint[];
}

const StatSummary: React.FC<StatSummaryProps> = ({ data }) => {
  const last = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;

  const stats = useMemo(() => {
    if (!last) return [];

    const totalAvg = Math.round(data.reduce((s, d) => s + d.total, 0) / data.length);
    const criticalTotal = data.reduce((s, d) => s + d.critical, 0);
    const resolvedTotal = data.reduce((s, d) => s + d.resolved, 0);
    const resolutionRate = totalAvg > 0 ? Math.round((resolvedTotal / (data.length * totalAvg)) * 100) : 0;

    const totalDelta = prev && prev.total > 0
      ? ((last.total - prev.total) / prev.total * 100).toFixed(1)
      : null;

    const items: StatItem[] = [
      { label: '最新异常', value: last.total, delta: totalDelta ? `${totalDelta.startsWith('-') ? '' : '+'}${totalDelta}%` : '-', color: SEVERITY_COLORS.total! },
      { label: '严重数', value: last.critical, color: SEVERITY_COLORS.critical! },
      { label: '累计严重', value: criticalTotal, color: SEVERITY_COLORS.critical!, subtitle: `共 ${data.length} 周期` },
      { label: '解决率', value: `${resolutionRate}%`, color: SEVERITY_COLORS.resolved! },
    ];
    return items;
  }, [data, last, prev]);

  if (!last) {
    return <div style={{ padding: 16, color: '#94a3b8', textAlign: 'center' }}>暂无趋势数据</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '8px 0' }}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            background: 'rgba(15, 23, 42, 0.4)',
            borderRadius: 8,
            padding: '8px 12px',
            border: '1px solid rgba(148, 163, 184, 0.1)',
          }}
        >
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{stat.label}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, lineHeight: 1.2 }}>
            {stat.value}
            {'delta' in stat && stat.delta && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  marginLeft: 6,
                  color: stat.delta.startsWith('+') ? '#ef4444' : stat.delta === '-' ? '#94a3b8' : '#22c55e',
                }}
              >
                {stat.delta}
              </span>
            )}
          </div>
          {'subtitle' in stat && stat.subtitle && (
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{stat.subtitle}</div>
          )}
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 粒度选择器
// ═══════════════════════════════════════════════════════════════════════════

interface GranularitySelectorProps {
  value: TrendGranularity;
  onChange: (g: TrendGranularity) => void;
}

const GranularitySelector: React.FC<GranularitySelectorProps> = ({ value, onChange }) => {
  const options: { value: TrendGranularity; label: string }[] = [
    { value: 'day', label: '日视图' },
    { value: 'week', label: '周视图' },
    { value: 'month', label: '月视图' },
  ];

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '3px 10px',
            fontSize: 11,
            borderRadius: 4,
            border: '1px solid',
            borderColor: value === opt.value ? '#8b5cf6' : 'rgba(148, 163, 184, 0.2)',
            background: value === opt.value ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
            color: value === opt.value ? '#a78bfa' : '#94a3b8',
            cursor: 'pointer',
            fontWeight: value === opt.value ? 600 : 400,
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// X 轴标签
// ═══════════════════════════════════════════════════════════════════════════

const XAxisLabels: React.FC<{ data: AlertTrendDataPoint[]; width: number; height: number }> = ({
  data,
  width,
  height,
}) => {
  const padding = { top: 8, right: 8, bottom: 8, left: 8 };
  const chartW = width - padding.left - padding.right;

  // 最多显示 12 个标签
  const step = Math.max(1, Math.floor(data.length / 12));
  const visible = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  return (
    <g>
      {visible.map((d, idx) => {
        const i = data.indexOf(d);
        const x = padding.left + (i / Math.max(data.length - 1, 1)) * chartW;
        return (
          <text
            key={idx}
            x={x}
            y={height - 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize={10}
          >
            {d.date.slice(5, 10)}
          </text>
        );
      })}
    </g>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════════════════════════════════════

export const AnomalyAlertTrendPanel: React.FC<AnomalyAlertTrendPanelProps> = ({
  data,
  granularity: initialGranularity = 'day',
  title = '异常告警趋势',
  className,
  height: propHeight,
  width: propWidth,
}) => {
  const [granularity, setGranularity] = useState<TrendGranularity>(initialGranularity);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    () => new Set(['total', 'critical', 'resolved'])
  );

  const chartHeight = propHeight ?? 280;
  const chartWidth = propWidth ?? 700;
  const chartAreaHeight = chartHeight - 80;

  // 按粒度聚合数据
  const aggregatedData = useMemo(() => {
    // 简化版：对少于 90 天的数据直接使用原始数据
    // 正式版可做周/月聚合
    if (granularity === 'week' && data.length > 30) {
      const weeks: AlertTrendDataPoint[] = [];
      for (let i = 0; i < data.length; i += 7) {
        const chunk = data.slice(i, i + 7);
        if (chunk.length === 0) continue;
        weeks.push({
          date: chunk[0]!.date,
          total: chunk.reduce((s, d) => s + d.total, 0),
          critical: chunk.reduce((s, d) => s + d.critical, 0),
          high: chunk.reduce((s, d) => s + d.high, 0),
          medium: chunk.reduce((s, d) => s + d.medium, 0),
          low: chunk.reduce((s, d) => s + d.low, 0),
          resolved: chunk.reduce((s, d) => s + d.resolved, 0),
        });
      }
      return weeks;
    }
    if (granularity === 'month' && data.length > 90) {
      const months: AlertTrendDataPoint[] = [];
      const monthMap = new Map<string, AlertTrendDataPoint[]>();
      for (const d of data) {
        const key = d.date.slice(0, 7);
        if (!monthMap.has(key)) monthMap.set(key, []);
        monthMap.get(key)!.push(d); // safe: we just set it above
      }
      for (const [key, items] of monthMap) {
        months.push({
          date: key,
          total: items.reduce((s, d) => s + d.total, 0),
          critical: items.reduce((s, d) => s + d.critical, 0),
          high: items.reduce((s, d) => s + d.high, 0),
          medium: items.reduce((s, d) => s + d.medium, 0),
          low: items.reduce((s, d) => s + d.low, 0),
          resolved: items.reduce((s, d) => s + d.resolved, 0),
        });
      }
      return months;
    }
    return data;
  }, [data, granularity]);

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div
      className={className}
      data-testid="anomaly-alert-trend-panel"
      style={{
        background: 'rgba(15, 23, 42, 0.5)',
        borderRadius: 12,
        border: '1px solid rgba(148, 163, 184, 0.12)',
        padding: 16,
      }}
    >
      {/* 头部 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>{title}</div>
        <GranularitySelector value={granularity} onChange={setGranularity} />
      </div>

      {/* 摘要统计 */}
      <StatSummary data={aggregatedData} />

      {/* 图表 */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.3)',
          borderRadius: 8,
          marginTop: 8,
          padding: 4,
        }}
      >
        <svg
          width={chartWidth}
          height={chartAreaHeight}
          style={{ display: 'block' }}
          role="img"
          aria-label={`${title} - 趋势图表`}
        >
          <XAxisLabels data={aggregatedData} width={chartWidth} height={chartAreaHeight} />
          {LEGEND_ITEMS.filter((item) => visibleSeries.has(item.key)).map((item) => (
            <TrendLine
              key={item.key}
              data={aggregatedData}
              dataKey={item.key}
              color={item.color}
              width={chartWidth}
              height={chartAreaHeight - 18}
              filled={item.key === 'resolved'}
              showDots={aggregatedData.length <= 60}
            />
          ))}
        </svg>
      </div>

      {/* 图例 */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10 }}>
        {LEGEND_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => toggleSeries(item.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: 4,
              opacity: visibleSeries.has(item.key) ? 1 : 0.35,
              transition: 'opacity 0.15s',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: item.color,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, color: '#cbd5e1' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnomalyAlertTrendPanel;
