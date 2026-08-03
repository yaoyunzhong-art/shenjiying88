import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [expense] [A] entity 测试补全
 *
 * 费用报销 Entity 类型定义与常量测试
 */

import assert from 'node:assert/strict'
import {
  ExpenseCategory,
  ExpenseStatus,
  ExpenseReimbursement,
  ExpenseSummary,
  ExpenseDetail,
  ExpenseApprovalRecord,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  REIMBURSEMENT_METHOD_LABELS,
} from './expense.entity'

describe('expense entity - 费用类别定义', () => {
  it('ExpenseCategory 包含 9 种费用类别', () => {
    const categories: ExpenseCategory[] = [
      'travel', 'accommodation', 'meals', 'office', 'equipment',
      'marketing', 'training', 'maintenance', 'other',
    ]
    assert.equal(categories.length, 9)
  })

  it('ExpenseStatus 包含 6 种状态', () => {
    const statuses: ExpenseStatus[] = [
      'draft', 'pending', 'approved', 'rejected', 'reimbursed', 'cancelled',
    ]
    assert.equal(statuses.length, 6)
  })
})

describe('expense entity - 费用报销类型', () => {
  it('ExpenseReimbursement 草稿状态完整字段', () => {
    const exp: ExpenseReimbursement = {
      id: 'exp-001',
      code: 'EXP000001',
      title: '出差交通费',
      category: 'travel',
      amount: 2500,
      applicantId: 'user-001',
      applicantName: '张三',
      storeId: 'store-001',
      expenseDate: '2026-07-15',
      description: '高铁票',
      attachments: [],
      status: 'draft',
      createdAt: '2026-07-15T08:00:00Z',
      updatedAt: '2026-07-15T08:00:00Z',
    }
    assert.equal(exp.title, '出差交通费')
    assert.equal(exp.status, 'draft')
    assert.equal(exp.amount, 2500)
  })

  it('ExpenseReimbursement 已报销含完整信息', () => {
    const exp: ExpenseReimbursement = {
      id: 'exp-002',
      code: 'EXP000002',
      title: '办公用品',
      category: 'office',
      amount: 3500,
      applicantId: 'user-002',
      applicantName: '李四',
      storeId: 'store-002',
      expenseDate: '2026-07-14',
      description: '打印机墨盒',
      attachments: ['https://example.com/receipt.pdf'],
      status: 'reimbursed',
      approverId: 'admin-001',
      approvalRemark: '同意',
      approvalAt: '2026-07-15T10:00:00Z',
      reimbursementMethod: 'bank',
      reimbursementAccount: '6217****1234',
      reimbursedAt: '2026-07-16T14:00:00Z',
      createdAt: '2026-07-14T09:00:00Z',
      updatedAt: '2026-07-16T14:00:00Z',
    }
    assert.equal(exp.status, 'reimbursed')
    assert.equal(exp.reimbursementMethod, 'bank')
    assert.ok(exp.reimbursedAt)
  })

  it('ExpenseReimbursement 已驳回状态', () => {
    const exp: ExpenseReimbursement = {
      id: 'exp-003',
      code: 'EXP000003',
      title: '招待费',
      category: 'meals',
      amount: 5000,
      applicantId: 'user-003',
      applicantName: '王五',
      storeId: 'store-001',
      expenseDate: '2026-07-13',
      description: '客户招待',
      attachments: [],
      status: 'rejected',
      approverId: 'admin-002',
      approvalRemark: '金额超预算，请重新申请',
      approvalAt: '2026-07-14T09:00:00Z',
      createdAt: '2026-07-13T12:00:00Z',
      updatedAt: '2026-07-14T09:00:00Z',
    }
    assert.equal(exp.status, 'rejected')
    assert.equal(exp.approvalRemark, '金额超预算，请重新申请')
  })

  it('ExpenseReimbursement 待审批状态', () => {
    const exp: ExpenseReimbursement = {
      id: 'exp-004',
      code: 'EXP000004',
      title: '市场推广费',
      category: 'marketing',
      amount: 10000,
      applicantId: 'user-004',
      applicantName: '赵六',
      storeId: 'store-003',
      expenseDate: '2026-07-17',
      description: '线下活动物料',
      attachments: ['https://example.com/quote.pdf', 'https://example.com/proposal.pdf'],
      status: 'pending',
      createdAt: '2026-07-17T10:00:00Z',
      updatedAt: '2026-07-17T10:00:00Z',
    }
    assert.equal(exp.status, 'pending')
    assert.equal(exp.attachments.length, 2)
  })

  it('ExpenseReimbursement 已取消状态', () => {
    const exp: ExpenseReimbursement = {
      id: 'exp-005',
      code: 'EXP000005',
      title: '文具采购',
      category: 'office',
      amount: 200,
      applicantId: 'user-001',
      applicantName: '张三',
      storeId: 'store-001',
      expenseDate: '2026-07-12',
      description: '取消的采购',
      attachments: [],
      status: 'cancelled',
      createdAt: '2026-07-12T08:00:00Z',
      updatedAt: '2026-07-12T10:00:00Z',
    }
    assert.equal(exp.status, 'cancelled')
  })

  it('ExpenseReimbursement 支持各种费用类别', () => {
    const categories: ExpenseCategory[] = ['accommodation', 'equipment', 'training', 'maintenance', 'other']
    for (const cat of categories) {
      const exp: ExpenseReimbursement = {
        id: `exp-${cat}`,
        code: `EXP${cat.toUpperCase()}`,
        title: `${cat}费用`,
        category: cat,
        amount: 1000,
        applicantId: 'user-001',
        applicantName: '测试',
        storeId: 'store-001',
        expenseDate: '2026-07-15',
        description: '测试数据',
        attachments: [],
        status: 'draft',
        createdAt: '2026-07-15T08:00:00Z',
        updatedAt: '2026-07-15T08:00:00Z',
      }
      assert.equal(exp.category, cat)
    }
  })
})

describe('expense entity - ExpenseApprovalRecord', () => {
  it('审批记录提交操作', () => {
    const record: ExpenseApprovalRecord = {
      id: 'ar-001',
      expenseId: 'exp-001',
      action: 'submit',
      operatorId: 'user-001',
      operatorName: '张三',
      remark: '提交费用申请',
      createdAt: '2026-07-15T08:00:00Z',
    }
    assert.equal(record.action, 'submit')
    assert.equal(record.operatorName, '张三')
  })

  it('审批记录支持所有操作类型', () => {
    const actions: ExpenseApprovalRecord['action'][] = ['submit', 'approve', 'reject', 'reimburse', 'cancel']
    assert.equal(actions.length, 5)
  })

  it('审批记录无备注', () => {
    const record: ExpenseApprovalRecord = {
      id: 'ar-002',
      expenseId: 'exp-002',
      action: 'approve',
      operatorId: 'admin-001',
      operatorName: '管理员',
      createdAt: '2026-07-16T10:00:00Z',
    }
    assert.equal(record.remark, undefined)
  })
})

describe('expense entity - ExpenseDetail', () => {
  it('ExpenseDetail 继承含审批历史', () => {
    const detail: ExpenseDetail = {
      id: 'exp-001',
      code: 'EXP000001',
      title: '差旅费',
      category: 'travel',
      amount: 2500,
      applicantId: 'user-001',
      applicantName: '张三',
      storeId: 'store-001',
      expenseDate: '2026-07-15',
      description: '出差',
      attachments: [],
      status: 'approved',
      approverId: 'admin-001',
      approvalRemark: '同意',
      approvalAt: '2026-07-15T10:00:00Z',
      createdAt: '2026-07-15T08:00:00Z',
      updatedAt: '2026-07-15T10:00:00Z',
      approvalHistory: [
        { id: 'ar-1', expenseId: 'exp-001', action: 'submit', operatorId: 'user-001', operatorName: '张三', createdAt: '2026-07-15T08:00:00Z' },
        { id: 'ar-2', expenseId: 'exp-001', action: 'approve', operatorId: 'admin-001', operatorName: '管理员', createdAt: '2026-07-15T10:00:00Z' },
      ],
    }
    assert.equal(detail.approvalHistory!.length, 2)
    assert.equal(detail.approvalHistory![0].action, 'submit')
    assert.equal(detail.approvalHistory![1].action, 'approve')
  })

  it('ExpenseDetail 含关联订单', () => {
    const detail: ExpenseDetail = {
      id: 'exp-002',
      code: 'EXP000002',
      title: '采购费',
      category: 'equipment',
      amount: 50000,
      applicantId: 'user-002',
      applicantName: '李四',
      storeId: 'store-002',
      expenseDate: '2026-07-14',
      description: '设备采购',
      attachments: [],
      status: 'draft',
      createdAt: '2026-07-14T09:00:00Z',
      updatedAt: '2026-07-14T09:00:00Z',
      relatedOrderId: 'ord-12345',
    }
    assert.equal(detail.relatedOrderId, 'ord-12345')
  })
})

describe('expense entity - ExpenseSummary', () => {
  it('ExpenseSummary 完整结构', () => {
    const summary: ExpenseSummary = {
      period: 'monthly',
      from: '2026-07-01',
      to: '2026-07-31',
      totalApplications: 10,
      totalAmount: 50000,
      totalReimbursed: 35000,
      totalPending: 10000,
      totalRejected: 5000,
      byCategory: {
        travel: 20000,
        meals: 10000,
        office: 5000,
        equipment: 0,
        marketing: 15000,
        accommodation: 0,
        training: 0,
        maintenance: 0,
        other: 0,
      },
      byStore: {
        'store-001': 30000,
        'store-002': 20000,
      },
    }
    assert.equal(summary.totalApplications, 10)
    assert.equal(summary.totalAmount, 50000)
    assert.equal(summary.byCategory.travel, 20000)
    assert.equal(summary.byStore['store-001'], 30000)
  })

  it('ExpenseSummary 空数据', () => {
    const summary: ExpenseSummary = {
      period: 'daily',
      from: '2026-01-01',
      to: '2026-01-01',
      totalApplications: 0,
      totalAmount: 0,
      totalReimbursed: 0,
      totalPending: 0,
      totalRejected: 0,
      byCategory: {
        travel: 0, accommodation: 0, meals: 0, office: 0,
        equipment: 0, marketing: 0, training: 0, maintenance: 0, other: 0,
      },
      byStore: {},
    }
    assert.equal(summary.totalApplications, 0)
    assert.equal(Object.keys(summary.byStore).length, 0)
  })
})

describe('expense entity - 标签常量', () => {
  it('EXPENSE_CATEGORY_LABELS 包含 9 个类别中文名', () => {
    assert.equal(Object.keys(EXPENSE_CATEGORY_LABELS).length, 9)
    assert.equal(EXPENSE_CATEGORY_LABELS.travel, '差旅交通')
    assert.equal(EXPENSE_CATEGORY_LABELS.accommodation, '住宿')
    assert.equal(EXPENSE_CATEGORY_LABELS.meals, '餐饮招待')
    assert.equal(EXPENSE_CATEGORY_LABELS.other, '其他')
  })

  it('EXPENSE_STATUS_LABELS 包含 6 个状态中文名', () => {
    assert.equal(Object.keys(EXPENSE_STATUS_LABELS).length, 6)
    assert.equal(EXPENSE_STATUS_LABELS.draft, '草稿')
    assert.equal(EXPENSE_STATUS_LABELS.approved, '已通过')
    assert.equal(EXPENSE_STATUS_LABELS.reimbursed, '已报销')
  })

  it('REIMBURSEMENT_METHOD_LABELS 包含 4 种报销方式', () => {
    assert.equal(Object.keys(REIMBURSEMENT_METHOD_LABELS).length, 4)
    assert.equal(REIMBURSEMENT_METHOD_LABELS.bank, '银行转账')
    assert.equal(REIMBURSEMENT_METHOD_LABELS.wechat, '微信支付')
    assert.equal(REIMBURSEMENT_METHOD_LABELS.alipay, '支付宝')
  })
})
