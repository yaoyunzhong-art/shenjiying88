'use client';

import React, { useState, useMemo } from 'react';
import {
  StatCard,
  QuickStats,
  GaugeChart,
  HeatmapChart,
  StatusBadge,
  type QuickStatItem,
  type GaugeSegment,
  type HeatmapCell,
} from '@m5/ui';

// ============================================================
//  Types
// ============================================================

export interface KpiCard {
  label: string;
  value: string;
  trend: number;
  unit?: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}

export interface HourlyTraffic {
  hour: number;
  visitors: number;
  transactions: number;
  revenue: number;
}

export interface CategoryMetric {
  category: string;
  sales: number;
  revenue: number;
  percentage: number;
  growth: number;
}

export interface DailyComparison {
  date: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  visitors: number;
}

export interface AnomalyRecord {
  id: string;
  metric: string;
  expected: number;
  actual: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  resolved: boolean;
}

// ============================================================
//  Gauge segments
// ============================================================

const REVENUE_SEGMENTS: GaugeSegment[] = [
  { from: 0, to: 50, color: '#f87171', label: '偏低' },
  { from: 50, to: 80, color: '#fbbf24', label: '正常' },
  { from: 80, to: 100, color: '#4ade80', label: '优秀' },
];

const SATISFACTION_SEGMENTS: GaugeSegment[] = [
  { from: 0, to: 60, color: '#f87171', label: '待改善' },
  { from: 60, to: 85, color: '#fbbf24', label: '良好' },
  { from: 85, to: 100, color: '#4ade80', label: '优秀' },
];

// ============================================================
//  Mock Data
// ============================================================

const MOCK_KPI_CARDS: KpiCard[] = [
  { label: '今日营收', value: '¥12,580', trend: 8.3, unit: '元', variant: 'success' },
  { label: '今日订单', value: '86', trend: 5.1, unit: '单', variant: 'success' },
  { label: '客单价', value: '¥286', trend: -2.4, unit: '元', variant: 'warning' },
  { label: '到店客流', value: '342', trend: 12.7, unit: '人', variant: 'success' },
  { label: '转化率', value: '25.1%', trend: -0.8, unit: '%', variant: 'warning' },
  { label: '会员消费占比', value: '62.3%', trend: 3.5, unit: '%', variant: 'success' },
];

const MOCK_HOURLY_TRAFFIC: HourlyTraffic[] = [
  { hour: 8, visitors: 12, transactions: 5, revenue: 680 },
  { hour: 9, visitors: 28, transactions: 14, revenue: 2100 },
  { hour: 10, visitors: 45, transactions: 22, revenue: 3850 },
  { hour: 11, visitors: 62, transactions: 30, revenue: 5200 },
  { hour: 12, visitors: 78, transactions: 38, revenue: 6800 },
  { hour: 13, visitors: 55, transactions: 28, revenue: 4600 },
  { hour: 14, visitors: 48, transactions: 24, revenue: 4100 },
  { hour: 15, visitors: 52, transactions: 26, revenue: 4350 },
  { hour: 16, visitors: 68, transactions: 34, revenue: 5800 },
  { hour: 17, visitors: 85, transactions: 42, revenue: 7200 },
  { hour: 18, visitors: 92, transactions: 46, revenue: 8100 },
  { hour: 19, visitors: 88, transactions: 44, revenue: 7650 },
  { hour: 20, visitors: 72, transactions: 36, revenue: 6200 },
  { hour: 21, visitors: 45, transactions: 22, revenue: 3800 },
  { hour: 22, visitors: 22, transactions: 10, revenue: 1650 },
];

const MOCK_CATEGORY_METRICS: CategoryMetric[] = [
  { category: '饮品', sales: 286, revenue: 8580, percentage: 28.6, growth: 12.4 },
  { category: '轻食', sales: 198, revenue: 5940, percentage: 19.8, growth: 8.2 },
  { category: '甜品', sales: 145, revenue: 4350, percentage: 14.5, growth: -3.1 },
  { category: '套餐', sales: 112, revenue: 5600, percentage: 18.7, growth: 15.6 },
  { category: '会员权益', sales: 86, revenue: 4150, percentage: 13.8, growth: 22.8 },
  { category: '其他', sales: 52, revenue: 1360, percentage: 4.6, growth: -1.5 },
];

const MOCK_DAILY_COMPARISON: DailyComparison[] = [
  { date: '2026-07-13', revenue: 48200, orders: 86, avgOrderValue: 560, visitors: 210 },
  { date: '2026-07-14', revenue: 51300, orders: 92, avgOrderValue: 558, visitors: 235 },
  { date: '2026-07-15', revenue: 46800, orders: 84, avgOrderValue: 557, visitors: 220 },
  { date: '2026-07-16', revenue: 55600, orders: 98, avgOrderValue: 567, visitors: 265 },
  { date: '2026-07-17', revenue: 61200, orders: 105, avgOrderValue: 583, visitors: 290 },
  { date: '2026-07-18', revenue: 58900, orders: 102, avgOrderValue: 577, visitors: 280 },
  { date: '2026-07-19', revenue: 44500, orders: 78, avgOrderValue: 570, visitors: 195 },
];

const MOCK_ANOMALIES: AnomalyRecord[] = [
  { id: 'an-01', metric: '客单价', expected: 570, actual: 286, deviation: -49.8, severity: 'high', timestamp: '2026-07-19T10:30:00Z', resolved: false },
  { id: 'an-02', metric: '夜间订单', expected: 15, actual: 35, deviation: 133.3, severity: 'medium', timestamp: '2026-07-19T06:00:00Z', resolved: true },
  { id: 'an-03', metric: '退款率', expected: 3.0, actual: 7.8, deviation: 160, severity: 'high', timestamp: '2026-07-18T18:00:00Z', resolved: false },
  { id: 'an-04', metric: '库存周转', expected: 15, actual: 8, deviation: -46.7, severity: 'medium', timestamp: '2026-07-17T12:00:00Z', resolved: false },
  { id: 'an-05', metric: '会员活跃', expected: 180, actual: 145, deviation: -19.4, severity: 'low', timestamp: '2026-07-16T20:00:00Z', resolved: true },
  { id: 'an-06', metric: '支付成功率', expected: 99.0, actual: 96.2, deviation: -2.8, severity: 'low', timestamp: '2026-07-15T14:00:00Z', resolved: false },
];

// ============================================================
//  Pure helper functions (mirrored in page.test.ts)
// ============================================================

export function computeKpiTotals(kpis: KpiCard[]): { positiveTrends: number; negativeTrends: number; avgTrend: number } {
  const positiveTrends = kpis.filter(k => k.trend > 0).length;
  const negativeTrends = kpis.filter(k => k.trend < 0).length;
  const avgTrend = kpis.length > 0 ? Math.round(kpis.reduce((s, k) => s + k.trend, 0) / kpis.length * 10) / 10 : 0;
  return { positiveTrends, negativeTrends, avgTrend };
}

export function computePeakHour(traffic: HourlyTraffic[]): { hour: number; visitors: number; revenue: number } | null {
  if (traffic.length === 0) return null;
  return traffic.reduce((peak, curr) => curr.visitors > peak.visitors ? curr : peak, traffic[0]);
}

export function computeCategoryInsights(categories: CategoryMetric[]): {
  totalSales: number;
  totalRevenue: number;
  topCategory: string;
  positiveGrowth: number;
  negativeGrowth: number;
} {
  const totalSales = categories.reduce((s, c) => s + c.sales, 0);
  const totalRevenue = categories.reduce((s, c) => s + c.revenue, 0);
  const topCategory = categories.reduce((best, c) => c.sales > best.sales ? c : best, categories[0]).category;
  const positiveGrowth = categories.filter(c => c.growth > 0).length;
  const negativeGrowth = categories.filter(c => c.growth < 0).length;
  return { totalSales, totalRevenue, topCategory, positiveGrowth, negativeGrowth };
}

export function computeDailyAverages(days: DailyComparison[]): {
  avgRevenue: number;
  avgOrders: number;
  avgAOV: number;
  avgVisitors: number;
  maxRevenueDay: string;
  minRevenueDay: string;
} {
  if (days.length === 0) {
    return { avgRevenue: 0, avgOrders: 0, avgAOV: 0, avgVisitors: 0, maxRevenueDay: '', minRevenueDay: '' };
  }
  const avgRevenue = Math.round(days.reduce((s, d) => s + d.revenue, 0) / days.length);
  const avgOrders = Math.round(days.reduce((s, d) => s + d.orders, 0) / days.length);
  const avgAOV = Math.round(days.reduce((s, d) => s + d.avgOrderValue, 0) / days.length);
  const avgVisitors = Math.round(days.reduce((s, d) => s + d.visitors, 0) / days.length);
  const max = days.reduce((a, b) => a.revenue > b.revenue ? a : b);
  const min = days.reduce((a, b) => a.revenue < b.revenue ? a : b);
  return { avgRevenue, avgOrders, avgAOV, avgVisitors, maxRevenueDay: max.date, minRevenueDay: min.date };
}

export function computeRevenueGrowth(days: DailyComparison[]): number {
  if (days.length < 2) return 0;
  const mid = Math.floor(days.length / 2);
  const firstHalf = days.slice(0, mid).reduce((s, d) => s + d.revenue, 0);
  const secondHalf = days.slice(mid).reduce((s, d) => s + d.revenue, 0);
  if (firstHalf === 0) return 0;
  return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
}

export function countUnresolvedAnomalies(anomalies: AnomalyRecord[]): number {
  return anomalies.filter(a => !a.resolved).length;
}

export function filterAnomaliesBySeverity(anomalies: AnomalyRecord[], severity: 'low' | 'medium' | 'high'): AnomalyRecord[] {
  return anomalies.filter(a => a.severity === severity);
}

export function anomalySeverityWeight(severity: 'low' | 'medium' | 'high'): number {
  const map = { low: 1, medium: 2, high: 3 };
  return map[severity];
}

// ============================================================
//  Component
// ============================================================

export default function AnalyticsPage() {
  const [selectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const quickStats = useMemo<QuickStatItem[]>(() => MOCK_KPI_CARDS.map(k => ({
    label: k.label,
    value: k.value,
    trend: k.trend,
    variant: k.variant,
  })), []);

  const peakHour = useMemo(() => computePeakHour(MOCK_HOURLY_TRAFFIC), []);
  const categoryInsights = useMemo(() => computeCategoryInsights(MOCK_CATEGORY_METRICS), []);
  const dailyAvg = useMemo(() => computeDailyAverages(MOCK_DAILY_COMPARISON), []);
  const growth = useMemo(() => computeRevenueGrowth(MOCK_DAILY_COMPARISON), []);
  const unresolvedAnomalyCount = useMemo(() => countUnresolvedAnomalies(MOCK_ANOMALIES), []);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <h1>数据分析</h1>
      <QuickStats items={quickStats} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24 }}>
        <GaugeChart value={75} segments={REVENUE_SEGMENTS} label="营收达标率" />
        <GaugeChart value={88} segments={SATISFACTION_SEGMENTS} label="客户满意度" />
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>品类分析</h2>
        <p>Top 品类: {categoryInsights.topCategory}</p>
        <p>增长率 &gt;0: {categoryInsights.positiveGrowth}, &lt;0: {categoryInsights.negativeGrowth}</p>
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>客流高峰分析</h2>
        {peakHour && <p>高峰时段: {peakHour.hour}:00 (客流 {peakHour.visitors} 人)</p>}
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>营收趋势</h2>
        <p>日均营收: ¥{dailyAvg.avgRevenue.toLocaleString()}</p>
        <p>同环比增长: {growth}%</p>
      </div>
      <div style={{ marginTop: 24 }}>
        <h2>异常指标</h2>
        <p>未处理异常: {unresolvedAnomalyCount} 条</p>
      </div>
    </div>
  );
}
