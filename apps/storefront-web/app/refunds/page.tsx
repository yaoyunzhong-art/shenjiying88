/**
 * 退换货管理页 — Refunds List Page (Next.js App Router Page)
 * 角色: 店长/前台可查看和处理退换货申请
 */
'use client';

import React, { useState, useMemo } from 'react';
import { PageShell, DataTable, StatusBadge, EmptyState } from '@m5/ui';
import {
  REFUND_STATUS_LABEL,
  REFUND_STATUS_VARIANT,
  REFUND_TYPE_LABEL,
  MOCK_REFUNDS,
} from './refund-data';
import type { RefundItem, RefundStatus } from './refund-data';

export default function RefundsPage() {
  const [statusFilter, setStatusFilter] = useState<RefundStatus | 'ALL'>('ALL');
  const [searchText, setSearchText] = useState('');

  const filteredRefunds = useMemo(() => {
    let items = MOCK_REFUNDS;
    if (statusFilter !== 'ALL') {
      items = items.filter((r) => r.status === statusFilter);
    }
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      items = items.filter(
        (r) =>
          r.id.toLowerCase().includes(lower) ||
          r.customerName.toLowerCase().includes(lower) ||
          r.productName.toLowerCase().includes(lower) ||
          r.reason.toLowerCase().includes(lower),
      );
    }
    return items;
  }, [statusFilter, searchText]);

  return (
    <PageShell title="退换货管理" description="退换货申请审批与处理">
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🔄 退换货管理</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
          共 {MOCK_REFUNDS.length} 条记录，待处理 {MOCK_REFUNDS.filter((r) => r.status === 'pending_approval').length} 条
        </p>

        {/* 工具栏 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            data-testid="search-input"
            type="text"
            placeholder="搜索退单号/会员名/商品名称…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{
              padding: '8px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              minWidth: 260,
            }}
          />
          <select
            data-testid="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RefundStatus | 'ALL')}
            style={{ padding: '8px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, minWidth: 120 }}
          >
            <option value="ALL">全部状态</option>
            {Object.entries(REFUND_STATUS_LABEL).map(([value, label]) => {
              const count = MOCK_REFUNDS.filter((r) => r.status === value).length;
              return (
                <option key={value} value={value}>
                  {label} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* 数据表格 */}
        {filteredRefunds.length === 0 ? (
          <EmptyState
            title="暂无退换货记录"
            description={
              searchText
                ? '未找到匹配的退换货记录，请调整搜索条件'
                : '当前没有退换货申请需要处理'
            }
          />
        ) : (
          <DataTable
            rows={filteredRefunds}
            rowKey={(r: RefundItem) => r.id}
            columns={[
              { key: 'id', header: '退单号' },
              { key: 'orderId', header: '订单号' },
              { key: 'customerName', header: '会员' },
              {
                key: 'type',
                header: '类型',
                render: (row: RefundItem) => (
                  <span>{REFUND_TYPE_LABEL[row.type]}</span>
                ),
              },
              {
                key: 'amount',
                header: '金额',
                render: (row: RefundItem) => (
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>
                    ¥{(row.amount / 100).toFixed(2)}
                  </span>
                ),
              },
              { key: 'productName', header: '商品' },
              { key: 'reason', header: '原因' },
              {
                key: 'status',
                header: '状态',
                render: (row: RefundItem) => (
                  <StatusBadge variant={REFUND_STATUS_VARIANT[row.status]} label={REFUND_STATUS_LABEL[row.status]} />
                ),
              },
              { key: 'createdAt', header: '申请时间' },
            ]}
          />
        )}
      </div>
    </PageShell>
  );
}
