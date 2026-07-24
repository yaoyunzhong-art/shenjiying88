import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readConfigurationFeatureFlagDetailParam } from '@m5/types';
import { loadConfigurationFeatureFlagDetail } from '../../../configuration-feature-flag-view-model';
import { AdminPermissionGate } from '../../../components/admin-permission-gate';
import ConfigurationFeatureFlagDetailClient from './configuration-feature-flag-detail-client';

interface ConfigurationFeatureFlagDetailPageProps {
  params: Promise<{ key?: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readKey(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readConfigurationFeatureFlagDetailParam(value);
  }
  return readConfigurationFeatureFlagDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ConfigurationFeatureFlagDetailPage({
  params,
  searchParams
}: ConfigurationFeatureFlagDetailPageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const key = readKey(resolvedParams.key);

  const query = {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    brandId: readQueryParam(resolvedSearch.brandId),
    storeId: readQueryParam(resolvedSearch.storeId),
    marketCode: readQueryParam(resolvedSearch.marketCode)
  };

  const snapshot = key
    ? await loadConfigurationFeatureFlagDetail(key, query, { cache: 'no-store' })
    : await loadConfigurationFeatureFlagDetail('', query, { cache: 'no-store' });

  return (
    <AdminPermissionGate
      requiredPermission="foundation.governance.read"
      title="功能开关详情访问受限"
      description="功能开关详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看灰度上下文、相关 flag 与治理深链。"
    >
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <PageShell
          title={snapshot.notFound ? '功能开关不存在' : `功能开关：${snapshot.key}`}
          subtitle={
            snapshot.notFound
              ? '该功能开关不在当前 configuration-governance 范围内，可能已下线、租户不匹配或拼写错误。'
              : '查看单个功能开关的元数据、灰度上下文、相关 flag 与跨工作台深链。'
          }
        >
          <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载功能开关详情..." />}>
            <ConfigurationFeatureFlagDetailClient snapshot={snapshot} />
          </Suspense>
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}
