import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { getAdminWorkbenchConsumerSnapshot } from '../bootstrap';
import { loadIntegrationOrchestrationWorkspace } from '../integration-orchestration-view-model';
import IntegrationOrchestrationWorkspaceClient from './integration-orchestration-workspace-client';

interface IntegrationOrchestrationPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function IntegrationOrchestrationPage({
  searchParams
}: IntegrationOrchestrationPageProps) {
  const params = await searchParams;
  const query = {
    source: readQueryParam(params.source)
  };

  const [workspaceSnapshot, workbenchSnapshot] = await Promise.all([
    loadIntegrationOrchestrationWorkspace(query, { cache: 'no-store' }),
    getAdminWorkbenchConsumerSnapshot()
  ]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="集成编排"
        subtitle="统一查看 Webhook 来源目录、事件信封与幂等记录，收口开放平台和回调编排链路。"
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载集成编排工作台..." />}>
          <IntegrationOrchestrationWorkspaceClient
            workspace={workspaceSnapshot.workspace}
            foundationDependencies={workbenchSnapshot.foundationDependencies}
          />
        </Suspense>
      </PageShell>
    </main>
  );
}
