import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readIdentityAccessPermissionDetailParam } from '@m5/types';
import { loadIdentityAccessPermissionDetail } from '../../../identity-access-detail-view-model';
import IdentityAccessPermissionDetailClient from './identity-access-permission-detail-client';

interface IdentityAccessPermissionDetailPageProps {
  params: Promise<{ permission?: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readPermission(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readIdentityAccessPermissionDetailParam(value);
  }
  return readIdentityAccessPermissionDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function IdentityAccessPermissionDetailPage({
  params,
  searchParams
}: IdentityAccessPermissionDetailPageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const permission = readPermission(resolvedParams.permission);

  const query = {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    brandId: readQueryParam(resolvedSearch.brandId),
    storeId: readQueryParam(resolvedSearch.storeId),
    marketCode: readQueryParam(resolvedSearch.marketCode)
  };

  const snapshot = permission
    ? await loadIdentityAccessPermissionDetail(permission, query, { cache: 'no-store' })
    : await loadIdentityAccessPermissionDetail('', query, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '权限不存在' : `权限：${snapshot.permission}`}
        subtitle={
          snapshot.notFound
            ? '当前身份上下文中没有该权限，可能已下线或拼写错误。'
            : '查看权限元数据、当前 actor 是否持有、相关角色与跨工作台深链。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载权限详情..." />}>
          <IdentityAccessPermissionDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
