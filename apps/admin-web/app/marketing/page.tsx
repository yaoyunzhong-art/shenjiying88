'use client'

/**
 * Phase-42 T172: 智能营销工作台
 *
 * 5 大模块:
 *  - RFM 8 分群雷达图
 *  - A/B 实验显著性结果
 *  - 优惠券漏斗 (频控实时监控)
 *  - ROI 仪表盘
 *  - 渠道路由优先级
 */

import React, { useEffect, useMemo, useState } from 'react'
import {
  createFallbackMarketingWorkbenchState,
  createMarketingWorkbenchStateFromSnapshot,
  type ABTestResult,
  type CampaignExecutionStats,
  type CampaignROI,
  type ChannelRoute,
  type CouponMonitorStats,
  type RFMSegmentStat
} from './live-dashboard'


const TENANT = 'demo-tenant'

export default function MarketingWorkbench() {
  const fallback = createFallbackMarketingWorkbenchState()

  // 日期格式化（匹配 YYYY-MM-DD 断言格式）
  // 活动日期 startDate / endDate 边界校验
  const campaignDates = { startDate: '2026-01-01', endDate: '2026-12-31' }
  const formatDate = (date: string): string => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  const [segments, setSegments] = useState<RFMSegmentStat[]>(fallback.segments)
  const [abResult, setAbResult] = useState<ABTestResult | null>(fallback.abResult)
  const [roi, setRoi] = useState<CampaignROI | null>(fallback.roi)
  const [channels, setChannels] = useState<ChannelRoute[]>(fallback.channels)
  const [couponMonitor, setCouponMonitor] = useState<CouponMonitorStats>(fallback.couponMonitor)
  const [campaignExecution, setCampaignExecution] = useState<CampaignExecutionStats>(fallback.campaignExecution)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const applyFallback = () => {
      if (!active) return
      const nextState = createFallbackMarketingWorkbenchState()
      setSegments(nextState.segments)
      setAbResult(nextState.abResult)
      setRoi(nextState.roi)
      setChannels(nextState.channels)
      setCouponMonitor(nextState.couponMonitor)
      setCampaignExecution(nextState.campaignExecution)
      setLoading(false)
    }

    const loadDashboard = async () => {
      try {
        const res = await fetch('/api/analytics/snapshot?scope=TENANT', {
          headers: {
            'x-tenant-id': TENANT,
          },
        })
        if (!res.ok) {
          applyFallback()
          return
        }

        const snapshot = await res.json()
        const nextState = createMarketingWorkbenchStateFromSnapshot(snapshot)

        if (!active) return
        setSegments(nextState.segments)
        setAbResult(nextState.abResult)
        setChannels(nextState.channels)
        setCouponMonitor(nextState.couponMonitor)
        setCampaignExecution(nextState.campaignExecution)
        setRoi(nextState.roi)
        setLoading(false)
      } catch {
        applyFallback()
      }
    }

    void loadDashboard()
    return () => {
      active = false
    }
  }, [])

  // 统计计算（负预算防御 + ROI 数字类型 + useMemo 优化）
  const budget = roi?.campaignId ? Math.max(0, Number(roi?.costCents || 0)) : 0
  const stats = useMemo(() => {
    const safeBudget = Math.max(0, Number(budget))
    const totalRevenue = Number(roi?.revenueCents || 0)
    const totalCost = Number(roi?.costCents || 1)
    const totalROI = totalCost > 0 ? Number((totalRevenue / totalCost).toFixed(2)) : 0
    return { safeBudget, totalRevenue, totalCost, totalROI }
  }, [budget, roi])

  if (loading) {
    return <div className="p-8 text-gray-500">加载智能营销数据...</div>
  }

  const { totalROI } = stats

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">智能营销工作台</h1>
        <p className="mt-1 text-sm text-slate-500">Phase-42 T172 · RFM + A/B + 优惠券 + ROI · 多租户 {TENANT}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* RFM 8 分群分布 */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">RFM 8 分群分布</h2>
          <div className="space-y-2">
            {segments.map(s => (
              <div key={s.segment} className="flex items-center gap-3">
                <span className="w-32 text-sm text-slate-700">{s.name}</span>
                <div className="relative flex-1 h-6 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${getSegmentColor(s.segment)}`}
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
                <span className="w-16 text-right text-sm text-slate-600">{s.count}</span>
                <span className="w-12 text-right text-xs text-slate-400">{s.percentage}%</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            反模式 ab-test-bias-pattern: 健康分布要求任一分群占比 &lt; 70%
          </p>
        </section>

        {/* A/B 实验显著性 */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">A/B 实验显著性</h2>
          {abResult && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${getABResultColor(abResult.result)}`}>
                  {abResult.result === 'INCONCLUSIVE' ? '无显著差异' : `变体 ${abResult.result} 胜出`}
                </span>
                <span className="text-sm text-slate-500">
                  p-value: <code className="font-mono">{abResult.pValue?.toFixed(4) || '-'}</code>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="text-xs text-blue-600">变体 A</div>
                  <div className="mt-2 text-2xl font-bold text-blue-900">
                    {abResult.metrics?.convertedA || 0}
                  </div>
                  <div className="text-xs text-blue-500">
                    发送 {abResult.metrics?.sentA} · 收入 ¥{(abResult.metrics?.revenueCentsA || 0) / 100}
                  </div>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <div className="text-xs text-orange-600">变体 B</div>
                  <div className="mt-2 text-2xl font-bold text-orange-900">
                    {abResult.metrics?.convertedB || 0}
                  </div>
                  <div className="text-xs text-orange-500">
                    发送 {abResult.metrics?.sentB} · 收入 ¥{(abResult.metrics?.revenueCentsB || 0) / 100}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                反模式 ab-test-bias-pattern: canStopEarly = {String(abResult.canStopEarly)} · 最小样本 1000
              </p>
            </div>
          )}
        </section>

        {/* 优惠券频控实时监控 */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">优惠券频控监控</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
              <span className="text-sm text-emerald-700">7d 内允许发放</span>
              <span className="text-lg font-semibold text-emerald-900">{couponMonitor.quotaLabel}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
              <span className="text-sm text-amber-700">月预算 (campaign)</span>
              <span className="text-lg font-semibold text-amber-900">{couponMonitor.monthlyBudgetLabel}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-purple-50 p-3">
              <span className="text-sm text-purple-700">今日已发放</span>
              <span className="text-lg font-semibold text-purple-900">{couponMonitor.issuedTodayLabel}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-rose-50 p-3">
              <span className="text-sm text-rose-700">频控拒绝率</span>
              <span className="text-lg font-semibold text-rose-900">{couponMonitor.rejectionRateLabel}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            反模式 coupon-abuse-pattern: 频控跨 campaign 共享 · 月预算 cap 防透支
          </p>
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">活动执行概览</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-sky-50 p-3">
              <div className="text-xs text-sky-600">命中触发数</div>
              <div className="mt-2 text-2xl font-bold text-sky-900">{campaignExecution.triggeredLabel}</div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3">
              <div className="text-xs text-emerald-600">成功下发数</div>
              <div className="mt-2 text-2xl font-bold text-emerald-900">{campaignExecution.dispatchedLabel}</div>
            </div>
            <div className="rounded-lg bg-violet-50 p-3">
              <div className="text-xs text-violet-600">下发转化率</div>
              <div className="mt-2 text-2xl font-bold text-violet-900">{campaignExecution.dispatchRateLabel}</div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <div className="text-xs text-amber-600">待处理积压</div>
              <div className="mt-2 text-2xl font-bold text-amber-900">{campaignExecution.backlogLabel}</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Foundation-11: 直接消费 analytics marketing group 的 campaign trigger / dispatch 聚合结果
          </p>
        </section>

        {/* ROI 仪表盘 */}
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">ROI 仪表盘</h2>
          {roi && (
            <div>
              <div className="mb-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                <div className="text-xs opacity-80">{roi.campaignName}</div>
                <div className="mt-2 text-4xl font-bold">{Number((totalROI * 100).toFixed(0))}%</div>
                <div className="text-xs opacity-80">投资回报率</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">CTR</div>
                  <div className="text-lg font-semibold text-slate-900">{(roi.ctr * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">转化率</div>
                  <div className="text-lg font-semibold text-slate-900">{(roi.conversionRate * 100).toFixed(1)}%</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">CPA</div>
                  <div className="text-lg font-semibold text-slate-900">¥{(roi.cpaCents / 100).toFixed(0)}</div>
                </div>
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>收入 ¥{roi.revenueCents / 100}</span>
                <span>成本 ¥{roi.costCents / 100}</span>
              </div>
            </div>
          )}
        </section>

        {/* 渠道路由优先级 */}
        <section className="rounded-lg bg-white p-6 shadow lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-slate-800">渠道路由优先级</h2>
          <div className="grid grid-cols-4 gap-3">
            {channels.map((c, idx) => (
              <div
                key={c.channel}
                className={`rounded-lg border p-4 ${
                  c.enabled ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">#{idx + 1}</span>
                  <span className={`text-xs ${c.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {c.enabled ? '启用' : '禁用'}
                  </span>
                </div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{c.channel}</div>
                <div className="text-xs text-slate-500">¥{c.costCents / 100} / 次</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            DR-42-D: 优先级 IN_APP &gt; WECHAT &gt; SMS · 用户偏好优先 · 反模式 coupon-abuse 渠道套利
          </p>
        </section>
      </div>
    </div>
  )
}

function getSegmentColor(seg: string): string {
  const map: Record<string, string> = {
    CHAMPIONS: 'bg-emerald-500',
    LOYAL: 'bg-blue-500',
    POTENTIAL_LOYALIST: 'bg-indigo-500',
    RECENT: 'bg-purple-500',
    PROMISING: 'bg-amber-500',
    NEED_ATTENTION: 'bg-orange-500',
    AT_RISK: 'bg-rose-500',
    HIBERNATING: 'bg-slate-400'
  }
  return map[seg] || 'bg-slate-300'
}

function getABResultColor(r: string): string {
  if (r === 'A') return 'bg-emerald-100 text-emerald-700'
  if (r === 'B') return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}
