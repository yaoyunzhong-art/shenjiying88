'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { InventoryItem } from '../inventory-data'
import { INVENTORY_API_BASE } from '../inventory-data'
import type { InventoryDetailSnapshot, StockMovement } from './inventory-detail-data'

type StatusAction = 'activate' | 'deactivate' | 'archive'
type TabType = 'overview' | 'movements' | 'edit'
type ToastType = 'success' | 'error' | 'warning'

interface ToastState {
  type: ToastType
  msg: string
}

function statusActionLabel(action: StatusAction): string {
  const labels: Record<StatusAction, string> = {
    activate: '启用',
    deactivate: '停用',
    archive: '归档',
  }
  return labels[action]
}

function statusAfterAction(action: StatusAction): InventoryItem['status'] {
  switch (action) {
    case 'activate':
      return 'ACTIVE'
    case 'deactivate':
      return 'INACTIVE'
    case 'archive':
      return 'ARCHIVED'
  }
}

function availableStatusActions(status: InventoryItem['status']): StatusAction[] {
  switch (status) {
    case 'ACTIVE':
      return ['deactivate', 'archive']
    case 'INACTIVE':
      return ['activate', 'archive']
    case 'ARCHIVED':
      return ['activate']
  }
}

function validateEditInput(input: {
  name: string
  unit: string
  lowStockThreshold: number
  unitPriceCents: number
}): string | null {
  if (!input.name.trim()) return '商品名称不能为空'
  if (!input.unit.trim()) return '计量单位不能为空'
  if (input.lowStockThreshold < 0) return '低库存阈值不能为负数'
  if (input.unitPriceCents < 0) return '单价不能为负数'
  return null
}

function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

export default function InventoryDetailClient({
  snapshot,
}: {
  snapshot: InventoryDetailSnapshot
}) {
  const router = useRouter()
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [item, setItem] = useState<InventoryItem | null>(snapshot.item)
  const [movements, setMovements] = useState<StockMovement[]>(snapshot.movements)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editName, setEditName] = useState(snapshot.item?.name ?? '')
  const [editUnit, setEditUnit] = useState(snapshot.item?.unit ?? '')
  const [editThreshold, setEditThreshold] = useState(snapshot.item?.lowStockThreshold ?? 0)
  const [editPrice, setEditPrice] = useState(snapshot.item?.unitPriceCents ?? 0)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setItem(snapshot.item)
    setMovements(snapshot.movements)
    setEditName(snapshot.item?.name ?? '')
    setEditUnit(snapshot.item?.unit ?? '')
    setEditThreshold(snapshot.item?.lowStockThreshold ?? 0)
    setEditPrice(snapshot.item?.unitPriceCents ?? 0)
    setHasChanges(false)
    setShowDeleteConfirm(false)
  }, [snapshot])

  const showToast = useCallback((type: ToastType, msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 3000)
  }, [])

  const refreshSnapshot = useCallback(() => {
    handleRefresh()
  }, [handleRefresh])

  const readResponseMessage = useCallback(async (response: Response) => {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string | string[] }
      if (Array.isArray(payload.message)) {
        return payload.message.join('，')
      }
      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message
      }
    }
    return `请求失败: ${response.status}`
  }, [])

  const inventoryPath = useMemo(
    () => `/inventory?tenantId=${encodeURIComponent(snapshot.tenantId)}`,
    [snapshot.tenantId]
  )

  const handleSave = useCallback(async () => {
    if (!item) return

    const validationError = validateEditInput({
      name: editName,
      unit: editUnit,
      lowStockThreshold: editThreshold,
      unitPriceCents: editPrice,
    })

    if (validationError) {
      showToast('warning', validationError)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${INVENTORY_API_BASE}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: snapshot.tenantId,
          name: editName.trim(),
          unit: editUnit.trim(),
          lowStockThreshold: editThreshold,
          unitPriceCents: editPrice,
          version: item.version,
        }),
      })

      if (!response.ok) {
        throw new Error(await readResponseMessage(response))
      }

      showToast('success', '库存档案已更新')
      refreshSnapshot()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    editName,
    editPrice,
    editThreshold,
    editUnit,
    item,
    readResponseMessage,
    refreshSnapshot,
    showToast,
    snapshot.tenantId,
  ])

  const handleStatusAction = useCallback(
    async (action: StatusAction) => {
      if (!item) return

      setIsSubmitting(true)
      try {
        const response = await fetch(`${INVENTORY_API_BASE}/${item.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: snapshot.tenantId,
            status: statusAfterAction(action),
            version: item.version,
          }),
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        showToast('success', `${statusActionLabel(action)}成功`)
        refreshSnapshot()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : '状态流转失败')
      } finally {
        setIsSubmitting(false)
      }
    },
    [item, readResponseMessage, refreshSnapshot, showToast, snapshot.tenantId]
  )

  const handleDelete = useCallback(async () => {
    if (!item) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`${INVENTORY_API_BASE}/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: snapshot.tenantId,
          version: item.version,
        }),
      })

      if (!response.ok) {
        throw new Error(await readResponseMessage(response))
      }

      showToast('success', '库存项已删除')
      router.push(inventoryPath)
      router.refresh()
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : '删除失败')
    } finally {
      setIsSubmitting(false)
      setShowDeleteConfirm(false)
    }
  }, [inventoryPath, item, readResponseMessage, router, showToast, snapshot.tenantId])

  if (!item) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center text-slate-500">
        <div className="text-lg font-semibold text-slate-700">未找到库存项</div>
        <div className="mt-2 text-sm">当前快照中不存在该库存档案，可能已被删除或仍处于 fallback 样本态。</div>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => router.push(inventoryPath)}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            返回库存列表
          </button>
          <button
            type="button"
            onClick={refreshSnapshot}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
        </div>
      </div>
    )
  }

  const statusActions = availableStatusActions(item.status)
  const lowStock = item.availableQty <= item.lowStockThreshold

  return (
    <div className="space-y-6">
      {snapshot.error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {snapshot.error}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <div>
          <button
            type="button"
            onClick={() => router.push(inventoryPath)}
            className="mb-2 text-sm text-blue-600 hover:underline"
          >
            返回库存列表
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-sm text-slate-500">
            SKU: {item.sku} · tenant: {snapshot.tenantId} · source: {snapshot.sourceLabel}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshSnapshot}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
          {statusActions.map((action) => (
            <button
              key={action}
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleStatusAction(action)}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {statusActionLabel(action)}
            </button>
          ))}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            删除
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        {[
          { key: 'overview' as TabType, label: '概览' },
          { key: 'movements' as TabType, label: '出入记录' },
          { key: 'edit' as TabType, label: '编辑' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">基础信息</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="库存 ID" value={item.id} mono />
              <Row label="SKU" value={item.sku} mono />
              <Row label="租户" value={item.tenantId} mono />
              <Row label="计量单位" value={item.unit} />
              <Row label="版本" value={String(item.version)} mono />
              <Row label="单价" value={formatPrice(item.unitPriceCents)} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">库存水位</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="总库存" value={`${item.totalQty} ${item.unit}`} />
              <Row label="预留库存" value={`${item.reservedQty} ${item.unit}`} />
              <Row
                label="可用库存"
                value={`${item.availableQty} ${item.unit}`}
                valueClassName={lowStock ? 'font-semibold text-red-600' : 'font-semibold text-emerald-600'}
              />
              <Row label="低库存阈值" value={`${item.lowStockThreshold} ${item.unit}`} />
              <Row label="库存估值" value={formatPrice(item.availableQty * item.unitPriceCents)} />
            </dl>
            {lowStock ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {item.availableQty === 0 ? '库存已耗尽，请尽快处理补货。' : '当前已触发低库存预警。'}
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {activeTab === 'movements' ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">最近出入记录</h2>
            <span className="text-xs text-slate-400">{movements.length} 条</span>
          </div>
          {movements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
              暂无出入记录
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 text-left text-sm text-slate-500">
                  <th className="border border-slate-200 px-3 py-2">时间</th>
                  <th className="border border-slate-200 px-3 py-2">类型</th>
                  <th className="border border-slate-200 px-3 py-2 text-right">数量</th>
                  <th className="border border-slate-200 px-3 py-2">原因</th>
                  <th className="border border-slate-200 px-3 py-2">操作人</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="text-sm text-slate-700">
                    <td className="border border-slate-200 px-3 py-2">{formatDateTime(movement.createdAt)}</td>
                    <td className="border border-slate-200 px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-xs ${
                          movement.type === 'STOCK_IN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {movement.type === 'STOCK_IN' ? '入库' : '出库'}
                      </span>
                    </td>
                    <td
                      className={`border border-slate-200 px-3 py-2 text-right font-semibold ${
                        movement.type === 'STOCK_IN' ? 'text-emerald-700' : 'text-red-700'
                      }`}
                    >
                      {movement.type === 'STOCK_IN' ? '+' : '-'}
                      {movement.qty}
                    </td>
                    <td className="border border-slate-200 px-3 py-2">{movement.reason}</td>
                    <td className="border border-slate-200 px-3 py-2">{movement.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      {activeTab === 'edit' ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">编辑库存档案</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="商品名称">
              <input
                type="text"
                value={editName}
                onChange={(event) => {
                  setEditName(event.target.value)
                  setHasChanges(true)
                }}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="计量单位">
              <input
                type="text"
                value={editUnit}
                onChange={(event) => {
                  setEditUnit(event.target.value)
                  setHasChanges(true)
                }}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="低库存阈值">
              <input
                type="number"
                min={0}
                value={editThreshold}
                onChange={(event) => {
                  setEditThreshold(Number(event.target.value))
                  setHasChanges(true)
                }}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
            <Field label="单价（分）">
              <input
                type="number"
                min={0}
                value={editPrice}
                onChange={(event) => {
                  setEditPrice(Number(event.target.value))
                  setHasChanges(true)
                }}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </Field>
          </div>
          {hasChanges ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              当前表单存在未保存修改。
            </div>
          ) : null}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={!hasChanges || isSubmitting}
              onClick={() => {
                setEditName(item.name)
                setEditUnit(item.unit)
                setEditThreshold(item.lowStockThreshold)
                setEditPrice(item.unitPriceCents)
                setHasChanges(false)
              }}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
            >
              重置
            </button>
            <button
              type="button"
              disabled={!hasChanges || isSubmitting}
              onClick={() => void handleSave()}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存修改'}
            </button>
          </div>
        </section>
      ) : null}

      {toast ? (
        <div
          className={`fixed bottom-4 right-4 rounded px-4 py-2 text-sm text-white shadow-lg ${
            toast.type === 'success'
              ? 'bg-emerald-600'
              : toast.type === 'warning'
                ? 'bg-amber-600'
                : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">确认删除库存项</h2>
            <p className="mt-2 text-sm text-slate-500">
              确认删除 {item.sku} / {item.name} 吗？该操作会触发服务端删除链路。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
              >
                取消
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleDelete()}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function StatusBadge({ status }: { status: InventoryItem['status'] }) {
  return (
    <span
      className={`rounded px-2 py-1 text-xs ${
        status === 'ACTIVE'
          ? 'bg-emerald-100 text-emerald-700'
          : status === 'INACTIVE'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-200 text-slate-600'
      }`}
    >
      {status}
    </span>
  )
}

function Row({
  label,
  value,
  mono = false,
  valueClassName = '',
}: {
  label: string
  value: string
  mono?: boolean
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`${mono ? 'font-mono' : ''} ${valueClassName}`.trim()}>{value}</dd>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleString('zh-CN')
}
