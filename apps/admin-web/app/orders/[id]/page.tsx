'use client';

import { useParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { message } from 'antd';
import {
  PageShell,
  StatusBadge,
  DetailShell,
  DescriptionList,
  type DescriptionItem,
  DetailActionBar,
  StatusBadge as Sb,
} from '@m5/ui';

import { loadOrderDetail, getStatusColor } from '../../orders-detail-view-model';
import {
  MOCK_ORDERS,
  ORDER_STATUS_MAP,
  ORDER_CHANNEL_MAP,
  type OrderStatus,
} from '../../orders-data';
import Link from 'next/link';

// ---- 金额格式化 ----

function formatAmount(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

// ---- 页面内容 ----

function OrderDetailContent() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? '';
  const vm = useMemo(() => loadOrderDetail(orderId), [orderId]);

  if (!vm) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 32, color: '#f87171' }}>
        <h2>订单不存在</h2>
        <p>未找到订单 id=&quot;{orderId}&quot;，请检查链接是否正确。</p>
        <Link href="/orders" style={{ color: '#93c5fd' }}>
          ← 返回订单列表
        </Link>
      </main>
    );
  }

  const { order, statusLabel, statusVariant, channelLabel, nextStatuses, isTerminal } = vm;
  const discountRatio = order.totalAmount > 0
    ? ((order.discountAmount / order.totalAmount) * 100).toFixed(1)
    : '0.0';

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <PageShell
        title={`订单详情 - ${order.orderNo}`}
        subtitle={`客户: ${order.customerName} | ${order.customerPhone}`}
      >
        {/* 顶部状态栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            padding: '16px 20px',
            borderRadius: 12,
            background: 'rgba(15, 23, 42, 0.35)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>订单状态:</span>
            <StatusBadge label={statusLabel} variant={statusVariant} size="md" dot />
            {isTerminal && (
              <span style={{ fontSize: 12, color: '#64748b' }}>
                (终态，不可流转)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>渠道:</span>
            <StatusBadge label={channelLabel} variant={ORDER_CHANNEL_MAP[order.channel].variant} size="sm" />
          </div>
        </div>

        {/* 明细信息 */}
        <DetailShell title="订单信息">
          <DescriptionList
            items={
              [
                { label: '订单号', value: order.orderNo },
                { label: '客户姓名', value: order.customerName },
                { label: '联系电话', value: order.customerPhone },
                { label: '下单渠道', render: () => <StatusBadge label={channelLabel} variant={ORDER_CHANNEL_MAP[order.channel].variant} size="sm" /> },
                { label: '订单状态', render: () => <StatusBadge label={statusLabel} variant={statusVariant} size="sm" dot /> },
                { label: '商品件数', value: `${order.itemCount} 件` },
                { label: '订单金额', render: () => <span style={{ fontWeight: 600, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>{formatAmount(order.totalAmount)}</span> },
                { label: '优惠金额', render: () => <span style={{ fontWeight: 600, color: order.discountAmount > 0 ? '#4ade80' : '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>-{formatAmount(order.discountAmount)} ({discountRatio}%)</span> },
                { label: '实付金额', render: () => <span style={{ fontWeight: 700, color: '#4ade80', fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{formatAmount(order.paidAmount)}</span> },
                { label: '所属门店', value: order.storeName },
                { label: '市场区域', value: order.marketCode },
                { label: '导购员', value: order.salesClerk },
                { label: '备注', value: order.note || '(无)' },
                { label: '创建时间', value: order.createdAt },
                { label: '最后更新', value: order.updatedAt },
              ] as DescriptionItem[]
            }
          />
        </DetailShell>

        {/* 操作栏 */}
        <DetailActionBar
          actions={
            !isTerminal
              ? nextStatuses.map((ns) => ({
                  key: ns.key,
                  label: ns.label,
                  variant: (ns.key === 'cancelled' || ns.key === 'refunded')
                    ? 'danger' as const
                    : 'primary' as const,
                  onClick: () => {
                    message.warning('状态流转API尚未接入，暂无法操作');
                  },
                }))
              : []
          }
        />
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link href="/orders" style={{ color: '#93c5fd', fontSize: 14 }}>
            ← 返回订单列表
          </Link>
        </div>
      </PageShell>
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32, color: '#cbd5e1' }}>加载订单详情...</div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
