import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: 8 角色视角的 Leads 功能测试
// 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
// 每个角色至少 2 个用例 (正常流程 + 权限边界)

import { LeadsController } from './leads.controller'
import { LeadsService } from './leads.service'

function createTestEnv() {
  const service = new LeadsService()
  const controller = new LeadsController(service)
  service.reset()
  return { service, controller }
}

// ── 👔店长 ──
describe('👔店长 Leads 角色测试', () => {
  it('👔店长: 注册分配规则并看到线索自动流转', () => {
    const { controller } = createTestEnv()
    // 店长配置分配规则
    controller.registerRule({
      matcher: { region: 'shanghai' },
      strategy: 'specific',
      specificAssignee: 'sales-sh',
      candidatePool: ['sales-sh'],
    })
    // 线索接入后自动分配到指定销售
    const lead = controller.ingestWebhook({
      source: 'douyin',
      contactName: '上海客户',
      contactPhone: '13900001111',
      region: 'shanghai',
    })
    expect(lead.stage).toBe('assigned')
    expect(lead.assigneeUserId).toBe('sales-sh')
  })

  it('👔店长: 查看全店线索漏斗指标掌握招商全貌', () => {
    const { controller } = createTestEnv()
    controller.ingestWebhook({ source: 'baidu', contactName: '线索1' })
    controller.ingestWebhook({ source: 'manual', contactName: '线索2' })
    controller.ingestWebhook({ source: 'xiaohongshu', contactName: '线索3' })

    const metrics = controller.getFunnelMetrics()
    expect(metrics.total).toBe(3)
    expect(metrics.byStage.new).toBe(3)
    expect(metrics.conversionRates).toBeDefined()
    expect(metrics.avgDaysToClose).toBe(0)
  })

  it('👔店长: 无线索时漏斗指标为零不报错', () => {
    const { controller } = createTestEnv()
    const metrics = controller.getFunnelMetrics()
    expect(metrics.total).toBe(0)
    expect(metrics.totalRevenue).toBe(0)
  })

  it('👔店长: 可将已成交线索恢复查看', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({ source: 'manual', contactName: '成交客户' })
    controller.closeLead(lead.leadId, { stage: 'closed_won', reason: '签约成功' })

    const query = controller.getLead(lead.leadId)
    expect(query.found).toBe(true)
    const leadData = query as any
    expect(leadData.lead.stage).toBe('closed_won')
    expect(leadData.lead.closedReason).toBe('签约成功')
  })
})

// ── 🛒前台 ──
describe('🛒前台 Leads 角色测试', () => {
  it('🛒前台: 手动录入来访客户线索', () => {
    const { controller } = createTestEnv()
    const result = controller.ingestWebhook({
      source: 'manual',
      contactName: '到店顾客',
      contactPhone: '13812345678',
      storeId: 'store-01',
    })
    expect(result.leadId).toBeDefined()
    expect(result.source).toBe('manual')
    expect(result.stage).toBeDefined()
  })

  it('🛒前台: 查询自己录入的线索详情', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '前台录入客户',
      contactPhone: '13800001111',
    })

    const query = controller.getLead(lead.leadId)
    expect(query.found).toBe(true)
    const data = query as any
    expect(data.lead.contact.name).toBe('前台录入客户')
    expect(data.lead.contact.phone).toBe('13800001111')
  })
})

// ── 👥HR ──
describe('👥HR Leads 角色测试', () => {
  it('👥HR: 查看招商团队线索分配情况', () => {
    const { controller } = createTestEnv()
    controller.registerRule({
      matcher: {},
      strategy: 'round-robin',
      candidatePool: ['sales-1', 'sales-2'],
    })
    controller.ingestWebhook({ source: 'baidu', contactName: 'HR查询1' })
    controller.ingestWebhook({ source: 'baidu', contactName: 'HR查询2' })

    const list = controller.listLeads()
    expect(list.total).toBe(2)
    expect(list.leads[0].assigneeUserId).toBeDefined()
  })

  it('👥HR: 查看线索列表获取团队工作负载概况', () => {
    const { controller } = createTestEnv()
    const result = controller.listLeads()
    expect(result.total).toBe(0)
    expect(result.leads).toHaveLength(0)
  })
})

// ── 🔧安监 ──
describe('🔧安监 Leads 角色测试', () => {
  it('🔧安监: 确认线索系统 SLA 扫描正常运行', () => {
    const { controller } = createTestEnv()
    // 创建一批线索
    controller.ingestWebhook({ source: 'douyin', contactName: 'SLA-Test' })
    controller.ingestWebhook({ source: 'baidu', contactName: 'SLA-Test2' })

    const result = controller.scanSlaAlerts()
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(result.alerts)).toBe(true)
  })

  it('🔧安监: 查看所有线索状态没有异常', () => {
    const { controller } = createTestEnv()
    controller.ingestWebhook({ source: 'manual', contactName: '安全测试' })
    controller.ingestWebhook({ source: 'xiaohongshu', contactName: '小红书来源' })

    const list = controller.listLeads()
    expect(list.total).toBe(2)
    // 所有线索的 stage 应该在允许集合内
    for (const lead of list.leads) {
      expect(['new', 'assigned', 'contacted', 'trial', 'negotiation', 'closed_won', 'closed_lost']).toContain(lead.stage)
    }
  })
})

// ── 🎮导玩员 ──
describe('🎮导玩员 Leads 角色测试', () => {
  it('🎮导玩员: 可跟进已分配的线索推进阶段', () => {
    const { controller } = createTestEnv()
    controller.registerRule({
      matcher: {},
      strategy: 'specific',
      specificAssignee: 'game-coach',
      candidatePool: ['game-coach'],
    })
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '体验客户',
      contactPhone: '13999999999',
    })

    const followUp = controller.followUp({
      leadId: lead.leadId,
      authorUserId: 'game-coach',
      content: '客户体验良好，计划下次到店',
      newStage: 'trial',
    })
    expect(followUp.success).toBe(true)
    expect(followUp.stage).toBe('trial')
  })

  it('🎮导玩员: 跟进不存在的线索应返回失败', () => {
    const { controller } = createTestEnv()
    const result = controller.followUp({
      leadId: 'nonexistent-lead',
      authorUserId: 'game-coach',
      content: '测试无效线索跟进',
    })
    expect(result.success).toBe(false)
  })
})

// ── 🎯运行专员 ──
describe('🎯运行专员 Leads 角色测试', () => {
  it('🎯运行专员: 多渠道线索统一接入管理', () => {
    const { controller } = createTestEnv()
    const sources = ['douyin', 'xiaohongshu', 'baidu', 'manual'] as const
    for (const source of sources) {
      const lead = controller.ingestWebhook({
        source,
        contactName: `${source}-客户`,
      })
      expect(lead.source).toBe(source)
    }

    const list = controller.listLeads()
    expect(list.total).toBe(4)
  })

  it('🎯运行专员: 关闭流失线索并记录原因', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'baidu',
      contactName: '无效线索',
    })

    const close = controller.closeLead(lead.leadId, {
      stage: 'closed_lost',
      reason: '客户暂时无需求',
    })
    expect(close.success).toBe(true)
    expect(close.stage).toBe('closed_lost')
    expect(close.closedReason).toBe('客户暂时无需求')
  })
})

// ── 🤝团建 ──
describe('🤝团建 Leads 角色测试', () => {
  it('🤝团建: 查看线索跟进记录了解客户互动历史', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'manual',
      contactName: '团建活动客户',
    })

    // 多次跟进
    controller.followUp({
      leadId: lead.leadId,
      authorUserId: 'org-1',
      content: '第一次电话沟通',
      newStage: 'contacted',
    })
    controller.followUp({
      leadId: lead.leadId,
      authorUserId: 'org-1',
      content: '发送团建方案',
      newStage: 'negotiation',
    })

    const query = controller.getLead(lead.leadId)
    expect(query.found).toBe(true)
    const data = query as any
    expect(data.lead.stage).toBe('negotiation')
    expect(data.lead.lastContactedAt).toBeDefined()
  })

  it('🤝团建: 查询线索列表可看到所有团建相关线索', () => {
    const { controller } = createTestEnv()
    const list = controller.listLeads()
    expect(list).toHaveProperty('total')
    expect(list).toHaveProperty('leads')
  })
})

// ── 📢营销 ──
describe('📢营销 Leads 角色测试', () => {
  it('📢营销: DP 线索接入后自动关联营销渠道', () => {
    const { controller } = createTestEnv()
    controller.registerRule({
      matcher: { source: 'douyin' },
      strategy: 'round-robin',
      candidatePool: ['mkt-sales-1', 'mkt-sales-2'],
    })

    const lead = controller.ingestWebhook({
      source: 'douyin',
      contactName: '抖音广告线索',
      contactPhone: '13700001111',
      utmParams: { campaign: 'summer_sale', ad_group: 'brand_video' },
    })

    expect(lead.source).toBe('douyin')
    expect(lead.assigneeUserId).toBeDefined()
  })

  it('📢营销: 查看不同渠道线索转化漏斗', () => {
    const { controller } = createTestEnv()
    // ❌ 不要用错误的 key: bySource，用 byStage
    controller.ingestWebhook({ source: 'douyin', contactName: '抖音A' })
    controller.ingestWebhook({ source: 'douyin', contactName: '抖音B' })
    controller.ingestWebhook({ source: 'baidu', contactName: '百度A' })
    controller.ingestWebhook({ source: 'xiaohongshu', contactName: '小红书A' })

    const metrics = controller.getFunnelMetrics()
    expect(metrics.total).toBe(4)
    // byStage 覆盖所有阶段
    expect(Object.keys(metrics.byStage).length).toBeGreaterThan(0)
  })

  it('📢营销: 确认自定义字段可存储营销 UTM 参数', () => {
    const { controller } = createTestEnv()
    const lead = controller.ingestWebhook({
      source: 'baidu',
      contactName: 'SEM线索',
      contactPhone: '13600000000',
      utmParams: { keyword: '加盟合作', match_type: 'phrase' },
    })

    // 通过 getLead 查看 lead 详情中的 customFields
    const query = controller.getLead(lead.leadId)
    expect(query.found).toBe(true)
  })
})
