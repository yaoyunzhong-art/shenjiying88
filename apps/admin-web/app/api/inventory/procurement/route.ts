/**
 * P-37 采购管理 API 路由
 * 
 * admin-web 采购页面通过 /api/inventory/procurement 调用后端 procurement-orders API
 * 后端路径: /procurement-orders (NestJS)
 * 前端期望: { success: true, data: { orders: [...] } }
 *
 * 本路由将页面的 /api/inventory/procurement 请求代理转发到后端,
 * 并做必要的数据格式转换 (cents ↔ quantity*unitPrice, 添加默认 priority/department 等)
 */

'use server'

import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_API_ORIGIN = 'http://localhost:3001'
const CONTEXT_HEADERS = [
  'authorization',
  'content-type',
  'x-tenant-id',
  'x-brand-id',
  'x-store-id',
  'x-market-code',
] as const

// ── 后端 API 基础 URL ──

async function resolveApiBaseUrl(): Promise<string> {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) return `${DEFAULT_API_ORIGIN}/api/v1/`

  const suffix = (s: string) => normalized.endsWith(s) || normalized.endsWith(s + '/')
  if (suffix('/api/v1')) return normalized.endsWith('/') ? normalized : normalized + '/'
  if (suffix('/api')) return `${normalized.replace(/\/$/, '')}/api/v1/`
  return `${normalized.replace(/\/$/, '')}/api/v1/`
}

function buildUpstreamUrl(base: string, pathSegments: string, request: NextRequest): string {
  const upstream = new URL(pathSegments, base)
  const search = request.nextUrl.searchParams.toString()
  if (search) upstream.search = search
  return upstream.toString()
}

function copyContextHeaders(request: NextRequest): Headers {
  const headers = new Headers()
  for (const name of CONTEXT_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  return headers
}

// ── 数据格式转换 ──

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

// 后端 ProcurementStatus → 前端 status 映射
function mapStatus(backendStatus: string): string {
  const map: Record<string, string> = {
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

function mapToFrontendOrder(order: BackendOrder) {
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
    priority: 'medium' as const,
    department: '采购部',
    requester: '系统',
    storeName: '总部',
    approver: order.status === 'APPROVED' || order.status === 'SHIPPED' || order.status === 'RECEIVED' ? '管理员' : undefined,
    expectedDate: order.expectedAt ? order.expectedAt.slice(0, 10) : undefined,
    receivedDate: order.receivedAt ? order.receivedAt.slice(0, 10) : undefined,
    notes: order.remark,
    createdAt: order.createdAt,
    updatedAt: order.orderedAt,
  }
}

// ── Fetch helper ──

async function fetchBackend(
  path: string,
  method: string,
  request: NextRequest,
  body?: unknown,
) {
  const base = await resolveApiBaseUrl()
  const upstreamUrl = buildUpstreamUrl(base, `procurement-orders${path}`, request)
  const headers = copyContextHeaders(request)

  const upstream = await fetch(upstreamUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : method === 'GET' ? undefined : await request.text(),
    cache: 'no-store',
  })

  const contentType = upstream.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  if (!upstream.ok) {
    const errBody = isJson ? await upstream.json() : { message: await upstream.text() }
    return NextResponse.json(
      { success: false, message: errBody.message ?? 'Backend error', data: null },
      { status: upstream.status },
    )
  }

  if (!isJson) {
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: contentType ? { 'content-type': contentType } : undefined,
    })
  }

  const payload = await upstream.json()
  // The backend ResponseInterceptor wraps with { success, message, data }
  // So payload.data contains the actual response
  return payload
}

// ── GET /api/inventory/procurement ──

export async function GET(request: NextRequest) {
  try {
    const backendResponse = await fetchBackend('', 'GET', request)
    const orders = Array.isArray(backendResponse?.data)
      ? backendResponse.data
      : Array.isArray(backendResponse)
        ? backendResponse
        : []

    const frontendOrders = orders.map(mapToFrontendOrder)

    return NextResponse.json({
      success: true,
      message: 'OK',
      data: { orders: frontendOrders },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal error',
        data: null,
      },
      { status: 502 },
    )
  }
}

// ── POST /api/inventory/procurement ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 前端用 cents, 后端用 dollars
    const backendItems = (body.items ?? []).map(
      (item: { name: string; quantity: number; unitPriceCents: number }) => ({
        name: item.name,
        sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        quantity: item.quantity,
        unitPrice: (item.unitPriceCents ?? 0) / 100,
        receivedQuantity: 0,
      }),
    )

    const totalAmount = backendItems.reduce(
      (sum: number, item: { quantity: number; unitPrice: number }) =>
        sum + item.quantity * item.unitPrice,
      0,
    )

    const orderBody = {
      orderNo: body.orderNo ?? `PO-${Date.now().toString(36).toUpperCase()}`,
      supplierId: body.supplierId ?? 'supplier-auto',
      supplierName: body.supplierName ?? '自动供应商',
      items: backendItems,
      orderedAt: new Date().toISOString(),
      expectedAt: body.expectedDate
        ? new Date(body.expectedDate).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString(),
      remark: body.notes,
    }

    const backendResponse = await fetchBackend('', 'POST', request, orderBody)

    return NextResponse.json({
      success: true,
      message: 'OK',
      data: { order: backendResponse?.data ?? backendResponse },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal error',
        data: null,
      },
      { status: 502 },
    )
  }
}
