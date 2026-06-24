import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readIdentityAccessRoleDetailParam } from '@m5/types';
import { loadIdentityAccessRoleDetail } from '../../../identity-access-detail-view-model';
import IdentityAccessRoleDetailClient from './identity-access-role-detail-client';

interface IdentityAccessRoleDetailPageProps {
  params: Promise<{ role?: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readRole(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readIdentityAccessRoleDetailParam(value);
  }
  return readIdentityAccessRoleDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function IdentityAccessRoleDetailPage({
  params,
  searchParams
}: IdentityAccessRoleDetailPageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const role = readRole(resolvedParams.role);

  const query = {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    brandId: readQueryParam(resolvedSearch.brandId),
    storeId: readQueryParam(resolvedSearch.storeId),
    marketCode: readQueryParam(resolvedSearch.marketCode)
  };

  const snapshot = role
    ? await loadIdentityAccessRoleDetail(role, query, { cache: 'no-store' })
    : await loadIdentityAccessRoleDetail('', query, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '角色不存在' : `角色：${snapshot.role}`}
        subtitle={
          snapshot.notFound
            ? '当前身份上下文中没有该角色，可能已下线或拼写错误。'
            : '查看角色元数据、当前 actor 是否持有该角色、相关权限与跨工作台深链。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载角色详情..." />}>
          <IdentityAccessRoleDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
