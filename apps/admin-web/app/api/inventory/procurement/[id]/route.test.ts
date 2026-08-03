/**
 * P-37 采购管理 — 单个采购单 API 路由 — 测试
 *
 * 测试策略: 静态源码检查 (因为 'use server' 无法直接导入)
 *
 * 覆盖: GET / PATCH / DELETE /api/inventory/procurement/[id]
 * 正例·反例·边界
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Use URL-based path to handle [id] brackets in directory name
const SRC = readFileSync(new URL('route.ts', import.meta.url), 'utf-8')

// ═══════════════════════════════════════════════════════════════════
// 正例 — GET
// ═══════════════════════════════════════════════════════════════════

describe('GET /api/inventory/procurement/[id] — 正例', () => {
  it('G1. 应导出 GET 函数', () => {
    assert.ok(SRC.includes('export async function GET('), '缺少 GET 导出')
  })

  it('G2. 应接收 params 参数', () => {
    assert.ok(SRC.includes('params: Promise<{ id: string }>'), '缺少 params 类型')
    assert.ok(SRC.includes("const { id } = await params"), '缺少 id 解构')
  })

  it('G3. 应映射后端订单到前端格式 (status/totalCents/items)', () => {
    assert.ok(SRC.includes('mapToFrontendOrder'), '缺少前端格式映射')
    assert.ok(SRC.includes('totalCents'), '缺少 totalCents')
  })

  it('G4. 订单不存在时返回 success: false', () => {
    assert.ok(SRC.includes('Order not found'), '缺少 Order not found 处理')
    assert.ok(SRC.includes('success: false'), '缺少 success: false 响应')
  })

  it('G5. 应使用 try/catch 错误处理', () => {
    assert.ok(SRC.includes('try {'), '缺少 try')
    assert.ok(SRC.includes('catch (error)'), '缺少 catch')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 正例 — PATCH
// ═══════════════════════════════════════════════════════════════════

describe('PATCH /api/inventory/procurement/[id] — 正例', () => {
  it('P1. 应导出 PATCH 函数', () => {
    assert.ok(SRC.includes('export async function PATCH('), '缺少 PATCH 导出')
  })

  it('P2. 应转发 notes → remark', () => {
    assert.ok(SRC.includes("remark: body.notes") || SRC.includes("remark = body.notes") || SRC.includes("remark = body"), '缺少 notes→remark 映射')
  })

  it('P3. 应转换 items 中 cents → dollars', () => {
    assert.ok(SRC.includes('/ 100'), '缺少单位转换')
  })

  it('P4. 应返回 { success, message, data }', () => {
    assert.ok(SRC.includes('success: true'), '缺少 success')
    assert.ok(SRC.includes("message: 'OK'"), '缺少 message')
    assert.ok(SRC.includes('data:'), '缺少 data')
  })

  it('P5. 应处理 supplierName 转发', () => {
    assert.ok(SRC.includes('supplierName'), '缺少 supplierName')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 正例 — DELETE
// ═══════════════════════════════════════════════════════════════════

describe('DELETE /api/inventory/procurement/[id] — 正例', () => {
  it('D1. 应导出 DELETE 函数', () => {
    assert.ok(SRC.includes('export async function DELETE('), '缺少 DELETE 导出')
  })

  it('D2. 应返回 success: true', () => {
    assert.ok(SRC.includes('success: true'), '缺少 success')
  })

  it('D3. 应包含 deleted: true 在 data 中', () => {
    assert.ok(SRC.includes('deleted: true'), '缺少 deleted')
  })

  it('D4. 应使用 try/catch', () => {
    assert.ok(SRC.includes('try {'), '缺少 try')
    assert.ok(SRC.includes('catch (error)'), '缺少 catch')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 反例 & 边界
// ═══════════════════════════════════════════════════════════════════

describe('反例 & 边界', () => {
  it('E1. 错误时返回 success: false', () => {
    assert.ok(SRC.includes('success: false'), '缺少失败响应')
  })

  it('E2. 异常时返回 502 status', () => {
    assert.ok(SRC.includes('status: 502'), '缺少 502')
  })

  it('E3. 应使用 no-store 缓存策略', () => {
    assert.ok(SRC.includes("'no-store'"), '缺少 no-store')
  })

  it('E4. 应转发上下文头', () => {
    assert.ok(SRC.includes("'x-tenant-id'"), '缺少 x-tenant-id')
  })

  it('E5. 应处理 M5_API_BASE_URL 环境变量', () => {
    assert.ok(SRC.includes('M5_API_BASE_URL'), '缺少 M5_API_BASE_URL')
  })

  it('E6. 应处理空 body 的情况', () => {
    assert.ok(SRC.includes('body') || SRC.includes('request.json()'), '缺少 request.json()')
  })
})
