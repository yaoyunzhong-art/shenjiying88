'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';

// ---- 类型定义 ----

/** 采购订单行项目 */
export interface PurchaseOrderLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  received: number;
  total: number;
}

/** 采购订单详情 */
export interface PurchaseOrderDetail {
  id: string;
  orderNo: string;
  supplier: string;
  supplierContact: string;
  status: 'pending_approval' | 'approved' | 'shipped' | 'partial_received' | 'completed' | 'cancelled';
  orderedAt: string;
  expectedArrival: string;
  receivedAt?: string;
  totalAmount: number;
  totalReceived: number;
  arrivalRate: number;
  buyer: string;
  note?: string;
  items: PurchaseOrderLineItem[];
}

/** 采购订单面板操作回调 */
export interface PurchaseOrderPanelActions {
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onReceive?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

/** 采购订单面板属性 */
export interface PurchaseOrderPanelProps {
  order: PurchaseOrderDetail;
  actions?: PurchaseOrderPanelActions;
  loading?: boolean;
}

// ---- 常量 ----

const STATUS_LABELS: Record<string, string> = {
  pending_approval: '待审批',
  approved: '已审批',
  shipped: '已发货',
  partial_received: '部分到货',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<string, 'warning' | 'info' | 'default' | 'success' | 'error'> = {
  pending_approval: 'warning',
  approved: 'info',
  shipped: 'default',
  partial_received: 'info',
  completed: 'success',
  cancelled: 'error',
};

// ---- 组件 ----

export function PurchaseOrderPanel({ order, actions, loading }: PurchaseOrderPanelProps) {
  if (loading) {
    return (
      <div style={panelStyle}>
        <div style={{ color: '#94a3b8', textAlign: 'center', padding: 32 }}>加载中...</div>
      </div>
    );
  }

  const totalReceivedQty = order.items.reduce((sum, item) => sum + item.received, 0);
  const totalOrderedQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const columns: DataTableColumn<PurchaseOrderLineItem>[] = [
    { key: 'sku', header: 'SKU', width: '120px', dataKey: 'sku' },
    { key: 'name', header: '商品名称', dataKey: 'name' },
    { key: 'quantity', header: '订购数', width: '80px', align: 'right', dataKey: 'quantity' },
    { key: 'received', header: '已收数', width: '80px', align: 'right', dataKey: 'received' },
    { key: 'unitPrice', header: '单价', width: '100px', align: 'right', dataKey: 'unitPrice' },
    { key: 'total', header: '小计', width: '100px', align: 'right', dataKey: 'total' },
  ];

  return (
    <div style={panelStyle}>
      {/* 头部信息 */}
      <div style={headerStyle}>
        <div style={{ flex: 1 }}>
          <div style={titleRowStyle}>
            <h3 style={titleStyle}>采购单 {order.orderNo}</h3>
            <StatusBadge variant={STATUS_VARIANTS[order.status] ?? 'default'} label={STATUS_LABELS[order.status] ?? order.status} />
          </div>
          <div style={metaGridStyle}>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>供应商</span>
              <span style={metaValueStyle}>{order.supplier}</span>
            </div>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>联系人</span>
              <span style={metaValueStyle}>{order.supplierContact}</span>
            </div>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>采购员</span>
              <span style={metaValueStyle}>{order.buyer}</span>
            </div>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>下单时间</span>
              <span style={metaValueStyle}>{order.orderedAt}</span>
            </div>
            <div style={metaItemStyle}>
              <span style={metaLabelStyle}>预计到货</span>
              <span style={metaValueStyle}>{order.expectedArrival}</span>
            </div>
            {order.receivedAt && (
              <div style={metaItemStyle}>
                <span style={metaLabelStyle}>实际到货</span>
                <span style={metaValueStyle}>{order.receivedAt}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 到货进度 */}
      <div style={progressSectionStyle}>
        <div style={progressHeaderStyle}>
          <span style={sectionLabelStyle}>到货进度</span>
          <span style={progressTextStyle}>
            {totalReceivedQty} / {totalOrderedQty} 件 ({order.arrivalRate}%)
          </span>
        </div>
        <div style={progressBarBgStyle}>
          <div
            style={{
              ...progressBarFillStyle,
              width: `${Math.min(order.arrivalRate, 100)}%`,
              background: order.arrivalRate >= 100 ? '#22c55e' : order.arrivalRate >= 50 ? '#3b82f6' : '#f59e0b',
            }}
          />
        </div>
      </div>

      {/* 金额汇总 */}
      <div style={summaryRowStyle}>
        <div style={summaryCardStyle}>
          <span style={summaryLabelStyle}>采购总金额</span>
          <span style={summaryValueStyle}>¥{order.totalAmount.toLocaleString()}</span>
        </div>
        <div style={summaryCardStyle}>
          <span style={summaryLabelStyle}>已到货金额</span>
          <span style={summaryValueStyle}>¥{order.totalReceived.toLocaleString()}</span>
        </div>
        <div style={summaryCardStyle}>
          <span style={summaryLabelStyle}>到货率</span>
          <span style={{ ...summaryValueStyle, color: order.arrivalRate >= 100 ? '#22c55e' : '#f59e0b' }}>
            {order.arrivalRate}%
          </span>
        </div>
      </div>

      {/* 商品明细 */}
      <div style={tableSectionStyle}>
        <span style={sectionLabelStyle}>商品明细</span>
        <div style={{ marginTop: 8 }}>
          <DataTable columns={columns} data={order.items} rowKey={(row) => row.sku} />
        </div>
      </div>

      {/* 备注 */}
      {order.note && (
        <div style={noteStyle}>
          <span style={sectionLabelStyle}>备注</span>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{order.note}</p>
        </div>
      )}

      {/* 操作按钮 */}
      {actions && (
        <div style={actionsStyle}>
          {actions.onApprove && order.status === 'pending_approval' && (
            <button onClick={() => actions.onApprove!(order.id)} style={primaryBtnStyle}>
              审批通过
            </button>
          )}
          {actions.onReject && order.status === 'pending_approval' && (
            <button onClick={() => actions.onReject!(order.id)} style={dangerBtnStyle}>
              驳回
            </button>
          )}
          {actions.onReceive && (order.status === 'shipped' || order.status === 'partial_received') && (
            <button onClick={() => actions.onReceive!(order.id)} style={primaryBtnStyle}>
              确认收货
            </button>
          )}
          {actions.onEdit && (order.status === 'pending_approval' || order.status === 'approved') && (
            <button onClick={() => actions.onEdit!(order.id)} style={secondaryBtnStyle}>
              编辑
            </button>
          )}
          {actions.onCancel && order.status !== 'completed' && order.status !== 'cancelled' && (
            <button onClick={() => actions.onCancel!(order.id)} style={dangerBtnStyle}>
              取消订单
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---- 样式 ----

const panelStyle: React.CSSProperties = {
  background: 'rgba(15,23,42,0.5)',
  border: '1px solid rgba(148,163,184,0.12)',
  borderRadius: 12,
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  marginBottom: 20,
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#f8fafc',
  margin: 0,
};

const metaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
};

const metaItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const metaLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
};

const metaValueStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#e2e8f0',
  fontWeight: 500,
};

const progressSectionStyle: React.CSSProperties = {
  marginBottom: 20,
};

const progressHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#cbd5e1',
};

const progressTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#94a3b8',
};

const progressBarBgStyle: React.CSSProperties = {
  height: 8,
  background: 'rgba(148,163,184,0.15)',
  borderRadius: 4,
  overflow: 'hidden',
};

const progressBarFillStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 4,
  transition: 'width 0.3s ease',
};

const summaryRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 20,
};

const summaryCardStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(15,23,42,0.3)',
  border: '1px solid rgba(148,163,184,0.08)',
  borderRadius: 8,
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#f8fafc',
};

const tableSectionStyle: React.CSSProperties = {
  marginBottom: 16,
};

const noteStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: 16,
  background: 'rgba(15,23,42,0.3)',
  borderRadius: 8,
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  paddingTop: 16,
  borderTop: '1px solid rgba(148,163,184,0.12)',
};

const baseBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const primaryBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  background: '#3b82f6',
  color: '#fff',
};

const secondaryBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  background: 'rgba(148,163,184,0.15)',
  color: '#e2e8f0',
};

const dangerBtnStyle: React.CSSProperties = {
  ...baseBtnStyle,
  background: 'rgba(239,68,68,0.15)',
  color: '#fca5a5',
};
