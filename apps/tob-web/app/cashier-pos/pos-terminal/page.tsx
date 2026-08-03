'use client'

import React, { useState, useCallback } from 'react'
import { lookupMember, lookupProduct, generateReceipt, formatReceiptText, allocatePayment } from '../cashier-pos-service'
import type { Member, Product, POSItem, POSOrder, PaymentAllocation } from '../cashier-pos-data'

/* ─── Types ──────────────────────────────────── */

interface CartItem {
  sku: string
  name: string
  unitPrice: number
  quantity: number
}

interface MemberInfo {
  id: string
  name: string
  phone: string
  tier: string
  points: number
  discountRate: number
}

type PaymentMethod = 'CASH' | 'WECHAT' | 'ALIPAY' | 'CARD'

/* ─── Mock ────────────────────────────────────── */

const MOCK_PRODUCTS: Product[] = [
  { sku: 'SKU-001', name: '标准畅玩票', unitPrice: 8800, category: '门票' },
  { sku: 'SKU-002', name: 'VIP 通票', unitPrice: 18800, category: '门票' },
  { sku: 'SKU-003', name: '射击体验券', unitPrice: 3500, category: '体验' },
  { sku: 'SKU-004', name: 'VR 体验券', unitPrice: 5800, category: '体验' },
  { sku: 'SKU-005', name: '生日派对套餐', unitPrice: 38800, category: '套餐' },
]

const MOCK_MEMBERS: Member[] = [
  { memberNo: 'M-001', name: '张先生', phone: '13800138001', tier: "GOLD", points: 2500, discountRate: 0.95, memberId: "m-001", balanceCents: 50000 },
  { memberNo: 'M-002', name: '李女士', phone: '13900139002', tier: "PLATINUM", points: 8200, discountRate: 0.92, memberId: "m-002", balanceCents: 120000 },
  { memberNo: 'M-003', name: '王先生', phone: '13700137003', tier: "DIAMOND", points: 15300, discountRate: 0.90, memberId: "m-003", balanceCents: 300000 },
]

function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function generateOrderId(): string { return `ORD-${Date.now()}` }

/* ─── Page ────────────────────────────────────── */

export default function PosTerminalPage() {
  // ── States ──
  const [cart, setCart] = useState<CartItem[]>([])
  const [skuInput, setSkuInput] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [currentMember, setCurrentMember] = useState<MemberInfo | null>(null)
  const [paymentResult, setPaymentResult] = useState<string | null>(null)
  const [receiptText, setReceiptText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [memberLoading, setMemberLoading] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')

  // ── Scan Product ──
  const handleScan = useCallback(async () => {
    const sku = skuInput.trim()
    if (!sku) return
    setScanLoading(true)
    setError(null)

    try {
      const product = await lookupProduct(sku)
      if (product) {
        addToCart(product.sku, product.name, product.unitPrice)
        setSkuInput('')
        return
      }
    } catch { /* fall through to mock */ }

    const mock = MOCK_PRODUCTS.find(p => p.sku === sku)
    if (mock) {
      addToCart(mock.sku, mock.name, mock.unitPrice)
      setSkuInput('')
    } else {
      setError(`商品 ${sku} 不存在`)
    }
    setScanLoading(false)
  }, [skuInput])

  function addToCart(sku: string, name: string, price: number) {
    setCart(prev => {
      const existing = prev.find(i => i.sku === sku)
      if (existing) return prev.map(i => i.sku === sku ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { sku, name, unitPrice: price, quantity: 1 }]
    })
  }

  // ── Member Lookup ──
  const handleMemberLookup = useCallback(async () => {
    const query = memberQuery.trim()
    if (!query) return
    setMemberLoading(true)
    setError(null)

    try {
      const isPhone = /^1\d{10}$/.test(query)
      const member = await lookupMember(isPhone ? { phone: query } : { memberNo: query })
      if (member) {
        setCurrentMember({
          id: member.memberNo,
          name: member.name,
          phone: member.phone,
          tier: member.tier,
          points: member.points,
          discountRate: member.discountRate ?? 1,
        })
        setMemberLoading(false)
        return
      }
    } catch { /* fall through */ }

    // mock fallback
    const mockMember = MOCK_MEMBERS.find(m => m.phone === query || m.memberNo === query)
    if (mockMember) {
      setCurrentMember({
        id: mockMember.memberNo,
        name: mockMember.name,
        phone: mockMember.phone,
        tier: mockMember.tier,
        points: mockMember.points,
        discountRate: mockMember.discountRate ?? 1,
      })
    } else {
      setError('未找到会员')
    }
    setMemberLoading(false)
  }, [memberQuery])

  // ── Checkout ──
  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return
    setPaymentLoading(true)
    setError(null)
    setPaymentResult(null)
    setReceiptText(null)

    const subtotalCents = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    const discountCents = currentMember ? Math.round(subtotalCents * (1 - currentMember.discountRate)) : 0
    const totalCents = subtotalCents - discountCents
    const taxCents = Math.round(subtotalCents * 0.1)
    const orderId = generateOrderId()

    // 构建 POSOrder (模拟)
    const items: POSItem[] = cart.map((c, idx) => ({
      itemId: `ITM-${orderId}-${idx}`,
      name: c.name,
      qty: c.quantity,
      unitPrice: c.unitPrice,
      discount: currentMember ? Math.round(c.unitPrice * c.quantity * (1 - currentMember.discountRate)) : 0,
    }))

    const order: POSOrder = {
      orderId,
      items,
      subtotal: subtotalCents / 100,
      tax: taxCents / 100,
      total: totalCents / 100,
      status: 'paid',
      channel: 'POS',
      offlineCreated: false,
      payments: [{
        paymentId: `PAY-${Date.now()}`,
        method: paymentMethod,
        amountCents: totalCents,
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
      }],
    }

    // 生成收据
    const storeName = '神机营·旗舰店'
    const receipt = generateReceipt({
      order,
      member: currentMember ? {
        memberId: currentMember.id,
        memberNo: currentMember.id,
        name: currentMember.name,
        phone: currentMember.phone,
        tier: currentMember.tier as "GOLD" | "PLATINUM" | "DIAMOND",
        points: currentMember.points,
        balanceCents: currentMember.points * 10,
      } : undefined,
      cashier: '收银员01',
      storeName,
      discountApplied: discountCents / 100,
    })
    const formatted = formatReceiptText(receipt)
    setReceiptText(formatted)
    setPaymentResult(`支付成功! 订单 ${orderId}，${formatCents(totalCents)}`)
    setCart([])
    setPaymentLoading(false)
  }, [cart, currentMember, paymentMethod])

  // ── Remove Item ──
  function removeFromCart(sku: string) {
    setCart(prev => prev.filter(i => i.sku !== sku))
  }

  function clearAll() {
    setCart([])
    setCurrentMember(null)
    setPaymentResult(null)
    setReceiptText(null)
    setError(null)
    setSkuInput('')
    setMemberQuery('')
  }

  // ── Computed ──
  const subtotalCents = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const discountCents = currentMember ? Math.round(subtotalCents * (1 - currentMember.discountRate)) : 0
  const totalCents = subtotalCents - discountCents

  // ── Render ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f5f6fa' }}>
      {/* ── Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff', padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>收银终端 POS</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {currentMember && (
            <span style={{ background: '#27ae60', padding: '4px 12px', borderRadius: 12, fontSize: 13 }}>
              {currentMember.name} · {currentMember.tier} · {Math.round((1 - currentMember.discountRate) * 100)}%OFF
            </span>
          )}
          <button onClick={clearAll} style={{ background: '#e74c3c', border: 'none', color: '#fff', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>
            清空
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ══════ Left Panel ══════ */}
        <div style={{ width: '45%', borderRight: '1px solid #ddd', padding: 16, background: '#fff', overflowY: 'auto' }}>
          {/* ── Product Scan ── */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, marginBottom: 8, color: '#333' }}>📦 商品扫查询</h2>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                data-testid="sku-input"
                value={skuInput}
                onChange={e => setSkuInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="扫码/输入 SKU 后回车"
                style={{ flex: 1, padding: '10px 12px', fontSize: 15, border: '2px solid #3498db', borderRadius: 6, outline: 'none' }}
              />
              <button data-testid="scan-btn" onClick={handleScan} disabled={scanLoading}
                style={{ padding: '10px 18px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                {scanLoading ? '...' : '查询'}
              </button>
            </div>
            {/* Quick Scan Buttons */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {MOCK_PRODUCTS.map(p => (
                <button key={p.sku} data-testid={`quick-sku-${p.sku}`} onClick={() => { setSkuInput(p.sku); addToCart(p.sku, p.name, p.unitPrice) }}
                  style={{ padding: '5px 10px', background: '#ecf0f1', border: '1px solid #bdc3c7', borderRadius: 4, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {p.name} {formatCents(p.unitPrice)}
                </button>
              ))}
            </div>
          </section>

          {/* ── Member Lookup ── */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, marginBottom: 8, color: '#333' }}>👤 会员查询</h2>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                data-testid="member-input"
                value={memberQuery}
                onChange={e => setMemberQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMemberLookup()}
                placeholder="手机号 / 会员号"
                style={{ flex: 1, padding: '10px 12px', fontSize: 15, border: '2px solid #2ecc71', borderRadius: 6, outline: 'none' }}
              />
              <button data-testid="member-btn" onClick={handleMemberLookup} disabled={memberLoading}
                style={{ padding: '10px 18px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                {memberLoading ? '...' : '查询'}
              </button>
            </div>
            {currentMember && (
              <div data-testid="member-info" style={{ marginTop: 8, padding: 10, background: '#f0fff4', borderRadius: 6, border: '1px solid #b2dfdb', fontSize: 14 }}>
                <strong>{currentMember.name}</strong> · {currentMember.tier} · {currentMember.phone}
                <div style={{ marginTop: 4, fontSize: 13, color: '#555' }}>
                  积分: {currentMember.points} · 折扣: {Math.round((1 - currentMember.discountRate) * 100)}%
                </div>
              </div>
            )}
          </section>

          {/* ── Payment Method ── */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, marginBottom: 8, color: '#333' }}>💳 支付方式</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['CASH', 'WECHAT', 'ALIPAY', 'CARD'] as PaymentMethod[]).map(m => (
                <button key={m} data-testid={`pay-${m}`} onClick={() => setPaymentMethod(m)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, border: paymentMethod === m ? '2px solid #2980b9' : '1px solid #ccc',
                    background: paymentMethod === m ? '#eaf4ff' : '#fff', cursor: 'pointer', fontSize: 13,
                  }}>
                  {m === 'CASH' ? '💵 现金' : m === 'WECHAT' ? '💚 微信' : m === 'ALIPAY' ? '💙 支付宝' : '💳 银行卡'}
                </button>
              ))}
            </div>
          </section>

          {/* ── Status Messages ── */}
          {paymentResult && (
            <div data-testid="payment-result" style={{ padding: 12, background: '#d4edda', borderRadius: 6, marginBottom: 12, border: '1px solid #c3e6cb' }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#155724' }}>{paymentResult}</p>
            </div>
          )}
          {error && (
            <div style={{ padding: 12, background: '#f8d7da', borderRadius: 6, marginBottom: 12, border: '1px solid #f5c6cb' }}>
              <p style={{ margin: 0, color: '#721c24' }}>{error}</p>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#721c24', cursor: 'pointer', fontSize: 12, marginTop: 4 }}>关闭</button>
            </div>
          )}

          {/* ── Receipt ── */}
          {receiptText && (
            <div data-testid="receipt" style={{ padding: 12, background: '#fffbe6', borderRadius: 6, border: '1px solid #ffe58f' }}>
              <pre style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', margin: 0 }}>{receiptText}</pre>
            </div>
          )}
        </div>

        {/* ══════ Right Panel: Cart ══════ */}
        <div style={{ flex: 1, padding: 16, background: '#fff', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 15, marginBottom: 8, color: '#333' }}>🛒 购物车 ({cart.reduce((s, i) => s + i.quantity, 0)} 件)</h2>

          <div data-testid="cart-items" style={{ flex: 1, overflowY: 'auto', border: '1px solid #eee', borderRadius: 6, padding: 8, background: '#fafafa' }}>
            {cart.length === 0 ? (
              <div data-testid="empty-cart" style={{ textAlign: 'center', marginTop: 60, color: '#bbb' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🛒</div>
                <p>购物车为空</p>
                <p style={{ fontSize: 13 }}>请扫码添加商品</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.sku} data-testid={`cart-item-${item.sku}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 8px', borderBottom: '1px solid #eee',
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                      {formatCents(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 'bold', fontSize: 16 }}>{formatCents(item.unitPrice * item.quantity)}</span>
                    <button onClick={() => removeFromCart(item.sku)} style={{ background: '#fee', border: 'none', color: '#e74c3c', cursor: 'pointer', borderRadius: 12, padding: '2px 8px', fontSize: 12 }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Summary ── */}
          <div style={{ borderTop: '2px solid #333', padding: '12px 0', marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#666', marginBottom: 4 }}>
              <span>小计</span>
              <span>{formatCents(subtotalCents)}</span>
            </div>
            {discountCents > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#27ae60', marginBottom: 4 }}>
                <span>会员折扣 ({Math.round((1 - (currentMember?.discountRate ?? 1)) * 100)}%)</span>
                <span>-{formatCents(discountCents)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, fontWeight: 'bold', marginTop: 6, color: '#c0392b' }}>
              <span>合计</span>
              <span>{formatCents(totalCents)}</span>
            </div>
          </div>

          {/* ── Checkout Button ── */}
          <button data-testid="checkout-btn" onClick={handleCheckout}
            disabled={cart.length === 0 || paymentLoading}
            style={{
              width: '100%', padding: 14, fontSize: 18, fontWeight: 'bold', border: 'none', borderRadius: 8,
              marginTop: 8, cursor: cart.length === 0 || paymentLoading ? 'not-allowed' : 'pointer',
              background: cart.length === 0 ? '#ccc' : '#27ae60', color: '#fff',
            }}>
            {paymentLoading ? '处理中...' : `结账 ${formatCents(totalCents)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
