/**
 * P-37 采购管理 — 单个采购单 API 路由
 * /api/inventory/procurement/[id]
 *
 * 支持 GET / PATCH / DELETE 操作
 * 代理转发到后端 /procurement-orders/:id
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

async function resolveApiBaseUrl(): Promise<string> {
  const configured =
    process.env.M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    DEFAULT_API_ORIGIN

  const normalized = configured.trim()
  if (!normalized.length) return `${DEFAULT_API_ORIGIN}/api/v1/`

  const suffix = (s: string) => normalized.endsWith(s) ?? normalized.endsWith(s + '/')
  if (suffix('/api/v1')) return normalized.endsWith('/') ? normalized : normalized + '/'
  if (suffix('/api')) return `${normalized.replace(/\/$/, '')}/api/v1/`
  return `${normalized.replace(/\/$/, '')}/api/v1/`
}

function buildUpstreamUrl(base: string, path: string, request: NextRequest): string {
  const upstream = new URL(path, base)
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
  return payload
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

// ── GET /api/inventory/procurement/[id] ──

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const backendResponse = await fetchBackend(`/${id}`, 'GET', request)
    const order = backendResponse?.data ?? backendResponse

    if (!order || !order.id) {
      return NextResponse.json(
        { success: false, message: `Order not found: ${id}`, data: null },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OK',
      data: { order: mapToFrontendOrder(order as BackendOrder) },
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

// ── PATCH /api/inventory/procurement/[id] ──

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Convert frontend format to backend format
    const patchBody: Record<string, unknown> = {}

    if (body.supplierName !== undefined) {
      patchBody.supplierName = body.supplierName
      patchBody.supplierId = body.supplierId ?? `sup-${Date.now()}`
    }
    if (body.notes !== undefined) patchBody.remark = body.notes
    if (body.items !== undefined) {
      patchBody.items = body.items.map(
        (item: { name: string; quantity: number; unitPriceCents: number }) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: item.name,
          sku: `SKU-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          quantity: item.quantity,
          unitPrice: (item.unitPriceCents ?? 0) / 100,
          receivedQuantity: 0,
        }),
      )
    }

    const backendResponse = await fetchBackend(`/${id}`, 'PATCH', request, patchBody)

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

// ── DELETE /api/inventory/procurement/[id] ──

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const backendResponse = await fetchBackend(`/${id}`, 'DELETE', request)

    return NextResponse.json({
      success: true,
      message: 'OK',
      data: backendResponse?.data ?? { deleted: true },
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
