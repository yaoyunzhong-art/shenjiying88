import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, StatCard } from '@m5/ui';
import AgentConfigsClient from './agent-configs-client';
import { loadAgentConfigs } from '../agent-view-model';

export const dynamic = 'force-dynamic';

export default async function AgentConfigsPage() {
  const snapshot = await loadAgentConfigs({ cache: 'no-store' });
  const enabledCount = snapshot.configs.filter((c) => c.enabled).length;
  const disabledCount = snapshot.configs.filter((c) => !c.enabled).length;
  const reflectionCount = snapshot.configs.filter((c) => c.enableReflection).length;

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="Agent 配置中心"
        subtitle="管理 ReAct Agent 的 system prompt、模型选择、最大步数、允许工具与超时,作为 Agent 运行时的基础配置。"
      >
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', marginBottom: 20 }}>
          <StatCard label="配置总数" value={snapshot.configs.length} helper="全部 Agent 配置" />
          <StatCard label="已启用" value={enabledCount} helper="可被会话调用" tone="success" />
          <StatCard label="已禁用" value={disabledCount} helper="已下线" tone="neutral" />
          <StatCard label="启用反思" value={reflectionCount} helper="enableReflection" tone="info" />
        </div>
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载 Agent 配置..." />}>
          <AgentConfigsClient
            configs={snapshot.configs}
            deliveryMode={snapshot.deliveryMode}
            error={snapshot.error}
          />
        </Suspense>
      </PageShell>
    </main>
  );
}