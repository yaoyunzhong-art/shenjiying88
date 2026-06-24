'use client';

import React, { useState, useMemo } from 'react';

// ==================== 类型定义 ====================

/** 趋势方向 */
export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';

/** 趋势分类标签 */
export type TrendLabel = 'growth' | 'decline' | 'warning' | 'normal' | 'critical';

/** 数据点 */
export interface TrendDataPoint {
  /** 时间戳 ISO */
  timestamp: string;
  /** 数值 */
  value: number;
  /** 可选标签 */
  label?: string;
}

/** 趋势分析结果 */
export interface TrendAnalysis {
  /** 方向 */
  direction: TrendDirection;
  /** 变化率（百分比） */
  changeRate: number;
  /** AI 分类标签 */
  label: TrendLabel;
  /** 预测说明 */
  insight: string;
  /** 置信度 0-1 */
  confidence: number;
  /** 是否检测到异常 */
  hasAnomaly: boolean;
  /** 建议操作 */
  suggestion?: string;
}

/** 预测数据点 */
export interface ForecastPoint {
  timestamp: string;
  predicted: number;
  upperBound: number;
  lowerBound: number;
}

/** 智能趋势分析面板 Props */
export interface SmartTrendAnalysisPanelProps {
  /** 趋势名称 */
  title: string;
  /** 数值单位 */
  unit?: string;
  /** 最近一期数值 */
  currentValue: number;
  /** 上期数值（用于对比） */
  previousValue: number;
  /** 历史数据点（用于异常检测模式识别） */
  history?: TrendDataPoint[];
  /** AI 分析结果 */
  analysis: TrendAnalysis;
  /** 预测数据 */
  forecast?: ForecastPoint[];
  /** 指标说明 */
  metricDescription?: string;
  /** 面板主题色 */
  accentColor?: string;
  /** 自定义类名 */
  className?: string;
}

// ==================== 常量 ====================

const DIRECTION_META: Record<TrendDirection, { label: string; icon: string; color: string; bg: string }> = {
  up: { label: '上升', icon: '📈', color: '#4ade80', bg: 'rgba(34,197,94,0.12)' },
  down: { label: '下降', icon: '📉', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  stable: { label: '平稳', icon: '➡️', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  volatile: { label: '波动', icon: '🌊', color: '#fbbf24', bg: 'rgba(234,179,8,0.12)' },
};

const LABEL_META: Record<TrendLabel, { label: string; badge: string }> = {
  growth: { label: '健康增长', badge: '🟢' },
  decline: { label: '下降预警', badge: '🔴' },
  warning: { label: '需关注', badge: '🟡' },
  normal: { label: '正常范围', badge: '🔵' },
  critical: { label: '紧急', badge: '🚨' },
};

// ==================== 子组件 ====================

/** 迷你进度条指示器 */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div
      style={{
        width: '100%',
        height: 6,
        borderRadius: 3,
        background: 'rgba(148,163,184,0.1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 3,
          background: color,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  );
}

/** 异常指示标记 */
function AnomalyBadge({ hasAnomaly }: { hasAnomaly: boolean }) {
  if (!hasAnomaly) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        color: '#f87171',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(248,113,113,0.25)',
        padding: '2px 8px',
        borderRadius: 6,
      }}
    >
      ⚠️ 检测异常
    </span>
  );
}

/** 置信度条 */
function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, color: '#64748b' }}>置信度</span>
      <div style={{ flex: 1, maxWidth: 80 }}>
        <MiniBar value={pct} max={100} color={color} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color }}>{pct}%</span>
    </div>
  );
}

/** 单条预测数据点 */
function ForecastRow({ point, unit }: { point: ForecastPoint; unit?: string }) {
  const range = point.upperBound - point.lowerBound;
  const midOffset = range > 0 ? ((point.predicted - point.lowerBound) / range) * 100 : 50;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 0',
        fontSize: 11,
      }}
    >
      <span style={{ color: '#64748b', width: 80, flexShrink: 0 }}>
        {formatDateShort(point.timestamp)}
      </span>
      <div style={{ flex: 1, position: 'relative', height: 16 }}>
        {/* 预测区间条 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 5,
            height: 6,
            borderRadius: 3,
            background: 'rgba(96,165,250,0.15)',
          }}
        />
        {/* 预测值标记 */}
        <div
          style={{
            position: 'absolute',
            left: `${midOffset}%`,
            top: 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#60a5fa',
            border: '2px solid rgba(15,23,42,0.8)',
            transform: 'translateX(-50%)',
          }}
        />
      </div>
      <span style={{ color: '#e2e8f0', fontWeight: 600, width: 60, textAlign: 'right' }}>
        {point.predicted}{unit ?? ''}
      </span>
      <span style={{ color: '#475569', fontSize: 10, width: 50, textAlign: 'right' }}>
        ±{Math.round(range / 2)}{unit ?? ''}
      </span>
    </div>
  );
}

// ==================== 工具函数 ====================

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDelta(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// ==================== 主组件 ====================

/**
 * SmartTrendAnalysisPanel — 智能趋势分析面板组件。
 *
 * 结合 AI 分析进行趋势判定、异常检测和预测可视化。
 * 适用于会员增长趋势、销售趋势、设备状态趋势等场景。
 *
 * @example
 * <SmartTrendAnalysisPanel
 *   title="会员增长率"
 *   unit="%"
 *   currentValue={12.5}
 *   previousValue={8.3}
 *   analysis={{
 *     direction: 'up',
 *     changeRate: 50.6,
 *     label: 'growth',
 *     insight: '近7天会员注册量持续上升，建议加大拉新投入',
 *     confidence: 0.85,
 *     hasAnomaly: false,
 *     suggestion: '建议配合营销活动，预计下月增长率可提升至 18%',
 *   }}
 * />
 */
export function SmartTrendAnalysisPanel({
  title,
  unit = '',
  currentValue,
  previousValue,
  history,
  analysis,
  forecast,
  metricDescription,
  accentColor = '#60a5fa',
  className,
}: SmartTrendAnalysisPanelProps) {
  const [showForecast, setShowForecast] = useState(false);

  const delta = currentValue - previousValue;
  const dirMeta = DIRECTION_META[analysis.direction];
  const labelMeta = LABEL_META[analysis.label];

  // 历史数据迷你统计
  const historyStats = useMemo(() => {
    if (!history || history.length === 0) return null;
    const values = history.map((p) => p.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
    };
  }, [history]);

  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        background: 'rgba(15,23,42,0.35)',
        border: '1px solid rgba(148,163,184,0.14)',
        padding: '20px 18px 18px',
      }}
    >
      {/* 标题行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#e2e8f0',
            margin: 0,
          }}
        >
          {title}
        </h3>
        <AnomalyBadge hasAnomaly={analysis.hasAnomaly} />
        <div style={{ flex: 1 }} />
        {forecast && forecast.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForecast(!showForecast)}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#60a5fa',
              background: 'rgba(96,165,250,0.08)',
              border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: 6,
              padding: '3px 10px',
              cursor: 'pointer',
            }}
          >
            {showForecast ? '收起预测' : '查看预测'}
          </button>
        )}
      </div>

      {/* 主数值区域 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 16px',
          borderRadius: 12,
          background: dirMeta.bg,
          border: `1px solid rgba(148,163,184,0.08)`,
        }}
      >
        {/* 方向图标 */}
        <span style={{ fontSize: 28 }}>{dirMeta.icon}</span>

        {/* 当前值 */}
        <div>
          <div style={{ fontSize: 11, color: '#64748b' }}>当前值</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0' }}>
            {currentValue}
            <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>{unit}</span>
          </div>
        </div>

        {/* 变化量 */}
        <div
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            background: delta >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${delta >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <div style={{ fontSize: 10, color: '#64748b' }}>环比</div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: delta >= 0 ? '#4ade80' : '#f87171',
            }}
          >
            {formatDelta(analysis.changeRate)}
          </div>
        </div>

        {/* AI 分类标签 */}
        <div style={{ flex: 1 }} />

        <div style={{ textAlign: 'right' }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: dirMeta.color,
            }}
          >
            {labelMeta.badge} {labelMeta.label}
          </span>
          <ConfidenceBar confidence={analysis.confidence} />
        </div>
      </div>

      {/* 历史数据迷你统计 */}
      {historyStats && (
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginTop: 10,
            padding: '8px 16px',
            borderRadius: 8,
            background: 'rgba(15,23,42,0.25)',
            border: '1px solid rgba(148,163,184,0.06)',
            fontSize: 11,
            color: '#94a3b8',
            flexWrap: 'wrap',
          }}
        >
          <span>历史数据: {historyStats.count} 条</span>
          <span>最高: <span style={{ color: '#e2e8f0' }}>{historyStats.max}{unit}</span></span>
          <span>最低: <span style={{ color: '#e2e8f0' }}>{historyStats.min}{unit}</span></span>
          <span>均值: <span style={{ color: '#e2e8f0' }}>{historyStats.avg.toFixed(1)}{unit}</span></span>
        </div>
      )}

      {/* 指标说明 */}
      {metricDescription && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            color: '#94a3b8',
            lineHeight: 1.6,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(148,163,184,0.04)',
          }}
        >
          📌 {metricDescription}
        </div>
      )}

      {/* AI 洞察 */}
      <div
        style={{
          marginTop: 12,
          padding: '12px 14px',
          borderRadius: 10,
          background: 'rgba(96,165,250,0.06)',
          border: '1px solid rgba(96,165,250,0.12)',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 6 }}>
          🤖 AI 洞察
        </div>
        <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6 }}>
          {analysis.insight}
        </div>
        {analysis.suggestion && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#4ade80',
              lineHeight: 1.6,
              borderTop: '1px solid rgba(148,163,184,0.08)',
              paddingTop: 8,
            }}
          >
            💡 建议: {analysis.suggestion}
          </div>
        )}
      </div>

      {/* 预测区域 */}
      {showForecast && forecast && forecast.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(15,23,42,0.25)',
            border: '1px solid rgba(148,163,184,0.08)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 8 }}>
            🔮 预测趋势
          </div>
          {forecast.map((pt, idx) => (
            <ForecastRow key={idx} point={pt} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}

export default SmartTrendAnalysisPanel;
