'use client';

import React, { useMemo, useState, useCallback } from 'react';

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
//  品类级别预测数据
// ============================================================

interface CategoryForecast {
  category: string;
  predictedAmount: number;
  lastWeekAmount: number;
  growthRate: number;
  confidence: number;
  stockSuggestion: string;
}

const CATEGORY_FORECASTS: CategoryForecast[] = [
  { category: '男装', predictedAmount: 18600, lastWeekAmount: 16200, growthRate: 14.8, confidence: 89, stockSuggestion: '加单 420 件' },
  { category: '女装', predictedAmount: 22400, lastWeekAmount: 20100, growthRate: 11.4, confidence: 87, stockSuggestion: '加单 580 件' },
  { category: '童装', predictedAmount: 8200, lastWeekAmount: 7300, growthRate: 12.3, confidence: 85, stockSuggestion: '加单 180 件' },
  { category: '配饰', predictedAmount: 5400, lastWeekAmount: 5100, growthRate: 5.9, confidence: 78, stockSuggestion: '维持库存' },
  { category: '鞋类', predictedAmount: 3800, lastWeekAmount: 3600, growthRate: 5.6, confidence: 76, stockSuggestion: '维持库存' },
];

// ============================================================
//  预测模型数据
// ============================================================

interface ForecastModel {
  name: string;
  accuracy: number;
  mape: number;
  mae: number;
  status: 'active' | 'training' | 'deprecated';
  description: string;
}

const FORECAST_MODELS: ForecastModel[] = [
  { name: 'ARIMA + 季节分解', accuracy: 91, mape: 6.2, mae: 3120, status: 'active', description: '基于历史时序的统计模型' },
  { name: 'LSTM 深度学习', accuracy: 93, mape: 5.8, mae: 2850, status: 'active', description: '多特征深度时序预测' },
  { name: 'Prophet 模型', accuracy: 88, mape: 7.1, mae: 3560, status: 'training', description: 'Facebook 开源预测框架' },
  { name: '集成模型', accuracy: 94, mape: 5.3, mae: 2640, status: 'active', description: '多模型加权集成预测' },
];

// ============================================================
//  季节因子
// ============================================================

interface SeasonalFactor {
  factor: string;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
}

const SEASONAL_FACTORS: SeasonalFactor[] = [
  { factor: '夏季高温', impact: 8, direction: 'positive', description: '持续高温带动夏装、冷饮等品类需求' },
  { factor: '暑假出行', impact: 5, direction: 'positive', description: '旅游旺季带动户外、防晒品类' },
  { factor: '新品上市', impact: 12, direction: 'positive', description: '秋季新品预售预热，转化率预计提升' },
  { factor: '库存压力', impact: -6, direction: 'negative', description: '部分春季款库存积压，需促销清理' },
  { factor: '竞品活动', impact: -4, direction: 'negative', description: '商圈内同类品牌折扣促销活动' },
];

// ============================================================
//  预测准确性历史
// ============================================================

interface AccuracyHistory {
  period: string;
  predicted: number;
  actual: number;
  error: number;
  errorRate: number;
}

const ACCURACY_HISTORY: AccuracyHistory[] = [
  { period: '7月第1周', predicted: 342000, actual: 335800, error: -6200, errorRate: 1.81 },
  { period: '7月第2周', predicted: 358000, actual: 364200, error: 6200, errorRate: 1.70 },
  { period: '7月第3周', predicted: 366000, actual: 356400, error: -9600, errorRate: 2.69 },
  { period: '7月第4周(当前)', predicted: 372000, actual: 368500, error: -3500, errorRate: 0.95 },
];

// ============================================================
//  工具函数
// ============================================================

function renderTrendArrow(trend: StatTrend): React.ReactNode | null {
  if (trend === 'up') return <span style={{ color: '#4ade80', marginLeft: 6 }}>↑</span>;
  if (trend === 'down') return <span style={{ color: '#ef4444', marginLeft: 6 }}>↓</span>;
  return null;
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// ============================================================
//  子组件: 品类预测表格
// ============================================================

function CategoryForecastTable({ forecasts }: { forecasts: CategoryForecast[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => forecasts.filter((f) => f.category.toLowerCase().includes(search.toLowerCase())),
    [forecasts, search],
  );

  return (
    <div style={sectionStyles.card}>
      <div style={sectionStyles.cardHeader}>
        <h3 style={sectionStyles.cardTitle}>📊 品类销售预测</h3>
        <input
          style={sectionStyles.searchInput}
          placeholder="搜索品类…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="category-search-input"
        />
      </div>
      <table style={sectionStyles.table}>
        <thead>
          <tr>
            <th style={sectionStyles.th}>品类</th>
            <th style={sectionStyles.th}>预测额</th>
            <th style={sectionStyles.th}>上周</th>
            <th style={sectionStyles.th}>增长率</th>
            <th style={sectionStyles.th}>置信度</th>
            <th style={sectionStyles.th}>库存建议</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((f) => (
            <tr key={f.category} style={sectionStyles.tr}>
              <td style={sectionStyles.td}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{f.category}</span>
              </td>
              <td style={sectionStyles.td}>{formatCurrency(f.predictedAmount)}</td>
              <td style={sectionStyles.td}>{formatCurrency(f.lastWeekAmount)}</td>
              <td style={sectionStyles.td}>
                <span style={{
                  color: f.growthRate >= 0 ? '#4ade80' : '#ef4444',
                  fontWeight: 600,
                }}>
                  {formatPercent(f.growthRate)}
                </span>
              </td>
              <td style={sectionStyles.td}>
                <div style={sectionStyles.progressBar}>
                  <div
                    style={{
                      ...sectionStyles.progressFill,
                      width: `${f.confidence}%`,
                      background: f.confidence >= 85 ? '#4ade80' : f.confidence >= 70 ? '#fbbf24' : '#f87171',
                    }}
                  />
                  <span style={sectionStyles.progressLabel}>{f.confidence}%</span>
                </div>
              </td>
              <td style={{ ...sectionStyles.td, color: '#94a3b8', fontSize: 13 }}>{f.stockSuggestion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
//  子组件: 预测准确性历史
// ============================================================

function AccuracyHistorySection({ history }: { history: AccuracyHistory[] }) {
  return (
    <div style={sectionStyles.card}>
      <h3 style={sectionStyles.cardTitle}>🎯 预测准确性追踪</h3>
      <table style={sectionStyles.table}>
        <thead>
          <tr>
            <th style={sectionStyles.th}>周期</th>
            <th style={sectionStyles.th}>预测值</th>
            <th style={sectionStyles.th}>实际值</th>
            <th style={sectionStyles.th}>偏差</th>
            <th style={sectionStyles.th}>误差率</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr key={h.period} style={sectionStyles.tr}>
              <td style={sectionStyles.td}>
                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{h.period}</span>
              </td>
              <td style={sectionStyles.td}>{formatCurrency(h.predicted)}</td>
              <td style={sectionStyles.td}>{formatCurrency(h.actual)}</td>
              <td style={sectionStyles.td}>
                <span style={{
                  color: h.error >= 0 ? '#4ade80' : '#ef4444',
                  fontWeight: 600,
                }}>
                  {h.error >= 0 ? '+' : ''}{formatCurrency(Math.abs(h.error))}
                </span>
              </td>
              <td style={sectionStyles.td}>
                <span style={{
                  color: h.errorRate <= 2 ? '#4ade80' : h.errorRate <= 3 ? '#fbbf24' : '#ef4444',
                  fontWeight: 600,
                }}>
                  {h.errorRate.toFixed(2)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
//  子组件: 季节因子面板
// ============================================================

function SeasonalFactorPanel({ factors }: { factors: SeasonalFactor[] }) {
  return (
    <div style={sectionStyles.card}>
      <h3 style={sectionStyles.cardTitle}>🌤️ 季节因子分析</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {factors.map((f) => (
          <div
            key={f.factor}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 10,
              background: 'rgba(15,23,42,0.25)',
              border: '1px solid rgba(148,163,184,0.08)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>
                {f.factor}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{f.description}</div>
            </div>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: f.direction === 'positive' ? '#4ade80' : f.direction === 'negative' ? '#ef4444' : '#94a3b8',
            }}>
              {f.direction === 'positive' ? '↑' : f.direction === 'negative' ? '↓' : '→'}
              {' '}{Math.abs(f.impact)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
//  子组件: 预测模型对比
// ============================================================

function ModelComparisonSection({ models }: { models: ForecastModel[] }) {
  return (
    <div style={sectionStyles.card}>
      <h3 style={sectionStyles.cardTitle}>🤖 预测模型对比</h3>
      <table style={sectionStyles.table}>
        <thead>
          <tr>
            <th style={sectionStyles.th}>模型</th>
            <th style={sectionStyles.th}>准确率</th>
            <th style={sectionStyles.th}>MAPE</th>
            <th style={sectionStyles.th}>MAE</th>
            <th style={sectionStyles.th}>状态</th>
          </tr>
        </thead>
        <tbody>
          {models.map((m) => (
            <tr key={m.name} style={sectionStyles.tr}>
              <td style={sectionStyles.td}>
                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{m.description}</div>
              </td>
              <td style={sectionStyles.td}>
                <span style={{ color: '#4ade80', fontWeight: 600 }}>{m.accuracy}%</span>
              </td>
              <td style={{ ...sectionStyles.td, color: '#94a3b8' }}>{m.mape}%</td>
              <td style={{ ...sectionStyles.td, color: '#94a3b8' }}>{formatCurrency(m.mae)}</td>
              <td style={sectionStyles.td}>
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    background: m.status === 'active' ? 'rgba(74,222,128,0.15)' : m.status === 'training' ? 'rgba(251,191,36,0.15)' : 'rgba(148,163,184,0.15)',
                    color: m.status === 'active' ? '#4ade80' : m.status === 'training' ? '#fbbf24' : '#64748b',
                  }}
                >
                  {m.status === 'active' ? '运行中' : m.status === 'training' ? '训练中' : '已弃用'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
//  内联样式 (section 组件共享)
// ============================================================

const sectionStyles: Record<string, React.CSSProperties> = {
  card: {
    borderRadius: 14,
    padding: '20px 22px',
    background: 'rgba(15,23,42,0.30)',
    border: '1px solid rgba(148,163,184,0.08)',
    marginBottom: 20,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: '#e2e8f0',
  },
  searchInput: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid rgba(148,163,184,0.15)',
    background: 'rgba(15,23,42,0.4)',
    color: '#e2e8f0',
    fontSize: 13,
    outline: 'none',
    width: 180,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  th: {
    padding: '10px 12px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#64748b',
    borderBottom: '1px solid rgba(148,163,184,0.1)',
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tr: {
    borderBottom: '1px solid rgba(148,163,184,0.06)',
  },
  td: {
    padding: '12px 12px',
    color: '#cbd5e1',
  },
  progressBar: {
    position: 'relative' as const,
    width: 80,
    height: 18,
    borderRadius: 9,
    background: 'rgba(148,163,184,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9,
    transition: 'width 0.3s',
  },
  progressLabel: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 600,
    color: '#0f172a',
  },
};

// ============================================================
//  销售预测页面
// ============================================================

export default function SalesForecastPage() {
  const [lastUpdated] = useState(() => new Date().toLocaleTimeString('zh-CN', { hour12: false }));
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

      {/* 品类预测表格 + 季节因子 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 20 }}>
        <CategoryForecastTable forecasts={CATEGORY_FORECASTS} />
        <SeasonalFactorPanel factors={SEASONAL_FACTORS} />
      </div>

      {/* 预测模型对比 + 准确性历史 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <ModelComparisonSection models={FORECAST_MODELS} />
        <AccuracyHistorySection history={ACCURACY_HISTORY} />
      </div>

      {/* 底部说明 */}
      <div style={pageStyles.footer}>
        <p>💡 预测数据仅供决策参考，实际销售额可能因天气、节假日、促销活动等因素发生波动。</p>
      </div>
    </div>
  );
}

// ============================================================
//  内联样式 (主页面)
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
