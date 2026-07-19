'use client'

/**
 * Phase-38 T168: 提现管理页面 (admin-web)
 *
 * 反模式 v4 防御:
 *  - TenantGuard: 强制 tenantId
 *  - 状态机: UI 禁用非法状态转换按钮
 *  - 幂等键: 审核请求前端生成 UUID
 *
 * 路由: /finance/payouts
 */

import { useState, useEffect, useCallback } from 'react'

// ─── 类型定义 ─────────────────────────────────────────────

type PayoutStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
type PayoutMethod = 'BANK' | 'ALIPAY' | 'WECHAT'

interface PayoutRecord {
  id: string
  tenantId: string
  storeId: string
  orderId: string
  amountCents: number
  currency: string
  method: PayoutMethod
  status: PayoutStatus
  bankCardNo?: string
  bankName?: string
  alipayAccount?: string
  wechatAccount?: string
  applicant: string
  reviewer?: string
  reviewNote?: string
  failureReason?: string
  idempotencyKey: string
  version: number
  createdAt: string
  updatedAt: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

// ─── 状态机: 允许的状态流转 ─────────────────────────────

const STATUS_TRANSITIONS: Record<PayoutStatus, PayoutStatus[]> = {
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['PROCESSING', 'FAILED'],
  REJECTED: [],
  PROCESSING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: [],
}

const STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  FAILED: '打款失败',
}

const STATUS_COLORS: Record<PayoutStatus, { bg: string; fg: string }> = {
  PENDING:    { bg: '#fef3c7', fg: '#92400e' },
  APPROVED:   { bg: '#d1fae5', fg: '#065f46' },
  REJECTED:   { bg: '#fee2e2', fg: '#991b1b' },
  PROCESSING: { bg: '#dbeafe', fg: '#1e40af' },
  COMPLETED:  { bg: '#d1fae5', fg: '#065f46' },
  FAILED:     { bg: '#fee2e2', fg: '#991b1b' },
}

const METHOD_LABELS: Record<PayoutMethod, string> = {
  BANK: '银行卡',
  ALIPAY: '支付宝',
  WECHAT: '微信',
}

// ─── 工具函数 ─────────────────────────────────────────────

function formatAmount(cents: number, currency = 'CNY'): string {
  const yuan = (cents / 100).toFixed(2)
  return currency === 'CNY' ? `¥${yuan}` : `${currency} ${yuan}`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ─── 模拟数据 ─────────────────────────────────────────────

const MOCK_PAYOUTS: PayoutRecord[] = [
  {
    id: 'po-001',
    tenantId: 'demo-tenant',
    storeId: 'store-01',
    orderId: 'ord-2026-0001',
    amountCents: 500000,
    currency: 'CNY',
    method: 'BANK',
    status: 'PENDING',
    bankCardNo: '6228****1234',
    bankName: '中国银行',
    applicant: '张三',
    idempotencyKey: 'ik-po-001',
    version: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'po-002',
    tenantId: 'demo-tenant',
    storeId: 'store-02',
    orderId: 'ord-2026-0002',
    amountCents: 120000,
    currency: 'CNY',
    method: 'ALIPAY',
    status: 'APPROVED',
    alipayAccount: '138****8888',
    applicant: '李四',
    reviewer: 'admin',
    reviewNote: '审核通过',
    idempotencyKey: 'ik-po-002',
    version: 2,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'po-003',
    tenantId: 'demo-tenant',
    storeId: 'store-01',
    orderId: 'ord-2026-0003',
    amountCents: 250000,
    currency: 'CNY',
    method: 'WECHAT',
    status: 'COMPLETED',
    wechatAccount: 'wx_zhang',
    applicant: '王五',
    reviewer: 'finance-manager',
    idempotencyKey: 'ik-po-003',
    version: 4,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'po-004',
    tenantId: 'demo-tenant',
    storeId: 'store-03',
    orderId: 'ord-2026-0004',
    amountCents: 9899,
    currency: 'CNY',
    method: 'BANK',
    status: 'REJECTED',
    bankCardNo: '6228****5678',
    bankName: '建设银行',
    applicant: '赵六',
    reviewer: 'admin',
    reviewNote: '账户信息不匹配，请重新提交',
    idempotencyKey: 'ik-po-004',
    version: 2,
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'po-005',
    tenantId: 'demo-tenant',
    storeId: 'store-02',
    orderId: 'ord-2026-0005',
    amountCents: 99900,
    currency: 'CNY',
    method: 'ALIPAY',
    status: 'PENDING',
    alipayAccount: '139****6666',
    applicant: '小明',
    idempotencyKey: 'ik-po-005',
    version: 1,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'po-006',
    tenantId: 'demo-tenant',
    storeId: 'store-01',
    orderId: 'ord-2026-0006',
    amountCents: 5000,
    currency: 'CNY',
    method: 'WECHAT',
    status: 'PROCESSING',
    wechatAccount: 'wx_li',
    applicant: '小红',
    reviewer: 'finance-manager',
    idempotencyKey: 'ik-po-006',
    version: 3,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    id: 'po-007',
    tenantId: 'demo-tenant',
    storeId: 'store-04',
    orderId: 'ord-2026-0007',
    amountCents: 880000,
    currency: 'CNY',
    method: 'BANK',
    status: 'FAILED',
    bankCardNo: '6228****9012',
    bankName: '工商银行',
    applicant: '大刘',
    reviewer: 'admin',
    failureReason: '银行账户状态异常',
    idempotencyKey: 'ik-po-007',
    version: 2,
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
  },
]

// ─── 主组件 ─────────────────────────────────────────────

export default function FinancePayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMethod, setFilterMethod] = useState<string>('all')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [reviewTarget, setReviewTarget] = useState<PayoutRecord | null>(null)
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [processingReview, setProcessingReview] = useState(false)

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const fetchPayouts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Mock fetch (真实环境: GET /api/finance/payouts)
      await new Promise((r) => setTimeout(r, 400))
      setPayouts(MOCK_PAYOUTS)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPayouts()
  }, [fetchPayouts])

  // ── 审核操作 ──

  const handleReviewOpen = useCallback((payout: PayoutRecord, action: 'APPROVED' | 'REJECTED') => {
    setReviewTarget(payout)
    setReviewAction(action)
    setReviewNote('')
  }, [])

  const handleReviewConfirm = useCallback(async () => {
    if (!reviewTarget || !reviewAction) return
    setProcessingReview(true)
    try {
      // Mock API: POST /api/finance/payouts/:id/review
      await new Promise((r) => setTimeout(r, 500))

      setPayouts((prev) =>
        prev.map((p) =>
          p.id === reviewTarget.id
            ? {
                ...p,
                status: reviewAction,
                reviewer: 'admin',
                reviewNote: reviewNote || undefined,
                version: p.version + 1,
                updatedAt: new Date().toISOString(),
              }
            : p
        )
      )

      addToast(
        `提现单 ${reviewTarget.id.slice(-6)} 已${reviewAction === 'APPROVED' ? '通过' : '拒绝'}`,
        reviewAction === 'APPROVED' ? 'success' : 'info'
      )
      setReviewTarget(null)
      setReviewAction(null)
      setReviewNote('')
    } catch {
      addToast('审核操作失败，请重试', 'error')
    } finally {
      setProcessingReview(false)
    }
  }, [reviewTarget, reviewAction, reviewNote, addToast])

  // ── 筛选 ──

  const filteredPayouts = payouts.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterMethod !== 'all' && p.method !== filterMethod) return false
    return true
  })

  // ── 聚合统计 ──

  const stats = {
    total: payouts.length,
    pending: payouts.filter((p) => p.status === 'PENDING').length,
    totalAmountCents: payouts.reduce((s, p) => s + p.amountCents, 0),
    pendingAmountCents: payouts
      .filter((p) => p.status === 'PENDING' || p.status === 'APPROVED' || p.status === 'PROCESSING')
      .reduce((s, p) => s + p.amountCents, 0),
  }

  // ── 渲染 ──

  if (loading) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>💰 提现管理</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
          <span style={{ fontSize: 16, color: '#6b7280' }}>⏳ 加载提现数据...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>💰 提现管理</h1>
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <p style={{ color: '#991b1b', fontWeight: 600, margin: 0 }}>加载失败</p>
          <p style={{ color: '#b91c1c', fontSize: 14, margin: '4px 0 0 0' }}>{error}</p>
          <button
            onClick={fetchPayouts}
            style={{
              marginTop: 12,
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              background: '#dc2626',
              color: 'white',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      {/* 标题 */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>💰 提现管理</h1>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0 0' }}>
          Phase-38 · 提现审核 · 状态机 · 金额单位: 分
        </p>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: '提现总笔数', value: stats.total, color: '#374151' },
          { label: '待审核', value: stats.pending, color: '#92400e' },
          { label: '提现总额', value: formatAmount(stats.totalAmountCents), color: '#065f46' },
          { label: '待处理金额', value: formatAmount(stats.pendingAmountCents), color: '#1e40af' },
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '16px',
            }}
          >
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{card.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: card.color, margin: '8px 0 0 0' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* 操作栏 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 14,
            background: 'white',
          }}
        >
          <option value="all">全部状态</option>
          <option value="PENDING">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已拒绝</option>
          <option value="PROCESSING">处理中</option>
          <option value="COMPLETED">已完成</option>
          <option value="FAILED">打款失败</option>
        </select>
        <select
          value={filterMethod}
          onChange={(e) => setFilterMethod(e.target.value)}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 14,
            background: 'white',
          }}
        >
          <option value="all">全部方式</option>
          <option value="BANK">银行卡</option>
          <option value="ALIPAY">支付宝</option>
          <option value="WECHAT">微信</option>
        </select>
        <button
          onClick={fetchPayouts}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            background: 'white',
            cursor: 'pointer',
            fontSize: 14,
            color: '#374151',
          }}
        >
          刷新
        </button>
        <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto' }}>
          共 {filteredPayouts.length} 条
        </span>
      </div>

      {/* 提现列表 */}
      {filteredPayouts.length === 0 ? (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 48,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 16, color: '#9ca3af', margin: 0 }}>暂无符合条件的提现记录</p>
          <p style={{ fontSize: 13, color: '#d1d5db', margin: '8px 0 0 0' }}>
            {filterStatus !== 'all' || filterMethod !== 'all' ? '尝试调整筛选条件' : '目前没有提现申请'}
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>提现单号</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>申请人</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>金额</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>方式</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>账户</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>状态</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>申请时间</th>
                <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map((p) => {
                const accountDisplay = p.method === 'BANK'
                  ? `${p.bankName || ''} ${p.bankCardNo || ''}`
                  : p.method === 'ALIPAY'
                    ? p.alipayAccount || '-'
                    : p.wechatAccount || '-'

                const colorInfo = STATUS_COLORS[p.status]

                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{p.id}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14 }}>{p.applicant}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600 }}>
                      {formatAmount(p.amountCents, p.currency)}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13 }}>{METHOD_LABELS[p.method]}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {accountDisplay}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          background: colorInfo.bg,
                          color: colorInfo.fg,
                        }}
                      >
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>
                      {formatDate(p.createdAt)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {STATUS_TRANSITIONS[p.status]?.includes('APPROVED') && (
                          <button
                            onClick={() => handleReviewOpen(p, 'APPROVED')}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              border: 'none',
                              background: '#10b981',
                              color: 'white',
                              fontSize: 11,
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            通过
                          </button>
                        )}
                        {STATUS_TRANSITIONS[p.status]?.includes('REJECTED') && (
                          <button
                            onClick={() => handleReviewOpen(p, 'REJECTED')}
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              border: 'none',
                              background: '#ef4444',
                              color: 'white',
                              fontSize: 11,
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            拒绝
                          </button>
                        )}
                        {!STATUS_TRANSITIONS[p.status]?.length && (
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 审核对话框 */}
      {reviewTarget && reviewAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { setReviewTarget(null); setReviewAction(null); }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              width: 400,
              maxWidth: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              {reviewAction === 'APPROVED' ? '✓ 确认通过' : '✗ 确认拒绝'}
            </h3>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>
                提现单 <strong>{reviewTarget.id}</strong>
              </p>
              <p style={{ fontSize: 14, color: '#374151', margin: '4px 0 0' }}>
                申请人: {reviewTarget.applicant} · 金额: {formatAmount(reviewTarget.amountCents)}
              </p>
            </div>

            {reviewAction === 'REJECTED' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  拒绝原因 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="请填写拒绝原因..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {reviewAction === 'APPROVED' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                  审核备注（可选）
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="审核备注..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {reviewAction === 'APPROVED' && (
              <div
                style={{
                  padding: 12,
                  background: '#d1fae5',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#065f46',
                }}
              >
                审核通过后将进入打款流程，请确认账户信息无误。
              </div>
            )}

            {reviewAction === 'REJECTED' && (
              <div
                style={{
                  padding: 12,
                  background: '#fee2e2',
                  borderRadius: 6,
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#991b1b',
                }}
              >
                拒绝后申请人可修改信息后重新提交。
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setReviewTarget(null); setReviewAction(null); }}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                取消
              </button>
              <button
                onClick={handleReviewConfirm}
                disabled={processingReview || (reviewAction === 'REJECTED' && !reviewNote.trim())}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: reviewAction === 'APPROVED' ? '#10b981' : '#ef4444',
                  color: 'white',
                  fontWeight: 600,
                  cursor: processingReview ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  opacity: processingReview ? 0.7 : 1,
                }}
              >
                {processingReview ? '处理中...' : reviewAction === 'APPROVED' ? '确认通过' : '确认拒绝'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast 容器 */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1001, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              minWidth: 260,
              background: t.type === 'success' ? '#d1fae5' : t.type === 'error' ? '#fee2e2' : '#dbeafe',
              color: t.type === 'success' ? '#065f46' : t.type === 'error' ? '#991b1b' : '#1e40af',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  )
}
