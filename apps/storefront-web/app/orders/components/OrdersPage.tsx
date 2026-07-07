/**
 * OrdersPage — 订单列表页组件 (Client-side compatible)
 */
import React from 'react';
import { OrderStatusBadge, STATUS_LABEL } from './OrderStatusBadge';
import type { OrderItem } from './OrderStatusBadge';

/* ── Helpers ── */
function formatCurrency(amount: number): string {
  return `¥${(amount / 100).toFixed(2)}`;
}

/* ── Props ── */
export interface OrdersPageProps {
  orders: OrderItem[];
  total: number;
  page: number;
  pageSize: number;
}

/* ── Component ── */
export function OrdersPage({ orders, total, page, pageSize }: OrdersPageProps) {
  const safeOrders = orders ?? [];
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📋 订单管理</h1>

      {/* 搜索/筛选工具栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          data-testid="search-input"
          type="text"
          placeholder="搜索订单号/会员名/手机号…"
          style={{
            padding: '6px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            minWidth: 240,
          }}
        />
        <select
          data-testid="status-filter"
          style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          data-testid="date-range-start"
          type="date"
          style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        />
        <span style={{ alignSelf: 'center' }}>至</span>
        <input
          data-testid="date-range-end"
          type="date"
          style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
        />
        <button
          data-testid="search-btn"
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#3b82f6',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          搜索
        </button>
        <button
          data-testid="reset-btn"
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            backgroundColor: '#fff',
            color: '#374151',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          重置
        </button>
      </div>

      {/* 统计摘要 */}
      <div style={{ marginBottom: 12, fontSize: 14, color: '#6b7280' }}>
        共 <strong data-testid="total-count">{total}</strong> 条订单
      </div>

      {/* 订单表格 */}
      <table
        data-testid="orders-table"
        style={{ width: '100%', borderCollapse: 'collapse' }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left' }}>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              订单号
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              会员
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              门店
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              金额
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              状态
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              创建时间
            </th>
            <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: 13 }}>
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {safeOrders.map((order) => (
            <tr
              key={order.id}
              data-testid={`order-row-${order.id}`}
              style={{ borderBottom: '1px solid #e5e7eb' }}
            >
              <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>
                {order.orderNo}
              </td>
              <td style={{ padding: '10px 12px', fontSize: 14 }}>
                <div>{order.memberName}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{order.memberPhone}</div>
              </td>
              <td style={{ padding: '10px 12px', fontSize: 14 }}>{order.storeName}</td>
              <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>
                {formatCurrency(order.totalAmount)}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <OrderStatusBadge status={order.status} />
              </td>
              <td style={{ padding: '10px 12px', fontSize: 13, color: '#6b7280' }}>
                {order.createdAt}
              </td>
              <td style={{ padding: '10px 12px' }}>
                <button
                  data-testid={`view-order-${order.id}`}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid #d1d5db',
                    backgroundColor: '#fff',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  查看
                </button>
              </td>
            </tr>
          ))}
          {safeOrders.length === 0 && (
            <tr>
              <td
                colSpan={7}
                style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}
              >
                暂无订单数据
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 分页 */}
      <div
        data-testid="pagination"
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 8,
          marginTop: 16,
          fontSize: 14,
        }}
      >
        <button
          data-testid="page-prev"
          disabled={page <= 1}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid #d1d5db',
            backgroundColor: page <= 1 ? '#f3f4f6' : '#fff',
            color: page <= 1 ? '#d1d5db' : '#374151',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
          }}
        >
          上一页
        </button>
        <span data-testid="page-info">
          第 {page} / {totalPages} 页
        </span>
        <button
          data-testid="page-next"
          disabled={page >= totalPages}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid #d1d5db',
            backgroundColor: page >= totalPages ? '#f3f4f6' : '#fff',
            color: page >= totalPages ? '#d1d5db' : '#374151',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          下一页
        </button>
        <span style={{ color: '#9ca3af' }}>
          每页 {pageSize} 条
        </span>
      </div>
    </div>
  );
}
