/**
 * ReturnStatusBadge — 退货单状态徽章
 */
import React from 'react';

export type ReturnStatus = 'pending' | 'approved' | 'processing' | 'shipped' | 'received' | 'completed' | 'rejected';

export const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  processing: '处理中',
  shipped: '已寄回',
  received: '已收货',
  completed: '已完成',
  rejected: '已拒绝',
};

export const RETURN_STATUS_COLORS: Record<ReturnStatus, string> = {
  pending: '#7c3aed',
  approved: '#2563eb',
  processing: '#d97706',
  shipped: '#0891b2',
  received: '#059669',
  completed: '#16a34a',
  rejected: '#dc2626',
};

export interface ReturnItem {
  id: string;
  orderNo: string;
  returnNo: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productSku: string;
  quantity: number;
  reason: string;
  amount: number;
  status: ReturnStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function ReturnStatusBadge({ status }: { status: ReturnStatus }): React.ReactElement {
  const label = RETURN_STATUS_LABELS[status] ?? status;
  const color = RETURN_STATUS_COLORS[status] ?? '#6b7280';
  return (
    <span
      data-testid={`return-status-${status}`}
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}
