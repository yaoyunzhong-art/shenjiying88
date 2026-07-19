import { describe, it, expect, beforeEach, vi } from 'vitest'
import assert from 'node:assert/strict'
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common'
import { FinanceInvoiceService } from './finance-invoice.service'
import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * B2-5 InvoiceV2 Prisma 持久化 单元测试
 *
 * 覆盖:
 *  - 正例: createInvoice / issueInvoice / cancelInvoice / listInvoices / getInvoice
 *  - 反例: 重复作废抛出 / 非 DRAFT 状态 issue 失败 / 跨租户访问不存在
 *  - 边界: orderId=null / amountCents=0
 *  - ≥ 10 tests
 *
 * Mock 策略 (URL-pattern responseRegistry):
 *   构建 prismaMock 代理对象, 用 responseRegistry 注册 expected "url" →
 *   { data + error } 响应. 每个 mock 方法查找已注册的模式.
 */

// ── responseRegistry: URL-pattern mock ──────────────────────
type MockResponse = { data?: any; error?: Error }

const responseRegistry = new Map<string, MockResponse>()

function register(key: string, resp: MockResponse) {
  responseRegistry.set(key, resp)
}

function resetRegistry() {
  responseRegistry.clear()
}

function matchRegistry(key: string): MockResponse {
  const exact = responseRegistry.get(key)
  if (exact) return exact
  for (const [pattern, resp] of responseRegistry) {
    if (pattern.endsWith('*') && key.startsWith(pattern.slice(0, -1))) {
      return resp
    }
  }
  return { data: undefined }
}

// ── Prisma mock factory ─────────────────────────────────────

function createPrismaMock() {
  return {
    invoiceV2: {
      create: async (args: any) => {
        const resp = matchRegistry(`invoiceV2.create:${JSON.stringify(args.data.invoiceNo ?? '')}`)
        if (resp.error) throw resp.error
        const now = new Date()
        return {
          id: args.data.id ?? 'cm8test0000001',
          tenantId: args.data.tenantId,
          invoiceNo: args.data.invoiceNo,
          orderId: args.data.orderId ?? null,
          type: args.data.type,
          amountCents: args.data.amountCents,
          taxAmountCents: args.data.taxAmountCents ?? 0,
          taxRate: args.data.taxRate ?? 0.13,
          status: args.data.status ?? 'DRAFT',
          buyerName: args.data.buyerName ?? null,
          buyerTaxId: args.data.buyerTaxId ?? null,
          buyerEmail: args.data.buyerEmail ?? null,
          remark: args.data.remark ?? null,
          issuedAt: null,
          cancelledAt: null,
          createdAt: now,
          updatedAt: now,
        }
      },
      findUnique: async (args: { where: { id: string } }) => {
        const resp = matchRegistry(`invoiceV2.findUnique:${args.where.id}`)
        if (resp.error) throw resp.error
        return resp.data ?? null
      },
      findFirst: async (_args: any) => {
        const resp = matchRegistry('invoiceV2.findFirst')
        if (resp.error) throw resp.error
        return resp.data ?? null
      },
      findMany: async (_args: any) => {
        const resp = matchRegistry('invoiceV2.findMany')
        if (resp.error) throw resp.error
        return resp.data ?? []
      },
      count: async (_args: any) => {
        const resp = matchRegistry('invoiceV2.count')
        if (resp.error) throw resp.error
        return resp.data ?? 0
      },
      update: async (args: { where: { id: string }; data: any }) => {
        const resp = matchRegistry(`invoiceV2.update:${args.where.id}`)
        if (resp.error) throw resp.error
        // Find the existing record
        const existing = await (async () => {
          const r2 = matchRegistry(`invoiceV2.findUnique:${args.where.id}`)
          return r2.data
        })()
        if (!existing) throw new Error('Record not found')
        return { ...existing, ...args.data }
      },
    },
  }
}

function mockPrismaFindUnique(invoiceId: string, data: any) {
  register(`invoiceV2.findUnique:${invoiceId}`, { data })
}

function mockPrismaFindFirst(data: any) {
  register('invoiceV2.findFirst', { data })
}

function mockPrismaFindMany(data: any[]) {
  register('invoiceV2.findMany', { data })
}

function mockPrismaCount(n: number) {
  register('invoiceV2.count', { data: n })
}

// ── Test tenant context ─────────────────────────────────────

const tenantT1: RequestTenantContext = {
  tenantId: 't1',
}

const tenantT2: RequestTenantContext = {
  tenantId: 't2',
}

// ── Helpers ─────────────────────────────────────────────────

function makeDraftInvoice(id: string, overrides: Record<string, any> = {}) {
  const now = new Date()
  return {
    id,
    tenantId: 't1',
    invoiceNo: `INV-20260719-${id.slice(-6)}`,
    orderId: null,
    type: 'ELECTRONIC',
    amountCents: 10000,
    taxAmountCents: 1300,
    taxRate: 0.13,
    status: 'DRAFT',
    buyerName: null,
    buyerTaxId: null,
    buyerEmail: null,
    remark: null,
    issuedAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────

describe('FinanceInvoiceService', () => {
  let svc: FinanceInvoiceService

  beforeEach(() => {
    resetRegistry()
    const prismaMock = createPrismaMock()
    svc = new FinanceInvoiceService(prismaMock as any)
  })

  // ═══════════════════════════════════════════════════════════
  // 正例
  // ═══════════════════════════════════════════════════════════

  it('createInvoice: 创建 DRAFT 发票并自动生成 invoiceNo', async () => {
    // No prior invoice today → seq = 000001
    mockPrismaFindFirst(null)

    const result = await svc.createInvoice(tenantT1, {
      tenantId: 't1',
      type: 'ELECTRONIC',
      amountCents: 10000,
      taxAmountCents: 1300,
      taxRate: 0.13,
      buyerName: '测试公司',
      buyerTaxId: '91110108MA0000000',
    })

    assert.equal(result.tenantId, 't1')
    assert.equal(result.type, 'ELECTRONIC')
    assert.equal(result.amountCents, 10000)
    assert.equal(result.taxAmountCents, 1300)
    assert.equal(result.status, 'DRAFT')
    assert.ok(result.invoiceNo.startsWith('INV-'))
    assert.equal(result.issuedAt, null)
    assert.equal(result.cancelledAt, null)
  })

  it('issueInvoice: 从 DRAFT 变为 ISSUED 并记录 issuedAt', async () => {
    const draft = makeDraftInvoice('inv-issue-ok')
    mockPrismaFindFirst(null)
    mockPrismaFindUnique('inv-issue-ok', draft)
    // update returns the modified record
    register(`invoiceV2.update:inv-issue-ok`, {
      data: { ...draft, status: 'ISSUED', issuedAt: new Date() },
    })

    const result = await svc.issueInvoice('inv-issue-ok', tenantT1)
    assert.equal(result.status, 'ISSUED')
    assert.ok(result.issuedAt instanceof Date)
  })

  it('cancelInvoice: 从任意非 CANCELLED 状态变为 CANCELLED', async () => {
    const issued = makeDraftInvoice('inv-cancel-ok', { status: 'ISSUED', issuedAt: new Date() })
    mockPrismaFindUnique('inv-cancel-ok', issued)
    register(`invoiceV2.update:inv-cancel-ok`, {
      data: { ...issued, status: 'CANCELLED', cancelledAt: new Date() },
    })

    const result = await svc.cancelInvoice('inv-cancel-ok', tenantT1)
    assert.equal(result.status, 'CANCELLED')
    assert.ok(result.cancelledAt instanceof Date)
  })

  it('getInvoice: 返回完整发票信息', async () => {
    const draft = makeDraftInvoice('inv-get-ok')
    mockPrismaFindUnique('inv-get-ok', draft)

    const result = await svc.getInvoice('inv-get-ok', tenantT1)
    assert.equal(result.id, 'inv-get-ok')
    assert.equal(result.tenantId, 't1')
    assert.equal(result.invoiceNo, draft.invoiceNo)
  })

  it('listInvoices: 分页返回 + total 计数', async () => {
    const invoices = [
      makeDraftInvoice('inv-list-1'),
      makeDraftInvoice('inv-list-2'),
    ]
    mockPrismaFindMany(invoices)
    mockPrismaCount(2)

    const result = await svc.listInvoices({ tenantId: 't1' })
    assert.equal(result.total, 2)
    assert.equal(result.items.length, 2)
    assert.equal(result.items[0].id, 'inv-list-1')
  })

  it('listInvoices: 按 status 和 type 过滤', async () => {
    const filtered = [
      makeDraftInvoice('inv-filter-1', { type: 'SPECIAL', status: 'ISSUED' }),
    ]
    mockPrismaFindMany(filtered)
    mockPrismaCount(1)

    const result = await svc.listInvoices({
      tenantId: 't1',
      type: 'SPECIAL',
      status: 'ISSUED',
    })
    assert.equal(result.total, 1)
    assert.equal(result.items[0].type, 'SPECIAL')
    assert.equal(result.items[0].status, 'ISSUED')
  })

  // ═══════════════════════════════════════════════════════════
  // 反例
  // ═══════════════════════════════════════════════════════════

  it('cancelInvoice: 重复作废抛出 ConflictException', async () => {
    const cancelled = makeDraftInvoice('inv-double-cancel', { status: 'CANCELLED', cancelledAt: new Date() })
    mockPrismaFindUnique('inv-double-cancel', cancelled)

    await assert.rejects(
      () => svc.cancelInvoice('inv-double-cancel', tenantT1),
      (err: any) => {
        assert.ok(err instanceof ConflictException)
        assert.match(err.message, /already cancelled/)
        return true
      }
    )
  })

  it('issueInvoice: 非 DRAFT 状态 issue 抛出 BadRequestException', async () => {
    const issued = makeDraftInvoice('inv-issue-twice', { status: 'ISSUED', issuedAt: new Date() })
    mockPrismaFindUnique('inv-issue-twice', issued)

    await assert.rejects(
      () => svc.issueInvoice('inv-issue-twice', tenantT1),
      (err: any) => {
        assert.ok(err instanceof BadRequestException)
        assert.match(err.message, /Cannot issue/)
        assert.match(err.message, /ISSUED/)
        return true
      }
    )
  })

  it('getInvoice: 跨租户访问抛出 NotFoundException', async () => {
    // 发票属于 t1, 用 t2 访问
    const draft = makeDraftInvoice('inv-cross-tenant')
    mockPrismaFindUnique('inv-cross-tenant', draft)

    await assert.rejects(
      () => svc.getInvoice('inv-cross-tenant', tenantT2),
      (err: any) => {
        assert.ok(err instanceof NotFoundException)
        assert.match(err.message, /not found/)
        return true
      }
    )
  })

  it('getInvoice: 不存在发票抛出 NotFoundException', async () => {
    mockPrismaFindUnique('inv-not-exist', null)

    await assert.rejects(
      () => svc.getInvoice('inv-not-exist', tenantT1),
      (err: any) => {
        assert.ok(err instanceof NotFoundException)
        assert.match(err.message, /not found/)
        return true
      }
    )
  })

  // ═══════════════════════════════════════════════════════════
  // 边界
  // ═══════════════════════════════════════════════════════════

  it('createInvoice: orderId 为 null 时创建成功', async () => {
    mockPrismaFindFirst(null)

    const result = await svc.createInvoice(tenantT1, {
      tenantId: 't1',
      orderId: null,
      type: 'PAPER',
      amountCents: 5000,
    })

    assert.equal(result.orderId, null)
    assert.equal(result.type, 'PAPER')
    assert.equal(result.amountCents, 5000)
  })

  it('createInvoice: amountCents 为 0 时正常创建', async () => {
    mockPrismaFindFirst(null)

    const result = await svc.createInvoice(tenantT1, {
      tenantId: 't1',
      type: 'SPECIAL',
      amountCents: 0,
      taxAmountCents: 0,
    })

    assert.equal(result.amountCents, 0)
    assert.equal(result.taxAmountCents, 0)
    assert.equal(result.status, 'DRAFT')
  })
})
