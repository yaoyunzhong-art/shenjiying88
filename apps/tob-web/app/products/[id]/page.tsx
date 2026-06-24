'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useMemo, useState, useCallback } from 'react';
import {
  PageShell,
  DetailShell,
  StatusBadge,
  Modal,
  SubmitButton,
  FormField,
  FormSubmitFeedback,
  useFormSubmit,
  type DetailShellAction,
} from '@m5/ui';
import {
  MOCK_PRODUCTS,
  PRODUCT_STATUS_MAP,
  PRODUCT_CATEGORY_MAP,
  type ProductItem,
  type ProductStatus,
} from '../../products-data';

// ── 帮助函数 ──

function marginPercent(p: ProductItem): number {
  return p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
}

function marginColor(margin: number): string {
  if (margin >= 50) return '#4ade80';
  if (margin >= 30) return '#fbbf24';
  return '#f87171';
}

function stockColor(stock: number): string {
  if (stock === 0) return '#f87171';
  if (stock < 50) return '#fbbf24';
  return '#94a3b8';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

const NEXT_STATUS: Partial<Record<ProductStatus, ProductStatus>> = {
  active: 'inactive',
  inactive: 'active',
  discontinued: 'draft',
  draft: 'active',
};

const STATUS_ACTION_LABELS: Partial<Record<ProductStatus, string>> = {
  active: '下架',
  inactive: '重新上架',
  discontinued: '转为草稿',
  draft: '发布',
};

// ── 编辑表单数据 ──

type EditFormData = {
  name: string;
  price: number;
  cost: number;
  stock: number;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.6)',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'transparent',
  color: '#cbd5e1',
  cursor: 'pointer',
  fontSize: 13,
};

// ── 编辑弹窗 ──

function EditModal({
  product,
  open,
  onClose,
  onSaved,
}: {
  product: ProductItem;
  open: boolean;
  onClose: () => void;
  onSaved: (data: EditFormData) => void;
}) {
  const [form, setForm] = useState<EditFormData>({
    name: product.name,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
  });

  const { submitting, error, success, submit, clearError } = useFormSubmit({
    onSubmit: async () => {
      if (!form.name.trim()) throw new Error('商品名称不能为空');
      if (form.price <= 0) throw new Error('售价必须大于 0');
      if (form.cost < 0) throw new Error('成本不能为负数');
      if (form.stock < 0) throw new Error('库存不能为负数');
      onSaved(form);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <Modal open={open} onClose={onClose} title="编辑商品">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField label="商品名称" error={!form.name.trim() ? '名称不能为空' : undefined}>
          <input
            data-testid="edit-name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="商品名称"
            style={inputStyle}
          />
        </FormField>
        <FormField label="售价">
          <input
            data-testid="edit-price"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="成本">
          <input
            data-testid="edit-cost"
            type="number"
            step="0.01"
            min="0"
            value={form.cost}
            onChange={(e) => setForm((prev) => ({ ...prev, cost: Number(e.target.value) }))}
            style={inputStyle}
          />
        </FormField>
        <FormField label="库存">
          <input
            data-testid="edit-stock"
            type="number"
            step="1"
            min="0"
            value={form.stock}
            onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
            style={inputStyle}
          />
        </FormField>
        <FormSubmitFeedback submitting={submitting} error={error} success={success} onDismissError={clearError} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>
            取消
          </button>
          <SubmitButton loading={submitting} type="submit">
            保存
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 删除确认弹窗 ──

function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  itemName,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}) {
  const { submitting, submit } = useFormSubmit({
    onSubmit: async () => {
      onConfirm();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="确认删除">
      <div style={{ color: '#cbd5e1', marginBottom: 16 }}>
        确定要删除商品 <strong style={{ color: '#f87171' }}>{itemName}</strong> 吗？此操作不可撤销。
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtnStyle}>
            取消
          </button>
          <SubmitButton loading={submitting} type="submit" variant="danger">
            删除
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

// ── 辅助布局组件 ──

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        marginBottom: 16,
        borderRadius: 12,
        border: '1px solid rgba(148,163,184,0.12)',
        background: 'rgba(15,23,42,0.4)',
        padding: 20,
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  );
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', minHeight: 28 }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      {children ?? <span style={{ fontSize: 14, color: '#e2e8f0', fontWeight: 500 }}>{value}</span>}
    </div>
  );
}

function StatBadge({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 8, background: 'rgba(15,23,42,0.3)' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getProductById(id: string): ProductItem | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

// ── 详情页 ──

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<ProductItem | undefined>(() =>
    getProductById(params.id),
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // 状态流转
  const transitionStatus = useCallback(() => {
    if (!product) return;
    const next = NEXT_STATUS[product.status];
    if (!next) return;
    setProduct((prev) =>
      prev ? { ...prev, status: next, updatedAt: today() } : prev,
    );
  }, [product]);

  // 保存编辑
  const handleSaved = useCallback((data: EditFormData) => {
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            name: data.name,
            price: data.price,
            cost: data.cost,
            stock: data.stock,
            updatedAt: today(),
          }
        : prev,
    );
    setEditOpen(false);
  }, []);

  // 删除
  const handleDelete = useCallback(() => {
    setDeleted(true);
    setDeleteOpen(false);
  }, []);

  const detailActions: DetailShellAction[] = useMemo(
    () => [
      {
        key: 'edit',
        label: '编辑',
        onClick: () => setEditOpen(true),
        variant: 'primary',
      },
      {
        key: 'transition',
        label: product ? STATUS_ACTION_LABELS[product.status] ?? '状态流转' : '状态流转',
        onClick: transitionStatus,
        variant: 'secondary',
      },
      {
        key: 'delete',
        label: '删除',
        onClick: () => setDeleteOpen(true),
        variant: 'danger',
      },
    ],
    [product, transitionStatus],
  );

  if (!product) {
    return (
      <PageShell title="商品详情" description="">
        <div style={{ textAlign: 'center', padding: 64, color: '#64748b', fontSize: 14 }}>
          未找到商品 (ID: {params.id})
        </div>
      </PageShell>
    );
  }

  if (deleted) {
    return (
      <PageShell title="商品详情" description="">
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗑️</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            商品已删除
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
            &ldquo;{product.name}&rdquo; 已从系统中移除。
          </div>
          <button
            onClick={() => router.push('/products')}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid rgba(99,102,241,0.4)',
              background: 'rgba(99,102,241,0.12)',
              color: '#a5b4fc',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            返回商品列表
          </button>
        </div>
      </PageShell>
    );
  }

  const margin = marginPercent(product);
  const s = PRODUCT_STATUS_MAP[product.status];
  const cat = PRODUCT_CATEGORY_MAP[product.category];
  const stockVal = product.stock;

  return (
    <PageShell
      title={product.name}
      description={`SKU: ${product.sku} · ${cat.label} · ${product.storeName}`}
    >
      <DetailShell
        title={product.name}
        subtitle={`SKU: ${product.sku} · ${cat.label} · ${product.storeName}`}
        actions={detailActions}
      >
        {/* 财务指标卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 10,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 20,
          }}
        >
          <StatBadge label="售价" value={`¥${product.price.toFixed(2)}`} color="#93c5fd" />
          <StatBadge label="成本" value={`¥${product.cost.toFixed(2)}`} color="#94a3b8" />
          <StatBadge label="毛利率" value={`${margin.toFixed(1)}%`} color={marginColor(margin)} />
          <StatBadge
            label="库存总量"
            value={stockVal.toLocaleString()}
            color={stockColor(stockVal)}
          />
        </div>

        {/* 基本信息 */}
        <InfoSection title="基本信息">
          <InfoRow label="SKU" value={product.sku} />
          <InfoRow label="商品名称" value={product.name} />
          <InfoRow label="品类" value={cat.label} />
          <InfoRow label="品牌" value={product.brandName} />
          <InfoRow label="供应商" value={product.supplierName} />
          <InfoRow label="计量单位" value={product.unit} />
          <InfoRow label="状态">
            <StatusBadge label={s.label} variant={s.variant} size="sm" dot />
          </InfoRow>
        </InfoSection>

        {/* 价格与库存 */}
        <InfoSection title="价格与库存">
          <InfoRow label="售价" value={`¥${product.price.toFixed(2)}`} />
          <InfoRow label="成本" value={`¥${product.cost.toFixed(2)}`} />
          <InfoRow label="毛利率">
            <span style={{ color: marginColor(margin), fontWeight: 600 }}>
              {margin.toFixed(1)}%
            </span>
          </InfoRow>
          <InfoRow label="库存">
            <span style={{ color: stockColor(stockVal), fontWeight: 600 }}>
              {stockVal.toLocaleString()} {product.unit}
            </span>
          </InfoRow>
          <InfoRow label="库存总值" value={formatCurrency(product.price * stockVal)} />
        </InfoSection>

        {/* 市场与渠道 */}
        <InfoSection title="市场与渠道">
          <InfoRow label="市场区域" value={product.marketCode} />
          <InfoRow label="所属门店" value={product.storeName} />
        </InfoSection>

        {/* 时间记录 */}
        <InfoSection title="变更记录">
          <InfoRow label="创建时间" value={product.createdAt} />
          <InfoRow label="最近更新" value={product.updatedAt} />
        </InfoSection>
      </DetailShell>

      {/* 编辑弹窗 */}
      {editOpen && (
        <EditModal
          product={product}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {/* 删除确认弹窗 */}
      {deleteOpen && (
        <DeleteConfirmModal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete}
          itemName={product.name}
        />
      )}
    </PageShell>
  );
}
