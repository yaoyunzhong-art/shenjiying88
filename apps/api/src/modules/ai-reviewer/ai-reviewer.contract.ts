/**
 * 🐜 自动: [ai-reviewer] [D] contract 补全
 *
 * AI 代码审查器：跨模块合约类型
 * 定义 ai-reviewer 模块对外暴露的稳定合约接口，
 * 供其他模块（ai-rule-engine, ai-diagnosis, ai-insight 等）消费。
 */
import type { ReviewSeverity, ReviewSession, ReviewConfig, ReviewStats } from './ai-reviewer.entity'

/**
 * 审查结果合约（跨模块安全子集）
 */
export interface ReviewFindingContract {
  ruleId: string
  ruleName: string
  severity: ReviewSeverity
  file: string
  line?: number
  snippet: string
  message: string
  suggestion: string
  reference: string
}

/**
 * 审查会话合约（跨模块安全子集）
 */
export interface ReviewSessionContract {
  id: string
  files: Array<{ path: string; content: string }>
  findings: ReviewFindingContract[]
  summary: Record<ReviewSeverity, number>
  verdict: { pass: boolean; errorCount: number; warnCount: number }
  createdAt: string
  triggeredBy: string
  projectPath: string
}

/**
 * 审查配置合约（跨模块安全子集）
 */
export interface ReviewConfigContract {
  id: string
  name: string
  enabledRules: string[]
  ignorePatterns: string[]
  ciMode: boolean
  maxFiles: number
  maxLinesPerFile: number
  updatedAt: string
  tenantId: string
}

/**
 * 审查统计合约（跨模块安全子集）
 */
export interface ReviewStatsContract {
  totalSessions: number
  totalFiles: number
  totalFindings: number
  findingsBySeverity: Record<ReviewSeverity, number>
  passRate: number
  lastSessionAt: string | null
}

/**
 * 审查规则合约（跨模块安全子集）
 */
export interface ReviewRuleContract {
  ruleId: string
  ruleName: string
  description: string
  severity: ReviewSeverity
  reference: string
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 -> 合约映射 */
export function toReviewSessionContract(entity: ReviewSession): ReviewSessionContract {
  return {
    id: entity.id,
    files: entity.files.map((f) => ({ path: f.path, content: f.content })),
    findings: entity.findings.map(toReviewFindingContract),
    summary: { ...entity.summary },
    verdict: { ...entity.verdict },
    createdAt: entity.createdAt,
    triggeredBy: entity.triggeredBy,
    projectPath: entity.projectPath,
  }
}

/** 实体 -> 合约映射 */
export function toReviewFindingContract(entity: {
  ruleId: string
  ruleName: string
  severity: ReviewSeverity
  file: string
  line?: number
  snippet: string
  message: string
  suggestion: string
  reference: string
}): ReviewFindingContract {
  return {
    ruleId: entity.ruleId,
    ruleName: entity.ruleName,
    severity: entity.severity,
    file: entity.file,
    line: entity.line,
    snippet: entity.snippet,
    message: entity.message,
    suggestion: entity.suggestion,
    reference: entity.reference,
  }
}

/** 实体 -> 合约映射 */
export function toReviewConfigContract(entity: ReviewConfig): ReviewConfigContract {
  return {
    id: entity.id,
    name: entity.name,
    enabledRules: [...entity.enabledRules],
    ignorePatterns: [...entity.ignorePatterns],
    ciMode: entity.ciMode,
    maxFiles: entity.maxFiles,
    maxLinesPerFile: entity.maxLinesPerFile,
    updatedAt: entity.updatedAt,
    tenantId: entity.tenantId,
  }
}

/** 实体 -> 合约映射 */
export function toReviewStatsContract(entity: ReviewStats): ReviewStatsContract {
  return {
    totalSessions: entity.totalSessions,
    totalFiles: entity.totalFiles,
    totalFindings: entity.totalFindings,
    findingsBySeverity: { ...entity.findingsBySeverity },
    passRate: entity.passRate,
    lastSessionAt: entity.lastSessionAt,
  }
}
