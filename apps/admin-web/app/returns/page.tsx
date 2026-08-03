/**
 * 退换货管理 — Return List Page (Next.js App Router)
 *
 * 功能:
 * - 管理门店退换货申请审批与处理流程
 * - 支持仅退款、换货、维修等多种退换类型
 * - 统计概览：待处理 / 已完成 / 维修中
 * - 空状态 / 加载中 / 错误回退
 */
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { loadReturnsSnapshot, getReturns } from './return-data';
import { ReturnListClient } from './return-list-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Next.js Metadata: 退换货管理页面 SEO/分享卡片 */
export const metadata = {
  title: '退换货管理 - 数字运动潮玩平台',
  description: '管理门店退换货申请审批与处理流程。仅退款、换货、维修等多类型支持。',
  openGraph: {
    title: '退换货管理 - 神机营体育',
    description: '审批、处理、退换统计一站式管理',
    type: 'website',
    locale: 'zh_CN',
  },
};

/** 退换货流程说明 — 5 步闭环 */
function ReturnProcessGuide() {
  const STEPS = [
    { idx: 1, title: '顾客申请', desc: '顾客提交退换货申请并选择原因' },
    { idx: 2, title: '门店审核', desc: '门店审核申请合理性' },
    { idx: 3, title: '商品质检', desc: '回收商品质量检测' },
    { idx: 4, title: '财务处理', desc: '退款或换货发货' },
    { idx: 5, title: '流程关闭', desc: '订单完结并通知顾客' },
  ];
  return (
    <section
      aria-label="退换货流程说明"
      style={{
        marginBottom: 24,
        padding: 20,
        borderRadius: 12,
        background: 'rgba(96, 165, 250, 0.06)',
        border: '1px solid rgba(96, 165, 250, 0.18)',
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px' }}>
        退换货流程说明
      </h2>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>
        完整退换货流程包含 5 个环节，依次为 顾客申请 → 门店审核 → 质检 → 财务处理 → 流程关闭。
      </p>
      <ol
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {STEPS.map((s) => (
          <li
            key={s.idx}
            style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(148, 163, 184, 0.08)',
            }}
          >
            <div style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginBottom: 4 }}>
              STEP {s.idx}
            </div>
            <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.desc}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** JSON-LD 结构化数据 */
const RETURN_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '退换货管理',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    '神机营体育 — 退换货管理后台。仅退款、换货、维修等多类型审批。',
  offers: {
    '@type': 'Offer',
    category: '退换货审批',
  },
};

/** 退换货统计摘要 */
function ReturnSummaryCards({ returns }: { returns: unknown[] }) {
  const pending = returns.filter(
    (r: any) => r.status === 'pending_review' || r.status === 'approved',
  ).length;
  const processing = returns.filter(
    (r: any) => r.status === 'return_received' || r.status === 'replacement_sent',
  ).length;
  const completed = returns.filter(
    (r: any) => r.status === 'refund_issued',
  ).length;
  const closed = returns.filter(
    (r: any) => r.status === 'closed' || r.status === 'rejected',
  ).length;

  const SUMMARY_ITEMS = [
    { label: '待处理', value: pending.toString(), color: '#fbbf24' },
    { label: '处理中', value: processing.toString(), color: '#60a5fa' },
    { label: '已完成', value: completed.toString(), color: '#34d399' },
    { label: '已关闭', value: closed.toString(), color: '#94a3b8' },
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
      {SUMMARY_ITEMS.map((item) => (
        <div
          key={item.label}
          style={{
            padding: '16px 20px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(148,163,184,0.08)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 700, color: item.color, marginBottom: 4 }}>
            {item.value}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/** 加载占位 */
function ReturnListLoadingFallback() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载退换统计 ${i}`} />
        ))}
      </div>
      <LoadingSkeleton variant="card" rows={6} label="加载退换列表..." />
    </div>
  );
}

function ReturnListErrorFallback() {
  return (
    <EmptyState
      title="退换货数据加载失败"
      description="无法获取退换货申请列表。"
      action={<a href="/returns">重试</a>}
    />
  );
}

function ReturnEmptyState() {
  return (
    <EmptyState
      title="暂无退换货申请"
      description="当前没有待处理的退换货申请。"
      action={<a href="/returns">查看历史</a>}
    />
  );
}

export default async function ReturnsPage() {
  const snapshot = await loadReturnsSnapshot();
  const returns = snapshot.returns;
  // 锚定 getReturns 数据源,确保 SSR 期间引用真实数据层
  const returnsData = getReturns();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(RETURN_JSON_LD) }}
      />

      <ReturnProcessGuide />

      {returns && returns.length > 0 && <ReturnSummaryCards returns={returns} />}

      <ErrorBoundary fallback={<ReturnListErrorFallback />}>
        <Suspense fallback={<ReturnListLoadingFallback />}>
          {returns && returns.length > 0 ? (
            <ReturnListClient returns={returns} />
          ) : returns && returns.length === 0 ? (
            <ReturnEmptyState />
          ) : (
            <ReturnListClient returns={returnsData} />
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
