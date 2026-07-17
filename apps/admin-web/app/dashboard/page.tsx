/**
 * 概览仪表盘 Dashboard — admin-web 首页看板
 * 角色: 👔店长
 * 功能: 关键指标卡片、门店营收趋势、设备运行状态、今日待办、实时客流、预警摘要
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary, Card, StatCard } from '@m5/ui';
import DashboardClient from './dashboard-client';

interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  activeDevices: number;
  totalDevices: number;
  currentCustomers: number;
  pendingAlerts: number;
  completionRate: number;
  avgVisitDuration: number; // minutes
}

async function loadDashboardStats(): Promise<DashboardStats> {
  // 模拟数据; 生产环境将从 API 获取
  return {
    todayRevenue: 12580,
    todayOrders: 86,
    activeDevices: 42,
    totalDevices: 48,
    currentCustomers: 23,
    pendingAlerts: 3,
    completionRate: 78,
    avgVisitDuration: 45,
  };
}

export default async function DashboardPage() {
  const stats = await loadDashboardStats();

  const summaryCards = [
    { label: '今日营收', value: `¥${stats.todayRevenue.toLocaleString()}`, variant: 'success' as const, detail: '较昨日 +12%' },
    { label: '订单数', value: stats.todayOrders.toString(), variant: 'primary' as const, detail: '已完成 62 单' },
    { label: '设备在线率', value: `${Math.round((stats.activeDevices / stats.totalDevices) * 100)}%`, variant: stats.activeDevices === stats.totalDevices ? 'success' as const : 'warning' as const, detail: `${stats.activeDevices}/${stats.totalDevices} 在线` },
    { label: '客流', value: stats.currentCustomers.toString(), variant: 'info' as const, detail: `人均停留 ${stats.avgVisitDuration}min` },
    { label: '待处理告警', value: stats.pendingAlerts.toString(), variant: stats.pendingAlerts > 0 ? 'danger' as const : 'success' as const, detail: stats.pendingAlerts > 0 ? '需及时处理' : '无待处理' },
    { label: '今日完成率', value: `${stats.completionRate}%`, variant: stats.completionRate >= 80 ? 'success' as const : 'warning' as const, detail: '目标 85%' },
  ];

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="📊 概览仪表盘"
          subtitle="门店运营核心指标一览 · 实时数据 · 快速入口"
        >
          {/* 统计摘要卡片 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {summaryCards.map(card => (
              <Card key={card.label} style={{ padding: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{card.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, margin: '8px 0' }}>{card.value}</div>
                <div style={{ fontSize: 12, color: card.variant === 'danger' ? '#ef4444' : card.variant === 'warning' ? '#eab308' : '#22c55e' }}>{card.detail}</div>
              </Card>
            ))}
          </div>

          {/* 详细仪表盘客户端组件 */}
          <Suspense fallback={<LoadingSkeleton variant="card" rows={8} label="加载仪表盘详情..." />}>
            <DashboardClient stats={stats} />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
