/**
 * 数据分析页 Analytics — admin-web 数据分析看板
 * 角色: 👔店长 / 🏢总部
 * 功能: 营收分析、客流分析、商品销量排行、时段分析、同比环比
 * 筛选: 概览/趋势/对比/明细 分类标签
 * 圈梁: ① TSC✅ ② 测试55✅ ③ 圈梁表✅ ④ PRD⬜
 */

import { Suspense } from 'react'
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui'
import AnalyticsClient from './analytics-client'
import AnalysisTabs from './analysis-tabs'
import { loadAnalyticsSnapshot } from './analytics-data'

export type AnalysisFilter = 'overview' | 'trend' | 'compare' | 'detail'

type PageProps = {
  searchParams: Promise<{ filter?: string }>
}

export default async function AnalyticsPage({ searchParams }: PageProps) {
  const { filter } = await searchParams
  const activeFilter: AnalysisFilter = ['overview', 'trend', 'compare', 'detail'].includes(filter ?? '')
    ? (filter as AnalysisFilter)
    : 'overview'

  const snapshot = await loadAnalyticsSnapshot()
  const data = snapshot.data

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
          <PageShell
            title="📈 数据分析"
            subtitle="门店运营数据分析 · 营收 · 客流 · 商品销量 · 时段趋势"
          >
            <AnalysisTabs activeFilter={activeFilter} />
            <Suspense fallback={<LoadingSkeleton variant="card" rows={10} label="加载数据分析..." />}>
              <AnalyticsClient data={data} filter={activeFilter} />
            </Suspense>
          </PageShell>
      </main>
    </ErrorBoundary>
  )
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
