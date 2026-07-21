/**
 * 前台收银台 — P-35 Storefront Cashier Page
 *
 * PRD-001 驱动的收银台实现
 * 角色: 🛒 前台收银员
 * 场景: 店A 前台收银（街机/游艺厅）
 *
 * 实现验收卡:
 *   AC-35-01: 商品搜索
 *   AC-35-02: 商品添加到已选清单
 *   AC-35-03: 多件商品金额计算
 *   AC-35-04: 会员识别（手机号输入）
 *   AC-35-05: 会员折扣应用
 *   AC-35-07: 支付方式选择
 *   AC-35-10: 空结算防御
 */
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  PageShell,
  Button,
  Input,
  Card,
  Tag,
} from '@m5/ui';
import {
  buildStorefrontMemberId,
  ensureStorefrontMemberRegistered,
  startStorefrontCheckout,
  lookupStorefrontMember,
  type CheckoutPaymentMethod,
} from '../../lib/storefront-transactions';

// ============================================================
// 类型定义 （PRD §6 数据模型对齐）
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
  name: string;
  tier: string;
  tierLabel: string;
  discountRate: number;
  points: number;
}

type PaymentMethod = 'wechat' | 'balance' | 'cash';

// ============================================================
// 本地商品目录（前台收银快捷选择用，会员查询走真实 API）
// ============================================================

const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: '射击体验', price: 30, category: '射击类', stock: 999 },
  { id: 'p2', name: '赛车竞速', price: 40, category: '竞速类', stock: 999 },
  { id: 'p3', name: '跳舞机', price: 25, category: '音乐类', stock: 999 },
  { id: 'p4', name: '夹娃娃 (3次)', price: 15, category: '娱乐类', stock: 999 },
  { id: 'p5', name: 'VR体验', price: 50, category: '虚拟现实', stock: 999 },
  { id: 'p6', name: '篮球机', price: 20, category: '运动类', stock: 999 },
  { id: 'p7', name: '电竞套餐(单人)', price: 88, category: '套餐', stock: 999 },
  { id: 'p8', name: '电竞套餐(双人)', price: 158, category: '套餐', stock: 999 },
  { id: 'p9', name: '射击体验x5', price: 125, category: '射击类', stock: 999 },
  { id: 'p10', name: '不限时畅玩券', price: 199, category: '套餐', stock: 999 },
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'wechat', label: '微信扫码', icon: '💳' },
  { value: 'balance', label: '会员余额', icon: '💰' },
  { value: 'cash', label: '现金', icon: '💵' },
];

const DEFAULT_MEMBER_NAME = '门店散客';

function fm(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
}

function mapPaymentMethodToCheckoutMethod(method: PaymentMethod): CheckoutPaymentMethod {
  switch (method) {
    case 'balance':
      return 'member_card';
    case 'cash':
      return 'cash';
    case 'wechat':
    default:
      return 'wechat';
  }
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
  const router = useRouter();
  // ── 核心状态 ──
  const [searchText, setSearchText] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [memberPhone, setMemberPhone] = useState('');
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [messageText, setMessageText] = useState('');
  const [paymentCodeUrl, setPaymentCodeUrl] = useState('');

  // ── 商品过滤 ──
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });
  }, [searchText]);

  // ── 购物车统计 ──
  const rawTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const memberDiscountRate = member?.discountRate ?? 1;
  const discountAmount = rawTotal - Math.round(rawTotal * memberDiscountRate);
  const finalTotal = rawTotal - discountAmount;

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
      setMessageText(`✅ 已添加「${product.name}」到已选清单`);
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

  // ── 会员识别（AC-35-04: 真实API调用）──
  const handleLookupMember = useCallback(async () => {
    const trimmed = memberPhone.trim();
    if (!trimmed || trimmed.length < 11) {
      setMessageText('⚠️ 请输入完整的11位手机号');
      return;
    }
    try {
      const result = await lookupStorefrontMember(trimmed);
      if (result) {
        const tierLabel = (() => {
          switch (result.tier) {
            case 'gold': return '🏅 黄金会员';
            case 'silver': return '🥈 银卡会员';
            case 'diamond': return '💎 钻石会员';
            case 'bronze': return '🥉 铜牌会员';
            default: return '🪪 普卡会员';
          }
        })();
        const info: MemberInfo = {
          phone: result.phone,
          name: result.name,
          tier: result.tier,
          tierLabel,
          discountRate: result.discountRate,
          points: result.points,
        };
        setMember(info);
        setMessageText(
          `✅ 欢迎 ${info.name}！${tierLabel}，积分 ${info.points} 分`
        );
      } else {
        setMember(null);
        setMessageText('ℹ️ 未找到该会员，将按非会员结算');
      }
    } catch {
      setMember(null);
      setMessageText('⚠️ 查询会员失败，请稍后重试');
    }
    setTimeout(() => setMessageText(''), 4000);
  }, [memberPhone]);

  const handleClearMember = useCallback(() => {
    setMember(null);
    setMemberPhone('');
    setMessageText('已清除会员信息');
    setTimeout(() => setMessageText(''), 2000);
  }, []);

  // ── 支付选择 ──
  const handlePaymentSelect = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'wechat') {
      setPaymentCodeUrl('https://example.com/qr/wechat-pay-0001');
    } else {
      setPaymentCodeUrl('');
    }
    const label = PAYMENT_OPTIONS.find((p) => p.value === method)?.label;
    setMessageText(`✅ 已选择：${label}`);
    setTimeout(() => setMessageText(''), 2000);
  }, []);

  // ── 结账（含空结算防御） ──
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) {
      setMessageText('⚠️ 请添加商品');
      setCheckoutStatus('error');
      return;
    }
    if (!paymentMethod) {
      setMessageText('⚠️ 请选择支付方式');
      return;
    }

    setIsProcessing(true);
    setCheckoutStatus('idle');
    setMessageText('');

    try {
      const normalizedPhone = memberPhone.trim();
      const memberName = member?.name ?? (normalizedPhone ? `门店会员${normalizedPhone.slice(-4)}` : '门店散客');
      const memberId = buildStorefrontMemberId(normalizedPhone);
      const checkoutMethod = mapPaymentMethodToCheckoutMethod(paymentMethod);
      const checkoutItems = cart.map((item) => ({
        skuId: item.id,
        title: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      await ensureStorefrontMemberRegistered(memberId, memberName);
      const aggregate = await startStorefrontCheckout(
        memberId,
        checkoutItems,
        checkoutMethod,
        finalTotal,
      );

      setIsProcessing(false);
      setCheckoutStatus('success');
      setMessageText(
        `✅ 订单 ${aggregate.order.orderNo ?? aggregate.order.orderId} 已创建，正在跳转支付页`
      );
      setCart([]);
      setPaymentMethod(null);
      setPaymentCodeUrl('');
      router.push(`/h5/payment/${aggregate.order.orderId}`);
    } catch (error) {
      setCheckoutStatus('error');
      setMessageText(error instanceof Error ? `⚠️ ${error.message}` : '⚠️ 下单失败，请稍后重试');
      setIsProcessing(false);
    }
  }, [cart, finalTotal, member?.name, memberPhone, paymentMethod, router]);

  const resetOrder = useCallback(() => {
    setCart([]);
    setPaymentMethod(null);
    setPaymentCodeUrl('');
    setCheckoutStatus('idle');
    setMessageText('');
    setMemberPhone('');
    setMember(null);
  }, []);

  // ============================================================
  // Render
  // ============================================================

  return (
    <PageShell
      title="🧾 收银台 — P-35"
      description="快速收银 · 商品选择 · 会员识别 · 支付"
    >
      {/* 消息提示 */}
      {messageText && (
        <div
          style={{
            marginBottom: 16,
            borderRadius: 12,
            padding: '12px 16px',
            border: `1px solid ${
              checkoutStatus === 'success'
                ? 'rgba(34,197,94,0.3)'
                : messageText.includes('⚠️') || checkoutStatus === 'error'
                  ? 'rgba(239,68,68,0.3)'
                  : 'rgba(99,102,241,0.3)'
            }`,
            background: `rgba(${
              checkoutStatus === 'success'
                ? '34,197,94'
                : messageText.includes('⚠️') || checkoutStatus === 'error'
                  ? '239,68,68'
                  : '99,102,241'
            },0.1)`,
            color:
              checkoutStatus === 'success'
                ? '#86efac'
                : messageText.includes('⚠️') || checkoutStatus === 'error'
                  ? '#fca5a5'
                  : '#a5b4fc',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {messageText}
        </div>
      )}

      {/* 主布局 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ─── 左侧：商品区 ─── */}
        <div style={darkCard}>
          <h3 style={sectionTitle}>🎮 商品选择</h3>

          {/* AC-35-01: 商品搜索 */}
          <div style={{ marginBottom: 16 }}>
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="🔍 搜商品名称（如：射击）"
              variant="filled"
              block
              aria-label="搜索商品"
            />
          </div>

          {/* 商品列表 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              gap: 12,
              maxHeight: 540,
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
                      onKeyDown={(e) =>
                        e.key === 'Enter' && addToCart(product)
                      }
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#f1f5f9',
                          marginBottom: 4,
                        }}
                      >
                        {product.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#94a3b8',
                          marginBottom: 8,
                        }}
                      >
                        {product.category}
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#22c55e',
                        }}
                      >
                        {fm(product.price)}
                      </div>
                    </div>
                    <div style={{ marginTop: 10 }}>
                      {inCart ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(product.id, -1)}
                          >
                            −
                          </Button>
                          <span
                            style={{
                              color: '#e2e8f0',
                              fontSize: 14,
                              fontWeight: 600,
                              minWidth: 24,
                              textAlign: 'center',
                            }}
                          >
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

        {/* ─── 右侧：已选清单 + 会员 + 支付 ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* AC-35-02 & AC-35-03: 已选清单 + 金额计算 */}
          <div style={darkCard}>
            <h3 style={sectionTitle}>
              📋 已选清单
              {cartCount > 0 && (
                <Tag variant="primary" size="sm" style={{ marginLeft: 8 }}>
                  {cartCount} 件
                </Tag>
              )}
            </h3>

            {cart.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px 0',
                  color: '#64748b',
                  fontSize: 14,
                }}
              >
                请从左侧选择商品
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 260,
                  overflowY: 'auto',
                }}
              >
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
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#e2e8f0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#64748b',
                          marginTop: 2,
                        }}
                      >
                        {fm(item.price)} / 件
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginLeft: 8,
                      }}
                    >
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{
                          borderRadius: 6,
                          border: '1px solid rgba(148,163,184,0.25)',
                          background: 'rgba(15,23,42,0.4)',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          width: 26,
                          height: 26,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        −
                      </button>
                      <span
                        style={{
                          color: '#e2e8f0',
                          fontSize: 14,
                          fontWeight: 600,
                          minWidth: 20,
                          textAlign: 'center',
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{
                          borderRadius: 6,
                          border: '1px solid rgba(148,163,184,0.25)',
                          background: 'rgba(15,23,42,0.4)',
                          color: '#e2e8f0',
                          cursor: 'pointer',
                          width: 26,
                          height: 26,
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        +
                      </button>
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
                          marginLeft: 4,
                        }}
                        aria-label={`移除 ${item.name}`}
                      >
                        ×
                      </button>
                    </div>
                    <div
                      style={{
                        marginLeft: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#22c55e',
                        minWidth: 70,
                        textAlign: 'right',
                      }}
                    >
                      {fm(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 金额汇总 */}
            {cart.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(148, 163, 184, 0.15)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    color: '#94a3b8',
                    marginBottom: 4,
                  }}
                >
                  <span>小计</span>
                  <span>{fm(rawTotal)}</span>
                </div>
                {member && discountAmount > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      color: '#fbbf24',
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      会员折扣（{member.tierLabel}）
                    </span>
                    <span>-{fm(discountAmount)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 6,
                    paddingTop: 8,
                    borderTop: '1px solid rgba(148,163,184,0.12)',
                  }}
                >
                  <span
                    style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}
                  >
                    应付
                  </span>
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: '#22c55e',
                    }}
                  >
                    {fm(finalTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* AC-35-04 & AC-35-05: 会员识别 + 折扣 */}
          <div style={darkCard}>
            <h3 style={sectionTitle}>👤 会员识别</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <Input
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="输入会员手机号"
                  variant="filled"
                  block
                  aria-label="会员手机号"
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleLookupMember}>
                查询
              </Button>
              {member && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearMember}
                >
                  清除
                </Button>
              )}
            </div>

            {member ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>姓名</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                    {member.name}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>等级</span>
                  <Tag variant="warning" size="sm">
                    {member.tierLabel}
                  </Tag>
                </div>
                {(
                  <div
                    style={{
                      fontSize: 12,
                      color: '#fbbf24',
                      padding: '6px 10px',
                      borderRadius: 8,
                      background: 'rgba(251,191,36,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    {member.discountRate < 1
                      ? `🎉 ${member.tierLabel}享${Math.round(member.discountRate * 10)}折优惠`
                      : `🪪 ${member.tierLabel}无额外折扣`}
                    {discountAmount > 0 && (
                      <span>（已省 {fm(discountAmount)}）</span>
                    )}
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: '#94a3b8' }}>积分</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                    {member.points} 分
                  </span>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '8px 0',
                  color: '#64748b',
                  fontSize: 13,
                }}
              >
                输入手机号查询会员信息，自动应用折扣
              </div>
            )}
          </div>

          {/* AC-35-07: 支付方式选择 */}
          <div style={darkCard}>
            <h3 style={sectionTitle}>💳 支付方式</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
              }}
            >
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
                    color:
                      paymentMethod === opt.value
                        ? '#a5b4fc'
                        : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 4 }}>
                    {opt.icon}
                  </div>
                  <div>{opt.label}</div>
                </button>
              ))}
            </div>
            {paymentMethod === 'wechat' && paymentCodeUrl && (
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    color: '#e2e8f0',
                    fontSize: 12,
                    marginBottom: 8,
                  }}
                >
                  请使用微信扫码支付
                </div>
                <div
                  style={{
                    width: 140,
                    height: 140,
                    margin: '0 auto',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    color: '#333',
                  }}
                >
                  [二维码]
                </div>
              </div>
            )}
          </div>

          {/* AC-35-10: 空结算防御 */}
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
            {isProcessing
              ? '⏳ 正在创建订单...'
              : checkoutStatus === 'success'
                ? '✅ 订单已创建'
                : `🧾 结算 ${fm(finalTotal)}`}
          </Button>

          {checkoutStatus === 'success' && (
            <Button
              variant="outline"
              size="lg"
              block
              onClick={resetOrder}
              style={{
                padding: '14px',
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 14,
              }}
            >
              🔄 新订单
            </Button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
