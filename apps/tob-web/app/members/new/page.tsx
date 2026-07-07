'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  PageShell,
  FormField,
  Input,
  Select,
  SubmitButton,
  FormSubmitFeedback,
  useToast,
} from '@m5/ui';

// ---- 类型 ----

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'standard';

const TIER_OPTIONS: { label: string; value: MembershipTier }[] = [
  { label: '钻石会员', value: 'diamond' },
  { label: '黄金会员', value: 'gold' },
  { label: '银卡会员', value: 'silver' },
  { label: '铜卡会员', value: 'bronze' },
  { label: '标准会员', value: 'standard' },
];

interface FormData {
  name: string;
  phone: string;
  email: string;
  tier: MembershipTier;
  points: string;
  storeName: string;
  salesperson: string;
  remark: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  tier?: string;
  points?: string;
  storeName?: string;
  salesperson?: string;
}

type FormFieldKey = keyof FormData;

// ---- 验证函数 ----

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = '姓名不能为空';
  } else if (data.name.trim().length < 2) {
    errors.name = '姓名至少2个字符';
  } else if (data.name.trim().length > 20) {
    errors.name = '姓名不能超过20个字符';
  }

  if (!data.phone.trim()) {
    errors.phone = '手机号不能为空';
  } else if (!/^1[3-9]\d{9}$/.test(data.phone.trim())) {
    errors.phone = '请输入有效的11位手机号';
  }

  if (!data.email.trim()) {
    errors.email = '邮箱不能为空';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = '请输入有效的邮箱地址';
  }

  if (!data.tier) {
    errors.tier = '请选择会员等级';
  }

  if (data.points.trim()) {
    const pts = Number(data.points);
    if (!Number.isInteger(pts) || pts < 0) {
      errors.points = '积分必须为非负整数';
    } else if (pts > 99999999) {
      errors.points = '积分不能超过 99,999,999';
    }
  }

  if (data.storeName.trim() && data.storeName.trim().length > 50) {
    errors.storeName = '门店名称不能超过50个字符';
  }

  if (data.salesperson.trim() && data.salesperson.trim().length > 20) {
    errors.salesperson = '导购姓名不能超过20个字符';
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

async function submitMember(
  _data: FormData,
): Promise<{ ok: boolean; message?: string; id?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (Math.random() < 0.15) {
    throw new Error('网络异常，请稍后重试');
  }
  return { ok: true, message: '会员创建成功', id: `MEM-${Date.now()}` };
}

// ---- 页面组件 ----

export default function TobMemberNewPage() {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    tier: '' as MembershipTier,
    points: '',
    storeName: '',
    salesperson: '',
    remark: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<FormFieldKey>>(new Set());
  const [submitState, setSubmitState] = useState<{
    isSubmitting: boolean;
    errorMessage?: string;
    successMessage?: string;
  }>({ isSubmitting: false });

  const handleChange = useCallback(
    (field: FormFieldKey) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const next = { ...form, [field]: value };
      setForm(next);
      if (touched.has(field)) {
        const newErrors = { ...errors };
        delete newErrors[field as keyof FormErrors];
        setErrors(newErrors);
      }
    },
    [form, errors, touched],
  );

  const handleTierChange = useCallback(
    (value: string) => {
      const next = { ...form, tier: value as MembershipTier };
      setForm(next);
      if (touched.has('tier')) {
        const newErrors = { ...errors };
        delete newErrors.tier;
        setErrors(newErrors);
      }
    },
    [form, errors, touched],
  );

  const handleBlur = useCallback(
    (field: FormFieldKey) => () => {
      setTouched((prev) => new Set(prev).add(field));
      const newErrors = { ...errors, ...validateForm(form) };
      if (!newErrors[field as keyof FormErrors]) {
        delete newErrors[field as keyof FormErrors];
      }
      setErrors(newErrors);
    },
    [form, errors],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const allFields: FormFieldKey[] = [
        'name', 'phone', 'email', 'tier', 'points', 'storeName', 'salesperson',
      ];
      setTouched(new Set(allFields));
      const validationErrors = validateForm(form);
      setErrors(validationErrors);
      if (hasErrors(validationErrors)) {
        toast.warning('请修正表单中的错误');
        return;
      }
      setSubmitState({ isSubmitting: true });
      try {
        const result = await submitMember(form);
        if (result.ok) {
          setSubmitState({ isSubmitting: false, successMessage: result.message });
          toast.success('会员创建成功');
          setTimeout(() => router.push('/members'), 1500);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '提交失败，请重试';
        setSubmitState({ isSubmitting: false, errorMessage: msg });
      }
    },
    [form, router, toast],
  );

  const handleRetry = useCallback(() => {
    setSubmitState({ isSubmitting: false, errorMessage: undefined });
  }, []);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const fieldError = (field: FormFieldKey): string | undefined =>
    touched.has(field) ? errors[field as keyof FormErrors] : undefined;

  return (
    <PageShell
      title="新增会员"
      subtitle="ToB 管理端 — 为门店添加新会员，填写会员信息后提交创建。"
      actions={
        <SubmitButton
          label="取消"
          variant="secondary"
          type="button"
          onClick={handleCancel}
          disabled={submitState.isSubmitting}
        />
      }
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="新增会员表单"
        style={{ maxWidth: 640, margin: '0 auto' }}
      >
        <FormSubmitFeedback
          error={submitState.errorMessage}
          success={submitState.successMessage}
          submitting={submitState.isSubmitting}
          onRetry={handleRetry}
          onDismissError={() => setSubmitState((s) => ({ ...s, errorMessage: undefined }))}
          onDismissSuccess={() => setSubmitState((s) => ({ ...s, successMessage: undefined }))}
        />

        <FormField label="会员姓名" htmlFor="tob-member-name" required error={fieldError('name')}>
          <Input
            id="tob-member-name"
            placeholder="请输入会员姓名"
            value={form.name}
            onChange={handleChange('name')}
            onBlur={handleBlur('name')}
            error={fieldError('name')}
            data-testid="tob-member-name-input"
          />
        </FormField>

        <FormField label="手机号" htmlFor="tob-member-phone" required error={fieldError('phone')} helper="11位手机号码">
          <Input
            id="tob-member-phone"
            placeholder="请输入11位手机号"
            value={form.phone}
            onChange={handleChange('phone')}
            onBlur={handleBlur('phone')}
            maxLength={11}
            error={fieldError('phone')}
            data-testid="tob-member-phone-input"
          />
        </FormField>

        <FormField label="邮箱" htmlFor="tob-member-email" required error={fieldError('email')}>
          <Input
            id="tob-member-email"
            type="email"
            placeholder="请输入邮箱地址"
            value={form.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            error={fieldError('email')}
            data-testid="tob-member-email-input"
          />
        </FormField>

        <FormField label="会员等级" htmlFor="tob-member-tier" required error={fieldError('tier')}>
          <Select
            value={form.tier}
            onChange={handleTierChange}
            options={[{ label: '请选择等级', value: '' }, ...TIER_OPTIONS]}
            aria-label="会员等级"
          />
        </FormField>

        <FormField label="初始积分" htmlFor="tob-member-points" error={fieldError('points')} helper="可选，默认为0">
          <Input
            id="tob-member-points"
            type="number"
            min={0}
            placeholder="0"
            value={form.points}
            onChange={handleChange('points')}
            onBlur={handleBlur('points')}
            error={fieldError('points')}
            data-testid="tob-member-points-input"
          />
        </FormField>

        <FormField label="所属门店" htmlFor="tob-member-store" error={fieldError('storeName')}>
          <Input
            id="tob-member-store"
            placeholder="请输入门店名称（可选）"
            value={form.storeName}
            onChange={handleChange('storeName')}
            onBlur={handleBlur('storeName')}
            error={fieldError('storeName')}
            data-testid="tob-member-store-input"
          />
        </FormField>

        <FormField label="导购姓名" htmlFor="tob-member-salesperson" error={fieldError('salesperson')} helper="可选">
          <Input
            id="tob-member-salesperson"
            placeholder="请输入导购姓名（可选）"
            value={form.salesperson}
            onChange={handleChange('salesperson')}
            onBlur={handleBlur('salesperson')}
            error={fieldError('salesperson')}
            data-testid="tob-member-salesperson-input"
          />
        </FormField>

        <FormField label="备注" htmlFor="tob-member-remark">
          <Input
            id="tob-member-remark"
            placeholder="可选备注信息"
            value={form.remark}
            onChange={handleChange('remark')}
            data-testid="tob-member-remark-input"
          />
        </FormField>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid rgba(148, 163, 184, 0.15)',
          }}
        >
          <SubmitButton
            label="取消"
            variant="secondary"
            type="button"
            onClick={handleCancel}
            disabled={submitState.isSubmitting}
          />
          <SubmitButton
            label="提交"
            loading={submitState.isSubmitting}
            type="submit"
            variant="primary"
            data-testid="tob-member-submit-btn"
          />
        </div>
      </form>
    </PageShell>
  );
}
