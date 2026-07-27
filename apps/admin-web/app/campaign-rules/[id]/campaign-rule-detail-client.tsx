'use client'
import { useSnapshotRefresh } from '../../components/use-snapshot-refresh'

import Link from 'next/link'
import { useState } from 'react'
import type { CampaignRuleDetailSnapshotDelivery } from './campaign-rule-detail-data'
import { formatBudget } from './campaign-rule-detail-data'

export default function CampaignRuleDetailClient({
  snapshot,
}: {
  snapshot: CampaignRuleDetailSnapshotDelivery
}) {
    const { isRefreshing, handleRefresh } = useSnapshotRefresh()
  const [status, setStatus] = useState(snapshot.rule.status)
  const [message, setMessage] = useState<string | null>(null)

  function handlePromote() {
    setStatus((current) => (current === 'active' ? 'inactive' : 'active'))
    setMessage('当前操作仅为客户端演练，未写入真实营销规则中心。')
  }

  function handleArchive() {
    setStatus('archived')
    setMessage('已切换为归档演练态；如需恢复，请重新刷新服务端快照。')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{snapshot.rule.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {snapshot.rule.campaignType} · owner {snapshot.rule.owner} · audience {snapshot.rule.audience}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={isRefreshing}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
          <button
            type="button"
            onClick={handlePromote}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            {status === 'active' ? '停用演练' : '启用演练'}
          </button>
          <button
            type="button"
            onClick={handleArchive}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            归档
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: '当前状态', value: status },
          { label: '预算', value: formatBudget(snapshot.rule.budgetCents) },
          { label: '触发次数', value: snapshot.rule.executionCount.toLocaleString() },
          { label: '转化率', value: `${snapshot.rule.conversionRate}%` },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{card.label}</div>
            <div className="mt-2 text-xl font-semibold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">规则概览</h2>
            <dl className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">触发窗口</dt>
                <dd className="mt-1 text-sm text-slate-800">{snapshot.rule.triggerWindow}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">最近更新时间</dt>
                <dd className="mt-1 text-sm text-slate-800">
                  {new Date(snapshot.rule.updatedAt).toLocaleString('zh-CN')}
                </dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-slate-500">触发条件</dt>
                <dd className="mt-1 text-sm text-slate-800">{snapshot.rule.condition}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-slate-500">执行动作</dt>
                <dd className="mt-1 text-sm text-slate-800">{snapshot.rule.action}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-slate-500">备注</dt>
                <dd className="mt-1 text-sm text-slate-600">{snapshot.rule.note}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">防呆约束</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {snapshot.rule.guardrails.map((item) => (
                <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">近期信号</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {snapshot.rule.recentSignals.map((item) => (
                <li key={item} className="rounded-lg border border-slate-200 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">时间线</h2>
            <div className="mt-4 space-y-3">
              {snapshot.rule.timeline.map((item) => (
                <div key={`${item.time}-${item.label}`} className="rounded-lg bg-slate-50 px-3 py-3">
                  <div className="text-xs text-slate-500">{new Date(item.time).toLocaleString('zh-CN')}</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{item.label}</div>
                  <div className="mt-1 text-sm text-slate-600">{item.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/campaign-rules"
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              返回规则列表
            </Link>
            <Link
              href={`/campaign-rules/${snapshot.rule.id}`}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              当前详情链接
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
