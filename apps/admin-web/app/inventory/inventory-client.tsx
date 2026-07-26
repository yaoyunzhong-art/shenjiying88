'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { InventoryItem, InventoryPageSnapshot } from './inventory-data'
import { INVENTORY_API_BASE } from './inventory-data'

interface ToastState {
  type: 'success' | 'error'
  msg: string
}

export default function InventoryClient({
  snapshot,
}: {
  snapshot: InventoryPageSnapshot
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRefreshing, startRefresh] = useTransition()
  const [tenantId, setTenantId] = useState(snapshot.tenantId)
  const [items, setItems] = useState<InventoryItem[]>(snapshot.items)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    setTenantId(snapshot.tenantId)
    setItems(snapshot.items)
    setSelectedItem(null)
    setShowCreateDialog(false)
  }, [snapshot])

  const showToast = useCallback((type: ToastState['type'], msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 3000)
  }, [])

  const buildRefreshPath = useCallback(
    (nextTenantId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tenantId', nextTenantId.trim() || snapshot.tenantId)
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams, snapshot.tenantId]
  )

  const refreshSnapshot = useCallback(
    (nextTenantId = tenantId) => {
      const nextPath = buildRefreshPath(nextTenantId)
      startRefresh(() => {
        router.replace(nextPath)
        router.refresh()
      })
    },
    [buildRefreshPath, router, startRefresh, tenantId]
  )

  const readResponseMessage = useCallback(async (response: Response) => {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string | string[]
      }
      if (Array.isArray(payload.message)) {
        return payload.message.join('，')
      }
      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message
      }
    }
    return `请求失败: ${response.status}`
  }, [])

  const handleStockIn = useCallback(
    async (item: InventoryItem, qty: number, reason: string) => {
      try {
        const response = await fetch(`${INVENTORY_API_BASE}/${item.id}/stock-in`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            qty,
            reason,
            performedBy: 'admin',
          }),
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        showToast('success', `入库成功 +${qty}`)
        refreshSnapshot()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : '入库失败')
      }
    },
    [readResponseMessage, refreshSnapshot, showToast, tenantId]
  )

  const handleStockOut = useCallback(
    async (item: InventoryItem, qty: number, reason: string) => {
      try {
        const response = await fetch(`${INVENTORY_API_BASE}/${item.id}/stock-out`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId,
            qty,
            reason,
            performedBy: 'admin',
          }),
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        showToast('success', `出库成功 -${qty}`)
        refreshSnapshot()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : '出库失败')
      }
    },
    [readResponseMessage, refreshSnapshot, showToast, tenantId]
  )

  const handleCreate = useCallback(
    async (input: {
      sku: string
      name: string
      totalQty: number
      unitPriceCents: number
    }) => {
      try {
        const response = await fetch(INVENTORY_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, ...input }),
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        showToast('success', `创建成功: ${input.sku}`)
        refreshSnapshot()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : '创建失败')
      }
    },
    [readResponseMessage, refreshSnapshot, showToast, tenantId]
  )

  const lowStockCount = useMemo(
    () => items.filter((item) => item.availableQty <= item.lowStockThreshold).length,
    [items]
  )

  return (
    <div className="mx-auto max-w-7xl">
      {snapshot.error ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {snapshot.error}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">库存管理</h1>
          <p className="text-sm text-slate-500">
            当前数据源: {snapshot.sourceLabel} · tenant: {snapshot.tenantId}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-600">租户 ID:</label>
          <input
            type="text"
            value={tenantId}
            onChange={(event) => setTenantId(event.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
          <button
            onClick={() => refreshSnapshot(tenantId)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
          >
            + 新建库存
          </button>
          {lowStockCount > 0 ? (
            <span className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">
              {lowStockCount} 项低库存
            </span>
          ) : null}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed px-6 py-12 text-center text-slate-500">
          暂无库存项
        </div>
      ) : (
        <table className="w-full border-collapse overflow-hidden rounded-lg border bg-white">
          <thead>
            <tr className="bg-slate-100 text-sm text-slate-600">
              <th className="border px-3 py-2 text-left">SKU</th>
              <th className="border px-3 py-2 text-left">名称</th>
              <th className="border px-3 py-2 text-right">总量</th>
              <th className="border px-3 py-2 text-right">可用</th>
              <th className="border px-3 py-2 text-right">预留</th>
              <th className="border px-3 py-2 text-right">阈值</th>
              <th className="border px-3 py-2 text-right">单价(分)</th>
              <th className="border px-3 py-2 text-center">状态</th>
              <th className="border px-3 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.availableQty <= item.lowStockThreshold
              const isOut = item.availableQty === 0
              return (
                <tr
                  key={item.id}
                  className={isOut ? 'bg-red-50' : isLow ? 'bg-yellow-50' : 'bg-white'}
                >
                  <td className="border px-3 py-2 font-mono text-sm">{item.sku}</td>
                  <td className="border px-3 py-2">
                    <a href={`/inventory/${item.id}?tenantId=${tenantId}`} className="font-medium text-blue-600 hover:underline">
                      {item.name}
                    </a>
                  </td>
                  <td className="border px-3 py-2 text-right">{item.totalQty}</td>
                  <td className="border px-3 py-2 text-right font-semibold">{item.availableQty}</td>
                  <td className="border px-3 py-2 text-right">{item.reservedQty}</td>
                  <td className="border px-3 py-2 text-right text-slate-500">{item.lowStockThreshold}</td>
                  <td className="border px-3 py-2 text-right">{item.unitPriceCents}</td>
                  <td className="border px-3 py-2 text-center">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        item.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'ARCHIVED'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      操作
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {toast ? (
        <div
          className={`fixed bottom-4 right-4 rounded px-4 py-2 text-sm text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      ) : null}

      {selectedItem ? (
        <OperationDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStockIn={handleStockIn}
          onStockOut={handleStockOut}
        />
      ) : null}

      {showCreateDialog ? (
        <CreateDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreate}
        />
      ) : null}
    </div>
  )
}

function OperationDialog({
  item,
  onClose,
  onStockIn,
  onStockOut,
}: {
  item: InventoryItem
  onClose: () => void
  onStockIn: (item: InventoryItem, qty: number, reason: string) => void
  onStockOut: (item: InventoryItem, qty: number, reason: string) => void
}) {
  const [qty, setQty] = useState(10)
  const [reason, setReason] = useState('')
  const [action, setAction] = useState<'in' | 'out'>('in')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">库存操作 · {item.sku}</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm">类型</label>
          <select
            value={action}
            onChange={(event) => setAction(event.target.value as 'in' | 'out')}
            className="w-full rounded border px-3 py-2"
          >
            <option value="in">入库</option>
            <option value="out">出库</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm">数量</label>
          <input
            type="number"
            value={qty}
            onChange={(event) => setQty(Number(event.target.value))}
            className="w-full rounded border px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm">原因</label>
          <input
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="如: 采购到货 / 销售出库"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-4 py-2 text-sm">
            取消
          </button>
          <button
            onClick={() => {
              if (!reason.trim()) {
                return
              }
              if (action === 'in') {
                onStockIn(item, qty, reason.trim())
              } else {
                onStockOut(item, qty, reason.trim())
              }
              onClose()
            }}
            disabled={!reason.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (input: {
    sku: string
    name: string
    totalQty: number
    unitPriceCents: number
  }) => void
}) {
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [totalQty, setTotalQty] = useState(0)
  const [unitPriceCents, setUnitPriceCents] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">新建库存</h2>
        <div className="mb-3">
          <label className="mb-1 block text-sm">SKU</label>
          <input value={sku} onChange={(event) => setSku(event.target.value)} className="w-full rounded border px-3 py-2" />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm">名称</label>
          <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded border px-3 py-2" />
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-sm">初始数量</label>
          <input type="number" value={totalQty} onChange={(event) => setTotalQty(Number(event.target.value))} className="w-full rounded border px-3 py-2" />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm">单价 (分)</label>
          <input type="number" value={unitPriceCents} onChange={(event) => setUnitPriceCents(Number(event.target.value))} className="w-full rounded border px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded border px-4 py-2 text-sm">
            取消
          </button>
          <button
            onClick={() => onCreate({ sku, name, totalQty, unitPriceCents })}
            disabled={!sku.trim() || !name.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
