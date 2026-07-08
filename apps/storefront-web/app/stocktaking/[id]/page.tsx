/**
 * 库存盘点详情页 — Stocktaking Detail Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🔧仓管
 * 功能: 盘点单详细信息展示、编辑、状态流转、删除、盘点商品明细
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
  ConfirmActionDialog,
} from '@m5/ui';
import type { DataTableColumn } from '@m5/ui';

// ---- 类型 ----

type StocktakingStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

interface StocktakingItem {
  sku: string;
  name: string;
  spec: string;
  expectedQty: number;
  actualQty: number;
  diff: number;
  unit: string;
  remark: string;
}

interface StocktakingDetail {
  id: string;
  batchNo: string;
  storeName: string;
  initiator: string;
  totalItems: number;
  checkedItems: number;
  discrepancyCount: number;
  status: StocktakingStatus;
  createdAt: string;
  completedAt?: string;
  items: StocktakingItem[];
}

// ---- 常量 ----

const STATUS_LABELS: Record<StocktakingStatus, string> = {
  draft: '草稿',
  in_progress: '盘点中',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_VARIANTS: Record<StocktakingStatus, 'neutral' | 'info' | 'success' | 'error'> = {
  draft: 'neutral',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'error',
};

// 状态流转表
const STATUS_FLOW: Record<StocktakingStatus, StocktakingStatus[]> = {
  draft: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// ---- Mock 数据 ----

const MOCK_DETAILS: Record<string, StocktakingDetail> = {
  'st-001': {
    id: 'st-001',
    batchNo: 'PD-20260708-001',
    storeName: '朝阳旗舰店',
    initiator: '张三',
    totalItems: 320,
    checkedItems: 320,
    discrepancyCount: 2,
    status: 'completed',
    createdAt: '2026-07-08 08:30',
    completedAt: '2026-07-08 10:15',
    items: [
      { sku: 'SKU-001', name: '氨基酸洁面乳', spec: '120ml', expectedQty: 50, actualQty: 50, diff: 0, unit: '支', remark: '' },
      { sku: 'SKU-002', name: '泡沫洁面啫喱', spec: '150ml', expectedQty: 30, actualQty: 30, diff: 0, unit: '支', remark: '' },
      { sku: 'SKU-003', name: '温和卸妆水', spec: '200ml', expectedQty: 40, actualQty: 39, diff: -1, unit: '瓶', remark: '疑似丢失 1 瓶' },
      { sku: 'SKU-004', name: '深层清洁面膜', spec: '100g', expectedQty: 25, actualQty: 25, diff: 0, unit: '盒', remark: '' },
      { sku: 'SKU-005', name: '防晒喷雾 SPF50', spec: '150ml', expectedQty: 20, actualQty: 20, diff: 0, unit: '瓶', remark: '' },
      { sku: 'SKU-006', name: '保湿面霜', spec: '50g', expectedQty: 35, actualQty: 36, diff: 1, unit: '盒', remark: '多出 1 盒，上次盘点误差' },
      { sku: 'SKU-007', name: '眼部精华', spec: '15ml', expectedQty: 20, actualQty: 20, diff: 0, unit: '支', remark: '' },
      { sku: 'SKU-008', name: '去角质磨砂膏', spec: '80g', expectedQty: 15, actualQty: 15, diff: 0, unit: '支', remark: '' },
      { sku: 'SKU-009', name: '美白精华液', spec: '30ml', expectedQty: 10, actualQty: 10, diff: 0, unit: '盒', remark: '' },
      { sku: 'SKU-010', name: '面膜套装', spec: '5片', expectedQty: 75, actualQty: 75, diff: 0, unit: '套', remark: '' },
    ],
  },
  'st-002': {
    id: 'st-002',
    batchNo: 'PD-20260708-002',
    storeName: '朝阳旗舰店',
    initiator: '李四',
    totalItems: 150,
    checkedItems: 98,
    discrepancyCount: 0,
    status: 'in_progress',
    createdAt: '2026-07-08 09:00',
    items: [
      { sku: 'SKU-101', name: '口红套盒', spec: '3支装', expectedQty: 20, actualQty: 20, diff: 0, unit: '套', remark: '' },
      { sku: 'SKU-102', name: '唇釉', spec: '5ml', expectedQty: 30, actualQty: 28, diff: -2, unit: '支', remark: '待复核' },
      { sku: 'SKU-103', name: '眼影盘', spec: '12色', expectedQty: 48, actualQty: 48, diff: 0, unit: '盒', remark: '' },
    ],
  },
  'st-003': {
    id: 'st-003',
    batchNo: 'PD-20260707-001',
    storeName: '海淀分店',
    initiator: '王五',
    totalItems: 280,
    checkedItems: 280,
    discrepancyCount: 5,
    status: 'completed',
    createdAt: '2026-07-07 08:00',
    completedAt: '2026-07-07 12:30',
    items: [
      { sku: 'SKU-201', name: '洗发水', spec: '500ml', expectedQty: 60, actualQty: 58, diff: -2, unit: '瓶', remark: '破损 2 瓶已报损' },
      { sku: 'SKU-202', name: '护发素', spec: '500ml', expectedQty: 40, actualQty: 40, diff: 0, unit: '瓶', remark: '' },
      { sku: 'SKU-203', name: '沐浴露', spec: '400ml', expectedQty: 50, actualQty: 47, diff: -3, unit: '瓶', remark: '待查明原因' },
    ],
  },
};

// ---- 工具 ----

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// ---- 表格列定义 ----

const ITEM_COLUMNS: DataTableColumn<StocktakingItem>[] = [
  { key: 'sku', header: 'SKU' },
  { key: 'name', header: '商品名称' },
  { key: 'spec', header: '规格' },
  { key: 'expectedQty', header: '账面数量' },
  { key: 'actualQty', header: '实盘数量' },
  {
    key: 'diff',
    header: '差异',
    render: (row: StocktakingItem) => {
      if (row.diff === 0) return <span style={{ color: '#6b7280' }}>±0</span>;
      const isPositive = row.diff > 0;
      return (
        <span style={{ color: isPositive ? '#059669' : '#dc2626', fontWeight: 600 }}>
          {isPositive ? `+${row.diff}` : `${row.diff}`}
        </span>
      );
    },
  },
  { key: 'unit', header: '单位' },
  { key: 'remark', header: '备注' },
];

// ---- 页面 ----

export default function StocktakingDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const [detail, setDetail] = useState<StocktakingDetail | null>(() => MOCK_DETAILS[id] ?? null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'statusChange' | 'delete'; target?: StocktakingStatus } | null>(null);

  // ---- 计算统计 ----
  const stats = useMemo(() => {
    if (!detail) return null;
    const items = detail.items;
    const totalDiff = items.reduce((sum, i) => sum + i.diff, 0);
    const hasError = items.filter((i) => i.diff !== 0).length;
    return { totalItems: items.length, totalDiff, hasError };
  }, [detail]);

  // ---- 操作处理 ----
  const handleStatusChange = (newStatus: StocktakingStatus) => {
    if (!detail) return;
    const displayName = STATUS_LABELS[newStatus];
    const updated = { ...detail, status: newStatus };
    if (newStatus === 'completed') updated.completedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
    setDetail(updated);
    setStatusMessage(`盘点单状态已更新为: ${displayName}`);
    setConfirmAction(null);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDelete = () => {
    if (!detail) return;
    setStatusMessage(`盘点单 ${detail.batchNo} 已删除`);
    setConfirmAction(null);
    setTimeout(() => { router.push('/stocktaking'); }, 1500);
  };

  const handleEdit = () => {
    router.push(`/stocktaking/${id}/edit`);
  };

  const nextStatuses = detail ? STATUS_FLOW[detail.status] : [];

  // ---- 未找到 ----
  if (!detail) {
    return (
      <PageShell title="盘点单详情">
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 8 }}>盘点单未找到</h2>
          <p style={{ color: '#9ca3af', marginBottom: 20 }}>未找到 ID 为 {id} 的盘点单</p>
          <Button onClick={() => router.push('/stocktaking')}>
            ← 返回盘点列表
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={`盘点单详情 — ${detail.batchNo}`}>
      {/* 状态消息 */}
      {statusMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            marginBottom: 16,
            backgroundColor: '#dcfce7',
            color: '#166534',
            fontSize: 14,
            border: '1px solid #86efac',
          }}
          data-testid="status-message"
        >
          {statusMessage}
        </div>
      )}

      {/* 主信息卡片 */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #e2e8f0',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: '0 0 4px',
                color: '#1e293b',
              }}
            >
              {detail.batchNo}
            </h1>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              <StatusBadge variant={STATUS_VARIANTS[detail.status]} label={STATUS_LABELS[detail.status]} />
            </div>
          </div>
          <DetailActionBar
            actions={[
              { key: 'edit', icon: 'link' as const, label: '编辑', onClick: handleEdit },
              ...nextStatuses.map((s) => ({
                key: 'flow-' + s,
                icon: (s === 'cancelled' ? 'share' as const : 'copy' as const),
                label: `流转为: ${STATUS_LABELS[s]}`,
                onClick: () => setConfirmAction({ type: 'statusChange', target: s }),
              })),
              {
                key: 'delete',
                icon: 'download' as const,
                label: '删除',
                onClick: () => setConfirmAction({ type: 'delete' }),
                variant: 'danger' as const,
              },
            ]}
          />
        </div>

        {/* 基础信息网格 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
            marginBottom: 20,
          }}
        >
          {[
            { label: '门店名称', value: detail.storeName },
            { label: '盘点人', value: detail.initiator },
            { label: '盘点日期', value: formatDate(detail.createdAt) },
            { label: '完成时间', value: detail.completedAt ? formatDate(detail.completedAt) : '-' },
            { label: '盘点总数', value: `${detail.totalItems} 件` },
            { label: '已盘数量', value: `${detail.checkedItems} 件` },
            { label: '差异数量', value: `${detail.discrepancyCount} 处` },
            { label: '差异总值', value: stats ? `${stats.totalDiff > 0 ? '+' : ''}${stats.totalDiff}` : '-' },
            { label: '差异商品', value: stats ? `${stats.hasError} 种` : '-' },
          ].map((info) => (
            <div key={info.label}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                {info.label}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>
                {info.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 盘点商品明细 */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 24,
          border: '1px solid #e2e8f0',
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#1e293b',
            margin: '0 0 16px',
          }}
        >
          盘点商品明细
        </h2>
        <DataTable
          columns={ITEM_COLUMNS}
          rows={detail.items}
          rowKey={(row) => row.sku}
        />
      </div>

      {/* 确认操作弹窗 */}
      <ConfirmActionDialog
        open={confirmAction !== null}
        title={
          confirmAction?.type === 'delete'
            ? '确认删除'
            : confirmAction?.type === 'statusChange'
              ? `确认流转为「${confirmAction.target ? STATUS_LABELS[confirmAction.target] : ''}」`
              : ''
        }
        message={
          confirmAction?.type === 'delete'
            ? `确认删除盘点单 ${detail.batchNo}？此操作不可恢复。`
            : confirmAction?.type === 'statusChange'
              ? `确认将盘点单 ${detail.batchNo} 的状态变更为「${confirmAction.target ? STATUS_LABELS[confirmAction.target] : ''}」？`
              : ''
        }
        confirmVariant={confirmAction?.type === 'delete' ? 'danger' : 'primary'}
        onConfirm={() => {
          if (confirmAction?.type === 'delete') handleDelete();
          if (confirmAction?.type === 'statusChange' && confirmAction.target) handleStatusChange(confirmAction.target);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </PageShell>
  );
}
