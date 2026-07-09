/**
 * 会员等级权益配置表单 — Member Tier Benefits Form (Next.js App Router Page)
 * 功能: 为会员创建/编辑等级及其权益配置，含字段验证/提交/错误处理
 * 角色视角: 👤运营管理 / 会员体系
 */
'use client';

import React, { useState, useCallback } from 'react';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  WorkspaceBreadcrumb,
} from '@m5/ui';

// ---- 常量 ----

const TIER_OPTIONS = [
  { value: 'bronze', label: '青铜' },
  { value: 'silver', label: '白银' },
  { value: 'gold', label: '黄金' },
  { value: 'platinum', label: '铂金' },
  { value: 'diamond', label: '钻石' },
] as const;

const STATUS_OPTIONS = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
] as const;

const BENEFIT_TYPE_OPTIONS = [
  { value: 'discount', label: '折扣优惠' },
  { value: 'points_multiplier', label: '积分倍率' },
  { value: 'free_shipping', label: '免运费' },
  { value: 'exclusive_access', label: '专属活动' },
  { value: 'birthday_gift', label: '生日礼包' },
  { value: 'priority_service', label: '优先服务' },
] as const;

// ---- 表单类型 ----

interface TierBenefitsFormValues {
  tierKey: string;
  tierName: string;
  minPoints: string;
  maxPoints: string;
  discountRate: string;
  benefitTypes: string[];
  status: string;
  notes: string;
}

const DEFAULT_VALUES: TierBenefitsFormValues = {
  tierKey: '',
  tierName: '',
  minPoints: '',
  maxPoints: '',
  discountRate: '',
  benefitTypes: [],
  status: 'inactive',
  notes: '',
};

// ---- 错误类型 ----

interface FieldError {
  field: keyof TierBenefitsFormValues;
  message: string;
}

// ---- 验证逻辑 ----

function validateForm(values: TierBenefitsFormValues): FieldError[] {
  const errors: FieldError[] = [];

  if (!values.tierKey.trim()) {
    errors.push({ field: 'tierKey', message: '等级标识不能为空' });
  } else if (!/^[a-z_]{2,20}$/.test(values.tierKey.trim())) {
    errors.push({ field: 'tierKey', message: '等级标识格式：2-20位小写字母和下划线' });
  }

  if (!values.tierName.trim()) {
    errors.push({ field: 'tierName', message: '等级名称不能为空' });
  } else if (values.tierName.trim().length > 20) {
    errors.push({ field: 'tierName', message: '等级名称不能超过20个字符' });
  }

  if (!values.minPoints.trim()) {
    errors.push({ field: 'minPoints', message: '最低积分不能为空' });
  } else {
    const min = Number(values.minPoints);
    if (isNaN(min) || min < 0 || !Number.isInteger(min)) {
      errors.push({ field: 'minPoints', message: '请输入非负整数' });
    }
  }

  if (!values.maxPoints.trim()) {
    errors.push({ field: 'maxPoints', message: '最高积分不能为空' });
  } else {
    const max = Number(values.maxPoints);
    if (isNaN(max) || max < 0 || !Number.isInteger(max)) {
      errors.push({ field: 'maxPoints', message: '请输入非负整数' });
    }
  }

  // 跨字段校验：最高积分必须大于最低积分
  const minNum = Number(values.minPoints);
  const maxNum = Number(values.maxPoints);
  if (!isNaN(minNum) && !isNaN(maxNum) && minNum > 0 && maxNum > 0 && maxNum <= minNum) {
    errors.push({ field: 'maxPoints', message: '最高积分必须大于最低积分' });
  }

  if (!values.discountRate.trim()) {
    errors.push({ field: 'discountRate', message: '折扣率不能为空' });
  } else {
    const rate = parseFloat(values.discountRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      errors.push({ field: 'discountRate', message: '折扣率范围为 0-100' });
    }
  }

  if (values.benefitTypes.length === 0) {
    errors.push({ field: 'benefitTypes', message: '至少选择一个权益类型' });
  }

  return errors;
}

// ---- 页面组件 ----

export default function TierBenefitsFormPage() {
  const [values, setValues] = useState<TierBenefitsFormValues>(DEFAULT_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const getFieldError = useCallback(
    (field: keyof TierBenefitsFormValues): string | undefined =>
      fieldErrors.find((e) => e.field === field)?.message,
    [fieldErrors],
  );

  const handleSubmit = useCallback(async () => {
    if (submitState === 'submitting') return;
    setSubmitState('submitting');
    try {
      // 模拟提交延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // 模拟重复等级标识冲突
      if (values.tierKey === 'gold') {
        throw new Error(`等级标识 "gold" 已存在，请使用其他标识`);
      }
      setSubmitState('success');
    } catch {
      setSubmitState('error');
    }
  }, [values.tierKey, submitState]);

  const resetSubmit = useCallback(() => {
    setSubmitState('idle');
  }, []);

  const setValue = useCallback(
    (field: keyof TierBenefitsFormValues) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        setFieldErrors((prev) => prev.filter((er) => er.field !== field));
      },
    [],
  );

  const toggleBenefitType = useCallback((type: string) => {
    setValues((prev) => ({
      ...prev,
      benefitTypes: prev.benefitTypes.includes(type)
        ? prev.benefitTypes.filter((t) => t !== type)
        : [...prev.benefitTypes, type],
    }));
    setFieldErrors((prev) => prev.filter((er) => er.field !== 'benefitTypes'));
  }, []);

  const onSubmit = useCallback(async () => {
    const errors = validateForm(values);
    setFieldErrors(errors);
    if (errors.length > 0) {
      const field = errors[0]!.field;
      const el = document.querySelector<HTMLElement>(`[data-field="${field}"]`);
      if (el) el.focus();
      return;
    }
    await handleSubmit();
  }, [values, handleSubmit]);

  const isSubmitting = submitState === 'submitting';

  return (
    <PageShell
      title="配置会员等级权益"
      subtitle="设置会员等级名称、积分范围、折扣率及权益类型"
      breadcrumb={
        <WorkspaceBreadcrumb
          workspaceLabel="会员管理"
          workspaceHref="/members"
          detailLabel="等级权益配置"
        />
      }
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* 成功反馈 */}
        {submitState === 'success' && (
          <FormSubmitFeedback
            success="等级权益配置已提交 — 会员等级配置保存成功。"
            onDismissSuccess={resetSubmit}
          />
        )}

        {/* 失败反馈 */}
        {submitState === 'error' && (
          <FormSubmitFeedback
            error="提交失败"
            onRetry={onSubmit}
            onDismissError={resetSubmit}
          />
        )}

        {/* 表单主体 */}
        {submitState !== 'success' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* 等级基本信息 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                等级信息
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div data-field="tierKey">
                  <FormField label="等级标识 *" error={getFieldError('tierKey')}>
                    <input
                      type="text"
                      value={values.tierKey}
                      onChange={setValue('tierKey')}
                      placeholder="例：silver_vip"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('tierKey'))}
                    />
                  </FormField>
                </div>
                <div data-field="tierName">
                  <FormField label="等级名称 *" error={getFieldError('tierName')}>
                    <input
                      type="text"
                      value={values.tierName}
                      onChange={setValue('tierName')}
                      placeholder="例：银卡会员"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('tierName'))}
                    />
                  </FormField>
                </div>
                <div data-field="minPoints">
                  <FormField label="最低积分 *" error={getFieldError('minPoints')}>
                    <input
                      type="text"
                      value={values.minPoints}
                      onChange={setValue('minPoints')}
                      placeholder="例：1000"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('minPoints'))}
                    />
                  </FormField>
                </div>
                <div data-field="maxPoints">
                  <FormField label="最高积分 *" error={getFieldError('maxPoints')}>
                    <input
                      type="text"
                      value={values.maxPoints}
                      onChange={setValue('maxPoints')}
                      placeholder="例：5000"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('maxPoints'))}
                    />
                  </FormField>
                </div>
                <div data-field="discountRate">
                  <FormField label="折扣率 (%) *" error={getFieldError('discountRate')}>
                    <input
                      type="text"
                      value={values.discountRate}
                      onChange={setValue('discountRate')}
                      placeholder="例：85"
                      disabled={isSubmitting}
                      style={inputStyle(getFieldError('discountRate'))}
                    />
                  </FormField>
                </div>
                <div data-field="status">
                  <FormField label="状态">
                    <select
                      value={values.status}
                      onChange={setValue('status')}
                      disabled={isSubmitting}
                      style={{ ...inputStyle(), minHeight: 40 }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </section>

            {/* 权益类型选择 */}
            <section data-field="benefitTypes">
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                权益类型 *
              </h3>
              {getFieldError('benefitTypes') && (
                <p style={{ fontSize: 12, color: '#ef4444', margin: '0 0 8px' }}>
                  {getFieldError('benefitTypes')}
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BENEFIT_TYPE_OPTIONS.map((opt) => {
                  const selected = values.benefitTypes.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleBenefitType(opt.value)}
                      disabled={isSubmitting}
                      style={{
                        padding: '8px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        borderRadius: 8,
                        border: `2px solid ${selected ? '#fbbf24' : '#334155'}`,
                        background: selected ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                        color: selected ? '#fbbf24' : '#94a3b8',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {selected ? '✓ ' : ''}{opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 备注 */}
            <section>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 }}>
                备注
              </h3>
              <div data-field="notes">
                <FormField label="备注说明">
                  <textarea
                    value={values.notes}
                    onChange={setValue('notes')}
                    placeholder="例：银卡会员尊享9折及生日专属礼包"
                    disabled={isSubmitting}
                    rows={3}
                    style={{ ...inputStyle(), resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </FormField>
              </div>
            </section>

            {/* 提交按钮 */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              paddingTop: 8,
              borderTop: '1px solid #334155',
            }}>
              <SubmitButton
                variant="secondary"
                onClick={() => window.history.back()}
                disabled={isSubmitting}
              >
                取消
              </SubmitButton>
              <SubmitButton
                variant="primary"
                loading={isSubmitting}
                type="submit"
              >
                {isSubmitting ? '提交中…' : '保存配置'}
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </PageShell>
  );
}

// ---- 样式 ----

function inputStyle(error?: string): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 12px',
    fontSize: 14,
    color: '#e2e8f0',
    background: '#1e293b',
    border: `1px solid ${error ? '#ef4444' : '#334155'}`,
    borderRadius: 6,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };
}
