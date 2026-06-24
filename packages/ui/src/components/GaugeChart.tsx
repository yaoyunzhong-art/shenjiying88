'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 仪表盘颜色段定义 */
export interface GaugeSegment {
  /** 段起始值 (0-100) */
  from: number;
  /** 段结束值 (0-100) */
  to: number;
  /** 段颜色 */
  color: string;
  /** 段标签 */
  label?: string;
}

/** 默认三段：绿 / 黄 / 红 */
const DEFAULT_SEGMENTS: GaugeSegment[] = [
  { from: 0, to: 60, color: '#4ade80', label: '正常' },
  { from: 60, to: 85, color: '#fbbf24', label: '注意' },
  { from: 85, to: 100, color: '#f87171', label: '告警' },
];

export interface GaugeChartProps {
  /** 当前值 (0-100) */
  value: number;
  /** 最小值，默认 0 */
  min?: number;
  /** 最大值，默认 100 */
  max?: number;
  /** 仪表盘标签 */
  label?: string;
  /** 底部显示的值后缀，如 % */
  suffix?: string;
  /** 颜色段定义 */
  segments?: GaugeSegment[];
  /** 仪表盘直径 (px)，默认 160 */
  size?: number;
  /** (兼容别名) 宽度，映射到 size */
  width?: number;
  /** (兼容别名) 高度，不影响渲染 */
  height?: number;
  /** 弧线宽度 (px)，默认 18 */
  arcWidth?: number;
  /** 是否显示刻度标签 */
  showTicks?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

// ==================== 工具函数 ====================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M',
    start.x,
    start.y,
    'A',
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(' ');
}

// ==================== 组件 ====================

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  label,
  suffix = '%',
  segments = DEFAULT_SEGMENTS,
  size: _size = 160, width: _width, height: _height,
  arcWidth = 18,
  showTicks = true,
  className,
  style,
}: GaugeChartProps) {
  // 优先使用 width 兼容别名，再回退到 size
  const size = _width ?? _size;

  const normalizedValue = useMemo(() => {
    const percentage = ((clamp(value, min, max) - min) / (max - min)) * 100;
    return clamp(percentage, 0, 100);
  }, [value, min, max]);

  // 仪表盘角度范围：从 135° 到 405°（即从 -135° 转到 +135°，可视化 270°）
  const startAngle = 135;
  const endAngle = 405;
  const arcSpan = endAngle - startAngle; // 270°

  const cx = size / 2;
  const cy = size * 0.62; // 视觉重心偏下
  const radius = size / 2 - arcWidth;

  // 当前值对应的角度
  const valueAngle = startAngle + (normalizedValue / 100) * arcSpan;

  // 当前值所在段颜色
  const activeColor = useMemo(() => {
    const seg =
      segments.find((s) => normalizedValue >= s.from && normalizedValue <= s.to) ??
      segments[segments.length - 1];
    return seg?.color ?? '#94a3b8';
  }, [normalizedValue, segments]);

  // 针尖坐标
  const needleTip = polarToCartesian(cx, cy, radius - arcWidth / 2, valueAngle);

  // 刻度标签
  const ticks = useMemo(() => {
    if (!showTicks) return [];
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) => {
      const val = Math.round((i / count) * 100);
      const angle = startAngle + (i / count) * arcSpan;
      const pos = polarToCartesian(cx, cy, radius + arcWidth + 12, angle);
      return { val, x: pos.x, y: pos.y };
    });
  }, [showTicks, cx, cy, radius, arcWidth, startAngle, arcSpan]);

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
      role="meter"
      aria-valuenow={Math.round(normalizedValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? '仪表盘'}
    >
      <svg
        width={size}
        height={size * 0.82}
        viewBox={`0 0 ${size} ${size * 0.82}`}
        style={{ overflow: 'visible' }}
      >
        {/* 背景弧段 */}
        {segments.map((seg, i) => {
          const segStart = startAngle + (seg.from / 100) * arcSpan;
          const segEnd = startAngle + (seg.to / 100) * arcSpan;
          return (
            <path
              key={`seg-${i}`}
              d={describeArc(cx, cy, radius, segStart, segEnd)}
              fill="none"
              stroke={seg.color}
              strokeWidth={arcWidth}
              strokeLinecap="round"
              opacity={0.35}
            />
          );
        })}

        {/* 当前值弧段 */}
        <path
          d={describeArc(cx, cy, radius, startAngle, valueAngle)}
          fill="none"
          stroke={activeColor}
          strokeWidth={arcWidth}
          strokeLinecap="round"
          opacity={1}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />

        {/* 刻度标签 */}
        {ticks.map((t) => (
          <text
            key={`tick-${t.val}`}
            x={t.x}
            y={t.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={11}
            fill="#94a3b8"
            fontFamily="ui-monospace, monospace"
          >
            {t.val}
          </text>
        ))}

        {/* 指针 */}
        <line
          x1={cx}
          y1={cy}
          x2={needleTip.x}
          y2={needleTip.y}
          stroke={activeColor}
          strokeWidth={3}
          strokeLinecap="round"
          style={{ transition: 'x2 0.5s ease, y2 0.5s ease' }}
        />

        {/* 中心圆 */}
        <circle cx={cx} cy={cy} r={arcWidth * 0.55} fill={activeColor} />
        <circle cx={cx} cy={cy} r={arcWidth * 0.3} fill="#0f172a" />
      </svg>

      {/* 数值显示 */}
      <div
        style={{
          textAlign: 'center',
          marginTop: -size * 0.08,
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: activeColor,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        >
          {Math.round(normalizedValue)}
          <span style={{ fontSize: 16, fontWeight: 600 }}>{suffix}</span>
        </div>
        {label && (
          <div
            style={{
              fontSize: 13,
              color: '#94a3b8',
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {label}
          </div>
        )}
      </div>

      {/* 颜色段图例 */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map((seg, i) => (
          <div
            key={`legend-${i}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8' }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: seg.color,
                display: 'inline-block',
              }}
            />
            {seg.label ?? `${seg.from}-${seg.to}`}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GaugeChart;
