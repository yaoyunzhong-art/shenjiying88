/**
 * lineage.controller.spec.ts — 数据血缘控制器单元测试 (spec)
 *
 * 覆盖：
 * - 所有路由路径元数据
 * - 字段血缘：注册、边缘添加、血缘追溯、影响分析
 * - 敏感数据分类：自动分类、批量分类、查询、更新
 * - 数据流监控：追踪数据流、传输注册、报告与风险
 * - 合规报告：生成报告、分数、违规项
 * - 异常流程：未注册字段、无效级别、不存在的 ID
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { HttpException } from '@nestjs/common'
import { LineageController } from './lineage.controller'
import { DataLineageTracker, ImpactAnalyzer } from './data-lineage.service'
import {
  SensitiveDataClassifier,
  DataFlowMonitor,
  ComplianceReporter,
} from './sensitive-data.service'

describe('LineageController (spec)', () => {
  let controller: LineageController
  let tracker: DataLineageTracker
  let impactAnalyzer: ImpactAnalyzer
  let classifier: SensitiveDataClassifier
  let flowMonitor: DataFlowMonitor
  let complianceReporter: ComplianceReporter

  beforeEach(() => {
    tracker = new DataLineageTracker()
    impactAnalyzer = new ImpactAnalyzer(tracker)
    classifier = new SensitiveDataClassifier()
    flowMonitor = new DataFlowMonitor()
    complianceReporter = new ComplianceReporter(classifier, flowMonitor)
    controller = new LineageController(
      tracker,
      impactAnalyzer,
      classifier,
      flowMonitor,
      complianceReporter,
    )
  })

  // ==================== 路由元数据 ====================

  describe('route metadata', () => {
    it('controller path metadata 应为 lineage', () => {
      const path = Reflect.getMetadata('path', LineageController)
      expect(path).toBe('lineage')
    })
  })

  // ==================== 字段血缘 ====================

  describe('POST /lineage/fields/register', () => {
    it('should register a field successfully', () => {
      const result = controller.registerField({ tableName: 'users', fieldName: 'email' })
      expect(result.success).toBe(true)
    })

    it('should register multiple fields without error', () => {
      controller.registerField({ tableName: 'users', fieldName: 'email' })
      controller.registerField({ tableName: 'users', fieldName: 'phone' })
      controller.registerField({ tableName: 'orders', fieldName: 'amount' })
      const graph = controller.getFullGraph()
      expect(graph.data).toBeDefined()
    })
  })

  describe('POST /lineage/edges', () => {
    it('should register an edge successfully', () => {
      controller.registerField({ tableName: 'src', fieldName: 'f1' })
      controller.registerField({ tableName: 'dst', fieldName: 'f1' })
      const result = controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'src', fieldName: 'f1' },
        to: { tableName: 'dst', fieldName: 'f1' },
      })
      expect(result.success).toBe(true)
    })

    it('should register a TRANSFORM edge', () => {
      controller.registerField({ tableName: 'raw', fieldName: 'amount_usd' })
      controller.registerField({ tableName: 'report', fieldName: 'amount_cny' })
      const result = controller.registerEdge({
        type: 'TRANSFORM',
        from: { tableName: 'raw', fieldName: 'amount_usd' },
        to: { tableName: 'report', fieldName: 'amount_cny' },
        transform: 'amount_usd * 7.2',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('GET /lineage/lineage/:table/:field', () => {
    it('should return upstream lineage', () => {
      controller.registerField({ tableName: 'users', fieldName: 'email' })
      controller.registerField({ tableName: 'analytics', fieldName: 'email' })
      controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'analytics', fieldName: 'email' },
      })
      const result = controller.getLineage('users', 'email')
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should return upstream array for registered field', () => {
      controller.registerField({ tableName: 'standalone', fieldName: 'val' })
      const result = controller.getLineage('standalone', 'val')
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      // registerField registers with __system__ source, so upstream has 1 entry
    })
  })

  describe('GET /lineage/downstream/:table/:field', () => {
    it('should return downstream fields', () => {
      controller.registerField({ tableName: 'users', fieldName: 'email' })
      controller.registerField({ tableName: 'profile', fieldName: 'email' })
      controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'profile', fieldName: 'email' },
      })
      const result = controller.getDownstream('users', 'email')
      expect(result.success).toBe(true)
      expect(result.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('POST /lineage/impact', () => {
    it('should analyze impact for a field with downstream', () => {
      controller.registerField({ tableName: 'users', fieldName: 'email' })
      controller.registerField({ tableName: 'profile', fieldName: 'email' })
      controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'profile', fieldName: 'email' },
      })
      const result = controller.analyzeImpact({ field: { tableName: 'users', fieldName: 'email' } })
      expect(result.success).toBe(true)
      expect((result as any).data).toBeDefined()
      expect((result as any).data.riskLevel).toBeDefined()
    })
  })

  describe('GET /lineage/graph', () => {
    it('should return full graph structure', () => {
      controller.registerField({ tableName: 'a', fieldName: 'x' })
      controller.registerField({ tableName: 'b', fieldName: 'x' })
      controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'a', fieldName: 'x' },
        to: { tableName: 'b', fieldName: 'x' },
      })
      controller.registerField({ tableName: 'a', fieldName: 'y' })
      const result = controller.getFullGraph()
      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty('upstream')
      expect(result.data).toHaveProperty('downstream')
      expect(result.data).toHaveProperty('nodeCount')
      // No edges means upstream/downstream on empty query returns []
      expect(Array.isArray(result.data!.upstream)).toBe(true)
      expect(Array.isArray(result.data!.downstream)).toBe(true)
    })
  })

  // ==================== 敏感数据分类 ====================

  describe('POST /lineage/classify', () => {
    it('should auto-classify phone field as PII', () => {
      const result = controller.classifyField({ tableName: 'users', fieldName: 'phone_number' })
      expect(result.success).toBe(true)
      expect((result.data as any).category).toBe('PII')
    })

    it('should auto-classify credit card as FINANCIAL', () => {
      const result = controller.classifyField({ tableName: 'pay', fieldName: 'credit_card_no' })
      expect(result.success).toBe(true)
      expect((result.data as any).category).toBe('FINANCIAL')
    })

    it('should classify non-sensitive field as NONE', () => {
      const result = controller.classifyField({ tableName: 'audit', fieldName: 'created_at' })
      expect(result.success).toBe(true)
      expect((result.data as any).category).toBe('NONE')
    })
  })

  describe('POST /lineage/classify/batch', () => {
    it('should classify multiple fields in batch', () => {
      const result = controller.classifyFieldBatch([
        { tableName: 'u', fieldName: 'phone' },
        { tableName: 'u', fieldName: 'email' },
        { tableName: 'u', fieldName: 'created_at' },
      ])
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(3)
    })

    it('should still return fields even if empty array', () => {
      const result = controller.classifyFieldBatch([])
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })
  })

  describe('GET /lineage/classify/:table/:field', () => {
    it('should return classification after classifying', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'email_address' })
      const result = controller.getClassification('users', 'email_address')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect((result.data as any).fieldName).toBe('email_address')
    })

    it('should throw 404 for unclassified field', () => {
      expect(() => controller.getClassification('unknown', 'nothing')).toThrow(HttpException)
      try {
        controller.getClassification('unknown', 'nothing')
      } catch (e) {
        expect(e instanceof HttpException).toBe(true)
        expect((e as HttpException).getStatus()).toBe(404)
      }
    })
  })

  describe('POST /lineage/classify/update', () => {
    it('should update classification level manually', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'name' })
      const result = controller.updateClassification({
        tableName: 'users',
        fieldName: 'name',
        level: 'restricted',
      })
      expect(result.success).toBe(true)
      expect((result.data as any).level).toBe('restricted')
      expect((result.data as any).autoClassified).toBe(false)
    })

    it('should reject invalid level value', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'name' })
      expect(() =>
        controller.updateClassification({
          tableName: 'users',
          fieldName: 'name',
          level: 'invalid-level',
        }),
      ).toThrow(HttpException)
    })
  })

  describe('GET /lineage/classify/sensitive/:table', () => {
    it('should return only sensitive fields for a table', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'email_address' })
      controller.classifyField({ tableName: 'users', fieldName: 'created_at' })
      controller.classifyField({ tableName: 'users', fieldName: 'phone' })
      const result = controller.listSensitiveFields('users')
      expect(result.success).toBe(true)
      const items = result.data as any[]
      expect(items.every((f: any) => f.category !== 'NONE')).toBe(true)
    })

    it('should return empty array for table with no sensitive fields', () => {
      controller.classifyField({ tableName: 'logs', fieldName: 'created_at' })
      const result = controller.listSensitiveFields('logs')
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })
  })

  describe('GET /lineage/classify/all', () => {
    it('should return all classifications across tables', () => {
      controller.classifyField({ tableName: 'a', fieldName: 'email' })
      controller.classifyField({ tableName: 'b', fieldName: 'phone' })
      const result = controller.getAllClassifications()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  // ==================== 数据流监控 ====================

  describe('POST /lineage/flows/track', () => {
    it('should track a data flow edge', () => {
      const result = controller.trackDataFlow({
        fromTable: 'source',
        fromField: 'email',
        toTable: 'target',
        toField: 'user_email',
        via: 'etl',
      })
      expect(result.success).toBe(true)
    })

    it('should track multiple flows independently', () => {
      controller.trackDataFlow({ fromTable: 'a', fromField: 'f1', toTable: 'b', toField: 'f1', via: 'sync' })
      controller.trackDataFlow({ fromTable: 'b', fromField: 'f1', toTable: 'c', toField: 'f1', via: 'sync' })
      const report = controller.getDataFlowReport()
      expect(report.success).toBe(true)
    })
  })

  describe('POST /lineage/flows/transfer', () => {
    it('should register a transfer', () => {
      const result = controller.registerTransfer({
        sourceField: 'old_email',
        targetField: 'new_email',
        table: 'users_migrated',
        operation: 'insert',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('GET /lineage/flows/report', () => {
    it('should generate data flow report with tracked flows', () => {
      controller.trackDataFlow({
        fromTable: 'orders',
        fromField: 'amount',
        toTable: 'reports',
        toField: 'revenue',
        via: 'etl_job',
      })
      const result = controller.getDataFlowReport()
      expect(result.success).toBe(true)
    })

    it('should return report even with no flows tracked', () => {
      const result = controller.getDataFlowReport()
      expect(result.success).toBe(true)
    })
  })

  describe('GET /lineage/flows/risks', () => {
    it('should analyze exposure risks', () => {
      const result = controller.getExposureRisks()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should return risk array that is not undefined', () => {
      const result = controller.getExposureRisks()
      result.data.forEach((risk: any) => {
        expect(risk).toHaveProperty('riskLevel')
        expect(risk).toHaveProperty('exposed')
      })
    })
  })

  // ==================== 合规报告 ====================

  describe('GET /lineage/compliance/report', () => {
    it('should generate compliance report with classified fields', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'email' })
      controller.classifyField({ tableName: 'users', fieldName: 'phone' })
      const result = controller.generateComplianceReport()
      expect(result.success).toBe(true)
      expect(Array.isArray((result.data as any).piiFields)).toBe(true)
      expect((result.data as any).piiFields.length).toBeGreaterThanOrEqual(2)
    })

    it('should have piiFields and issues arrays', () => {
      controller.classifyField({ tableName: 'u', fieldName: 'email' })
      const result = controller.generateComplianceReport()
      const data = result.data as any
      expect(Array.isArray(data.piiFields)).toBe(true)
      expect(Array.isArray(data.issues)).toBe(true)
    })
  })

  describe('GET /lineage/compliance/score', () => {
    it('should return a numeric compliance score', () => {
      const result = controller.getComplianceScore()
      expect(result.success).toBe(true)
      expect(typeof (result.data as any).score).toBe('number')
    })

    it('should return score between 0 and 100', () => {
      const result = controller.getComplianceScore()
      const score = (result.data as any).score
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('GET /lineage/compliance/violations', () => {
    it('should list compliance violations', () => {
      const result = controller.getViolations()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should return violations for non-public fields', () => {
      // Classify some fields without setting them as restricted
      controller.classifyField({ tableName: 'test', fieldName: 'phone' })
      controller.classifyField({ tableName: 'test', fieldName: 'email' })
      const result = controller.getViolations()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('GET /lineage/compliance/report/:reportId', () => {
    it('should return report with requested ID', () => {
      const result = controller.getReportById('cr-001')
      expect(result.success).toBe(true)
      expect((result.data as any).requestedReportId).toBe('cr-001')
    })

    it('should include generated report fields', () => {
      const result = controller.getReportById('cr-999')
      const data = result.data as any
      expect(data).toHaveProperty('compliant')
      expect(data).toHaveProperty('piiFields')
      expect(data).toHaveProperty('issues')
    })
  })

  // ==================== 边界与异常流程 ====================

  describe('error handling', () => {
    it('should throw HttpException when updating with invalid level', () => {
      expect(() =>
        controller.updateClassification({
          tableName: 'any',
          fieldName: 'any',
          level: 'bogus',
        }),
      ).toThrow(HttpException)
    })

    it('should throw HttpException with 404 for unknown classification', () => {
      try {
        controller.getClassification('no_table', 'no_field')
        expect.fail('should have thrown')
      } catch (e) {
        expect(e instanceof HttpException).toBe(true)
        expect((e as HttpException).getStatus()).toBe(404)
      }
    })

    it('should still classify and retrieve after registration', () => {
      const classified = controller.classifyField({ tableName: 'payments', fieldName: 'credit_card' })
      expect((classified.data as any).category).toBe('FINANCIAL')

      const retrieved = controller.getClassification('payments', 'credit_card')
      expect((retrieved.data as any).category).toBe('FINANCIAL')
    })

    it('should handle full end-to-end flow: register -> edge -> lineage -> classify -> report', () => {
      // Register fields
      controller.registerField({ tableName: 'source', fieldName: 'email' })
      controller.registerField({ tableName: 'dest', fieldName: 'email' })
      controller.registerField({ tableName: 'dest', fieldName: 'name' })

      // Create edge
      controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'source', fieldName: 'email' },
        to: { tableName: 'dest', fieldName: 'email' },
      })

      // Trace lineage
      const lineage = controller.getLineage('source', 'email')
      expect(lineage.success).toBe(true)

      // Classify
      const classified = controller.classifyField({ tableName: 'source', fieldName: 'email' })
      expect((classified.data as any).category).toBe('PII')

      // Track flow
      controller.trackDataFlow({
        fromTable: 'source',
        fromField: 'email',
        toTable: 'dest',
        toField: 'email',
        via: 'etl',
      })

      // Generate compliance report
      const report = controller.generateComplianceReport()
      expect(report.success).toBe(true)

      // Verify flow report has data
      const flowReport = controller.getDataFlowReport()
      expect(flowReport.success).toBe(true)
    })
  })
})
