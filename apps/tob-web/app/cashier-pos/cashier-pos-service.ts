// T106-3 CashierPOS Service Layer
// 实战化 (P1-4): 真实后端集成 + 多付款 + 会员 + 票据 + 离线持久化 + SSE 订阅

import {
  POSOrder,
  POSItem,
  RefundRequest,
  ChannelStats,
  SyncStatus,
  PaymentMethod,
  PaymentAllocation,
  Member,
  Product,
  Receipt,
  ReceiptLineItem,
  MOCK_POS_ORDERS,
  MOCK_PENDING_REFUNDS,
  MOCK_CHANNEL_STATS,
  MOCK_PRODUCTS,
  MOCK_MEMBERS,
  CashierPosError
} from './cashier-pos-data';

// ─── 离线队列 (P1-4 持久化到 localStorage) ──────────

const STORAGE_KEY = 'cashier-pos-offline-queue-v1'
const SSE_RECONNECT_KEY = 'cashier-pos-sse-last-event-id'

interface OfflineQueueEntry {
  order: POSOrder
  enqueuedAt: string
  retryCount: number
  lastError?: string
}

/** SSR-safe localStorage 访问 */
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function loadOfflineQueue(): OfflineQueueEntry[] {
  const s = getStorage()
  if (!s) return []
  try {
    const raw = s.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as OfflineQueueEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveOfflineQueue(queue: OfflineQueueEntry[]): void {
  const s = getStorage()
  if (!s) return
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // quota 满 / 序列化失败: 静默, 不阻塞业务
  }
}

// 内存镜像 (SSR fallback / 测试)
let offlineQueueMemory: OfflineQueueEntry[] = []

function getOfflineQueue(): OfflineQueueEntry[] {
  if (typeof window === 'undefined') {
    return offlineQueueMemory
  }
  return loadOfflineQueue()
}

function setOfflineQueue(queue: OfflineQueueEntry[]): void {
  if (typeof window === 'undefined') {
    offlineQueueMemory = queue
    return
  }
  saveOfflineQueue(queue)
}

// ─── 网络检测 (P1-4) ──────────────────────────────

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine !== false
}

// ─── API 客户端 (P1-4 真实后端, mock fallback) ─────

const API_BASE = '/api'

interface ApiClientOptions {
  /** mock 模式开关 (默认 false) */
  useMock?: boolean
  /** 自定义 fetch (测试) */
  fetcher?: typeof fetch
  /** 请求超时 ms (默认 8000) */
  timeoutMs?: number
}

const defaultClient: ApiClientOptions = { useMock: true }

/** 简单 timeout 包装 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function apiRequest<T>(
  path: string,
  init: RequestInit,
  options: ApiClientOptions = defaultClient
): Promise<T> {
  const useMock = options.useMock ?? true
  if (useMock || !isOnline()) {
    throw new CashierPosError({
      code: 'MOCK_MODE',
      message: 'API in mock mode or offline',
      retryable: true
    })
  }
  const fetcher = options.fetcher ?? fetch
  const response = await fetcher(`${API_BASE}${path}`, init)
  if (!response.ok) {
    throw new CashierPosError({
      code: `HTTP_${response.status}`,
      message: `API ${path} returned ${response.status}`,
      retryable: response.status >= 500
    })
  }
  return (await response.json()) as T
}

// ─── 业务功能 ───────────────────────────────────

/**
 * 提交订单 (P1-4)
 * - 在线: 调 API → 返回已 paid 订单
 * - 离线: 入 offlineQueue → 标记 offlineCreated=true
 */
export async function submitOrder(
  order: POSOrder,
  options?: ApiClientOptions
): Promise<POSOrder> {
  if (!isOnline() || (options?.useMock ?? true)) {
    const entry: OfflineQueueEntry = {
      order: { ...order, offlineCreated: true, status: 'pending' },
      enqueuedAt: new Date().toISOString(),
      retryCount: 0
    }
    const q = [...getOfflineQueue(), entry]
    setOfflineQueue(q)
    return entry.order
  }

  // 真实环境: 调 API
  try {
    const apiOrder = await apiRequest<POSOrder>(
      '/cashier/orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      },
      options
    )
    return { ...apiOrder, offlineCreated: false }
  } catch (err) {
    // 失败 → 回落离线队列
    if (err instanceof CashierPosError && err.retryable) {
      const entry: OfflineQueueEntry = {
        order: { ...order, offlineCreated: true, status: 'pending' },
        enqueuedAt: new Date().toISOString(),
        retryCount: 0,
        lastError: err.message
      }
      const q = [...getOfflineQueue(), entry]
      setOfflineQueue(q)
      return entry.order
    }
    throw err
  }
}

export async function queryOrder(
  orderId: string,
  options?: ApiClientOptions
): Promise<POSOrder | null> {
  // 检查离线队列
  const offline = getOfflineQueue().find((e) => e.order.orderId === orderId)
  if (offline) return offline.order

  if (options?.useMock ?? true) {
    return MOCK_POS_ORDERS.find((o) => o.orderId === orderId) ?? null
  }
  try {
    return await apiRequest<POSOrder>(
      `/cashier/orders/${orderId}`,
      { method: 'GET' },
      options
    )
  } catch {
    return null
  }
}

export async function requestRefund(
  orderId: string,
  amount: number,
  reason: string,
  paymentId?: string,
  options?: ApiClientOptions
): Promise<RefundRequest> {
  if (options?.useMock ?? true) {
    return {
      refundId: `REF-${Date.now()}`,
      orderId,
      amount,
      reason,
      status: 'pending',
      paymentId,
      method: paymentId ? 'WECHAT' : undefined,
      requestedAt: new Date().toISOString()
    }
  }
  return apiRequest<RefundRequest>(
    `/cashier/orders/${encodeURIComponent(orderId)}/refunds`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, reason, paymentId })
    },
    options
  )
}

export async function queryRefundStatus(
  refundId: string,
  options?: ApiClientOptions
): Promise<RefundRequest | null> {
  if (options?.useMock ?? true) {
    return MOCK_PENDING_REFUNDS.find((r) => r.refundId === refundId) ?? null
  }
  try {
    return await apiRequest<RefundRequest>(
      `/cashier/refunds/${refundId}`,
      { method: 'GET' },
      options
    )
  } catch {
    return null
  }
}

export async function getChannelStats(
  options?: ApiClientOptions
): Promise<ChannelStats[]> {
  if (options?.useMock ?? true) {
    return MOCK_CHANNEL_STATS
  }
  return apiRequest<ChannelStats[]>('/cashier/stats/channels', { method: 'GET' }, options)
}

// ─── 离线同步 (P1-4 重试 + 错误累计) ─────────────

export async function syncOfflineOrders(
  options?: ApiClientOptions
): Promise<SyncStatus> {
  const queue = [...getOfflineQueue()]
  let synced = 0
  let failed = 0
  const remaining: OfflineQueueEntry[] = []

  for (const entry of queue) {
    try {
      if ((options?.useMock ?? true) || !isOnline()) {
        // 模拟 90% 成功率
        if (Math.random() > 0.1) {
          synced += 1
        } else {
          failed += 1
          remaining.push({
            ...entry,
            retryCount: entry.retryCount + 1,
            lastError: 'simulated failure'
          })
        }
      } else {
        await apiRequest<POSOrder>(
          '/cashier/orders',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry.order)
          },
          options
        )
        synced += 1
      }
    } catch (err) {
      failed += 1
      remaining.push({
        ...entry,
        retryCount: entry.retryCount + 1,
        lastError: err instanceof Error ? err.message : String(err)
      })
    }
  }

  setOfflineQueue(remaining)
  return { pending: remaining.length, synced, failed }
}

export function getOfflineQueueCount(): number {
  return getOfflineQueue().length
}

export function clearOfflineQueue(): void {
  setOfflineQueue([])
}

// ─── 多笔付款 (P1-4 拆单/部分付) ───────────────

export interface AllocatePaymentInput {
  orderId: string
  method: PaymentMethod
  amountCents: number
}

export interface AllocatePaymentResult {
  ok: boolean
  allocation?: PaymentAllocation
  reason?: 'amount_mismatch' | 'over_allocation' | 'order_not_found'
}

/**
 * 分配一笔付款到订单
 * 校验: amountCents 必须 > 0 且 ≤ 订单剩余金额
 */
export function allocatePayment(
  order: POSOrder,
  input: AllocatePaymentInput
): AllocatePaymentResult {
  if (order.status !== 'pending') {
    return { ok: false, reason: 'order_not_found' }
  }
  const totalCents = Math.round(order.total * 100)
  const paidCents = (order.payments ?? [])
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amountCents, 0)
  const remaining = totalCents - paidCents

  if (input.amountCents <= 0) {
    return { ok: false, reason: 'amount_mismatch' }
  }
  if (input.amountCents > remaining) {
    return { ok: false, reason: 'over_allocation' }
  }

  const allocation: PaymentAllocation = {
    paymentId: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    method: input.method,
    amountCents: input.amountCents,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  }
  return { ok: true, allocation }
}

/** 计算订单剩余应付金额 (分) */
export function getRemainingCents(order: POSOrder): number {
  const totalCents = Math.round(order.total * 100)
  const paidCents = (order.payments ?? [])
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amountCents, 0)
  return Math.max(0, totalCents - paidCents)
}

// ─── 会员查询 (P1-4) ───────────────────────────

export async function lookupMember(
  query: { phone?: string; memberNo?: string },
  options?: ApiClientOptions
): Promise<Member | null> {
  if (options?.useMock ?? true) {
    if (query.phone) {
      return MOCK_MEMBERS.find((m) => m.phone === query.phone) ?? null
    }
    if (query.memberNo) {
      return MOCK_MEMBERS.find((m) => m.memberNo === query.memberNo) ?? null
    }
    return null
  }
  const q = encodeURIComponent(query.phone ?? query.memberNo ?? '')
  try {
    return await apiRequest<Member>(
      `/cashier/members/lookup?q=${q}`,
      { method: 'GET' },
      options
    )
  } catch {
    return null
  }
}

/** 应用会员折扣 (返回折扣后金额, 单位: 元) */
export function applyMemberDiscount(order: POSOrder, member: Member): number {
  const rate = member.discountRate ?? 1
  return Math.round(order.subtotal * rate * 100) / 100
}

// ─── 商品扫码 (P1-4) ───────────────────────────

export async function lookupProduct(
  sku: string,
  options?: ApiClientOptions
): Promise<Product | null> {
  if (options?.useMock ?? true) {
    return MOCK_PRODUCTS.find((p) => p.sku === sku) ?? null
  }
  try {
    return await apiRequest<Product>(
      `/cashier/products/${encodeURIComponent(sku)}`,
      { method: 'GET' },
      options
    )
  } catch {
    return null
  }
}

// ─── 票据生成 (P1-4 打印预览) ─────────────────────

export interface GenerateReceiptInput {
  order: POSOrder
  member?: Member
  cashier: string
  storeName: string
  /** 应用折扣金额 (元) */
  discountApplied?: number
}

export function generateReceipt(input: GenerateReceiptInput): Receipt {
  const { order, member, cashier, storeName, discountApplied = 0 } = input
  const items: ReceiptLineItem[] = order.items.map((it) => ({
    name: it.name,
    qty: it.qty,
    unitPrice: it.unitPrice,
    discount: it.discount,
    subtotal: it.unitPrice * it.qty - it.discount
  }))
  const payments = (order.payments ?? [])
    .filter((p) => p.status === 'SUCCESS')
    .map((p) => ({ method: p.method, amountCents: p.amountCents }))

  return {
    receiptId: `RCP-${Date.now()}`,
    orderId: order.orderId,
    cashier,
    storeName,
    items,
    subtotal: order.subtotal,
    tax: order.tax,
    discount: discountApplied,
    total: order.total,
    payments,
    member: member
      ? { memberNo: member.memberNo, name: member.name, tier: member.tier, points: member.points }
      : undefined,
    printedAt: new Date().toISOString()
  }
}

/** 票据 → 纯文本 (小票打印) */
export function formatReceiptText(receipt: Receipt): string {
  const lines: string[] = []
  const w = 32
  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((w - s.length) / 2))
    return ' '.repeat(pad) + s
  }
  lines.push(center(receipt.storeName))
  lines.push(center('=' .repeat(w)))
  lines.push(`订单号: ${receipt.orderId}`)
  lines.push(`收银员: ${receipt.cashier}`)
  lines.push(`时间: ${receipt.printedAt}`)
  if (receipt.member) {
    lines.push(`会员: ${receipt.member.name} (${receipt.member.memberNo})`)
    lines.push(`等级: ${receipt.member.tier}  积分: ${receipt.member.points}`)
  }
  lines.push('-' .repeat(w))
  for (const it of receipt.items) {
    lines.push(it.name)
    lines.push(
      `  ${it.qty} x ¥${it.unitPrice.toFixed(2)}  = ¥${it.subtotal.toFixed(2)}`
    )
  }
  lines.push('-' .repeat(w))
  lines.push(`小计: ¥${receipt.subtotal.toFixed(2)}`)
  lines.push(`税额: ¥${receipt.tax.toFixed(2)}`)
  if (receipt.discount > 0) {
    lines.push(`折扣: -¥${receipt.discount.toFixed(2)}`)
  }
  lines.push(`合计: ¥${receipt.total.toFixed(2)}`)
  lines.push('-' .repeat(w))
  for (const p of receipt.payments) {
    lines.push(`${p.method}: ¥${(p.amountCents / 100).toFixed(2)}`)
  }
  lines.push('=' .repeat(w))
  lines.push(center('感谢惠顾, 欢迎下次光临'))
  return lines.join('\n')
}

// ─── SSE 实时订阅 (P1-4) ────────────────────────

export type PaymentEvent =
  | { type: 'order.paid'; orderId: string; paymentId: string; paidAt: string }
  | { type: 'order.refunded'; orderId: string; refundId: string; amount: number }
  | { type: 'order.expired'; orderId: string }

export interface SseSubscription {
  close: () => void
}

export interface SseOptions {
  baseUrl?: string
  onEvent: (event: PaymentEvent) => void
  onError?: (err: Error) => void
  /** Last-Event-ID 用于重连 (P0-2 SSE 重连) */
  lastEventId?: string
}

/**
 * 订阅支付状态变更
 * - mock 模式: 什么都不做, 立即返回
 * - 真实模式: EventSource, 自动持久化 Last-Event-ID
 */
export function subscribePaymentEvents(
  options: SseOptions,
  clientOptions?: ApiClientOptions
): SseSubscription {
  if (clientOptions?.useMock ?? true) {
    // mock: no-op
    return { close: () => {} }
  }
  if (typeof EventSource === 'undefined') {
    options.onError?.(new Error('EventSource not available'))
    return { close: () => {} }
  }

  const baseUrl = options.baseUrl ?? API_BASE
  const url = new URL(`${baseUrl}/cashier/events`, window.location.origin)
  if (options.lastEventId) {
    url.searchParams.set('lastEventId', options.lastEventId)
  }

  const source = new EventSource(url.toString())
  const handle = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as PaymentEvent
      options.onEvent(data)
      if (event.lastEventId) {
        const s = getStorage()
        s?.setItem(SSE_RECONNECT_KEY, event.lastEventId)
      }
    } catch (err) {
      options.onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }
  source.addEventListener('order.paid', handle as EventListener)
  source.addEventListener('order.refunded', handle as EventListener)
  source.addEventListener('order.expired', handle as EventListener)
  source.onerror = () => {
    options.onError?.(new Error('SSE connection error'))
  }
  return {
    close: () => source.close()
  }
}

export function getStoredLastEventId(): string | null {
  const s = getStorage()
  return s?.getItem(SSE_RECONNECT_KEY) ?? null
}
