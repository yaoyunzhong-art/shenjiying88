import { apiFetchJson } from '../api/_client'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface ProcurementOrder {
  id: string
  orderNo: string
  supplierName: string
  supplierId: string
  items: Array<{ name: string; quantity: number; unitPriceCents: number; totalCents: number }>
  totalCents: number
  status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'received' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  department: string
  requester: string
  approver?: string
  storeName?: string
  expectedDate?: string
  receivedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ProcurementSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  orders: ProcurementOrder[]
  generatedAt: string
  error?: string
}

interface BackendItem {
  id: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  receivedQuantity: number
}

interface BackendOrder {
  id: string
  orderNo: string
  supplierId: string
  supplierName: string
  status: string
  totalAmount: number
  items: BackendItem[]
  remark?: string
  orderedAt: string
  expectedAt: string
  receivedAt?: string
  tenantId: string
  createdAt: string
}

export const defaultOrders: ProcurementOrder[] = [
  {
    id: 'po-1',
    orderNo: 'PO-20260718-001',
    supplierName: '华强电子',
    supplierId: 's1',
    items: [{ name: '收银机主板', quantity: 5, unitPriceCents: 120000, totalCents: 600000 }],
    totalCents: 600000,
    status: 'submitted',
    priority: 'high',
    department: '技术部',
    requester: '张工',
    storeName: '总部',
    createdAt: '2026-07-18T09:00:00Z',
    updatedAt: '2026-07-18T09:00:00Z',
  },
  {
    id: 'po-2',
    orderNo: 'PO-20260718-002',
    supplierName: '益智玩具厂',
    supplierId: 's2',
    items: [
      { name: '扭蛋', quantity: 200, unitPriceCents: 1500, totalCents: 300000 },
      { name: '盲盒', quantity: 100, unitPriceCents: 3500, totalCents: 350000 },
    ],
    totalCents: 650000,
    status: 'approved',
    priority: 'medium',
    department: '运营部',
    requester: '李运营',
    storeName: '北京朝阳店',
    approver: '王经理',
    expectedDate: '2026-07-22',
    createdAt: '2026-07-17T14:00:00Z',
    updatedAt: '2026-07-18T08:00:00Z',
  },
  {
    id: 'po-3',
    orderNo: 'PO-20260717-001',
    supplierName: '天地餐饮',
    supplierId: 's3',
    items: [{ name: '饮料原料', quantity: 50, unitPriceCents: 8000, totalCents: 400000 }],
    totalCents: 400000,
    status: 'received',
    priority: 'low',
    department: '餐饮部',
    requester: '赵主管',
    storeName: '广州天河店',
    approver: '刘总监',
    expectedDate: '2026-07-16',
    receivedDate: '2026-07-17',
    createdAt: '2026-07-15T10:00:00Z',
    updatedAt: '2026-07-17T16:00:00Z',
  },
  {
    id: 'po-4',
    orderNo: 'PO-20260716-003',
    supplierName: '杭州动漫科技',
    supplierId: 's4',
    items: [{ name: '动漫手办', quantity: 30, unitPriceCents: 25000, totalCents: 750000 }],
    totalCents: 750000,
    status: 'shipped',
    priority: 'urgent',
    department: '营销部',
    requester: '陈营销',
    storeName: '上海南京路店',
    approver: '王经理',
    expectedDate: '2026-07-20',
    createdAt: '2026-07-16T11:00:00Z',
    updatedAt: '2026-07-18T06:00:00Z',
  },
  {
    id: 'po-5',
    orderNo: 'PO-20260715-002',
    supplierName: '本地清洁用品',
    supplierId: 's5',
    items: [
      { name: '清洁剂', quantity: 100, unitPriceCents: 2500, totalCents: 250000 },
      { name: '垃圾袋', quantity: 500, unitPriceCents: 200, totalCents: 100000 },
    ],
    totalCents: 350000,
    status: 'draft',
    priority: 'low',
    department: '后勤部',
    requester: '孙权',
    storeName: '深圳南山店',
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-07-15T08:00:00Z',
  },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveProcurementApiBaseUrl(): string {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) {
    return `${DEFAULT_API_ORIGIN}/api/v1/`
  }
  if (normalized.endsWith('/api/v1') || normalized.endsWith('/api/v1/')) {
    return ensureTrailingSlash(normalized)
  }
  if (normalized.endsWith('/api') || normalized.endsWith('/api/')) {
    return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/v1`)
  }
  return ensureTrailingSlash(`${normalized.replace(/\/$/, '')}/api/v1`)
}

function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new Error(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

function mapStatus(backendStatus: string): ProcurementOrder['status'] {
  const map: Record<string, ProcurementOrder['status']> = {
    DRAFT: 'draft',
    PENDING_APPROVAL: 'submitted',
    APPROVED: 'approved',
    SHIPPED: 'shipped',
    PARTIAL: 'shipped',
    RECEIVED: 'received',
    CANCELLED: 'cancelled',
  }
  return map[backendStatus] ?? 'draft'
}

function mapToFrontendOrder(order: BackendOrder): ProcurementOrder {
  const totalCents = Math.round(order.totalAmount * 100)
  const items = order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPriceCents: Math.round(item.unitPrice * 100),
    totalCents: Math.round(item.quantity * item.unitPrice * 100),
  }))

  return {
    id: order.id,
    orderNo: order.orderNo,
    supplierName: order.supplierName,
    supplierId: order.supplierId,
    items,
    totalCents,
    status: mapStatus(order.status),
    priority: 'medium',
    department: '采购部',
    requester: '系统',
    storeName: '总部',
    approver:
      order.status === 'APPROVED' || order.status === 'SHIPPED' || order.status === 'RECEIVED'
        ? '管理员'
        : undefined,
    expectedDate: order.expectedAt ? order.expectedAt.slice(0, 10) : undefined,
    receivedDate: order.receivedAt ? order.receivedAt.slice(0, 10) : undefined,
    notes: order.remark,
    createdAt: order.createdAt,
    updatedAt: order.orderedAt,
  }
}

async function fetchProcurementOrders(): Promise<ProcurementOrder[]> {
  const upstreamUrl = new URL('procurement-orders', resolveProcurementApiBaseUrl()).toString()
  const data = await apiFetchJson<BackendOrder[] | { orders?: BackendOrder[] }>(upstreamUrl)
  const orders = Array.isArray(data) ? data : Array.isArray(data.orders) ? data.orders : []
  return orders.map(mapToFrontendOrder)
}

export async function loadProcurementSnapshot(): Promise<ProcurementSnapshotDelivery> {
  try {
    const orders = await fetchProcurementOrders()
    return {
      deliveryMode: 'api',
      orders,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      orders: defaultOrders,
      generatedAt: new Date().toISOString(),
      error: '采购单实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
