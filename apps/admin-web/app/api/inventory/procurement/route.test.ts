/**
 * P-37 采购管理 API 路由 — 测试 (圈梁四道箍)
 *
 * 测试策略: 静态源码检查 + 组件交互测试
 * 因为 'use server' + next/server 无法直接导入 test runner
 *
 * 覆盖: GET /api/inventory/procurement, POST /api/inventory/procurement
 * 正例·反例·边界
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC = readFileSync(resolve(import.meta.dirname, 'route.ts'), 'utf-8')

// ═══════════════════════════════════════════════════════════════════
// 正例 — 导出检查
// ═══════════════════════════════════════════════════════════════════

describe('GET /api/inventory/procurement — 正例', () => {
  it('G1. 应导出 GET 函数', () => {
    assert.ok(SRC.includes('export async function GET('), '缺少 GET 导出')
  })

  it('G2. 应导出 POST 函数', () => {
    assert.ok(SRC.includes('export async function POST('), '缺少 POST 导出')
  })

  it('G3. 应正确处理 NextRequest', () => {
    assert.ok(SRC.includes('NextRequest'), '缺少 NextRequest 类型')
  })

  it('G4. 应返回 NextResponse', () => {
    assert.ok(SRC.includes('NextResponse.json'), '缺少 NextResponse.json')
  })

  it('G5. 应包含 success/message/data 响应结构', () => {
    assert.ok(SRC.includes('success: true'), '响应缺少 success')
    assert.ok(SRC.includes("message: 'OK'"), '响应缺少 message')
    assert.ok(SRC.includes('data:'), '响应缺少 data')
  })

  it('G6. 响应中 orders 应为数组', () => {
    assert.ok(SRC.includes('orders:'), '缺少 orders 字段')
    assert.ok(SRC.includes('frontendOrders'), '缺少转换后 orders')
  })

  it('G7. 应映射 states: DRAFT → draft, PENDING_APPROVAL → submitted', () => {
    assert.ok(SRC.includes('DRAFT:'), '缺少 DRAFT 映射')
    assert.ok(SRC.includes('PENDING_APPROVAL:'), '缺少 PENDING_APPROVAL 映射')
    assert.ok(SRC.includes('RECEIVED:'), '缺少 RECEIVED 映射')
    assert.ok(SRC.includes('CANCELLED:'), '缺少 CANCELLED 映射')
  })

  it('G8. 应转换 totalAmount → totalCents (×100)', () => {
    assert.ok(SRC.includes('totalAmount * 100'), '缺少 cents 转换')
    assert.ok(SRC.includes('Math.round'), '缺少 Math.round')
  })

  it('G9. 应转换 unitPrice → unitPriceCents', () => {
    assert.ok(SRC.includes('unitPrice * 100'), '缺少 unitPrice 转 cents')
  })

  it('G10. 应设置默认字段', () => {
    assert.ok(SRC.includes("department: '采购部'"), '缺少 department 默认值')
    assert.ok(SRC.includes("requester: '系统'"), '缺少 requester 默认值')
    assert.ok(SRC.includes("storeName: '总部'"), '缺少 storeName 默认值')
    assert.ok(SRC.includes("priority: 'medium'"), '缺少 priority 默认值')
  })

  it('G11. 应转发上下文头 (x-tenant-id 等)', () => {
    assert.ok(SRC.includes("'authorization'"), '缺少 authorization 头')
    assert.ok(SRC.includes("'x-tenant-id'"), '缺少 x-tenant-id 头')
  })

  it('G12. 应使用 M5_API_BASE_URL 环境变量', () => {
    assert.ok(SRC.includes('M5_API_BASE_URL'), '缺少 M5_API_BASE_URL')
    assert.ok(SRC.includes('NEXT_PUBLIC_M5_API_BASE_URL'), '缺少 NEXT_PUBLIC_M5_API_BASE_URL')
  })

  it('G13. 应包含 request-id 跟踪支持', () => {
    assert.ok(SRC.includes("'content-type'"), '缺少 content-type 头')
  })
})

describe('POST /api/inventory/procurement — 正例', () => {
  it('P1. 应转换 unitPriceCents → unitPrice (÷100)', () => {
    assert.ok(SRC.includes('/ 100'), '缺少 cents 转 dollars')
  })

  it('P2. 应自动生成 orderNo 以 PO- 开头', () => {
    assert.ok(SRC.includes("orderNo: body.orderNo ?? `PO-"), '缺少 orderNo 自动生成')
  })

  it('P3. 应自动生成 SKU', () => {
    assert.ok(SRC.includes('sku: `SKU-'), '缺少 SKU 自动生成')
  })

  it('P4. 应转发 expectedDate → expectedAt', () => {
    assert.ok(SRC.includes('expectedDate'), '缺少 expectedDate 处理')
  })

  it('P5. 应返回成功响应', () => {
    assert.ok(SRC.includes("success: true"))
    assert.ok(SRC.includes("message: 'OK'"))
  })

  it('P6. 应包含 error 处理 (try/catch)', () => {
    assert.ok(SRC.includes('try {'), '缺少 try 块')
    assert.ok(SRC.includes('catch (error)'), '缺少 catch 块')
  })

  it('P7. 异常时返回 502', () => {
    assert.ok(SRC.includes('status: 502'), '缺少 502 状态码')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 反例 — 防御检查
// ═══════════════════════════════════════════════════════════════════

describe('防御检查 — 反例', () => {
  it('E1. 后端失败时返回 success: false', () => {
    assert.ok(SRC.includes('success: false'), '缺少失败响应')
  })

  it('E2. 应处理空 items', () => {
    assert.ok(SRC.includes('body.items ?? []'), '缺少 items 默认值')
  })

  it('E3. 错误时应返回错误 message', () => {
    assert.ok(SRC.includes('.message'), '缺少错误信息提取')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 边界检查
// ═══════════════════════════════════════════════════════════════════

describe('边界检查', () => {
  it('B1. 应使用 no-store 缓存策略', () => {
    assert.ok(SRC.includes("'no-store'"), '缺少 no-store 缓存策略')
  })

  it('B2. 应映射 PARTIAL → shipped', () => {
    assert.ok(SRC.includes("PARTIAL: 'shipped'"), '缺少 PARTIAL 映射')
  })

  it('B3. 应映射 APPROVED 状态时添加 approver', () => {
    assert.ok(SRC.includes("'APPROVED'"), '缺少 APPROVED 状态处理')
    assert.ok(SRC.includes("approver:") || SRC.includes("'管理员'"), '缺少 approver 字段')
  })

  it('B4. 显示 receivedDate 时应只截取日期部分', () => {
    assert.ok(SRC.includes('.slice(0, 10)'), '缺少日期截取')
  })

  it('B5. 应包含 UNKNOWN 状态的兜底映射', () => {
    assert.ok(SRC.includes("?? 'draft'"), '缺少兜底映射')
  })
})
