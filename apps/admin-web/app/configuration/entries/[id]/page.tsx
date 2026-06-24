import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readConfigurationConfigEntryDetailParam } from '@m5/types';
import { loadConfigurationConfigEntryDetail } from '../../../configuration-config-entry-view-model';
import ConfigurationConfigEntryDetailClient from './configuration-config-entry-detail-client';

interface ConfigurationConfigEntryDetailPageProps {
  params: Promise<{ id?: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readConfigurationConfigEntryDetailParam(value);
  }
  return readConfigurationConfigEntryDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ConfigurationConfigEntryDetailPage({
  params,
  searchParams
}: ConfigurationConfigEntryDetailPageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const id = readId(resolvedParams.id);

  const query = {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    brandId: readQueryParam(resolvedSearch.brandId),
    storeId: readQueryParam(resolvedSearch.storeId),
    marketCode: readQueryParam(resolvedSearch.marketCode)
  };

  const snapshot = id
    ? await loadConfigurationConfigEntryDetail(id, query, { cache: 'no-store' })
    : await loadConfigurationConfigEntryDetail('', query, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '配置项不存在' : `配置项：${snapshot.id}`}
        subtitle={
          snapshot.notFound
            ? '该配置项不在当前 configuration-governance 范围内，可能已下线、租户不匹配或拼写错误。'
            : '查看单个配置项的元数据、当前值、作用域、修订记录、相关配置项与跨工作台深链。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载配置项详情..." />}>
          <ConfigurationConfigEntryDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
