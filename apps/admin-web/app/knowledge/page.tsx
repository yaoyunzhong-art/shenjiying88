/**
 * 知识库页面 Knowledge — admin-web 知识管理
 * 角色: 🏢总部 / 👔店长
 * 功能: 文档库、运营手册、FAQ、公告
 */

import { Suspense } from 'react'
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui'
import KnowledgeClient from './knowledge-client'
import { loadKnowledgeSnapshot } from './knowledge-data'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function KnowledgePage() {
  const snapshot = await loadKnowledgeSnapshot()
  const data = snapshot.data

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell title="📚 知识库" subtitle="运营手册·设备指南·会员政策·财务规范·安全制度">
          <Suspense fallback={<LoadingSkeleton variant="card" rows={8} label="加载知识库..." />}>
            <KnowledgeClient data={data} />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  )
}
