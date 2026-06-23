import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readRateLimitsPolicyDetailParam } from '@m5/types';
import { loadRateLimitsPolicyDetail } from '../../../rate-limits-detail-view-model';
import RateLimitsPolicyDetailClient from './rate-limits-policy-detail-client';

interface RateLimitsPolicyDetailPageProps {
  params: Promise<{ policy?: string | string[] }>;
}

function readPolicyId(value: string | string[] | undefined): string | null {
  return readRateLimitsPolicyDetailParam(value);
}

export default async function RateLimitsPolicyDetailPage({ params }: RateLimitsPolicyDetailPageProps) {
  const resolved = await params;
  const policyId = readPolicyId(resolved.policy);

  const snapshot = await loadRateLimitsPolicyDetail(policyId ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '限流策略不存在' : `限流策略：${snapshot.record?.code ?? snapshot.policyId}`}
        subtitle={
          snapshot.notFound
            ? '该策略不在当前 rate-limits 范围内。'
            : '查看作用域、周期、限额、算法与匹配的配额账本。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载限流策略详情..." />}>
          <RateLimitsPolicyDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
