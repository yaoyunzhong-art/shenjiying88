'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  INVENTORY_RULES_API_BASE,
  type InventoryRule,
  type InventoryRulesSnapshot,
  type RuleStatus,
  type RuleType,
} from './inventory-rules-data'

const TYPE_LABELS: Record<RuleType, string> = {
  ALERT: '预警规则',
  REORDER: '补货规则',
}

const SCOPE_LABELS: Record<InventoryRule['scope'], string> = {
  sku: 'SKU',
  category: '品类',
  global: '全局',
}

const SEVERITY_LABELS: Record<InventoryRule['severity'], string> = {
  low: '低',
  medium: '中',
  high: '高',
}

interface ToastState {
  type: 'success' | 'error'
  msg: string
}

export default function InventoryRulesClient({
  snapshot,
}: {
  snapshot: InventoryRulesSnapshot
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRefreshing, startRefresh] = useTransition()
  const [tenantId, setTenantId] = useState(snapshot.tenantId)
  const [rules, setRules] = useState<InventoryRule[]>(snapshot.rules)
  const [filterType, setFilterType] = useState<RuleType | 'all'>('all')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [editingRule, setEditingRule] = useState<InventoryRule | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    setTenantId(snapshot.tenantId)
    setRules(snapshot.rules)
    setEditingRule(null)
    setShowCreateDialog(false)
  }, [snapshot])

  const showToast = useCallback((type: ToastState['type'], msg: string) => {
    setToast({ type, msg })
    window.setTimeout(() => setToast(null), 3000)
  }, [])

  const buildRefreshPath = useCallback(
    (nextTenantId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tenantId', nextTenantId.trim() || snapshot.tenantId)
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams, snapshot.tenantId]
  )

  const refreshSnapshot = useCallback(
    (nextTenantId = tenantId) => {
      const nextPath = buildRefreshPath(nextTenantId)
      startRefresh(() => {
        router.replace(nextPath)
        router.refresh()
      })
    },
    [buildRefreshPath, router, startRefresh, tenantId]
  )

  const readResponseMessage = useCallback(async (response: Response) => {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string | string[] }
      if (Array.isArray(payload.message)) {
        return payload.message.join('，')
      }
      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message
      }
    }
    return `请求失败: ${response.status}`
  }, [])

  const handleToggleStatus = useCallback(
    async (rule: InventoryRule) => {
      const nextStatus: RuleStatus = rule.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'
      try {
        const response = await fetch(`${INVENTORY_RULES_API_BASE}/${rule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus, version: rule.version }),
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        showToast('success', nextStatus === 'ENABLED' ? '规则已启用' : '规则已停用')
        refreshSnapshot()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : '状态变更失败')
      }
    },
    [readResponseMessage, refreshSnapshot, showToast]
  )

  const handleDelete = useCallback(
    async (ruleId: string) => {
      try {
        const response = await fetch(`${INVENTORY_RULES_API_BASE}/${ruleId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId }),
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        showToast('success', '规则已删除')
        refreshSnapshot()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : '删除失败')
      }
    },
    [readResponseMessage, refreshSnapshot, showToast, tenantId]
  )

  const handleCreate = useCallback(
    async (input: Omit<InventoryRule, 'id' | 'tenantId' | 'version' | 'createdAt' | 'updatedAt'>) => {
      try {
        const response = await fetch(INVENTORY_RULES_API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId, ...input }),
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        showToast('success', `规则创建成功: ${input.name}`)
        setShowCreateDialog(false)
        refreshSnapshot()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : '创建失败')
      }
    },
    [readResponseMessage, refreshSnapshot, showToast, tenantId]
  )

  const handleUpdate = useCallback(
    async (rule: InventoryRule) => {
      try {
        const response = await fetch(`${INVENTORY_RULES_API_BASE}/${rule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: rule.name,
            description: rule.description,
            threshold: rule.threshold,
            severity: rule.severity,
            triggerQty: rule.triggerQty,
            orderQty: rule.orderQty,
            supplier: rule.supplier,
            status: rule.status,
            version: rule.version,
          }),
        })

        if (!response.ok) {
          throw new Error(await readResponseMessage(response))
        }

        showToast('success', '规则已更新')
        setEditingRule(null)
        refreshSnapshot()
      } catch (error) {
        showToast('error', error instanceof Error ? error.message : '更新失败')
      }
    },
    [readResponseMessage, refreshSnapshot, showToast]
  )

  const filteredRules = useMemo(
    () => (filterType === 'all' ? rules : rules.filter((rule) => rule.type === filterType)),
    [filterType, rules]
  )

  const enabledCount = useMemo(
    () => rules.filter((rule) => rule.status === 'ENABLED').length,
    [rules]
  )

  const alertCount = useMemo(() => rules.filter((rule) => rule.type === 'ALERT').length, [rules])
  const reorderCount = useMemo(
    () => rules.filter((rule) => rule.type === 'REORDER').length,
    [rules]
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {snapshot.error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {snapshot.error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">库存规则管理</h1>
            <p className="mt-1 text-sm text-slate-500">
              当前数据源: {snapshot.sourceLabel} · tenant: {snapshot.tenantId}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-600">租户 ID</label>
            <input
              type="text"
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => refreshSnapshot(tenantId)}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
            >
              + 新建规则
            </button>
            <span className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-600">
              已启用: {enabledCount}/{rules.length}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-600">规则类型</label>
          <select
            value={filterType}
            onChange={(event) => setFilterType(event.target.value as RuleType | 'all')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">全部规则 ({rules.length})</option>
            <option value="ALERT">预警规则 ({alertCount})</option>
            <option value="REORDER">补货规则 ({reorderCount})</option>
          </select>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        {filteredRules.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center text-sm text-slate-500">
            {rules.length === 0 ? '暂无库存规则，点击“新建规则”添加。' : '当前筛选条件下无匹配规则。'}
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-500">
                <th className="border border-slate-200 px-3 py-2">名称</th>
                <th className="border border-slate-200 px-3 py-2">类型</th>
                <th className="border border-slate-200 px-3 py-2">范围</th>
                <th className="border border-slate-200 px-3 py-2">阈值 / 触发量</th>
                <th className="border border-slate-200 px-3 py-2 text-center">严重级别</th>
                <th className="border border-slate-200 px-3 py-2 text-center">状态</th>
                <th className="border border-slate-200 px-3 py-2 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule) => (
                <tr key={rule.id} className="text-sm text-slate-700">
                  <td className="border border-slate-200 px-3 py-2">
                    <div className="font-medium text-slate-900">{rule.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{rule.description}</div>
                  </td>
                  <td className="border border-slate-200 px-3 py-2">{TYPE_LABELS[rule.type]}</td>
                  <td className="border border-slate-200 px-3 py-2">
                    {SCOPE_LABELS[rule.scope]}: {rule.scopeValue}
                  </td>
                  <td className="border border-slate-200 px-3 py-2">
                    {rule.type === 'ALERT'
                      ? `阈值 ${rule.threshold}`
                      : `触发 ${rule.triggerQty} -> 补 ${rule.orderQty} (${rule.supplier})`}
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        rule.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : rule.severity === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {SEVERITY_LABELS[rule.severity]}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        rule.status === 'ENABLED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rule.status === 'ENABLED' ? '启用' : '停用'}
                    </span>
                  </td>
                  <td className="border border-slate-200 px-3 py-2 text-center">
                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingRule(rule)}
                        className="text-blue-600 hover:underline"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(rule)}
                        className="text-amber-600 hover:underline"
                      >
                        {rule.status === 'ENABLED' ? '停用' : '启用'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(rule.id)}
                        className="text-red-600 hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {toast ? (
        <div
          className={`fixed bottom-4 right-4 rounded px-4 py-2 text-sm text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      ) : null}

      {editingRule ? (
        <RuleEditDialog
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={(rule) => void handleUpdate(rule)}
        />
      ) : null}

      {showCreateDialog ? (
        <RuleCreateDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={(rule) => void handleCreate(rule)}
        />
      ) : null}
    </div>
  )
}

function RuleEditDialog({
  rule,
  onClose,
  onSave,
}: {
  rule: InventoryRule
  onClose: () => void
  onSave: (rule: InventoryRule) => void
}) {
  const [draft, setDraft] = useState(rule)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">编辑库存规则</h2>
        <div className="mt-4 grid gap-4">
          <LabeledField label="规则名称">
            <input
              type="text"
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </LabeledField>
          <LabeledField label="规则描述">
            <input
              type="text"
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, description: event.target.value }))
              }
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </LabeledField>
          {draft.type === 'ALERT' ? (
            <>
              <LabeledField label="预警阈值">
                <input
                  type="number"
                  min={0}
                  value={draft.threshold}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, threshold: Number(event.target.value) }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </LabeledField>
              <LabeledField label="严重级别">
                <select
                  value={draft.severity}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      severity: event.target.value as InventoryRule['severity'],
                    }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </LabeledField>
            </>
          ) : (
            <>
              <LabeledField label="触发数量">
                <input
                  type="number"
                  min={1}
                  value={draft.triggerQty}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, triggerQty: Number(event.target.value) }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </LabeledField>
              <LabeledField label="补货数量">
                <input
                  type="number"
                  min={1}
                  value={draft.orderQty}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, orderQty: Number(event.target.value) }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </LabeledField>
              <LabeledField label="供应商">
                <input
                  type="text"
                  value={draft.supplier}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, supplier: event.target.value }))
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </LabeledField>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!draft.name.trim()}
            onClick={() => onSave(draft)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

function RuleCreateDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (
    input: Omit<InventoryRule, 'id' | 'tenantId' | 'version' | 'createdAt' | 'updatedAt'>
  ) => void
}) {
  const [type, setType] = useState<RuleType>('ALERT')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<InventoryRule['scope']>('global')
  const [scopeValue, setScopeValue] = useState('*')
  const [threshold, setThreshold] = useState(10)
  const [severity, setSeverity] = useState<InventoryRule['severity']>('medium')
  const [triggerQty, setTriggerQty] = useState(10)
  const [orderQty, setOrderQty] = useState(100)
  const [supplier, setSupplier] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">新建库存规则</h2>
        <div className="mt-4 grid gap-4">
          <LabeledField label="规则类型">
            <select
              value={type}
              onChange={(event) => setType(event.target.value as RuleType)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="ALERT">预警规则</option>
              <option value="REORDER">补货规则</option>
            </select>
          </LabeledField>
          <LabeledField label="规则名称">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </LabeledField>
          <LabeledField label="规则描述">
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </LabeledField>
          <LabeledField label="作用范围">
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as InventoryRule['scope'])}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="global">全局</option>
              <option value="category">品类</option>
              <option value="sku">SKU</option>
            </select>
          </LabeledField>
          <LabeledField label={scope === 'category' ? '品类编码' : scope === 'sku' ? 'SKU 编码' : '范围值'}>
            <input
              type="text"
              value={scopeValue}
              onChange={(event) => setScopeValue(event.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
          </LabeledField>
          {type === 'ALERT' ? (
            <>
              <LabeledField label="预警阈值">
                <input
                  type="number"
                  min={0}
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </LabeledField>
              <LabeledField label="严重级别">
                <select
                  value={severity}
                  onChange={(event) =>
                    setSeverity(event.target.value as InventoryRule['severity'])
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </LabeledField>
            </>
          ) : (
            <>
              <LabeledField label="触发数量">
                <input
                  type="number"
                  min={1}
                  value={triggerQty}
                  onChange={(event) => setTriggerQty(Number(event.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </LabeledField>
              <LabeledField label="补货数量">
                <input
                  type="number"
                  min={1}
                  value={orderQty}
                  onChange={(event) => setOrderQty(Number(event.target.value))}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </LabeledField>
              <LabeledField label="供应商">
                <input
                  type="text"
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </LabeledField>
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() =>
              onCreate({
                type,
                name: name.trim(),
                description: description.trim(),
                scope,
                scopeValue: scopeValue.trim() || '*',
                threshold,
                severity,
                triggerQty,
                orderQty,
                supplier: supplier.trim(),
                status: 'ENABLED',
              })
            }
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  )
}

function LabeledField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}
