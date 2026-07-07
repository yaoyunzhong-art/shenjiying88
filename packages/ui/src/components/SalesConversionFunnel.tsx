'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 漏斗层级 */
export interface FunnelStage {
  /** 层级名称 */
  label: string;
  /** 该层级数量 */
  value: number;
  /** 可选的层级颜色 */
  color?: string;
  /** 可选的描述文本 */
  description?: string;
}

/** SalesConversionFunnel Props */
export interface SalesConversionFunnelProps {
  /** 漏斗各层级数据（从顶部开始：接待→意向→试穿→成交） */
  stages: FunnelStage[];
  /** 标题 */
  title?: string;
  /** 高度 px（默认 280） */
  height?: number;
  /** 是否显示转化率（默认 true） */
  showConversionRate?: boolean;
  /** 是否显示数值（默认 true） */
  showValues?: boolean;
  /** 是否显示占比百分比（默认 true） */
  showPercent?: boolean;
  /** 加载态 */
  loading?: boolean;
  /** 空态文案 */
  emptyText?: string;
  /** 主题色（默认 #6366f1） */
  themeColor?: string;
  /** 自定义类名 */
  className?: string;
  'data-testid'?: string;
}

// ==================== 内部工具 ====================

function formatNumber(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function ratePercent(a: number, b: number): string {
  if (b === 0) return '—';
  return `${((a / b) * 100).toFixed(1)}%`;
}

// ==================== 组件 ====================

/**
 * SalesConversionFunnel — 销售转化漏斗图
 *
 * 用于展示从接待→意向→试穿→成交的转化路径，
 * 适用角色：店长工作台、导购员工具、运营面板。
 */
export function SalesConversionFunnel({
  stages,
  title,
  height = 280,
  showConversionRate = true,
  showValues = true,
  showPercent = true,
  loading = false,
  emptyText = '暂无转化数据',
  themeColor = '#6366f1',
  className = '',
  'data-testid': dataTestId = 'sales-conversion-funnel',
}: SalesConversionFunnelProps) {
  // 计算占比百分比
  const maxValue = useMemo(() => Math.max(...stages.map((s) => s.value), 1), [stages]);

  const processedStages = useMemo(() => {
    return stages.map((stage, idx) => {
      const percent = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
      const prev: FunnelStage | undefined = idx > 0 ? stages[idx - 1] : undefined;
      const prevValue = prev ? prev.value : 0;
      const convRate = prevValue > 0 ? (stage.value / prevValue) * 100 : 0;
      return { ...stage, percent, convRate };
    });
  }, [stages, maxValue]);

  // ============== 加载态 ==============
  if (loading) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
        data-testid={dataTestId}
      >
        {title && <div className="mb-3 h-5 w-32 animate-pulse rounded bg-gray-200" />}
        <div className="flex items-center justify-center" style={{ height: height - 50 }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  // ============== 空态 ==============
  if (!stages || stages.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
        data-testid={dataTestId}
      >
        {title && <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>}
        <div
          className="flex items-center justify-center text-sm text-gray-400"
          style={{ height: height - 50 }}
        >
          {emptyText}
        </div>
      </div>
    );
  }

  // ============== 正常渲染 ==============
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-4 ${className}`}
      data-testid={dataTestId}
    >
      {/* 标题 */}
      {title && (
        <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      )}

      {/* 漏斗 */}
      <div
        className="flex flex-col justify-center gap-2"
        style={{ height: height - 50 }}
      >
        {processedStages.map((stage, idx) => {
          const barWidthPercent = Math.max(stage.percent, 8); // 最小 8%, 保证可见
          const barColor = stage.color || themeColor;

          return (
            <div key={idx} className="flex items-center gap-3">
              {/* 层级名 */}
              <span className="w-16 flex-shrink-0 text-right text-xs text-gray-600">
                {stage.label}
              </span>

              {/* 漏斗条 */}
              <div className="relative flex-1" style={{ height: 28 }}>
                {/* 背景 */}
                <div className="absolute inset-0 rounded bg-gray-100" />
                {/* 填充 */}
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all duration-500"
                  style={{
                    width: `${barWidthPercent}%`,
                    backgroundColor: barColor,
                    opacity: 1 - idx * 0.12,
                  }}
                />
                {/* 数值标签 */}
                {showValues && (
                  <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-white mix-blend-difference">
                    {formatNumber(stage.value)}
                  </span>
                )}
              </div>

              {/* 右侧信息 */}
              <div className="w-20 flex-shrink-0 text-xs text-gray-500">
                {showPercent && <span>{stage.percent.toFixed(0)}%</span>}
                {showConversionRate && idx > 0 && (
                  <span className="ml-1 text-gray-400">
                    / {ratePercent(stage.value, stages[idx - 1]?.value ?? 0)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 转化率汇总 */}
      {showConversionRate && stages.length >= 2 && (
        <div className="mt-2 border-t border-gray-100 pt-2 text-center text-xs text-gray-400">
          整体转化率：{ratePercent(stages[stages.length - 1]?.value ?? 0, stages[0]?.value ?? 0)}
        </div>
      )}
    </div>
  );
}
