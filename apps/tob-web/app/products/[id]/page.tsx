/**
 * products/[id]/page.tsx — 商品详情页 (Next.js App Router Page)
 * 角色视角: 👔店长 / 📦采购 / 📋运营
 * 功能: 商品基本信息、库存动态、编辑/操作按钮、状态流转、删除确认
 */
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

// ── 通过 id 查找商品 ──

function findProduct(id: string): ProductItem | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

// ── 样式 ──

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const fieldGroupStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16,
};

const fullWidthContainer: React.CSSProperties = {
  width: '100%',
};

// ---- 状态管理 ----

type ConfirmAction = 'toggleStatus' | 'delete' | null;

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';

  const product = useMemo(() => findProduct(id), [id]);

  // 编辑态
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({
    name: '',
    price: 0,
    stock: 0,
    cost: 0,
    unit: '',
    brandName: '',
    supplierName: '',
  });

  // 弹窗
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const { submitting, feedback, handleSubmit } = useFormSubmit();

  // 编辑初始化
  const startEdit = useCallback(() => {
    if (!product) return;
    setEditFields({
      name: product.name,
      price: product.price,
      stock: product.stock,
      cost: product.cost,
      unit: product.unit,
      brandName: product.brandName,
      supplierName: product.supplierName,
    });
    setEditMode(true);
  }, [product]);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditFields({ name: '', price: 0, stock: 0, cost: 0, unit: '', brandName: '', supplierName: '' });
  }, []);

  // 保存编辑
  const saveEdit = useCallback(async () => {
    await handleSubmit(async () => {
      // 模拟保存 API 调用
      await new Promise((r) => setTimeout(r, 800));
      setEditMode(false);
    }, { successMessage: '商品信息已更新', errorMessage: '保存失败，请重试' });
  }, [handleSubmit]);

  // 切换状态
  const toggleStatus = useCallback(async () => {
    setConfirmAction(null);
    await handleSubmit(async () => {
      await new Promise((r) => setTimeout(r, 600));
    }, {
      successMessage: product?.status === 'active' ? '商品已下架' : '商品已上架',
      errorMessage: '操作失败',
    });
  }, [handleSubmit, product]);

  // 删除
  const deleteProduct = useCallback(async () => {
    setConfirmAction(null);
    await handleSubmit(async () => {
      await new Promise((r) => setTimeout(r, 600));
    }, {
      successMessage: '商品已删除',
      errorMessage: '删除失败',
    });
    router.push('/products');
  }, [handleSubmit, router]);

  // 操作按钮
  const actions: DetailShellAction[] = useMemo(() => {
    if (!product) return [];
    const result: DetailShellAction[] = [
      {
        label: editMode ? '取消编辑' : '编辑',
        variant: editMode ? 'default' : 'primary',
        onClick: editMode ? cancelEdit : startEdit,
      },
      {
        label: product.status === 'active' ? '下架' : '上架',
        variant: 'warning',
        onClick: () => setConfirmAction('toggleStatus'),
      },
      {
        label: '删除',
        variant: 'danger',
        onClick: () => setConfirmAction('delete'),
      },
    ];
    return result;
  }, [product, editMode, startEdit, cancelEdit]);

  // 错误 / 空状态
  if (!product) {
    return (
      <PageShell>
        <div style={{ padding: 80, textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>商品未找到</h2>
          <p style={{ marginTop: 8 }}>ID: {id}</p>
        </div>
      </PageShell>
    );
  }

  const statusMeta = PRODUCT_STATUS_MAP[product.status];
  const categoryMeta = PRODUCT_CATEGORY_MAP[product.category];

  // 详情字段
  const detailRows = [
    { label: 'SKU', value: product.sku },
    { label: '分类', value: categoryMeta?.label ?? product.category },
    { label: '状态', value: <StatusBadge variant={statusMeta?.variant ?? 'neutral'}>{statusMeta?.label ?? product.status}</StatusBadge> },
    { label: '售价', value: `¥${product.price.toFixed(2)}` },
    { label: '成本', value: `¥${product.cost.toFixed(2)}` },
    { label: '毛利', value: `¥${(product.price - product.cost).toFixed(2)}` },
    { label: '库存', value: `${product.stock} ${product.unit}` },
    { label: '品牌', value: product.brandName },
    { label: '供应商', value: product.supplierName },
    { label: '所属门店', value: product.storeName },
    { label: '市场区域', value: product.marketCode },
    { label: '创建时间', value: product.createdAt },
    { label: '更新时间', value: product.updatedAt },
  ];

  return (
    <PageShell>
      <DetailShell
        title={product.name}
        subtitle={`SKU: ${product.sku}`}
        actions={actions}
      >
        {/* 基本信息 */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>基本信息</h3>
          <div style={fieldGroupStyle}>
            {detailRows.slice(0, 4).map((row) => (
              <div key={row.label} style={fullWidthContainer}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontSize: 14, color: '#e2e8f0' }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 价格库存 */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>价格与库存</h3>
          <div style={fieldGroupStyle}>
            {detailRows.slice(4, 8).map((row) => (
              <div key={row.label} style={fullWidthContainer}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontSize: 14, color: '#e2e8f0' }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 供应链 */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>供应链信息</h3>
          <div style={fieldGroupStyle}>
            {detailRows.slice(8, 11).map((row) => (
              <div key={row.label} style={fullWidthContainer}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontSize: 14, color: '#e2e8f0' }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 时间 */}
        <div style={sectionStyle}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>时间信息</h3>
          <div style={fieldGroupStyle}>
            {detailRows.slice(11).map((row) => (
              <div key={row.label} style={fullWidthContainer}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{row.label}</div>
                <div style={{ fontSize: 14, color: '#e2e8f0' }}>{row.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 编辑模式 */}
        {editMode && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>编辑商品</h3>
            <div style={fieldGroupStyle}>
              {(['name', 'price', 'stock', 'cost', 'unit', 'brandName', 'supplierName'] as const).map(
                (field) => (
                  <FormField
                    key={field}
                    label={
                      field === 'name'
                        ? '商品名称'
                        : field === 'price'
                          ? '售价'
                          : field === 'stock'
                            ? '库存'
                            : field === 'cost'
                              ? '成本'
                              : field === 'unit'
                                ? '单位'
                                : field === 'brandName'
                                  ? '品牌'
                                  : '供应商'
                    }
                  >
                    <input
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(148,163,184,0.3)',
                        background: '#0f172a',
                        color: '#e2e8f0',
                        fontSize: 14,
                      }}
                      value={String(editFields[field])}
                      onChange={(e) => {
                        const val =
                          field === 'price' || field === 'stock' || field === 'cost'
                            ? Number(e.target.value)
                            : e.target.value;
                        setEditFields((prev) => ({ ...prev, [field]: val }));
                      }}
                    />
                  </FormField>
                ),
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <SubmitButton onClick={saveEdit} submitting={submitting} variant="primary">
                保存
              </SubmitButton>
              <SubmitButton onClick={cancelEdit} variant="default">
                取消
              </SubmitButton>
            </div>
          </div>
        )}

        {/* 提交反馈 */}
        {feedback && <FormSubmitFeedback feedback={feedback} />}
      </DetailShell>

      {/* 确认弹窗 */}
      <Modal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title="确认操作"
      >
        <p style={{ color: '#cbd5e1', marginBottom: 20, fontSize: 14 }}>
          {confirmAction === 'toggleStatus'
            ? `确定${product.status === 'active' ? '下架' : '上架'}商品「${product.name}」？`
            : `确定删除商品「${product.name}」？此操作不可撤销。`}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <SubmitButton
            onClick={confirmAction === 'toggleStatus' ? toggleStatus : deleteProduct}
            submitting={submitting}
            variant={confirmAction === 'delete' ? 'danger' : 'warning'}
          >
            确认
          </SubmitButton>
          <SubmitButton onClick={() => setConfirmAction(null)} variant="default">
            取消
          </SubmitButton>
        </div>
      </Modal>
    </PageShell>
  );
}
