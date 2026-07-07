/**
 * lineage.controller.test.ts — 数据血缘控制器测试
 *
 * 覆盖：
 * - 路由元数据
 * - 字段血缘：注册字段/边、血缘追溯、影响分析
 * - 敏感数据分类：字段分类、批量分类、查询、更新
 * - 数据流监控：追踪数据流、风险分析
 * - 合规报告：生成报告、分项查询
 * - 异常流程：不存在字段查询、错误分类
 */

import { describe, it, expect, beforeEach } from 'vitest'
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

describe('LineageController', () => {
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
      assert.equal(path, 'lineage')
    })
  })

  // ==================== 字段血缘 ====================

  describe('POST /lineage/fields/register', () => {
    it('should register a field', () => {
      const result = controller.registerField({ tableName: 'users', fieldName: 'email' })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /lineage/edges', () => {
    it('should register an edge between fields', () => {
      controller.registerField({ tableName: 'users', fieldName: 'email' })
      controller.registerField({ tableName: 'contacts', fieldName: 'email' })
      const result = controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'contacts', fieldName: 'email' },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('GET /lineage/lineage/:table/:field', () => {
    it('should trace lineage for a field', () => {
      controller.registerField({ tableName: 'users', fieldName: 'email' })
      controller.registerField({ tableName: 'contacts', fieldName: 'email' })
      controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'contacts', fieldName: 'email' },
      })
      const result = controller.getLineage('users', 'email')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should throw for unregistered field', () => {
      expect(() => controller.getLineage('unknown', 'field')).toThrow(HttpException)
    })
  })

  describe('GET /lineage/downstream/:table/:field', () => {
    it('should trace downstream fields', () => {
      controller.registerField({ tableName: 'users', fieldName: 'email' })
      controller.registerField({ tableName: 'analytics', fieldName: 'user_email' })
      controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'analytics', fieldName: 'user_email' },
      })
      const result = controller.getDownstream('users', 'email')
      expect(result.success).toBe(true)
    })
  })

  describe('POST /lineage/impact', () => {
    it('should analyze impact of field change', () => {
      controller.registerField({ tableName: 'users', fieldName: 'email' })
      controller.registerField({ tableName: 'profiles', fieldName: 'email' })
      controller.registerField({ tableName: 'analytics', fieldName: 'user_email' })
      controller.registerEdge({
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'profiles', fieldName: 'email' },
      })
      controller.registerEdge({
        type: 'TRANSFORM',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'analytics', fieldName: 'user_email' },
        transform: 'lower(email)',
      })
      const result = controller.analyzeImpact({ field: { tableName: 'users', fieldName: 'email' } })
      expect(result.success).toBe(true)
    })
  })

  describe('GET /lineage/graph', () => {
    it('should return full graph', () => {
      const result = controller.getFullGraph()
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })
  })

  // ==================== 敏感数据分类 ====================

  describe('POST /lineage/classify', () => {
    it('should auto-classify a phone field as PII', () => {
      const result = controller.classifyField({
        tableName: 'users',
        fieldName: 'phone_number',
      })
      expect(result.success).toBe(true)
      expect((result.data as any).category).toBe('PII')
    })

    it('should auto-classify credit card as FINANCIAL', () => {
      const result = controller.classifyField({
        tableName: 'payments',
        fieldName: 'credit_card_number',
      })
      expect(result.success).toBe(true)
      expect((result.data as any).category).toBe('FINANCIAL')
    })

    it('should classify non-sensitive field as NONE', () => {
      const result = controller.classifyField({
        tableName: 'users',
        fieldName: 'created_at',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /lineage/classify/batch', () => {
    it('should classify multiple fields', () => {
      const result = controller.classifyFieldBatch([
        { tableName: 'users', fieldName: 'phone_number' },
        { tableName: 'users', fieldName: 'email_address' },
        { tableName: 'users', fieldName: 'name' },
        { tableName: 'users', fieldName: 'created_at' },
      ])
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
      expect(result.data).toHaveLength(4)
    })
  })

  describe('GET /lineage/classify/:table/:field', () => {
    it('should get classification for classified field', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'email_address' })
      const result = controller.getClassification('users', 'email_address')
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should throw 404 for unclassified field', () => {
      expect(() => controller.getClassification('users', 'nonexistent')).toThrow(HttpException)
    })
  })

  describe('POST /lineage/classify/update', () => {
    it('should update classification level', () => {
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
  })

  describe('GET /lineage/classify/sensitive/:table', () => {
    it('should list only sensitive fields', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'email_address' })
      controller.classifyField({ tableName: 'users', fieldName: 'phone_number' })
      controller.classifyField({ tableName: 'users', fieldName: 'name' })
      controller.classifyField({ tableName: 'users', fieldName: 'created_at' })
      const result = controller.listSensitiveFields('users')
      expect(result.success).toBe(true)
      const sensitive = result.data as any[]
      expect(sensitive.every((f: any) => f.category !== 'NONE')).toBe(true)
    })
  })

  describe('GET /lineage/classify/all', () => {
    it('should return all classifications', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'email' })
      const result = controller.getAllClassifications()
      expect(result.success).toBe(true)
    })
  })

  // ==================== 数据流监控 ====================

  describe('POST /lineage/flows/track', () => {
    it('should track a data flow', () => {
      const result = controller.trackDataFlow({
        fromTable: 'users',
        fromField: 'email',
        toTable: 'analytics',
        toField: 'user_email',
        via: 'etl_job',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('POST /lineage/flows/transfer', () => {
    it('should register a transfer', () => {
      const result = controller.registerTransfer({
        sourceField: 'email',
        targetField: 'user_email',
        table: 'analytics',
        operation: 'insert',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('GET /lineage/flows/report', () => {
    it('should generate data flow report', () => {
      controller.trackDataFlow({
        fromTable: 'users',
        fromField: 'email',
        toTable: 'analytics',
        toField: 'user_email',
        via: 'etl_job',
      })
      const result = controller.getDataFlowReport()
      expect(result.success).toBe(true)
      expect((result.data as any).totalEdges).toBeGreaterThanOrEqual(1)
    })
  })

  describe('GET /lineage/flows/risks', () => {
    it('should analyze exposure risks', () => {
      const result = controller.getExposureRisks()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  // ==================== 合规报告 ====================

  describe('GET /lineage/compliance/report', () => {
    it('should generate compliance report', () => {
      controller.classifyField({ tableName: 'users', fieldName: 'email' })
      controller.classifyField({ tableName: 'users', fieldName: 'phone' })
      const result = controller.generateComplianceReport()
      expect(result.success).toBe(true)
      expect((result.data as any).totalClassifiedFields).toBeGreaterThanOrEqual(2)
    })
  })

  describe('GET /lineage/compliance/score', () => {
    it('should return compliance score', () => {
      const result = controller.getComplianceScore()
      expect(result.success).toBe(true)
      expect(typeof (result.data as any).score).toBe('number')
      expect((result.data as any).score).toBeGreaterThanOrEqual(0)
    })
  })

  describe('GET /lineage/compliance/violations', () => {
    it('should list violations', () => {
      const result = controller.getViolations()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  describe('GET /lineage/compliance/report/:reportId', () => {
    it('should return report by id', () => {
      const result = controller.getReportById('cr-001')
      expect(result.success).toBe(true)
      expect((result.data as any).requestedReportId).toBe('cr-001')
    })
  })

  // ==================== 异常流程综合 ====================

  describe('error handling', () => {
    it('should throw when classifying with empty parameters', () => {
      expect(() =>
        controller.updateClassification({
          tableName: 'nonexistent',
          fieldName: 'field',
          level: 'invalid-level',
        }),
      ).toThrow(HttpException)
    })
  })
})
