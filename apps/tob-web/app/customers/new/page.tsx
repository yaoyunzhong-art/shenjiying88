/**
 * customers/new/page.tsx — 新建企业客户表单页 (ToB 客户管理)
 *
 * B型任务：表单页（含验证/提交/错误处理）
 */
'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormPageScaffold,
  validateFormFields,
  useToast,
  type FormPageField,
  type FormPageSubmitResult,
} from '@m5/ui';

import {
  CUSTOMER_STATUSES,
  CUSTOMER_TIERS,
  CUSTOMER_INDUSTRIES,
  CUSTOMER_STATUS_MAP,
  CUSTOMER_TIER_MAP,
  CUSTOMER_INDUSTRY_MAP,
  type CustomerStatus,
  type CustomerTier,
  type CustomerIndustry,
  type CustomerItem,
  MOCK_CUSTOMERS,
} from '../../customers-data';

const INDUSTRIES_LIST = CUSTOMER_INDUSTRIES.map((k: string) => ({
  value: k,
  label: CUSTOMER_INDUSTRY_MAP[k as CustomerIndustry],
}));
const TIERS_LIST = CUSTOMER_TIERS.map((k: string) => ({
  value: k,
  label: CUSTOMER_TIER_MAP[k as CustomerTier].label,
}));
const STATUSES_LIST = CUSTOMER_STATUSES.map((k: string) => ({
  value: k,
  label: CUSTOMER_STATUS_MAP[k as CustomerStatus].label,
}));

const REGION_OPTIONS = [
  { value: '华北', label: '华北' },
  { value: '华东', label: '华东' },
  { value: '华南', label: '华南' },
  { value: '华中', label: '华中' },
  { value: '西南', label: '西南' },
  { value: '西北', label: '西北' },
  { value: '东南', label: '东南' },
  { value: '东北', label: '东北' },
];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NewCustomerForm extends Record<string, string> {
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  industry: string;
  tier: string;
  status: string;
  region: string;
  city: string;
}

const FIELDS: FormPageField<NewCustomerForm>[] = [
  {
    key: 'companyName',
    label: '公司名称',
    type: 'text',
    required: true,
    placeholder: '请输入公司全称',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '公司名称至少2个字符' : null) },
      { validate: (v) => (typeof v === 'string' && v.length > 80 ? '公司名称最多80个字符' : null) },
    ],
  },
  {
    key: 'contactName',
    label: '联系人姓名',
    type: 'text',
    required: true,
    placeholder: '请输入联系人姓名',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length < 2 ? '联系人姓名至少2个字符' : null) },
    ],
  },
  {
    key: 'contactPhone',
    label: '联系人手机号',
    type: 'text',
    required: true,
    placeholder: '请输入11位手机号',
    rules: [
      { validate: (v) => (typeof v === 'string' && !/^1\d{10}$/.test(v) ? '请输入有效的11位手机号' : null) },
    ],
  },
  {
    key: 'contactEmail',
    label: '邮箱',
    type: 'text',
    required: false,
    placeholder: '请输入联系邮箱',
    rules: [
      { validate: (v) => (typeof v === 'string' && v.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '请输入有效的邮箱地址' : null) },
    ],
  },
  {
    key: 'industry',
    label: '所属行业',
    type: 'select',
    required: true,
    options: INDUSTRIES_LIST,
  },
  {
    key: 'tier',
    label: '客户等级',
    type: 'select',
    required: true,
    options: TIERS_LIST,
  },
  {
    key: 'status',
    label: '初始状态',
    type: 'select',
    required: true,
    initialValue: 'pending',
    options: STATUSES_LIST,
  },
  {
    key: 'region',
    label: '所属区域',
    type: 'select',
    required: true,
    options: REGION_OPTIONS,
  },
  {
    key: 'city',
    label: '所在城市',
    type: 'text',
    required: true,
    placeholder: '请填写客户所在城市',
  },
];

function generateId(): string {
  const n = MOCK_CUSTOMERS.length + 1;
  return `c-${String(n).padStart(3, '0')}`;
}

export default function NewCustomerPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (formValues: NewCustomerForm): Promise<FormPageSubmitResult<NewCustomerForm> | null> => {
      const errors = validateFormFields(FIELDS, formValues);
      if (Object.keys(errors).length > 0) {
        return null;
      }

      setSubmitting(true);
      try {
        await new Promise((r) => setTimeout(r, 800));
        return {
          data: formValues,
          message: '客户创建成功',
        };
      } catch {
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  const handleSuccess = useCallback(
    (_result: FormPageSubmitResult<NewCustomerForm>) => {
      toast.success('客户创建成功', { durationMs: 3000 });
      setTimeout(() => router.push('/customers'), 1000);
    },
    [router, toast],
  );

  return (
    <FormPageScaffold<NewCustomerForm>
      meta={{
        title: '新建企业客户',
        description: '添加新的企业客户信息，提交后自动跳转客户列表',
      }}
      fields={FIELDS}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      submitLabel={submitting ? '提交中...' : '创建客户'}
      backUrl="/customers"
      disabled={submitting}
    />
  );
}
