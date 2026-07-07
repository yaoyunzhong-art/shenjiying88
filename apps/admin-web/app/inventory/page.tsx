'use client'

/**
 * Phase-37 T167: 库存管理页面 (admin-web)
 *
 * 反模式 v4 防御:
 *  - TenantGuard: 强制 tenantId
 *  - 低库存预警: 红黄绿色区分
 *  - 乐观锁: update 需传 version
 */

import { useState, useEffect, useCallback } from 'react'

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

const API_BASE = '/api/inventory'

export default function InventoryPage() {
  const [tenantId, setTenantId] = useState('demo-tenant')
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const loadList = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}?tenantId=${tenantId}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
      } else {
        showToast('error', `加载失败: ${res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadList()
  }, [loadList])

  const handleStockIn = async (item: InventoryItem, qty: number, reason: string) => {
    try {
      const res = await fetch(`${API_BASE}/${item.id}/stock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, qty, reason, performedBy: 'admin' })
      })
      if (res.ok) {
        showToast('success', `入库成功 +${qty}`)
        loadList()
      } else {
        const err = await res.json()
        showToast('error', `入库失败: ${err.message || res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    }
  }

  const handleStockOut = async (item: InventoryItem, qty: number, reason: string) => {
    try {
      const res = await fetch(`${API_BASE}/${item.id}/stock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, qty, reason, performedBy: 'admin' })
      })
      if (res.ok) {
        showToast('success', `出库成功 -${qty}`)
        loadList()
      } else {
        const err = await res.json()
        showToast('error', `出库失败: ${err.message || res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    }
  }

  const handleCreate = async (input: {
    sku: string
    name: string
    totalQty: number
    unitPriceCents: number
  }) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...input })
      })
      if (res.ok) {
        showToast('success', `创建成功: ${input.sku}`)
        setShowCreateDialog(false)
        loadList()
      } else {
        const err = await res.json()
        showToast('error', `创建失败: ${err.message || res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    }
  }

  const lowStockCount = items.filter((i) => i.availableQty <= i.lowStockThreshold).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📦 库存管理</h1>

      {/* Tenant 选择器 */}
      <div className="mb-4 flex gap-4 items-center">
        <label className="text-sm font-medium">租户 ID:</label>
        <input
          type="text"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={loadList}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          刷新
        </button>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
        >
          + 新建库存
        </button>
        {lowStockCount > 0 && (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded">
            ⚠️ {lowStockCount} 项低库存
          </span>
        )}
      </div>

      {/* 库存列表 */}
      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无库存项</div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
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
                <tr key={item.id} className={isOut ? 'bg-red-50' : isLow ? 'bg-yellow-50' : ''}>
                  <td className="border px-3 py-2 font-mono">{item.sku}</td>
                  <td className="border px-3 py-2">{item.name}</td>
                  <td className="border px-3 py-2 text-right">{item.totalQty}</td>
                  <td className="border px-3 py-2 text-right font-bold">{item.availableQty}</td>
                  <td className="border px-3 py-2 text-right">{item.reservedQty}</td>
                  <td className="border px-3 py-2 text-right text-gray-500">{item.lowStockThreshold}</td>
                  <td className="border px-3 py-2 text-right">{item.unitPriceCents}</td>
                  <td className="border px-3 py-2 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        item.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : item.status === 'ARCHIVED'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="border px-3 py-2 text-center">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-blue-500 hover:underline mr-2"
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

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* 操作对话框 */}
      {selectedItem && (
        <OperationDialog
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onStockIn={handleStockIn}
          onStockOut={handleStockOut}
        />
      )}

      {/* 新建对话框 */}
      {showCreateDialog && (
        <CreateDialog onClose={() => setShowCreateDialog(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}

function OperationDialog({
  item,
  onClose,
  onStockIn,
  onStockOut
}: {
  item: InventoryItem
  onClose: () => void
  onStockIn: (item: InventoryItem, qty: number, reason: string) => void
  onStockOut: (item: InventoryItem, qty: number, reason: string) => void
}) {
  const [qty, setQty] = useState(10)
  const [reason, setReason] = useState('')
  const [action, setAction] = useState<'in' | 'out'>('in')

  const handleSubmit = () => {
    if (!reason) return
    if (action === 'in') onStockIn(item, qty, reason)
    else onStockOut(item, qty, reason)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-4">库存操作 · {item.sku}</h2>
        <div className="mb-3">
          <label className="block text-sm mb-1">类型</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as 'in' | 'out')}
            className="w-full border px-2 py-1 rounded"
          >
            <option value="in">入库</option>
            <option value="out">出库</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">数量</label>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">原因</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="如: 采购到货 / 销售出库"
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1 border rounded">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason}
            className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
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
  onCreate
}: {
  onClose: () => void
  onCreate: (input: { sku: string; name: string; totalQty: number; unitPriceCents: number }) => void
}) {
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [totalQty, setTotalQty] = useState(0)
  const [unitPriceCents, setUnitPriceCents] = useState(0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-4">新建库存</h2>
        <div className="mb-3">
          <label className="block text-sm mb-1">SKU</label>
          <input
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">名称</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">初始数量</label>
          <input
            type="number"
            value={totalQty}
            onChange={(e) => setTotalQty(Number(e.target.value))}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">单价 (分)</label>
          <input
            type="number"
            value={unitPriceCents}
            onChange={(e) => setUnitPriceCents(Number(e.target.value))}
            className="w-full border px-2 py-1 rounded"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1 border rounded">
            取消
          </button>
          <button
            onClick={() => onCreate({ sku, name, totalQty, unitPriceCents })}
            disabled={!sku || !name}
            className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}