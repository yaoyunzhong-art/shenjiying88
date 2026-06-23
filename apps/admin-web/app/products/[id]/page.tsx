'use client';

import { useState, useCallback, use } from 'react';
import Link from 'next/link';

import {
  DetailShell,
  FormField,
  FormSubmitFeedback,
  InfoRow,
  StatusBadge,
  StatCard,
  CopyToClipboard,
  SubmitButton,
  WorkspaceBreadcrumb,
  CombinedDetailPage,
  useFormSubmit,
  type DetailShellAction,
  type TransitionAction,
} from '@m5/ui';
import {
  MOCK_PRODUCTS,
  PRODUCT_STATUS_MAP,
  PRODUCT_CATEGORY_MAP,
  type ProductItem,
  type ProductStatus,
} from '../../products-data';

// ---- 查找商品 ----

function getProductById(id: string): ProductItem | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

// ---- 状态流转规则 ----

const VALID_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  active: ['inactive', 'discontinued'],
  inactive: ['active', 'discontinued'],
  discontinued: ['draft'],
  draft: ['active'],
};

const TRANSITION_LABELS: Record<ProductStatus, string> = {
  active: '上架',
  inactive: '下架',
  discontinued: '停产',
  draft: '转为草稿',
};

// ---- 编辑表单 ----

interface EditFormData {
  name: string;
  sku: string;
  price: string;
  cost: string;
  stock: string;
  unit: string;
  description: string;
}

interface EditFormErrors {
  name?: string;
  sku?: string;
  price?: string;
  cost?: string;
  stock?: string;
  unit?: string;
  description?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '商品名称不能为空';
  if (!data.sku.trim()) errors.sku = 'SKU 不能为空';
  if (!data.price.trim() || isNaN(Number(data.price)) || Number(data.price) <= 0) {
    errors.price = '请输入有效的售价';
  }
  if (!data.cost.trim() || isNaN(Number(data.cost)) || Number(data.cost) < 0) {
    errors.cost = '请输入有效的成本';
  }
  if (!data.stock.trim() || isNaN(Number(data.stock)) || Number(data.stock) < 0) {
    errors.stock = '请输入有效的库存数量';
  }
  if (!data.unit.trim()) errors.unit = '单位不能为空';
  return errors;
}

async function submitProductEdit(form: EditFormData): Promise<{ success: boolean }> {
  void form;
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { success: true };
}

// ---- 404 子组件（不含 hooks） ----

function ProductNotFound({ id }: { id: string }) {
  return (
    <div style={{ maxWidth: 800, margin: '60px auto', textAlign: 'center', color: '#94a3b8' }}>
      <h2 style={{ fontSize: 24, marginBottom: 12 }}>商品未找到</h2>
      <p>ID: {id} 不存在，请返回商品列表。</p>
      <Link href="/products" style={{ color: '#93c5fd', marginTop: 16, display: 'inline-block' }}>
        ← 返回商品列表
      </Link>
    </div>
  );
}

// ---- 详情内容子组件（所有 hooks 在此） ----

function ProductDetailContent({ product }: { product: ProductItem }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const statusInfo = PRODUCT_STATUS_MAP[product.status];
  const categoryInfo = PRODUCT_CATEGORY_MAP[product.category];
  const margin =
    product.price > 0
      ? (((product.price - product.cost) / product.price) * 100).toFixed(1)
      : '0.0';

  const [formData, setFormData] = useState<EditFormData>({
    name: product.name,
    sku: product.sku,
    price: String(product.price),
    cost: String(product.cost),
    stock: String(product.stock),
    unit: product.unit,
    description: '',
  });
  const [errors, setErrors] = useState<EditFormErrors>({});

  const {
    submit,
    state: submitState,
    reset: resetSubmit,
  } = useFormSubmit<{ success: boolean }>({
    async onSubmit() {
      const validationErrors = validateForm(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error(Object.values(validationErrors)[0]);
      }
      setErrors({});
      return submitProductEdit(formData);
    },
    successMessage: '商品信息已更新成功。',
  });

  const handleSave = useCallback(async () => {
    const result = await submit();
    if (result) {
      setEditOpen(false);
      resetSubmit();
    }
  }, [submit, resetSubmit]);

  const handleFieldChange = useCallback(
    (field: keyof EditFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const handleCancel = useCallback(() => {
    setEditOpen(false);
    setErrors({});
    resetSubmit();
    setFormData({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      cost: String(product.cost),
      stock: String(product.stock),
      unit: product.unit,
      description: '',
    });
  }, [product, resetSubmit]);

  // 状态流转动作
  const allowedTransitions = VALID_TRANSITIONS[product.status] || [];
  const transitionActions: TransitionAction[] = allowedTransitions.map((target) => ({
    key: `transition-${target}`,
    label: TRANSITION_LABELS[target],
    targetStatus: target,
    confirm: {
      title: `确认${TRANSITION_LABELS[target]}`,
      message: `确定要将商品「${product.name}」${TRANSITION_LABELS[target]}吗？此操作将影响前端展示和库存计算。`,
    },
    onTransition: () => {
      // 生产环境替换为 API 调用
      window.location.href = `/products/${product.id}?transition=${target}`;
    },
  }));

  const actions: DetailShellAction[] = [
    ...(editOpen
      ? []
      : [
          {
            key: 'edit',
            label: '编辑',
            variant: 'primary' as const,
            onClick: () => setEditOpen(true),
          },
        ]),
    {
      key: 'delete',
      label: deleteConfirmOpen ? '确认删除？' : '删除',
      variant: 'danger' as const,
      onClick: deleteConfirmOpen
        ? () => {
            window.location.href = '/products';
          }
        : () => setDeleteConfirmOpen(true),
    },
  ];

  if (editOpen) {
    actions.unshift({
      key: 'save',
      label: submitState.isSubmitting ? '保存中...' : '保存修改',
      variant: 'primary',
      loading: submitState.isSubmitting,
      disabled: submitState.isSubmitting,
      onClick: handleSave,
    });
    actions.push({
      key: 'cancel-edit',
      label: '取消',
      variant: 'secondary',
      onClick: handleCancel,
    });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <WorkspaceBreadcrumb
        workspaceLabel="商品管理中心"
        workspaceHref="/products"
        detailLabel={product.name}
      />
      <DetailShell
        title={product.name}
        subtitle={`${product.sku} · ${categoryInfo.label} · ${product.marketCode}`}
        breadcrumbs={[
          { label: '商品管理中心', href: '/products' },
          { label: product.name },
        ]}
        backLink={{ label: '返回商品列表', href: '/products' }}
        actions={actions}
      >
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gap: 14,
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            marginBottom: 24,
          }}
        >
          <StatCard
            label="商品状态"
            value={statusInfo.label}
            helper={`最近更新: ${product.updatedAt}`}
          />
          <StatCard label="品类" value={categoryInfo.label} helper={product.unit} />
          <StatCard
            label="毛利率"
            value={`${margin}%`}
            helper={`成本 ¥${product.cost.toFixed(2)}`}
          />
          <StatCard
            label="库存"
            value={String(product.stock)}
            helper={product.stock === 0 ? '缺货' : product.stock < 50 ? '低库存' : '正常'}
          />
        </div>

        {/* 删除确认提示 */}
        {deleteConfirmOpen && (
          <div
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(127, 29, 29, 0.28)',
              border: '1px solid rgba(248, 113, 113, 0.24)',
              marginBottom: 24,
            }}
          >
            <h3 style={{ margin: '0 0 8px', color: '#fca5a5', fontSize: 16 }}>
              确认删除商品
            </h3>
            <p style={{ margin: '0 0 16px', color: '#fecaca', fontSize: 14 }}>
              确定要删除商品「{product.name}」（{product.sku}）吗？此操作不可恢复，删除后相关数据将全部清除。
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{
                  borderRadius: 10,
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  window.location.href = '/products';
                }}
              >
                确认删除
              </button>
              <button
                style={{
                  borderRadius: 10,
                  padding: '10px 20px',
                  background: 'rgba(148,163,184,0.12)',
                  color: '#cbd5e1',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                onClick={() => setDeleteConfirmOpen(false)}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 编辑表单 */}
        {editOpen ? (
          <section
            style={{
              borderRadius: 16,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              marginBottom: 24,
            }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>
              编辑商品信息
            </h2>

            {submitState.isSubmitting || submitState.errorMessage || submitState.successMessage ? (
              <div style={{ marginBottom: 16 }}>
                <FormSubmitFeedback state={submitState} />
              </div>
            ) : null}

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <FormField label="商品名称" required error={errors.name}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入商品名称"
                  />
                </FormField>
                <FormField label="SKU" required error={errors.sku}>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleFieldChange('sku', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="输入 SKU"
                  />
                </FormField>
              </div>
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
                <FormField label="售价" required error={errors.price}>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleFieldChange('price', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </FormField>
                <FormField label="成本" required error={errors.cost}>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => handleFieldChange('cost', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </FormField>
                <FormField label="库存" required error={errors.stock}>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => handleFieldChange('stock', e.target.value)}
                    disabled={submitState.isSubmitting}
                    style={inputStyle}
                    placeholder="0"
                    min="0"
                  />
                </FormField>
              </div>
              <FormField label="单位" required error={errors.unit}>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleFieldChange('unit', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={inputStyle}
                  placeholder="如：个、瓶、件"
                />
              </FormField>
              <FormField label="描述" helper="补充商品特色、规格等描述信息">
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={submitState.isSubmitting}
                  style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                  placeholder="输入商品描述"
                />
              </FormField>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
                <SubmitButton
                  loading={submitState.isSubmitting}
                  disabled={submitState.isSubmitting}
                  onClick={handleSave}
                  variant="primary"
                >
                  保存修改
                </SubmitButton>
                <SubmitButton
                  disabled={submitState.isSubmitting}
                  onClick={handleCancel}
                  variant="secondary"
                >
                  取消
                </SubmitButton>
              </div>
            </div>
          </section>
        ) : null}

        {/* 综合详情卡片 - 含状态流转 */}
        <CombinedDetailPage
          title="商品详情"
          infoRows={[
            { key: 'sku', label: 'SKU', value: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{product.sku}<CopyToClipboard text={product.sku} size="sm" iconOnly /></span> },
            { key: 'name', label: '商品名称', value: product.name },
            {
              key: 'status',
              label: '商品状态',
              value: <StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" dot />,
            },
            {
              key: 'category',
              label: '品类',
              value: <StatusBadge label={categoryInfo.label} variant={categoryInfo.variant} size="sm" />,
            },
            { key: 'price', label: '售价', value: `¥${product.price.toFixed(2)}` },
            { key: 'cost', label: '成本', value: `¥${product.cost.toFixed(2)}` },
            {
              key: 'margin',
              label: '毛利率',
              value: (
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      Number(margin) >= 50
                        ? '#4ade80'
                        : Number(margin) >= 30
                          ? '#fbbf24'
                          : '#f87171',
                  }}
                >
                  {margin}%
                </span>
              ),
            },
            {
              key: 'stock',
              label: '库存',
              value: (
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      product.stock === 0
                        ? '#f87171'
                        : product.stock < 50
                          ? '#fbbf24'
                          : '#94a3b8',
                  }}
                >
                  {product.stock} {product.unit}
                </span>
              ),
            },
            { key: 'brand', label: '品牌', value: product.brandName },
            { key: 'market', label: '市场', value: product.marketCode },
            { key: 'store', label: '门店', value: product.storeName },
            { key: 'createdAt', label: '创建时间', value: product.createdAt },
            { key: 'updatedAt', label: '最近更新', value: product.updatedAt },
            { key: 'id', label: '商品 ID', value: <CopyToClipboard text={product.id} size="sm" iconOnly /> },
          ]}
          // 状态流转
          transitions={
            transitionActions.length > 0
              ? transitionActions
              : undefined
          }
          tabs={[
            {
              key: 'basic',
              label: '基本信息',
              content: (
                <div style={{ display: 'grid', gap: 12 }}>
                  <InfoRow label="SKU" value={product.sku} />
                  <InfoRow label="品类" value={categoryInfo.label} />
                  <InfoRow label="品牌" value={product.brandName} />
                  <InfoRow label="市场" value={product.marketCode} />
                  <InfoRow label="所属门店" value={product.storeName} />
                  <InfoRow label="单位" value={product.unit} />
                  <InfoRow label="创建时间" value={product.createdAt} />
                  <InfoRow label="最近更新" value={product.updatedAt} />
                </div>
              ),
            },
            {
              key: 'pricing',
              label: '定价与库存',
              content: (
                <div style={{ display: 'grid', gap: 12 }}>
                  <InfoRow
                    label="售价"
                    value={<span style={{ fontWeight: 600 }}>¥{product.price.toFixed(2)}</span>}
                  />
                  <InfoRow
                    label="成本"
                    value={<span style={{ color: '#94a3b8' }}>¥{product.cost.toFixed(2)}</span>}
                  />
                  <InfoRow
                    label="毛利率"
                    value={
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            Number(margin) >= 50
                              ? '#4ade80'
                              : Number(margin) >= 30
                                ? '#fbbf24'
                                : '#f87171',
                        }}
                      >
                        {margin}%
                      </span>
                    }
                  />
                  <InfoRow
                    label="当前库存"
                    value={
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            product.stock === 0
                              ? '#f87171'
                              : product.stock < 50
                                ? '#fbbf24'
                                : '#94a3b8',
                        }}
                      >
                        {product.stock} {product.unit}
                      </span>
                    }
                  />
                  <InfoRow
                    label="库存状态"
                    value={
                      product.stock === 0
                        ? '缺货'
                        : product.stock < 50
                          ? '低库存预警'
                          : '库存充足'
                    }
                  />
                </div>
              ),
            },
          ]}
        />
      </DetailShell>
    </div>
  );
}

// ---- 页面入口组件 ----

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = getProductById(id);

  if (!product) {
    return <ProductNotFound id={id} />;
  }

  return <ProductDetailContent product={product} />;
}

// ---- 样式 ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: 10,
  padding: '10px 14px',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  background: 'rgba(15, 23, 42, 0.4)',
  color: '#f1f5f9',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};
