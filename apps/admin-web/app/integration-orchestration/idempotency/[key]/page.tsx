import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readIntegrationOrchestrationIdempotencyDetailParam } from '@m5/types';
import { loadIntegrationOrchestrationIdempotencyDetail } from '../../../integration-orchestration-detail-view-model';
import IntegrationOrchestrationIdempotencyDetailClient from './integration-orchestration-idempotency-detail-client';

interface IntegrationOrchestrationIdempotencyDetailPageProps {
  params: Promise<{ key?: string | string[] }>;
}

function readIdempotencyKey(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readIntegrationOrchestrationIdempotencyDetailParam(value);
  }
  return readIntegrationOrchestrationIdempotencyDetailParam(value);
}

export default async function IntegrationOrchestrationIdempotencyDetailPage({
  params
}: IntegrationOrchestrationIdempotencyDetailPageProps) {
  const resolved = await params;
  const key = readIdempotencyKey(resolved.key);

  const snapshot = await loadIntegrationOrchestrationIdempotencyDetail(key ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '幂等记录不存在' : `幂等记录：${snapshot.record?.eventType ?? snapshot.key}`}
        subtitle={
          snapshot.notFound
            ? '该幂等键未在当前范围内出现，可能事件已归档或上游未触发。'
            : '查看幂等记录元数据、payload 校验和与对应事件信封。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载幂等记录..." />}>
          <IntegrationOrchestrationIdempotencyDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
