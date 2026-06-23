import { MOCK_ORDERS, ORDER_STATUS_MAP, ORDER_CHANNEL_MAP, ORDER_STATUS_FLOW, type OrderItem } from './orders-data';

export interface OrderDetailViewModel {
  order: OrderItem;
  statusLabel: string;
  statusVariant: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  channelLabel: string;
  nextStatuses: { key: string; label: string }[];
  isTerminal: boolean;
}

export function loadOrderDetail(orderId: string): OrderDetailViewModel | null {
  const order = MOCK_ORDERS.find((o) => o.id === orderId);
  if (!order) return null;

  const statusEntry = ORDER_STATUS_MAP[order.status];
  const channelEntry = ORDER_CHANNEL_MAP[order.channel];
  const nextStatuses = (ORDER_STATUS_FLOW[order.status] || []).map((s) => ({
    key: s,
    label: ORDER_STATUS_MAP[s].label,
  }));

  return {
    order,
    statusLabel: statusEntry.label,
    statusVariant: statusEntry.variant,
    channelLabel: channelEntry.label,
    nextStatuses,
    isTerminal: nextStatuses.length === 0,
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'delivered': return '#4ade80';
    case 'shipped': return '#60a5fa';
    case 'processing':
    case 'confirmed': return '#fbbf24';
    case 'pending': return '#fb923c';
    case 'cancelled':
    case 'refunded': return '#f87171';
    default: return '#94a3b8';
  }
}
