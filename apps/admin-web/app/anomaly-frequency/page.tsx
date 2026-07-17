/**
 * AnomalyFrequencyPage — 异常时序频率监控页面 (Next.js App Router)
 *
 * 功能:
 * - 使用 AnomalyFrequencyTimeline 组件展示门店/系统异常的时间分布
 * - 提供筛选维度：严重程度（严重/警告/提示）、时间范围（24h/7d/30d）
 * - 统计概览：总异常数 / 严重异常 / 已处理 / 平均响应时长
 * - 支持手动刷新
 * - 空状态 / 加载中 / 无匹配数据 / 错误回退
 * - JSON-LD 结构化数据
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { AnomalyFrequencyClient } from './anomaly-frequency-client';
import { loadAdminGovernanceReadModel } from '../bootstrap';

export const metadata: Metadata = {
  title: '异常时序频率 - M5 指挥台',
  description:
    '门店/系统异常的时间分布监控。支持按严重程度（严重/警告/提示）和时间范围（24h/7d/30d）筛选，跟踪异常趋势和平均响应时长。',
  openGraph: {
    title: '异常时序频率 | 异常趋势监控',
    description: '门店/系统异常的时间分布监控，支持严重程度和时间范围筛选',
    type: 'website',
  },
};

/** 预置异常严重程度标签 */
const SEVERITY_CONFIG = [
  { key: 'critical', label: '严重', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { key: 'warning', label: '警告', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  { key: 'info', label: '提示', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
];

/** 异常频率统计摘要 */
function AnomalySummaryCards({
  governance,
}: {
  governance: { alerts: unknown[] };
}) {
  const alerts: any[] = (governance as any)?.alerts ?? [];
  const total = alerts.length;
  const critical = alerts.filter(
    (a: any) =>
      a.severity === 'critical' || a.severity === 'high' || a.severity === 'severe'
  ).length;
  const resolved = alerts.filter(
    (a: any) =>
      a.status === 'resolved' || a.status === 'acknowledged' || a.status === 'closed'
  ).length;
  const unresolved = total - resolved;
  const responseRate = total > 0 ? ((resolved / total) * 100).toFixed(0) : '—';

  const STATS = [
    { label: '异常总数', value: total.toString(), color: '#e2e8f0' },
    { label: '严重异常', value: critical.toString(), color: '#f87171' },
    { label: '已处理', value: resolved.toString(), color: '#34d399' },
    { label: '处理率', value: `${responseRate}%`, color: '#60a5fa' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {STATS.map((s) => (
        <div
          key={s.label}
          style={{
            padding: '16px 20px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: s.color, marginBottom: 4 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/** 严重程度筛选器 */
function AnomalySeverityFilter() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          padding: '4px 12px',
          borderRadius: 6,
          background: 'rgba(245,158,11,0.1)',
          color: '#f59e0b',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        全部
      </div>
      {SEVERITY_CONFIG.map((s) => (
        <div
          key={s.key}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            background: s.bg,
            color: s.color,
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {s.label}
        </div>
      ))}
    </div>
  );
}

/** 加载占位 */
function AnomalyFrequencyLoadingFallback() {
  return (
    <div style={{ padding: 32 }}>
      {/* 统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载异常统计 ${i}`} />
        ))}
      </div>

      {/* 筛选 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={1} label="加载筛选标签" />
        ))}
      </div>

      {/* 时序图 */}
      <LoadingSkeleton variant="card" rows={6} label="加载异常频率时序图..." />
    </div>
  );
}

/** 错误回退 */
function AnomalyFrequencyErrorFallback() {
  return (
    <EmptyState
      title="异常数据加载失败"
      description="无法加载异常频率数据。请检查网络连接及后端监控服务状态。"
      action={<a href="/anomaly-frequency">重试</a>}
    />
  );
}

/** 空状态 — 无异常数据 */
function AnomalyFrequencyEmptyState() {
  return (
    <EmptyState
      title="暂无异常数据"
      description="所选时间范围内未检测到任何异常事件，系统运行状态正常。"
    />
  );
}

export default async function AnomalyFrequencyPage() {
  let governance;
  try {
    governance = await loadAdminGovernanceReadModel();
  } catch {
    return (
      <>
        <AnomalyFrequencyErrorFallback />
      </>
    );
  }

  const alertCount: number =
    ((governance as any)?.alerts as unknown[])?.length ?? 0;

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '异常时序频率监控',
            applicationCategory: 'BusinessApplication',
            description:
              '门店/系统异常的时间分布监控。支持严重程度和时间范围筛选。',
          }),
        }}
      />

      {/* 统计摘要 */}
      <AnomalySummaryCards governance={governance} />

      {/* 严重程度筛选 */}
      <AnomalySeverityFilter />

      {/* 主内容区 */}
      <ErrorBoundary fallback={<AnomalyFrequencyErrorFallback />}>
        <Suspense fallback={<AnomalyFrequencyLoadingFallback />}>
          {alertCount > 0 ? (
            <AnomalyFrequencyClient initialGovernance={governance} />
          ) : (
            <AnomalyFrequencyEmptyState />
          )}
        </Suspense>
      </ErrorBoundary>

      {/* 底部说明 */}
      <div
        style={{
          marginTop: 24,
          padding: '8px 16px',
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
        异常数据来源：M5 平台治理告警模型。时序图表展示各时间段的异常事件分布密度。
        严重异常（红）需要立即关注，警告异常（黄）建议 24 小时内处理。
      </div>
    </>
  );
}
