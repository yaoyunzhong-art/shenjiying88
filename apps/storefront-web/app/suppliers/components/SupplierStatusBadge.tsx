/**
 * SupplierStatusBadge — 供应商状态徽章
 * 角色视角: 👔店长 / 💳采购
 *
 * 供应商状态类型:
 * - active    合作中    绿
 * - paused    暂停合作  黄
 * - terminated 终止合作  红
 * - pending   审批中    紫
 */
import React from 'react';

export type SupplierStatus = 'active' | 'paused' | 'terminated' | 'pending';

export interface SupplierItem {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  status: SupplierStatus;
  totalProducts: number;
  totalAmount: number;
  cooperationStart: string;
  updatedAt: string;
  address: string;
}

export const SUPPLIER_STATUS_LABELS: Record<SupplierStatus, string> = {
  active: '合作中',
  paused: '暂停合作',
  terminated: '终止合作',
  pending: '审批中',
};

export const SUPPLIER_STATUS_COLORS: Record<SupplierStatus, string> = {
  active: '#059669',
  paused: '#d97706',
  terminated: '#dc2626',
  pending: '#7c3aed',
};

export function SupplierStatusBadge({ status }: { status: SupplierStatus }): React.ReactElement {
  const label = SUPPLIER_STATUS_LABELS[status] ?? status;
  const color = SUPPLIER_STATUS_COLORS[status] ?? '#6b7280';

  return (
    <span
      data-testid={`supplier-status-badge-${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: color + '18',
        color,
        border: `1px solid ${color}40`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}
