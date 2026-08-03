'use client'
import { useSnapshotRefresh } from '../../../components/use-snapshot-refresh'

import { useCallback, useMemo, useState, useTransition } from 'react'
import type { ReconciliationRule, ReconciliationRulesSnapshotDelivery } from './rules-data'

type RuleTab = 'active' | 'inactive' | 'settings'

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function fmtRate(rate: number): string {
  return `${rate.toFixed(1)}%`
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

export default function ReconciliationRulesClient({
  snapshot,
}: {
  snapshot: ReconciliationRulesSnapshotDelivery
}) {
    const [tabView, setTabView] = useState<RuleTab>('active')
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ReconciliationRule>>({})
  const [saving, setSaving] = useState(false)
  const { isRefreshing, handleRefresh } = useSnapshotRefresh();
  const [rules, setRules] = useState<ReconciliationRule[]>(snapshot.rules)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const filteredRules = useMemo(
    () => rules.filter((rule) => (tabView === 'active' ? rule.enabled : tabView === 'inactive' ? !rule.enabled : true)),
    [rules, tabView]
  )

  const summary = useMemo(
    () => ({
      totalCount: rules.length,
      enabledCount: rules.filter((rule) => rule.enabled).length,
      disabledCount: rules.filter((rule) => !rule.enabled).length,
      abnormalCount: rules.filter((rule) => rule.enabled && rule.matchRate != null && rule.matchRate < 50).length,
    }),
    [rules]
  )

  const handleSave = useCallback(
    async (ruleId: string) => {
      setSaving(true)
      setMutationError(null)
      try {
        await apiFetch(`/api/finance/reconciliation/rules/${ruleId}`, {
          method: 'PUT',
          body: JSON.stringify(editForm),
        })
        setRules((current) =>
          current.map((rule) =>
            rule.id === ruleId ? { ...rule, ...editForm, updatedAt: new Date().toISOString() } as ReconciliationRule : rule
          )
        )
        setEditingRule(null)
        setEditForm({})
        handleRefresh()
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
        await apiFetch(`/api/finance/reconciliation/rules/${ruleId}`, {
          method: 'PATCH',
          body: JSON.stringify({ enabled }),
        })
        setRules((current) =>
          current.map((item) =>
            item.id === ruleId ? { ...item, enabled, updatedAt: new Date().toISOString() } as ReconciliationRule : item
          )
        )
        handleRefresh()
      } catch (error) {
        setMutationError(error instanceof Error ? error.message : '切换状态失败')
      }
    },
    [router, rules, startRefresh]
  )

  const startEdit = useCallback((rule: ReconciliationRule) => {
    setEditingRule(rule.id)
    setEditForm({ ...rule })
  }, [])

  const currentError = mutationError ?? snapshot.error ?? null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">对账规则配置</h1>
          <p className="text-sm text-gray-500 mt-1">管理匹配规则、容差阈值和自动处理策略。</p>
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

      {currentError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{currentError}</p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总规则</p>
          <p className="text-2xl font-bold mt-1">{summary.totalCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已启用</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{summary.enabledCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已禁用</p>
          <p className="text-2xl font-bold mt-1 text-gray-400">{summary.disabledCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">异常</p>
          <p className="text-2xl font-bold mt-1 text-orange-600">{summary.abnormalCount}</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['active', 'inactive', 'settings'] as RuleTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ active: '已启用', inactive: '已禁用', settings: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center text-gray-400">
            <p className="text-lg mb-1">暂无规则</p>
            <p className="text-sm">当前分类下没有对账规则</p>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div key={rule.id} className="bg-white border rounded-lg p-5">
              {editingRule === rule.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">匹配字段</label>
                      <select
                        value={editForm.matchKey || ''}
                        onChange={(event) => setEditForm({ ...editForm, matchKey: event.target.value })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      >
                        <option value="orderNo">订单号</option>
                        <option value="transactionId">交易ID</option>
                        <option value="amount+date">金额+日期</option>
                        <option value="note+amount">备注+金额</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">容差金额 (分)</label>
                      <input
                        type="number"
                        value={editForm.toleranceCents ?? 0}
                        onChange={(event) => setEditForm({ ...editForm, toleranceCents: Number(event.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">自动处理阈值 (分)</label>
                      <input
                        type="number"
                        value={editForm.autoResolveThresholdCents ?? 0}
                        onChange={(event) =>
                          setEditForm({ ...editForm, autoResolveThresholdCents: Number(event.target.value) })
                        }
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                      <input
                        type="number"
                        value={editForm.priority ?? 0}
                        onChange={(event) => setEditForm({ ...editForm, priority: Number(event.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
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
                          checked={editForm.autoResolve ?? false}
                          onChange={(event) => setEditForm({ ...editForm, autoResolve: event.target.checked })}
                          className="rounded"
                        />
                        自动处理
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={editForm.description || ''}
                      onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                      className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSave(rule.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRule(null)
                        setEditForm({})
                      }}
                      className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
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
                        <h3 className="text-base font-medium text-gray-900">{rule.name}</h3>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {rule.enabled ? '已启用' : '已禁用'}
                        </span>
                        {rule.autoResolve && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            自动处理
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>匹配键: {rule.matchKey}</span>
                        <span>容差: {fmtCents(rule.toleranceCents)}</span>
                        <span>阈值: {fmtCents(rule.autoResolveThresholdCents)}</span>
                        <span>优先级: #{rule.priority}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {rule.matchRate != null && (
                        <div className="text-right">
                          <p className="text-lg font-bold">{fmtRate(rule.matchRate)}</p>
                          <p className="text-xs text-gray-400">匹配率</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggle(rule.id)}
                        className={`px-3 py-1 rounded text-xs font-medium ${
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
                        className="px-3 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        编辑
                      </button>
                    </div>
                  </div>
                  {rule.lastMatchedCount != null && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>上次匹配: {rule.lastMatchedCount} 条</span>
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

      <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">全局匹配行为</p>
        <p>
          规则按优先级顺序执行，匹配成功后不再尝试后续规则。容差金额在 ±{fmtCents(200)}
          内的差异会自动标记为"待审核"，超过容差范围的差异标记为"异常"。
        </p>
      </div>
    </div>
  )
}
