/**
 * ai-reviewer.entity.ts - AI 代码审查器实体定义
 *
 * 定义 AI 审查服务的核心类型: 审查规则、审查结果、审查报告等。
 * 关联 ai-reviewer.service.ts 中的 ReviewRule / ReviewFinding / ReviewSeverity 等类型。
 */

import type { ReviewRule, ReviewFinding, ReviewSeverity } from './ai-reviewer.service'

export type { ReviewRule, ReviewFinding, ReviewSeverity }

/**
 * 审查会话: 一次完整的代码审查请求
 */
export interface ReviewSession {
  /** 会话唯一标识 */
  id: string
  /** 审查的文件列表 */
  files: Array<{ path: string; content: string }>
  /** 审查结果 */
  findings: ReviewFinding[]
  /** 按严重度统计 */
  summary: Record<ReviewSeverity, number>
  /** CI 结论 */
  verdict: { pass: boolean; errorCount: number; warnCount: number }
  /** 审查时间 */
  createdAt: string
  /** 审查人/触发者 */
  triggeredBy: string
  /** 关联项目/仓库 */
  projectPath: string
}

/**
 * 审查配置: 控制审查行为
 */
export interface ReviewConfig {
  /** 唯一标识 */
  id: string
  /** 配置名称 */
  name: string
  /** 启用的规则 ID 列表 (空 = 全部启用) */
  enabledRules: string[]
  /** 要忽略的文件 glob 模式 */
  ignorePatterns: string[]
  /** 是否在 CI 模式运行 (阻断 error) */
  ciMode: boolean
  /** 最大文件数 */
  maxFiles: number
  /** 最大单文件行数 */
  maxLinesPerFile: number
  /** 更新时间 */
  updatedAt: string
  /** 关联租户 ID */
  tenantId: string
}

/**
 * 审查统计概览
 */
export interface ReviewStats {
  totalSessions: number
  totalFiles: number
  totalFindings: number
  findingsBySeverity: Record<ReviewSeverity, number>
  findingsByRule: Record<string, number>
  topRules: Array<{ ruleId: string; ruleName: string; count: number }>
  passRate: number // 0-1, 通过率
  lastSessionAt: string | null
}
