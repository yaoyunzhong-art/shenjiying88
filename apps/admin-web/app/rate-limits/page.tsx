/**
 * rate-limits/page.tsx — 限流策略与配额账本
 *
 * 服务器端组件: 处理 searchParams 查询、加载限流工作台数据、
 * 通过 Suspense + ErrorBoundary 包裹客户端组件 RateLimitsWorkspaceClient
 *
 * 功能:
 *  - 查询参数解析（tenantId/policyCode/subjectKey/status）
 *  - ALL 通配状态查询
 *  - 数组参数 & undefined 参数防御
 *  - PageShell 外壳 + subtitle 描述
 *  - force-dynamic 动态渲染 + no-store 缓存策略
 */

import { Suspense } from 'react';
import { PageShell, ErrorBoundary } from '@m5/ui';
import { loadRateLimitWorkspace } from '../../rate-limits-view-model';
import RateLimitsWorkspaceClient from './rate-limits-workspace-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        maxWidth: 1280,
        margin: '0 auto',
        padding: '24px 32px',
        opacity: 0.6,
      }}
      aria-label="加载限流配额"
    >
      <div
        style={{
          height: 24,
          width: 240,
          background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
          borderRadius: 6,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <div
        style={{
          height: 14,
          width: 360,
          background: 'linear-gradient(90deg, rgba(148,163,184,0.1) 25%, rgba(148,163,184,0.2) 50%, rgba(148,163,184,0.1) 75%)',
          borderRadius: 6,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginTop: 8,
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              height: 96,
              borderRadius: 12,
              background: 'linear-gradient(90deg, rgba(148,163,184,0.08) 25%, rgba(148,163,184,0.16) 50%, rgba(148,163,184,0.08) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
      <div
        style={{
          height: 320,
          borderRadius: 12,
          background: 'linear-gradient(90deg, rgba(148,163,184,0.06) 25%, rgba(148,163,184,0.12) 50%, rgba(148,163,184,0.06) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  );
}

/**
 * 安全读取查询参数的辅助函数。
 * 处理 undefined、数组、字符串等类型，统一返回 string | undefined。
 */
function readQueryParam(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }
  return value;
}

interface RateLimitsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

async function RateLimitsContent({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  let params: Record<string, string | string[] | undefined> = {};
  if (searchParams) {
    params = await searchParams;
  }

  const tenantId = readQueryParam(params.tenantId);
  const policyCode = readQueryParam(params.policyCode);
  const subjectKey = readQueryParam(params.subjectKey);
  const status = readQueryParam(params.status);

  const { workspace } = await loadRateLimitWorkspace(
    {
      tenantId,
      policyCode,
      subjectKey,
      status,
    },
    { cache: 'no-store' },
  );

  return <RateLimitsWorkspaceClient workspace={workspace} />;
}

export default async function RateLimitsPage({
  searchParams,
}: RateLimitsPageProps) {
  return (
    <PageShell
      title="⏱️ 限流与配额管理"
      subtitle="限流策略与配额账本 — 健康/告警/封禁三态分桶 · 支持 ALL 通配查询"
    >
      <ErrorBoundary
        name="RateLimitsErrorBoundary"
        severity="block"
        description="限流工作台加载异常，请刷新重试"
        retryLabel="重试加载"
      >
        <Suspense fallback={<LoadingSkeleton />}>
          <RateLimitsContent searchParams={searchParams} />
        </Suspense>
      </ErrorBoundary>
    </PageShell>
  );
}
