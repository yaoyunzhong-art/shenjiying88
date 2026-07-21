/**
 * H5订单列表页面 - Orders Page (H5端)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 查看会员订单列表
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMainContainerStyle,
  getCardStyle,
  getToggleChipStyle,
  getEmptyStateStyle,
  getEmptyStateEmojiStyle,
  H5Header,
  H5NavBar,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_TEXT_MUTED,
  COLOR_ACCENT,
} from '../h5-style';
import {
  formatStorefrontOrderCurrency,
  formatStorefrontOrderDateTime,
  getStorefrontOrderPaymentLabel,
  getStorefrontOrderStatusLabel,
  getStorefrontOrderStatusVariant,
  loadStorefrontOrders,
  type StorefrontOrderListViewItem,
  type StorefrontOrderViewStatus,
} from '../../../lib/storefront-orders';

function getStatusBadgeStyle(status: StorefrontOrderViewStatus): { color: string; bg: string } {
  switch (getStorefrontOrderStatusVariant(status)) {
    case 'success':
      return { color: '#10b981', bg: '#10b98120' };
    case 'error':
      return { color: '#ef4444', bg: '#ef444420' };
    case 'default':
      return { color: '#64748b', bg: '#64748b20' };
    case 'warning':
    default:
      return { color: '#f59e0b', bg: '#f59e0b20' };
  }
}

export default function H5OrdersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<StorefrontOrderViewStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<StorefrontOrderListViewItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError(null);
    try {
      const items = await loadStorefrontOrders();
      setOrders(items);
    } catch (cause) {
      setOrders([]);
      setError(cause instanceof Error ? cause.message : '订单加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const stats = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending_payment').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    refunded: orders.filter((o) => o.status === 'refunded').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }), [orders]);

  return (
    <main style={getMainContainerStyle()}>
      {/* 头部 */}
      <H5Header title="我的订单" marginBottom={12}>
        {/* 统计 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'ALL', label: '全部', count: stats.all },
            { key: 'pending_payment', label: '待支付', count: stats.pending },
            { key: 'paid', label: '已支付', count: stats.paid },
            { key: 'refunded', label: '已退款', count: stats.refunded },
            { key: 'cancelled', label: '已取消', count: stats.cancelled },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as StorefrontOrderViewStatus | 'ALL')}
              style={getToggleChipStyle(filter === item.key, { flex: 1 })}
            >
              <div style={{ fontWeight: 600 }}>{item.count}</div>
              <div style={{ fontSize: 10, marginTop: 2 }}>{item.label}</div>
            </button>
          ))}
        </div>
      </H5Header>

      {/* 订单列表 */}
      <section style={{ padding: 16 }}>
        {loading ? (
          <div style={getEmptyStateStyle()}>
            <div style={getEmptyStateEmojiStyle()}>⏳</div>
            <div>订单加载中...</div>
          </div>
        ) : error ? (
          <div style={getEmptyStateStyle()}>
            <div style={getEmptyStateEmojiStyle()}>⚠️</div>
            <div>{error}</div>
            <button
              onClick={() => void loadOrders()}
              style={{
                marginTop: 16,
                padding: '10px 24px',
                borderRadius: 8,
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.4)',
                color: COLOR_ACCENT,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              重新加载
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={getEmptyStateStyle()}>
            <div style={getEmptyStateEmojiStyle()}>📋</div>
            <div>暂无订单</div>
            <button
              onClick={() => router.push('/stores')}
              style={{
                marginTop: 16,
                padding: '10px 24px',
                borderRadius: 8,
                background: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.4)',
                color: COLOR_ACCENT,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              去逛逛
            </button>
          </div>
        ) : (
          filtered.map((order) => {
            const statusStyle = getStatusBadgeStyle(order.status);

            return (
              <div
                key={order.id}
                style={getCardStyle()}
              >
                {/* 订单头部 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY }}>订单号：{order.orderNo}</div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 12,
                    background: statusStyle.bg,
                    color: statusStyle.color,
                    fontSize: 11,
                    fontWeight: 500,
                  }}>
                    {getStorefrontOrderStatusLabel(order.status)}
                  </span>
                </div>

                {/* 订单信息 */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: '#e2e8f0' }}>支付方式</span>
                    <span style={{ fontSize: 14, color: COLOR_TEXT_SECONDARY }}>
                      {getStorefrontOrderPaymentLabel(order.paymentChannel)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, color: '#e2e8f0' }}>件数</span>
                    <span style={{ fontSize: 14, color: COLOR_TEXT_SECONDARY }}>{order.itemCount} 件</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#e2e8f0' }}>会员ID</span>
                    <span style={{ fontSize: 14, color: COLOR_TEXT_SECONDARY }}>{order.memberId}</span>
                  </div>
                </div>

                {/* 订单底部 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                  <div>
                    <span style={{ fontSize: 12, color: COLOR_TEXT_MUTED }}>
                      {formatStorefrontOrderDateTime(order.createdAt)}
                    </span>
                    {order.paidAt ? (
                      <span style={{ fontSize: 12, color: COLOR_TEXT_MUTED, marginLeft: 8 }}>
                        支付：{formatStorefrontOrderDateTime(order.paidAt)}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: COLOR_TEXT_PRIMARY }}>
                    {formatStorefrontOrderCurrency(order.totalAmount, order.currency)}
                  </div>
                </div>

                {/* 操作按钮 */}
                {order.status === 'pending_payment' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => router.push(`/h5/payment/${order.id}`)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 8,
                        background: 'rgba(99,102,241,0.2)',
                        border: '1px solid rgba(99,102,241,0.4)',
                        color: COLOR_ACCENT,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      继续支付
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      <H5NavBar activeKey="me" />
    </main>
  );
}
