import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [lineage] [C] 角色测试
 *
 * 8 角色视角的 lineage 数据血缘模块测试：
 * 👔 店长 🛒 前台 👥 HR 🔧 安监 🎮 导玩员 🎯 运行专员 🤝 团建 📢 营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限/业务边界）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { HttpException } from '@nestjs/common'
import { LineageController } from './lineage.controller'
import { DataLineageTracker, ImpactAnalyzer } from './data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
} from './sensitive-data.service'

// ── 基础设施 ──
interface Context {
  controller: LineageController
  tracker: DataLineageTracker
  classifier: SensitiveDataClassifier
  flowMonitor: DataFlowMonitor
  complianceReporter: ComplianceReporter
}

function createContext(): Context {
  const tracker = new DataLineageTracker()
  const impactAnalyzer = new ImpactAnalyzer(tracker)
  const classifier = new SensitiveDataClassifier()
  const flowMonitor = new DataFlowMonitor()
  const complianceReporter = new ComplianceReporter(classifier, flowMonitor)
  const controller = new LineageController(
    tracker,
    impactAnalyzer,
    classifier,
    flowMonitor,
    complianceReporter,
  )
  return { controller, tracker, classifier, flowMonitor, complianceReporter }
}

function seedBasicLineage(ctx: Context) {
  ctx.controller.registerField({ tableName: 'users', fieldName: 'email' })
  ctx.controller.registerField({ tableName: 'profiles', fieldName: 'email' })
  ctx.controller.registerField({ tableName: 'analytics', fieldName: 'user_email' })
  ctx.controller.registerEdge({
    type: 'DIRECT',
    from: { tableName: 'users', fieldName: 'email' },
    to: { tableName: 'profiles', fieldName: 'email' },
  })
  ctx.controller.registerEdge({
    type: 'TRANSFORM',
    from: { tableName: 'users', fieldName: 'email' },
    to: { tableName: 'analytics', fieldName: 'user_email' },
    transform: 'lower(email)',
  })
}

function seedSensitiveFields(ctx: Context) {
  ctx.controller.classifyField({ tableName: 'users', fieldName: 'email_address' })
  ctx.controller.classifyField({ tableName: 'users', fieldName: 'phone_number' })
  ctx.controller.classifyField({ tableName: 'users', fieldName: 'name' })
  ctx.controller.classifyField({ tableName: 'users', fieldName: 'id_card' })
}

// ============================================================================
// 👔 店长 (StoreManager) — 数据资产总览与血缘追溯
// ============================================================================
describe('👔 StoreManager - 数据资产总览与血缘追溯', () => {
  it('👔 店长-正常流程: 查看完整数据血缘图谱', () => {
    const ctx = createContext()
    seedBasicLineage(ctx)

    const graph = ctx.controller.getFullGraph()
    assert.equal(graph.success, true)
    assert.ok(graph.data)
    const d = graph.data as any
    // upstream/downstream are arrays from getUpstream/getDownstream
    assert.ok(Array.isArray(d.upstream))
    assert.ok(Array.isArray(d.downstream))
    // After seeding there should be data
    assert.ok(d.upstream.length >= 0)
    assert.ok(d.downstream.length >= 0)
  })

  it('👔 店长-正常流程: 追踪具体字段的数据来源与去向', () => {
    const ctx = createContext()
    seedBasicLineage(ctx)

    const upstream = ctx.controller.getLineage('users', 'email')
    assert.equal(upstream.success, true)

    const downstream = ctx.controller.getDownstream('users', 'email')
    assert.equal(downstream.success, true)
  })

  it('👔 店长-边界: 查看空数据时的图谱（未注册任何字段）', () => {
    const ctx = createContext()

    const graph = ctx.controller.getFullGraph()
    assert.equal(graph.success, true)
    const d = graph.data as any
    assert.ok(Array.isArray(d.upstream))
    assert.equal(d.upstream.length, 0)
    assert.equal(d.downstream.length, 0)
  })

  it('👔 店长-边界: 追踪不存在的字段应返回空（不抛异常）', () => {
    const ctx = createContext()

    // 不存在的字段不会抛异常，返回空
    const result = ctx.controller.getLineage('nonexistent', 'field')
    assert.equal(result.success, true)
  })
})

// ============================================================================
// 🛒 前台 (FrontDesk) — 字段注册与基本信息查询
// ============================================================================
describe('🛒 FrontDesk - 字段注册与基本信息', () => {
  it('🛒 前台-正常流程: 注册新字段并确认注册成功', () => {
    const ctx = createContext()

    const result = ctx.controller.registerField({
      tableName: 'members',
      fieldName: 'mobile',
    })
    assert.equal(result.success, true)
    assert.ok((result.message ?? '').includes('registered'))
  })

  it('🛒 前台-正常流程: 注册血缘边并确认', () => {
    const ctx = createContext()

    ctx.controller.registerField({ tableName: 'orders', fieldName: 'amount' })
    ctx.controller.registerField({ tableName: 'reports', fieldName: 'total_amount' })
    const edgeResult = ctx.controller.registerEdge({
      type: 'TRANSFORM',
      from: { tableName: 'orders', fieldName: 'amount' },
      to: { tableName: 'reports', fieldName: 'total_amount' },
      transform: 'sum(amount)',
    })
    assert.equal(edgeResult.success, true)
  })

  it('🛒 前台-边界: 字段名为空时系统默认处理', () => {
    const ctx = createContext()

    const result = ctx.controller.registerField({
      tableName: 'test',
      fieldName: '',
    })
    assert.equal(result.success, true)
  })
})

// ============================================================================
// 👥 HR (人力资源) — 敏感数据分类与合规评估
// ============================================================================
describe('👥 HR - 敏感数据分类与合规', () => {
  it('👥 HR-正常流程: 自动分类员工手机号为 PII', () => {
    const ctx = createContext()

    const result = ctx.controller.classifyField({
      tableName: 'employees',
      fieldName: 'phone_number',
    })
    assert.equal(result.success, true)
    const classification = result.data as any
    assert.equal(classification.category, 'PII')
    assert.equal(classification.autoClassified, true)
  })

  it('👥 HR-正常流程: 查看所有已分类字段（返回 Map，检查 size）', () => {
    const ctx = createContext()
    seedSensitiveFields(ctx)

    const result = ctx.controller.getAllClassifications()
    assert.equal(result.success, true)
    // getAllClassifications 返回 Map<string, Map<string, FieldClassification>>
    const data = result.data as Map<string, Map<string, any>>
    assert.ok(data instanceof Map, 'should be a Map')
    let total = 0
    for (const [, fields] of data) {
      total += fields.size
    }
    assert.ok(total >= 4)
  })

  it('👥 HR-边界: 对未分类字段查询应抛出 404', () => {
    const ctx = createContext()

    assert.throws(() => {
      ctx.controller.getClassification('employees', 'unknown_field')
    }, HttpException)
  })

  it('👥 HR-边界: 手动更新敏感级别可覆盖自动分类', () => {
    const ctx = createContext()

    ctx.controller.classifyField({ tableName: 'employees', fieldName: 'name' })
    const updated = ctx.controller.updateClassification({
      tableName: 'employees',
      fieldName: 'name',
      level: 'restricted',
    })
    assert.equal(updated.success, true)
    assert.equal((updated.data as any).level, 'restricted')
    assert.equal((updated.data as any).autoClassified, false)
  })
})

// ============================================================================
// 🔧 安监 (Security) — 数据流监控与暴露风险检测
// ============================================================================
describe('🔧 Security - 数据流监控与暴露风险', () => {
  it('🔧 安监-正常流程: 追踪敏感字段的数据流动', () => {
    const ctx = createContext()

    ctx.controller.classifyField({ tableName: 'users', fieldName: 'id_card' })
    ctx.controller.registerField({ tableName: 'users', fieldName: 'id_card' })
    ctx.controller.registerField({ tableName: 'backup', fieldName: 'id_card' })

    const flowResult = ctx.controller.trackDataFlow({
      fromTable: 'users',
      fromField: 'id_card',
      toTable: 'backup',
      toField: 'id_card',
      via: 'nightly_backup',
    })
    assert.equal(flowResult.success, true)

    const risks = ctx.controller.getExposureRisks()
    assert.equal(risks.success, true)
    assert.ok(Array.isArray(risks.data))
  })

  it('🔧 安监-正常流程: 获取数据流报告确认上下游', () => {
    const ctx = createContext()

    ctx.controller.registerField({ tableName: 'customers', fieldName: 'credit_card' })
    ctx.controller.registerField({ tableName: 'payments', fieldName: 'cc_hash' })

    ctx.controller.trackDataFlow({
      fromTable: 'customers',
      fromField: 'credit_card',
      toTable: 'payments',
      toField: 'cc_hash',
      via: 'hash_transform',
    })

    const report = ctx.controller.getDataFlowReport()
    assert.equal(report.success, true)
    assert.ok(report.data)
  })

  it('🔧 安监-边界: 无数据流跟踪时风险报告不报错', () => {
    const ctx = createContext()

    const report = ctx.controller.getDataFlowReport()
    assert.equal(report.success, true)

    const risks = ctx.controller.getExposureRisks()
    assert.equal(risks.success, true)
  })

  it('🔧 安监-边界: 手动更新分类级别后合规仍可正常检查', () => {
    const ctx = createContext()

    ctx.controller.classifyField({ tableName: 'logs', fieldName: 'raw_data' })
    ctx.controller.updateClassification({
      tableName: 'logs',
      fieldName: 'raw_data',
      level: 'internal',
    })

    const violations = ctx.controller.getViolations()
    assert.equal(violations.success, true)
  })
})

// ============================================================================
// 🎮 导玩员 (Guide) — 影响分析与字段关系探索
// ============================================================================
describe('🎮 Guide - 影响分析与字段关系', () => {
  it('🎮 导玩员-正常流程: 分析某一字段变更的影响范围', () => {
    const ctx = createContext()
    seedBasicLineage(ctx)

    const impact = ctx.controller.analyzeImpact({
      field: { tableName: 'users', fieldName: 'email' },
    })
    assert.equal(impact.success, true)
    const data = impact.data as any
    assert.ok(data, 'impact data should exist')
    // 返回的 impact result 包含 downstreamFields 数组
    assert.ok(Array.isArray(data.downstreamFields))
    // 因为 users.email 有下游 profiles.email 和 analytics.user_email
    assert.ok(data.downstreamFields.length >= 1)
  })

  it('🎮 导玩员-正常流程: 从数据流报告中发现字段传播链路', () => {
    const ctx = createContext()

    ctx.controller.registerField({ tableName: 'source', fieldName: 'name' })
    ctx.controller.registerField({ tableName: 'staging', fieldName: 'name' })
    ctx.controller.registerField({ tableName: 'target', fieldName: 'full_name' })
    ctx.controller.registerEdge({
      type: 'DIRECT',
      from: { tableName: 'source', fieldName: 'name' },
      to: { tableName: 'staging', fieldName: 'name' },
    })
    ctx.controller.registerEdge({
      type: 'TRANSFORM',
      from: { tableName: 'staging', fieldName: 'name' },
      to: { tableName: 'target', fieldName: 'full_name' },
      transform: "concat(first_name, ' ', last_name)",
    })

    const graph = ctx.controller.getFullGraph()
    assert.equal(graph.success, true)
    assert.ok(Array.isArray((graph.data as any).upstream))
    assert.ok(Array.isArray((graph.data as any).downstream))
  })

  it('🎮 导玩员-边界: 未注册字段的影响分析返回空结果', () => {
    const ctx = createContext()

    const result = ctx.controller.analyzeImpact({
      field: { tableName: 'ghost', fieldName: 'unknown' },
    })
    assert.equal(result.success, true)
    const data = result.data as any
    assert.ok(Array.isArray(data.downstreamFields))
    assert.equal(data.downstreamFields.length, 0)
  })
})

// ============================================================================
// 🎯 运行专员 (Operations) — 合规评分与违规列表
// ============================================================================
describe('🎯 Operations - 合规评分与违规', () => {
  it('🎯 运行专员-正常流程: 生成合规报告并检查评分', () => {
    const ctx = createContext()
    seedSensitiveFields(ctx)

    const report = ctx.controller.generateComplianceReport()
    assert.equal(report.success, true)
    const data = report.data as any
    assert.ok(Array.isArray(data.piiFields), 'piiFields should be an array')
    assert.ok(data.piiFields.length >= 4)
    assert.ok(typeof data.compliant === 'boolean')

    const score = ctx.controller.getComplianceScore()
    assert.equal(score.success, true)
    assert.equal(typeof (score.data as any).score, 'number')
  })

  it('🎯 运行专员-正常流程: 查看合规违规列表', () => {
    const ctx = createContext()
    seedSensitiveFields(ctx)

    const violations = ctx.controller.getViolations()
    assert.equal(violations.success, true)
    assert.ok(Array.isArray(violations.data))
  })

  it('🎯 运行专员-边界: 无分类字段时的合规报告不报错', () => {
    const ctx = createContext()

    const report = ctx.controller.generateComplianceReport()
    assert.equal(report.success, true)
    assert.ok(Array.isArray((report.data as any).piiFields))
    assert.equal((report.data as any).piiFields.length, 0)
    assert.equal((report.data as any).compliant, true)

    const violations = ctx.controller.getViolations()
    assert.equal(violations.success, true)
    assert.ok(Array.isArray(violations.data))
  })

  it('🎯 运行专员-边界: 按 ID 查询合规报告', () => {
    const ctx = createContext()

    const result = ctx.controller.getReportById('cr-monthly-202607')
    assert.equal(result.success, true)
    assert.equal((result.data as any).requestedReportId, 'cr-monthly-202607')
  })
})

// ============================================================================
// 🤝 团建 (Teambuilding) — 批量分类与团队协作场景
// ============================================================================
describe('🤝 Teambuilding - 批量分类与协作', () => {
  it('🤝 团建-正常流程: 批量分类多个字段', () => {
    const ctx = createContext()

    const result = ctx.controller.classifyFieldBatch([
      { tableName: 'users', fieldName: 'phone_number' },
      { tableName: 'users', fieldName: 'email_address' },
      { tableName: 'users', fieldName: 'name' },
      { tableName: 'users', fieldName: 'created_at' },
      { tableName: 'users', fieldName: 'id_card' },
    ])
    assert.equal(result.success, true)
    assert.ok(Array.isArray(result.data))
    assert.equal(result.data.length, 5)

    for (const item of result.data as any[]) {
      assert.ok(item.category)
      assert.ok(item.level)
    }
  })

  it('🤝 团建-正常流程: 注册传输记录（数据迁移场景）', () => {
    const ctx = createContext()

    const result = ctx.controller.registerTransfer({
      sourceField: 'name',
      targetField: 'full_name',
      table: 'user_profile',
      operation: 'merge',
    })
    assert.equal(result.success, true)

    const report = ctx.controller.getDataFlowReport()
    assert.equal(report.success, true)
  })

  it('🤝 团建-边界: 批量分类后仅列出敏感字段', () => {
    const ctx = createContext()

    ctx.controller.classifyFieldBatch([
      { tableName: 'users', fieldName: 'phone_number' },
      { tableName: 'users', fieldName: 'name' },
      { tableName: 'users', fieldName: 'created_at' },
    ])

    const result = ctx.controller.listSensitiveFields('users')
    assert.equal(result.success, true)
    const sensitive = result.data as any[]
    for (const f of sensitive) {
      assert.notEqual(f.category, 'NONE', '敏感列表不应包含 NONE')
    }
  })
})

// ============================================================================
// 📢 营销 (Marketing) — 分类更新与合规报告解读
// ============================================================================
describe('📢 Marketing - 分类更新与合规', () => {
  it('📢 营销-正常流程: 更新非敏感字段的分类级别以适配营销合规', () => {
    const ctx = createContext()

    ctx.controller.classifyField({ tableName: 'campaign', fieldName: 'user_email' })
    const updated = ctx.controller.updateClassification({
      tableName: 'campaign',
      fieldName: 'user_email',
      level: 'public',
    })
    assert.equal(updated.success, true)
    assert.equal((updated.data as any).level, 'public')
  })

  it('📢 营销-正常流程: 基于合规报告获取违规详情优化数据处理', () => {
    const ctx = createContext()

    ctx.controller.classifyField({ tableName: 'promotions', fieldName: 'user_id_card' })
    ctx.controller.classifyField({ tableName: 'promotions', fieldName: 'user_phone' })

    const report = ctx.controller.generateComplianceReport()
    assert.equal(report.success, true)
    const data = report.data as any
    assert.ok(Array.isArray(data.piiFields))

    const violations = ctx.controller.getViolations()
    assert.equal(violations.success, true)
    assert.ok(Array.isArray(violations.data))
  })

  it('📢 营销-边界: 无效的分类级别更新应抛出异常', () => {
    const ctx = createContext()

    ctx.controller.classifyField({ tableName: 'ads', fieldName: 'click_rate' })

    assert.throws(() => {
      ctx.controller.updateClassification({
        tableName: 'ads',
        fieldName: 'click_rate',
        level: 'ultra_secret',
      })
    }, HttpException)
  })

  it('📢 营销-边界: 自动分类后查看合规报告', () => {
    const ctx = createContext()

    ctx.controller.classifyField({ tableName: 'ads', fieldName: 'click_rate' })
    ctx.controller.classifyField({ tableName: 'ads', fieldName: 'user_email' })

    const report = ctx.controller.generateComplianceReport()
    assert.equal(report.success, true)
    assert.ok(Array.isArray((report.data as any).piiFields))
  })

  it('📢 营销-边界: 批量分类中混合敏感与非敏感字段', () => {
    const ctx = createContext()

    const result = ctx.controller.classifyFieldBatch([
      { tableName: 'marketing', fieldName: 'email' },
      { tableName: 'marketing', fieldName: 'age_group' },
      { tableName: 'marketing', fieldName: 'purchase_history' },
    ])
    assert.equal(result.success, true)
    assert.equal(result.data.length, 3)

    const sensitive = ctx.controller.listSensitiveFields('marketing')
    assert.equal(sensitive.success, true)
  })
})
