'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ProcurementOrder, ProcurementSnapshotDelivery } from './procurement-data'

type ProcTab = 'pending' | 'approved' | 'received' | 'all'

function fmtCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function statusLabel(status: ProcurementOrder['status']): string {
  const map: Record<ProcurementOrder['status'], string> = {
    draft: '草稿',
    submitted: '待审批',
    approved: '待发货',
    shipped: '配送中',
    received: '已收货',
    cancelled: '已取消',
  }
  return map[status]
}

function statusColor(status: ProcurementOrder['status']): string {
  const map: Record<ProcurementOrder['status'], string> = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    received: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
  }
  return map[status]
}

function priorityLabel(priority: ProcurementOrder['priority']): string {
  const map: Record<ProcurementOrder['priority'], string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  }
  return map[priority]
}

function priorityColor(priority: ProcurementOrder['priority']): string {
  const map: Record<ProcurementOrder['priority'], string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-yellow-100 text-yellow-700',
    urgent: 'bg-red-100 text-red-700',
  }
  return map[priority]
}

export default function ProcurementClient({
  snapshot,
}: {
  snapshot: ProcurementSnapshotDelivery
}) {
  const router = useRouter()
  const [tabView, setTabView] = useState<ProcTab>('pending')
  const [isRefreshing, startRefresh] = useTransition()
  const orders = snapshot.orders

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        if (tabView === 'all') return true
        if (tabView === 'pending') return order.status === 'draft' || order.status === 'submitted'
        if (tabView === 'approved') return order.status === 'approved' || order.status === 'shipped'
        return order.status === 'received'
      }),
    [orders, tabView]
  )

  const totals = useMemo(() => {
    const pendingCount = orders.filter(
      (order) => order.status === 'draft' || order.status === 'submitted'
    ).length
    const urgentCount = orders.filter(
      (order) =>
        (order.priority === 'urgent' || order.priority === 'high') && order.status !== 'received'
    ).length
    const totalAmount = orders.reduce((sum, order) => sum + order.totalCents, 0)
    return {
      pendingCount,
      urgentCount,
      totalAmount,
    }
  }, [orders])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">采购管理</h1>
          <p className="text-sm text-gray-500 mt-1">采购订单 · 供应商管理 · 到货跟踪</p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
          disabled={isRefreshing}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{snapshot.error}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">采购单</p>
          <p className="text-2xl font-bold mt-1">{orders.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">待处理</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{totals.pendingCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">紧急</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{totals.urgentCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">采购总额</p>
          <p className="text-2xl font-bold mt-1">{fmtCents(totals.totalAmount)}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['pending', 'approved', 'received', 'all'] as ProcTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ pending: '待处理', approved: '供应商处理中', received: '已收货', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-gray-300 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10m0 0h10m-10 0l2-2m-2 2l-2-2m16-2V8a1 1 0 00-1-1h-4m0 0l2-2m-2 2l-2 2m-2 6v6a1 1 0 001 1h10a1 1 0 001-1v-6m0 0H9"
                />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无采购单</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有采购订单</p>
          </div>
        ) : (
          filtered.map((order: ProcurementOrder) => (
            <div
              key={order.id}
              className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900 font-mono text-sm">
                      {order.orderNo}
                    </h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(order.status)}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColor(order.priority)}`}
                    >
                      {priorityLabel(order.priority)}
                    </span>
                    <span className="text-xs text-gray-400">{order.supplierName}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {order.items.map((item, index) => (
                      <span key={`${order.id}-${item.name}-${index}`}>
                        {item.name}×{item.quantity}
                        {index < order.items.length - 1 ? ' · ' : ''}
                      </span>
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
