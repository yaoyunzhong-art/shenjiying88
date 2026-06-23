import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readAuditTrailRecordDetailParam } from '@m5/types';
import { loadAuditTrailRecordDetail } from '../../../audit-trail-detail-view-model';
import AuditTrailRecordDetailClient from './audit-trail-record-detail-client';

interface AuditTrailRecordDetailPageProps {
  params: Promise<{ auditId?: string | string[] }>;
}

function readAuditId(value: string | string[] | undefined): string | null {
  return readAuditTrailRecordDetailParam(value);
}

export default async function AuditTrailRecordDetailPage({ params }: AuditTrailRecordDetailPageProps) {
  const resolved = await params;
  const auditId = readAuditId(resolved.auditId);

  const snapshot = await loadAuditTrailRecordDetail(auditId ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '审计记录不存在' : `审计记录：${snapshot.record?.eventType ?? snapshot.auditId}`}
        subtitle={
          snapshot.notFound
            ? '该 auditId 不在当前审计范围内。'
            : '查看事件级别、操作人、来源、详情 payload 与关联审计记录。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载审计记录详情..." />}>
          <AuditTrailRecordDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
