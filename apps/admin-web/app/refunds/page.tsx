/**
 * 退款管理 — Refund List Page (Next.js App Router)
 * P1-3 共享层收口: server snapshot 优先加载, 不可用时回落 fallback
 *
 * 功能:
 * - 管理门店退款申请审批与处理流程
 * - 支持仅退款、换货、退货退款等多种类型
 * - 状态筛选（待审核/审核中/已退款/已拒绝）
 * - 搜索：按订单号、门店名称、退款单号
 * - 统计概览：待处理 / 已退款总额 / 今日新增
 * - 空状态 / 加载中 / 搜索无结果 / 错误回退
 */

import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import { loadRefundSnapshot } from './refund-data';
import type { RefundItem } from './refund-types';
import { RefundListClient } from './refund-list-client';
import { AdminPermissionGate } from '../components/admin-permission-gate';

/** 退款统计卡片 */
function RefundSummaryCards({ refunds }: { refunds: RefundItem[] }) {
  const pending = refunds.filter((r: any) => r.status === 'pending' || r.status === 'review' || r.status === 'pending_approval').length;
  const approved = refunds.filter((r: any) => r.status === 'approved' || r.status === 'refunded' || r.status === 'completed').length;
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

export const dynamic = 'force-dynamic';

const permissionGate = {
  requiredPermission: 'refunds:read',
  title: '退款管理访问受限',
  description:
    '退款管理页已接入管理员本地 session，只有具备 refunds:read 的账号才能查看退款列表、统计摘要与处理说明。',
} as const

export default async function RefundsPage() {
  const snapshot = await loadRefundSnapshot();
  const refunds = snapshot.refunds;
  const sourceEvidence = {
    deliveryMode: snapshot.deliveryMode,
    controlPlaneSource:
      snapshot.deliveryMode === 'api' ? 'loadRefundSnapshot -> loadRefundsFromApi' : 'loadRefundSnapshot -> getRefunds fallback samples',
    businessDataSource:
      snapshot.deliveryMode === 'api' ? 'RefundItem[] mapped from biz.refunds.list()' : 'local refund sample records',
    refreshPath: 'RefundsPage -> loadRefundSnapshot',
    generatedAt: snapshot.generatedAt,
    note:
      snapshot.deliveryMode === 'api'
        ? '当前页面优先消费退款 API 快照。'
        : '当前页面已回退到本地退款样本，不可作为真实退款链路复签证据。'
  } as const;

  return (
    <AdminPermissionGate {...permissionGate}>
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

      <div
        style={{
          padding: '12px 16px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(148,163,184,0.08)',
          fontSize: 12,
          color: '#cbd5e1',
          lineHeight: 1.7,
          marginBottom: 16,
        }}
      >
        <div>
          Delivery {sourceEvidence.deliveryMode} · 控制面来源: {sourceEvidence.controlPlaneSource}
        </div>
        <div>
          业务数据: {sourceEvidence.businessDataSource} · 刷新路径: {sourceEvidence.refreshPath}
        </div>
        <div>
          generatedAt: {sourceEvidence.generatedAt} · {sourceEvidence.note}
        </div>
      </div>

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

      {/* 统计摘要 */}
      {refunds.length > 0 && <RefundSummaryCards refunds={refunds} />}

      {/* 主列表 */}
      <ErrorBoundary fallback={<RefundListErrorFallback />}>
        <Suspense fallback={<RefundListLoadingFallback />}>
          {refunds.length > 0 ? (
            <RefundListClient refunds={refunds} />
          ) : (
            <RefundEmptyState />
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
        <strong style={{ color: '#e2e8f0' }}>退款流程说明</strong>
        <br />
        退款申请需经过门店审核 → 财务确认 → 退款到账三个环节。
        仅退款通常在审核通过后 1-3 个工作日到账。
        退换货申请审核通过后需用户寄回商品。
      </div>
      </>
    </AdminPermissionGate>
  );
}
