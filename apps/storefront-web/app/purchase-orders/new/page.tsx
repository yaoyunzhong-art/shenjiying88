/**
 * 新建采购单 — Purchase Order Create Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 表单验证、提交、错误处理
 */
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormPageScaffold,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

interface PurchaseOrderFormData {
  supplier: string;
  orderDate: string;
  expectedDelivery: string;
  items: string; // JSON string of order items
  totalAmount: string;
  paymentTerms: string;
  paymentMethod: string;
  shippingAddress: string;
  contactPerson: string;
  contactPhone: string;
  notes: string;
}

// ---- 常量 ----

const SUPPLIER_OPTIONS = [
  { label: '广州美妆供应链有限公司', value: '广州美妆供应链有限公司' },
  { label: '上海日化贸易有限公司', value: '上海日化贸易有限公司' },
  { label: '杭州香氛科技有限公司', value: '杭州香氛科技有限公司' },
  { label: '深圳包材创新有限公司', value: '深圳包材创新有限公司' },
  { label: '广州妆具工贸有限公司', value: '广州妆具工贸有限公司' },
];

const PAYMENT_TERMS_OPTIONS = [
  { label: '月结30天', value: 'net30' },
  { label: '月结60天', value: 'net60' },
  { label: '预付款 + 尾款', value: 'deposit_balance' },
  { label: '货到付款', value: 'cod' },
  { label: '全额预付', value: 'prepaid' },
];

const PAYMENT_METHOD_OPTIONS = [
  { label: '银行转账', value: 'bank_transfer' },
  { label: '微信支付', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '支票', value: 'check' },
];

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'supplier',
    label: '供应商',
    required: true,
    type: 'select',
    options: SUPPLIER_OPTIONS,
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择一个供应商' : null),
      },
    ],
  },
  {
    key: 'orderDate',
    label: '采购日期',
    required: true,
    type: 'date',
    placeholder: '请选择采购日期',
    initialValue: new Date().toISOString().slice(0, 10),
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '采购日期不能为空';
          const d = new Date(v as string);
          return isNaN(d.getTime()) ? '请输入有效日期' : null;
        },
      },
    ],
  },
  {
    key: 'expectedDelivery',
    label: '预计到货日期',
    required: true,
    type: 'date',
    placeholder: '请预计到货日期',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '预计到货日期不能为空';
          const d = new Date(v as string);
          return isNaN(d.getTime()) ? '请输入有效日期' : null;
        },
      },
      {
        validate: (v) => {
          if (!v || v === '') return null;
          const delivery = new Date(v as string);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return delivery < today ? '到货日期不能早于今天' : null;
        },
      },
    ],
  },
  {
    key: 'totalAmount',
    label: '预估总金额 (元)',
    required: true,
    type: 'number',
    placeholder: '0.00',
    helper: '填写本次采购预估总金额',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n <= 0 ? '总金额必须大于0' : null;
        },
      },
      {
        validate: (v) => {
          const n = Number(v);
          return !Number.isNaN(n) && n > 999999999 ? '总金额不能超过999,999,999' : null;
        },
      },
    ],
  },
  {
    key: 'paymentTerms',
    label: '付款条件',
    required: true,
    type: 'select',
    options: PAYMENT_TERMS_OPTIONS,
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择付款条件' : null),
      },
    ],
  },
  {
    key: 'paymentMethod',
    label: '付款方式',
    required: true,
    type: 'select',
    options: PAYMENT_METHOD_OPTIONS,
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择付款方式' : null),
      },
    ],
  },
  {
    key: 'shippingAddress',
    label: '收货地址',
    required: true,
    placeholder: '例如：广州市天河区体育西路123号旗舰店仓库',
    helper: '请填写详细的收货地址，包括城市、街道、门牌号',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.trim().length < 5
            ? '收货地址至少5个字符'
            : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 200
            ? '收货地址不超过200个字符'
            : null,
      },
    ],
  },
  {
    key: 'contactPerson',
    label: '收货联系人',
    required: true,
    placeholder: '例如：张三',
    rules: [
      {
        validate: (v) =>
          typeof v === 'string' && v.trim().length < 2
            ? '联系人至少2个字符'
            : null,
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 30
            ? '联系人不超过30个字符'
            : null,
      },
    ],
  },
  {
    key: 'contactPhone',
    label: '联系手机号',
    required: true,
    placeholder: '例如：13800138001',
    helper: '用于物流联系，请填写有效的手机号',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '手机号不能为空';
          const phone = (v as string).trim();
          return !/^1[3-9]\d{9}$/.test(phone) ? '请输入有效的11位手机号' : null;
        },
      },
    ],
  },
  {
    key: 'items',
    label: '采购清单',
    required: false,
    placeholder: '可选：简要描述采购商品清单，用于备注',
    helper: '正式采购清单可在创建后通过编辑功能完善',
    rules: [
      {
        validate: (v) =>
          v && typeof v === 'string' && v.length > 500
            ? '采购清单描述不超过500个字符'
            : null,
      },
    ],
  },
  {
    key: 'notes',
    label: '备注',
    required: false,
    placeholder: '其他需要说明的信息',
    rules: [
      {
        validate: (v) =>
          v && typeof v === 'string' && v.length > 1000
            ? '备注不超过1000个字符'
            : null,
      },
    ],
  },
];

// ---- 组件 ----

export default function NewPurchaseOrderPage(): React.ReactElement {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (
    data: Record<string, unknown>,
  ): Promise<FormPageSubmitResult | null> => {
    // 模拟提价延迟
    await new Promise((r) => setTimeout(r, 800));

    // 模拟随机失败（用于测试错误处理）
    if (Math.random() < 0.1) {
      throw new Error('网络异常，采购单暂未创建，请稍后重试');
    }

    // 生成采购单号
    const orderNo = `PO-${Date.now().toString(36).toUpperCase()}`;
    toast.success(`采购单 ${orderNo} 创建成功`);
    router.push('/purchase-orders');
    return { data, message: `采购单 ${orderNo} 创建成功` };
  };

  // 提供初始表单值
  const initialValues = useMemo(
    () => ({
      orderDate: new Date().toISOString().slice(0, 10),
    }),
    [],
  );

  return (
    <FormPageScaffold
      meta={{
        title: '新建采购单',
        description: '创建新的采购订单，填写供应商信息、采购商品及交付细节。',
      }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      backUrl="/purchase-orders"
      submitLabel="提交采购单"
      submitVariant="brand"
    />
  );
}
