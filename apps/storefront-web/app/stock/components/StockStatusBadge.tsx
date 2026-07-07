/**
 * StockStatusBadge — 库存状态标签
 * 角色视角: 👔店长 · 🛒前台 · 💳采购
 */

import React from 'react';

/* ── 类型 ── */
export type StockStatus = 'sufficient' | 'low' | 'critical' | 'out_of_stock' | 'overstocked';

export interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  price: number;
  updatedAt: string;
  status: StockStatus;
}

/* ── 状态映射 ── */
export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  sufficient: '充足',
  low: '偏低',
  critical: '告急',
  out_of_stock: '缺货',
  overstocked: '过剩',
};

export const STOCK_STATUS_COLOR: Record<StockStatus, string> = {
  sufficient: '#22c55e',
  low: '#eab308',
  critical: '#f97316',
  out_of_stock: '#ef4444',
  overstocked: '#8b5cf6',
};

export const STOCK_STATUS_BG: Record<StockStatus, string> = {
  sufficient: 'rgba(34,197,94,0.12)',
  low: 'rgba(234,179,8,0.12)',
  critical: 'rgba(249,115,22,0.12)',
  out_of_stock: 'rgba(239,68,68,0.12)',
  overstocked: 'rgba(139,92,246,0.12)',
};

/* ── Component ── */
export function StockStatusBadge({ status }: { status: StockStatus }): React.ReactElement {
  const label = STOCK_STATUS_LABEL[status] ?? status;
  const color = STOCK_STATUS_COLOR[status] ?? '#6b7280';
  const bg = STOCK_STATUS_BG[status] ?? 'rgba(107,114,128,0.12)';

  return (
    <span
      data-testid={`stock-badge-${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color,
        backgroundColor: bg,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
      {label}
    </span>
  );
}
