'use client';

import React from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export interface SparklineDataPoint {
  value: number;
  label?: string;
}

export interface SparklineChartProps {
  /** Data points for the sparkline */
  data: SparklineDataPoint[];
  /** Width of the SVG */
  width?: number;
  /** Height of the SVG */
  height?: number;
  /** Line color */
  color?: string;
  /** Fill color (area under curve); set to '' for no fill */
  fillColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Show dots at data points */
  showDots?: boolean;
  /** Dot radius */
  dotRadius?: number;
  /** Smooth curve (cubic bezier) instead of straight lines */
  smooth?: boolean;
  /** Minimum value (computed from data if omitted) */
  min?: number;
  /** Maximum value (computed from data if omitted) */
  max?: number;
  /** Custom class name */
  className?: string;
  /** Accessibility label */
  'aria-label'?: string;
  /** Highlight the last point with a different color */
  highlightLast?: boolean;
  /** Color for the highlighted last point */
  highlightColor?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildPath(
  points: { x: number; y: number }[],
  smooth: boolean,
): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]?.x},${points[0]?.y}`;

  if (!smooth) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  }

  // Catmull-Rom to cubic bezier for smooth curves
  let d = `M ${points[0]?.x},${points[0]?.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(i + 2, points.length - 1)]!;

    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

// ── Component ───────────────────────────────────────────────────────────────

export function SparklineChart({
  data,
  width = 160,
  height = 48,
  color = '#3b82f6',
  fillColor = 'rgba(59,130,246,0.12)',
  strokeWidth = 2,
  showDots = false,
  dotRadius = 2.5,
  smooth = false,
  min: forcedMin,
  max: forcedMax,
  className,
  'aria-label': ariaLabel,
  highlightLast = false,
  highlightColor = '#f59e0b',
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        aria-label={ariaLabel ?? 'Empty sparkline chart'}
        role="img"
      />
    );
  }

  const values = data.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = (forcedMax ?? dataMax) - (forcedMin ?? dataMin) || 1;

  const padding = { top: 4, bottom: 4, left: 2, right: 2 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const mappedPoints = data.map((point, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y:
      padding.top +
      chartHeight -
      ((point.value - (forcedMin ?? dataMin)) / range) * chartHeight,
    value: point.value,
    label: point.label,
  }));

  const linePath = buildPath(mappedPoints, smooth);

  // Area fill path
  const fillPath =
    fillColor
      ? `${linePath} L ${mappedPoints[mappedPoints.length - 1]?.x ?? 0},${padding.top + chartHeight} L ${mappedPoints[0]?.x ?? 0},${padding.top + chartHeight} Z`
      : '';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-label={ariaLabel ?? `Sparkline chart with ${data.length} data points`}
      role="img"
    >
      {fillPath && (
        <path d={fillPath} fill={fillColor} />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        mappedPoints.map((p, i) => {
          const isLast = highlightLast && i === mappedPoints.length - 1;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isLast ? dotRadius + 1 : dotRadius}
              fill={isLast ? highlightColor : color}
            />
          );
        })}
    </svg>
  );
}
