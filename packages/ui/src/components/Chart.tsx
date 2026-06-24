'use client';

import React from 'react';

// ==================== 类型定义 ====================

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export type ChartType = 'bar' | 'line' | 'donut';

export interface ChartProps {
  /** 图表类型 */
  type: ChartType;
  /** 数据点 */
  data: ChartDataPoint[];
  /** 图表宽度 */
  width?: number;
  /** 图表高度 */
  height?: number;
  /** 标题 */
  title?: string;
  /** 是否显示数值标签 */
  showValues?: boolean;
  /** 自定义颜色调色板 */
  palette?: string[];
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
}

// ==================== 默认调色板 ====================

const DEFAULT_PALETTE = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

// ==================== 工具函数 ====================

function getColor(index: number, palette: string[], point?: ChartDataPoint): string {
  if (point?.color != null) return point.color;
  return palette[index % palette.length]!;
}

// ==================== 柱状图 ====================

function BarChart({
  data,
  width,
  height,
  showValues,
  palette,
}: {
  data: ChartDataPoint[];
  width: number;
  height: number;
  showValues: boolean;
  palette: string[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, bottom: 40, left: 10, right: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barGap = chartWidth * 0.1;
  const totalGap = barGap * (data.length + 1);
  const barWidth = Math.max((chartWidth - totalGap) / data.length, 8);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((point, i) => {
        const barH = (point.value / max) * chartHeight;
        const x = padding.left + barGap + i * (barWidth + barGap);
        const y = padding.top + chartHeight - barH;
        const color = getColor(i, palette, point);

        return (
          <g key={i}>
            {/* 柱子 */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              ry={4}
              fill={color}
              opacity={0.88}
            >
              <animate
                attributeName="height"
                from="0"
                to={barH}
                dur="0.4s"
                fill="freeze"
              />
              <animate
                attributeName="y"
                from={padding.top + chartHeight}
                to={y}
                dur="0.4s"
                fill="freeze"
              />
            </rect>

            {/* 数值标签 */}
            {showValues && (
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={11}
                fill="#cbd5e1"
                fontWeight={600}
              >
                {point.value}
              </text>
            )}

            {/* X 轴标签 */}
            <text
              x={x + barWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
            >
              {point.label}
            </text>
          </g>
        );
      })}

      {/* 基线 */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        stroke="rgba(148,163,184,0.2)"
        strokeWidth={1}
      />
    </svg>
  );
}

// ==================== 折线图 ====================

function LineChart({
  data,
  width,
  height,
  showValues,
  palette,
}: {
  data: ChartDataPoint[];
  width: number;
  height: number;
  showValues: boolean;
  palette: string[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 24, bottom: 40, right: 20, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (data.length < 2) {
    // 回退到柱状图
    return (
      <BarChart
        data={data}
        width={width}
        height={height}
        showValues={showValues}
        palette={palette}
      />
    );
  }

  const stepX = chartWidth / (data.length - 1);
  const lineColor = palette[0];

  const pointsStr = data
    .map((point, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartHeight - (point.value / max) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  // 填充区域坐标
  const areaStr = `${padding.left},${padding.top + chartHeight} ${pointsStr} ${padding.left + (data.length - 1) * stepX},${padding.top + chartHeight}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* 填充区域 */}
      <polygon
        points={areaStr}
        fill={lineColor}
        opacity={0.08}
      />

      {/* 折线 */}
      <polyline
        points={pointsStr}
        fill="none"
        stroke={lineColor}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <animate
          attributeName="stroke-dasharray"
          from={`0 ${chartWidth * 2}`}
          to={`${chartWidth * 2} 0`}
          dur="0.6s"
          fill="freeze"
        />
      </polyline>

      {/* 数据点 + 数值标签 */}
      {data.map((point, i) => {
        const cx = padding.left + i * stepX;
        const cy = padding.top + chartHeight - (point.value / max) * chartHeight;

        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={4}
              fill={lineColor}
              stroke="#0f172a"
              strokeWidth={2}
            />
            {showValues && (
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                fontSize={11}
                fill="#cbd5e1"
                fontWeight={600}
              >
                {point.value}
              </text>
            )}
            {/* X 轴标签 */}
            <text
              x={cx}
              y={height - 12}
              textAnchor="middle"
              fontSize={11}
              fill="#94a3b8"
            >
              {point.label}
            </text>
          </g>
        );
      })}

      {/* 基线 */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={width - padding.right}
        y2={padding.top + chartHeight}
        stroke="rgba(148,163,184,0.2)"
        strokeWidth={1}
      />
    </svg>
  );
}

// ==================== 环形图 (Donut) ====================

function DonutChart({
  data,
  width,
  height,
  showValues,
  palette,
}: {
  data: ChartDataPoint[];
  width: number;
  height: number;
  showValues: boolean;
  palette: string[];
}) {
  void showValues;
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(cx, cy) - 8;
  const innerR = outerR * 0.62;

  let cumulativeAngle = -90; // 从 12 点钟方向开始

  const describeArc = (
    startAngle: number,
    endAngle: number,
    r: number
  ): string => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((point, i) => {
        const sliceAngle = (point.value / total) * 360;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + sliceAngle;
        cumulativeAngle = endAngle;

        const color = getColor(i, palette, point);

        // 外弧 + 内弧 构建扇区路径
        const outerStart = describeArc(startAngle, endAngle, outerR);
        const innerStart = describeArc(endAngle, startAngle, innerR);

        return (
          <g key={i}>
            <path
              d={`${outerStart} L ${innerStart.split(' ').slice(-2).join(' ')} Z`}
              fill={color}
              opacity={0.88}
              stroke="rgba(15,23,42,0.8)"
              strokeWidth={1.5}
            >
              <animate
                attributeName="opacity"
                from="0.3"
                to="0.88"
                dur="0.5s"
                fill="freeze"
              />
            </path>

            {/* 中心比例文字 */}
            {i === 0 && total > 0 && (
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fontSize={22}
                fontWeight={700}
                fill="#f8fafc"
              >
                {total}
              </text>
            )}
            {i === 0 && total > 0 && (
              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                fontSize={11}
                fill="#94a3b8"
              >
                总计
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ==================== 图例 ====================

function ChartLegend({
  data,
  palette,
}: {
  data: ChartDataPoint[];
  palette: string[];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px 18px',
        justifyContent: 'center',
        marginTop: 10,
      }}
    >
      {data.map((point, i) => (
        <div
          key={i}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: getColor(i, palette, point),
              flexShrink: 0,
            }}
          />
          <span style={{ color: '#cbd5e1' }}>{point.label}</span>
          <span style={{ color: '#94a3b8', fontWeight: 500 }}>
            {point.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * Chart — 通用数据可视化组件。
 *
 * 支持三种图表类型：
 * - `bar`: 柱状图，适合对比分类数据
 * - `line`: 折线图，适合展示趋势变化
 * - `donut`: 环形图，适合展示占比分布
 *
 * 使用纯 SVG 实现，零外部依赖，支持动画。
 *
 * @example
 * // 柱状图
 * <Chart
 *   type="bar"
 *   data={[
 *     { label: 'Q1', value: 120 },
 *     { label: 'Q2', value: 200 },
 *   ]}
 *   title="季度营收"
 *   showValues
 * />
 *
 * @example
 * // 环形图
 * <Chart
 *   type="donut"
 *   data={[
 *     { label: '黄金', value: 450 },
 *     { label: '白银', value: 320 },
 *     { label: '青铜', value: 180 },
 *   ]}
 *   title="会员等级分布"
 * />
 */
export function Chart({
  type,
  data,
  width = 400,
  height = 260,
  title,
  showValues = false,
  palette = DEFAULT_PALETTE,
  className,
  emptyText = '暂无数据',
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={className}
        style={{
          width,
          borderRadius: 16,
          background: 'rgba(15, 23, 42, 0.38)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
          padding: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {title && (
          <span style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1' }}>
            {title}
          </span>
        )}
        <span style={{ fontSize: 13, color: '#64748b' }}>{emptyText}</span>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart
            data={data}
            width={width}
            height={height}
            showValues={showValues}
            palette={palette}
          />
        );
      case 'line':
        return (
          <LineChart
            data={data}
            width={width}
            height={height}
            showValues={showValues}
            palette={palette}
          />
        );
      case 'donut':
        return (
          <DonutChart
            data={data}
            width={width}
            height={height}
            showValues={showValues}
            palette={palette}
          />
        );
    }
  };

  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        background: 'rgba(15, 23, 42, 0.38)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        padding: '20px 16px 16px',
        display: 'inline-block',
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: 12,
            paddingLeft: 4,
          }}
        >
          {title}
        </div>
      )}
      {renderChart()}
      {/* 环形图不需要重复的图例（值已在图上展示） */}
      {type !== 'donut' && data.length > 1 && (
        <ChartLegend data={data} palette={palette} />
      )}
    </div>
  );
}
