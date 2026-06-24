import React, { useMemo } from 'react';

export interface TrendDataPoint {
  label: string;
  value: number;
  /** Optional baseline / target */
  target?: number;
  /** Highlight color override */
  color?: string;
}

export interface SmartTrendChartProps {
  /** Time-series data points */
  data: TrendDataPoint[];
  /** Chart title */
  title?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Bar color (default theme) */
  barColor?: string;
  /** Target line color */
  targetColor?: string;
  /** Height in px */
  height?: number;
  /** Show data values on bars */
  showValues?: boolean;
  /** Show target line overlay */
  showTarget?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Empty state text */
  emptyText?: string;
  /** Optional className */
  className?: string;
  /** Test id */
  'data-testid'?: string;
}

/**
 * SmartTrendChart — a simple bar/trend visualization for AI decision
 * dashboards, showing KPI values over time with optional target overlay.
 */
export function SmartTrendChart({
  data,
  title,
  yAxisLabel,
  barColor = '#3b82f6',
  targetColor = '#ef4444',
  height = 240,
  showValues = true,
  showTarget = false,
  loading = false,
  emptyText = '暂无趋势数据',
  className = '',
  'data-testid': dataTestId = 'smart-trend-chart',
}: SmartTrendChartProps) {
  const maxValue = useMemo(
    () => Math.max(...data.map((d) => Math.max(d.value, d.target ?? 0)), 1),
    [data],
  );

  if (loading) {
    return (
      <div
        className="smart-trend-chart smart-trend-chart--loading"
        data-testid={`${dataTestId}-loading`}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          className="smart-trend-chart__skeleton"
          style={{ width: '80%', height: 16, background: '#e5e7eb', borderRadius: 4 }}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="smart-trend-chart smart-trend-chart--empty"
        data-testid={`${dataTestId}-empty`}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        {emptyText}
      </div>
    );
  }

  const chartPadding = 20;
  const chartBottom = 32;
  const chartTop = 10;
  const chartHeight = height - chartPadding - chartBottom;
  const barWidth = Math.max(20, Math.min(60, (100 / data.length) * 0.6));

  // Pre-compute all SVG elements for SSR compatibility (no null children)
  const svgChildren: React.ReactNode[] = [];

  // Target line segments
  if (showTarget) {
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      if (!prev || !curr) continue;
      if (prev.target == null || curr.target == null) continue;
      const x1 = chartPadding + ((i - 1) / Math.max(data.length - 1, 1)) * (100 - chartPadding * 2);
      const y1 = chartTop + (1 - (prev.target ?? 0) / maxValue) * (chartHeight - chartTop);
      const x2 = chartPadding + (i / Math.max(data.length - 1, 1)) * (100 - chartPadding * 2);
      const y2 = chartTop + (1 - (curr.target ?? 0) / maxValue) * (chartHeight - chartTop);
      svgChildren.push(
        <line
          key={`target-line-${i}`}
          x1={`${x1}%`}
          y1={y1}
          x2={`${x2}%`}
          y2={y2}
          stroke={targetColor}
          strokeWidth={1.5}
          strokeDasharray="4 2"
          data-testid={`${dataTestId}-target-line-${i}`}
        />,
      );
    }

    // Target circles (only those with target values)
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      if (!point) continue;
      if (point.target == null) continue;
      const x = chartPadding + (i / Math.max(data.length - 1, 1)) * (100 - chartPadding * 2);
      const y = chartTop + (1 - point.target / maxValue) * (chartHeight - chartTop);
      svgChildren.push(
        <circle
          key={`target-${i}`}
          cx={`${x}%`}
          cy={y}
          r={3}
          fill={targetColor}
          data-testid={`${dataTestId}-target-${i}`}
        />,
      );
    }
  }

  // Bars
  for (let i = 0; i < data.length; i++) {
    const point = data[i];
    if (!point) continue;
    const barH = (point.value / maxValue) * (chartHeight - chartTop);
    const xPercent = chartPadding + (i / Math.max(data.length - 1, 1)) * (100 - chartPadding * 2);
    const barElements: React.ReactNode[] = [
      <rect
        key={`rect-${i}`}
        x={`calc(${xPercent}% - ${barWidth / 2}px)`}
        y={chartHeight - barH}
        width={barWidth}
        height={barH}
        rx={4}
        fill={point.color ?? barColor}
        data-testid={`${dataTestId}-bar-${i}`}
      />,
    ];
    if (showValues) {
      barElements.push(
        <text
          key={`val-${i}`}
          x={`${xPercent}%`}
          y={chartHeight - barH - 4}
          textAnchor="middle"
          fontSize={11}
          fill="#6b7280"
          data-testid={`${dataTestId}-value-${i}`}
        >
          {point.value}
        </text>,
      );
    }
    barElements.push(
      <text
        key={`label-${i}`}
        x={`${xPercent}%`}
        y={height - 6}
        textAnchor="middle"
        fontSize={10}
        fill="#9ca3af"
        data-testid={`${dataTestId}-label-${i}`}
      >
        {point.label}
      </text>,
    );
    svgChildren.push(<g key={`bar-${i}`}>{barElements}</g>);
  }

  return (
    <div
      className={`smart-trend-chart ${className}`}
      data-testid={dataTestId}
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {title && (
        <div
          className="smart-trend-chart__header"
          data-testid={`${dataTestId}-title`}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#374151',
            marginBottom: 8,
            padding: '0 4px',
          }}
        >
          {title}
        </div>
      )}

      <div
        className="smart-trend-chart__canvas"
        style={{ position: 'relative', height, width: '100%' }}
      >
        {yAxisLabel && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: chartTop,
              fontSize: 10,
              color: '#9ca3af',
              transform: 'rotate(-90deg) translateX(-50%)',
              transformOrigin: 'left center',
              whiteSpace: 'nowrap',
            }}
          >
            {yAxisLabel}
          </div>
        )}

        <svg
          width="100%"
          height={height}
          data-testid={`${dataTestId}-svg`}
          style={{ display: 'block', overflow: 'visible' }}
        >
          {svgChildren}
        </svg>
      </div>
    </div>
  );
}

export default SmartTrendChart;
