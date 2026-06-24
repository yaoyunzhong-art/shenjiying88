import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { loadResilienceOperationsSnapshot } from '../resilience-view-model';
import ResilienceWorkspaceClient from './resilience-workspace-client';

export default async function ResiliencePage() {
  const snapshot = await loadResilienceOperationsSnapshot({ cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="强韧性作战台"
        subtitle="统一监控可观测信号、重试策略与恢复计划演练进度，辅助运维治理与故障响应。"
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载强韧性作战台..." />}>
          <ResilienceWorkspaceClient overview={snapshot.overview} />
        </Suspense>
      </PageShell>
    </main>
  );
}
