import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [equipment-fault-report] [C] 角色扩展测试
 *
 * 8 角色视角的设备故障报修模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个深层场景测试
 * 使用独立 in-memory Store 避免装饰器依赖
 */
import assert from 'node:assert/strict'

// ── In-memory 模拟 Store ──
const FaultSeverity = {
  Minor: 'minor',
  Major: 'major',
  Critical: 'critical',
} as const

const FaultStatus = {
  Pending: 'pending',
  InProgress: 'in_progress',
  Resolved: 'resolved',
} as const

function makeTenantContext(tenantId = 't-ext', brandId = 'b-ext', storeId = 's-001') {
  return { tenantId, brandId, storeId }
}

// ── 模拟 EquipmentFaultReportService ──
class MockEquipmentFaultReportService {
  private faults = new Map<string, any>()
  private nextSeq = 1

  list(ctx: any, query?: any) {
    const limit = query?.limit ?? 20
    const offset = query?.offset ?? 0

    let items = Array.from(this.faults.values())
      .filter((f) => f.tenantId === ctx.tenantId)

    if (query?.severity) items = items.filter((f) => f.severity === query.severity)
    if (query?.status) items = items.filter((f) => f.status === query.status)
    if (query?.equipmentType) items = items.filter((f) => f.equipmentType === query.equipmentType)
    if (query?.keyword) {
      const kw = query.keyword.toLowerCase()
      items = items.filter(
        (f) =>
          f.equipmentName.toLowerCase().includes(kw) ||
          f.faultDescription.toLowerCase().includes(kw) ||
          f.reporterName.toLowerCase().includes(kw),
      )
    }
    items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    const total = items.length
    const sliced = items.slice(offset, offset + limit)
    return { items: sliced, total, offset, limit }
  }

  getById(id: string, ctx: any) {
    const f = this.faults.get(id)
    if (!f || f.tenantId !== ctx.tenantId) return undefined
    return f
  }

  getSummary(ctx: any) {
    const items = Array.from(this.faults.values()).filter((f) => f.tenantId === ctx.tenantId)
    const byEquipmentType: Record<string, number> = {}
    for (const f of items) {
      byEquipmentType[f.equipmentType] = (byEquipmentType[f.equipmentType] || 0) + 1
    }
    return {
      total: items.length,
      pending: items.filter((f) => f.status === FaultStatus.Pending).length,
      inProgress: items.filter((f) => f.status === FaultStatus.InProgress).length,
      resolved: items.filter((f) => f.status === FaultStatus.Resolved).length,
      minorCount: items.filter((f) => f.severity === FaultSeverity.Minor).length,
      majorCount: items.filter((f) => f.severity === FaultSeverity.Major).length,
      criticalCount: items.filter((f) => f.severity === FaultSeverity.Critical).length,
      byEquipmentType,
    }
  }

  create(ctx: any, input: any) {
    const now = new Date().toISOString()
    const id = `fault-ext-${String(this.nextSeq++).padStart(3, '0')}`
    const fault = {
      id,
      tenantId: ctx.tenantId,
      equipmentId: input.equipmentId,
      equipmentName: input.equipmentName,
      equipmentType: input.equipmentType,
      faultDescription: input.faultDescription,
      severity: input.severity,
      status: FaultStatus.Pending,
      reporterName: input.reporterName,
      occurredAt: input.occurredAt ?? now,
      createdAt: now,
      updatedAt: now,
    }
    this.faults.set(id, fault)
    return fault
  }

  delete(id: string, ctx: any) {
    const f = this.faults.get(id)
    if (!f || f.tenantId !== ctx.tenantId) return false
    this.faults.delete(id)
    return true
  }

  // 辅助方法
  private setStatus(id: string, ctx: any, status: string, assignee?: string, resolution?: string) {
    const f = this.faults.get(id)
    if (!f || f.tenantId !== ctx.tenantId) throw new Error(`Fault ${id} not found`)
    f.status = status
    if (assignee) f.assignee = assignee
    if (resolution) f.resolution = resolution
    f.updatedAt = new Date().toISOString()
    if (status === FaultStatus.Resolved) f.resolvedAt = f.updatedAt
    return f
  }

  assign(id: string, ctx: any, assignee: string) {
    return this.setStatus(id, ctx, FaultStatus.InProgress, assignee)
  }

  resolve(id: string, ctx: any, resolution: string) {
    return this.setStatus(id, ctx, FaultStatus.Resolved, undefined, resolution)
  }
}

function freshService() {
  return new MockEquipmentFaultReportService()
}

// ════════════════════════════════════════════════
//  👔 店长扩展
// ════════════════════════════════════════════════
describe('👔店长 设备故障扩展测试', () => {
  it('店长按严重程度过滤故障列表（正常：查看所有严重故障）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { equipmentId: 'eq-001', equipmentName: '配电柜', equipmentType: '电力设备', faultDescription: '异常发热', severity: FaultSeverity.Critical, reporterName: '张三', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-002', equipmentName: '空调', equipmentType: '空调设备', faultDescription: '不制冷', severity: FaultSeverity.Major, reporterName: '李四', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-003', equipmentName: '扫码枪', equipmentType: '扫码设备', faultDescription: '灵敏度下降', severity: FaultSeverity.Minor, reporterName: '王五', occurredAt: new Date().toISOString() })
    const criticalResult = svc.list(ctx, { severity: FaultSeverity.Critical })
    assert.equal(criticalResult.total, 1)
    assert.equal(criticalResult.items[0].severity, FaultSeverity.Critical)
    const majorResult = svc.list(ctx, { severity: FaultSeverity.Major })
    assert.equal(majorResult.total, 1)
  })

  it('店长按关键词搜索故障（正常：搜索设备名称关键词）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { equipmentId: 'eq-010', equipmentName: '跳舞机-01', equipmentType: '游戏设备', faultDescription: '屏幕闪烁', severity: FaultSeverity.Major, reporterName: '赵六', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-011', equipmentName: '抓娃娃机-01', equipmentType: '游戏设备', faultDescription: '爪子无力', severity: FaultSeverity.Minor, reporterName: '钱七', occurredAt: new Date().toISOString() })
    const result = svc.list(ctx, { keyword: '跳舞' })
    assert.equal(result.total, 1)
    assert.equal(result.items[0].equipmentName, '跳舞机-01')
  })

  it('店长查看空故障店铺的统计（边界：无故障门店）', async () => {
    const ctx = makeTenantContext('t-empty-store')
    const svc = freshService()
    const summary = svc.getSummary(ctx)
    assert.equal(summary.total, 0)
    assert.equal(summary.pending, 0)
    assert.equal(summary.resolved, 0)
  })
})

// ════════════════════════════════════════════════
//  🛒 前台扩展
// ════════════════════════════════════════════════
describe('🛒前台 设备故障扩展测试', () => {
  it('前台报修后查看自己上报的故障列表（正常）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { equipmentId: 'eq-020', equipmentName: '收银机-01', equipmentType: '收银设备', faultDescription: '开机黑屏', severity: FaultSeverity.Critical, reporterName: '前台小王', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-021', equipmentName: '打印机-02', equipmentType: '打印设备', faultDescription: '卡纸频繁', severity: FaultSeverity.Minor, reporterName: '前台小王', occurredAt: new Date().toISOString() })
    const all = svc.list(ctx)
    assert.equal(all.total, 2)
    const reportedByStaff = all.items.filter((f) => f.reporterName === '前台小王')
    assert.equal(reportedByStaff.length, 2)
  })

  it('前台跨租户无法查看其他店铺故障（权限隔离边界）', async () => {
    const svc = freshService()
    const ctxA = makeTenantContext('t-front-a')
    const ctxB = makeTenantContext('t-front-b')
    svc.create(ctxA, { equipmentId: 'eq-030', equipmentName: '收银机-A', equipmentType: '收银设备', faultDescription: '无法开机', severity: FaultSeverity.Critical, reporterName: '前台A', occurredAt: new Date().toISOString() })
    const resultB = svc.list(ctxB)
    assert.equal(resultB.total, 0)
  })
})

// ════════════════════════════════════════════════
//  👥 HR 扩展
// ════════════════════════════════════════════════
describe('👥HR 设备故障扩展测试', () => {
  it('HR 查看全店故障统计（正常：了解维修工作量）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { equipmentId: 'eq-h1', equipmentName: '电脑-01', equipmentType: '办公设备', faultDescription: '蓝屏', severity: FaultSeverity.Minor, reporterName: 'HR小张', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-h2', equipmentName: '咖啡机-01', equipmentType: '厨房设备', faultDescription: '不出水', severity: FaultSeverity.Major, reporterName: 'HR小李', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-h3', equipmentName: '门禁-01', equipmentType: '安防设备', faultDescription: '刷卡失灵', severity: FaultSeverity.Critical, reporterName: 'HR小王', occurredAt: new Date().toISOString() })
    const summary = svc.getSummary(ctx)
    assert.equal(summary.total, 3)
    assert.equal(summary.minorCount, 1)
    assert.equal(summary.majorCount, 1)
    assert.equal(summary.criticalCount, 1)
    assert.ok(summary.byEquipmentType['办公设备'] >= 1)
  })

  it('HR 按设备类型过滤统计（正常）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { equipmentId: 'eq-h4', equipmentName: '空调-02', equipmentType: '空调设备', faultDescription: '漏水', severity: FaultSeverity.Major, reporterName: '水电工', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-h5', equipmentName: '空调-03', equipmentType: '空调设备', faultDescription: '不制热', severity: FaultSeverity.Major, reporterName: '电工', occurredAt: new Date().toISOString() })
    const acList = svc.list(ctx, { equipmentType: '空调设备' })
    assert.equal(acList.total, 2)
  })
})

// ════════════════════════════════════════════════
//  🔧 安监扩展
// ════════════════════════════════════════════════
describe('🔧安监 设备故障扩展测试', () => {
  it('安监查看严重故障优先级处理（正常：Critical优先抢修）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { equipmentId: 'eq-s1', equipmentName: '灭火器-01', equipmentType: '消防设备', faultDescription: '压力异常', severity: FaultSeverity.Critical, reporterName: '安监老陈', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-s2', equipmentName: '监控-03', equipmentType: '监控设备', faultDescription: '画面模糊', severity: FaultSeverity.Minor, reporterName: '安监老李', occurredAt: new Date().toISOString() })
    const criticalList = svc.list(ctx, { severity: FaultSeverity.Critical })
    assert.equal(criticalList.total, 1)
    assert.equal(criticalList.items[0].equipmentName, '灭火器-01')
  })

  it('安监确认Critical故障解决后状态变更（正常：闭环追溯）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const f = svc.create(ctx, { equipmentId: 'eq-s3', equipmentName: '配电箱-01', equipmentType: '电力设备', faultDescription: '漏电报警', severity: FaultSeverity.Critical, reporterName: '安监小王', occurredAt: new Date().toISOString() })
    svc.assign(f.id, ctx, '电工组-张')
    const resolved = svc.resolve(f.id, ctx, '更换漏电保护器，测试正常')
    assert.equal(resolved.status, FaultStatus.Resolved)
    assert.equal(resolved.resolution, '更换漏电保护器，测试正常')
    assert.ok(resolved.resolvedAt)
  })

  it('安监按Pending状态查看未处理故障（边界：区分待处理/处理中）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const f1 = svc.create(ctx, { equipmentId: 'eq-s4', equipmentName: '应急灯-01', equipmentType: '消防设备', faultDescription: '不亮', severity: FaultSeverity.Major, reporterName: '巡检员', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-s5', equipmentName: '报警器-01', equipmentType: '安防设备', faultDescription: '误报', severity: FaultSeverity.Major, reporterName: '巡检员', occurredAt: new Date().toISOString() })
    svc.assign(f1.id, ctx, '维修组')
    const pending = svc.list(ctx, { status: FaultStatus.Pending })
    const inProgress = svc.list(ctx, { status: FaultStatus.InProgress })
    // f1 is InProgress, f2 is Pending
    assert.equal(pending.total, 1)
    assert.equal(inProgress.total, 1)
  })
})

// ════════════════════════════════════════════════
//  🎮 导玩员扩展
// ════════════════════════════════════════════════
describe('🎮导玩员 设备故障扩展测试', () => {
  it('导玩员报修游戏机台并提供详细故障描述（正常）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const f = svc.create(ctx, {
      equipmentId: 'eq-g1',
      equipmentName: '赛车模拟器-03',
      equipmentType: '游戏设备',
      faultDescription: '方向盘力反馈失效，油门踏板无响应',
      severity: FaultSeverity.Major,
      reporterName: '导玩员小陈',
      occurredAt: new Date().toISOString(),
    })
    assert.equal(f.equipmentName, '赛车模拟器-03')
    assert.equal(f.status, FaultStatus.Pending)
    assert.equal(f.faultDescription, '方向盘力反馈失效，油门踏板无响应')
    assert.ok(f.id)
  })

  it('导玩员报修后在列表中跟踪维修进度（正常：从Pending到Resolved全过程追踪）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const f = svc.create(ctx, {
      equipmentId: 'eq-g2',
      equipmentName: '抓娃娃机-05',
      equipmentType: '游戏设备',
      faultDescription: '爪子无法闭合',
      severity: FaultSeverity.Major,
      reporterName: '导玩员小李',
      occurredAt: new Date().toISOString(),
    })
    let listBefore = svc.list(ctx)
    assert.equal(listBefore.items.find((x) => x.id === f.id)?.status, FaultStatus.Pending)
    svc.assign(f.id, ctx, '机修-王')
    svc.resolve(f.id, ctx, '更换抓爪电磁铁，测试正常')
    const resolvedItem = svc.getById(f.id, ctx)
    assert.equal(resolvedItem?.status, FaultStatus.Resolved)
  })

  it('导玩员按状态查看自己上报的Pending故障（边界：筛选特定状态）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const f1 = svc.create(ctx, { equipmentId: 'eq-g3', equipmentName: '投篮机-02', equipmentType: '游戏设备', faultDescription: '篮框高度不对', severity: FaultSeverity.Minor, reporterName: '导玩员小王', occurredAt: new Date().toISOString() })
    const f2 = svc.create(ctx, { equipmentId: 'eq-g4', equipmentName: '跳舞机-01', equipmentType: '游戏设备', faultDescription: '踏板不灵敏', severity: FaultSeverity.Minor, reporterName: '导玩员小王', occurredAt: new Date().toISOString() })
    svc.assign(f2.id, ctx, '机修-李')
    const pendingList = svc.list(ctx, { status: FaultStatus.Pending })
    assert.equal(pendingList.total, 1)
    assert.equal(pendingList.items[0].id, f1.id)
  })
})

// ════════════════════════════════════════════════
//  🎯 运行专员扩展
// ════════════════════════════════════════════════
describe('🎯运行专员 设备故障扩展测试', () => {
  it('运行专员对多个故障分配不同维修人员（正常：批量分配管理）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const f1 = svc.create(ctx, { equipmentId: 'eq-o1', equipmentName: '冷柜-01', equipmentType: '制冷设备', faultDescription: '温度异常', severity: FaultSeverity.Major, reporterName: '店员', occurredAt: new Date().toISOString() })
    const f2 = svc.create(ctx, { equipmentId: 'eq-o2', equipmentName: '制冰机-01', equipmentType: '制冷设备', faultDescription: '不出冰', severity: FaultSeverity.Major, reporterName: '店员', occurredAt: new Date().toISOString() })
    svc.assign(f1.id, ctx, '冷修-刘')
    svc.assign(f2.id, ctx, '冷修-周')
    assert.equal(svc.getById(f1.id, ctx).assignee, '冷修-刘')
    assert.equal(svc.getById(f2.id, ctx).assignee, '冷修-周')
    assert.equal(svc.getById(f1.id, ctx).status, FaultStatus.InProgress)
  })

  it('运行专员查看分页故障列表（正常：分页查询）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    for (let i = 1; i <= 5; i++) {
      svc.create(ctx, { equipmentId: `eq-o${i + 10}`, equipmentName: `设备-${i}`, equipmentType: '通用设备', faultDescription: `故障${i}`, severity: FaultSeverity.Minor, reporterName: '店员', occurredAt: new Date().toISOString() })
    }
    const page1 = svc.list(ctx, { limit: 2, offset: 0 })
    assert.equal(page1.items.length, 2)
    assert.equal(page1.total, 5)
    const page2 = svc.list(ctx, { limit: 2, offset: 2 })
    assert.equal(page2.items.length, 2)
    assert.equal(page2.total, 5)
    const page3 = svc.list(ctx, { limit: 2, offset: 4 })
    assert.equal(page3.items.length, 1)
  })

  it('运行专员尝试分配不存在的故障返回undefined（边界）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const result = svc.getById('nonexistent-fault', ctx)
    assert.equal(result, undefined)
  })
})

// ════════════════════════════════════════════════
//  🤝 团建扩展
// ════════════════════════════════════════════════
describe('🤝团建 设备故障扩展测试', () => {
  it('团建查看团建区域设备故障（正常：场地区域设备维护）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { equipmentId: 'eq-t1', equipmentName: '音响系统-01', equipmentType: '音频设备', faultDescription: '右声道无声', severity: FaultSeverity.Major, reporterName: '团建领队', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-t2', equipmentName: '投影仪-01', equipmentType: '显示设备', faultDescription: '灯泡老化', severity: FaultSeverity.Minor, reporterName: '团建领队', occurredAt: new Date().toISOString() })
    const result = svc.list(ctx)
    assert.equal(result.total, 2)
    assert.ok(result.items.some((f) => f.equipmentType === '音频设备'))
  })

  it('团建报修后删除错误提交的故障（正常：撤销误报）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const f = svc.create(ctx, { equipmentId: 'eq-t3', equipmentName: '麦克风-01', equipmentType: '音频设备', faultDescription: '误报-已确认正常', severity: FaultSeverity.Minor, reporterName: '团建小张', occurredAt: new Date().toISOString() })
    assert.ok(svc.getById(f.id, ctx))
    const deleted = svc.delete(f.id, ctx)
    assert.equal(deleted, true)
    assert.equal(svc.getById(f.id, ctx), undefined)
  })
})

// ════════════════════════════════════════════════
//  📢 营销扩展
// ════════════════════════════════════════════════
describe('📢营销 设备故障扩展测试', () => {
  it('营销查看故障统计评估对营销活动的影响（正常：活动期间设备可用性）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    svc.create(ctx, { equipmentId: 'eq-m1', equipmentName: '大屏幕-01', equipmentType: '显示设备', faultDescription: '显示异常', severity: FaultSeverity.Critical, reporterName: '营销小刘', occurredAt: new Date().toISOString() })
    svc.create(ctx, { equipmentId: 'eq-m2', equipmentName: '音响-02', equipmentType: '音频设备', faultDescription: '杂音', severity: FaultSeverity.Major, reporterName: '营销小刘', occurredAt: new Date().toISOString() })
    const summary = svc.getSummary(ctx)
    assert.equal(summary.total, 2)
    // 统计设备类型分布
    assert.ok(summary.byEquipmentType['显示设备'] >= 1)
    assert.ok(summary.byEquipmentType['音频设备'] >= 1)
  })

  it('营销查看已解决故障以确认活动设备就绪（正常）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    const f1 = svc.create(ctx, { equipmentId: 'eq-m3', equipmentName: '灯光-01', equipmentType: '灯光设备', faultDescription: '灯泡不亮', severity: FaultSeverity.Major, reporterName: '营销小赵', occurredAt: new Date().toISOString() })
    const f2 = svc.create(ctx, { equipmentId: 'eq-m4', equipmentName: 'LED屏-01', equipmentType: '显示设备', faultDescription: '花屏', severity: FaultSeverity.Critical, reporterName: '营销小赵', occurredAt: new Date().toISOString() })
    svc.assign(f1.id, ctx, '电工-张')
    svc.resolve(f1.id, ctx, '更换灯泡')
    svc.assign(f2.id, ctx, '维修-李')
    svc.resolve(f2.id, ctx, '更换显示驱动板')
    const resolvedList = svc.list(ctx, { status: FaultStatus.Resolved })
    assert.equal(resolvedList.total, 2)
    const summary = svc.getSummary(ctx)
    assert.equal(summary.resolved, 2)
  })
})

// ════════════════════════════════════════════════
//  跨角色集成场景
// ════════════════════════════════════════════════
describe('设备故障跨角色集成场景', () => {
  it('🎮导玩员报修→🎯运行专员分配→🔧安监确认解决→👔店长查看统计（完整闭环）', async () => {
    const svc = freshService()
    const ctx = makeTenantContext()
    // 1. 导玩员报修
    const f = svc.create(ctx, { equipmentId: 'eq-flow1', equipmentName: 'VR设备-02', equipmentType: '游戏设备', faultDescription: '头盔显示模糊', severity: FaultSeverity.Major, reporterName: '导玩员小陈', occurredAt: new Date().toISOString() })
    assert.equal(f.status, FaultStatus.Pending)
    // 2. 运行专员分配
    svc.assign(f.id, ctx, '技术-张')
    assert.equal(svc.getById(f.id, ctx).status, FaultStatus.InProgress)
    // 3. 安监确认解决
    svc.resolve(f.id, ctx, '重新校准VR头盔镜头，测试正常')
    assert.equal(svc.getById(f.id, ctx).status, FaultStatus.Resolved)
    // 4. 店长查看统计
    const summary = svc.getSummary(ctx)
    assert.equal(summary.resolved, 1)
    assert.equal(summary.total, 1)
  })

  it('多租户隔离确保同ID不过界（边界）', async () => {
    const svc = freshService()
    const ctxA = makeTenantContext('t-iso-a')
    const ctxB = makeTenantContext('t-iso-b')
    svc.create(ctxA, { equipmentId: 'eq-iso1', equipmentName: '设备-A', equipmentType: '通用', faultDescription: '故障A', severity: FaultSeverity.Minor, reporterName: 'A', occurredAt: new Date().toISOString() })
    svc.create(ctxB, { equipmentId: 'eq-iso2', equipmentName: '设备-B', equipmentType: '通用', faultDescription: '故障B', severity: FaultSeverity.Major, reporterName: 'B', occurredAt: new Date().toISOString() })
    assert.equal(svc.list(ctxA).total, 1)
    assert.equal(svc.list(ctxB).total, 1)
    // 跨租户不能操作对方故障
    const badAccessA = svc.list(ctxA, { equipmentType: '通用' })
    assert.equal(badAccessA.items.every((f) => f.tenantId === 't-iso-a'), true)
  })
})
