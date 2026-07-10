'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 单条利润率记录 */
export interface ProfitMarginRecord {
  /** 维度标识 */
  id: string;
  /** 维度名称 (产品线/门店/品类) */
  label: string;
  /** 收入 */
  revenue: number;
  /** 成本 */
  cost: number;
  /** 毛利率百分比 */
  grossMargin: number;
  /** 同比变化 (百分点) */
  marginTrend: number;
}

/** 成本明细项 */
export interface CostBreakdownItem {
  /** 成本类别 */
  category: string;
  /** 成本金额 */
  amount: number;
  /** 占比百分比 */
  percentage: number;
  /** 类别颜色 */
  color: string;
}

/** 利润率面板属性 */
export interface ProfitMarginPanelProps {
  /** 标题 */
  title?: string;
  /** 总体收入 */
  totalRevenue: number;
  /** 总体成本 */
  totalCost: number;
  /** 毛利率百分比 */
  overallMargin: number;
  /** 同比变化 */
  marginChange: number;
  /** 明细记录 */
  records: ProfitMarginRecord[];
  /** 成本明细 */
  costBreakdown: CostBreakdownItem[];
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 时间段标签 */
  periodLabel?: string;
}

// ==================== 工具函数 ====================

/** 格式化金额 */
function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** 格式化百分比 */
function formatPercent(value: number, signed = false): string {
  const prefix = signed && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

// ==================== 子组件 ====================

/** 关键指标卡片 */
function MetricCard({
  label,
  value,
  trend,
  trendLabel,
  loading,
}: {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
        <div className="h-6 w-24 bg-gray-200 rounded mb-1" />
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {trend !== undefined && (
        <p
          className={`text-xs mt-1 ${
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatPercent(trend, true)}
          {trendLabel ? ` ${trendLabel}` : ''}
        </p>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * ProfitMarginPanel - 利润率分析面板
 *
 * 展示门店/产品线的收入、成本、毛利率以及成本构成明细。
 * 适合店长工作台、财务分析等场景。
 */
export function ProfitMarginPanel({
  title = '利润率分析',
  totalRevenue,
  totalCost,
  overallMargin,
  marginChange,
  records,
  costBreakdown,
  loading = false,
  error,
  periodLabel = '本月',
}: ProfitMarginPanelProps) {
  const profit = useMemo(() => totalRevenue - totalCost, [totalRevenue, totalCost]);

  // 按毛利率降序排列
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.grossMargin - a.grossMargin),
    [records],
  );

  // 错误状态
  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-red-200">
        <div className="flex items-center gap-2 text-red-600">
          <span className="text-lg">⚠️</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-5">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
          {periodLabel}
        </span>
      </div>

      {/* 指标卡片 */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="总收入"
          value={formatCurrency(totalRevenue)}
          loading={loading}
        />
        <MetricCard
          label="总成本"
          value={formatCurrency(totalCost)}
          loading={loading}
        />
        <MetricCard
          label="毛利润"
          value={formatCurrency(profit)}
          loading={loading}
        />
        <MetricCard
          label="毛利率"
          value={formatPercent(overallMargin)}
          trend={marginChange}
          trendLabel="同比"
          loading={loading}
        />
      </div>

      {/* 利润率明细列表 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">各维度利润率</h4>
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-10 bg-gray-100 rounded"
                />
              ))
            : sortedRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                >
                  <span className="text-sm text-gray-700">{record.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {formatCurrency(record.revenue)} /{' '}
                      {formatCurrency(record.cost)}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        record.grossMargin >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {formatPercent(record.grossMargin)}
                    </span>
                    <span
                      className={`text-xs ${
                        record.marginTrend >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {formatPercent(record.marginTrend, true)}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* 成本构成 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">成本构成</h4>
        {loading ? (
          <div className="animate-pulse h-20 bg-gray-100 rounded" />
        ) : (
          <div className="space-y-2">
            {/* 堆叠条 */}
            <div className="flex h-6 rounded-full overflow-hidden">
              {costBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                    minWidth: item.percentage > 0 ? '4px' : '0',
                  }}
                  title={`${item.category}: ${item.percentage.toFixed(1)}%`}
                />
              ))}
            </div>
            {/* 图例 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {costBreakdown.map((item) => (
                <div key={item.category} className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600">{item.category}</span>
                  <span className="text-xs text-gray-400 ml-auto">
                    {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
