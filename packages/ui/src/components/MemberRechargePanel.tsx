'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 充值方案 */
export interface RechargePlan {
  /** 方案 ID */
  id: string;
  /** 方案名称 */
  name: string;
  /** 充值金额 (分) */
  amount: number;
  /** 赠送金额 (分) */
  bonus: number;
  /** 是否推荐 */
  recommended?: boolean;
  /** 额外积分赠送 */
  bonusPoints?: number;
  /** 到期天数 */
  expiryDays?: number;
}

/** 充值方式 */
export type RechargePaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card' | 'points';

/** 充值记录 */
export interface RechargeRecord {
  id: string;
  memberName: string;
  memberPhone: string;
  amount: number;
  bonus: number;
  paymentMethod: RechargePaymentMethod;
  createdAt: string;
  operator: string;
  status: 'success' | 'failed' | 'pending';
}

/** 会员充值面板属性 */
export interface MemberRechargePanelProps {
  /** 会员姓名 */
  memberName: string;
  /** 会员手机号 */
  memberPhone: string;
  /** 会员等级 */
  memberTier?: string;
  /** 当前余额 (分) */
  currentBalance: number;
  /** 充值方案列表 */
  plans: RechargePlan[];
  /** 最近充值记录 */
  recentRecords?: RechargeRecord[];
  /** 是否显示自定义金额输入 */
  customAmount?: boolean;
  /** 支付方式列表 */
  paymentMethods?: RechargePaymentMethod[];
  /** 已选方案 ID */
  selectedPlanId?: string | null;
  /** 自定义金额 (元) */
  customAmountValue?: string;
  /** 已选支付方式 */
  selectedPaymentMethod?: RechargePaymentMethod;
  /** 是否提交中 */
  submitting?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 充值成功 */
  success?: boolean;
  /** 方案选择回调 */
  onPlanSelect?: (planId: string) => void;
  /** 自定义金额变更 */
  onCustomAmountChange?: (value: string) => void;
  /** 支付方式变更 */
  onPaymentMethodChange?: (method: RechargePaymentMethod) => void;
  /** 充值提交 */
  onRecharge?: () => void;
  /** 关闭成功提示 */
  onDismissSuccess?: () => void;
  /** 关闭错误提示 */
  onDismissError?: () => void;
  /** 类名 */
  className?: string;
}

// ==================== 工具函数 ====================

const paymentMethodLabels: Record<RechargePaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  card: '银行卡',
  points: '积分兑换',
};

const paymentMethodIcons: Record<RechargePaymentMethod, string> = {
  wechat: '💚',
  alipay: '💙',
  cash: '💵',
  card: '💳',
  points: '⭐',
};

/** 格式化金额（分 → 元） */
export function formatAmount(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

/** 格式化手机号 */
export function formatPhone(phone: string): string {
  if (phone.length === 11) {
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  }
  return phone;
}

// ==================== 子组件 ====================

/** 支付方式选择按钮 */
function PaymentMethodButton({
  method,
  selected,
  onSelect,
}: {
  method: RechargePaymentMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-active={selected || undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderRadius: 8,
        border: `2px solid ${selected ? '#6366f1' : '#e5e7eb'}`,
        background: selected ? '#eef2ff' : '#fff',
        color: selected ? '#6366f1' : '#374151',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: selected ? 600 : 400,
        transition: 'all 0.15s',
      }}
      aria-pressed={selected}
    >
      <span style={{ fontSize: 18 }}>{paymentMethodIcons[method]}</span>
      <span>{paymentMethodLabels[method]}</span>
    </button>
  );
}

/** 充值方案卡片 */
function RechargePlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: RechargePlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-selected={selected || undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '16px 12px',
        borderRadius: 12,
        border: `2px solid ${selected ? '#6366f1' : plan.recommended ? '#f59e0b' : '#e5e7eb'}`,
        background: selected
          ? '#eef2ff'
          : plan.recommended
            ? '#fffbeb'
            : '#fff',
        cursor: 'pointer',
        minWidth: 120,
        position: 'relative',
        transition: 'all 0.15s',
      }}
      aria-pressed={selected}
    >
      {plan.recommended && (
        <span
          style={{
            position: 'absolute',
            top: -10,
            background: '#f59e0b',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 10,
          }}
        >
          推荐
        </span>
      )}
      <span style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
        {formatAmount(plan.amount)}
      </span>
      {plan.bonus > 0 && (
        <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
          +{formatAmount(plan.bonus)}
        </span>
      )}
      {plan.bonusPoints && plan.bonusPoints > 0 ? (
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          赠 {plan.bonusPoints} 积分
        </span>
      ) : null}
      {plan.expiryDays ? (
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {plan.expiryDays}天有效
        </span>
      ) : null}
    </button>
  );
}

// ==================== 主组件 ====================

export function MemberRechargePanel({
  memberName,
  memberPhone,
  memberTier,
  currentBalance,
  plans,
  recentRecords,
  customAmount = true,
  paymentMethods = ['wechat', 'alipay'],
  selectedPlanId,
  customAmountValue,
  selectedPaymentMethod = paymentMethods[0] ?? 'wechat',
  submitting = false,
  loading = false,
  error,
  success = false,
  onPlanSelect,
  onCustomAmountChange,
  onPaymentMethodChange,
  onRecharge,
  onDismissSuccess,
  onDismissError,
  className,
}: MemberRechargePanelProps) {
  const finalAmount = selectedPlanId
    ? plans.find((p) => p.id === selectedPlanId)?.amount ?? 0
    : customAmount && customAmountValue
      ? parseInt(customAmountValue, 10) * 100 || 0
      : 0;

  const isValid = finalAmount > 0 && !submitting && !loading;

  return (
    <div
      className={className}
      style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      role="region"
      aria-label="会员充值"
    >
      {/* 头部信息 */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
            {memberName}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {formatPhone(memberPhone)}
          </div>
          {memberTier && (
            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                padding: '2px 10px',
                borderRadius: 10,
                background: '#fef3c7',
                color: '#92400e',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {memberTier}
            </span>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>当前余额</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>
            {formatAmount(currentBalance)}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {/* 充值方案 */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 12,
            }}
          >
            选择充值方案
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}
            role="radiogroup"
            aria-label="充值方案"
          >
            {plans.map((plan) => (
              <RechargePlanCard
                key={plan.id}
                plan={plan}
                selected={selectedPlanId === plan.id}
                onSelect={() => onPlanSelect?.(plan.id)}
              />
            ))}
          </div>
        </div>

        {/* 自定义金额 */}
        {customAmount && (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
              }}
            >
              自定义金额 (元)
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 18, color: '#6b7280' }}>¥</span>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="输入金额"
                value={customAmountValue ?? ''}
                onChange={(e) => onCustomAmountChange?.(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 16,
                  outline: 'none',
                }}
                aria-label="自定义充值金额"
              />
            </div>
          </div>
        )}

        {/* 支付方式 */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8,
            }}
          >
            支付方式
          </div>
          <div
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
            role="radiogroup"
            aria-label="支付方式"
          >
            {paymentMethods.map((method) => (
              <PaymentMethodButton
                key={method}
                method={method}
                selected={selectedPaymentMethod === method}
                onSelect={() => onPaymentMethodChange?.(method)}
              />
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            role="alert"
          >
            <span>{error}</span>
            {onDismissError && (
              <button
                type="button"
                onClick={onDismissError}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                关闭
              </button>
            )}
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#f0fdf4',
              color: '#16a34a',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
            role="alert"
          >
            <span>✅ 充值成功！</span>
            {onDismissSuccess && (
              <button
                type="button"
                onClick={onDismissSuccess}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#16a34a',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                关闭
              </button>
            )}
          </div>
        )}

        {/* 确认充值按钮 */}
        <button
          type="button"
          onClick={onRecharge}
          disabled={!isValid}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: 12,
            border: 'none',
            background: isValid ? '#6366f1' : '#e5e7eb',
            color: isValid ? '#fff' : '#9ca3af',
            fontSize: 16,
            fontWeight: 700,
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {submitting || loading
            ? '充值中...'
            : `确认充值 ${finalAmount > 0 ? formatAmount(finalAmount) : ''}`}
        </button>

        {/* 最近充值记录 */}
        {recentRecords && recentRecords.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: 8,
              }}
            >
              最近充值记录
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: '#6b7280' }}>时间</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px', color: '#6b7280' }}>金额</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px', color: '#6b7280' }}>方式</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px', color: '#6b7280' }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentRecords ?? []).slice(0, 5).map((record) => (
                    <tr
                      key={record.id}
                      style={{ borderBottom: '1px solid #f3f4f6' }}
                    >
                      <td style={{ padding: '8px 4px', color: '#6b7280' }}>
                        {record.createdAt}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>
                        +{formatAmount(record.amount + record.bonus)}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        {paymentMethodLabels[record.paymentMethod]}
                      </td>
                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              record.status === 'success'
                                ? '#f0fdf4'
                                : record.status === 'failed'
                                  ? '#fef2f2'
                                  : '#fefce8',
                            color:
                              record.status === 'success'
                                ? '#16a34a'
                                : record.status === 'failed'
                                  ? '#dc2626'
                                  : '#ca8a04',
                          }}
                        >
                          {record.status === 'success'
                            ? '成功'
                            : record.status === 'failed'
                              ? '失败'
                              : '处理中'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberRechargePanel;
