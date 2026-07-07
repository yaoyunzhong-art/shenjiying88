'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';

// ==================== 类型定义 ====================

/** 预测维度 */
export type DemandForecastDimension = 'product' | 'category' | 'store' | 'region';

/** 单个预测条目 */
export interface DemandForecastEntry {
  /** 标识 */
  id: string;
  /** 名称 */
  name: string;
  /** 当前预测值 */
  forecastValue: number;
  /** 置信度 (0-100) */
  confidence: number;
  /** 同比变化百分比 */
  changePercent: number;
  /** 历史平均值 */
  historicalAvg?: number;
  /** 季节影响: positive / negative / neutral */
  seasonEffect?: 'positive' | 'negative' | 'neutral';
  /** 异常提醒 */
  anomaly?: string;
}

/** 模型元信息 */
export interface ForecastModelMeta {
  /** 模型名称 */
  modelName: string;
  /** 模型版本 */
  modelVersion: string;
  /** 总体准确率 (0-100) */
  accuracy: number;
  /** 训练数据时间范围 */
  trainingRange: string;
  /** 更新时间 */
  updatedAt: string;
}

/** AI 需求预测面板 Props */
export interface AIDemandForecastPanelProps {
  /** 预测数据 */
  entries: DemandForecastEntry[];
  /** 汇总: 总预测值 */
  totalForecast?: number;
  /** 对比周期变化率 */
  totalChangePercent?: number;
  /** 模型元信息 */
  modelMeta?: ForecastModelMeta;
  /** 面板标题 */
  title?: string;
  /** 预测维度 */
  dimension?: DemandForecastDimension;
  /** 是否紧凑 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 条目点击回调 */
  onEntryClick?: (entry: DemandForecastEntry) => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 测试 id */
  'data-testid'?: string;
}

// ==================== 常量 ====================

const DIMENSION_LABELS: Record<DemandForecastDimension, string> = {
  product: '单品预测',
  category: '品类预测',
  store: '门店预测',
  region: '区域预测',
};

const DIMENSION_UNITS: Record<DemandForecastDimension, string> = {
  product: '件',
  category: '件',
  store: '件',
  region: '件',
};

const TREND_ICON = {
  up: '📈',
  down: '📉',
  stable: '➡️',
} as const;

function getTrend(change: number): { icon: string; color: string; label: string } {
  if (change > 5) return { icon: TREND_ICON.up, color: '#22c55e', label: '上升' };
  if (change < -5) return { icon: TREND_ICON.down, color: '#ef4444', label: '下降' };
  return { icon: TREND_ICON.stable, color: '#f59e0b', label: '平稳' };
}

function getConfidenceBadge(confidence: number): { variant: 'success' | 'warning' | 'error'; label: string } {
  if (confidence >= 85) return { variant: 'success', label: '高置信' };
  if (confidence >= 60) return { variant: 'warning', label: '中置信' };
  return { variant: 'error', label: '低置信' };
}

function getSeasonEffectLabel(effect: 'positive' | 'negative' | 'neutral'): string {
  switch (effect) {
    case 'positive': return '✅ 旺季效应';
    case 'negative': return '⚠️ 淡季效应';
    case 'neutral': return '➖ 无明显季节影响';
  }
}

// ==================== 进度条辅助组件 ====================

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div
      style={{
        width: 60,
        height: 4,
        borderRadius: 2,
        background: 'rgba(148,163,184,0.16)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: `${Math.min(value, 100)}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

// ==================== 模型信息条 ====================

function ModelInfoBar({ meta }: { meta: ForecastModelMeta }) {
  const accuracyColor = meta.accuracy >= 85 ? '#22c55e' : meta.accuracy >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 16px',
        padding: '8px 12px',
        borderRadius: 8,
        background: 'rgba(96, 165, 250, 0.06)',
        border: '1px solid rgba(96, 165, 250, 0.12)',
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 14,
      }}
      data-testid="forecast-model-info"
    >
      <span>🧠 <strong style={{ color: '#e2e8f0' }}>{meta.modelName}</strong> v{meta.modelVersion}</span>
      <span>
        准确率: <span style={{ color: accuracyColor, fontWeight: 600 }}>{meta.accuracy}%</span>
      </span>
      <span>训练: {meta.trainingRange}</span>
      <span style={{ marginLeft: 'auto', color: '#64748b' }}>更新: {meta.updatedAt}</span>
    </div>
  );
}

// ==================== 预测条目行 ====================

function ForecastEntryRow({
  entry,
  dimension,
  compact,
  onClick,
}: {
  entry: DemandForecastEntry;
  dimension: DemandForecastDimension;
  compact: boolean;
  onClick?: (entry: DemandForecastEntry) => void;
}) {
  const trend = getTrend(entry.changePercent);
  const confBadge = getConfidenceBadge(entry.confidence);
  const unit = DIMENSION_UNITS[dimension];

  return (
    <div
      onClick={() => onClick?.(entry)}
      data-testid={`forecast-entry-${entry.id}`}
      style={{
        display: 'flex',
        alignItems: compact ? 'center' : 'flex-start',
        gap: 12,
        padding: compact ? '8px 10px' : '12px 14px',
        borderRadius: 10,
        background: 'rgba(15, 23, 42, 0.3)',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = 'rgba(148,163,184,0.08)';
        el.style.borderColor = 'rgba(148,163,184,0.2)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = 'rgba(15, 23, 42, 0.3)';
        el.style.borderColor = 'rgba(148, 163, 184, 0.08)';
      }}
    >
      {/* 趋势图标 */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${trend.color}12`,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {trend.icon.split('')[0] ?? '📊'}
      </div>

      {/* 信息区 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
            {entry.name}
          </span>
          <StatusBadge variant={confBadge.variant} label={confBadge.label} />
        </div>

        {!compact && entry.seasonEffect && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
            {getSeasonEffectLabel(entry.seasonEffect)}
          </div>
        )}

        {!compact && entry.anomaly && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: '#fca5a5',
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(239,68,68,0.08)',
              display: 'inline-block',
            }}
          >
            ⚠ {entry.anomaly}
          </div>
        )}
      </div>

      {/* 数值区 */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
          {entry.forecastValue >= 10000
            ? (entry.forecastValue / 10000).toFixed(1) + 'w'
            : entry.forecastValue.toLocaleString()}
          <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b', marginLeft: 4 }}>
            {unit}
          </span>
        </div>

        {/* 变化率 */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: trend.color,
            marginTop: 2,
          }}
        >
          {entry.changePercent >= 0 ? '+' : ''}
          {entry.changePercent.toFixed(1)}%
        </div>
      </div>

      {/* 置信度指示器 (紧凑模式下放) */}
      {!compact && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <ConfidenceBar value={entry.confidence} />
          <span style={{ fontSize: 11, color: '#64748b', width: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {entry.confidence}%
          </span>
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * AIDemandForecastPanel — AI 需求预测面板。
 *
 * 展示 AI 模型对产品/品类/门店/区域的需求预测结果，包括：
 * - 模型元信息展示 (模型名称、版本、准确率、训练范围)
 * - 总体预测汇总 (总预测值、变化率)
 * - 逐条预测条目 (名称、预测量、置信度、变化趋势、季节效应、异常提醒)
 *
 * @example
 * ```tsx
 * <AIDemandForecastPanel
 *   title="6月各品类需求预测"
 *   dimension="category"
 *   entries={[
 *     {
 *       id: 'cat-1',
 *       name: '饮品',
 *       forecastValue: 12500,
 *       confidence: 92,
 *       changePercent: 8.5,
 *       seasonEffect: 'positive',
 *     },
 *     {
 *       id: 'cat-2',
 *       name: '零食',
 *       forecastValue: 8200,
 *       confidence: 76,
 *       changePercent: -3.2,
 *       seasonEffect: 'neutral',
 *       anomaly: '近期库存周转异常',
 *     },
 *   ]}
 *   totalForecast={35000}
 *   totalChangePercent={5.2}
 *   modelMeta={{
 *     modelName: 'Prophet+XGBoost',
 *     modelVersion: '2.3.1',
 *     accuracy: 91,
 *     trainingRange: '2025-01 ~ 2026-05',
 *     updatedAt: '2026-06-27',
 *   }}
 * />
 * ```
 */
export const AIDemandForecastPanel: React.FC<AIDemandForecastPanelProps> = ({
  entries,
  totalForecast,
  totalChangePercent,
  modelMeta,
  title,
  dimension = 'product',
  compact = false,
  className,
  emptyText = '暂无需求预测数据',
  onEntryClick,
  loading = false,
  'data-testid': testId,
}) => {
  const displayTitle = title ?? `AI ${DIMENSION_LABELS[dimension]}`;

  // 汇总: 如果没有传入 totalForecast 则根据 entries 计算
  const computedTotal = totalForecast ?? entries.reduce((s, e) => s + e.forecastValue, 0);
  const computedChange = totalChangePercent ?? (entries.length > 0
    ? entries.reduce((s, e) => s + e.changePercent, 0) / entries.length
    : 0);
  const totalTrend = getTrend(computedChange);

  const isEmpty = entries.length === 0;

  // 根据置信度分段统计
  const confidenceStats = useMemo(() => {
    const high = entries.filter((e) => e.confidence >= 85).length;
    const mid = entries.filter((e) => e.confidence >= 60 && e.confidence < 85).length;
    const low = entries.filter((e) => e.confidence < 60).length;
    return { high, mid, low };
  }, [entries]);

  return (
    <div data-testid={testId ?? 'ai-demand-forecast-panel'} className={className}>
    <Card
      title={displayTitle}
      headerActions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge variant={totalTrend.color === '#22c55e' ? 'success' : totalTrend.color === '#ef4444' ? 'error' : 'warning'} label={totalTrend.label} />
        </div>
      }
    >
      <>
      {/* 加载状态 */}
      {loading && (
        <div
          data-testid="forecast-loading"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '48px 16px',
            color: '#64748b',
            fontSize: 14,
          }}
        >
          <span style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: '2px solid rgba(96,165,250,0.3)',
            borderTopColor: '#60a5fa',
            animation: 'forecast-spin 0.6s linear infinite',
            display: 'inline-block',
          }} />
          AI 正在计算预测…
        </div>
      )}

      {/* 模型信息 */}
      {!loading && modelMeta && <ModelInfoBar meta={modelMeta} />}

      {!loading && (
        <>
          {/* 总体预测汇总 */}
          <div
            data-testid="forecast-total-summary"
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
              padding: '12px 14px',
              marginBottom: 14,
              borderRadius: 10,
              background: 'rgba(15, 23, 42, 0.4)',
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                总预测需求
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: '#f8fafc' }}>
                {computedTotal >= 10000
                  ? (computedTotal / 10000).toFixed(1) + 'w'
                  : computedTotal.toLocaleString()}
                <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b', marginLeft: 6 }}>
                  {DIMENSION_UNITS[dimension]}
                </span>
              </div>
            </div>

            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
                同比变化
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: totalTrend.color }}>
                {computedChange >= 0 ? '+' : ''}{computedChange.toFixed(1)}%
              </div>
            </div>

            {/* 置信度分布小标签 */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                marginLeft: 8,
                alignSelf: 'flex-end',
                paddingBottom: 2,
              }}
            >
              {[
                { count: confidenceStats.high, color: '#22c55e', label: '高' },
                { count: confidenceStats.mid, color: '#f59e0b', label: '中' },
                { count: confidenceStats.low, color: '#ef4444', label: '低' },
              ].filter((s) => s.count > 0).map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: `${s.color}15`,
                    color: s.color,
                    fontWeight: 500,
                  }}
                >
                  {s.count}{s.label}
                </span>
              ))}
            </div>
          </div>

          {/* 空状态 */}
          {isEmpty && (
            <div
              data-testid="forecast-empty"
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: '#64748b',
                fontSize: 13,
              }}
            >
              {emptyText}
            </div>
          )}

          {/* 预测条目列表 */}
          {!isEmpty && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map((entry) => (
                <ForecastEntryRow
                  key={entry.id}
                  entry={entry}
                  dimension={dimension}
                  compact={compact}
                  onClick={onEntryClick}
                />
              ))}
            </div>
          )}
        </>
      )}
    </>
    </Card>
    </div>
  );
};

export default AIDemandForecastPanel;
