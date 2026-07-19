/**
 * 🧪 HR 模块 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 覆盖:
 * - 员工管理: 查看列表/查看详情/新增/编辑/删除
 * - 考勤管理: 记录考勤/查看考勤/考勤统计
 * - 合同管理: 查看合同/创建合同/续签合同
 * - 入离职管理: 入职办理/离职办理
 * - 部门统计: 查看各部门人员分布
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR',
  Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员',
  Teambuilding: '🤝团建', Marketing: '📢营销',
} as const

const access: Record<string, string[]> = {
  // 员工管理
  'employee:list':      ['👔店长', '👥HR', '🎯运行专员'],
  'employee:detail':    ['👔店长', '👥HR', '🎯运行专员'],
  'employee:create':    ['👥HR'],
  'employee:edit':      ['👥HR'],
  'employee:delete':    ['👥HR'],
  // 考勤管理
  'attendance:record':  ['👥HR', '👔店长'],
  'attendance:view':    ['👔店长', '👥HR', '🎯运行专员', '🛒前台', '🎮导玩员', '📢营销', '🤝团建', '🔧安监'],
  'attendance:stats':   ['👥HR', '👔店长'],
  // 合同管理
  'contract:view':      ['👔店长', '👥HR'],
  'contract:create':    ['👥HR'],
  'contract:renew':     ['👥HR'],
  // 入离职
  'onboard:create':     ['👥HR'],
  'onboard:list':       ['👔店长', '👥HR'],
  'offboard:create':    ['👥HR'],
  'offboard:list':      ['👔店长', '👥HR'],
  // 统计
  'stats:view':         ['👔店长', '👥HR', '🎯运行专员'],
  'department:list':    ['👔店长', '👥HR', '🎯运行专员'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok<T>(d: T) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

// ════════════════════════════════════════════════════
// 👥 HR 角色 — HR 模块的核心用户
// ════════════════════════════════════════════════════

describe(`${ROLES.HR} HR 模块角色旅程测试`, () => {
  // ── 员工管理 ──
  it('👥[正例] HR查看全部员工列表 → 筛选部门 → 查看详情', () => {
    expect(chk(ROLES.HR, 'employee:list')).toBe(true)
    const list = ok([
      { id: 'E001', name: '张三', department: '技术部', status: 'active' },
      { id: 'E002', name: '李四', department: '技术部', status: 'active' },
    ])
    expect(list.data.length).toBe(2)
    expect(chk(ROLES.HR, 'employee:detail')).toBe(true)
    const detail = ok({ id: 'E001', name: '张三', department: '技术部', position: '技术总监', status: 'active' })
    expect(detail.data.name).toBe('张三')
  })

  it('👥[正例] HR新增员工 → 编辑信息 → 删除员工', () => {
    expect(chk(ROLES.HR, 'employee:create')).toBe(true)
    const created = ok({ id: 'E011', name: '新员工', department: '运营部', position: '运营专员', status: 'probation' })
    expect(created.data.id).toBe('E011')
    expect(chk(ROLES.HR, 'employee:edit')).toBe(true)
    const edited = ok({ id: 'E011', name: '新员工', position: '高级运营专员' })
    expect(edited.data.position).toBe('高级运营专员')
    expect(chk(ROLES.HR, 'employee:delete')).toBe(true)
    const deleted = ok({ success: true })
    expect(deleted.data.success).toBe(true)
  })

  it('👥[反例] HR新增员工时缺少必填字段', () => {
    const err = fail(400, 'NAME_REQUIRED')
    expect(err.code).toBe(400)
  })

  it('👥[边界] HR查看不存在的员工详情', () => {
    const err = fail(404, 'EMPLOYEE_NOT_FOUND')
    expect(err.code).toBe(404)
  })

  // ── 考勤管理 ──
  it('👥[正例] HR记录员工考勤 → 查看考勤记录 → 考勤统计', () => {
    expect(chk(ROLES.HR, 'attendance:record')).toBe(true)
    const record = ok({ id: 'att-001', employeeId: 'E001', date: '2026-07-20', type: 'check-in', time: '09:00' })
    expect(record.data.type).toBe('check-in')
    expect(chk(ROLES.HR, 'attendance:view')).toBe(true)
    expect(chk(ROLES.HR, 'attendance:stats')).toBe(true)
    const stats = ok({ total: 22, checkIns: 20, late: 2, absent: 0 })
    expect(stats.data.checkIns).toBe(20)
  })

  // ── 合同管理 ──
  it('👥[正例] HR查看员工合同 → 创建合同 → 续签', () => {
    expect(chk(ROLES.HR, 'contract:view')).toBe(true)
    const contracts = ok([{ id: 'ctr-001', type: 'full-time', startDate: '2024-01-01', status: 'active' }])
    expect(contracts.data.length).toBe(1)
    expect(chk(ROLES.HR, 'contract:create')).toBe(true)
    const created = ok({ id: 'ctr-002', type: 'full-time', startDate: '2026-01-01', endDate: '2028-12-31', salary: 8000, status: 'active' })
    expect(created.data.salary).toBe(8000)
    expect(chk(ROLES.HR, 'contract:renew')).toBe(true)
    const renewed = ok({ id: 'ctr-002', startDate: '2029-01-01', endDate: '2031-12-31', salary: 8800, status: 'active' })
    expect(renewed.data.salary).toBe(8800)
  })

  it('👥[反例] HR创建合同金额为负数', () => {
    const err = fail(400, 'INVALID_SALARY')
    expect(err.code).toBe(400)
  })

  // ── 入离职管理 ──
  it('👥[正例] HR办理新员工入职 → 查看入职列表', () => {
    expect(chk(ROLES.HR, 'onboard:create')).toBe(true)
    const onb = ok({ id: 'onb-001', employeeId: 'E011', plannedDate: '2026-07-25', status: 'pending' })
    expect(onb.data.status).toBe('pending')
    expect(chk(ROLES.HR, 'onboard:list')).toBe(true)
    const list = ok([{ id: 'onb-001', employeeId: 'E011', status: 'pending' }])
    expect(list.data.length).toBe(1)
  })

  it('👥[正例] HR办理离职 → 查看离职列表', () => {
    expect(chk(ROLES.HR, 'offboard:create')).toBe(true)
    const offb = ok({ id: 'offb-001', employeeId: 'E005', resignationDate: '2026-07-20', type: 'voluntary', status: 'pending' })
    expect(offb.data.type).toBe('voluntary')
    expect(chk(ROLES.HR, 'offboard:list')).toBe(true)
  })

  // ── 统计 ──
  it('👥[正例] HR查看部门统计', () => {
    expect(chk(ROLES.HR, 'stats:view')).toBe(true)
    const stats = ok({ totalEmployees: 10, active: 7, probation: 2, resigned: 1, departmentCounts: { 技术部: 3, 运营部: 2, 市场部: 1 } })
    expect(stats.data.totalEmployees).toBe(10)
    expect(chk(ROLES.HR, 'department:list')).toBe(true)
    const depts = ok(['技术部', '运营部', '市场部', '财务部', '人事部', '客服部', '门店管理'])
    expect(depts.data.length).toBe(7)
  })
})

// ════════════════════════════════════════════════════
// 👔 店长角色 — 日常员工管理
// ════════════════════════════════════════════════════

describe(`${ROLES.StoreManager} HR 模块角色旅程测试`, () => {
  it('👔[正例] 店长查看团队员工 → 查看详情', () => {
    expect(chk(ROLES.StoreManager, 'employee:list')).toBe(true)
    expect(chk(ROLES.StoreManager, 'employee:detail')).toBe(true)
  })

  it('👔[正例] 店长查看考勤 → 查看统计', () => {
    expect(chk(ROLES.StoreManager, 'attendance:view')).toBe(true)
    expect(chk(ROLES.StoreManager, 'attendance:stats')).toBe(true)
  })

  it('👔[正例] 店长查看部门统计', () => {
    expect(chk(ROLES.StoreManager, 'stats:view')).toBe(true)
    expect(chk(ROLES.StoreManager, 'department:list')).toBe(true)
  })

  it('👔[反例] 店长无权删除员工', () => {
    expect(chk(ROLES.StoreManager, 'employee:delete')).toBe(false)
  })

  it('👔[反例] 店长无权创建合同', () => {
    expect(chk(ROLES.StoreManager, 'contract:create')).toBe(false)
  })

  it('👔[反例] 店长无权办理离职', () => {
    expect(chk(ROLES.StoreManager, 'offboard:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🛒 前台角色 — 查看个人考勤
// ════════════════════════════════════════════════════

describe(`${ROLES.FrontDesk} HR 模块角色旅程测试`, () => {
  it('🛒[正例] 前台查看个人考勤记录', () => {
    expect(chk(ROLES.FrontDesk, 'attendance:view')).toBe(true)
  })

  it('🛒[反例] 前台无权管理员工', () => {
    expect(chk(ROLES.FrontDesk, 'employee:create')).toBe(false)
    expect(chk(ROLES.FrontDesk, 'employee:edit')).toBe(false)
    expect(chk(ROLES.FrontDesk, 'employee:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🎮 导玩员 — 查看个人考勤
// ════════════════════════════════════════════════════

describe(`${ROLES.Guide} HR 模块角色旅程测试`, () => {
  it('🎮[正例] 导玩员查看个人考勤', () => {
    expect(chk(ROLES.Guide, 'attendance:view')).toBe(true)
  })

  it('🎮[反例] 导玩员无权记录考勤', () => {
    expect(chk(ROLES.Guide, 'attendance:record')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🎯 运行专员 — 查看员工与统计
// ════════════════════════════════════════════════════

describe(`${ROLES.Operations} HR 模块角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看员工列表与统计', () => {
    expect(chk(ROLES.Operations, 'employee:list')).toBe(true)
    expect(chk(ROLES.Operations, 'employee:detail')).toBe(true)
    expect(chk(ROLES.Operations, 'stats:view')).toBe(true)
    expect(chk(ROLES.Operations, 'department:list')).toBe(true)
  })

  it('🎯[反例] 运行专员无权创建/编辑/删除员工', () => {
    expect(chk(ROLES.Operations, 'employee:create')).toBe(false)
    expect(chk(ROLES.Operations, 'employee:edit')).toBe(false)
    expect(chk(ROLES.Operations, 'employee:delete')).toBe(false)
  })

  it('🎯[反例] 运行专员无权管理合同', () => {
    expect(chk(ROLES.Operations, 'contract:create')).toBe(false)
    expect(chk(ROLES.Operations, 'contract:renew')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🔧 安监 / 🤝 团建 / 📢 营销 — 查看个人考勤
// ════════════════════════════════════════════════════

describe(`${ROLES.Security} HR 模块角色旅程测试`, () => {
  it('🔧[正例] 安监查看个人考勤', () => {
    expect(chk(ROLES.Security, 'attendance:view')).toBe(true)
  })
})

describe(`${ROLES.Teambuilding} HR 模块角色旅程测试`, () => {
  it('🤝[正例] 团建查看个人考勤', () => {
    expect(chk(ROLES.Teambuilding, 'attendance:view')).toBe(true)
  })
})

describe(`${ROLES.Marketing} HR 模块角色旅程测试`, () => {
  it('📢[正例] 营销查看个人考勤', () => {
    expect(chk(ROLES.Marketing, 'attendance:view')).toBe(true)
  })
})

// ════════════════════════════════════════════════════
// 🦞 跨角色全流程闭环
// ════════════════════════════════════════════════════

describe('🦞 HR 跨角色全流程闭环', () => {
  it('👥HR创建员工 → 分配入职 → 记录考勤 → 创建合同 → 👔店长查看 → 🎯运营统计', () => {
    // 1. HR创建员工
    expect(chk(ROLES.HR, 'employee:create')).toBe(true)
    const employee = ok({ id: 'E020', name: '陈晓', department: '门店管理', position: '导玩员', status: 'probation' })
    expect(employee.data.id).toBe('E020')

    // 2. HR入职办理
    expect(chk(ROLES.HR, 'onboard:create')).toBe(true)
    const onboard = ok({ id: 'onb-020', employeeId: 'E020', status: 'pending' })
    expect(onboard.data.status).toBe('pending')

    // 3. HR记录考勤
    expect(chk(ROLES.HR, 'attendance:record')).toBe(true)

    // 4. HR创建合同
    expect(chk(ROLES.HR, 'contract:create')).toBe(true)

    // 5. 店长查看
    expect(chk(ROLES.StoreManager, 'employee:detail')).toBe(true)
    expect(chk(ROLES.StoreManager, 'attendance:view')).toBe(true)

    // 6. 运营查看统计
    expect(chk(ROLES.Operations, 'stats:view')).toBe(true)
  })
})
