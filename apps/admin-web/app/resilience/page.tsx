/**
 * ResiliencePage — 强韧性作战台 (Next.js App Router)
 *
 * 功能:
 * - 统一监控可观测信号、重试策略与恢复计划演练进度
 * - 运营/运维治理辅助：信号状态一览、策略健康度、恢复计划完成率
 * - 统计概览：总信号数 / 正常信号 / 告警 / 重试策略 / 恢复计划
 * - no-store 缓存策略确保每次访问获取最新数据
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, PageShell, ErrorBoundary } from '@m5/ui';
import { loadResilienceOperationsSnapshot } from '../resilience-view-model';
import ResilienceWorkspaceClient from './resilience-workspace-client';

export const metadata: Metadata = {
  title: '强韧性作战台 - M5 指挥台',
  description:
    '统一监控可观测信号、重试策略与恢复计划演练进度，辅助运维治理与故障响应。',
  openGraph: {
    title: '强韧性作战台 | 运维治理',
    description: '统一监控可观测信号、重试策略与恢复计划演练进度',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** 加载占位 */
function ResilienceLoadingFallback() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={3} label={`加载统计项 ${i}`} />
        ))}
      </div>
      <LoadingSkeleton variant="card" rows={6} label="加载内容列表..." />
    </main>
  );
}

function ResilienceErrorFallback() {
  return (
    <EmptyState
      title="强韧性数据加载失败"
      description="无法加载可观测信号、重试策略或恢复计划数据。"
      action={<a href="/resilience">重试</a>}
    />
  );
}

export default async function ResiliencePage() {
  let snapshot;
  try {
    snapshot = await loadResilienceOperationsSnapshot({ cache: 'no-store' });
  } catch {
    return <ResilienceErrorFallback />;
  }

  const overview = snapshot.overview;

  const summaryStats = overview
    ? [
        {
          label: '可观测信号',
          value: overview.signals?.total?.toString() ?? '0',
          detail: `${overview.signals?.healthy ?? 0} 正常 / ${overview.signals?.alerting ?? 0} 告警`,
          color: '#60a5fa',
        },
        {
          label: '重试策略',
          value: overview.retries?.total?.toString() ?? '0',
          detail: `${overview.retries?.active ?? 0} 活跃 / ${overview.retries?.failed ?? 0} 失败`,
          color: '#34d399',
        },
        {
          label: '恢复计划',
          value: overview.plans?.total?.toString() ?? '0',
          detail: `${overview.plans?.completed ?? 0} 完成 / ${overview.plans?.pending ?? 0} 待执行`,
          color: '#fbbf24',
        },
      ]
    : [];

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <PageShell
        title="强韧性作战台"
        subtitle="统一监控可观测信号、重试策略与恢复计划演练进度，辅助运维治理与故障响应。"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {summaryStats.map((stat) => (
            <div
              key={stat.label}
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(148,163,184,0.08)',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color, marginBottom: 2 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: '#f8fafc', fontWeight: 600, marginBottom: 2 }}>
                {stat.label}
              </div>
              {stat.detail && (
                <div style={{ fontSize: 11, color: '#64748b' }}>{stat.detail}</div>
              )}
            </div>
          ))}
        </div>

        <ErrorBoundary fallback={<ResilienceErrorFallback />}>
          <Suspense fallback={<ResilienceLoadingFallback />}>
            <ResilienceWorkspaceClient overview={overview} />
          </Suspense>
        </ErrorBoundary>
      </PageShell>
    </main>
  );
}
