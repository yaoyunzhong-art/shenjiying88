'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { FrontDeskPanel, PageShell } from '@m5/ui';
import type {
  BasketItem,
  CheckoutStatus,
  PaymentMethod,
  QueueItem,
  QuickFnButton,
} from '@m5/ui';

// ============================================================
//  Mock 数据
// ============================================================

const MOCK_BASKET: BasketItem[] = [
  {
    id: 'bi-1',
    name: '精选有机蔬菜拼盘',
    sku: 'VEG-001',
    quantity: 2,
    unitPrice: 45.00,
    subtotal: 90.00,
  },
  {
    id: 'bi-2',
    name: '澳洲进口牛排 500g',
    sku: 'BEEF-012',
    quantity: 1,
    unitPrice: 168.00,
    subtotal: 168.00,
  },
  {
    id: 'bi-3',
    name: '纯牛奶 1L 装',
    sku: 'MLK-008',
    quantity: 3,
    unitPrice: 19.90,
    subtotal: 59.70,
  },
  {
    id: 'bi-4',
    name: '新鲜蓝莓 125g',
    sku: 'FRT-023',
    quantity: 2,
    unitPrice: 29.90,
    subtotal: 59.80,
  },
];

const MOCK_QUEUE: QueueItem[] = [
  { id: 'q1', number: 'A001', customerName: '张先生', type: 'service', waitingMinutes: 3, status: 'waiting' },
  { id: 'q2', number: 'A002', customerName: '李女士', type: 'pickup', waitingMinutes: 5, status: 'waiting' },
  { id: 'q3', number: 'A003', type: 'return', waitingMinutes: 7, status: 'calling' },
  { id: 'q4', number: 'A004', customerName: '王女士', type: 'consult', waitingMinutes: 10, status: 'waiting' },
  { id: 'q5', number: 'A005', type: 'service', waitingMinutes: 12, status: 'waiting' },
  { id: 'q6', number: 'B001', customerName: '赵先生', type: 'pickup', waitingMinutes: 15, status: 'waiting' },
];

const MOCK_QUICK_ACTIONS: QuickFnButton[] = [
  { key: 'qa-scan', label: '扫码录入', icon: '📷', highlight: true },
  { key: 'qa-return', label: '退货处理', icon: '↩️' },
  { key: 'qa-call', label: '叫号通知', icon: '🔔', badge: 2 },
  { key: 'qa-member', label: '会员查询', icon: '👤' },
  { key: 'qa-inv', label: '库存查询', icon: '📦' },
  { key: 'qa-price', label: '改价审批', icon: '💰' },
  { key: 'qa-print', label: '打印小票', icon: '🖨️' },
  { key: 'qa-summary', label: '交班汇总', icon: '📊' },
];

// ============================================================
//  前台收银台页面
// ============================================================

export default function FrontDeskPage() {
  const [basket, setBasket] = useState<BasketItem[]>(MOCK_BASKET);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');
  const [checkoutError, setCheckoutError] = useState<string | undefined>();

  /** 结账处理 */
  const handleCheckout = useCallback(
    (method: PaymentMethod) => {
      setCheckoutStatus('processing');
      setCheckoutError(undefined);

      // 模拟异步结账
      setTimeout(() => {
        // 90% 概率成功
        if (Math.random() > 0.1) {
          setCheckoutStatus('success');
          setBasket([]);
          // 3 秒后重置状态
          setTimeout(() => setCheckoutStatus('idle'), 3000);
        } else {
          setCheckoutStatus('failed');
          setCheckoutError('支付网关超时，请重试或选择其他支付方式');
          setTimeout(() => setCheckoutStatus('idle'), 2000);
        }
      }, 1500);
    },
    [],
  );

  /** 移除购物篮商品 */
  const handleRemoveItem = useCallback((itemId: string) => {
    setBasket((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  /** 清空购物篮 */
  const handleClearBasket = useCallback(() => {
    setBasket([]);
  }, []);

  /** 快捷操作区回调 */
  const quickActions = useMemo(
    () =>
      MOCK_QUICK_ACTIONS.map((action) => ({
        ...action,
        onClick: () => {
          console.log(`[FrontDesk] 快捷操作: ${action.label}`);
        },
      })),
    [],
  );

  /** 今日统计数据 */
  const todayStats = useMemo(
    () => ({
      totalOrders: 156,
      totalRevenue: 124580.50,
      avgCheckoutSec: 32,
      pendingPickups: 7,
    }),
    [],
  );

  return (
    <PageShell title="前台收银台" description="一站式收银、排队叫号与快捷操作面板">
      <FrontDeskPanel
        title="前台操作台 — 门店 #001"
        cashierName="王芳"
        shiftInfo="早班 08:00-16:00"
        basketItems={basket}
        checkoutStatus={checkoutStatus}
        checkoutError={checkoutError}
        paymentMethods={['wechat', 'alipay', 'cash', 'card', 'member_card']}
        selectedPayment={paymentMethod}
        queue={MOCK_QUEUE}
        quickActions={quickActions}
        todayStats={todayStats}
        onCheckout={handleCheckout}
        onPaymentChange={setPaymentMethod}
        onRemoveItem={handleRemoveItem}
        onClearBasket={handleClearBasket}
      />
    </PageShell>
  );
}
