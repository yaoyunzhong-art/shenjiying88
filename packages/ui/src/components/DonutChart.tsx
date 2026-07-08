import React, { useMemo } from 'react';

export interface DonutSlice {
  /** 切片标识 */
  key: string;
  /** 名称 */
  label: string;
  /** 数值 */
  value: number;
  /** 颜色 (CSS color) */
  color: string;
}

export interface DonutChartProps {
  /** 数据 */
  data: DonutSlice[];
  /** 环图尺寸 (直径 px) */
  size?: number;
  /** 环的厚度 (px) */
  thickness?: number;
  /** 是否显示中心汇总文本 */
  showCenterLabel?: boolean;
  /** 中心标签自定义格式 */
  centerFormatter?: (total: number) => string;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 最小百分比 (小于此值合并为 "其他") */
  minPercent?: number;
  /** 自定义类名 */
  className?: string;
  /** 动画持续时间 (ms) */
  animationDuration?: number;
  /** 点击切片回调 */
  onSliceClick?: (slice: DonutSlice) => void;
}

const DEFAULT_COLORS = [
  '#60a5fa', '#4ade80', '#a78bfa', '#facc15', '#fb923c',
  '#f87171', '#2dd4bf', '#38bdf8', '#e879f9', '#fbbf24',
];

function normalizeData(
  data: DonutSlice[],
  minPercent: number,
): { slices: DonutSlice[]; others: DonutSlice | null; total: number } {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
  if (total <= 0) return { slices: data, others: null, total };

  const threshold = (minPercent / 100) * total;
  const main: DonutSlice[] = [];
  const otherItems: DonutSlice[] = [];

  for (const d of data) {
    if (d.value >= threshold) {
      main.push(d);
    } else {
      otherItems.push(d);
    }
  }

  let others: DonutSlice | null = null;
  if (otherItems.length > 0) {
    const otherTotal = otherItems.reduce((s, d) => s + d.value, 0);
    others = {
      key: '__others__',
      label: '其他',
      value: otherTotal,
      color: '#64748b',
    };
    main.push(others);
  }

  return { slices: main, others, total };
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 200,
  thickness = 32,
  showCenterLabel = true,
  centerFormatter,
  showLegend = true,
  minPercent = 3,
  className,
  animationDuration = 600,
  onSliceClick,
}) => {
  const { slices, total } = useMemo(
    () => normalizeData(data, minPercent),
    [data, minPercent],
  );

  const radius = size / 2;
  const innerRadius = radius - thickness;
  const centerRadius = (radius + innerRadius) / 2;

  // 计算 arc 路径
  const arcs = useMemo(() => {
    if (total <= 0 || slices.length === 0) return [];

    const circumference = 2 * Math.PI * centerRadius;
    let cumulativePercent = 0;

    return slices.map((slice) => {
      const percent = slice.value / total;
      const startPercent = cumulativePercent;
      cumulativePercent += percent;
      const endPercent = cumulativePercent;

      const startAngle = startPercent * 360 - 90;
      const endAngle = endPercent * 360 - 90;
      const largeArc = percent > 0.5 ? 1 : 0;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = radius + innerRadius * Math.cos(startRad);
      const y1 = radius + innerRadius * Math.sin(startRad);
      const x2 = radius + radius * Math.cos(startRad);
      const y2 = radius + radius * Math.sin(startRad);
      const x3 = radius + radius * Math.cos(endRad);
      const y3 = radius + radius * Math.sin(endRad);
      const x4 = radius + innerRadius * Math.cos(endRad);
      const y4 = radius + innerRadius * Math.sin(endRad);

      // 使用 SVG path 画环形切片
      const path = [
        `M ${x2} ${y2}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x3} ${y3}`,
        `L ${x4} ${y4}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`,
        'Z',
      ].join(' ');

      return {
        key: slice.key,
        path,
        color: slice.color,
        percent: percent * 100,
        slice,
        strokeDasharray: `${percent * circumference}`,
        strokeDashoffset: 0,
      };
    });
  }, [slices, total, radius, innerRadius, centerRadius]);

  if (total <= 0 || slices.length === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: 13,
        }}
      >
        暂无数据
      </div>
    );
  }

  // 用 stroke-dasharray 方式实现 (更常见，动画更容易)
  const strokeWidth = thickness;
  const svgRadius = centerRadius;
  const circumference = 2 * Math.PI * svgRadius;

  let cumulative = 0;
  const circleArcs = slices.map((slice) => {
    const percent = slice.value / total;
    const offset = cumulative * circumference;
    cumulative += percent;
    return {
      key: slice.key,
      slice,
      color: slice.color,
      percent: percent * 100,
      dashArray: `${percent * circumference} ${circumference}`,
      dashOffset: -offset,
    };
  });

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: showLegend ? 'column' : 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* 背景圆环 */}
          <circle
            cx={radius}
            cy={radius}
            r={svgRadius}
            fill="none"
            stroke="rgba(148,163,184,0.12)"
            strokeWidth={strokeWidth}
          />
          {/* 数据圆环 */}
          {circleArcs.map((arc, i) => (
            <circle
              key={arc.key}
              cx={radius}
              cy={radius}
              r={svgRadius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="round"
              style={{
                cursor: onSliceClick ? 'pointer' : undefined,
                transition: `stroke-dasharray ${animationDuration}ms ease-out`,
              }}
              onClick={() => onSliceClick?.(arc.slice)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onSliceClick?.(arc.slice);
              }}
              role={onSliceClick ? 'button' : undefined}
              tabIndex={onSliceClick ? 0 : undefined}
              aria-label={`${arc.slice.label}: ${arc.slice.value} (${arc.percent.toFixed(1)}%)`}
            />
          ))}
        </svg>

        {/* 中心文字 */}
        {showCenterLabel && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: Math.max(size * 0.12, 18),
                  fontWeight: 700,
                  color: '#e2e8f0',
                  lineHeight: 1.2,
                }}
              >
                {centerFormatter
                  ? centerFormatter(total)
                  : total.toLocaleString()}
              </div>
              <div
                style={{
                  fontSize: Math.max(size * 0.045, 10),
                  color: '#64748b',
                  marginTop: 2,
                }}
              >
                总计
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 图例 */}
      {Boolean(showLegend) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 16px',
            justifyContent: 'center',
            maxWidth: size * 2,
          }}
        >
          {slices.map((slice, i) => (
            <div
              key={slice.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: '#94a3b8',
                cursor: onSliceClick ? 'pointer' : undefined,
              }}
              onClick={() => onSliceClick?.(slice)}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: slice.color,
                  flexShrink: 0,
                }}
              />
              <span>{slice.label}</span>
              <span style={{ color: '#64748b' }}>
                {((slice.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonutChart;
