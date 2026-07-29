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
import { loadReturnsSnapshot } from './return-data';
import { ReturnListClient } from './return-list-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  return (
    <>
      {returns && returns.length > 0 && <ReturnSummaryCards returns={returns} />}

      <ErrorBoundary fallback={<ReturnListErrorFallback />}>
        <Suspense fallback={<ReturnListLoadingFallback />}>
          {returns && returns.length > 0 ? (
            <ReturnListClient returns={returns} />
          ) : returns && returns.length === 0 ? (
            <ReturnEmptyState />
          ) : null}
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
