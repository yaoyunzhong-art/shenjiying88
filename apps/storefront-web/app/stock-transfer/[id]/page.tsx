/**
 * 库存调拨详情页 — Stock Transfer Detail Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购 / 📦仓管
 * 功能: 调拨单详细信息、编辑、状态流转、操作历史
 */
'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  PageShell,
  StatusBadge,
  Button,
  DataTable,
  DetailActionBar,
} from '@m5/ui';

// ---- 类型 ----

type TransferStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse';

interface StockTransferDetail {
  id: string;
  transferNo: string;
  type: TransferType;
  fromLocation: string;
  toLocation: string;
  status: TransferStatus;
  itemsCount: number;
  totalQuantity: number;
  applicant: string;
  approver: string;
  reason: string;
  appliedAt: string;
  completedAt: string | null;
  createdAt: string;
  items: TransferItem[];
}

interface TransferItem {
  sku: string;
  name: string;
  spec: string;
  quantity: number;
  unit: string;
}

const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  in_transit: '调拨中',
  completed: '已完成',
  cancelled: '已取消',
};

const TRANSFER_STATUS_VARIANTS: Record<TransferStatus, 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'default'> = {
  draft: 'neutral',
  pending: 'warning',
  approved: 'info',
  in_transit: 'info',
  completed: 'success',
  cancelled: 'error',
};

const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店⇄门店',
  warehouse_to_store: '仓库→门店',
  store_to_warehouse: '门店→仓库',
};

// ---- Mock ----

const MOCK_DETAILS: Record<string, StockTransferDetail> = {
  '1': {
    id: '1', transferNo: 'DB-20260628-001', type: 'warehouse_to_store',
    fromLocation: '中央仓库', toLocation: '旗舰店(天河城)',
    status: 'in_transit', itemsCount: 8, totalQuantity: 120,
    applicant: '张经理', approver: '陈主管',
    reason: '门店补货-洁面系列',
    appliedAt: '2026-06-28 08:30', completedAt: null, createdAt: '2026-06-28 08:30',
    items: [
      { sku: 'CL-001', name: '氨基酸洁面乳', spec: '120ml', quantity: 30, unit: '支' },
      { sku: 'CL-002', name: '泡沫洁面啫喱', spec: '150ml', quantity: 20, unit: '支' },
      { sku: 'CL-003', name: '温和卸妆水', spec: '200ml', quantity: 25, unit: '瓶' },
      { sku: 'CL-004', name: '深层清洁面膜', spec: '100g', quantity: 15, unit: '盒' },
      { sku: 'CL-005', name: '洁面巾', spec: '50片', quantity: 10, unit: '包' },
      { sku: 'CL-006', name: '洁面刷替换头', spec: '通用', quantity: 8, unit: '个' },
      { sku: 'CL-007', name: '毛孔清洁鼻贴', spec: '10片', quantity: 7, unit: '盒' },
      { sku: 'CL-008', name: '去角质磨砂膏', spec: '80g', quantity: 5, unit: '支' },
    ],
  },
  '2': {
    id: '2', transferNo: 'DB-20260628-002', type: 'store_to_store',
    fromLocation: '旗舰店(天河城)', toLocation: '分店(体育西)',
    status: 'pending', itemsCount: 3, totalQuantity: 15,
    applicant: '李店长', approver: '',
    reason: '调拨热销口红品',
    appliedAt: '2026-06-28 09:00', completedAt: null, createdAt: '2026-06-28 09:00',
    items: [
      { sku: 'LK-001', name: '哑光丝绒口红 #520', spec: '3.5g', quantity: 5, unit: '支' },
      { sku: 'LK-002', name: '水润唇釉 #301', spec: '5ml', quantity: 5, unit: '支' },
      { sku: 'LK-003', name: '变色唇膏 #101', spec: '3g', quantity: 5, unit: '支' },
    ],
  },
  '3': {
    id: '3', transferNo: 'DB-20260627-003', type: 'store_to_warehouse',
    fromLocation: '分店(体育西)', toLocation: '中央仓库',
    status: 'completed', itemsCount: 5, totalQuantity: 48,
    applicant: '王店长', approver: '陈主管',
    reason: '临期品退回',
    appliedAt: '2026-06-27 14:00', completedAt: '2026-06-27 16:30', createdAt: '2026-06-27 14:00',
    items: [
      { sku: 'EX-001', name: '防晒喷雾 SPF50', spec: '150ml', quantity: 12, unit: '瓶' },
      { sku: 'EX-002', name: '晒后修复啫喱', spec: '100ml', quantity: 10, unit: '支' },
      { sku: 'EX-003', name: '美白精华液', spec: '30ml', quantity: 8, unit: '盒' },
      { sku: 'EX-004', name: '眼霜小样', spec: '5ml', quantity: 10, unit: '盒' },
      { sku: 'EX-005', name: '乳液旅行装', spec: '20ml', quantity: 8, unit: '支' },
    ],
  },
};

// ---- Helpers ----

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const ITEM_COLUMNS = [
  { key: 'sku', header: 'SKU' },
  { key: 'name', header: '商品名称' },
  { key: 'spec', header: '规格' },
  {
    key: 'quantity',
    header: '数量',
    render: (row: TransferItem) => (
      <span style={{ fontWeight: 600 }}>{row.quantity} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{row.unit}</span></span>
    ),
  },
];

// ---- Status flow transitions ----

const STATUS_FLOW: Record<TransferStatus, TransferStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['in_transit', 'cancelled'],
  in_transit: ['completed'],
  completed: [],
  cancelled: [],
};

// ---- 页面 ----

export default function StockTransferDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const [transfer, setTransfer] = useState<StockTransferDetail | null>(() => MOCK_DETAILS[id] ?? null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleStatusChange = (newStatus: TransferStatus) => {
    if (!transfer) return;
    const displayName = TRANSFER_STATUS_LABELS[newStatus];
    setTransfer({ ...transfer, status: newStatus });
    setStatusMessage(`调拨单状态已更新为: ${displayName}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDelete = () => {
    if (!transfer) return;
    if (!window.confirm(`确认删除调拨单 ${transfer.transferNo}？此操作不可恢复。`)) return;
    setStatusMessage(`调拨单 ${transfer.transferNo} 已删除`);
    setTimeout(() => { router.push('/stock-transfer'); }, 1500);
  };

  const handleEdit = () => {
    router.push(`/stock-transfer/${id}/edit`);
  };

  const nextStatuses = transfer ? STATUS_FLOW[transfer.status] : [];

  if (!transfer) {
    return (
      <PageShell title="调拨单详情">
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 8 }}>调拨单未找到</h2>
          <p style={{ color: '#9ca3af', marginBottom: 20 }}>未找到 ID 为 {id} 的调拨单</p>
          <Button onClick={() => router.push('/stock-transfer')}>
            ← 返回调拨单列表
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={`调拨单详情 — ${transfer.transferNo}`}>
      {/* 状态消息 */}
      {statusMessage && (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16,
          backgroundColor: '#dcfce7', color: '#166534', fontSize: 14,
          border: '1px solid #86efac',
        }}>
          {statusMessage}
        </div>
      )}

      {/* 详情卡片 */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 12, padding: 24,
        border: '1px solid #e2e8f0', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px', color: '#1e293b' }}>
              {transfer.transferNo}
            </h1>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              <StatusBadge variant={TRANSFER_STATUS_VARIANTS[transfer.status]} label={TRANSFER_STATUS_LABELS[transfer.status]} />
              <span style={{ marginLeft: 12 }}>{TRANSFER_TYPE_LABELS[transfer.type]}</span>
            </div>
          </div>
          <DetailActionBar
            actions={[
              { key: 'edit', icon: 'link' as const, label: '编辑', onClick: handleEdit },
              ...nextStatuses.map((s) => ({
                key: 'flow-' + s,
                icon: s === 'cancelled' ? 'share' as const : 'copy' as const,
                label: `流转为: ${TRANSFER_STATUS_LABELS[s]}`,
                onClick: () => handleStatusChange(s),
              })),
              { key: 'delete', icon: 'download' as const, label: '删除', onClick: handleDelete, variant: 'danger' as const },
            ]}
          />
        </div>

        {/* 基础信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: '调拨类型', value: TRANSFER_TYPE_LABELS[transfer.type] },
            { label: '调出地', value: transfer.fromLocation },
            { label: '调入地', value: transfer.toLocation },
            { label: '申请人', value: transfer.applicant },
            { label: '审批人', value: transfer.approver || '-' },
            { label: '申请时间', value: formatDate(transfer.appliedAt) },
            { label: '完成时间', value: transfer.completedAt ? formatDate(transfer.completedAt) : '-' },
            { label: '调拨原因', value: transfer.reason },
            { label: '商品数', value: `${transfer.itemsCount} 种 / ${transfer.totalQuantity} 件` },
          ].map((info) => (
            <div key={info.label}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{info.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{info.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 商品明细 */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 12, padding: 24,
        border: '1px solid #e2e8f0',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' }}>
          调拨商品明细
        </h2>
        <DataTable
          columns={ITEM_COLUMNS}
          rows={transfer.items}
          rowKey={(row) => row.sku}
        />
      </div>
    </PageShell>
  );
}
