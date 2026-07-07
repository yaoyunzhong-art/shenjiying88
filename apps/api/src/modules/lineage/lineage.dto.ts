/**
 * lineage.dto.ts — 数据血缘 DTO
 *
 * 血缘追踪、敏感数据分类、合规报告的请求/响应 DTO
 */

// ─── 血缘查询 ────────────────────────────────────────────────

export class LineageQueryDto {
  tableName!: string
  fieldName!: string
}

export class LineageEdgeDto {
  type!: 'DIRECT' | 'TRANSFORM'
  from!: { tableName: string; fieldName: string }
  to!: { tableName: string; fieldName: string }
  transform?: string
}

export class RegisterFieldDto {
  tableName!: string
  fieldName!: string
}

export class RegisterEdgeDto {
  type!: 'DIRECT' | 'TRANSFORM'
  from!: { tableName: string; fieldName: string }
  to!: { tableName: string; fieldName: string }
  transform?: string
}

export class ImpactAnalysisDto {
  field!: { tableName: string; fieldName: string }
}

// ─── 敏感数据分类 ────────────────────────────────────────────

export class ClassifyFieldDto {
  tableName!: string
  fieldName!: string
  sampleData?: string
}

export class UpdateClassificationDto {
  tableName!: string
  fieldName!: string
  level!: string
}

// ─── 数据流 ──────────────────────────────────────────────────

export class TrackDataFlowDto {
  fromTable!: string
  fromField!: string
  toTable!: string
  toField!: string
  via!: string
}

export class RegisterTransferDto {
  sourceField!: string
  targetField!: string
  table!: string
  operation!: string
}

// ─── 合规报告 ────────────────────────────────────────────────

export class ComplianceThresholdDto {
  minScore?: number
  severityFilter?: string
}

// ─── 通用 ────────────────────────────────────────────────────

export interface ApiEnvelope<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
