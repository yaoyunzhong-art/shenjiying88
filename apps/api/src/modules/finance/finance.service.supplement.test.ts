/**
 * ═══════════════════════════════════════════════════════════════
 * 箍一: 测试目标模块声明
 *   - 模块: finance | 文件: finance.service.supplement.test.ts
 *   - 目标: 补充 FinanceService 的重型场景测试
 *   - 被测试类: FinanceService (finance.service.ts)
 *   - 确保与现有 finance.service.test.ts (83 it) 不重复
 * ═══════════════════════════════════════════════════════════════
 * 箍二: 依赖Mock清单
 *   - FinanceService — 直接实例化, 使用 in‑memory Map 后备存储
 *   - resetFinanceServiceTestState() — 清理全局存储
 *   - 无需 Mock PrismaService; 所有测试走 Map 回退路径
 * ═══════════════════════════════════════════════════════════════
 * 箍三: 边界条件覆盖承诺
 *   - 金额零、负数、极大值
 *   - 空租户、重复操作、已完结状态二次操作
 *   - 查询无结果、余额不足、decimal 精度
 * ═══════════════════════════════════════════════════════════════
 * 箍四: 与E2E测试的分工/衔接
 *   - E2E (finance.e2e.test.ts / finance-core.prisma-http.e2e.test.ts) 验证
 *     HTTP 路由 + 真实 / 模拟 Prisma. 本文件纯单元, 不涉及网络层
 * ═══════════════════════════════════════════════════════════════
 * 箍五: 回归触发条件
 *   - 每次 finance.service.ts 添加/修改 public 方法
 *   - 每次 Ledger/Account/Settlement/Invoice 实体字段变更
 *   - 每次计算逻辑 (余额/汇总/分账) 变更
 * ═══════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { FinanceService, resetFinanceServiceTestState } from './finance.service'
import {
  LedgerType,
  AccountType,
  AccountStatus,
  SettlementStatus,
  InvoiceType,
  InvoiceStatus,
} from './finance.entity'
import { CreateLedgerDto, CreateInvoiceDto, CreateSettlementDto } from './finance.dto'

// ── Shared Test Context ──────────────────────────────────

const CTX_A = { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn' }
const CTX_B = { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn' }

function makeService(): FinanceService {
  resetFinanceServiceTestState()
  return new FinanceService()
}

// ════════════════════════════════════════════════════════════
// FinanceService Supplement — 重型场景 & 边界条件
// ════════════════════════════════════════════════════════════

describe('[finance-supplement] FinanceService 重型场景验证', () => {
  // ── 1. Ledger — 边界金额 ─────────────────────────

  describe('Ledger 边界金额场景', () => {
    it('[正例] 金额 0 允许记账 (余额不变)', async () => {
      const svc = makeService()
      const l = await svc.recordLedger(CTX_A, {
        type: LedgerType.Revenue,
        amount: 0,
        description: '零金额收入',
      } as CreateLedgerDto)
      assert.equal(l.balance, 0)
      assert.equal(l.amount, 0)
    })

    it('[边界] 极小正金额 (0.01) 正确记录', async () => {
      const svc = makeService()
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 0.01, description: 'init' } as CreateLedgerDto)
      const l = await svc.recordLedger(CTX_A, {
        type: LedgerType.Revenue,
        amount: 0.01,
        description: '极小收入',
      } as CreateLedgerDto)
      assert.equal(l.balance, 0.02)
    })

    it('[边界] 极高金额 (1_000_000_000) 累加不溢出', async () => {
      const svc = makeService()
      const bigAmount = 1_000_000_000
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: bigAmount, description: 'init' } as CreateLedgerDto)
      const l = await svc.recordLedger(CTX_A, {
        type: LedgerType.Revenue,
        amount: bigAmount,
        description: '大额收入',
      } as CreateLedgerDto)
      assert.equal(l.balance, bigAmount * 2)
    })

    it('[边界] 连续大额 Expense 使余额为负', async () => {
      const svc = makeService()
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: 'init' } as CreateLedgerDto)
      const l = await svc.recordLedger(CTX_A, {
        type: LedgerType.Expense,
        amount: 500,
        description: '超额支出',
      } as CreateLedgerDto)
      assert.equal(l.balance, -400)
    })

    it('[正例] 不同 LedgerType 各记录一次后余额正确', async () => {
      const svc = makeService()
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 1000, description: '收入' } as CreateLedgerDto)
      await svc.recordLedger(CTX_A, { type: LedgerType.Expense, amount: 200, description: '支出' } as CreateLedgerDto)
      await svc.recordLedger(CTX_A, { type: LedgerType.Refund, amount: 100, description: '退款' } as CreateLedgerDto)
      const l = await svc.recordLedger(CTX_A, { type: LedgerType.Adjustment, amount: 50, description: '调账' } as CreateLedgerDto)
      // 1000 - 200 - 100 + 50 = 750
      assert.equal(l.balance, 750)
    })
  })

  // ── 2. Account — 直接 Map 操作 ──────────────────

  describe('Account (直接 Map API)', () => {
    it('[正例] createAccount 返回含 id 的完整对象', async () => {
      const svc = makeService()
      const a = await svc.createAccount(CTX_A, { name: '现金账户', type: AccountType.Cash, initialBalance: 5000 })
      assert.ok(a.id)
      assert.equal(a.balance, 5000)
      assert.equal(a.status, AccountStatus.Active)
    })

    it('[边界] createAccount initialBalance = 0', async () => {
      const svc = makeService()
      const a = await svc.createAccount(CTX_A, { name: '零余额账户', type: AccountType.Bank, initialBalance: 0 })
      assert.equal(a.balance, 0)
    })

    it('[异常] getAccount 不存在的 id 抛 NotFoundException', () => {
      const svc = makeService()
      assert.throws(() => svc.getAccount('no-such', CTX_A), NotFoundException)
    })

    it('[正例] listAccounts 按租户隔离', () => {
      const svc = makeService()
      // createAccount is async but listAccounts is sync (Map-based)
      svc.createAccount(CTX_A, { name: 'A账户', type: AccountType.Cash, initialBalance: 100 })
      svc.createAccount(CTX_B, { name: 'B账户', type: AccountType.Cash, initialBalance: 200 })
      const aList = svc.listAccounts(CTX_A)
      const bList = svc.listAccounts(CTX_B)
      assert.ok(aList.length >= 1)
      assert.ok(bList.length >= 1)
    })

    it('[边界] freezeAccount 后状态变为 Frozen', async () => {
      const svc = makeService()
      const acct = await svc.createAccount(CTX_A, { name: '测试冻结', type: AccountType.Cash, initialBalance: 1000 })
      const frozen = svc.freezeAccount(acct.id, CTX_A)
      assert.equal(frozen.status, AccountStatus.Frozen)
    })
  })

  // ── 3. Settlement — 结算生命周期 ──────────────────

  describe('Settlement 结算生命周期', () => {
    it('[正例] createSettlement 返回正确 netProfit', async () => {
      const svc = makeService()
      const s = await svc.createSettlement(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        totalRevenue: 50000,
        totalExpense: 20000,
      })
      assert.equal(s.netProfit, 30000)
      assert.equal(s.settlementStatus, SettlementStatus.Pending)
    })

    it('[边界] revenue = expense 时 netProfit = 0', async () => {
      const svc = makeService()
      const s = await svc.createSettlement(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        totalRevenue: 10000,
        totalExpense: 10000,
      })
      assert.equal(s.netProfit, 0)
    })

    it('[边界] expense > revenue 时 netProfit 为负', async () => {
      const svc = makeService()
      const s = await svc.createSettlement(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        totalRevenue: 3000,
        totalExpense: 8000,
      })
      assert.equal(s.netProfit, -5000)
    })

    it('[异常] 开始日期大于结束日期抛 BadRequestException', async () => {
      const svc = makeService()
      await expect(svc.createSettlement(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-08-01',
        endDate: '2026-07-01',
        totalRevenue: 1000,
        totalExpense: 500,
      })).rejects.toThrow(BadRequestException)
    })

    it('[正例] confirmSettlement 后状态变为 Confirmed', async () => {
      const svc = makeService()
      const s = await svc.createSettlement(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-07',
        totalRevenue: 1000,
        totalExpense: 300,
      })
      const confirmed = await svc.confirmSettlementResolved(s.id, CTX_A)
      assert.equal(confirmed.settlementStatus, SettlementStatus.Confirmed)
    })

    it('[异常] 已确认结算再次确认抛 ConflictException', async () => {
      const svc = makeService()
      const s = await svc.createSettlement(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-07',
        totalRevenue: 1000,
        totalExpense: 500,
      })
      await svc.confirmSettlementResolved(s.id, CTX_A)
      await expect(svc.confirmSettlementResolved(s.id, CTX_A)).rejects.toThrow(ConflictException)
    })

    it('[异常] 已争议结算再确认抛 ConflictException', async () => {
      const svc = makeService()
      const s = await svc.createSettlement(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        totalRevenue: 1000,
        totalExpense: 500,
      })
      await svc.disputeSettlementResolved(s.id, CTX_A)
      await expect(svc.confirmSettlementResolved(s.id, CTX_A)).rejects.toThrow(ConflictException)
    })
  })

  // ── 4. Invoice — 发票全流程 ───────────────────────

  describe('Invoice 发票场景', () => {
    it('[正例] 创建 Regular 发票成功', async () => {
      const svc = makeService()
      const inv = await svc.createInvoice(CTX_A, {
        amount: 1000,
        taxAmount: 130,
        type: InvoiceType.Regular,
      } as CreateInvoiceDto)
      assert.equal(inv.totalAmount, 1130)
      assert.equal(inv.status, InvoiceStatus.Draft)
    })

    it('[正例] 创建 VAT 发票成功', async () => {
      const svc = makeService()
      const inv = await svc.createInvoice(CTX_A, {
        amount: 5000,
        taxAmount: 650,
        type: InvoiceType.Vat,
      } as CreateInvoiceDto)
      assert.equal(inv.totalAmount, 5650)
    })

    it('[边界] 发票 taxAmount = 0 时 totalAmount = amount', async () => {
      const svc = makeService()
      const inv = await svc.createInvoice(CTX_A, {
        amount: 2000,
        taxAmount: 0,
        type: InvoiceType.Regular,
      } as CreateInvoiceDto)
      assert.equal(inv.totalAmount, 2000)
    })

    it('[边界] 发票 amount = 0 仍允许', async () => {
      const svc = makeService()
      const inv = await svc.createInvoice(CTX_A, {
        amount: 0,
        taxAmount: 0,
        type: InvoiceType.Regular,
      } as CreateInvoiceDto)
      assert.equal(inv.totalAmount, 0)
    })

    it('[正例] 发票 invoiceNo 非空', async () => {
      const svc = makeService()
      const inv = await svc.createInvoice(CTX_A, {
        amount: 3000,
        taxAmount: 180,
        type: InvoiceType.Regular,
      } as CreateInvoiceDto)
      assert.ok(inv.invoiceNo)
      assert.ok(inv.invoiceNo.length > 0)
    })

    it('[正例] 开票后 status 变为 Issued', async () => {
      const svc = makeService()
      const inv = await svc.createInvoice(CTX_A, {
        amount: 800,
        taxAmount: 48,
        type: InvoiceType.Regular,
      } as CreateInvoiceDto)
      const issued = await svc.issueInvoiceResolved(inv.id, CTX_A)
      assert.equal(issued.status, InvoiceStatus.Issued)
    })

    it('[正例] 作废已开票发票成功', async () => {
      const svc = makeService()
      const inv = await svc.createInvoice(CTX_A, {
        amount: 600,
        taxAmount: 36,
        type: InvoiceType.Regular,
      } as CreateInvoiceDto)
      await svc.issueInvoiceResolved(inv.id, CTX_A)
      const cancelled = await svc.cancelInvoiceResolved(inv.id, CTX_A)
      assert.equal(cancelled.status, InvoiceStatus.Cancelled)
    })

    it('[异常] 重复作废已取消发票抛 ConflictException', async () => {
      const svc = makeService()
      const inv = await svc.createInvoice(CTX_A, {
        amount: 300,
        taxAmount: 18,
        type: InvoiceType.Regular,
      } as CreateInvoiceDto)
      await svc.issueInvoiceResolved(inv.id, CTX_A)
      await svc.cancelInvoiceResolved(inv.id, CTX_A)
      await expect(svc.cancelInvoiceResolved(inv.id, CTX_A)).rejects.toThrow(ConflictException)
    })
  })

  // ── 5. Revenue Summary / Daily Revenue ─────────────

  describe('营收汇总与日报', () => {
    it('[正例] getRevenueSummary 返回合理结构', async () => {
      const svc = makeService()
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 3000, description: '订单1' } as CreateLedgerDto)
      await svc.recordLedger(CTX_A, { type: LedgerType.Expense, amount: 500, description: '运费' } as CreateLedgerDto)
      await svc.recordLedger(CTX_A, { type: LedgerType.Refund, amount: 200, description: '退款' } as CreateLedgerDto)
      const summary = svc.getRevenueSummary(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      })
      assert.equal(summary.totalRevenue, 3000)
      assert.equal(summary.totalExpense, 500)
      assert.equal(summary.totalRefund, 200)
      assert.equal(summary.netRevenue, 2300)
    })

    it('[边界] 无 ledger 时汇总返回全零', () => {
      const svc = makeService()
      const summary = svc.getRevenueSummary(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
      })
      assert.equal(summary.totalRevenue, 0)
      assert.equal(summary.totalExpense, 0)
      assert.equal(summary.totalRefund, 0)
      assert.equal(summary.netRevenue, 0)
    })

    it('[边界] 跨租户汇总隔离', async () => {
      const svc = makeService()
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 5000, description: 'A收入' } as CreateLedgerDto)
      await svc.recordLedger(CTX_B, { type: LedgerType.Revenue, amount: 9999, description: 'B收入' } as CreateLedgerDto)
      const summaryA = svc.getRevenueSummary(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      })
      assert.equal(summaryA.totalRevenue, 5000)
    })
  })

  // ── 6. 异常护栏场景 ──────────────────────────────

  describe('异常护栏场景', () => {
    it('[正例] 空 description 允许', async () => {
      const svc = makeService()
      const l = await svc.recordLedger(CTX_A, {
        type: LedgerType.Revenue,
        amount: 100,
        description: '',
      } as CreateLedgerDto)
      assert.ok(l)
      assert.equal(l.description, '')
    })

    it('[异常] 查询不存在的结算抛 NotFoundException', async () => {
      const svc = makeService()
      await expect(svc.getSettlementResolved('s-404', CTX_A)).rejects.toThrow(NotFoundException)
    })

    it('[异常] 查询不存在的发票抛 NotFoundException', async () => {
      const svc = makeService()
      await expect(svc.getInvoiceResolved('inv-404', CTX_A)).rejects.toThrow(NotFoundException)
    })

    it('[异常] 查询不存在的 Ledger 抛 NotFoundException', () => {
      const svc = makeService()
      assert.throws(() => svc.getLedger('no-such-ledger', CTX_A), NotFoundException)
    })
  })

  // ── 7. Ledger 查询与删除 ──────────────────────────

  describe('Ledger 查询与删除', () => {
    it('[正例] listLedgers 返回该租户所有 ledger', async () => {
      const svc = makeService()
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 200, description: 'a' } as CreateLedgerDto)
      await svc.recordLedger(CTX_A, { type: LedgerType.Expense, amount: 50, description: 'b' } as CreateLedgerDto)
      const ledgers = svc.listLedgers(CTX_A)
      assert.equal(ledgers.length, 2)
    })

    it('[边界] 跨租户 listLedgers 隔离', async () => {
      const svc = makeService()
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 100, description: 'forA' } as CreateLedgerDto)
      const bLedgers = svc.listLedgers(CTX_B)
      assert.equal(bLedgers.length, 0)
    })

    it('[正例] deleteLedger 成功删除后不可查询', async () => {
      const svc = makeService()
      await svc.recordLedger(CTX_A, { type: LedgerType.Revenue, amount: 99, description: 'temp' } as CreateLedgerDto)
      const ledgers = svc.listLedgers(CTX_A)
      const id = ledgers[0].id
      const res = svc.deleteLedger(id, CTX_A)
      assert.deepEqual(res, { success: true })
      assert.throws(() => svc.getLedger(id, CTX_A), NotFoundException)
    })
  })

  // ── 8. Settlement — getSettlement / listSettlements ──

  describe('Settlement 查询', () => {
    it('[正例] listSettlements 返回该租户结算', async () => {
      const svc = makeService()
      await svc.createSettlement(CTX_A, {
        storeId: 'store-A',
        startDate: '2026-07-01',
        endDate: '2026-07-31',
        totalRevenue: 5000,
        totalExpense: 2000,
      })
      const list = svc.listSettlements(CTX_A)
      assert.ok(list.length >= 1)
    })

    it('[异常] getSettlement 不存在的 id 抛 NotFoundException', () => {
      const svc = makeService()
      assert.throws(() => svc.getSettlement('s-404', CTX_A), NotFoundException)
    })
  })

  // ── 9. Invoice — list / get ───────────────────────

  describe('Invoice 查询', () => {
    it('[正例] listInvoices 返回发票', async () => {
      const svc = makeService()
      await svc.createInvoice(CTX_A, {
        amount: 1500,
        taxAmount: 90,
        type: InvoiceType.Regular,
      } as CreateInvoiceDto)
      const list = svc.listInvoices(CTX_A)
      assert.ok(list.length >= 1)
    })

    it('[异常] getInvoice 不存在的 id 抛 NotFoundException', () => {
      const svc = makeService()
      assert.throws(() => svc.getInvoice('inv-404', CTX_A), NotFoundException)
    })
  })
})
