'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

/** 单个预测数据点 */
export interface CampaignTrendForecastPoint {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

/** 历史数据点 */
export interface CampaignTrendHistoricalPoint {
  date: string;
  actual: number;
}

/** 模型元信息 */
export interface CampaignTrendModelInfo {
  modelName: string;
  accuracy: number;
  confidence: 'high' | 'medium' | 'low';
}

/** 影响因子 */
export interface CampaignTrendImpactFactor {
  factor: string;
  direction: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

/** 趋势预报面板 Props */
export interface CampaignTrendForecastProps {
  /** 指标标题（如"销售额预测"） */
  title: string;
  /** 指标单位 */
  unit?: string;
  /** 历史数据 */
  historical: CampaignTrendHistoricalPoint[];
  /** 预测数据 */
  forecast: CampaignTrendForecastPoint[];
  /** AI 模型信息 */
  modelInfo?: CampaignTrendModelInfo;
  /** 影响因子 */
  impactFactors?: CampaignTrendImpactFactor[];
  /** 数据上次更新时间 */
  updatedAt?: string;
  /** AI 结论 */
  aiConclusion?: string;
  /** 加载状态 */
  loading?: boolean;
  /** 空状态文案 */
  emptyText?: string;
  /** 错误状态 */
  error?: string;
  /** 类名 */
  className?: string;
}

// ==================== 常量 ====================

const DEFAULT_EMPTY_TEXT = '暂无预测数据';
const FORECAST_COLOR = '#3b82f6';
const BOUNDARY_COLOR = 'rgba(59, 130, 246, 0.08)';
const HISTORICAL_COLOR = '#6b7280';

const CONFIDENCE_LABELS: Record<string, string> = {
  high: '高置信度',
  medium: '中置信度',
  low: '低置信度',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
};

const DIRECTION_LABELS: Record<string, string> = {
  positive: '正向',
  negative: '负向',
  neutral: '中性',
};

const DIRECTION_COLORS: Record<string, string> = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280',
};

const DIRECTION_ICONS: Record<string, string> = {
  positive: '↑',
  negative: '↓',
  neutral: '→',
};

// ==================== 内联 SVG 迷你趋势图 ====================

function MiniTrendChart({
  historical,
  forecast,
  width = 280,
  height = 100,
}: {
  historical: CampaignTrendHistoricalPoint[];
  forecast: CampaignTrendForecastPoint[];
  width?: number;
  height?: number;
}) {
  const all = useMemo(() => {
    const h = historical.map((p) => ({ date: p.date, value: p.actual }));
    const f = forecast.map((p) => ({ date: p.date, value: p.predicted }));
    return [...h, ...f];
  }, [historical, forecast]);

  const { yMin, yMax, chartW, chartH } = useMemo(() => {
    if (all.length < 2) return { yMin: 0, yMax: 100, chartW: width, chartH: height };

    const values = all.map((p) => p.value);
    const fVals = forecast.map((p) => [p.lowerBound, p.upperBound]).flat();
    const min = Math.min(...values, ...fVals);
    const max = Math.max(...values, ...fVals);
    const padding = (max - min) * 0.15 || 1;
    const yMinVal = min - padding;
    const yMaxVal = max + padding;
    const padL = 30;
    const padR = 10;
    const padT = 10;
    const padB = 20;
    const cw = width - padL - padR;
    const ch = height - padT - padB;

    return { yMin: yMinVal, yMax: yMaxVal, chartW: width, chartH: height };
  }, [all, forecast, width, height]);

  if (all.length < 2) return null;

  const splitIdx = historical.length;
  const padL = 30;
  const cw = chartW - 40;
  const padT = 10;
  const ch = chartH - 30;

  const xScale = (i: number) => padL + (i / Math.max(all.length - 1, 1)) * cw;
  const yScale = (v: number) => padT + ch - ((v - yMin) / (yMax - yMin)) * ch;

  return (
    <svg width={chartW} height={chartH} style={{ display: 'block', maxWidth: '100%' }}>
      {/* 预测置信带 */}
      {forecast.length > 0 && (
        <polygon
          points={(() => {
            const pts: string[] = [];
            forecast.forEach((p, i) => {
              const x = xScale(splitIdx + i);
              pts.push(`${x},${yScale(p.upperBound)}`);
            });
            [...forecast].reverse().forEach((p, i) => {
              const idx = forecast.length - 1 - i;
              pts.push(`${xScale(splitIdx + idx)},${yScale(p.lowerBound)}`);
            });
            return pts.join(' ');
          })()}
          fill={BOUNDARY_COLOR}
        />
      )}

      {/* 历史折线 */}
      <polyline
        points={historical.map((p, i) => `${xScale(i)},${yScale(p.actual)}`).join(' ')}
        fill="none"
        stroke={HISTORICAL_COLOR}
        strokeWidth={1.5}
        strokeDasharray="4 2"
      />

      {/* 预测折线 */}
      <polyline
        points={forecast.map((p, i) => `${xScale(splitIdx + i)},${yScale(p.predicted)}`).join(' ')}
        fill="none"
        stroke={FORECAST_COLOR}
        strokeWidth={2}
      />

      {/* Y轴数字 */}
      <text x={5} y={chartH - 20} fontSize={8} fill="#9ca3af">{yMin.toFixed(0)}</text>
      <text x={5} y={12} fontSize={8} fill="#9ca3af">{yMax.toFixed(0)}</text>

      {/* 分割竖线 */}
      {splitIdx > 0 && splitIdx < all.length && (
        <line
          x1={xScale(splitIdx)}
          y1={10} y2={chartH - 10}
          stroke="#d1d5db"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
    </svg>
  );
}

// ==================== 主体组件 ====================

export function CampaignTrendForecast({
  title,
  unit,
  historical,
  forecast,
  modelInfo,
  impactFactors,
  updatedAt,
  aiConclusion,
  loading = false,
  emptyText = DEFAULT_EMPTY_TEXT,
  error,
  className,
}: CampaignTrendForecastProps) {
  const isEmpty = !loading && historical.length === 0 && forecast.length === 0;

  // 计算总体趋势方向
  const overallTrend = useMemo(() => {
    if (forecast.length < 2) return 'flat' as const;
    const first = forecast[0]!.predicted;
    const last = forecast[forecast.length - 1]!.predicted;
    const diff = last - first;
    if (diff > 0) return 'up' as const;
    if (diff < 0) return 'down' as const;
    return 'flat' as const;
  }, [forecast]);

  if (loading) {
    return (
      <div className={className} style={styles.wrapper}>
        <div style={styles.header}>
          <div style={{ width: 120, height: 20, background: '#e5e7eb', borderRadius: 4 }} />
        </div>
        <div style={{ marginTop: 16, width: '100%', height: 100, background: '#f3f4f6', borderRadius: 8 }} />
        <div style={{ marginTop: 12, width: '60%', height: 14, background: '#e5e7eb', borderRadius: 4 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={styles.wrapper}>
        <div style={styles.errorBlock}>
          <span style={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className} style={styles.wrapper}>
        <div style={styles.emptyBlock}>
          <span style={{ fontSize: 32 }}>📊</span>
          <p style={{ margin: '8px 0 0', color: '#9ca3af', fontSize: 14 }}>{emptyText}</p>
        </div>
      </div>
    );
  }

  // 最新预测值
  const latestForecast = forecast.length > 0 ? forecast[forecast.length - 1] : null;
  const latestHistorical = historical.length > 0 ? historical[historical.length - 1] : null;

  return (
    <div className={className} style={styles.wrapper}>
      {/* 标题栏 */}
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        {updatedAt && (
          <span style={styles.updatedAt}>更新于 {updatedAt}</span>
        )}
      </div>

      {/* 核心数据 */}
      <div style={styles.coreRow}>
        {latestForecast && (
          <div>
            <span style={styles.coreLabel}>预测值</span>
            <div>
              <span style={styles.coreValue}>{latestForecast.predicted.toLocaleString()}</span>
              {unit && <span style={styles.unit}>{unit}</span>}
            </div>
            <span style={styles.coreRange}>
              区间 {latestForecast.lowerBound.toLocaleString()} ~ {latestForecast.upperBound.toLocaleString()}
            </span>
          </div>
        )}
        {latestHistorical && (
          <div style={{ textAlign: 'right' }}>
            <span style={styles.coreLabel}>实际值</span>
            <div>
              <span style={{ ...styles.coreValue, fontSize: 22, color: HISTORICAL_COLOR }}>
                {latestHistorical.actual.toLocaleString()}
              </span>
              {unit && <span style={styles.unit}>{unit}</span>}
            </div>
            {overallTrend === 'up' && <span style={{ ...styles.trendBadge, background: '#dcfce7', color: '#16a34a' }}>↑ 上升趋势</span>}
            {overallTrend === 'down' && <span style={{ ...styles.trendBadge, background: '#fee2e2', color: '#dc2626' }}>↓ 下降趋势</span>}
          </div>
        )}
      </div>

      {/* 迷你趋势图 */}
      <div style={styles.chartContainer}>
        <MiniTrendChart historical={historical} forecast={forecast} />
      </div>

      {/* 模型信息 */}
      {modelInfo && (
        <div style={styles.modelBar}>
          <span style={styles.modelLabel}>模型：{modelInfo.modelName}</span>
          <span style={{ ...styles.confBadge, color: CONFIDENCE_COLORS[modelInfo.confidence], borderColor: CONFIDENCE_COLORS[modelInfo.confidence] }}>
            {CONFIDENCE_LABELS[modelInfo.confidence]} {modelInfo.confidence === 'low' ? '' : `${(modelInfo.accuracy * 100).toFixed(0)}%`}
          </span>
        </div>
      )}

      {/* 影响因子 */}
      {impactFactors && impactFactors.length > 0 && (
        <div style={styles.factorsSection}>
          <span style={styles.factorsTitle}>关键影响因子</span>
          {impactFactors.map((factor, i) => (
            <div key={i} style={styles.factorRow}>
              <span style={styles.factorName}>{factor.factor}</span>
              <span style={{ ...styles.factorDirection, color: DIRECTION_COLORS[factor.direction] }}>
                {DIRECTION_ICONS[factor.direction]} {DIRECTION_LABELS[factor.direction]}
              </span>
              <div style={styles.weightBarBg}>
                <div style={{ ...styles.weightBarFill, width: `${factor.weight * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI 结论 */}
      {aiConclusion && (
        <div style={styles.aiConclusion}>
          <span style={styles.aiLabel}>🤖 AI 分析结论</span>
          <p style={styles.aiText}>{aiConclusion}</p>
        </div>
      )}
    </div>
  );
}

// ==================== 样式 ====================

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    lineHeight: 1.5,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
  },
  updatedAt: {
    fontSize: 12,
    color: '#9ca3af',
  },
  coreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  coreLabel: {
    fontSize: 12,
    color: '#6b7280',
    display: 'block',
    marginBottom: 4,
  },
  coreValue: {
    fontSize: 26,
    fontWeight: 700,
    color: FORECAST_COLOR,
  },
  unit: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  coreRange: {
    display: 'block',
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  trendBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontWeight: 600,
    marginTop: 6,
  },
  chartContainer: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  modelBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  modelLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 500,
  },
  confBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid',
  },
  factorsSection: {
    marginBottom: 12,
  },
  factorsTitle: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 8,
  },
  factorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  factorName: {
    flex: '0 0 100px',
    fontSize: 12,
    color: '#374151',
  },
  factorDirection: {
    flex: '0 0 50px',
    fontSize: 12,
    fontWeight: 500,
  },
  weightBarBg: {
    flex: 1,
    height: 6,
    background: '#e5e7eb',
    borderRadius: 3,
  },
  weightBarFill: {
    height: '100%',
    background: FORECAST_COLOR,
    borderRadius: 3,
  },
  aiConclusion: {
    padding: 12,
    background: '#f0f9ff',
    borderRadius: 8,
    border: '1px solid #e0f2fe',
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0369a1',
    display: 'block',
    marginBottom: 4,
  },
  aiText: {
    margin: 0,
    fontSize: 13,
    color: '#0c4a6e',
    lineHeight: 1.6,
  },
  errorBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    background: '#fef2f2',
    borderRadius: 8,
    color: '#dc2626',
    fontSize: 14,
  },
  errorIcon: {
    fontSize: 18,
  },
  emptyBlock: {
    textAlign: 'center',
    padding: '32px 16px',
  },
};
