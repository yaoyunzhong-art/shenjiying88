'use client'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payment Channels - 神机营' }


import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface PaymentChannel {
  id: string
  name: string
  provider: 'wechat' | 'alipay' | 'unionpay' | 'cash' | 'card' | 'other'
  type: 'online' | 'offline'
  enabled: boolean
  feeRate: number                // 手续费率(万分比, 38=0.38%)
  dailyLimitCents: number       // 日限额
  singleLimitCents: number      // 单笔限额
  supportedStoreIds: string[]   // 适用门店(空=全部)
  todayAmountCents: number
  todayCount: number
  status: 'normal' | 'degraded' | 'offline'
  lastHealthCheck?: string
  config: Array<{ key: string; label: string; value: string }>
  createdAt: string
  updatedAt: string
}

type ChanTab = 'online' | 'offline' | 'all'

// ── 工具 ──

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

// ── 默认样本数据 ──

const defaultChannels: PaymentChannel[] = [
  { id: 'ch-1', name: '微信支付', provider: 'wechat', type: 'online', enabled: true, feeRate: 38, dailyLimitCents: 500000000, singleLimitCents: 5000000, supportedStoreIds: [], todayAmountCents: 12850000, todayCount: 423, status: 'normal', lastHealthCheck: '2026-07-18T21:30:00Z', config: [{ key: 'appId', label: 'AppID', value: 'wx_****' }, { key: 'mchId', label: '商户号', value: '123456' }], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T21:30:00Z' },
  { id: 'ch-2', name: '支付宝', provider: 'alipay', type: 'online', enabled: true, feeRate: 38, dailyLimitCents: 500000000, singleLimitCents: 5000000, supportedStoreIds: [], todayAmountCents: 8920000, todayCount: 287, status: 'normal', lastHealthCheck: '2026-07-18T21:28:00Z', config: [{ key: 'appId', label: 'AppID', value: '2026****' }], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T21:28:00Z' },
  { id: 'ch-3', name: '银联刷卡', provider: 'unionpay', type: 'offline', enabled: true, feeRate: 55, dailyLimitCents: 200000000, singleLimitCents: 10000000, supportedStoreIds: ['s1', 's2'], todayAmountCents: 2350000, todayCount: 18, status: 'degraded', lastHealthCheck: '2026-07-18T18:00:00Z', config: [{ key: 'terminalId', label: '终端号', value: 'UP****' }], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-18T18:00:00Z' },
  { id: 'ch-4', name: '现金', provider: 'cash', type: 'offline', enabled: true, feeRate: 0, dailyLimitCents: 50000000, singleLimitCents: 1000000, supportedStoreIds: [], todayAmountCents: 1850000, todayCount: 156, status: 'normal', config: [], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
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

export default function PaymentChannelsPage() {
  const [channels, setChannels] = useState<PaymentChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<ChanTab>('all')

  const loadChannels = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ channels: PaymentChannel[] }>('/api/cashier/channels')
      setChannels(data.channels)
    } catch {
      setChannels(defaultChannels)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadChannels() }, [loadChannels])

  const filtered = channels.filter(ch => {
    if (tabView === 'all') return true
    return ch.type === tabView
  })

  const totalToday = channels.reduce((s, ch) => s + ch.todayAmountCents, 0)
  const totalTransactions = channels.reduce((s, ch) => s + ch.todayCount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载支付渠道...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">支付渠道</h1>
          <p className="text-sm text-gray-500 mt-1">支付方式管理 · 渠道监控 · 费率配置</p>
        </div>
        <button onClick={loadChannels} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">渠道数</p>
          <p className="text-2xl font-bold mt-1">{channels.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">今日交易额</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{fmtCents(totalToday)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">今日笔数</p>
          <p className="text-2xl font-bold mt-1">{totalTransactions}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">异常渠道</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{channels.filter(ch => ch.status !== 'normal').length}</p>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['online', 'offline', 'all'] as ChanTab[]).map(tab => (
            <button key={tab} onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {{ online: '线上支付', offline: '线下支付', all: '全部' }[tab]}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无支付渠道</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有支付渠道</p>
          </div>
        ) : (
          filtered.map(ch => (
            <div key={ch.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{providerIcon(ch.provider)}</span>
                    <h3 className="text-base font-medium text-gray-900">{ch.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(ch.status)}`}>
                      {statusLabel(ch.status)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{providerLabel(ch.provider)}</span>
                    {!ch.enabled && <span className="text-xs text-red-500">已禁用</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>费率: {(ch.feeRate / 100).toFixed(2)}%</span>
                    <span>单笔限额: {fmtCents(ch.singleLimitCents)}</span>
                    <span>日限额: {fmtCents(ch.dailyLimitCents)}</span>
                    {ch.supportedStoreIds.length > 0
                      ? <span>适用门店: {ch.supportedStoreIds.length}家</span>
                      : <span>适用: 全部门店</span>}
                    {ch.lastHealthCheck && (
                      <span>健康检查: {new Date(ch.lastHealthCheck).toLocaleTimeString('zh-CN')}</span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[120px]">
                  <p className="text-lg font-bold">{fmtCents(ch.todayAmountCents)}</p>
                  <p className="text-xs text-gray-400">今日 {ch.todayCount} 笔</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
