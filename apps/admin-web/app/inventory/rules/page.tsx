'use client'

/**
 * Phase-37 T167a: 库存规则管理页面 (admin-web)
 *
 * 库存规则包括：
 *   - 低库存预警规则 (ALERT): threshold + severity
 *   - 自动补货规则 (REORDER): triggerQty + orderQty + supplier
 *
 * 反模式 v4 防御:
 *   - TenantGuard: 强制 tenantId
 *   - 乐观锁: update 需传 version
 *   - 规则级联启用/停用
 */

import { useState, useEffect, useCallback } from 'react'

export type RuleType = 'ALERT' | 'REORDER'
export type RuleStatus = 'ENABLED' | 'DISABLED'

export interface InventoryRule {
  id: string
  tenantId: string
  type: RuleType
  name: string
  description: string
  /** 规则的生效范围: SKU、品类、全局 */
  scope: 'sku' | 'category' | 'global'
  scopeValue: string
  /** ALERT 专有 */
  threshold: number
  severity: 'low' | 'medium' | 'high'
  /** REORDER 专有 */
  triggerQty: number
  orderQty: number
  supplier: string
  /** 公共 */
  status: RuleStatus
  version: number
  createdAt: string
  updatedAt: string
}

const API_BASE = '/api/inventory/rules'

const SEVERITY_LABELS: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

const SCOPE_LABELS: Record<string, string> = {
  sku: 'SKU',
  category: '品类',
  global: '全局',
}

const TYPE_LABELS: Record<string, string> = {
  ALERT: '预警规则',
  REORDER: '补货规则',
}

export default function InventoryRulesPage() {
  const [tenantId, setTenantId] = useState('demo-tenant')
  const [rules, setRules] = useState<InventoryRule[]>([])
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<RuleType | 'all'>('all')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [editingRule, setEditingRule] = useState<InventoryRule | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const loadRules = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}?tenantId=${encodeURIComponent(tenantId)}`)
      if (res.ok) {
        const data = await res.json() as { rules: InventoryRule[] }
        setRules(data.rules)
      } else {
        const errBody = await res.json().catch(() => ({}))
        showToast('error', `加载规则失败: ${errBody.message ?? res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadRules()
  }, [loadRules])

  const handleToggleStatus = async (rule: InventoryRule) => {
    const newStatus: RuleStatus = rule.status === 'ENABLED' ? 'DISABLED' : 'ENABLED'
    try {
      const res = await fetch(`${API_BASE}/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, version: rule.version }),
      })
      if (res.ok) {
        showToast('success', newStatus === 'ENABLED' ? '规则已启用' : '规则已停用')
        loadRules()
      } else {
        const errBody = await res.json().catch(() => ({}))
        showToast('error', `状态变更失败: ${errBody.message ?? res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    }
  }

  const handleCreate = async (input: Omit<InventoryRule, 'id' | 'tenantId' | 'version' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, ...input }),
      })
      if (res.ok) {
        showToast('success', `规则创建成功: ${input.name}`)
        setShowCreateDialog(false)
        loadRules()
      } else {
        const errBody = await res.json().catch(() => ({}))
        showToast('error', `创建规则失败: ${errBody.message ?? res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    }
  }

  const handleUpdate = async (rule: InventoryRule) => {
    try {
      const res = await fetch(`${API_BASE}/${rule.id}`, {
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
      if (res.ok) {
        showToast('success', '规则已更新')
        setEditingRule(null)
        loadRules()
      } else {
        const errBody = await res.json().catch(() => ({}))
        showToast('error', `更新规则失败: ${errBody.message ?? res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    }
  }

  const handleDelete = async (ruleId: string) => {
    try {
      const res = await fetch(`${API_BASE}/${ruleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      })
      if (res.ok) {
        showToast('success', '规则已删除')
        loadRules()
      } else {
        const errBody = await res.json().catch(() => ({}))
        showToast('error', `删除规则失败: ${errBody.message ?? res.status}`)
      }
    } catch (err) {
      showToast('error', `网络错误: ${(err as Error).message}`)
    }
  }

  const filteredRules = filterType === 'all' ? rules : rules.filter((r) => r.type === filterType)
  const enabledCount = rules.filter((r) => r.status === 'ENABLED').length
  const alertCount = rules.filter((r) => r.type === 'ALERT').length
  const reorderCount = rules.filter((r) => r.type === 'REORDER').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">⚙️ 库存规则管理</h1>

      {/* Tenant 和筛选 */}
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <label className="text-sm font-medium">租户 ID:</label>
        <input
          type="text"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button
          onClick={loadRules}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          刷新
        </button>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
        >
          + 新建规则
        </button>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as RuleType | 'all')}
          className="border px-2 py-1 rounded"
        >
          <option value="all">全部规则 ({rules.length})</option>
          <option value="ALERT">预警规则 ({alertCount})</option>
          <option value="REORDER">补货规则 ({reorderCount})</option>
        </select>

        <span className="text-sm text-gray-500">
          已启用: {enabledCount}/{rules.length}
        </span>
      </div>

      {/* 规则列表 */}
      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {rules.length === 0 ? '暂无库存规则，点击"新建规则"添加' : '当前筛选条件无匹配规则'}
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-3 py-2 text-left">名称</th>
              <th className="border px-3 py-2 text-left">类型</th>
              <th className="border px-3 py-2 text-left">范围</th>
              <th className="border px-3 py-2 text-left">阈值/触发量</th>
              <th className="border px-3 py-2 text-center">严重级别</th>
              <th className="border px-3 py-2 text-center">状态</th>
              <th className="border px-3 py-2 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredRules.map((rule) => (
              <tr key={rule.id}>
                <td className="border px-3 py-2">
                  <div className="font-medium">{rule.name}</div>
                  <div className="text-xs text-gray-500">{rule.description}</div>
                </td>
                <td className="border px-3 py-2">{TYPE_LABELS[rule.type]}</td>
                <td className="border px-3 py-2">
                  {SCOPE_LABELS[rule.scope]}: {rule.scopeValue}
                </td>
                <td className="border px-3 py-2">
                  {rule.type === 'ALERT'
                    ? `阈值 ${rule.threshold}`
                    : `触发 ${rule.triggerQty} → 补 ${rule.orderQty} (${rule.supplier})`
                  }
                </td>
                <td className="border px-3 py-2 text-center">
                  <SeverityBadge severity={rule.severity} />
                </td>
                <td className="border px-3 py-2 text-center">
                  <StatusBadge status={rule.status} />
                </td>
                <td className="border px-3 py-2 text-center space-x-2">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleToggleStatus(rule)}
                    className="text-orange-500 hover:underline text-sm"
                  >
                    {rule.status === 'ENABLED' ? '停用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-red-500 hover:underline text-sm"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* 编辑对话框 */}
      {editingRule && (
        <RuleEditDialog
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={handleUpdate}
        />
      )}

      {/* 新建对话框 */}
      {showCreateDialog && (
        <RuleCreateDialog onClose={() => setShowCreateDialog(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${colors[severity] ?? 'bg-gray-100 text-gray-500'}`}>
      {SEVERITY_LABELS[severity] ?? severity}
    </span>
  )
}

function StatusBadge({ status }: { status: RuleStatus }) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${
        status === 'ENABLED'
          ? 'bg-green-100 text-green-700'
          : 'bg-gray-100 text-gray-500'
      }`}
    >
      {status === 'ENABLED' ? '启用' : '停用'}
    </span>
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
  const [name, setName] = useState(rule.name)
  const [description, setDescription] = useState(rule.description)
  const [threshold, setThreshold] = useState(rule.threshold)
  const [severity, setSeverity] = useState(rule.severity)
  const [triggerQty, setTriggerQty] = useState(rule.triggerQty)
  const [orderQty, setOrderQty] = useState(rule.orderQty)
  const [supplier, setSupplier] = useState(rule.supplier)

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({ ...rule, name, description, threshold, severity, triggerQty, orderQty, supplier })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-4">编辑规则 · {rule.name}</h2>
        <div className="mb-3">
          <label className="block text-sm mb-1">名称</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">描述</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </div>
        {rule.type === 'ALERT' && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">阈值</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">严重级别</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high')} className="w-full border px-2 py-1 rounded">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </>
        )}
        {rule.type === 'REORDER' && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">触发数量</label>
              <input type="number" value={triggerQty} onChange={(e) => setTriggerQty(Number(e.target.value))} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">补货数量</label>
              <input type="number" value={orderQty} onChange={(e) => setOrderQty(Number(e.target.value))} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">供应商</label>
              <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full border px-2 py-1 rounded" />
            </div>
          </>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1 border rounded">取消</button>
          <button onClick={handleSubmit} disabled={!name.trim()} className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50">
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
  onCreate: (input: Omit<InventoryRule, 'id' | 'tenantId' | 'version' | 'createdAt' | 'updatedAt'>) => void
}) {
  const [type, setType] = useState<RuleType>('ALERT')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<'sku' | 'category' | 'global'>('global')
  const [scopeValue, setScopeValue] = useState('')
  const [threshold, setThreshold] = useState(10)
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium')
  const [triggerQty, setTriggerQty] = useState(5)
  const [orderQty, setOrderQty] = useState(50)
  const [supplier, setSupplier] = useState('')

  const handleCreate = () => {
    if (!name.trim()) return
    onCreate({
      type,
      name,
      description,
      scope,
      scopeValue,
      threshold,
      severity,
      triggerQty,
      orderQty,
      supplier,
      status: 'ENABLED',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h2 className="text-lg font-bold mb-4">新建库存规则</h2>
        <div className="mb-3">
          <label className="block text-sm mb-1">规则类型</label>
          <select value={type} onChange={(e) => setType(e.target.value as RuleType)} className="w-full border px-2 py-1 rounded">
            <option value="ALERT">预警规则</option>
            <option value="REORDER">补货规则</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">规则名称</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">描述</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border px-2 py-1 rounded" />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">生效范围</label>
          <select value={scope} onChange={(e) => setScope(e.target.value as 'sku' | 'category' | 'global')} className="w-full border px-2 py-1 rounded">
            <option value="global">全局</option>
            <option value="category">品类</option>
            <option value="sku">SKU</option>
          </select>
        </div>
        {scope !== 'global' && (
          <div className="mb-3">
            <label className="block text-sm mb-1">{scope === 'sku' ? 'SKU 编码' : '品类编码'}</label>
            <input value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} className="w-full border px-2 py-1 rounded" />
          </div>
        )}
        {type === 'ALERT' && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">低库存阈值</label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">严重级别</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value as 'low' | 'medium' | 'high')} className="w-full border px-2 py-1 rounded">
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </div>
          </>
        )}
        {type === 'REORDER' && (
          <>
            <div className="mb-3">
              <label className="block text-sm mb-1">触发补货数量 (低于此值时)</label>
              <input type="number" value={triggerQty} onChange={(e) => setTriggerQty(Number(e.target.value))} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-3">
              <label className="block text-sm mb-1">补货数量</label>
              <input type="number" value={orderQty} onChange={(e) => setOrderQty(Number(e.target.value))} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-sm mb-1">供应商</label>
              <input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full border px-2 py-1 rounded" />
            </div>
          </>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1 border rounded">取消</button>
          <button onClick={handleCreate} disabled={!name.trim()} className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50">
            创建
          </button>
        </div>
      </div>
    </div>
  )
}
