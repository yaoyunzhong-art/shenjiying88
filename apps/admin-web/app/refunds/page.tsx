/**
 * 退款管理 — Refund List Page (Next.js App Router)
 *
 * 功能:
 * - 管理门店退款申请审批与处理流程
 * - 支持仅退款、换货、退货退款等多种类型
 * - 状态筛选（待审核/审核中/已退款/已拒绝）
 * - 搜索：按订单号、门店名称、退款单号
 * - 统计概览：待处理 / 已退款总额 / 今日新增
 * - 空状态 / 加载中 / 搜索无结果 / 错误回退
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { getRefunds } from './refund-data';
import { RefundListClient } from './refund-list-client';

export const metadata: Metadata = {
  title: '退款管理 - M5 指挥台',
  description:
    '管理门店退换货申请审批与处理流程，支持仅退款、换货、退货退款等多种类型。状态筛选、订单号搜索，统计待处理退款和已退款总额。',
  openGraph: {
    title: '退款管理 | 门店退款处理',
    description: '管理门店退款审批与处理流程，支持仅退款、换货、退货退款等多种类型',
    type: 'website',
  },
};

/** 退款统计卡片 */
function RefundSummaryCards({ refunds }: { refunds: unknown[] }) {
  const pending = refunds.filter((r: any) => r.status === 'pending' || r.status === 'review').length;
  const approved = refunds.filter((r: any) => r.status === 'approved' || r.status === 'refunded').length;
  const rejected = refunds.filter((r: any) => r.status === 'rejected').length;
  const totalAmount = refunds
    .filter((r: any) => r.status === 'refunded' || r.status === 'approved')
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

/** 加载占位 */
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

/** 错误回退 */
function RefundListErrorFallback() {
  return (
    <EmptyState
      title="退款数据加载失败"
      description="无法获取退款申请列表。请检查网络连接，稍后重试。"
      action={<a href="/refunds">重试</a>}
    />
  );
}

/** 空状态 */
function RefundEmptyState() {
  return (
    <EmptyState
      title="暂无退款申请"
      description="当前没有待处理的退款申请，所有退款流程均已完结。"
      action={<a href="/refunds">查看历史</a>}
    />
  );
}

export default function RefundsPage() {
  const refunds = getRefunds();

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '退款管理',
            applicationCategory: 'BusinessApplication',
            description:
              '管理门店退款申请审批与处理流程，支持仅退款、换货、退货退款等多种类型。',
          }),
        }}
      />

      {/* 统计摘要 */}
      {refunds && refunds.length > 0 && <RefundSummaryCards refunds={refunds} />}

      {/* 主列表 */}
      <ErrorBoundary fallback={<RefundListErrorFallback />}>
        <Suspense fallback={<RefundListLoadingFallback />}>
          {refunds && refunds.length > 0 ? (
            <RefundListClient refunds={refunds} />
          ) : refunds && refunds.length === 0 ? (
            <RefundEmptyState />
          ) : null}
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
        <strong style={{ color: '#e2e8f0' }}>退款流程说明</strong>
        <br />
        退款申请需经过门店审核 → 财务确认 → 退款到账三个环节。
        仅退款通常在审核通过后 1-3 个工作日到账。
        退换货申请审核通过后需用户寄回商品。
      </div>
    </>
  );
}
