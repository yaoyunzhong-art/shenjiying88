'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { message } from 'antd'
import {
  DetailActionBar,
  DescriptionList,
  DetailShell,
  PageShell,
  StatusBadge,
  type DescriptionItem,
} from '@m5/ui'
import { ORDER_CHANNEL_MAP } from '../../orders-data'
import { formatAmount, type OrderDetailSnapshot } from './order-detail-data'

export default function OrderDetailClient({ snapshot }: { snapshot: OrderDetailSnapshot }) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const vm = snapshot.viewModel

  function handleRefresh() {
    startRefresh(() => router.refresh())
  }

  if (!vm) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
        <div style={{ marginBottom: 16, fontSize: 12, color: '#cbd5e1' }}>
          客户端快照上下文: {snapshot.sourceLabel} · 刷新路径: {snapshot.refreshPath}
          <button type="button" onClick={handleRefresh} style={{ marginLeft: 12 }}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>
        <div style={{ color: '#f87171' }}>
          <h2>订单不存在</h2>
          <p>未找到订单 id=&quot;{snapshot.id}&quot;，请检查链接是否正确。</p>
          <Link href="/orders" style={{ color: '#93c5fd' }}>
            ← 返回订单列表
          </Link>
        </div>
      </main>
    )
  }

  const { order, statusLabel, statusVariant, channelLabel, nextStatuses, isTerminal } = vm
  const discountRatio = order.totalAmount > 0 ? ((order.discountAmount / order.totalAmount) * 100).toFixed(1) : '0.0'

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <PageShell title={`订单详情 - ${order.orderNo}`} subtitle={`客户: ${order.customerName} | ${order.customerPhone}`}>
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
            color: '#cbd5e1',
            fontSize: 12,
          }}
        >
          <div>
            客户端快照上下文: {snapshot.sourceLabel} · 订单样本: {order.id} · 刷新路径: {snapshot.refreshPath}
          </div>
          <button type="button" onClick={handleRefresh}>
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>

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
            {isTerminal ? <span style={{ fontSize: 12, color: '#64748b' }}>(终态，不可流转)</span> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>渠道:</span>
            <StatusBadge label={channelLabel} variant={ORDER_CHANNEL_MAP[order.channel].variant} size="sm" />
          </div>
        </div>

        <DetailShell title="订单信息">
          <DescriptionList
            items={
              [
                { label: '订单号', value: order.orderNo },
                { label: '客户姓名', value: order.customerName },
                { label: '联系电话', value: order.customerPhone },
                {
                  label: '下单渠道',
                  render: () => <StatusBadge label={channelLabel} variant={ORDER_CHANNEL_MAP[order.channel].variant} size="sm" />,
                },
                { label: '订单状态', render: () => <StatusBadge label={statusLabel} variant={statusVariant} size="sm" dot /> },
                { label: '商品件数', value: `${order.itemCount} 件` },
                {
                  label: '订单金额',
                  render: () => (
                    <span style={{ fontWeight: 600, color: '#fbbf24', fontVariantNumeric: 'tabular-nums' }}>
                      {formatAmount(order.totalAmount)}
                    </span>
                  ),
                },
                {
                  label: '优惠金额',
                  render: () => (
                    <span
                      style={{
                        fontWeight: 600,
                        color: order.discountAmount > 0 ? '#4ade80' : '#94a3b8',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      -{formatAmount(order.discountAmount)} ({discountRatio}%)
                    </span>
                  ),
                },
                {
                  label: '实付金额',
                  render: () => (
                    <span style={{ fontWeight: 700, color: '#4ade80', fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
                      {formatAmount(order.paidAmount)}
                    </span>
                  ),
                },
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

        <DetailActionBar
          actions={
            !isTerminal
              ? nextStatuses.map((status) => ({
                  key: status.key,
                  label: status.label,
                  variant: status.key === 'cancelled' || status.key === 'refunded' ? ('danger' as const) : ('primary' as const),
                  onClick: () => {
                    message.warning('状态流转 API 尚未接入，暂无法操作')
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
  )
}
