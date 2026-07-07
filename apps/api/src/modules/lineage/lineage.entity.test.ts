/**
 * lineage.entity.test.ts — 数据血缘实体测试
 *
 * 覆盖所有接口和类型的构造及边界情况
 */

import { describe, it, expect } from 'vitest'
import type {
  FieldRef,
  LineageEdge,
  LineageGraph,
  ImpactAnalysis,
  FieldClassification,
  DataFlowEdge,
  ExposureRisk,
  DataFlowReport,
  ComplianceReport,
  ComplianceViolation,
  TransferRecord,
} from './lineage.entity'

describe('lineage entities', () => {
  describe('FieldRef', () => {
    it('should create a valid field reference', () => {
      const ref: FieldRef = { tableName: 'users', fieldName: 'email' }
      expect(ref.tableName).toBe('users')
      expect(ref.fieldName).toBe('email')
    })
  })

  describe('LineageEdge', () => {
    it('should create a DIRECT edge', () => {
      const edge: LineageEdge = {
        type: 'DIRECT',
        from: { tableName: 'users', fieldName: 'email' },
        to: { tableName: 'contacts', fieldName: 'email' },
      }
      expect(edge.type).toBe('DIRECT')
    })

    it('should create a TRANSFORM edge with description', () => {
      const edge: LineageEdge = {
        type: 'TRANSFORM',
        from: { tableName: 'orders', fieldName: 'subtotal' },
        to: { tableName: 'invoices', fieldName: 'total' },
        transform: 'subtotal + tax - discount',
      }
      expect(edge.transform).toContain('tax')
    })
  })

  describe('LineageGraph', () => {
    it('should create a valid graph', () => {
      const graph: LineageGraph = {
        nodes: [
          { tableName: 'users', fieldName: 'email', upstreamCount: 0, downstreamCount: 2 },
          { tableName: 'contacts', fieldName: 'email', upstreamCount: 1, downstreamCount: 0 },
        ],
        edges: [
          {
            type: 'DIRECT',
            from: { tableName: 'users', fieldName: 'email' },
            to: { tableName: 'contacts', fieldName: 'email' },
          },
        ],
      }
      expect(graph.nodes).toHaveLength(2)
      expect(graph.edges).toHaveLength(1)
    })
  })

  describe('ImpactAnalysis', () => {
    it('should capture impact analysis results', () => {
      const analysis: ImpactAnalysis = {
        field: { tableName: 'users', fieldName: 'email' },
        impactedFields: [
          { tableName: 'contacts', fieldName: 'email' },
          { tableName: 'analytics', fieldName: 'user_email' },
        ],
        totalImpactCount: 2,
      }
      expect(analysis.totalImpactCount).toBe(2)
    })

    it('should support empty impact list', () => {
      const analysis: ImpactAnalysis = {
        field: { tableName: 'orphan', fieldName: 'field' },
        impactedFields: [],
        totalImpactCount: 0,
      }
      expect(analysis.impactedFields).toHaveLength(0)
    })
  })

  describe('FieldClassification', () => {
    it('should create auto-classified field', () => {
      const fc: FieldClassification = {
        tableName: 'users',
        fieldName: 'phone_number',
        category: 'PII',
        level: 'confidential',
        autoClassified: true,
        updatedAt: new Date('2026-01-01'),
      }
      expect(fc.category).toBe('PII')
      expect(fc.autoClassified).toBe(true)
    })

    it('should create manually classified field', () => {
      const fc: FieldClassification = {
        tableName: 'users',
        fieldName: 'name',
        category: 'NONE',
        level: 'public',
        autoClassified: false,
        updatedAt: new Date(),
      }
      expect(fc.autoClassified).toBe(false)
    })
  })

  describe('ExposureRisk', () => {
    it('should capture exposure risk details', () => {
      const risk: ExposureRisk = {
        fieldKey: 'users.email',
        category: 'PII',
        level: 'confidential',
        exposureCount: 3,
        downstreamTables: ['analytics', 'crm', 'marketing'],
        remediations: ['Encrypt at rest', 'Audit access'],
      }
      expect(risk.exposureCount).toBe(3)
      expect(risk.remediations).toContain('Encrypt at rest')
    })
  })

  describe('DataFlowReport', () => {
    it('should create a valid report', () => {
      const report: DataFlowReport = {
        totalEdges: 10,
        totalRisks: 3,
        highSeverityRisks: 1,
        risks: [],
        generatedAt: new Date(),
      }
      expect(report.totalEdges).toBe(10)
    })
  })

  describe('ComplianceReport', () => {
    it('should create a compliant report', () => {
      const report: ComplianceReport = {
        reportId: 'cr-001',
        generatedAt: '2026-01-01T00:00:00Z',
        totalClassifiedFields: 50,
        sensitiveFields: 5,
        complianceScore: 85,
        violations: [],
        summary: 'All fields classified correctly',
      }
      expect(report.complianceScore).toBeGreaterThanOrEqual(0)
      expect(report.complianceScore).toBeLessThanOrEqual(100)
    })

    it('should include violations when present', () => {
      const violation: ComplianceViolation = {
        fieldKey: 'users.credit_card',
        category: 'FINANCIAL',
        issue: 'Credit card data exposed to 3 downstream systems',
        severity: 'high',
        remediation: 'Mask credit card numbers in logs',
      }
      const report: ComplianceReport = {
        reportId: 'cr-002',
        generatedAt: '2026-01-01T00:00:00Z',
        totalClassifiedFields: 50,
        sensitiveFields: 5,
        complianceScore: 45,
        violations: [violation],
        summary: 'High severity violations found',
      }
      expect(report.violations).toHaveLength(1)
      expect(report.violations[0].severity).toBe('high')
    })
  })

  describe('TransferRecord', () => {
    it('should create a transfer record', () => {
      const tr: TransferRecord = {
        id: 'tr-001',
        sourceField: 'email',
        targetField: 'user_email',
        table: 'analytics',
        operation: 'insert',
        timestamp: '2026-01-01T00:00:00Z',
        sensitivity: 'confidential',
      }
      expect(tr.id).toBe('tr-001')
      expect(tr.sensitivity).toBe('confidential')
    })

    it('should allow optional sensitivity', () => {
      const tr: TransferRecord = {
        id: 'tr-002',
        sourceField: 'name',
        targetField: 'full_name',
        table: 'backup',
        operation: 'copy',
        timestamp: '2026-01-01T00:00:00Z',
      }
      expect(tr.sensitivity).toBeUndefined()
    })
  })
})
