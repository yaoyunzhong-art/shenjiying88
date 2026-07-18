'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface ProcurementOrder {
  id: string
  orderNo: string
  supplierName: string
  supplierId: string
  items: Array<{ name: string; quantity: number; unitPriceCents: number; totalCents: number }>
  totalCents: number
  status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'received' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
  requester: string
  approver?: string
  storeName?: string
  expectedDate?: string
  receivedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

type ProcTab = 'pending' | 'approved' | 'received' | 'all'

// ── 工具 ──

function fmtCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { draft: '草稿', submitted: '待审批', approved: '待发货', shipped: '配送中', received: '已收货', cancelled: '已取消' }
  return map[s] ?? s
}

function statusColor(s: string): string {
  const map: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', submitted: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', shipped: 'bg-indigo-100 text-indigo-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

function priorityLabel(p: string): string {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[p] ?? p
}

function priorityColor(p: string): string {
  const map: Record<string, string> = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-700', high: 'bg-yellow-100 text-yellow-700', urgent: 'bg-red-100 text-red-700' }
  return map[p] ?? 'bg-gray-100 text-gray-600'
}

// ── 默认样本数据 ──

const defaultOrders: ProcurementOrder[] = [
  { id: 'po-1', orderNo: 'PO-20260718-001', supplierName: '华强电子', supplierId: 's1', items: [{ name: '收银机主板', quantity: 5, unitPriceCents: 120000, totalCents: 600000 }], totalCents: 600000, status: 'submitted', priority: 'high', department: '技术部', requester: '张工', storeName: '总部', createdAt: '2026-07-18T09:00:00Z', updatedAt: '2026-07-18T09:00:00Z' },
  { id: 'po-2', orderNo: 'PO-20260718-002', supplierName: '益智玩具厂', supplierId: 's2', items: [{ name: '扭蛋', quantity: 200, unitPriceCents: 1500, totalCents: 300000 }, { name: '盲盒', quantity: 100, unitPriceCents: 3500, totalCents: 350000 }], totalCents: 650000, status: 'approved', priority: 'medium', department: '运营部', requester: '李运营', storeName: '北京朝阳店', approver: '王经理', expectedDate: '2026-07-22', createdAt: '2026-07-17T14:00:00Z', updatedAt: '2026-07-18T08:00:00Z' },
  { id: 'po-3', orderNo: 'PO-20260717-001', supplierName: '天地餐饮', supplierId: 's3', items: [{ name: '饮料原料', quantity: 50, unitPriceCents: 8000, totalCents: 400000 }], totalCents: 400000, status: 'received', priority: 'low', department: '餐饮部', requester: '赵主管', storeName: '广州天河店', approver: '刘总监', expectedDate: '2026-07-16', receivedDate: '2026-07-17', createdAt: '2026-07-15T10:00:00Z', updatedAt: '2026-07-17T16:00:00Z' },
  { id: 'po-4', orderNo: 'PO-20260716-003', supplierName: '杭州动漫科技', supplierId: 's4', items: [{ name: '动漫手办', quantity: 30, unitPriceCents: 25000, totalCents: 750000 }], totalCents: 750000, status: 'shipped', priority: 'urgent', department: '营销部', requester: '陈营销', storeName: '上海南京路店', approver: '王经理', expectedDate: '2026-07-20', createdAt: '2026-07-16T11:00:00Z', updatedAt: '2026-07-18T06:00:00Z' },
  { id: 'po-5', orderNo: 'PO-20260715-002', supplierName: '本地清洁用品', supplierId: 's5', items: [{ name: '清洁剂', quantity: 100, unitPriceCents: 2500, totalCents: 250000 }, { name: '垃圾袋', quantity: 500, unitPriceCents: 200, totalCents: 100000 }], totalCents: 350000, status: 'draft', priority: 'low', department: '后勤部', requester: '孙权', storeName: '深圳南山店', createdAt: '2026-07-15T08:00:00Z', updatedAt: '2026-07-15T08:00:00Z' },
]

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ── 主组件 ──

export default function ProcurementPage() {
  const [orders, setOrders] = useState<ProcurementOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<ProcTab>('pending')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ orders: ProcurementOrder[] }>('/api/inventory/procurement')
      setOrders(data.orders)
    } catch {
      setOrders(defaultOrders)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const filtered = orders.filter(o => {
    if (tabView === 'all') return true
    if (tabView === 'pending') return o.status === 'draft' || o.status === 'submitted'
    if (tabView === 'approved') return o.status === 'approved' || o.status === 'shipped'
    if (tabView === 'received') return o.status === 'received'
    return true
  })

  const pendingCount = orders.filter(o => o.status === 'draft' || o.status === 'submitted').length
  const totalAmount = orders.reduce((s, o) => s + o.totalCents, 0)
  const urgentCount = orders.filter(o => o.priority === 'urgent' || o.priority === 'high').filter(o => o.status !== 'received').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载采购单...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-sm text-gray-500 mt-1">采购订单 · 供应商管理 · 到货跟踪</p>
        </div>
        <button onClick={loadOrders} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">采购单</p>
          <p className="text-2xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">待处理</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">紧急</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{urgentCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">采购总额</p>
          <p className="text-2xl font-bold mt-1">{fmtCents(totalAmount)}</p>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['pending', 'approved', 'received', 'all'] as ProcTab[]).map(tab => (
            <button key={tab} onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {{ pending: '待处理', approved: '供应商处理中', received: '已收货', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      {/* 列表 */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-gray-300 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m0 0h10m-10 0l2-2m-2 2l-2-2m16-2V8a1 1 0 00-1-1h-4m0 0l2-2m-2 2l-2 2m-2 6v6a1 1 0 001 1h10a1 1 0 001-1v-6m0 0H9" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无采购单</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有采购订单</p>
          </div>
        ) : (
          filtered.map(order => (
            <div key={order.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900 font-mono text-sm">{order.orderNo}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(order.status)}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColor(order.priority)}`}>
                      {priorityLabel(order.priority)}
                    </span>
                    <span className="text-xs text-gray-400">{order.supplierName}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {order.items.map((item, i) => (
                      <span key={i}>{item.name}×{item.quantity}{i < order.items.length - 1 ? ' · ' : ''}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>申请人: {order.requester}</span>
                    <span>部门: {order.department}</span>
                    {order.storeName && <span>门店: {order.storeName}</span>}
                    {order.expectedDate && <span>期望到货: {order.expectedDate}</span>}
                    {order.receivedDate && <span>已收货: {order.receivedDate}</span>}
                    {order.approver && <span>审批人: {order.approver}</span>}
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[100px]">
                  <p className="text-lg font-bold">{fmtCents(order.totalCents)}</p>
                  <p className="text-xs text-gray-400">{order.items.length} 个品项</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
