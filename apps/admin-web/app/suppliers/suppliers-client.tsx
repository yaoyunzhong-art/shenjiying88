'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import {
  SUPPLIER_CATEGORY_MAP,
  SUPPLIER_CREDIT_MAP,
  SUPPLIER_STATUS_MAP,
  SUPPLIER_STATUSES,
  formatCurrency,
  type SupplierCategory,
  type SupplierStatus,
  type SuppliersSnapshotDelivery,
} from './suppliers-data'

function matchesKeyword(value: string, keyword: string): boolean {
  return value.toLowerCase().includes(keyword)
}

export default function SuppliersClient({
  snapshot,
}: {
  snapshot: SuppliersSnapshotDelivery
}) {
    const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<SupplierStatus | 'all'>('all')
  const [category, setCategory] = useState<SupplierCategory | 'all'>('all')
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const loweredKeyword = keyword.trim().toLowerCase()

  const filteredSuppliers = useMemo(
    () =>
      snapshot.suppliers.filter((item) => {
        const matchesStatus = status === 'all' || item.status === status
        const matchesCategory = category === 'all' || item.category === category
        const matchesSearch =
          !loweredKeyword ||
          matchesKeyword(item.name, loweredKeyword) ||
          matchesKeyword(item.code, loweredKeyword) ||
          matchesKeyword(item.contactPerson, loweredKeyword) ||
          matchesKeyword(item.contactPhone, loweredKeyword) ||
          matchesKeyword(item.email, loweredKeyword)

        return matchesStatus && matchesCategory && matchesSearch
      }),
    [snapshot.suppliers, status, category, loweredKeyword]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">供应商管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            合作清单 · 评级洞察 · Delivery {snapshot.deliveryMode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      {snapshot.error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          {snapshot.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">供应商总数</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.total}</p>
          <p className="text-xs text-gray-400">合作中 {snapshot.stats.active}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">总订单数</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.totalOrders}</p>
          <p className="text-xs text-gray-400">待审核 {snapshot.stats.pendingAudit}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">累计金额</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(snapshot.stats.totalAmount)}</p>
          <p className="text-xs text-gray-400">黑名单 {snapshot.stats.blacklisted}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">主要分类</p>
          <p className="mt-1 text-2xl font-bold">
            {SUPPLIER_CATEGORY_MAP[snapshot.stats.topCategory as SupplierCategory] ?? snapshot.stats.topCategory}
          </p>
          <p className="text-xs text-gray-400">
            平均坏品率 {snapshot.stats.avgDefectRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索供应商名称、编码、联系人"
          className="min-w-[260px] rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as SupplierStatus | 'all')}
          className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">全部状态</option>
          {SUPPLIER_STATUSES.map((item) => (
            <option key={item} value={item}>
              {SUPPLIER_STATUS_MAP[item].label}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as SupplierCategory | 'all')}
          className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">全部分类</option>
          {Object.entries(SUPPLIER_CATEGORY_MAP).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">供应商</th>
              <th className="px-4 py-3">分类</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">信用</th>
              <th className="px-4 py-3">订单数</th>
              <th className="px-4 py-3">总金额</th>
              <th className="px-4 py-3">最近订单</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  当前筛选条件下没有供应商数据
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      {item.code} · {item.contactPerson} · {item.contactPhone}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{SUPPLIER_CATEGORY_MAP[item.category]}</td>
                  <td className="px-4 py-3 text-gray-600">{SUPPLIER_STATUS_MAP[item.status].label}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <span style={{ color: SUPPLIER_CREDIT_MAP[item.creditRating].color }}>
                      {SUPPLIER_CREDIT_MAP[item.creditRating].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.totalOrders}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(item.totalAmount)}</td>
                  <td className="px-4 py-3 text-gray-600">{item.lastOrderAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
