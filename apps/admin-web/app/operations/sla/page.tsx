/**
 * SLA 监控看板 (Next.js App Router)
 *
 * 对标凤梨收银"30秒响应"运维承诺, 金华 8,000 家门店渗透。
 * 神机营运维 SLA 可视化看板, 直接决定开店客户签约信心。
 *
 * 功能:
 * - 总体SLA达成率卡片 (99.9%/99.5%/99%分位)
 * - 响应时间趋势 (平均/中位/P99响应时间最近24h)
 * - 服务可用性 (各服务状态绿/黄/红)
 * - 最近告警列表 (时间/来源/级别/状态)
 * - 自动修复率统计
 * - 状态管理: loading / empty / error
 * - 数据表 + 操作栏 + 筛选
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmptyState, ErrorBoundary, LoadingSkeleton, PageShell } from '@m5/ui';
import { loadSLADashboard } from '../../sla-view-model';
import SLADashboardClient from './sla-dashboard-client';

export const metadata: Metadata = {
  title: 'SLA 监控看板 - M5 指挥台',
  description:
    '运维 SLA 可视化看板: 达成率/响应时间/服务可用性/告警/自动修复。对标凤梨收银30秒响应承诺。',
  openGraph: {
    title: 'SLA 监控看板 | 运维治理',
    description: '运维 SLA 可视化看板: 达成率/响应时间/服务可用性/告警/自动修复',
    type: 'website',
  },
};

/** 加载占位 */
function SLALoadingFallback() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      {/* SLA 达成率卡片区 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={3} label={`SLA 达成率加载 ${i}`} />
        ))}
      </div>

      {/* 响应时间趋势区域 */}
      <div style={{ marginBottom: 24 }}>
        <LoadingSkeleton variant="card" rows={4} label="响应时间趋势加载" />
      </div>

      {/* 服务可用性 + 告警列表 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        <LoadingSkeleton variant="card" rows={5} label="服务可用性加载" />
        <LoadingSkeleton variant="card" rows={5} label="告警列表加载" />
      </div>

      {/* 自动修复区 */}
      <LoadingSkeleton variant="card" rows={3} label="自动修复统计加载" />
    </main>
  );
}

/** 错误回退 */
function SLAErrorFallback() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <EmptyState
        title="SLA 数据加载失败"
        description="无法加载运维 SLA 监控数据。请确保服务端以及 sla-view-model 正常，再次重试。"
        action={<a href="/operations/sla">重试</a>}
      />
    </main>
  );
}

/** 空状态 */
function SLAEmptyState() {
  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <EmptyState
        title="暂无 SLA 数据"
        description="当前未采集到任何运维 SLA 指标。请确保监控组件已正确部署并上报数据。"
        action={<a href="/operations/sla">重新加载</a>}
      />
    </main>
  );
}

export default async function SLAPage() {
  let snapshot;
  try {
    snapshot = loadSLADashboard();
  } catch {
    return <SLAErrorFallback />;
  }

  if (!snapshot) {
    return <SLAEmptyState />;
  }

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'SLA 监控看板',
            applicationCategory: 'BusinessApplication',
            description:
              '运维 SLA 可视化看板: 达成率/响应时间/服务可用性/告警/自动修复。对标凤梨收银30秒响应。',
          }),
        }}
      />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <PageShell
          title="SLA 监控看板"
          subtitle="对标凤梨收银 30 秒响应承诺 · 运维 SLA 可视化 · 直接提升客户签约信心"
        >
          <ErrorBoundary fallback={() => <SLAErrorFallback />}>
            <Suspense fallback={<SLALoadingFallback />}>
              <SLADashboardClient snapshot={snapshot} />
            </Suspense>
          </ErrorBoundary>

          {/* 数据说明 */}
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
            本看板展示运维 SLA 核心指标。达成率基于实际请求采样计算。
            服务可用性数据来源: 可观测性管道。响应时间趋势覆盖最近 24 小时。
            告警列表仅展示最近 48 小时事件。数据自动更新频率：操作后实时刷新。
          </div>
        </PageShell>
      </main>
    </>
  );
}
