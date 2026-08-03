import { Suspense } from 'react'
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui'
import { loadAgentTools } from '../agent-view-model'
import AgentToolsClient from './agent-tools-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AgentToolsPage() {
  const snapshot = await loadAgentTools({ cache: 'no-store' })
  const stats = {
    total: snapshot.tools.length,
    high: snapshot.tools.filter((tool) => tool.riskLevel === 'high').length,
    medium: snapshot.tools.filter((tool) => tool.riskLevel === 'medium').length,
    low: snapshot.tools.filter((tool) => tool.riskLevel === 'low').length,
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="Agent 工具注册中心"
          subtitle="查看 Agent 可调用的工具定义、参数 schema 与风险等级，作为 runtime governance 与 tool risk gating 的依据。"
        >
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              marginBottom: 24
            }}
          >
            <StatCard label="工具总数" value={stats.total} helper="已注册工具" />
            <StatCard label="高风险" value={stats.high} helper="需强门禁" tone="danger" />
            <StatCard label="中风险" value={stats.medium} helper="需人工复核" tone="warning" />
            <StatCard label="低风险" value={stats.low} helper="基础查询/检索" tone="success" />
          </div>
          <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载 Agent 工具..." />}>
            <AgentToolsClient
              tools={snapshot.tools}
              deliveryMode={snapshot.deliveryMode}
              error={snapshot.error}
            />
          </Suspense>
        </PageShell>
    </main>
  )
}
