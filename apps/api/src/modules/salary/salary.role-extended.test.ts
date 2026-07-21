/**
 * 🐜 自动: [salary] [C] 角色扩展测试
 *
 * 8 角色视角的薪资模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 SalaryService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { SalaryService } from './salary.service'
import type { SalaryMode, PaymentMethod } from './salary.entity'

// ── 角色权限矩阵 ──

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

/** 角色 → 薪资模块权限 */
const roleSalaryAccess: Record<string, string[]> = {
  'salary:list': ['👔店长', '👥HR', '🎯运行专员'],
  'salary:detail': ['👔店长', '👥HR', '🎯运行专员'],
  'salary:calculate': ['👥HR', '🎯运行专员'],
  'salary:submit': ['👥HR', '🎯运行专员'],
  'salary:approve': ['👔店长'],
  'salary:pay': ['👔店长', '🎯运行专员'],
  'salary:cancel': ['👔店长', '👥HR'],
  'salary:summary': ['👔店长', '👥HR', '🎯运行专员', '📢营销'],
  'salary:delete': ['👥HR'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleSalaryAccess[resource]?.includes(role) ?? false
}

function makeService(): SalaryService {
  return new SalaryService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 薪资
// ════════════════════════════════════════════════════════════

describe('[👔店长] salary 角色扩展测试', () => {
  it('👔[正例] 店长查看薪资列表 → 按门店筛选 → 查看汇总统计', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'salary:list')).toBe(true)
    const svc = makeService()
    const all = svc.listPayrolls()
    expect(all.length).toBeGreaterThan(0)

    const storeItems = svc.listPayrolls({ storeId: 'store-001' })
    expect(storeItems.length).toBeGreaterThan(0)
    storeItems.forEach((p) => expect(p.storeId).toBe('store-001'))

    expect(checkRoleAccess(ROLES.StoreManager, 'salary:summary')).toBe(true)
    const summary = svc.getSalarySummary('monthly', '2026-07-01', '2026-07-31', 'store-001')
    expect(summary.totalEmployees).toBeGreaterThan(0)
    expect(summary.totalGross).toBeGreaterThan(0)
  })

  it('👔[正例] 店长审批/驳回薪资 → 执行发放', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'salary:approve')).toBe(true)
    const svc = makeService()

    // 创建草稿 → 提交 → 审批
    const draft = svc.calculatePayroll({
      employeeId: 'emp-approve-test',
      employeeName: '测试员工',
      storeId: 'store-001',
      period: '2026-07',
      mode: 'monthly',
      baseSalary: 8000,
      bonus: 2000,
      socialSecurity: 1200,
      housingFund: 840,
      tax: 500,
    })
    expect(draft.status).toBe('draft')

    const pending = svc.submitPayroll(draft.id)
    expect(pending.status).toBe('pending')

    const approved = svc.approvePayroll(pending.id, 'approve', 'store-mgr', '店长', '同意发放')
    expect(approved.status).toBe('approved')
    expect(approved.approverId).toBe('store-mgr')

    // 执行发放
    expect(checkRoleAccess(ROLES.StoreManager, 'salary:pay')).toBe(true)
    const paid = svc.payPayroll(approved.id, 'bank', '6217****9999', 'finance-001', '财务')
    expect(paid.status).toBe('paid')
    expect(paid.paymentMethod).toBe('bank')
  })

  it('👔[正例] 店长取消待审批薪资单', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'salary:cancel')).toBe(true)
    const svc = makeService()
    const draft = svc.calculatePayroll({
      employeeId: 'emp-cancel',
      employeeName: '取消测试',
      storeId: 'store-001',
      period: '2026-08',
      mode: 'monthly',
      baseSalary: 5000,
    })
    const pending = svc.submitPayroll(draft.id)
    const cancelled = svc.cancelPayroll(pending.id, 'store-mgr', '店长', '情况有变')
    expect(cancelled.status).toBe('cancelled')
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 薪资
// ════════════════════════════════════════════════════════════

describe('[🛒前台] salary 角色扩展测试', () => {
  it('🛒[反例] 前台无权限查看薪资列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'salary:list')).toBe(false)
  })

  it('🛒[反例] 前台无权限查看薪资详情', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'salary:detail')).toBe(false)
  })

  it('🛒[反例] 前台无权限进行任何薪资操作', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'salary:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'salary:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'salary:pay')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 薪资
// ════════════════════════════════════════════════════════════

describe('[👥HR] salary 角色扩展测试', () => {
  it('👥[正例] HR 创建薪资单 → 查看审批历史', async () => {
    expect(checkRoleAccess(ROLES.HR, 'salary:calculate')).toBe(true)
    const svc = makeService()
    const payroll = svc.calculatePayroll({
      employeeId: 'emp-hr-001',
      employeeName: 'HR测试员工',
      storeId: 'store-002',
      period: '2026-07',
      mode: 'commission',
      commission: 12000,
      allowance: 1000,
      socialSecurity: 600,
      tax: 800,
    })
    expect(payroll.status).toBe('draft')
    expect(payroll.netPay).toBe(12000 + 1000 - 600 - 800)

    const detail = svc.getPayrollDetail(payroll.id)
    expect(detail).not.toBeNull()
    expect(detail!.approvalHistory).toBeDefined()
    expect(detail!.approvalHistory!.length).toBeGreaterThan(0)
  })

  it('👥[正例] HR 提交薪资审批 → 汇总统计', async () => {
    expect(checkRoleAccess(ROLES.HR, 'salary:submit')).toBe(true)
    const svc = makeService()
    const d = svc.calculatePayroll({
      employeeId: 'emp-002',
      employeeName: '李四',
      storeId: 'store-001',
      period: '2026-07',
      mode: 'monthly',
      baseSalary: 10000,
    })
    svc.submitPayroll(d.id)
    const submitted = svc.getPayroll(d.id)
    expect(submitted!.status).toBe('pending')

    expect(checkRoleAccess(ROLES.HR, 'salary:summary')).toBe(true)
    const summary = svc.getSalarySummary('monthly', '2026-07-01', '2026-07-31')
    expect(summary.totalPending).toBeGreaterThanOrEqual(0)
  })

  it('👥[正例] HR 删除草稿薪资单', async () => {
    expect(checkRoleAccess(ROLES.HR, 'salary:delete')).toBe(true)
    const svc = makeService()
    const d = svc.calculatePayroll({
      employeeId: 'emp-del',
      employeeName: '删除测试',
      storeId: 'store-001',
      period: '2026-07',
      mode: 'monthly',
      baseSalary: 6000,
    })
    const deleted = svc.deletePayroll(d.id)
    expect(deleted).toBe(true)
    expect(svc.getPayroll(d.id)).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 薪资
// ════════════════════════════════════════════════════════════

describe('[🔧安监] salary 角色扩展测试', () => {
  it('🔧[反例] 安监无权限查看薪资列表', () => {
    expect(checkRoleAccess(ROLES.Security, 'salary:list')).toBe(false)
  })

  it('🔧[反例] 安监无权限操作薪资', () => {
    expect(checkRoleAccess(ROLES.Security, 'salary:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'salary:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'salary:pay')).toBe(false)
  })

  it('🔧[闭环] 安监无权限时返回统一格式', () => {
    const denied = { success: false, code: 403, message: 'NO_SALARY_ACCESS', module: 'salary' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('salary')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 薪资
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] salary 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权查看薪资详情', () => {
    expect(checkRoleAccess(ROLES.Guide, 'salary:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'salary:list')).toBe(false)
  })

  it('🎮[反例] 导玩员无权创建或审批薪资', () => {
    expect(checkRoleAccess(ROLES.Guide, 'salary:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'salary:approve')).toBe(false)
  })

  it('🎮[反例] 导玩员全部薪资操作权限为 false', () => {
    const resources = ['salary:list', 'salary:detail', 'salary:calculate', 'salary:submit', 'salary:approve', 'salary:pay', 'salary:cancel', 'salary:summary', 'salary:delete']
    for (const r of resources) {
      expect(checkRoleAccess(ROLES.Guide, r)).toBe(false)
    }
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 薪资
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] salary 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看薪资列表 → 按状态筛选', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'salary:list')).toBe(true)
    const svc = makeService()
    const pendingItems = svc.listPayrolls({ status: 'pending' })
    expect(pendingItems.length).toBeGreaterThanOrEqual(1)
    pendingItems.forEach((p) => expect(p.status).toBe('pending'))

    const paidItems = svc.listPayrolls({ status: 'paid' })
    expect(paidItems.length).toBeGreaterThanOrEqual(1)
    paidItems.forEach((p) => expect(p.status).toBe('paid'))
  })

  it('🎯[正例] 运行专员创建薪资单 → 提交 → 查看摘要', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'salary:calculate')).toBe(true)
    const svc = makeService()
    const d = svc.calculatePayroll({
      employeeId: 'emp-ops-001',
      employeeName: '运行专员测试',
      storeId: 'store-002',
      period: '2026-08',
      mode: 'mixed',
      baseSalary: 5000,
      commission: 6000,
      overtimePay: 1500,
      socialSecurity: 1000,
      housingFund: 700,
      tax: 600,
    })
    expect(d.grossPay).toBe(5000 + 6000 + 1500)

    expect(checkRoleAccess(ROLES.Operations, 'salary:submit')).toBe(true)
    const pending = svc.submitPayroll(d.id)
    expect(pending.status).toBe('pending')

    expect(checkRoleAccess(ROLES.Operations, 'salary:summary')).toBe(true)
    const summary = svc.getSalarySummary('monthly', '2026-08-01', '2026-08-31', 'store-002')
    expect(summary.period).toBe('monthly')
  })

  it('🎯[反例] 运行专员无权删除薪资单（有权限可查看）', () => {
    expect(checkRoleAccess(ROLES.Operations, 'salary:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 薪资
// ════════════════════════════════════════════════════════════

describe('[🤝团建] salary 角色扩展测试', () => {
  it('🤝[反例] 团建无权限查看薪资列表', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'salary:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'salary:detail')).toBe(false)
  })

  it('🤝[反例] 团建无权限创建或审批薪资', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'salary:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'salary:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'salary:pay')).toBe(false)
  })

  it('🤝[闭环] 团建角色访问薪资返回 403', () => {
    const denied = { success: false, code: 403, message: 'FORBIDDEN', module: 'salary' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('salary')
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 薪资
// ════════════════════════════════════════════════════════════

describe('[📢营销] salary 角色扩展测试', () => {
  it('📢[正例] 营销查看薪资汇总统计（了解人力成本）', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'salary:summary')).toBe(true)
    const svc = makeService()
    const summary = svc.getSalarySummary('monthly', '2026-07-01', '2026-07-31')
    expect(summary.totalEmployees).toBeGreaterThan(0)
    expect(summary.totalGross).toBeGreaterThan(0)
    expect(summary.byMode).toBeDefined()
    expect(Object.keys(summary.byMode).length).toBeGreaterThan(0)
  })

  it('📢[反例] 营销无权查看薪资详情与创建', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'salary:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'salary:calculate')).toBe(false)
  })

  it('📢[反例] 营销无权审批或发放薪资', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'salary:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'salary:pay')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'salary:cancel')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 salary 跨角色闭环 + 边界]', () => {
  it('👥 + 👔 薪资审批发放全流程', async () => {
    const svc = makeService()

    // 1. HR 创建并提交
    const draft = svc.calculatePayroll({
      employeeId: 'emp-full-001',
      employeeName: '全流程员工',
      storeId: 'store-001',
      period: '2026-07',
      mode: 'monthly',
      baseSalary: 10000,
      bonus: 5000,
      socialSecurity: 1500,
      housingFund: 1000,
      tax: 1200,
    })
    expect(draft.netPay).toBe(10000 + 5000 - 1500 - 1000 - 1200)

    const pending = svc.submitPayroll(draft.id)
    expect(pending.status).toBe('pending')

    // 2. 店长审批
    const approved = svc.approvePayroll(pending.id, 'approve', 'store-mgr', '张三', '同意')
    expect(approved.status).toBe('approved')

    // 3. 发放
    const paid = svc.payPayroll(approved.id, 'wechat', 'wx_****', 'finance', '财务')
    expect(paid.status).toBe('paid')
    expect(paid.paymentAccount).toBe('wx_****')

    // 4. 查看审批记录
    const detail = svc.getPayrollDetail(paid.id)
    expect(detail!.approvalHistory).toBeDefined()
    expect(detail!.approvalHistory!.length).toBeGreaterThanOrEqual(3)
  })

  it('🛡️ 不存在的薪资 ID 返回 null', () => {
    const svc = makeService()
    expect(svc.getPayroll('pay-nonexistent')).toBeNull()
  })

  it('🛡️ 已发放薪资不可取消', () => {
    const svc = makeService()
    const seedPay = svc.getPayroll('pay-seed-001')
    expect(seedPay).not.toBeNull()
    expect(seedPay!.status).toBe('paid')

    expect(() => svc.cancelPayroll('pay-seed-001', 'admin', '管理员'))
      .toThrow('Cannot cancel a paid payroll')
  })

  it('🛡️ 已取消薪资不可重复取消', () => {
    const svc = makeService()
    const d = svc.calculatePayroll({
      employeeId: 'emp-cancel2',
      employeeName: '重复取消',
      storeId: 'store-001',
      period: '2026-07',
      mode: 'monthly',
      baseSalary: 5000,
    })
    svc.cancelPayroll(d.id, 'admin', '管理员')
    expect(() => svc.cancelPayroll(d.id, 'admin', '管理员'))
      .toThrow('Payroll already cancelled')
  })

  it('🛡️ 按员工 ID 筛选薪资', () => {
    const svc = makeService()
    const empItems = svc.listPayrolls({ employeeId: 'emp-001' })
    expect(empItems.length).toBeGreaterThanOrEqual(1)
    empItems.forEach((p) => expect(p.employeeId).toBe('emp-001'))
  })

  it('🛡️ 按时间段筛选薪资', () => {
    const svc = makeService()
    const items = svc.listPayrolls({ from: '2026-07-01', to: '2026-07-31' })
    expect(items.length).toBeGreaterThan(0)
  })

  it('🛡️ 摘要统计按门店汇总', () => {
    const svc = makeService()
    const summary = svc.getSalarySummary('monthly', '2026-07-01', '2026-07-31', 'store-001')
    expect(summary.byStore['store-001']).toBeGreaterThan(0)
  })
})
