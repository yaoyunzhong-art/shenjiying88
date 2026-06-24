import { Suspense } from 'react';
import { PageShell, LoadingSkeleton } from '@m5/ui';
import { loadAuditTrail } from '../audit-trail-view-model';
import AuditTrailClient from './audit-trail-client';

interface AuditTrailPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AuditTrailPage({ searchParams }: AuditTrailPageProps) {
  const params = await searchParams;
  const query = {
    tenantId: readQueryParam(params.tenantId),
    action: readQueryParam(params.action),
    source: readQueryParam(params.source),
    requestId: readQueryParam(params.requestId),
    actorId: readQueryParam(params.actorId),
    approvalTicket: readQueryParam(params.approvalTicket),
    purpose: readQueryParam(params.purpose),
    resourceType: readQueryParam(params.resourceType),
    resourceId: readQueryParam(params.resourceId),
    riskLevel: ((): 'low' | 'medium' | 'high' | undefined => {
      const value = readQueryParam(params.riskLevel);
      if (value === 'low' || value === 'medium' || value === 'high') {
        return value;
      }
      return undefined;
    })(),
    from: readQueryParam(params.from),
    to: readQueryParam(params.to),
    limit: (() => {
      const value = readQueryParam(params.limit);
      const parsed = value ? Number(value) : 50;
      return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : 50;
    })()
  };

  const snapshot = await loadAuditTrail(query, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="审计日志"
        subtitle="记录平台所有关键操作，支持按级别、来源和事件类型筛选，可与会员/审批深链联动。"
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载审计视图..." />}>
          <AuditTrailClient
            records={snapshot.trail.records}
            total={snapshot.trail.total}
            query={snapshot.query}
          />
        </Suspense>
      </PageShell>
    </main>
  );
}
