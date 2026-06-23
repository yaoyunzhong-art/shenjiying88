import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readIntegrationOrchestrationSourceDetailParam } from '@m5/types';
import { loadIntegrationOrchestrationSourceDetail } from '../../../integration-orchestration-detail-view-model';
import IntegrationOrchestrationSourceDetailClient from './integration-orchestration-source-detail-client';

interface IntegrationOrchestrationSourceDetailPageProps {
  params: Promise<{ source?: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readSource(value: string | string[] | undefined): string | null {
  return readIntegrationOrchestrationSourceDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function IntegrationOrchestrationSourceDetailPage({
  params,
  searchParams
}: IntegrationOrchestrationSourceDetailPageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const source = readSource(resolvedParams.source);
  const query = {
    source: readQueryParam(resolvedSearch.source)
  };

  const snapshot = await loadIntegrationOrchestrationSourceDetail(source ?? '', query, {
    cache: 'no-store'
  });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? 'Webhook 来源不存在' : `Webhook 来源：${snapshot.source}`}
        subtitle={
          snapshot.notFound
            ? '该来源不在当前 integration-orchestration 范围内。'
            : '查看 webhook 来源的算法、密钥引用、最近事件以及幂等记录。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载 webhook 来源详情..." />}>
          <IntegrationOrchestrationSourceDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}