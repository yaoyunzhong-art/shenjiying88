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
import { loadRefundSnapshot } from './refund-data';
import type { RefundItem } from './refund-types';
import { RefundListClient } from './refund-list-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export default async function RefundsPage() {
  const snapshot = await loadRefundSnapshot();
  const refunds = snapshot.refunds;

  return (
    <>
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
