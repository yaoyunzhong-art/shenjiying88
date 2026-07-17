/**
 * 数据分析页 Analytics — admin-web 数据分析看板
 * 角色: 👔店长 / 🏢总部
 * 功能: 营收分析、客流分析、商品销量排行、时段分析、同比环比
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import AnalyticsClient from './analytics-client';

interface AnalyticsSnapshot {
  periodRevenue: { current: number; previous: number; growth: number };
  totalCustomers: number;
  avgOrderValue: number;
  topSellingProducts: { name: string; sales: number; revenue: number; growth: number }[];
  hourlyDistribution: { hour: string; customers: number; revenue: number }[];
  categoryBreakdown: { category: string; revenue: number; percentage: number }[];
  customerRetentionRate: number;
  newCustomerRate: number;
}

async function loadAnalytics(): Promise<AnalyticsSnapshot> {
  return {
    periodRevenue: { current: 125800, previous: 112000, growth: 12.3 },
    totalCustomers: 456,
    avgOrderValue: 276,
    topSellingProducts: [
      { name: 'VR体验30分钟', sales: 128, revenue: 12800, growth: 15.2 },
      { name: '娃娃机代币包', sales: 256, revenue: 5120, growth: 8.7 },
      { name: '会员月卡', sales: 45, revenue: 13500, growth: 22.1 },
      { name: '饮品套餐', sales: 189, revenue: 5670, growth: -3.2 },
      { name: '团建活动', sales: 8, revenue: 24000, growth: 45.0 },
    ],
    hourlyDistribution: [
      { hour: '09-11', customers: 32, revenue: 6400 },
      { hour: '11-13', customers: 78, revenue: 15600 },
      { hour: '13-15', customers: 112, revenue: 22400 },
      { hour: '15-17', customers: 96, revenue: 19200 },
      { hour: '17-19', customers: 68, revenue: 13600 },
      { hour: '19-21', customers: 54, revenue: 10800 },
      { hour: '21-23', customers: 16, revenue: 3200 },
    ],
    categoryBreakdown: [
      { category: '设备体验', revenue: 50320, percentage: 40 },
      { category: '零售商品', revenue: 25160, percentage: 20 },
      { category: '会员服务', revenue: 18870, percentage: 15 },
      { category: '餐饮', revenue: 12580, percentage: 10 },
      { category: '团建活动', revenue: 18870, percentage: 15 },
    ],
    customerRetentionRate: 62,
    newCustomerRate: 38,
  };
}

export default async function AnalyticsPage() {
  const data = await loadAnalytics();

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="📈 数据分析"
          subtitle="门店运营数据分析 · 营收 · 客流 · 商品销量 · 时段趋势"
        >
          <Suspense fallback={<LoadingSkeleton variant="card" rows={10} label="加载数据分析..." />}>
            <AnalyticsClient data={data} />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
