'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { FinanceRule, FinanceRulesSnapshotDelivery } from './rules-data'

type ViewMode = 'active' | 'inactive' | 'all'
type ModuleFilter = FinanceRule['module'] | 'ALL'

function formatMoney(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`
}

function moduleLabel(module: FinanceRule['module']): string {
  const labels: Record<FinanceRule['module'], string> = {
    RECONCILIATION: '对账',
    APPROVAL: '审批',
    AUDIT: '审计',
    SETTLEMENT: '结算',
  }
  return labels[module] ?? module
}

function moduleColor(module: FinanceRule['module']): string {
  const colors: Record<FinanceRule['module'], string> = {
    RECONCILIATION: '#3b82f6',
    APPROVAL: '#f59e0b',
    AUDIT: '#10b981',
    SETTLEMENT: '#8b5cf6',
  }
  return colors[module] ?? '#6b7280'
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const payload = await response.json()
  if (!payload.success) {
    throw new Error(payload.message || 'API error')
  }
  return payload.data as T
}

const initialCreateForm = {
  name: '',
  description: '',
  module: 'RECONCILIATION' as FinanceRule['module'],
  matchField: 'orderNo',
  toleranceCents: 0,
  autoApply: false,
  autoApplyThresholdCents: 0,
  enabled: true,
  priority: 10,
}

export default function FinanceRulesClient({
  snapshot,
}: {
  snapshot: FinanceRulesSnapshotDelivery
}) {
  const router = useRouter()
  const [isRefreshing, startRefresh] = useTransition()
  const [rules, setRules] = useState<FinanceRule[]>(snapshot.rules)
  const [viewMode, setViewMode] = useState<ViewMode>('active')
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<FinanceRule>>({})
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState(initialCreateForm)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const filteredRules = useMemo(
    () =>
      rules.filter((rule) => {
        if (viewMode === 'active' && !rule.enabled) return false
        if (viewMode === 'inactive' && rule.enabled) return false
        if (moduleFilter !== 'ALL' && rule.module !== moduleFilter) return false
        return true
      }),
    [moduleFilter, rules, viewMode]
  )

  const summary = useMemo(
    () => ({
      totalCount: rules.length,
      enabledCount: rules.filter((rule) => rule.enabled).length,
      disabledCount: rules.filter((rule) => !rule.enabled).length,
      abnormalCount: rules.filter((rule) => rule.enabled && rule.applyRate != null && rule.applyRate < 50).length,
      moduleCount: new Set(rules.map((rule) => rule.module)).size,
    }),
    [rules]
  )

  const handleSave = useCallback(
    async (ruleId: string) => {
      setSaving(true)
      setMutationError(null)
      try {
        await apiFetch(`/api/finance/rules/${ruleId}`, {
          method: 'PUT',
          body: JSON.stringify(editForm),
        })
        setRules((current) =>
          current.map((rule) =>
            rule.id === ruleId
              ? ({ ...rule, ...editForm, updatedAt: new Date().toISOString() } as FinanceRule)
              : rule
          )
        )
        setEditingId(null)
        setEditForm({})
        startRefresh(() => router.refresh())
      } catch (error) {
        setMutationError(error instanceof Error ? error.message : '保存失败')
      } finally {
        setSaving(false)
      }
    },
    [editForm, router, startRefresh]
  )

  const handleToggle = useCallback(
    async (ruleId: string) => {
      const rule = rules.find((item) => item.id === ruleId)
      if (!rule) return

      const enabled = !rule.enabled
      setMutationError(null)
      try {
        await apiFetch(`/api/finance/rules/${ruleId}`, {
          method: 'PATCH',
          body: JSON.stringify({ enabled }),
        })
        setRules((current) =>
          current.map((item) =>
            item.id === ruleId
              ? ({ ...item, enabled, updatedAt: new Date().toISOString() } as FinanceRule)
              : item
          )
        )
        startRefresh(() => router.refresh())
      } catch (error) {
        setMutationError(error instanceof Error ? error.message : '切换状态失败')
      }
    },
    [router, rules, startRefresh]
  )

  const handleCreate = useCallback(async () => {
    if (!createForm.name) {
      setMutationError('规则名称不能为空')
      return
    }

    setSaving(true)
    setMutationError(null)
    try {
      const data = await apiFetch<{ rule: FinanceRule }>('/api/finance/rules', {
        method: 'POST',
        body: JSON.stringify(createForm),
      })
      setRules((current) => [...current, data.rule])
      setShowCreateModal(false)
      setCreateForm(initialCreateForm)
      startRefresh(() => router.refresh())
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }, [createForm, router, startRefresh])

  const startEdit = useCallback((rule: FinanceRule) => {
    setEditingId(rule.id)
    setEditForm({ ...rule })
    setMutationError(null)
  }, [])

  const currentError = mutationError ?? snapshot.error ?? null
  const dataSourceLabel = snapshot.deliveryMode === 'api' ? '真实 API' : 'fallback'
  const isReviewable = snapshot.deliveryMode === 'api'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">财务规则管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            {`管理对账、审批、审计、结算等模块的自动规则配置。当前数据源：${dataSourceLabel}。`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={isRefreshing}
            className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            + 新建规则
          </button>
        </div>
      </div>

      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          snapshot.deliveryMode === 'api'
            ? 'border-green-200 bg-green-50 text-green-700'
            : 'border-yellow-200 bg-yellow-50 text-yellow-700'
        }`}
      >
        {`deliveryMode: ${snapshot.deliveryMode} · dataSourceLabel: ${dataSourceLabel}`}
        {!isReviewable ? ' · 该页面当前不可作为闭环复签证据' : ''}
      </div>

      {currentError && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">{currentError}</p>
        </div>
      )}

      <div className="grid grid-cols-5 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">总规则</p>
          <p className="mt-1 text-2xl font-bold">{summary.totalCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">已启用</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{summary.enabledCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">已禁用</p>
          <p className="mt-1 text-2xl font-bold text-gray-400">{summary.disabledCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">异常</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{summary.abnormalCount}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">模块</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{summary.moduleCount}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['active', 'inactive', 'all'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ active: '已启用', inactive: '已禁用', all: '全部' }[mode]}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 pb-2">
          <label className="text-xs text-gray-500" htmlFor="finance-rules-module-filter">
            模块筛选:
          </label>
          <select
            id="finance-rules-module-filter"
            value={moduleFilter}
            onChange={(event) => setModuleFilter(event.target.value as ModuleFilter)}
            className="rounded border border-gray-300 px-2 py-1 text-sm"
          >
            <option value="ALL">全部模块</option>
            <option value="RECONCILIATION">对账</option>
            <option value="APPROVAL">审批</option>
            <option value="AUDIT">审计</option>
            <option value="SETTLEMENT">结算</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="rounded-lg border bg-white p-12 text-center text-gray-400">
            <p className="mb-1 text-lg">暂无规则</p>
            <p className="text-sm">当前筛选条件下没有匹配的财务规则</p>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div key={rule.id} className="rounded-lg border bg-white p-5">
              {editingId === rule.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">规则名称</label>
                      <input
                        type="text"
                        value={editForm.name ?? ''}
                        onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">匹配字段</label>
                      <input
                        type="text"
                        value={editForm.matchField ?? ''}
                        onChange={(event) => setEditForm({ ...editForm, matchField: event.target.value })}
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">容差金额 (分)</label>
                      <input
                        type="number"
                        value={editForm.toleranceCents ?? 0}
                        onChange={(event) =>
                          setEditForm({ ...editForm, toleranceCents: Number(event.target.value) })
                        }
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">自动处理阈值 (分)</label>
                      <input
                        type="number"
                        value={editForm.autoApplyThresholdCents ?? 0}
                        onChange={(event) =>
                          setEditForm({ ...editForm, autoApplyThresholdCents: Number(event.target.value) })
                        }
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">优先级</label>
                      <input
                        type="number"
                        value={editForm.priority ?? 0}
                        onChange={(event) => setEditForm({ ...editForm, priority: Number(event.target.value) })}
                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.enabled ?? false}
                          onChange={(event) => setEditForm({ ...editForm, enabled: event.target.checked })}
                          className="rounded"
                        />
                        启用
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.autoApply ?? false}
                          onChange={(event) => setEditForm({ ...editForm, autoApply: event.target.checked })}
                          className="rounded"
                        />
                        自动处理
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
                    <textarea
                      value={editForm.description ?? ''}
                      onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSave(rule.id)}
                      disabled={saving}
                      className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null)
                        setEditForm({})
                      }}
                      className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: moduleColor(rule.module) }}
                        />
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                          {moduleLabel(rule.module)}
                        </span>
                        <h3 className="text-base font-medium text-gray-900">{rule.name}</h3>
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {rule.enabled ? '已启用' : '已禁用'}
                        </span>
                        {rule.autoApply && (
                          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            自动处理
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{rule.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                        <span>字段: {rule.matchField}</span>
                        <span>容差: {formatMoney(rule.toleranceCents)}</span>
                        <span>阈值: {formatMoney(rule.autoApplyThresholdCents)}</span>
                        <span>优先级: #{rule.priority}</span>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      {rule.applyRate != null && (
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatPercent(rule.applyRate)}</p>
                          <p className="text-xs text-gray-400">应用率</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggle(rule.id)}
                        className={`rounded px-3 py-1 text-xs font-medium ${
                          rule.enabled
                            ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {rule.enabled ? '禁用' : '启用'}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(rule)}
                        className="rounded bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                  {rule.lastAppliedCount != null && (
                    <div className="mt-3 border-t pt-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>上次应用: {rule.lastAppliedCount} 次</span>
                        <span>更新于 {new Date(rule.updatedAt).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-500">
        <p className="mb-1 font-medium text-gray-700">规则执行策略</p>
        <p>
          财务规则按模块分组，同一模块内按优先级顺序执行。匹配成功后不再尝试后续规则。超出容差范围的差异自动标记为&quot;待人工审核&quot;。
        </p>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-[520px] overflow-y-auto rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900">新建财务规则</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">规则名称 *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })}
                  placeholder="输入规则名称"
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">描述</label>
                <textarea
                  value={createForm.description}
                  onChange={(event) => setCreateForm({ ...createForm, description: event.target.value })}
                  placeholder="规则描述"
                  className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">模块</label>
                  <select
                    value={createForm.module}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        module: event.target.value as FinanceRule['module'],
                      })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  >
                    <option value="RECONCILIATION">对账</option>
                    <option value="APPROVAL">审批</option>
                    <option value="AUDIT">审计</option>
                    <option value="SETTLEMENT">结算</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">匹配字段</label>
                  <input
                    type="text"
                    value={createForm.matchField}
                    onChange={(event) => setCreateForm({ ...createForm, matchField: event.target.value })}
                    placeholder="orderNo"
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">容差 (分)</label>
                  <input
                    type="number"
                    value={createForm.toleranceCents}
                    onChange={(event) =>
                      setCreateForm({ ...createForm, toleranceCents: Number(event.target.value) })
                    }
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">优先级</label>
                  <input
                    type="number"
                    value={createForm.priority}
                    onChange={(event) => setCreateForm({ ...createForm, priority: Number(event.target.value) })}
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={createForm.enabled}
                    onChange={(event) => setCreateForm({ ...createForm, enabled: event.target.checked })}
                    className="rounded"
                  />
                  创建后启用
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={createForm.autoApply}
                    onChange={(event) => setCreateForm({ ...createForm, autoApply: event.target.checked })}
                    className="rounded"
                  />
                  自动处理
                </label>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={saving || !createForm.name}
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
