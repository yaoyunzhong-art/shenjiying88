'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface Alliance {
  id: string
  name: string
  partnerName: string           // 联名合作方名称
  logo?: string
  description: string
  type: 'brand' | 'ip' | 'cross-industry' | 'member'   // 品牌/IP/跨界/会员
  status: 'active' | 'expired' | 'negotiating' | 'terminated'
  startDate: string
  endDate: string
  couponCount: number
  redeemedCount: number
  costCents: number             // 联名成本
  revenueCents: number          // 联名营收
  newMemberCount: number        // 拉新数
  contactPerson: string
  contactPhone: string
  contractFile?: string
  tenantId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

type AllianceTab = 'all' | 'active' | 'expired' | 'terminated'

// ── 工具 ──

function fmtCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function fmtShort(cents: number): string {
  const wan = cents / 10000
  if (wan >= 100) return `¥${(wan / 100).toFixed(1)}亿`
  if (wan >= 1) return `¥${wan.toFixed(1)}万`
  return fmtCents(cents)
}

function allianceTypeLabel(t: string): string {
  const map: Record<string, string> = { brand: '品牌联名', ip: 'IP联名', 'cross-industry': '跨界联名', member: '会员联名' }
  return map[t] ?? t
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { active: '进行中', expired: '已结束', negotiating: '洽谈中', terminated: '已终止' }
  return map[s] ?? s
}

function statusColor(s: string): string {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700', expired: 'bg-gray-100 text-gray-500',
    negotiating: 'bg-yellow-100 text-yellow-700', terminated: 'bg-red-100 text-red-600',
  }
  return map[s] ?? 'bg-gray-100 text-gray-600'
}

// ── 默认样本数据 ──

const defaultAlliances: Alliance[] = [
  { id: 'al-1', name: '喜茶联名卡', partnerName: '喜茶', description: '喜茶×门店联名会员卡，享饮品8折', type: 'cross-industry', status: 'active', startDate: '2026-06-01', endDate: '2026-09-30', couponCount: 5000, redeemedCount: 1823, costCents: 5000000, revenueCents: 18000000, newMemberCount: 2340, contactPerson: '李经理', contactPhone: '138****5678', tenantId: 't1', createdBy: 'admin', createdAt: '2026-05-20T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z' },
  { id: 'al-2', name: '泡泡玛特IP联名', partnerName: '泡泡玛特', description: 'LABUBU主题联名盲盒+积分', type: 'ip', status: 'active', startDate: '2026-07-01', endDate: '2026-10-31', couponCount: 3000, redeemedCount: 892, costCents: 8000000, revenueCents: 25000000, newMemberCount: 1560, contactPerson: '王总监', contactPhone: '139****9012', tenantId: 't1', createdBy: 'admin', createdAt: '2026-06-10T00:00:00Z', updatedAt: '2026-07-14T14:00:00Z' },
  { id: 'al-3', name: '星巴克联名活动', partnerName: '星巴克', description: '消费满¥188赠星巴克饮品券', type: 'brand', status: 'expired', startDate: '2026-03-01', endDate: '2026-05-31', couponCount: 8000, redeemedCount: 6754, costCents: 12000000, revenueCents: 58000000, newMemberCount: 4890, contactPerson: '陈主管', contactPhone: '136****3456', tenantId: 't1', createdBy: 'admin', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
  { id: 'al-4', name: '支付宝渠道联名', partnerName: '支付宝', description: '支付宝会员专享到店优惠', type: 'member', status: 'active', startDate: '2026-04-01', endDate: '2026-12-31', couponCount: 10000, redeemedCount: 4210, costCents: 3000000, revenueCents: 12000000, newMemberCount: 3200, contactPerson: '赵经理', contactPhone: '137****7890', tenantId: 't1', createdBy: 'admin', createdAt: '2026-03-20T00:00:00Z', updatedAt: '2026-07-12T09:00:00Z' },
  { id: 'al-5', name: '美团渠道合作', partnerName: '美团', description: '美团外卖会员联合促销，合作终止', type: 'brand', status: 'terminated', startDate: '2026-01-01', endDate: '2026-03-31', couponCount: 6000, redeemedCount: 5120, costCents: 4000000, revenueCents: 15000000, newMemberCount: 1800, contactPerson: '刘经理', contactPhone: '135****1234', tenantId: 't1', createdBy: 'admin', createdAt: '2025-12-15T00:00:00Z', updatedAt: '2026-04-01T10:00:00Z' },
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

export default function AlliancesPage() {
  const [alliances, setAlliances] = useState<Alliance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<AllianceTab>('active')

  const loadAlliances = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ alliances: Alliance[] }>('/api/brand/alliances')
      setAlliances(data.alliances)
    } catch {
      setAlliances(defaultAlliances)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAlliances() }, [loadAlliances])

  const filtered = alliances.filter(a => {
    if (tabView === 'all') return true
    if (tabView === 'active') return a.status === 'active' || a.status === 'negotiating'
    if (tabView === 'expired') return a.status === 'expired'
    if (tabView === 'terminated') return a.status === 'terminated'
    return true
  })

  const totalRevenue = alliances.reduce((s, a) => s + a.revenueCents, 0)
  const totalCost = alliances.reduce((s, a) => s + a.costCents, 0)
  const totalNewMembers = alliances.reduce((s, a) => s + a.newMemberCount, 0)
  const roas = totalCost > 0 ? totalRevenue / totalCost : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载联名记录...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">联名券管理</h1>
          <p className="text-sm text-gray-500 mt-1">品牌/IP/跨界联名活动管理与ROI分析</p>
        </div>
        <button onClick={loadAlliances} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">联名活动</p>
          <p className="text-2xl font-bold mt-1">{alliances.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总营收</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{fmtShort(totalRevenue)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总成本</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{fmtShort(totalCost)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">ROI</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{roas.toFixed(1)}x</p>
          <p className="text-xs text-gray-400">拉新 {totalNewMembers} 人</p>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['all', 'active', 'expired', 'terminated'] as AllianceTab[]).map(tab => (
            <button key={tab} onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {{ all: '全部', active: '生效中', expired: '已到期', terminated: '已终止' }[tab]}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无联名活动</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有联名活动</p>
          </div>
        ) : (
          filtered.map(al => (
            <div key={al.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900">{al.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(al.status)}`}>
                      {statusLabel(al.status)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{allianceTypeLabel(al.type)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{al.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span>合作方: {al.partnerName}</span>
                    <span>有效期: {al.startDate} ~ {al.endDate}</span>
                    <span>券发放: {al.couponCount}</span>
                    <span>核销: {al.redeemedCount}</span>
                    <span>核销率: {al.couponCount > 0 ? ((al.redeemedCount / al.couponCount) * 100).toFixed(1) : '0'}%</span>
                    <span>拉新: {al.newMemberCount}人</span>
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[140px]">
                  <p className="text-lg font-bold text-green-600">{fmtShort(al.revenueCents)}</p>
                  <p className="text-xs text-gray-400">营收 / {fmtShort(al.costCents)} 成本</p>
                  {al.costCents > 0 && (
                    <p className="text-xs text-blue-600 mt-0.5">ROI {(al.revenueCents / al.costCents).toFixed(1)}x</p>
                  )}
                </div>
              </div>
              {/* 进度条（核销率） */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>核销进度</span>
                  <span>{al.couponCount > 0 ? ((al.redeemedCount / al.couponCount) * 100).toFixed(1) : '0'}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((al.redeemedCount / Math.max(al.couponCount, 1)) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
