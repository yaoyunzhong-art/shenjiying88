'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 雷达图单个维度数据点 */
export interface RadarDimension {
  /** 维度标签 */
  label: string;
  /** 当前值 (0-100) */
  value: number;
  /** 基准值（可选，用于对比） */
  baseline?: number;
}

/** 雷达图数据集 */
export interface RadarSeries {
  /** 系列名称 */
  name: string;
  /** 颜色 */
  color: string;
  /** 数据点（须与 dimensions 数量一致） */
  data: number[];
}

/** 雷达图组件 Props */
export interface RadarChartProps {
  /** 维度列表（定义标签与基线） */
  dimensions: RadarDimension[];
  /** 数据系列（支持多系列对比） */
  series: RadarSeries[];
  /** 图表宽度 */
  width?: number;
  /** 图表高度 */
  height?: number;
  /** 标题 */
  title?: string;
  /** 网格层级数（默认 5 层） */
  gridLevels?: number;
  /** 是否显示数值标签 */
  showValues?: boolean;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 是否填充区域 */
  fillArea?: boolean;
  /** 填充透明度（默认 0.15） */
  fillOpacity?: number;
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** SVG 自定义样式 */
  style?: React.CSSProperties;
}

// ==================== 默认配色 ====================

const DEFAULT_PALETTE = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

// ==================== 坐标工具函数 ====================

/** 极坐标 → 笛卡尔坐标 */
function polarToXY(
  cx: number,
  cy: number,
  radius: number,
  angleRad: number,
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

/** 为 N 边形生成顶点 */
function polygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  offsetAngleRad = -Math.PI / 2,
): { x: number; y: number }[] {
  return Array.from({ length: sides }, (_, i) => {
    const angle = offsetAngleRad + (2 * Math.PI * i) / sides;
    return polarToXY(cx, cy, radius, angle);
  });
}

/** 多边形顶点 → SVG points 字符串 */
function pointsToString(pts: { x: number; y: number }[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

// ==================== 组件 ====================

export function RadarChart({
  dimensions,
  series,
  width = 320,
  height = 320,
  title,
  gridLevels = 5,
  showValues = false,
  showLegend = true,
  fillArea = true,
  fillOpacity = 0.15,
  className = '',
  emptyText = '暂无数据',
  style,
}: RadarChartProps) {
  const sideCount = dimensions.length;

  // 防呆
  const hasData =
    dimensions.length > 2 &&
    series.length > 0 &&
    series.every((s) => s.data.length === sideCount);

  // 布局计算
  const padding = 50;
  const legendHeight = showLegend && series.length > 1 ? 32 : 0;
  const titleHeight = title ? 24 : 0;
  const cx = width / 2;
  const cy = (height - legendHeight - titleHeight) / 2 + titleHeight;
  const maxRadius = Math.min(cx - padding, cy - padding, 120);
  const labelRadius = maxRadius + 22;

  // 层级刻度值
  const gridValues = useMemo(() => {
    if (!hasData) return [];
    return Array.from({ length: gridLevels }, (_, i) =>
      Math.round(((i + 1) / gridLevels) * 100),
    );
  }, [gridLevels, hasData]);

  if (!hasData) {
    return (
      <div
        data-testid="radar-chart"
        className={className}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: 14,
          ...style,
        }}
      >
        {emptyText}
      </div>
    );
  }

  /** 根据值 (0-100) 计算半径坐标 */
  function valueToPoint(value: number): { x: number; y: number } {
    return polarToXY(cx, cy, (value / 100) * maxRadius, -Math.PI / 2);
  }

  /** 根据值生成系列的多边形顶点 */
  function seriesPoints(values: number[]): string {
    const pts = values.map((v, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / sideCount;
      const r = (v / 100) * maxRadius;
      return polarToXY(cx, cy, r, angle);
    });
    return pointsToString(pts);
  }

  // 维度标签坐标
  const dimensionLabels = useMemo(() => {
    return polygonPoints(cx, cy, labelRadius, sideCount);
  }, [cx, cy, labelRadius, sideCount]);

  // 网格层多边形
  const gridPolygons = useMemo(() => {
    return gridValues.map((v) => {
      const r = (v / 100) * maxRadius;
      return polygonPoints(cx, cy, r, sideCount);
    });
  }, [gridValues, cx, cy, maxRadius, sideCount]);

  // 轴线
  const axisLines = useMemo(() => {
    return polygonPoints(cx, cy, maxRadius, sideCount);
  }, [cx, cy, maxRadius, sideCount]);

  return (
    <div
      data-testid="radar-chart"
      className={className}
      style={{ width, height, ...style }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {title && (
          <text
            x={cx}
            y={18}
            textAnchor="middle"
            fontSize={14}
            fontWeight={600}
            fill="#e2e8f0"
          >
            {title}
          </text>
        )}

        {/* ===== 背景网格 ===== */}
        {gridPolygons.map((pts, i) => (
          <polygon
            key={`grid-${i}`}
            points={pointsToString(pts)}
            fill="none"
            stroke="#334155"
            strokeWidth={1}
            opacity={0.4}
          />
        ))}

        {/* ===== 轴线 ===== */}
        {axisLines.map((pt, i) => (
          <line
            key={`axis-${i}`}
            x1={cx}
            y1={cy}
            x2={pt.x}
            y2={pt.y}
            stroke="#475569"
            strokeWidth={1}
            opacity={0.35}
          />
        ))}

        {/* ===== 维度标签 ===== */}
        {dimensions.map((dim, i) => (
          <text
            key={`label-${i}`}
            x={dimensionLabels[i]!.x}
            y={dimensionLabels[i]!.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={11}
            fill="#94a3b8"
            fontWeight={500}
          >
            {dim.label}
          </text>
        ))}

        {/* ===== 数据系列 ===== */}
        {series.map((serie, si) => {
          const pts = seriesPoints(serie.data);
          const color = serie.color || DEFAULT_PALETTE[si % DEFAULT_PALETTE.length];

          return (
            <g key={`series-${si}`}>
              {/* 填充区域 */}
              {fillArea && (
                <polygon
                  points={pts}
                  fill={color}
                  fillOpacity={fillOpacity}
                >
                  <animate
                    attributeName="opacity"
                    from="0"
                    to={fillOpacity}
                    dur="0.5s"
                    fill="freeze"
                  />
                </polygon>
              )}

              {/* 连线 */}
              <polygon
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth={2}
                opacity={0.9}
              >
                <animate
                  attributeName="opacity"
                  from="0"
                  to="0.9"
                  dur="0.4s"
                  fill="freeze"
                />
              </polygon>

              {/* 数据点圆点 */}
              {serie.data.map((v, di) => {
                const angle = -Math.PI / 2 + (2 * Math.PI * di) / sideCount;
                const r = (v / 100) * maxRadius;
                const pt = polarToXY(cx, cy, r, angle);

                return (
                  <g key={`dot-${si}-${di}`}>
                    <circle cx={pt.x} cy={pt.y} r={4} fill={color} stroke="#1e293b" strokeWidth={1.5}>
                      <animate
                        attributeName="r"
                        from="0"
                        to="4"
                        dur="0.3s"
                        fill="freeze"
                      />
                    </circle>
                    {showValues && (
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        fontSize={10}
                        fill={color}
                        fontWeight={600}
                      >
                        {v}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* ===== 中心点 ===== */}
        <circle cx={cx} cy={cy} r={2} fill="#475569" />
      </svg>

      {/* ===== 图例 ===== */}
      {showLegend && series.length > 1 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            marginTop: 4,
          }}
        >
          {series.map((serie, i) => {
            const color = serie.color || DEFAULT_PALETTE[i % DEFAULT_PALETTE.length];
            return (
              <div
                key={`legend-${i}`}
                data-testid={`radar-legend-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#94a3b8',
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: color,
                    display: 'inline-block',
                  }}
                />
                {serie.name}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== 基线图例 (维度最小值) ===== */}
      {dimensions.some((d) => d.baseline != null) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginTop: 2,
            fontSize: 11,
            color: '#64748b',
          }}
          data-testid="radar-baseline-legend"
        >
          {dimensions
            .filter((d) => d.baseline != null)
            .slice(0, 3)
            .map((d, i) => (
              <span key={`bl-${i}`}>
                {d.label}: {d.baseline}
              </span>
            ))}
          {dimensions.filter((d) => d.baseline != null).length > 3 && (
            <span>...</span>
          )}
        </div>
      )}
    </div>
  );
}

export default RadarChart;
