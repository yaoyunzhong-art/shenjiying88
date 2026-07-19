'use client'

import { useCallback, useEffect, useState } from 'react'

// ─── 类型定义 ──────────────────────────────────────

interface FinanceRule {
  id: string
  name: string
  description: string
  module: 'RECONCILIATION' | 'APPROVAL' | 'AUDIT' | 'SETTLEMENT'
  matchField: string
  toleranceCents: number
  autoApply: boolean
  autoApplyThresholdCents: number
  enabled: boolean
  priority: number
  createdAt: string
  updatedAt: string
  lastAppliedCount?: number
  applyRate?: number
}

type ViewMode = 'active' | 'inactive' | 'all'
type ModuleFilter = FinanceRule['module'] | 'ALL'

// ── 工具函数 ──

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

// ── API Fetch ──

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data as T
}

// ── 默认规则数据集 ──

const DEFAULT_RULES: FinanceRule[] = [
  {
    id: 'fr-1',
    name: '对账 — 订单号精确匹配',
    description: '按内部订单号与渠道交易号完全匹配',
    module: 'RECONCILIATION',
    matchField: 'orderNo',
    toleranceCents: 0,
    autoApply: true,
    autoApplyThresholdCents: 0,
    enabled: true,
    priority: 1,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-16T10:00:00Z',
    lastAppliedCount: 1248,
    applyRate: 96.5,
  },
  {
    id: 'fr-2',
    name: '对账 — 金额容差匹配',
    description: '金额差异在容差范围内自动匹配（渠道手续费场景）',
    module: 'RECONCILIATION',
    matchField: 'amount+date',
    toleranceCents: 100,
    autoApply: false,
    autoApplyThresholdCents: 50,
    enabled: true,
    priority: 2,
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-15T14:00:00Z',
    lastAppliedCount: 389,
    applyRate: 88.2,
  },
  {
    id: 'fr-3',
    name: '审批 — 大额人工审核',
    description: '单笔金额超过500元的退款需要人工审批',
    module: 'APPROVAL',
    matchField: 'amountCents',
    toleranceCents: 50_000,
    autoApply: false,
    autoApplyThresholdCents: 0,
    enabled: true,
    priority: 3,
    createdAt: '2026-07-02T00:00:00Z',
    updatedAt: '2026-07-15T09:00:00Z',
    lastAppliedCount: 45,
    applyRate: 100,
  },
  {
    id: 'fr-4',
    name: '审计 — 大额交易标记',
    description: '超过10万元的交易自动标记审计关注',
    module: 'AUDIT',
    matchField: 'amountCents',
    toleranceCents: 10_000_00,
    autoApply: true,
    autoApplyThresholdCents: 0,
    enabled: true,
    priority: 4,
    createdAt: '2026-07-03T00:00:00Z',
    updatedAt: '2026-07-14T08:00:00Z',
    lastAppliedCount: 23,
    applyRate: 100,
  },
  {
    id: 'fr-5',
    name: '对账 — 模糊搜索匹配',
    description: '按备注关键词模糊匹配（适用于无订单号场景）',
    module: 'RECONCILIATION',
    matchField: 'note+amount',
    toleranceCents: 200,
    autoApply: false,
    autoApplyThresholdCents: 0,
    enabled: false,
    priority: 5,
    createdAt: '2026-07-05T00:00:00Z',
    updatedAt: '2026-07-12T09:00:00Z',
    lastAppliedCount: 56,
    applyRate: 42.1,
  },
  {
    id: 'fr-6',
    name: '结算 — 分账规则',
    description: '按商户分成比例自动结算分账款项',
    module: 'SETTLEMENT',
    matchField: 'ratio',
    toleranceCents: 0,
    autoApply: true,
    autoApplyThresholdCents: 0,
    enabled: false,
    priority: 6,
    createdAt: '2026-07-04T00:00:00Z',
    updatedAt: '2026-07-11T10:00:00Z',
    lastAppliedCount: 0,
    applyRate: null,
  },
]

// ── 主组件 ──

export default function FinanceRulesPage() {
  const [rules, setRules] = useState<FinanceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('active')
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>('ALL')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<FinanceRule>>({})
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    module: 'RECONCILIATION' as FinanceRule['module'],
    matchField: 'orderNo',
    toleranceCents: 0,
    autoApply: false,
    autoApplyThresholdCents: 0,
    enabled: true,
    priority: 10,
  })

  const loadRules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<{ rules: FinanceRule[] }>('/api/finance/rules')
      setRules(data.rules)
    } catch {
      setRules(DEFAULT_RULES)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRules() }, [loadRules])

  const filteredRules = rules.filter(r => {
    if (viewMode === 'active' && !r.enabled) return false
    if (viewMode === 'inactive' && r.enabled) return false
    if (moduleFilter !== 'ALL' && r.module !== moduleFilter) return false
    return true
  })

  const handleSave = async (ruleId: string) => {
    setSaving(true)
    try {
      await apiFetch(`/api/finance/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      })
      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, ...editForm, updatedAt: new Date().toISOString() } as FinanceRule : r,
      ))
      setEditingId(null)
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
      await apiFetch(`/api/finance/rules/${ruleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      })
      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, enabled, updatedAt: new Date().toISOString() } as FinanceRule : r,
      ))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const startEdit = (rule: FinanceRule) => {
    setEditingId(rule.id)
    setEditForm({ ...rule })
  }

  const handleCreate = async () => {
    if (!createForm.name) {
      setError('规则名称不能为空')
      return
    }
    setSaving(true)
    try {
      const data = await apiFetch<{ rule: FinanceRule }>('/api/finance/rules', {
        method: 'POST',
        body: JSON.stringify(createForm),
      })
      setRules(prev => [...prev, data.rule])
      setShowCreateModal(false)
      setCreateForm({
        name: '', description: '', module: 'RECONCILIATION',
        matchField: 'orderNo', toleranceCents: 0,
        autoApply: false, autoApplyThresholdCents: 0,
        enabled: true, priority: 10,
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        <span className="ml-3 text-gray-600">加载财务规则...</span>
      </div>
    )
  }

  const totalEnabled = rules.filter(r => r.enabled).length
  const totalAbnormal = rules.filter(r => r.enabled && r.applyRate != null && r.applyRate < 50).length

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">财务规则管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理对账、审批、审计、结算等模块的自动规则配置
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadRules}
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            刷新
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            + 新建规则
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">总规则</p>
          <p className="text-2xl font-bold mt-1">{rules.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已启用</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{totalEnabled}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">已禁用</p>
          <p className="text-2xl font-bold mt-1 text-gray-400">{rules.length - totalEnabled}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">异常</p>
          <p className="text-2xl font-bold mt-1 text-orange-600">{totalAbnormal}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">模块</p>
          <p className="text-2xl font-bold mt-1 text-blue-600">{new Set(rules.map(r => r.module)).size}</p>
        </div>
      </div>

      {/* Tab + 模块筛选 */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <nav className="flex space-x-4">
          {(['active', 'inactive', 'all'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
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
          <label className="text-xs text-gray-500">模块筛选:</label>
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value as ModuleFilter)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="ALL">全部模块</option>
            <option value="RECONCILIATION">对账</option>
            <option value="APPROVAL">审批</option>
            <option value="AUDIT">审计</option>
            <option value="SETTLEMENT">结算</option>
          </select>
        </div>
      </div>

      {/* 规则列表 */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <div className="bg-white border rounded-lg p-12 text-center text-gray-400">
            <p className="text-lg mb-1">暂无规则</p>
            <p className="text-sm">当前筛选条件下没有匹配的财务规则</p>
          </div>
        ) : (
          filteredRules.map(rule => (
            <div key={rule.id} className="bg-white border rounded-lg p-5">
              {editingId === rule.id ? (
                /* ── 编辑模式 ── */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
                      <input
                        type="text"
                        value={editForm.name ?? ''}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">匹配字段</label>
                      <input
                        type="text"
                        value={editForm.matchField ?? ''}
                        onChange={e => setEditForm({ ...editForm, matchField: e.target.value })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">容差金额 (分)</label>
                      <input
                        type="number"
                        value={editForm.toleranceCents ?? 0}
                        onChange={e => setEditForm({ ...editForm, toleranceCents: Number(e.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">自动处理阈值 (分)</label>
                      <input
                        type="number"
                        value={editForm.autoApplyThresholdCents ?? 0}
                        onChange={e => setEditForm({ ...editForm, autoApplyThresholdCents: Number(e.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                      <input
                        type="number"
                        value={editForm.priority ?? 0}
                        onChange={e => setEditForm({ ...editForm, priority: Number(e.target.value) })}
                        className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.enabled ?? false}
                          onChange={e => setEditForm({ ...editForm, enabled: e.target.checked })}
                          className="rounded"
                        />
                        启用
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.autoApply ?? false}
                          onChange={e => setEditForm({ ...editForm, autoApply: e.target.checked })}
                          className="rounded"
                        />
                        自动处理
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                    <textarea
                      value={editForm.description ?? ''}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
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
                      onClick={() => { setEditingId(null); setEditForm({}) }}
                      className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                /* ── 展示模式 ── */
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: moduleColor(rule.module) }}
                        />
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {moduleLabel(rule.module)}
                        </span>
                        <h3 className="text-base font-medium text-gray-900">{rule.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {rule.enabled ? '已启用' : '已禁用'}
                        </span>
                        {rule.autoApply && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            自动处理
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>字段: {rule.matchField}</span>
                        <span>容差: {formatMoney(rule.toleranceCents)}</span>
                        <span>阈值: {formatMoney(rule.autoApplyThresholdCents)}</span>
                        <span>优先级: #{rule.priority}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {rule.applyRate != null && (
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatPercent(rule.applyRate)}</p>
                          <p className="text-xs text-gray-400">应用率</p>
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
                  {rule.lastAppliedCount != null && (
                    <div className="mt-3 pt-3 border-t">
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

      {/* 全局设置提示 */}
      <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">规则执行策略</p>
        <p>财务规则按模块分组，同一模块内按优先级顺序执行。匹配成功后不再尝试后续规则。超出容差范围的差异自动标记为"待人工审核"。</p>
      </div>

      {/* ── 新建规则模态框 ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[520px] max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">新建财务规则</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">规则名称 *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="输入规则名称"
                  className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="规则描述"
                  className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">模块</label>
                  <select
                    value={createForm.module}
                    onChange={e => setCreateForm({ ...createForm, module: e.target.value as FinanceRule['module'] })}
                    className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                  >
                    <option value="RECONCILIATION">对账</option>
                    <option value="APPROVAL">审批</option>
                    <option value="AUDIT">审计</option>
                    <option value="SETTLEMENT">结算</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">匹配字段</label>
                  <input
                    type="text"
                    value={createForm.matchField}
                    onChange={e => setCreateForm({ ...createForm, matchField: e.target.value })}
                    placeholder="orderNo"
                    className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">容差 (分)</label>
                  <input
                    type="number"
                    value={createForm.toleranceCents}
                    onChange={e => setCreateForm({ ...createForm, toleranceCents: Number(e.target.value) })}
                    className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                  <input
                    type="number"
                    value={createForm.priority}
                    onChange={e => setCreateForm({ ...createForm, priority: Number(e.target.value) })}
                    className="border border-gray-300 rounded px-3 py-1.5 w-full text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={createForm.enabled}
                    onChange={e => setCreateForm({ ...createForm, enabled: e.target.checked })}
                    className="rounded"
                  />
                  创建后启用
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={createForm.autoApply}
                    onChange={e => setCreateForm({ ...createForm, autoApply: e.target.checked })}
                    className="rounded"
                  />
                  自动处理
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !createForm.name}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
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
