import { Injectable } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

export type WAFRuleAction = 'allow' | 'block' | 'challenge' | 'log'

export interface WAFRule {
  id: string
  name: string
  condition: {
    type: 'ip' | 'path' | 'header' | 'body' | 'rate'
    operator: 'equals' | 'contains' | 'regex' | 'gt' | 'lt'
    value: string
  }
  action: WAFRuleAction
  priority: number
  enabled: boolean
}

export interface WAFDecision {
  allowed: boolean
  matchedRule?: WAFRule
  reason: string
  riskLevel: 'safe' | 'suspicious' | 'malicious'
  action?: 'allow' | 'block' | 'challenge' | 'log'
}

// ── Rate Limit Tracker ────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  firstRequestAt: number
}

// ── Built-in Malicious IPs ────────────────────────────────────────────────────

const KNOWN_MALICIOUS_IP_PATTERNS = [
  '192.168.100.100',
  '10.0.0.99',
  '172.16.0.50',
  '192.168.1.100',
  '10.10.10.10',
  '192.168.50.1',
  '172.16.50.100',
]

// ── SQL Injection Patterns ────────────────────────────────────────────────────

const SQL_INJECTION_PATTERNS = [
  /union\s+select/i,
  /union\s+all\s+select/i,
  /drop\s+table/i,
  /drop\s+database/i,
  /insert\s+into/i,
  /delete\s+from/i,
  /update\s+\w+\s+set/i,
  /exec\s*\(/i,
  /execute\s*\(/i,
  /'\s*or\s*'1'\s*=\s*'1/i,
  /'\s*or\s*1\s*=\s*1/i,
  /;\s*drop\s+table/i,
  /;\s*delete\s+from/i,
  /--\s*$/m,
  /\/\*.*\*\//m,
  /xp_cmdshell/i,
  /sp_executesql/i,
  /information_schema/i,
  /concat\s*\(/i,
]

// ── XSS Patterns ───────────────────────────────────────────────────────────────

const XSS_PATTERNS = [
  /<script[^>]*>/i,
  /<\/script>/i,
  /<script\s+src=/i,
  /<img[^>]+onerror=/i,
  /<svg[^>]+onload=/i,
  /<iframe[^>]*>/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /<body[^>]+onload=/i,
  /<input[^>]+onerror=/i,
  /<marquee[^>]+onstart=/i,
  /<details[^>]+ontoggle=/i,
  /<select[^>]+onfocus=/i,
  /<textarea[^>]+onfocus=/i,
  /<keygen[^>]+onfocus=/i,
  /<video[^>]+onerror=/i,
  /<audio[^>]+onerror=/i,
  /<source[^>]+onerror=/i,
  /<track[^>]+onerror=/i,
  /<object[^>]+onerror=/i,
  /<embed[^>]+onerror=/i,
  /<form[^>]+onsubmit=/i,
  /onabort\s*=/i,
  /onblur\s*=/i,
  /onchange\s*=/i,
  /oncontextmenu\s*=/i,
  /oncopy\s*=/i,
  /oncut\s*=/i,
  /ondblclick\s*=/i,
  /ondrag\s*=/i,
  /ondragend\s*=/i,
  /ondragenter\s*=/i,
  /ondragleave\s*=/i,
  /ondragover\s*=/i,
  /ondragstart\s*=/i,
  /ondrop\s*=/i,
  /onended\s*=/i,
  /onfocus\s*=/i,
  /onhashchange\s*=/i,
  /oninput\s*=/i,
  /oninvalid\s*=/i,
  /onkeydown\s*=/i,
  /onkeypress\s*=/i,
  /onkeyup\s*=/i,
  /onmousedown\s*=/i,
  /onmousemove\s*=/i,
  /onmouseout\s*=/i,
  /onmouseover\s*=/i,
  /onmouseup\s*=/i,
  /onmousewheel\s*=/i,
  /onpaste\s*=/i,
  /onpause\s*=/i,
  /onplay\s*=/i,
  /onplaying\s*=/i,
  /onprogress\s*=/i,
  /onratechange\s*=/i,
  /onreset\s*=/i,
  /onresize\s*=/i,
  /onscroll\s*=/i,
  /onsearch\s*=/i,
  /onseeked\s*=/i,
  /onseeking\s*=/i,
  /onselect\s*=/i,
  /onstalled\s*=/i,
  /onsubmit\s*=/i,
  /onsuspend\s*=/i,
  /ontimeupdate\s*=/i,
  /ontoggle\s*=/i,
  /onvolumechange\s*=/i,
  /onwaiting\s*=/i,
  /<link[^>]+href=/i,
  /<style[^>]*>/i,
  /<style[^>]+url\(/i,
]

// ── Default Rate Limit Config ─────────────────────────────────────────────────

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class WAFService {
  private rules: Map<string, WAFRule> = new Map()
  private blockedLogs: WAFDecision[] = []
  private rateLimitTracker: Map<string, RateLimitEntry> = new Map()

  constructor() {
    this.initBuiltInRules()
  }

  // ── 规则管理 ─────────────────────────────────────────────────────────────

  /**
   * 添加 WAF 规则
   */
  addRule(rule: Omit<WAFRule, 'id'>): WAFRule {
    const id = this.generateRuleId()
    const newRule: WAFRule = { ...rule, id }
    this.rules.set(id, newRule)
    return newRule
  }

  /**
   * 更新 WAF 规则
   */
  updateRule(id: string, updates: Partial<WAFRule>): WAFRule {
    const rule = this.rules.get(id)
    if (!rule) {
      throw new Error(`Rule with id ${id} not found`)
    }

    const updatedRule = { ...rule, ...updates, id }
    this.rules.set(id, updatedRule)
    return updatedRule
  }

  /**
   * 删除 WAF 规则
   */
  deleteRule(id: string): void {
    if (!this.rules.has(id)) {
      throw new Error(`Rule with id ${id} not found`)
    }
    this.rules.delete(id)
  }

  /**
   * 列出所有规则
   */
  listRules(): WAFRule[] {
    return Array.from(this.rules.values()).sort((a, b) => a.priority - b.priority)
  }

  // ── 请求检查 ─────────────────────────────────────────────────────────────

  /**
   * 检查请求是否允许通过
   */
  evaluate(request: {
    ip?: string
    path?: string
    method?: string
    headers?: Record<string, string>
    body?: string
  }): WAFDecision {
    const rules = this.listRules().filter((r) => r.enabled)

    // 按优先级检查每条规则
    for (const rule of rules) {
      const match = this.evaluateRule(rule, request)
      if (match) {
        const decision = this.makeDecision(rule, request)
        if (decision.action !== 'log') {
          if (decision.allowed === false) {
            this.blockedLogs.push(decision)
          }
          return decision
        }
        // 对于 log 规则，返回完整决策（含 matchedRule）
        return decision
      }
    }

    // 没有匹配的阻止规则，允许通过
    return {
      allowed: true,
      reason: 'Request passed all WAF rules',
      riskLevel: 'safe',
    }
  }

  private evaluateRule(rule: WAFRule, request: {
    ip?: string
    path?: string
    method?: string
    headers?: Record<string, string>
    body?: string
  }): boolean {
    const { condition } = rule

    switch (condition.type) {
      case 'ip':
        return this.evaluateIPCondition(condition.operator, condition.value, request.ip)
      case 'path':
        return this.evaluateStringCondition(condition.operator, condition.value, request.path)
      case 'header':
        // header 条件需要从 headers 中获取指定字段
        return false // 默认返回不匹配
      case 'body':
        return this.evaluateStringCondition(
          condition.operator,
          condition.value,
          request.body,
        )
      case 'rate':
        return this.evaluateRateCondition(condition.operator, condition.value, request.ip)
      default:
        return false
    }
  }

  private evaluateIPCondition(
    operator: WAFRule['condition']['operator'],
    value: string,
    ip?: string,
  ): boolean {
    if (!ip) return false

    switch (operator) {
      case 'equals':
        // 支持单个 IP 或逗号分隔的多个 IP
        const values = value.split(',').map((v) => v.trim())
        return values.includes(ip)
      case 'contains':
        return ip.includes(value)
      case 'regex':
        try {
          return new RegExp(value).test(ip)
        } catch {
          return false
        }
      default:
        return false
    }
  }

  private evaluateStringCondition(
    operator: WAFRule['condition']['operator'],
    value: string,
    input?: string,
  ): boolean {
    if (!input) return false

    switch (operator) {
      case 'equals':
        return input === value
      case 'contains':
        return input.includes(value)
      case 'regex':
        try {
          return new RegExp(value, 'i').test(input)
        } catch {
          return false
        }
      default:
        return false
    }
  }

  private evaluateRateCondition(
    operator: WAFRule['condition']['operator'],
    value: string,
    ip?: string,
  ): boolean {
    if (!ip) return false

    const limit = parseInt(value, 10)
    const now = Date.now()
    const entry = this.rateLimitTracker.get(ip)

    if (!entry) {
      this.rateLimitTracker.set(ip, {
        count: 1,
        firstRequestAt: now,
      })
      return false
    }

    // 检查是否在时间窗口内
    if (now - entry.firstRequestAt > DEFAULT_RATE_LIMIT_WINDOW_MS) {
      // 重置计数器
      this.rateLimitTracker.set(ip, {
        count: 1,
        firstRequestAt: now,
      })
      return false
    }

    entry.count++

    switch (operator) {
      case 'gt':
        return entry.count > limit
      case 'lt':
        return entry.count < limit
      default:
        return false
    }
  }

  private makeDecision(
    rule: WAFRule,
    request: {
      ip?: string
      path?: string
      method?: string
      headers?: Record<string, string>
      body?: string
    },
  ): WAFDecision {
    switch (rule.action) {
      case 'block':
        return {
          allowed: false,
          matchedRule: rule,
          reason: `Request blocked by rule: ${rule.name}`,
          riskLevel: 'malicious',
          action: 'block',
        }
      case 'challenge':
        return {
          allowed: false,
          matchedRule: rule,
          reason: `Request requires challenge: ${rule.name}`,
          riskLevel: 'suspicious',
          action: 'challenge',
        }
      case 'log':
        return {
          allowed: true,
          matchedRule: rule,
          reason: `Request logged by rule: ${rule.name}`,
          riskLevel: 'suspicious',
          action: 'log',
        }
      case 'allow':
      default:
        return {
          allowed: true,
          matchedRule: rule,
          reason: `Request allowed by rule: ${rule.name}`,
          riskLevel: 'safe',
          action: 'allow',
        }
    }
  }

  // ── 内置规则 ─────────────────────────────────────────────────────────────

  /**
   * 初始化内置规则（OWASP Top 10 防护）
   */
  initBuiltInRules(): void {
    // 1. IP 黑名单规则
    this.addRule({
      name: 'Block Known Malicious IPs',
      condition: {
        type: 'ip',
        operator: 'equals',
        value: KNOWN_MALICIOUS_IP_PATTERNS.join(','),
      },
      action: 'block',
      priority: 1,
      enabled: true,
    })

    // 2. SQL 注入检测规则
    for (const pattern of SQL_INJECTION_PATTERNS) {
      this.addRule({
        name: 'SQL Injection Pattern Detection',
        condition: {
          type: 'body',
          operator: 'regex',
          value: pattern.source,
        },
        action: 'block',
        priority: 10,
        enabled: true,
      })
    }

    // 3. XSS 检测规则
    for (const pattern of XSS_PATTERNS) {
      this.addRule({
        name: 'XSS Pattern Detection',
        condition: {
          type: 'body',
          operator: 'regex',
          value: pattern.source,
        },
        action: 'block',
        priority: 20,
        enabled: true,
      })
    }

    // 4. Rate Limiting 规则（100 req/min per IP）
    this.addRule({
      name: 'Rate Limiting - 100 req/min',
      condition: {
        type: 'rate',
        operator: 'gt',
        value: String(DEFAULT_RATE_LIMIT_MAX_REQUESTS),
      },
      action: 'block',
      priority: 100,
      enabled: true,
    })

    // 5. 路径黑名单
    this.addRule({
      name: 'Block Admin Paths',
      condition: {
        type: 'path',
        operator: 'contains',
        value: '/admin/config',
      },
      action: 'block',
      priority: 50,
      enabled: true,
    })

    // 6. 敏感路径监控
    this.addRule({
      name: 'Log Sensitive Paths',
      condition: {
        type: 'path',
        operator: 'contains',
        value: '/.env',
      },
      action: 'log',
      priority: 200,
      enabled: true,
    })
  }

  // ── 日志 ──────────────────────────────────────────────────────────────────

  /**
   * 获取阻止日志
   */
  getBlockedLogs(limit = 100): WAFDecision[] {
    return this.blockedLogs.slice(-limit)
  }

  // ── 辅助方法 ──────────────────────────────────────────────────────────────

  private generateRuleId(): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }
}
