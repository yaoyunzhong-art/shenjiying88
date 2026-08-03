import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * expense.service.test.ts — ExpenseService 单元测试
 *
 * 覆盖内容（每个 describe 分组 ≥3 tests）：
 * - 费用申请创建（正常/字段验证）
 * - 提交审批流程（draft → pending → approved/rejected）
 * - 报销执行（approved → reimbursed）
 * - 取消申请（多种状态取消/已报销不可取消）
 * - 预算/金额检查
 * - 费用分类统计
 * - 异常上报/错误处理
 * - 审批历史记录
 * - 费用查询过滤
 * - 删除费用申请
 * - 边界/异常场景
 *
 * 总计 ≥15 个测试用例
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ExpenseService } from './expense.service'
import type { ExpenseCategory, ExpenseStatus } from './expense.entity'

// ═══════════════════════════════════════════════════════════════
// 辅助: 工厂函数
// ═══════════════════════════════════════════════════════════════

function makeService() {
  return new ExpenseService()
}

function createExpenseInput(opts?: {
  title?: string
  category?: ExpenseCategory
  amount?: number
  applicantId?: string
  applicantName?: string
  storeId?: string
}) {
  return {
    title: '测试费用申请',
    category: (opts?.category ?? 'travel') as ExpenseCategory,
    amount: opts?.amount ?? 1500,
    applicantId: opts?.applicantId ?? 'user-001',
    applicantName: opts?.applicantName ?? '测试用户',
    storeId: opts?.storeId ?? 'store-001',
    expenseDate: '2026-07-20',
    description: '费用描述',
    attachments: [],
  }
}

// ═══════════════════════════════════════════════════════════════
// ExpenseService 单元测试
// ═══════════════════════════════════════════════════════════════

describe('ExpenseService — 费用报销', () => {
  let svc: ExpenseService

  beforeEach(() => {
    svc = makeService()
  })

  // ── 1. 创建费用申请 ─────────────────────────

  describe('创建费用申请 (createExpense)', () => {
    it('正常创建费用申请返回含 id/code 的对象', () => {
      const exp = svc.createExpense(createExpenseInput())
      assert.ok(exp.id)
      assert.ok(exp.code.startsWith('EXP'))
      assert.equal(exp.title, '测试费用申请')
      assert.equal(exp.status, 'draft')
      assert.equal(exp.amount, 1500)
      assert.equal(exp.applicantId, 'user-001')
    })

    it('创建时自动生成唯一编码 code 递增', () => {
      const e1 = svc.createExpense(createExpenseInput())
      const e2 = svc.createExpense(createExpenseInput())
      assert.notEqual(e1.code, e2.code)
    })

    it('创建费用可指定不同类别', () => {
      const categories: ExpenseCategory[] = ['travel', 'meals', 'office', 'equipment', 'marketing', 'training', 'accommodation', 'maintenance', 'other']
      for (const cat of categories) {
        const exp = svc.createExpense(createExpenseInput({ category: cat }))
        assert.equal(exp.category, cat)
      }
    })

    it('创建时可携带附件', () => {
      const exp = svc.createExpense({
        ...createExpenseInput(),
        attachments: ['https://example.com/doc1.pdf', 'https://example.com/img.jpg'],
      })
      assert.equal(exp.attachments.length, 2)
    })

    it('未传 attachments 时默认为空数组', () => {
      const input = createExpenseInput()
      delete (input as any).attachments
      const exp = svc.createExpense(input)
      assert.deepEqual(exp.attachments, [])
    })
  })

  // ── 2. 查询费用申请 ─────────────────────────

  describe('查询费用申请 (getExpense / listExpenses)', () => {
    it('getExpense 返回已存在的申请', () => {
      const created = svc.createExpense(createExpenseInput())
      const found = svc.getExpense(created.id)
      assert.ok(found)
      assert.equal(found!.id, created.id)
    })

    it('getExpense 不存在的 id 返回 null', () => {
      assert.equal(svc.getExpense('non-existent'), null)
    })

    it('listExpenses 默认返回所有（含种子数据）', () => {
      svc.createExpense(createExpenseInput())
      const list = svc.listExpenses()
      // seed 3 + new 1 = 4
      assert.ok(list.length >= 4)
    })

    it('listExpenses 按 status 过滤', () => {
      const c1 = svc.createExpense(createExpenseInput())
      svc.submitExpense(c1.id)
      const pendingList = svc.listExpenses({ status: 'pending' as ExpenseStatus })
      assert.ok(pendingList.length >= 1)
      assert.equal(pendingList.filter((e) => e.status !== 'pending').length, 0)
    })

    it('listExpenses 按 category 过滤', () => {
      svc.createExpense(createExpenseInput({ category: 'office' }))
      const officeList = svc.listExpenses({ category: 'office' as ExpenseCategory })
      assert.ok(officeList.length >= 1)
      officeList.forEach((e) => assert.equal(e.category, 'office'))
    })

    it('listExpenses 按 applicantId 过滤', () => {
      svc.createExpense(createExpenseInput({ applicantId: 'user-filter' }))
      const list = svc.listExpenses({ applicantId: 'user-filter' })
      assert.ok(list.length >= 1)
      list.forEach((e) => assert.equal(e.applicantId, 'user-filter'))
    })

    it('listExpenses 按 storeId 过滤', () => {
      svc.createExpense(createExpenseInput({ storeId: 'store-filter' }))
      const list = svc.listExpenses({ storeId: 'store-filter' })
      assert.ok(list.length >= 1)
      list.forEach((e) => assert.equal(e.storeId, 'store-filter'))
    })
  })

  // ── 3. 提交 & 审批流程 ──────────────────────

  describe('提交与审批流程 (submit / approve / reject)', () => {
    it('draft 申请可提交变 pending', () => {
      const exp = svc.createExpense(createExpenseInput())
      const submitted = svc.submitExpense(exp.id)
      assert.equal(submitted.status, 'pending')
    })

    it('非 draft 状态提交抛 BadRequest', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      assert.throws(
        () => svc.submitExpense(exp.id),
        /cannot submit/i,
      )
    })

    it('pending 申请可审批通过变 approved', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      const approved = svc.approveExpense(exp.id, 'approve', 'admin-001', '管理员', '同意')
      assert.equal(approved.status, 'approved')
      assert.equal(approved.approverId, 'admin-001')
      assert.equal(approved.approvalRemark, '同意')
    })

    it('pending 申请可驳回变 rejected', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      const rejected = svc.approveExpense(exp.id, 'reject', 'admin-001', '管理员', '金额不合理')
      assert.equal(rejected.status, 'rejected')
      assert.equal(rejected.approvalRemark, '金额不合理')
    })

    it('非 pending 状态审批抛 BadRequest', () => {
      const exp = svc.createExpense(createExpenseInput())
      // draft 直接审批
      assert.throws(
        () => svc.approveExpense(exp.id, 'approve', 'admin-001', '管理员', ''),
        /cannot approve/i,
      )
    })

    it('不存在的 expense 审批抛 NotFound', () => {
      assert.throws(
        () => svc.approveExpense('no-such', 'approve', 'admin', 'Admin', ''),
        /not found/i,
      )
    })
  })

  // ── 4. 报销执行 ─────────────────────────────

  describe('报销执行 (reimburseExpense)', () => {
    it('approved 状态可执行报销变 reimbursed', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-001', '管理员', '同意')
      const reimbursed = svc.reimburseExpense(exp.id, 'bank', '6217****1234', 'fin-001', '财务')
      assert.equal(reimbursed.status, 'reimbursed')
      assert.equal(reimbursed.reimbursementMethod, 'bank')
      assert.equal(reimbursed.reimbursementAccount, '6217****1234')
    })

    it('非 approved 状态报销抛 BadRequest', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      // pending 直接报销
      assert.throws(
        () => svc.reimburseExpense(exp.id, 'cash', 'acc-001', 'fin', '财务'),
        /cannot reimburse/i,
      )
    })

    it('不同报销方式均可正常工作', () => {
      const methods = ['bank', 'cash', 'wechat', 'alipay'] as const
      for (const method of methods) {
        const svc2 = makeService()
        const exp = svc2.createExpense(createExpenseInput())
        svc2.submitExpense(exp.id)
        svc2.approveExpense(exp.id, 'approve', 'admin', 'Admin', '')
        const result = svc2.reimburseExpense(exp.id, method, 'acc-001', 'fin', '财务')
        assert.equal(result.reimbursementMethod, method)
      }
    })
  })

  // ── 5. 取消申请 ─────────────────────────────

  describe('取消申请 (cancelExpense)', () => {
    it('draft 状态可取消', () => {
      const exp = svc.createExpense(createExpenseInput())
      const cancelled = svc.cancelExpense(exp.id, 'user-001', '测试用户', '不需要了')
      assert.equal(cancelled.status, 'cancelled')
    })

    it('pending 状态可取消', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      const cancelled = svc.cancelExpense(exp.id, 'user-001', '测试用户')
      assert.equal(cancelled.status, 'cancelled')
    })

    it('reimbursed 状态不可取消抛 BadRequest', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin', 'Admin', '')
      svc.reimburseExpense(exp.id, 'bank', 'acc', 'fin', '财务')
      assert.throws(
        () => svc.cancelExpense(exp.id, 'u', 'user', ''),
        /cannot cancel a reimbursed/i,
      )
    })

    it('已取消申请再次取消抛 BadRequest', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.cancelExpense(exp.id, 'u', 'user', '')
      assert.throws(
        () => svc.cancelExpense(exp.id, 'u', 'user', ''),
        /already cancelled/i,
      )
    })

    it('不存在的 expense 取消抛 NotFound', () => {
      assert.throws(
        () => svc.cancelExpense('no-such', 'u', 'user', ''),
        /not found/i,
      )
    })
  })

  // ── 6. 删除费用申请 ─────────────────────────

  describe('删除费用申请 (deleteExpense)', () => {
    it('draft 状态可删除返回 true', () => {
      const exp = svc.createExpense(createExpenseInput())
      const result = svc.deleteExpense(exp.id)
      assert.equal(result, true)
      assert.equal(svc.getExpense(exp.id), null)
    })

    it('非 draft 状态删除抛 BadRequest', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      assert.throws(
        () => svc.deleteExpense(exp.id),
        /cannot delete/i,
      )
    })

    it('不存在的 expense 删除返回 false', () => {
      assert.equal(svc.deleteExpense('no-such'), false)
    })
  })

  // ── 7. 审批历史 ─────────────────────────────

  describe('审批历史 (getApprovalHistory / getExpenseDetail)', () => {
    it('创建后审批历史包含 submit 记录', () => {
      const exp = svc.createExpense(createExpenseInput())
      const history = svc.getApprovalHistory(exp.id)
      assert.ok(history.length >= 1)
      assert.equal(history[0]!.action, 'submit')
    })

    it('审批通过后历史包含 approve 记录', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-001', '管理员', '同意')
      const history = svc.getApprovalHistory(exp.id)
      assert.equal(history.length, 2)
      assert.equal(history[1]!.action, 'approve')
    })

    it('getExpenseDetail 包含审批历史', () => {
      const exp = svc.createExpense(createExpenseInput())
      svc.submitExpense(exp.id)
      const detail = svc.getExpenseDetail(exp.id)
      assert.ok(detail)
      assert.ok(detail!.approvalHistory)
      assert.ok(detail!.approvalHistory!.length >= 2)
    })
  })

  // ── 8. 费用统计 ─────────────────────────────

  describe('费用统计 (getExpenseSummary)', () => {
    it('统计包含总申请数和总金额', () => {
      const summary = svc.getExpenseSummary('monthly', '2026-07-01', '2026-07-31')
      assert.ok(summary.totalApplications >= 3) // seed data
      assert.ok(summary.totalAmount > 0)
    })

    it('按 storeId 过滤统计', () => {
      const summary = svc.getExpenseSummary('monthly', '2026-07-01', '2026-07-31', 'store-001')
      assert.ok(summary.totalAmount > 0)
    })

    it('byCategory 统计各分类金额正确', () => {
      svc.createExpense(createExpenseInput({ category: 'meals', amount: 500 }))
      svc.createExpense(createExpenseInput({ category: 'office', amount: 1000 }))
      const summary = svc.getExpenseSummary('daily', '2026-07-20', '2026-07-20')
      assert.equal(summary.byCategory['meals'], 500)
      assert.equal(summary.byCategory['office'], 1000)
    })

    it('byStore 正确按门店汇总', () => {
      svc.createExpense(createExpenseInput({ storeId: 'store-a', amount: 200 }))
      svc.createExpense(createExpenseInput({ storeId: 'store-b', amount: 300 }))
      const summary = svc.getExpenseSummary('daily', '2026-07-20', '2026-07-20')
      assert.ok(summary.byStore['store-a'] >= 200)
      assert.ok(summary.byStore['store-b'] >= 300)
    })

    it('统计中已报销和待审批金额区分', () => {
      const summary = svc.getExpenseSummary('monthly', '2026-07-01', '2026-07-31')
      // seed: travel (2500 approved), meals (1800 pending), office (3500 reimbursed)
      assert.equal(summary.totalReimbursed, 3500)
      assert.equal(summary.totalPending, 1800)
    })
  })

  // ── 9. 边界 / 异常 ──────────────────────────

  describe('边界与异常', () => {
    it('费用金额可为 0（应允许创建）', () => {
      const exp = svc.createExpense(createExpenseInput({ amount: 0 }))
      assert.equal(exp.amount, 0)
    })

    it('超长 title 不截断（不抛出）', () => {
      const longTitle = 'A'.repeat(500)
      const exp = svc.createExpense({ ...createExpenseInput(), title: longTitle })
      assert.equal(exp.title, longTitle)
    })

    it('不存在的 expense getExpense 返回 null', () => {
      assert.equal(svc.getExpense('non-existent'), null)
    })

    it('getExpenseDetail 不存在的 id 返回 null', () => {
      assert.equal(svc.getExpenseDetail('non-existent'), null)
    })

    it('listExpenses 多重过滤组合', () => {
      const exp = svc.createExpense(createExpenseInput({
        category: 'meals',
        amount: 800,
        applicantId: 'user-multi',
        storeId: 'store-multi',
      }))
      svc.submitExpense(exp.id)
      const list = svc.listExpenses({
        status: 'pending' as ExpenseStatus,
        category: 'meals' as ExpenseCategory,
        applicantId: 'user-multi',
        storeId: 'store-multi',
      })
      assert.ok(list.length >= 1)
      list.forEach((e) => {
        assert.equal(e.status, 'pending')
        assert.equal(e.category, 'meals')
        assert.equal(e.applicantId, 'user-multi')
        assert.equal(e.storeId, 'store-multi')
      })
    })
  })

  // ── 10. 集成场景 ────────────────────────────

  describe('集成场景 (全流程)', () => {
    it('创建→提交→审批→报销→查询详情完整流程', () => {
      const exp = svc.createExpense(createExpenseInput({
        title: '出差费用',
        category: 'travel',
        amount: 3000,
      }))
      assert.equal(exp.status, 'draft')

      svc.submitExpense(exp.id)
      assert.equal(svc.getExpense(exp.id)!.status, 'pending')

      svc.approveExpense(exp.id, 'approve', 'admin-001', '管理员', '同意出差')
      assert.equal(svc.getExpense(exp.id)!.status, 'approved')

      svc.reimburseExpense(exp.id, 'bank', '6217****5678', 'fin-001', '财务')
      assert.equal(svc.getExpense(exp.id)!.status, 'reimbursed')

      const detail = svc.getExpenseDetail(exp.id)
      assert.ok(detail)
      assert.equal(detail!.approvalHistory!.length, 4) // submit + submit + approve + reimburse
    })

    it('种子数据可正常查询', () => {
      // seed 数据: exp-seed-travel, exp-seed-meals, exp-seed-office
      const travel = svc.getExpense('exp-seed-travel')
      assert.ok(travel)
      assert.equal(travel!.title, '出差交通费')

      const meals = svc.getExpense('exp-seed-meals')
      assert.ok(meals)
      assert.equal(meals!.status, 'pending')

      const office = svc.getExpense('exp-seed-office')
      assert.ok(office)
      assert.equal(office!.status, 'reimbursed')
    })
  })
})
