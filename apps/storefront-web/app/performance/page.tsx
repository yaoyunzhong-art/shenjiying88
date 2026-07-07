'use client';

import React, { useMemo } from 'react';

import {
  StatCard,
  QuickStats,
  GaugeChart,
  HeatmapChart,
  type QuickStatItem,
  type GaugeSegment,
  type HeatmapCell,
} from '@m5/ui';

import {
  makeStorePerformanceData,
  type StorePerformanceData,
} from './performance-data';

// ============================================================
//  仪表盘色段
// ============================================================

const COMPLETION_SEGMENTS: GaugeSegment[] = [
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
//  门店绩效页面
// ============================================================

export default function PerformancePage() {
  const data: StorePerformanceData = useMemo(() => makeStorePerformanceData(), []);

  // --- 核心指标 (QuickStats) ---
  const statsItems: QuickStatItem[] = useMemo(() => [
    { label: '今日营收', value: `¥${data.todayRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` },
    { label: '今日订单', value: data.todayOrders.toString() },
    { label: '接待顾客', value: data.todayCustomers.toString() },
    { label: '客单价', value: `¥${data.avgOrderValue.toFixed(2)}` },
  ], [data]);

  // --- 热力图 : 周营收热力 (星期 × 时段) ---
  const heatmapCells: HeatmapCell[] = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const;
    const periods = ['早市', '午市', '下午', '晚市'] as const;
    const factors = [0.15, 0.35, 0.25, 0.25] as const;
    const cells: HeatmapCell[] = [];
    for (let d = 0; d < days.length; d++) {
      for (let p = 0; p < periods.length; p++) {
        const base = data.weekly.dailyRevenue[d] ?? 30000;
        const factor = factors[p] ?? 0.25;
        cells.push({
          rowLabel: days[d]!,
          colLabel: periods[p]!,
          value: Math.round(base * factor),
        });
      }
    }
    return cells;
  }, [data]);

  // --- 星期同比标签 ---
  const weekTrendLabel = useMemo(() => {
    const sign = data.revenueGrowth >= 0 ? '+' : '';
    return `${sign}${data.revenueGrowth.toFixed(1)}%`;
  }, [data]);

  const orderWeekTrend = useMemo(() => {
    const sign = data.orderGrowth >= 0 ? '+' : '';
    return `${sign}${data.orderGrowth.toFixed(1)}%`;
  }, [data]);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginBottom: 24 }}>
        📊 门店绩效
      </h1>

      {/* 核心指标 */}
      <QuickStats items={statsItems} columns={4} gap={14} padding={18} />

      {/* 趋势 & 统计卡 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <StatCard
          label="营收周同比"
          value={weekTrendLabel}
          trend={{ value: '较上周', positive: data.revenueGrowth >= 0 }}
          variant={data.revenueGrowth >= 0 ? 'success' : 'warning'}
        />
        <StatCard
          label="订单周同比"
          value={orderWeekTrend}
          trend={{ value: '较上周', positive: data.orderGrowth >= 0 }}
          variant={data.orderGrowth >= 0 ? 'success' : 'warning'}
        />
        <StatCard
          label="本周累计营收"
          value={`¥${data.weekly.dailyRevenue.reduce((a, b) => a + b, 0).toLocaleString('zh-CN')}`}
          variant="info"
        />
      </div>

      {/* 仪表盘区域 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>任务完成率</h3>
          <GaugeChart
            value={data.completionRate}
            label="完成率"
            suffix="%"
            segments={COMPLETION_SEGMENTS}
            size={180}
          />
          <span style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>{data.completionRate}%</span>
        </div>
        <div style={{
          background: 'rgba(15,23,42,0.5)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: 12,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>客户满意度</h3>
          <GaugeChart
            value={data.satisfactionScore}
            label="满意度"
            suffix="分"
            segments={SATISFACTION_SEGMENTS}
            size={180}
          />
          <span style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>{data.satisfactionScore}分</span>
        </div>
      </div>

      {/* 热力图 — 周营收分布 */}
      <div style={{
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
          🔥 周营收热力图 (星期 × 时段)
        </h3>
        <HeatmapChart
          data={heatmapCells}
          rowLabels={['周一','周二','周三','周四','周五','周六','周日']}
          colLabels={['早市','午市','下午','晚市']}
          colorScheme="blue"
          width={700}
          height={240}
        />
      </div>

      {/* 品类达成率 */}
      <div style={{
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 20,
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
          📦 品类达成率
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {data.categoryPerformance.map((cat) => {
            const gaugeValue = Math.min(cat.targetAchievement, 100);
            return (
              <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8, fontWeight: 500 }}>
                  {cat.category}
                </div>
                <GaugeChart
                  value={gaugeValue}
                  label="达成率"
                  suffix="%"
                  size={120}
                />
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                  ¥{cat.revenue.toLocaleString('zh-CN')} / {cat.salesCount}单
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
