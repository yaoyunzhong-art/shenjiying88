/**
 * 新建供应商 — Supplier Create Form Page (Next.js App Router Page)
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

interface SupplierFormData {
  name: string;
  category: string;
  contactPerson: string;
  contactPhone: string;
  email: string;
  address: string;
  businessLicense: string;
  taxId: string;
  bankName: string;
  bankAccount: string;
  paymentTerms: string;
  deliveryDays: string;
  creditLimit: string;
  notes: string;
}

// ---- 常量 ----

const CATEGORY_OPTIONS = [
  { label: '护肤品', value: 'skincare' },
  { label: '彩妆', value: 'cosmetics' },
  { label: '香水', value: 'fragrance' },
  { label: '美妆工具', value: 'beauty_tools' },
  { label: '包装材料', value: 'packaging' },
  { label: '其他', value: 'other' },
];

const PAYMENT_TERMS_OPTIONS = [
  { label: '月结30天', value: 'net30' },
  { label: '月结60天', value: 'net60' },
  { label: '预付款 + 尾款', value: 'deposit_balance' },
  { label: '货到付款', value: 'cod' },
  { label: '全额预付', value: 'prepaid' },
];

// ---- 字段定义 ----

const FIELDS: FormPageField<Record<string, unknown>>[] = [
  {
    key: 'name',
    label: '供应商名称',
    required: true,
    placeholder: '例如：广州美妆供应链有限公司',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '供应商名称不能为空';
          return typeof v === 'string' && v.trim().length < 2
            ? '供应商名称至少2个字符'
            : null;
        },
      },
      {
        validate: (v) =>
          typeof v === 'string' && v.length > 100
            ? '供应商名称不超过100个字符'
            : null,
      },
    ],
  },
  {
    key: 'category',
    label: '供应品类',
    required: true,
    type: 'select',
    options: CATEGORY_OPTIONS,
    rules: [
      {
        validate: (v) => (!v || v === '' ? '请选择供应品类' : null),
      },
    ],
  },
  {
    key: 'contactPerson',
    label: '联系人',
    required: true,
    placeholder: '例如：李明',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '联系人不能为空';
          return typeof v === 'string' && v.trim().length < 2
            ? '联系人至少2个字符'
            : null;
        },
      },
    ],
  },
  {
    key: 'contactPhone',
    label: '联系手机号',
    required: true,
    placeholder: '例如：13800138001',
    helper: '用于日常业务联系',
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
    key: 'email',
    label: '联系邮箱',
    required: true,
    placeholder: '例如：contact@example.com',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '邮箱不能为空';
          return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v as string).trim())
            ? '请输入有效的邮箱地址'
            : null;
        },
      },
    ],
  },
  {
    key: 'address',
    label: '公司地址',
    required: true,
    placeholder: '例如：广州市白云区白云大道北123号',
    helper: '填写供应商注册地址',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '地址不能为空';
          return typeof v === 'string' && v.trim().length < 5
            ? '地址至少5个字符'
            : null;
        },
      },
    ],
  },
  {
    key: 'businessLicense',
    label: '营业执照号',
    required: true,
    placeholder: '统一社会信用代码',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '营业执照号不能为空';
          const license = (v as string).trim();
          return !/^[A-Z0-9]{18}$/.test(license) ? '请输入18位统一社会信用代码' : null;
        },
      },
    ],
  },
  {
    key: 'taxId',
    label: '纳税人识别号',
    required: false,
    placeholder: '如与营业执照号相同可留空',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return null;
          return !/^[A-Z0-9]{15,20}$/.test((v as string).trim())
            ? '纳税人识别号格式不正确'
            : null;
        },
      },
    ],
  },
  {
    key: 'bankName',
    label: '开户银行',
    required: true,
    placeholder: '例如：中国工商银行广州白云支行',
    rules: [
      {
        validate: (v) => (!v || v === '' ? '开户银行不能为空' : null),
      },
    ],
  },
  {
    key: 'bankAccount',
    label: '银行账号',
    required: true,
    placeholder: '例如：3602 0001 0123 4567 890',
    helper: '用于对公付款',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return '银行账号不能为空';
          const acct = (v as string).replace(/\s/g, '');
          return !/^\d{8,30}$/.test(acct) ? '请输入有效的银行账号' : null;
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
    key: 'deliveryDays',
    label: '交货周期 (天)',
    required: true,
    type: 'number',
    placeholder: '例如：7',
    helper: '从下单到到货的平均天数',
    rules: [
      {
        validate: (v) => {
          const n = Number(v);
          return Number.isNaN(n) || n <= 0 ? '交货周期必须大于0' : null;
        },
      },
      {
        validate: (v) => {
          const n = Number(v);
          return !Number.isNaN(n) && n > 365 ? '交货周期不能超过365天' : null;
        },
      },
    ],
  },
  {
    key: 'creditLimit',
    label: '授信额度 (元)',
    required: false,
    type: 'number',
    placeholder: '0.00',
    helper: '选择预付款或月结时必填',
    rules: [
      {
        validate: (v) => {
          if (!v || v === '') return null;
          const n = Number(v);
          return Number.isNaN(n) || n < 0 ? '授信额度不能为负数' : null;
        },
      },
      {
        validate: (v) => {
          if (!v || v === '') return null;
          const n = Number(v);
          return !Number.isNaN(n) && n > 99999999 ? '授信额度不能超过99,999,999' : null;
        },
      },
    ],
  },
  {
    key: 'notes',
    label: '备注',
    required: false,
    placeholder: '其他需要备案的信息',
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

export default function NewSupplierPage(): React.ReactElement {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = async (
    data: Record<string, unknown>,
  ): Promise<FormPageSubmitResult | null> => {
    // 模拟提交延迟
    await new Promise((r) => setTimeout(r, 800));

    // 模拟随机失败（用于测试错误处理）
    if (Math.random() < 0.05) {
      throw new Error('网络异常，供应商创建失败，请稍后重试');
    }

    // 生成供应商编号
    const supplierNo = `SUP-${Date.now().toString(36).toUpperCase()}`;
    toast.success(`供应商 ${data.name} (${supplierNo}) 创建成功，待审批`);
    router.push('/suppliers');
    return { data, message: `供应商 ${data.name} 创建成功` };
  };

  return (
    <FormPageScaffold
      meta={{
        title: '新建供应商',
        description:
          '录入新的供应商信息，填写基础资料、资质信息及结算条款，提交后进入审批流程。',
      }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      backUrl="/suppliers"
      submitLabel="提交审批"
      submitVariant="brand"
    />
  );
}
