/**
 * security.entity.ts - 安全模块实体定义
 *
 * 定义安全检测核心实体：
 * - SecurityVulnerability: 漏洞实体
 * - SecurityScanTarget: 扫描目标
 * - WAFRule: WAF 规则
 * - WAFDecision: WAF 判定结果
 * - SecurityReport: 安全报告
 */

/** 漏洞严重级别 */
export type VulnerabilitySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'

/** 漏洞分类 */
export type VulnerabilityCategory =
  | 'injection'
  | 'auth_bypass'
  | 'data_exposure'
  | 'idor'
  | 'csrf'
  | 'rate_limiting'
  | 'sensitive_data'
  | 'cryptography'

/** 漏洞实体 */
export interface SecurityVulnerability {
  id: string
  title: string
  description: string
  category: VulnerabilityCategory
  severity: VulnerabilitySeverity
  cvssScore?: number
  affectedEndpoint?: string
  parameter?: string
  payload?: string
  remediation: string
  discoveredAt: Date
  fixedAt?: Date
  falsePositive: boolean
}

/** 扫描目标 */
export interface SecurityScanTarget {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  parameters?: Record<string, string>
}

/** 扫描结果摘要 */
export interface SecurityScanSummary {
  totalVulnerabilities: number
  critical: number
  high: number
  medium: number
  low: number
  info: number
  generatedAt: string
}

/** 扫描报告 */
export interface SecurityReport {
  generatedAt: string
  totalVulnerabilities: number
  summary: SecurityScanSummary
  vulnerabilities: SecurityVulnerability[]
}

/** WAF 规则操作 */
export type WAFRuleAction = 'allow' | 'block' | 'challenge' | 'log'

/** WAF 规则条件类型 */
export type WAFConditionType = 'ip' | 'path' | 'header' | 'body' | 'rate'

/** WAF 规则条件操作符 */
export type WAFConditionOperator = 'equals' | 'contains' | 'regex' | 'gt' | 'lt'

/** WAF 规则 */
export interface WAFRule {
  id: string
  name: string
  condition: {
    type: WAFConditionType
    operator: WAFConditionOperator
    value: string
  }
  action: WAFRuleAction
  priority: number
  enabled: boolean
}

/** WAF 判定结果 */
export interface WAFDecision {
  allowed: boolean
  matchedRule?: WAFRule
  reason: string
  riskLevel: 'safe' | 'suspicious' | 'malicious'
  action?: 'allow' | 'block' | 'challenge' | 'log'
}

/** WAF 日志条目 */
export interface WAFLogEntry {
  timestamp: string
  ip: string
  path: string
  method: string
  decision: WAFDecision
}

/** 安全扫描请求参数 */
export interface ScanRequest {
  target: SecurityScanTarget
}

/** 批量扫描请求参数 */
export interface BatchScanRequest {
  targets: SecurityScanTarget[]
}

/** 添加 WAF 规则请求 */
export interface CreateWAFRuleRequest {
  name: string
  condition: {
    type: WAFConditionType
    operator: WAFConditionOperator
    value: string
  }
  action: WAFRuleAction
  priority: number
  enabled: boolean
}
