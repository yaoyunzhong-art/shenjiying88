'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react'
import type {
  FinanceInvoicesSnapshotDelivery,
  Invoice,
  InvoiceCreateForm,
  InvoiceStatus,
  InvoiceType,
} from './invoices-data'
import { defaultInvoiceCreateForm } from './invoices-data'

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-yellow-100 text-yellow-800' },
  ISSUED: { label: '已开', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
}

const TYPE_LABELS: Record<InvoiceType, string> = {
  ELECTRONIC: '电子发票',
  PAPER: '纸质发票',
  SPECIAL: '专票',
}

function formatCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function FinanceInvoicesClient({
  snapshot,
}: {
  snapshot: FinanceInvoicesSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [invoices, setInvoices] = useState<Invoice[]>(snapshot.invoices)
  const [statusFilter, setStatusFilter] = useState<'ALL' | InvoiceStatus>('ALL')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<InvoiceCreateForm>({ ...defaultInvoiceCreateForm })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [localMessage, setLocalMessage] = useState<string | null>(null)

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'ALL') return invoices
    return invoices.filter((invoice) => invoice.status === statusFilter)
  }, [invoices, statusFilter])

  const metrics = useMemo(
    () => ({
      totalCount: invoices.length,
      draftCount: invoices.filter((invoice) => invoice.status === 'DRAFT').length,
      issuedAmount: invoices
        .filter((invoice) => invoice.status === 'ISSUED')
        .reduce((sum, invoice) => sum + invoice.amountCents, 0),
    }),
    [invoices]
  )

  const handleIssue = useCallback(async (id: string) => {
    setActionLoading(id)
    setLocalMessage(null)
    try {
      setInvoices((current) =>
        current.map((invoice) =>
          invoice.id === id
            ? {
                ...invoice,
                status: 'ISSUED',
                issuedAt: new Date().toISOString(),
                cancelledAt: null,
              }
            : invoice
        )
      )
      setLocalMessage(`发票 ${id} 已在本地演示流中标记为开具。`)
    } finally {
      setActionLoading(null)
    }
  }, [])

  const handleCancel = useCallback(async (id: string) => {
    setActionLoading(id)
    setLocalMessage(null)
    try {
      setInvoices((current) =>
        current.map((invoice) =>
          invoice.id === id
            ? {
                ...invoice,
                status: 'CANCELLED',
                cancelledAt: new Date().toISOString(),
              }
            : invoice
        )
      )
      setLocalMessage(`发票 ${id} 已在本地演示流中标记为作废。`)
    } finally {
      setActionLoading(null)
    }
  }, [])

  const handleCreate = useCallback(() => {
    const invoiceNo = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(
      invoices.length + 1
    ).padStart(3, '0')}`
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      orderId: form.orderId.trim() || null,
      type: form.type,
      amountCents: form.amountCents,
      taxAmountCents: Math.round(form.amountCents * form.taxRate),
      taxRate: form.taxRate,
      status: 'DRAFT',
      buyerName: form.buyerName.trim() || null,
      buyerTaxId: form.buyerTaxId.trim() || null,
      buyerEmail: form.buyerEmail.trim() || null,
      remark: form.remark.trim() || null,
      issuedAt: null,
      cancelledAt: null,
      createdAt: new Date().toISOString(),
    }

    setInvoices((current) => [newInvoice, ...current])
    setShowCreate(false)
    setForm({ ...defaultInvoiceCreateForm })
    setLocalMessage(`发票 ${invoiceNo} 已在客户端演示流中创建，尚未写入真实发票服务。`)
  }, [form, invoices.length])

  const currentMessage =
    localMessage ??
    `deliveryMode: ${snapshot.deliveryMode} · 发票开具、作废、新建当前均为 local state mutation only`

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">发票管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            首屏列表来自服务端 mock 快照，筛选与演示操作在客户端本地态完成。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + 新建发票
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div>{currentMessage}</div>
        <div className="mt-1 text-xs text-amber-700">generatedAt: {snapshot.generatedAt}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">发票总数</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{metrics.totalCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">草稿待处理</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{metrics.draftCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">已开金额</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {formatCents(metrics.issuedAmount)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['ALL', 'DRAFT', 'ISSUED', 'CANCELLED'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            className={`rounded px-3 py-1 text-sm ${
              statusFilter === value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {value === 'ALL' ? '全部' : STATUS_CONFIG[value].label}
          </button>
        ))}
      </div>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">新建发票</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600">订单号</label>
                <input
                  value={form.orderId}
                  onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}
                  className="w-full rounded border px-2 py-1"
                  placeholder="ORD-20260719-XXXX"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600">类型</label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as InvoiceCreateForm['type'],
                    }))
                  }
                  className="w-full rounded border px-2 py-1"
                >
                  <option value="ELECTRONIC">电子发票</option>
                  <option value="PAPER">纸质发票</option>
                  <option value="SPECIAL">专票</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-slate-600">金额(分)</label>
                  <input
                    type="number"
                    value={form.amountCents}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amountCents: Number.parseInt(event.target.value, 10) || 0,
                      }))
                    }
                    className="w-full rounded border px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600">税率</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.taxRate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        taxRate: Number.parseFloat(event.target.value) || 0,
                      }))
                    }
                    className="w-full rounded border px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600">购买方名称</label>
                <input
                  value={form.buyerName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, buyerName: event.target.value }))
                  }
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600">税号</label>
                <input
                  value={form.buyerTaxId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, buyerTaxId: event.target.value }))
                  }
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600">邮箱</label>
                <input
                  value={form.buyerEmail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, buyerEmail: event.target.value }))
                  }
                  className="w-full rounded border px-2 py-1"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600">备注</label>
                <textarea
                  value={form.remark}
                  onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))}
                  className="w-full rounded border px-2 py-1"
                  rows={2}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded border px-4 py-1 text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!form.orderId.trim()}
                className="rounded bg-blue-600 px-4 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {filteredInvoices.length === 0 ? (
        <div className="rounded-lg border bg-white py-12 text-center text-slate-400">
          <p className="text-lg text-slate-500">暂无发票</p>
          <p className="mt-1 text-sm">当前筛选条件下没有匹配发票</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">发票号</th>
                <th className="px-3 py-2 text-left">订单号</th>
                <th className="px-3 py-2 text-left">类型</th>
                <th className="px-3 py-2 text-right">金额</th>
                <th className="px-3 py-2 text-right">税额</th>
                <th className="px-3 py-2 text-left">购买方</th>
                <th className="px-3 py-2 text-left">状态</th>
                <th className="px-3 py-2 text-left">创建时间</th>
                <th className="px-3 py-2 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{invoice.invoiceNo}</td>
                  <td className="px-3 py-2 font-mono text-xs">{invoice.orderId || '—'}</td>
                  <td className="px-3 py-2">{TYPE_LABELS[invoice.type]}</td>
                  <td className="px-3 py-2 text-right">{formatCents(invoice.amountCents)}</td>
                  <td className="px-3 py-2 text-right">{formatCents(invoice.taxAmountCents)}</td>
                  <td className="max-w-[160px] truncate px-3 py-2">{invoice.buyerName || '—'}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${STATUS_CONFIG[invoice.status].color}`}
                    >
                      {STATUS_CONFIG[invoice.status].label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">{formatDate(invoice.createdAt)}</td>
                  <td className="px-3 py-2">
                    {invoice.status === 'DRAFT' ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleIssue(invoice.id)}
                          disabled={actionLoading === invoice.id}
                          className="text-xs text-emerald-600 hover:underline disabled:opacity-50"
                        >
                          开具
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancel(invoice.id)}
                          disabled={actionLoading === invoice.id}
                          className="text-xs text-rose-600 hover:underline disabled:opacity-50"
                        >
                          作废
                        </button>
                      </div>
                    ) : invoice.status === 'ISSUED' ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(invoice.id)}
                        disabled={actionLoading === invoice.id}
                        className="text-xs text-rose-600 hover:underline disabled:opacity-50"
                      >
                        作废
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">已作废</span>
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
