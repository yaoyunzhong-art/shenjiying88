'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface PointsRule {
  id: string
  name: string
  description: string
  category: 'earn' | 'redeem' | 'expire' | 'bonus'     // 赚取/消耗/过期/奖励
  triggerType: string                                   // 'purchase' | 'checkin' | 'referral' | 'birthday' | 'activity' | 'manual'
  rateNumerator: number                                 // 分子: 消费 N 元得 M 分
  rateDenominator: number                               // 分母
  earnPoints: number                                     // 固定赚取积分(替代rate时)
  minAmountCents: number                                // 最低消费金额
  maxPerDay: number                                     // 每日上限(0=无限制)
  memberLevels: string[]                                // 适用会员等级(空=全部)
  enabled: boolean
  startDate?: string
  endDate?: string
  priority: number
  createdAt: string
  updatedAt: string
}

interface PointsSummary {
  totalRules: number
  enabledRules: number
  avgEarnRate: number            // 平均赚取率(积分/元)
  monthlyIssued: number
  monthlyRedeemed: number
  totalMembers: number
}

type RuleTab = 'earn' | 'redeem' | 'bonus' | 'all'

// ── 工具 ──

function fmtCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function fmtNum(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return n.toLocaleString()
}

function triggerLabel(t: string): string {
  const map: Record<string, string> = { purchase: '消费', checkin: '签到', referral: '推荐', birthday: '生日', activity: '活动', manual: '手动' }
  return map[t] ?? t
}

function categoryLabel(c: string): string {
  const map: Record<string, string> = { earn: '赚取', redeem: '消耗', expire: '过期', bonus: '奖励' }
  return map[c] ?? c
}

function rateStr(rule: PointsRule): string {
  if (rule.earnPoints > 0) return `${fmtNum(rule.earnPoints)}分/次`
  if (rule.rateDenominator > 0) return `${fmtNum(rule.rateNumerator)}分/${fmtCents(rule.rateDenominator)}`
  return `${fmtNum(rule.rateNumerator)}分`
}

// ── 默认样本数据 ──

const defaultRules: PointsRule[] = [
  { id: 'pr-1', name: '消费积分', description: '每消费¥1得1积分', category: 'earn', triggerType: 'purchase', rateNumerator: 1, rateDenominator: 100, earnPoints: 0, minAmountCents: 0, maxPerDay: 0, memberLevels: [], enabled: true, priority: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
  { id: 'pr-2', name: '签到积分', description: '每日签到得10积分', category: 'earn', triggerType: 'checkin', rateNumerator: 10, rateDenominator: 0, earnPoints: 10, minAmountCents: 0, maxPerDay: 10, memberLevels: [], enabled: true, priority: 2, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
  { id: 'pr-3', name: '推荐奖励', description: '推荐好友注册双方各得200积分', category: 'bonus', triggerType: 'referral', rateNumerator: 200, rateDenominator: 0, earnPoints: 200, minAmountCents: 0, maxPerDay: 1000, memberLevels: ['gold', 'platinum'], enabled: true, priority: 3, createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z' },
  { id: 'pr-4', name: '生日倍率', description: '生日当天消费积3倍', category: 'bonus', triggerType: 'birthday', rateNumerator: 3, rateDenominator: 0, earnPoints: 0, minAmountCents: 0, maxPerDay: 0, memberLevels: ['platinum', 'diamond'], enabled: true, priority: 4, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-10T00:00:00Z' },
  { id: 'pr-5', name: '积分兑换', description: '100积分=¥1兑换券', category: 'redeem', triggerType: 'purchase', rateNumerator: 100, rateDenominator: 100, earnPoints: 0, minAmountCents: 500, maxPerDay: 5000, memberLevels: [], enabled: true, priority: 10, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
  { id: 'pr-6', name: '老带新活动', description: '7月拉新季，邀请好友得500积分', category: 'bonus', triggerType: 'activity', rateNumerator: 500, rateDenominator: 0, earnPoints: 500, minAmountCents: 0, maxPerDay: 2000, memberLevels: [], enabled: true, startDate: '2026-07-01', endDate: '2026-07-31', priority: 5, createdAt: '2026-06-25T00:00:00Z', updatedAt: '2026-06-25T00:00:00Z' },
]

const defaultSummary: PointsSummary = {
  totalRules: 12, enabledRules: 10, avgEarnRate: 1.2,
  monthlyIssued: 320000, monthlyRedeemed: 185000, totalMembers: 45600,
}

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

export default function PointsRulesPage() {
  const [rules, setRules] = useState<PointsRule[]>([])
  const [summary, setSummary] = useState<PointsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<RuleTab>('earn')

  // ── 规则状态统计 ──
  const statusStats = {
    total: rules.length,
    enabled: rules.filter(r => r.enabled).length,
    disabled: rules.filter(r => !r.enabled).length,
    expired: rules.filter(r => !!r.endDate && new Date(r.endDate) < new Date()).length,
  }

  const loadRules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [rulesData, summaryData] = await Promise.all([
        apiFetch<{ rules: PointsRule[] }>('/api/member/points-rules'),
        apiFetch<PointsSummary>('/api/member/points-summary'),
      ])
      setRules(rulesData.rules)
      setSummary(summaryData)
    } catch {
      setRules(defaultRules)
      setSummary(defaultSummary)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRules() }, [loadRules])

  const filtered = rules.filter(r => {
    if (tabView === 'all') return true
    if (tabView === 'earn') return r.category === 'earn'
    if (tabView === 'redeem') return r.category === 'redeem' || r.category === 'expire'
    if (tabView === 'bonus') return r.category === 'bonus'
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载积分规则...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">积分规则</h1>
          <p className="text-sm text-gray-500 mt-1">会员积分赚取/消耗规则 · 活动奖励配置</p>
        </div>
        <button onClick={loadRules} className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">刷新</button>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览 */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">规则总数</p>
            <p className="text-2xl font-bold mt-1">{summary.totalRules}</p>
            <p className="text-xs text-green-600">{summary.enabledRules} 条启用</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">月发放积分</p>
            <p className="text-2xl font-bold mt-1">{fmtNum(summary.monthlyIssued)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-sm text-gray-500">月消耗积分</p>
            <p className="text-2xl font-bold mt-1">{fmtNum(summary.monthlyRedeemed)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">

      {/* 规则状态统计条 */}
      <div className="grid grid-cols-4 gap-4" data-testid="status-stats">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">总规则</p>
          <p className="text-2xl font-bold mt-1 text-blue-900">{statusStats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">已启用</p>
          <p className="text-2xl font-bold mt-1 text-green-900">{statusStats.enabled}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 font-medium">已禁用</p>
          <p className="text-2xl font-bold mt-1 text-gray-900">{statusStats.disabled}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">已过期</p>
          <p className="text-2xl font-bold mt-1 text-red-900">{statusStats.expired}</p>
        </div>
      </div>


            <p className="text-sm text-gray-500">平均赚取率</p>
            <p className="text-2xl font-bold mt-1">{summary.avgEarnRate}x</p>
            <p className="text-xs text-gray-400">{fmtNum(summary.totalMembers)} 人拥有积分</p>
          </div>
        </div>
      )}

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['earn', 'redeem', 'bonus', 'all'] as RuleTab[]).map(tab => (
            <button key={tab} onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {{ earn: '赚取', redeem: '消耗', bonus: '奖励', all: '全部' }[tab]}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 mb-1">暂无规则</p>
            <p className="text-sm text-gray-400">当前分类下没有积分规则</p>
          </div>
        ) : (
          filtered.map(rule => (
            <div key={rule.id} className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-medium text-gray-900">{rule.name}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>{rule.enabled ? '已启用' : '已禁用'}</span>
                    <span className="text-xs text-gray-400 bg-gray-50 rounded px-1.5">{triggerLabel(rule.triggerType)}</span>
                    {rule.memberLevels.length > 0 && (
                      <span className="text-xs text-purple-500 bg-purple-50 rounded px-1.5">
                        {rule.memberLevels.join('/')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                    <span className="font-medium text-gray-600">{rateStr(rule)}</span>
                    {rule.minAmountCents > 0 && <span>最低{fmtCents(rule.minAmountCents)}</span>}
                    {rule.maxPerDay > 0 && <span>每日上限{fmtNum(rule.maxPerDay)}</span>}
                    {rule.startDate && <span>有效期: {rule.startDate} ~ {rule.endDate || '永久'}</span>}
                    <span>优先级 #{rule.priority}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
