import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 薪资/薪酬管理 Controller 测试 (V23)
 *
 * 覆盖：路由元数据验证 / 薪资 CRUD / 审批流程 / 发放 / 统计 / 边界异常
 * 8 角色视角：👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SalaryController } from './salary.controller'
import { SalaryService } from './salary.service'

// ══════════════════════════════════════════════════════════════
// 路由元数据验证
// ══════════════════════════════════════════════════════════════

const ROUTES: Array<{ method: number; path: string; handler: string; verb: string }> = [
  { method: 1, path: 'calculate',         handler: 'calculatePayroll', verb: 'POST' },
  { method: 1, path: 'submit/:id',         handler: 'submitPayroll',   verb: 'POST' },
  { method: 0, path: ':id',                handler: 'getPayroll',      verb: 'GET'  },
  { method: 0, path: 'list',               handler: 'listPayrolls',    verb: 'GET'  },
  { method: 3, path: ':id',                handler: 'deletePayroll',   verb: 'DELETE' },
  { method: 1, path: 'approve/:id',        handler: 'approvePayroll',  verb: 'POST' },
  { method: 1, path: 'pay/:id',            handler: 'payPayroll',      verb: 'POST' },
  { method: 1, path: 'cancel/:id',         handler: 'cancelPayroll',   verb: 'POST' },
  { method: 0, path: 'summary',            handler: 'getSummary',      verb: 'GET'  },
]

describe('路由元数据验证', () => {
  it('salary controller path metadata is set', () => {
    const ctrlPath = Reflect.getMetadata('path', SalaryController)
    assert.equal(ctrlPath, 'salary')
  })

  for (const route of ROUTES) {
    it(`${route.verb} salary/${route.path} → ${route.handler}`, () => {
      const method = Reflect.getMetadata('method', SalaryController.prototype[route.handler as keyof SalaryController])
      const routePath = Reflect.getMetadata('path', SalaryController.prototype[route.handler as keyof SalaryController])
      assert.equal(method, route.method)
      assert.equal(routePath, route.path)
    })
  }

  it('所有 9 个路由都注册了元数据', () => {
    for (const handler of ROUTES.map((r) => r.handler)) {
      const method = Reflect.getMetadata('method', SalaryController.prototype[handler as keyof SalaryController])
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

function makeController(): SalaryController {
  return new SalaryController(new SalaryService())
}

// 👔 店长 - 关注门店薪资管理和审批
describe(`${ROLES.StoreManager} salary 场景`, () => {
  it('店长查看所有薪资单列表', () => {
    const ctrl = makeController()
    const { items, total } = ctrl.listPayrolls({})
    assert.ok(total >= 3, '种子数据应有 3 条薪资')
    assert.ok(items.some((p) => p.storeId === 'store-001'))
  })

  it('店长审批待处理的薪资单', () => {
    const ctrl = makeController()
    const { items } = ctrl.listPayrolls({ status: 'pending' })
    assert.ok(items.length > 0, '应有待审批的薪资')
    const result = ctrl.approvePayroll(items[0].id, {
      action: 'approve', approverId: 'admin-001', approverName: '店长', remark: '同意发放',
    })
    assert.equal(result.status, 'approved')
    assert.equal(result.approverId, 'admin-001')
  })

  it('店长驳回薪资单', () => {
    const ctrl = makeController()
    const { items } = ctrl.listPayrolls({ status: 'pending' })
    assert.ok(items.length > 0)
    const result = ctrl.approvePayroll(items[0].id, {
      action: 'reject', approverId: 'admin-001', approverName: '店长', remark: '数据异常',
    })
    assert.equal(result.status, 'rejected')
    assert.equal(result.approvalRemark, '数据异常')
  })
})

// 🛒 前台 - 关注薪资计算和提交
describe(`${ROLES.FrontDesk} salary 场景`, () => {
  it('前台创建新的薪资单（草稿）', () => {
    const ctrl = makeController()
    const result = ctrl.calculatePayroll({
      employeeId: 'emp-fd-001',
      employeeName: '前台小王',
      storeId: 'store-002',
      period: '2026-07',
      mode: 'monthly',
      baseSalary: 5000,
      allowance: 500,
      socialSecurity: 500,
      tax: 200,
    })
    assert.equal(result.status, 'draft')
    assert.equal(result.netPay, 4800)
    assert.ok(result.code.startsWith('SAL'))
  })

  it('前台提交流程（draft → pending）', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'emp-fd-001', employeeName: '前台小王',
      storeId: 'store-002', period: '2026-07', mode: 'monthly',
      baseSalary: 3000, socialSecurity: 300, housingFund: 210,
    })
    assert.equal(created.status, 'draft')

    const submitted = ctrl.submitPayroll(created.id)
    assert.equal(submitted.status, 'pending')
    assert.equal(submitted.id, created.id)
  })

  it('前台查看自己提交的薪资详情含审批历史', () => {
    const ctrl = makeController()
    const detail = ctrl.getPayroll('pay-seed-001')
    assert.equal(detail.id, 'pay-seed-001')
    assert.ok(detail.approvalHistory)
    assert.ok(detail.approvalHistory.length >= 3)
  })
})

// 👥 HR - 关注薪资计算和人力资源数据
describe(`${ROLES.HR} salary 场景`, () => {
  it('HR 创建包含多项收入的薪资', () => {
    const ctrl = makeController()
    const result = ctrl.calculatePayroll({
      employeeId: 'emp-hr-001',
      employeeName: 'HR李',
      storeId: 'store-001',
      period: '2026-07',
      mode: 'mixed',
      baseSalary: 6000,
      bonus: 2000,
      commission: 3000,
      allowance: 800,
      socialSecurity: 800,
      housingFund: 560,
      tax: 500,
    })
    assert.equal(result.items.length, 7)
    assert.equal(result.grossPay, 11800)
    assert.equal(result.totalDeductions, 1860)
    assert.equal(result.netPay, 9940)
  })

  it('HR 按门店筛选薪资单', () => {
    const ctrl = makeController()
    const { items } = ctrl.listPayrolls({ storeId: 'store-002' })
    assert.ok(items.every((p) => p.storeId === 'store-002'))
  })
})

// 🔧 安监 - 关注薪资数据安全与异常处理
describe(`${ROLES.Safety} salary 场景`, () => {
  it('安监删除草稿薪资单', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'emp-s-001', employeeName: '安监',
      storeId: 'store-001', period: '2026-07', mode: 'monthly',
      baseSalary: 4000,
    })
    const result = ctrl.deletePayroll(created.id)
    assert.equal(result.success, true)
    assert.throws(() => ctrl.getPayroll(created.id), /not found/i)
  })

  it('安监验证非法 mode 参数抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.calculatePayroll({
        employeeId: 'emp-x', employeeName: '测试',
        storeId: 'store-001', period: '2026-07', mode: 'invalid',
      }),
      /Invalid mode/i,
    )
  })
})

// 🎮 导玩员 - 关注提成制员工的薪资
describe(`${ROLES.Guide} salary 场景`, () => {
  it('导玩员创建提成制薪资', () => {
    const ctrl = makeController()
    const result = ctrl.calculatePayroll({
      employeeId: 'emp-guide-001',
      employeeName: '导玩员小陈',
      storeId: 'store-002',
      period: '2026-07',
      mode: 'commission',
      commission: 8500,
      allowance: 500,
      socialSecurity: 600,
      tax: 400,
    })
    assert.equal(result.mode, 'commission')
    assert.equal(result.grossPay, 9000)
    assert.equal(result.netPay, 8000)
  })

  it('导玩员查看门店的薪资汇总', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31', 'store-002')
    assert.equal(summary.byStore['store-002'], 11500)
    assert.ok(summary.totalGross >= 0)
  })
})

// 🎯 运行专员 - 关注薪资统计和数据聚合
describe(`${ROLES.Operations} salary 场景`, () => {
  it('运行专员获取薪资统计摘要', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.equal(summary.period, 'monthly')
    assert.equal(summary.from, '2026-07-01')
    assert.equal(summary.to, '2026-07-31')
    assert.ok(summary.totalGross > 0)
    assert.equal(typeof summary.totalNet, 'number')
  })

  it('运行专员按门店统计', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    // store-001: pay-seed-001(9460) + pay-seed-002(pending, gross=8500, net=7500, but summary uses netPay for byStore)
    // Pay attention: summary uses netPay for byStore, pending = 7500, paid = 9460 => store-001 = 9460+7500 = 16960
    assert.equal(summary.byStore['store-001'], 16960)
    // store-002: pay-seed-003(approved, net=11500) = 11500
    assert.equal(summary.byStore['store-002'], 11500)
  })

  it('运行专员按薪资模式统计', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.equal(summary.byMode['monthly'], 12000)
    assert.equal(summary.byMode['commission'], 8500)
    assert.equal(summary.byMode['mixed'], 15000)
  })

  it('运行专员检查统计人数', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.equal(summary.totalEmployees, 3)
  })
})

// 🤝 团建 - 关注薪资取消和异常场景
describe(`${ROLES.Teambuilding} salary 场景`, () => {
  it('团建取消未发放的薪资单', () => {
    const ctrl = makeController()
    const { items } = ctrl.listPayrolls({ status: 'pending' })
    const target = items[0]
    const result = ctrl.cancelPayroll(target.id, {
      operatorId: 'admin-tb', operatorName: '团建专员', remark: '调整薪资结构',
    })
    assert.equal(result.status, 'cancelled')
  })

  it('已取消的薪资单不可重复取消', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'emp-tb', employeeName: '团建',
      storeId: 'store-001', period: '2026-07', mode: 'monthly',
      baseSalary: 3000,
    })
    ctrl.submitPayroll(created.id)
    ctrl.cancelPayroll(created.id, { operatorId: 'admin', operatorName: 'admin', remark: '取消' })
    assert.throws(
      () => ctrl.cancelPayroll(created.id, { operatorId: 'admin', operatorName: 'admin', remark: '重复' }),
      /already cancelled/,
    )
  })
})

// 📢 营销 - 关注包含提成/奖金的员工薪资
describe(`${ROLES.Marketing} salary 场景`, () => {
  it('营销创建含提成的薪资', () => {
    const ctrl = makeController()
    const result = ctrl.calculatePayroll({
      employeeId: 'emp-mkt-001',
      employeeName: '营销小王',
      storeId: 'store-003',
      period: '2026-07',
      mode: 'mixed',
      baseSalary: 5000,
      commission: 12000,
      bonus: 3000,
      socialSecurity: 1000,
      housingFund: 700,
      tax: 1200,
    })
    assert.equal(result.mode, 'mixed')
    assert.equal(result.grossPay, 20000)
    assert.equal(result.totalDeductions, 2900)
    assert.equal(result.netPay, 17100)
  })

  it('营销创建→提交→审批→发放 全流程', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'emp-mkt-002', employeeName: '营销李',
      storeId: 'store-003', period: '2026-07', mode: 'monthly',
      baseSalary: 6000, bonus: 2000,
      socialSecurity: 800, tax: 400,
    })
    assert.equal(created.status, 'draft')

    const submitted = ctrl.submitPayroll(created.id)
    assert.equal(submitted.status, 'pending')

    const approved = ctrl.approvePayroll(created.id, {
      action: 'approve', approverId: 'admin-001', approverName: '管理员', remark: '同意',
    })
    assert.equal(approved.status, 'approved')

    const paid = ctrl.payPayroll(created.id, {
      method: 'bank', account: '6217000012345678', operatorId: 'finance-001', operatorName: '财务',
    })
    assert.equal(paid.status, 'paid')
    assert.equal(paid.paymentMethod, 'bank')
    assert.equal(paid.paidByName, '财务')
  })

  it('营销查看薪资统计含 byMode', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.ok('monthly' in summary.byMode)
    assert.ok('commission' in summary.byMode)
    assert.ok('mixed' in summary.byMode)
  })
})

// ══════════════════════════════════════════════════════════════
// 薪资 CRUD 正常流程
// ══════════════════════════════════════════════════════════════

describe('薪资单 CRUD - 正常流程', () => {
  it('calculatePayroll 返回正确结构', () => {
    const ctrl = makeController()
    const result = ctrl.calculatePayroll({
      employeeId: 'emp-test',
      employeeName: '测试员',
      storeId: 'store-001',
      period: '2026-07',
      mode: 'monthly',
      baseSalary: 8000,
      bonus: 2000,
      socialSecurity: 1000,
      tax: 500,
    })
    assert.ok(result.id)
    assert.ok(result.code)
    assert.equal(result.status, 'draft')
    assert.equal(result.grossPay, 10000)
    assert.equal(result.totalDeductions, 1500)
    assert.equal(result.netPay, 8500)
    assert.ok(result.createdAt)
  })

  it('listPayrolls 返回正确结构', () => {
    const ctrl = makeController()
    const { items, total } = ctrl.listPayrolls({})
    assert.ok(Array.isArray(items))
    assert.ok(total >= 3)
    assert.equal(items.length, total)
    for (const item of items) {
      assert.ok(item.id)
      assert.ok(item.code)
      assert.ok(item.employeeName)
      assert.ok(item.status)
    }
  })

  it('getPayroll 返回已存在的薪资详情', () => {
    const ctrl = makeController()
    const detail = ctrl.getPayroll('pay-seed-001')
    assert.equal(detail.id, 'pay-seed-001')
    assert.equal(detail.code, 'SAL000001')
    assert.equal(detail.employeeName, '张三')
  })

  it('deletePayroll 删除草稿状态薪资单', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'emp-999', employeeName: '临时',
      storeId: 'store-001', period: '2026-07', mode: 'monthly',
      baseSalary: 1000,
    })
    const result = ctrl.deletePayroll(created.id)
    assert.equal(result.success, true)
  })

  it('生成的 code 是递增的', () => {
    const ctrl = makeController()
    const r1 = ctrl.calculatePayroll({
      employeeId: 'a', employeeName: 'A', storeId: 's1', period: '2026-07', mode: 'monthly', baseSalary: 1000,
    })
    const r2 = ctrl.calculatePayroll({
      employeeId: 'b', employeeName: 'B', storeId: 's1', period: '2026-07', mode: 'monthly', baseSalary: 2000,
    })
    assert.ok(r2.code > r1.code, 'code 应递增')
  })
})

// ══════════════════════════════════════════════════════════════
// 审批与发放流程
// ══════════════════════════════════════════════════════════════

describe('审批与发放流程', () => {
  it('创建→提交→审批→发放 完整生命周期', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'u1', employeeName: '员工', storeId: 's1', period: '2026-07', mode: 'monthly',
      baseSalary: 5000, socialSecurity: 500, tax: 200,
    })
    assert.equal(created.status, 'draft')

    const submitted = ctrl.submitPayroll(created.id)
    assert.equal(submitted.status, 'pending')

    const approved = ctrl.approvePayroll(created.id, {
      action: 'approve', approverId: 'admin', approverName: '管理员', remark: '同意',
    })
    assert.equal(approved.status, 'approved')

    const paid = ctrl.payPayroll(created.id, {
      method: 'wechat', account: 'wx-account', operatorId: 'finance', operatorName: '财务',
    })
    assert.equal(paid.status, 'paid')
    assert.equal(paid.paymentMethod, 'wechat')

    const detail = ctrl.getPayroll(created.id)
    assert.ok(detail.approvalHistory)
    assert.equal(detail.approvalHistory!.length, 4)
    const actions = detail.approvalHistory!.map((r: any) => r.action)
    assert.deepEqual(actions, ['submit', 'submit', 'approve', 'pay'])
  })

  it('已审批的薪资不可重复审批', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'u1', employeeName: '员工', storeId: 's1', period: '2026-07', mode: 'monthly',
      baseSalary: 4000,
    })
    ctrl.submitPayroll(created.id)
    ctrl.approvePayroll(created.id, { action: 'approve', approverId: 'admin', approverName: '管理员', remark: '同意' })
    assert.throws(
      () => ctrl.approvePayroll(created.id, { action: 'approve', approverId: 'admin2', approverName: '管理员2', remark: '重复' }),
      /Cannot approve/i,
    )
  })

  it('未提交不能审批', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'u1', employeeName: '员工', storeId: 's1', period: '2026-07', mode: 'monthly',
      baseSalary: 4000,
    })
    const svc = (ctrl as any).service as any
    assert.throws(
      () => svc.approvePayroll(created.id, 'approve', 'admin', '管理员', ''),
      /Cannot approve/i,
    )
  })

  it('已发放的不可取消', () => {
    const svc = new SalaryService()
    assert.throws(
      () => svc.cancelPayroll('pay-seed-001', 'admin', '管理员'),
      /Cannot cancel a paid/i,
    )
  })

  it('待审批的不可发放', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.payPayroll('pay-seed-002', { method: 'bank', account: '1234', operatorId: 'finance', operatorName: '财务' }),
      /Cannot pay/i,
    )
  })

  it('已驳回的不可发放', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'u2', employeeName: '测试', storeId: 's1', period: '2026-07', mode: 'monthly',
      baseSalary: 3000,
    })
    ctrl.submitPayroll(created.id)
    ctrl.approvePayroll(created.id, { action: 'reject', approverId: 'admin', approverName: '管理员', remark: '数据异常' })
    assert.throws(
      () => ctrl.payPayroll(created.id, { method: 'bank', account: '1234', operatorId: 'finance', operatorName: '财务' }),
      /Cannot pay/i,
    )
  })
})

// ══════════════════════════════════════════════════════════════
// 薪资统计
// ══════════════════════════════════════════════════════════════

describe('薪资统计 (GET /salary/summary)', () => {
  it('getSummary 返回正确结构', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31')
    assert.equal(summary.period, 'monthly')
    assert.ok(typeof summary.totalGross === 'number')
    assert.ok(typeof summary.totalNet === 'number')
    assert.ok(typeof summary.byStore === 'object')
    assert.ok(typeof summary.byMode === 'object')
  })

  it('getSummary 按门店筛选', () => {
    const ctrl = makeController()
    const summary = ctrl.getSummary('monthly', '2026-07-01', '2026-07-31', 'store-002')
    assert.equal(summary.byStore['store-002'], 11500)
  })
})

// ══════════════════════════════════════════════════════════════
// 边界与异常
// ══════════════════════════════════════════════════════════════

describe('边界与异常', () => {
  it('getPayroll 不存在的 id 返回 400', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.getPayroll('non-existent-id'),
      /not found/i,
    )
  })

  it('deletePayroll 不存在的 id 返回 400', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.deletePayroll('non-existent-id'),
      /not found/i,
    )
  })

  it('deletePayroll 已提交不可删除', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.deletePayroll('pay-seed-002'),
      /Cannot delete/i,
    )
  })

  it('submitPayroll 不存在的 id 抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.submitPayroll('non-existent'),
      /not found/i,
    )
  })

  it('submitPayroll 已提交的不可重复提交', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.submitPayroll('pay-seed-002'),
      /Cannot submit/i,
    )
  })

  it('calculatePayroll 缺少必填字段抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => (ctrl as any).calculatePayroll({ employeeId: 'emp' }),
      /Missing required fields/i,
    )
  })

  it('calculatePayroll 非法 mode 抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => ctrl.calculatePayroll({
        employeeId: 'emp', employeeName: '测试',
        storeId: 's1', period: '2026-07', mode: 'weekly',
      }),
      /Invalid mode/i,
    )
  })

  it('approvePayroll 缺少必填字段抛异常', () => {
    const ctrl = makeController()
    const { items } = ctrl.listPayrolls({ status: 'pending' })
    const target = items[0]
    assert.throws(
      () => (ctrl as any).approvePayroll(target.id, { action: 'approve' }),
      /Missing required fields/i,
    )
  })

  it('payPayroll 缺少必填字段抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => (ctrl as any).payPayroll('pay-seed-003', { method: 'bank' }),
      /Missing required fields/i,
    )
  })

  it('cancelPayroll 缺少必填字段抛异常', () => {
    const ctrl = makeController()
    assert.throws(
      () => (ctrl as any).cancelPayroll('pay-seed-002', { remark: '取消' }),
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

  it('payPayroll 草稿状态不可发放', () => {
    const ctrl = makeController()
    const created = ctrl.calculatePayroll({
      employeeId: 'emp-demo', employeeName: '演示', storeId: 's1', period: '2026-07', mode: 'monthly',
      baseSalary: 3000,
    })
    assert.throws(
      () => ctrl.payPayroll(created.id, { method: 'bank', account: '1234', operatorId: 'finance', operatorName: '财务' }),
      /Cannot pay/i,
    )
  })
})
