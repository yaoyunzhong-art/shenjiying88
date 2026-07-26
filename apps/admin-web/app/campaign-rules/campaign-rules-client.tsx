'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type {
  CampaignRule,
  CampaignRuleStatus,
  CampaignRulesSnapshotDelivery,
  CampaignRuleType,
} from './campaign-rules-data'
import {
  CAMPAIGN_RULE_STATUS_LABELS,
  CAMPAIGN_RULE_TYPE_LABELS,
} from './campaign-rules-data'

const TYPE_FILTERS: Array<'all' | CampaignRuleType> = [
  'all',
  'full-reduction',
  'discount',
  'gift',
  'coupon',
  'points',
]
const STATUS_FILTERS: Array<'all' | CampaignRuleStatus> = ['all', 'active', 'inactive', 'draft']

function badgeClass(status: CampaignRuleStatus): string {
  return {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-100 text-slate-600',
    draft: 'bg-amber-100 text-amber-700',
  }[status]
}

export default function CampaignRulesClient({
  snapshot,
}: {
  snapshot: CampaignRulesSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [rules, setRules] = useState<CampaignRule[]>(snapshot.rules)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | CampaignRuleType>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | CampaignRuleStatus>('all')
  const [showComposer, setShowComposer] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftType, setDraftType] = useState<CampaignRuleType>('coupon')
  const [localMessage, setLocalMessage] = useState<string | null>(null)

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (typeFilter !== 'all' && rule.campaignType !== typeFilter) return false
      if (statusFilter !== 'all' && rule.status !== statusFilter) return false
      if (!search.trim()) return true
      const keyword = search.trim().toLowerCase()
      return [rule.name, rule.description, rule.condition, rule.action, rule.owner].some((field) =>
        field.toLowerCase().includes(keyword)
      )
    })
  }, [rules, search, statusFilter, typeFilter])

  const stats = useMemo(
    () => ({
      total: rules.length,
      active: rules.filter((rule) => rule.status === 'active').length,
      draft: rules.filter((rule) => rule.status === 'draft').length,
      inactive: rules.filter((rule) => rule.status === 'inactive').length,
    }),
    [rules]
  )

  function handleToggle(ruleId: string) {
    setRules((current) =>
      current.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              status: rule.status === 'active' ? 'inactive' : 'active',
              updatedAt: new Date().toISOString(),
            }
          : rule
      )
    )
    setLocalMessage('已完成本地演练切换，真实写链路仍待后端规则中心接入。')
  }

  function handleClone(rule: CampaignRule) {
    const cloneId = `rule-${String(rules.length + 1).padStart(3, '0')}`
    setRules((current) => [
      {
        ...rule,
        id: cloneId,
        name: `${rule.name} · 演练副本`,
        status: 'draft',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        hitCount: 0,
      },
      ...current,
    ])
    setLocalMessage('已复制规则到本地快照副本，用于界面演练。')
  }

  function handleCreateDraft() {
    if (!draftName.trim()) {
      setLocalMessage('请先填写规则名称，再创建演练草稿。')
      return
    }

    const now = new Date().toISOString()
    setRules((current) => [
      {
        id: `rule-${String(current.length + 1).padStart(3, '0')}`,
        name: draftName.trim(),
        campaignType: draftType,
        condition: '待补充触发条件',
        action: '待补充执行动作',
        priority: current.length + 1,
        status: 'draft',
        owner: '本地演练草稿',
        description: '由客户端演练态创建，未写入真实规则中心。',
        createdAt: now,
        updatedAt: now,
        hitCount: 0,
      },
      ...current,
    ])
    setDraftName('')
    setDraftType('coupon')
    setShowComposer(false)
    setLocalMessage('演练草稿已创建；如需重新拉取首屏，请使用 router.refresh()。')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">活动规则管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            规则列表已迁移到 server wrapper + snapshot loader，客户端仅承载筛选、演练态动作与刷新入口。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新快照'}
          </button>
          <button
            type="button"
            onClick={() => setShowComposer((current) => !current)}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            {showComposer ? '收起草稿' : '新建演练规则'}
          </button>
        </div>
      </div>

      {localMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {localMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: '总规则', value: stats.total },
          { label: '启用中', value: stats.active },
          { label: '草稿', value: stats.draft },
          { label: '停用', value: stats.inactive },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">{card.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</div>
          </div>
        ))}
      </div>

      {showComposer && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="输入演练规则名称"
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={draftType}
              onChange={(event) => setDraftType(event.target.value as CampaignRuleType)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {TYPE_FILTERS.filter((item) => item !== 'all').map((item) => (
                <option key={item} value={item}>
                  {CAMPAIGN_RULE_TYPE_LABELS[item]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleCreateDraft}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              创建本地草稿
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            当前创建仅写入客户端内存，不影响首屏 snapshot 合同。
          </p>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索规则名称 / 条件 / 动作 / owner"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'all' | CampaignRuleType)}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {TYPE_FILTERS.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? '全部类型' : CAMPAIGN_RULE_TYPE_LABELS[item]}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatusFilter(item)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  statusFilter === item
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-600'
                }`}
              >
                {item === 'all' ? '全部状态' : CAMPAIGN_RULE_STATUS_LABELS[item]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">规则</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">条件 / 动作</th>
              <th className="px-4 py-3">命中</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  未找到匹配的活动规则
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => (
                <tr key={rule.id} className="align-top">
                  <td className="px-4 py-4">
                    <Link href={`/campaign-rules/${rule.id}`} className="font-medium text-slate-900 hover:text-blue-600">
                      {rule.name}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">owner: {rule.owner}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      updatedAt: {new Date(rule.updatedAt).toLocaleString('zh-CN')}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{CAMPAIGN_RULE_TYPE_LABELS[rule.campaignType]}</td>
                  <td className="px-4 py-4">
                    <div className="text-slate-800">{rule.condition}</div>
                    <div className="mt-1 text-xs text-slate-500">{rule.action}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    <div>{rule.hitCount.toLocaleString()} 次</div>
                    <div className="mt-1 text-xs text-slate-400">P{rule.priority}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${badgeClass(rule.status)}`}>
                      {CAMPAIGN_RULE_STATUS_LABELS[rule.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggle(rule.id)}
                        className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        {rule.status === 'active' ? '停用' : '启用'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClone(rule)}
                        className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        复制
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">演练态说明</p>
        <p className="mt-1">
          当前页面的新增、复制、启停仅作用于客户端内存；真实创建链路仍应由规则中心 API 接管。
        </p>
      </div>
    </div>
  )
}
