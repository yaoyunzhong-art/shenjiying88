/**
 * 前台操作面板 — Front Desk Workbench (Next.js App Router Page)
 * 角色视角: 🎯前台收银/服务人员
 * 功能: 购物篮收银 / 排队叫号 / 快捷操作 / 今日营业数据 / 支付处理
 */
'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  FrontDeskPanel,
  PageShell,
  DetailActionBar,
  type FrontDeskPanelProps,
  type BasketItem,
  type CheckoutStatus,
  type QueueItem,
  type QuickFnButton,
  type PaymentMethod,
} from '@m5/ui';

// ============================================================
// 类型
// ============================================================

interface ProductSuggestion {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  stock: number;
  category: string;
}

// ============================================================
// Mock 数据
// ============================================================

const MOCK_PRODUCT_SUGGESTIONS: ProductSuggestion[] = [
  { id: 'p1', name: '经典咖啡（热）', sku: 'COF-H-001', unitPrice: 28, stock: 120, category: '饮品' },
  { id: 'p2', name: '冰美式', sku: 'COF-C-002', unitPrice: 32, stock: 85, category: '饮品' },
  { id: 'p3', name: '抹茶拿铁', sku: 'COF-L-003', unitPrice: 38, stock: 60, category: '饮品' },
  { id: 'p4', name: '蓝莓马芬', sku: 'BKD-001', unitPrice: 18, stock: 25, category: '烘焙' },
  { id: 'p5', name: '牛角包', sku: 'BKD-002', unitPrice: 15, stock: 40, category: '烘焙' },
  { id: 'p6', name: '三明治（火腿芝士）', sku: 'FOD-001', unitPrice: 35, stock: 20, category: '简餐' },
  { id: 'p7', name: '矿泉水', sku: 'DRK-001', unitPrice: 5, stock: 200, category: '饮品' },
  { id: 'p8', name: '会员充值 200 元', sku: 'VIP-200', unitPrice: 200, stock: 9999, category: '会员' },
];

let queueIdCounter = 3;
function generateQueue(): QueueItem[] {
  return [
    { id: 'q1', number: 'A001', type: 'service', waitingMinutes: 2, status: 'waiting' },
    { id: 'q2', number: 'A002', customerName: '张先生', type: 'pickup', waitingMinutes: 5, status: 'waiting' },
    { id: 'q3', number: 'A003', customerName: '李女士', type: 'consult', waitingMinutes: 8, status: 'waiting' },
  ];
}

// ============================================================
// 组件
// ============================================================

export default function FrontDeskWorkbenchPage() {
  const [basket, setBasket] = useState<BasketItem[]>([
    { id: 'b1', name: '经典咖啡（热）', sku: 'COF-H-001', quantity: 2, unitPrice: 28, subtotal: 56 },
    { id: 'b2', name: '牛角包', sku: 'BKD-002', quantity: 1, unitPrice: 15, subtotal: 15 },
  ]);
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');
  const [checkoutError, setCheckoutError] = useState<string | undefined>();
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('wechat');
  const [queue, setQueue] = useState<QueueItem[]>(generateQueue());
  const [showProductSearch, setShowProductSearch] = useState(false);

  const todayStats = useMemo(() => ({
    totalOrders: 47,
    totalRevenue: 5346,
    avgCheckoutSec: 28,
    pendingPickups: 3,
  }), []);

  /** 处理结账 */
  const handleCheckout = useCallback((method: PaymentMethod) => {
    if (basket.length === 0) {
      setCheckoutError('购物篮为空，无法结账');
      return;
    }
    setCheckoutStatus('processing');
    setCheckoutError(undefined);

    // 模拟收银处理
    setTimeout(() => {
      setCheckoutStatus('success');
      setTimeout(() => {
        setBasket([]);
        setCheckoutStatus('idle');
      }, 1500);
    }, 800);
  }, [basket]);

  /** 切换支付方式 */
  const handlePaymentChange = useCallback((method: PaymentMethod) => {
    setSelectedPayment(method);
  }, []);

  /** 移除商品 */
  const handleRemoveItem = useCallback((itemId: string) => {
    setBasket(prev => prev.filter(item => item.id !== itemId));
  }, []);

  /** 清空购物篮 */
  const handleClearBasket = useCallback(() => {
    if (basket.length > 0 && confirm('确认清空购物篮？')) {
      setBasket([]);
    }
  }, [basket]);

  /** 添加商品到购物篮 */
  const handleAddProduct = useCallback((product: ProductSuggestion) => {
    setBasket(prev => {
      const existing = prev.find(item => item.sku === product.sku);
      if (existing) {
        return prev.map(item =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [
        ...prev,
        {
          id: `b${Date.now()}`,
          name: product.name,
          sku: product.sku,
          quantity: 1,
          unitPrice: product.unitPrice,
          subtotal: product.unitPrice,
        },
      ];
    });
    setShowProductSearch(false);
  }, []);

  /** 叫号下一人 */
  const handleCallNext = useCallback(() => {
    setQueue(prev => {
      const next = prev.find(q => q.status === 'waiting');
      if (!next) return prev;
      return prev.map(q =>
        q.id === next.id ? { ...q, status: 'calling' as const } : q
      );
    });
  }, []);

  /** 完成服务 */
  const handleCompleteServing = useCallback((queueId: string) => {
    setQueue(prev => prev.filter(q => q.id !== queueId));
  }, []);

  /** 快捷功能定义 */
  const quickActions: QuickFnButton[] = useMemo(() => [
    { key: 'scan', label: '扫码', icon: '📷', onClick: () => {} },
    { key: 'search', label: '查商品', icon: '🔍', highlight: true, badge: 1, onClick: () => setShowProductSearch(true) },
    { key: 'call', label: '叫号', icon: '🔔', badge: queue.filter(q => q.status === 'waiting').length, onClick: handleCallNext },
    { key: 'refund', label: '退款', icon: '↩️', onClick: () => {} },
    { key: 'hold', label: '暂挂', icon: '⏸️', onClick: () => {} },
  ], [queue, handleCallNext]);

  /** 统计摘要卡片 */
  const summaryCards = useMemo(() => [
    { label: '今日订单', value: todayStats.totalOrders.toString(), variant: 'info' as const },
    { label: '今日营收', value: `¥${todayStats.totalRevenue.toLocaleString()}`, variant: 'success' as const },
    { label: '平均结账', value: `${todayStats.avgCheckoutSec}s`, variant: 'warning' as const },
    { label: '待取餐', value: todayStats.pendingPickups.toString(), variant: 'neutral' as const },
  ], [todayStats]);

  return (
    <PageShell
      title="前台操作面板"
      subtitle="前台收银 / 排队叫号 / 快捷操作"
      actions={
        <DetailActionBar
          actions={[
            { label: '交班', key: 'shift', variant: 'default' as const, onClick: () => {} },
            { label: '日结', key: 'daily', variant: 'default' as const, onClick: () => {} },
          ]}
        />
      }
    >
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {summaryCards.map(card => (
          <div
            key={card.label}
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* 商品搜索弹出层 */}
      {showProductSearch && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowProductSearch(false)}
        >
          <div
            style={{
              background: '#1e293b',
              borderRadius: 16,
              padding: 24,
              width: 480,
              maxHeight: '70vh',
              overflow: 'auto',
              border: '1px solid rgba(148,163,184,0.15)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: '#f1f5f9', marginBottom: 16, fontSize: 16, fontWeight: 600 }}>
              选择商品
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_PRODUCT_SUGGESTIONS.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleAddProduct(product)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(148,163,184,0.12)',
                    background: 'rgba(15,23,42,0.5)',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = 'rgba(59,130,246,0.15)' }}
                  onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = 'rgba(15,23,42,0.5)' }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{product.category} · {product.sku}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#93c5fd', fontWeight: 600 }}>¥{product.unitPrice}</div>
                    <div style={{ fontSize: 11, color: product.stock > 30 ? '#22c55e' : '#f59e0b' }}>
                      库存: {product.stock}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 前台操作面板 */}
      <FrontDeskPanel
        title="收银台"
        cashierName="王收银"
        shiftInfo="早班 08:00-16:00"
        basketItems={basket}
        checkoutStatus={checkoutStatus}
        checkoutError={checkoutError}
        selectedPayment={selectedPayment}
        paymentMethods={['wechat', 'alipay', 'cash', 'card', 'member_card']}
        queue={queue}
        quickActions={quickActions}
        todayStats={todayStats}
        onCheckout={handleCheckout}
        onPaymentChange={handlePaymentChange}
        onRemoveItem={handleRemoveItem}
        onClearBasket={handleClearBasket}
      />

      {/* 排队列表补充展示 */}
      {queue.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              borderRadius: 14,
              background: 'rgba(15, 23, 42, 0.35)',
              border: '1px solid rgba(148, 163, 184, 0.08)',
              padding: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', marginBottom: 12 }}>
              当前排队 · 共 {queue.length} 位
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {queue.map(q => (
                <div
                  key={q.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: q.status === 'calling'
                      ? 'rgba(34, 197, 94, 0.12)'
                      : 'rgba(15, 23, 42, 0.4)',
                    border: q.status === 'calling'
                      ? '1px solid rgba(34, 197, 94, 0.3)'
                      : '1px solid rgba(148,163,184,0.08)',
                    minWidth: 160,
                  }}
                >
                  <span style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: q.status === 'calling' ? '#22c55e' : '#e2e8f0',
                  }}>
                    {q.number}
                  </span>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {q.customerName ?? '—'} {q.waitingMinutes}min
                  </div>
                  {q.status === 'calling' && (
                    <button
                      onClick={() => handleCompleteServing(q.id)}
                      style={{
                        marginLeft: 'auto',
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#22c55e',
                        color: '#fff',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      完成
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
