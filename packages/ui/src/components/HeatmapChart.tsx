'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 热力图单元格 */
export interface HeatmapCell {
  /** 行标签（如设备ID / 会员等级） */
  rowLabel: string;
  /** 列标签（如时间段 / 指标名称） */
  colLabel: string;
  /** 数值 */
  value: number;
  /** 自定义颜色覆盖 */
  color?: string;
}

/** 热力图颜色方案 */
export type HeatmapColorScheme = 'red' | 'blue' | 'green' | 'amber' | 'purple' | 'cool';

/** 热力图组件 Props */
export interface HeatmapChartProps {
  /** 数据矩阵 */
  data: HeatmapCell[];
  /** 行标签列表 */
  rowLabels?: string[];
  /** 列标签列表 */
  colLabels?: string[];
  /** 图表宽度 */
  width?: number;
  /** 图表高度 */
  height?: number;
  /** 标题 */
  title?: string;
  /** 颜色方案 */
  colorScheme?: HeatmapColorScheme;
  /** 是否显示数值标签 */
  showValues?: boolean;
  /** 是否显示图例 */
  showLegend?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 单元格点击回调 */
  onCellClick?: (cell: HeatmapCell) => void;
}

// ==================== 颜色方案 ====================

const COLOR_SCHEMES: Record<
  HeatmapColorScheme,
  { light: string; mid: string; heavy: string; bg: string }
> = {
  red: {
    light: 'rgba(254,202,202,0.35)',
    mid: 'rgba(248,113,113,0.7)',
    heavy: 'rgba(220,38,38,0.9)',
    bg: 'rgba(239,68,68,0.08)',
  },
  blue: {
    light: 'rgba(191,219,254,0.35)',
    mid: 'rgba(96,165,250,0.7)',
    heavy: 'rgba(37,99,235,0.9)',
    bg: 'rgba(59,130,246,0.08)',
  },
  green: {
    light: 'rgba(187,247,208,0.35)',
    mid: 'rgba(74,222,128,0.7)',
    heavy: 'rgba(22,163,74,0.9)',
    bg: 'rgba(34,197,94,0.08)',
  },
  amber: {
    light: 'rgba(253,230,138,0.35)',
    mid: 'rgba(251,191,36,0.7)',
    heavy: 'rgba(217,119,6,0.9)',
    bg: 'rgba(245,158,11,0.08)',
  },
  purple: {
    light: 'rgba(221,214,254,0.35)',
    mid: 'rgba(167,139,250,0.7)',
    heavy: 'rgba(124,58,237,0.9)',
    bg: 'rgba(139,92,246,0.08)',
  },
  cool: {
    light: 'rgba(165,243,252,0.35)',
    mid: 'rgba(34,211,238,0.7)',
    heavy: 'rgba(8,145,178,0.9)',
    bg: 'rgba(6,182,212,0.08)',
  },
};

// ==================== 工具函数 ====================

/** 根据数值相对位置插值颜色 */
function getCellColor(
  value: number,
  min: number,
  max: number,
  scheme: HeatmapColorScheme
): string {
  if (max === min) return COLOR_SCHEMES[scheme].mid;
  const ratio = Math.max(0, Math.min(1, (value - min) / max));
  if (ratio <= 0.25) return COLOR_SCHEMES[scheme].light;
  if (ratio <= 0.7) return COLOR_SCHEMES[scheme].mid;
  return COLOR_SCHEMES[scheme].heavy;
}

/** 获取适合的文字颜色 */
function getTextColor(value: number, min: number, max: number): string {
  if (max === min) return '#e2e8f0';
  const ratio = (value - min) / max;
  return ratio > 0.55 ? '#fff' : '#cbd5e1';
}

// ==================== 图例 ====================

function HeatmapLegend({ scheme }: { scheme: HeatmapColorScheme }) {
  const colors = COLOR_SCHEMES[scheme];
  const steps = [
    { label: '低', color: colors.light },
    { label: '中', color: colors.mid },
    { label: '高', color: colors.heavy },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'flex-end',
        marginTop: 12,
      }}
    >
      <span style={{ fontSize: 11, color: '#64748b' }}>密度</span>
      {steps.map((step) => (
        <div
          key={step.label}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span
            style={{
              width: 16,
              height: 12,
              borderRadius: 3,
              background: step.color,
              border: '1px solid rgba(148,163,184,0.12)',
            }}
          />
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{step.label}</span>
        </div>
      ))}
    </div>
  );
}

// ==================== SVG 热力图 ====================

function HeatmapGrid({
  data,
  rowLabels,
  colLabels,
  width,
  height,
  showValues,
  colorScheme,
  onCellClick,
}: {
  data: HeatmapCell[];
  rowLabels: string[];
  colLabels: string[];
  width: number;
  height: number;
  showValues: boolean;
  colorScheme: HeatmapColorScheme;
  onCellClick?: (cell: HeatmapCell) => void;
}) {
  const padding = { top: 10, bottom: 10, left: 80, right: 16 };
  const cellPad = 2;
  const rows = rowLabels.length;
  const cols = colLabels.length;

  const gridWidth = width - padding.left - padding.right;
  const gridHeight = height - padding.top - padding.bottom;
  const cellW = Math.max(8, (gridWidth - cellPad * (cols - 1)) / cols);
  const cellH = Math.max(8, (gridHeight - cellPad * (rows - 1)) / rows);

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values, 1);

  // 构建查找表
  const lookup = new Map<string, HeatmapCell>();
  for (const cell of data) {
    lookup.set(`${cell.rowLabel}|${cell.colLabel}`, cell);
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {rowLabels.map((rowLabel, ri) =>
        colLabels.map((colLabel, ci) => {
          const cell = lookup.get(`${rowLabel}|${colLabel}`);
          const x = padding.left + ci * (cellW + cellPad);
          const y = padding.top + ri * (cellH + cellPad);
          const cellColor = cell
            ? (cell.color ?? getCellColor(cell.value, min, max, colorScheme))
            : 'rgba(148,163,184,0.06)';
          const textColor = cell
            ? getTextColor(cell.value, min, max)
            : '#475569';

          return (
            <g
              key={`${ri}-${ci}`}
              onClick={() => cell && onCellClick?.(cell)}
              style={{ cursor: cell && onCellClick ? 'pointer' : 'default' }}
            >
              <rect
                x={x}
                y={y}
                width={cellW}
                height={cellH}
                rx={4}
                ry={4}
                fill={cellColor}
                stroke="rgba(148,163,184,0.08)"
                strokeWidth={0.5}
              >
                <animate
                  attributeName="opacity"
                  from="0.3"
                  to="1"
                  dur="0.4s"
                  fill="freeze"
                />
              </rect>
              {showValues && cell && (
                <text
                  x={x + cellW / 2}
                  y={y + cellH / 2 + 4}
                  textAnchor="middle"
                  fontSize={Math.max(9, Math.min(12, cellW / 4))}
                  fontWeight={600}
                  fill={textColor}
                >
                  {cell.value}
                </text>
              )}
            </g>
          );
        })
      )}

      {/* 列标签 */}
      {colLabels.map((label, ci) => (
        <text
          key={`col-${ci}`}
          x={padding.left + ci * (cellW + cellPad) + cellW / 2}
          y={padding.top - 4}
          textAnchor="middle"
          fontSize={10}
          fill="#94a3b8"
        >
          {label}
        </text>
      ))}

      {/* 行标签 */}
      {rowLabels.map((label, ri) => (
        <text
          key={`row-${ri}`}
          x={padding.left - 8}
          y={padding.top + ri * (cellH + cellPad) + cellH / 2 + 4}
          textAnchor="end"
          fontSize={10}
          fill="#94a3b8"
        >
          {label.length > 8 ? label.slice(0, 7) + '…' : label}
        </text>
      ))}
    </svg>
  );
}

// ==================== 主组件 ====================

/**
 * HeatmapChart — 热力图数据可视化组件。
 *
 * 以矩阵色块方式展示二维数据分布密度，适用于：
 * - 设备状态热力图（设备 x 时间段）
 * - 会员等级分布（等级 x 地区/门店）
 * - 告警热度分布（告警类型 x 时间窗）
 * - 销售热力分布（商品 x 时段）
 *
 * 使用纯 SVG 实现，零外部依赖，支持动画。
 *
 * @example
 * // 设备状态热力图
 * <HeatmapChart
 *   title="设备状态热力图"
 *   data={[
 *     { rowLabel: '设备A', colLabel: '00-04', value: 85 },
 *     { rowLabel: '设备A', colLabel: '04-08', value: 72 },
 *     { rowLabel: '设备B', colLabel: '00-04', value: 45 },
 *   ]}
 *   rowLabels={['设备A', '设备B', '设备C']}
 *   colLabels={['00-04', '04-08', '08-12', '12-16', '16-20', '20-24']}
 *   colorScheme="red"
 *   showValues
 * />
 *
 * @example
 * // 会员等级分布
 * <HeatmapChart
 *   title="会员等级门店分布"
 *   data={[{ rowLabel: '黄金', colLabel: '门店A', value: 230 }]}
 *   rowLabels={['黄金', '白银', '青铜']}
 *   colLabels={['门店A', '门店B', '门店C']}
 *   colorScheme="amber"
 * />
 */
export function HeatmapChart({
  data,
  rowLabels,
  colLabels,
  width = 500,
  height = 240,
  title,
  colorScheme = 'blue',
  showValues = true,
  showLegend = true,
  className,
  emptyText = '暂无数据',
  onCellClick,
}: HeatmapChartProps) {
  // 自动提取行列标签
  const computedRowLabels =
    rowLabels ??
    [...new Set(data.map((d) => d.rowLabel))].sort();
  const computedColLabels =
    colLabels ??
    [...new Set(data.map((d) => d.colLabel))].sort();

  const isEmpty = data.length === 0;

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
          📊 {title}
        </div>
      )}

      {isEmpty ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
        >
          {emptyText}
        </div>
      ) : (
        <>
          <HeatmapGrid
            data={data}
            rowLabels={computedRowLabels}
            colLabels={computedColLabels}
            width={width}
            height={height}
            showValues={showValues}
            colorScheme={colorScheme}
            onCellClick={onCellClick}
          />
          {showLegend && (
            <HeatmapLegend scheme={colorScheme} />
          )}
        </>
      )}
    </div>
  );
}
