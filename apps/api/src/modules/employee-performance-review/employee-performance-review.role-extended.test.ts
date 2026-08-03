import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [employee-performance-review] [C] 角色扩展测试
 *
 * 8 角色视角的员工绩效考评模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个深层场景测试
 * 使用独立 in-memory Store 避免装饰器依赖
 */
import assert from 'node:assert/strict'

// ── In-memory 模拟 Store ──
const EmployeeRole = {
  Manager: 'manager',
  Staff: 'staff',
  Trainee: 'trainee',
  Technician: 'technician',
} as const

function makeTenantContext(tenantId = 't-ext', brandId = 'b-ext', storeId = 's-001') {
  return { tenantId, brandId, storeId }
}

// ── 模拟 EmployeePerformanceReviewService ──
class MockEmployeePerformanceReviewService {
  private records = new Map<string, any>()
  private nextSeq = 1

  list(ctx: any, query?: any) {
    let items = Array.from(this.records.values())
      .filter((r) => r.tenantId === ctx.tenantId)
    if (query?.storeId) items = items.filter((r) => r.storeId === query.storeId)
    if (query?.role) items = items.filter((r) => r.role === query.role)
    if (query?.month) items = items.filter((r) => r.month === query.month)
    if (query?.sortBy === 'score') items.sort((a, b) => b.score - a.score)
    else if (query?.sortBy === 'completedTasks') items.sort((a, b) => b.completedTasks - a.completedTasks)
    else if (query?.sortBy === 'customerRating') items.sort((a, b) => b.customerRating - a.customerRating)
    else if (query?.sortBy === 'revenueContribution') items.sort((a, b) => b.revenueContribution - a.revenueContribution)
    else items.sort((a, b) => b.score - a.score)
    return { items, total: items.length }
  }

  getById(id: string, ctx: any) {
    const r = this.records.get(id)
    if (!r || r.tenantId !== ctx.tenantId) return undefined
    return r
  }

  getSummary(ctx: any) {
    const items = Array.from(this.records.values()).filter((r) => r.tenantId === ctx.tenantId)
    if (items.length === 0) {
      return { totalEmployees: 0, avgScore: 0, topPerformer: '', lowestArea: '', teamAverage: 0 }
    }
    const totalEmployees = items.length
    const avgScore = Number((items.reduce((s, r) => s + r.score, 0) / totalEmployees).toFixed(1))
    const teamAverage = Number((items.reduce((s, r) => s + r.customerRating, 0) / totalEmployees).toFixed(1))
    const topPerformerItem = items.reduce((max, curr) => (curr.score > max.score ? curr : max))
    const byRole: Record<string, { count: number; totalScore: number }> = {}
    for (const item of items) {
      if (!byRole[item.role]) byRole[item.role] = { count: 0, totalScore: 0 }
      byRole[item.role].count++
      byRole[item.role].totalScore += item.score
    }
    let lowestArea = ''
    let lowestAvg = Infinity
    for (const [role, data] of Object.entries(byRole)) {
      const avg = data.totalScore / data.count
      if (avg < lowestAvg) { lowestAvg = avg; lowestArea = role }
    }
    return { totalEmployees, avgScore, topPerformer: topPerformerItem.name, lowestArea, teamAverage }
  }

  create(ctx: any, input: any) {
    const now = new Date().toISOString()
    const id = `perf-ext-${String(this.nextSeq++).padStart(3, '0')}`
    const record = {
      id,
      tenantId: ctx.tenantId,
      employeeId: input.employeeId,
      name: input.name,
      role: input.role,
      storeId: input.storeId,
      score: input.score,
      completedTasks: input.completedTasks,
      customerRating: input.customerRating,
      attendanceRate: input.attendanceRate,
      revenueContribution: input.revenueContribution,
      month: input.month,
      createdAt: now,
    }
    this.records.set(id, record)
    return record
  }

  delete(id: string, ctx: any) {
    const r = this.records.get(id)
    if (!r || r.tenantId !== ctx.tenantId) return false
    this.records.delete(id)
    return true
  }
}

function freshService() {
  return new MockEmployeePerformanceReviewService()
}

// ════════════════════════════════════════════════
//  👔 店长扩展
// ════════════════════════════════════════════════
describe('👔店长 绩效考评扩展测试', () => {
  it('店长按门店过滤查看团队绩效（正常：聚焦本店员工）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-s1', name: '张伟', role: EmployeeRole.Staff, storeId: 'store-001', score: 88, completedTasks: 120, customerRating: 4.5, attendanceRate: 96, revenueContribution: 250000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-s2', name: '李娜', role: EmployeeRole.Staff, storeId: 'store-001', score: 92, completedTasks: 135, customerRating: 4.8, attendanceRate: 98, revenueContribution: 310000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-s3', name: '王强', role: EmployeeRole.Staff, storeId: 'store-002', score: 75, completedTasks: 90, customerRating: 4.0, attendanceRate: 92, revenueContribution: 160000, month: '2026-07' })
    const store1 = svc.list(ctx, { storeId: 'store-001' })
    assert.equal(store1.total, 2)
    const store2 = svc.list(ctx, { storeId: 'store-002' })
    assert.equal(store2.total, 1)
  })

  it('店长按评分从高到低排序查看团队（正常：识别优秀员工）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-s4', name: '赵敏', role: EmployeeRole.Staff, storeId: 'store-001', score: 85, completedTasks: 100, customerRating: 4.3, attendanceRate: 95, revenueContribution: 200000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-s5', name: '刘洋', role: EmployeeRole.Staff, storeId: 'store-001', score: 95, completedTasks: 150, customerRating: 4.9, attendanceRate: 99, revenueContribution: 400000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-s6', name: '陈雪', role: EmployeeRole.Staff, storeId: 'store-001', score: 78, completedTasks: 85, customerRating: 4.1, attendanceRate: 93, revenueContribution: 140000, month: '2026-07' })
    const sorted = svc.list(ctx, { sortBy: 'score' })
    assert.equal(sorted.items[0].name, '刘洋')
    assert.equal(sorted.items[2].name, '陈雪')
  })

  it('店长查看空门店绩效列表（边界：无员工数据）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext('t-empty-store')
    const result = svc.list(ctx)
    assert.equal(result.total, 0)
    const summary = svc.getSummary(ctx)
    assert.equal(summary.totalEmployees, 0)
  })
})

// ════════════════════════════════════════════════
//  🛒 前台扩展
// ════════════════════════════════════════════════
describe('🛒前台 绩效考评扩展测试', () => {
  it('前台查看自身历史绩效记录（正常：了解自身表现趋势）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const r = svc.create(ctx, { employeeId: 'emp-f1', name: '前台小刘', role: EmployeeRole.Staff, storeId: 'store-001', score: 82, completedTasks: 110, customerRating: 4.4, attendanceRate: 97, revenueContribution: 180000, month: '2026-07' })
    const found = svc.getById(r.id, ctx)
    assert.ok(found)
    assert.equal(found.name, '前台小刘')
    assert.equal(found.score, 82)
    assert.equal(found.completedTasks, 110)
  })

  it('前台查看不存在的绩效记录返回undefined（边界）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const result = svc.getById('nonexistent', ctx)
    assert.equal(result, undefined)
  })

  it('前台查看全部员工展示正确数量（正常：列表完整性）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-f2', name: '前台A', role: EmployeeRole.Staff, storeId: 'store-001', score: 80, completedTasks: 100, customerRating: 4.3, attendanceRate: 96, revenueContribution: 170000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-f3', name: '前台B', role: EmployeeRole.Staff, storeId: 'store-001', score: 85, completedTasks: 110, customerRating: 4.5, attendanceRate: 97, revenueContribution: 200000, month: '2026-07' })
    const list = svc.list(ctx)
    assert.equal(list.total, 2)
  })
})

// ════════════════════════════════════════════════
//  👥 HR 扩展
// ════════════════════════════════════════════════
describe('👥HR 绩效考评扩展测试', () => {
  it('HR 查看全店绩效汇总（正常：掌握整体人力状况）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-h1', name: '张经理', role: EmployeeRole.Manager, storeId: 'store-001', score: 90, completedTasks: 140, customerRating: 4.7, attendanceRate: 99, revenueContribution: 420000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-h2', name: '李技师', role: EmployeeRole.Technician, storeId: 'store-001', score: 86, completedTasks: 95, customerRating: 4.6, attendanceRate: 97, revenueContribution: 300000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-h3', name: '王实习生', role: EmployeeRole.Trainee, storeId: 'store-001', score: 70, completedTasks: 50, customerRating: 3.9, attendanceRate: 94, revenueContribution: 60000, month: '2026-07' })
    const summary = svc.getSummary(ctx)
    assert.equal(summary.totalEmployees, 3)
    assert.equal(summary.avgScore, (90 + 86 + 70) / 3)
    assert.equal(summary.topPerformer, '张经理')
    // Trainee should be lowest area
    assert.equal(summary.lowestArea, EmployeeRole.Trainee)
  })

  it('HR 按角色过滤查看各岗位绩效（正常）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-h4', name: '员工A', role: EmployeeRole.Staff, storeId: 'store-001', score: 85, completedTasks: 100, customerRating: 4.4, attendanceRate: 96, revenueContribution: 200000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-h5', name: '员工B', role: EmployeeRole.Staff, storeId: 'store-001', score: 80, completedTasks: 95, customerRating: 4.2, attendanceRate: 95, revenueContribution: 180000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-h6', name: '技师C', role: EmployeeRole.Technician, storeId: 'store-001', score: 90, completedTasks: 85, customerRating: 4.8, attendanceRate: 98, revenueContribution: 350000, month: '2026-07' })
    const staff = svc.list(ctx, { role: EmployeeRole.Staff })
    assert.equal(staff.total, 2)
    const tech = svc.list(ctx, { role: EmployeeRole.Technician })
    assert.equal(tech.total, 1)
  })

  it('HR 查看某月的绩效数据（正常：按月筛选）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-h7', name: '赵六', role: EmployeeRole.Staff, storeId: 'store-001', score: 84, completedTasks: 105, customerRating: 4.3, attendanceRate: 95, revenueContribution: 220000, month: '2026-06' })
    svc.create(ctx, { employeeId: 'emp-h7', name: '赵六', role: EmployeeRole.Staff, storeId: 'store-001', score: 86, completedTasks: 110, customerRating: 4.4, attendanceRate: 96, revenueContribution: 240000, month: '2026-07' })
    const june = svc.list(ctx, { month: '2026-06' })
    assert.equal(june.total, 1)
    const july = svc.list(ctx, { month: '2026-07' })
    assert.equal(july.total, 1)
  })
})

// ════════════════════════════════════════════════
//  🔧 安监扩展
// ════════════════════════════════════════════════
describe('🔧安监 绩效考评扩展测试', () => {
  it('安监查看自身出勤率在绩效中的体现（正常：安监岗位查看数据）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const r = svc.create(ctx, { employeeId: 'emp-sec1', name: '安监老陈', role: EmployeeRole.Technician, storeId: 'store-001', score: 88, completedTasks: 80, customerRating: 4.6, attendanceRate: 99.5, revenueContribution: 280000, month: '2026-07' })
    assert.equal(r.score, 88)
    assert.equal(r.attendanceRate, 99.5)
  })

  it('安监按收入贡献排序查看团队（正常：了解各岗位价值贡献）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-sec2', name: '员工甲', role: EmployeeRole.Staff, storeId: 'store-001', score: 82, completedTasks: 100, customerRating: 4.3, attendanceRate: 95, revenueContribution: 180000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-sec3', name: '员工乙', role: EmployeeRole.Manager, storeId: 'store-001', score: 91, completedTasks: 145, customerRating: 4.8, attendanceRate: 98, revenueContribution: 450000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-sec4', name: '员工丙', role: EmployeeRole.Staff, storeId: 'store-001', score: 76, completedTasks: 85, customerRating: 4.0, attendanceRate: 93, revenueContribution: 130000, month: '2026-07' })
    const sorted = svc.list(ctx, { sortBy: 'revenueContribution' })
    assert.equal(sorted.items[0].name, '员工乙')
    assert.equal(sorted.items[2].name, '员工丙')
  })

  it('安监跨角色查看不同角色评分比较（正常：角色间对比）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-sec5', name: '安监本人', role: EmployeeRole.Technician, storeId: 'store-001', score: 87, completedTasks: 75, customerRating: 4.7, attendanceRate: 99, revenueContribution: 290000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-sec6', name: '经理A', role: EmployeeRole.Manager, storeId: 'store-001', score: 93, completedTasks: 150, customerRating: 4.9, attendanceRate: 100, revenueContribution: 500000, month: '2026-07' })
    const techList = svc.list(ctx, { role: EmployeeRole.Technician })
    assert.equal(techList.total, 1)
    assert.equal(techList.items[0].name, '安监本人')
  })

  it('安监查看考核月份为空返回空数组（边界）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-sec7', name: '某员工', role: EmployeeRole.Staff, storeId: 'store-001', score: 80, completedTasks: 90, customerRating: 4.2, attendanceRate: 95, revenueContribution: 160000, month: '2026-07' })
    const result = svc.list(ctx, { month: '2025-01' })
    assert.equal(result.total, 0)
  })
})

// ════════════════════════════════════════════════
//  🎮 导玩员扩展
// ════════════════════════════════════════════════
describe('🎮导玩员 绩效考评扩展测试', () => {
  it('导玩员查看自己本月绩效评分（正常：了解考核结果）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const r = svc.create(ctx, { employeeId: 'emp-g1', name: '导玩员小张', role: EmployeeRole.Staff, storeId: 'store-001', score: 78, completedTasks: 95, customerRating: 4.2, attendanceRate: 96, revenueContribution: 150000, month: '2026-07' })
    assert.equal(r.score, 78)
    assert.equal(r.customerRating, 4.2)
    assert.equal(r.completedTasks, 95)
  })

  it('导玩员按完成任务数排序查看团队表现（正常：了解工作积极性）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-g2', name: '导玩甲', role: EmployeeRole.Staff, storeId: 'store-001', score: 80, completedTasks: 130, customerRating: 4.3, attendanceRate: 97, revenueContribution: 170000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-g3', name: '导玩乙', role: EmployeeRole.Staff, storeId: 'store-001', score: 72, completedTasks: 95, customerRating: 4.0, attendanceRate: 95, revenueContribution: 120000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-g4', name: '导玩丙', role: EmployeeRole.Staff, storeId: 'store-001', score: 85, completedTasks: 145, customerRating: 4.5, attendanceRate: 98, revenueContribution: 210000, month: '2026-07' })
    const sorted = svc.list(ctx, { sortBy: 'completedTasks' })
    assert.equal(sorted.items[0].name, '导玩丙')
    assert.equal(sorted.items[2].name, '导玩乙')
  })
})

// ════════════════════════════════════════════════
//  🎯 运行专员扩展
// ════════════════════════════════════════════════
describe('🎯运行专员 绩效考评扩展测试', () => {
  it('运行专员按客户评分排序发现服务之星（正常：提升服务质量）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-o1', name: '运行甲', role: EmployeeRole.Staff, storeId: 'store-001', score: 75, completedTasks: 90, customerRating: 3.8, attendanceRate: 94, revenueContribution: 140000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-o2', name: '运行乙', role: EmployeeRole.Staff, storeId: 'store-001', score: 88, completedTasks: 110, customerRating: 4.7, attendanceRate: 97, revenueContribution: 220000, month: '2026-07' })
    const sorted = svc.list(ctx, { sortBy: 'customerRating' })
    assert.equal(sorted.items[0].name, '运行乙')
    assert.equal(sorted.items[0].customerRating, 4.7)
  })

  it('运行专员添加新员工绩效记录（正常）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const r = svc.create(ctx, { employeeId: 'emp-o3', name: '新员工小马', role: EmployeeRole.Trainee, storeId: 'store-001', score: 65, completedTasks: 40, customerRating: 3.5, attendanceRate: 92, revenueContribution: 50000, month: '2026-07' })
    assert.ok(r.id)
    const list = svc.list(ctx)
    assert.equal(list.total, 1)
    const found = svc.getById(r.id, ctx)
    assert.equal(found.name, '新员工小马')
  })
})

// ════════════════════════════════════════════════
//  🤝 团建扩展
// ════════════════════════════════════════════════
describe('🤝团建 绩效考评扩展测试', () => {
  it('团建查看参与团建活动的员工绩效（正常：了解团队士气关联）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-t1', name: '团建甲', role: EmployeeRole.Staff, storeId: 'store-001', score: 82, completedTasks: 105, customerRating: 4.3, attendanceRate: 96, revenueContribution: 190000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-t2', name: '团建乙', role: EmployeeRole.Staff, storeId: 'store-001', score: 79, completedTasks: 98, customerRating: 4.1, attendanceRate: 95, revenueContribution: 170000, month: '2026-07' })
    const list = svc.list(ctx)
    assert.equal(list.total, 2)
    const totalScore = list.items.reduce((s, r) => s + r.score, 0)
    assert.equal(totalScore, 161)
  })

  it('团建删除错误录入的绩效记录（正常：数据纠错）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const r = svc.create(ctx, { employeeId: 'emp-t3', name: '误录员工', role: EmployeeRole.Staff, storeId: 'store-001', score: 50, completedTasks: 30, customerRating: 3.0, attendanceRate: 80, revenueContribution: 50000, month: '2026-06' })
    assert.ok(svc.getById(r.id, ctx))
    svc.delete(r.id, ctx)
    assert.equal(svc.getById(r.id, ctx), undefined)
  })

  it('团建按门店过滤查看团建参与员工的绩效（正常）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-t4', name: '团建员工A', role: EmployeeRole.Staff, storeId: 'store-001', score: 83, completedTasks: 105, customerRating: 4.4, attendanceRate: 97, revenueContribution: 195000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-t5', name: '团建员工B', role: EmployeeRole.Staff, storeId: 'store-001', score: 77, completedTasks: 92, customerRating: 4.0, attendanceRate: 94, revenueContribution: 155000, month: '2026-07' })
    const filtered = svc.list(ctx, { storeId: 'store-001' })
    assert.equal(filtered.total, 2)
    const noStore = svc.list(ctx, { storeId: 'store-999' })
    assert.equal(noStore.total, 0)
  })
})

// ════════════════════════════════════════════════
//  📢 营销扩展
// ════════════════════════════════════════════════
describe('📢营销 绩效考评扩展测试', () => {
  it('营销查看高收入贡献员工以合作营销活动（正常：寻找最佳合作伙伴）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-m1', name: '营销配合甲', role: EmployeeRole.Staff, storeId: 'store-001', score: 85, completedTasks: 110, customerRating: 4.4, attendanceRate: 97, revenueContribution: 280000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-m2', name: '营销配合乙', role: EmployeeRole.Staff, storeId: 'store-001', score: 90, completedTasks: 130, customerRating: 4.7, attendanceRate: 98, revenueContribution: 380000, month: '2026-07' })
    const sorted = svc.list(ctx, { sortBy: 'revenueContribution' })
    const top = sorted.items[0]
    assert.equal(top.name, '营销配合乙')
    assert.equal(top.revenueContribution, 380000)
  })

  it('营销按客户评分筛选优质服务员工（正常：配合品牌宣传活动）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { employeeId: 'emp-m3', name: '服务标兵A', role: EmployeeRole.Staff, storeId: 'store-001', score: 92, completedTasks: 120, customerRating: 4.9, attendanceRate: 99, revenueContribution: 310000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-m4', name: '服务B', role: EmployeeRole.Staff, storeId: 'store-001', score: 78, completedTasks: 100, customerRating: 4.0, attendanceRate: 94, revenueContribution: 160000, month: '2026-07' })
    const sorted = svc.list(ctx, { sortBy: 'customerRating' })
    assert.equal(sorted.items[0].name, '服务标兵A')
    assert.equal(sorted.items[0].customerRating, 4.9)
  })
})

// ════════════════════════════════════════════════
//  跨角色集成场景
// ════════════════════════════════════════════════
describe('绩效考评跨角色集成场景', () => {
  it('👔店长创建评分→👥HR查看汇总→各角色查看自己数据（完整闭环）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    // 店长创建全店绩效
    svc.create(ctx, { employeeId: 'emp-x1', name: '员工1', role: EmployeeRole.Staff, storeId: 'store-001', score: 88, completedTasks: 120, customerRating: 4.5, attendanceRate: 97, revenueContribution: 250000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-x2', name: '员工2', role: EmployeeRole.Technician, storeId: 'store-001', score: 91, completedTasks: 88, customerRating: 4.8, attendanceRate: 98, revenueContribution: 350000, month: '2026-07' })
    svc.create(ctx, { employeeId: 'emp-x3', name: '员工3', role: EmployeeRole.Trainee, storeId: 'store-001', score: 68, completedTasks: 45, customerRating: 3.8, attendanceRate: 93, revenueContribution: 70000, month: '2026-07' })
    // HR查看汇总
    const summary = svc.getSummary(ctx)
    assert.equal(summary.totalEmployees, 3)
    assert.equal(summary.topPerformer, '员工2')
    assert.equal(summary.lowestArea, EmployeeRole.Trainee)
    // 店长查看评分排序
    const scoreSorted = svc.list(ctx, { sortBy: 'score' })
    assert.equal(scoreSorted.items[0].name, '员工2')
    assert.equal(scoreSorted.items[2].name, '员工3')
    // 店长按完成任务数排序
    const taskSorted = svc.list(ctx, { sortBy: 'completedTasks' })
    assert.equal(taskSorted.items[0].name, '员工1')
  })

  it('多租户隔离确保跨租户不可见（边界）', async () => {
    const svc = freshService()
    const ctxA = makeTenantContext('t-iso-a')
    const ctxB = makeTenantContext('t-iso-b')
    svc.create(ctxA, { employeeId: 'emp-iso1', name: 'A店员工', role: EmployeeRole.Staff, storeId: 'store-a', score: 85, completedTasks: 100, customerRating: 4.3, attendanceRate: 96, revenueContribution: 200000, month: '2026-07' })
    svc.create(ctxB, { employeeId: 'emp-iso2', name: 'B店员工', role: EmployeeRole.Staff, storeId: 'store-b', score: 78, completedTasks: 90, customerRating: 4.0, attendanceRate: 94, revenueContribution: 150000, month: '2026-07' })
    assert.equal(svc.list(ctxA).total, 1)
    assert.equal(svc.list(ctxB).total, 1)
    const listA = svc.list(ctxA)
    assert.equal(listA.items[0].name, 'A店员工')
    const listB = svc.list(ctxB)
    assert.equal(listB.items[0].name, 'B店员工')
  })
})
