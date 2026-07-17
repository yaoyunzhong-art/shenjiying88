/**
 * 退换货管理 — Return List Page (Next.js App Router)
 *
 * 功能:
 * - 管理门店退换货申请审批与处理流程
 * - 支持仅退款、换货、维修等多种退换类型
 * - 状态筛选（待审核/待收货/处理中/已完成/已关闭）
 * - 搜索：按订单号、退货单号、门店名称
 * - 统计概览：待处理 / 已完成 / 维修中
 * - 空状态 / 加载中 / 搜索无结果 / 错误回退
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { getReturns } from './return-data';
import { ReturnListClient } from './return-list-client';

export const metadata: Metadata = {
  title: '退换货管理 - M5 指挥台',
  description:
    '管理门店退换货申请审批与处理流程，支持仅退款、换货、维修等多种退换类型。状态筛选、订单号搜索，统计待处理和已完成退换货。',
  openGraph: {
    title: '退换货管理 | 门店退换处理',
    description: '管理门店退换货审批与处理流程，支持仅退款、换货、维修等多种类型',
    type: 'website',
  },
};

/** 退换货统计摘要 */
function ReturnSummaryCards({ returns }: { returns: unknown[] }) {
  const pending = returns.filter(
    (r: any) => r.status === 'pending' || r.status === 'review'
  ).length;
  const processing = returns.filter(
    (r: any) => r.status === 'processing' || r.status === 'received'
  ).length;
  const completed = returns.filter(
    (r: any) => r.status === 'completed' || r.status === 'refunded'
  ).length;
  const closed = returns.filter((r: any) => r.status === 'closed' || r.status === 'rejected').length;

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

/** 错误回退 */
function ReturnListErrorFallback() {
  return (
    <EmptyState
      title="退换货数据加载失败"
      description="无法获取退换货申请列表。请检查网络连接，稍后重试。"
      action={<a href="/returns">重试</a>}
    />
  );
}

/** 空状态 */
function ReturnEmptyState() {
  return (
    <EmptyState
      title="暂无退换货申请"
      description="当前没有待处理的退换货申请。所有流程均已完结。"
      action={<a href="/returns">查看历史</a>}
    />
  );
}

export default function ReturnsPage() {
  const returns = getReturns();

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '退换货管理',
            applicationCategory: 'BusinessApplication',
            description:
              '管理门店退换货申请审批与处理流程，支持仅退款、换货、维修等多种退换类型。',
          }),
        }}
      />

      {/* 统计摘要 */}
      {returns && returns.length > 0 && <ReturnSummaryCards returns={returns} />}

      {/* 主列表 */}
      <ErrorBoundary fallback={<ReturnListErrorFallback />}>
        <Suspense fallback={<ReturnListLoadingFallback />}>
          {returns && returns.length > 0 ? (
            <ReturnListClient returns={returns} />
          ) : returns && returns.length === 0 ? (
            <ReturnEmptyState />
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
        <strong style={{ color: '#e2e8f0' }}>退换货流程说明</strong>
        <br />
        退换货申请需经过门店审核 → 商品回收 → 质检 → 退款/换货发出。
        维修申请需用户寄回商品，维修周期约 3-7 个工作日。
        用户可在个人中心查看退换货进度。
      </div>
    </>
  );
}
