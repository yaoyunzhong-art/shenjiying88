import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { loadIntegrationOrchestrationWorkspace } from '../../integration-orchestration-view-model';
import IntegrationOrchestrationEventsClient from './integration-orchestration-events-client';

interface IntegrationOrchestrationEventsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function IntegrationOrchestrationEventsPage({
  searchParams
}: IntegrationOrchestrationEventsPageProps) {
  const params = await searchParams;
  const query = {
    source: readQueryParam(params.source)
  };

  const snapshot = await loadIntegrationOrchestrationWorkspace(query, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="事件信封列表"
        subtitle="查看所有 domain event / webhook envelope，支持按来源筛选。"
      >
        <Suspense fallback={<LoadingSkeleton variant="table" rows={6} label="加载事件信封..." />}>
          <IntegrationOrchestrationEventsClient
            events={snapshot.workspace.events}
            sources={snapshot.workspace.sources}
          />
        </Suspense>
      </PageShell>
    </main>
  );
}
