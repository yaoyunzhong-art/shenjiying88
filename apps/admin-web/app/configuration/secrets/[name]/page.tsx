import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readConfigurationSecretDetailParam } from '@m5/types';
import { loadConfigurationSecretDetail } from '../../../configuration-secret-view-model';
import { AdminPermissionGate } from '../../../components/admin-permission-gate';
import ConfigurationSecretDetailClient from './configuration-secret-detail-client';

interface ConfigurationSecretDetailPageProps {
  params: Promise<{ name?: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readName(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readConfigurationSecretDetailParam(value);
  }
  return readConfigurationSecretDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ConfigurationSecretDetailPage({
  params,
  searchParams
}: ConfigurationSecretDetailPageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const name = readName(resolvedParams.name);

  const query = {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    brandId: readQueryParam(resolvedSearch.brandId),
    storeId: readQueryParam(resolvedSearch.storeId),
    marketCode: readQueryParam(resolvedSearch.marketCode)
  };

  const snapshot = name
    ? await loadConfigurationSecretDetail(name, query, { cache: 'no-store' })
    : await loadConfigurationSecretDetail('', query, { cache: 'no-store' });

  return (
    <AdminPermissionGate
      requiredPermission="foundation.governance.read"
      title="配置密钥详情访问受限"
      description="配置密钥详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看密钥元数据、消费方与跨工作台深链。"
    >
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <PageShell
          title={snapshot.notFound ? '密钥不存在' : `密钥详情：${snapshot.name}`}
          subtitle={
            snapshot.notFound
              ? '该密钥不在当前 configuration-governance 范围内，可能已下线、租户不匹配或拼写错误。'
              : '查看单个密钥的元数据、消费方、相关密钥与跨工作台深链。'
          }
        >
          <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载密钥详情..." />}>
            <ConfigurationSecretDetailClient snapshot={snapshot} />
          </Suspense>
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}
