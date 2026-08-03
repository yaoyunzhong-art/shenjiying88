import {
  FALLBACK_INVENTORY_ITEMS,
  INVENTORY_API_BASE,
  type InventoryItem,
} from '../inventory-data'

export interface StockMovement {
  id: string
  type: 'STOCK_IN' | 'STOCK_OUT'
  qty: number
  reason: string
  performedBy: string
  createdAt: string
}

export interface InventoryDetailSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  tenantId: string
  itemId: string
  item: InventoryItem | null
  movements: StockMovement[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

const FALLBACK_MOVEMENTS: StockMovement[] = [
  {
    id: 'move-001',
    type: 'STOCK_IN',
    qty: 100,
    reason: '采购到货',
    performedBy: 'admin',
    createdAt: '2026-07-24T09:00:00.000Z',
  },
  {
    id: 'move-002',
    type: 'STOCK_OUT',
    qty: 16,
    reason: '门店补货出库',
    performedBy: 'ops',
    createdAt: '2026-07-24T12:30:00.000Z',
  },
  {
    id: 'move-003',
    type: 'STOCK_IN',
    qty: 24,
    reason: '盘点补差',
    performedBy: 'auditor',
    createdAt: '2026-07-25T10:15:00.000Z',
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

function normalizeInventoryItem(record: unknown, tenantId: string, itemId: string): InventoryItem | null {
  if (!record || typeof record !== 'object') {
    return null
  }

  const value = record as Record<string, unknown>
  const totalQty = asNumber(value.totalQty, 0)
  const reservedQty = asNumber(value.reservedQty, 0)
  const availableQty =
    typeof value.availableQty === 'number' && Number.isFinite(value.availableQty)
      ? value.availableQty
      : Math.max(totalQty - reservedQty, 0)
  const status = asString(value.status, 'ACTIVE')

  return {
    id: asString(value.id, itemId),
    tenantId: asString(value.tenantId, tenantId),
    sku: asString(value.sku, 'SKU-UNKNOWN'),
    name: asString(value.name, '未命名库存项'),
    unit: asString(value.unit, '件'),
    totalQty,
    reservedQty,
    availableQty,
    lowStockThreshold: asNumber(value.lowStockThreshold, 0),
    unitPriceCents: asNumber(value.unitPriceCents, 0),
    status:
      status === 'INACTIVE' || status === 'ARCHIVED'
        ? (status as InventoryItem['status'])
        : 'ACTIVE',
    version: asNumber(value.version, 1),
  }
}

function normalizeMovement(record: unknown, index: number): StockMovement {
  const value = record && typeof record === 'object' ? (record as Record<string, unknown>) : {}
  const type = asString(value.type, 'STOCK_IN')

  return {
    id: asString(value.id, `movement-${index + 1}`),
    type: type === 'STOCK_OUT' ? 'STOCK_OUT' : 'STOCK_IN',
    qty: asNumber(value.qty, 0),
    reason: asString(value.reason, '来源未提供原因'),
    performedBy: asString(value.performedBy, 'system'),
    createdAt: asString(value.createdAt, new Date().toISOString()),
  }
}

function resolveFallbackItem(itemId: string, tenantId: string): InventoryItem | null {
  const fallback =
    FALLBACK_INVENTORY_ITEMS.find((item) => item.id === itemId) ??
    FALLBACK_INVENTORY_ITEMS.find((item) => item.sku === itemId) ??
    null

  return fallback ? { ...fallback, id: itemId, tenantId } : null
}

function cloneFallbackMovements(): StockMovement[] {
  return FALLBACK_MOVEMENTS.map((item) => ({ ...item }))
}

export async function loadInventoryDetailSnapshot(
  itemId: string,
  tenantId = 'demo-tenant'
): Promise<InventoryDetailSnapshot> {
  const normalizedItemId = itemId.trim()
  const normalizedTenantId = tenantId.trim() || 'demo-tenant'
  const detailUrl = `${resolveAppBaseUrl()}${INVENTORY_API_BASE}/${encodeURIComponent(
    normalizedItemId
  )}?tenantId=${encodeURIComponent(normalizedTenantId)}`
  const movementUrl = `${resolveAppBaseUrl()}${INVENTORY_API_BASE}/${encodeURIComponent(
    normalizedItemId
  )}/movements?tenantId=${encodeURIComponent(normalizedTenantId)}&limit=50`

  try {
    const [detailResponse, movementResponse] = await Promise.all([
      fetch(detailUrl, { cache: 'no-store' }),
      fetch(movementUrl, { cache: 'no-store' }),
    ])

    if (!detailResponse.ok) {
      throw new Error(`inventory detail upstream failed: ${detailResponse.status}`)
    }

    const detailPayload = (await detailResponse.json()) as {
      item?: unknown
      generatedAt?: string
    }
    const movementPayload = movementResponse.ok
      ? ((await movementResponse.json()) as { movements?: unknown[]; items?: unknown[] })
      : { movements: [] }

    const item = normalizeInventoryItem(
      detailPayload.item ?? detailPayload,
      normalizedTenantId,
      normalizedItemId
    )
    const movements = Array.isArray(movementPayload.movements)
      ? movementPayload.movements.map(normalizeMovement)
      : Array.isArray(movementPayload.items)
        ? movementPayload.items.map(normalizeMovement)
        : []

    return {
      deliveryMode: 'api',
      sourceLabel: 'inventory detail api snapshot',
      tenantId: normalizedTenantId,
      itemId: normalizedItemId,
      item,
      movements,
      generatedAt: asString(detailPayload.generatedAt, new Date().toISOString()),
      controlPlaneSource: 'loadInventoryDetailSnapshot -> /api/inventory/:id + /movements',
      businessDataSource: 'inventory detail upstream record + stock movements',
      refreshPath: 'InventoryDetailPage -> loadInventoryDetailSnapshot',
      note: '当前页面直接消费 inventory detail 服务端快照。',
    }
  } catch (error) {
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'inventory detail fallback snapshot',
      tenantId: normalizedTenantId,
      itemId: normalizedItemId,
      item: resolveFallbackItem(normalizedItemId, normalizedTenantId),
      movements: cloneFallbackMovements(),
      generatedAt: new Date().toISOString(),
      controlPlaneSource:
        'loadInventoryDetailSnapshot fallback -> FALLBACK_INVENTORY_ITEMS + FALLBACK_MOVEMENTS',
      businessDataSource: 'local inventory detail samples',
      refreshPath: 'InventoryDetailPage -> loadInventoryDetailSnapshot',
      note: '当前页面已回退到本地库存详情样本，不可作为闭环复签证据。',
      error:
        error instanceof Error
          ? error.message
          : '库存详情实时接口不可达，已切换到 fallback 快照。',
    }
  }
}
