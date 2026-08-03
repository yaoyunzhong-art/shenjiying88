const DEFAULT_API_ORIGIN = 'http://localhost:3001'

export interface StoreOrder {
  id: string
  orderNo: string
  customer: string
  items: string
  amount: number
  paidAmount: number
  itemCount: number
  method: string
  status: 'completed' | 'pending' | 'refunded' | 'cancelled'
  time: string
  updatedAt: string
  channel: string
  note?: string
  contact?: string
}

export interface StoreOrdersSummary {
  total: number
  completed: number
  pending: number
  refunded: number
  cancelled: number
  grossAmount: number
  completedRevenue: number
  refundedAmount: number
}

export interface StoreOrdersSnapshotDelivery {
  deliveryMode: 'api' | 'fallback'
  sourceLabel: 'store-orders-api' | 'store-orders-fallback'
  storeId: string
  orders: StoreOrder[]
  summary: StoreOrdersSummary
  generatedAt: string
  error?: string
}

export const DEFAULT_STORE_ORDERS: StoreOrder[] = [
  {
    id: 'ord-store-001',
    orderNo: 'ORD-20260712-0001',
    customer: '张明',
    items: '游戏套餐 x1',
    amount: 168,
    paidAmount: 168,
    itemCount: 1,
    method: '微信',
    status: 'completed',
    time: '2026-07-12 14:30:00',
    updatedAt: '2026-07-12 14:35:00',
    channel: 'miniapp',
    contact: '138****1234',
  },
  {
    id: 'ord-store-002',
    orderNo: 'ORD-20260712-0002',
    customer: '李芳',
    items: '游戏币 x50',
    amount: 85,
    paidAmount: 85,
    itemCount: 1,
    method: '支付宝',
    status: 'completed',
    time: '2026-07-12 13:15:00',
    updatedAt: '2026-07-12 13:18:00',
    channel: 'online',
  },
  {
    id: 'ord-store-003',
    orderNo: 'ORD-20260712-0003',
    customer: '王强',
    items: '充值 200',
    amount: 200,
    paidAmount: 200,
    itemCount: 1,
    method: '微信',
    status: 'completed',
    time: '2026-07-12 12:00:00',
    updatedAt: '2026-07-12 12:05:00',
    channel: 'offline',
  },
  {
    id: 'ord-store-004',
    orderNo: 'ORD-20260712-0004',
    customer: '赵丽',
    items: '生日派对套餐',
    amount: 1280,
    paidAmount: 0,
    itemCount: 4,
    method: '刷卡',
    status: 'pending',
    time: '2026-07-12 10:00:00',
    updatedAt: '2026-07-12 10:00:00',
    channel: 'phone',
    note: '待确认库存',
    contact: '139****5678',
  },
  {
    id: 'ord-store-005',
    orderNo: 'ORD-20260711-0005',
    customer: '刘伟',
    items: 'VR 体验 30min',
    amount: 88,
    paidAmount: 88,
    itemCount: 1,
    method: '支付宝',
    status: 'completed',
    time: '2026-07-11 20:30:00',
    updatedAt: '2026-07-11 20:31:00',
    channel: 'miniapp',
  },
  {
    id: 'ord-store-006',
    orderNo: 'ORD-20260711-0006',
    customer: '陈静',
    items: '饮品 x3',
    amount: 45,
    paidAmount: 45,
    itemCount: 3,
    method: '现金',
    status: 'refunded',
    time: '2026-07-11 19:00:00',
    updatedAt: '2026-07-11 19:10:00',
    channel: 'offline',
    note: '已退款-重复收费',
  },
  {
    id: 'ord-store-007',
    orderNo: 'ORD-20260711-0007',
    customer: '杨磊',
    items: '台球 2h',
    amount: 60,
    paidAmount: 60,
    itemCount: 1,
    method: '微信',
    status: 'completed',
    time: '2026-07-11 18:00:00',
    updatedAt: '2026-07-11 18:01:00',
    channel: 'offline',
  },
  {
    id: 'ord-store-008',
    orderNo: 'ORD-20260711-0008',
    customer: '黄敏',
    items: '会员充值 500',
    amount: 500,
    paidAmount: 500,
    itemCount: 1,
    method: '支付宝',
    status: 'completed',
    time: '2026-07-11 16:30:00',
    updatedAt: '2026-07-11 16:31:00',
    channel: 'online',
  },
  {
    id: 'ord-store-009',
    orderNo: 'ORD-20260711-0009',
    customer: '周杰',
    items: '游戏币 x100 + 饮品',
    amount: 185,
    paidAmount: 0,
    itemCount: 2,
    method: '微信',
    status: 'cancelled',
    time: '2026-07-11 15:00:00',
    updatedAt: '2026-07-11 15:06:00',
    channel: 'miniapp',
    note: '用户取消',
  },
  {
    id: 'ord-store-010',
    orderNo: 'ORD-20260711-0010',
    customer: '吴芳',
    items: '会员充值 1000',
    amount: 1000,
    paidAmount: 1000,
    itemCount: 1,
    method: '微信',
    status: 'completed',
    time: '2026-07-11 14:00:00',
    updatedAt: '2026-07-11 14:05:00',
    channel: 'online',
  },
  {
    id: 'ord-store-011',
    orderNo: 'ORD-20260711-0011',
    customer: '郑鑫',
    items: '游戏币 x200',
    amount: 340,
    paidAmount: 0,
    itemCount: 1,
    method: '支付宝',
    status: 'pending',
    time: '2026-07-11 12:30:00',
    updatedAt: '2026-07-11 12:30:00',
    channel: 'online',
    note: '待支付确认',
  },
  {
    id: 'ord-store-012',
    orderNo: 'ORD-20260710-0012',
    customer: '孙丽',
    items: '生日派对套餐 B',
    amount: 880,
    paidAmount: 880,
    itemCount: 3,
    method: '微信',
    status: 'refunded',
    time: '2026-07-10 18:00:00',
    updatedAt: '2026-07-10 18:20:00',
    channel: 'miniapp',
    note: '退款-场地冲突',
  },
]

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

function resolveStoreOrdersApiBaseUrl(): string {
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

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function readNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
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
  }

  return []
}

function mapStoreOrderStatus(value: unknown): StoreOrder['status'] {
  const status = typeof value === 'string' ? value.toLowerCase() : ''
  if (
    status === 'paid' ||
    status === 'completed' ||
    status === 'delivered' ||
    status === 'fulfilled' ||
    status === 'shipped'
  ) {
    return 'completed'
  }
  if (status === 'refunded' || status === 'partially_refunded') {
    return 'refunded'
  }
  if (status === 'cancelled' || status === 'canceled' || status === 'timeout') {
    return 'cancelled'
  }
  return 'pending'
}

function mapPaymentMethod(value: unknown): string {
  const method = typeof value === 'string' ? value.toLowerCase() : ''
  if (method.includes('wechat') || method.includes('wx') || method.includes('weixin')) return '微信'
  if (method.includes('alipay') || method.includes('ali')) return '支付宝'
  if (method.includes('cash')) return '现金'
  if (method.includes('card') || method.includes('unionpay')) return '刷卡'
  return readString(value, '其他')
}

function mapOrderItems(record: Record<string, unknown>): string {
  if (typeof record.itemsSummary === 'string' && record.itemsSummary.trim().length > 0) {
    return record.itemsSummary
  }
  if (typeof record.itemSummary === 'string' && record.itemSummary.trim().length > 0) {
    return record.itemSummary
  }
  if (Array.isArray(record.items)) {
    const values = record.items
      .filter(isRecord)
      .map((item) => readString(item.title, readString(item.name, readString(item.skuTitle, ''))))
      .filter(Boolean)
    if (values.length > 0) {
      return values.join('、')
    }
  }
  return '未提供商品摘要'
}

function readItemCount(record: Record<string, unknown>): number {
  if (typeof record.itemCount === 'number' && record.itemCount > 0) {
    return record.itemCount
  }
  if (Array.isArray(record.items)) {
    return record.items.length
  }
  return 0
}

function matchesStore(record: Record<string, unknown>, storeId: string): boolean {
  const upstreamStoreId = readString(record.storeId, readString(record.storeCode, readString(record.shopId, '')))
  if (!upstreamStoreId) {
    return true
  }
  return upstreamStoreId === storeId
}

function mapApiOrderToStoreOrder(record: Record<string, unknown>): StoreOrder {
  const totalAmountCents = readNumber(record.totalAmount)
  const paidAmountCents = readNumber(record.paidAmount)
  const createdAt = readString(record.createdAt, '—')
  const updatedAt = readString(record.updatedAt, createdAt)

  return {
    id: readString(record.orderId, readString(record.id, '')),
    orderNo: readString(record.orderNo, readString(record.orderId, readString(record.id, ''))),
    customer: readString(
      record.customerName,
      readString(record.memberName, readString(record.memberId, '匿名会员'))
    ),
    items: mapOrderItems(record),
    amount: totalAmountCents / 100,
    paidAmount: (paidAmountCents || totalAmountCents) / 100,
    itemCount: readItemCount(record),
    method: mapPaymentMethod(
      record.paymentMethod ?? record.paymentChannel ?? record.method ?? record.channel
    ),
    status: mapStoreOrderStatus(record.status),
    time: createdAt,
    updatedAt,
    channel: readString(record.channel, readString(record.source, 'online')),
    note: readString(record.note, readString(record.remark, '')),
    contact: readString(record.customerPhone, readString(record.mobile, '')),
  }
}

async function fetchStoreOrders(storeId: string): Promise<StoreOrder[]> {
  const upstreamUrl = new URL(
    `transactions?type=order&storeId=${encodeURIComponent(storeId)}`,
    resolveStoreOrdersApiBaseUrl()
  ).toString()
  const response = await fetch(upstreamUrl, {
    method: 'GET',
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`store orders upstream failed: ${response.status}`)
  }
  const payload = unwrapApiPayload<unknown>(await response.json())
  const records = extractOrderRecords(payload).filter((record) => matchesStore(record, storeId))
  if (records.length === 0) {
    throw new Error('store orders upstream returned no items')
  }
  return records.map(mapApiOrderToStoreOrder)
}

function buildSummary(orders: StoreOrder[]): StoreOrdersSummary {
  return {
    total: orders.length,
    completed: orders.filter((order) => order.status === 'completed').length,
    pending: orders.filter((order) => order.status === 'pending').length,
    refunded: orders.filter((order) => order.status === 'refunded').length,
    cancelled: orders.filter((order) => order.status === 'cancelled').length,
    grossAmount: orders.reduce((sum, order) => sum + order.amount, 0),
    completedRevenue: orders
      .filter((order) => order.status === 'completed')
      .reduce((sum, order) => sum + order.paidAmount, 0),
    refundedAmount: orders
      .filter((order) => order.status === 'refunded')
      .reduce((sum, order) => sum + order.amount, 0),
  }
}

function getLatestOrderTimestamp(orders: StoreOrder[]): string {
  if (orders.length === 0) {
    return new Date().toISOString()
  }
  return orders.reduce((latest, order) => {
    const candidate = order.updatedAt || order.time
    return candidate > latest ? candidate : latest
  }, orders[0]!.updatedAt || orders[0]!.time)
}

export async function loadStoreOrdersSnapshot(
  storeId: string
): Promise<StoreOrdersSnapshotDelivery> {
  try {
    const orders = await fetchStoreOrders(storeId)
    return {
      deliveryMode: 'api',
      sourceLabel: 'store-orders-api',
      storeId,
      orders,
      summary: buildSummary(orders),
      generatedAt: new Date().toISOString(),
    }
  } catch {
    return {
      deliveryMode: 'fallback',
      sourceLabel: 'store-orders-fallback',
      storeId,
      orders: DEFAULT_STORE_ORDERS,
      summary: buildSummary(DEFAULT_STORE_ORDERS),
      generatedAt: getLatestOrderTimestamp(DEFAULT_STORE_ORDERS),
      error: '门店订单实时接口不可达，已切换到 fallback 样本数据。',
    }
  }
}
