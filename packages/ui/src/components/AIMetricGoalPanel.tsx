'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
import { ProgressRing } from './ProgressRing';
import { StatTrend } from './StatTrend';
import { Tooltip } from './Tooltip';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

// ── 类型定义 ────────────────────────────────────────────────────────────────

/** 指标趋势方向 */
export type MetricTrend = 'up' | 'down' | 'flat';

/** 计算/预测模式 */
export type MetricMode = 'actual' | 'predicted' | 'target';

/** 单个指标目标定义 */
export interface MetricGoal {
  /** 指标 ID */
  id: string;
  /** 指标名称 */
  label: string;
  /** 当前实际值 */
  actual: number;
  /** 目标值 */
  target: number;
  /** 预测值（可选） */
  predicted?: number;
  /** 单位 */
  unit: string;
  /** 趋势方向 */
  trend: MetricTrend;
  /** 环比变化百分比 */
  changePercent: number;
  /** 指标类别 */
  category: 'revenue' | 'member' | 'operation' | 'sales' | 'service';
  /** 图标 emoji */
  icon?: string;
  /** 是否为主要指标 */
  primary?: boolean;
}

/** 面板属性 */
export interface AIMetricGoalPanelProps {
  /** 指标目标数据列表 */
  goals: MetricGoal[];
  /** 面板标题 */
  title?: string;
  /** 加载状态 */
  loading?: boolean;
  /** 统计周期描述 */
  period?: string;
  /** 空状态提示 */
  emptyText?: string;
}

// ── 辅助函数 ────────────────────────────────────────────────────────────────

const categoryColors: Record<MetricGoal['category'], string> = {
  revenue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950',
  member: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950',
  operation: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
  sales: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950',
  service: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950',
};

const categoryLabels: Record<MetricGoal['category'], string> = {
  revenue: '营收',
  member: '会员',
  operation: '运营',
  sales: '销售',
  service: '服务',
};

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === '万') return `${(value / 10000).toFixed(1)}万`;
  if (unit === '元' || unit === '¥') return `¥${value.toLocaleString()}`;
  return `${value.toLocaleString()}${unit}`;
}

function getCompletionRate(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.min(Math.round((actual / target) * 100), 150);
}

// ── 子组件：单行指标卡片 ─────────────────────────────────────────────────────

function MetricGoalRow({ goal }: { goal: MetricGoal }) {
  const completion = getCompletionRate(goal.actual, goal.target);
  const trendIcon = goal.trend === 'up' ? '↑' : goal.trend === 'down' ? '↓' : '→';
  const trendColor =
    goal.trend === 'up'
      ? 'text-green-600'
      : goal.trend === 'down'
        ? 'text-red-500'
        : 'text-gray-400';

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition hover:shadow-sm ${
        goal.primary
          ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30'
          : 'border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      {/* 图标 */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
          categoryColors[goal.category]
        }`}
      >
        {goal.icon ?? '📊'}
      </div>

      {/* 指标信息 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Tooltip content={categoryLabels[goal.category]}>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {categoryLabels[goal.category]}
            </span>
          </Tooltip>
          {goal.primary && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              核心
            </span>
          )}
        </div>
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
          {goal.label}
        </p>
      </div>

      {/* 完成度环 */}
      <div className="flex shrink-0 items-center gap-2">
        <ProgressRing
          percent={completion > 100 ? 100 : completion}
          size={40}
          strokeWidth={3}
          className={
            completion >= 100
              ? 'text-green-500'
              : completion >= 70
                ? 'text-blue-500'
                : completion >= 40
                  ? 'text-amber-500'
                  : 'text-red-500'
          }
        />
        <div className="text-right">
          <p className="text-lg font-bold leading-tight text-gray-900 dark:text-gray-100">
            {completion}%
          </p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">完成率</p>
        </div>
      </div>

      {/* 实际值 vs 目标值 */}
      <div className="hidden min-w-[120px] text-right sm:block">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatValue(goal.actual, goal.unit)}
          <span className="mx-1 text-gray-300">/</span>
          <span className="text-gray-400">{formatValue(goal.target, goal.unit)}</span>
        </p>
      </div>

      {/* 趋势 */}
      <div className={`hidden shrink-0 text-right md:block`}>
        <p className={`text-sm font-semibold ${trendColor}`}>
          {trendIcon} {goal.changePercent > 0 ? '+' : ''}
          {goal.changePercent.toFixed(1)}%
        </p>
        <p className="text-[10px] text-gray-400">环比</p>
      </div>

      {/* 预测值 */}
      {goal.predicted !== undefined && (
        <div className="hidden shrink-0 text-right lg:block">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
            {formatValue(goal.predicted, goal.unit)}
          </p>
          <p className="text-[10px] text-gray-400">AI 预测</p>
        </div>
      )}
    </div>
  );
}

// ── 主面板 ──────────────────────────────────────────────────────────────────

export function AIMetricGoalPanel({
  goals,
  title = 'AI 指标目标看板',
  loading = false,
  period,
  emptyText = '暂无指标数据',
}: AIMetricGoalPanelProps) {
  // 汇总统计
  const summary = useMemo(() => {
    if (goals.length === 0) return null;
    const total = goals.length;
    const achieved = goals.filter((g) => getCompletionRate(g.actual, g.target) >= 100).length;
    const avgCompletion = Math.round(
      goals.reduce((sum, g) => sum + getCompletionRate(g.actual, g.target), 0) / total
    );
    return { total, achieved, avgCompletion };
  }, [goals]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-16">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500">加载指标数据…</span>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          {period && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{period}</p>
          )}
          <EmptyState title={emptyText} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        {/* 头部 */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
            {period && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{period}</p>
            )}
          </div>

          {summary && (
            <div className="flex items-center gap-4 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
              <span className="text-gray-600 dark:text-gray-300">
                达标 <strong className="text-green-600">{summary.achieved}</strong>/{summary.total}
              </span>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-gray-600 dark:text-gray-300">
                平均完成率 <strong className="text-blue-600">{summary.avgCompletion}%</strong>
              </span>
            </div>
          )}
        </div>

        {/* 指标列表 */}
        <div className="space-y-2">
          {goals.map((goal) => (
            <MetricGoalRow key={goal.id} goal={goal} />
          ))}
        </div>
      </div>
    </Card>
  );
}
