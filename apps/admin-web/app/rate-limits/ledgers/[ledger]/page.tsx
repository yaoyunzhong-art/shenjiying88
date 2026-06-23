import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readRateLimitsLedgerDetailParam } from '@m5/types';
import { loadRateLimitsLedgerDetail } from '../../../rate-limits-detail-view-model';
import RateLimitsLedgerDetailClient from './rate-limits-ledger-detail-client';

interface RateLimitsLedgerDetailPageProps {
  params: Promise<{ ledger?: string | string[] }>;
}

function readLedgerId(value: string | string[] | undefined): string | null {
  return readRateLimitsLedgerDetailParam(value);
}

export default async function RateLimitsLedgerDetailPage({ params }: RateLimitsLedgerDetailPageProps) {
  const resolved = await params;
  const ledgerId = readLedgerId(resolved.ledger);

  const snapshot = await loadRateLimitsLedgerDetail(ledgerId ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '配额账本不存在' : `配额账本：${snapshot.record?.subjectKey ?? snapshot.ledgerId}`}
        subtitle={
          snapshot.notFound
            ? '该账本不在当前 rate-limits 范围内。'
            : '查看主题、策略、已用额度与重置时间。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载配额账本详情..." />}>
          <RateLimitsLedgerDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
