'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

export interface ComparisonItem {
  /** 分类名称 */
  label: string;
  /** 数值 */
  value: number;
  /** 可选的基准值（用于双柱对比） */
  baseline?: number;
  /** 柱状颜色（默认使用主题色） */
  color?: string;
}

export interface ComparisonBreakdownChartProps {
  /** 对比数据 */
  data: ComparisonItem[];
  /** 图表标题 */
  title?: string;
  /** 是否显示数值标签（默认 true） */
  showValues?: boolean;
  /** 是否显示基准柱（默认 true） */
  showBaseline?: boolean;
  /** 主柱颜色（默认 #3b82f6） */
  barColor?: string;
  /** 基准柱颜色（默认 #d1d5db） */
  baselineColor?: string;
  /** 高度 px（默认 240） */
  height?: number;
  /** 加载态 */
  loading?: boolean;
  /** 空态文案 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
  'data-testid'?: string;
}

// ==================== 组件 ====================

/**
 * ComparisonBreakdownChart — 横向对比柱状图
 * 用于 AI 面板中展示分类对比/占⽐分析，支持双柱对比（主值 vs 基准值）。
 */
export function ComparisonBreakdownChart({
  data,
  title,
  showValues = true,
  showBaseline = true,
  barColor = '#3b82f6',
  baselineColor = '#d1d5db',
  height = 240,
  loading = false,
  emptyText = '暂无对比数据',
  className = '',
  'data-testid': dataTestId = 'comparison-breakdown-chart',
}: ComparisonBreakdownChartProps) {
  const maxValue = useMemo(
    () => Math.max(...(data ?? []).map((d) => Math.max(d.value, d.baseline ?? 0)), 1),
    [data],
  );

  if (loading) {
    return (
      <div
        className="comparison-breakdown-chart comparison-breakdown-chart--loading"
        data-testid={`${dataTestId}-loading`}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div
          className="comparison-breakdown-chart__skeleton"
          style={{
            width: '80%',
            height: 16,
            background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
            backgroundSize: '200% 100%',
            borderRadius: 4,
            animation: 'shimmer 1.5s infinite',
          }}
        />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="comparison-breakdown-chart comparison-breakdown-chart--empty"
        data-testid={`${dataTestId}-empty`}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: 13,
        }}
      >
        {emptyText}
      </div>
    );
  }

  const rowHeight = Math.max(24, Math.min(40, (height - 40) / data.length));
  const barMaxWidth = 65; // percentage of container
  const labelWidth = 80; // px

  return (
    <div
      className={`comparison-breakdown-chart ${className}`}
      data-testid={dataTestId}
      style={{ fontFamily: 'system-ui, sans-serif' }}
    >
      {title && (
        <div
          className="comparison-breakdown-chart__header"
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

      <div className="comparison-breakdown-chart__body" data-testid={`${dataTestId}-body`}>
        {data.map((item, idx) => {
          const barWidthPct = Math.max(
            2,
            (item.value / maxValue) * barMaxWidth,
          );
          const baselineWidthPct =
            showBaseline && item.baseline != null
              ? Math.max(2, (item.baseline / maxValue) * barMaxWidth)
              : 0;

          return (
            <div
              key={`row-${idx}`}
              className="comparison-breakdown-chart__row"
              data-testid={`${dataTestId}-row-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: rowHeight,
                marginBottom: 6,
              }}
            >
              {/* 分类标签 */}
              <span
                className="comparison-breakdown-chart__label"
                data-testid={`${dataTestId}-label-${idx}`}
                style={{
                  width: labelWidth,
                  fontSize: 11,
                  color: '#6b7280',
                  textAlign: 'right',
                  paddingRight: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {item.label}
              </span>

              {/* 柱状区域 */}
              <div
                className="comparison-breakdown-chart__bars"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  position: 'relative',
                }}
              >
                {/* 基准柱 */}
                {showBaseline && item.baseline != null && (
                  <div
                    className="comparison-breakdown-chart__bar comparison-breakdown-chart__bar--baseline"
                    data-testid={`${dataTestId}-baseline-${idx}`}
                    style={{
                      height: Math.max(4, rowHeight * 0.5),
                      width: `${baselineWidthPct}%`,
                      backgroundColor: baselineColor,
                      borderRadius: 3,
                      transition: 'width 0.3s ease',
                      minWidth: 4,
                      opacity: 0.6,
                    }}
                  />
                )}

                {/* 主柱 */}
                <div
                  className="comparison-breakdown-chart__bar comparison-breakdown-chart__bar--primary"
                  data-testid={`${dataTestId}-bar-${idx}`}
                  style={{
                    height: Math.max(6, rowHeight * 0.7),
                    width: `${barWidthPct}%`,
                    backgroundColor: item.color ?? barColor,
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                    minWidth: 4,
                  }}
                />

                {/* 数值 */}
                {showValues && (
                  <span
                    className="comparison-breakdown-chart__value"
                    data-testid={`${dataTestId}-value-${idx}`}
                    style={{
                      fontSize: 11,
                      color: '#374151',
                      marginLeft: 4,
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                    }}
                  >
                    {item.value}
                    {item.baseline != null && showBaseline && (
                      <span
                        style={{ color: '#9ca3af', fontWeight: 400, marginLeft: 4 }}
                      >
                        / {item.baseline}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ComparisonBreakdownChart;
