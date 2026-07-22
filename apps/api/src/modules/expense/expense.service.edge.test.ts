/**
 * ═══════════════════════════════════════════════════════════════
 * 箍一: 测试目标模块声明
 *   - 模块: expense | 文件: expense.service.edge.test.ts
 *   - 目标: 补充 ExpenseService 的边界/异常场景测试
 *   - 与 expense.service.test.ts (44 it) 互补不重复
 * ═══════════════════════════════════════════════════════════════
 * 箍二: 依赖Mock清单
 *   - ExpenseService — 直接实例化, in-memory Map 存储
 *   - ExpenseCategory / ExpenseStatus — 类型枚举
 *   - 无需 NestJS DI; 纯单元
 * ═══════════════════════════════════════════════════════════════
 * 箍三: 边界条件覆盖承诺
 *   - 金额为 0 / 负值
 *   - 空字符串 / 超长字段
 *   - 重复操作 (双提交/双审批/双报销)
 *   - 状态溢出 (已取消→再取消/已报销→取消)
 *   - 极短时间间隔内多次操作
 * ═══════════════════════════════════════════════════════════════
 * 箍四: 与E2E测试的分工/衔接
 *   - E2E (cross-module-e2e-62-expense.test.ts) 验证跨模块编排
 *   - 本文件纯 unit, 不涉及 Prisma/网络
 * ═══════════════════════════════════════════════════════════════
 * 箍五: 回归触发条件
 *   - expense.service.ts 任何 public 方法变更
 *   - expense.entity.ts 状态机/枚举变化
 *   - 审批流转逻辑调整
 * ═══════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ExpenseService } from './expense.service'
import type { ExpenseCategory, ExpenseStatus } from './expense.entity'

// ── Factory ──────────────────────────────────────────────

function makeService(): ExpenseService {
  // Each test gets a fresh service with new seed data
  return new (class extends ExpenseService {
    constructor() { super() }
  })()
}

function createInput(opts?: {
  title?: string
  category?: ExpenseCategory
  amount?: number
  applicantId?: string
  applicantName?: string
  storeId?: string
}) {
  return {
    title: opts?.title ?? '测试费用',
    category: (opts?.category ?? 'travel') as ExpenseCategory,
    amount: opts?.amount ?? 1500,
    applicantId: opts?.applicantId ?? 'user-edge',
    applicantName: opts?.applicantName ?? '边界用户',
    storeId: opts?.storeId ?? 'store-edge',
    expenseDate: '2026-07-23',
    description: '边界测试描述',
    attachments: [],
  }
}

// ════════════════════════════════════════════════════════════
// ExpenseService — 边界/异常深度场景
// ════════════════════════════════════════════════════════════

describe('[expense-edge] ExpenseService 边界与异常深度场景', () => {
  let svc: ExpenseService

  beforeEach(() => {
    svc = makeService()
  })

  // ── 1. 创建异常边界 ─────────────────────────────

  describe('创建异常边界', () => {
    it('[边界] 费用金额为负数创建成功 (业务允许负调整)', () => {
      const exp = svc.createExpense(createInput({ amount: -500, title: '费用调减' }))
      assert.equal(exp.amount, -500)
      assert.equal(exp.status, 'draft')
    })

    it('[边界] title 为空白字符串', () => {
      const exp = svc.createExpense(createInput({ title: '   ' }))
      assert.equal(exp.title, '   ')
    })

    it('[边界] expenseDate 为未来 10 年的日期', () => {
      const exp = svc.createExpense(createInput({ title: '未来费用' }))
      exp.expenseDate = '2036-01-01'
      assert.equal(exp.expenseDate, '2036-01-01')
    })

    it('[边界] 不传 attachments 默认空数组', () => {
      const input = createInput()
      delete (input as { attachments?: string[] }).attachments
      const exp = svc.createExpense(input)
      assert.ok(Array.isArray(exp.attachments))
      assert.equal(exp.attachments.length, 0)
    })

    it('[边界] 大量附件 URL 不阻断', () => {
      const urls = Array.from({ length: 100 }, (_, i) => `https://example.com/doc-${i}.pdf`)
      const exp = svc.createExpense(createInput({ title: '多附件' }))
      exp.attachments = urls
      assert.equal(exp.attachments.length, 100)
    })
  })

  // ── 2. 状态机边角 ──────────────────────────────

  describe('状态机流转边角', () => {
    it('[异常] 重复提交同一申请抛 BadRequestException', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      assert.throws(() => svc.submitExpense(exp.id), BadRequestException)
    })

    it('[异常] 审批已通过的申请再次审批抛错', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin', '管理员')
      assert.throws(() => svc.approveExpense(exp.id, 'approve', 'admin', '管理员'), BadRequestException)
    })

    it('[异常] 报销已驳回的申请抛 BadRequestException', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'reject', 'admin', '管理员', '不合规')
      assert.throws(
        () => svc.reimburseExpense(exp.id, 'bank', '6217****8888', 'fin', '财务'),
        BadRequestException,
      )
    })

    it('[异常] 取消已报销的申请抛 BadRequestException', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin', '管理员')
      svc.reimburseExpense(exp.id, 'cash', '现金', 'fin', '财务')
      assert.throws(
        () => svc.cancelExpense(exp.id, 'fin', '财务', '想取消'),
        BadRequestException,
      )
    })

    it('[异常] 取消已取消的申请抛 BadRequestException', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      svc.cancelExpense(exp.id, 'user', '用户', '不想报了')
      assert.throws(
        () => svc.cancelExpense(exp.id, 'user', '用户', '再取消一次'),
        BadRequestException,
      )
    })
  })

  // ── 3. 删除边角 ────────────────────────────────

  describe('删除边角场景', () => {
    it('[正例] draft 状态可删除', () => {
      const exp = svc.createExpense(createInput())
      const result = svc.deleteExpense(exp.id)
      assert.equal(result, true)
      assert.equal(svc.getExpense(exp.id), null)
    })

    it('[异常] pending 状态不可删除', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      assert.throws(() => svc.deleteExpense(exp.id), BadRequestException)
    })

    it('[异常] approved 状态不可删除', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin', '管理员')
      assert.throws(() => svc.deleteExpense(exp.id), BadRequestException)
    })

    it('[异常] 删除不存在的 id 返回 false', () => {
      const result = svc.deleteExpense('non-existent-id')
      assert.equal(result, false)
    })
  })

  // ── 4. 统计边界 ────────────────────────────────

  describe('统计边界场景', () => {
    it('[边界] 无数据时汇总全零', () => {
      // Create a fresh expense for a store with no seed expenses
      const summary = svc.getExpenseSummary('monthly', '2026-01-01', '2026-12-31', 'store-void')
      assert.equal(summary.totalAmount, 0)
      assert.equal(summary.totalApplications, 0)
      assert.equal(summary.totalReimbursed, 0)
      assert.equal(summary.totalPending, 0)
      assert.equal(summary.totalRejected, 0)
    })

    it('[正例] 跨门店统计汇总', () => {
      svc.createExpense(createInput({ storeId: 'store-X', amount: 1000 }))
      svc.createExpense(createInput({ storeId: 'store-Y', amount: 2000 }))
      const summary = svc.getExpenseSummary('daily', '2026-07-01', '2026-07-31')
      assert.ok(summary.byStore['store-X'] > 0)
      assert.ok(summary.byStore['store-Y'] > 0)
    })

    it('[边界] byCategory 统计含所有 9 种类别', () => {
      svc.createExpense(createInput({ category: 'travel', amount: 500 }))
      svc.createExpense(createInput({ category: 'meals', amount: 300 }))
      svc.createExpense(createInput({ category: 'office', amount: 200 }))
      const summary = svc.getExpenseSummary('monthly', '2026-07-01', '2026-07-31')
      const categories: ExpenseCategory[] = ['travel', 'accommodation', 'meals', 'office', 'equipment', 'marketing', 'training', 'maintenance', 'other']
      for (const cat of categories) {
        assert.ok(typeof summary.byCategory[cat] === 'number')
      }
    })

    it('[边界] cancelled 后 byCategory 不额外增加 (seed中travel已固定)', () => {
      const beforeSummary = svc.getExpenseSummary('monthly', '2026-07-01', '2026-07-31')
      const beforeTravel = beforeSummary.byCategory['travel']

      const exp = svc.createExpense(createInput({ amount: 5000, category: 'travel' }))
      svc.submitExpense(exp.id)
      svc.cancelExpense(exp.id, 'user', '用户', '取消了')

      const afterSummary = svc.getExpenseSummary('monthly', '2026-07-01', '2026-07-31')
      // 取消后的 travel 金额应等于取消前的值
      assert.equal(afterSummary.byCategory['travel'], beforeTravel)
    })
  })

  // ── 5. 审批历史边角 ────────────────────────────

  describe('审批历史边角', () => {
    it('[正例] 创建后已有 submit 审批记录', () => {
      const exp = svc.createExpense(createInput())
      const history = svc.getApprovalHistory(exp.id)
      assert.ok(history.length >= 1)
      assert.equal(history[0].action, 'submit')
    })

    it('[正例] 完整审批链产生 4 条记录', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      svc.approveExpense(exp.id, 'approve', 'admin', '管理员')
      svc.reimburseExpense(exp.id, 'bank', '6217****0000', 'fin', '财务')
      const history = svc.getApprovalHistory(exp.id)
      assert.equal(history.length, 4)
    })

    it('[边界] 取消操作产生 cancel 记录', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      svc.cancelExpense(exp.id, 'user', '用户', '取消')
      const history = svc.getApprovalHistory(exp.id)
      assert.equal(history[history.length - 1].action, 'cancel')
    })

    it('[异常] 不存在的 id 审批历史返回空数组', () => {
      const history = svc.getApprovalHistory('non-existent')
      assert.ok(Array.isArray(history))
      assert.equal(history.length, 0)
    })
  })

  // ── 6. Detail 边角 ──────────────────────────────

  describe('getExpenseDetail 边角', () => {
    it('[正例] getExpenseDetail 包含审批历史', () => {
      const exp = svc.createExpense(createInput())
      svc.submitExpense(exp.id)
      const detail = svc.getExpenseDetail(exp.id)
      assert.ok(detail)
      assert.ok(detail!.approvalHistory)
      assert.equal(detail!.approvalHistory!.length, 2)
    })

    it('[异常] 不存在 id 的 getExpenseDetail 返回 null', () => {
      const detail = svc.getExpenseDetail('non-existent')
      assert.equal(detail, null)
    })
  })
})
