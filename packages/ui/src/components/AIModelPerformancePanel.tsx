'use client';

import React, { useMemo } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

/** 模型性能指标 */
export interface ModelPerformanceMetric {
  /** 指标标识 */
  key: string;
  /** 指标名称 */
  label: string;
  /** 当前值 */
  value: number;
  /** 单位 */
  unit: string;
  /** 趋势: 上升/下降/持平 */
  trend?: 'up' | 'down' | 'flat';
  /** 变化百分比 */
  changePct?: number;
  /** 是否正向指标（上升好/下降好） */
  positiveDirection?: 'up' | 'down';
  /** 警告阈值 */
  warnThreshold?: number;
  /** 危险阈值 */
  dangerThreshold?: number;
}

/** 单个模型数据 */
export interface ModelPerformanceData {
  /** 模型 ID */
  modelId: string;
  /** 模型名称 */
  modelName: string;
  /** 模型版本 */
  version: string;
  /** 供应商 */
  provider: string;
  /** 性能指标列表 */
  metrics: ModelPerformanceMetric[];
  /** 最近24小时请求数 */
  requestCount24h: number;
  /** 在线状态 */
  status: 'online' | 'degraded' | 'offline';
  /** 最后更新时间 */
  lastUpdated: string;
}

/** 面板属性 */
export interface AIModelPerformancePanelProps {
  /** 模型数据列表 */
  models: ModelPerformanceData[];
  /** 面板标题 */
  title?: string;
  /** 加载状态 */
  loading?: boolean;
  /** 空状态提示 */
  emptyText?: string;
  /** 点击模型回调 */
  onModelClick?: (model: ModelPerformanceData) => void;
  className?: string;
  style?: React.CSSProperties;
}

// ── 辅助函数 ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ModelPerformanceData['status'], { label: string; dot: string; bg: string }> = {
  online:   { label: '在线', dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  degraded: { label: '降级', dot: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  offline:  { label: '离线', dot: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-950/40' },
};

function trendArrow(trend: ModelPerformanceMetric['trend'], positiveDir: 'up' | 'down' | undefined): string {
  if (!trend || trend === 'flat') return '→';
  const isGood = positiveDir ? trend === positiveDir : trend === 'up';
  const arrow = trend === 'up' ? '↑' : '↓';
  return isGood ? arrow : `❗${arrow}`;
}

function trendColor(trend: ModelPerformanceMetric['trend'], positiveDir: 'up' | 'down' | undefined): string {
  if (!trend || trend === 'flat') return 'text-gray-500 dark:text-gray-400';
  const isGood = positiveDir ? trend === positiveDir : trend === 'up';
  return isGood ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

function formatNum(n: number): string {
  if (n >= 100000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function unitDisplay(value: number, unit: string): string {
  if (unit === 'ms') return `${value.toFixed(1)} ms`;
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit.startsWith('¥')) return `¥${value.toFixed(4)}`;
  if (unit === 'count') return formatNum(value);
  return `${value} ${unit}`;
}

function thresholdColor(metric: ModelPerformanceMetric): string {
  const { value, warnThreshold, dangerThreshold, positiveDirection } = metric;
  const isPositive = positiveDirection === 'up';
  if (dangerThreshold !== undefined) {
    const crossed = isPositive ? value < dangerThreshold : value > dangerThreshold;
    if (crossed) return 'text-red-600 dark:text-red-400 font-bold';
  }
  if (warnThreshold !== undefined) {
    const crossed = isPositive ? value < warnThreshold : value > warnThreshold;
    if (crossed) return 'text-amber-600 dark:text-amber-400';
  }
  return 'text-gray-900 dark:text-gray-100';
}

// ── 子组件: 指标卡片 ─────────────────────────────────────────────────────────

function MetricBadge({ metric }: { metric: ModelPerformanceMetric }) {
  const arrow = trendArrow(metric.trend, metric.positiveDirection);
  const tc = trendColor(metric.trend, metric.positiveDirection);
  const colorClass = thresholdColor(metric);

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/40">
      <span className="text-xs text-gray-500 dark:text-gray-400 truncate mr-2">{metric.label}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={`text-sm font-semibold tabular-nums ${colorClass}`}>
          {unitDisplay(metric.value, metric.unit)}
        </span>
        {metric.trend && metric.changePct !== undefined && (
          <span className={`text-xs ${tc}`} title={metric.trend === 'up' ? '上升' : '下降'}>
            {arrow} {metric.changePct > 0 ? '+' : ''}{metric.changePct.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ── 主组件 ──────────────────────────────────────────────────────────────────

export function AIModelPerformancePanel({
  models,
  title = 'AI 模型性能监控',
  loading = false,
  emptyText = '暂无模型性能数据',
  onModelClick,
  className = '',
  style,
}: AIModelPerformancePanelProps) {

  // 安全处理 null/undefined
  const safeModels = models || [];

  // 汇总统计
  const summary = useMemo(() => {
    const total = safeModels.length;
    const online = safeModels.filter((m: ModelPerformanceData) => m.status === 'online').length;
    const totalReqs24h = safeModels.reduce((s: number, m: ModelPerformanceData) => s + m.requestCount24h, 0);
    return { total, online, totalReqs24h };
  }, [safeModels]);

  if (loading) {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 ${className}`} style={style}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (safeModels.length === 0) {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center ${className}`} style={style}>
        <div className="text-4xl mb-3">🤖</div>
        <p className="text-gray-500 dark:text-gray-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`} style={style}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {summary.online}/{summary.total} 在线 · 24h 请求 {formatNum(summary.totalReqs24h)}
        </span>
      </div>

      {/* 模型列表 */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {safeModels.map((model: ModelPerformanceData) => (
          <div
            key={model.modelId}
            className={`px-6 py-4 ${onModelClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors' : ''}`}
            onClick={() => onModelClick?.(model)}
            role={onModelClick ? 'button' : undefined}
            tabIndex={onModelClick ? 0 : undefined}
            onKeyDown={onModelClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter') onModelClick(model); } : undefined}
          >
            {/* 模型头 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[model.status].dot}`} />
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{model.modelName}</span>
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{model.provider} · v{model.version}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[model.status].bg} text-gray-600 dark:text-gray-300`}>
                {STATUS_CONFIG[model.status].label}
              </span>
            </div>

            {/* 指标卡片网格 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {model.metrics.map(metric => (
                <MetricBadge key={metric.key} metric={metric} />
              ))}
            </div>

            {/* 底部：24h 请求数 */}
            <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-right">
              24h 请求: <span className="font-mono font-medium text-gray-600 dark:text-gray-300">{formatNum(model.requestCount24h)}</span>
              · 最后更新: {model.lastUpdated}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
