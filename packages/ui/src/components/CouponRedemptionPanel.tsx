'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';

// ---- 类型定义 ----

/** 优惠券/卡券类型 */
export type CouponType = 'discount' | 'cash_voucher' | 'product_free' | 'shipping_free';

/** 优惠券状态 */
export type CouponStatus = 'active' | 'used' | 'expired' | 'frozen';

/** 单张优惠券 */
export interface CouponEntry {
  /** 券号 */
  code: string;
  /** 券类型 */
  type: CouponType;
  /** 券名称 */
  name: string;
  /** 面额/折扣描述 */
  value: string;
  /** 门槛描述 */
  threshold?: string;
  /** 状态 */
  status: CouponStatus;
  /** 有效期: 领取时间 */
  issuedAt: string;
  /** 有效期: 截止时间 */
  expiresAt: string;
}

/** 兑换请求 */
export interface RedemptionRequest {
  /** 券码 */
  code: string;
  /** 当前订单金额 */
  orderAmount: number;
}

/** 兑换结果 */
export interface RedemptionResult {
  /** 是否成功 */
  success: boolean;
  /** 优惠券信息 */
  coupon?: CouponEntry;
  /** 优惠金额 */
  discountAmount?: number;
  /** 折扣后金额 */
  finalAmount?: number;
  /** 失败原因 */
  errorMessage?: string;
  /** 处理时间 */
  processedAt: string;
}

/** 兑换汇总 */
export interface RedemptionSummary {
  /** 今日兑换次数 */
  todayCount: number;
  /** 今日优惠总额 */
  todayDiscountTotal: number;
  /** 可用券数 */
  availableCount: number;
  /** 即将过期券数(48h内) */
  expiringSoonCount: number;
}

export interface CouponRedemptionPanelProps {
  /** 优惠券列表 */
  coupons: CouponEntry[];
  /** 兑换汇总 */
  summary: RedemptionSummary;
  /** 最近兑换结果 */
  lastResult?: RedemptionResult;
  /** 兑换额度检查 */
  orderAmount: number;
  /** 是否加载中 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 输入框 placeholder */
  inputPlaceholder?: string;
  /** 兑换按钮文字 */
  redeemButtonText?: string;
  /** 输入框值 */
  inputValue?: string;
  /** 输入框变更回调 */
  onInputChange?: (value: string) => void;
  /** 兑换回调 */
  onRedeem?: (code: string) => void;
  /** 重新加载 */
  onRetry?: () => void;
}

// ---- 工具函数 ----

const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  discount: '折扣券',
  cash_voucher: '代金券',
  product_free: '免品券',
  shipping_free: '免运费',
};

const COUPON_TYPE_COLORS: Record<CouponType, StatusBadgeVariant> = {
  discount: 'info',
  cash_voucher: 'success',
  product_free: 'warning',
  shipping_free: 'pending',
};

const COUPON_STATUS_LABELS: Record<CouponStatus, string> = {
  active: '可用',
  used: '已使用',
  expired: '已过期',
  frozen: '冻结',
};

type StatusBadgeVariant = 'default' | 'danger' | 'neutral' | 'pending' | 'info' | 'warning' | 'error' | 'success';

const COUPON_STATUS_SEVERITIES: Record<CouponStatus, StatusBadgeVariant> = {
  active: 'success',
  used: 'default',
  expired: 'error',
  frozen: 'warning',
};

function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

// ---- 组件 ----

export const CouponRedemptionPanel: React.FC<CouponRedemptionPanelProps> = ({
  coupons,
  summary,
  lastResult,
  orderAmount,
  loading = false,
  error,
  inputPlaceholder = '输入优惠券码',
  redeemButtonText = '兑换',
  inputValue = '',
  onInputChange,
  onRedeem,
  onRetry,
}) => {
  const summaryItems: QuickStatItem[] = [
    {
      label: '今日兑换',
      value: `${summary.todayCount}`,
      helper: summary.todayDiscountTotal > 0 ? formatCurrency(summary.todayDiscountTotal) : undefined,
    },
    {
      label: '可用券',
      value: `${summary.availableCount}`,
      helper: summary.expiringSoonCount > 0 ? `${summary.expiringSoonCount}即将过期` : undefined,
    },
    { label: '订单金额', value: formatCurrency(orderAmount) },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onRedeem) {
      onRedeem(inputValue.trim());
    }
  };

  return (
    <div className="coupon-redemption-panel" data-testid="coupon-redemption-panel">
      {/* 头部汇总 */}
      <QuickStats items={summaryItems} columns={3} />

      {/* 错误状态 */}
      {error && (
        <div className="coupon-redemption-error" role="alert" data-testid="redemption-error">
          <span>{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="coupon-redemption-retry-btn"
              data-testid="retry-btn"
            >
              重试
            </button>
          )}
        </div>
      )}

      {/* 兑换输入 */}
      <form className="coupon-redemption-form" onSubmit={handleSubmit} data-testid="redemption-form">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange?.(e.target.value)}
          placeholder={inputPlaceholder}
          disabled={loading}
          className="coupon-redemption-input"
          data-testid="coupon-code-input"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          className="coupon-redemption-redeem-btn"
          data-testid="redeem-btn"
        >
          {loading ? '处理中...' : redeemButtonText}
        </button>
      </form>

      {/* 兑换结果反馈 */}
      {lastResult && (
        <div
          className={`coupon-redemption-result ${lastResult.success ? 'success' : 'failure'}`}
          data-testid="redemption-result"
        >
          {lastResult.success ? (
            <div>
              <p data-testid="result-success-text">
                兑换成功! 优惠: {lastResult.discountAmount ? formatCurrency(lastResult.discountAmount) : lastResult.coupon?.value}
                {lastResult.finalAmount != null && ` → 实付: ${formatCurrency(lastResult.finalAmount)}`}
              </p>
            </div>
          ) : (
            <p data-testid="result-error-text">
              兑换失败: {lastResult.errorMessage || '未知错误'}
            </p>
          )}
        </div>
      )}

      {/* 优惠券列表 */}
      <div className="coupon-redemption-list" data-testid="coupon-list">
        <h4 className="coupon-list-title">我的优惠券 ({coupons.length})</h4>
        {coupons.length === 0 && !loading && (
          <p className="coupon-empty" data-testid="coupon-empty">暂无优惠券</p>
        )}
        {loading && (
          <p className="coupon-loading" data-testid="coupon-loading">加载中...</p>
        )}
        {coupons.map((coupon) => (
          <div
            key={coupon.code}
            className={`coupon-card coupon-status-${coupon.status}`}
            data-testid={`coupon-card-${coupon.code}`}
          >
            <div className="coupon-card-header">
              <StatusBadge label={COUPON_STATUS_LABELS[coupon.status]} variant={COUPON_STATUS_SEVERITIES[coupon.status]} />
              <StatusBadge label={COUPON_TYPE_LABELS[coupon.type]} variant={COUPON_TYPE_COLORS[coupon.type]} />
            </div>
            <div className="coupon-card-body">
              <span className="coupon-value" data-testid={`coupon-value-${coupon.code}`}>
                {coupon.value}
              </span>
              <span className="coupon-name">{coupon.name}</span>
              {coupon.threshold && <span className="coupon-threshold">{coupon.threshold}</span>}
            </div>
            <div className="coupon-card-footer">
              <span className="coupon-code" data-testid={`coupon-code-${coupon.code}`}>
                券码: {coupon.code}
              </span>
              <span className="coupon-expiry">有效期至: {coupon.expiresAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouponRedemptionPanel;
