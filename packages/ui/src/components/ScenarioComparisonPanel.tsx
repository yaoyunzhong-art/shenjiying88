'use client';

import React, { useMemo } from 'react';

// ==================== 类型定义 ====================

export interface ScenarioMetric {
  /** 指标名称 */
  label: string;
  /** 当前值 */
  value: number;
  /** 单位（如 '元', '%', '件'） */
  unit?: string;
  /** 趋势方向 good | bad | neutral */
  trend?: 'good' | 'bad' | 'neutral';
  /** 变化量 */
  delta?: number;
}

export interface ScenarioItem {
  /** 场景名称 */
  name: string;
  /** 场景描述 */
  description?: string;
  /** 场景指标列表 */
  metrics: ScenarioMetric[];
  /** 得分（满分 100） */
  score?: number;
  /** 颜色标识 */
  color?: string;
  /** 是否推荐 */
  recommended?: boolean;
}

export interface ScenarioComparisonPanelProps {
  /** 待比较的场景列表 */
  scenarios: ScenarioItem[];
  /** 面板标题 */
  title?: string;
  /** 加载态 */
  loading?: boolean;
  /** 空态文案 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
  'data-testid'?: string;
}

// ==================== 子组件 ====================

function TrendIcon({ direction }: { direction: 'good' | 'bad' | 'neutral' }) {
  const color =
    direction === 'good' ? '#22c55e' : direction === 'bad' ? '#ef4444' : '#6b7280';
  const d =
    direction === 'good'
      ? 'M5 15l7-7 7 7'
      : direction === 'bad'
      ? 'M19 9l-7 7-7-7'
      : 'M5 12h14';
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 4 }}
    >
      <polyline points={d} />
    </svg>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        backgroundColor: color,
        color: '#fff',
        fontWeight: 700,
        fontSize: 13,
        lineHeight: 1,
      }}
    >
      {score}
    </span>
  );
}

function MetricBar({ value, maxValue, color }: { value: number; maxValue: number; color?: string }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div
      style={{
        width: '100%',
        height: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          backgroundColor: color ?? '#3b82f6',
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

// ==================== 主组件 ====================

/**
 * ScenarioComparisonPanel — 场景对比面板
 * 用于 AI 决策场景中对比不同方案的指标、得分，辅助选择最优方案。
 */
export function ScenarioComparisonPanel({
  scenarios,
  title = '场景对比',
  loading = false,
  emptyText = '暂无场景数据',
  className = '',
  'data-testid': dataTestId = 'scenario-comparison-panel',
}: ScenarioComparisonPanelProps) {
  const maxValues = useMemo(() => {
    if (!scenarios || scenarios.length === 0) return {};
    const metricLabels = scenarios[0]?.metrics.map((m) => m.label) ?? [];
    const map: Record<string, number> = {};
    for (const label of metricLabels) {
      map[label] = Math.max(
        ...scenarios.map((s) => {
          const m = s.metrics.find((x) => x.label === label);
          return m ? Math.abs(m.value) : 0;
        }),
        1,
      );
    }
    return map;
  }, [scenarios]);

  if (loading) {
    return (
      <div
        data-testid={`${dataTestId}-loading`}
        style={{
          padding: 24,
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 80,
              marginBottom: 16,
              borderRadius: 6,
              background:
                'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (!scenarios || scenarios.length === 0) {
    return (
      <div
        data-testid={`${dataTestId}-empty`}
        style={{
          padding: 48,
          textAlign: 'center',
          color: '#9ca3af',
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div
      className={className}
      data-testid={dataTestId}
      style={{
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      {/* 头部标题 */}
      {title && (
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            fontWeight: 600,
            fontSize: 15,
            color: '#111827',
          }}
        >
          {title}
        </div>
      )}

      {/* 场景列表 */}
      <div style={{ padding: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${scenarios.length}, 1fr)`,
            gap: 16,
          }}
        >
          {scenarios.map((scenario, idx) => (
            <div
              key={scenario.name}
              data-testid={`${dataTestId}-scenario-${idx}`}
              style={{
                position: 'relative',
                padding: 16,
                borderRadius: 8,
                border: scenario.recommended
                  ? '2px solid #3b82f6'
                  : '1px solid #e5e7eb',
                background: scenario.recommended ? '#f0f7ff' : '#fafafa',
              }}
            >
              {/* 推荐标签 */}
              {scenario.recommended && (
                <span
                  style={{
                    position: 'absolute',
                    top: -1,
                    right: 12,
                    padding: '2px 8px',
                    borderRadius: '0 0 4px 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#fff',
                    background: '#3b82f6',
                  }}
                >
                  推荐
                </span>
              )}

              {/* 场景名称 + 得分 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                  {scenario.name}
                </span>
                {scenario.score !== undefined && (
                  <ScoreBadge score={scenario.score} />
                )}
              </div>

              {/* 描述 */}
              {scenario.description && (
                <p
                  style={{
                    margin: '0 0 12px',
                    fontSize: 12,
                    color: '#6b7280',
                    lineHeight: 1.5,
                  }}
                >
                  {scenario.description}
                </p>
              )}

              {/* 指标列表 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {scenario.metrics.map((metric) => (
                  <div key={metric.label}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 12, color: '#6b7280' }}>
                        {metric.label}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                        {metric.value}
                        {metric.unit ?? ''}
                        {metric.delta !== undefined && (
                          <span
                            style={{
                              fontSize: 11,
                              color:
                                metric.trend === 'good'
                                  ? '#22c55e'
                                  : metric.trend === 'bad'
                                  ? '#ef4444'
                                  : '#6b7280',
                              marginLeft: 4,
                            }}
                          >
                            {metric.delta > 0 ? '+' : ''}
                            {metric.delta}
                            {metric.unit ?? ''}
                          </span>
                        )}
                        {metric.trend && <TrendIcon direction={metric.trend} />}
                      </span>
                    </div>
                    <MetricBar
                      value={Math.abs(metric.value)}
                      maxValue={maxValues[metric.label] ?? 1}
                      color={scenario.color}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 内联 shimmer 动画 */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
