'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  STAFF_ROLE_MAP,
  STAFF_STATUS_MAP,
  type StaffRole,
  type StaffSnapshotDelivery,
  type StaffStatus,
} from './staff-data'

const MARKET_LABEL_MAP: Record<string, string> = {
  'cn-mainland': '中国区',
  'us-default': '美国区',
  'uk-default': '英国区',
}

export default function StaffClient({
  snapshot,
}: {
  snapshot: StaffSnapshotDelivery
}) {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<StaffStatus | 'all'>('all')
  const [role, setRole] = useState<StaffRole | 'all'>('all')
  const [isRefreshing, startRefresh] = useTransition()

  const loweredKeyword = keyword.trim().toLowerCase()

  const filteredStaff = useMemo(
    () =>
      snapshot.staff.filter((item) => {
        const matchesStatus = status === 'all' || item.status === status
        const matchesRole = role === 'all' || item.role === role
        const matchesKeyword =
          !loweredKeyword ||
          item.name.toLowerCase().includes(loweredKeyword) ||
          item.code.toLowerCase().includes(loweredKeyword) ||
          item.storeName.toLowerCase().includes(loweredKeyword) ||
          item.email.toLowerCase().includes(loweredKeyword)

        return matchesStatus && matchesRole && matchesKeyword
      }),
    [snapshot.staff, status, role, loweredKeyword]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            岗位名册 · 状态筛选 · Delivery {snapshot.deliveryMode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => startRefresh(() => router.refresh())}
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
          <p className="text-sm text-gray-500">总人数</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.total}</p>
          <p className="text-xs text-gray-400">在职 {snapshot.stats.active}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">店长数</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.managers}</p>
          <p className="text-xs text-gray-400">骨干配置</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">高绩效人数</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.topPerformers}</p>
          <p className="text-xs text-gray-400">绩效分 85+</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">覆盖市场</p>
          <p className="mt-1 text-2xl font-bold">{new Set(snapshot.staff.map((item) => item.marketCode)).size}</p>
          <p className="text-xs text-gray-400">多区域值守</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索姓名、编号、门店、邮箱"
          className="min-w-[260px] rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as StaffStatus | 'all')}
          className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">全部状态</option>
          {Object.entries(STAFF_STATUS_MAP).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as StaffRole | 'all')}
          className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">全部岗位</option>
          {Object.entries(STAFF_ROLE_MAP).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">员工</th>
              <th className="px-4 py-3">岗位</th>
              <th className="px-4 py-3">门店/部门</th>
              <th className="px-4 py-3">市场</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">绩效</th>
              <th className="px-4 py-3">最近活跃</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  当前筛选条件下没有员工数据
                </td>
              </tr>
            ) : (
              filteredStaff.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      {item.code} · {item.phone} · {item.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{STAFF_ROLE_MAP[item.role].label}</td>
                  <td className="px-4 py-3 text-gray-600">{item.storeName}</td>
                  <td className="px-4 py-3 text-gray-600">{MARKET_LABEL_MAP[item.marketCode] ?? item.marketCode}</td>
                  <td className="px-4 py-3 text-gray-600">{STAFF_STATUS_MAP[item.status].label}</td>
                  <td className="px-4 py-3 text-gray-600">{item.performanceScore}</td>
                  <td className="px-4 py-3 text-gray-600">{item.lastActiveAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
