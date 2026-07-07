'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { StatusBadge } from '../StatusBadge';
import { DataTable } from '../DataTable';
import type { DataTableColumn } from '../DataTable';
import { Modal } from '../Modal';
import { QuickStats } from '../QuickStats';
import type { QuickStatItem } from '../QuickStats';
import type {
  ReturnGoodsPanelProps,
  ReturnRequest,
  ReturnType,
  ReturnStatus,
  ReturnItem,
} from './types';

// ---- 常量 ----

const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  refund: '仅退款',
  exchange: '换货',
  repair: '维修',
};

const RETURN_STATUS_LABELS: Record<ReturnStatus, string> = {
  pending_review: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  return_received: '已收货',
  refund_issued: '已退款',
  replacement_sent: '已换货',
  closed: '已关闭',
};

const RETURN_STATUS_VARIANTS: Record<ReturnStatus, 'warning' | 'info' | 'success' | 'error' | 'neutral' | 'default'> = {
  pending_review: 'warning',
  approved: 'info',
  rejected: 'error',
  return_received: 'info',
  refund_issued: 'success',
  replacement_sent: 'success',
  closed: 'neutral',
};

/** 每个状态允许的下一步流转 */
const NEXT_STATUS_MAP: Record<ReturnStatus, ReturnStatus[]> = {
  pending_review: ['approved', 'rejected'],
  approved: ['return_received', 'closed'],
  rejected: ['closed'],
  return_received: ['refund_issued', 'replacement_sent'],
  refund_issued: ['closed'],
  replacement_sent: ['closed'],
  closed: [],
};

// ---- 格式化 ----

function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }) + ' ' + d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// ---- 商品列定义 ----

const ITEM_COLUMNS: DataTableColumn<ReturnItem>[] = [
  { key: 'sku', header: 'SKU' },
  {
    key: 'itemInfo',
    header: '商品信息',
    render: (row) => (
      <div>
        <div style={{ fontWeight: 500, color: '#1e293b' }}>{row.name}</div>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>{row.spec}</div>
      </div>
    ),
  },
  { key: 'purchasedQty', header: '购买数', render: (r) => <span style={{ color: '#64748b' }}>{r.purchasedQty}</span> },
  {
    key: 'returnQty',
    header: '退货数',
    render: (r) => <span style={{ fontWeight: 600 }}>{r.returnQty}</span>,
  },
  {
    key: 'unitPrice',
    header: '单价',
    render: (r) => <span style={{ color: '#059669' }}>{formatPrice(r.unitPrice)}</span>,
  },
  {
    key: 'defective',
    header: '瑕疵',
    render: (r) => r.defective ? <span style={{ color: '#dc2626' }}>是</span> : <span style={{ color: '#94a3b8' }}>否</span>,
  },
  { key: 'reason', header: '原因' },
];

// ---- 组件 ----

export function ReturnGoodsProcessingPanel({
  requests,
  config: { title = '退换货处理', readOnly = false, allowedActions } = {},
  callbacks,
}: ReturnGoodsPanelProps): React.ReactElement {
  const safeRequests: ReturnRequest[] = (requests ?? []) as ReturnRequest[];
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [remark, setRemark] = useState('');

  // ---- 统计 ----

  const stats: QuickStatItem[] = useMemo(() => {
    const pending = safeRequests.filter((r) => r.status === 'pending_review').length;
    const totalRefund = safeRequests.reduce((s, r) => s + r.refundAmount, 0);
    const toShip = safeRequests.filter((r) => r.status === 'approved' && r.returnType === 'exchange').length;
    return [
      { label: '待审核', value: pending, color: pending > 0 ? '#f59e0b' : '#94a3b8' },
      { label: '总申请数', value: safeRequests.length, color: '#6366f1' },
      { label: '退款总额', value: formatPrice(totalRefund), color: '#059669' },
      { label: '待换货', value: toShip, color: '#60a5fa' },
    ];
  }, [requests]);

  // ---- 操作 ----

  const handleOpenDetail = useCallback((r: ReturnRequest) => {
    setSelectedRequest(r);
    setRemark('');
    setDetailModalOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedRequest(null);
    setRemark('');
  }, []);

  const handleAction = useCallback(
    (newStatus: ReturnStatus) => {
      if (!selectedRequest) return;
      callbacks?.onStatusChange?.(selectedRequest.id, newStatus, remark.trim() || undefined);
      handleCloseDetail();
    },
    [selectedRequest, remark, callbacks, handleCloseDetail],
  );

  const isActionAllowed = useCallback(
    (action: string) => {
      if (readOnly) return false;
      if (!allowedActions) return true;
      return allowedActions.includes(action as any);
    },
    [readOnly, allowedActions],
  );

  // ---- 表格列 ----

  const columns: DataTableColumn<ReturnRequest>[] = useMemo(
    () => [
      { key: 'id', header: '退换单号' },
      { key: 'orderNo', header: '订单号' },
      { key: 'customerName', header: '客户' },
      {
        key: 'returnType',
        header: '类型',
        render: (row) => (
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            {RETURN_TYPE_LABELS[row.returnType]}
          </span>
        ),
        sortable: true,
      },
      {
        key: 'items',
        header: '商品数',
        render: (row) => <span style={{ fontWeight: 600 }}>{row.items.length}</span>,
      },
      {
        key: 'refundAmount',
        header: '退款金额',
        render: (row) => <span style={{ color: '#059669', fontWeight: 600 }}>{formatPrice(row.refundAmount)}</span>,
        sortable: true,
      },
      {
        key: 'status',
        header: '状态',
        render: (row) => (
          <StatusBadge
            variant={RETURN_STATUS_VARIANTS[row.status]}
            label={RETURN_STATUS_LABELS[row.status]}
          />
        ),
      },
      { key: 'appliedAt', header: '申请时间', render: (row) => formatDate(row.appliedAt) },
      {
        key: 'actions',
        header: '操作',
        render: (row) => (
          <button
            onClick={() => handleOpenDetail(row)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #e5e7eb',
              background: '#fff', fontSize: 13, cursor: 'pointer', color: '#3b82f6',
            }}
          >
            处理
          </button>
        ),
      },
    ],
    [handleOpenDetail],
  );

  // ---- 详情弹窗 ----

  const detailRequest = selectedRequest;
  const nextStatuses = detailRequest ? NEXT_STATUS_MAP[detailRequest.status] : [];

  const renderDetailModal = () => {
    if (!detailRequest) return null;
    return (
      <Modal open={detailModalOpen} onClose={handleCloseDetail} title={`退换单 — ${detailRequest.id}`}>
        <div style={{ padding: '0 4px' }}>
          {/* 基本信息 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: '关联订单', value: detailRequest.orderNo },
              { label: '客户', value: `${detailRequest.customerName} (${detailRequest.customerPhone})` },
              { label: '会员等级', value: detailRequest.memberTier || '-' },
              { label: '退换类型', value: RETURN_TYPE_LABELS[detailRequest.returnType] },
              { label: '当前状态', value: RETURN_STATUS_LABELS[detailRequest.status] },
              { label: '申请时间', value: formatDate(detailRequest.appliedAt) },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* 退款金额 */}
          <div style={{
            padding: 12, borderRadius: 8, background: '#f0fdf4',
            border: '1px solid #bbf7d0', marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, color: '#059669', marginBottom: 4 }}>退款金额</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>
              {formatPrice(detailRequest.refundAmount)}
              {detailRequest.exchangeExtra != null && detailRequest.exchangeExtra > 0 && (
                <span style={{ fontSize: 14, color: '#f59e0b', marginLeft: 12 }}>
                  + 换货补差 {formatPrice(detailRequest.exchangeExtra)}
                </span>
              )}
            </div>
          </div>

          {/* 商品明细 */}
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', margin: '0 0 8px' }}>
            商品明细
          </h3>
          <DataTable
            columns={ITEM_COLUMNS}
            rows={detailRequest.items}
            rowKey={(r) => r.sku}
          />

          {/* 操作备注 */}
          {nextStatuses.length > 0 && !readOnly && (
            <div style={{ marginTop: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                处理备注
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="可选：填写处理备注..."
                rows={2}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  border: '1px solid #d1d5db', fontSize: 14,
                  resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                {nextStatuses.map((ns) => {
                  const actionLabel: Record<string, string> = {
                    pending_review: '提交审核',
                    approved: '通过审核',
                    rejected: '拒绝',
                    return_received: '确认收货',
                    refund_issued: '确认退款',
                    replacement_sent: '已换货',
                    closed: '关闭',
                  };
                  const label = actionLabel[ns] || RETURN_STATUS_LABELS[ns] || ns;

                  const actionColor: Record<string, string> = {
                    pending_review: '#f59e0b',
                    approved: '#059669',
                    rejected: '#dc2626',
                    return_received: '#2563eb',
                    refund_issued: '#059669',
                    replacement_sent: '#2563eb',
                    closed: '#64748b',
                  };
                  const color = actionColor[ns] || '#3b82f6';

                  if (!isActionAllowed(ns as any)) return null;

                  return (
                    <button
                      key={ns}
                      onClick={() => handleAction(ns)}
                      style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none',
                        background: color, color: '#fff', fontSize: 14,
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {detailRequest.remark && (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#f8fafc', fontSize: 13, color: '#64748b' }}>
              <strong>备注：</strong>{detailRequest.remark}
            </div>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <div>
      {/* 标题 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          {title}
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
          处理门店退换货申请 · 共 {safeRequests.length} 条记录
        </p>
      </div>

      {/* 统计卡片 */}
      <QuickStats items={stats} />

      {/* 退换货表格 */}
      <div style={{ marginTop: 20 }}>
        <DataTable
          columns={columns}
          rows={safeRequests}
          rowKey={(r) => r.id}
        />
      </div>

      {/* 详情弹窗 */}
      {renderDetailModal()}
    </div>
  );
}
