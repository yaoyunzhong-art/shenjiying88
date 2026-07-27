'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import {
  MEMBER_STATUS_MAP,
  MEMBER_TIER_MAP,
  type MemberSnapshotDelivery,
  type MemberStatus,
  type MemberTier,
} from './member-data'

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function MemberClient({
  snapshot,
}: {
  snapshot: MemberSnapshotDelivery
}) {
    const [keyword, setKeyword] = useState('')
  const [tier, setTier] = useState<MemberTier | 'all'>('all')
  const [status, setStatus] = useState<MemberStatus | 'all'>('all')
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const loweredKeyword = keyword.trim().toLowerCase()

  const filteredMembers = useMemo(
    () =>
      snapshot.members.filter((item) => {
        const matchesTier = tier === 'all' || item.tier === tier
        const matchesStatus = status === 'all' || item.status === status
        const matchesKeyword =
          !loweredKeyword ||
          item.name.toLowerCase().includes(loweredKeyword) ||
          item.phone.includes(loweredKeyword) ||
          item.code.toLowerCase().includes(loweredKeyword) ||
          item.storeName.toLowerCase().includes(loweredKeyword)

        return matchesTier && matchesStatus && matchesKeyword
      }),
    [snapshot.members, tier, status, loweredKeyword]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会员管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            分层清单 · 活跃状态 · Delivery {snapshot.deliveryMode}
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
          <p className="text-sm text-gray-500">总会员</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.total}</p>
          <p className="text-xs text-gray-400">活跃 {snapshot.stats.active}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">钻石会员</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.diamond}</p>
          <p className="text-xs text-gray-400">高价值会员</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">金卡会员</p>
          <p className="mt-1 text-2xl font-bold">{snapshot.stats.gold}</p>
          <p className="text-xs text-gray-400">成长中主力</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">累计消费</p>
          <p className="mt-1 text-2xl font-bold">{formatCurrency(snapshot.stats.totalSpent)}</p>
          <p className="text-xs text-gray-400">休眠 {snapshot.stats.dormant}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索会员姓名、手机号、编号、门店"
          className="min-w-[260px] rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <select
          value={tier}
          onChange={(event) => setTier(event.target.value as MemberTier | 'all')}
          className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">全部等级</option>
          {Object.entries(MEMBER_TIER_MAP).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as MemberStatus | 'all')}
          className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="all">全部状态</option>
          {Object.entries(MEMBER_STATUS_MAP).map(([key, item]) => (
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
              <th className="px-4 py-3">会员</th>
              <th className="px-4 py-3">等级</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">积分</th>
              <th className="px-4 py-3">消费总额</th>
              <th className="px-4 py-3">注册时间</th>
              <th className="px-4 py-3">最近到店</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                  当前筛选条件下没有会员数据
                </td>
              </tr>
            ) : (
              filteredMembers.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-400">
                      {item.code} · {item.phone} · {item.storeName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{MEMBER_TIER_MAP[item.tier].label}</td>
                  <td className="px-4 py-3 text-gray-600">{MEMBER_STATUS_MAP[item.status].label}</td>
                  <td className="px-4 py-3 text-gray-600">{item.points.toLocaleString('zh-CN')}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(item.totalSpent)}</td>
                  <td className="px-4 py-3 text-gray-600">{item.registeredAt}</td>
                  <td className="px-4 py-3 text-gray-600">{item.lastVisitAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
