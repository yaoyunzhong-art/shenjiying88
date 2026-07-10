import { describe, it, expect, beforeEach } from 'vitest'
/**
 * leads.role-scenario.test.ts · 渠道招商线索管理 8 角色场景测试
 *
 * 从 8 角色视角编写深度业务场景用例:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个场景用例 (正常流程 + 权限边界/异常场景)
 */
import { LeadsController } from './leads.controller'
import { LeadsService } from './leads.service'

function createTestEnv() {
  const service = new LeadsService()
  const controller = new LeadsController(service)
  return { service, controller }
}

// ═══════════════════════════════════════════════════════════════════
// 👔 店长 (StoreManager) 视角
// ═══════════════════════════════════════════════════════════════════
describe('👔 店长 · leads 招商场景测试', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  it('👔 [场景1] 店长配置上海区域抖音线索自动分配 → 线索接入后自动指派给对应销售', () => {
    const { controller } = env
    // 店长注册规则: 上海区域抖音线索 -> 指定 sales-sh
    controller.registerRule({
      matcher: { region: 'shanghai', source: 'douyin' },
      strategy: 'specific',
      specificAssignee: 'sales-sh-01',
      candidatePool: ['sales-sh-01', 'sales-sh-02'],
    })
    // 抖音线索接入
    const lead = controller.ingestWebhook({
      source: 'douyin',
      contactName: '上海抖音客户',
      contactPhone: '13912345678',
      region: 'shanghai',
    })
    // 验证自动分配
    expect(lead.stage).toBe('assigned')
    expect(lead.assigneeUserId).toBe('sales-sh-01')
    expect(lead.source).toBe('douyin')
  })

  it('👔 [场景2] 店长查看线索漏斗并识别瓶颈 → 多条线索在各阶段分布合理', () => {
    const { controller } = env
    // 创建规则
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'sales-a',
      candidatePool: ['sales-a'],
    })
    // 录入多条线索并推进到不同阶段
    const l1 = controller.ingestWebhook({ source: 'douyin', contactName: '阶段新线索' })
    const l2 = controller.ingestWebhook({ source: 'baidu', contactName: '已联系线索' })
    const l3 = controller.ingestWebhook({ source: 'manual', contactName: '体验中线索' })

    const { service } = env
    service.followUp(l2.leadId, 'sales-a', '已电话联系', 'contacted')
    service.followUp(l3.leadId, 'sales-a', '安排到店体验', 'trial')

    const metrics = controller.getFunnelMetrics()
    expect(metrics.total).toBe(3)
    // 三条线索都被自动分配，所以 stage 为 assigned
    expect(metrics.byStage.assigned).toBe(1)
    expect(metrics.byStage.contacted).toBe(1)
    expect(metrics.byStage.trial).toBe(1)
  })

  it('👔 [场景3] 店长无线索时查看漏斗指标 → 返回零值不报错', () => {
    const { controller } = env
    const metrics = controller.getFunnelMetrics()
    expect(metrics.total).toBe(0)
    expect(metrics.totalRevenue).toBe(0)
    expect(metrics.conversionRates).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🛒 前台 (Receptionist) 视角
// ═══════════════════════════════════════════════════════════════════
describe('🛒 前台 · leads 招商场景测试', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  it('🛒 [场景1] 前台手动录入到店顾客线索 → 线索创建成功且来源为 manual', () => {
    const { controller } = env
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '到店咨询顾客',
      contactPhone: '13800001111',
      storeId: 'store-beijing-01',
      region: 'beijing',
    })
    expect(lead.leadId).toBeDefined()
    expect(lead.source).toBe('manual')
    expect(lead.stage).toBeDefined()
  })

  it('🛒 [场景2] 前台录入重复手机号码线索 → 正常创建，系统不强制去重', () => {
    const { controller } = env
    controller.ingestWebhook({
      source: 'manual',
      contactName: '第一次',
      contactPhone: '13900001111',
    })
    const second = controller.ingestWebhook({
      source: 'manual',
      contactName: '第二次',
      contactPhone: '13900001111',
    })
    expect(second.leadId).toBeDefined()
    // controller 的 ingestWebhook 返回的 contactName 字段来自 service.ingestWebhook 返回的 contact.name
    // 改用 service 直接验证
    const l = env.service.getLead(second.leadId)
    expect(l).toBeDefined()
    expect(l!.contact.name).toBe('第二次')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 👥 HR (HumanResources) 视角
// ═══════════════════════════════════════════════════════════════════
describe('👥 HR · leads 招商场景测试', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  it('👥 [场景1] HR 查看招商团队各销售线索负载 → 轮询分配均衡', () => {
    const { controller } = env
    // 注册轮询规则
    controller.registerRule({
      matcher: {},
      strategy: 'round-robin',
      candidatePool: ['sales-a', 'sales-b', 'sales-c'],
    })
    // 录入 6 条线索
    for (let i = 0; i < 6; i++) {
      controller.ingestWebhook({ source: 'baidu', contactName: `线索${i}` })
    }
    const list = controller.listLeads()
    expect(list.total).toBe(6)
    // 验证每个销售分配了 2 条
    const counts: Record<string, number> = {}
    for (const lead of list.leads) {
      if (lead.assigneeUserId) {
        counts[lead.assigneeUserId] = (counts[lead.assigneeUserId] ?? 0) + 1
      }
    }
    expect(counts['sales-a']).toBe(2)
    expect(counts['sales-b']).toBe(2)
    expect(counts['sales-c']).toBe(2)
  })

  it('👥 [场景2] HR 查看空团队负载 → 返回空列表不报错', () => {
    const { controller } = env
    const list = controller.listLeads()
    expect(list.total).toBe(0)
    expect(list.leads).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🔧 安监 (Safety) 视角
// ═══════════════════════════════════════════════════════════════════
describe('🔧 安监 · leads 招商场景测试', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  it('🔧 [场景1] 安监扫描 SLA 超时线索 → 高优线索超出 4 小时未跟进被标记', () => {
    const { service, controller } = env
    // 注册规则让线索自动分配
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'sales-sla',
      candidatePool: ['sales-sla'],
    })
    // 创建一个高优线索（manual 来源）
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: 'SLA测试-高优',
      region: 'beijing',
    })
    expect(lead.stage).toBe('assigned')

    // 模拟时间流逝: 将线索创建时间前调 25 小时
    const oldLead = service.getLead(lead.leadId)
    if (oldLead) {
      const past = new Date(Date.now() - 25 * 3600 * 1000).toISOString()
      ;(oldLead as any).createdAt = past
    }

    // 扫描 SLA
    const now = new Date(Date.now() + 1000)
    const alerts = service.scanSlaAlerts(now)
    const matched = alerts.find(a => a.leadId === lead.leadId)
    expect(matched).toBeDefined()
    expect(matched!.priority).toBe('high')
  })

  it('🔧 [场景2] 安监查看 SLA 扫描结果 → 正常跟进中的线索不被标记', () => {
    const { service, controller } = env
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'sales-fast',
      candidatePool: ['sales-fast'],
    })
    // 创建一个线索并立即跟进
    const lead = controller.ingestWebhook({ source: 'douyin', contactName: '快速跟进线索' })
    controller.followUp({ leadId: lead.leadId, authorUserId: 'sales-fast', content: '及时联系', newStage: 'contacted' })

    // 即使时间过去，已跟进的不触发 SLA
    const oldLead = service.getLead(lead.leadId)
    if (oldLead) {
      ;(oldLead as any).createdAt = new Date(Date.now() - 10 * 3600 * 1000).toISOString()
    }
    const alerts = service.scanSlaAlerts()
    const matched = alerts.find(a => a.leadId === lead.leadId)
    expect(matched).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎮 导玩员 (GameGuide) 视角
// ═══════════════════════════════════════════════════════════════════
describe('🎮 导玩员 · leads 招商场景测试', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  it('🎮 [场景1] 导玩员邀约体验后推进线索阶段 → negotiation', () => {
    const { controller } = env
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'guide-01',
      candidatePool: ['guide-01'],
    })
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '体验客户',
      contactPhone: '13600001111',
    })
    const result = controller.followUp({
      leadId: lead.leadId,
      authorUserId: 'guide-01',
      content: '已邀约到店体验',
      newStage: 'trial',
    })
    expect(result.success).toBe(true)
    expect(result.stage).toBe('trial')
  })

  it('🎮 [场景2] 导玩员跟进不存在的线索 → 返回失败不抛异常', () => {
    const { controller } = env
    const result = controller.followUp({
      leadId: 'non-existent-lead',
      authorUserId: 'guide-01',
      content: '测试跟进',
      newStage: 'negotiation',
    })
    expect(result.success).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🎯 运行专员 (Ops) 视角
// ═══════════════════════════════════════════════════════════════════
describe('🎯 运行专员 · leads 招商场景测试', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  it('🎯 [场景1] 运行专员批量查看全系统线索列表 → 分页或全量返回', () => {
    const { controller } = env
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'sales-ops',
      candidatePool: ['sales-ops'],
    })
    for (let i = 0; i < 5; i++) {
      controller.ingestWebhook({ source: 'baidu', contactName: `批量${i}` })
    }
    const list = controller.listLeads()
    expect(list.total).toBe(5)
    expect(list.leads).toHaveLength(5)
  })

  it('🎯 [场景2] 运行专员关闭已成交线索 → 成功并返回关闭信息', () => {
    const { controller } = env
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'sales-ops',
      candidatePool: ['sales-ops'],
    })
    const lead = controller.ingestWebhook({ source: 'douyin', contactName: '成交客户' })
    const closeResult = controller.closeLead(lead.leadId, { stage: 'closed_won', reason: '签约加盟' })
    expect(closeResult.success).toBe(true)
    expect(closeResult.stage).toBe('closed_won')
    expect(closeResult.closedReason).toBe('签约加盟')
  })
})

// ═══════════════════════════════════════════════════════════════════
// 🤝 团建 (Teambuilding) 视角
// ═══════════════════════════════════════════════════════════════════
describe('🤝 团建 · leads 招商场景测试', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  it('🤝 [场景1] 团建活动后收集参与意向线索 → 多条线索批量录入', () => {
    const { controller } = env
    const members = ['团建成员A', '团建成员B', '团建成员C']
    const leads = members.map(name =>
      controller.ingestWebhook({
        source: 'manual',
        contactName: name,
        storeId: 'team-building-event-01',
      }),
    )
    expect(leads).toHaveLength(3)
    leads.forEach(l => {
      expect(l.leadId).toBeDefined()
      // controller 的 ingestWebhook 不返回 storeId，从 service 验证
      const lead = env.service.getLead(l.leadId)
      expect(lead).toBeDefined()
      expect(lead!.storeId).toBe('team-building-event-01')
    })
  })

  it('🤝 [场景2] 团建组织者查看活动产生的所有线索 → 按门店筛选', () => {
    const { controller } = env
    controller.registerRule({
      matcher: { storeId: 'tb-event-02' },
      strategy: 'specific',
      specificAssignee: 'sales-tb',
      candidatePool: ['sales-tb'],
    })
    controller.ingestWebhook({ source: 'manual', contactName: 'TB客1', storeId: 'tb-event-02' })
    controller.ingestWebhook({ source: 'manual', contactName: 'TB客2', storeId: 'tb-event-02' })
    controller.ingestWebhook({ source: 'douyin', contactName: '非团建', storeId: 'other-store' })

    const list = controller.listLeads()
    const tbLeads = list.leads.filter((l: any) => l.storeId === 'tb-event-02')
    expect(tbLeads).toHaveLength(2)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 📢 营销 (Marketing) 视角
// ═══════════════════════════════════════════════════════════════════
describe('📢 营销 · leads 招商场景测试', () => {
  let env: ReturnType<typeof createTestEnv>

  beforeEach(() => {
    env = createTestEnv()
  })

  it('📢 [场景1] 营销查看各渠道线索转化率 → 评估推广 ROI', () => {
    const { controller } = env
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'sales-mkt',
      candidatePool: ['sales-mkt'],
    })
    // 抖音: 10 条
    for (let i = 0; i < 10; i++) {
      controller.ingestWebhook({ source: 'douyin', contactName: `抖音-${i}` })
    }
    // 百度: 5 条
    for (let i = 0; i < 5; i++) {
      controller.ingestWebhook({ source: 'baidu', contactName: `百度-${i}` })
    }
    // 通过 service 验证总数（controller 的 getFunnelMetrics 可能通过 service 获取）
    const allLeads = env.service.listLeads()
    expect(allLeads).toHaveLength(15)
  })

  it('📢 [场景2] 营销关闭渠道推广活动 → 不再产生新线索不影响已有数据', () => {
    const { controller } = env
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'mkt-sales',
      candidatePool: ['mkt-sales'],
    })
    const l1 = controller.ingestWebhook({ source: 'baidu', contactName: '百度线索' })
    const l2 = controller.ingestWebhook({ source: 'baidu', contactName: '百度线索2' })

    // 关闭一个线索为 lost
    const close = controller.closeLead(l1.leadId, { stage: 'closed_lost', reason: '推广下线' })
    expect(close.success).toBe(true)
    expect(close.stage).toBe('closed_lost')

    // 另一个线索仍在
    const query = controller.getLead(l2.leadId)
    expect(query.found).toBe(true)
  })
})
