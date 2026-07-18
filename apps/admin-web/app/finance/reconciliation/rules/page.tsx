'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface ReconciliationRule {
  id: string
  name: string
  description: string
  matchKey: string            // 'orderNo' | 'transactionId' | 'amount+date'
  toleranceCents: number
  autoResolve: boolean        // 自动标记已处理/已匹配
  autoResolveThresholdCents: number  // 自动处理阈值（容差内自动match）
  enabled: boolean
  priority: number
  createdAt: string
  updatedAt: string
  lastMatchedCount?: number
  matchRate?: number
}

interface AutoMatchStrategy {
  type: string               // 'exact' | 'fuzzy' | 'auto-resolve'
  matchField: string
  includeRawTextSearch: boolean
  fuzzyThreshold: number
}

type RuleTab = 'active' | 'inactive' | 'settings'

// ── 工具 ──

function fmtCents(cents: number): string {
  const abs = Math.abs(cents)
  const sign = cents < 0 ? '-' : ''
  return `${sign}¥${(abs / 100).toFixed(2)}`
}

function fmtRate(rate: number): string {
  return `${rate.toFixed(1)}%`
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

// ── 默认规则生成 ──

const defaultRules: ReconciliationRule[] = [
  {
    id: 'rule-1',
    name: '订单号精确匹配',
    description: '按内部订单号与外部交易单号完全匹配，自动标记已对账',
    matchKey: 'orderNo',
    toleranceCents: 0,
    autoResolve: true,
    autoResolveThresholdCents: 0,
    enabled: true,
    priority: 1,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
    lastMatchedCount: 1248,
    matchRate: 96.5,
  },
  {
    id: 'rule-2',
    name: '金额容差匹配',
    description: '金额差异在容差范围内自动匹配（微信支付手续费场景）',
    matchKey: 'amount+date',
    toleranceCents: 100,
    autoResolve: false,
    autoResolveThresholdCents: 50,
    enabled: true,
    priority: 2,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-14T14:00:00Z',
    lastMatchedCount: 389,
    matchRate: 88.2,
  },
  {
    id: 'rule-3',
    name: '模糊搜索匹配',
    description: '按备注关键词模糊匹配（适用于无订单号场景）',
    matchKey: 'note+amount',
    toleranceCents: 200,
    autoResolve: false,
    autoResolveThresholdCents: 0,
    enabled: false,
    priority: 3,
    createdAt: '2026-07-05T00:00:00Z',
    updatedAt: '2026-07-12T09:00:00Z',
    lastMatchedCount: 56,
    matchRate: 42.1,
  },
  {
    id: 'rule-4',
    name: '重复单据检测',
    description: '检测同一笔交易的多条外部记录，合并标记',
    matchKey: 'transactionId',
    toleranceCents: 0,
    autoResolve: true,
    autoResolveThresholdCents: 0,
    enabled: true,
    priority: 4,
    createdAt: '2026-07-03T00:00:00Z',
    updatedAt: '2026-07-15T08:00:00Z',
    lastMatchedCount: 23,
    matchRate: 100,
  },
]

// ── 主组件 ──

export default function ReconciliationRulesPage() {
  const [rules, setRules] = useState<ReconciliationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabView, setTabView] = useState<RuleTab>('active')
  const [editingRule, setEditingRule] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<ReconciliationRule>>({})
  const [saving, setSaving] = useState(false)

  const loadRules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ rules: ReconciliationRule[] }>('/api/finance/reconciliation/rules')
      setRules(data.rules)
    } catch {
      // Fallback to default rules for demo/offline
      setRules(defaultRules)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRules() }, [loadRules])

  const filteredRules = rules.filter(r =>
    tabView === 'active' ? r.enabled : tabView === 'inactive' ? !r.enabled : true
  )

  const handleSave = async (ruleId: string) => {
    setSaving(true)
    try {
      await apiFetch(`/api/finance/reconciliation/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      })
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...editForm, updatedAt: new Date().toISOString() } as ReconciliationRule : r))
      setEditingRule(null)
      setEditForm({})
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return
    const enabled = !rule.enabled
    try {
      await apiFetch(`/api/finance/reconciliation/rules/${ruleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      })
      setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled, updatedAt: new Date().toISOString() } as ReconciliationRule : r))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const startEdit = (rule: ReconciliationRule) => {
    setEditingRule(rule.id)
    setEditForm({ ...rule })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载对账规则...</span>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">对账规则配置</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理匹配规则、容差阈值和自动处理策略
          </p>
        </div>
        <button
          onClick={loadRules}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          刷新
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 概览统计 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总规则</p>
          <p className="text-2xl font-bold mt-1">{rules.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已启用</p>
          <p className="text-2xl font-bold mt-1 text-green-600">
            {rules.filter(r => r.enabled).length}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">自动处理</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">
            {rules.filter(r => r.autoResolve).length}
          </p>
        </div>
      </div>

      {/* Tab */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['active', 'inactive', 'settings'] as RuleTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setTabView(tab)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                tabView === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {{ active: '已启用', inactive: '已禁用', settings: '全部' }[tab]}
            </button>
          ))}
        </nav>
      </div>

      {/* 规则列表 */}
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
                /* 编辑模式 */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">匹配字段</label>
                      <select
                        value={editForm.matchKey || ''}
                        onChange={(e) => setEditForm({ ...editForm, matchKey: e.target.value })}
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
                        onChange={(e) => setEditForm({ ...editForm, toleranceCents: Number(e.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">自动处理阈值 (分)</label>
                      <input
                        type="number"
                        value={editForm.autoResolveThresholdCents ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, autoResolveThresholdCents: Number(e.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                      <input
                        type="number"
                        value={editForm.priority ?? 0}
                        onChange={(e) => setEditForm({ ...editForm, priority: Number(e.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.enabled ?? false}
                          onChange={(e) => setEditForm({ ...editForm, enabled: e.target.checked })}
                          className="rounded"
                        />
                        启用
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.autoResolve ?? false}
                          onChange={(e) => setEditForm({ ...editForm, autoResolve: e.target.checked })}
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
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleSave(rule.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => { setEditingRule(null); setEditForm({}) }}
                      className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                /* 展示模式 */
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-medium text-gray-900">{rule.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
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

      {/* 全局设置底部提示 */}
      <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">全局匹配行为</p>
        <p>规则按优先级顺序执行，匹配成功后不再尝试后续规则。容差金额在 ±{fmtCents(200)} 内的差异会自动标记为"待审核"，超过容差范围的差异标记为"异常"。</p>
      </div>
    </div>
  )
}
