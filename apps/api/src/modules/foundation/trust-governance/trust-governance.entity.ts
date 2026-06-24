import { FoundationScopeType, QuotaPeriod } from '@prisma/client'

/**
 * 审计记录状态
 */
export enum AuditRiskLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high'
}

/**
 * AI 调用审查裁决
 */
export enum AiReviewVerdict {
  Approved = 'approved',
  ApprovedWithGuardrails = 'approved-with-guardrails',
  ManualReview = 'manual-review'
}

/**
 * 限流决定
 */
export interface RateLimitDecision {
  /** 是否放行 */
  allowed: boolean
  /** 作用域键 */
  scopeKey: string
  /** 限额 */
  limit: number
  /** 剩余配额 */
  remaining: number
  /** 重试等待秒数 */
  retryAfterSeconds: number
  /** 限流状态快照 */
  state: RateLimitState
}

/**
 * 限流状态快照
 */
export interface RateLimitState {
  /** 已消费计数 */
  count: number
  /** 剩余配额（可为空表示无上限） */
  remaining: number | null
  /** 重置时间 */
  resetAt: string
  /** 封禁结束时间 */
  blockedUntil: string | null
  /** 最近活动时间 */
  lastSeenAt: string
}

/**
 * 限流策略记录
 */
export interface RateLimitPolicyRecord {
  /** 策略 ID */
  id: string
  /** 策略代码 */
  code: string
  /** 作用域类型 */
  scopeType: FoundationScopeType
  /** 租户 ID */
  tenantId: string | null
  /** 品牌 ID */
  brandId: string | null
  /** 门店 ID */
  storeId: string | null
  /** 集成应用 ID */
  integrationAppId: string | null
  /** 周期 */
  period: QuotaPeriod
  /** 限制数 */
  limit: number
  /** 突发限制 */
  burstLimit: number | null
  /** 维度键 */
  dimensionKeys: string[]
  /** 算法 */
  algorithm: string
  /** 元数据 */
  metadata: Record<string, unknown>
  /** 更新时间 */
  updatedAt: string
}

/**
 * 配额账簿记录
 */
export interface QuotaLedgerRecord {
  /** 账簿 ID */
  id: string
  /** 主体键 */
  subjectKey: string
  /** 周期 */
  period: QuotaPeriod
  /** 已消费 */
  consumed: number
  /** 剩余 */
  remaining: number | null
  /** 重置时间 */
  resetAt: string
  /** 关联策略 */
  policy: {
    id: string
    code: string
    limit: number
    period: QuotaPeriod
  }
  /** 元数据 */
  metadata: Record<string, unknown>
  /** 更新时间 */
  updatedAt: string
}

/**
 * 审计记录
 */
export interface AuditRecord {
  /** 审计 ID */
  auditId: string
  /** 事件类型 */
  eventType: string
  /** 租户 ID */
  tenantId?: string
  /** 操作者 ID */
  actorId?: string
  /** 来源 */
  source?: string
  /** 风险等级 */
  riskLevel: AuditRiskLevel
  /** 发生时间 */
  occurredAt: string
  /** 详情 */
  details: Record<string, unknown>
}

/**
 * AI 调用审查结果
 */
export interface AiReviewResult {
  /** 模型代码 */
  modelCode: string
  /** 租户 ID */
  tenantId: string
  /** 用途 */
  purpose: string
  /** 裁决 */
  verdict: AiReviewVerdict
  /** 风险评分 (0-100) */
  riskScore: number
  /** 脱敏后的提示词 */
  maskedPrompt: string
  /** 发现的问题 */
  findings: string[]
  /** 预算信息 */
  budget: {
    monthlyBudgetTokens: number
    remainingTokens: number
  }
  /** 控制措施 */
  controls: string[]
}

/**
 * 治理操作结果
 */
export interface GovernanceOperationResult {
  /** 状态 */
  status: string
  /** 操作概述（可选） */
  summary?: string
  /** 影响计数 */
  count?: number
  /** 审计记录列表 */
  ledgers?: QuotaLedgerRecord[]
  /** 审批记录 */
  approval?: unknown
  /** 治理上下文 */
  governance?: unknown
}

/**
 * 审计汇总
 */
export interface AuditSummary {
  /** 总记录数 */
  total: number
  /** 按操作分类 */
  byAction: Record<string, number>
  /** 按来源分类 */
  bySource: Record<string, number>
  /** 按风险等级分类 */
  byRiskLevel: Record<AuditRiskLevel, number>
}

/**
 * 治理概览
 */
export interface GovernanceOverview {
  /** 生成时间 */
  generatedAt: string
  /** 审批摘要 */
  approvals: unknown
  /** 审计摘要 */
  audits: AuditSummary
  /** 限流统计 */
  rateLimit: {
    policies: {
      total: number
      tenantScoped: number
      runtimeManaged: number
    }
    ledgers: {
      total: number
      blocked: number
      exhausted: number
    }
  }
}
