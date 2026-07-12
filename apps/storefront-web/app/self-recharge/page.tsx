/**
 * 自助充值 — P-37 Self-Service Recharge (立式触屏机)
 * 角色: 🛒 前台顾客自助
 * 功能: 选择充值金额、选择支付方式、扫码支付、充值成功
 */
'use client';

import React, { useState } from 'react';

import {
  PageShell,
  Button,
  Card,
  Tag,
  InputNumber,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card';
type RechargeStep = 'select' | 'payment' | 'success';

interface AmountOption {
  label: string;
  value: number;
  bonus?: number;
  popular?: boolean;
}

// ============================================================
// 常量
// ============================================================

const AMOUNT_OPTIONS: AmountOption[] = [
  { label: '¥50', value: 50, bonus: 5 },
  { label: '¥100', value: 100, bonus: 15, popular: true },
  { label: '¥200', value: 200, bonus: 35 },
  { label: '¥500', value: 500, bonus: 100, popular: true },
  { label: '¥1000', value: 1000, bonus: 250 },
];

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'wechat', label: '微信支付', icon: '💚' },
  { key: 'alipay', label: '支付宝', icon: '💙' },
  { key: 'cash', label: '现金支付', icon: '💵' },
  { key: 'card', label: '刷卡', icon: '💳' },
];

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金支付',
  card: '刷卡',
};

// ============================================================
// 组件
// ============================================================

export default function SelfRechargePage() {
  const [step, setStep] = useState<RechargeStep>('select');
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 实际金额 = 选择金额 + 自定义金额
  const totalAmount = selectedAmount + (customAmount || 0);

  // 计算赠送
  const bonusAmount = selectedAmount >= 500 ? 100
    : selectedAmount >= 200 ? 35
    : selectedAmount >= 100 ? 15
    : selectedAmount >= 50 ? 5
    : 0;

  // 选择金额
  const handleSelectAmount = (value: number) => {
    setSelectedAmount(value);
    setCustomAmount(0);
    setError(null);
  };

  // 自定义金额
  const handleCustomAmount = (value: number | null) => {
    setCustomAmount(value ?? 0);
    setSelectedAmount(0);
    setError(null);
  };

  // 选择支付方式 → 模拟支付
  const handlePay = (method: PaymentMethod) => {
    if (totalAmount <= 0) {
      setError('请选择充值金额');
      return;
    }
    setPaymentMethod(method);
    setProcessing(true);
    setError(null);

    // 模拟支付过程
    setTimeout(() => {
      setProcessing(false);
      setStep('success');
    }, 2000);
  };

  // 重新充值
  const handleRecharge = () => {
    setStep('select');
    setSelectedAmount(0);
    setCustomAmount(0);
    setPaymentMethod(null);
    setError(null);
  };

  // ============================================================
  // Step 1: 选择金额
  // ============================================================
  if (step === 'select') {
    return (
      <main style={{
        minHeight: '100vh',
        padding: '32px 16px',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: 480, width: '100%' }}>

          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>💰</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              自助充值 — P-37
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
              选择充值金额或输入自定义金额
            </p>
          </div>

          {/* 快捷金额 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 20,
          }}>
            {AMOUNT_OPTIONS.map(opt => {
              const active = selectedAmount === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelectAmount(opt.value)}
                  style={{
                    padding: '20px 16px',
                    borderRadius: 16,
                    background: active
                      ? 'linear-gradient(135deg, #f59e0b40, #d9770620)'
                      : 'rgba(30, 41, 59, 0.8)',
                    border: active
                      ? '2px solid #f59e0b'
                      : '1px solid rgba(148, 163, 184, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    position: 'relative',
                  }}
                >
                  {opt.popular && (
                    <Tag style={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      background: '#f59e0b',
                      color: '#0f172a',
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 8,
                    }}>
                      热门
                    </Tag>
                  )}
                  <div style={{ fontSize: 28, fontWeight: 700, color: active ? '#fbbf24' : '#f8fafc' }}>
                    {opt.label}
                  </div>
                  {(opt.bonus ?? 0) > 0 && (
                    <div style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: '#34d399',
                      background: 'rgba(52, 211, 153, 0.1)',
                      borderRadius: 8,
                      padding: '4px 8px',
                      display: 'inline-block',
                    }}>
                      +送{opt.bonus ?? 0}元
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 自定义金额 */}
          <Card
            style={{
              borderRadius: 16,
              marginBottom: 20,
              background: 'rgba(15, 23, 42, 0.8)',
              border: customAmount > 0 ? '1px solid #f59e0b40' : '1px solid rgba(148, 163, 184, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#94a3b8', fontSize: 14, whiteSpace: 'nowrap' }}>自定义金额</span>
              <div style={{ flex: 1 }}>
                <InputNumber
                  value={customAmount || undefined}
                  onChange={handleCustomAmount}
                  min={1}
                  max={9999}
                  placeholder="输入金额"
                  prefix="¥"
                />
              </div>
            </div>
          </Card>

          {/* 金额汇总 */}
          <Card
            style={{
              borderRadius: 16,
              marginBottom: 24,
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.05))',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>充值金额</div>
                <div style={{ color: '#fbbf24', fontSize: 32, fontWeight: 700 }}>
                  ¥{totalAmount || 0}
                </div>
                {selectedAmount > 0 && bonusAmount > 0 && (
                  <div style={{ color: '#34d399', fontSize: 13, marginTop: 4 }}>
                    赠送 ¥{bonusAmount} · 实际到账 ¥{totalAmount + bonusAmount}
                  </div>
                )}
              </div>
              {(selectedAmount > 0 || customAmount > 0) && (
                <Tag style={{ background: '#f59e0b', color: '#0f172a', border: 'none', fontSize: 12 }}>
                  {totalAmount >= 100 ? '🎉 赠送' : '继续'}
                </Tag>
              )}
            </div>
          </Card>

          {/* 错误提示 */}
          {error && (
            <div style={{
              textAlign: 'center',
              color: '#f87171',
              fontSize: 13,
              marginBottom: 16,
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 8,
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}>
              {error}
            </div>
          )}

          {/* 下一步按钮 */}
          <Button
            
            block
            disabled={totalAmount <= 0}
            onClick={() => {
              if (totalAmount <= 0) {
                setError('请选择充值金额');
                return;
              }
              setStep('payment');
            }}
            style={{
              height: 52,
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              background: totalAmount > 0
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : undefined,
              border: 'none',
              color: '#0f172a',
            }}
          >
            下一步 · 选择支付方式
          </Button>
        </div>
      </main>
    );
  }

  // ============================================================
  // Step 2: 选择支付方式
  // ============================================================
  if (step === 'payment') {
    return (
      <main style={{
        minHeight: '100vh',
        padding: '32px 16px',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ maxWidth: 480, width: '100%' }}>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              选择支付方式
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
              充值 ¥{totalAmount} {bonusAmount > 0 ? `· 赠送 ¥${bonusAmount}` : ''}
            </p>
          </div>

          {/* 金额回顾 */}
          <Card
            style={{
              borderRadius: 16,
              marginBottom: 24,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>支付金额</div>
            <div style={{ color: '#fbbf24', fontSize: 40, fontWeight: 700 }}>
              ¥{totalAmount}
            </div>
            {bonusAmount > 0 && (
              <div style={{ color: '#34d399', fontSize: 13, marginTop: 4 }}>
                到账 ¥{totalAmount + bonusAmount}（含赠送 {bonusAmount}）
              </div>
            )}
          </Card>

          {/* 支付方式 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {PAYMENT_METHODS.map(method => (
              <button
                key={method.key}
                onClick={() => !processing && handlePay(method.key)}
                disabled={processing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 20px',
                  borderRadius: 14,
                  background: paymentMethod === method.key && processing
                    ? 'rgba(52, 211, 153, 0.1)'
                    : 'rgba(30, 41, 59, 0.8)',
                  border: paymentMethod === method.key && processing
                    ? '2px solid #34d399'
                    : '1px solid rgba(148, 163, 184, 0.12)',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 28 }}>{method.icon}</span>
                <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>
                  {method.label}
                </span>
                <span style={{ color: '#64748b', fontSize: 14 }}>›</span>
              </button>
            ))}
          </div>

          {/* 支付处理中 */}
          {processing && (
            <div style={{
              textAlign: 'center',
              padding: 16,
              background: 'rgba(52, 211, 153, 0.1)',
              borderRadius: 12,
              border: '1px solid rgba(52, 211, 153, 0.2)',
            }}>
              <div style={{ fontSize: 16, color: '#34d399', marginBottom: 4 }}>
                ⏳ 支付处理中...
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                请使用 {paymentMethod ? PAYMENT_LABELS[paymentMethod] : ''} 扫码付款
              </div>
            </div>
          )}

          {/* 返回按钮 */}
          <Button
            block
            variant="outline"
            onClick={() => { setStep('select'); setError(null); }}
            disabled={processing}
            style={{
              marginTop: 16,
              color: '#64748b',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              height: 44,
              borderRadius: 10,
            }}
          >
            ← 返回修改金额
          </Button>
        </div>
      </main>
    );
  }

  // ============================================================
  // Step 3: 充值成功
  // ============================================================
  return (
    <main style={{
      minHeight: '100vh',
      padding: '32px 16px',
      background: '#0f172a',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>

        {/* 成功动画 */}
        <div style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #34d39940, #05966920)',
          border: '3px solid #34d39960',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: 44,
        }}>
          ✅
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
          充值成功！
        </h2>

        <Card
          style={{
            borderRadius: 16,
            marginTop: 24,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#94a3b8', fontSize: 14 }}>
            <span>支付金额</span>
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>¥{totalAmount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#94a3b8', fontSize: 14 }}>
            <span>赠送金额</span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>¥{bonusAmount}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '12px 0', marginTop: 8,
            borderTop: '1px solid rgba(148, 163, 184, 0.1)',
          }}>
            <span style={{ color: '#f8fafc', fontSize: 14, fontWeight: 600 }}>实际到账</span>
            <span style={{ color: '#34d399', fontSize: 24, fontWeight: 700 }}>
              ¥{totalAmount + bonusAmount}
            </span>
          </div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
            支付方式：{paymentMethod ? PAYMENT_LABELS[paymentMethod] : ''}
          </div>
        </Card>

        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <Button
            block
            
            onClick={handleRecharge}
            style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              color: '#0f172a',
              height: 48,
              borderRadius: 12,
              fontWeight: 600,
            }}
          >
            继续充值
          </Button>
          <Button
            block
            
            variant="outline"
            onClick={() => window.location.href = '/'}
            style={{
              borderColor: 'rgba(148, 163, 184, 0.2)',
              color: '#94a3b8',
              height: 48,
              borderRadius: 12,
            }}
          >
            返回首页
          </Button>
        </div>
      </div>
    </main>
  );
}
