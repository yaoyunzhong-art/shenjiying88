'use client';

import React, { useState, useCallback } from 'react';
import {
  PageShell,
  FormField,
  Input,
  Select,
  Checkbox,
  Button,
  SubmitButton,
  FormSubmitFeedback,
} from '@m5/ui';

// ==================== 类型定义 ====================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  deliveryMethod: string;
  paymentMethod: string;
  agreeTerms: boolean;
  remark: string;
}

const defaultCart: CartItem[] = [
  { id: 'p1', name: '基础护肤套装', price: 299, quantity: 1 },
  { id: 'p2', name: '深层清洁面膜（5片装）', price: 89, quantity: 2 },
  { id: 'p3', name: '防晒霜 SPF50+', price: 139, quantity: 1 },
];

const deliveryOptions = [
  { label: '标准配送（3-5天）', value: 'standard' },
  { label: '加急配送（1-2天）', value: 'express' },
  { label: '门店自提', value: 'pickup' },
];

const paymentOptions = [
  { label: '微信支付', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '银行卡', value: 'card' },
  { label: '到店支付', value: 'store' },
];

// ==================== 验证规则 ====================

function validateForm(data: CheckoutFormData): Partial<Record<keyof CheckoutFormData, string>> {
  const errors: Partial<Record<keyof CheckoutFormData, string>> = {};

  if (!data.name.trim()) errors.name = '请输入收件人姓名';
  if (!data.phone.trim()) errors.phone = '请输入手机号';
  else if (!/^1\d{10}$/.test(data.phone.trim())) errors.phone = '手机号格式不正确';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = '邮箱格式不正确';
  if (!data.address.trim()) errors.address = '请输入收货地址';
  if (!data.city.trim()) errors.city = '请输入所在城市';
  if (!data.deliveryMethod) errors.deliveryMethod = '请选择配送方式';
  if (!data.paymentMethod) errors.paymentMethod = '请选择支付方式';
  if (!data.agreeTerms) errors.agreeTerms = '请同意服务条款';

  return errors;
}

// ==================== 组件 ====================

export default function CheckoutPage() {
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    deliveryMethod: '',
    paymentMethod: '',
    agreeTerms: false,
    remark: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message?: string } | null>(null);

  const totalPrice = defaultCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = defaultCart.reduce((sum, item) => sum + item.quantity, 0);

  const updateField = useCallback(<K extends keyof CheckoutFormData>(
    key: K,
    value: CheckoutFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSubmitResult(null);

    try {
      // Mock submit — 模拟 API 调用
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitResult({ success: true, message: '订单已提交成功！' });
    } catch (err) {
      setSubmitResult({
        success: false,
        message: err instanceof Error ? err.message : '提交失败，请重试',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  const handleReset = useCallback(() => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      deliveryMethod: '',
      paymentMethod: '',
      agreeTerms: false,
      remark: '',
    });
    setErrors({});
    setSubmitResult(null);
  }, []);

  return (
    <PageShell
      title="结算"
      description="确认商品信息并提交订单"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        {/* ===== 左侧：表单区域 ===== */}
        <div
          data-testid="checkout-form-section"
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            收件信息
          </h3>

          <FormField label="收件人姓名" htmlFor="checkout-name" required error={errors.name}>
            <Input
              id="checkout-name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="请输入收件人姓名"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="手机号" htmlFor="checkout-phone" required error={errors.phone}>
              <Input
                id="checkout-phone"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="请输入手机号"
              />
            </FormField>
            <FormField label="邮箱" htmlFor="checkout-email" error={errors.email}>
              <Input
                id="checkout-email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="选填"
              />
            </FormField>
          </div>

          <FormField label="收货地址" htmlFor="checkout-address" required error={errors.address}>
            <Input
              id="checkout-address"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="请输入详细地址"
            />
          </FormField>

          <FormField label="所在城市" htmlFor="checkout-city" required error={errors.city}>
            <Input
              id="checkout-city"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="请输入城市名"
            />
          </FormField>

          <h3 style={{ margin: '24px 0 16px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            配送 &amp; 支付
          </h3>

          <FormField label="配送方式" required error={errors.deliveryMethod}>
            <Select
              value={formData.deliveryMethod}
              onChange={(v) => updateField('deliveryMethod', v)}
              options={deliveryOptions}
              placeholder="请选择配送方式"
            />
          </FormField>

          <FormField label="支付方式" required error={errors.paymentMethod}>
            <Select
              value={formData.paymentMethod}
              onChange={(v) => updateField('paymentMethod', v)}
              options={paymentOptions}
              placeholder="请选择支付方式"
            />
          </FormField>

          <FormField label="备注" helper="选填，不超过200字">
            <textarea
              value={formData.remark}
              onChange={(e) => updateField('remark', e.target.value)}
              placeholder="订单备注..."
              maxLength={200}
              style={{
                width: '100%',
                minHeight: 60,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid rgba(148,163,184,0.2)',
                background: 'rgba(15,23,42,0.6)',
                color: '#e2e8f0',
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </FormField>

          <div style={{ margin: '12px 0 20px' }}>
            <Checkbox
              checked={formData.agreeTerms}
              onChange={(checked) => updateField('agreeTerms', checked)}
              label="我已阅读并同意服务条款和隐私政策"
            />
            {errors.agreeTerms && (
              <p style={{ fontSize: 12, color: '#fca5a5', margin: '4px 0 0' }}>
                {errors.agreeTerms}
              </p>
            )}
          </div>

          {submitResult && (
            <div style={{ marginBottom: 16 }}>
              <FormSubmitFeedback
                success={submitResult.success ? (submitResult.message ?? '提交成功') : undefined}
                error={!submitResult.success ? (submitResult.message ?? '提交失败') : undefined}
              />
            </div>
          )}

          <SubmitButton
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            variant="primary"
            style={{ width: '100%' }}
          >
            {isSubmitting ? '正在提交...' : `提交订单 (¥${totalPrice.toFixed(2)})`}
          </SubmitButton>

          {submitResult?.success && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Button onClick={handleReset} variant="ghost" size="sm">
                继续购物
              </Button>
            </div>
          )}
        </div>

        {/* ===== 右侧：订单摘要 ===== */}
        <div
          data-testid="checkout-summary-section"
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 24,
            position: 'sticky',
            top: 16,
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            订单摘要
          </h3>

          <div style={{ marginBottom: 16, maxHeight: 320, overflowY: 'auto' }}>
            {defaultCart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(148,163,184,0.08)',
                }}
              >
                <div>
                  <span style={{ fontSize: 13, color: '#e2e8f0' }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: '#64748b', marginLeft: 8 }}>
                    x{item.quantity}
                  </span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#f1f5f9' }}>
                  ¥{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: '12px 0',
              borderTop: '1px solid rgba(148,163,184,0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
              <span>商品数量</span>
              <span>{itemCount} 件</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
              <span>商品小计</span>
              <span>¥{totalPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
              <span>配送费</span>
              <span>{totalPrice >= 199 ? '免运费' : '¥15.00'}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 16,
                fontWeight: 700,
                color: '#fbbf24',
                paddingTop: 8,
                borderTop: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <span>合计</span>
              <span>¥{(totalPrice >= 199 ? totalPrice : totalPrice + 15).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

