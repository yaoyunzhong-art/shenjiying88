'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageShell,
  FormField,
  Input,
  Select,
  Checkbox,
  Button,
  SubmitButton,
  FormSubmitFeedback,
  InputNumber,
  RadioGroup,
  Divider,
} from '@m5/ui';
import {
  buildStorefrontMemberId,
  ensureStorefrontMemberRegistered,
  getStorefrontMemberBalance,
  startStorefrontCheckout,
  validateStorefrontCoupon,
  type MemberBalanceInfo,
} from '../../lib/storefront-transactions';

// ==================== 类型定义 ====================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
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
  couponCode: string;
}

export type PaymentMethodValue = 'wechat' | 'alipay' | 'cash' | 'member_card';

// ==================== 常量 ====================

const CHECKOUT_DRAFT_STORAGE_KEY = 'storefront.checkout.draft';

const deliveryOptions = [
  { label: '标准配送（3-5天）', value: 'standard' },
  { label: '加急配送（1-2天）', value: 'express', extra: '¥10.00' },
  { label: '门店自提', value: 'pickup' },
];

const FREE_SHIPPING_THRESHOLD = 199;
const EXPRESS_FEE = 10;

interface PaymentOption {
  value: PaymentMethodValue;
  label: string;
  icon: string;
  description: string;
}

const paymentOptions: PaymentOption[] = [
  { value: 'wechat', label: '微信支付', icon: '💳', description: '微信扫码支付' },
  { value: 'alipay', label: '支付宝', icon: '🔵', description: '支付宝扫码支付' },
  { value: 'cash', label: '现金', icon: '💵', description: '到店付款' },
  { value: 'member_card', label: '会员卡', icon: '🎫', description: '余额/积分支付' },
];

// ==================== 验证规则 ====================

function validateForm(data: CheckoutFormData): Partial<Record<keyof CheckoutFormData, string>> {
  const errors: Partial<Record<keyof CheckoutFormData, string>> = {};

  if (!data.name.trim()) errors.name = '请输入收件人姓名';
  if (!data.phone.trim()) errors.phone = '请输入手机号';
  else if (!/^1\d{10}$/.test(data.phone.trim())) errors.phone = '手机号格式不正确（11位数字）';
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = '邮箱格式不正确';
  if (!data.address.trim()) errors.address = '请输入收货地址';
  if (!data.city.trim()) errors.city = '请输入所在城市';
  if (!data.deliveryMethod) errors.deliveryMethod = '请选择配送方式';
  if (!data.paymentMethod) errors.paymentMethod = '请选择支付方式';
  if (!data.agreeTerms) errors.agreeTerms = '请先同意服务条款';

  return errors;
}

function normalizeDraftItem(input: unknown): CartItem | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const item = input as Partial<CartItem>;
  if (typeof item.id !== 'string' || typeof item.name !== 'string') {
    return null;
  }
  if (typeof item.price !== 'number' || !Number.isFinite(item.price) || item.price < 0) {
    return null;
  }
  if (typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity <= 0) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: Math.min(99, Math.max(1, Math.floor(item.quantity))),
    image: typeof item.image === 'string' ? item.image : undefined,
    category: typeof item.category === 'string' ? item.category : undefined,
  };
}

function loadCheckoutDraft(): CartItem[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeDraftItem).filter((item): item is CartItem => item !== null);
  } catch {
    return [];
  }
}

function persistCheckoutDraft(items: CartItem[]) {
  if (typeof window === 'undefined') {
    return;
  }

  if (items.length === 0) {
    window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(items));
}

// ==================== 子组件 ====================

/** 数量调整器 */
function QuantityAdjuster({
  itemId,
  quantity,
  onQuantityChange,
}: {
  itemId: string;
  quantity: number;
  onQuantityChange: (id: string, delta: number) => void;
}) {
  return (
    <div
      data-testid={`qty-adjuster-${itemId}`}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      <button
        data-testid={`qty-minus-${itemId}`}
        type="button"
        disabled={quantity <= 1}
        onClick={() => onQuantityChange(itemId, -1)}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          border: '1px solid rgba(148,163,184,0.25)',
          background: quantity <= 1 ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.12)',
          color: quantity <= 1 ? '#64748b' : '#e2e8f0',
          cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        −
      </button>
      <span
        data-testid={`qty-value-${itemId}`}
        style={{
          minWidth: 24,
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          color: '#e2e8f0',
        }}
      >
        {quantity}
      </span>
      <button
        data-testid={`qty-plus-${itemId}`}
        type="button"
        onClick={() => onQuantityChange(itemId, 1)}
        disabled={quantity >= 99}
        style={{
          width: 26,
          height: 26,
          borderRadius: 6,
          border: '1px solid rgba(148,163,184,0.25)',
          background: 'rgba(59,130,246,0.15)',
          color: '#60a5fa',
          cursor: 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        +
      </button>
    </div>
  );
}

/** 支付方式卡片 */
function PaymentMethodCard({
  option,
  selected,
  onSelect,
}: {
  option: PaymentOption;
  selected: boolean;
  onSelect: (value: PaymentMethodValue) => void;
}) {
  return (
    <button
      data-testid={`payment-${option.value}`}
      type="button"
      onClick={() => onSelect(option.value)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 14px',
        borderRadius: 10,
        border: selected
          ? '2px solid #60a5fa'
          : '1px solid rgba(148,163,184,0.15)',
        background: selected
          ? 'rgba(59,130,246,0.08)'
          : 'rgba(15,23,42,0.4)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        color: selected ? '#e2e8f0' : '#94a3b8',
        fontWeight: selected ? 600 : 400,
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>{option.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: selected ? '#f1f5f9' : '#cbd5e1' }}>
          {option.label}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
          {option.description}
        </div>
      </div>
      {selected && (
        <span style={{ color: '#60a5fa', fontSize: 16 }}>✓</span>
      )}
    </button>
  );
}

/** 购物车商品行 */
function CartItemRow({
  item,
  onQuantityChange,
}: {
  item: CartItem;
  onQuantityChange: (id: string, delta: number) => void;
}) {
  const lineTotal = item.price * item.quantity;
  return (
    <div
      data-testid={`cart-item-${item.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
      }}
    >
      {/* 商品信息 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500, marginBottom: 2 }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          ¥{item.price.toFixed(2)} / 件
        </div>
      </div>
      {/* 数量调整 */}
      <QuantityAdjuster
        itemId={item.id}
        quantity={item.quantity}
        onQuantityChange={onQuantityChange}
      />
      {/* 小计 */}
      <div
        data-testid={`line-total-${item.id}`}
        style={{
          minWidth: 70,
          textAlign: 'right',
          fontSize: 13,
          fontWeight: 600,
          color: '#f1f5f9',
        }}
      >
        ¥{lineTotal.toFixed(2)}
      </div>
    </div>
  );
}

// ==================== 主页面组件 ====================

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // 购物车优先使用真实草稿，不再默认塞演示商品。
  useEffect(() => {
    setCartItems(loadCheckoutDraft());
  }, []);

  useEffect(() => {
    persistCheckoutDraft(cartItems);
  }, [cartItems]);

  // ---- 表单数据 ----
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
    couponCode: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string; discount?: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [memberBalance, setMemberBalance] = useState<MemberBalanceInfo | null>(null);
  const [memberInfo, setMemberInfo] = useState<{
    name: string;
    tierLabel: string;
    discountRate: number;
  } | null>(null);
  const [usePoints, setUsePoints] = useState(false);

  // ---- 会员权益加载 ----
  useEffect(() => {
    const phone = formData.phone.trim();
    if (phone.length >= 11) {
      getStorefrontMemberBalance(buildStorefrontMemberId(phone))
        .then(setMemberBalance)
        .catch(() => setMemberBalance(null));
    } else {
      setMemberBalance(null);
    }
  }, [formData.phone]);

  // ---- 计算金额 ----
  const activeItems = useMemo(() => cartItems.filter((i) => i.quantity > 0), [cartItems]);
  const itemCount = useMemo(
    () => activeItems.reduce((s, i) => s + i.quantity, 0),
    [activeItems],
  );
  const subtotal = useMemo(
    () => activeItems.reduce((s, i) => s + i.price * i.quantity, 0),
    [activeItems],
  );

  const shippingFee = useMemo(() => {
    if (formData.deliveryMethod === 'pickup') return 0;
    if (formData.deliveryMethod === 'express') return EXPRESS_FEE;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
    return 15;
  }, [formData.deliveryMethod, subtotal]);

  const couponDiscount = useMemo(() => {
    if (couponStatus?.valid && couponStatus.discount) return couponStatus.discount;
    return 0;
  }, [couponStatus]);

  const total = useMemo(
    () => Math.max(0, subtotal + shippingFee - couponDiscount),
    [subtotal, shippingFee, couponDiscount],
  );

  const canCheckout = useMemo(
    () => activeItems.length > 0,
    [activeItems],
  );

  // ---- 回调 ----
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

  const handleQuantityChange = useCallback((id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, Math.min(99, item.quantity + delta)) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const handlePaymentSelect = useCallback((value: PaymentMethodValue) => {
    setFormData((prev) => ({ ...prev, paymentMethod: value }));
    setErrors((prev) => {
      if (prev.paymentMethod) {
        const next = { ...prev };
        delete next.paymentMethod;
        return next;
      }
      return prev;
    });
  }, []);

  const handleApplyCoupon = useCallback(async () => {
    const code = formData.couponCode.trim();
    if (!code) {
      setCouponStatus({ valid: false, message: '请输入优惠券码' });
      return;
    }
    if (!formData.phone.trim()) {
      setCouponStatus({ valid: false, message: '请先填写手机号' });
      return;
    }

    setCouponLoading(true);
    setCouponStatus(null);

    try {
      const memberId = buildStorefrontMemberId(formData.phone);
      const result = await validateStorefrontCoupon(code, memberId);

      if (!result) {
        setCouponStatus({ valid: false, message: '优惠券服务暂不可用' });
      } else {
        setCouponStatus({
          ...result,
          discount: typeof result.discount === 'number' && Number.isFinite(result.discount)
            ? result.discount
            : undefined,
          message: result.discount
            ? result.message
            : `${result.message}，最终优惠以下单结果为准`,
        });
      }
    } catch {
      setCouponStatus({ valid: false, message: '优惠券验证失败' });
    } finally {
      setCouponLoading(false);
    }
  }, [formData.couponCode, formData.phone]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponStatus(null);
    setFormData((prev) => ({ ...prev, couponCode: '' }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canCheckout) return;

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSubmitResult(null);

    try {
      const memberId = buildStorefrontMemberId(formData.phone);
      const checkoutItems = activeItems.map((item) => ({
        skuId: item.id,
        title: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      await ensureStorefrontMemberRegistered(memberId, formData.name.trim());
      const aggregate = await startStorefrontCheckout(
        memberId,
        checkoutItems,
        formData.paymentMethod as PaymentMethodValue,
        total,
        couponStatus?.valid ? formData.couponCode.trim().toUpperCase() : undefined,
      );

      setSubmitResult({
        success: true,
        message: `订单 ${aggregate.order.orderNo ?? aggregate.order.orderId} 已创建，正在跳转支付页...`,
      });
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
      }
      router.push(`/h5/payment/${aggregate.order.orderId}`);
    } catch (err) {
      setSubmitResult({
        success: false,
        message: err instanceof Error ? err.message : '提交失败，请重试',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [activeItems, canCheckout, couponStatus?.valid, formData, router, total]);

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
      couponCode: '',
    });
    setCartItems([]);
    setErrors({});
    setSubmitResult(null);
    setCouponStatus(null);
  }, []);

  // ---- 渲染 ----
  return (
    <PageShell
      title="收银台"
      description="确认商品信息、选择支付方式并提交订单"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* ==================== 左侧：表单区域 ==================== */}
        <div
          data-testid="checkout-form-section"
          style={{
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 12,
            padding: 24,
          }}
        >
          {/* ---- 收件信息 ---- */}
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            收件信息
          </h3>

          <FormField label="收件人姓名" htmlFor="checkout-name" required error={errors.name}>
            <Input
              id="checkout-name"
              data-testid="input-name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="请输入收件人姓名"
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FormField label="手机号" htmlFor="checkout-phone" required error={errors.phone}>
              <Input
                id="checkout-phone"
                data-testid="input-phone"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="请输入手机号"
              />
            </FormField>
            <FormField label="邮箱" htmlFor="checkout-email" error={errors.email}>
              <Input
                id="checkout-email"
                data-testid="input-email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="选填"
              />
            </FormField>
          </div>

          <FormField label="收货地址" htmlFor="checkout-address" required error={errors.address}>
            <Input
              id="checkout-address"
              data-testid="input-address"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="请输入详细地址"
            />
          </FormField>

          <FormField label="所在城市" htmlFor="checkout-city" required error={errors.city}>
            <Input
              id="checkout-city"
              data-testid="input-city"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="请输入城市名"
            />
          </FormField>

          {/* ---- 配送 & 支付 ---- */}
          <Divider style={{ margin: '20px 0 16px' }} />

          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            配送方式
          </h3>

          <FormField label="配送方式" required error={errors.deliveryMethod}>
            <Select
              data-testid="select-delivery"
              value={formData.deliveryMethod}
              onChange={(v) => updateField('deliveryMethod', v)}
              options={deliveryOptions}
              placeholder="请选择配送方式"
            />
          </FormField>

          {/* ---- 支付方式 ---- */}
          <Divider style={{ margin: '20px 0 16px' }} />

          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            支付方式
          </h3>

          <div
            data-testid="payment-methods"
            style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}
          >
            {paymentOptions.map((opt) => (
              <PaymentMethodCard
                key={opt.value}
                option={opt}
                selected={formData.paymentMethod === opt.value}
                onSelect={handlePaymentSelect}
              />
            ))}
          </div>
          {errors.paymentMethod && (
            <p
              data-testid="payment-error"
              style={{ fontSize: 12, color: '#fca5a5', margin: '4px 0 0' }}
            >
              {errors.paymentMethod}
            </p>
          )}

          {/* ---- 备注 ---- */}
          <Divider style={{ margin: '20px 0 16px' }} />
          <FormField label="备注" helper="选填，不超过200字">
            <textarea
              data-testid="textarea-remark"
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

          {/* ---- 同意条款 ---- */}
          <div style={{ margin: '12px 0' }}>
            <Checkbox
              data-testid="checkbox-terms"
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

          {/* ---- 提交反馈 ---- */}
          {submitResult && (
            <div style={{ marginBottom: 16 }}>
              <FormSubmitFeedback
                success={submitResult.success ? (submitResult.message ?? '提交成功') : undefined}
                error={!submitResult.success ? (submitResult.message ?? '提交失败') : undefined}
              />
            </div>
          )}

          {/* ---- 提交按钮 ---- */}
          <div style={{ display: 'flex', gap: 10 }}>
            <SubmitButton
              data-testid="btn-submit"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !canCheckout}
              variant="primary"
              style={{ flex: 1 }}
            >
              {isSubmitting ? '正在提交...' : `确认支付 ¥${total.toFixed(2)}`}
            </SubmitButton>

            <Button
              data-testid="btn-reset"
              onClick={handleReset}
              variant="ghost"
              size="sm"
              style={{ whiteSpace: 'nowrap' }}
            >
              重置
            </Button>
          </div>

          {!canCheckout && (
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <p
                data-testid="empty-cart-hint"
                style={{
                  fontSize: 12,
                  color: '#fbbf24',
                  margin: '0 0 8px',
                }}
              >
                当前未发现真实结算草稿，请先从收银页选择商品后再进入结算
              </p>
              <Button variant="outline" size="sm" onClick={() => router.push('/cashier')}>
                去收银页选商品
              </Button>
            </div>
          )}

          {submitResult?.success && (
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <Button onClick={handleReset} variant="outline" size="sm">
                继续购物
              </Button>
            </div>
          )}
        </div>

        {/* ==================== 右侧：订单摘要 ==================== */}
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
          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>
            商品清单
          </h3>
          <p
            data-testid="cart-item-count"
            style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}
          >
            共 {activeItems.length} 种商品 / {itemCount} 件
          </p>

          {/* ---- 可编辑商品列表 ---- */}
          <div style={{ marginBottom: 16, maxHeight: 360, overflowY: 'auto' }}>
            {activeItems.length === 0 ? (
              <div
                data-testid="cart-empty"
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                当前没有真实商品，请从收银页带入结算草稿
              </div>
            ) : (
              activeItems.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                />
              ))
            )}
          </div>

          {/* ---- 优惠券 ---- */}
          <Divider style={{ margin: '8px 0 12px' }} />
          <div data-testid="coupon-section" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Input
                data-testid="input-coupon"
                value={formData.couponCode}
                onChange={(e) => updateField('couponCode', e.target.value)}
                placeholder="输入优惠券码"
                style={{ flex: 1 }}
                size="sm"
              />
              {couponStatus?.valid ? (
                <Button
                  data-testid="btn-remove-coupon"
                  onClick={handleRemoveCoupon}
                  variant="ghost"
                  size="sm"
                  style={{ color: '#f87171', whiteSpace: 'nowrap' }}
                >
                  移除
                </Button>
              ) : (
                <Button
                  data-testid="btn-apply-coupon"
                  onClick={handleApplyCoupon}
                  variant="outline"
                  size="sm"
                  disabled={!formData.couponCode.trim() || couponLoading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {couponLoading ? '验证中...' : '使用'}
                </Button>
              )}
            </div>
            {couponStatus && (
              <p
                data-testid="coupon-status"
                style={{
                  fontSize: 11,
                  margin: '4px 0 0',
                  color: couponStatus.valid ? '#4ade80' : '#fca5a5',
                }}
              >
                {couponStatus.valid ? '✓ ' : '✗ '}
                {couponStatus.message}
              </p>
            )}
          </div>

          {/* ---- 会员权益 ---- */}
          <Divider style={{ margin: '8px 0 12px' }} />
          <div data-testid="member-benefits-section" style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
              🎫 会员权益
            </div>
            {memberBalance ? (
              <div style={{
                padding: 10, borderRadius: 8,
                background: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  <span>可用余额</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>¥{(memberBalance.balance / 100).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                  <span>可用积分</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>{memberBalance.points} 分</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                  <span>可用优惠券</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>{memberBalance.couponCount} 张</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#64748b' }}>
                登录后可查看会员权益
              </div>
            )}
          </div>

          {/* ---- 金额汇总 ---- */}
          <Divider style={{ margin: '8px 0 12px' }} />
          <div
            data-testid="price-summary"
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8' }}>
              <span>商品小计</span>
              <span data-testid="subtotal-amount">¥{subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#94a3b8' }}>
              <span>配送费</span>
              <span data-testid="shipping-fee">
                {formData.deliveryMethod === 'pickup'
                  ? '免运费（自提）'
                  : shippingFee === 0
                    ? '免运费'
                    : `¥${shippingFee.toFixed(2)}`}
              </span>
            </div>

            {couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4ade80' }}>
                <span>优惠减免</span>
                <span data-testid="coupon-discount" style={{ fontWeight: 500 }}>
                  -¥{couponDiscount.toFixed(2)}
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 16,
                fontWeight: 700,
                color: '#fbbf24',
                paddingTop: 10,
                marginTop: 4,
                borderTop: '1px solid rgba(148,163,184,0.15)',
              }}
            >
              <span>合计</span>
              <span data-testid="total-amount">¥{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
