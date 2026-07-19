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
 *   SecurityPolicy             安全策略定义
 *   SecurityScanResult         扫描结果
 *   Vulnerability              漏洞信息 (CWE/severity/file/line)
 *   WafRule                    WAF 规则 (pattern/action/rateLimit)
 *   WafRuleGroup               WAF 规则组
 *   SecurityEvent              安全事件 (source/type/ip)
 *   IpReputationEntry          IP 信誉记录 (score/category/lastSeen)
 *
 * DTO ──────────────────────────
 *   CreateSecurityPolicyDto    创建安全策略
 *   UpdateSecurityPolicyDto    更新安全策略
 *   CreateWafRuleDto           创建 WAF 规则
 *   UpdateWafRuleDto           更新 WAF 规则
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { SecurityScannerService, WAFService, Vulnerability } from './security.service'
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
  SecurityPolicy,
  SecurityScanResult,
  Vulnerability,
  WafRule,
  WafRuleGroup,
  SecurityEvent,
  IpReputationEntry,
} from './security.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export type {
  CreateSecurityPolicyDto,
  UpdateSecurityPolicyDto,
  CreateWafRuleDto,
  UpdateWafRuleDto,
} from './security.dto'

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
