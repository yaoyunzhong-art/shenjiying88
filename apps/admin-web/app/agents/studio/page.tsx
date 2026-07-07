import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import AgentStudioClient from './studio-client';
import { loadAgentConfigs } from '../agent-view-model';

export const dynamic = 'force-dynamic';

export default async function AgentStudioPage() {
  const snapshot = await loadAgentConfigs({ cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="Agent Studio · 写操作面板"
        subtitle="创建/运行/批量执行/删除 Agent 配置与会话。所有写操作直接调用后端 SDK,失败时显示原始错误便于排查。"
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={3} label="加载 Studio..." />}>
          <AgentStudioClient configs={snapshot.configs} deliveryMode={snapshot.deliveryMode} />
        </Suspense>
      </PageShell>
    </main>
  );
}