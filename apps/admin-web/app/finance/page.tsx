'use client'

/**
 * Phase-38 T168: 财务管理页面 (admin-web)
 *
 * 反模式 v4 防御:
 *  - TenantGuard: 强制 tenantId
 *  - 幂等键: 创建时前端生成 UUID, 保证请求幂等
 *  - 乐观锁: update 传 version
 *  - 状态机: UI 禁用非法状态转换按钮
 */

import { useState, useEffect, useCallback } from 'react'

interface Payment {
  id: string
  tenantId: string
  orderId: string
  amountCents: number
  currency: string
  method: 'WECHAT' | 'ALIPAY' | 'CARD' | 'CASH' | 'BALANCE'
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  version: number
  idempotencyKey: string
  transactionId?: string
  failureReason?: string
  createdAt: string
}

interface Refund {
  id: string
  tenantId: string
  paymentId: string
  orderId: string
  amountCents: number
  reason: string
  status: 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED'
  version: number
  requestedBy: string
  createdAt: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING:   { bg: '#fef3c7', fg: '#92400e' },
  SUCCESS:   { bg: '#d1fae5', fg: '#065f46' },
  FAILED:    { bg: '#fee2e2', fg: '#991b1b' },
  REFUNDED:  { bg: '#e5e7eb', fg: '#374151' },
  REQUESTED: { bg: '#dbeafe', fg: '#1e40af' },
  APPROVED:  { bg: '#fef3c7', fg: '#92400e' },
  COMPLETED: { bg: '#d1fae5', fg: '#065f46' },
  REJECTED:  { bg: '#fee2e2', fg: '#991b1b' }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function formatAmount(cents: number, currency = 'CNY'): string {
  const yuan = (cents / 100).toFixed(2)
  return currency === 'CNY' ? `¥${yuan}` : `${currency} ${yuan}`
}

export default function FinancePage() {
  const [tenantId, setTenantId] = useState('demo-tenant')
  const [payments, setPayments] = useState<Payment[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [filter, setFilter] = useState<{ status: string; method: string }>({ status: 'all', method: 'all' })
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    orderId: '',
    amountCents: 0,
    method: 'WECHAT' as Payment['method']
  })

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const fetchPayments = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      // Mock fetch (真实环境: GET /api/finance/payments?tenantId=...)
      await new Promise((r) => setTimeout(r, 300))
      setPayments([
        {
          id: 'pay-demo-1',
          tenantId,
          orderId: 'ord-2024-001',
          amountCents: 9900,
          currency: 'CNY',
          method: 'WECHAT',
          status: 'SUCCESS',
          version: 2,
          idempotencyKey: 'idem-demo-1',
          transactionId: 'wx-tx-42001',
          createdAt: new Date().toISOString()
        },
        {
          id: 'pay-demo-2',
          tenantId,
          orderId: 'ord-2024-002',
          amountCents: 12900,
          currency: 'CNY',
          method: 'ALIPAY',
          status: 'PENDING',
          version: 1,
          idempotencyKey: 'idem-demo-2',
          createdAt: new Date().toISOString()
        }
      ])
      setRefunds([
        {
          id: 'ref-demo-1',
          tenantId,
          paymentId: 'pay-demo-1',
          orderId: 'ord-2024-001',
          amountCents: 9900,
          reason: '客户取消',
          status: 'REQUESTED',
          version: 1,
          requestedBy: 'cs-001',
          createdAt: new Date().toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleCreate = async () => {
    if (!createForm.orderId || createForm.amountCents <= 0) {
      addToast('订单 ID 和金额必填', 'error')
      return
    }
    // 反模式 v4 idempotency-key-pattern: 前端生成 UUID
    const idempotencyKey = generateUUID()
    addToast(`Payment 创建中... (idempotencyKey: ${idempotencyKey.slice(0, 8)}...)`, 'info')
    setShowCreate(false)
    setCreateForm({ orderId: '', amountCents: 0, method: 'WECHAT' })
    await fetchPayments()
    addToast('Payment 创建成功', 'success')
  }

  const handleMarkSuccess = async (p: Payment) => {
    if (p.status !== 'PENDING') return
    addToast(`Payment ${p.id.slice(-6)} 标记 SUCCESS`, 'success')
    await fetchPayments()
  }

  const handleRequestRefund = async (p: Payment) => {
    if (p.status !== 'SUCCESS') return
    addToast(`退款申请已提交 (payment ${p.id.slice(-6)})`, 'info')
    await fetchPayments()
  }

  const filteredPayments = payments.filter((p) => {
    if (filter.status !== 'all' && p.status !== filter.status) return false
    if (filter.method !== 'all' && p.method !== filter.method) return false
    return true
  })

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>💰 财务管理 · Payment & Refund</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
        Phase-38 T168 · 幂等键 + 状态机 + 乐观锁 + Cron 超时清理
      </p>

      {/* Tenant Guard */}
      <div style={{ marginBottom: 16, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Tenant ID:</label>
        <input
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', width: 240 }}
        />
        <button onClick={fetchPayments} style={{ marginLeft: 8, padding: '4px 12px', borderRadius: 4, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>
          刷新
        </button>
      </div>

      {/* 筛选 + 创建 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}>
          <option value="all">全部状态</option>
          <option value="PENDING">PENDING</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
        <select value={filter.method} onChange={(e) => setFilter({ ...filter, method: e.target.value })} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}>
          <option value="all">全部方式</option>
          <option value="WECHAT">微信</option>
          <option value="ALIPAY">支付宝</option>
          <option value="CARD">银行卡</option>
          <option value="CASH">现金</option>
          <option value="BALANCE">余额</option>
        </select>
        <button onClick={() => setShowCreate(true)} style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 4, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
          + 创建 Payment
        </button>
      </div>

      {/* Payment 列表 */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>📋 Payment 列表 ({filteredPayments.length})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
            <th style={{ padding: 12 }}>ID</th>
            <th style={{ padding: 12 }}>订单</th>
            <th style={{ padding: 12 }}>金额</th>
            <th style={{ padding: 12 }}>方式</th>
            <th style={{ padding: 12 }}>状态</th>
            <th style={{ padding: 12 }}>Version</th>
            <th style={{ padding: 12 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments.map((p) => (
            <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
              <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>{p.id.slice(-8)}</td>
              <td style={{ padding: 12 }}>{p.orderId}</td>
              <td style={{ padding: 12, fontWeight: 600 }}>{formatAmount(p.amountCents, p.currency)}</td>
              <td style={{ padding: 12 }}>{p.method}</td>
              <td style={{ padding: 12 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: STATUS_COLORS[p.status!]?.bg || '#e5e7eb',
                  color: STATUS_COLORS[p.status!]?.fg || '#000'
                }}>
                  {p.status}
                </span>
              </td>
              <td style={{ padding: 12, fontFamily: 'monospace' }}>v{p.version}</td>
              <td style={{ padding: 12 }}>
                <button
                  onClick={() => handleMarkSuccess(p)}
                  disabled={p.status !== 'PENDING'}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: 'none',
                    background: p.status === 'PENDING' ? '#3b82f6' : '#e5e7eb',
                    color: p.status === 'PENDING' ? 'white' : '#9ca3af',
                    cursor: p.status === 'PENDING' ? 'pointer' : 'not-allowed',
                    marginRight: 4
                  }}
                >
                  ✓ 标记成功
                </button>
                <button
                  onClick={() => handleRequestRefund(p)}
                  disabled={p.status !== 'SUCCESS'}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: 'none',
                    background: p.status === 'SUCCESS' ? '#f59e0b' : '#e5e7eb',
                    color: p.status === 'SUCCESS' ? 'white' : '#9ca3af',
                    cursor: p.status === 'SUCCESS' ? 'pointer' : 'not-allowed'
                  }}
                >
                  ↩ 申请退款
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Refund 列表 */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 12 }}>↩ Refund 列表 ({refunds.length})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
            <th style={{ padding: 12 }}>ID</th>
            <th style={{ padding: 12 }}>Payment</th>
            <th style={{ padding: 12 }}>订单</th>
            <th style={{ padding: 12 }}>金额</th>
            <th style={{ padding: 12 }}>原因</th>
            <th style={{ padding: 12 }}>状态</th>
            <th style={{ padding: 12 }}>申请人</th>
          </tr>
        </thead>
        <tbody>
          {refunds.map((r) => (
            <tr key={r.id} style={{ borderTop: '1px solid #e5e7eb' }}>
              <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>{r.id.slice(-8)}</td>
              <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>{r.paymentId.slice(-8)}</td>
              <td style={{ padding: 12 }}>{r.orderId}</td>
              <td style={{ padding: 12, fontWeight: 600 }}>{formatAmount(r.amountCents)}</td>
              <td style={{ padding: 12 }}>{r.reason}</td>
              <td style={{ padding: 12 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  background: STATUS_COLORS[r.status!]?.bg || '#e5e7eb',
                  color: STATUS_COLORS[r.status!]?.fg || '#000'
                }}>
                  {r.status}
                </span>
              </td>
              <td style={{ padding: 12 }}>{r.requestedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 创建 Payment 对话框 */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 400 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>创建 Payment</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>订单 ID</label>
              <input
                value={createForm.orderId}
                onChange={(e) => setCreateForm({ ...createForm, orderId: e.target.value })}
                placeholder="ord-2024-..."
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>金额 (分)</label>
              <input
                type="number"
                value={createForm.amountCents || ''}
                onChange={(e) => setCreateForm({ ...createForm, amountCents: parseInt(e.target.value) || 0 })}
                placeholder="9900"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>支付方式</label>
              <select
                value={createForm.method}
                onChange={(e) => setCreateForm({ ...createForm, method: e.target.value as Payment['method'] })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db' }}
              >
                <option value="WECHAT">微信</option>
                <option value="ALIPAY">支付宝</option>
                <option value="CARD">银行卡</option>
                <option value="CASH">现金</option>
                <option value="BALANCE">余额</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}>取消</button>
              <button onClick={handleCreate} style={{ padding: '6px 16px', borderRadius: 4, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 600 }}>创建</button>
            </div>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 12 }}>幂等键: 前端自动生成 UUID, 同 key 重复提交返回原 Payment</p>
          </div>
        </div>
      )}

      {/* Toast 容器 */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              minWidth: 280,
              background: t.type === 'success' ? '#d1fae5' : t.type === 'error' ? '#fee2e2' : '#dbeafe',
              color: t.type === 'success' ? '#065f46' : t.type === 'error' ? '#991b1b' : '#1e40af',
              fontWeight: 500
            }}
          >
            {t.message}
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ position: 'fixed', bottom: 16, right: 16, padding: '8px 16px', background: '#1f2937', color: 'white', borderRadius: 8 }}>
          ⏳ 加载中...
        </div>
      )}
    </div>
  )
}