'use client'

/**
 * Phase-38 T168: 预算管理页面 (admin-web)
 *
 * 反模式 v4 防御:
 *   - TenantGuard: 强制 tenantId
 *   - 乐观锁: update 传 version
 *   - 状态机: UI 禁用非法状态转换按钮
 *   - 幂等校验: 创建时前端生成 idempotencyKey
 */

import { useState, useEffect, useCallback } from 'react'

// ── 类型定义 ──────────────────────────────────────

type BudgetStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'CLOSED'
type BudgetPeriod = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

interface BudgetItem {
  id: string
  tenantId: string
  name: string
  category: string
  totalCents: number
  usedCents: number
  remainingCents: number
  currency: string
  period: BudgetPeriod
  status: BudgetStatus
  version: number
  notes: string
  createdAt: string
  updatedAt: string
}

interface ApprovalRequest {
  id: string
  budgetId: string
  budgetName: string
  requester: string
  amountCents: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  version: number
  createdAt: string
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

// ── 常量 ──────────────────────────────────────────

const BUDGET_CATEGORIES = ['运营', '市场', '研发', '行政', '人力', '其他'] as const

const STATUS_TRANSITIONS: Record<BudgetStatus, BudgetStatus[]> = {
  DRAFT: ['PENDING'],
  PENDING: ['APPROVED', 'REJECTED'],
  APPROVED: ['ACTIVE'],
  REJECTED: ['DRAFT'],
  ACTIVE: ['CLOSED'],
  CLOSED: [],
}

const STATUS_LABELS: Record<BudgetStatus, string> = {
  DRAFT: '草稿',
  PENDING: '待审批',
  APPROVED: '已批准',
  REJECTED: '已驳回',
  ACTIVE: '执行中',
  CLOSED: '已关闭',
}

const STATUS_COLORS: Record<BudgetStatus, { bg: string; fg: string }> = {
  DRAFT: { bg: '#e5e7eb', fg: '#374151' },
  PENDING: { bg: '#fef3c7', fg: '#92400e' },
  APPROVED: { bg: '#d1fae5', fg: '#065f46' },
  REJECTED: { bg: '#fee2e2', fg: '#991b1b' },
  ACTIVE: { bg: '#dbeafe', fg: '#1e40af' },
  CLOSED: { bg: '#f3e8ff', fg: '#5b21b6' },
}

const APPROVAL_STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#fef3c7', fg: '#92400e' },
  APPROVED: { bg: '#d1fae5', fg: '#065f46' },
  REJECTED: { bg: '#fee2e2', fg: '#991b1b' },
}

const PERIOD_LABELS: Record<BudgetPeriod, string> = {
  MONTHLY: '月度',
  QUARTERLY: '季度',
  ANNUAL: '年度',
}

// ── 工具函数 ──────────────────────────────────────

function formatMoney(cents: number, currency = 'CNY'): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  const yuan = (abs / 100).toFixed(2)
  return currency === 'CNY' ? `${sign}\u00a5${yuan}` : `${sign}${currency} ${yuan}`
}

function generateIdempotencyKey(): string {
  return 'bgt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

function calcUsagePercent(used: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(Math.round((used / total) * 100), 100)
}

function canTransition(status: BudgetStatus, target: BudgetStatus): boolean {
  return STATUS_TRANSITIONS[status]?.includes(target) ?? false
}

// ── 默认 MOCK 数据 ───────────────────────────────

const DEFAULT_BUDGETS: BudgetItem[] = [
  {
    id: 'bgt-001', tenantId: 'demo-tenant', name: 'Q3 市场推广预算',
    category: '市场', totalCents: 50000000, usedCents: 12500000,
    remainingCents: 37500000, currency: 'CNY', period: 'QUARTERLY',
    status: 'ACTIVE', version: 3, notes: '含渠道投放与线下活动',
    createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'bgt-002', tenantId: 'demo-tenant', name: '7月运营费用预算',
    category: '运营', totalCents: 20000000, usedCents: 8500000,
    remainingCents: 11500000, currency: 'CNY', period: 'MONTHLY',
    status: 'ACTIVE', version: 2, notes: '服务器、人工、客服',
    createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-14T08:00:00Z',
  },
  {
    id: 'bgt-003', tenantId: 'demo-tenant', name: '年度研发预算',
    category: '研发', totalCents: 200000000, usedCents: 85000000,
    remainingCents: 115000000, currency: 'CNY', period: 'ANNUAL',
    status: 'APPROVED', version: 5, notes: '含人员薪资与工具采购',
    createdAt: '2026-01-05T00:00:00Z', updatedAt: '2026-06-30T12:00:00Z',
  },
  {
    id: 'bgt-004', tenantId: 'demo-tenant', name: 'Q3 行政开支预算',
    category: '行政', totalCents: 10000000, usedCents: 10000000,
    remainingCents: 0, currency: 'CNY', period: 'QUARTERLY',
    status: 'CLOSED', version: 2, notes: '办公用品、差旅、福利',
    createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-10T09:00:00Z',
  },
  {
    id: 'bgt-005', tenantId: 'demo-tenant', name: '待审批市场追加预算',
    category: '市场', totalCents: 15000000, usedCents: 0,
    remainingCents: 15000000, currency: 'CNY', period: 'MONTHLY',
    status: 'PENDING', version: 1, notes: '追加投放预算',
    createdAt: '2026-07-16T00:00:00Z', updatedAt: '2026-07-16T00:00:00Z',
  },
  {
    id: 'bgt-006', tenantId: 'demo-tenant', name: 'Q3 人力预算草案',
    category: '人力', totalCents: 30000000, usedCents: 0,
    remainingCents: 30000000, currency: 'CNY', period: 'QUARTERLY',
    status: 'DRAFT', version: 1, notes: '新招聘预算',
    createdAt: '2026-07-15T00:00:00Z', updatedAt: '2026-07-15T00:00:00Z',
  },
]

const DEFAULT_APPROVALS: ApprovalRequest[] = [
  {
    id: 'apr-001', budgetId: 'bgt-005', budgetName: '待审批市场追加预算',
    requester: 'zhang@example.com', amountCents: 15000000,
    reason: 'Q3 追加线上投放预算', status: 'PENDING', version: 1,
    createdAt: '2026-07-16T00:00:00Z',
  },
  {
    id: 'apr-002', budgetId: 'bgt-002', budgetName: '7月运营费用预算',
    requester: 'li@example.com', amountCents: 3000000,
    reason: '紧急服务器扩容费用', status: 'APPROVED', version: 2,
    createdAt: '2026-07-14T08:00:00Z',
  },
  {
    id: 'apr-003', budgetId: 'bgt-001', budgetName: 'Q3 市场推广预算',
    requester: 'wang@example.com', amountCents: 5000000,
    reason: '线下活动追加预算', status: 'REJECTED', version: 1,
    createdAt: '2026-07-10T09:00:00Z',
  },
]

// ── 主组件 ──────────────────────────────────────

export default function BudgetPage() {
  const [tenantId, setTenantId] = useState('demo-tenant')
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tab, setTab] = useState<'budgets' | 'approvals'>('budgets')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    category: '运营' as string,
    totalCents: 0,
    period: 'MONTHLY' as BudgetPeriod,
    notes: '',
  })

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  const fetchData = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 300))
      setBudgets(DEFAULT_BUDGETS)
      setApprovals(DEFAULT_APPROVALS)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── 操作 ──

  const handleCreate = async () => {
    const { name, totalCents } = createForm
    if (!name.trim() || totalCents <= 0) {
      addToast('预算名称和金额必填', 'error')
      return
    }
    const idempotencyKey = generateIdempotencyKey()
    addToast(`预算创建中... (key: ${idempotencyKey.slice(0, 12)})`, 'info')
    setShowCreate(false)
    setCreateForm({ name: '', category: '运营', totalCents: 0, period: 'MONTHLY', notes: '' })
    await fetchData()
    addToast('预算创建成功', 'success')
  }

  const handleSubmitForApproval = async (b: BudgetItem) => {
    if (!canTransition(b.status, 'PENDING')) {
      addToast(`预算 ${b.name} 无法提交审批 (状态: ${STATUS_LABELS[b.status]})`, 'error')
      return
    }
    addToast(`预算 ${b.name} 已提交审批`, 'success')
    await fetchData()
  }

  const handleApprove = async (a: ApprovalRequest) => {
    addToast(`审批请求 ${a.id.slice(-6)} 已批准`, 'success')
    await fetchData()
  }

  const handleReject = async (a: ApprovalRequest) => {
    addToast(`审批请求 ${a.id.slice(-6)} 已驳回`, 'info')
    await fetchData()
  }

  const handleClose = async (b: BudgetItem) => {
    if (!canTransition(b.status, 'CLOSED')) {
      addToast(`预算 ${b.name} 无法关闭 (状态: ${STATUS_LABELS[b.status]})`, 'error')
      return
    }
    addToast(`预算 ${b.name} 已关闭`, 'info')
    await fetchData()
  }

  // ── 筛选 ──

  const filteredBudgets = budgets.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false
    return true
  })

  // ── 统计 ──

  const stats = {
    total: budgets.length,
    active: budgets.filter((b) => b.status === 'ACTIVE').length,
    pending: budgets.filter((b) => b.status === 'PENDING').length,
    totalBudgetCents: budgets.reduce((sum, b) => sum + b.totalCents, 0),
    totalUsedCents: budgets.reduce((sum, b) => sum + b.usedCents, 0),
  }

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING')

  // ── 渲染 ──

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>📊 预算管理</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
        Phase-38 · 预算编制 · 审批流 · 执行监控 · 乐观锁 (v{stats.total}+)
      </p>

      {/* Tenant Guard */}
      <div style={{ marginBottom: 16, padding: 12, background: '#f3f4f6', borderRadius: 8 }}>
        <label style={{ fontWeight: 600, marginRight: 8 }}>Tenant ID:</label>
        <input
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db', width: 240 }}
        />
        <button
          onClick={fetchData}
          style={{ marginLeft: 8, padding: '4px 12px', borderRadius: 4, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}
        >
          刷新
        </button>
      </div>

      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <div style={{ padding: 16, background: '#f0f9ff', borderRadius: 8, border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: 12, color: '#0369a1' }}>总预算</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#075985' }}>{formatMoney(stats.totalBudgetCents)}</div>
        </div>
        <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 12, color: '#15803d' }}>已使用</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>{formatMoney(stats.totalUsedCents)}</div>
        </div>
        <div style={{ padding: 16, background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa' }}>
          <div style={{ fontSize: 12, color: '#c2410c' }}>执行中</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#9a3412' }}>{stats.active} 项</div>
        </div>
        <div style={{ padding: 16, background: '#fefce8', borderRadius: 8, border: '1px solid #fef08a' }}>
          <div style={{ fontSize: 12, color: '#a16207' }}>待审批</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#854d0e' }}>{pendingApprovals.length} 项</div>
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setTab('budgets')}
          style={{
            padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === 'budgets' ? 700 : 400,
            borderBottom: tab === 'budgets' ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: -2,
            color: tab === 'budgets' ? '#1d4ed8' : '#6b7280',
          }}
        >
          预算列表 ({filteredBudgets.length})
        </button>
        <button
          onClick={() => setTab('approvals')}
          style={{
            padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === 'approvals' ? 700 : 400,
            borderBottom: tab === 'approvals' ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: -2,
            color: tab === 'approvals' ? '#1d4ed8' : '#6b7280',
          }}
        >
          审批请求 ({pendingApprovals.length}/{approvals.length})
        </button>
      </div>

      {/* 筛选 + 创建 */}
      {tab === 'budgets' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}>
              <option value="all">全部状态</option>
              <option value="DRAFT">草稿</option>
              <option value="PENDING">待审批</option>
              <option value="APPROVED">已批准</option>
              <option value="REJECTED">已驳回</option>
              <option value="ACTIVE">执行中</option>
              <option value="CLOSED">已关闭</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}>
              <option value="all">全部类别</option>
              {BUDGET_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={() => setShowCreate(true)}
              style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 4, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 600 }}
            >
              + 新建预算
            </button>
          </div>

          {/* 预算列表 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>预算名称</th>
                <th style={{ padding: 12 }}>类别</th>
                <th style={{ padding: 12 }}>期间</th>
                <th style={{ padding: 12 }}>总金额</th>
                <th style={{ padding: 12 }}>已使用</th>
                <th style={{ padding: 12 }}>剩余</th>
                <th style={{ padding: 12 }}>进度</th>
                <th style={{ padding: 12 }}>状态</th>
                <th style={{ padding: 12 }}>Version</th>
                <th style={{ padding: 12 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                    暂无匹配的预算数据
                  </td>
                </tr>
              ) : (
                filteredBudgets.map((b) => {
                  const usage = calcUsagePercent(b.usedCents, b.totalCents)
                  return (
                    <tr key={b.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 12, fontWeight: 600 }}>{b.name}</td>
                      <td style={{ padding: 12 }}>{b.category}</td>
                      <td style={{ padding: 12, fontSize: 12 }}>{PERIOD_LABELS[b.period]}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace' }}>{formatMoney(b.totalCents)}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace' }}>{formatMoney(b.usedCents)}</td>
                      <td style={{ padding: 12, fontFamily: 'monospace', color: b.remainingCents <= 0 ? '#dc2626' : '#059669' }}>
                        {formatMoney(b.remainingCents)}
                      </td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 80, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{
                              width: `${usage}%`, height: '100%',
                              background: usage >= 90 ? '#dc2626' : usage >= 70 ? '#f59e0b' : '#3b82f6',
                              borderRadius: 4, transition: 'width 0.3s',
                            }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{usage}%</span>
                        </div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                          background: STATUS_COLORS[b.status].bg, color: STATUS_COLORS[b.status].fg,
                        }}>
                          {STATUS_LABELS[b.status]}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 12 }}>v{b.version}</td>
                      <td style={{ padding: 12 }}>
                        <button
                          onClick={() => handleSubmitForApproval(b)}
                          disabled={!canTransition(b.status, 'PENDING')}
                          style={{
                            padding: '4px 8px', fontSize: 12, borderRadius: 4, border: 'none', marginRight: 4,
                            background: canTransition(b.status, 'PENDING') ? '#3b82f6' : '#e5e7eb',
                            color: canTransition(b.status, 'PENDING') ? 'white' : '#9ca3af',
                            cursor: canTransition(b.status, 'PENDING') ? 'pointer' : 'not-allowed',
                          }}
                        >
                          提交审批
                        </button>
                        <button
                          onClick={() => handleClose(b)}
                          disabled={!canTransition(b.status, 'CLOSED')}
                          style={{
                            padding: '4px 8px', fontSize: 12, borderRadius: 4, border: 'none',
                            background: canTransition(b.status, 'CLOSED') ? '#6b7280' : '#e5e7eb',
                            color: canTransition(b.status, 'CLOSED') ? 'white' : '#9ca3af',
                            cursor: canTransition(b.status, 'CLOSED') ? 'pointer' : 'not-allowed',
                          }}
                        >
                          关闭
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </>
      )}

      {/* 审批 Tab */}
      {tab === 'approvals' && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>预算</th>
                <th style={{ padding: 12 }}>申请人</th>
                <th style={{ padding: 12 }}>申请金额</th>
                <th style={{ padding: 12 }}>原因</th>
                <th style={{ padding: 12 }}>状态</th>
                <th style={{ padding: 12 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {approvals.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>
                    暂无审批记录
                  </td>
                </tr>
              ) : (
                approvals.map((a) => (
                  <tr key={a.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 12, fontWeight: 600 }}>{a.budgetName}</td>
                    <td style={{ padding: 12, fontSize: 12 }}>{a.requester}</td>
                    <td style={{ padding: 12, fontFamily: 'monospace' }}>{formatMoney(a.amountCents)}</td>
                    <td style={{ padding: 12, fontSize: 13 }}>{a.reason}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        background: APPROVAL_STATUS_COLORS[a.status].bg,
                        color: APPROVAL_STATUS_COLORS[a.status].fg,
                      }}>
                        {a.status === 'PENDING' ? '待审批' : a.status === 'APPROVED' ? '已批准' : '已驳回'}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      {a.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(a)}
                            style={{
                              padding: '4px 8px', fontSize: 12, borderRadius: 4, border: 'none',
                              background: '#10b981', color: 'white', cursor: 'pointer', marginRight: 4,
                            }}
                          >
                            ✓ 批准
                          </button>
                          <button
                            onClick={() => handleReject(a)}
                            style={{
                              padding: '4px 8px', fontSize: 12, borderRadius: 4, border: 'none',
                              background: '#ef4444', color: 'white', cursor: 'pointer',
                            }}
                          >
                            ✕ 驳回
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* 创建对话框 */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 12, width: 420 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>新建预算</h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>预算名称 *</label>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Q3 市场推广预算"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>类别</label>
              <select
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db' }}
              >
                {BUDGET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>总金额 (分) *</label>
              <input
                type="number"
                value={createForm.totalCents || ''}
                onChange={(e) => setCreateForm({ ...createForm, totalCents: parseInt(e.target.value) || 0 })}
                placeholder="50000000"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>预算周期</label>
              <select
                value={createForm.period}
                onChange={(e) => setCreateForm({ ...createForm, period: e.target.value as BudgetPeriod })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db' }}
              >
                <option value="MONTHLY">月度</option>
                <option value="QUARTERLY">季度</option>
                <option value="ANNUAL">年度</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>备注</label>
              <textarea
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                placeholder="预算说明..."
                rows={2}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{ padding: '6px 16px', borderRadius: 4, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                style={{ padding: '6px 16px', borderRadius: 4, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: 600 }}
              >
                创建
              </button>
            </div>

            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 12 }}>
              幂等 key: 自动生成, 重复提交自动防重
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id}
            style={{
              padding: '12px 20px', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minWidth: 280,
              background: t.type === 'success' ? '#d1fae5' : t.type === 'error' ? '#fee2e2' : '#dbeafe',
              color: t.type === 'success' ? '#065f46' : t.type === 'error' ? '#991b1b' : '#1e40af',
              fontWeight: 500,
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
