/**
 * Phase 94 智能分析 DTO (V10 Sprint 2 Day 16)
 *
 * 入参:GenerateInsightRequest (源数据 + 模板类型)
 * 出参:InsightResponse (脱敏 + 状态 + 元数据)
 */

import type { InsightReport, InsightTemplateType, InsightStatus } from './insight.entity'

/** 生成洞察请求 */
export interface GenerateInsightRequest {
  /** 模板类型 (5 选 1) */
  templateType: InsightTemplateType
  /** 数据源列表 (1 个或多个) */
  sources: {
    type: 'report' | 'canary' | 'monitoring'
    refId: string
    dataSnapshot: Record<string, unknown>
    period: { from: string; to: string }
  }[]
  /** 强制重新生成 (忽略缓存) */
  force?: boolean
  /** 自定义 maxTokens (覆盖模板默认值) */
  maxTokens?: number
}

/** 列表查询 */
export interface ListInsightRequest {
  templateType?: InsightTemplateType
  status?: InsightStatus
  limit?: number
  cursor?: string
}

/** 洞察响应 (脱敏 API key) */
export interface InsightResponse {
  id: string
  tenantId: string
  templateType: InsightTemplateType
  status: InsightStatus
  content?: string
  modelId: string
  tokenUsage?: { prompt: number; completion: number; total: number }
  sources: { type: string; refId: string; period: { from: string; to: string } }[]
  error?: string
  createdAt: string
  completedAt?: string
  createdBy: string
  cached: boolean
}

/** 列表响应 */
export interface ListInsightResponse {
  items: InsightResponse[]
  total: number
  nextCursor?: string
}

/** 模板信息 (用于前端下拉) */
export interface TemplateInfo {
  type: InsightTemplateType
  name: string
  description: string
  maxTokens: number
  temperature: number
}

/** 转换: InsightReport → InsightResponse (脱敏) */
export function toInsightResponse(report: InsightReport, cached: boolean): InsightResponse {
  return {
    id: report.id,
    tenantId: report.tenantId,
    templateType: report.templateType,
    status: report.status,
    content: report.content,
    modelId: report.modelId,
    tokenUsage: report.tokenUsage,
    sources: report.sources.map((s) => ({
      type: s.type,
      refId: s.refId,
      period: s.period,
    })),
    error: report.error,
    createdAt: report.createdAt,
    completedAt: report.completedAt,
    createdBy: report.createdBy,
    cached,
  }
}
