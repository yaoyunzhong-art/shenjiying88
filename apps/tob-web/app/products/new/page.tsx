/**
 * products/new/page.tsx — ToB 新建商品页面
 *
 * 使用 FormPageScaffold 构建带验证的商品创建表单
 * 支持填写基础信息、定价、库存、供应商关联等
 */
'use client';

import React from 'react';

import {
  FormPageScaffold,
  type FormPageField,
} from '@m5/ui';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_MAP } from '../../products-data';

// ---- Types ----

interface ProductFormValues {
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  brandName: string;
  marketCode: string;
  storeName: string;
  supplierName: string;
  description: string;
}

// ---- Options ----

const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((c) => ({
  label: PRODUCT_CATEGORY_MAP[c].label,
  value: c,
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

// ---- Fields ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '商品名称',
    required: true,
    placeholder: '例如：有机全麦面包',
    helper: '25字以内',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.length < 2 ? '名称至少2个字符' : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 25
            ? '名称不能超过25个字符'
            : null,
      },
    ],
  },
  {
    key: 'sku',
    label: 'SKU 编码',
    required: true,
    placeholder: '例如：TP-SKU-10001',
    helper: '建议保持唯一',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.trim().length === 0
            ? 'SKU 不能为空'
            : null,
      },
    ],
  },
  {
    key: 'category',
    label: '商品分类',
    required: true,
    type: 'select',
    options: CATEGORY_OPTIONS,
  },
  {
    key: 'price',
    label: '零售价 (元)',
    required: true,
    type: 'number',
    placeholder: '0.00',
    helper: '最终售价',
    rules: [
      {
        validate: (v) =>
          typeof v === 'number' && v <= 0 ? '零售价必须大于 0' : null,
      },
      {
        validate: (v) =>
          typeof v === 'number' && v > 999999.99
            ? '零售价不能超过 999,999.99'
            : null,
      },
    ],
  },
  {
    key: 'cost',
    label: '成本价 (元)',
    required: true,
    type: 'number',
    placeholder: '0.00',
    rules: [
      {
        validate: (v) =>
          typeof v === 'number' && v <= 0 ? '成本价必须大于 0' : null,
      },
    ],
  },
  {
    key: 'stock',
    label: '库存数量',
    required: true,
    type: 'number',
    placeholder: '0',
    helper: '整数，默认 0',
    rules: [
      {
        validate: (v) =>
          typeof v === 'number' && v < 0 ? '库存不能为负数' : null,
      },
      {
        validate: (v) =>
          typeof v === 'number' && !Number.isInteger(v)
            ? '库存必须是整数'
            : null,
      },
    ],
  },
  {
    key: 'unit',
    label: '计量单位',
    required: true,
    type: 'select',
    options: UNIT_OPTIONS,
  },
  {
    key: 'brandName',
    label: '品牌名称',
    required: true,
    placeholder: '例如：健康烘焙坊',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.trim().length === 0
            ? '品牌不能为空'
            : null,
      },
    ],
  },
  {
    key: 'marketCode',
    label: '所属市场',
    required: true,
    type: 'select',
    options: MARKET_OPTIONS,
  },
  {
    key: 'storeName',
    label: '所属门店',
    required: true,
    type: 'select',
    options: STORE_OPTIONS,
  },
  {
    key: 'supplierName',
    label: '供应商',
    required: true,
    type: 'select',
    options: SUPPLIER_OPTIONS,
  },
];

// ---- Component ----

export default function NewProductPage() {
  return (
    <FormPageScaffold
      meta={{
        title: '新建商品',
        description: '创建一个新的 ToB 商品条目',
      }}
      fields={FIELDS}
      onSubmit={async (values: Record<string, unknown>) => {
        // Simulate API call
        await new Promise((r) => setTimeout(r, 800));
        const fv = values as unknown as ProductFormValues;
        return {
          data: fv as unknown as Record<string, unknown>,
          message: `商品「${fv.name}」创建成功`,
        };
      }}
      backUrl="/products"
      submitLabel="创建商品"
    />
  );
}
