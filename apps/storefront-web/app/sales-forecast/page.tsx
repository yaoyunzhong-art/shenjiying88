'use client';

import React, { useMemo, useState } from 'react';

import {
  SalesForecastPanel,
  type ForecastDataPoint,
  type ForecastTrend,
  type ForecastAccuracy,
} from '@m5/ui';

// ============================================================
//  Mock 数据 — 门店销售预测
// ============================================================

const NOW = new Date();

function makeForecastDays(count: number): ForecastDataPoint[] {
  const points: ForecastDataPoint[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(NOW);
    d.setDate(d.getDate() + i - 3); // 过去3天 + 未来7天
    const label = d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const predicted = 48000 + Math.round(Math.sin(i * 0.8 + 0.5) * 12000 + (Math.random() - 0.5) * 3000);
    const actual = i < 3 ? predicted + Math.round((Math.random() - 0.5) * 6000) : undefined;
    const optimistic = Math.round(predicted * (1.08 + Math.random() * 0.06));
    const pessimistic = Math.round(predicted * (0.85 + Math.random() * 0.05));
    points.push({ label, predicted, optimistic, pessimistic, actual });
  }
  return points;
}

const FORECAST_DATA = makeForecastDays(10);

const TREND: ForecastTrend = 'up';
const ACCURACY: ForecastAccuracy = 'high';

const FORECAST_STATS = [
  { label: '明日预测', value: '¥52,380', trend: 'up' as const },
  { label: '周同比', value: '+12.5%', trend: 'up' as const },
  { label: '预测置信度', value: '88%', trend: 'neutral' as const },
  { label: '库存建议', value: '补货 3,200 件', trend: 'neutral' as const },
];

type StatTrend = 'up' | 'down' | 'neutral';

// ============================================================
//  销售预测页面
// ============================================================

function renderTrendArrow(trend: StatTrend): React.ReactNode | null {
  if (trend === 'up') return <span style={{ color: '#4ade80', marginLeft: 6 }}>↑</span>;
  if (trend === 'down') return <span style={{ color: '#ef4444', marginLeft: 6 }}>↓</span>;
  return null;
}

export default function SalesForecastPage() {
  const [lastUpdated] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour12: false }));

  const gaugeValue = useMemo(() => {
    const avg = FORECAST_DATA.slice(-7).reduce((s, p) => s + p.predicted, 0) / 7;
    return Math.round((avg / 60000) * 100);
  }, []);

  return (
    <div style={pageStyles.container}>
      {/* 页面标题 */}
      <div style={pageStyles.header}>
        <div>
          <h1 style={pageStyles.title}>📈 销售预测</h1>
          <p style={pageStyles.subtitle}>
            AI 驱动的门店销售趋势分析与预测 · 最后更新 {lastUpdated}
          </p>
        </div>
      </div>

      {/* 快捷指标 */}
      <div style={pageStyles.metrics}>
        {FORECAST_STATS.map((s) => (
          <div key={s.label} style={pageStyles.metricCard}>
            <div style={pageStyles.metricLabel}>{s.label}</div>
            <div style={pageStyles.metricValue}>
              {s.value}
              {renderTrendArrow(s.trend)}
            </div>
          </div>
        ))}
      </div>

      {/* 预测面板 */}
      <div style={pageStyles.panel}>
        <SalesForecastPanel
          dataPoints={FORECAST_DATA}
          trend={TREND}
          accuracy={ACCURACY}
          confidence={88}
          title="Shenjiying 旗舰店 — 7 日销售预测"
          description="基于历史交易、季节因子和会员活跃度的多模型集成预测"
          stats={FORECAST_STATS}
          showChart
          data-testid="sales-forecast-panel"
        />
      </div>

      {/* 底部说明 */}
      <div style={pageStyles.footer}>
        <p>💡 预测数据仅供决策参考，实际销售额可能因天气、节假日、促销活动等因素发生波动。</p>
      </div>
    </div>
  );
}

// ============================================================
//  内联样式
// ============================================================

const pageStyles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1280,
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 28,
  },
  metricCard: {
    borderRadius: 12,
    padding: '16px 20px',
    background: 'rgba(15,23,42,0.35)',
    border: '1px solid rgba(148,163,184,0.1)',
  },
  metricLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  panel: {
    marginBottom: 32,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
    color: '#475569',
    padding: '16px 0',
  },
};
