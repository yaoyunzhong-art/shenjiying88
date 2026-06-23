'use client';

import React from 'react';
import { StatusBadge } from './StatusBadge';
import { QuickStats } from './QuickStats';
import type { QuickStatItem } from './QuickStats';

// ---- 类型定义 ----

/** 结账状态 */
export type CheckoutStatus = 'idle' | 'processing' | 'success' | 'failed';

/** 购物篮商品项 */
export interface BasketItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image?: string;
}

/** 支付方式 */
export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card' | 'member_card';

/** 支付方式中文映射 */
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  card: '银行卡',
  member_card: '会员卡',
};

/** 排队叫号项 */
export interface QueueItem {
  id: string;
  number: string;
  customerName?: string;
  type: 'service' | 'pickup' | 'return' | 'consult';
  waitingMinutes: number;
  status: 'waiting' | 'calling' | 'serving';
}

/** 快捷功能按钮 */
export interface QuickFnButton {
  key: string;
  label: string;
  icon?: string;
  highlight?: boolean;
  badge?: number;
  onClick?: () => void;
}

/** 前台操作面板 Props */
export interface FrontDeskPanelProps {
  /** 面板标题 */
  title?: string;
  /** 当前收银员 */
  cashierName?: string;
  /** 班次信息 */
  shiftInfo?: string;
  /** 购物篮商品 */
  basketItems?: BasketItem[];
  /** 结账状态 */
  checkoutStatus?: CheckoutStatus;
  /** 结账错误信息 */
  checkoutError?: string;
  /** 可用支付方式 */
  paymentMethods?: PaymentMethod[];
  /** 已选支付方式 */
  selectedPayment?: PaymentMethod;
  /** 当前排队列表 */
  queue?: QueueItem[];
  /** 快捷功能按钮 */
  quickActions?: QuickFnButton[];
  /** 今日统计 */
  todayStats?: {
    totalOrders: number;
    totalRevenue: number;
    avgCheckoutSec: number;
    pendingPickups: number;
  };
  /** 加载中 */
  loading?: boolean;
  /** 紧凑模式 */
  compact?: boolean;
  /** 结账回调 */
  onCheckout?: (method: PaymentMethod) => void;
  /** 支付方式切换回调 */
  onPaymentChange?: (method: PaymentMethod) => void;
  /** 移除商品回调 */
  onRemoveItem?: (itemId: string) => void;
  /** 清空购物篮回调 */
  onClearBasket?: () => void;
  /** 自定义类名 */
  className?: string;
}

// ---- 样式常量 ----

const PANEL_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 16,
  padding: 20,
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.45)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
  color: '#f8fafc',
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 12,
  borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
};

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#f1f5f9',
};

const SECTION_STYLE: React.CSSProperties = {
  borderRadius: 12,
  background: 'rgba(15, 23, 42, 0.28)',
  border: '1px solid rgba(148, 163, 184, 0.08)',
  padding: 14,
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#cbd5e1',
  marginBottom: 10,
};

const PAYMENT_BTN_BASE: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.15)',
  background: 'rgba(15,23,42,0.3)',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const PAYMENT_BTN_SELECTED: React.CSSProperties = {
  ...PAYMENT_BTN_BASE,
  background: 'rgba(59,130,246,0.2)',
  borderColor: 'rgba(59,130,246,0.4)',
  color: '#93c5fd',
};

const CHECKOUT_BTN_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '14px 0',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const CHECKOUT_DISABLED_STYLE: React.CSSProperties = {
  ...CHECKOUT_BTN_STYLE,
  background: 'rgba(71,85,105,0.4)',
  color: '#64748b',
  cursor: 'not-allowed',
};

const QUEUE_ITEM_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 10px',
  borderRadius: 8,
  background: 'rgba(15,23,42,0.2)',
  marginBottom: 6,
  fontSize: 12,
};

const BASKET_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 0',
  borderBottom: '1px solid rgba(148,163,184,0.06)',
  fontSize: 12,
};

const QUICK_ACTION_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 8,
};

const QUICK_BTN_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  gap: 4,
  padding: '12px 6px',
  borderRadius: 10,
  border: '1px solid rgba(148,163,184,0.1)',
  background: 'rgba(15,23,42,0.25)',
  color: '#cbd5e1',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  position: 'relative' as const,
};

const HIGHLIGHT_BTN_STYLE: React.CSSProperties = {
  ...QUICK_BTN_STYLE,
  background: 'rgba(59,130,246,0.15)',
  borderColor: 'rgba(59,130,246,0.3)',
  color: '#93c5fd',
};

// ---- 格式化工具 ----

function fmtCurrency(value: number): string {
  return `¥${value.toFixed(2)}`;
}

function queueTypeLabel(type: QueueItem['type']): string {
  const map: Record<QueueItem['type'], string> = {
    service: '服务',
    pickup: '取货',
    return: '退货',
    consult: '咨询',
  };
  return map[type];
}

// ---- 主组件 ----

/**
 * FrontDeskPanel — 前台操作面板
 *
 * 一站式前台收银、排队叫号、快捷操作面板。
 * 适用于零售门店前台 / 收银终端 / POS 场景。
 *
 * @example
 * <FrontDeskPanel
 *   title="前台收银台"
 *   cashierName="张丽"
 *   basketItems={[{ id: '1', name: '春季新款连衣裙', sku: 'SKU-001', quantity: 2, unitPrice: 299, subtotal: 598 }]}
 *   checkoutStatus="idle"
 *   paymentMethods={['wechat', 'alipay', 'cash', 'member_card']}
 *   selectedPayment="wechat"
 *   todayStats={{ totalOrders: 42, totalRevenue: 38650, avgCheckoutSec: 38, pendingPickups: 3 }}
 *   onCheckout={(m) => console.log('结账:', m)}
 * />
 */
export function FrontDeskPanel({
  title = '前台操作台',
  cashierName,
  shiftInfo,
  basketItems = [],
  checkoutStatus = 'idle',
  checkoutError,
  paymentMethods = ['wechat', 'alipay', 'cash'],
  selectedPayment = 'wechat',
  queue = [],
  quickActions = [],
  todayStats,
  loading = false,
  compact = false,
  onCheckout,
  onPaymentChange,
  onRemoveItem,
  onClearBasket,
  className,
}: FrontDeskPanelProps) {
  // ---- 加载态 ----
  if (loading) {
    return (
      <div className={className} style={PANEL_STYLE}>
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          正在加载收银台...
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 60,
                borderRadius: 8,
                background: 'rgba(15,23,42,0.2)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ---- 计算购物篮汇总 ----
  const totalQuantity = basketItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = basketItems.reduce((sum, item) => sum + item.subtotal, 0);
  const canCheckout =
    basketItems.length > 0 &&
    checkoutStatus !== 'processing' &&
    checkoutStatus !== 'success';

  // ---- 构建快捷统计 ----
  const statItems: QuickStatItem[] = todayStats
    ? [
        { label: '今日订单', value: todayStats.totalOrders },
        {
          label: '今日营收',
          value: fmtCurrency(todayStats.totalRevenue),
          valueColor: '#4ade80',
        },
        {
          label: '平均结账',
          value: `${todayStats.avgCheckoutSec}s`,
          helper: '每单耗时',
        },
        {
          label: '待取货',
          value: todayStats.pendingPickups,
          valueColor: todayStats.pendingPickups > 5 ? '#f87171' : '#fbbf24',
        },
      ]
    : [];

  // ---- 渲染头部 ----
  const renderHeader = () => (
    <div style={HEADER_STYLE}>
      <div>
        <span style={TITLE_STYLE}>{title}</span>
        {cashierName && (
          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 12 }}>
            收银员: {cashierName}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {shiftInfo && (
          <StatusBadge label={shiftInfo} variant="info" size="sm" />
        )}
        {checkoutStatus === 'processing' && (
          <StatusBadge label="结算中..." variant="warning" size="sm" dot />
        )}
        {checkoutStatus === 'success' && (
          <StatusBadge label="结算成功" variant="success" size="sm" />
        )}
        {checkoutStatus === 'failed' && (
          <StatusBadge label="结算失败" variant="error" size="sm" />
        )}
      </div>
    </div>
  );

  // ---- 渲染快捷功能按钮 ----
  const renderQuickActions = () => {
    if (quickActions.length === 0) return null;
    return (
      <div style={SECTION_STYLE}>
        <div style={SECTION_TITLE_STYLE}>快捷操作</div>
        <div style={QUICK_ACTION_GRID}>
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              style={action.highlight ? HIGHLIGHT_BTN_STYLE : QUICK_BTN_STYLE}
              onClick={action.onClick}
            >
              {action.icon && <span style={{ fontSize: 16 }}>{action.icon}</span>}
              <span>{action.label}</span>
              {action.badge !== undefined && action.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ---- 渲染排队叫号 ----
  const renderQueue = () => {
    if (queue.length === 0) return null;
    return (
      <div style={SECTION_STYLE}>
        <div style={SECTION_TITLE_STYLE}>
          排队叫号
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
            {queue.length} 位
          </span>
        </div>
        {queue.slice(0, compact ? 3 : 5).map((item) => (
          <div key={item.id} style={QUEUE_ITEM_STYLE}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <strong style={{ fontSize: 14, color: '#f8fafc', minWidth: 24 }}>
                {item.number}
              </strong>
              <span style={{ color: '#94a3b8' }}>
                {queueTypeLabel(item.type)}
              </span>
              {item.customerName && (
                <span style={{ color: '#cbd5e1' }}>{item.customerName}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {item.waitingMinutes}分钟
              </span>
              <StatusBadge
                label={
                  item.status === 'calling'
                    ? '叫号中'
                    : item.status === 'serving'
                    ? '服务中'
                    : '等待'
                }
                variant={
                  item.status === 'calling'
                    ? 'warning'
                    : item.status === 'serving'
                    ? 'info'
                    : 'neutral'
                }
                size="sm"
                dot={item.status === 'calling'}
              />
            </div>
          </div>
        ))}
        {queue.length > (compact ? 3 : 5) && (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 11, paddingTop: 4 }}>
            ... 还有 {queue.length - (compact ? 3 : 5)} 位
          </div>
        )}
      </div>
    );
  };

  // ---- 渲染购物篮 ----
  const renderBasket = () => (
    <div style={SECTION_STYLE}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span style={SECTION_TITLE_STYLE}>
          购物篮
          {basketItems.length > 0 && (
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>
              {totalQuantity} 件
            </span>
          )}
        </span>
        {basketItems.length > 0 && onClearBasket && (
          <button
            type="button"
            onClick={onClearBasket}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            清空
          </button>
        )}
      </div>

      {basketItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '20px 0',
            color: '#475569',
            fontSize: 12,
          }}
        >
          购物篮为空，扫描商品条码添加
        </div>
      ) : (
        <>
          <div style={{ maxHeight: compact ? 120 : 200, overflowY: 'auto' }}>
            {basketItems.map((item) => (
              <div key={item.id} style={BASKET_ROW_STYLE}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 500 }}>
                    {item.name}
                  </div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>
                    {item.sku} × {item.quantity}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginRight: 8 }}>
                  <div style={{ color: '#e2e8f0' }}>
                    {fmtCurrency(item.unitPrice)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 60 }}>
                  <div style={{ color: '#f8fafc', fontWeight: 600 }}>
                    {fmtCurrency(item.subtotal)}
                  </div>
                </div>
                {onRemoveItem && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: 14,
                      marginLeft: 4,
                    }}
                    title="移除"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 汇总行 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 10,
              borderTop: '1px solid rgba(148,163,184,0.1)',
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>
              合计 ({totalQuantity} 件)
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#4ade80',
              }}
            >
              {fmtCurrency(totalAmount)}
            </span>
          </div>
        </>
      )}
    </div>
  );

  // ---- 渲染支付方式 ----
  const renderPayment = () => (
    <div style={SECTION_STYLE}>
      <div style={SECTION_TITLE_STYLE}>支付方式</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {paymentMethods.map((method) => (
          <button
            key={method}
            type="button"
            style={
              selectedPayment === method ? PAYMENT_BTN_SELECTED : PAYMENT_BTN_BASE
            }
            onClick={() => onPaymentChange?.(method)}
            disabled={checkoutStatus === 'processing'}
          >
            {PAYMENT_LABELS[method] ?? method}
          </button>
        ))}
      </div>

      {/* 结账按钮 */}
      <button
        type="button"
        style={canCheckout ? CHECKOUT_BTN_STYLE : CHECKOUT_DISABLED_STYLE}
        onClick={() => canCheckout && onCheckout?.(selectedPayment!)}
        disabled={!canCheckout}
      >
        {checkoutStatus === 'processing'
          ? '结算中...'
          : checkoutStatus === 'success'
          ? '✓ 结算成功'
          : `收款 ${fmtCurrency(totalAmount)}`}
      </button>

      {/* 结账错误 */}
      {checkoutStatus === 'failed' && checkoutError && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#f87171',
            fontSize: 12,
          }}
        >
          {checkoutError}
        </div>
      )}
    </div>
  );

  // ---- 主渲染 ----

  return (
    <div className={className} style={PANEL_STYLE}>
      {renderHeader()}

      {/* 今日统计概览 */}
      {statItems.length > 0 && (
        <QuickStats items={statItems} columns={compact ? 2 : 4} />
      )}

      {/* 快捷操作 */}
      {renderQuickActions()}

      {/* 排队叫号 */}
      {renderQueue()}

      {/* 双栏布局: 购物篮 + 支付 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? '1fr' : '1fr 1fr',
          gap: 12,
        }}
      >
        {renderBasket()}
        {renderPayment()}
      </div>
    </div>
  );
}
