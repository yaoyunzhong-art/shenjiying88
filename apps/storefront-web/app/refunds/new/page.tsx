/**
 * 退换货申请新建页 — New Refund Request Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 功能: 创建退换货申请，支持搜索订单、选择类型、填写原因、提交审批
 */
'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  PageShell,
  RadioGroup,
  Select,
  TextArea,
  FormSubmitFeedback,
  type RadioOption,
  type SelectOption,
} from '@m5/ui';
import type { RefundType } from '../refund-data';

const REFUND_TYPE_OPTIONS: RadioOption[] = [
  { value: 'refund', label: '仅退款', description: '商品未发货或已退货，仅申请退款' },
  { value: 'exchange', label: '换货', description: '商品有瑕疵或尺码/规格不符，申请换货' },
  { value: 'return', label: '退货退款', description: '已收货但需要退货并退款' },
];

const REASON_OPTIONS: SelectOption[] = [
  { value: 'defective', label: '商品破损/瑕疵' },
  { value: 'mismatch', label: '商品与描述不符' },
  { value: 'size_wrong', label: '尺码/规格不合适' },
  { value: 'duplicate', label: '重复下单' },
  { value: 'delivery_late', label: '送达超时' },
  { value: 'wrong_item', label: '发错商品' },
  { value: 'other', label: '其他原因' },
];

interface FormValues {
  orderId: string;
  type: RefundType;
  reasonCategory: string;
  reasonDetail: string;
  amount: string;
  productName: string;
}

const INITIAL_VALUES: FormValues = {
  orderId: '',
  type: 'refund',
  reasonCategory: '',
  reasonDetail: '',
  amount: '',
  productName: '',
};

function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.orderId.trim()) errors.orderId = '请选择或输入订单号';
  if (!values.reasonCategory) errors.reasonCategory = '请选择退款原因类别';
  if (!values.reasonDetail.trim()) errors.reasonDetail = '请填写退款原因描述';
  if (!values.amount.trim() || isNaN(Number(values.amount))) errors.amount = '请输入有效金额';
  if (!values.productName.trim()) errors.productName = '请填写商品名称';
  return errors;
}

export default function NewRefundRequestPage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormValues>(INITIAL_VALUES);
  const [state, setFormState] = useState<{ submitting: boolean; error?: string; success?: boolean }>({ submitting: false });

  const set = useCallback(<K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const errors = validate(formValues);
    if (Object.keys(errors).length > 0) {
      setFormState({ submitting: false, error: Object.values(errors).join('；') });
      return;
    }
    setFormState({ submitting: true });
    // 模拟提交退换货申请
    await new Promise((r) => setTimeout(r, 800));
    setFormState({ submitting: false, success: true });
  }, [formValues]);

  const handleReset = useCallback(() => {
    setFormValues(INITIAL_VALUES);
  }, []);

  return (
    <PageShell title="退换货申请" subtitle="创建退换货申请，提交后将进入审批流程">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* 订单号 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            订单号 <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <Input
            placeholder="输入订单号，例如 ORD-20260601-001"
            value={formValues.orderId}
            onChange={(e) => set('orderId', e.target.value)}
          />
        </div>

        {/* 商品名称 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            商品名称 <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <Input
            placeholder="输入涉及退换货的商品名称"
            value={formValues.productName}
            onChange={(e) => set('productName', e.target.value)}
          />
        </div>

        {/* 退换货类型 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            退换货类型 <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <RadioGroup
            options={REFUND_TYPE_OPTIONS}
            value={formValues.type}
            onChange={(v) => set('type', v as RefundType)}
            direction="vertical"
          />
        </div>

        {/* 退款金额 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            退款金额（元）<span style={{ color: '#ef4444' }}>*</span>
          </div>
          <Input
            placeholder="请输入退款金额，单位：元"
            value={formValues.amount}
            onChange={(e) => set('amount', e.target.value)}
          />
        </div>

        {/* 原因分类 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            原因分类 <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <Select
            options={REASON_OPTIONS}
            value={formValues.reasonCategory}
            onChange={(v) => set('reasonCategory', v)}
            placeholder="请选择退款原因"
          />
        </div>

        {/* 原因描述 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
            原因描述 <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <TextArea
            placeholder="请详细描述退换货原因，包括问题发现时间、具体情况等"
            value={formValues.reasonDetail}
            onChange={(e) => set('reasonDetail', e.target.value)}
            rows={4}
            resize="vertical"
          />
        </div>

        {/* 提交反馈 */}
        <FormSubmitFeedback
          submitting={state.submitting}
          error={state.error}
          success={state.success ? '退换货申请已提交，请等待审批' : undefined}
          onDismissSuccess={() => setFormState({ submitting: false })}
          onDismissError={() => setFormState({ submitting: false, error: undefined })}
        />

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button variant="secondary" onClick={() => router.back()}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={state.submitting}>
            {state.submitting ? '提交中…' : '提交申请'}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
