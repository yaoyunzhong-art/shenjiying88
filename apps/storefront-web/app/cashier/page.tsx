/**
 * 前台收银台 — P-35 Storefront Cashier Page
 * 角色: 🛒 前台顾客/收银
 * 功能: 商品搜索/选择、购物车管理、会员信息展示、支付方式选择、结账
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  PageShell,
  Button,
  Input,
  Card,
  Select,
  Tag,
} from '@m5/ui';
import type { SelectOption } from '@m5/ui';

// ============================================================
// 类型定义
// ============================================================

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface MemberInfo {
  phone: string;
  cardNo: string;
  name: string;
  tier?: string;
  points?: number;
}

type PaymentMethod = 'wechat' | 'alipay' | 'cash';

// ============================================================
// Mock 数据
// ============================================================

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: '基础护肤套装', price: 299, category: '护肤', stock: 50 },
  { id: 'p2', name: '深层清洁面膜（5片装）', price: 89, category: '面膜', stock: 120 },
  { id: 'p3', name: '防晒霜 SPF50+', price: 139, category: '防晒', stock: 80 },
  { id: 'p4', name: '舒缓保湿喷雾', price: 59, category: '护肤', stock: 200 },
  { id: 'p5', name: '卸妆油（200ml）', price: 79, category: '清洁', stock: 65 },
  { id: 'p6', name: '精华液（30ml）', price: 349, category: '护肤', stock: 40 },
  { id: 'p7', name: '眼霜（15ml）', price: 259, category: '护肤', stock: 35 },
  { id: 'p8', name: '护手霜礼盒', price: 128, category: '礼盒', stock: 30 },
  { id: 'p9', name: '沐浴露（500ml）', price: 69, category: '洗浴', stock: 90 },
  { id: 'p10', name: '身体乳（300ml）', price: 99, category: '洗浴', stock: 75 },
];

const MOCK_MEMBER: MemberInfo = {
  phone: '138****5678',
  cardNo: 'VIP-2024-0001',
  name: '王芳',
  tier: 'gold',
  points: 2560,
};

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'wechat', label: '微信支付', icon: '💳' },
  { value: 'alipay', label: '支付宝', icon: '🔵' },
  { value: 'cash', label: '现金', icon: '💵' },
];

function fm(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

// ============================================================
// 样式常量
// ============================================================

const darkCard: React.CSSProperties = {
  borderRadius: 16,
  padding: 20,
  background: 'rgba(15, 23, 42, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const sectionTitle: React.CSSProperties = {
  margin: '0 0 16px',
  fontSize: 16,
  fontWeight: 700,
  color: '#f1f5f9',
};

// ============================================================
// 页面组件
// ============================================================

export default function CashierPage() {
  // ── 状态 ──
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [member, setMember] = useState<MemberInfo | null>(MOCK_MEMBER);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [messageText, setMessageText] = useState('');

  // ── 商品分类选项 ──
  const categoryOptions: SelectOption[] = useMemo(() => {
    const cats = [...new Set(MOCK_PRODUCTS.map((p) => p.category))];
    return [{ value: '', label: '全部分类' }, ...cats.map((c) => ({ value: c, label: c }))];
  }, []);

  // ── 过滤后的商品列表 ──
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        return p.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [searchText, selectedCategory]);

  // ── 购物车统计 ──
  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // ── 购物车操作 ──
  const addToCart = useCallback(
    (product: Product) => {
      setCheckoutStatus('idle');
      setMessageText('');
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, { ...product, quantity: 1 }];
      });
      setMessageText(`已添加「${product.name}」到购物车`);
      setTimeout(() => setMessageText(''), 2000);
    },
    []
  );

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  // ── 结账 ──
  const handleCheckout = useCallback(() => {
    if (cart.length === 0) {
      setMessageText('购物车为空，请先添加商品');
      return;
    }
    if (!paymentMethod) {
      setMessageText('请选择支付方式');
      return;
    }

    setIsProcessing(true);
    setMessageText('');

    // 模拟结账延迟
    setTimeout(() => {
      setIsProcessing(false);
      // 模拟 90% 成功率
      if (Math.random() > 0.1) {
        setCheckoutStatus('success');
        setMessageText(`结账成功！支付方式：${PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)?.label}，金额 ${fm(cartTotal)}`);
        setCart([]);
        setPaymentMethod(null);
      } else {
        setCheckoutStatus('error');
        setMessageText('结账失败，请重试');
      }
    }, 1500);
  }, [cart, paymentMethod, cartTotal]);

  const clearMessage = useCallback(() => {
    setMessageText('');
    setCheckoutStatus('idle');
  }, []);

  // ── 支付方式选择 ──
  const handlePaymentSelect = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
    setMessageText(`已选择支付方式：${PAYMENT_OPTIONS.find((p) => p.value === method)?.label}`);
    setTimeout(() => setMessageText(''), 2000);
  }, []);

  // ============================================================
  // Render
  // ============================================================

  return (
    <PageShell
      title="收银台 — P-35"
      description="快速收银 · 商品选择 · 会员管理"
    >
      {/* 状态提示 */}
      {messageText && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 16px',
            border: `1px solid ${
              checkoutStatus === 'success'
                ? 'rgba(34,197,94,0.3)'
                : checkoutStatus === 'error'
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(99,102,241,0.3)'
            }`,
            background: `rgba(${
              checkoutStatus === 'success'
                ? '34,197,94'
                : checkoutStatus === 'error'
                  ? '239,68,68'
                  : '99,102,241'
            },0.1)`,
            color: checkoutStatus === 'success' ? '#86efac' : checkoutStatus === 'error' ? '#fca5a5' : '#a5b4fc',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{checkoutStatus === 'success' ? '✅ ' : checkoutStatus === 'error' ? '❌ ' : 'ℹ️ '}{messageText}</span>
          {checkoutStatus !== 'idle' && (
            <button
              onClick={clearMessage}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 18,
                padding: '0 4px',
              }}
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* 主布局: 左侧商品区 + 右侧购物车 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ─────────── 左侧：商品选择区 ─────────── */}
        <div style={darkCard}>
          <h3 style={sectionTitle}>🛍️ 商品选择</h3>

          {/* 搜索与分类过滤 */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索商品名称..."
                variant="filled"
                block
                aria-label="搜索商品"
              />
            </div>
            <div style={{ minWidth: 130 }}>
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryOptions}
                placeholder="全部分类"
              />
            </div>
          </div>

          {/* 商品列表 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
              maxHeight: 480,
              overflowY: 'auto',
            }}
          >
            {filteredProducts.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '48px 0',
                  color: '#64748b',
                  fontSize: 14,
                }}
              >
                未找到匹配商品
              </div>
            ) : (
              filteredProducts.map((product) => {
                const inCart = cart.find((item) => item.id === product.id);
                return (
                  <Card
                    key={product.id}
                    variant="outlined"
                    padding={14}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      onClick={() => addToCart(product)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && addToCart(product)}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                        {product.category} · 库存 {product.stock}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                        {fm(product.price)}
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      {inCart ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(product.id, -1)}
                          >
                            −
                          </Button>
                          <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>
                            {inCart.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(product.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          block
                          onClick={() => addToCart(product)}
                        >
                          + 加入购物车
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* ─────────── 右侧：购物车 + 会员 + 支付 ─────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 购物车 */}
          <div style={darkCard}>
            <h3 style={sectionTitle}>
              🛒 购物车
              {cartCount > 0 && (
                <Tag variant="primary" size="sm" style={{ marginLeft: 8 }}>
                  {cartCount} 件
                </Tag>
              )}
            </h3>

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 14 }}>
                购物车为空
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'rgba(15, 23, 42, 0.3)',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {fm(item.price)} / 件
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{ padding: '2px 8px', minWidth: 28 }}
                      >
                        −
                      </Button>
                      <span style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{ padding: '2px 8px', minWidth: 28 }}
                      >
                        +
                      </Button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          fontSize: 16,
                          padding: '2px 6px',
                          lineHeight: 1,
                        }}
                        aria-label={`移除 ${item.name}`}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ marginLeft: 12, fontSize: 14, fontWeight: 700, color: '#22c55e', minWidth: 72, textAlign: 'right' }}>
                      {fm(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 合计 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid rgba(148, 163, 184, 0.15)',
              }}
            >
              <span style={{ fontSize: 14, color: '#94a3b8' }}>合计</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{fm(cartTotal)}</span>
            </div>
          </div>

          {/* 会员信息 */}
          <div style={darkCard}>
            <h3 style={sectionTitle}>👤 会员信息</h3>
            {member ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#94a3b8' }}>姓名</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{member.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#94a3b8' }}>手机号</span>
                  <span style={{ color: '#e2e8f0' }}>{member.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#94a3b8' }}>会员卡号</span>
                  <span style={{ color: '#e2e8f0' }}>{member.cardNo}</span>
                </div>
                {member.points !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: '#94a3b8' }}>积分</span>
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>{member.points} 分</span>
                  </div>
                )}
                {member.tier && (
                  <Tag
                    variant="warning"
                    size="sm"
                    style={{ marginTop: 4, alignSelf: 'flex-start' }}
                  >
                    {member.tier === 'gold' ? '黄金会员' : member.tier === 'silver' ? '银卡会员' : member.tier}
                  </Tag>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#64748b', fontSize: 14 }}>
                暂无会员信息
              </div>
            )}
          </div>

          {/* 支付方式 */}
          <div style={darkCard}>
            <h3 style={sectionTitle}>💳 支付方式</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePaymentSelect(opt.value)}
                  style={{
                    borderRadius: 10,
                    padding: '12px 8px',
                    border: `2px solid ${
                      paymentMethod === opt.value
                        ? 'rgba(99,102,241,0.6)'
                        : 'rgba(148,163,184,0.15)'
                    }`,
                    background:
                      paymentMethod === opt.value
                        ? 'rgba(99,102,241,0.12)'
                        : 'rgba(15,23,42,0.25)',
                    color: paymentMethod === opt.value ? '#a5b4fc' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</div>
                  <div>{opt.label}</div>
                </button>
              ))}
            </div>
            {paymentMethod && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(99,102,241,0.08)',
                  color: '#a5b4fc',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                已选择：{PAYMENT_OPTIONS.find((p) => p.value === paymentMethod)?.label}
              </div>
            )}
          </div>

          {/* 结账按钮 */}
          <Button
            variant="primary"
            size="lg"
            block
            loading={isProcessing}
            onClick={handleCheckout}
            disabled={isProcessing}
            style={{
              padding: '16px',
              fontSize: 18,
              fontWeight: 700,
              borderRadius: 14,
            }}
          >
            {isProcessing ? '处理中...' : checkoutStatus === 'success' ? '✅ 结账成功' : `🧾 结算 ${fm(cartTotal)}`}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
