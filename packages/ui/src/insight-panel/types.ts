/**
 * Phase 94 智能分析 UI Types (V10 Sprint 2 Day 18)
 */

export type InsightTemplateType =
  | 'sales' | 'inventory' | 'finance' | 'marketing' | 'customer'

export type InsightStatus = 'pending' | 'generating' | 'completed' | 'failed'

export interface InsightSourceRef {
  type: 'report' | 'canary' | 'monitoring'
  refId: string
  period: { from: string; to: string }
}

export interface InsightResponse {
  id: string
  tenantId: string
  templateType: InsightTemplateType
  status: InsightStatus
  content?: string
  modelId: string
  tokenUsage?: { prompt: number; completion: number; total: number }
  sources: InsightSourceRef[]
  error?: string
  createdAt: string
  completedAt?: string
  createdBy: string
  cached: boolean
}

export interface InsightTemplate {
  type: InsightTemplateType
  name: string
  description: string
  maxTokens: number
  temperature: number
}

export const TEMPLATE_LABELS: Record<InsightTemplateType, string> = {
  sales: '销售洞察',
  inventory: '库存洞察',
  finance: '财务洞察',
  marketing: '营销洞察',
  customer: '客户洞察',
}

export const STATUS_LABELS: Record<InsightStatus, string> = {
  pending: '等待中',
  generating: '生成中',
  completed: '已完成',
  failed: '失败',
}

export const STATUS_COLORS: Record<InsightStatus, string> = {
  pending: '#94a3b8',
  generating: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
}
