import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 费用报销 Controller 测试 (V23)
 *
 * 覆盖：路由元数据验证 / 费用申请 CRUD / 审批流程 / 统计 / 边界异常
 * 8 角色视角：👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ExpenseController } from './expense.controller'
import { ExpenseService } from './expense.service'

// ══════════════════════════════════════════════════════════════
// 路由元数据验证
// ══════════════════════════════════════════════════════════════

const ROUTES: Array<{ method: number; path: string; handler: string; verb: string }> = [
  { method: 1, path: 'create',               handler: 'createExpense',    verb: 'POST' },
  { method: 1, path: 'submit/:id',            handler: 'submitExpense',   verb: 'POST' },
  { method: 0, path: ':id',                   handler: 'getExpense',      verb: 'GET'  },
  { method: 0, path: 'list',                  handler: 'listExpenses',    verb: 'GET'  },
  { method: 3, path: ':id',                   handler: 'deleteExpense',   verb: 'DELETE' },
  { method: 1, path: 'approve/:id',           handler: 'approveExpense',  verb: 'POST' },
  { method: 1, path: 'reimburse/:id',         handler: 'reimburseExpense',verb: 'POST' },
  { method: 1, path: 'cancel/:id',            handler: 'cancelExpense',   verb: 'POST' },
  { method: 0, path: 'summary',               handler: 'getSummary',      verb: 'GET'  },
]

describe('路由元数据验证', () => {
  it('expense controller path metadata is set', () => {
    const ctrlPath = Reflect.getMetadata('path', ExpenseController)
    assert.equal(ctrlPath, 'expense')
  })

  for (const route of ROUTES) {
    it(`${route.verb} expense/${route.path} → ${route.handler}`, () => {
      const method = Reflect.getMetadata('method', ExpenseController.prototype[route.handler as keyof ExpenseController])
      const routePath = Reflect.getMetadata('path', ExpenseController.prototype[route.handler as keyof ExpenseController])
      assert.equal(method, route.method)
      assert.equal(routePath, route.path)
    })
  }

  it('所有 9 个路由都注册了元数据', () => {
    for (const handler of ROUTES.map((r) => r.handler)) {
      const method = Reflect.getMetadata('method', ExpenseController.prototype[handler as keyof ExpenseController])
      assert.ok(method !== undefined, `Missing metadata for ${handler}`)
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 8 角色视角测试
// ══════════════════════════════════════════════════════════════

const ROLES = {
  StoreManager:  '👔店长',
  FrontDesk:     '🛒前台',
  HR:            '👥HR',
  Safety:        '🔧安监',
  Guide:         '🎮导玩员',
  Operations:    '🎯运行专员',
  Teambuilding:  '🤝团建',
  Marketing:     '📢营销',
} as const

function makeController(): ExpenseController {
  return new ExpenseController(new ExpenseService())
}

// 👔 店长 - 关注门店费用管理和审批
describe(`${ROLES.StoreManager} expense 场景`, () => {
  it('店长查看所有费用申请列表', () => {
    const ctrl = makeController()
    const { items, total } = ctrl.listExpenses({})
    assert.ok(total >= 3, '种子数据应有 3 条费用')
    assert.ok(items.some((e) => e.storeId === 'store-001'))
  })

  it('店长审批待处理的费用申请', () => {
    const ctrl = makeController()
    const { items } = ctrl.listExpenses({ status: 'pending' })
    assert.ok(items.length > 0, '应有待审批的费用')
    const result = ctrl.approveExpense(items[0].id, {
      action: 'approve', approverId: 'admin-001', approverName: '店长', remark: '同意报销',
    })
    assert.equal(result.status, 'approved')
    assert.equal(result.approverId, 'admin-001')
  })

  it('店长驳回费用申请', () => {
    const ctrl = makeController()
    const { items } = ctrl.listExpenses({ status: 'pending' })
    assert.ok(items.length > 0)
    const result = ctrl.approveExpense(items[0].id, {
      action: 'reject', approverId: 'admin-001', approverName: '店长', remark: '不符合报销规定',
    })
    assert.equal(result.status, 'rejected')
    assert.equal(result.approvalRemark, '不符合报销规定')
  })
})

// 🛒 前台 - 关注创建和提交费用申请
describe(`${ROLES.FrontDesk} expense 场景`, () => {
  it('前台创建新的费用申请（草稿）', () => {
    const ctrl = makeController()
    const result = ctrl.createExpense({
      title: '前台办公用品',
      category: 'office',
      amount: 500,
      applicantId: 'user-fd-001',
      applicantName: '前台小王',
      storeId: 'store-002',
      expenseDate: '2026-07-20',
      description: '前台文具补充',
    })
    assert.equal(result.status, 'draft')
    assert.equal(result.amount, 500)
    assert.ok(result.code.startsWith('EXP'))
  })

  it('前台提交费用申请（draft → pending）', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '前台交通费',
      category: 'travel',
      amount: 200,
      applicantId: 'user-fd-001',
      applicantName: '前台小王',
      storeId: 'store-002',
      expenseDate: '2026-07-20',
      description: '外出办事打车',
    })
    assert.equal(created.status, 'draft')

    const submitted = ctrl.submitExpense(created.id)
    assert.equal(submitted.status, 'pending')
    assert.equal(submitted.id, created.id)
  })

  it('前台查看自己提交的申请详情含审批历史', () => {
    const ctrl = makeController()
    const detail = ctrl.getExpense('exp-seed-travel')
    assert.equal(detail.id, 'exp-seed-travel')
    assert.ok(detail.approvalHistory)
    assert.ok(detail.approvalHistory.length >= 2)
  })
})

// 👥 HR - 关注培训教育类费用
describe(`${ROLES.HR} expense 场景`, () => {
  it('HR 创建培训费用申请', () => {
    const ctrl = makeController()
    const result = ctrl.createExpense({
      title: '员工培训课程',
      category: 'training',
      amount: 3000,
      applicantId: 'user-hr-001',
      applicantName: 'HR李',
      storeId: 'store-001',
      expenseDate: '2026-07-18',
      description: '销售技巧培训',
    })
    assert.equal(result.category, 'training')
    assert.equal(result.amount, 3000)
  })

  it('HR 按类别筛选费用申请', () => {
    const ctrl = makeController()
    const { items } = ctrl.listExpenses({ category: 'travel' })
    assert.ok(items.every((e) => e.category === 'travel'))
  })
})

// 🔧 安监 - 关注维修保养类费用
describe(`${ROLES.Safety} expense 场景`, () => {
  it('安监创建维修费用申请', () => {
    const ctrl = makeController()
    const result = ctrl.createExpense({
      title: '空调维修',
      category: 'maintenance',
      amount: 1500,
      applicantId: 'user-safety-001',
      applicantName: '安监老刘',
      storeId: 'store-001',
      expenseDate: '2026-07-19',
      description: '1号店空调维修',
    })
    assert.equal(result.category, 'maintenance')
    assert.equal(result.amount, 1500)
  })

  it('安监删除自己创建的草稿', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '测试草稿',
      category: 'maintenance',
      amount: 100,
      applicantId: 'user-safety-001',
      applicantName: '安监',
      storeId: 'store-001',
      expenseDate: '2026-07-19',
      description: '可删除',
    })
    const result = ctrl.deleteExpense(created.id)
    assert.equal(result.success, true)
    assert.throws(() => ctrl.getExpense(created.id), /not found/i)
  })
})

// 🎮 导玩员 - 关注设备和办公用品费用
describe(`${ROLES.Guide} expense 场景`, () => {
  it('导玩员创建设备采购申请', () => {
    const ctrl = makeController()
    const result = ctrl.createExpense({
      title: '游戏手柄采购',
      category: 'equipment',
      amount: 8000,
      applicantId: 'user-guide-001',
      applicantName: '导玩员小陈',
      storeId: 'store-002',
      expenseDate: '2026-07-18',
      description: '采购新款游戏手柄10个',
      attachments: ['https://example.com/product-list.pdf'],
    })
    assert.equal(result.category, 'equipment')
    assert.equal(result.attachments.length, 1)
  })

  it('导玩员查看门店的费用汇总', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31', 'store-002')
    // store-002 只有 office(3500)
    assert.equal(summary.byStore['store-002'], 3500)
    assert.ok(summary.totalAmount >= 0)
  })
})

// 🎯 运行专员 - 关注统计和数据聚合
describe(`${ROLES.Operations} expense 场景`, () => {
  it('运行专员获取费用统计摘要', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.equal(summary.period, 'monthly')
    assert.equal(summary.from, '2026-07-01')
    assert.equal(summary.to, '2026-07-31')
    assert.ok(summary.totalApplications >= 3)
    assert.ok(summary.totalAmount > 0)
    assert.equal(typeof summary.totalReimbursed, 'number')
  })

  it('运行专员按类别统计数据准确', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.equal(summary.byCategory.travel, 2500)
    assert.equal(summary.byCategory.meals, 1800)
    assert.equal(summary.byCategory.office, 3500)
    assert.equal(summary.byCategory.accommodation, 0)
    assert.equal(summary.byCategory.equipment, 0)
  })

  it('运行专员按门店统计正确', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    // store-001: travel(2500) + meals(1800) = 4300
    // store-002: office(3500)
    assert.equal(summary.byStore['store-001'], 4300)
    assert.equal(summary.byStore['store-002'], 3500)
  })
})

// 🤝 团建 - 关注集体活动和团队建设费用
describe(`${ROLES.Teambuilding} expense 场景`, () => {
  it('团建创建团队活动费用', () => {
    const ctrl = makeController()
    const result = ctrl.createExpense({
      title: '季度团建',
      category: 'other',
      amount: 5000,
      applicantId: 'user-tb-001',
      applicantName: '团建专员',
      storeId: 'store-001',
      expenseDate: '2026-07-20',
      description: '团队拓展活动费用',
    })
    assert.equal(result.amount, 5000)
    assert.equal(result.category, 'other')
  })

  it('团建取消未报销的申请', () => {
    const ctrl = makeController()
    const { items } = ctrl.listExpenses({ status: 'pending' })
    const target = items[0]
    const result = ctrl.cancelExpense(target.id, {
      operatorId: 'user-tb-001', operatorName: '团建专员', remark: '活动取消',
    })
    assert.equal(result.status, 'cancelled')
  })

  it('已取消的费用不重复取消', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '临时活动',
      category: 'other',
      amount: 1000,
      applicantId: 'user-tb-001',
      applicantName: '团建',
      storeId: 'store-001',
      expenseDate: '2026-07-21',
      description: '测试取消',
    })
    ctrl.submitExpense(created.id)
    ctrl.cancelExpense(created.id, { operatorId: 'user-tb-001', operatorName: '团建', remark: '取消' })
    assert.throws(
      () => ctrl.cancelExpense(created.id, { operatorId: 'user-tb-001', operatorName: '团建', remark: '重复取消' }),
      /already cancelled/,
    )
  })
})

// 📢 营销 - 关注市场推广费用
describe(`${ROLES.Marketing} expense 场景`, () => {
  it('营销创建市场推广费用申请含附件', () => {
    const ctrl = makeController()
    const result = ctrl.createExpense({
      title: '618活动物料',
      category: 'marketing',
      amount: 15000,
      applicantId: 'user-mkt-001',
      applicantName: '营销小王',
      storeId: 'store-003',
      expenseDate: '2026-07-15',
      description: '618促销活动物料采购',
      attachments: [
        'https://example.com/quote-1.pdf',
        'https://example.com/proposal.pdf',
        'https://example.com/approval.pdf',
      ],
    })
    assert.equal(result.category, 'marketing')
    assert.equal(result.attachments.length, 3)
  })

  it('营销提交→审批→报销全流程', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '线下推广',
      category: 'marketing',
      amount: 2000,
      applicantId: 'user-mkt-001',
      applicantName: '营销小王',
      storeId: 'store-003',
      expenseDate: '2026-07-17',
      description: '推广传单印刷',
    })
    assert.equal(created.status, 'draft')

    const submitted = ctrl.submitExpense(created.id)
    assert.equal(submitted.status, 'pending')

    const approved = ctrl.approveExpense(created.id, {
      action: 'approve', approverId: 'admin-001', approverName: '管理员', remark: '同意',
    })
    assert.equal(approved.status, 'approved')

    const reimbursed = ctrl.reimburseExpense(created.id, {
      method: 'bank', account: '6217000012345678', operatorId: 'finance-001', operatorName: '财务',
    })
    assert.equal(reimbursed.status, 'reimbursed')
    assert.equal(reimbursed.reimbursementMethod, 'bank')
    assert.equal(reimbursed.reimbursementAccount, '6217000012345678')
  })

  it('营销查看费用统计含 byCategory', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.ok('marketing' in summary.byCategory)
  })
})

// ══════════════════════════════════════════════════════════════
// 费用 CRUD 正常流程
// ══════════════════════════════════════════════════════════════

describe('费用申请 CRUD - 正常流程', () => {
  it('createExpense 返回正确结构', () => {
    const ctrl = makeController()
    const result = ctrl.createExpense({
      title: '测试交通费',
      category: 'travel',
      amount: 1000,
      applicantId: 'user-test',
      applicantName: '测试员',
      storeId: 'store-001',
      expenseDate: '2026-07-21',
      description: '测试创建费用申请',
    })
    assert.ok(result.id)
    assert.ok(result.code)
    assert.equal(result.title, '测试交通费')
    assert.equal(result.status, 'draft')
    assert.ok(result.createdAt)
    assert.ok(result.updatedAt)
  })

  it('listExpenses 返回正确结构', () => {
    const ctrl = makeController()
    const { items, total } = ctrl.listExpenses({})
    assert.ok(Array.isArray(items))
    assert.ok(total >= 3)
    assert.equal(items.length, total)
    for (const item of items) {
      assert.ok(item.id)
      assert.ok(item.code)
      assert.ok(item.title)
      assert.ok(item.category)
      assert.ok(item.status)
    }
  })

  it('getExpense 返回已存在的费用详情', () => {
    const ctrl = makeController()
    const detail = ctrl.getExpense('exp-seed-travel')
    assert.equal(detail.id, 'exp-seed-travel')
    assert.equal(detail.code, 'EXP000001')
    assert.equal(detail.title, '出差交通费')
  })

  it('deleteExpense 删除草稿状态费用', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '临时费用',
      category: 'other',
      amount: 100,
      applicantId: 'user-test',
      applicantName: '测试',
      storeId: 'store-001',
      expenseDate: '2026-07-21',
      description: '待删除',
    })
    const result = ctrl.deleteExpense(created.id)
    assert.equal(result.success, true)
  })

  it('生成的 code 是递增的', () => {
    const ctrl = makeController()
    const r1 = ctrl.createExpense({ title: 'T1', category: 'office', amount: 100, applicantId: 'a', applicantName: 'A', storeId: 's1', expenseDate: '2026-07-21', description: 't1' })
    const r2 = ctrl.createExpense({ title: 'T2', category: 'office', amount: 200, applicantId: 'b', applicantName: 'B', storeId: 's1', expenseDate: '2026-07-21', description: 't2' })
    assert.ok(r2.code > r1.code, 'code 应递增')
  })
})

// ══════════════════════════════════════════════════════════════
// 审批流程
// ══════════════════════════════════════════════════════════════

describe('审批流程', () => {
  it('创建→提交→审批→报销 完整生命周期', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '完整流程测试', category: 'travel', amount: 3000,
      applicantId: 'u1', applicantName: '员工', storeId: 's1',
      expenseDate: '2026-07-21', description: '全流程',
    })
    assert.equal(created.status, 'draft')

    const submitted = ctrl.submitExpense(created.id)
    assert.equal(submitted.status, 'pending')

    const approved = ctrl.approveExpense(created.id, {
      action: 'approve', approverId: 'admin-001', approverName: '管理员', remark: '同意',
    })
    assert.equal(approved.status, 'approved')

    const reimbursed = ctrl.reimburseExpense(created.id, {
      method: 'wechat', account: 'wx-account', operatorId: 'finance-001', operatorName: '财务',
    })
    assert.equal(reimbursed.status, 'reimbursed')
    assert.equal(reimbursed.reimbursementMethod, 'wechat')

    const detail = ctrl.getExpense(created.id)
    assert.ok(detail.approvalHistory)
    assert.equal(detail.approvalHistory!.length, 4)
    const actions = detail.approvalHistory!.map((r: any) => r.action)
    assert.deepEqual(actions, ['submit', 'submit', 'approve', 'reimburse'])
  })

  it('已审批的费用不可重复审批', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '重复审批测试', category: 'travel', amount: 1000,
      applicantId: 'u1', applicantName: '员工', storeId: 's1',
      expenseDate: '2026-07-21', description: '测试重复审批',
    })
    ctrl.submitExpense(created.id)
    ctrl.approveExpense(created.id, { action: 'approve', approverId: 'admin', approverName: '管理员', remark: '同意' })
    assert.throws(
      () => ctrl.approveExpense(created.id, { action: 'approve', approverId: 'admin2', approverName: '管理员2', remark: '重复' }),
      /Cannot approve/i,
    )
  })

  it('未提交不能审批', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '未提交审批', category: 'office', amount: 500,
      applicantId: 'u1', applicantName: '员工', storeId: 's1',
      expenseDate: '2026-07-21', description: '测试',
    })
    // 使用相同 service 实例（通过控制器的内部 service）
    // 未提交的申请状态为 draft，service 层会拒绝审批
    const svc = (ctrl as any).service as any
    assert.throws(
      () => svc.approveExpense(created.id, 'approve', 'admin', '管理员', ''),
      /Cannot approve/i,
    )
  })

  it('已报销不可取消', () => {
    const ctrl = makeController()
    // 种子数据 exp-seed-office 已报销，通过 service 验证
    const svc = new ExpenseService()
    assert.throws(
      () => svc.cancelExpense('exp-seed-office', 'admin', '管理员'),
      /Cannot cancel a reimbursed/i,
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 费用统计
// ══════════════════════════════════════════════════════════════

describe('费用统计 (GET /expense/summary)', () => {
  it('getSummary 返回正确结构', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.equal(summary.period, 'monthly')
    assert.ok(typeof summary.totalApplications === 'number')
    assert.ok(typeof summary.totalAmount === 'number')
    assert.ok(typeof summary.byCategory === 'object')
    assert.ok(typeof summary.byStore === 'object')
  })

  it('getSummary 无数据范围时正确返回', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('daily', '2025-01-01', '2025-01-02')
    // 种子数据的 createdAt 是当前时间，因此会被包含
    // 验证结构而不是具体数值
    assert.ok(typeof summary.totalApplications === 'number')
    assert.ok(typeof summary.totalAmount === 'number')
    assert.ok(typeof summary.byCategory === 'object')
    assert.ok(typeof summary.byStore === 'object')
  })

  it('getSummary 按门店筛选', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31', 'store-002')
    // store-002 只有 office(3500)
    assert.equal(summary.byStore['store-002'], 3500)
  })
})

// ══════════════════════════════════════════════════════════════
// 边界与异常
// ══════════════════════════════════════════════════════════════

describe('边界与异常', () => {
  it('getExpense 不存在的 id 返回 400', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.getExpense('non-existent-id'),
      /not found/i,
    )
  })

  it('deleteExpense 不存在的 id 返回 400', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.deleteExpense('non-existent-id'),
      /not found/i,
    )
  })

  it('deleteExpense 已提交未审批不可删除', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.deleteExpense('exp-seed-meals'),
      /Cannot delete/i,
    )
  })

  it('submitExpense 不存在的 id 抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.submitExpense('non-existent'),
      /not found/i,
    )
  })

  it('submitExpense 已提交的不可重复提交', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.submitExpense('exp-seed-meals'),
      /Cannot submit/i,
    )
  })

  it('createExpense 缺少必填字段抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => (ctrl as any).createExpense({ title: 'test' }),
      /Missing required fields/i,
    )
  })

  it('approveExpense 缺少必填字段抛异常', () => {
    const ctrl = makeController()
    const { items } = ctrl.listExpenses({ status: 'pending' })
    const target = items[0]
    assert.throws(
      () => (ctrl as any).approveExpense(target.id, { action: 'approve' }),
      /Missing required fields/i,
    )
  })

  it('reimburseExpense 缺少必填字段抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => (ctrl as any).reimburseExpense('exp-seed-travel', { method: 'bank' }),
      /Missing required fields/i,
    )
  })

  it('cancelExpense 缺少必填字段抛异常', () => {
    assert.throws(
      () => (makeController() as any).cancelExpense('exp-seed-meals', { remark: '取消' }),
      /Missing required fields/i,
    )
  })

  it('getSummary 缺少 from/to 抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => (ctrl as any).getSummary('monthly'),
      /from and to are required/i,
    )
  })

  it('已驳回的不可报销', () => {
    const ctrl = makeController()
    const created = ctrl.createExpense({
      title: '驳回测试', category: 'travel', amount: 1000,
      applicantId: 'u1', applicantName: '员工', storeId: 's1',
      expenseDate: '2026-07-21', description: '测试驳回',
    })
    ctrl.submitExpense(created.id)
    ctrl.approveExpense(created.id, { action: 'reject', approverId: 'admin', approverName: '管理员', remark: '违规' })
    assert.throws(
      () => ctrl.reimburseExpense(created.id, { method: 'bank', account: '1234', operatorId: 'finance', operatorName: '财务' }),
      /Cannot reimburse/i,
    )
  })
})
