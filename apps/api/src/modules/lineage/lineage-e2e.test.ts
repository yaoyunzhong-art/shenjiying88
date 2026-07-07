import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * lineage-e2e.test.ts - T125-3 + T126-3
 * Lineage E2E 集成测试：字段血缘追踪 + 敏感数据合规 + CRUD触发血缘记录
 *
 * 测试场景:
 * - 字段血缘全流程
 * - 敏感数据合规 E2E
 * - 跨模块集成
 *
 * 落地：HEARTBEAT-64
 */

import assert from 'node:assert/strict'
import {
  DataLineageTracker,
  ImpactAnalyzer,
  type FieldRef,
  type LineageGraph,
  type ImpactResult,
  type RiskAssessment,
} from './data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
  type FieldClassification,
  type ExposureRisk,
  type GDPRReport,
} from './sensitive-data.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createDataLineageTracker(): DataLineageTracker {
  return new DataLineageTracker()
}

function createImpactAnalyzer(tracker?: DataLineageTracker): ImpactAnalyzer {
  return new ImpactAnalyzer(tracker ?? createDataLineageTracker())
}

function createSensitiveDataClassifier(): SensitiveDataClassifier {
  return new SensitiveDataClassifier()
}

function createDataFlowMonitor(): DataFlowMonitor {
  return new DataFlowMonitor()
}

function createComplianceReporter(): ComplianceReporter {
  const classifier = createSensitiveDataClassifier()
  const monitor = createDataFlowMonitor()
  return new ComplianceReporter(classifier, monitor)
}

function makeFieldRef(tableName: string, fieldName: string): FieldRef {
  return { tableName, fieldName }
}

// ─────────────────────────────────────────────────────────────
// 1. 字段血缘全流程测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('字段血缘全流程 — 成功路径', () => {
  it('A表字段变更 → 血缘追踪 → 影响分析', () => {
    const tracker = createDataLineageTracker()
    const analyzer = createImpactAnalyzer(tracker)

    // 1. 追踪字段血缘：A.order_id -> B.order_id -> C.report
    tracker.trackField('B', 'order_id', makeFieldRef('A', 'order_id'))
    tracker.trackField('C', 'report', makeFieldRef('B', 'order_id'))

    // 2. 注册仪表板使用的字段
    analyzer.registerDashboard({
      dashboardId: 'dash-1',
      dashboardName: 'Sales Dashboard',
      fields: [makeFieldRef('C', 'report')],
    })

    analyzer.registerAPI({
      apiId: 'api-1',
      apiName: 'Order Report API',
      endpoint: '/api/report',
      fields: [makeFieldRef('C', 'report')],
    })

    // 3. 影响分析
    const impact = analyzer.analyzeImpact('A', 'order_id')

    assert.equal(impact.fieldRef.tableName, 'A')
    assert.equal(impact.fieldRef.fieldName, 'order_id')
    assert.ok(impact.downstreamFields.length > 0)
    assert.ok(impact.affectedDashboards.length >= 1)
    assert.ok(impact.affectedAPIs.length >= 1)
  })

  it('字段血缘图正确构建', () => {
    const tracker = createDataLineageTracker()

    // 构建复杂血缘关系
    tracker.trackField('B', 'full_name', makeFieldRef('A', 'first_name'))
    tracker.trackField('B', 'full_name', makeFieldRef('A', 'last_name'))
    tracker.trackField('C', 'greeting', makeFieldRef('B', 'full_name'))

    // 获取血缘图
    const graph = tracker.getLineageGraph('B')

    assert.ok(Array.isArray(graph.nodes))
    assert.ok(Array.isArray(graph.edges))
    assert.ok(graph.nodes.length >= 2)
    assert.ok(graph.edges.length >= 2)
  })

  it('转换血缘正确追踪', () => {
    const tracker = createDataLineageTracker()

    // 追踪转换：A.price + A.tax -> B.total (多对一)
    tracker.trackTransform(
      makeFieldRef('B', 'total'),
      [makeFieldRef('A', 'price'), makeFieldRef('A', 'tax')]
    )

    // 验证上游追溯
    const upstream = tracker.getUpstream('B', 'total')
    assert.equal(upstream.length, 2)

    const hasPrice = upstream.some((u) => u.fieldName === 'price')
    const hasTax = upstream.some((u) => u.fieldName === 'tax')
    assert.ok(hasPrice)
    assert.ok(hasTax)
  })

  it('下游影响正确识别', () => {
    const tracker = createDataLineageTracker()

    // A.field1 -> B.field1 -> C.field1
    tracker.trackField('B', 'field1', makeFieldRef('A', 'field1'))
    tracker.trackField('C', 'field1', makeFieldRef('B', 'field1'))

    // 获取 A.field1 的直接下游
    const downstream = tracker.getDownstream('A', 'field1')
    assert.equal(downstream.length, 1) // 直接下游只有 B.field1
    assert.equal(downstream[0].tableName, 'B')
    assert.equal(downstream[0].fieldName, 'field1')

    // 获取 B.field1 的直接下游
    const downstreamB = tracker.getDownstream('B', 'field1')
    assert.equal(downstreamB.length, 1) // 直接下游只有 C.field1
    assert.equal(downstreamB[0].tableName, 'C')
  })
})

describe('字段血缘全流程 — 异常路径', () => {
  it('不存在字段的上游返回空数组', () => {
    const tracker = createDataLineageTracker()

    const upstream = tracker.getUpstream('non_existent', 'field')
    assert.ok(Array.isArray(upstream))
    assert.equal(upstream.length, 0)
  })

  it('不存在字段的下游返回空数组', () => {
    const tracker = createDataLineageTracker()

    const downstream = tracker.getDownstream('non_existent', 'field')
    assert.ok(Array.isArray(downstream))
    assert.equal(downstream.length, 0)
  })

  it('血缘图深度限制生效', () => {
    const tracker = createDataLineageTracker()

    // A -> B -> C -> D
    tracker.trackField('B', 'f1', makeFieldRef('A', 'f1'))
    tracker.trackField('C', 'f1', makeFieldRef('B', 'f1'))
    tracker.trackField('D', 'f1', makeFieldRef('C', 'f1'))

    // depth=1 应该只包含直接下游
    const graph = tracker.getLineageGraph('A', 1)

    // 深度限制应该过滤掉二级下游
    const hasD = graph.nodes.some((n) => n.tableName === 'D')
    assert.equal(hasD, false)
  })
})

// ─────────────────────────────────────────────────────────────
// 2. 影响分析与风险评估测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('影响分析与风险评估 — 成功路径', () => {
  it('受影响的API和仪表板被识别', () => {
    const tracker = createDataLineageTracker()
    const analyzer = new ImpactAnalyzer(tracker)

    // 构建血缘链
    tracker.trackField('orders', 'customer_id', makeFieldRef('customers', 'id'))
    tracker.trackField('reports', 'customer_name', makeFieldRef('orders', 'customer_id'))

    // 注册下游依赖
    analyzer.registerDashboard({
      dashboardId: 'dash-customer',
      dashboardName: 'Customer Report',
      fields: [makeFieldRef('reports', 'customer_name')],
    })

    analyzer.registerAPI({
      apiId: 'api-customer',
      apiName: 'Customer API',
      endpoint: '/api/customer',
      fields: [makeFieldRef('reports', 'customer_name')],
    })

    // 分析影响
    const impact = analyzer.analyzeImpact('customers', 'id')

    assert.equal(impact.affectedDashboards.length, 1)
    assert.equal(impact.affectedAPIs.length, 1)
    assert.equal(impact.affectedDashboards[0].dashboardId, 'dash-customer')
    assert.equal(impact.affectedAPIs[0].apiId, 'api-customer')
  })

  it('风险评估报告生成', () => {
    const tracker = createDataLineageTracker()
    const analyzer = new ImpactAnalyzer(tracker)

    // 高风险场景：多仪表板 + 多API + 多下游
    tracker.trackField('core', 'sensitive_field', makeFieldRef('source', 'raw_field'))

    // 注册多个下游
    analyzer.registerDashboard({
      dashboardId: 'dash-1',
      dashboardName: 'Dashboard 1',
      fields: [makeFieldRef('core', 'sensitive_field')],
    })
    analyzer.registerDashboard({
      dashboardId: 'dash-2',
      dashboardName: 'Dashboard 2',
      fields: [makeFieldRef('core', 'sensitive_field')],
    })
    analyzer.registerDashboard({
      dashboardId: 'dash-3',
      dashboardName: 'Dashboard 3',
      fields: [makeFieldRef('core', 'sensitive_field')],
    })

    // 风险评估
    const riskAssessment = analyzer.estimateRiskChange({
      tableName: 'source',
      fieldName: 'raw_field',
      changeType: 'DELETE',
    })

    assert.equal(riskAssessment.level, 'HIGH')
    assert.ok(riskAssessment.score >= 80)
    assert.ok(riskAssessment.reasons.length >= 1)
    assert.ok(riskAssessment.affectedObjects >= 3)
  })

  it('风险等级正确分级', () => {
    const tracker = createDataLineageTracker()
    const analyzer = new ImpactAnalyzer(tracker)

    // LOW: 无下游
    const lowRisk = analyzer.estimateRiskChange({
      tableName: 'isolated',
      fieldName: 'field',
      changeType: 'TYPE_CHANGE',
    })
    assert.equal(lowRisk.level, 'LOW')

    // MEDIUM: 少量下游
    tracker.trackField('mid', 'field', makeFieldRef('low', 'field'))
    analyzer.registerDashboard({
      dashboardId: 'mid-dash',
      dashboardName: 'Medium Dashboard',
      fields: [makeFieldRef('mid', 'field')],
    })

    const mediumRisk = analyzer.estimateRiskChange({
      tableName: 'low',
      fieldName: 'field',
      changeType: 'TYPE_CHANGE',
    })
    assert.equal(mediumRisk.level, 'MEDIUM')
  })

  it('影响分析包含上游和下游字段', () => {
    const tracker = createDataLineageTracker()
    const analyzer = new ImpactAnalyzer(tracker)

    // 构建完整血缘
    tracker.trackField('B', 'field', makeFieldRef('A', 'field'))
    tracker.trackField('C', 'field', makeFieldRef('B', 'field'))

    const impact = analyzer.analyzeImpact('B', 'field')

    assert.ok(Array.isArray(impact.upstreamFields))
    assert.ok(Array.isArray(impact.downstreamFields))
    assert.ok(impact.upstreamFields.length >= 1)
    assert.ok(impact.downstreamFields.length >= 1)
  })
})

describe('影响分析与风险评估 — 异常路径', () => {
  it('未注册的API返回空数组', () => {
    const tracker = createDataLineageTracker()
    const analyzer = new ImpactAnalyzer(tracker)

    const apis = analyzer.getAffectedAPIs(makeFieldRef('unknown', 'field'))
    assert.ok(Array.isArray(apis))
    assert.equal(apis.length, 0)
  })

  it('未注册的仪表板返回空数组', () => {
    const tracker = createDataLineageTracker()
    const analyzer = new ImpactAnalyzer(tracker)

    const dashboards = analyzer.getAffectedDashboards(makeFieldRef('unknown', 'field'))
    assert.ok(Array.isArray(dashboards))
    assert.equal(dashboards.length, 0)
  })
})

// ─────────────────────────────────────────────────────────────
// 3. 敏感数据合规 E2E 测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('敏感数据合规 E2E — 成功路径', () => {
  it('敏感字段自动分类', () => {
    const classifier = createSensitiveDataClassifier()

    // 测试 PII 分类
    const phone = classifier.classifyField('users', 'phone_number')
    assert.equal(phone.category, 'PII')
    assert.equal(phone.level, 'restricted')

    // 测试财务数据分类
    const creditCard = classifier.classifyField('payments', 'credit_card_number')
    assert.equal(creditCard.category, 'FINANCIAL')
    assert.equal(creditCard.level, 'restricted')

    // 测试健康数据分类
    const health = classifier.classifyField('medical', 'diagnosis')
    assert.equal(health.category, 'HEALTH')
    assert.equal(health.level, 'restricted')

    // 测试凭证分类
    const password = classifier.classifyField('auth', 'password')
    assert.equal(password.category, 'CREDENTIAL')
    assert.equal(password.level, 'restricted')
  })

  it('数据流监控 → 暴露风险检测', () => {
    const monitor = createDataFlowMonitor()

    // 追踪数据流
    monitor.trackFlow('users', 'reports', 'email', 'foreign_key')
    monitor.trackFlow('users', 'exports', 'phone_number', 'export')

    // 检测暴露风险
    const riskEmail = monitor.detectSensitiveFieldExposure('email')
    assert.equal(riskEmail.riskLevel, 'high')

    // phone_number 匹配暴露模式（无 _hash/_mask 后缀）
    const riskPhone = monitor.detectSensitiveFieldExposure('phone_number')
    assert.ok(riskPhone.exposed)
    assert.equal(riskPhone.riskLevel, 'high')
  })

  it('GDPR报告生成', () => {
    const classifier = createSensitiveDataClassifier()
    const monitor = createDataFlowMonitor()
    const reporter = new ComplianceReporter(classifier, monitor)

    // 分类敏感字段
    classifier.classifyField('customers', 'email')
    classifier.classifyField('customers', 'phone')
    classifier.classifyField('payments', 'credit_card')

    // 追踪数据流
    monitor.trackFlow('customers', 'reports', 'email', 'foreign_key')

    // 生成报告
    const report = reporter.generateGDPRReport()

    assert.ok(report.generatedAt instanceof Date)
    assert.ok(report.piiFields.length >= 2)
    assert.ok(report.dataFlows.length >= 1)
    assert.ok(typeof report.dataSubjects === 'number')
    assert.equal(report.compliant, true) // 无问题
  })

  it('敏感字段暴露触发实时告警', () => {
    const monitor = createDataFlowMonitor()

    let alertTriggered = false
    let alertField = ''

    // 注册告警回调
    monitor.registerAlertCallback((risk: ExposureRisk) => {
      alertTriggered = true
      alertField = risk.fieldKey
    })

    // 触发告警
    monitor.alertIfExposed('phone_number')

    assert.equal(alertTriggered, true)
    assert.equal(alertField, 'phone_number')
  })
})

describe('敏感数据合规 E2E — 异常路径', () => {
  it('非敏感字段不触发告警', () => {
    const monitor = createDataFlowMonitor()

    let alertTriggered = false
    monitor.registerAlertCallback(() => {
      alertTriggered = true
    })

    monitor.alertIfExposed('product_name')

    assert.equal(alertTriggered, false)
  })

  it('未分类字段返回 null', () => {
    const classifier = createSensitiveDataClassifier()

    const result = classifier.getClassification('unknown', 'field')
    assert.equal(result, null)
  })

  it('GDPR报告列出所有问题', () => {
    const classifier = createSensitiveDataClassifier()
    const monitor = createDataFlowMonitor()
    const reporter = new ComplianceReporter(classifier, monitor)

    // 分类但设置为低级别（应产生问题）
    // 使用 id_card 字段名会匹配 PII 模式
    classifier.classifyField('users', 'id_card_number')
    // 手动降低级别
    classifier.updateClassification('users', 'id_card_number', 'internal')

    const report = reporter.generateGDPRReport()

    assert.ok(report.issues.length >= 1)
    assert.equal(report.compliant, false)
  })

  it('手动更新分类覆盖自动分类', () => {
    const classifier = createSensitiveDataClassifier()

    // 自动分类为 restricted
    classifier.classifyField('users', 'phone')
    const autoClassified = classifier.getClassification('users', 'phone')
    assert.equal(autoClassified!.level, 'restricted')

    // 手动降级
    classifier.updateClassification('users', 'phone', 'internal')
    const manuallyUpdated = classifier.getClassification('users', 'phone')
    assert.equal(manuallyUpdated!.level, 'internal')
    assert.equal(manuallyUpdated!.autoClassified, false)
  })
})
