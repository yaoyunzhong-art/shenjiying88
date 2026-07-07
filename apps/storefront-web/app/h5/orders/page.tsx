/**
 * H5订单列表页面 - Orders Page (H5端)
 * Phase-FP T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 功能: 查看会员订单列表
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderService, type Order, type OrderStatus, STATUS_CONFIG } from '../../../lib/order-service';
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

export default function H5OrdersPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    const result = await orderService.getOrders();
    if (result.success && result.data) {
      setOrders(result.data.orders);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (filter === 'ALL') return orders;
    return orders.filter((o) => o.status === filter);
  }, [orders, filter]);

  const stats = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }), [orders]);

  return (
    <main style={getMainContainerStyle()}>
      {/* 头部 */}
      <H5Header title="我的订单" marginBottom={12}>
        {/* 统计 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'ALL', label: '全部', count: stats.all },
            { key: 'pending', label: '待支付', count: stats.pending },
            { key: 'paid', label: '已支付', count: stats.paid },
            { key: 'completed', label: '已完成', count: stats.completed },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key as OrderStatus | 'ALL')}
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
        {filtered.length === 0 ? (
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
            const statusConfig = STATUS_CONFIG[order.status];

            return (
              <div
                key={order.id}
                style={getCardStyle()}
              >
                {/* 订单头部 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, color: COLOR_TEXT_SECONDARY }}>{order.storeName}</div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 12,
                    background: statusConfig.bg,
                    color: statusConfig.color,
                    fontSize: 11,
                    fontWeight: 500,
                  }}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* 商品信息 */}
                <div style={{ marginBottom: 12 }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, color: '#e2e8f0' }}>{item.name} x{item.quantity}</span>
                      <span style={{ fontSize: 14, color: COLOR_TEXT_SECONDARY }}>¥{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* 订单底部 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.08)' }}>
                  <div>
                    <span style={{ fontSize: 12, color: COLOR_TEXT_MUTED }}>{order.createdAt}</span>
                    <span style={{ fontSize: 12, color: COLOR_TEXT_MUTED, marginLeft: 8 }}>共{order.itemCount}件</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: COLOR_TEXT_PRIMARY }}>
                    ¥{order.totalAmount.toFixed(2)}
                  </div>
                </div>

                {/* 操作按钮 */}
                {order.status === 'pending' && (
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
