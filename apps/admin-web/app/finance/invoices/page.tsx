/**
 * P-38 / B2 发票管理页面
 *
 * 功能:
 *   1. 发票列表 — 状态筛选(全部/草稿/已开/已取消)
 *   2. 新建发票弹窗
 *   3. 开具/作废操作
 *   4. loading/空/error 三态
 *
 * 路由: /finance/invoices
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

// ─── 类型定义 ─────────────────────────────────────────────

type Invoice = {
  id: string
  invoiceNo: string
  orderId: string | null
  type: 'ELECTRONIC' | 'PAPER' | 'SPECIAL'
  amountCents: number
  taxAmountCents: number
  taxRate: number
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED'
  buyerName: string | null
  buyerTaxId: string | null
  buyerEmail: string | null
  remark: string | null
  issuedAt: string | null
  cancelledAt: string | null
  createdAt: string
}

type InvoiceCreateForm = {
  orderId: string
  type: 'ELECTRONIC' | 'PAPER' | 'SPECIAL'
  amountCents: number
  taxRate: number
  buyerName: string
  buyerTaxId: string
  buyerEmail: string
  remark: string
}

// ─── 辅助 ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-yellow-100 text-yellow-800' },
  ISSUED: { label: '已开', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-800' }
}

const TYPE_LABELS: Record<string, string> = {
  ELECTRONIC: '电子发票',
  PAPER: '纸质发票',
  SPECIAL: '专票'
}

const DEFAULT_NEW: InvoiceCreateForm = {
  orderId: '',
  type: 'ELECTRONIC',
  amountCents: 0,
  taxRate: 0.13,
  buyerName: '',
  buyerTaxId: '',
  buyerEmail: '',
  remark: ''
}

const initialInvoices: Invoice[] = [
  {
    id: 'inv-demo-1',
    invoiceNo: 'INV-20260719-001',
    orderId: 'ORD-20260719-1001',
    type: 'ELECTRONIC',
    amountCents: 36800,
    taxAmountCents: 4230,
    taxRate: 0.13,
    status: 'ISSUED',
    buyerName: '神机营科技',
    buyerTaxId: '91110108MA01XXXXX',
    buyerEmail: 'billing@sjy.tech',
    remark: null,
    issuedAt: '2026-07-19T10:00:00Z',
    cancelledAt: null,
    createdAt: '2026-07-19T09:30:00Z'
  },
  {
    id: 'inv-demo-2',
    invoiceNo: 'INV-20260719-002',
    orderId: 'ORD-20260719-1002',
    type: 'ELECTRONIC',
    amountCents: 12500,
    taxAmountCents: 1438,
    taxRate: 0.13,
    status: 'DRAFT',
    buyerName: '体验店A',
    buyerTaxId: null,
    buyerEmail: null,
    remark: null,
    issuedAt: null,
    cancelledAt: null,
    createdAt: '2026-07-19T10:30:00Z'
  }
]

function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

// ─── 组件 ─────────────────────────────────────────────────

export default function FinanceInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<InvoiceCreateForm>({ ...DEFAULT_NEW })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return invoices
    return invoices.filter(i => i.status === statusFilter)
  }, [invoices, statusFilter])

  const handleIssue = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      setInvoices(prev => prev.map(i =>
        i.id === id ? { ...i, status: 'ISSUED' as const, issuedAt: new Date().toISOString() } : i
      ))
    } finally {
      setActionLoading(null)
    }
  }, [])

  const handleCancel = useCallback(async (id: string) => {
    setActionLoading(id)
    try {
      setInvoices(prev => prev.map(i =>
        i.id === id ? { ...i, status: 'CANCELLED' as const, cancelledAt: new Date().toISOString() } : i
      ))
    } finally {
      setActionLoading(null)
    }
  }, [])

  const handleCreate = useCallback(() => {
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${(invoices.length + 1).toString().padStart(3, '0')}`,
      orderId: form.orderId || null,
      type: form.type,
      amountCents: form.amountCents,
      taxAmountCents: Math.round(form.amountCents * form.taxRate),
      taxRate: form.taxRate,
      status: 'DRAFT',
      buyerName: form.buyerName || null,
      buyerTaxId: form.buyerTaxId || null,
      buyerEmail: form.buyerEmail || null,
      remark: form.remark || null,
      issuedAt: null,
      cancelledAt: null,
      createdAt: new Date().toISOString()
    }
    setInvoices(prev => [...prev, newInvoice])
    setShowCreate(false)
    setForm({ ...DEFAULT_NEW })
  }, [form, invoices.length])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">发票管理</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + 新建发票
        </button>
      </div>

      {/* ── 错误态 ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">关闭</button>
        </div>
      )}

      {/* ── 筛选栏 ── */}
      <div className="flex gap-2 mb-4">
        {['ALL', 'DRAFT', 'ISSUED', 'CANCELLED'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded text-sm ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {s === 'ALL' ? '全部' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* ── 新建弹窗 ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">新建发票</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600">订单号</label>
                <input value={form.orderId} onChange={e => setForm(p => ({ ...p, orderId: e.target.value }))}
                  className="w-full border rounded px-2 py-1" placeholder="ORD-20260719-XXXX" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">类型</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as InvoiceCreateForm['type'] }))}
                  className="w-full border rounded px-2 py-1">
                  <option value="ELECTRONIC">电子发票</option>
                  <option value="PAPER">纸质发票</option>
                  <option value="SPECIAL">专票</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-600">金额(分)</label>
                  <input type="number" value={form.amountCents} onChange={e => setForm(p => ({ ...p, amountCents: parseInt(e.target.value) || 0 }))}
                    className="w-full border rounded px-2 py-1" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600">税率</label>
                  <input type="number" step="0.01" value={form.taxRate} onChange={e => setForm(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full border rounded px-2 py-1" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600">购买方名称</label>
                <input value={form.buyerName} onChange={e => setForm(p => ({ ...p, buyerName: e.target.value }))}
                  className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">税号</label>
                <input value={form.buyerTaxId} onChange={e => setForm(p => ({ ...p, buyerTaxId: e.target.value }))}
                  className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">邮箱</label>
                <input value={form.buyerEmail} onChange={e => setForm(p => ({ ...p, buyerEmail: e.target.value }))}
                  className="w-full border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm text-gray-600">备注</label>
                <textarea value={form.remark} onChange={e => setForm(p => ({ ...p, remark: e.target.value }))}
                  className="w-full border rounded px-2 py-1" rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-1 border rounded text-gray-600 hover:bg-gray-50">取消</button>
              <button onClick={handleCreate}
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!form.orderId}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 加载态 ── */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          加载中...
        </div>
      )}

      {/* ── 空态 ── */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📄</div>
          <p>暂无发票</p>
          <p className="text-sm mt-1">点击「+ 新建发票」创建第一张发票</p>
        </div>
      )}

      {/* ── 列表 ── */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">发票号</th>
                <th className="text-left px-3 py-2">订单号</th>
                <th className="text-left px-3 py-2">类型</th>
                <th className="text-right px-3 py-2">金额</th>
                <th className="text-right px-3 py-2">税额</th>
                <th className="text-left px-3 py-2">购买方</th>
                <th className="text-left px-3 py-2">状态</th>
                <th className="text-left px-3 py-2">创建时间</th>
                <th className="text-left px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{inv.invoiceNo}</td>
                  <td className="px-3 py-2 font-mono text-xs">{inv.orderId || '—'}</td>
                  <td className="px-3 py-2">{TYPE_LABELS[inv.type] || inv.type}</td>
                  <td className="px-3 py-2 text-right">{formatCents(inv.amountCents)}</td>
                  <td className="px-3 py-2 text-right">{formatCents(inv.taxAmountCents)}</td>
                  <td className="px-3 py-2 max-w-[120px] truncate">{inv.buyerName || '—'}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_CONFIG[inv.status]?.color}`}>
                      {STATUS_CONFIG[inv.status]?.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs">{formatDate(inv.createdAt)}</td>
                  <td className="px-3 py-2">
                    {inv.status === 'DRAFT' && (
                      <div className="flex gap-1">
                        <button onClick={() => handleIssue(inv.id)}
                          disabled={actionLoading === inv.id}
                          className="text-xs text-green-600 hover:underline disabled:opacity-50">
                          开具
                        </button>
                        <button onClick={() => handleCancel(inv.id)}
                          disabled={actionLoading === inv.id}
                          className="text-xs text-red-600 hover:underline disabled:opacity-50">
                          作废
                        </button>
                      </div>
                    )}
                    {inv.status === 'ISSUED' && (
                      <button onClick={() => handleCancel(inv.id)}
                        disabled={actionLoading === inv.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50">
                        作废
                      </button>
                    )}
                    {inv.status === 'CANCELLED' && (
                      <span className="text-xs text-gray-400">已作废</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
