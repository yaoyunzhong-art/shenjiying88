import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readResilienceSignalDetailParam } from '@m5/types';
import { loadResilienceSignalDetail } from '../../../resilience-detail-view-model';
import ResilienceSignalDetailClient from './resilience-signal-detail-client';

interface ResilienceSignalDetailPageProps {
  params: Promise<{ signal?: string | string[] }>;
}

function readSignal(value: string | string[] | undefined): string | null {
  return readResilienceSignalDetailParam(value);
}

export default async function ResilienceSignalDetailPage({ params }: ResilienceSignalDetailPageProps) {
  const resolved = await params;
  const signal = readSignal(resolved.signal);

  const snapshot = await loadResilienceSignalDetail(signal ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '可观测信号不存在' : `可观测信号：${snapshot.signal}`}
        subtitle={
          snapshot.notFound
            ? '该信号不在当前 resilience 范围内，可能未配置或已下线。'
            : '查看信号的覆盖率、采集滞后、负责人与告警路由。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载可观测信号详情..." />}>
          <ResilienceSignalDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
