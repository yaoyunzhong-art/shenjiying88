'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@m5/ui';
import { useTriState } from '../../_components/useTriState';
import { TriStateRenderer } from '../../_components/TriStateRenderer';
import { getStorefrontOrderTransaction, resolveStorefrontScope } from '../../../lib/storefront-transactions';
import {
  formatStorefrontOrderCurrency,
  formatStorefrontOrderDateTime,
  mapAggregateToOrderDetailView,
  type StorefrontOrderDetailView,
} from '../../../lib/storefront-orders';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '8px 0',
        borderBottom: '1px solid #f3f4f6',
        gap: 16,
      }}
    >
      <span style={{ fontSize: 13, color: '#6b7280', minWidth: 90, flexShrink: 0 }}>{label}</span>
      <div style={{ fontSize: 14, color: '#111827', textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>
  );
}

function getRefundStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return '已退款';
    case 'PENDING':
      return '待审核';
    case 'REJECTED':
      return '已拒绝';
    default:
      return status;
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [order, setOrder] = useState<StorefrontOrderDetailView | null>(null);
  const [pageReady, setPageReady] = useState(false);

  const loadDetail = useCallback(() => {
    const scope = resolveStorefrontScope();
    return wrapLoad(getStorefrontOrderTransaction(id, scope)).then((aggregate) => {
      setOrder(aggregate ? mapAggregateToOrderDetailView(aggregate) : null);
      setPageReady(true);
    });
  }, [id, wrapLoad]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const handleBack = useCallback(() => {
    router.push('/orders');
  }, [router]);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <TriStateRenderer
        loading={loading}
        empty={!order && pageReady}
        error={error}
        onRetry={() => {
          void loadDetail();
        }}
      >
        {!order ? null : (
          <>
            <button
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#374151',
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 20,
              }}
              data-testid="order-detail-back"
            >
              ← 返回订单列表
            </button>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 24,
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 4 }}>
                  订单详情
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#6b7280', flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'monospace', color: '#2563eb' }}>{order.orderNo}</span>
                  <span>·</span>
                  <span>会员 {order.memberId}</span>
                  <span>·</span>
                  <StatusBadge label={order.statusLabel} variant={order.statusTone} size="sm" />
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 24,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
                  基本信息
                </h2>
                <InfoRow label="订单号" value={order.orderNo} />
                <InfoRow label="会员ID" value={order.memberId} />
                <InfoRow label="会员昵称" value={order.memberNickname ?? '未同步'} />
                <InfoRow label="支付方式" value={order.paymentChannelLabel} />
                {order.closeReason ? <InfoRow label="关闭原因" value={order.closeReason} /> : null}
              </div>

              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
                  金额与时间
                </h2>
                <InfoRow label="订单金额" value={formatStorefrontOrderCurrency(order.totalAmount, order.currency)} />
                <InfoRow label="实付金额" value={formatStorefrontOrderCurrency(order.paidAmount, order.currency)} />
                <InfoRow label="已退金额" value={formatStorefrontOrderCurrency(order.refundedAmount, order.currency)} />
                <InfoRow label="创建时间" value={formatStorefrontOrderDateTime(order.createdAt)} />
                <InfoRow label="更新时间" value={formatStorefrontOrderDateTime(order.updatedAt)} />
                <InfoRow label="支付时间" value={formatStorefrontOrderDateTime(order.paidAt)} />
              </div>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                marginBottom: 24,
                background: '#fff',
                border: '1px solid #e5e7eb',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
                商品清单
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="order-detail-products-table">
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>商品</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, textAlign: 'right' }}>单价</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, textAlign: 'right' }}>数量</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13, textAlign: 'right' }}>小计</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.skuId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px 12px', fontSize: 14 }}>
                        <div>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{item.skuId}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right' }}>
                        {formatStorefrontOrderCurrency(item.price, order.currency)}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right' }}>{item.quantity}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600, textAlign: 'right' }}>
                        {formatStorefrontOrderCurrency(item.subtotal, order.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: 20,
                borderRadius: 12,
                background: '#fff',
                border: '1px solid #e5e7eb',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16, marginTop: 0 }}>
                退款记录
              </h2>
              {order.refunds.length === 0 ? (
                <div style={{ fontSize: 14, color: '#6b7280' }}>当前暂无退款记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {order.refunds.map((refund) => (
                    <div
                      key={refund.refundId}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>
                          {refund.refundId}
                        </span>
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>
                          {formatStorefrontOrderCurrency(refund.amount, order.currency)}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>
                        状态：{getRefundStatusLabel(refund.status)}
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>
                        原因：{refund.reason || '未填写'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        申请时间：{formatStorefrontOrderDateTime(refund.requestedAt)}
                        {refund.completedAt ? ` · 完成时间：${formatStorefrontOrderDateTime(refund.completedAt)}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </TriStateRenderer>
    </div>
  );
}
