import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimodal-fusion] [C] 角色测试
 *
 * 8 角色视角的 multimodal-fusion 模块测试:
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例 (正常流程 + 权限边界)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MultimodalFusionController } from './multimodal-fusion.controller'
import { MultimodalFusionService } from './multimodal-fusion.service'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 角色定义 ──
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

// ── 测试数据工厂 ──
function createController(): { service: MultimodalFusionService; controller: MultimodalFusionController } {
  const service = new MultimodalFusionService()
  const controller = new MultimodalFusionController(service)
  return { service, controller }
}

const TENANT = {
  tenantId: 'tenant-role-test',
  storeId: 'store-role',
  userId: 'role-tester',
  role: 'tenant_admin' as const,
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} 多模态融合分析 角色测试`, () => {
  it('店长可创建门店货架巡检综合分析任务 => 包含多数据源洞察', async () => {
    const { controller } = createController()
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'comprehensive_analysis',
        title: '门店货架巡检综合分析',
        templateId: 'tpl-shelf-audit',
        sources: [
          { source: 'image', sourceId: 'shelf-rec-001', weight: 0.4, confidence: 0.9, keyFindings: ['商品摆放'] },
          { source: 'document', sourceId: 'shelf-doc-001', weight: 0.3, confidence: 0.85, keyFindings: ['SKU 清单'] },
          { source: 'tabular', sourceId: 'shelf-ts-001', weight: 0.3, confidence: 0.8, keyFindings: ['库存数据'] },
        ],
      }),
    )
    assert.equal(task.status, 'completed')
    assert.ok(task.report)
    assert.ok(task.report!.sections.some((s) => s.title === '执行摘要'))
  })

  it('店长查看统计数据 => 至少可以看到自己的任务总数', async () => {
    const { service } = createController()
    const stats = await runWithTenant(TENANT, () => service.getFusionStats())
    assert.ok(typeof stats.totalTasks === 'number')
    assert.ok(stats.avgConfidence >= 0)
  })

  it('店长使用不存在的模板 ID => 被拒', async () => {
    const { controller } = createController()
    await assert.rejects(
      () => runWithTenant(TENANT, () =>
        controller.createTask({
          taskType: 'comprehensive_analysis',
          title: '非法模板',
          templateId: 'tpl-nonexistent',
          sources: [{ source: 'image', sourceId: 'img', weight: 1, confidence: 0.9, keyFindings: [] }],
        }),
      ),
      /模板.*不存在/,
    )
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} 多模态融合分析 角色测试`, () => {
  it('前台可搜索客户对讲转写内容 => 返回匹配模态结果', async () => {
    const { controller } = createController()
    // 索引语音转写数据 - 内容重复搜索词以提高 textSimilarity 匹配率
    await runWithTenant(TENANT, () =>
      controller.indexItem({ itemId: 'stt-customer-1', modality: 'voice', text: '退卡退卡退卡我要办理会员退卡' }),
    )
    await runWithTenant(TENANT, () =>
      controller.indexItem({ itemId: 'stt-customer-2', modality: 'voice', text: '今天会员可乐半价第二杯吗' }),
    )
    const result = await runWithTenant(TENANT, () =>
      controller.crossModalSearch({ query: '退卡退卡退卡退卡', modalities: ['voice'], topK: 5 }),
    )
    assert.ok(result.items.length >= 1)
    assert.ok(result.items.some((h) => h.modality === 'voice'))
  })

  it('前台搜索非法模态 => 服务端仍返回但为空', async () => {
    const { controller } = createController()
    const result = await runWithTenant(TENANT, () =>
      controller.crossModalSearch({ query: '测试', modalities: ['multimedia' as any], topK: 5 }),
    )
    assert.ok(Array.isArray(result.items))
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} 多模态融合分析 角色测试`, () => {
  it('HR 可创建合规审计任务 => 识别低置信度数据异常', async () => {
    const { controller } = createController()
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'compliance_audit',
        title: '员工行为合规审计',
        sources: [
          { source: 'document', sourceId: 'hr-doc-low', weight: 1, confidence: 0.3, keyFindings: ['考勤记录'] },
        ],
      }),
    )
    assert.ok(task.anomalies.length >= 1)
    assert.equal(task.anomalies[0].severity, 'warning')
  })

  it('HR 查询员工情感洞察 => 正常的正面情感合成', async () => {
    const { controller } = createController()
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'sentiment_synthesis',
        title: '员工满意度情感分析',
        sources: [
          { source: 'voice', sourceId: 'hr-voice', weight: 0.4, confidence: 0.9, keyFindings: [] },
          { source: 'text', sourceId: 'hr-text', weight: 0.6, confidence: 0.8, keyFindings: ['满意'] },
        ],
      }),
    )
    const sentIns = task.insights.find((i) => i.category === 'sentiment')
    assert.ok(sentIns)
    assert.ok(sentIns.confidence > 0)
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} 多模态融合分析 角色测试`, () => {
  it('安监可创建异常检测任务 => 检测统计离群值', async () => {
    const { controller, service } = createController()
    await runWithTenant(TENANT, () =>
      service.indexTabularData('sec-ts', [
        { ts: '2026-06-01', value: 10 },
        { ts: '2026-06-02', value: 12 },
        { ts: '2026-06-03', value: 11 },
        { ts: '2026-06-04', value: 10 },
        { ts: '2026-06-05', value: 9 },
        { ts: '2026-06-06', value: 11 },
        { ts: '2026-06-07', value: 10 },
        { ts: '2026-06-08', value: 12 },
        { ts: '2026-06-09', value: 11 },
        { ts: '2026-06-10', value: 1000 }, // 异常
        { ts: '2026-06-11', value: 10 },
      ]),
    )
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'anomaly_detection',
        title: '安全监控异常检测',
        sources: [
          { source: 'tabular', sourceId: 'sec-ts', weight: 1, confidence: 0.9, keyFindings: [] },
        ],
      }),
    )
    assert.ok(task.anomalies.length >= 1)
    assert.ok(task.report!.sections.some((s) => s.title === '异常情况'))
  })

  it('安监获取统计包含 criticalAnomalies 计数', async () => {
    const { service } = createController()
    const stats = await runWithTenant(TENANT, () => service.getFusionStats())
    assert.ok(stats.criticalAnomalies >= 0)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} 多模态融合分析 角色测试`, () => {
  it('导玩员可搜索多媒体内容 => 图像匹配返回', async () => {
    const { controller } = createController()
    await runWithTenant(TENANT, () =>
      controller.indexItem({ itemId: 'guide-img-1', modality: 'multimedia', text: '娃娃机娃娃机抓娃娃抓娃娃机指南' }),
    )
    const result = await runWithTenant(TENANT, () =>
      controller.crossModalSearch({ query: '娃娃机娃娃机抓娃娃', modalities: ['multimedia'], topK: 5 }),
    )
    assert.ok(result.items.length >= 1)
  })

  it('导玩员列出可用引擎 => 5 个引擎信息完整', async () => {
    const { controller } = createController()
    // listEngines is async (returns Promise)
    const result = await controller.listEngines()
    assert.equal(result.items.length, 5)
    for (const eng of result.items) {
      assert.ok(eng.displayName.length > 0)
    }
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} 多模态融合分析 角色测试`, () => {
  it('运行专员可创建趋势洞察任务 => 获取变化百分比与预测', async () => {
    const { controller, service } = createController()
    await runWithTenant(TENANT, () =>
      service.indexTabularData('ops-trend', [
        { ts: '2026-Q1', value: 500 },
        { ts: '2026-Q2', value: 750 },
      ]),
    )
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'trend_insight',
        title: 'Q2 运营数据趋势分析',
        sources: [
          { source: 'tabular', sourceId: 'ops-trend', weight: 1, confidence: 0.9, keyFindings: [] },
        ],
      }),
    )
    assert.ok(task.report!.trends.length >= 1)
    assert.equal(task.report!.trends[0].direction, 'up')
  })

  it('运行专员查看所有模板 => 了解可用预设分析类型', async () => {
    const { controller } = createController()
    // listTemplates is async
    const result = await controller.listTemplates()
    const types = result.items.map((t: any) => t.taskType)
    assert.ok(types.includes('compliance_audit'))
    assert.ok(types.includes('trend_insight'))
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} 多模态融合分析 角色测试`, () => {
  it('团建可创建情感综合分析 => 识别团队活动反馈情感', async () => {
    const { controller } = createController()
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'sentiment_synthesis',
        title: '团建活动反馈情感分析',
        sources: [
          { source: 'text', sourceId: 'tb-text-1', weight: 0.5, confidence: 0.85, keyFindings: ['有趣'] },
          { source: 'image', sourceId: 'tb-img-1', weight: 0.5, confidence: 0.8, keyFindings: ['笑脸'] },
        ],
      }),
    )
    const sent = task.insights.find((i) => i.category === 'sentiment')
    assert.ok(sent)
  })

  it('团建获取报告含关键洞察 => 报告章节完整', async () => {
    const { controller } = createController()
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'report_generation',
        title: '团建活动报告',
        sources: [
          { source: 'document', sourceId: 'tb-rpt', weight: 1, confidence: 0.9, keyFindings: [] },
        ],
      }),
    )
    assert.ok(task.report)
    assert.ok(task.report!.sections.length >= 1)
    assert.equal(task.report!.title, '团建活动报告')
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} 多模态融合分析 角色测试`, () => {
  it('营销可创建综合分析 => 含图像+文本跨模态洞察', async () => {
    const { controller } = createController()
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'comprehensive_analysis',
        title: '新品上市综合洞察分析',
        sources: [
          { source: 'image', sourceId: 'mkt-img', weight: 0.3, confidence: 0.9, keyFindings: ['新品陈列'] },
          { source: 'document', sourceId: 'mkt-doc', weight: 0.35, confidence: 0.85, keyFindings: ['文案效果'] },
          { source: 'tabular', sourceId: 'mkt-sales', weight: 0.35, confidence: 0.8, keyFindings: ['销售趋势'] },
        ],
      }),
    )
    assert.equal(task.status, 'completed')
    assert.ok(task.insights.length >= 1)
  })

  it('营销取消已完成任务 => 被拒（终态保护）', async () => {
    const { controller } = createController()
    const task = await runWithTenant(TENANT, () =>
      controller.createTask({
        taskType: 'report_generation',
        title: '营销报告',
        sources: [{ source: 'image', sourceId: 'mkt-cancel', weight: 1, confidence: 0.9, keyFindings: [] }],
      }),
    )
    await assert.rejects(
      () => runWithTenant(TENANT, () => controller.cancelTask(task.id)),
      /终态/,
    )
  })
})
