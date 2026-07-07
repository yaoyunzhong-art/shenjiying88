/**
 * products/[id]/edit/page.tsx — ToB 商品编辑表单页
 *
 * B型任务：表单页（含验证/提交/错误处理）
 * 支持编辑商品名称、定价、库存等核心字段。
 */
'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useState } from 'react';

import {
  FormPageScaffold,
  validateFormFields,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

import {
  MOCK_PRODUCTS,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_MAP,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_MAP,
  type ProductItem,
  type ProductStatus,
  type ProductCategory,
} from '../../../products-data';

// ---- 选项数据 ----

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((c) => ({
  label: PRODUCT_CATEGORY_MAP[c as ProductCategory].label,
  value: c,
}));

const STATUS_OPTIONS = PRODUCT_STATUSES.map((s) => ({
  label: PRODUCT_STATUS_MAP[s as ProductStatus].label,
  value: s,
}));

const STORE_OPTIONS = [
  { label: '朝阳旗舰店', value: '朝阳旗舰店' },
  { label: '海淀形象店', value: '海淀形象店' },
  { label: '浦东新区店', value: '浦东新区店' },
  { label: '广州天河店', value: '广州天河店' },
  { label: '成都春熙店', value: '成都春熙店' },
];

const SUPPLIER_OPTIONS = [
  { label: '京粮供应', value: '京粮供应' },
  { label: '沪上食品', value: '沪上食品' },
  { label: '粤海贸易', value: '粤海贸易' },
  { label: '川渝供应链', value: '川渝供应链' },
  { label: '浙商商贸', value: '浙商商贸' },
];

const MARKET_OPTIONS = [
  { label: '北京 (CN-BJ)', value: 'CN-BJ' },
  { label: '上海 (CN-SH)', value: 'CN-SH' },
  { label: '广东 (CN-GD)', value: 'CN-GD' },
  { label: '四川 (CN-SC)', value: 'CN-SC' },
  { label: '浙江 (CN-ZJ)', value: 'CN-ZJ' },
];

const UNIT_OPTIONS = [
  { label: '个', value: '个' },
  { label: '件', value: '件' },
  { label: '箱', value: '箱' },
  { label: '瓶', value: '瓶' },
  { label: '袋', value: '袋' },
  { label: 'kg', value: 'kg' },
  { label: 'L', value: 'L' },
];

// ---- 表单类型 ----

interface ProductEditForm {
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  status: string;
  brandName: string;
  marketCode: string;
  storeName: string;
  supplierName: string;
  description: string;
}

/** 从 ProductItem 提取表单初始值 */
function buildInitial(product: ProductItem): ProductEditForm {
  return {
    name: product.name,
    sku: product.sku,
    category: product.category,
    price: product.price,
    cost: product.cost,
    stock: product.stock,
    unit: product.unit,
    status: product.status,
    brandName: product.brandName,
    marketCode: product.marketCode,
    storeName: product.storeName,
    supplierName: product.supplierName,
    description: '',
  };
}

// ---- 表单字段配置 ----

function buildFields(_initial: ProductEditForm): FormPageField<Record<string, unknown>>[] {
  return [
    {
      key: 'name',
      label: '商品名称',
      required: true,
      placeholder: '请输入商品名称',
      initialValue: _initial.name,
      helper: '25 字以内',
      rules: [
        { validate: (v) => (typeof v === 'string' && v.length < 2 ? '名称至少 2 个字符' : null) },
        { validate: (v) => (typeof v === 'string' && v.length > 25 ? '名称最多 25 个字符' : null) },
      ],
    },
    {
      key: 'sku',
      label: 'SKU 编码',
      required: true,
      placeholder: 'SKU 不可修改',
      initialValue: _initial.sku,
      disabled: true,
      helper: '创建后不可更改',
    },
    {
      key: 'category',
      label: '商品分类',
      required: true,
      type: 'select',
      initialValue: _initial.category,
      options: CATEGORY_OPTIONS,
    },
    {
      key: 'price',
      label: '零售价 (元)',
      required: true,
      type: 'number',
      initialValue: _initial.price,
      placeholder: '0.00',
      rules: [
        { validate: (v) => (typeof v === 'number' && v <= 0 ? '零售价必须大于 0' : null) },
        { validate: (v) => (typeof v === 'number' && v > 999999.99 ? '零售价不能超过 999,999.99' : null) },
      ],
    },
    {
      key: 'cost',
      label: '成本价 (元)',
      required: true,
      type: 'number',
      initialValue: _initial.cost,
      placeholder: '0.00',
      rules: [
        { validate: (v) => (typeof v === 'number' && v <= 0 ? '成本价必须大于 0' : null) },
        { validate: (v) => (typeof v === 'number' && !Number.isFinite(v) ? '请输入有效的成本价' : null) },
      ],
    },
    {
      key: 'stock',
      label: '库存数量',
      required: true,
      type: 'number',
      initialValue: _initial.stock,
      placeholder: '0',
      helper: '整数，最小 0',
      rules: [
        { validate: (v) => (typeof v === 'number' && v < 0 ? '库存不能为负数' : null) },
        { validate: (v) => (typeof v === 'number' && !Number.isInteger(v) ? '库存必须是整数' : null) },
      ],
    },
    {
      key: 'unit',
      label: '计量单位',
      required: true,
      type: 'select',
      initialValue: _initial.unit,
      options: UNIT_OPTIONS,
    },
    {
      key: 'status',
      label: '状态',
      required: true,
      type: 'select',
      initialValue: _initial.status,
      options: STATUS_OPTIONS,
    },
    {
      key: 'brandName',
      label: '品牌名称',
      required: true,
      initialValue: _initial.brandName,
      placeholder: '例如：健康烘焙坊',
      rules: [{ validate: (v) => (typeof v === 'string' && v.trim().length === 0 ? '品牌不能为空' : null) }],
    },
    {
      key: 'marketCode',
      label: '所属市场',
      required: true,
      type: 'select',
      initialValue: _initial.marketCode,
      options: MARKET_OPTIONS,
    },
    {
      key: 'storeName',
      label: '所属门店',
      required: true,
      type: 'select',
      initialValue: _initial.storeName,
      options: STORE_OPTIONS,
    },
    {
      key: 'supplierName',
      label: '供应商',
      required: true,
      type: 'select',
      initialValue: _initial.supplierName,
      options: SUPPLIER_OPTIONS,
    },
  ];
}

/** 根据 ID 查找商品 */
function findProduct(id: string): ProductItem | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

// ---- 页面组件 ----

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const [product, setProduct] = useState<ProductItem | undefined>(() =>
    findProduct(params.id),
  );
  const [submitting, setSubmitting] = useState(false);

  const initial = useMemo(() => (product ? buildInitial(product) : undefined), [product]);

  const fields = useMemo(() => (initial ? buildFields(initial) : []), [initial]);

  const handleSubmit = useCallback(
    async (formValues: Record<string, unknown>): Promise<FormPageSubmitResult<Record<string, unknown>> | null> => {
      const errors = validateFormFields(fields, formValues);
      if (Object.keys(errors).length > 0) {
        toast.error('请修正表单中的错误');
        return null;
      }

      setSubmitting(true);
      try {
        // Simulate API call
        await new Promise((r) => setTimeout(r, 800));

        // Update local state
        const fv = formValues as unknown as ProductEditForm;
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                name: fv.name,
                category: fv.category as ProductCategory,
                price: fv.price,
                cost: fv.cost,
                stock: fv.stock,
                unit: fv.unit,
                status: fv.status as ProductStatus,
                brandName: fv.brandName,
                marketCode: fv.marketCode,
                storeName: fv.storeName,
                supplierName: fv.supplierName,
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : prev,
        );

        return {
          data: formValues,
          message: `商品「${fv.name}」更新成功`,
        };
      } catch (err) {
        return {
          data: formValues,
          message: `更新失败：${err instanceof Error ? err.message : '未知错误'}`,
          error: true,
        };
      } finally {
        setSubmitting(false);
      }
    },
    [fields, toast],
  );

  const handleSuccess = useCallback(
    (result: FormPageSubmitResult<Record<string, unknown>>) => {
      toast.success(result.message ?? '更新成功', { durationMs: 3000 });
      setTimeout(() => router.push(`/products/${params.id}`), 1200);
    },
    [router, params.id, toast],
  );

  // 商品不存在
  if (!product || !initial) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 48, color: '#cbd5e1' }}>
        <div style={{ textAlign: 'center', padding: 64 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>商品未找到</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
            未找到 ID 为 <code>{params.id}</code> 的商品，可能已被删除。
          </p>
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
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <FormPageScaffold
        meta={{
          title: '编辑商品',
          description: `正在编辑：${product.name}（SKU: ${product.sku}）`,
        }}
        fields={fields}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        submitLabel={submitting ? '保存中...' : '保存修改'}
        backUrl={`/products/${params.id}`}
        disabled={submitting}
      />
    </main>
  );
}
