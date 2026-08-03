import { Suspense } from 'react'
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui'
import { loadAgentSessions } from '../agent-view-model'
import AgentSessionsClient from './agent-sessions-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatAverageDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`
}

function formatAverageSteps(steps: number): string {
  return steps.toFixed(1)
}

export default async function AgentSessionsPage() {
  const snapshot = await loadAgentSessions({ cache: 'no-store' })
  const stats = snapshot.stats

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="Agent 会话追踪"
          subtitle="查看 ReAct Agent 会话的实时状态、用户输入、当前步数与最终输出，作为会话级可观测面板。"
        >
          <div
            style={{
              display: 'grid',
              gap: 14,
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              marginBottom: 24
            }}
          >
            <StatCard label="总会话" value={stats.totalSessions} helper="当前快照会话总量" />
            <StatCard
              label="运行中"
              value={stats.runningSessions}
              helper={`${stats.completedSessions} 已完成 / ${stats.failedSessions} 失败`}
              tone={stats.runningSessions > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              label="平均步数"
              value={formatAverageSteps(stats.avgSteps)}
              helper="当前会话步数均值"
              tone="info"
            />
            <StatCard
              label="平均耗时"
              value={formatAverageDuration(stats.avgDurationMs)}
              helper={`delivery ${snapshot.deliveryMode}`}
              tone="success"
            />
          </div>
          <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载 Agent 会话..." />}>
            <AgentSessionsClient
              sessions={snapshot.sessions}
              deliveryMode={snapshot.deliveryMode}
              error={snapshot.error}
            />
          </Suspense>
        </PageShell>
    </main>
  )
}
