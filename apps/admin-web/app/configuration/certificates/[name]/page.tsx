import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readConfigurationCertificateDetailParam } from '@m5/types';
import { loadConfigurationCertificateDetail } from '../../../configuration-certificate-view-model';
import { AdminPermissionGate } from '../../../components/admin-permission-gate';
import ConfigurationCertificateDetailClient from './configuration-certificate-detail-client';

interface ConfigurationCertificateDetailPageProps {
  params: Promise<{ name?: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readName(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readConfigurationCertificateDetailParam(value);
  }
  return readConfigurationCertificateDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function ConfigurationCertificateDetailPage({
  params,
  searchParams
}: ConfigurationCertificateDetailPageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const name = readName(resolvedParams.name);

  const query = {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    brandId: readQueryParam(resolvedSearch.brandId),
    storeId: readQueryParam(resolvedSearch.storeId),
    marketCode: readQueryParam(resolvedSearch.marketCode)
  };

  const snapshot = name
    ? await loadConfigurationCertificateDetail(name, query, { cache: 'no-store' })
    : await loadConfigurationCertificateDetail('', query, { cache: 'no-store' });

  return (
    <AdminPermissionGate
      requiredPermission="foundation.governance.read"
      title="证书详情访问受限"
      description="证书详情页已接入管理员本地 session，只有具备 foundation.governance.read 的账号才能查看 issuer、自动续签状态、关联证书与跨工作台深链。"
    >
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
        <PageShell
          title={snapshot.notFound ? '证书不存在' : `证书详情：${snapshot.name}`}
          subtitle={
            snapshot.notFound
              ? '该证书不在当前 configuration-governance 范围内，可能已下线、租户不匹配或拼写错误。'
              : '查看单个证书的元数据、issuer、自动续签状态、相关证书与跨工作台深链。'
          }
        >
          <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载证书详情..." />}>
            <ConfigurationCertificateDetailClient snapshot={snapshot} />
          </Suspense>
        </PageShell>
      </main>
    </AdminPermissionGate>
  );
}
