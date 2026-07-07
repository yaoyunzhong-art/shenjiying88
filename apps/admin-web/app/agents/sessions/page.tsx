import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import AgentSessionsClient from './agent-sessions-client';
import { loadAgentSessions } from '../agent-view-model';

export const dynamic = 'force-dynamic';

export default async function AgentSessionsPage() {
  const snapshot = await loadAgentSessions({ cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="Agent 会话追踪"
        subtitle="查看 ReAct Agent 会话的实时状态、用户输入、当前步数与最终输出,作为会话级可观测面板。"
      >
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <StatCard label="总会话" value={snapshot.stats.totalSessions} helper="累计" />
          <StatCard
            label="运行中"
            value={snapshot.stats.runningSessions}
            helper="正在执行"
            tone={snapshot.stats.runningSessions > 0 ? 'warning' : 'neutral'}
          />
          <StatCard
            label="平均步数"
            value={snapshot.stats.avgSteps.toFixed(1)}
            helper="单次会话均值"
          />
          <StatCard
            label="平均耗时"
            value={`${(snapshot.stats.avgDurationMs / 1000).toFixed(2)}s`}
            helper="全量会话均值"
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
  );
}