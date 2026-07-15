/**
 * 退换货管理页 — Refunds List Page (Next.js App Router Page)
 * 角色: 店长/前台可查看和处理退换货申请
 * 功能: 数据表格/状态筛选/搜索/审批弹窗/统计卡片/分页/导出
 */
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { PageShell, DataTable, StatusBadge, EmptyState, Modal } from '@m5/ui';
import {
  REFUND_STATUS_LABEL,
  REFUND_STATUS_VARIANT,
  REFUND_TYPE_LABEL,
  MOCK_REFUNDS,
} from './refund-data';
import type { RefundItem, RefundStatus, RefundType } from './refund-data';

/* ── 分页常量 ── */
const PAGE_SIZE = 6;

/* ── 统计卡片子组件 ── */
function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 140,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── 审核弹窗内容 ── */
function ApprovalModalContent({
  item,
  onApprove,
  onReject,
}: {
  item: RefundItem;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 12px' }}>
        <span style={{ color: '#6b7280' }}>退单号</span>
        <span style={{ fontWeight: 600 }}>{item.id}</span>
        <span style={{ color: '#6b7280' }}>订单号</span>
        <span>{item.orderId}</span>
        <span style={{ color: '#6b7280' }}>会员</span>
        <span>{item.customerName}</span>
        <span style={{ color: '#6b7280' }}>手机</span>
        <span>{item.customerPhone}</span>
        <span style={{ color: '#6b7280' }}>类型</span>
        <span>{REFUND_TYPE_LABEL[item.type]}</span>
        <span style={{ color: '#6b7280' }}>商品</span>
        <span>{item.productName}</span>
        <span style={{ color: '#6b7280' }}>金额</span>
        <span style={{ fontWeight: 700, color: '#dc2626' }}>
          ¥{(item.amount / 100).toFixed(2)}
        </span>
        <span style={{ color: '#6b7280' }}>申请时间</span>
        <span>{item.createdAt}</span>
      </div>
      <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>退换原因</div>
        <div style={{ color: '#374151' }}>{item.reason}</div>
      </div>
      <div
        style={{
          marginTop: 20,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          borderTop: '1px solid #e5e7eb',
          paddingTop: 16,
        }}
      >
        <button
          onClick={onReject}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            color: '#dc2626',
          }}
        >
          拒绝退款
        </button>
        <button
          onClick={onApprove}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#059669',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          通过审批
        </button>
      </div>
    </div>
  );
}

/* ── 明细面板 ── */
function RefundDetailPanel({ item, onClose }: { item: RefundItem; onClose: () => void }) {
  if (!item) return null;
  return (
    <div
      style={{
        marginTop: 16,
        padding: 20,
        background: '#f9fafb',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        position: 'relative',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          right: 12,
          top: 12,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 18,
          color: '#9ca3af',
        }}
      >
        ✕
      </button>
      <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
        退单详情 — {item.id}
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px 24px',
          fontSize: 14,
        }}
      >
        <div><span style={{ color: '#6b7280' }}>订单号：</span>{item.orderId}</div>
        <div><span style={{ color: '#6b7280' }}>会员：</span>{item.customerName}</div>
        <div><span style={{ color: '#6b7280' }}>商品：</span>{item.productName}</div>
        <div>
          <span style={{ color: '#6b7280' }}>状态：</span>
          <StatusBadge variant={REFUND_STATUS_VARIANT[item.status]} label={REFUND_STATUS_LABEL[item.status]} />
        </div>
        {item.processedAt && (
          <div>
            <span style={{ color: '#6b7280' }}>处理时间：</span>{item.processedAt}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 主页面 ── */
export default function RefundsPage() {
  const [statusFilter, setStatusFilter] = useState<RefundStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<RefundType | 'ALL'>('ALL');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [approvalTarget, setApprovalTarget] = useState<RefundItem | null>(null);
  const [detailTarget, setDetailTarget] = useState<RefundItem | null>(null);
  const [localRefunds, setLocalRefunds] = useState(MOCK_REFUNDS);

  /** 筛选后的退单 */
  const filteredRefunds = useMemo(() => {
    let items = localRefunds;
    if (statusFilter !== 'ALL') {
      items = items.filter((r) => r.status === statusFilter);
    }
    if (typeFilter !== 'ALL') {
      items = items.filter((r) => r.type === typeFilter);
    }
    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      items = items.filter(
        (r) =>
          r.id.toLowerCase().includes(lower) ||
          r.customerName.toLowerCase().includes(lower) ||
          r.productName.toLowerCase().includes(lower) ||
          r.reason.toLowerCase().includes(lower) ||
          r.orderId.toLowerCase().includes(lower),
      );
    }
    return items;
  }, [statusFilter, typeFilter, searchText, localRefunds]);

  /** 分页 */
  const totalPages = Math.max(1, Math.ceil(filteredRefunds.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRefunds = useMemo(
    () => filteredRefunds.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredRefunds, safePage],
  );

  /** 统计数据 */
  const stats = useMemo(() => {
    const pending = localRefunds.filter((r) => r.status === 'pending_approval').length;
    const approved = localRefunds.filter((r) => r.status === 'approved').length;
    const completed = localRefunds.filter((r) => r.status === 'completed').length;
    const rejected = localRefunds.filter((r) => r.status === 'rejected').length;
    const processing = localRefunds.filter((r) => r.status === 'processing').length;
    return { pending, approved, completed, rejected, processing };
  }, [localRefunds]);

  /** 审批操作 */
  const handleApprove = useCallback(() => {
    if (!approvalTarget) return;
    setLocalRefunds((prev) =>
      prev.map((r) =>
        r.id === approvalTarget.id
          ? { ...r, status: 'approved' as RefundStatus, processedAt: new Date().toLocaleString('zh-CN') }
          : r,
      ),
    );
    setApprovalTarget(null);
  }, [approvalTarget]);

  const handleReject = useCallback(() => {
    if (!approvalTarget) return;
    setLocalRefunds((prev) =>
      prev.map((r) =>
        r.id === approvalTarget.id
          ? { ...r, status: 'rejected' as RefundStatus, processedAt: new Date().toLocaleString('zh-CN') }
          : r,
      ),
    );
    setApprovalTarget(null);
  }, [approvalTarget]);

  /** 模拟导出 */
  const handleExport = useCallback(() => {
    const csvHeader = '退单号,订单号,会员,类型,金额,状态,申请时间';
    const csvRows = filteredRefunds
      .map(
        (r) =>
          `${r.id},${r.orderId},${r.customerName},${REFUND_TYPE_LABEL[r.type]},¥${(r.amount / 100).toFixed(2)},${REFUND_STATUS_LABEL[r.status]},${r.createdAt}`,
      )
      .join('\n');
    const blob = new Blob([`${csvHeader}\n${csvRows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `退换货记录_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredRefunds]);

  return (
    <PageShell title="退换货管理" description="退换货申请审批与处理">
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>🔄 退换货管理</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
          共 {localRefunds.length} 条记录，待处理 {stats.pending} 条，已完成 {stats.completed} 条
        </p>

        {/* 统计卡片 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <StatCard label="待审批" value={stats.pending} color="#d97706" icon="⏳" />
          <StatCard label="已通过" value={stats.approved} color="#059669" icon="✅" />
          <StatCard label="处理中" value={stats.processing} color="#2563eb" icon="🔄" />
          <StatCard label="已完成" value={stats.completed} color="#6b7280" icon="✔️" />
          <StatCard label="已拒绝" value={stats.rejected} color="#dc2626" icon="❌" />
        </div>

        {/* 工具栏 */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              data-testid="search-input"
              type="text"
              placeholder="搜索退单号/订单号/会员名/商品…"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '8px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 280,
              }}
            />
            <select
              data-testid="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as RefundStatus | 'ALL');
                setPage(1);
              }}
              style={{
                padding: '8px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 110,
              }}
            >
              <option value="ALL">全部状态</option>
              {Object.entries(REFUND_STATUS_LABEL).map(([value, label]) => {
                const count = localRefunds.filter((r) => r.status === value).length;
                return (
                  <option key={value} value={value}>
                    {label} ({count})
                  </option>
                );
              })}
            </select>
            <select
              data-testid="type-filter"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as RefundType | 'ALL');
                setPage(1);
              }}
              style={{
                padding: '8px 14px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                minWidth: 110,
              }}
            >
              <option value="ALL">全部类型</option>
              {Object.entries(REFUND_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExport}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            📥 导出 CSV
          </button>
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
            rows={pagedRefunds}
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
                  <StatusBadge
                    variant={REFUND_STATUS_VARIANT[row.status]}
                    label={REFUND_STATUS_LABEL[row.status]}
                  />
                ),
              },
              { key: 'createdAt', header: '申请时间' },
              {
                key: 'actions',
                header: '操作',
                render: (row: RefundItem) => (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {row.status === 'pending_approval' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setApprovalTarget(row);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#059669',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        审核
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailTarget(detailTarget?.id === row.id ? null : row);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      {detailTarget?.id === row.id ? '收起' : '详情'}
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 8,
              marginTop: 20,
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: safePage <= 1 ? '#f3f4f6' : '#fff',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                fontSize: 13,
                color: safePage <= 1 ? '#9ca3af' : '#374151',
              }}
            >
              ← 上一页
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: p === safePage ? '#2563eb' : '#f3f4f6',
                  color: p === safePage ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: p === safePage ? 700 : 400,
                }}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: safePage >= totalPages ? '#f3f4f6' : '#fff',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                fontSize: 13,
              }}
            >
              下一页 →
            </button>
            <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>
              共 {filteredRefunds.length} 条
            </span>
          </div>
        )}

        {/* 展开明细 */}
        {detailTarget && <RefundDetailPanel item={detailTarget} onClose={() => setDetailTarget(null)} />}

        {/* 审批弹窗 */}
        {approvalTarget && (
          <Modal
            open
            onClose={() => setApprovalTarget(null)}
            title={`退单审批 — ${approvalTarget.id}`}
            width={560}
          >
            <ApprovalModalContent
              item={approvalTarget}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </Modal>
        )}
      </div>
    </PageShell>
  );
}
