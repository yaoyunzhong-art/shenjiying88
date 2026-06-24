import { Suspense } from 'react';
import { LoadingSkeleton, PageShell } from '@m5/ui';
import { readIdentityAccessSessionDetailParam } from '@m5/types';
import { loadIdentityAccessSessionDetail } from '../../../identity-access-detail-view-model';
import IdentityAccessSessionDetailClient from './identity-access-session-detail-client';

interface IdentityAccessSessionDetailPageProps {
  params: Promise<{ session?: string | string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readSession(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readIdentityAccessSessionDetailParam(value);
  }
  return readIdentityAccessSessionDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function IdentityAccessSessionDetailPage({
  params,
  searchParams
}: IdentityAccessSessionDetailPageProps) {
  const [resolvedParams, resolvedSearch] = await Promise.all([params, searchParams]);
  const session = readSession(resolvedParams.session);

  const query = {
    tenantId: readQueryParam(resolvedSearch.tenantId),
    brandId: readQueryParam(resolvedSearch.brandId),
    storeId: readQueryParam(resolvedSearch.storeId),
    marketCode: readQueryParam(resolvedSearch.marketCode)
  };

  const snapshot = session
    ? await loadIdentityAccessSessionDetail(session, query, { cache: 'no-store' })
    : await loadIdentityAccessSessionDetail('', query, { cache: 'no-store' });

  return (
    <main style={{ maxWidth: 1080, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={snapshot.notFound ? '会话不存在' : `会话：${snapshot.session}`}
        subtitle={
          snapshot.notFound
            ? '当前身份上下文中没有该会话/actor，可能已登出或拼写错误。'
            : '查看 actor/会话的身份上下文、角色/权限清单、校验结果与跨工作台深链。'
        }
      >
        <Suspense fallback={<LoadingSkeleton variant="card" rows={4} label="加载会话详情..." />}>
          <IdentityAccessSessionDetailClient snapshot={snapshot} />
        </Suspense>
      </PageShell>
    </main>
  );
}
