/**
 * 编辑供应商 — Supplier Edit Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 表单预填充、验证、提交、错误处理、状态流转（暂停/启用/终止）
 */
'use client';

import React, { useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  FormPageScaffold,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

type SupplierStatus = 'active' | 'paused' | 'terminated' | 'pending';

interface SupplierEditFormData {
  name: string;
  code: string;
  category: string;
  status: SupplierStatus;
  contactPerson: string;
  contactPhone: string;
  email: string;
  address: string;
  paymentTerms: string;
  bankAccount: string;
  bankName: string;
  taxId: string;
  notes: string;
}

// ---- Mock 数据（与详情页保持一致）- ----

interface MockSupplierRaw {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: string;
  status: SupplierStatus;
  totalProducts: number;
  totalAmount: number;
  cooperationStart: string;
  updatedAt: string;
  address: string;
  description: string;
  orderCount: number;
  returnRate: string;
}

const MOCK_SUPPLIERS: Record<string, MockSupplierRaw> = {
  '1': {
    id: '1', code: 'SUP-001', name: '广州美妆供应链有限公司',
    contactPerson: '李明', phone: '13800138001', email: 'liming@gzbeauty.com',
    category: '护肤品', status: 'active', totalProducts: 48, totalAmount: 1268000,
    cooperationStart: '2024-01-15', updatedAt: '2026-06-25 10:32',
    address: '广州市白云区美妆产业园区A栋',
    description: '专注护肤品原料及成品供应链服务，拥有GMP标准化生产基地。',
    orderCount: 156, returnRate: '2.3%',
  },
  '2': {
    id: '2', code: 'SUP-002', name: '上海日化贸易有限公司',
    contactPerson: '王芳', phone: '13900139002', email: 'wangfang@shdaily.com',
    category: '彩妆', status: 'active', totalProducts: 36, totalAmount: 892000,
    cooperationStart: '2024-03-20', updatedAt: '2026-06-25 09:15',
    address: '上海市浦东新区外高桥保税区B座',
    description: '主营进口彩妆及护肤品牌代理。',
    orderCount: 98, returnRate: '1.8%',
  },
  '5': {
    id: '5', code: 'SUP-005', name: '韩国美妆株式会社上海代表处',
    contactPerson: '朴俊昊', phone: '13500135005', email: 'park@korea-beauty.com',
    category: '彩妆', status: 'pending', totalProducts: 0, totalAmount: 0,
    cooperationStart: '-', updatedAt: '2026-06-26 09:00',
    address: '上海市长宁区虹桥开发区',
    description: '拟引进韩国最新彩妆产品线。',
    orderCount: 0, returnRate: '-',
  },
};

// ---- 常量 ----

const CATEGORY_OPTIONS = [
  { label: '护肤品', value: '护肤品' },
  { label: '彩妆', value: '彩妆' },
  { label: '香水', value: '香水' },
  { label: '包装材料', value: '包装材料' },
  { label: '美妆工具', value: '美妆工具' },
  { label: '仪器设备', value: '仪器设备' },
  { label: '其他', value: 'other' },
];

const PAYMENT_TERMS_OPTIONS = [
  { label: '月结30天', value: 'net30' },
  { label: '月结60天', value: 'net60' },
  { label: '预付款 + 尾款', value: 'deposit_balance' },
  { label: '货到付款', value: 'cod' },
  { label: '全额预付', value: 'prepaid' },
];

const STATUS_OPTIONS = [
  { label: '合作中', value: 'active' as const },
  { label: '暂停合作', value: 'paused' as const },
  { label: '终止合作', value: 'terminated' as const },
  { label: '审批中', value: 'pending' as const },
];

// ---- 字段工厂 ---

function buildFields(supplier: MockSupplierRaw): FormPageField<Record<string, unknown>>[] {
  return [
    {
      key: 'name',
      label: '供应商名称',
      required: true,
      type: 'text',
      placeholder: '请输入供应商全称（营业执照名称）',
      initialValue: supplier.name,
      rules: [
        { validate: (v) => !v || String(v).trim() === '' ? '供应商名称不能为空' : null },
        { validate: (v) => v && String(v).length > 100 ? '供应商名称不能超过100个字符' : null },
      ],
    },
    {
      key: 'code',
      label: '供应商编码',
      required: true,
      type: 'text',
      placeholder: '例如 SUP-001',
      initialValue: supplier.code,
      rules: [
        { validate: (v) => v && !/^[A-Za-z0-9-]+$/.test(String(v)) ? '编码只能包含字母、数字和连字符' : null },
      ],
    },
    {
      key: 'category',
      label: '供应品类',
      required: true,
      type: 'select',
      options: CATEGORY_OPTIONS,
      initialValue: supplier.category,
      rules: [{ validate: (v) => !v || v === '' ? '请选择供应品类' : null }],
    },
    {
      key: 'status',
      label: '合作状态',
      required: true,
      type: 'select',
      options: STATUS_OPTIONS,
      initialValue: supplier.status,
      rules: [{ validate: (v) => !v || v === '' ? '请选择合作状态' : null }],
      helper: '暂停合作后不会影响已有订单，但无法新建采购单。终止合作不可逆。',
    },
    {
      key: 'contactPerson',
      label: '联系人',
      required: true,
      type: 'text',
      placeholder: '请输入联系人姓名',
      initialValue: supplier.contactPerson,
      rules: [{ validate: (v) => !v || String(v).trim() === '' ? '联系人不能为空' : null }],
    },
    {
      key: 'contactPhone',
      label: '联系电话',
      required: true,
      type: 'text',
      placeholder: '请输入手机号',
      initialValue: supplier.phone,
      rules: [
        { validate: (v) => !v || String(v).trim() === '' ? '联系电话不能为空' : null },
        { validate: (v) => v && !/^1[3-9]\d{9}$/.test(String(v)) ? '请输入有效的11位手机号' : null },
      ],
    },
    {
      key: 'email',
      label: '邮箱',
      required: true,
      type: 'text',
      placeholder: '请输入邮箱地址',
      initialValue: supplier.email,
      rules: [
        { validate: (v) => !v || String(v).trim() === '' ? '邮箱不能为空' : null },
        { validate: (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) ? '请输入有效的邮箱地址' : null },
      ],
    },
    {
      key: 'address',
      label: '供货地址',
      required: true,
      type: 'text',
      placeholder: '请输入详细地址',
      initialValue: supplier.address,
      rules: [{ validate: (v) => !v || String(v).trim() === '' ? '供货地址不能为空' : null }],
    },
    {
      key: 'paymentTerms',
      label: '结算方式',
      required: true,
      type: 'select',
      options: PAYMENT_TERMS_OPTIONS,
      initialValue: 'net30',
      rules: [{ validate: (v) => !v || v === '' ? '请选择结算方式' : null }],
    },
    {
      key: 'bankAccount',
      label: '银行账号',
      type: 'text',
      placeholder: '可选',
      initialValue: '',
      rules: [{ validate: (v) => v && !/^\d{8,30}$/.test(String(v)) ? '银行账号应为8~30位数字' : null }],
    },
    {
      key: 'bankName',
      label: '开户行',
      type: 'text',
      placeholder: '可选',
      initialValue: '',
    },
    {
      key: 'taxId',
      label: '纳税人识别号',
      type: 'text',
      placeholder: '可选，15~20位数字或字母',
      initialValue: '',
      rules: [{ validate: (v) => v && !/^[A-Za-z0-9]{15,20}$/.test(String(v)) ? '纳税人识别号格式不正确' : null }],
    },
    {
      key: 'notes',
      label: '备注',
      type: 'textarea',
      placeholder: '其他补充信息（可选）',
      initialValue: supplier.description || '',
      rules: [{ validate: (v) => v && String(v).length > 500 ? '备注不能超过500个字符' : null }],
    },
  ];
}

// ---- 组件 ----

export default function EditSupplierPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const id = params?.id as string;

  const supplier = useMemo(() => MOCK_SUPPLIERS[id], [id]);

  const handleDelete = useCallback(async () => {
    await new Promise((r) => setTimeout(r, 500));
    toast.success('供应商已删除');
    router.push('/suppliers');
  }, [router, toast]);

  const handleSubmit = useCallback(
    async (data: Record<string, unknown>): Promise<FormPageSubmitResult | null> => {
      // 模拟 API 延迟
      await new Promise((r) => setTimeout(r, 800));

      const name = String(data.name ?? '').trim();
      const newStatus = String(data.status ?? '');

      // 模拟冲突检测
      if (name === '广州美妆供应链有限公司' && id !== '1') {
        throw new Error('该供应商名称已被占用，请检查后重试');
      }

      // 检测非法状态流转：终止不可逆
      if (supplier?.status === 'terminated' && newStatus !== 'terminated') {
        throw new Error('已终止合作的供应商无法变更状态');
      }

      // 模拟随机网络错误
      if (name.includes('网络错误')) {
        throw new Error('网络请求超时，请稍后重试');
      }

      toast.success(`供应商“${name}”信息更新成功`);

      // 延迟跳转以确保 Toast 可见
      setTimeout(() => router.push(`/suppliers/${id}`), 1200);

      return { data, message: '供应商信息更新成功' };
    },
    [id, supplier, router, toast],
  );

  // 编辑页面首次加载时如果无数据，显示空状态
  if (!supplier) {
    return (
      <div style={{ maxWidth: 1000, margin: '40px auto', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#374151', marginBottom: 8 }}>供应商未找到</h1>
        <p style={{ color: '#9ca3af', marginBottom: 20 }}>未找到 ID 为 {id} 的供应商，无法编辑</p>
        <button
          onClick={() => router.push('/suppliers')}
          style={{
            padding: '8px 20px', borderRadius: 6, border: 'none',
            backgroundColor: '#2563eb', color: '#fff', fontWeight: 600,
            fontSize: 14, cursor: 'pointer',
          }}
        >
          ← 返回供应商列表
        </button>
      </div>
    );
  }

  const fields = buildFields(supplier);

  return (
    <FormPageScaffold
      meta={{
        title: `编辑供应商 - ${supplier.name}`,
        description: `编码: ${supplier.code} | 合作开始: ${supplier.cooperationStart} | 最后更新: ${supplier.updatedAt}`,
        deleteAction: {
          label: '删除供应商',
          onDelete: handleDelete,
          confirmText: `确定要删除供应商"${supplier.name}"吗？此操作不可恢复。`,
        },
      }}
      fields={fields}
      onSubmit={handleSubmit}
      backUrl={`/suppliers/${id}`}
      submitLabel="保存修改"
      submitVariant="brand"
    />
  );
}
