import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import AgentToolsClient from './agent-tools-client';
import { loadAgentTools } from '../agent-view-model';

export const dynamic = 'force-dynamic';

export default async function AgentToolsPage() {
  const snapshot = await loadAgentTools({ cache: 'no-store' });

  const highCount = snapshot.tools.filter((t) => t.riskLevel === 'high').length;
  const mediumCount = snapshot.tools.filter((t) => t.riskLevel === 'medium').length;
  const lowCount = snapshot.tools.filter((t) => t.riskLevel === 'low').length;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="Agent 工具注册中心"
        subtitle="查看 Agent 可调用的工具定义、参数 schema 与风险等级,作为 runtime governance 与 tool risk gating 的依据。"
      >
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <StatCard label="工具总数" value={snapshot.tools.length} helper="已注册" />
          <StatCard
            label="高风险"
            value={highCount}
            helper="需 gating"
            tone={highCount > 0 ? 'danger' : 'neutral'}
          />
          <StatCard label="中风险" value={mediumCount} helper="需审批" tone="warning" />
          <StatCard label="低风险" value={lowCount} helper="可直接调用" tone="success" />
        </div>
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载工具..." />}>
          <AgentToolsClient
            tools={snapshot.tools}
            deliveryMode={snapshot.deliveryMode}
            error={snapshot.error}
          />
        </Suspense>
      </PageShell>
    </main>
  );
}