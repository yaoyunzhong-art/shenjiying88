export interface InventoryItem {
  id: string
  tenantId: string
  sku: string
  name: string
  unit: string
  totalQty: number
  reservedQty: number
  availableQty: number
  lowStockThreshold: number
  unitPriceCents: number
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  version: number
}

export interface InventoryPageSnapshot {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: string
  tenantId: string
  items: InventoryItem[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const INVENTORY_API_BASE = '/api/inventory'

export const FALLBACK_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 'inv-001',
    tenantId: 'demo-tenant',
    sku: 'SKU-USB-C-001',
    name: 'USB-C 数据线',
    unit: '条',
    totalQty: 500,
    reservedQty: 20,
    availableQty: 480,
    lowStockThreshold: 80,
    unitPriceCents: 2990,
    status: 'ACTIVE',
    version: 3,
  },
  {
    id: 'inv-002',
    tenantId: 'demo-tenant',
    sku: 'SKU-HEADSET-002',
    name: '限量耳机',
    unit: '副',
    totalQty: 32,
    reservedQty: 6,
    availableQty: 26,
    lowStockThreshold: 20,
    unitPriceCents: 129900,
    status: 'ACTIVE',
    version: 5,
  },
  {
    id: 'inv-003',
    tenantId: 'demo-tenant',
    sku: 'SKU-GAME-003',
    name: '游戏手柄',
    unit: '个',
    totalQty: 18,
    reservedQty: 4,
    availableQty: 14,
    lowStockThreshold: 15,
    unitPriceCents: 21900,
    status: 'INACTIVE',
    version: 2,
  },
  {
    id: 'inv-004',
    tenantId: 'demo-tenant',
    sku: 'SKU-CUP-004',
    name: '饮品杯套装',
    unit: '套',
    totalQty: 120,
    reservedQty: 60,
    availableQty: 60,
    lowStockThreshold: 50,
    unitPriceCents: 990,
    status: 'ARCHIVED',
    version: 1,
  },
  {
    id: 'inv-005',
    tenantId: 'demo-tenant',
    sku: 'SKU-BATTERY-005',
    name: '备用电池',
    unit: '块',
    totalQty: 40,
    reservedQty: 28,
    availableQty: 12,
    lowStockThreshold: 18,
    unitPriceCents: 6900,
    status: 'ACTIVE',
    version: 4,
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

function normalizeInventoryItem(value: unknown, tenantId: string, index: number): InventoryItem {
  const record = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const totalQty = asNumber(record.totalQty, 0)
  const reservedQty = asNumber(record.reservedQty, 0)
  const availableQty =
    typeof record.availableQty === 'number' && Number.isFinite(record.availableQty)
      ? record.availableQty
      : Math.max(totalQty - reservedQty, 0)
  const status = asString(record.status, 'ACTIVE')

  return {
    id: asString(record.id, `inventory-${index + 1}`),
    tenantId: asString(record.tenantId, tenantId),
    sku: asString(record.sku, `SKU-${String(index + 1).padStart(3, '0')}`),
    name: asString(record.name, `库存项 ${index + 1}`),
    unit: asString(record.unit, '件'),
    totalQty,
    reservedQty,
    availableQty,
    lowStockThreshold: asNumber(record.lowStockThreshold, 0),
    unitPriceCents: asNumber(record.unitPriceCents, 0),
    status:
      status === 'INACTIVE' || status === 'ARCHIVED'
        ? (status as InventoryItem['status'])
        : 'ACTIVE',
    version: asNumber(record.version, 1),
  }
}

function cloneFallbackItems(tenantId: string): InventoryItem[] {
  return FALLBACK_INVENTORY_ITEMS.map((item) => ({ ...item, tenantId }))
}

export async function loadInventoryPageSnapshot(
  tenantId = 'demo-tenant'
): Promise<InventoryPageSnapshot> {
  const normalizedTenantId = tenantId.trim() || 'demo-tenant'

  try {
    const response = await fetch(
      `${resolveAppBaseUrl()}${INVENTORY_API_BASE}?tenantId=${encodeURIComponent(normalizedTenantId)}`,
      {
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      throw new Error(`inventory upstream failed: ${response.status}`)
    }

    const payload = (await response.json()) as { items?: unknown[]; generatedAt?: string }
    const items = Array.isArray(payload.items)
      ? payload.items.map((item, index) => normalizeInventoryItem(item, normalizedTenantId, index))
      : []

    return {
      deliveryMode: 'api',
      sourceLabel: 'inventory api snapshot',
      tenantId: normalizedTenantId,
      items,
      generatedAt: asString(payload.generatedAt) || new Date().toISOString(),
      controlPlaneSource: 'loadInventoryPageSnapshot -> /api/inventory',
      businessDataSource: 'inventory upstream records',
      refreshPath: 'InventoryPage -> loadInventoryPageSnapshot',
      note: '当前页面直接消费 inventory 服务端快照。',
    }
  } catch (error) {
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'inventory fallback snapshot',
      tenantId: normalizedTenantId,
      items: cloneFallbackItems(normalizedTenantId),
      generatedAt: new Date().toISOString(),
      controlPlaneSource: 'loadInventoryPageSnapshot fallback -> FALLBACK_INVENTORY_ITEMS',
      businessDataSource: 'local inventory samples',
      refreshPath: 'InventoryPage -> loadInventoryPageSnapshot',
      note: '当前页面已回退到本地库存样本，不可作为闭环复签证据。',
      error:
        error instanceof Error
          ? error.message
          : '库存实时接口不可达，已切换到 fallback 快照。',
    }
  }
}
