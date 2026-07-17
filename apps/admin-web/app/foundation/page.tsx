import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import { loadFoundationWorkspace } from '../foundation-view-model';
import FoundationWorkspaceClient from './foundation-workspace-client';

interface FoundationPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Foundation 总览页面
 * - 模块目录、消费者依赖、治理基线
 * - 模块 drilldown 入口
 * - 错误边界 + 骨架屏加载态
 */
export default async function FoundationPage({ searchParams }: FoundationPageProps) {
  const params = await searchParams;
  const query = {
    moduleKey: readQueryParam(params.moduleKey),
    consumer: readQueryParam(params.consumer),
  };

  const snapshot = await loadFoundationWorkspace(query, { cache: 'no-store' });

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="Foundation 总览"
          subtitle="统一展示模块目录、消费者依赖、治理基线与模块 drilldown，作为各治理工作台的总入口。"
        >
          <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载 Foundation 总览..." />}>
            <FoundationWorkspaceClient workspace={snapshot.workspace} query={snapshot.query} />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
