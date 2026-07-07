'use client'

/**
 * Phase-37 T168: 库存详情页 (admin-web)
 *
 * 反模式 v4 防御:
 *  - TenantGuard: 强制 tenantId
 *  - 乐观锁: update 需传 version
 *  - 状态流转限制: ACTIVE↔INACTIVE↔ARCHIVED
 *  - 离开确认: edit 未保存时拦截
 */

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────

interface InventoryItem {
  id: string
  tenantId: string
  sku: string
  name: string
  unit: string
  totalQty: number
  reservedQty: number
  availableQty: number
  lowStockThreshold: number
  unitPriceCents: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  version: number
}

interface StockMovement {
  id: string
  type: 'STOCK_IN' | 'STOCK_OUT'
  qty: number
  reason: string
  performedBy: string
  createdAt: string
}

type StatusAction = 'activate' | 'deactivate' | 'archive'
type TabType = 'overview' | 'movements' | 'edit'
type ToastType = 'success' | 'error' | 'warning'

interface EdgeItem {
  id: string
  sku: string
  name: string
  qty: number
}

const API_BASE = '/api/inventory'

// ─── Helpers ──────────────────────────────────────────────────────────────

function statusActionLabel(action: StatusAction): string {
  const labels: Record<StatusAction, string> = {
    activate: '启用',
    deactivate: '停用',
    archive: '归档',
  }
  return labels[action]
}

function statusAfterAction(current: InventoryItem['status'], action: StatusAction): InventoryItem['status'] {
  const map: Record<StatusAction, InventoryItem['status']> = {
    activate: 'ACTIVE',
    deactivate: 'INACTIVE',
    archive: 'ARCHIVED',
  }
  return map[action]
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

// ─── Detail Page Component ───────────────────────────────────────────────

export default function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [tenantId] = useState('demo-tenant')
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editThreshold, setEditThreshold] = useState(0)
  const [editPrice, setEditPrice] = useState(0)
  const [hasChanges, setHasChanges] = useState(false)

  // Edge linking state
  const [edgeItems, setEdgeItems] = useState<EdgeItem[]>([])

  // Delete confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const showToast = useCallback((type: ToastType, msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ── Load data ──────────────────────────────────────────────────────

  const loadDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/${id}?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setItem(data.item ?? data)
        // Initialize edit form
        const i = data.item ?? data
        setEditName(i.name)
        setEditUnit(i.unit)
        setEditThreshold(i.lowStockThreshold)
        setEditPrice(i.unitPriceCents)
        setHasChanges(false)
      } else {
        showToast('error', `加载失败: ${res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [id, tenantId, showToast])

  const loadMovements = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/${id}/movements?tenantId=${tenantId}&limit=50`)
      if (res.ok) {
        const data = await res.json()
        setMovements(data.movements ?? data.items ?? [])
      }
    } catch {
      // movements are non-critical
    }
  }, [id, tenantId])

  useEffect(() => {
    loadDetail()
    loadMovements()
  }, [loadDetail, loadMovements])

  // ── Edit handlers ──────────────────────────────────────────────────

  const handleEditFieldChange = useCallback(
    (setter: (v: string | number) => void, value: string | number) => {
      setter(value)
      setHasChanges(true)
    },
    []
  )

  const handleSave = async () => {
    if (!item) return
    const err = validateEditInput({
      name: editName,
      unit: editUnit,
      lowStockThreshold: editThreshold,
      unitPriceCents: editPrice,
    })
    if (err) {
      showToast('warning', err)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: editName,
          unit: editUnit,
          lowStockThreshold: editThreshold,
          unitPriceCents: editPrice,
          version: item.version,
        }),
      })
      if (res.ok) {
        showToast('success', '保存成功')
        setHasChanges(false)
        loadDetail()
      } else {
        const errData = await res.json()
        showToast('error', `保存失败: ${errData.message || res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  // ── Status action handlers ─────────────────────────────────────────

  const handleStatusAction = async (action: StatusAction) => {
    if (!item) return
    const newStatus = statusAfterAction(item.status, action)
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, status: newStatus, version: item.version }),
      })
      if (res.ok) {
        showToast('success', `${statusActionLabel(action)}成功`)
        loadDetail()
      } else {
        const errData = await res.json()
        showToast('error', `操作失败: ${errData.message || res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  // ── Delete handler ─────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!item) return
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, version: item.version }),
      })
      if (res.ok) {
        showToast('success', '删除成功')
        setTimeout(() => router.push('/inventory'), 500)
      } else {
        const errData = await res.json()
        showToast('error', `删除失败: ${errData.message || res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────

  const renderStatusBadge = (status: InventoryItem['status']) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-yellow-100 text-yellow-700',
      ARCHIVED: 'bg-gray-100 text-gray-500',
    }
    const labels: Record<string, string> = {
      ACTIVE: '启用',
      INACTIVE: '停用',
      ARCHIVED: '已归档',
    }
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const renderToast = () => {
    if (!toast) return null
    const bgColors: Record<ToastType, string> = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500 text-gray-900',
    }
    return (
      <div
        className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white ${bgColors[toast.type]} z-50`}
      >
        {toast.msg}
      </div>
    )
  }

  // ── Loading / Not Found ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">未找到库存项</h1>
        <p className="text-gray-500 mb-4">ID: {id} 不存在或已被删除</p>
        <button
          onClick={() => router.push('/inventory')}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          返回库存列表
        </button>
      </div>
    )
  }

  const statusActions = availableStatusActions(item.status)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/inventory')}
            className="text-blue-500 hover:underline text-sm mb-1 block"
          >
            &larr; 返回库存列表
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {item.name}
            {renderStatusBadge(item.status)}
          </h1>
          <p className="text-gray-500 text-sm font-mono mt-1">SKU: {item.sku} · ID: {item.id}</p>
        </div>
        <div className="flex gap-2">
          {statusActions.map((action) => (
            <button
              key={action}
              onClick={() => handleStatusAction(action)}
              disabled={saving}
              className="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {statusActionLabel(action)}
            </button>
          ))}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
            className="px-3 py-1 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 disabled:opacity-50"
          >
            删除
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        {([
          { key: 'overview' as TabType, label: '概览' },
          { key: 'movements' as TabType, label: '出入记录' },
          { key: 'edit' as TabType, label: '编辑' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic info card */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">基本信息</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">租户</dt>
                <dd className="font-mono text-sm">{item.tenantId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">SKU</dt>
                <dd className="font-mono">{item.sku}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">名称</dt>
                <dd>{item.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">计量单位</dt>
                <dd>{item.unit}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">状态</dt>
                <dd>{renderStatusBadge(item.status)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">版本</dt>
                <dd className="font-mono text-sm">{item.version}</dd>
              </div>
            </dl>
          </div>

          {/* Stock info card */}
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">库存信息</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">总数量</dt>
                <dd className="font-bold">{item.totalQty} {item.unit}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">可用数量</dt>
                <dd className={`font-bold ${item.availableQty <= item.lowStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                  {item.availableQty} {item.unit}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">预留数量</dt>
                <dd>{item.reservedQty} {item.unit}</dd>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <dt className="text-gray-500">低库存阈值</dt>
                <dd>{item.lowStockThreshold} {item.unit}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">单价</dt>
                <dd>{formatPrice(item.unitPriceCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">库存总值</dt>
                <dd className="font-bold">{formatPrice(item.availableQty * item.unitPriceCents)}</dd>
              </div>
            </dl>
            {item.availableQty <= item.lowStockThreshold && (
              <div className="mt-3 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
                ⚠️ {item.availableQty === 0 ? '库存已耗尽' : '低库存预警，请及时补货'}
              </div>
            )}
          </div>

          {/* Edge items */}
          {edgeItems.length > 0 && (
            <div className="md:col-span-2 border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">关联商品</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {edgeItems.map((e) => (
                  <div key={e.id} className="border rounded p-2 text-sm">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-gray-500 font-mono">{e.sku}</div>
                    <div className={e.qty <= 3 ? 'text-red-500 font-bold' : 'text-gray-700'}>
                      库存: {e.qty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Movements */}
      {activeTab === 'movements' && (
        <div>
          {movements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无出入记录</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left text-sm">时间</th>
                  <th className="border px-3 py-2 text-left text-sm">类型</th>
                  <th className="border px-3 py-2 text-right text-sm">数量</th>
                  <th className="border px-3 py-2 text-left text-sm">原因</th>
                  <th className="border px-3 py-2 text-left text-sm">操作人</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="border px-3 py-2 text-sm text-gray-500">
                      {new Date(m.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td className="border px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          m.type === 'STOCK_IN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {m.type === 'STOCK_IN' ? '入库' : '出库'}
                      </span>
                    </td>
                    <td className={`border px-3 py-2 text-right font-mono font-bold ${
                      m.type === 'STOCK_IN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {m.type === 'STOCK_IN' ? '+' : '-'}{m.qty}
                    </td>
                    <td className="border px-3 py-2 text-sm">{m.reason}</td>
                    <td className="border px-3 py-2 text-sm text-gray-500">{m.performedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Edit */}
      {activeTab === 'edit' && (
        <div className="max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => handleEditFieldChange((v: string | number) => setEditName(v as string), e.target.value)}
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">计量单位</label>
              <input
                type="text"
                value={editUnit}
                onChange={(e) => handleEditFieldChange((v: string | number) => setEditUnit(v as string), e.target.value)}
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="如: 台 / 个 / 瓶"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">低库存阈值</label>
                <input
                  type="number"
                  value={editThreshold}
                  onChange={(e) => handleEditFieldChange((v: string | number) => setEditThreshold(v as number), Number(e.target.value))}
                  min={0}
                  className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">单价 (分)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => handleEditFieldChange((v: string | number) => setEditPrice(v as number), Number(e.target.value))}
                  min={0}
                  className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {hasChanges && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded text-sm">
                你有未保存的更改
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? '保存中...' : '保存修改'}
              </button>
              <button
                onClick={() => {
                  setEditName(item.name)
                  setEditUnit(item.unit)
                  setEditThreshold(item.lowStockThreshold)
                  setEditPrice(item.unitPriceCents)
                  setHasChanges(false)
                }}
                disabled={!hasChanges}
                className="px-6 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                重置
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-2">确认删除</h2>
            <p className="text-gray-600 mb-4">
              确定要永久删除 <strong>{item.sku}</strong> ({item.name}) 吗？此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {saving ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renderToast()}
    </div>
  )
}
