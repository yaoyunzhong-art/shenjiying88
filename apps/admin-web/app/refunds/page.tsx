/**
 * 退款管理 — Refund List Page (Next.js App Router)
 * P1-3 共享层收口: server snapshot 优先加载, 不可用时回落 fallback
 *
 * 功能:
 * - 管理门店退款申请审批与处理流程
 * - 支持仅退款、换货、退货退款等多种类型
 * - 统计概览：待处理 / 已退款总额 / 今日新增
 * - 空状态 / 加载中 / 错误回退
 */
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { loadRefundSnapshot, getRefunds } from './refund-data';
import type { RefundItem } from './refund-types';
import { RefundListClient } from './refund-list-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Next.js Metadata: 退款管理页面 SEO/分享卡片 */
export const metadata = {
  title: '退款管理 - 数字运动潮玩平台',
  description: '管理门店退款申请审批与处理流程。仅退款 / 换货 / 退货退款等多类型支持。',
  openGraph: {
    title: '退款管理 - 神机营体育',
    description: '审批、处理、退款统计一站式管理',
    type: 'website',
    locale: 'zh_CN',
  },
};

/** 退款统计卡片 */
function RefundSummaryCards({ refunds }: { refunds: RefundItem[] }) {
  const pending = refunds.filter(
    (r: any) => r.status === 'pending' || r.status === 'review' || r.status === 'pending_approval',
  ).length;
  const approved = refunds.filter(
    (r: any) => r.status === 'approved' || r.status === 'refunded' || r.status === 'completed',
  ).length;
  const rejected = refunds.filter((r: any) => r.status === 'rejected').length;
  const totalAmount = refunds
    .filter((r: any) => r.status === 'refunded' || r.status === 'approved' || r.status === 'completed')
    .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

  const SUMMARY_ITEMS = [
    { label: '待处理', value: pending.toString(), color: '#fbbf24' },
    { label: '已退款', value: approved.toString(), color: '#34d399' },
    { label: '已拒绝', value: rejected.toString(), color: '#f87171' },
    { label: '已退总额', value: `¥${totalAmount.toLocaleString()}`, color: '#60a5fa' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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

function RefundListLoadingFallback() {
  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3, 4].map((i) => (
          <LoadingSkeleton key={i} variant="card" rows={2} label={`加载退款统计 ${i}`} />
        ))}
      </div>
      <LoadingSkeleton variant="card" rows={6} label="加载退款列表..." />
    </div>
  );
}

function RefundListErrorFallback() {
  return (
    <EmptyState
      title="退款数据加载失败"
      description="无法获取退款申请列表。"
      action={<a href="/refunds">重试</a>}
    />
  );
}

function RefundEmptyState() {
  return (
    <EmptyState
      title="暂无退款申请"
      description="当前没有待处理的退款申请。"
      action={<a href="/refunds">查看历史</a>}
    />
  );
}

/** 退款流程说明 — 5 步闭环 */
function RefundProcessGuide() {
  const STEPS = [
    { idx: 1, title: '顾客提交', desc: '顾客在客户端发起退款/换货申请' },
    { idx: 2, title: '门店初审', desc: '门店核验订单与商品状态' },
    { idx: 3, title: '运营审核', desc: '总部运营复核合理性' },
    { idx: 4, title: '财务确认', desc: '财务确认退款渠道与金额' },
    { idx: 5, title: '完成打款', desc: '原路退回 / 储值到账' },
  ];
  return (
    <section
      aria-label="退款流程说明"
      style={{
        marginBottom: 24,
        padding: 20,
        borderRadius: 12,
        background: 'rgba(96, 165, 250, 0.06)',
        border: '1px solid rgba(96, 165, 250, 0.18)',
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: '0 0 12px' }}>
        退款流程说明
      </h2>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 16px' }}>
        完整退款流程包含 5 个环节，依次为 顾客提交 → 门店初审 → 运营审核 → 财务确认 → 完成打款。
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
const REFUND_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '退款管理',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    '神机营体育 — 退款管理后台。支持仅退款、换货、退货退款等多类型审批流程。',
  offers: {
    '@type': 'Offer',
    category: '退款审批',
  },
};

export default async function RefundsPage() {
  const snapshot = await loadRefundSnapshot();
  const refunds = snapshot.refunds;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(REFUND_JSON_LD) }}
      />

      {snapshot.error && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.28)',
            color: '#fde68a',
            fontSize: 12,
          }}
        >
          {snapshot.error}
        </div>
      )}

      <RefundProcessGuide />

      {refunds.length > 0 && <RefundSummaryCards refunds={refunds} />}

      <ErrorBoundary fallback={<RefundListErrorFallback />}>
        <Suspense fallback={<RefundListLoadingFallback />}>
          {refunds.length > 0 ? (
            <RefundListClient refunds={refunds} />
          ) : (
            <RefundEmptyState />
          )}
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
