/**
 * lineage.entity.ts — 数据血缘实体定义
 *
 * 包含：字段级血缘、敏感数据分类、数据流监控、合规报告相关类型
 */

// ─── 字段级血缘 ──────────────────────────────────────────────

export interface FieldRef {
  tableName: string
  fieldName: string
}

export type LineageEdgeType = 'DIRECT' | 'TRANSFORM'

export interface LineageEdge {
  type: LineageEdgeType
  from: FieldRef
  to: FieldRef
  transform?: string
}

export interface LineageNode {
  tableName: string
  fieldName: string
  upstreamCount: number
  downstreamCount: number
}

export interface LineageGraph {
  nodes: LineageNode[]
  edges: LineageEdge[]
}

export interface ImpactAnalysis {
  field: FieldRef
  impactedFields: FieldRef[]
  totalImpactCount: number
}

export interface LineageQuery {
  tableName: string
  fieldName: string
}

// ─── 敏感数据分类 ──────────────────────────────────────────────

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted'

export type SensitiveCategory =
  | 'PII'
  | 'FINANCIAL'
  | 'HEALTH'
  | 'CONTACT'
  | 'CREDENTIAL'
  | 'NONE'

export interface FieldClassification {
  tableName: string
  fieldName: string
  category: SensitiveCategory
  level: SensitivityLevel
  autoClassified: boolean
  updatedAt: Date
}

// ─── 数据流监控 ──────────────────────────────────────────────

export interface DataFlowEdge {
  fromTable: string
  fromField: string
  toTable: string
  toField: string
  via: string
  trackedAt: Date
}

export interface ExposureRisk {
  fieldKey: string
  category: SensitiveCategory
  level: SensitivityLevel
  exposureCount: number
  downstreamTables: string[]
  remediations: string[]
}

export interface DataFlowReport {
  totalEdges: number
  totalRisks: number
  highSeverityRisks: number
  risks: ExposureRisk[]
  generatedAt: Date
}

// ─── 合规报告 ────────────────────────────────────────────────

export interface ComplianceReport {
  reportId: string
  generatedAt: string
  totalClassifiedFields: number
  sensitiveFields: number
  complianceScore: number
  violations: ComplianceViolation[]
  summary: string
}

export interface ComplianceViolation {
  fieldKey: string
  category: SensitiveCategory
  issue: string
  severity: 'high' | 'medium' | 'low'
  remediation: string
}

// ─── 传输记录 ────────────────────────────────────────────────

export interface TransferRecord {
  id: string
  sourceField: string
  targetField: string
  table: string
  operation: string
  timestamp: string
  sensitivity?: SensitivityLevel
}
