'use client';

import React, { useMemo } from 'react';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { GaugeChart } from './GaugeChart';
import type { GaugeSegment } from './GaugeChart';

// ==================== 类型定义 ====================

/** 单个时段的预测数据点 */
export interface ForecastDataPoint {
  /** 时段标签, 如 "6月24日" 或 "Week 26" */
  label: string;
  /** 预测值 */
  predicted: number;
  /** 乐观预测值 (置信上限) */
  optimistic: number;
  /** 悲观预测值 (置信下限) */
  pessimistic: number;
  /** 实际值 (如果有历史数据) */
  actual?: number;
}

/** 预测趋势 */
export type ForecastTrend = 'up' | 'down' | 'stable';

/** 预测准确性评级 */
export type ForecastAccuracy = 'high' | 'medium' | 'low';

/** 销售预测面板 Props */
export interface SalesForecastPanelProps {
  /** 预测数据点列表 (建议 5-12 个) */
  dataPoints: ForecastDataPoint[];
  /** 当前预测整体趋势 */
  trend: ForecastTrend;
  /** 预测准确度 */
  accuracy: ForecastAccuracy;
  /** 预测置信度百分比 (0-100) */
  confidence: number;
  /** 面板标题 */
  title?: string;
  /** 摘要描述 */
  description?: string;
  /** 额外统计数据 */
  stats?: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  /** 是否显示预测图表 */
  showChart?: boolean;
  /** 自定义底部操作 */
  footerActions?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** Test id */
  'data-testid'?: string;
}

// ==================== 工具函数 ====================

const TREND_LABELS: Record<ForecastTrend, string> = {
  up: '📈 上升趋势',
  down: '📉 下降趋势',
  stable: '➡️ 平稳趋势',
};

const TREND_BADGE_COLORS: Record<ForecastTrend, 'success' | 'error' | 'warning'> = {
  up: 'success',
  down: 'error',
  stable: 'warning',
};

const ACCURACY_LABELS: Record<ForecastAccuracy, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const ACCURACY_COLORS: Record<ForecastAccuracy, 'success' | 'warning' | 'error'> = {
  high: 'success',
  medium: 'warning',
  low: 'error',
};

const FORECAST_CHART_COLORS = {
  line: '#60a5fa',
  areaOptimistic: 'rgba(96, 165, 250, 0.12)',
  areaPessimistic: 'rgba(96, 165, 250, 0.06)',
  actual: '#4ade80',
  grid: 'rgba(148, 163, 184, 0.08)',
  text: 'rgba(148, 163, 184, 0.6)',
};

/** 计算置信区间段 (给仪表盘用) */
const ACCURACY_GAUGE_SEGMENTS: GaugeSegment[] = [
  { from: 0, to: 50, color: '#f87171', label: '偏低' },
  { from: 50, to: 75, color: '#fbbf24', label: '中等' },
  { from: 75, to: 100, color: '#4ade80', label: '高置信' },
];

// ==================== 图表组件 ====================

interface ForecastChartProps {
  dataPoints: ForecastDataPoint[];
  height?: number;
}

function ForecastChart({ dataPoints, height = 220 }: ForecastChartProps) {
  if (!dataPoints || dataPoints.length < 2) return null;

  const padding = { top: 20, right: 16, bottom: 28, left: 50 };
  const chartWidth = 600;
  const chartHeight = height;

  const allValues = dataPoints.flatMap((d) => [d.optimistic, d.pessimistic, d.actual ?? d.predicted, d.predicted]);
  const minVal = Math.min(...allValues) * 0.95;
  const maxVal = Math.max(...allValues) * 1.05;
  const range = maxVal - minVal || 1;

  const xScale = (i: number) => padding.left + (i / Math.max(dataPoints.length - 1, 1)) * (chartWidth - padding.left - padding.right);
  const yScale = (v: number) => padding.top + (1 - (v - minVal) / range) * (chartHeight - padding.top - padding.bottom);

  const optimisticPoints = dataPoints.map((d, i) => `${xScale(i)},${yScale(d.optimistic)}`).join(' ');
  const pessimisticPoints = [...dataPoints].reverse().map((d, i) => `${xScale(dataPoints.length - 1 - i)},${yScale(d.pessimistic)}`).join(' ');

  const linePoints = dataPoints.map((d, i) => `${xScale(i)},${yScale(d.predicted)}`).join(' ');
  const actualPoints = dataPoints.filter((d) => d.actual !== undefined).map((d, i) => {
    const idx = dataPoints.indexOf(d);
    return `${xScale(idx)},${yScale(d.actual!)}`;
  });

  // Y轴刻度线
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => minVal + (range * i) / (yTicks - 1));

  // X轴刻度 (取首尾 + 中间一个)
  const xTickIndices = dataPoints.length <= 4
    ? dataPoints.map((_, i) => i)
    : [0, Math.floor(dataPoints.length / 2), dataPoints.length - 1];

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      preserveAspectRatio="xMidYMid meet"
      data-testid="forecast-chart-svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* 网格线 - Y轴 */}
      {yTickValues.map((v, i) => (
        <g key={`grid-${i}`}>
          <line
            x1={padding.left}
            y1={yScale(v)}
            x2={chartWidth - padding.right}
            y2={yScale(v)}
            stroke={FORECAST_CHART_COLORS.grid}
            strokeWidth={1}
          />
          <text
            x={padding.left - 6}
            y={yScale(v) + 4}
            textAnchor="end"
            fill={FORECAST_CHART_COLORS.text}
            fontSize={10}
          >
            {v >= 10000 ? `${(v / 10000).toFixed(1)}w` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}
          </text>
        </g>
      ))}

      {/* 置信区间填充 */}
      <polygon
        points={`${optimisticPoints} ${pessimisticPoints}`}
        fill={FORECAST_CHART_COLORS.areaOptimistic}
        data-testid="forecast-confidence-band"
      />

      {/* 预测线 */}
      <polyline
        points={linePoints}
        fill="none"
        stroke={FORECAST_CHART_COLORS.line}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-testid="forecast-line"
      />

      {/* 预测线上的点 */}
      {dataPoints.map((d, i) => (
        <circle
          key={`dot-${i}`}
          cx={xScale(i)}
          cy={yScale(d.predicted)}
          r={3}
          fill={FORECAST_CHART_COLORS.line}
          data-testid={`forecast-dot-${i}`}
        />
      ))}

      {/* 实际值散点 */}
      {dataPoints.filter((d) => d.actual !== undefined).map((d, i) => {
        const idx = dataPoints.indexOf(d);
        return (
          <circle
            key={`actual-${i}`}
            cx={xScale(idx)}
            cy={yScale(d.actual!)}
            r={4}
            fill={FORECAST_CHART_COLORS.actual}
            stroke="#1e293b"
            strokeWidth={1.5}
            data-testid={`forecast-actual-dot-${i}`}
          />
        );
      })}

      {/* X轴标签 */}
      {xTickIndices.map((i) => (
        <text
          key={`xlabel-${i}`}
          x={xScale(i)}
          y={chartHeight - 4}
          textAnchor="middle"
          fill={FORECAST_CHART_COLORS.text}
          fontSize={10}
        >
          {dataPoints[i]?.label ?? ''}
        </text>
      ))}
    </svg>
  );
}

// ==================== 主组件 ====================

export function SalesForecastPanel({
  dataPoints,
  trend,
  accuracy,
  confidence,
  title = '销售预测',
  description,
  stats,
  showChart = true,
  footerActions,
  'data-testid': testId,
}: SalesForecastPanelProps) {
  const lastPoint = useMemo(() => dataPoints[dataPoints.length - 1], [dataPoints]);

  return (
    <Card
      title={title}
      subtitle={description}
      data-testid={testId ?? 'sales-forecast-panel'}
      headerActions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <StatusBadge
            variant={TREND_BADGE_COLORS[trend]}
            label={TREND_LABELS[trend]}
          />
          <StatusBadge
            variant={ACCURACY_COLORS[accuracy]}
            label={`准确度: ${ACCURACY_LABELS[accuracy]}`}
          />
        </div>
      }
      footer={footerActions ? <div style={{ paddingTop: 12 }}>{footerActions}</div> : undefined}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 核心预测摘要 */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.7)', marginBottom: 4 }}>
              下一期预测
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', lineHeight: 1.2 }}>
              {lastPoint ? (
                <>
                  ¥{lastPoint.predicted >= 10000
                    ? (lastPoint.predicted / 10000).toFixed(1) + 'w'
                    : lastPoint.predicted.toLocaleString()}
                  <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(148, 163, 184, 0.5)', marginLeft: 8 }}>
                    区间 {lastPoint.pessimistic >= 10000
                      ? (lastPoint.pessimistic / 10000).toFixed(1) + 'w'
                      : lastPoint.pessimistic.toLocaleString()}
                    ~{lastPoint.optimistic >= 10000
                      ? (lastPoint.optimistic / 10000).toFixed(1) + 'w'
                      : lastPoint.optimistic.toLocaleString()}
                  </span>
                </>
              ) : (
                '—'
              )}
            </div>
          </div>
          <div style={{ width: 140 }}>
            <div style={{ fontSize: 12, color: 'rgba(148, 163, 184, 0.7)', marginBottom: 4 }}>
              置信度
            </div>
            <GaugeChart
              value={confidence}
              min={0}
              max={100}
              segments={ACCURACY_GAUGE_SEGMENTS}
              size={100}
            />
          </div>
        </div>

        {/* 预测趋势图表 */}
        {showChart && dataPoints.length >= 2 && (
          <div style={{ marginTop: 8 }}>
            <ForecastChart dataPoints={dataPoints} />
          </div>
        )}

        {/* 额外统计数据 */}
        {stats && stats.length > 0 && (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
            {stats.map((stat, i) => (
              <div
                key={i}
                style={{
                  flex: '1 1 120px',
                  padding: '10px 14px',
                  background: 'rgba(15, 23, 42, 0.3)',
                  borderRadius: 8,
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                }}
              >
                <div style={{ fontSize: 11, color: 'rgba(148, 163, 184, 0.6)', marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>
                  {stat.value}
                  {stat.trend && (
                    <span style={{ marginLeft: 6, fontSize: 14 }}>
                      {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 无数据时占位 */}
        {dataPoints.length === 0 && (
          <div
            data-testid="sales-forecast-empty"
            style={{
              textAlign: 'center',
              padding: '32px 16px',
              color: 'rgba(148, 163, 184, 0.5)',
              fontSize: 14,
            }}
          >
            暂无预测数据
          </div>
        )}
      </div>
    </Card>
  );
}
