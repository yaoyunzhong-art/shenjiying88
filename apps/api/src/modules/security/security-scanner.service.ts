import { Injectable } from '@nestjs/common'

import * as jwt from 'jsonwebtoken'

// ── Types ─────────────────────────────────────────────────────────────────────

export type VulnerabilitySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical'
export type VulnerabilityCategory =
  | 'injection'
  | 'auth_bypass'
  | 'data_exposure'
  | 'idor'
  | 'csrf'
  | 'rate_limiting'
  | 'sensitive_data'
  | 'cryptography'

export interface Vulnerability {
  id: string
  title: string
  description: string
  category: VulnerabilityCategory
  severity: VulnerabilitySeverity
  cvssScore?: number // 0-10
  affectedEndpoint?: string
  parameter?: string
  payload?: string // 触发漏洞的输入
  remediation: string
  discoveredAt: Date
  fixedAt?: Date
  falsePositive: boolean
}

export interface ScanTarget {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  parameters?: Record<string, string>
}

// ── SQL Injection Payloads ───────────────────────────────────────────────────

const SQL_INJECTION_PAYLOADS = [
  "' OR '1'='1",
  "'; DROP TABLE users;--",
  "' UNION SELECT NULL--",
  "' OR 1=1--",
  "' AND 1=2--",
  "admin'--",
  "' OR 'a'='a",
]

// ── XSS Payloads ─────────────────────────────────────────────────────────────

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert(1)>',
  "javascript:alert('XSS')",
]

// ── Sensitive Field Patterns ─────────────────────────────────────────────────

const SENSITIVE_FIELD_PATTERNS = [
  'password',
  'passwd',
  'secret',
  'ssn',
  'social_security',
  'credit_card',
  'card_number',
  'cvv',
  'api_key',
  'private_key',
  'token',
  'auth_token',
  'access_token',
]

// ── JWT Weak Secrets ──────────────────────────────────────────────────────────

const WEAK_JWT_SECRETS = ['secret', 'password', '123456', 'admin', 'changeme', 'jwt-secret']

// ── HTTP Client Interface ─────────────────────────────────────────────────────

export interface HttpClient {
  request: (options: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: string
    timeout?: number
  }) => Promise<{ status: number; body: string; headers: Record<string, string> }>
}

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class SecurityScannerService {
  private httpClient: HttpClient | null = null

  setHttpClient(client: HttpClient): void {
    this.httpClient = client
  }

  // ── 扫描引擎 ─────────────────────────────────────────────────────────────

  /**
   * 对目标 endpoint 执行自动化渗透测试
   */
  async scan(target: ScanTarget): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = []

    if (!target.parameters) {
      return vulnerabilities
    }

    for (const [paramName, paramValue] of Object.entries(target.parameters)) {
      // SQL 注入检测
      const sqlVuln = await this.detectSQLInjection(target.endpoint, paramName, paramValue)
      if (sqlVuln) {
        vulnerabilities.push(sqlVuln)
      }

      // XSS 检测
      const xssVuln = await this.detectXSS(target.endpoint, paramName, paramValue)
      if (xssVuln) {
        vulnerabilities.push(xssVuln)
      }
    }

    return vulnerabilities
  }

  /**
   * 批量扫描多个目标
   */
  async scanMultiple(targets: ScanTarget[]): Promise<Map<ScanTarget, Vulnerability[]>> {
    const results = new Map<ScanTarget, Vulnerability[]>()

    for (const target of targets) {
      const vulnerabilities = await this.scan(target)
      results.set(target, vulnerabilities)
    }

    return results
  }

  // ── SQL 注入检测 ──────────────────────────────────────────────────────────

  /**
   * SQL 注入检测（发送 payloads，检测 SQL 错误响应）
   */
  async detectSQLInjection(
    endpoint: string,
    paramName: string,
    _paramValue: string,
  ): Promise<Vulnerability | null> {
    if (!this.httpClient) {
      return null
    }

    for (const payload of SQL_INJECTION_PAYLOADS) {
      try {
        const response = await this.httpClient.request({
          method: 'POST',
          url: endpoint,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [paramName]: payload }),
        })

        // 检测 SQL 错误响应
        if (this.isSQLErrorResponse(response.body)) {
          return this.createVulnerability({
            title: 'SQL Injection Vulnerability',
            description: `Parameter "${paramName}" is vulnerable to SQL injection. Payload: ${payload}`,
            category: 'injection',
            severity: 'high',
            cvssScore: 9.1,
            affectedEndpoint: endpoint,
            parameter: paramName,
            payload,
            remediation: `Implement proper input validation and use parameterized queries (prepared statements) instead of string concatenation.`,
          })
        }
      } catch {
        // 忽略请求错误，继续测试其他 payloads
      }
    }

    return null
  }

  private isSQLErrorResponse(body: string): boolean {
    const sqlErrorPatterns = [
      /sql syntax/i,
      /mysql_fetch/i,
      /mysql_num_rows/i,
      /postgresql/i,
      /pg_query/i,
      /sqlite3?/i,
      /ora-\d{5}/i,
      /microsoft sql/i,
      /odbc driver/i,
      /unterminated quoted string/i,
      /you have an error in your sql/i,
      /check the manual that corresponds to your (mysql|pgsql|postgresql|sqlite) server/i,
      /Warning.*mysql/i,
      /fatal error.*sqlite/i,
      /syntax error.*sqlite/i,
      /ERROR:\s+syntax error at or near/i,
      /SQLITE_CANTOPEN/i,
      /ORA-00933:/i,
    ]

    return sqlErrorPatterns.some((pattern) => pattern.test(body))
  }

  // ── XSS 检测 ─────────────────────────────────────────────────────────────

  /**
   * XSS 检测（发送 `<script>alert(1)</script>`，检测是否被过滤/转义）
   */
  async detectXSS(
    endpoint: string,
    paramName: string,
    _paramValue: string,
  ): Promise<Vulnerability | null> {
    if (!this.httpClient) {
      return null
    }

    for (const payload of XSS_PAYLOADS) {
      try {
        const response = await this.httpClient.request({
          method: 'POST',
          url: endpoint,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [paramName]: payload }),
        })

        // 检测 payload 是否未被转义地反映在响应中
        if (this.isXSSVulnerability(response.body, payload)) {
          return this.createVulnerability({
            title: 'Cross-Site Scripting (XSS) Vulnerability',
            description: `Parameter "${paramName}" is vulnerable to XSS. Payload: ${payload}`,
            category: 'injection',
            severity: 'high',
            cvssScore: 8.1,
            affectedEndpoint: endpoint,
            parameter: paramName,
            payload,
            remediation: `Implement proper output encoding (HTML entity encoding) and Content-Security-Policy headers.`,
          })
        }
      } catch {
        // 忽略请求错误
      }
    }

    return null
  }

  private isXSSVulnerability(body: string, payload: string): boolean {
    // 如果 payload 原样出现在响应中（未转义），说明存在 XSS 漏洞
    // 移除常见标签后检查
    const normalizedBody = body.toLowerCase()
    const normalizedPayload = payload.toLowerCase()

    // 检查 payload 是否被嵌入而未被转义
    // 简单检查：如果 <script> 标签完整出现，说明未转义
    if (
      (payload.includes('<script>') && body.includes('<script>')) ||
      (payload.includes('<img') && body.includes('<img')) ||
      (payload.includes('<svg') && body.includes('<svg')) ||
      (payload.includes('onerror=') && body.includes('onerror=')) ||
      (payload.includes('onload=') && body.includes('onload='))
    ) {
      // 进一步检查：确保不是在注释或其他安全上下文中
      // 如果 body 中包含解码后的 payload，则存在漏洞
      const decodedBody = this.decodeHTMLEntities(body)
      if (decodedBody.includes(payload)) {
        return true
      }
    }

    // 检查是否包含 javascript: 协议（未过滤）
    if (payload.includes('javascript:') && normalizedBody.includes('javascript:')) {
      return true
    }

    // 简化的检查：如果 payload 出现在 body 中（基本检查）
    if (body.includes(payload) && !body.includes('\\' + payload.charAt(0))) {
      // 检查是否是安全的编码形式
      const safePatterns = [
        /&lt;script&gt;/i,
        /&lt;img/i,
        /&lt;svg/i,
        /&#60;script&#62;/i,
        /&#60;img/i,
      ]
      const isSafelyEncoded = safePatterns.some((pattern) => pattern.test(body))
      return !isSafelyEncoded && normalizedBody.includes(normalizedPayload)
    }

    return false
  }

  private decodeHTMLEntities(text: string): string {
    const entities: Record<string, string> = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
      '&nbsp;': ' ',
    }
    return text.replace(
      /&(?:lt|gt|amp|quot|#39|nbsp);/g,
      (match) => entities[match] || match,
    )
  }

  // ── 认证绕过检测 ─────────────────────────────────────────────────────────

  /**
   * 检测是否可利用 JWT secret 弱点（已知 secret 暴力破解）
   */
  async detectJWTWeakSecret(token: string, secrets: string[]): Promise<boolean> {
    // 使用 jsonwebtoken 的同步验证方法
    const jwt = await import('jsonwebtoken')

    // 首先检查提供的 secrets 中是否有弱 secret 且验证成功
    for (const secret of secrets) {
      if (!WEAK_JWT_SECRETS.includes(secret)) {
        // 如果不是弱 secret，跳过检查
        continue
      }
      try {
        jwt.verify(token, secret)
        // 如果验证成功且是弱 secret，说明存在漏洞
        return true
      } catch {
        // 验证失败，继续尝试其他 secret
      }
    }

    // 检查常见的弱 secret
    for (const weakSecret of WEAK_JWT_SECRETS) {
      try {
        jwt.verify(token, weakSecret)
        return true
      } catch {
        // 继续
      }
    }

    return false
  }

  /**
   * 检测是否可利用 IDOR（更改 resource ID 访问他人数据）
   */
  async detectIDOR(
    endpoint: string,
    resourceId: string,
    attackerId: string,
  ): Promise<Vulnerability | null> {
    if (!this.httpClient) {
      return null
    }

    try {
      // 模拟 attacker 尝试访问 resourceId（应该属于另一个用户）
      // 假设 API 会返回资源详情或错误信息
      const response = await this.httpClient.request({
        method: 'GET',
        url: `${endpoint}/${resourceId}`,
        headers: { 'X-User-ID': attackerId },
      })

      // 如果成功获取资源（而不是 403/404），说明存在 IDOR
      if (response.status === 200 && this.containsResourceData(response.body)) {
        return this.createVulnerability({
          title: 'Insecure Direct Object Reference (IDOR)',
          description: `User ${attackerId} can access resource ${resourceId} belonging to another user.`,
          category: 'idor',
          severity: 'high',
          cvssScore: 7.5,
          affectedEndpoint: endpoint,
          parameter: 'id',
          remediation: `Implement proper authorization checks. Ensure users can only access resources they own.`,
        })
      }
    } catch {
      // 请求失败，不确定是否存在 IDOR
    }

    return null
  }

  private containsResourceData(body: string): boolean {
    // 检查响应是否包含资源相关数据
    // 排除错误响应
    const errorPatterns = [
      /not found/i,
      /forbidden/i,
      /access denied/i,
      /unauthorized/i,
      /404/i,
      /403/i,
    ]
    const isErrorResponse = errorPatterns.some((pattern) => pattern.test(body))

    // 如果不包含错误关键词，且包含数据相关字段，认为包含资源数据
    if (!isErrorResponse) {
      const dataPatterns = [
        /"id"\s*:/i,
        /"data"\s*:/i,
        /"user"\s*:/i,
        /"resource"\s*:/i,
        /"name"\s*:/i,
        /"email"\s*:/i,
      ]
      return dataPatterns.some((pattern) => pattern.test(body))
    }

    return false
  }

  // ── 敏感数据暴露检测 ─────────────────────────────────────────────────────

  /**
   * 检测 API 响应是否包含敏感字段（password, ssn, credit_card 等）
   */
  async detectSensitiveDataExposure(
    endpoint: string,
    response: Record<string, unknown>,
  ): Promise<string[]> {
    const exposedFields: string[] = []
    const responseStr = JSON.stringify(response).toLowerCase()

    for (const pattern of SENSITIVE_FIELD_PATTERNS) {
      // 检查字段名是否出现在响应中
      const fieldPattern = new RegExp(`"${pattern}"\\s*:`, 'i')
      if (fieldPattern.test(responseStr)) {
        exposedFields.push(pattern)
      }
    }

    return exposedFields
  }

  // ── 速率限制检测 ─────────────────────────────────────────────────────────

  /**
   * 发送大量请求，检测是否有 rate limit
   */
  async detectMissingRateLimit(endpoint: string, count = 100): Promise<boolean> {
    if (!this.httpClient) {
      return false
    }

    let blockedCount = 0
    const threshold = Math.floor(count * 0.3) // 30% 请求被限制则认为有 rate limit

    for (let i = 0; i < count; i++) {
      try {
        const response = await this.httpClient.request({
          method: 'GET',
          url: endpoint,
          headers: {
            'X-Request-ID': `scan-${i}`,
          },
        })

        // 检查是否被限流
        if (
          response.status === 429 ||
          response.headers['retry-after'] ||
          response.headers['x-ratelimit-remaining'] === '0'
        ) {
          blockedCount++
        }
      } catch {
        // 请求失败，忽略
      }
    }

    // 如果被阻止的请求数量超过阈值，认为有 rate limit
    // 反过来：如果 blockedCount 很少，说明没有 rate limit（存在漏洞）
    return blockedCount < threshold
  }

  // ── 报告生成 ────────────────────────────────────────────────────────────

  /**
   * 生成漏洞报告（按 severity 排序）
   */
  generateReport(vulnerabilities: Vulnerability[]): string {
    if (vulnerabilities.length === 0) {
      return '✅ No vulnerabilities found.'
    }

    // 按严重程度排序：critical > high > medium > low > info
    const severityOrder: Record<VulnerabilitySeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    }

    const sorted = [...vulnerabilities].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    )

    const lines: string[] = [
      '═══════════════════════════════════════════════════════════════',
      '                     SECURITY SCAN REPORT                      ',
      '═══════════════════════════════════════════════════════════════',
      `Total Vulnerabilities: ${vulnerabilities.length}`,
      '',
    ]

    // 按严重程度分组
    const bySeverity = this.groupBy(sorted, 'severity')

    for (const severity of ['critical', 'high', 'medium', 'low', 'info'] as VulnerabilitySeverity[]) {
      const vulns = bySeverity.get(severity)
      if (vulns && vulns.length > 0) {
        lines.push(`─── ${severity.toUpperCase()} (${vulns.length}) ───`)
        for (const vuln of vulns) {
          lines.push(`  [${vuln.id}] ${vuln.title}`)
          lines.push(`    Category: ${vuln.category}`)
          if (vuln.affectedEndpoint) {
            lines.push(`    Endpoint: ${vuln.affectedEndpoint}`)
          }
          if (vuln.parameter) {
            lines.push(`    Parameter: ${vuln.parameter}`)
          }
          if (vuln.payload) {
            lines.push(`    Payload: ${vuln.payload}`)
          }
          lines.push(`    CVSS: ${vuln.cvssScore ?? 'N/A'}`)
          lines.push(`    Remediation: ${vuln.remediation}`)
          lines.push('')
        }
      }
    }

    lines.push('═══════════════════════════════════════════════════════════════')
    lines.push(`Generated at: ${new Date().toISOString()}`)

    return lines.join('\n')
  }

  /**
   * 导出 JSON 格式报告
   */
  exportJSON(vulnerabilities: Vulnerability[]): string {
    const report = {
      generatedAt: new Date().toISOString(),
      totalVulnerabilities: vulnerabilities.length,
      summary: this.generateSummary(vulnerabilities),
      vulnerabilities: vulnerabilities.map((v) => ({
        ...v,
        discoveredAt: v.discoveredAt.toISOString(),
        fixedAt: v.fixedAt?.toISOString(),
      })),
    }

    return JSON.stringify(report, null, 2)
  }

  // ── 辅助方法 ─────────────────────────────────────────────────────────────

  private createVulnerability(data: {
    title: string
    description: string
    category: VulnerabilityCategory
    severity: VulnerabilitySeverity
    cvssScore?: number
    affectedEndpoint?: string
    parameter?: string
    payload?: string
    remediation: string
  }): Vulnerability {
    return {
      id: this.generateId(),
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.severity,
      cvssScore: data.cvssScore,
      affectedEndpoint: data.affectedEndpoint,
      parameter: data.parameter,
      payload: data.payload,
      remediation: data.remediation,
      discoveredAt: new Date(),
      falsePositive: false,
    }
  }

  private generateId(): string {
    return `VULN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  private generateSummary(vulnerabilities: Vulnerability[]): Record<string, number> {
    const summary: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    }

    for (const vuln of vulnerabilities) {
      summary[vuln.severity] = (summary[vuln.severity] || 0) + 1
    }

    return summary
  }

  private groupBy<T>(array: T[], key: keyof T): Map<T[keyof T], T[]> {
    const map = new Map<T[keyof T], T[]>()
    for (const item of array) {
      const groupKey = item[key]
      const group = map.get(groupKey) || []
      group.push(item)
      map.set(groupKey, group)
    }
    return map
  }
}
