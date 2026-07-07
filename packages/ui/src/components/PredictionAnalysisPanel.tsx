'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 预测置信区间 */
export interface ConfidenceInterval {
  lowerBound: number;
  upperBound: number;
  confidenceLevel: number;
}

/** 单个预测数据点 */
export interface PredictionPoint {
  label: string;
  predictedValue: number;
  actualValue?: number;
  confidenceInterval?: ConfidenceInterval;
  trend?: 'up' | 'down' | 'stable';
  anomalyScore?: number;
}

/** 预测分析摘要 */
export interface PredictionSummary {
  /** 最高置信度预测 */
  bestPrediction: string;
  /** 预测趋势 */
  overallTrend: 'up' | 'down' | 'stable';
  /** 变化百分比 */
  changePercent: number;
  /** 风险等级 */
  riskLevel: 'low' | 'medium' | 'high';
  /** AI 建议 */
  recommendation?: string;
}

/** 预测分析面板属性 */
export interface PredictionAnalysisPanelProps {
  /** 标题 */
  title?: string;
  /** 预测数据点列表 */
  predictions: PredictionPoint[];
  /** 预测摘要 */
  summary?: PredictionSummary;
  /** 加载状态 */
  loading?: boolean;
  /** 错误状态 */
  error?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
  /** 指标单位 */
  unit?: string;
}

// ==================== 颜色/图标映射 ====================

const TREND_CONFIG = {
  up: { label: '上升', color: '#ef4444', icon: '↑' },
  down: { label: '下降', color: '#22c55e', icon: '↓' },
  stable: { label: '稳定', color: '#6b7280', icon: '→' },
};

const RISK_CONFIG = {
  low: { label: '低风险', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  medium: { label: '中风险', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  high: { label: '高风险', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

// ==================== 辅助函数 ====================

function formatNumber(val: number, decimals = 1): string {
  if (Math.abs(val) >= 1_0000_0000) return (val / 1_0000_0000).toFixed(decimals) + '亿';
  if (Math.abs(val) >= 1_0000) return (val / 1_0000).toFixed(decimals) + '万';
  return val.toFixed(decimals);
}

// ==================== 子组件 ====================

function ConfidenceBar({ interval, maxValue }: { interval: ConfidenceInterval; maxValue: number }) {
  const width = maxValue > 0 ? ((interval.upperBound - interval.lowerBound) / maxValue) * 100 : 0;
  return (
    <div style={{
      width: `${Math.min(width, 100)}%`,
      height: 4,
      background: `linear-gradient(90deg, #60a5fa40, #60a5fa)`,
      borderRadius: 2,
      marginTop: 2,
      position: 'relative',
    }}>
      <span style={{
        fontSize: 10,
        color: '#6b7280',
        position: 'absolute',
        top: -14,
        left: 0,
      }}>
        {interval.confidenceLevel * 100}% CI
      </span>
    </div>
  );
}

// ==================== 主组件 ====================

export const PredictionAnalysisPanel: React.FC<PredictionAnalysisPanelProps> = ({
  title = '预测分析面板',
  predictions,
  summary,
  loading = false,
  error,
  emptyText = '暂无预测数据',
  className,
  unit = '',
}) => {
  // ---- 加载态 ----
  if (loading) {
    return (
      <div
        className={className}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 20,
          background: '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              height: 56,
              background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
              backgroundSize: '200% 100%',
              borderRadius: 6,
              animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
      </div>
    );
  }

  // ---- 错误态 ----
  if (error) {
    return (
      <div
        className={className}
        style={{
          border: '1px solid #fecaca',
          borderRadius: 8,
          padding: 20,
          background: '#fef2f2',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#991b1b' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>{error}</p>
      </div>
    );
  }

  // ---- 空态 ----
  if (!predictions || predictions.length === 0) {
    return (
      <div
        className={className}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 20,
          background: '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>{emptyText}</p>
      </div>
    );
  }

  // ---- 正常渲染 ----
  const maxPrediction = Math.max(...predictions.map((p) => p.predictedValue), 1);
  const styles = {
    container: {
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: 20,
      background: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    } as React.CSSProperties,
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    } as React.CSSProperties,
    title: {
      margin: 0,
      fontSize: 14,
      fontWeight: 600,
      color: '#111827',
    } as React.CSSProperties,
    summaryCard: {
      background: '#f9fafb',
      borderRadius: 6,
      padding: 12,
      marginBottom: 16,
    } as React.CSSProperties,
    chip: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
    } as React.CSSProperties,
    barOuter: {
      width: '100%',
      height: 6,
      background: '#f3f4f6',
      borderRadius: 3,
      overflow: 'hidden',
    } as React.CSSProperties,
    barInner: (pct: number, color: string) => ({
      width: `${Math.min(pct, 100)}%`,
      height: '100%',
      background: color,
      borderRadius: 3,
      transition: 'width 0.6s ease',
    }) as React.CSSProperties,
  };

  return (
    <div className={className} style={styles.container}>
      {/* 标题 */}
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        {summary && (
          <span style={{
            ...styles.chip,
            ...RISK_CONFIG[summary.riskLevel],
            color: RISK_CONFIG[summary.riskLevel].color,
          }}>
            {RISK_CONFIG[summary.riskLevel].label}
          </span>
        )}
      </div>

      {/* 摘要 */}
      {summary && (
        <div style={styles.summaryCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>最佳预测：</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{summary.bestPrediction}</span>
            </div>
            <div>
              <span style={{ fontSize: 12, color: '#6b7280' }}>趋势：</span>
              <span style={{
                fontSize: 13,
                fontWeight: 600,
                color: TREND_CONFIG[summary.overallTrend].color,
              }}>
                {TREND_CONFIG[summary.overallTrend].icon} {summary.changePercent > 0 ? '+' : ''}{summary.changePercent}%
              </span>
            </div>
          </div>
          {summary.recommendation && (
            <div style={{
              fontSize: 12,
              color: '#6b7280',
              background: 'rgba(59,130,246,0.08)',
              borderRadius: 4,
              padding: '6px 10px',
              marginTop: 4,
            }}>
              💡 {summary.recommendation}
            </div>
          )}
        </div>
      )}

      {/* 预测列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {predictions.map((p, idx) => {
          const barPct = (p.predictedValue / maxPrediction) * 100;
          const trendInfo = p.trend ? TREND_CONFIG[p.trend] : null;
          return (
            <div key={p.label + idx} style={{ padding: '8px 0', borderBottom: idx < predictions.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              {/* 标签行 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{p.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    {formatNumber(p.predictedValue)}{unit}
                  </span>
                  {trendInfo && (
                    <span style={{ color: trendInfo.color, fontSize: 13 }}>{trendInfo.icon}</span>
                  )}
                </div>
              </div>

              {/* 预测条 */}
              <div style={styles.barOuter}>
                <div style={styles.barInner(barPct, '#3b82f6')} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                {/* 实际值 */}
                {p.actualValue !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>实际:</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>
                      {formatNumber(p.actualValue)}{unit}
                    </span>
                  </div>
                )}

                {/* 异常分数 */}
                {p.anomalyScore !== undefined && (
                  <span style={{
                    fontSize: 10,
                    color: p.anomalyScore > 0.7 ? '#ef4444' : p.anomalyScore > 0.4 ? '#f59e0b' : '#22c55e',
                  }}>
                    异常分: {p.anomalyScore.toFixed(2)}
                  </span>
                )}
              </div>

              {/* 置信区间条 */}
              {p.confidenceInterval && (
                <ConfidenceBar interval={p.confidenceInterval} maxValue={maxPrediction} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PredictionAnalysisPanel;
