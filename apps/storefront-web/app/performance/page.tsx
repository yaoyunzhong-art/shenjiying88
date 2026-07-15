'use client';

/**
 * 门店绩效 — Performance Dashboard
 * 增强: 三态(loading/error/empty) + 时段销售分析 + 日同比对比 + 绩效等级 + 详情面板
 */
import React, { useState, useEffect, useMemo } from 'react';
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
import {
  makeStorePerformanceData,
  type StorePerformanceData,
  type HourlySalesRecord,
  type CategoryPerformance,
} from './performance-data';

/* ── Gauge segments ── */
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

function simulateFetch(): Promise<StorePerformanceData> {
  return new Promise(resolve => setTimeout(() => resolve(makeStorePerformanceData()), 400 + Math.random() * 400));
}

/* ── Helpers ── */
function perfLabel(v: number): { label: string; color: string } {
  if (v >= 90) return { label: '优秀', color: '#4ade80' };
  if (v >= 70) return { label: '良好', color: '#93c5fd' };
  if (v >= 50) return { label: '一般', color: '#fbbf24' };
  return { label: '需提升', color: '#f87171' };
}

function LoadingSkeleton() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto', color: '#f1f5f9' }}>
      <div style={{ height: 28, width: 120, borderRadius: 8, background: 'rgba(148,163,184,0.12)', marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: 60, borderRadius: 12, background: 'rgba(148,163,184,0.08)' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {[1,2].map(i => <div key={i} style={{ height: 200, borderRadius: 12, background: 'rgba(148,163,184,0.08)' }} />)}
      </div>
      <div style={{ height: 260, borderRadius: 12, background: 'rgba(148,163,184,0.08)' }} />
    </div>
  );
}

/* ── 子组件: 详情面板 ── */
function DetailPanel({
  data,
  onClose,
}: {
  data: StorePerformanceData;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'hourly' | 'category' | 'weekly'>('hourly');
  return (
    <div style={{
      marginTop: 24,
      background: 'rgba(15,23,42,0.5)',
      border: '1px solid rgba(148,163,184,0.12)',
      borderRadius: 12,
      padding: 20,
      position: 'relative',
    }}>
      <button onClick={onClose} style={{ position: 'absolute', right: 16, top: 16, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: '#94a3b8' }}>✕</button>
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid rgba(148,163,184,0.2)' }}>
        {(['hourly', 'category', 'weekly'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? '#60a5fa' : '#94a3b8',
            borderBottom: tab === t ? '2px solid #60a5fa' : '2px solid transparent', marginBottom: -2,
          }}>
            {t === 'hourly' ? '⏰ 时段销售' : t === 'category' ? '📦 品类详情' : '📅 周明细'}
          </button>
        ))}
      </div>

      {tab === 'hourly' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>时段</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>销售额</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>订单数</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>客单价</th>
            </tr>
          </thead>
          <tbody>
            {data.hourlySales.map((h: HourlySalesRecord) => (
              <tr key={h.hour} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <td style={{ padding: '8px 12px', color: '#e2e8f0' }}>{h.hour}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4ade80' }}>¥{h.sales.toLocaleString()}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{h.orders}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>¥{(h.orders > 0 ? (h.sales / h.orders).toFixed(0) : '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'category' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>品类</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>营收</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>销量</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>达成率</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>评级</th>
            </tr>
          </thead>
          <tbody>
            {data.categoryPerformance.map((cat: CategoryPerformance) => {
              const rateLabel = perfLabel(cat.targetAchievement);
              return (
                <tr key={cat.category} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                  <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: 600 }}>{cat.category}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4ade80' }}>¥{cat.revenue.toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{cat.salesCount}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{cat.targetAchievement}%</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                    <span style={{ color: rateLabel.color, fontWeight: 600, fontSize: 12 }}>{rateLabel.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {tab === 'weekly' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>星期</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>营收</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>订单</th>
              <th style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>顾客</th>
            </tr>
          </thead>
          <tbody>
            {['周一','周二','周三','周四','周五','周六','周日'].map((day, i) => (
              <tr key={day} style={{ borderBottom: '1px solid rgba(148,163,184,0.08)' }}>
                <td style={{ padding: '8px 12px', color: '#e2e8f0', fontWeight: i >= 5 ? 700 : 400 }}>{day}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4ade80' }}>¥{(data.weekly.dailyRevenue[i] ?? 0).toLocaleString()}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#e2e8f0' }}>{data.weekly.dailyOrders[i] ?? 0}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: '#94a3b8' }}>{data.weekly.dailyCustomers[i] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── 主组件 ──

export default function PerformancePage() {
  const [data, setData] = useState<StorePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    simulateFetch().then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e: unknown) => { if (!cancelled) { setError(e instanceof Error ? e.message : '加载失败'); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const statsItems: QuickStatItem[] = useMemo(() => data ? [
    { label: '今日营收', value: `¥${data.todayRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` },
    { label: '今日订单', value: data.todayOrders.toString() },
    { label: '接待顾客', value: data.todayCustomers.toString() },
    { label: '客单价', value: `¥${data.avgOrderValue.toFixed(2)}` },
  ] : [], [data]);

  const heatmapCells: HeatmapCell[] = useMemo(() => {
    if (!data) return [];
    const days = ['周一','周二','周三','周四','周五','周六','周日'] as const;
    const periods = ['早市','午市','下午','晚市'] as const;
    const factors = [0.15, 0.35, 0.25, 0.25] as const;
    const cells: HeatmapCell[] = [];
    for (let d = 0; d < days.length; d++) {
      for (let p = 0; p < periods.length; p++) {
        const base = data.weekly.dailyRevenue[d] ?? 30000;
        const factor = factors[p] ?? 0.25;
        cells.push({ rowLabel: days[d]!, colLabel: periods[p]!, value: Math.round(base * factor) });
      }
    }
    return cells;
  }, [data]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto', textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>📊</div>
        <div style={{ color: '#f87171', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>绩效数据加载失败</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>重新加载</button>
      </div>
    );
  }

  if (!data) return null;

  const weekTrendLabel = data.revenueGrowth >= 0 ? `+${data.revenueGrowth.toFixed(1)}%` : `${data.revenueGrowth.toFixed(1)}%`;
  const orderWeekTrend = data.orderGrowth >= 0 ? `+${data.orderGrowth.toFixed(1)}%` : `${data.orderGrowth.toFixed(1)}%`;
  const weeklyTotal = data.weekly.dailyRevenue.reduce((a, b) => a + b, 0);
  const perf = perfLabel(data.completionRate);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1280, margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>📊 门店绩效</h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
            旗舰店 — 综合绩效等级 <span style={{ color: perf.color, fontWeight: 600 }}>{perf.label}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge variant="success" label={`完成率 ${data.completionRate}%`} />
          <StatusBadge variant="info" label={`满意度 ${data.satisfactionScore}分`} />
        </div>
      </div>

      {/* 核心指标 */}
      <QuickStats items={statsItems} columns={4} gap={14} padding={18} />

      {/* 趋势 & 绩效等级 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <StatCard label="营收周同比" value={weekTrendLabel} trend={{ value: '较上周', positive: data.revenueGrowth >= 0 }} variant={data.revenueGrowth >= 0 ? 'success' : 'warning'} />
        <StatCard label="订单周同比" value={orderWeekTrend} trend={{ value: '较上周', positive: data.orderGrowth >= 0 }} variant={data.orderGrowth >= 0 ? 'success' : 'warning'} />
        <StatCard label="本周累计营收" value={`¥${weeklyTotal.toLocaleString('zh-CN')}`} variant="info" />
        <div style={{ borderRadius: 12, padding: '16px 20px', background: 'rgba(15,23,42,0.35)', border: '1px solid rgba(148,163,184,0.1)' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>综合绩效等级</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: perf.color }}>{perf.label}</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>基于完成率({data.completionRate}%)和满意度({data.satisfactionScore}分)</div>
        </div>
      </div>

      {/* 时段销售分析 - 小时级 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>⏰ 今日时段销售</h3>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120 }}>
            {data.hourlySales.map(h => {
              const maxSales = Math.max(...data.hourlySales.map(x => x.sales), 1);
              const hPct = (h.sales / maxSales) * 100;
              return (
                <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>¥{(h.sales / 1000).toFixed(1)}k</div>
                  <div style={{ width: '80%', background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0', height: `${Math.max(hPct, 4)}%`, transition: 'height 0.3s' }} />
                  <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{h.hour.slice(0, 2)}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>任务完成率</h3>
            <GaugeChart value={data.completionRate} label="完成率" suffix="%" segments={COMPLETION_SEGMENTS} size={160} />
            <span style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>{data.completionRate}%</span>
          </div>
          <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>客户满意度</h3>
            <GaugeChart value={data.satisfactionScore} label="满意度" suffix="分" segments={SATISFACTION_SEGMENTS} size={160} />
            <span style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>{data.satisfactionScore}分</span>
          </div>
        </div>
      </div>

      {/* 日同比柱状图 */}
      <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>📅 本周营收趋势</h3>
          <button onClick={() => setShowDetail(!showDetail)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid rgba(148,163,184,0.3)', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
            {showDetail ? '收起详情' : '查看详情'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 140 }}>
          {data.weekly.dailyRevenue.map((rev, i) => {
            const maxRev = Math.max(...data.weekly.dailyRevenue, 1);
            const days = ['周一','周二','周三','周四','周五','周六','周日'];
            const hPct = (rev / maxRev) * 100;
            const orders = data.weekly.dailyOrders[i] ?? 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 9, color: '#94a3b8' }}>¥{(rev / 1000).toFixed(1)}k</div>
                <div style={{ width: '70%', background: i >= 5 ? 'linear-gradient(to top, #f59e0b, #fbbf24)' : 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: '4px 4px 0 0', height: `${Math.max(hPct, 4)}%`, transition: 'height 0.3s' }} />
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{days[i]}</div>
                <div style={{ fontSize: 8, color: '#475569' }}>{orders}单</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 热力图 */}
      <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>🔥 周营收热力图 (星期 × 时段)</h3>
        <HeatmapChart data={heatmapCells} rowLabels={['周一','周二','周三','周四','周五','周六','周日']} colLabels={['早市','午市','下午','晚市']} colorScheme="blue" width={700} height={240} />
      </div>

      {/* 品类达成率 */}
      <div style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>📦 品类达成率</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {data.categoryPerformance.map(cat => {
            const gaugeValue = Math.min(cat.targetAchievement, 100);
            return (
              <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8, fontWeight: 500 }}>{cat.category}</div>
                <GaugeChart value={gaugeValue} label="达成率" suffix="%" size={120} />
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>¥{cat.revenue.toLocaleString('zh-CN')} / {cat.salesCount}单</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 详情面板 */}
      {showDetail && data && (
        <DetailPanel data={data} onClose={() => setShowDetail(false)} />
      )}

      {/* 数据时间脚注 */}
      <div style={{ marginTop: 20, fontSize: 12, color: '#475569', textAlign: 'center' }}>
        数据更新于 {new Date().toLocaleString('zh-CN')} · 数据仅供参考
      </div>
    </div>
  );
}
