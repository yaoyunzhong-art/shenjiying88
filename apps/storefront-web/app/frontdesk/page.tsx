'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { PageShell, StatusBadge } from '@m5/ui';
import type {
  BasketItem,
  CheckoutStatus,
  PaymentMethod,
  QueueItem,
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

const MOCK_QUICK_FN = [
  { key: 'qa-scan', label: '扫码录入', icon: '📷', highlight: true },
  { key: 'qa-return', label: '退货处理', icon: '↩️' },
  { key: 'qa-call', label: '叫号通知', icon: '🔔', badge: 2 },
  { key: 'qa-member', label: '会员查询', icon: '👤' },
  { key: 'qa-inv', label: '库存查询', icon: '📦' },
  { key: 'qa-price', label: '改价审批', icon: '💰' },
  { key: 'qa-print', label: '打印小票', icon: '🖨️' },
  { key: 'qa-summary', label: '交班汇总', icon: '📊' },
];

const MOCK_TRANSACTIONS = [
  { id: 't1', orderId: 'ORD-001', customer: '张明', amount: 128.50, method: 'wechat' as PaymentMethod, time: '10:25', status: 'completed' as const },
  { id: 't2', orderId: 'ORD-002', customer: '李丽', amount: 356.00, method: 'alipay' as PaymentMethod, time: '10:18', status: 'completed' as const },
  { id: 't3', orderId: 'ORD-003', customer: '王强', amount: 89.90, method: 'cash' as PaymentMethod, time: '10:05', status: 'completed' as const },
  { id: 't4', orderId: 'ORD-004', customer: '赵雪', amount: 520.00, method: 'member_card' as PaymentMethod, time: '09:52', status: 'refunded' as const },
  { id: 't5', orderId: 'ORD-005', customer: '陈伟', amount: 45.50, method: 'wechat' as PaymentMethod, time: '09:40', status: 'completed' as const },
];

// ============================================================
// 常量
// ============================================================

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  cash: '现金',
  card: '银行卡',
  member_card: '会员卡',
};

const QUEUE_TYPE_LABEL: Record<string, string> = {
  service: '服务',
  pickup: '取货',
  return: '退货',
  consult: '咨询',
};

const QUEUE_STATUS_LABEL: Record<string, string> = {
  waiting: '等待中',
  calling: '叫号中',
  serving: '服务中',
};

// ============================================================
// 子组件：统计卡片
// ============================================================

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 130, background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color }}>{typeof value === 'number' ? value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

// ============================================================
// 子组件：快捷操作按钮网格
// ============================================================

function QuickActionGrid({ actions }: { actions: { key: string; label: string; icon: string; highlight?: boolean; badge?: number }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => console.log(`[FrontDesk] 快捷操作: ${action.label}`)}
          style={{
            padding: '14px 8px',
            borderRadius: 10,
            border: action.highlight ? '2px solid #2563eb' : '1px solid #e5e7eb',
            background: action.highlight ? '#eff6ff' : '#fff',
            cursor: 'pointer',
            fontSize: 13,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            position: 'relative',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: 22 }}>{action.icon}</span>
          <span style={{ fontWeight: action.highlight ? 600 : 400 }}>{action.label}</span>
          {action.badge ? (
            <span style={{ position: 'absolute', top: 6, right: 8, background: '#dc2626', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, fontWeight: 700 }}>
              {action.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// 子组件：排队列表
// ============================================================

function QueueList({ queue, onCall, onServe }: { queue: QueueItem[]; onCall: (id: string) => void; onServe: (id: string) => void }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 14, fontWeight: 600 }}>
        🏷️ 排队叫号 · {queue.filter((q) => q.status === 'waiting').length} 人等待
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>号码</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>顾客</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>类型</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>等待</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>状态</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((q) => (
            <tr key={q.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '8px 14px', fontWeight: 700, fontSize: 15, color: q.status === 'calling' ? '#2563eb' : '#374151' }}>
                {q.number}
              </td>
              <td style={{ padding: '8px 14px' }}>{q.customerName || '匿名'}</td>
              <td style={{ padding: '8px 14px', color: '#6b7280' }}>{QUEUE_TYPE_LABEL[q.type] || q.type}</td>
              <td style={{ padding: '8px 14px', color: q.waitingMinutes > 10 ? '#dc2626' : '#6b7280' }}>
                {q.waitingMinutes} 分钟
              </td>
              <td style={{ padding: '8px 14px' }}>
                <StatusBadge
                  variant={q.status === 'waiting' ? 'neutral' : q.status === 'calling' ? 'warning' : 'success'}
                  label={QUEUE_STATUS_LABEL[q.status] || q.status}
                />
              </td>
              <td style={{ padding: '8px 14px' }}>
                {q.status === 'waiting' && (
                  <button onClick={() => onCall(q.id)} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: '#f59e0b', color: '#fff', cursor: 'pointer', fontSize: 11 }}>叫号</button>
                )}
                {q.status === 'calling' && (
                  <button onClick={() => onServe(q.id)} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: '#059669', color: '#fff', cursor: 'pointer', fontSize: 11 }}>服务</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 子组件：今日交易记录
// ============================================================

function RecentTransactions({ transactions }: { transactions: typeof MOCK_TRANSACTIONS }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 14, fontWeight: 600 }}>
        📄 最近交易
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>订单号</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>顾客</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>金额</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>支付方式</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>时间</th>
            <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>状态</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '8px 14px', fontWeight: 600 }}>{t.orderId}</td>
              <td style={{ padding: '8px 14px' }}>{t.customer}</td>
              <td style={{ padding: '8px 14px', fontWeight: 600, color: '#059669' }}>¥{t.amount.toFixed(2)}</td>
              <td style={{ padding: '8px 14px', color: '#6b7280' }}>{PAYMENT_LABEL[t.method]}</td>
              <td style={{ padding: '8px 14px', color: '#6b7280' }}>{t.time}</td>
              <td style={{ padding: '8px 14px' }}>
                <StatusBadge variant={t.status === 'completed' ? 'success' : 'warning'} label={t.status === 'completed' ? '已完成' : '已退款'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
//  前台收银台页面
// ============================================================

export default function FrontDeskPage() {
  const [basket, setBasket] = useState<BasketItem[]>(MOCK_BASKET);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');
  const [checkoutError, setCheckoutError] = useState<string | undefined>();
  const [queue, setQueue] = useState<QueueItem[]>(MOCK_QUEUE);
  const [showBasket, setShowBasket] = useState(true);

  /** 结账处理 */
  const handleCheckout = useCallback(
    (method: PaymentMethod) => {
      setCheckoutStatus('processing');
      setCheckoutError(undefined);
      setTimeout(() => {
        if (Math.random() > 0.1) {
          setCheckoutStatus('success');
          setBasket([]);
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

  /** 叫号 */
  const handleCall = useCallback((id: string) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'calling' as const } : q)));
  }, []);

  /** 开始服务 */
  const handleServe = useCallback((id: string) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'serving' as const } : q)));
  }, []);

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

  /** 购物篮总额 */
  const basketTotal = useMemo(
    () => basket.reduce((sum, item) => sum + item.subtotal, 0),
    [basket],
  );

  /** 快捷操作回调 */
  const quickActions = useMemo(
    () =>
      MOCK_QUICK_FN.map((action) => ({
        ...action,
        onClick: () => {
          console.log(`[FrontDesk] 快捷操作: ${action.label}`);
        },
      })),
    [],
  );

  return (
    <PageShell title="前台收银台" description="一站式收银、排队叫号与快捷操作面板">
      <div style={{ padding: 24 }}>
        {/* 头部信息 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>🏪 前台收银台</h1>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              门店 #001 · 收银员: 王芳 · 早班 08:00-16:00
            </p>
          </div>
          <button
            onClick={() => setShowBasket(!showBasket)}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {showBasket ? '📋 收银面板' : '🛒 显示购物篮'}
          </button>
        </div>

        {/* 统计卡片 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <StatCard label="今日订单" value={todayStats.totalOrders} icon="📋" color="#2563eb" />
          <StatCard label="今日营收" value={`¥${todayStats.totalRevenue.toLocaleString()}`} icon="💰" color="#059669" />
          <StatCard label="平均结账" value={`${todayStats.avgCheckoutSec}s`} icon="⏱️" color="#d97706" />
          <StatCard label="待取货" value={todayStats.pendingPickups} icon="📦" color="#7c3aed" />
          <StatCard label="排队人数" value={queue.filter((q) => q.status === 'waiting').length} icon="📊" color="#dc2626" />
        </div>

        {/* 快捷操作 */}
        <QuickActionGrid actions={MOCK_QUICK_FN} />

        {/* 双栏布局：购物篮 + 排队 */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* 左侧：购物篮 */}
          {showBasket && (
            <div style={{ flex: '1 1 400px', minWidth: 320 }}>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>🛒 购物篮 ({basket.length} 件)</span>
                  {basket.length > 0 && (
                    <button onClick={handleClearBasket} style={{ padding: '3px 10px', borderRadius: 5, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 11, color: '#dc2626' }}>
                      清空
                    </button>
                  )}
                </div>
                {basket.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    🛒 购物篮为空，请扫描或搜索商品
                  </div>
                ) : (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>商品</th>
                          <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, color: '#6b7280' }}>SKU</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>单价</th>
                          <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 600, color: '#6b7280' }}>数量</th>
                          <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: '#6b7280' }}>小计</th>
                          <th style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 600, color: '#6b7280' }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {basket.map((item) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px 14px', fontWeight: 600 }}>{item.name}</td>
                            <td style={{ padding: '8px 14px', color: '#6b7280' }}>{item.sku}</td>
                            <td style={{ padding: '8px 14px', textAlign: 'right' }}>¥{item.unitPrice.toFixed(2)}</td>
                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>¥{item.subtotal.toFixed(2)}</td>
                            <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                              <button onClick={() => handleRemoveItem(item.id)} style={{ padding: '2px 8px', borderRadius: 4, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 11 }}>删除</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4' }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>合计</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#059669' }}>¥{basketTotal.toFixed(2)}</span>
                    </div>
                    {/* 支付方式选择 */}
                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: '#6b7280', marginRight: 4 }}>支付方式:</span>
                        {(['wechat', 'alipay', 'cash', 'card', 'member_card'] as PaymentMethod[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => setPaymentMethod(m)}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 6,
                              border: paymentMethod === m ? '2px solid #2563eb' : '1px solid #d1d5db',
                              background: paymentMethod === m ? '#eff6ff' : '#fff',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: paymentMethod === m ? 600 : 400,
                            }}
                          >
                            {PAYMENT_LABEL[m]}
                          </button>
                        ))}
                      </div>
                      {checkoutStatus === 'failed' && checkoutError && (
                        <div style={{ padding: '8px 12px', marginBottom: 10, background: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#dc2626' }}>
                          ❌ {checkoutError}
                        </div>
                      )}
                      {checkoutStatus === 'success' && (
                        <div style={{ padding: '8px 12px', marginBottom: 10, background: '#f0fdf4', borderRadius: 8, fontSize: 12, color: '#059669' }}>
                          ✅ 支付成功！
                        </div>
                      )}
                      <button
                        onClick={() => handleCheckout(paymentMethod)}
                        disabled={basket.length === 0 || checkoutStatus === 'processing'}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: 10,
                          border: 'none',
                          background: basket.length === 0 ? '#d1d5db' : checkoutStatus === 'processing' ? '#93c5fd' : '#2563eb',
                          color: '#fff',
                          cursor: basket.length === 0 ? 'not-allowed' : 'pointer',
                          fontSize: 15,
                          fontWeight: 600,
                        }}
                      >
                        {checkoutStatus === 'processing' ? '⏳ 支付中…' : `💳 结算 ¥${basketTotal.toFixed(2)}`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 右侧：排队列表 */}
          <div style={{ flex: '1 1 400px', minWidth: 320 }}>
            <QueueList queue={queue} onCall={handleCall} onServe={handleServe} />
          </div>
        </div>

        {/* 交易记录 */}
        <RecentTransactions transactions={MOCK_TRANSACTIONS} />

        {/* 收银员状态栏 */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 20px',
            background: '#f9fafb',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          <span>👤 收银员: 王芳</span>
          <span>🕐 班次: 早班 08:00-16:00</span>
          <span>📊 已处理订单: {todayStats.totalOrders}</span>
          <span>💰 收银总额: ¥{todayStats.totalRevenue.toLocaleString()}</span>
          <span>⏱️ 平均耗时: {todayStats.avgCheckoutSec}s</span>
        </div>
      </div>
    </PageShell>
  );
}
