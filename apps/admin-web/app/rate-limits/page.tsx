import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { loadRateLimitWorkspace } from '../rate-limits-view-model';
import RateLimitsWorkspaceClient from './rate-limits-workspace-client';

interface RateLimitsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function RateLimitsPage({ searchParams }: RateLimitsPageProps) {
  const params = await searchParams;
  const query = {
    tenantId: readQueryParam(params.tenantId),
    policyCode: readQueryParam(params.policyCode),
    subjectKey: readQueryParam(params.subjectKey),
    status: readQueryParam(params.status) as 'healthy' | 'warning' | 'blocked' | 'ALL' | undefined
  };

  const snapshot = await loadRateLimitWorkspace(query, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="限流与配额"
        subtitle="监控各作用域的限流策略与配额账本，识别高消耗、已封禁与到期未重置的账本。"
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载限流配额..." />}>
          <RateLimitsWorkspaceClient workspace={snapshot.workspace} />
        </Suspense>
      </PageShell>
    </main>
  );
}
