'use client';

import React, { useMemo } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

/** 漂移特征维度 */
export interface DriftFeature {
  /** 特征标识 */
  key: string;
  /** 特征名称 */
  name: string;
  /** 漂移分数(0-1)，越大越严重 */
  driftScore: number;
  /** 漂移程度 */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** 当前分布描述 */
  currentDistribution: string;
  /** 基线分布描述 */
  baselineDistribution: string;
  /** 样本量当前值 */
  currentCount: number;
  /** 样本量基数值 */
  baselineCount: number;
}

/** 数据漂移概览 */
export interface DriftOverview {
  /** 总特征数 */
  totalFeatures: number;
  /** 异常特征数 */
  driftedFeatures: number;
  /** 最高漂移分数 */
  maxDriftScore: number;
  /** 平均漂移分数 */
  avgDriftScore: number;
  /** 数据时间窗口 */
  timeWindow: string;
  /** 数据源 */
  dataSource: string;
}

/** 面板属性 */
export interface DataDriftMonitorPanelProps {
  /** 概览数据 */
  overview: DriftOverview;
  /** 特征漂移详情列表 */
  features: DriftFeature[];
  /** 面板标题 */
  title?: string;
  /** 加载状态 */
  loading?: boolean;
  /** 空状态提示 */
  emptyText?: string;
  /** 异常阈值（漂移分数高于此标红） */
  warningThreshold?: number;
  /** 点击特征回调 */
  onFeatureClick?: (feature: DriftFeature) => void;
  className?: string;
  style?: React.CSSProperties;
}

// ── 辅助函数 ────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<DriftFeature['severity'], { label: string; bar: string; text: string; bg: string }> = {
  low:      { label: '正常',   bar: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  medium:   { label: '轻微',   bar: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30' },
  high:     { label: '显著',   bar: 'bg-orange-500',  text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  critical: { label: '严重',   bar: 'bg-red-500',     text: 'text-red-700 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-950/30' },
};

function driftBarColor(score: number): string {
  if (score >= 0.7) return 'bg-red-500';
  if (score >= 0.4) return 'bg-orange-500';
  if (score >= 0.2) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function formatCount(n: number | undefined | null): string {
  if (n == null) return '--';
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ── 子组件: 特征漂移行 ────────────────────────────────────────────────────

function DriftFeatureRow({
  feature,
  onClick,
  warningThreshold = 0.3,
}: {
  feature: DriftFeature;
  onClick?: (f: DriftFeature) => void;
  warningThreshold?: number;
}) {
  const sev = SEVERITY_CONFIG[feature.severity];
  const isAlert = feature.driftScore >= warningThreshold;

  return (
    <div
      className={`px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0
        ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors' : ''}`}
      onClick={() => onClick?.(feature)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => { if (e.key === 'Enter') onClick(feature); } : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        {/* 特征名 */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{feature.name}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
            {sev.label}
          </span>
          {isAlert && (
            <span className="text-xs text-red-500 font-medium" title="超过告警阈值">⚠</span>
          )}
        </div>
        {/* 漂移分数 */}
        <span className={`text-sm font-semibold tabular-nums ml-3 shrink-0 ${
          isAlert ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'
        }`}>
          {formatPct(feature.driftScore)}
        </span>
      </div>

      {/* 漂移分数进度条 */}
      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${driftBarColor(feature.driftScore)}`}
          style={{ width: `${Math.min(feature.driftScore * 100, 100)}%` }}
        />
      </div>

      {/* 分布对比 */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="truncate mr-2" title={`当前: ${feature.currentDistribution ?? '--'} (n=${formatCount(feature.currentCount)})`}>
          当前: {feature.currentDistribution ?? '--'}
        </span>
        <span className="shrink-0 mx-1 text-gray-300 dark:text-gray-600">|</span>
        <span className="truncate ml-2" title={`基线: ${feature.baselineDistribution ?? '--'} (n=${formatCount(feature.baselineCount)})`}>
          基线: {feature.baselineDistribution ?? '--'}
        </span>
      </div>
    </div>
  );
}

// ── 主组件 ──────────────────────────────────────────────────────────────────

export function DataDriftMonitorPanel({
  overview,
  features,
  title = '数据漂移监控',
  loading = false,
  emptyText = '暂无漂移数据',
  warningThreshold = 0.3,
  onFeatureClick,
  className = '',
  style,
}: DataDriftMonitorPanelProps) {

  const safeFeatures = features || [];

  // 按严重程度分组统计
  const severityBreakdown = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    safeFeatures.forEach((f: DriftFeature) => {
      if (counts[f.severity] !== undefined) counts[f.severity]++;
    });
    return counts;
  }, [safeFeatures]);

  if (loading) {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 ${className}`} style={style}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!overview || safeFeatures.length === 0) {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-10 text-center ${className}`} style={style}>
        <div className="text-4xl mb-3">📊</div>
        <p className="text-gray-500 dark:text-gray-400">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 ${className}`} style={style}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {overview.dataSource} · {overview.timeWindow}
        </span>
      </div>

      {/* 概览指标 */}
      <div className="grid grid-cols-4 gap-px bg-gray-100 dark:bg-gray-800">
        <OverviewCell label="总特征数" value={String(overview.totalFeatures)} />
        <OverviewCell
          label="漂移特征"
          value={String(overview.driftedFeatures)}
          highlight={overview.driftedFeatures > 0}
        />
        <OverviewCell label="最高漂移" value={formatPct(overview.maxDriftScore)} danger={overview.maxDriftScore >= warningThreshold} />
        <OverviewCell label="平均漂移" value={formatPct(overview.avgDriftScore)} danger={overview.avgDriftScore >= warningThreshold * 0.7} />
      </div>

      {/* 严重程度分布 */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
        {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
          <span key={sev} className="text-xs text-gray-500 dark:text-gray-400">
            {SEVERITY_CONFIG[sev].label}: <span className={`font-medium ${SEVERITY_CONFIG[sev].text}`}>{severityBreakdown[sev]}</span>
          </span>
        ))}
      </div>

      {/* 特征列表 */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {safeFeatures.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">{emptyText}</div>
        ) : (
          safeFeatures.map((feature: DriftFeature) => (
            <DriftFeatureRow
              key={feature.key}
              feature={feature}
              onClick={onFeatureClick}
              warningThreshold={warningThreshold}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── 概览单元格 ──────────────────────────────────────────────────────────────

function OverviewCell({
  label,
  value,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 px-4 py-3 text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${
        danger ? 'text-red-600 dark:text-red-400' :
        highlight ? 'text-amber-600 dark:text-amber-400' :
        'text-gray-900 dark:text-gray-100'
      }`}>
        {value}
      </div>
    </div>
  );
}
