/**
 * 数据分析页 Analytics — admin-web 数据分析看板
 * 角色: 👔店长 / 🏢总部
 * 功能: 营收分析、客流分析、商品销量排行、时段分析、同比环比
 * 筛选: 概览/趋势/对比/明细 分类标签
 * 圈梁: ① TSC✅ ② 测试55✅ ③ 圈梁表✅ ④ PRD⬜
 */

import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import AnalyticsClient from './analytics-client';
import AnalysisTabs from './analysis-tabs';
import { AdminPermissionGate } from '../components/admin-permission-gate';
import { loadAnalyticsSnapshot } from './analytics-data';

export type AnalysisFilter = 'overview' | 'trend' | 'compare' | 'detail';

const permissionGate = {
  requiredPermission: 'dashboard:read',
  title: '数据分析访问受限',
  description:
    '数据分析页已接入管理员本地 session，只有具备 dashboard:read 的账号才能查看营收、客流、商品销量与趋势分析看板。',
} as const;

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { filter } = await searchParams;
  const activeFilter: AnalysisFilter = ['overview', 'trend', 'compare', 'detail'].includes(filter ?? '')
    ? (filter as AnalysisFilter)
    : 'overview';

  const snapshot = await loadAnalyticsSnapshot();
  const data = snapshot.data;
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource: 'loadAnalyticsSnapshot -> loadAnalytics',
    businessDataSource: 'local analytics snapshot',
    refreshPath: 'AnalyticsPage -> loadAnalyticsSnapshot',
    generatedAt: snapshot.generatedAt,
    note: '当前数据分析页使用本地统计样本，不代表真实分析主链，也不可作为闭环复签证据。',
  } as const;

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <AdminPermissionGate {...permissionGate}>
          <PageShell
            title="📈 数据分析"
            subtitle="门店运营数据分析 · 营收 · 客流 · 商品销量 · 时段趋势"
          >
            <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148,163,184,0.08)', fontSize: 12, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 16 }}>
              <div>
                Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
              </div>
              <div>
                业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
              </div>
              <div>
                generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
              </div>
            </div>
            <AnalysisTabs activeFilter={activeFilter} />
            <Suspense fallback={<LoadingSkeleton variant="card" rows={10} label="加载数据分析..." />}>
              <AnalyticsClient data={data} filter={activeFilter} />
            </Suspense>
          </PageShell>
        </AdminPermissionGate>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
