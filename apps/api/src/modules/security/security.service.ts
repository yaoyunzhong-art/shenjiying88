/**
 * security.service.ts — Security Service (canonical name)
 *
 * 安全模块入口。
 * 统一导出安全扫描 & WAF 防护的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   SecurityScannerService     安全扫描 & 漏洞检测
 *   WAFService                 Web 应用防火墙 (规则引擎 & 事件管理)
 *
 * 实体类型 ─────────────────────
 *   VulnerabilitySeverity      漏洞严重性 (info/low/medium/high/critical)
 *   VulnerabilityCategory      漏洞分类
 *   SecurityVulnerability      漏洞信息 (CWE/severity/file/line)
 *   SecurityScanTarget         扫描目标
 *   SecurityScanSummary        扫描摘要
 *   SecurityReport             安全报告
 *   WAFRuleAction              WAF 动作 (allow/block/challenge/log)
 *   WAFConditionType           规则条件类型
 *   WAFConditionOperator       条件操作符
 *   WAFRule                    WAF 规则
 *   WAFDecision                WAF 决策
 *   WAFLogEntry                WAF 日志条目
 *   ScanRequest / BatchScanRequest / CreateWAFRuleRequest
 *
 * 常量 ─────────────────────────
 *   SECURITY_SCAN_SEVERITY_ORDER 严重性排序
 *   WAF_DEFAULT_ACTION          默认 WAF 动作
 *   IP_REPUTATION_CACHE_TTL_MS  IP 信誉缓存 TTL
 *   MAX_VULNERABILITY_REPORT_LENGTH 报告最大长度
 *   WAF_RATE_LIMIT_WINDOW_MS    限流窗口
 *   WAF_RATE_LIMIT_MAX_REQUESTS 限流阈值
 *   SECURITY_AUDIT_ENABLED      审计开关
 *   IP_REPUTATION_GOOD/BAD_THRESHOLD 信誉阈值
 *   SECURITY_SCAN_MAX_FILES     扫描文件上限
 *   SECURITY_SCAN_TIMEOUT_MS    扫描超时
 *   WAF_LOG_RETENTION_DAYS      WAF 日志保留天数
 *   SCANNER_DEFAULT_LANGUAGE    默认扫描语言
 *   SCANNER_DEFAULT_RULESET     默认规则集
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { SecurityScannerService, WAFService, SecurityVulnerability } from './security.service'
 *   const scanner = app.get(SecurityScannerService)
 *   const waf = app.get(WAFService)
 *   const results = await scanner.scanCode(diffContent)
 *   const blocked = await waf.evaluate(request)
 *
 * @module Security
 */

export { SecurityScannerService } from './security-scanner.service'
export { WAFService } from './waf.service'

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  VulnerabilitySeverity,
  VulnerabilityCategory,
  SecurityVulnerability,
  SecurityScanTarget,
  SecurityScanSummary,
  SecurityReport,
  WAFRuleAction,
  WAFConditionType,
  WAFConditionOperator,
  WAFRule,
  WAFDecision,
  WAFLogEntry,
  ScanRequest,
  BatchScanRequest,
  CreateWAFRuleRequest,
} from './security.entity'

// ─── 安全常量 ───────────────────────────────────────────────────────────────
export const SECURITY_SCAN_SEVERITY_ORDER = ['critical', 'high', 'medium', 'low'] as const
export const WAF_DEFAULT_ACTION = 'block'
export const IP_REPUTATION_CACHE_TTL_MS = 300_000 // 5 min
export const MAX_VULNERABILITY_REPORT_LENGTH = 10_000
export const WAF_RATE_LIMIT_WINDOW_MS = 60_000 // 1 min
export const WAF_RATE_LIMIT_MAX_REQUESTS = 1000
export const SECURITY_AUDIT_ENABLED = true
export const IP_REPUTATION_GOOD_THRESHOLD = 0.7
export const IP_REPUTATION_BAD_THRESHOLD = 0.3
export const SECURITY_SCAN_MAX_FILES = 100
export const SECURITY_SCAN_TIMEOUT_MS = 120_000
export const WAF_LOG_RETENTION_DAYS = 90
export const VULNERABILITY_PRIORITY_ORDER: string[] = ['critical', 'high', 'medium', 'low']
export const DEFAULT_POLICY_NAME_PREFIX = 'sec_policy_' as const
export const SECURITY_EVENT_RETENTION_DAYS = 30
export const MAX_WAF_RULES_PER_GROUP = 50
export const WAF_DEFAULT_SENSITIVITY_LEVEL = 'medium' as const
export const SCANNER_DEFAULT_LANGUAGE = 'typescript' as const
export const SCANNER_DEFAULT_RULESET = 'owasp-top10' as const
