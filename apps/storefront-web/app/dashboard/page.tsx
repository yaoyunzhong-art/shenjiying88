'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';

import {
  PageShell,
  StatCard,
  StatusBadge,
  Tabs,
  Card,
  GaugeChart,
  SparklineChart,
  EmptyState,
  Button,
  type SparklineDataPoint,
} from '@m5/ui';

// ---- 类型 ----

type Period = 'today' | 'week' | 'month';

interface DashboardStat {
  label: string;
  value: string;
  trend: number;
  sparkline: SparklineDataPoint[];
  variant: 'error' | 'warning' | 'success' | 'info';
}

interface TopProduct {
  rank: number;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
}

interface RecentOrder {
  id: string;
  orderNo: string;
  member: string;
  amount: string;
  status: 'completed' | 'pending' | 'cancelled';
  time: string;
}

interface StoreAlert {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  time: string;
}

// ---- Mock 数据生成 ----

function generateSparkline(base: number, variance: number, points: number): SparklineDataPoint[] {
  return Array.from({ length: points }, (_, i) => ({
    label: `T${i + 1}`,
    value: Math.max(0, base + (Math.random() - 0.5) * variance * 2),
  }));
}

const MOCK_STATS_TODAY: DashboardStat[] = [
  { label: '今日营收', value: '¥58,260.00', trend: 12.5, sparkline: generateSparkline(52000, 15000, 24), variant: 'success' },
  { label: '订单数', value: '247', trend: 8.3, sparkline: generateSparkline(230, 60, 24), variant: 'info' },
  { label: '客单价', value: '¥235.87', trend: -1.2, sparkline: generateSparkline(240, 20, 24), variant: 'warning' },
  { label: '新增会员', value: '18', trend: 25.0, sparkline: generateSparkline(12, 8, 24), variant: 'info' },
  { label: '活跃设备', value: '7/10', trend: 0, sparkline: generateSparkline(8, 2, 24), variant: 'info' },
  { label: '在线率', value: '70%', trend: -5.0, sparkline: generateSparkline(75, 10, 24), variant: 'warning' },
];

const MOCK_STATS_WEEK: DashboardStat[] = [
  { label: '本周营收', value: '¥385,420.00', trend: 15.2, sparkline: generateSparkline(380000, 40000, 7), variant: 'success' },
  { label: '订单数', value: '1,682', trend: 10.1, sparkline: generateSparkline(1600, 200, 7), variant: 'info' },
  { label: '客单价', value: '¥229.15', trend: 2.8, sparkline: generateSparkline(225, 15, 7), variant: 'success' },
  { label: '新增会员', value: '124', trend: 18.5, sparkline: generateSparkline(100, 30, 7), variant: 'info' },
  { label: '到店人次', value: '2,358', trend: 6.7, sparkline: generateSparkline(2200, 300, 7), variant: 'info' },
  { label: '转化率', value: '71.3%', trend: 3.2, sparkline: generateSparkline(69, 5, 7), variant: 'success' },
];

const MOCK_STATS_MONTH: DashboardStat[] = [
  { label: '本月营收', value: '¥1,527,890.00', trend: 22.4, sparkline: generateSparkline(1500000, 150000, 30), variant: 'success' },
  { label: '订单数', value: '6,845', trend: 18.7, sparkline: generateSparkline(6500, 800, 30), variant: 'info' },
  { label: '客单价', value: '¥223.21', trend: 3.1, sparkline: generateSparkline(218, 12, 30), variant: 'success' },
  { label: '新增会员', value: '512', trend: 35.2, sparkline: generateSparkline(400, 100, 30), variant: 'info' },
  { label: '到店人次', value: '9,280', trend: 12.3, sparkline: generateSparkline(8500, 1200, 30), variant: 'info' },
  { label: '会员活跃率', value: '68.5%', trend: 5.8, sparkline: generateSparkline(65, 8, 30), variant: 'success' },
];

const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { rank: 1, name: '瑜伽初级课', sales: 186, revenue: 3701400, growth: 15.2 },
  { rank: 2, name: '游泳季卡', sales: 48, revenue: 9595200, growth: 8.7 },
  { rank: 3, name: 'HIIT 高强度训练', sales: 152, revenue: 2264800, growth: 22.3 },
  { rank: 4, name: '私教一对一', sales: 67, revenue: 3343300, growth: -3.1 },
  { rank: 5, name: '蛋白粉（乳清）', sales: 213, revenue: 6368700, growth: 12.8 },
  { rank: 6, name: '普拉提中级课', sales: 98, revenue: 2244200, growth: 35.6 },
  { rank: 7, name: '运动毛巾套装', sales: 175, revenue: 1557500, growth: 5.4 },
  { rank: 8, name: '瑜伽垫（加厚）', sales: 89, revenue: 1415100, growth: -1.8 },
];

const MOCK_RECENT_ORDERS: RecentOrder[] = [
  { id: '1', orderNo: 'ORD202607111234', member: '张伟', amount: '¥199.00', status: 'completed', time: '18:32' },
  { id: '2', orderNo: 'ORD202607111235', member: '李娜', amount: '¥596.00', status: 'completed', time: '18:15' },
  { id: '3', orderNo: 'ORD202607111236', member: '王芳', amount: '¥89.00', status: 'pending', time: '17:58' },
  { id: '4', orderNo: 'ORD202607111237', member: '赵强', amount: '¥1,998.00', status: 'completed', time: '17:40' },
  { id: '5', orderNo: 'ORD202607111238', member: '孙丽', amount: '¥159.00', status: 'cancelled', time: '17:22' },
  { id: '6', orderNo: 'ORD202607111239', member: '周杰', amount: '¥498.00', status: 'completed', time: '17:05' },
  { id: '7', orderNo: 'ORD202607111240', member: '吴敏', amount: '¥299.00', status: 'pending', time: '16:48' },
  { id: '8', orderNo: 'ORD202607111241', member: '郑浩', amount: '¥89.00', status: 'completed', time: '16:30' },
];

const MOCK_ALERTS: StoreAlert[] = [
  { id: 'a1', title: '冰柜温度异常', severity: 'high', category: '设备', time: '10 分钟前' },
  { id: 'a2', title: '库存预警 - 蛋白粉不足', severity: 'medium', category: '库存', time: '30 分钟前' },
  { id: 'a3', title: '打印机故障 - 前台1号', severity: 'medium', category: '设备', time: '1 小时前' },
  { id: 'a4', title: '会员投诉跟进超时', severity: 'low', category: '服务', time: '2 小时前' },
  { id: 'a5', title: '排班冲突 - 晚班缺人', severity: 'high', category: '人力', time: '3 小时前' },
];

function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

const ORDER_STATUS_VARIANTS: Record<RecentOrder['status'], 'success' | 'warning' | 'neutral'> = {
  completed: 'success',
  pending: 'warning',
  cancelled: 'neutral',
};

const ORDER_STATUS_LABELS: Record<RecentOrder['status'], string> = {
  completed: '已完成',
  pending: '处理中',
  cancelled: '已取消',
};

const ALERT_SEVERITY_VARIANTS: Record<StoreAlert['severity'], 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

// ---- 子组件 ----

function TrendBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const isPositive = value > 0;
  const isZero = value === 0;
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: isZero ? '#64748b' : isPositive ? '#4ade80' : '#f87171',
        background: isZero ? 'transparent' : isPositive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
        padding: '2px 6px',
        borderRadius: 4,
      }}
    >
      {isZero ? '持平' : `${isPositive ? '+' : ''}${value.toFixed(1)}${suffix}`}
    </span>
  );
}

function StatSection({ stat }: { stat: DashboardStat }) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: 16,
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.14)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{stat.label}</span>
        <TrendBadge value={stat.trend} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>{stat.value}</div>
      <SparklineChart
        data={stat.sparkline}
        width={200}
        height={32}
        color={stat.variant === 'error' ? '#f87171' : stat.variant === 'warning' ? '#fbbf24' : stat.variant === 'success' ? '#4ade80' : '#60a5fa'}
      />
    </div>
  );
}

// ---- 主页面 ----

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('today');

  const stats = useMemo(() => {
    switch (period) {
      case 'today': return MOCK_STATS_TODAY;
      case 'week': return MOCK_STATS_WEEK;
      case 'month': return MOCK_STATS_MONTH;
    }
  }, [period]);

  return (
    <PageShell
      title="门店仪表盘"
      description="Shenjiying 旗舰店 · 今日运营概览"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="default" size="sm" onClick={() => alert('数据刷新中...')}>
            🔄 刷新
          </Button>
          <Button variant="primary" size="sm"
            onClick={() => window.location.href = '/products'}
          >
            📋 查看产品
          </Button>
        </div>
      }
    >
      {/* 时间维度切换 */}
      <Tabs
        items={[
          { key: 'today', label: '今日' },
          { key: 'week', label: '本周' },
          { key: 'month', label: '本月' },
        ]}
        activeKey={period}
        onChange={(key) => setPeriod(key as Period)}
        variant="pills"
        size="sm"
        style={{ marginBottom: 20 }}
      />

      {/* 核心指标 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {stats.map((s) => (
          <StatSection key={s.label} stat={s} />
        ))}
      </div>

      {/* 三列布局：畅销产品 + 最近订单 + 预警 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* 畅销产品 */}
        <Card title="📈 畅销产品 Top 8" style={{ padding: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(148,163,184,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: 11, color: '#64748b', fontWeight: 500 }}>#</th>
                <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: 11, color: '#64748b', fontWeight: 500 }}>产品</th>
                <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: 11, color: '#64748b', fontWeight: 500 }}>销量</th>
                <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: 11, color: '#64748b', fontWeight: 500 }}>增长</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TOP_PRODUCTS.map((p) => (
                <tr key={p.rank} style={{ borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                  <td style={{ padding: '5px 4px', fontSize: 12, color: '#64748b', width: 24 }}>{p.rank}</td>
                  <td style={{ padding: '5px 4px', fontSize: 13, color: '#e2e8f0' }}>{p.name}</td>
                  <td style={{ padding: '5px 4px', fontSize: 13, color: '#cbd5e1', textAlign: 'right' }}>{p.sales}</td>
                  <td style={{ padding: '5px 4px', fontSize: 12, textAlign: 'right' }}>
                    <TrendBadge value={p.growth} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* 最近订单 */}
        <Card title="🕐 最近订单" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MOCK_RECENT_ORDERS.map((o) => (
              <div
                key={o.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: 'rgba(30,41,59,0.3)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0' }}>{o.member}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{o.orderNo}</div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{o.amount}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{o.time}</div>
                </div>
                <StatusBadge
                  label={ORDER_STATUS_LABELS[o.status]}
                  variant={ORDER_STATUS_VARIANTS[o.status]}
                  size="sm"
                />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <Link
              href="/orders"
              style={{
                fontSize: 13,
                color: '#60a5fa',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              查看全部订单 &rarr;
            </Link>
          </div>
        </Card>

        {/* 预警信息 */}
        <Card title="⚠️ 预警提醒" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MOCK_ALERTS.map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background:
                    a.severity === 'high'
                      ? 'rgba(248,113,113,0.08)'
                      : a.severity === 'medium'
                      ? 'rgba(251,191,36,0.08)'
                      : 'rgba(148,163,184,0.05)',
                  border:
                    a.severity === 'high'
                      ? '1px solid rgba(248,113,113,0.2)'
                      : a.severity === 'medium'
                      ? '1px solid rgba(251,191,36,0.2)'
                      : '1px solid rgba(148,163,184,0.1)',
                }}
              >
                <StatusBadge
                  label={a.category}
                  variant={ALERT_SEVERITY_VARIANTS[a.severity]}
                  size="sm"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e2e8f0' }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: '#64748b', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => alert('跳转至告警中心')}>
            🔔 查看全部告警
          </div>
        </Card>
      </div>

      {/* 底部快捷入口 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
        }}
      >
        {[
          { label: '📦 商品管理', href: '/products' },
          { label: '👥 会员管理', href: '/members' },
          { label: '📋 订单管理', href: '/orders' },
          { label: '🔧 设备管理', href: '/devices' },
          { label: '🎉 活动管理', href: '/events' },
          { label: '⚙️ 门店设置', href: '/settings' },
          { label: '❓ 帮助中心', href: '/help' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 12px',
              borderRadius: 10,
              background: 'rgba(30,41,59,0.4)',
              border: '1px solid rgba(148,163,184,0.1)',
              color: '#e2e8f0',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
