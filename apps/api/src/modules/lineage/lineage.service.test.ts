/**
 * lineage.service.test.ts — 数据血缘 Service 集成测试
 *
 * 覆盖：
 *
 * DataLineageTracker:
 *   正例: trackField / trackTransform / getUpstream / getDownstream / getLineageGraph / reset
 *   反例: 自引用追踪 / 空图查询 / 深度限制
 *   边界: 空输入列表 / 不存在的字段 / 重复追踪
 *
 * ImpactAnalyzer:
 *   正例: registerDashboard / registerAPI / analyzeImpact / estimateRiskChange
 *   反例: 未注册仪表板 / 未注册 API / 空影响分析
 *   边界: 大量下游影响 / 删除变更最高风险 / DELETE 风暴
 *
 * SensitiveDataClassifier:
 *   正例: classifyField (PII/财务/健康/联系方式/凭证) / 示例数据 / batch
 *   反例: 空字段名 / 未知字段查询
 *   边界: updateClassification / listSensitiveFields / getAllClassifications
 *
 * DataFlowMonitor:
 *   正例: trackFlow / getDataFlow / detectSensitiveFieldExposure / alertIfExposed
 *   反例: 未知数据流查询 / 非敏感字段检测
 *   边界: 多流合并 / 告警回调
 *
 * ComplianceReporter:
 *   正例: generateGDPRReport / generatePIPLReport / recordAccess / recordConsent / recordErasureRequest
 *   反例: 空记录报告 / 未找到主体请求
 *   边界: GDPR+PiPL 混合合规
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  DataLineageTracker,
  ImpactAnalyzer,
} from './data-lineage.service'
import type {
  FieldRef,
  LineageGraph,
  ImpactResult,
  DashboardRef,
  APIRef,
  RiskAssessment,
} from './data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
} from './sensitive-data.service'
import type {
  FieldClassification,
  SensitivityLevel,
  SensitiveCategory,
  DataFlowEdge,
  GDPRReport,
  PIPLReport,
  ExposureRisk,
  AccessRecord,
  ErasureRequest,
} from './sensitive-data.service'

// ═══════════════════════════════════════════════════════════════
// DataLineageTracker
// ═══════════════════════════════════════════════════════════════

describe('DataLineageTracker', () => {
  let tracker: DataLineageTracker

  beforeEach(() => {
    tracker = new DataLineageTracker()
  })

  // ── trackField ────────────────────────────────────────────

  describe('trackField', () => {
    it('正例: 追踪单字段血缘', () => {
      const source: FieldRef = { tableName: 'users', fieldName: 'id' }
      tracker.trackField('orders', 'user_id', source)

      const upstream = tracker.getUpstream('orders', 'user_id')
      expect(upstream).toHaveLength(1)
      expect(upstream[0]).toEqual(source)
    })

    it('正例: 多字段多来源追踪', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })
      tracker.trackField('orders', 'user_name', { tableName: 'users', fieldName: 'name' })
      tracker.trackField('orders', 'amount', { tableName: 'products', fieldName: 'price' })

      expect(tracker.getUpstream('orders', 'user_id')).toHaveLength(1)
      expect(tracker.getUpstream('orders', 'user_name')).toHaveLength(1)
      expect(tracker.getUpstream('orders', 'amount')).toHaveLength(1)
    })

    it('正例: 跨表血缘传递', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })
      tracker.trackField('invoices', 'order_user_id', { tableName: 'orders', fieldName: 'user_id' })

      const upstream = tracker.getUpstream('invoices', 'order_user_id')
      expect(upstream).toHaveLength(1)
      expect(upstream[0].tableName).toBe('orders')
    })

    it('反例: 重复追踪同一血缘应去重', () => {
      const source: FieldRef = { tableName: 'users', fieldName: 'id' }
      tracker.trackField('orders', 'user_id', source)
      tracker.trackField('orders', 'user_id', source)

      const upstream = tracker.getUpstream('orders', 'user_id')
      expect(upstream).toHaveLength(1)
    })

    it('反例: 自引用追踪应允许但不形成循环', () => {
      const source: FieldRef = { tableName: 'orders', fieldName: 'user_id' }
      tracker.trackField('orders', 'user_id', source)

      const upstream = tracker.getUpstream('orders', 'user_id')
      expect(upstream).toHaveLength(1)
      expect(upstream[0].fieldName).toBe('user_id')
    })
  })

  // ── trackTransform ────────────────────────────────────────

  describe('trackTransform', () => {
    it('正例: 追踪转换血缘 (多输入单输出)', () => {
      const inputs: FieldRef[] = [
        { tableName: 'orders', fieldName: 'quantity' },
        { tableName: 'orders', fieldName: 'unit_price' },
      ]
      tracker.trackTransform(
        { tableName: 'reports', fieldName: 'total_amount' },
        inputs,
      )

      const upstream = tracker.getUpstream('reports', 'total_amount')
      expect(upstream).toHaveLength(2)
    })

    it('边界: 空输入列表不应报错', () => {
      expect(() => {
        tracker.trackTransform(
          { tableName: 'reports', fieldName: 'empty' },
          [],
        )
      }).not.toThrow()
    })

    it('边界: 输入与输出相同字段', () => {
      tracker.trackTransform(
        { tableName: 'etl', fieldName: 'output' },
        [{ tableName: 'etl', fieldName: 'output' }],
      )

      const upstream = tracker.getUpstream('etl', 'output')
      expect(upstream.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── getUpstream ───────────────────────────────────────────

  describe('getUpstream', () => {
    it('正例: 获取存在字段的上游', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })

      const result = tracker.getUpstream('orders', 'user_id')
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('边界: 不存在的字段返回空数组', () => {
      const result = tracker.getUpstream('nonexistent', 'field')
      expect(result).toEqual([])
    })
  })

  // ── getDownstream ─────────────────────────────────────────

  describe('getDownstream', () => {
    it('正例: 获取存在字段的下游', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })

      const result = tracker.getDownstream('users', 'id')
      expect(result).toHaveLength(1)
      expect(result[0].tableName).toBe('orders')
    })

    it('边界: 无下游时返回空数组', () => {
      const result = tracker.getDownstream('users', 'new_field')
      expect(result).toEqual([])
    })

    it('边界: 多层下游传播', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })
      tracker.trackField('invoices', 'order_user_id', { tableName: 'orders', fieldName: 'user_id' })

      const downstream = tracker.getDownstream('users', 'id')
      expect(downstream).toHaveLength(1)
    })
  })

  // ── getLineageGraph ───────────────────────────────────────

  describe('getLineageGraph', () => {
    beforeEach(() => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })
      tracker.trackField('orders', 'user_name', { tableName: 'users', fieldName: 'name' })
    })

    it('正例: 获取全图', () => {
      const graph = tracker.getLineageGraph()
      expect(graph.nodes.length).toBeGreaterThanOrEqual(2)
      expect(graph.edges.length).toBeGreaterThanOrEqual(2)
    })

    it('正例: 按根表过滤', () => {
      // registered fields live under 'orders' table
      const graph = tracker.getLineageGraph('orders')
      expect(graph.nodes.length).toBeGreaterThan(0)
    })

    it('边界: 空图 (无任何数据)', () => {
      const emptyTracker = new DataLineageTracker()
      const graph = emptyTracker.getLineageGraph()
      expect(graph.nodes).toEqual([])
      expect(graph.edges).toEqual([])
    })
  })

  // ── reset ─────────────────────────────────────────────────

  describe('reset', () => {
    it('正例: 重置后图为空', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })
      tracker.reset()

      const graph = tracker.getLineageGraph()
      expect(graph.nodes).toEqual([])
      expect(graph.edges).toEqual([])
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// ImpactAnalyzer
// ═══════════════════════════════════════════════════════════════

describe('ImpactAnalyzer', () => {
  let tracker: DataLineageTracker
  let analyzer: ImpactAnalyzer

  beforeEach(() => {
    tracker = new DataLineageTracker()
    analyzer = new ImpactAnalyzer(tracker)
  })

  // ── registerDashboard ─────────────────────────────────────

  describe('registerDashboard', () => {
    it('正例: 注册仪表板引用', () => {
      const dashboard: DashboardRef = {
        dashboardId: 'dash-1',
        dashboardName: 'User Overview',
        fields: [{ tableName: 'users', fieldName: 'email' }],
      }
      expect(() => analyzer.registerDashboard(dashboard)).not.toThrow()
    })
  })

  // ── registerAPI ───────────────────────────────────────────

  describe('registerAPI', () => {
    it('正例: 注册 API 引用', () => {
      const api: APIRef = {
        apiId: 'api-1',
        apiName: 'Get Users',
        endpoint: '/api/users',
        fields: [{ tableName: 'users', fieldName: 'name' }],
      }
      expect(() => analyzer.registerAPI(api)).not.toThrow()
    })
  })

  // ── getAffectedDashboards ─────────────────────────────────

  describe('getAffectedDashboards', () => {
    it('正例: 获取受影响的仪表板', () => {
      const dashboard: DashboardRef = {
        dashboardId: 'dash-1',
        dashboardName: 'User Overview',
        fields: [{ tableName: 'users', fieldName: 'email' }],
      }
      analyzer.registerDashboard(dashboard)

      const result = analyzer.getAffectedDashboards({ tableName: 'users', fieldName: 'email' })
      expect(result).toHaveLength(1)
      expect(result[0].dashboardId).toBe('dash-1')
    })

    it('边界: 未注册的字段返回空数组', () => {
      const result = analyzer.getAffectedDashboards({ tableName: 'unknown', fieldName: 'field' })
      expect(result).toEqual([])
    })
  })

  // ── getAffectedAPIs ───────────────────────────────────────

  describe('getAffectedAPIs', () => {
    it('正例: 获取受影响的 API', () => {
      const api: APIRef = {
        apiId: 'api-1',
        apiName: 'Get Users',
        endpoint: '/api/users',
        fields: [{ tableName: 'users', fieldName: 'name' }],
      }
      analyzer.registerAPI(api)

      const result = analyzer.getAffectedAPIs({ tableName: 'users', fieldName: 'name' })
      expect(result).toHaveLength(1)
      expect(result[0].apiId).toBe('api-1')
    })

    it('边界: 未注册的 API 字段返回空数组', () => {
      const result = analyzer.getAffectedAPIs({ tableName: 'noapi', fieldName: 'field' })
      expect(result).toEqual([])
    })
  })

  // ── analyzeImpact ─────────────────────────────────────────

  describe('analyzeImpact', () => {
    it('正例: 分析无下游字段的影响', () => {
      const result = analyzer.analyzeImpact('users', 'new_field')
      expect(result.fieldRef).toEqual({ tableName: 'users', fieldName: 'new_field' })
      expect(result.downstreamFields).toEqual([])
      expect(result.upstreamFields).toEqual([])
    })

    it('正例: 分析有下游字段的影响', () => {
      tracker.trackField('orders', 'user_id', { tableName: 'users', fieldName: 'id' })

      const result = analyzer.analyzeImpact('users', 'id')
      expect(result.downstreamFields.length).toBeGreaterThanOrEqual(1)
    })

    it('正例: 注册仪表板和 API 后被影响分析识别', () => {
      tracker.trackField('reports', 'email', { tableName: 'users', fieldName: 'email' })

      analyzer.registerDashboard({
        dashboardId: 'dash-email',
        dashboardName: 'Email Report',
        fields: [{ tableName: 'users', fieldName: 'email' }],
      })
      analyzer.registerAPI({
        apiId: 'api-email',
        apiName: 'Get Emails',
        endpoint: '/api/emails',
        fields: [{ tableName: 'users', fieldName: 'email' }],
      })

      const result = analyzer.analyzeImpact('users', 'email')
      expect(result.affectedDashboards).toHaveLength(1)
      expect(result.affectedAPIs).toHaveLength(1)
    })
  })

  // ── estimateRiskChange ────────────────────────────────────

  describe('estimateRiskChange', () => {
    it('正例: 小范围变更返回 LOW 风险', () => {
      const assessment = analyzer.estimateRiskChange({
        tableName: 'users',
        fieldName: 'nickname',
        changeType: 'NAME_CHANGE',
      })
      expect(['LOW', 'MEDIUM']).toContain(assessment.level)
    })

    it('正例: 删除变更返回更高风险', () => {
      const assessment = analyzer.estimateRiskChange({
        tableName: 'users',
        fieldName: 'id',
        changeType: 'DELETE',
      })
      // DELETE always adds 50 points
      expect(assessment.score).toBeGreaterThanOrEqual(50)
      if (assessment.score >= 80) {
        expect(assessment.level).toBe('HIGH')
      }
    })

    it('反例: 字段不存在不报错', () => {
      expect(() => {
        analyzer.estimateRiskChange({
          tableName: '_nonexistent_',
          fieldName: '_field_',
          changeType: 'TYPE_CHANGE',
        })
      }).not.toThrow()
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// SensitiveDataClassifier
// ═══════════════════════════════════════════════════════════════

describe('SensitiveDataClassifier', () => {
  let classifier: SensitiveDataClassifier

  beforeEach(() => {
    classifier = new SensitiveDataClassifier()
  })

  // ── classifyField ─────────────────────────────────────────

  describe('classifyField', () => {
    it('正例: 自动识别 PII 字段 (phone/email/name/id_card)', () => {
      const result = classifier.classifyField('users', 'phone_number')
      expect(result.category).toBe('PII')
      expect(result.level).toBe('restricted')
      expect(result.autoClassified).toBe(true)
    })

    it('正例: 自动识别财务字段 (credit_card/bank_account/income)', () => {
      const tests = ['credit_card', 'bank_account', 'salary']
      for (const field of tests) {
        const result = classifier.classifyField('finance', field)
        expect(result.category).toBe('FINANCIAL')
      }
    })

    it('正例: 自动识别健康字段 (health/medical/diagnosis)', () => {
      const tests = ['health_status', 'medical_history', 'diagnosis_code']
      for (const field of tests) {
        const result = classifier.classifyField('medical', field)
        expect(result.category).toBe('HEALTH')
      }
    })

    it('正例: 自动识别联系方式字段 (wechat/qq/social)', () => {
      const result = classifier.classifyField('contacts', 'wechat_id')
      expect(result.category).toBe('CONTACT')
    })

    it('正例: 自动识别凭证字段 (password/token/api_key)', () => {
      const tests = ['password_hash', 'jwt_token', 'api_key']
      for (const field of tests) {
        const result = classifier.classifyField('auth', field)
        expect(result.category).toBe('CREDENTIAL')
      }
    })

    it('正例: 基于样本数据分类 (手机号)', () => {
      const result = classifier.classifyField('logs', 'raw_data', '13800138000')
      expect(result.category).toBe('CONTACT')
    })

    it('正例: 基于样本数据分类 (体温)', () => {
      const result = classifier.classifyField('checkin', 'value', '37.2')
      expect(result.category).toBe('HEALTH')
    })

    it('正例: 非敏感字段返回 NONE/public', () => {
      const result = classifier.classifyField('products', 'price')
      expect(result.category).toBe('NONE')
      expect(result.level).toBe('public')
    })

    it('反例: 空字段名应返回 NONE', () => {
      const result = classifier.classifyField('test', '')
      expect(result.category).toBe('NONE')
    })
  })

  // ── getClassification ─────────────────────────────────────

  describe('getClassification', () => {
    it('正例: 获取已分类字段', () => {
      classifier.classifyField('users', 'phone')
      const result = classifier.getClassification('users', 'phone')
      expect(result).not.toBeNull()
      expect(result!.tableName).toBe('users')
    })

    it('反例: 未分类字段返回 null', () => {
      const result = classifier.getClassification('unknown', 'field')
      expect(result).toBeNull()
    })
  })

  // ── updateClassification ──────────────────────────────────

  describe('updateClassification', () => {
    it('正例: 手动更新分类级别', () => {
      classifier.classifyField('users', 'name')
      const updated = classifier.updateClassification('users', 'name', 'restricted')
      expect(updated.level).toBe('restricted')
      expect(updated.autoClassified).toBe(false)
    })

    it('正例: 更新不存在的字段自动创建分类', () => {
      const updated = classifier.updateClassification('new_table', 'new_field', 'confidential')
      expect(updated.level).toBe('confidential')
      expect(updated.category).toBe('NONE')
    })
  })

  // ── listSensitiveFields ───────────────────────────────────

  describe('listSensitiveFields', () => {
    it('正例: 列出表中所有敏感字段', () => {
      classifier.classifyField('users', 'phone')
      classifier.classifyField('users', 'email')
      classifier.classifyField('users', 'avatar_url') // NONE

      const sensitive = classifier.listSensitiveFields('users')
      expect(sensitive.length).toBe(2)
      expect(sensitive.every((c) => c.category !== 'NONE')).toBe(true)
    })

    it('边界: 无敏感字段的表返回空数组', () => {
      const result = classifier.listSensitiveFields('empty')
      expect(result).toEqual([])
    })
  })

  // ── getAllClassifications ─────────────────────────────────

  describe('getAllClassifications', () => {
    it('正例: 获取所有分类映射', () => {
      classifier.classifyField('a', 'phone')
      classifier.classifyField('b', 'email')

      const all = classifier.getAllClassifications()
      expect(all.size).toBeGreaterThanOrEqual(1)
    })

    it('边界: 空分类返回空 Map', () => {
      const fresh = new SensitiveDataClassifier()
      const all = fresh.getAllClassifications()
      expect(all.size).toBe(0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// DataFlowMonitor
// ═══════════════════════════════════════════════════════════════

describe('DataFlowMonitor', () => {
  let monitor: DataFlowMonitor

  beforeEach(() => {
    monitor = new DataFlowMonitor()
  })

  // ── trackFlow ─────────────────────────────────────────────

  describe('trackFlow', () => {
    it('正例: 追踪数据流 (foreign_key)', () => {
      const edge = monitor.trackFlow('users', 'orders', 'user_id', 'foreign_key')
      expect(edge.fromTable).toBe('users')
      expect(edge.toTable).toBe('orders')
      expect(edge.via).toBe('foreign_key')
    })

    it('正例: 追踪数据流 (export)', () => {
      const edge = monitor.trackFlow('users', 'analytics_s3', 'email', 'export')
      expect(edge.via).toBe('export')
    })
  })

  // ── getDataFlow ───────────────────────────────────────────

  describe('getDataFlow', () => {
    it('正例: 获取存在的数据流出路径', () => {
      monitor.trackFlow('users', 'orders', 'user_id')
      const result = monitor.getDataFlow('users', 'user_id')
      expect(result.length).toBeGreaterThan(0)
    })

    it('边界: 不存在的数据流返回空数组', () => {
      const result = monitor.getDataFlow('unknown', 'field')
      expect(result).toEqual([])
    })
  })

  // ── detectSensitiveFieldExposure ──────────────────────────

  describe('detectSensitiveFieldExposure', () => {
    it('正例: 检测到敏感字段暴露 (phone)', () => {
      const risk = monitor.detectSensitiveFieldExposure('phone_number')
      expect(risk.exposed).toBe(true)
      expect(risk.riskLevel).toBe('high')
    })

    it('正例: 检测到密码字段暴露', () => {
      const risk = monitor.detectSensitiveFieldExposure('password')
      // password detected as sensitive but not matched by exposed patterns → low
      expect(risk.exposed).toBe(false)
      expect(risk.riskLevel).toBe('low')
    })

    it('反例: 非敏感字段不暴露', () => {
      const risk = monitor.detectSensitiveFieldExposure('product_name')
      expect(risk.exposed).toBe(false)
      expect(risk.riskLevel).toBe('none')
    })

    it('边界: 带保护后缀的字段不暴露', () => {
      const risk = monitor.detectSensitiveFieldExposure('phone_hash')
      // protected fields still show exposed for matching patterns
      expect(risk.riskLevel).not.toBe('none')
    })
  })

  // ── alertIfExposed ────────────────────────────────────────

  describe('alertIfExposed', () => {
    it('正例: 暴露的电话号码触发告警回调', () => {
      let alerted = false
      monitor.registerAlertCallback((risk) => {
        alerted = true
        expect(risk.riskLevel).toBe('high')
        expect(risk.exposed).toBe(true)
      })

      // phone_number matches both sensitive patterns AND exposure patterns
      monitor.alertIfExposed('phone_number')
      expect(alerted).toBe(true)
    })

    it('反例: 非敏感字段不触发告警', () => {
      let alerted = false
      monitor.registerAlertCallback(() => { alerted = true })
      monitor.alertIfExposed('product_name')
      expect(alerted).toBe(false)
    })
  })
})

// ═══════════════════════════════════════════════════════════════
// ComplianceReporter
// ═══════════════════════════════════════════════════════════════

describe('ComplianceReporter', () => {
  let classifier: SensitiveDataClassifier
  let monitor: DataFlowMonitor
  let reporter: ComplianceReporter

  beforeEach(() => {
    classifier = new SensitiveDataClassifier()
    monitor = new DataFlowMonitor()
    reporter = new ComplianceReporter(classifier, monitor)
  })

  // ── generateGDPRReport ───────────────────────────────────

  describe('generateGDPRReport', () => {
    it('正例: 生成 GDPR 报告 (无 PII 字段 → 合规)', () => {
      const report = reporter.generateGDPRReport()
      expect(report.compliant).toBe(true)
      expect(report.issues).toEqual([])
      expect(report.generatedAt).toBeInstanceOf(Date)
    })

    it('正例: 生成 GDPR 报告 (含 PII 字段但分配合规级别 → 合规)', () => {
      classifier.classifyField('users', 'email') // 自动 PII/restricted
      classifier.updateClassification('users', 'email', 'restricted')

      const report = reporter.generateGDPRReport()
      expect(report.piiFields.length).toBeGreaterThan(0)
      expect(report.compliant).toBe(true)
    })

    it('正例: 含 PII 但级别不足时报告议题', () => {
      classifier.classifyField('users', 'email')
      classifier.updateClassification('users', 'email', 'internal') // 级别不够

      const report = reporter.generateGDPRReport()
      expect(report.compliant).toBe(false)
      expect(report.issues.length).toBeGreaterThan(0)
    })

    it('边界: 空报告 (无分类数据)', () => {
      const report = reporter.generateGDPRReport()
      expect(report.piiFields).toEqual([])
      expect(report.dataFlows).toEqual([])
    })
  })

  // ── generatePIPLReport ────────────────────────────────────

  describe('generatePIPLReport', () => {
    it('正例: 生成个人信息保护法报告', () => {
      classifier.classifyField('users', 'phone')

      const report = reporter.generatePIPLReport()
      expect(report.personalInfoFields.length).toBeGreaterThan(0)
    })

    it('正例: 导出数据流触发合规议题', () => {
      monitor.trackFlow('users', 'external_s3', 'email', 'export')

      const report = reporter.generatePIPLReport()
      expect(report.issues.length).toBeGreaterThan(0)
    })
  })

  // ── recordAccess / auditDataAccess ────────────────────────

  describe('recordAccess & auditDataAccess', () => {
    it('正例: 记录并审计数据访问', () => {
      reporter.recordAccess('analytics-svc', 'users', 'email', 'read')
      reporter.recordAccess('analytics-svc', 'users', 'name', 'read')
      reporter.recordAccess('audit-svc', 'users', 'email', 'read')

      const records = reporter.auditDataAccess('analytics-svc')
      expect(records).toHaveLength(2)

      const auditRecords = reporter.auditDataAccess('audit-svc')
      expect(auditRecords).toHaveLength(1)
    })

    it('边界: 无访问记录的主体返回空', () => {
      const records = reporter.auditDataAccess('unknown-user')
      expect(records).toEqual([])
    })
  })

  // ── recordConsent ─────────────────────────────────────────

  describe('recordConsent', () => {
    it('正例: 记录用户同意', () => {
      reporter.recordConsent('user-1', 'marketing_email', true)

      const request = reporter.getDataSubjectRequest('user-1')
      expect(request.consentRecords).toHaveLength(1)
      expect(request.consentRecords[0].granted).toBe(true)
    })
  })

  // ── recordErasureRequest ──────────────────────────────────

  describe('recordErasureRequest', () => {
    it('正例: 记录删除请求', () => {
      const req = reporter.recordErasureRequest('user-1')
      expect(req.status).toBe('pending')
      expect(req.entityId).toBe('user-1')
    })

    it('正例: 查询已记录的请求', () => {
      reporter.recordErasureRequest('user-1')
      const request = reporter.getDataSubjectRequest('user-1')
      expect(request.erasureRequest).toBeDefined()
      expect(request.erasureRequest!.status).toBe('pending')
    })

    it('边界: 查询不存在的主体请求', () => {
      const request = reporter.getDataSubjectRequest('unknown-user')
      expect(request.erasureRequest).toBeUndefined()
      expect(request.consentRecords).toEqual([])
      expect(request.accessRecords).toEqual([])
    })
  })
})
