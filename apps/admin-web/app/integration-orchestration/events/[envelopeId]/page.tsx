import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readIntegrationOrchestrationEventDetailParam } from '@m5/types';
import { loadIntegrationOrchestrationEventDetail } from '../../../integration-orchestration-detail-view-model';
import IntegrationOrchestrationEventDetailClient from './integration-orchestration-event-detail-client';

interface IntegrationOrchestrationEventDetailPageProps {
  params: Promise<{ envelopeId?: string | string[] }>;
}

function readEnvelopeId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readIntegrationOrchestrationEventDetailParam(value);
  }
  return readIntegrationOrchestrationEventDetailParam(value);
}

export default async function IntegrationOrchestrationEventDetailPage({
  params
}: IntegrationOrchestrationEventDetailPageProps) {
  const resolved = await params;
  const envelopeId = readEnvelopeId(resolved.envelopeId);

  const snapshot = await loadIntegrationOrchestrationEventDetail(envelopeId ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '事件信封不存在' : `事件信封：${snapshot.record?.eventName ?? snapshot.envelopeId}`}
        subtitle={
          snapshot.notFound
            ? '该 envelope 未在当前范围内出现，可能 ID 输入有误或事件已归档。'
            : '查看 envelope 详细字段、payload 与相关幂等记录。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载事件信封..." />}>
          <IntegrationOrchestrationEventDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
