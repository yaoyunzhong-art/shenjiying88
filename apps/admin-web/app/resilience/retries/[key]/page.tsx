import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readResilienceRetryPolicyDetailParam } from '@m5/types';
import { loadResilienceRetryPolicyDetail } from '../../../resilience-detail-view-model';
import ResilienceRetryPolicyDetailClient from './resilience-retry-policy-detail-client';

interface ResilienceRetryPolicyDetailPageProps {
  params: Promise<{ key?: string | string[] }>;
}

function readPolicyKey(value: string | string[] | undefined): string | null {
  return readResilienceRetryPolicyDetailParam(value);
}

export default async function ResilienceRetryPolicyDetailPage({ params }: ResilienceRetryPolicyDetailPageProps) {
  const resolved = await params;
  const key = readPolicyKey(resolved.key);

  const snapshot = await loadResilienceRetryPolicyDetail(key ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '重试策略不存在' : `重试策略：${snapshot.record?.capability ?? snapshot.key}`}
        subtitle={
          snapshot.notFound
            ? '该策略 key 不在当前 resilience 范围内。'
            : '查看重试上限、退避策略、恢复动作与升级目标。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载重试策略详情..." />}>
          <ResilienceRetryPolicyDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
