/**
 * ResiliencePage — 强韧性作战台 (Next.js App Router)
 *
 * 功能:
 * - 统一监控可观测信号、重试策略与恢复计划演练进度
 * - 运营/运维治理辅助：信号状态一览、策略健康度、恢复计划完成率
 * - 多维度筛选：信号类型、策略状态、计划状态
 * - 统计概览：总信号数 / 正常信号 / 告警 / 重试策略 / 恢复计划
 * - 空状态 / 加载中 / 错误回退 / 数据过期提示
 * - no-store 缓存策略确保每次访问获取最新数据
 * - JSON-LD 结构化数据
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

/** 统计数据项配置 */
const DEFAULT_STATS = [
  { label: '可观测信号', value: '—', color: '#94a3b8' },
  { label: '重试策略', value: '—', color: '#94a3b8' },
  { label: '恢复计划', value: '—', color: '#94a3b8' },
];

/** 加载占位 — 3 列统计 + 3 个 Tab 区 */
function ResilienceLoadingFallback() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={3} label={`加载统计项 ${i}`} />
        ))}
      </div>

      {/* Tab 栏 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={1} label="加载 Tab" />
        ))}
      </div>

      {/* 列表 */}
      <LoadingSkeleton variant="card" rows={6} label="加载内容列表..." />
    </main>
  );
}

/** 错误回退 */
function ResilienceErrorFallback() {
  return (
    <EmptyState
      title="强韧性数据加载失败"
      description="无法加载可观测信号、重试策略或恢复计划数据。请确保 resilence-view-model 服务正常，再次重试。"
      action={<a href="/resilience">重试</a>}
    />
  );
}

/** 空状态 */
function ResilienceEmptyState() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <EmptyState
        title="暂无强韧性数据"
        description="当前未配置任何可观测信号、重试策略或恢复计划。请从「配置」模块开始建立强韧性治理体系。"
        action={<a href="/resilience">前往配置</a>}
      />
    </main>
  );
}

export default async function ResiliencePage() {
  let snapshot;
  try {
    snapshot = await loadResilienceOperationsSnapshot({ cache: 'no-store' });
  } catch {
    return (
      <>
        <ResilienceErrorFallback />
      </>
    );
  }

  if (!snapshot) {
    return <ResilienceEmptyState />;
  }

  const overview = snapshot.overview;

  /** 构建实时统计卡片 */
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
    : DEFAULT_STATS;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '强韧性作战台',
            applicationCategory: 'BusinessApplication',
            description:
              '统一监控可观测信号、重试策略与恢复计划演练进度，辅助运维治理与故障响应。',
          }),
        }}
      />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        {/* 页面标题 */}
        <PageShell
          title="强韧性作战台"
          subtitle="统一监控可观测信号、重试策略与恢复计划演练进度，辅助运维治理与故障响应。"
        >
          {/* 统计摘要卡片 */}
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
                {'detail' in stat && (
                  <div style={{ fontSize: 11, color: '#64748b' }}>{stat.detail}</div>
                )}
              </div>
            ))}
          </div>

          {/* 错误边界 + 主体内容 */}
          <ErrorBoundary fallback={<ResilienceErrorFallback />}>
            <Suspense fallback={<ResilienceLoadingFallback />}>
              <ResilienceWorkspaceClient overview={overview} />
            </Suspense>
          </ErrorBoundary>

          {/* 底部数据说明 */}
          <div
            style={{
              marginTop: 24,
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(148,163,184,0.08)',
              fontSize: 12,
              color: '#94a3b8',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: '#e2e8f0' }}>数据说明</strong>
            <br />
            本页面采用 no-store 缓存策略，每次访问均加载最新数据。
            可观测信号数据来源：M5 可观测性管道。
            重试策略和恢复计划数据来源：resilience-view-model。
            数据自动更新频率：操作后实时刷新。
          </div>
        </PageShell>
      </main>
    </>
  );
}
