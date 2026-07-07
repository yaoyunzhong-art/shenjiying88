'use client';

import React, { useMemo, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { SearchFilterInput } from './SearchFilterInput';

// ==================== 类型定义 ====================

/** 调拨单状态 */
export type TransferStatus = 'draft' | 'pending_approval' | 'approved' | 'shipping' | 'completed' | 'rejected' | 'cancelled';

/** 调拨单 */
export interface TransferOrder {
  /** 调拨单号 */
  id: string;
  /** 调出门店 */
  sourceStore: string;
  /** 调入门店 */
  targetStore: string;
  /** SKU 数量 */
  skuCount: number;
  /** 总件数 */
  totalQty: number;
  /** 调拨金额 (元) */
  amount: number;
  /** 状态 */
  status: TransferStatus;
  /** 申请人 */
  requester: string;
  /** 审核人 */
  approver?: string;
  /** 创建时间 */
  createdAt: string;
  /** 完成时间 */
  completedAt?: string;
  /** 备注 */
  remark?: string;
}

/** 调拨单面板属性 */
export interface StoreTransferOrderPanelProps {
  /** 调拨单列表 */
  orders?: TransferOrder[];
  /** 加载中 */
  loading?: boolean;
  /** 门店名称（调出方可选列表） */
  storeOptions?: string[];
  /** 新增调拨回调 */
  onCreateTransfer?: () => void;
  /** 查看详情回调 */
  onViewDetail?: (orderId: string) => void;
  /** 取消调拨回调 */
  onCancelTransfer?: (orderId: string) => void;
}

// ==================== 常量 ====================

const STATUS_CONFIG: Record<TransferStatus, { label: string; variant: 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'pending' | 'default' }> = {
  draft: { label: '草稿', variant: 'neutral' },
  pending_approval: { label: '待审批', variant: 'info' },
  approved: { label: '已通过', variant: 'success' },
  shipping: { label: '调拨中', variant: 'warning' },
  completed: { label: '已完成', variant: 'pending' },
  rejected: { label: '已驳回', variant: 'error' },
  cancelled: { label: '已取消', variant: 'neutral' },
};

// ==================== 子辅助组件 ====================

/** 金额格式化 */
function formatAmount(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** 空状态 */
function EmptyTransferState({ onCreateTransfer }: { onCreateTransfer?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 16px', color: '#6b7280' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
      <p style={{ marginBottom: '16px', fontSize: '15px' }}>暂无调拨单据</p>
      {onCreateTransfer && (
        <button
          data-testid="empty-create-btn"
          onClick={onCreateTransfer}
          style={{
            padding: '8px 20px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          新建调拨单
        </button>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

export function StoreTransferOrderPanel({
  orders,
  loading,
  storeOptions,
  onCreateTransfer,
  onViewDetail,
  onCancelTransfer,
}: StoreTransferOrderPanelProps) {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<TransferStatus | 'all'>('all');

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      const matchSearch = !searchText
        || o.id.toLowerCase().includes(searchText.toLowerCase())
        || o.sourceStore.includes(searchText)
        || o.targetStore.includes(searchText);
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, searchText, filterStatus]);

  const statusOptions: { value: string; label: string }[] = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
      value: key,
      label: cfg.label,
    })),
  ];

  const columns: DataTableColumn<TransferOrder>[] = [
    {
      key: 'id',
      header: '调拨单号',
      render: (row) => (
        <button
          data-testid={`detail-btn-${row.id}`}
          onClick={() => onViewDetail?.(row.id)}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            cursor: 'pointer',
            padding: 0,
            font: 'inherit',
            textDecoration: 'underline',
          }}
        >
          {row.id}
        </button>
      ),
    },
    { key: 'sourceStore', header: '调出门店', dataKey: 'sourceStore' },
    { key: 'targetStore', header: '调入门店', dataKey: 'targetStore' },
    { key: 'skuCount', header: 'SKU 数', dataKey: 'skuCount' },
    { key: 'totalQty', header: '总件数', dataKey: 'totalQty' },
    {
      key: 'amount',
      header: '调拨金额',
      render: (row) => formatAmount(row.amount),
    },
    {
      key: 'status',
      header: '状态',
      render: (row) => {
        const cfg = STATUS_CONFIG[row.status];
        return (
          <StatusBadge variant={cfg.variant} label={cfg.label} />
        );
      },
    },
    { key: 'requester', header: '申请人', dataKey: 'requester' },
    { key: 'createdAt', header: '创建时间', dataKey: 'createdAt' },
    {
      key: 'actions',
      header: '操作',
      render: (row) => {
        const canCancel = row.status === 'draft' || row.status === 'pending_approval';
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              data-testid={`view-btn-${row.id}`}
              onClick={() => onViewDetail?.(row.id)}
              style={{
                padding: '4px 12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              查看
            </button>
            {canCancel && onCancelTransfer && (
              <button
                data-testid={`cancel-btn-${row.id}`}
                onClick={() => onCancelTransfer(row.id)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fca5a5',
                  borderRadius: '4px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#dc2626',
                }}
              >
                取消
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // ── 加载骨架 ──
  if (loading) {
    return (
      <div data-testid="transfer-loading" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '100px',
                height: '36px',
                backgroundColor: '#e5e7eb',
                borderRadius: '6px',
                animation: 'pulse 1.5s infinite',
              }}
            />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '48px',
              backgroundColor: '#f3f4f6',
              marginBottom: '8px',
              borderRadius: '4px',
              animation: 'pulse 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  // ── 列表视图 ──
  return (
    <div data-testid="store-transfer-panel" style={{ padding: '16px' }}>
      {/* 标题栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          库存调拨管理
        </h2>
        {onCreateTransfer && (
          <button
            data-testid="create-transfer-btn"
            onClick={onCreateTransfer}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + 新建调拨
          </button>
        )}
      </div>

      {/* 筛选栏 */}
      <div data-testid="filter-bar" style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <SearchFilterInput
            placeholder="搜索调拨单号 / 门店..."
            value={searchText}
            onChange={setSearchText}
          />
        </div>
        <select
          data-testid="status-filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TransferStatus | 'all')}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#ffffff',
            minWidth: '120px',
          }}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 调拨单表格 */}
      {filteredOrders.length === 0 ? (
        <EmptyTransferState onCreateTransfer={onCreateTransfer} />
      ) : (
        <DataTable data={filteredOrders} columns={columns} rowKey={(row) => row.id} />
      )}
    </div>
  );
}
