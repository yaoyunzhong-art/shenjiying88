import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readFoundationModuleDetailParam } from '@m5/types';
import { loadFoundationModuleDetail } from '../../../foundation-detail-view-model';
import FoundationModuleDetailClient from './foundation-module-detail-client';

interface FoundationModuleDetailPageProps {
  params: Promise<{ module?: string | string[] }>;
}

function readModuleKey(value: string | string[] | undefined): string | null {
  return readFoundationModuleDetailParam(value);
}

export default async function FoundationModuleDetailPage({ params }: FoundationModuleDetailPageProps) {
  const resolved = await params;
  const moduleKey = readModuleKey(resolved.module);

  const snapshot = await loadFoundationModuleDetail(moduleKey ?? '', {}, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? 'Foundation 模块不存在' : `Foundation 模块：${snapshot.module?.name ?? snapshot.moduleKey}`}
        subtitle={
          snapshot.notFound
            ? '该模块 key 不在当前 foundation blueprint 范围内。'
            : '查看模块职责、能力、契约、消费方依赖与治理基线。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载 Foundation 模块详情..." />}>
          <FoundationModuleDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
