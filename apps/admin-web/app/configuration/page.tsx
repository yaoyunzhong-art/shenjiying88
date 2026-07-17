import { Suspense } from 'react';
import { LoadingSkeleton, PageShell, ErrorBoundary } from '@m5/ui';
import { loadConfigurationGovernanceSnapshot } from '../configuration-view-model';
import ConfigurationWorkspaceClient from './configuration-workspace-client';

interface ConfigurationPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * 配置治理页面
 * - 功能开关、配置项、密钥与证书总览
 * - 支持租户/品牌/门店维度切换
 * - 错误边界保护 + 骨架屏加载态
 */
export default async function ConfigurationPage({ searchParams }: ConfigurationPageProps) {
  const params = await searchParams;
  const query = {
    tenantId: readQueryParam(params.tenantId),
    brandId: readQueryParam(params.brandId),
    storeId: readQueryParam(params.storeId),
    marketCode: readQueryParam(params.marketCode),
  };

  const snapshot = await loadConfigurationGovernanceSnapshot(query, { cache: 'no-store' });

  return (
    <ErrorBoundary>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="配置治理"
          subtitle="统一展示功能开关、配置项、密钥与证书总览，支持租户/品牌/门店维度切换。"
        >
          <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载配置治理..." />}>
            <ConfigurationWorkspaceClient
              overview={snapshot.overview}
              managementMetadata={snapshot.managementMetadata}
              query={snapshot.overview.scopeChain ?? []}
            />
          </Suspense>
        </PageShell>
      </main>
    </ErrorBoundary>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
