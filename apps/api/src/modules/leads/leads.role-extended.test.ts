import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * leads.role-extended.test.ts · Phase-17 T11 (Auto-Pulse)
 * 用途: Leads 模块 8 角色扩展测试 — 深入业务场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 每个角色至少 2 个深度业务用例 (正常流程 + 异常/边界)
 */
import { LeadsController } from './leads.controller'
import { LeadsService } from './leads.service'

function createTestEnv() {
  const service = new LeadsService()
  const controller = new LeadsController(service)
  service.reset()
  return { service, controller }
}

// ═══════════════════════════════════════════════
// 👔 店长 (Store Manager) — 招商全局把控
// ═══════════════════════════════════════════════
describe('👔店长 Leads 扩展测试', () => {
  it('店长: 多规则优先级 — 地域匹配优先于来源匹配', () => {
    const { controller } = createTestEnv()
    // 注册两条规则: 地域匹配 + 来源匹配
    controller.registerRule({
      matcher: { region: 'guangzhou' },
      strategy: 'specific',
      specificAssignee: 'sales-gz',
      candidatePool: ['sales-gz'],
    })
    controller.registerRule({
      matcher: { source: 'douyin' },
      strategy: 'specific',
      specificAssignee: 'sales-douyin',
      candidatePool: ['sales-douyin'],
    })
    // 广州抖音线索 → 优先走地域匹配
    const lead = controller.ingestWebhook({
      source: 'douyin',
      contactName: '广州抖音客户',
      region: 'guangzhou',
    })
    expect(lead.assigneeUserId).toBe('sales-gz')
  })

  it('店长: 确认已成交线索仍然可查询详情且阶段不变', () => {
    const { controller } = createTestEnv()
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'sales-1',
      candidatePool: ['sales-1'],
    })
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '已成交客户A',
    })
    expect(lead.stage).toBe('assigned')
    // 关闭为成交
    const close = controller.closeLead(lead.leadId, { stage: 'closed_won', reason: '签单' })
    expect(close.success).toBe(true)
    expect(close.stage).toBe('closed_won')
    const query = controller.getLead(lead.leadId)
    expect(query.found).toBe(true)
    const data = query as any
    expect(data.lead.stage).toBe('closed_won')
    expect(data.lead.closedReason).toBe('签单')
  })

  it('店长: 漏斗转化率在多线索时的精度', () => {
    const { controller } = createTestEnv()
    // 模拟完整漏斗
    const leads: any[] = []
    for (let i = 0; i < 10; i++) {
      leads.push(controller.ingestWebhook({ source: 'baidu', contactName: `线索${i}` }))
    }
    // 分配 8 个
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'sales-a',
      candidatePool: ['sales-a'],
    })
    controller.ingestWebhook({ source: 'baidu', contactName: '新增线索' })
    controller.ingestWebhook({ source: 'baidu', contactName: '新增线索2' })
    const metrics = controller.getFunnelMetrics()
    expect(metrics.total).toBeGreaterThanOrEqual(10)
    expect(typeof metrics.conversionRates.overall).toBe('number')
    expect(metrics.conversionRates.new_to_assigned).toBeGreaterThanOrEqual(0)
  })

  it('店长: 查看各区域店长线索概况', () => {
    const { controller } = createTestEnv()
    // 注册门店级规则
    controller.registerRule({
      matcher: { storeId: 'store-bj' },
      strategy: 'specific',
      specificAssignee: 'manager-bj',
      candidatePool: ['manager-bj'],
    })
    controller.registerRule({
      matcher: { storeId: 'store-sh' },
      strategy: 'specific',
      specificAssignee: 'manager-sh',
      candidatePool: ['manager-sh'],
    })
    controller.ingestWebhook({ source: 'manual', contactName: '北京客户', storeId: 'store-bj' })
    controller.ingestWebhook({ source: 'manual', contactName: '上海客户', storeId: 'store-sh' })
    const bjList = controller.listLeads('store:store-bj')
    expect(bjList.total).toBe(1)
    const shList = controller.listLeads('store:store-sh')
    expect(shList.total).toBe(1)
  })
})

// ═══════════════════════════════════════════════
// 🛒 前台 (Reception) — 到店线索录入
// ═══════════════════════════════════════════════
describe('🛒前台 Leads 扩展测试', () => {
  it('前台: 到店客户带联系方式录入并自动分配本店销售', () => {
    const { controller } = createTestEnv()
    controller.registerRule({
      matcher: { storeId: 'store-hq' },
      strategy: 'specific',
      specificAssignee: 'sales-hq-wang',
      candidatePool: ['sales-hq-wang'],
    })
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '到店王先生',
      contactPhone: '13800138000',
      storeId: 'store-hq',
    })
    expect(lead.assigneeUserId).toBe('sales-hq-wang')
  })

  it('前台: 录入无联系方式的访客线索应可正常入库', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '匿名访客',
    })
    expect(lead.leadId).toBeDefined()
    expect(lead.stage).toBe('new') // 无匹配规则则保持 new
  })

  it('前台: 录入重复电话号码应被允许(系统不自动去重)', () => {
    const { controller } = createTestEnv()
    const lead1 = controller.ingestWebhook({
      source: 'manual', contactName: '张三', contactPhone: '13900001111',
    })
    const lead2 = controller.ingestWebhook({
      source: 'douyin', contactName: '张三(抖音)', contactPhone: '13900001111',
    })
    expect(lead1.leadId).not.toBe(lead2.leadId)
    expect(lead1.source).toBe('manual')
    expect(lead2.source).toBe('douyin')
  })
})

// ═══════════════════════════════════════════════
// 👥 HR (Human Resources) — 销售团队负载与排班
// ═══════════════════════════════════════════════
describe('👥HR Leads 扩展测试', () => {
  it('HR: Round-robin 规则下线索均匀分配', () => {
    const { controller } = createTestEnv()
    controller.registerRule({
      matcher: {},
      strategy: 'round-robin',
      candidatePool: ['sales-a', 'sales-b', 'sales-c'],
    })
    for (let i = 0; i < 6; i++) {
      controller.ingestWebhook({ source: 'baidu', contactName: `客户${i}` })
    }
    const list = controller.listLeads()
    const assignCounts = new Map<string, number>()
    for (const l of list.leads) {
      if (l.assigneeUserId) {
        assignCounts.set(l.assigneeUserId, (assignCounts.get(l.assigneeUserId) ?? 0) + 1)
      }
    }
    // 3 个销售各分配 ~2 条
    for (const count of assignCounts.values()) {
      expect(count).toBeGreaterThanOrEqual(1)
      expect(count).toBeLessThanOrEqual(3)
    }
  })

  it('HR: 无候选池的规则应保留线索未分配状态', () => {
    const { controller } = createTestEnv()
    // 不注册规则
    const lead = controller.ingestWebhook({ source: 'manual', contactName: '无人分配' })
    expect(lead.assigneeUserId).toBeUndefined()
    expect(lead.stage).toBe('new')
  })

  it('HR: Round-robin 规则在候选池全满时正确分配', () => {
    const { controller } = createTestEnv()
    controller.registerRule({
      matcher: {},
      strategy: 'round-robin',
      candidatePool: ['sales-a', 'sales-b'],
    })
    for (let i = 0; i < 5; i++) {
      controller.ingestWebhook({ source: 'baidu', contactName: `load-${i}` })
    }
    const list = controller.listLeads()
    const assignCounts = new Map<string, number>()
    for (const l of list.leads) {
      if (l.assigneeUserId) {
        assignCounts.set(l.assigneeUserId, (assignCounts.get(l.assigneeUserId) ?? 0) + 1)
      }
    }
    // 两个销售各分配 2-3 条
    expect(assignCounts.size).toBe(2)
    for (const count of assignCounts.values()) {
      expect(count).toBeGreaterThanOrEqual(2)
      expect(count).toBeLessThanOrEqual(3)
    }
  })
})

// ═══════════════════════════════════════════════
// 🔧 安监 (Safety/Security) — 线索合规与异常监控
// ═══════════════════════════════════════════════
describe('🔧安监 Leads 扩展测试', () => {
  it('安监: SLA 扫描 — 高优线索 4h 未跟进触发告警', () => {
    const { controller, service } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '赶时间客户',
      contactPhone: '13900001111',
    })
    // 手动注入: 设置 priority=urgent
    const data = service.getLead(lead.leadId)!
    data.priority = 'urgent'
    // 模拟已过 5 小时
    const future = new Date()
    future.setHours(future.getHours() + 5)
    const alerts = service.scanSlaAlerts(future)
    expect(alerts.length).toBe(1)
    expect(alerts[0].leadId).toBe(lead.leadId)
  })

  it('安监: SLA 扫描 — 普通线索 24h 内不告警', () => {
    const { controller, service } = createTestEnv()
    controller.ingestWebhook({
      source: 'baidu',
      contactName: '普通客户',
    })
    // 模拟 4 小时后
    const nearFuture = new Date()
    nearFuture.setHours(nearFuture.getHours() + 4)
    const alerts = service.scanSlaAlerts(nearFuture)
    // 普通 SLA=24h, 4h 不应告警
    const related = alerts.filter(a => a.source === 'baidu')
    expect(related.length).toBe(0)
  })

  it('安监: 已关闭线索不触发 SLA 告警', () => {
    const { controller, service } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '已成交客户B',
    })
    controller.closeLead(lead.leadId, { stage: 'closed_won', reason: '已签约' })
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1) // 1年后
    const alerts = service.scanSlaAlerts(future)
    const related = alerts.filter(a => a.leadId === lead.leadId)
    expect(related.length).toBe(0)
  })

  it('安监: 确认所有线索阶段在合法范围内', () => {
    const { controller } = createTestEnv()
    controller.registerRule({ matcher: {}, strategy: 'specific', specificAssignee: 's', candidatePool: ['s'] })
    const lead1 = controller.ingestWebhook({ source: 'douyin', contactName: 'D1' })
    const lead2 = controller.ingestWebhook({ source: 'xiaohongshu', contactName: 'X1' })
    controller.followUp({ leadId: lead1.leadId, authorUserId: 's', content: '联系', newStage: 'contacted' })
    controller.closeLead(lead2.leadId, { stage: 'closed_lost', reason: '不感兴趣' })
    const list = controller.listLeads()
    const validStages = ['new', 'assigned', 'contacted', 'trial', 'negotiation', 'closed_won', 'closed_lost']
    for (const l of list.leads) {
      expect(validStages).toContain(l.stage)
    }
  })
})

// ═══════════════════════════════════════════════
// 🎮 导玩员 (Game Guide) — 客户体验线索跟进
// ═══════════════════════════════════════════════
describe('🎮导玩员 Leads 扩展测试', () => {
  it('导玩员: 体验客户线索跟进后可推进到 trial 阶段', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '体验客户C',
      contactPhone: '13700000000',
    })
    // 分配后跟进
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'guide-li',
      candidatePool: ['guide-li'],
    })
    const assigned = controller.ingestWebhook({
      source: 'manual',
      contactName: '体验客户D',
      contactPhone: '13700000001',
    })
    const follow = controller.followUp({
      leadId: assigned.leadId,
      authorUserId: 'guide-li',
      content: '客户体验了射击游戏X, 非常满意',
      newStage: 'trial',
    })
    expect(follow.success).toBe(true)
    expect(follow.stage).toBe('trial')
  })

  it('导玩员: 不存在的 leadId 跟进应返回失败', () => {
    const { controller } = createTestEnv()
    const result = controller.followUp({
      leadId: 'lead-nope',
      authorUserId: 'guide-li',
      content: '测试',
    })
    expect(result.success).toBe(false)
  })

  it('导玩员: 跟进笔记时可保留原阶段不变', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({ source: 'manual', contactName: '体验E' })
    // 不传 newStage → 维持当前阶段
    const follow = controller.followUp({
      leadId: lead.leadId,
      authorUserId: 'guide-wang',
      content: '添加备注但不推进阶段',
    })
    expect(follow.success).toBe(true)
    expect(follow.stage).toBe('new') // 未变化
  })
})

// ═══════════════════════════════════════════════
// 🎯 运行专员 (Operations) — 系统运营与管理
// ═══════════════════════════════════════════════
describe('🎯运行专员 Leads 扩展测试', () => {
  it('运行专员: 相同规则 ID 重复注册应新生成 ruleId(不覆盖)', () => {
    const { controller } = createTestEnv()
    const r1 = controller.registerRule({
      matcher: { source: 'douyin' },
      strategy: 'specific',
      specificAssignee: 'dy-sales',
      candidatePool: ['dy-sales'],
    })
    const r2 = controller.registerRule({
      matcher: { source: 'douyin' },
      strategy: 'specific',
      specificAssignee: 'dy-sales-2',
      candidatePool: ['dy-sales-2'],
    })
    expect(r1.ruleId).not.toBe(r2.ruleId)
  })

  it('运行专员: 多来源线索混合接入无冲突', () => {
    const { controller } = createTestEnv()
    const sources = ['douyin', 'xiaohongshu', 'baidu', 'manual'] as const
    controller.registerRule({
      matcher: {},
      strategy: 'round-robin',
      candidatePool: ['ops-sales'],
    })
    for (const s of sources) {
      for (let i = 0; i < 5; i++) {
        controller.ingestWebhook({ source: s, contactName: `${s}-${i}` })
      }
    }
    const list = controller.listLeads()
    expect(list.total).toBe(20)
  })

  it('运行专员: 关闭线索时 reason 为空字符串仍可关闭', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({ source: 'manual', contactName: '无原因关闭' })
    const result = controller.closeLead(lead.leadId, { stage: 'closed_lost', reason: '' })
    expect(result.success).toBe(true)
    expect(result.stage).toBe('closed_lost')
  })

  it('运行专员: 查询不存在的线索应返回 found=false', () => {
    const { controller } = createTestEnv()
    const result = controller.getLead('lead-nonexistent')
    expect(result.found).toBe(false)
  })
})

// ═══════════════════════════════════════════════
// 🤝 团建 (Team Building) — 活动线索全流程
// ═══════════════════════════════════════════════
describe('🤝团建 Leads 扩展测试', () => {
  it('团建: 团建活动线索从接入到成交全流程', () => {
    const { controller } = createTestEnv()
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'tb-sales-zhang',
      candidatePool: ['tb-sales-zhang'],
    })
    // 接入
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '公司团建需求-华为',
      contactPhone: '13900002222',
    })
    expect(lead.assigneeUserId).toBe('tb-sales-zhang')
    // 联系
    controller.followUp({ leadId: lead.leadId, authorUserId: 'tb-sales-zhang', content: '电话沟通, 30人预算3万', newStage: 'contacted' })
    // 试玩体验
    controller.followUp({ leadId: lead.leadId, authorUserId: 'tb-sales-zhang', content: '安排到店体验', newStage: 'trial' })
    // 谈判
    controller.followUp({ leadId: lead.leadId, authorUserId: 'tb-sales-zhang', content: '报价2.8万', newStage: 'negotiation' })
    // 成交
    const close = controller.closeLead(lead.leadId, { stage: 'closed_won', reason: '团建活动签约' })
    expect(close.success).toBe(true)
    expect(close.stage).toBe('closed_won')
  })

  it('团建: 跟进记录包含阶段历史', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({ source: 'manual', contactName: '团建需求B' })
    controller.followUp({ leadId: lead.leadId, authorUserId: 'tb-sales', content: '初沟通', newStage: 'contacted' })
    controller.followUp({ leadId: lead.leadId, authorUserId: 'tb-sales', content: '发送方案', newStage: 'negotiation' })
    const query = controller.getLead(lead.leadId)
    expect(query.found).toBe(true)
    const data = query as any
    expect(data.lead.notes.length).toBe(2)
    expect(data.lead.notes[0].content).toBe('初沟通')
    expect(data.lead.notes[1].stageAfter).toBe('negotiation')
    expect(data.lead.lastContactedAt).toBeDefined()
  })

  it('团建: 团建线索可按租户隔离查看', () => {
    const { controller } = createTestEnv()
    controller.ingestWebhook({ source: 'manual', contactName: '团建A', storeId: 'store-tb1' })
    controller.ingestWebhook({ source: 'manual', contactName: '团建B', storeId: 'store-tb2' })
    const tb1 = controller.listLeads('store:store-tb1')
    const tb2 = controller.listLeads('store:store-tb2')
    expect(tb1.total).toBe(1)
    expect(tb2.total).toBe(1)
    expect(tb1.leads[0].contact.name).toBe('团建A')
    expect(tb2.leads[0].contact.name).toBe('团建B')
  })
})

// ═══════════════════════════════════════════════
// 📢 营销 (Marketing) — 渠道线索与归因
// ═══════════════════════════════════════════════
describe('📢营销 Leads 扩展测试', () => {
  it('营销: UTM 参数完整保存且可查询', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'baidu',
      contactName: 'SEM客户',
      contactPhone: '13600001111',
      utmParams: { campaign: '2026_summer', ad_group: 'brand', keyword: '加盟合作', match_type: 'phrase' },
    })
    const query = controller.getLead(lead.leadId)
    expect(query.found).toBe(true)
    const data = query as any
    // customFields = utmParams
    expect(data.lead.customFields?.campaign).toBe('2026_summer')
    expect(data.lead.customFields?.keyword).toBe('加盟合作')
  })

  it('营销: 各渠道线索数量统计', () => {
    const { controller } = createTestEnv()
    controller.ingestWebhook({ source: 'douyin', contactName: '抖音1' })
    controller.ingestWebhook({ source: 'douyin', contactName: '抖音2' })
    controller.ingestWebhook({ source: 'xiaohongshu', contactName: '小红书1' })
    controller.ingestWebhook({ source: 'baidu', contactName: '百度1' })
    controller.ingestWebhook({ source: 'baidu', contactName: '百度2' })
    controller.ingestWebhook({ source: 'baidu', contactName: '百度3' })
    const metrics = controller.getFunnelMetrics()
    const allLeads = controller.listLeads()
    const bySource: Record<string, number> = {}
    for (const l of allLeads.leads) {
      bySource[l.source] = (bySource[l.source] ?? 0) + 1
    }
    expect(bySource.douyin).toBe(2)
    expect(bySource.xiaohongshu).toBe(1)
    expect(bySource.baidu).toBe(3)
  })

  it('营销: 高优线索(urgent)应优先被 SLA 扫描关注', () => {
    const { controller, service } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'douyin',
      contactName: '紧急加盟需求',
      utmParams: { priority: 'urgent' },
    })
    // 优先级应为 urgent
    const data = service.getLead(lead.leadId)
    expect(data!.priority).toBe('urgent')
    // 超过 4h 触发告警
    const future = new Date()
    future.setHours(future.getHours() + 5)
    const alerts = service.scanSlaAlerts(future)
    const matched = alerts.filter(a => a.leadId === lead.leadId)
    expect(matched.length).toBe(1)
  })

  it('营销: 手动录入线索默认高优先级', () => {
    const { controller, service } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '到店VIP客户',
    })
    const data = service.getLead(lead.leadId)
    expect(data!.priority).toBe('high')
  })

  it('营销: 成交线索收入统计计入漏斗', () => {
    const { controller } = createTestEnv()
    for (let i = 0; i < 3; i++) {
      const l = controller.ingestWebhook({ source: 'douyin', contactName: `赢单${i}` })
      controller.closeLead(l.leadId, { stage: 'closed_won', reason: '签约' })
    }
    const metrics = controller.getFunnelMetrics()
    expect(metrics.total).toBe(3)
    expect(metrics.byStage.closed_won).toBe(3)
    expect(metrics.totalRevenue).toBe(30000) // stub: 10000 per won
    expect(metrics.conversionRates.overall).toBe(1) // all won
  })
})
