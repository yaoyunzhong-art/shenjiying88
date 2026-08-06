import { apiFetchJson } from './api/_client'

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type OrderChannel = 'online' | 'offline' | 'miniapp' | 'phone'

export interface OrderItem {
  id: string
  orderNo: string
  customerName: string
  customerPhone: string
  channel: OrderChannel
  status: OrderStatus
  itemCount: number
  totalAmount: number
  discountAmount: number
  paidAmount: number
  storeName: string
  marketCode: string
  salesClerk: string
  note: string
  createdAt: string
  updatedAt: string
}

export interface OrdersSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  orders: OrderItem[]
  generatedAt: string
  error?: string
}

export const ORDER_STATUS_MAP: Record<
  OrderStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }
> = {
  pending: { label: '待确认', variant: 'warning' },
  confirmed: { label: '已确认', variant: 'info' },
  processing: { label: '处理中', variant: 'info' },
  shipped: { label: '已发货', variant: 'neutral' },
  delivered: { label: '已签收', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
  refunded: { label: '已退款', variant: 'danger' },
}

export const ORDER_CHANNEL_MAP: Record<
  OrderChannel,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }
> = {
  online: { label: '线上', variant: 'info' },
  offline: { label: '线下', variant: 'neutral' },
  miniapp: { label: '小程序', variant: 'success' },
  phone: { label: '电话', variant: 'warning' },
}

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]
export const ORDER_CHANNELS: OrderChannel[] = ['online', 'offline', 'miniapp', 'phone']

export const ORDER_STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
}

export const MOCK_ORDERS: OrderItem[] = [
  {
    id: 'ord-001',
    orderNo: 'ORD-20260620-0001',
    customerName: '张三',
    customerPhone: '138****1234',
    channel: 'online',
    status: 'delivered',
    itemCount: 3,
    totalAmount: 256.80,
    discountAmount: 25.00,
    paidAmount: 231.80,
    storeName: '朝阳旗舰店',
    marketCode: 'CN-BJ',
    salesClerk: '小李',
    note: '周末配送，放门口',
    createdAt: '2026-06-20 10:30:00',
    updatedAt: '2026-06-22 15:20:00',
  },
  {
    id: 'ord-002',
    orderNo: 'ORD-20260621-0002',
    customerName: '李四',
    customerPhone: '139****5678',
    channel: 'miniapp',
    status: 'shipped',
    itemCount: 5,
    totalAmount: 489.00,
    discountAmount: 50.00,
    paidAmount: 439.00,
    storeName: '浦东体验店',
    marketCode: 'CN-SH',
    salesClerk: '小王',
    note: '',
    createdAt: '2026-06-21 14:15:00',
    updatedAt: '2026-06-23 09:45:00',
  },
  {
    id: 'ord-003',
    orderNo: 'ORD-20260622-0003',
    customerName: '王五',
    customerPhone: '136****9012',
    channel: 'offline',
    status: 'processing',
    itemCount: 2,
    totalAmount: 128.00,
    discountAmount: 0,
    paidAmount: 128.00,
    storeName: '朝阳旗舰店',
    marketCode: 'CN-BJ',
    salesClerk: '小张',
    note: '到店自取',
    createdAt: '2026-06-22 16:00:00',
    updatedAt: '2026-06-23 08:30:00',
  },
  {
    id: 'ord-004',
    orderNo: 'ORD-20260622-0004',
    customerName: '赵六',
    customerPhone: '137****3456',
    channel: 'online',
    status: 'confirmed',
    itemCount: 1,
    totalAmount: 88.00,
    discountAmount: 10.00,
    paidAmount: 78.00,
    storeName: '广州天河店',
    marketCode: 'CN-GZ',
    salesClerk: '小刘',
    note: '',
    createdAt: '2026-06-22 18:20:00',
    updatedAt: '2026-06-23 07:10:00',
  },
  {
    id: 'ord-005',
    orderNo: 'ORD-20260623-0005',
    customerName: '孙七',
    customerPhone: '135****7890',
    channel: 'phone',
    status: 'pending',
    itemCount: 4,
    totalAmount: 356.00,
    discountAmount: 0,
    paidAmount: 0,
    storeName: '深圳南山店',
    marketCode: 'CN-SZ',
    salesClerk: '小陈',
    note: '需电话确认地址',
    createdAt: '2026-06-23 10:05:00',
    updatedAt: '2026-06-23 10:05:00',
  },
  {
    id: 'ord-006',
    orderNo: 'ORD-20260623-0006',
    customerName: '周八',
    customerPhone: '133****1111',
    channel: 'miniapp',
    status: 'cancelled',
    itemCount: 2,
    totalAmount: 156.00,
    discountAmount: 20.00,
    paidAmount: 0,
    storeName: '杭州西湖店',
    marketCode: 'CN-HZ',
    salesClerk: '小周',
    note: '客户主动取消',
    createdAt: '2026-06-23 11:30:00',
    updatedAt: '2026-06-23 12:45:00',
  },
  {
    id: 'ord-007',
    orderNo: 'ORD-20260623-0007',
    customerName: '吴九',
    customerPhone: '131****2222',
    channel: 'online',
    status: 'refunded',
    itemCount: 1,
    totalAmount: 68.00,
    discountAmount: 0,
    paidAmount: 68.00,
    storeName: '朝阳旗舰店',
    marketCode: 'CN-BJ',
    salesClerk: '小李',
    note: '商品与描述不符，已全额退款',
    createdAt: '2026-06-21 09:00:00',
    updatedAt: '2026-06-23 14:00:00',
  },
  {
    id: 'ord-008',
    orderNo: 'ORD-20260623-0008',
    customerName: '郑十',
    customerPhone: '132****3333',
    channel: 'offline',
    status: 'delivered',
    itemCount: 6,
    totalAmount: 720.00,
    discountAmount: 100.00,
    paidAmount: 620.00,
    storeName: '成都春熙店',
    marketCode: 'CN-CD',
    salesClerk: '小郑',
    note: '企业团购',
    createdAt: '2026-06-22 13:00:00',
    updatedAt: '2026-06-23 16:30:00',
  },
  {
    id: 'ord-009',
    orderNo: 'ORD-20260623-0009',
    customerName: '冯十一',
    customerPhone: '134****4444',
    channel: 'online',
    status: 'processing',
    itemCount: 3,
    totalAmount: 199.00,
    discountAmount: 30.00,
    paidAmount: 169.00,
    storeName: '武汉光谷店',
    marketCode: 'CN-WH',
    salesClerk: '小冯',
    note: '',
    createdAt: '2026-06-23 08:00:00',
    updatedAt: '2026-06-23 10:00:00',
  },
  {
    id: 'ord-010',
    orderNo: 'ORD-20260623-0010',
    customerName: '陈十二',
    customerPhone: '130****5555',
    channel: 'phone',
    status: 'shipped',
    itemCount: 2,
    totalAmount: 245.00,
    discountAmount: 15.00,
    paidAmount: 230.00,
    storeName: '南京新街口店',
    marketCode: 'CN-NJ',
    salesClerk: '小马',
    note: '加急配送',
    createdAt: '2026-06-23 06:30:00',
    updatedAt: '2026-06-23 18:45:00',
  },
  {
    id: 'ord-011',
    orderNo: 'ORD-20260623-0011',
    customerName: '褚十三',
    customerPhone: '138****6666',
    channel: 'miniapp',
    status: 'pending',
    itemCount: 1,
    totalAmount: 45.00,
    discountAmount: 5.00,
    paidAmount: 0,
    storeName: '浦东体验店',
    marketCode: 'CN-SH',
    salesClerk: '小王',
    note: '',
    createdAt: '2026-06-23 19:00:00',
    updatedAt: '2026-06-23 19:00:00',
  },
  {
    id: 'ord-012',
    orderNo: 'ORD-20260623-0012',
    customerName: '卫十四',
    customerPhone: '139****7777',
    channel: 'offline',
    status: 'confirmed',
    itemCount: 4,
    totalAmount: 320.00,
    discountAmount: 40.00,
    paidAmount: 280.00,
    storeName: '深圳南山店',
    marketCode: 'CN-SZ',
    salesClerk: '小陈',
    note: '生日折扣',
    createdAt: '2026-06-23 15:30:00',
    updatedAt: '2026-06-23 17:00:00',
  },
]

const DEFAULT_API_ORIGIN = 'http://localhost:3001'

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveOrdersApiBaseUrl(): string {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toArrayOfRecords(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(isRecord)
}

function extractOrderRecords(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return toArrayOfRecords(payload)
  }
  if (!isRecord(payload)) {
    return []
  }

  const directItems = toArrayOfRecords(payload.items)
  if (directItems.length > 0) {
    return directItems
  }

  const directData = toArrayOfRecords(payload.data)
  if (directData.length > 0) {
    return directData
  }

  if (isRecord(payload.data)) {
    const nestedItems = toArrayOfRecords(payload.data.items)
    if (nestedItems.length > 0) {
      return nestedItems
    }
    const nestedData = toArrayOfRecords(payload.data.data)
    if (nestedData.length > 0) {
      return nestedData
    }
  }

  return []
}

function readNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function readOrderChannel(value: unknown): OrderChannel {
  const channel = typeof value === 'string' ? value.toLowerCase() : ''
  if (channel === 'offline' || channel === 'miniapp' || channel === 'phone') {
    return channel
  }
  return 'online'
}

function mapOrderStatus(value: unknown): OrderStatus {
  const backendStatus = typeof value === 'string' ? value.toLowerCase() : ''
  if (backendStatus === 'paid') return 'confirmed'
  if (backendStatus === 'fulfilled') return 'delivered'
  if (backendStatus === 'processing') return 'processing'
  if (backendStatus === 'shipped') return 'shipped'
  if (backendStatus === 'refunded' || backendStatus === 'partially_refunded') return 'refunded'
  if (backendStatus === 'cancelled' || backendStatus === 'canceled' || backendStatus === 'timeout') {
    return 'cancelled'
  }
  if (backendStatus === 'confirmed') return 'confirmed'
  if (backendStatus === 'draft' || backendStatus === 'pending') return 'pending'
  return 'pending'
}

function readItemsCount(record: Record<string, unknown>): number {
  if (typeof record.itemCount === 'number' && record.itemCount > 0) {
    return record.itemCount
  }
  if (Array.isArray(record.items)) {
    return record.items.length
  }
  return 0
}

export function mapApiOrderToOrderItem(apiOrder: Record<string, unknown>): OrderItem {
  const totalAmount = readNumber(apiOrder.totalAmount) / 100
  const discountAmount = readNumber(apiOrder.discountCents) / 100
  const paidAmount = readNumber(apiOrder.paidAmount) / 100

  return {
    id: readString(apiOrder.orderId, readString(apiOrder.id, '')),
    orderNo: readString(apiOrder.orderNo, readString(apiOrder.orderId, '')),
    customerName: readString(apiOrder.memberId, '—'),
    customerPhone: '',
    channel: readOrderChannel(apiOrder.channel),
    status: mapOrderStatus(apiOrder.status),
    itemCount: readItemsCount(apiOrder),
    totalAmount,
    discountAmount,
    paidAmount,
    storeName: readString(apiOrder.storeName, '—'),
    marketCode: readString(apiOrder.marketCode, readString(apiOrder.currency, 'CNY')),
    salesClerk: readString(apiOrder.salesClerk, '—'),
    note: readString(apiOrder.note, ''),
    createdAt: readString(apiOrder.createdAt, '—'),
    updatedAt: readString(apiOrder.updatedAt, readString(apiOrder.createdAt, '—')),
  }
}

async function fetchOrders(): Promise<OrderItem[]> {
  const upstreamUrl = new URL('transactions?type=order', resolveOrdersApiBaseUrl()).toString()
  const payload = await apiFetchJson<unknown>(upstreamUrl)
  const records = extractOrderRecords(payload)
  if (records.length === 0) {
    throw new Error('orders upstream returned no items')
  }
  return records.map(mapApiOrderToOrderItem)
}

function getLatestOrderTimestamp(orders: OrderItem[]): string {
  if (orders.length === 0) {
    return new Date().toISOString()
  }
  return orders.reduce((latest, order) => {
    const candidate = order.updatedAt || order.createdAt
    return candidate > latest ? candidate : latest
  }, orders[0]!.updatedAt || orders[0]!.createdAt)
}

export async function loadOrdersSnapshot(): Promise<OrdersSnapshotDelivery> {
  try {
    const orders = await fetchOrders()
    return {
      deliveryMode: 'api',
      orders,
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      orders: MOCK_ORDERS,
      generatedAt: getLatestOrderTimestamp(MOCK_ORDERS),
      error: '订单实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
