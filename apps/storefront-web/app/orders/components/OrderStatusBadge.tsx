/**
 * OrderStatusBadge — 订单状态徽章组件
 */
import React from 'react';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  preparing: '备货中',
  shipped: '已发货',
  delivered: '已送达',
  cancelled: '已取消',
  refunded: '已退款',
};

export const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#6b7280',
  refunded: '#ef4444',
};

export interface OrderItem {
  id: string;
  orderNo: string;
  memberName: string;
  memberPhone: string;
  totalAmount: number;
  status: OrderStatus;
  itemCount: number;
  createdAt: string;
  storeName: string;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: STATUS_COLOR[status],
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
