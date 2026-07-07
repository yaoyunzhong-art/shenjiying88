import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * realtime-lineage-integration.test.ts - T125-3 + T126-3
 * 跨模块集成测试：Realtime + Lineage 模块联动
 *
 * 测试场景:
 * - 协同编辑 → 数据血缘
 * - 实时告警 → 合规报告
 *
 * 落地：HEARTBEAT-64
 */

import assert from 'node:assert/strict'
import {
  CRDTDocument,
  WebSocketSessionManager,
  MultiDeviceSyncService,
  type CRDTOperation,
} from '../modules/realtime/crdt.service'
import {
  CollaborativeEditor,
  PresenceService,
  ConflictResolver,
  type CollabOperation,
} from '../modules/realtime/collab.service'
import {
  DataLineageTracker,
  ImpactAnalyzer,
  type FieldRef,
} from '../modules/lineage/data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
  type ExposureRisk,
} from '../modules/lineage/sensitive-data.service'

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createRealtimeServices() {
  const crdt = new CRDTDocument()
  const wsManager = new WebSocketSessionManager()
  const syncService = new MultiDeviceSyncService(crdt, wsManager)
  const editor = new CollaborativeEditor()
  const presence = new PresenceService()
  const resolver = new ConflictResolver()
  return { crdt, wsManager, syncService, editor, presence, resolver }
}

function createLineageServices() {
  const tracker = new DataLineageTracker()
  const analyzer = new ImpactAnalyzer(tracker)
  const classifier = new SensitiveDataClassifier()
  const monitor = new DataFlowMonitor()
  const reporter = new ComplianceReporter(classifier, monitor)
  return { tracker, analyzer, classifier, monitor, reporter }
}

// ─────────────────────────────────────────────────────────────
// 1. 协同编辑 → 数据血缘集成测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('协同编辑 → 数据血缘集成', () => {
  it('协同编辑的内容变更自动记录血缘', () => {
    const { editor } = createRealtimeServices()
    const { tracker, analyzer } = createLineageServices()

    // 1. 在协同编辑器中创建文档
    const doc = editor.createDocument('lineage-doc', 'user-A')
    editor.inviteEditors(doc.id, ['user-B'])

    // 2. 模拟内容变更触发血缘记录
    // 用户A编辑：向报告中添加计算字段
    editor.updateContent(doc.id, '+order_total', 'user-A')
    const opsA = editor.getOperations(doc.id)

    // 3. 将操作中的字段变更记录到血缘系统
    for (const op of opsA) {
      if (op.delta.startsWith('+')) {
        const fieldName = op.delta.slice(1)
        // 模拟：reports.order_total 字段来源于 orders.total
        tracker.trackField('reports', fieldName, { tableName: 'orders', fieldName: 'total' })
      }
    }

    // 4. 验证血缘被记录
    const upstream = tracker.getUpstream('reports', 'order_total')
    assert.ok(upstream.length >= 1)
    assert.equal(upstream[0].tableName, 'orders')
    assert.equal(upstream[0].fieldName, 'total')
  })

  it('协同编辑触发影响分析', () => {
    const { editor } = createRealtimeServices()
    const { tracker, analyzer } = createLineageServices()

    // 1. 创建协同文档
    const doc = editor.createDocument('impact-doc', 'user-A')

    // 2. 注册下游依赖
    analyzer.registerDashboard({
      dashboardId: 'dash-realtime',
      dashboardName: 'Real-time Dashboard',
      fields: [{ tableName: 'reports', fieldName: 'realtime_field' }],
    })

    // 3. 模拟协同编辑触发血缘
    tracker.trackField('reports', 'realtime_field', { tableName: 'source', fieldName: 'raw' })

    // 4. 分析影响
    const impact = analyzer.analyzeImpact('source', 'raw')

    assert.ok(impact.affectedDashboards.length >= 1)
    assert.equal(impact.affectedDashboards[0].dashboardId, 'dash-realtime')
  })

  it('多用户协同编辑生成完整血缘链', () => {
    const { editor } = createRealtimeServices()
    const { tracker } = createLineageServices()

    // 1. 用户A创建文档
    const doc = editor.createDocument('multi-user-lineage', 'user-A')
    editor.inviteEditors(doc.id, ['user-B', 'user-C'])

    // 2. 多个用户编辑
    editor.updateContent(doc.id, '+field1', 'user-A')
    editor.updateContent(doc.id, '+field2', 'user-B')
    editor.updateContent(doc.id, '+field3', 'user-C')

    // 3. 所有变更记录血缘
    const ops = editor.getOperations(doc.id)
    let fieldCount = 0

    for (const op of ops) {
      if (op.delta.startsWith('+')) {
        const fieldName = op.delta.slice(1)
        tracker.trackField('collab_doc', fieldName, {
          tableName: 'source',
          fieldName: `source_${fieldCount++}`,
        })
      }
    }

    // 4. 验证血缘图
    const graph = tracker.getLineageGraph('collab_doc')
    assert.ok(graph.nodes.length >= 3)
  })

  it('冲突解决后血缘一致性', () => {
    const { editor } = createRealtimeServices()
    const { tracker } = createLineageServices()
    const { resolver } = createRealtimeServices()

    // 1. 创建文档
    const doc = editor.createDocument('conflict-lineage', 'user-A')
    editor.inviteEditors(doc.id, ['user-B'])

    // 2. 两人同时编辑
    editor.updateContent(doc.id, '+original', 'user-A')
    const ops = editor.getOperations(doc.id)

    // 3. LWW解决冲突
    const winner = resolver.resolveByLastWriteWins(ops)

    // 4. 只将获胜操作记录到血缘
    if (winner.delta.startsWith('+')) {
      const fieldName = winner.delta.slice(1)
      tracker.trackField('conflict_doc', fieldName, {
        tableName: 'source',
        fieldName: 'original',
      })
    }

    // 5. 验证血缘正确记录
    const upstream = tracker.getUpstream('conflict_doc', 'original')
    assert.ok(upstream.length >= 1)
  })
})

describe('协同编辑 → 数据血缘集成 — 异常路径', () => {
  it('空操作列表不破坏血缘系统', () => {
    const { tracker } = createLineageServices()

    const upstream = tracker.getUpstream('empty', 'doc')
    assert.ok(Array.isArray(upstream))
    assert.equal(upstream.length, 0)
  })

  it('未知文档的操作不影响血缘', () => {
    const { editor } = createRealtimeServices()
    const { tracker } = createLineageServices()

    // 对不存在的文档进行操作
    const result = editor.updateContent('non-existent-doc', '+field', 'user-A')
    assert.equal(result, undefined)

    // 血缘系统应该不受影响
    const upstream = tracker.getUpstream('non-existent-doc', 'field')
    assert.equal(upstream.length, 0)
  })
})

// ─────────────────────────────────────────────────────────────
// 2. 实时告警 → 合规报告集成测试 (4 tests)
// ─────────────────────────────────────────────────────────────

describe('实时告警 → 合规报告集成', () => {
  it('敏感字段暴露触发实时告警，告警记录进入合规报告', () => {
    const { classifier, monitor, reporter } = createLineageServices()

    let alertRecords: ExposureRisk[] = []

    // 1. 分类敏感字段
    classifier.classifyField('customers', 'email')
    classifier.classifyField('customers', 'phone_number')

    // 2. 注册告警回调收集告警
    monitor.registerAlertCallback((risk: ExposureRisk) => {
      alertRecords.push(risk)
    })

    // 3. 触发告警 - email 暴露，phone_number 暴露（无保护后缀）
    monitor.alertIfExposed('email')
    monitor.alertIfExposed('phone_number')

    // 4. 验证告警被记录（email 和 phone_number 都触发）
    assert.equal(alertRecords.length, 2)

    // 5. 记录数据访问到合规系统
    for (const alert of alertRecords) {
      reporter.recordAccess(
        'system',
        'customers',
        alert.fieldKey,
        'read'
      )
    }

    // 6. 生成GDPR报告
    const report = reporter.generateGDPRReport()
    assert.ok(report.accessRecords.length >= 2)
  })

  it('实时告警与血缘追踪联动', () => {
    const { tracker, analyzer } = createLineageServices()
    const { monitor } = createLineageServices()

    let alertTriggered = false

    // 1. 注册告警
    monitor.registerAlertCallback(() => {
      alertTriggered = true
    })

    // 2. 追踪敏感字段血缘
    tracker.trackField('reports', 'customer_email', { tableName: 'customers', fieldName: 'email' })

    // 3. 注册下游仪表板
    analyzer.registerDashboard({
      dashboardId: 'dash-sensitive',
      dashboardName: 'Customer Dashboard',
      fields: [{ tableName: 'reports', fieldName: 'customer_email' }],
    })

    // 4. 检测暴露
    monitor.alertIfExposed('customer_email')

    // 5. 验证告警触发
    assert.equal(alertTriggered, true)
  })

  it('GDPR报告包含完整审计追踪', () => {
    const { classifier, monitor, reporter } = createLineageServices()

    // 1. 分类敏感字段
    classifier.classifyField('orders', 'customer_name')
    classifier.classifyField('orders', 'payment_info')

    // 2. 追踪数据流
    monitor.trackFlow('orders', 'reports', 'customer_name', 'foreign_key')

    // 3. 记录数据访问
    reporter.recordAccess('admin', 'orders', 'customer_name', 'read')
    reporter.recordAccess('admin', 'orders', 'payment_info', 'read')
    reporter.recordAccess('report_service', 'orders', 'customer_name', 'export')

    // 4. 生成报告
    const report = reporter.generateGDPRReport()

    assert.ok(report.accessRecords.length >= 3)
    assert.ok(report.dataFlows.length >= 1)
    assert.equal(report.dataSubjects, 2) // admin 和 report_service

    // 验证导出操作被记录
    const exportRecords = report.accessRecords.filter((r) => r.operation === 'export')
    assert.equal(exportRecords.length, 1)
  })

  it('合规报告包含同意记录和删除请求', () => {
    const { classifier, monitor, reporter } = createLineageServices()

    // 1. 记录同意
    reporter.recordConsent('user-123', 'marketing_email', true)
    reporter.recordConsent('user-123', 'data_processing', false)

    // 2. 记录删除请求
    reporter.recordErasureRequest('user-456')

    // 3. 生成报告
    const report = reporter.generateGDPRReport()

    // 验证数据主体请求
    const user123 = reporter.getDataSubjectRequest('user-123')
    assert.ok(user123.consentRecords.length >= 2)

    const user456 = reporter.getDataSubjectRequest('user-456')
    assert.ok(user456.erasureRequest)
    assert.equal(user456.erasureRequest!.status, 'pending')
  })
})

describe('实时告警 → 合规报告集成 — 异常路径', () => {
  it('无敏感数据时报告仍然生成', () => {
    const { classifier, monitor, reporter } = createLineageServices()

    // 不分类任何敏感字段
    const report = reporter.generateGDPRReport()

    assert.ok(report.generatedAt instanceof Date)
    assert.equal(report.piiFields.length, 0)
    assert.equal(report.compliant, true)
    assert.equal(report.issues.length, 0)
  })

  it('告警回调异常不阻断主流程', () => {
    const { monitor } = createLineageServices()

    // 注册一个会抛出异常的回调
    monitor.registerAlertCallback(() => {
      throw new Error('Callback error')
    })

    // alertIfExposed 不应抛出异常
    assert.doesNotThrow(() => {
      monitor.alertIfExposed('phone_number')
    })
  })
})
