/**
 * DeliveryStatusBadge — 物流配送状态徽标
 * 用于 delivery-tracking 模块, 展示订单配送进度
 */
import React from 'react';

/* ── 状态定义 ── */
export type DeliveryStatus =
  | 'pending'       // 待发货
  | 'shipped'       // 已发货
  | 'in_transit'    // 运输中
  | 'out_for_delivery' // 派送中
  | 'delivered'     // 已签收
  | 'exception'     // 异常
  | 'returned';     // 已退回

export const DELIVERY_STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending: '待发货',
  shipped: '已发货',
  in_transit: '运输中',
  out_for_delivery: '派送中',
  delivered: '已签收',
  exception: '异常',
  returned: '已退回',
};

export const DELIVERY_STATUS_COLOR: Record<DeliveryStatus, string> = {
  pending: '#999',
  shipped: '#1890ff',
  in_transit: '#1890ff',
  out_for_delivery: '#faad14',
  delivered: '#52c41a',
  exception: '#ff4d4f',
  returned: '#ff4d4f',
};

export interface DeliveryStatusBadgeProps {
  status: DeliveryStatus;
}

/* ── Component ── */
export function DeliveryStatusBadge({ status }: DeliveryStatusBadgeProps) {
  const label = DELIVERY_STATUS_LABEL[status] ?? status;
  const color = DELIVERY_STATUS_COLOR[status] ?? '#999';

  return (
    <span
      data-testid="delivery-status-badge"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        backgroundColor: color,
      }}
    >
      <span style={{ fontSize: 10 }}>{getIcon(status)}</span>
      {label}
    </span>
  );
}

/* ── Icon helper ── */
function getIcon(status: DeliveryStatus): string {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'shipped':
    case 'in_transit':
      return '🚚';
    case 'out_for_delivery':
      return '📦';
    case 'delivered':
      return '✅';
    case 'exception':
      return '⚠️';
    case 'returned':
      return '↩️';
    default:
      return '•';
  }
}
