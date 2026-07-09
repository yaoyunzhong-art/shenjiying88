/**
 * 新建补货申请 — Replenishment Create Form Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🔧仓管
 * 类型: B-页面创建 (表单页)
 * 功能: 表单验证、提交、错误处理
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  FormPageScaffold,
  useToast,
  type FormPageField,
  type FormPageFieldRule,
  type FormPageSubmitResult,
} from '@m5/ui';

// ---- 类型 ----

interface ReplenishmentFormData {
  storeName: string;
  applicant: string;
  reason: string;
  items: string;
  totalEstimatedQty: string;
  contactPerson: string;
  contactPhone: string;
  remark: string;
}

// ---- 常量 ----

const STORE_OPTIONS = [
  { label: '朝阳旗舰店', value: '朝阳旗舰店' },
  { label: '海淀中关村店', value: '海淀中关村店' },
  { label: '西单大悦城店', value: '西单大悦城店' },
  { label: '三里屯太古里店', value: '三里屯太古里店' },
  { label: '望京SOHO店', value: '望京SOHO店' },
];

const APPLICANT_OPTIONS = [
  { label: '张三 (仓管)', value: '张三' },
  { label: '李四 (店长)', value: '李四' },
  { label: '王五 (运营)', value: '王五' },
];

// ---- 验证规则 ----

function requiredRule(msg: string): FormPageFieldRule {
  return {
    validate: (value: unknown) => {
      if (!value || (typeof value === 'string' && value.trim() === '')) return msg;
      return null;
    },
  };
}

const PHONE_RULE: FormPageFieldRule = {
  validate: (value: unknown) => {
    if (value && typeof value === 'string' && value.length > 0) {
      return /^1[3-9]\d{9}$/.test(value) ? null : '请输入正确的手机号';
    }
    return null;
  },
};

const ITEMS_RULE: FormPageFieldRule = {
  validate: (value: unknown) => {
    if (!value || typeof value !== 'string') return '请输入补货商品列表';
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed) || parsed.length === 0) return '补货商品列表不能为空';
    } catch {
      return '补货商品 JSON 格式有误，请检查';
    }
    return null;
  },
};

const QTY_RULE: FormPageFieldRule = {
  validate: (value: unknown) => {
    if (!value) return '请输入预估总数量';
    const val = Number(value);
    if (isNaN(val) || val < 1) return '预估数量不能小于1';
    if (val > 99999) return '预估数量不能超过99999';
    return null;
  },
};

// ---- 表单字段定义 ----

const FIELDS: FormPageField[] = [
  {
    key: 'storeName',
    label: '* 门店',
    type: 'select',
    options: STORE_OPTIONS,
    placeholder: '请选择门店',
    required: true,
    rules: [requiredRule('请选择门店')],
  },
  {
    key: 'applicant',
    label: '* 申请人',
    type: 'select',
    options: APPLICANT_OPTIONS,
    placeholder: '请选择申请人',
    required: true,
    rules: [requiredRule('请选择申请人')],
  },
  {
    key: 'reason',
    label: '* 补货原因',
    type: 'textarea',
    placeholder: '请描述补货原因，如库存预警、活动备货、季节性补货等',
    required: true,
    rules: [requiredRule('请输入补货原因')],
  },
  {
    key: 'items',
    label: '* 补货商品 (JSON格式)',
    type: 'textarea',
    placeholder: '[{"sku":"VEG-001","name":"有机蔬菜拼盘","qty":50}]',
    required: true,
    rules: [ITEMS_RULE],
  },
  {
    key: 'totalEstimatedQty',
    label: '* 预估总数量',
    type: 'number',
    placeholder: '如: 320',
    required: true,
    rules: [QTY_RULE],
  },
  {
    key: 'contactPerson',
    label: '联系人',
    type: 'text',
    placeholder: '收件人姓名',
  },
  {
    key: 'contactPhone',
    label: '联系电话',
    type: 'text',
    placeholder: '手机号码',
    rules: [PHONE_RULE],
  },
  {
    key: 'remark',
    label: '备注',
    type: 'textarea',
    placeholder: '其他需要说明的事项',
  },
];

// ---- 页面组件 ----

export default function ReplenishmentNewPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (data: Record<string, unknown>): Promise<FormPageSubmitResult<Record<string, unknown>> | null> => {
      setSubmitting(true);
      setSubmitError(null);

      // 模拟 API 提交
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // 随机失败模拟 (10%)
      if (Math.random() < 0.1) {
        setSubmitting(false);
        const errMsg = '服务器繁忙，请稍后重试';
        setSubmitError(errMsg);
        toast.error(errMsg);
        return null;
      }

      setSubmitting(false);
      toast.success('补货申请已提交，等待审批');
      return { data: data as Record<string, unknown>, message: '提交成功' };
    },
    [toast],
  );

  const handleSuccess = useCallback(
    (_result: FormPageSubmitResult<Record<string, unknown>> | null) => {
      router.push('/replenishment');
    },
    [router],
  );

  const meta = useMemo(
    () => ({
      title: '新建补货申请',
      description: '提交后等待仓管审批',
    }),
    [],
  );

  return (
    <FormPageScaffold
      meta={meta}
      fields={FIELDS}
      onSubmit={handleSubmit}
      onSuccess={handleSuccess}
      backUrl="/replenishment"
      submitLabel={submitting ? '提交中...' : '提交申请'}
    />
  );
}
