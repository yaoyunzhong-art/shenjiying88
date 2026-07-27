'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { PaymentChannel, PaymentChannelsSnapshotDelivery } from './payment-channels-data'

type ChanTab = 'online' | 'offline' | 'all'

function fmtCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function providerLabel(p: string): string {
  const map: Record<string, string> = { wechat: '微信支付', alipay: '支付宝', unionpay: '银联', cash: '现金', card: '银行卡', other: '其他' }
  return map[p] ?? p
}

function providerIcon(p: string): string {
  const map: Record<string, string> = { wechat: '💚', alipay: '💙', unionpay: '🔵', cash: '💵', card: '💳', other: '🔧' }
  return map[p] ?? '❓'
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { normal: '正常', degraded: '降级', offline: '离线' }
  return map[s] ?? s
}

function statusColor(s: string): string {
  const map: Record<string, string> = { normal: 'bg-green-100 text-green-700', degraded: 'bg-yellow-100 text-yellow-700', offline: 'bg-red-100 text-red-700' }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

export default function PaymentChannelsClient({
  snapshot,
}: {
  snapshot: PaymentChannelsSnapshotDelivery
}) {
    const [tabView, setTabView] = useState<ChanTab>('all')
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const channels = snapshot.channels

  const filtered = useMemo(
    () =>
      channels.filter((channel) => {
        if (tabView === 'all') return true
        return channel.type === tabView
      }),
    [channels, tabView]
  )

  const totals = useMemo(() => {
    const totalToday = channels.reduce((sum, channel) => sum + channel.todayAmountCents, 0)
    const totalTransactions = channels.reduce((sum, channel) => sum + channel.todayCount, 0)
    const abnormalCount = channels.filter((channel) => channel.status !== 'normal').length
    return { totalToday, totalTransactions, abnormalCount }
  }, [channels])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">支付渠道</h1>
          <p className="text-sm text-gray-500 mt-1">支付方式管理 · 渠道监控 · 费率配置</p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
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
          <p className="text-sm text-gray-500">渠道数</p>
          <p className="text-2xl font-bold mt-1">{channels.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">今日交易额</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{fmtCents(totals.totalToday)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">今日笔数</p>
          <p className="text-2xl font-bold mt-1">{totals.totalTransactions}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">异常渠道</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{totals.abnormalCount}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['online', 'offline', 'all'] as ChanTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ online: '线上支付', offline: '线下支付', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-gray-300 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无支付渠道</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有支付渠道</p>
          </div>
        ) : (
          filtered.map((channel: PaymentChannel) => (
            <div key={channel.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{providerIcon(channel.provider)}</span>
                    <h3 className="text-base font-medium text-gray-900">{channel.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(channel.status)}`}>
                      {statusLabel(channel.status)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{providerLabel(channel.provider)}</span>
                    {!channel.enabled && <span className="text-xs text-red-500">已禁用</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>费率: {(channel.feeRate / 100).toFixed(2)}%</span>
                    <span>单笔限额: {fmtCents(channel.singleLimitCents)}</span>
                    <span>日限额: {fmtCents(channel.dailyLimitCents)}</span>
                    {channel.supportedStoreIds.length > 0 ? (
                      <span>适用门店: {channel.supportedStoreIds.length}家</span>
                    ) : (
                      <span>适用: 全部门店</span>
                    )}
                    {channel.lastHealthCheck && (
                      <span>健康检查: {new Date(channel.lastHealthCheck).toLocaleTimeString('zh-CN')}</span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[120px]">
                  <p className="text-lg font-bold">{fmtCents(channel.todayAmountCents)}</p>
                  <p className="text-xs text-gray-400">今日 {channel.todayCount} 笔</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
