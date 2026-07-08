'use client';

import React, { useCallback, useState } from 'react';
import {
  PageShell,
  SearchFilterInput,
  QuickStats,
  Modal,
  useSearchFilter,
  usePagination,
  StatusBadge,
} from '@m5/ui';
import { ReturnGoodsProcessingPanel } from '@m5/ui';
import type { ReturnRequest, ReturnStatus, ReturnType } from '@m5/ui';
import { countByStatus, getStatusSummary, getTypeSummary } from './return-data';

// ── 常量 ──

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

function formatPrice(cents: number): string {
  return `¥${(cents / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** 退换货管理页面 — 客户端组件 */
export function ReturnListClient({ returns }: { returns: ReturnRequest[] }) {
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);

  // 搜索过滤
  const { searchTerm, setSearchTerm, filteredItems } = useSearchFilter(returns, [
    'id',
    'orderNo',
    'customerName',
    'customerPhone',
  ]);
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'ALL'>('ALL');

  const visibleReturns = statusFilter === 'ALL'
    ? filteredItems
    : filteredItems.filter((r) => r.status === statusFilter);

  const { page, totalPages, setPage } = usePagination({
    total: visibleReturns.length,
    pageSize: 10,
  });

  const paginatedReturns = visibleReturns.slice((page - 1) * 10, page * 10);

  // 统计
  const statusSummary = getStatusSummary(returns);
  const pendingCount = countByStatus(returns, 'pending_review');
  const typeSummary = getTypeSummary(returns);

  const quickStats = [
    { label: '总申请', value: returns.length.toString(), variant: 'info' as const },
    { label: '待审核', value: pendingCount.toString(), variant: 'warning' as const },
    { label: '仅退款', value: (typeSummary.refund ?? 0).toString(), variant: 'default' as const },
    { label: '换货', value: (typeSummary.exchange ?? 0).toString(), variant: 'success' as const },
    { label: '维修', value: (typeSummary.repair ?? 0).toString(), variant: 'default' as const },
  ];

  const handleOpenDetail = useCallback((r: ReturnRequest) => {
    setSelectedReturn(r);
    setDetailPanelOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailPanelOpen(false);
    setSelectedReturn(null);
  }, []);

  return (
    <PageShell title="退换货管理" description="管理门店退换货申请审批流程">
      {/* 统计栏 */}
      <div style={{ marginBottom: 20 }}>
        <QuickStats items={quickStats} />
      </div>

      {/* 搜索栏 */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 280 }}>
          <SearchFilterInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="搜索单号/客户/订单..."
          />
        </div>

        {/* 状态筛选 */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['ALL', 'pending_review', 'approved', 'rejected', 'return_received', 'refund_issued', 'replacement_sent', 'closed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: statusFilter === s ? '1px solid #3b82f6' : '1px solid rgba(148,163,184,0.25)',
                background: statusFilter === s ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: statusFilter === s ? '#60a5fa' : '#94a3b8',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: statusFilter === s ? 600 : 400,
              }}
            >
              {s === 'ALL' ? '全部' : RETURN_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 使用 ReturnGoodsProcessingPanel 展示列表 */}
      <ReturnGoodsProcessingPanel
        requests={paginatedReturns}
        config={{
          title: '退换货申请列表',
          allowedActions: ['approve', 'reject', 'receive', 'issue_refund', 'send_replacement', 'close'],
        }}
        callbacks={{
          onStatusChange: (requestId, newStatus, remark) => {
            // 在实际应用中这里会调用 API
            console.log(`[DEMO] ${requestId} -> ${newStatus}`, remark);
          },
        }}
      />

      {/* 分页 */}
      {totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.2)',
              background: page <= 1 ? 'transparent' : 'rgba(59,130,246,0.08)',
              color: page <= 1 ? '#475569' : '#60a5fa',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
          >
            上一页
          </button>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            第 {page} / {totalPages} 页
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.2)',
              background: page >= totalPages ? 'transparent' : 'rgba(59,130,246,0.08)',
              color: page >= totalPages ? '#475569' : '#60a5fa',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
          >
            下一页
          </button>
        </div>
      )}

      {/* 详情弹窗 */}
      <Modal
        open={detailPanelOpen}
        onClose={handleCloseDetail}
        title={selectedReturn ? `退换单 ${selectedReturn.id}` : ''}
      >
        {selectedReturn && (
          <div>
            <p><strong>订单：</strong>{selectedReturn.orderNo}</p>
            <p><strong>客户：</strong>{selectedReturn.customerName} ({selectedReturn.customerPhone})</p>
            <p><strong>类型：</strong>{RETURN_TYPE_LABELS[selectedReturn.returnType]}</p>
            <p><strong>状态：</strong>
              <StatusBadge variant={RETURN_STATUS_VARIANTS[selectedReturn.status]}>
                {RETURN_STATUS_LABELS[selectedReturn.status]}
              </StatusBadge>
            </p>
            <p><strong>退款金额：</strong>{formatPrice(selectedReturn.refundAmount)}</p>
            {selectedReturn.exchangeExtra !== undefined && selectedReturn.exchangeExtra > 0 && (
              <p><strong>差价补款：</strong>+{formatPrice(selectedReturn.exchangeExtra)}</p>
            )}
            {selectedReturn.remark && <p><strong>备注：</strong>{selectedReturn.remark}</p>}
            <p><strong>申请时间：</strong>{formatDate(selectedReturn.appliedAt)}</p>
            {selectedReturn.handler && <p><strong>处理人：</strong>{selectedReturn.handler}</p>}
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
