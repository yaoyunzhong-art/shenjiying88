'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface Campaign {
  id: string
  name: string
  description: string
  type: 'promotion' | 'new-member' | 'referral' | 'seasonal' | 'clearance'
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: string
  endDate: string
  budgetCents: number
  spentCents: number
  targetMetric: string          // 'revenue' | 'new-users' | 'redemption' | 'traffic'
  targetValue: number
  currentValue: number
  channels: string[]            // ['mini-app', 'wechat', 'douyin', 'sms', 'in-store']
  tenantId: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

type CampaignTab = 'active' | 'draft' | 'completed' | 'all'

// ── 工具 ──

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function fmtPercent(value: number, target: number): string {
  if (target === 0) return '0%'
  return `${((value / target) * 100).toFixed(1)}%`
}

function statusLabel(status: Campaign['status']): string {
  const map: Record<string, string> = {
    draft: '草稿', active: '进行中', paused: '已暂停',
    completed: '已完成', cancelled: '已取消',
  }
  return map[status] ?? status
}

function statusColor(status: Campaign['status']): string {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

function typeLabel(type: Campaign['type']): string {
  const map: Record<string, string> = {
    promotion: '促销活动', 'new-member': '拉新活动',
    referral: '推荐有礼', seasonal: '季节活动', clearance: '清仓活动',
  }
  return map[type] ?? type
}

const channelLabels: Record<string, string> = {
  'mini-app': '小程序', wechat: '公众号', douyin: '抖音',
  sms: '短信', 'in-store': '门店',
}

// ── 默认样本数据 ──

const defaultCampaigns: Campaign[] = [
  {
    id: 'cmp-1', name: '夏日狂欢季', description: '暑期全场8折优惠',
    type: 'promotion', status: 'active',
    startDate: '2026-07-01', endDate: '2026-08-31',
    budgetCents: 5000000, spentCents: 1280000,
    targetMetric: 'revenue', targetValue: 30000000, currentValue: 8500000,
    channels: ['mini-app', 'wechat', 'in-store'],
    tenantId: 'tenant-1', createdBy: 'admin',
    createdAt: '2026-06-25T00:00:00Z', updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'cmp-2', name: '新会员专享', description: '注册即送100积分+满减券',
    type: 'new-member', status: 'active',
    startDate: '2026-07-01', endDate: '2026-12-31',
    budgetCents: 2000000, spentCents: 450000,
    targetMetric: 'new-users', targetValue: 5000, currentValue: 1820,
    channels: ['mini-app', 'wechat', 'douyin'],
    tenantId: 'tenant-1', createdBy: 'admin',
    createdAt: '2026-06-20T00:00:00Z', updatedAt: '2026-07-14T14:00:00Z',
  },
  {
    id: 'cmp-3', name: '推荐有礼V3', description: '老带新双方得50元券',
    type: 'referral', status: 'active',
    startDate: '2026-06-01', endDate: '2026-09-30',
    budgetCents: 1000000, spentCents: 320000,
    targetMetric: 'redemption', targetValue: 2000, currentValue: 876,
    channels: ['mini-app', 'sms'],
    tenantId: 'tenant-1', createdBy: 'market',
    createdAt: '2026-05-28T00:00:00Z', updatedAt: '2026-07-13T09:00:00Z',
  },
  {
    id: 'cmp-4', name: '端午特惠', description: '端午3天限时折扣',
    type: 'seasonal', status: 'completed',
    startDate: '2026-06-08', endDate: '2026-06-10',
    budgetCents: 800000, spentCents: 760000,
    targetMetric: 'revenue', targetValue: 5000000, currentValue: 4820000,
    channels: ['mini-app', 'in-store', 'wechat'],
    tenantId: 'tenant-1', createdBy: 'admin',
    createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-11T10:00:00Z',
  },
  {
    id: 'cmp-5', name: '换季清仓', description: '春季商品5折出清',
    type: 'clearance', status: 'draft',
    startDate: '2026-09-01', endDate: '2026-09-15',
    budgetCents: 3000000, spentCents: 0,
    targetMetric: 'traffic', targetValue: 10000, currentValue: 0,
    channels: ['in-store'],
    tenantId: 'tenant-1', createdBy: 'market',
    createdAt: '2026-07-10T00:00:00Z', updatedAt: '2026-07-10T00:00:00Z',
  },
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

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<CampaignTab>('active')

  const loadCampaigns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ campaigns: Campaign[] }>('/api/brand/campaigns')
      setCampaigns(data.campaigns)
    } catch {
      setCampaigns(defaultCampaigns)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCampaigns() }, [loadCampaigns])

  const filtered = campaigns.filter(c => {
    if (tabView === 'all') return true
    if (tabView === 'active') return c.status === 'active' || c.status === 'paused'
    if (tabView === 'draft') return c.status === 'draft'
    if (tabView === 'completed') return c.status === 'completed'
    return true
  })

  // 统计
  const totalBudget = campaigns.reduce((s, c) => s + c.budgetCents, 0)
  const totalSpent = campaigns.reduce((s, c) => s + c.spentCents, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载营销活动...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">营销活动</h1>
          <p className="text-sm text-gray-500 mt-1">品牌活动管理与投放效果追踪</p>
        </div>
        <button onClick={loadCampaigns} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
          刷新
        </button>
      </div>

      {/* 错误 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览统计 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">活动总数</p>
          <p className="text-2xl font-bold mt-1">{campaigns.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">进行中</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {campaigns.filter(c => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总预算</p>
          <p className="text-2xl font-bold mt-1">{fmtCents(totalBudget)}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已花费</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{fmtCents(totalSpent)}</p>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['active', 'draft', 'completed', 'all'] as CampaignTab[]).map(tab => (
            <button key={tab} onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {{ active: '进行中', draft: '草稿', completed: '已完成', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      {/* 活动列表 */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center">
            <div className="text-gray-300 mb-3">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无活动</p>
            <p className="text-sm text-gray-400">当前筛选条件下没有营销活动</p>
          </div>
        ) : (
          filtered.map(campaign => (
            <div key={campaign.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium text-gray-900">{campaign.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor(campaign.status)}`}>
                      {statusLabel(campaign.status)}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5 py-0.5">
                      {typeLabel(campaign.type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{campaign.startDate} ~ {campaign.endDate}</span>
                    <span>预算: {fmtCents(campaign.budgetCents)}</span>
                    <span>已花费: {fmtCents(campaign.spentCents)}</span>
                    <span>渠道: {campaign.channels.map(ch => channelLabels[ch] ?? ch).join('/')}</span>
                  </div>
                </div>
                <div className="text-right ml-4 min-w-[120px]">
                  <p className="text-xs text-gray-400">{campaign.targetMetric === 'revenue' ? '营收' :
                    campaign.targetMetric === 'new-users' ? '新用户' :
                    campaign.targetMetric === 'redemption' ? '核销数' : '流量'}
                  </p>
                  <p className="text-lg font-bold">{fmtPercent(campaign.currentValue, campaign.targetValue)}</p>
                  <p className="text-xs text-gray-400">
                    {campaign.currentValue}/{campaign.targetValue}
                  </p>
                </div>
              </div>
              {/* 进度条 */}
              {campaign.targetValue > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min((campaign.currentValue / campaign.targetValue) * 100, 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
