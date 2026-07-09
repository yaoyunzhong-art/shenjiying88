/**
 * inventory/[id]/page.tsx — 库存详情页 (ToB Next.js App Router Page)
 *
 * 展示产品/SKU库存详细信息
 * 支持编辑 / 盘点 / 删除操作
 * 角色视角: 📦品牌运营 / 💰采购经理 / 👔门店店长
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';

import {
  PageShell,
  DetailShell,
  StatusBadge,
  Badge,
  Modal,
  SubmitButton,
  FormSubmitFeedback,
  DataTable,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';

import {
  MOCK_PRODUCTS,
  MOCK_SKUS,
  MOCK_PURCHASE_ORDERS,
  MOCK_INVENTORY_CHECKS,
  MOCK_TRANSFERS,
  PO_STATUS_LABELS,
  CHECK_STATUS_LABELS,
  TRANSFER_STATUS_LABELS,
  TRANSFER_TYPE_LABELS,
  formatCurrency,
  formatDate,
  getSKUStockStatus,
  getProductById,
  getSKUsByProductId,
  type Product,
  type SKU,
  type PurchaseOrder,
  type InventoryCheck,
  type CrossStoreTransfer,
} from '../inventory-data';

/* ================================================================
   Style
   ================================================================ */

const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const infoGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 16,
};

const infoItem: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const infoLabel: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
};

const infoValue: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: '#e2e8f0',
};

const stockBarOuter: React.CSSProperties = {
  width: '100%',
  height: 8,
  borderRadius: 4,
  background: '#1e293b',
  overflow: 'hidden',
};

/* ================================================================
   Page Component
   ================================================================ */

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const product = useMemo(() => getProductById(productId), [productId]);
  const skus = useMemo(() => getSKUsByProductId(productId), [productId]);

  // Purchase orders for this product
  const relatedPOs = useMemo(() => {
    const skuIds = new Set(skus.map(s => s.skuId));
    return MOCK_PURCHASE_ORDERS.filter(po =>
      po.items.some(i => skuIds.has(i.skuId)),
    );
  }, [skus]);

  // Inventory checks for this product
  const relatedChecks = useMemo(() => {
    const skuIds = new Set(skus.map(s => s.skuId));
    return MOCK_INVENTORY_CHECKS.filter(ck =>
      ck.items.some(i => skuIds.has(i.skuId)),
    );
  }, [skus]);

  // Transfers for this product
  const relatedTransfers = useMemo(() => {
    const skuIds = new Set(skus.map(s => s.skuId));
    return MOCK_TRANSFERS.filter(tr =>
      tr.items.some(i => skuIds.has(i.skuId)),
    );
  }, [skus]);

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { submitting, error, success, submit, reset } = useFormSubmit({
    onSubmit: async () => {
      await new Promise(r => setTimeout(r, 500));
    },
    successMessage: '产品已删除',
  });

  // Total stock
  const totalStock = useMemo(() => skus.reduce((s, sku) => s + sku.stock, 0), [skus]);
  const lowStockCount = useMemo(() => skus.filter(s => getSKUStockStatus(s) === 'low').length, [skus]);
  const outOfStockCount = useMemo(() => skus.filter(s => getSKUStockStatus(s) === 'out').length, [skus]);

  /* ── Actions ── */
  const handleDelete = useCallback(async () => {
    const res = await submit();
    if (res) {
      setDeleteModalOpen(false);
      router.push('/inventory');
    }
  }, [submit, router]);

  const handleStartCheck = useCallback(() => {
    router.push(`/inventory/check?productId=${productId}`);
  }, [router, productId]);

  const handleEdit = useCallback(() => {
    router.push(`/inventory/${productId}/edit`);
  }, [router, productId]);

  const actions: DetailShellAction[] = useMemo(() => [
    {
      key: 'start-check',
      label: '开始盘点',
      variant: 'primary',
      onClick: handleStartCheck,
    },
    {
      key: 'edit',
      label: '编辑',
      variant: 'secondary',
      onClick: handleEdit,
    },
    {
      key: 'delete',
      label: '删除',
      variant: 'danger',
      onClick: () => setDeleteModalOpen(true),
    },
  ], [handleStartCheck, handleEdit]);

  /* ── SKU 表格列 ── */
  const skuColumns = useMemo((): Array<{ key: string; header: string; render?: (row: SKU) => React.ReactNode }> => [
    { key: 'skuCode', header: 'SKU编码' },
    { key: 'name', header: '名称' },
    {
      key: 'specs',
      header: '规格',
      render: (row: SKU) => Object.entries(row.specs).map(([k, v]) => `${k}: ${v}`).join(' / '),
    },
    {
      key: 'stock',
      header: '库存',
      render: (row: SKU) => {
        const st = getSKUStockStatus(row);
        const barWidth = Math.min((row.stock / (row.safetyStock * 3)) * 100, 100);
        const variant = st === 'out' ? 'error' : st === 'low' ? 'warning' : 'success';
        const color = st === 'out' ? '#f87171' : st === 'low' ? '#fbbf24' : '#4ade80';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
            <span style={{ fontWeight: 600, minWidth: 40, color }}>{row.stock}</span>
            <div style={{ flex: 1 }}>
              <div style={stockBarOuter}>
                <div style={{ height: '100%', width: `${barWidth}%`, borderRadius: 4, background: color }} />
              </div>
            </div>
            <StatusBadge variant={variant} label={st === 'out' ? '缺货' : st === 'low' ? '低库存' : '正常'} />
          </div>
        );
      },
    },
    {
      key: 'safetyStock',
      header: '安全库存',
      render: (row: SKU) => <span style={{ color: '#94a3b8' }}>{row.safetyStock}</span>,
    },
    { key: 'costPrice', header: '成本价', render: (row: SKU) => formatCurrency(row.costPrice) },
    { key: 'retailPrice', header: '零售价', render: (row: SKU) => formatCurrency(row.retailPrice) },
  ], []);

  /* ── 采购订单列 ── */
  const poColumns = useMemo((): Array<{ key: string; header: string; render?: (row: PurchaseOrder) => React.ReactNode }> => [
    { key: 'poNo', header: '单号' },
    { key: 'supplierName', header: '供应商' },
    {
      key: 'status',
      header: '状态',
      render: (row: PurchaseOrder) => {
        const variant = row.status === 'cancelled' ? 'error' : row.status === 'received' ? 'success' : row.status === 'approved' ? 'info' : row.status === 'pending' ? 'warning' : 'default';
        return <StatusBadge variant={variant} label={PO_STATUS_LABELS[row.status]} />;
      },
    },
    { key: 'totalAmount', header: '金额', render: (row: PurchaseOrder) => formatCurrency(row.totalAmount) },
    { key: 'appliedAt', header: '申请时间' },
  ], []);

  /* ── 盘点单列 ── */
  const checkColumns = useMemo((): Array<{ key: string; header: string; render?: (row: InventoryCheck) => React.ReactNode }> => [
    { key: 'checkNo', header: '盘点单号' },
    { key: 'storeName', header: '门店' },
    {
      key: 'status',
      header: '状态',
      render: (row: InventoryCheck) => (
        <StatusBadge
          variant={row.status === 'completed' ? 'success' : row.status === 'in_progress' ? 'info' : 'default'}
          label={CHECK_STATUS_LABELS[row.status]}
        />
      ),
    },
    {
      key: 'diff',
      header: '盘差',
      render: (row: InventoryCheck) => {
        const totalDiff = row.items.reduce((s, i) => s + i.difference, 0);
        return (
          <span style={{ color: totalDiff === 0 ? '#4ade80' : totalDiff > 0 ? '#fbbf24' : '#f87171', fontWeight: 600 }}>
            {totalDiff > 0 ? '+' : ''}{totalDiff}
          </span>
        );
      },
    },
    { key: 'checkedAt', header: '盘点时间', render: (row: InventoryCheck) => row.checkedAt ?? '-' },
  ], []);

  /* ── 调拨单列 ── */
  const transferColumns = useMemo((): Array<{ key: string; header: string; render?: (row: CrossStoreTransfer) => React.ReactNode }> => [
    { key: 'transferNo', header: '调拨单号' },
    {
      key: 'type',
      header: '类型',
      render: (row: CrossStoreTransfer) => <Badge variant="neutral">{TRANSFER_TYPE_LABELS[row.type]}</Badge>,
    },
    { key: 'fromStore', header: '调出方' },
    { key: 'toStore', header: '调入方' },
    {
      key: 'status',
      header: '状态',
      render: (row: CrossStoreTransfer) => {
        const v = row.status === 'completed' ? 'success' : row.status === 'in_transit' ? 'info' : row.status === 'cancelled' ? 'error' : row.status === 'pending' ? 'warning' : 'default';
        return <StatusBadge variant={v} label={TRANSFER_STATUS_LABELS[row.status]} />;
      },
    },
    { key: 'appliedAt', header: '申请时间' },
  ], []);

  /* ── 未找到 ── */
  if (!product) {
    return (
      <PageShell title="产品未找到">
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          <p>产品ID: {productId} 不存在，请检查链接或返回库存列表。</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={product.name}>
      <div style={pageStyle}>
        {/* ── 产品基本信息 ── */}
        <DetailShell
          title={product.name}
          subtitle={`产品编号: ${product.productId}`}
          backHref="/inventory"
          actions={actions}
        />

        {/* ── 库存概览 ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
        }}>
          {[
            { label: 'SKU数量', value: skus.length, color: '#60a5fa' },
            { label: '总库存', value: totalStock, color: '#4ade80' },
            { label: '低库存预警', value: lowStockCount, color: '#fbbf24' },
            { label: '缺货', value: outOfStockCount, color: '#f87171' },
          ].map(stat => (
            <div key={stat.label} style={{
              borderRadius: 12,
              padding: '16px 20px',
              background: '#1e293b',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{stat.label}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* ── 产品信息 ── */}
        <div style={{
          ...sectionStyle,
          borderRadius: 12,
          padding: 20,
          background: '#1e293b',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>产品信息</h3>
          <div style={infoGrid}>
            <div style={infoItem}>
              <span style={infoLabel}>分类</span>
              <span style={infoValue}>{product.category}</span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>品牌</span>
              <span style={infoValue}>{product.brand}</span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>单位</span>
              <span style={infoValue}>{product.unit}</span>
            </div>
            <div style={infoItem}>
              <span style={infoLabel}>创建时间</span>
              <span style={infoValue}>{formatDate(product.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* ── SKU 列表 ── */}
        <div style={{
          ...sectionStyle,
          borderRadius: 12,
          padding: 20,
          background: '#1e293b',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            SKU 库存明细 ({skus.length})
          </h3>
          <DataTable columns={skuColumns} data={skus} rowKey={(row: SKU) => row.skuId} />
        </div>

        {/* ── 采购订单 ── */}
        <div style={{
          ...sectionStyle,
          borderRadius: 12,
          padding: 20,
          background: '#1e293b',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            采购订单 ({relatedPOs.length})
          </h3>
          {relatedPOs.length > 0 ? (
            <DataTable columns={poColumns} data={relatedPOs} rowKey={(row: PurchaseOrder) => row.poId} />
          ) : (
            <p style={{ color: '#64748b', fontSize: 14 }}>暂无相关采购订单</p>
          )}
        </div>

        {/* ── 盘点记录 ── */}
        <div style={{
          ...sectionStyle,
          borderRadius: 12,
          padding: 20,
          background: '#1e293b',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            盘点记录 ({relatedChecks.length})
          </h3>
          {relatedChecks.length > 0 ? (
            <DataTable columns={checkColumns} data={relatedChecks} rowKey={(row: InventoryCheck) => row.checkId} />
          ) : (
            <p style={{ color: '#64748b', fontSize: 14 }}>暂无盘点记录</p>
          )}
        </div>

        {/* ── 调拨记录 ── */}
        <div style={{
          ...sectionStyle,
          borderRadius: 12,
          padding: 20,
          background: '#1e293b',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
            调拨记录 ({relatedTransfers.length})
          </h3>
          {relatedTransfers.length > 0 ? (
            <DataTable columns={transferColumns} data={relatedTransfers} rowKey={(row: CrossStoreTransfer) => row.transferId} />
          ) : (
            <p style={{ color: '#64748b', fontSize: 14 }}>暂无调拨记录</p>
          )}
        </div>

        {/* ── 删除确认 Modal ── */}
        <Modal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          title="确认删除"
        >
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>
            确定要删除产品「{product.name}」及其所有 SKU 库存数据吗？此操作不可撤销。
          </p>
          <FormSubmitFeedback error={error || undefined} success={success || undefined} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <SubmitButton variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              取消
            </SubmitButton>
            <SubmitButton variant="danger" loading={submitting} onClick={handleDelete}>
              确认删除
            </SubmitButton>
          </div>
        </Modal>
      </div>
    </PageShell>
  );
}
