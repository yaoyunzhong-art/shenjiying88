/**
 * Phase 94 智能分析 Contract (V10 Sprint 2 Day 16)
 *
 * 跨模块契约类型定义: 提供稳定的外部 API 表面供其他模块消费
 */

import type { InsightTemplateType, InsightStatus } from './insight.entity'

/** 外部契约: 洞察摘要 (不含 token 用量等内部细节) */
export interface InsightContract {
  id: string
  tenantId: string
  templateType: InsightTemplateType
  status: InsightStatus
  hasContent: boolean
  modelId: string
  sourceCount: number
  error?: string
  createdAt: string
  completedAt?: string
  createdBy: string
  cached: boolean
}

/** 外部契约: 模板摘要 */
export interface TemplateContract {
  type: InsightTemplateType
  name: string
  description: string
}

/** 外部契约: 缓存清理结果 */
export interface CachePruneContract {
  pruned: number
  timestamp: string
}

/** 外部契约: 洞察列表摘要 */
export interface InsightListContract {
  items: InsightContract[]
  total: number
  nextCursor?: string
}

/**
 * 转换 InsightResponse → InsightContract
 * 移除 tokenUsage 等内部细节,提供稳定的跨模块表面
 */
export function toInsightContract(response: {
  id: string
  tenantId: string
  templateType: InsightTemplateType
  status: InsightStatus
  content?: string
  modelId: string
  tokenUsage?: { prompt: number; completion: number; total: number }
  sources: Array<{ type: string; refId: string }>
  error?: string
  createdAt: string
  completedAt?: string
  createdBy: string
  cached: boolean
}): InsightContract {
  return {
    id: response.id,
    tenantId: response.tenantId,
    templateType: response.templateType,
    status: response.status,
    hasContent: response.content !== undefined && response.content.length > 0,
    modelId: response.modelId,
    sourceCount: response.sources.length,
    error: response.error,
    createdAt: response.createdAt,
    completedAt: response.completedAt,
    createdBy: response.createdBy,
    cached: response.cached,
  }
}

/**
 * 将模板列表转换为契约格式 (移除 systemPrompt/userPromptTemplate 等内部字段)
 */
export function toTemplateContract(template: {
  type: InsightTemplateType
  name: string
  description: string
}): TemplateContract {
  return {
    type: template.type,
    name: template.name,
    description: template.description,
  }
}

/**
 * 转换列表响应 → InsightListContract
 */
export function toInsightListContract(list: {
  items: Array<{
    id: string
    tenantId: string
    templateType: InsightTemplateType
    status: InsightStatus
    content?: string
    modelId: string
    tokenUsage?: { prompt: number; completion: number; total: number }
    sources: Array<{ type: string; refId: string }>
    error?: string
    createdAt: string
    completedAt?: string
    createdBy: string
    cached: boolean
  }>
  total: number
  nextCursor?: string
}): InsightListContract {
  return {
    items: list.items.map(toInsightContract),
    total: list.total,
    nextCursor: list.nextCursor,
  }
}
