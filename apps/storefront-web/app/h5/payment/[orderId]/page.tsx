/**
 * h5/payment/[orderId]/page.tsx — 扫码支付页面
 * Phase-FP T-FP-027 · 2026-07-02
 */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  MobileLayout,
  H5Card,
  H5Badge,
  H5Button,
  useH5Back,
} from '../../../../components/h5-components';
import {
  paymentService,
  formatPrice,
  getPaymentMethodName,
  getPaymentMethodIcon,
  type PaymentOrder,
  type PaymentMethod,
} from '../../../../lib/payment-service';

const PAYMENT_METHODS: { method: PaymentMethod; name: string; icon: string }[] = [
  { method: 'wechat', name: '微信支付', icon: '💚' },
  { method: 'alipay', name: '支付宝', icon: '💙' },
  { method: 'bankcard', name: '银行卡', icon: '💳' },
  { method: 'points', name: '积分支付', icon: '⭐' },
];

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const handleBack = useH5Back();

  const [payment, setPayment] = useState<PaymentOrder | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('wechat');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 初始化支付订单
  useEffect(() => {
    async function createPaymentOrder() {
      setError(null);
      setLoading(true);
      // 模拟创建支付订单
      const mockAmount = 9999; // 99.99元
      const result = await paymentService.createPayment({
        orderId: orderId || `order-${Date.now()}`,
        amount: mockAmount,
        method: selectedMethod,
      });

      if (!result.success) {
        setError(result.error?.message || '创建支付订单失败，请稍后重试');
        setLoading(false);
        return;
      }

      if (result.data) {
        setPayment(result.data);
        // 设置倒计时
        if (result.data.expireAt) {
          const expireTime = new Date(result.data.expireAt).getTime();
          const updateCountdown = () => {
            const remaining = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
            setCountdown(remaining);
            if (remaining === 0) {
              setPayment((p) => p ? { ...p, status: 'expired' } : p);
            }
          };
          updateCountdown();
          const timer = setInterval(updateCountdown, 1000);
          return () => clearInterval(timer);
        }
      }
      setLoading(false);
    }

    createPaymentOrder();
  }, [orderId]);

  // 切换支付方式
  function handleMethodChange(method: PaymentMethod) {
    setSelectedMethod(method);
  }

  // 发起支付
  async function handlePay() {
    setCreating(true);
    // 模拟支付
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setCreating(false);
    // 跳转到支付结果页
    router.push(`/h5/payment/${orderId}/result?status=success`);
  }

  // 取消支付
  function handleCancel() {
    handleBack();
  }

  if (error) {
    return (
      <MobileLayout title="订单支付" showBack onBack={handleBack}>
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: '#f87171',
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>加载失败</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{error}</div>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 14, cursor: 'pointer' }}
          >
            重新加载
          </button>
        </div>
      </MobileLayout>
    );
  }

  if (loading) {
    return (
      <MobileLayout title="订单支付" showBack onBack={handleBack}>
        <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
          正在创建支付订单...
        </div>
      </MobileLayout>
    );
  }

  if (!loading && !error && !payment) {
    return (
      <MobileLayout title="订单支付" showBack onBack={handleBack}>
        <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
          订单不存在
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      title="订单支付"
      subtitle={`订单号: ${payment.orderCode}`}
      showBack
      onBack={handleBack}
      showNav={false}
    >
      {/* 订单金额 */}
      <H5Card style={{ marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>应付金额</div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#f8fafc',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {formatPrice(payment.amount)}
        </div>
        {payment.originalAmount && (
          <div style={{ marginTop: 8, fontSize: 14, color: '#64748b' }}>
            原价: <s>{formatPrice(payment.originalAmount)}</s>
          </div>
        )}
      </H5Card>

      {/* 支付倒计时 */}
      {countdown > 0 && (
        <H5Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>⏱️</span>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>二维码有效期</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: countdown < 60 ? '#ef4444' : '#f8fafc' }}>
                {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
              </div>
            </div>
          </div>
        </H5Card>
      )}

      {/* 支付二维码 */}
      {payment.qrCode && payment.status === 'pending' && (
        <H5Card style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>
            请使用{getPaymentMethodName(selectedMethod)}扫码支付
          </div>
          <div
            style={{
              display: 'inline-block',
              padding: 16,
              background: '#fff',
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Image
              src={payment.qrCode}
              alt="支付二维码"
              width={180}
              height={180}
              unoptimized
            />
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            打开{getPaymentMethodName(selectedMethod)}扫一扫完成支付
          </div>
        </H5Card>
      )}

      {/* 支付状态 */}
      {payment.status !== 'pending' && (
        <H5Card style={{ marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {payment.status === 'paid' ? '✅' : payment.status === 'expired' ? '⏰' : '❌'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#f8fafc', marginBottom: 8 }}>
            {payment.status === 'paid' ? '支付成功' : payment.status === 'expired' ? '二维码已过期' : '支付失败'}
          </div>
          <H5Button variant="outline" onClick={handleCancel}>
            返回
          </H5Button>
        </H5Card>
      )}

      {/* 支付方式选择 */}
      <H5Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginBottom: 12 }}>
          选择支付方式
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {PAYMENT_METHODS.map(({ method, name, icon }) => (
            <div
              key={method}
              onClick={() => handleMethodChange(method)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 10,
                background:
                  selectedMethod === method
                    ? 'rgba(102, 126, 234, 0.15)'
                    : 'rgba(15, 23, 42, 0.4)',
                border: `1px solid ${selectedMethod === method ? 'rgba(102, 126, 234, 0.4)' : 'rgba(148, 163, 184, 0.15)'}`,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 24 }}>{icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#f8fafc' }}>{name}</span>
              {selectedMethod === method && (
                <span style={{ color: '#667eea', fontSize: 18 }}>✓</span>
              )}
            </div>
          ))}
        </div>
      </H5Card>

      {/* 支付按钮 */}
      {payment.status === 'pending' && (
        <div style={{ display: 'flex', gap: 12 }}>
          <H5Button variant="secondary" fullWidth onClick={handleCancel}>
            取消支付
          </H5Button>
          <H5Button variant="primary" fullWidth loading={creating} onClick={handlePay}>
            确认支付 {formatPrice(payment.amount)}
          </H5Button>
        </div>
      )}

      {/* 底部说明 */}
      <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#64748b' }}>
        支付完成后，如有问题请联系客服
      </div>
    </MobileLayout>
  );
}
