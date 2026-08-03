'use client'
import { useSnapshotRefresh } from '../components/use-snapshot-refresh'

import { useMemo, useState, useTransition } from 'react'
import type { PointsRule, PointsRulesSnapshotDelivery } from './points-rules-data'

type RuleTab = 'earn' | 'redeem' | 'bonus' | 'all'

function fmtCents(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function fmtNum(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return value.toLocaleString()
}

function triggerLabel(triggerType: PointsRule['triggerType']): string {
  const labels: Record<PointsRule['triggerType'], string> = {
    purchase: '消费',
    checkin: '签到',
    referral: '推荐',
    birthday: '生日',
    activity: '活动',
    manual: '手动',
  }
  return labels[triggerType]
}

function rateStr(rule: PointsRule): string {
  if (rule.earnPoints > 0) return `${fmtNum(rule.earnPoints)}分/次`
  if (rule.rateDenominator > 0) return `${fmtNum(rule.rateNumerator)}分/${fmtCents(rule.rateDenominator)}`
  return `${fmtNum(rule.rateNumerator)}分`
}

export default function PointsRulesClient({
  snapshot,
}: {
  snapshot: PointsRulesSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [tabView, setTabView] = useState<RuleTab>('earn')
  const rules = snapshot.rules
  const summary = snapshot.summary

  const statusStats = useMemo(
    () => ({
      total: rules.length,
      enabled: rules.filter((rule) => rule.enabled).length,
      disabled: rules.filter((rule) => !rule.enabled).length,
      expired: rules.filter((rule) => Boolean(rule.endDate) && new Date(rule.endDate!) < new Date()).length,
    }),
    [rules]
  )

  const filteredRules = useMemo(
    () =>
      rules.filter((rule) => {
        if (tabView === 'all') return true
        if (tabView === 'earn') return rule.category === 'earn'
        if (tabView === 'redeem') return rule.category === 'redeem' || rule.category === 'expire'
        if (tabView === 'bonus') return rule.category === 'bonus'
        return true
      }),
    [rules, tabView]
  )

  const dataSourceLabel = snapshot.deliveryMode === 'api' ? '真实 API' : 'fallback'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">积分规则</h1>
          <p className="mt-1 text-sm text-slate-500">会员积分赚取、消耗与活动奖励配置总览。</p>
        </div>
        <button
          type="button"
          onClick={() => handleRefresh()}
          disabled={isRefreshing}
          className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? '刷新中...' : '刷新'}
        </button>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          snapshot.deliveryMode === 'api'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-amber-200 bg-amber-50 text-amber-700'
        }`}
      >
        <div>{`deliveryMode: ${snapshot.deliveryMode} · dataSourceLabel: ${dataSourceLabel}`}</div>
        <div className="mt-1 text-xs">generatedAt: {snapshot.generatedAt}</div>
      </div>

      {snapshot.error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm text-amber-800">{snapshot.error}</p>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">规则总数</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.totalRules}</p>
          <p className="text-xs text-emerald-600">{summary.enabledRules} 条启用</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">月发放积分</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{fmtNum(summary.monthlyIssued)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">月消耗积分</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{fmtNum(summary.monthlyRedeemed)}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-500">平均赚取率</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{summary.avgEarnRate}x</p>
          <p className="text-xs text-slate-400">{fmtNum(summary.totalMembers)} 人拥有积分</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4" data-testid="status-stats">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-600">总规则</p>
          <p className="mt-1 text-2xl font-bold text-blue-900">{statusStats.total}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-600">已启用</p>
          <p className="mt-1 text-2xl font-bold text-green-900">{statusStats.enabled}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-600">已禁用</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{statusStats.disabled}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-600">已过期</p>
          <p className="mt-1 text-2xl font-bold text-rose-900">{statusStats.expired}</p>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex space-x-4">
          {(['earn', 'redeem', 'bonus', 'all'] as RuleTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabView(tab)}
              className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                tabView === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {{ earn: '赚取', redeem: '消耗', bonus: '奖励', all: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center">
            <p className="mb-1 text-lg text-slate-500">暂无规则</p>
            <p className="text-sm text-slate-400">当前分类下没有积分规则</p>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div key={rule.id} className="rounded-lg border bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-slate-900">{rule.name}</h3>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        rule.enabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rule.enabled ? '已启用' : '已禁用'}
                    </span>
                    <span className="rounded bg-slate-50 px-1.5 py-0.5 text-xs text-slate-400">
                      {triggerLabel(rule.triggerType)}
                    </span>
                    {rule.memberLevels.length > 0 ? (
                      <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-500">
                        {rule.memberLevels.join('/')}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{rule.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span className="font-medium text-slate-600">{rateStr(rule)}</span>
                    {rule.minAmountCents > 0 ? <span>最低{fmtCents(rule.minAmountCents)}</span> : null}
                    {rule.maxPerDay > 0 ? <span>每日上限{fmtNum(rule.maxPerDay)}</span> : null}
                    {rule.startDate ? (
                      <span>{`有效期: ${rule.startDate} ~ ${rule.endDate || '永久'}`}</span>
                    ) : null}
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
