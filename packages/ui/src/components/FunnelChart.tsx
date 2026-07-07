'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 漏斗步骤数据 */
export interface FunnelStep {
  /** 步骤名称 */
  label: string;
  /** 步骤值/人数/数量 */
  value: number;
  /** 步骤颜色 (可选，默认从调色板取) */
  color?: string;
  /** 步骤描述 (可选，显示在详情区域) */
  description?: string;
}

export interface FunnelChartProps {
  /** 漏斗步骤数据（从上到下） */
  steps: FunnelStep[];
  /** 标题 */
  title?: string;
  /** 图表宽度 (px)，默认 400 */
  width?: number;
  /** 图表高度（自动计算，最小 200） */
  height?: number;
  /** 百分比显示小数点位数，默认 1 */
  decimalPlaces?: number;
  /** 是否显示转化率箭头 */
  showArrows?: boolean;
  /** 是否显示累计转化率 */
  showConversionRate?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
}

// ==================== 默认调色板 ====================

const DEFAULT_PALETTE = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
];

// ==================== 工具函数 ====================

function formatNumber(n: number): string {
  if (n >= 1_0000_0000) return (n / 1_0000_0000).toFixed(1) + '亿';
  if (n >= 1_0000) return (n / 1_0000).toFixed(1) + '万';
  return n.toLocaleString();
}

// ==================== 组件 ====================

export function FunnelChart({
  steps,
  title,
  width: _width = 400,
  height: _height,
  decimalPlaces = 1,
  showArrows = true,
  showConversionRate = true,
  className,
  emptyText = '暂无数据',
}: FunnelChartProps) {
  const processedSteps: (FunnelStep & { percent: number; widthPct: number })[] = useMemo(() => {
    if (!steps || steps.length === 0) return [];
    const maxVal = Math.max(...steps.map((s) => s.value));
    if (maxVal === 0) return steps.map((s, i) => ({ ...s, percent: 0, widthPct: 0, color: s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] }));
    return steps.map((s, i) => ({
      ...s,
      percent: s.value > 0 ? (s.value / steps[0]!.value) * 100 : 0,
      widthPct: s.value > 0 ? (s.value / maxVal) * 100 : 0,
      color: s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
    }));
  }, [steps]);

  const chartHeight = useMemo(() => {
    if (_height) return _height;
    return Math.max(200, (processedSteps.length || steps?.length || 0) * 72 + (title ? 36 : 0));
  }, [_height, processedSteps.length, steps?.length, title]);

  if (!steps || steps.length === 0 || processedSteps.length === 0) {
    return (
      <div
        className={className}
        style={{
          width: _width,
          height: chartHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: 14,
          background: '#f8fafc',
          borderRadius: 8,
        }}
      >
        {emptyText}
      </div>
    );
  }

  const barHeight = Math.max(32, Math.min(56, (chartHeight - 60) / processedSteps.length / 1.8));
  const gap = Math.max(8, Math.min(16, (chartHeight - 60 - processedSteps.length * barHeight) / (processedSteps.length + 1)));

  return (
    <div
      className={className}
      style={{
        width: _width,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      role="img"
      aria-label={title ? `漏斗图: ${title}` : '漏斗图'}
    >
      {title && (
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1e293b',
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {title}
        </div>
      )}

      <svg
        width={_width}
        height={chartHeight - (title ? 36 : 0)}
        viewBox={`0 0 ${_width} ${chartHeight - (title ? 36 : 0)}`}
        style={{ display: 'block' }}
      >
        {processedSteps.map((step, i) => {
          const yOffset = i * (barHeight + gap) + gap;
          const funnelWidth = (step.widthPct / 100) * (_width * 0.6);
          const xCenter = _width / 2;
          const barX = xCenter - funnelWidth / 2;
          const isLast = i === processedSteps.length - 1;

          // 计算上一步宽度（用于绘制梯形）
          const prevWidthPct = i > 0 ? processedSteps[i - 1]!.widthPct : step.widthPct;
          const prevFunnelWidth = (prevWidthPct / 100) * (_width * 0.6);
          const prevBarX = xCenter - prevFunnelWidth / 2;

          return (
            <g key={`step-${i}`}>
              {/* 漏斗梯形 */}
              {i > 0 ? (
                <polygon
                  points={`${prevBarX},${yOffset - gap} ${prevBarX + prevFunnelWidth},${yOffset - gap} ${barX + funnelWidth},${yOffset + barHeight} ${barX},${yOffset + barHeight}`}
                  fill={step.color}
                  opacity={0.85}
                />
              ) : null}

              {/* 当前矩形条 */}
              <rect
                x={barX}
                y={yOffset}
                width={funnelWidth}
                height={barHeight}
                rx={4}
                ry={4}
                fill={step.color}
                opacity={0.85}
              />

              {/* 步骤序号 */}
              <text
                x={barX - 28}
                y={yOffset + barHeight / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={700}
                fill="#64748b"
              >
                {i + 1}
              </text>

              {/* 步骤标签（条内，左侧） */}
              <text
                x={barX + 12}
                y={yOffset + barHeight / 2}
                dominantBaseline="central"
                fontSize={13}
                fontWeight={600}
                fill="#ffffff"
                textAnchor="start"
              >
                {step.label}
              </text>

              {/* 步骤值（条内，右侧） */}
              <text
                x={barX + funnelWidth - 8}
                y={yOffset + barHeight / 2}
                dominantBaseline="central"
                fontSize={13}
                fontWeight={700}
                fill="#ffffff"
                textAnchor="end"
              >
                {formatNumber(step.value)}
              </text>

              {/* 百分比标签（条右侧） */}
              {showConversionRate && (
                <text
                  x={barX + funnelWidth + 8}
                  y={yOffset + barHeight / 2}
                  dominantBaseline="central"
                  fontSize={12}
                  fill="#64748b"
                  textAnchor="start"
                >
                  {step.percent.toFixed(decimalPlaces)}%
                </text>
              )}

              {/* 转化率箭头 */}
              {showArrows && !isLast && (
                <g transform={`translate(${_width / 2}, ${yOffset + barHeight + gap / 2 - 4})`}>
                  <line
                    x1={-6}
                    y1={0}
                    x2={6}
                    y2={0}
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                  />
                  <polygon
                    points="-4,-4 4,0 -4,4"
                    fill="#94a3b8"
                  />
                </g>
              )}

              {/* 步骤描述（显示在步骤下方，上方间隙处） */}
              {step.description && (
                <text
                  x={_width / 2}
                  y={yOffset + barHeight + (isLast ? 0 : gap / 2 + 4)}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#94a3b8"
                >
                  {step.description}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default FunnelChart;
