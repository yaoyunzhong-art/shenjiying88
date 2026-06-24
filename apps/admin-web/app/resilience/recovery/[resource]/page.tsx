import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readResilienceRecoveryPlanDetailParam } from '@m5/types';
import { loadResilienceRecoveryPlanDetail } from '../../../resilience-detail-view-model';
import ResilienceRecoveryPlanDetailClient from './resilience-recovery-plan-detail-client';

interface ResilienceRecoveryPlanDetailPageProps {
  params: Promise<{ resource?: string | string[] }>;
}

function readResource(value: string | string[] | undefined): string | null {
  return readResilienceRecoveryPlanDetailParam(value);
}

export default async function ResilienceRecoveryPlanDetailPage({ params }: ResilienceRecoveryPlanDetailPageProps) {
  const resolved = await params;
  const resource = readResource(resolved.resource);

  const snapshot = await loadResilienceRecoveryPlanDetail(resource ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '恢复计划不存在' : `恢复计划：${snapshot.resource}`}
        subtitle={
          snapshot.notFound
            ? '该资源不在当前 resilience 范围内，可能未登记恢复计划。'
            : '查看 RTO / RPO、依赖、演练时间窗与 Runbook。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载恢复计划详情..." />}>
          <ResilienceRecoveryPlanDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
