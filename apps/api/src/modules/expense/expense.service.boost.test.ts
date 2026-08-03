/**
 * expense.service.boost.test.ts - ExpenseService 增强单元测试 (B路)
 *
 * 补充覆盖：createExpense 重复创建、submitExpense 重复提交/draft以外状态报错、
 * approveExpense 不存在的ID/reject路径、reimburseExpense 非approved报错、
 * cancelExpense 已报销无法取消、getExpense/listExpenses 各种过滤条件、
 * getExpenseSummary 统计聚合、getApprovalHistory 审批历史、deleteExpense 删除草稿/非草稿报错
 *
 * 总计: 15+ test cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ExpenseService } from './expense.service'
import type { ExpenseCategory } from './expense.entity'

function createService(): ExpenseService {
  return new ExpenseService()
}

function makeInput(overrides?: Partial<{
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
    title: overrides?.title ?? 'Boost测试费用',
    category: overrides?.category ?? 'travel',
    amount: overrides?.amount ?? 1500,
    applicantId: overrides?.applicantId ?? 'user-001',
    applicantName: overrides?.applicantName ?? '测试用户',
    storeId: overrides?.storeId ?? 'store-001',
    expenseDate: overrides?.expenseDate ?? '2026-07-20',
    description: overrides?.description ?? '增强测试费用描述',
    attachments: overrides?.attachments,
  }
}

describe('ExpenseService Boost Tests', () => {
  let svc: ExpenseService

  beforeEach(() => {
    svc = createService()
  })

  // ─── 1. createExpense 增强覆盖 ─────────────────────

  describe('createExpense - 增强覆盖', () => {
    it('创建草稿 expense 返回所有必填字段正确', () => {
      const exp = svc.createExpense(makeInput({
        title: '测试标题',
        category: 'office',
        amount: 999.99,
      }))
      expect(exp.title).toBe('测试标题')
      expect(exp.category).toBe('office')
      expect(exp.amount).toBe(999.99)
      expect(exp.status).toBe('draft')
      expect(exp.id).toBeTruthy()
      expect(exp.code).toMatch(/^EXP\d{6}$/)
    })

    it('重复创建新的 expense 会生成不同的 id 和 code', () => {
      const e1 = svc.createExpense(makeInput())
      const e2 = svc.createExpense(makeInput())
      expect(e1.id).not.toBe(e2.id)
      expect(e1.code).not.toBe(e2.code)
    })

    it('创建带 attachments 的 expense 保存正确', () => {
      const att = ['https://file1.pdf', 'https://file2.jpg']
      const exp = svc.createExpense(makeInput({ attachments: att }))
      expect(exp.attachments).toEqual(att)
      expect(exp.attachments.length).toBe(2)
    })

    it('创建时自动设置 createAt, updatedAt 为 ISO 格式', () => {
      const exp = svc.createExpense(makeInput())
      expect(exp.createdAt).toBeTruthy()
      expect(exp.updatedAt).toBe(exp.createdAt)
      expect(() => new Date(exp.createdAt)).not.toThrow()
    })
  })

  // ─── 2. submitExpense — 重复提交/draft以外状态报错 ─

  describe('submitExpense - 增强覆盖', () => {
    it('正常提交 draft → pending', () => {
      const exp = svc.createExpense(makeInput())
      const result = svc.submitExpense(exp.id)
      expect(result.status).toBe('pending')
      expect(result.updatedAt).toBeTruthy()
    })

    it('重复提交 pending 状态的 expense 报错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      expect(() => svc.submitExpense(exp.id)).toThrow(/Cannot submit expense/)
    })

    it('提交已 approved 状态的 expense 报错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      expect(() => svc.submitExpense(exp.id)).toThrow(/Cannot submit expense/)
    })

    it('提交已 reimbursed 状态的 expense 报错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      svc.reimburseExpense(exp.id, 'bank', 'acc', 'admin-1', '财务')
      expect(() => svc.submitExpense(exp.id)).toThrow(/Cannot submit expense/)
    })

    it('提交已 rejected 状态的 expense 报错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'reject', 'admin-1', '管理员')
      expect(() => svc.submitExpense(exp.id)).toThrow(/Cannot submit expense/)
    })

    it('提交不存在的 expense 抛出 NotFound', () => {
      expect(() => svc.submitExpense('non-existent')).toThrow()
    })
  })

  // ─── 3. approveExpense — approve/reject/非pending/不存在 ──

  describe('approveExpense - 增强覆盖', () => {
    it('审批通过 - approve 路径', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      const result = svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员', '同意')
      expect(result.status).toBe('approved')
      expect(result.approverId).toBe('admin-1')
      expect(result.approvalRemark).toBe('同意')
    })

    it('审批驳回 - reject 路径', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      const result = svc.approveExpense(exp.id, 'reject', 'admin-2', '财务', '发票不合规')
      expect(result.status).toBe('rejected')
      expect(result.approverId).toBe('admin-2')
      expect(result.approvalRemark).toBe('发票不合规')
    })

    it('审批不存在的 ID 抛 NotFoundException', () => {
      expect(() =>
        svc.approveExpense('non-existent', 'approve', 'admin-1', '管理员'),
      ).toThrow()
    })

    it('审批 draft 状态的 expense（未提交）抛 BadRequest', () => {
      const exp = svc.createExpense(makeInput())
      expect(() =>
        svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员'),
      ).toThrow(/Cannot approve expense/)
    })

    it('审批已报销的 expense 抛 BadRequest', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      svc.reimburseExpense(exp.id, 'bank', 'acc', 'admin-1', '财务')
      expect(() =>
        svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员'),
      ).toThrow(/Cannot approve expense/)
    })

    it('审批已取消的 expense 抛 BadRequest', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.cancelExpense(exp.id, 'u1', 'u1')
      expect(() =>
        svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员'),
      ).toThrow(/Cannot approve expense/)
    })
  })

  // ─── 4. reimburseExpense — 非approved报错 ──────────

  describe('reimburseExpense - 增强覆盖', () => {
    it('正常报销 approved → reimbursed', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      const result = svc.reimburseExpense(exp.id, 'cash', '现金', 'admin-1', '财务')
      expect(result.status).toBe('reimbursed')
      expect(result.reimbursementMethod).toBe('cash')
    })

    it('报销 draft 状态报错', () => {
      const exp = svc.createExpense(makeInput())
      expect(() => svc.reimburseExpense(exp.id, 'bank', 'acc', 'op', 'op')).toThrow(
        /Cannot reimburse expense/,
      )
    })

    it('报销 pending 状态报错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      expect(() => svc.reimburseExpense(exp.id, 'bank', 'acc', 'op', 'op')).toThrow(
        /Cannot reimburse expense/,
      )
    })

    it('报销 rejected 状态报错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'reject', 'admin-1', '管理员')
      expect(() => svc.reimburseExpense(exp.id, 'bank', 'acc', 'op', 'op')).toThrow(
        /Cannot reimburse expense/,
      )
    })

    it('报销 cancelled 状态报错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.cancelExpense(exp.id, 'u1', 'u1')
      expect(() => svc.reimburseExpense(exp.id, 'bank', 'acc', 'op', 'op')).toThrow(
        /Cannot reimburse expense/,
      )
    })
  })

  // ─── 5. cancelExpense — 已报销无法取消 ───────────

  describe('cancelExpense - 增强覆盖', () => {
    it('取消 pending 状态成功', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      const result = svc.cancelExpense(exp.id, 'u1', 'u1', '不再需要')
      expect(result.status).toBe('cancelled')
    })

    it('取消 approved 状态成功', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      const result = svc.cancelExpense(exp.id, 'admin-1', '管理员')
      expect(result.status).toBe('cancelled')
    })

    it('取消 rejected 状态成功', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'reject', 'admin-1', '管理员', '重填')
      const result = svc.cancelExpense(exp.id, 'u1', 'u1')
      expect(result.status).toBe('cancelled')
    })

    it('已报销的 expense 无法取消', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      svc.reimburseExpense(exp.id, 'bank', 'acc', 'admin-1', '财务')
      expect(() => svc.cancelExpense(exp.id, 'u1', 'u1')).toThrow(
        /Cannot cancel a reimbursed expense/,
      )
    })

    it('已取消状态再次取消抛错', () => {
      const exp = svc.createExpense(makeInput())
      svc.cancelExpense(exp.id, 'u1', 'u1')
      expect(() => svc.cancelExpense(exp.id, 'u1', 'u1')).toThrow(
        /Expense already cancelled/,
      )
    })
  })

  // ─── 6. getExpense / listExpenses 过滤条件 ─────

  describe('getExpense / listExpenses - 过滤条件', () => {
    it('getExpense 返回 null 当 expense 不存在', () => {
      expect(svc.getExpense('non-existent')).toBeNull()
    })

    it('getExpense 返回正确的 expense', () => {
      const created = svc.createExpense(makeInput({ title: '查询测试' }))
      const found = svc.getExpense(created.id)
      expect(found).not.toBeNull()
      expect(found!.title).toBe('查询测试')
    })

    it('listExpenses 无过滤返回所有', () => {
      svc.createExpense(makeInput())
      svc.createExpense(makeInput({ title: '第二个' }))
      const all = svc.listExpenses()
      expect(all.length).toBeGreaterThanOrEqual(2)
    })

    it('listExpenses 按 status 过滤', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      const result = svc.listExpenses({ status: 'pending' })
      expect(result.every(e => e.status === 'pending')).toBe(true)
    })

    it('listExpenses 按 category 过滤', () => {
      svc.createExpense(makeInput({ category: 'meals' }))
      svc.createExpense(makeInput({ category: 'office', title: '办公' }))
      const result = svc.listExpenses({ category: 'office' })
      expect(result.every(e => e.category === 'office')).toBe(true)
    })

    it('listExpenses 按 applicantId 过滤', () => {
      svc.createExpense(makeInput({ applicantId: 'user-A' }))
      svc.createExpense(makeInput({ applicantId: 'user-B' }))
      const result = svc.listExpenses({ applicantId: 'user-A' })
      expect(result.every(e => e.applicantId === 'user-A')).toBe(true)
    })

    it('listExpenses 按 storeId 过滤', () => {
      svc.createExpense(makeInput({ storeId: 'store-X' }))
      svc.createExpense(makeInput({ storeId: 'store-Y' }))
      const result = svc.listExpenses({ storeId: 'store-X' })
      expect(result.every(e => e.storeId === 'store-X')).toBe(true)
    })

    it('listExpenses 按 from/to 时间段过滤', () => {
      const exp = svc.createExpense(makeInput())
      const ts = new Date(exp.createdAt).getTime()
      const from = new Date(ts - 2000).toISOString()
      const to = new Date(ts + 2000).toISOString()
      const result = svc.listExpenses({ from, to })
      expect(result.length).toBeGreaterThanOrEqual(1)
    })

    it('listExpenses 多重过滤组合', () => {
      svc.createExpense(makeInput({ applicantId: 'u1', category: 'travel', storeId: 's1' }))
      svc.createExpense(makeInput({ applicantId: 'u1', category: 'meals', storeId: 's1' }))
      const result = svc.listExpenses({ applicantId: 'u1', storeId: 's1' })
      expect(result.every(e => e.applicantId === 'u1' && e.storeId === 's1')).toBe(true)
    })

    it('listExpenses 不匹配的过滤条件返回空数组', () => {
      const result = svc.listExpenses({ category: 'equipment', status: 'reimbursed' })
      expect(result).toEqual([])
    })
  })

  // ─── 7. getExpenseSummary 统计聚合 ────────────────

  describe('getExpenseSummary - 统计聚合', () => {
    it('统计返回所有指标字段', () => {
      const summary = svc.getExpenseSummary('2026-07', '2026-01-01', '2026-12-31')
      expect(summary).toHaveProperty('totalApplications')
      expect(summary).toHaveProperty('totalAmount')
      expect(summary).toHaveProperty('totalReimbursed')
      expect(summary).toHaveProperty('totalPending')
      expect(summary).toHaveProperty('totalRejected')
      expect(summary).toHaveProperty('byCategory')
      expect(summary).toHaveProperty('byStore')
      expect(summary.totalApplications).toBeGreaterThan(0)
    })

    it('统计含种子数据，总金额大于0', () => {
      const summary = svc.getExpenseSummary('test', '2026-01-01', '2026-12-31')
      expect(summary.totalAmount).toBeGreaterThan(0)
    })

    it('按门店过滤统计仅包含该门店', () => {
      svc.createExpense(makeInput({ storeId: 'store-A', amount: 500 }))
      svc.createExpense(makeInput({ storeId: 'store-A', amount: 300 }))
      const summary = svc.getExpenseSummary('t', '2026-01-01', '2026-12-31', 'store-A')
      expect(summary.totalApplications).toBeGreaterThanOrEqual(2)
    })

    it('统计 byCategory 包含所有类别', () => {
      const summary = svc.getExpenseSummary('t', '2026-01-01', '2026-12-31')
      const cats = ['travel', 'accommodation', 'meals', 'office', 'equipment', 'marketing', 'training', 'maintenance', 'other']
      for (const cat of cats) {
        expect(summary.byCategory).toHaveProperty(cat)
      }
    })

    it('统计 byStore 至少包含种子中的门店', () => {
      const summary = svc.getExpenseSummary('t', '2026-01-01', '2026-12-31')
      expect(Object.keys(summary.byStore).length).toBeGreaterThanOrEqual(2)
    })

    it('统计 cancelled 状态的费用不计入 byCategory', () => {
      const exp = svc.createExpense(makeInput({ amount: 9999 }))
      svc.cancelExpense(exp.id, 'u1', 'u1')
      const summary = svc.getExpenseSummary('t', '2026-01-01', '2026-12-31')
      // cancelled 金额不应计入 byCategory
      const totalCat = Object.values(summary.byCategory).reduce((a, b) => a + b, 0)
      expect(totalCat).toBeLessThan(summary.totalAmount)
    })
  })

  // ─── 8. getApprovalHistory 审批历史 ──────────────

  describe('getApprovalHistory - 审批历史', () => {
    it('全新创建的 expense 有1条审批记录', () => {
      const exp = svc.createExpense(makeInput())
      const hist = svc.getApprovalHistory(exp.id)
      expect(hist.length).toBe(1)
      expect(hist[0].action).toBe('submit')
    })

    it('完整审批流程后记录数 = 创建 + 提交 + 审批 + 报销 = 4', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      svc.reimburseExpense(exp.id, 'bank', 'acc', 'admin-1', '财务')
      const hist = svc.getApprovalHistory(exp.id)
      expect(hist.length).toBe(4)
      const actions = hist.map(h => h.action)
      expect(actions).toEqual(['submit', 'submit', 'approve', 'reimburse'])
    })

    it('审批驳回流程记录正确', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'reject', 'admin-2', '财务', '不合规')
      const hist = svc.getApprovalHistory(exp.id)
      expect(hist.length).toBe(3)
      expect(hist[2].action).toBe('reject')
      expect(hist[2].remark).toBe('不合规')
    })

    it('取消流程后添加 cancel 记录', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.cancelExpense(exp.id, 'u1', 'u1', '取消申请')
      const hist = svc.getApprovalHistory(exp.id)
      expect(hist.length).toBe(3)
      expect(hist[2].action).toBe('cancel')
    })

    it('不存在的 expense 返回空数组', () => {
      expect(svc.getApprovalHistory('non-existent')).toEqual([])
    })
  })

  // ─── 9. deleteExpense — 删除草稿/非草稿报错 ──────

  describe('deleteExpense - 增强覆盖', () => {
    it('删除草稿 expense 成功返回 true', () => {
      const exp = svc.createExpense(makeInput())
      const result = svc.deleteExpense(exp.id)
      expect(result).toBe(true)
      expect(svc.getExpense(exp.id)).toBeNull()
    })

    it('删除草稿后关联的审批历史也被清理', () => {
      const exp = svc.createExpense(makeInput())
      svc.deleteExpense(exp.id)
      expect(svc.getApprovalHistory(exp.id)).toEqual([])
    })

    it('删除 pending 状态的 expense 抛错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      expect(() => svc.deleteExpense(exp.id)).toThrow(/Cannot delete expense/)
    })

    it('删除 approved 状态的 expense 抛错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      expect(() => svc.deleteExpense(exp.id)).toThrow(/Cannot delete expense/)
    })

    it('删除 reimbursed 状态的 expense 抛错', () => {
      const exp = svc.createExpense(makeInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin-1', '管理员')
      svc.reimburseExpense(exp.id, 'bank', 'acc', 'admin-1', '财务')
      expect(() => svc.deleteExpense(exp.id)).toThrow(/Cannot delete expense/)
    })

    it('删除不存在的 expense 返回 false', () => {
      expect(svc.deleteExpense('non-existent')).toBe(false)
    })
  })
})
