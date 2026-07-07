/**
 * Coupon Form Page — 优惠券创建/编辑表单页
 * 角色视角: 👔运营经理 · 💰财务主管 · 📊品类经理
 * 功能: 新建优惠券（支持折扣券/代金券/包邮券/满减券）
 *       含字段验证、提交回调、错误反馈
 */
'use client';

import React, { useState, useCallback } from 'react';

import {
  FormField,
  FormSubmitFeedback,
  PageShell,
  SubmitButton,
  Breadcrumb,
} from '@m5/ui';

import {
  COUPON_TYPE_MAP,
  COUPON_SCOPE_MAP,
  COUPON_TYPES,
  COUPON_SCOPES,
  type CouponType,
  type CouponScope,
} from '../../coupons-data';

// ---- 表单数据类型 ----

export interface CouponFormData {
  name: string;
  code: string;
  type: CouponType | '';
  scope: CouponScope | '';
  discountValue: string;
  threshold: string;
  totalQuota: string;
  usageLimit: string;
  startAt: string;
  endAt: string;
}

export function emptyFormData(): CouponFormData {
  return {
    name: '',
    code: '',
    type: '',
    scope: '',
    discountValue: '',
    threshold: '0',
    totalQuota: '1000',
    usageLimit: '1',
    startAt: '',
    endAt: '',
  };
}

// ---- 验证逻辑 ----

export interface FormErrors {
  name?: string;
  code?: string;
  type?: string;
  scope?: string;
  discountValue?: string;
  totalQuota?: string;
  startAt?: string;
  endAt?: string;
}

export function validateForm(data: CouponFormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) errors.name = '请输入优惠券名称';
  else if (data.name.length > 50) errors.name = '名称不超过50个字符';

  if (!data.code.trim()) errors.code = '请输入券码';
  else if (!/^[A-Z0-9]{4,20}$/.test(data.code.trim()))
    errors.code = '券码为4-20位大写字母或数字';

  if (!data.type) errors.type = '请选择优惠券类型';

  if (!data.scope) errors.scope = '请选择适用范围';

  if (data.type) {
    const dv = parseFloat(data.discountValue);
    if (isNaN(dv)) errors.discountValue = '请输入有效的折扣/金额';
    else if (data.type === 'shipping' && (dv < 0 || dv > 99999))
      errors.discountValue = '包邮门槛为0-99999';
    else if (data.type === 'percentage' && (dv < 1 || dv > 99))
      errors.discountValue = '折扣券折扣为1-99';
    else if ((data.type === 'fixed' || data.type === 'threshold') && (dv < 0.01 || dv > 99999))
      errors.discountValue = '金额为0.01-99999';
    else if (data.type !== 'shipping' && dv <= 0)
      errors.discountValue = '请输入有效的折扣/金额';
  }

  const tq = parseInt(data.totalQuota, 10);
  if (isNaN(tq) || tq <= 0) errors.totalQuota = '请输入有效发放总量';
  else if (tq > 999999) errors.totalQuota = '总量不超过999999';

  if (!data.startAt) errors.startAt = '请选择开始日期';
  if (!data.endAt) errors.endAt = '请选择结束日期';
  if (data.startAt && data.endAt && data.startAt >= data.endAt)
    errors.endAt = '结束日期须晚于开始日期';

  return errors;
}

export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

// ---- 提交模拟 ----

export interface SubmitResult {
  success: boolean;
  message: string;
}

export async function submitCoupon(data: CouponFormData): Promise<SubmitResult> {
  // 模拟网络延迟
  await new Promise((r) => setTimeout(r, 800));

  // 模拟: 券码冲突
  if (data.code.trim() === 'DUPLICATE') {
    return { success: false, message: '券码已存在，请更换' };
  }

  return { success: true, message: `优惠券「${data.name}」创建成功` };
}

// ---- 页面组件 ----

export default function CouponFormPage() {
  const [formData, setFormData] = useState<CouponFormData>(emptyFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const updateField = useCallback(<K extends keyof CouponFormData>(
    field: K,
    value: CouponFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除该字段错误
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as keyof FormErrors];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setSubmitting(true);
    try {
      const result = await submitCoupon(formData);
      setSubmitResult(result);
      if (result.success) {
        setFormData(emptyFormData());
      }
    } catch {
      setSubmitResult({ success: false, message: '提交异常，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  // 根据类型切换折扣字段说明
  const discountLabel = (() => {
    switch (formData.type) {
      case 'percentage': return '折扣值 (%)';
      case 'fixed': return '代金金额 (元)';
      case 'shipping': return '包邮门槛 (元)';
      case 'threshold': return '减免金额 (元)';
      default: return '折扣/金额';
    }
  })();

  const discountPlaceholder = (() => {
    switch (formData.type) {
      case 'percentage': return '例: 15';
      case 'fixed':
      case 'threshold': return '例: 50';
      case 'shipping': return '例: 0';
      default: return '请输入';
    }
  })();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 32 }}>
      <Breadcrumb
        items={[
          { label: '优惠券管理', href: '/coupons' },
          { label: '创建优惠券' },
        ]}
      />

      <PageShell title="创建优惠券" subtitle="创建新的优惠券活动，支持多种优惠类型与发放规则">
        <form onSubmit={handleSubmit} noValidate style={{ marginTop: 24 }}>
          {/* 基本信息 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#e2e8f0' }}>
              基本信息
            </h3>

            <FormField
              label="优惠券名称"
              required
              error={errors.name}
              hint="显示给用户的名称，不超过50字"
            >
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="例: 夏日冰爽特惠"
                style={inputStyle}
              />
            </FormField>

            <FormField
              label="券码"
              required
              error={errors.code}
              hint="4-20位大写字母或数字，唯一标识"
            >
              <input
                type="text"
                value={formData.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                placeholder="例: SUMMER2026"
                style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 1 }}
              />
            </FormField>

            <FormField label="优惠券类型" required error={errors.type}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COUPON_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateField('type', t)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: formData.type === t
                        ? '2px solid #60a5fa'
                        : '1px solid rgba(148,163,184,0.3)',
                      background: formData.type === t
                        ? 'rgba(96,165,250,0.15)'
                        : 'rgba(15,23,42,0.4)',
                      color: formData.type === t ? '#60a5fa' : '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: formData.type === t ? 600 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    {COUPON_TYPE_MAP[t].label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="适用范围" required error={errors.scope}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COUPON_SCOPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateField('scope', s)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 8,
                      border: formData.scope === s
                        ? '2px solid #a78bfa'
                        : '1px solid rgba(148,163,184,0.3)',
                      background: formData.scope === s
                        ? 'rgba(167,139,250,0.15)'
                        : 'rgba(15,23,42,0.4)',
                      color: formData.scope === s ? '#a78bfa' : '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: formData.scope === s ? 600 : 400,
                    }}
                  >
                    {COUPON_SCOPE_MAP[s]}
                  </button>
                ))}
              </div>
            </FormField>
          </div>

          {/* 优惠设置 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#e2e8f0' }}>
              优惠设置
            </h3>

            <FormField
              label={discountLabel}
              required
              error={errors.discountValue}
            >
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => updateField('discountValue', e.target.value)}
                placeholder={discountPlaceholder}
                min={0}
                step="0.01"
                style={inputStyle}
              />
            </FormField>

            {formData.type === 'threshold' && (
              <FormField
                label="满减门槛 (元)"
                hint="订单满多少元可享受优惠，0为无门槛"
              >
                <input
                  type="number"
                  value={formData.threshold}
                  onChange={(e) => updateField('threshold', e.target.value)}
                  placeholder="例: 100"
                  min={0}
                  style={inputStyle}
                />
              </FormField>
            )}

            <FormField
              label="发放总量"
              required
              error={errors.totalQuota}
              hint="最大发券数量"
            >
              <input
                type="number"
                value={formData.totalQuota}
                onChange={(e) => updateField('totalQuota', e.target.value)}
                min={1}
                max={999999}
                style={inputStyle}
              />
            </FormField>

            <FormField
              label="每人限领"
              hint="每位用户最多可领取次数"
            >
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => updateField('usageLimit', e.target.value)}
                min={1}
                max={100}
                style={inputStyle}
              />
            </FormField>
          </div>

          {/* 有效期 */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 14, color: '#e2e8f0' }}>
              有效期
            </h3>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <FormField label="开始日期" required error={errors.startAt}>
                  <input
                    type="date"
                    value={formData.startAt}
                    onChange={(e) => updateField('startAt', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <FormField label="结束日期" required error={errors.endAt}>
                  <input
                    type="date"
                    value={formData.endAt}
                    onChange={(e) => updateField('endAt', e.target.value)}
                    style={inputStyle}
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* 提交反馈 */}
          {submitResult && (
            <FormSubmitFeedback
              success={submitResult.success ? submitResult.message : undefined}
              error={submitResult.success ? undefined : submitResult.message}
              onDismissSuccess={submitResult.success ? () => setSubmitResult(null) : undefined}
              onDismissError={!submitResult.success ? () => setSubmitResult(null) : undefined}
            />
          )}

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <SubmitButton
              loading={submitting}
              disabled={submitting}
              variant="primary"
            >
              {submitting ? '创建中…' : '创建优惠券'}
            </SubmitButton>
            <SubmitButton
              type="button"
              variant="secondary"
              onClick={() => {
                setFormData(emptyFormData());
                setErrors({});
                setSubmitResult(null);
              }}
            >
              重置
            </SubmitButton>
          </div>
        </form>
      </PageShell>
    </main>
  );
}

// ---- 统一输入框样式 ----

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.25)',
  background: 'rgba(15,23,42,0.5)',
  color: '#e2e8f0',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
};
