/**
 * expense.service.spec.ts - ExpenseService 单元测试 (V2)
 *
 * 15+ tests covering:
 * - create/submit/approve/reject/reimburse/cancel lifecycle
 * - filtering, statistics, approval history
 * - error/edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ExpenseService } from './expense.service'
import type { ExpenseCategory, ExpenseStatus } from './expense.entity'

function makeService(): ExpenseService {
  return new ExpenseService()
}

function makeInput(opts?: Partial<{
  title: string
  category: ExpenseCategory
  amount: number
  applicantId: string
  applicantName: string
  storeId: string
  expenseDate: string
  description: string
  attachments: string[]
}>): Parameters<ExpenseService['createExpense']>[0] {
  return {
    title: opts?.title ?? '测试费用申请',
    category: opts?.category ?? 'travel',
    amount: opts?.amount ?? 1500,
    applicantId: opts?.applicantId ?? 'user-001',
    applicantName: opts?.applicantName ?? '测试用户',
    storeId: opts?.storeId ?? 'store-001',
    expenseDate: opts?.expenseDate ?? '2026-07-20',
    description: opts?.description ?? '费用描述',
    attachments: opts?.attachments,
  }
}

describe('ExpenseService', () => {
  let svc: ExpenseService

  beforeEach(() => {
    svc = makeService()
  })

  // ─── 1. 创建 ─────────────────────────────────

  describe('createExpense', () => {
    it('创建费用申请成功, 返回草稿状态', () => {
      const exp = svc.createExpense(makeInput())
      expect(exp.id).toBeTruthy()
      expect(exp.code).toMatch(/^EXP\d{6}$/)
      expect(exp.status).toBe('draft')
      expect(exp.title).toBe('测试费用申请')
      expect(exp.amount).toBe(1500)
    })

    it('连续创建, code 自动递增', () => {
      const e1 = svc.createExpense(makeInput())
      const e2 = svc.createExpense(makeInput())
      expect(Number(e1.code.slice(3))).toBeLessThan(Number(e2.code.slice(3)))
    })

    it('支持所有费用类别', () => {
      const cats: ExpenseCategory[] = ['travel', 'accommodation', 'meals', 'office', 'equipment', 'marketing', 'training', 'maintenance', 'other']
      for (const cat of cats) {
        const exp = svc.createExpense(makeInput({ category: cat }))
        expect(exp.category).toBe(cat)
      }
    })

    it('未传 attachments 时默认为空数组', () => {
      const exp = svc.createExpense({ ...makeInput(), attachments: undefined as any })
      expect(exp.attachments).toEqual([])
    })

    it('创建成功后自动写入审批记录', () => {
      const exp = svc.createExpense(makeInput())
      const hist = svc.getApprovalHistory(exp.id)
      expect(hist.length).toBe(1)
      expect(hist[0].action).toBe('submit')
    })
  })

  // ─── 2. 查询 ─────────────────────────────────

  describe('getExpense / listExpenses', () => {
    it('getExpense 返回已存在的申请', () => {
      const created = svc.createExpense(makeInput())
      const found = svc.getExpense(created.id)
      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
    })

    it('getExpense 不存在的 id 返回 null', () => {
      expect(svc.getExpense('non-existent')).toBeNull()
    })

    it('listExpenses 按 status 过滤, 结果不含其他状态', () => {
      const d1 = svc.createExpense(makeInput())
      svc.submitExpense(d1.id)
      const pending = svc.listExpenses({ status: 'pending' })
      expect(pending.every(e => e.status === 'pending')).toBe(true)
    })

    it('listExpenses 按 applicantId 过滤', () => {
      svc.createExpense(makeInput({ applicantId: 'u1' }))
      svc.createExpense(makeInput({ applicantId: 'u2' }))
      expect(svc.listExpenses({ applicantId: 'u1' }).length).toBeGreaterThanOrEqual(1)
      expect(svc.listExpenses({ applicantId: 'u1' }).every(e => e.applicantId === 'u1')).toBe(true)
    })

    it('listExpenses 按时间段过滤', () => {
      const exp = svc.createExpense(makeInput())
      const now = exp.createdAt
      const from = new Date(new Date(now).getTime() - 1000).toISOString()
      const to = new Date(new Date(now).getTime() + 1000).toISOString()
      expect(svc.listExpenses({ from, to }).length).toBeGreaterThanOrEqual(1)
    })
  })

  // ─── 3. 审批流程 ─────────────────────────────

  describe('submitExpense / approveExpense', () => {
    it('提交 draft → pending', () => {
      const exp = svc.createExpense(makeInput())
      const submitted = svc.submitExpense(exp.id)
      expect(submitted.status).toBe('pending')
    })

    it('非 draft 状态提交抛错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      expect(() => svc.submitExpense(exp.id)).toThrow()
    })

    it('审批通过 pending → approved', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      const approved = svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      expect(approved.status).toBe('approved')
      expect(approved.approverId).toBe('admin-1')
    })

    it('审批驳回 pending → rejected', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      const rejected = svc.approveExpense(exp.id, 'reject', 'admin-1', '管理员', '不符合报销条件')
      expect(rejected.status).toBe('rejected')
      expect(rejected.approvalRemark).toBe('不符合报销条件')
    })

    it('非 pending 状态审批抛错', () => {
      const exp = svc.createExpense(makeInput())
      expect(() => svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')).toThrow()
    })

    it('报销 approved → reimbursed', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      const reimbursed = svc.reimburseExpense(exp.id, 'bank', '6217****1234', 'admin-1', '财务')
      expect(reimbursed.status).toBe('reimbursed')
      expect(reimbursed.reimbursementMethod).toBe('bank')
      expect(reimbursed.reimbursementAccount).toBe('6217****1234')
    })

    it('非 approved 状态报销抛错', () => {
      const exp = svc.createExpense(makeInput())
      expect(() => svc.reimburseExpense(exp.id, 'cash', 'xxx', 'op', 'op')).toThrow()
    })

    it('已报销不可取消', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      svc.reimburseExpense(exp.id, 'bank', 'acc', 'admin-1', '财务')
      expect(() => svc.cancelExpense(exp.id, 'admin-1', '管理员')).toThrow()
    })
  })

  // ─── 4. 取消与删除 ──────────────────────────────

  describe('cancelExpense / deleteExpense', () => {
    it('取消 pending 状态成功', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      const cancelled = svc.cancelExpense(exp.id, 'user-001', '测试用户', '不再需要')
      expect(cancelled.status).toBe('cancelled')
    })

    it('取消 draft 状态成功', () => {
      const exp = svc.createExpense(makeInput())
      const cancelled = svc.cancelExpense(exp.id, 'user-001', '测试用户')
      expect(cancelled.status).toBe('cancelled')
    })

    it('已取消状态再次取消抛错', () => {
      const exp = svc.createExpense(makeInput())
      svc.cancelExpense(exp.id, 'u1', 'u1')
      expect(() => svc.cancelExpense(exp.id, 'u1', 'u1')).toThrow()
    })

    it('删除 draft 状态成功', () => {
      const exp = svc.createExpense(makeInput())
      expect(svc.deleteExpense(exp.id)).toBe(true)
      expect(svc.getExpense(exp.id)).toBeNull()
    })

    it('删除非 draft 状态抛错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      expect(() => svc.deleteExpense(exp.id)).toThrow()
    })

    it('删除不存在的返回 false', () => {
      expect(svc.deleteExpense('non-existent')).toBe(false)
    })
  })

  // ─── 5. 审批历史 ──────────────────────────────

  describe('getApprovalHistory / getExpenseDetail', () => {
    it('审批操作后历史记录数正确', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      const hist = svc.getApprovalHistory(exp.id)
      expect(hist.length).toBe(3) // 创建(submit) + 提交(submit) + approve
    })

    it('getExpenseDetail 包含审批历史', () => {
      const exp = svc.createExpense(makeInput())
      const detail = svc.getExpenseDetail(exp.id)
      expect(detail).not.toBeNull()
      expect(detail!.approvalHistory).toBeDefined()
    })
  })

  // ─── 6. 统计 ──────────────────────────────────

  describe('getExpenseSummary', () => {
    it('统计包含各类聚合数据', () => {
      const summary = svc.getExpenseSummary('2026-07', '2026-07-01', '2026-07-31')
      expect(summary.period).toBe('2026-07')
      expect(summary.totalApplications).toBeGreaterThan(0)
      expect(typeof summary.totalAmount).toBe('number')
      expect(typeof summary.byCategory).toBe('object')
      expect(typeof summary.byStore).toBe('object')
    })

    it('按门店过滤统计', () => {
      svc.createExpense(makeInput({ storeId: 'store-filter' }))
      const summary = svc.getExpenseSummary('test', '2026-01-01', '2026-12-31', 'store-filter')
      expect(summary.totalApplications).toBeGreaterThanOrEqual(1)
    })
  })
})
