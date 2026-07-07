/**
 * 新建库存商品 — New Stock Item Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 表单验证、提交、错误处理
 */
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import {
  FormPageScaffold,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

interface NewStockFormData {
  sku: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  price: number;
  costPrice: number;
  supplier: string;
  location: string;
  description: string;
}

// ---- 常量 ----

const CATEGORIES = [
  { label: '护肤品', value: '护肤品' },
  { label: '彩妆', value: '彩妆' },
  { label: '香水', value: '香水' },
  { label: '身体护理', value: '身体护理' },
  { label: '头发护理', value: '头发护理' },
  { label: '工具配件', value: '工具配件' },
  { label: '其他', value: '其他' },
];

const UNIT_OPTIONS = [
  { label: '瓶', value: '瓶' },
  { label: '支', value: '支' },
  { label: '盒', value: '盒' },
  { label: '袋', value: '袋' },
  { label: '套', value: '套' },
  { label: '个', value: '个' },
  { label: '罐', value: '罐' },
  { label: '片', value: '片' },
];

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'sku',
    label: 'SKU编码',
    required: true,
    placeholder: '例如：SKU-1001',
    helper: '建议使用统一编码规则，方便后续管理',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.trim().length < 2
            ? 'SKU编码至少2个字符'
            : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 30
            ? 'SKU编码不超过30个字符'
            : null,
      },
    ],
  },
  {
    key: 'name',
    label: '商品名称',
    required: true,
    placeholder: '例如：玫瑰精华爽肤水',
    helper: '建议控制在30字以内',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.trim().length < 2
            ? '商品名称至少2个字符'
            : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 60
            ? '商品名称不超过60个字符'
            : null,
      },
    ],
  },
  {
    key: 'category',
    label: '商品分类',
    required: true,
    type: 'select',
    options: CATEGORIES,
    rules: [
      {
        validate: (v) =>
          !v || v === ''
            ? '请选择一个商品分类'
            : null,
      },
    ],
  },
  {
    key: 'quantity',
    label: '库存数量',
    required: true,
    type: 'number',
    placeholder: '0',
    helper: '期初库存数量，后续可通过入库单调整',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n < 0
            ? '库存数量不能为负数'
            : null;
        },
      },
      {
        validate: (v) => {
          const n = Number(v);
          return !Number.isNaN(n) && n > 999999
            ? '库存数量不能超过999,999'
            : null;
        },
      },
    ],
  },
  {
    key: 'minThreshold',
    label: '最低库存预警',
    required: true,
    type: 'number',
    placeholder: '10',
    helper: '库存低于此数量时触发预警',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n < 0
            ? '最低库存不能为负数'
            : null;
        },
      },
    ],
  },
  {
    key: 'maxThreshold',
    label: '最高库存限制',
    required: true,
    type: 'number',
    placeholder: '500',
    helper: '库存超过此数量时标记为过剩',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n < 1
            ? '最高库存至少为1'
            : null;
        },
      },
    ],
  },
  {
    key: 'unit',
    label: '库存单位',
    required: true,
    type: 'select',
    options: UNIT_OPTIONS,
  },
  {
    key: 'price',
    label: '售价',
    required: true,
    type: 'number',
    placeholder: '0.00',
    helper: '建议零售价',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n <= 0
            ? '售价必须大于0'
            : null;
        },
      },
      {
        validate: (v) => {
          const n = Number(v);
          return !Number.isNaN(n) && n > 999999
            ? '售价不能超过999,999'
            : null;
        },
      },
    ],
  },
  {
    key: 'costPrice',
    label: '成本价',
    required: true,
    type: 'number',
    placeholder: '0.00',
    helper: '进货成本，用于毛利计算。售价必须高于成本价',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n <= 0
            ? '成本价必须大于0'
            : null;
        },
      },
    ],
  },
  {
    key: 'supplier',
    label: '供应商',
    required: false,
    placeholder: '例如：广州美妆供应链有限公司',
    rules: [
      {
        validate: (v) =>
          v && typeof v === 'string' && v.length > 100
            ? '供应商名称不超过100个字符'
            : null,
      },
    ],
  },
  {
    key: 'location',
    label: '货架位置',
    required: false,
    placeholder: '例如：A区-03货架-第2层',
    helper: '填写仓库/门店中的具体存放位置',
    rules: [
      {
        validate: (v) =>
          v && typeof v === 'string' && v.length > 100
            ? '货架位置不超过100个字符'
            : null,
      },
    ],
  },
  {
    key: 'description',
    label: '商品描述',
    required: false,
    placeholder: '商品描述、成分、注意事项等',
  },
];

// ---- 组件 ----

export default function NewStockItemPage(): React.ReactElement {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (
    data: Record<string, unknown>,
  ): Promise<FormPageSubmitResult | null> => {
    // 模拟提交延迟
    await new Promise((r) => setTimeout(r, 600));
    // 使用 toast 通知，然后返回数据
    toast.success('库存商品创建成功');
    router.push('/stock');
    return null;
  };

  return (
    <FormPageScaffold
      meta={{
        title: '新建库存商品',
        description: '录入新的库存商品信息，包括SKU、名称、数量和价格等。',
      }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      backUrl="/stock"
      submitLabel="创建商品"
      submitVariant="brand"
    />
  );
}
