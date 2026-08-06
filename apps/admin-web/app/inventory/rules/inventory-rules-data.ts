import { apiFetch } from '../../api/_client'

export type RuleType = 'ALERT' | 'REORDER'
export type RuleStatus = 'ENABLED' | 'DISABLED'

export interface InventoryRule {
  id: string
  tenantId: string
  type: RuleType
  name: string
  description: string
  scope: 'sku' | 'category' | 'global'
  scopeValue: string
  threshold: number
  severity: 'low' | 'medium' | 'high'
  triggerQty: number
  orderQty: number
  supplier: string
  status: RuleStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface InventoryRulesSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  tenantId: string
  rules: InventoryRule[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const INVENTORY_RULES_API_BASE = '/api/inventory/rules'

export const FALLBACK_INVENTORY_RULES: InventoryRule[] = [
  {
    id: 'rule-001',
    tenantId: 'demo-tenant',
    type: 'ALERT',
    name: '核心 SKU 低库存预警',
    description: '当热门 SKU 的可用库存低于阈值时触发治理告警。',
    scope: 'sku',
    scopeValue: 'SKU-USB-C-001',
    threshold: 30,
    severity: 'high',
    triggerQty: 0,
    orderQty: 0,
    supplier: '',
    status: 'ENABLED',
    version: 2,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-20T09:30:00.000Z',
  },
  {
    id: 'rule-002',
    tenantId: 'demo-tenant',
    type: 'ALERT',
    name: '游戏配件分类预警',
    description: '针对游戏配件分类的低库存阈值预警。',
    scope: 'category',
    scopeValue: 'game-accessory',
    threshold: 50,
    severity: 'medium',
    triggerQty: 0,
    orderQty: 0,
    supplier: '',
    status: 'ENABLED',
    version: 1,
    createdAt: '2026-07-04T00:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
  },
  {
    id: 'rule-003',
    tenantId: 'demo-tenant',
    type: 'REORDER',
    name: '低于 20 自动补货',
    description: '热门周边低于 20 件时自动创建补货任务。',
    scope: 'sku',
    scopeValue: 'SKU-HEADSET-002',
    threshold: 0,
    severity: 'low',
    triggerQty: 20,
    orderQty: 120,
    supplier: '示例供应商 A',
    status: 'ENABLED',
    version: 4,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-21T08:15:00.000Z',
  },
  {
    id: 'rule-004',
    tenantId: 'demo-tenant',
    type: 'REORDER',
    name: '全局补货保护规则',
    description: '当全局库存跌破红线时为采购团队生成补货清单。',
    scope: 'global',
    scopeValue: '*',
    threshold: 0,
    severity: 'low',
    triggerQty: 100,
    orderQty: 600,
    supplier: '示例供应商 B',
    status: 'DISABLED',
    version: 1,
    createdAt: '2026-07-11T00:00:00.000Z',
    updatedAt: '2026-07-22T15:40:00.000Z',
  },
]

function resolveAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_ADMIN_WEB_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeInventoryRule(value: unknown, tenantId: string, index: number): InventoryRule {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const type = asString(record.type, 'ALERT')
  const severity = asString(record.severity, 'medium')
  const status = asString(record.status, 'ENABLED')
  const scope = asString(record.scope, 'global')

  return {
    id: asString(record.id, `inventory-rule-${index + 1}`),
    tenantId: asString(record.tenantId, tenantId),
    type: type === 'REORDER' ? 'REORDER' : 'ALERT',
    name: asString(record.name, `库存规则 ${index + 1}`),
    description: asString(record.description, '未提供描述'),
    scope:
      scope === 'sku' || scope === 'category'
        ? scope
        : 'global',
    scopeValue: asString(record.scopeValue, scope === 'global' ? '*' : 'UNSCOPED'),
    threshold: asNumber(record.threshold, 0),
    severity:
      severity === 'low' || severity === 'high'
        ? severity
        : 'medium',
    triggerQty: asNumber(record.triggerQty, 0),
    orderQty: asNumber(record.orderQty, 0),
    supplier: asString(record.supplier, ''),
    status: status === 'DISABLED' ? 'DISABLED' : 'ENABLED',
    version: asNumber(record.version, 1),
    createdAt: asString(record.createdAt, new Date().toISOString()),
    updatedAt: asString(record.updatedAt, new Date().toISOString()),
  }
}

function cloneFallbackRules(tenantId: string): InventoryRule[] {
  return FALLBACK_INVENTORY_RULES.map((rule) => ({ ...rule, tenantId }))
}

export async function loadInventoryRulesSnapshot(
  tenantId = 'demo-tenant'
): Promise<InventoryRulesSnapshot> {
  const normalizedTenantId = tenantId.trim() || 'demo-tenant'

  try {
    const response = await apiFetch(
      `${resolveAppBaseUrl()}${INVENTORY_RULES_API_BASE}?tenantId=${encodeURIComponent(
        normalizedTenantId
      )}`,
      { cache: 'no-store' }
    )

    if (!response.ok) {
      throw new Error(`inventory rules upstream failed: ${response.status}`)
    }

    const payload = (await response.json()) as {
      rules?: unknown[]
      generatedAt?: string
    }
    const rules = Array.isArray(payload.rules)
      ? payload.rules.map((rule, index) => normalizeInventoryRule(rule, normalizedTenantId, index))
      : []

    return {
      deliveryMode: 'api',
      sourceLabel: 'inventory rules api snapshot',
      tenantId: normalizedTenantId,
      rules,
      generatedAt: asString(payload.generatedAt, new Date().toISOString()),
      controlPlaneSource: 'loadInventoryRulesSnapshot -> /api/inventory/rules',
      businessDataSource: 'inventory rules upstream records',
      refreshPath: 'InventoryRulesPage -> loadInventoryRulesSnapshot',
      note: '当前页面直接消费 inventory rules 服务端快照。',
    }
  } catch (error) {
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'inventory rules fallback snapshot',
      tenantId: normalizedTenantId,
      rules: cloneFallbackRules(normalizedTenantId),
      generatedAt: new Date().toISOString(),
      controlPlaneSource:
        'loadInventoryRulesSnapshot fallback -> FALLBACK_INVENTORY_RULES',
      businessDataSource: 'local inventory rule samples',
      refreshPath: 'InventoryRulesPage -> loadInventoryRulesSnapshot',
      note: '当前页面已回退到本地库存规则样本，不可作为闭环复签证据。',
      error:
        error instanceof Error
          ? error.message
          : '库存规则接口不可达，已切换到 fallback 快照。',
    }
  }
}
