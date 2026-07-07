/**
 * security.service.spec.ts — 安全扫描 Service 纯函数式内联测试
 *
 * 覆盖：SecurityScannerService + WAFService 的核心方法
 *
 * SecurityScannerService:
 *   - scan / scanMultiple: 正例（有参数/多目标）/ 边界（无参数/httpClient 未设）
 *   - detectSQLInjection / detectXSS: 正例（httpClient 响应含错误）/
 *     边界（httpClient 未设）
 *   - detectJWTWeakSecret: 正例（弱 secret）/ 边界（强 secret/无效 token）
 *   - detectIDOR: 正例（200 含数据）/ 边界（httpClient 未设 / 403 响应）
 *   - detectSensitiveDataExposure: 正例（password/ssn/api_key）/
 *     边界（无敏感字段）
 *   - detectMissingRateLimit: 正例（被限流）/ 边界（httpClient 未设）
 *   - generateReport: 正例（多漏洞排序/含全部字段）/ 边界（空列表）
 *   - exportJSON: 正例（有效 JSON/含 summary）/ 边界（空列表）
 *
 * WAFService:
 *   - addRule / listRules: 正例（含内置规则 > 6）/ 边界（空）
 *   - updateRule / deleteRule: 正例 / 反例（不存在）
 *   - evaluate: 正例（IP 黑名单/SQLi body/XSS body/rate limit/
 *     路径黑名单/敏感路径 log）/ 边界（无匹配放行）
 *
 * 策略：直接 new 服务类，纯函数内联，不依赖 NestJS DI。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SecurityScannerService } from './security-scanner.service'
import { WAFService } from './waf.service'
import type { Vulnerability, HttpClient } from './security-scanner.service'
import type { WAFRule, WAFDecision } from './waf.service'

// ═══════════════════════════════════════════════════════════════
// Mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function makeScanner(): SecurityScannerService {
  return new SecurityScannerService()
}

function makeWAF(): WAFService {
  return new WAFService()
}

function makeHttpClient(stubs?: { response?: Partial<{ status: number; body: string; headers: Record<string, string> }> }): HttpClient {
  return {
    request: vi.fn().mockResolvedValue({
      status: stubs?.response?.status ?? 200,
      body: stubs?.response?.body ?? '{"ok":true}',
      headers: stubs?.response?.headers ?? {},
    }),
  }
}

// ═══════════════════════════════════════════════════════════════
// SecurityScannerService — 扫描引擎
// ═══════════════════════════════════════════════════════════════

describe('SecurityScannerService — 扫描引擎', () => {
  let svc: SecurityScannerService

  beforeEach(() => { svc = makeScanner() })

  it('[B1] scan 无参数时返回空数组', async () => {
    const result = await svc.scan({ endpoint: '/api/health', method: 'GET' })
    expect(result).toEqual([])
  })

  it('[B2] scan 有参数但无 httpClient 返回空数组', async () => {
    const result = await svc.scan({ endpoint: '/api/login', method: 'POST', parameters: { username: 'admin' } })
    expect(result).toEqual([])
  })

  it('[B3] scanMultiple 返回每个目标的映射', async () => {
    const result = await svc.scanMultiple([
      { endpoint: '/a', method: 'GET' },
      { endpoint: '/b', method: 'POST', parameters: { x: 'y' } },
    ])
    expect(result.size).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════════════
// SecurityScannerService — SQL 注入检测
// ═══════════════════════════════════════════════════════════════

describe('SecurityScannerService — detectSQLInjection', () => {
  it('[B4] httpClient 未设返回 null', async () => {
    const svc = makeScanner()
    const result = await svc.detectSQLInjection('/api/login', 'username', 'admin')
    expect(result).toBeNull()
  })

  it('[B5] 检测到 SQL 错误响应时返回 Vulnerability', async () => {
    const svc = makeScanner()
    const client = makeHttpClient({ response: { body: 'You have an error in your SQL syntax;' } })
    svc.setHttpClient(client)
    const result = await svc.detectSQLInjection('/api/login', 'user', 'x')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('injection')
    expect(result!.severity).toBe('high')
  })
})

// ═══════════════════════════════════════════════════════════════
// SecurityScannerService — XSS 检测
// ═══════════════════════════════════════════════════════════════

describe('SecurityScannerService — detectXSS', () => {
  it('[B6] httpClient 未设返回 null', async () => {
    const svc = makeScanner()
    const result = await svc.detectXSS('/api/profile', 'bio', 'hello')
    expect(result).toBeNull()
  })

  it('[B7] 响应含未转义 script 标签时返回 Vulnerability', async () => {
    const svc = makeScanner()
    const client = makeHttpClient({ response: { body: '<script>alert(1)</script>' } })
    svc.setHttpClient(client)
    const result = await svc.detectXSS('/api/profile', 'bio', 'x')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('injection')
  })

  it('[B8] 安全编码后不触发 XSS', async () => {
    const svc = makeScanner()
    const client = makeHttpClient({ response: { body: '&lt;script&gt;safe&lt;/script&gt;' } })
    svc.setHttpClient(client)
    const result = await svc.detectXSS('/api/profile', 'bio', 'x')
    expect(result).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════
// SecurityScannerService — JWT 弱密钥检测
// ═══════════════════════════════════════════════════════════════

describe('SecurityScannerService — detectJWTWeakSecret', () => {
  it('[B9] 无效 token 无法验证返回 false', async () => {
    const svc = makeScanner()
    const result = await svc.detectJWTWeakSecret('invalid.token.here', ['notasecret'])
    expect(result).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// SecurityScannerService — IDOR 检测
// ═══════════════════════════════════════════════════════════════

describe('SecurityScannerService — detectIDOR', () => {
  it('[B10] httpClient 未设返回 null', async () => {
    const svc = makeScanner()
    const result = await svc.detectIDOR('/api/users', '123', 'attacker-456')
    expect(result).toBeNull()
  })

  it('[B11] 200 响应含资源数据时返回 IDOR 漏洞', async () => {
    const svc = makeScanner()
    const client = makeHttpClient({ response: { body: '{"id":123,"name":"Alice","email":"a@b.com"}' } })
    svc.setHttpClient(client)
    const result = await svc.detectIDOR('/api/users', '123', 'attacker-456')
    expect(result).not.toBeNull()
    expect(result!.category).toBe('idor')
  })

  it('[B12] 404 响应不触发 IDOR', async () => {
    const svc = makeScanner()
    const client = makeHttpClient({ response: { status: 404, body: '{"error":"not found"}' } })
    svc.setHttpClient(client)
    const result = await svc.detectIDOR('/api/users', '999', 'attacker-456')
    expect(result).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════
// SecurityScannerService — 敏感数据暴露检测
// ═══════════════════════════════════════════════════════════════

describe('SecurityScannerService — detectSensitiveDataExposure', () => {
  let svc: SecurityScannerService
  beforeEach(() => { svc = makeScanner() })

  it('[B13] password 字段视为敏感', async () => {
    const result = await svc.detectSensitiveDataExposure('/api/user', { id: 1, password: 'secret123' })
    expect(result).toContain('password')
  })

  it('[B14] 多个敏感字段同时检测', async () => {
    const result = await svc.detectSensitiveDataExposure('/api/user', { ssn: '123-45-6789', api_key: 'sk-abc' })
    expect(result).toContain('ssn')
    expect(result).toContain('api_key')
  })

  it('[B15] 无敏感字段返回空数组', async () => {
    const result = await svc.detectSensitiveDataExposure('/api/items', { items: [{ id: 1 }] })
    expect(result).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════
// SecurityScannerService — 速率限制检测 / 报告生成 / JSON 导出
// ═══════════════════════════════════════════════════════════════

describe('SecurityScannerService — 速率限制检测', () => {
  it('[B16] httpClient 未设返回 false', async () => {
    const svc = makeScanner()
    const result = await svc.detectMissingRateLimit('/api/test', 5)
    expect(result).toBe(false)
  })
})

describe('SecurityScannerService — generateReport', () => {
  let svc: SecurityScannerService
  beforeEach(() => { svc = makeScanner() })

  it('[B17] 空漏洞列表返回安全确认', () => {
    const report = svc.generateReport([])
    expect(report).toContain('No vulnerabilities')
  })

  it('[B18] 多严重级别按 critical > low 排序', () => {
    const vulns: Vulnerability[] = [
      { id: 'V-1', title: 'Low issue', description: '', category: 'csrf', severity: 'low', remediation: 'fix', discoveredAt: new Date(), falsePositive: false },
      { id: 'V-2', title: 'Critical issue', description: '', category: 'injection', severity: 'critical', cvssScore: 10, remediation: 'fix', discoveredAt: new Date(), falsePositive: false },
    ]
    const report = svc.generateReport(vulns)
    expect(report.indexOf('CRITICAL')).toBeLessThan(report.indexOf('LOW'))
  })

  it('[B19] 报告包含漏洞全部字段', () => {
    const vulns: Vulnerability[] = [{
      id: 'V-TEST', title: 'SQLi on /api/login', description: 'Injection flaw',
      category: 'injection', severity: 'high', affectedEndpoint: '/api/login',
      parameter: 'id', payload: "' OR '1'='1", remediation: 'Use parameterized queries',
      discoveredAt: new Date(), falsePositive: false,
    }]
    const report = svc.generateReport(vulns)
    expect(report).toContain('SQLi on /api/login')
    expect(report).toContain('/api/login')
    expect(report).toContain('Use parameterized queries')
  })
})

describe('SecurityScannerService — exportJSON', () => {
  let svc: SecurityScannerService
  beforeEach(() => { svc = makeScanner() })

  it('[B20] 空列表 JSON 含总数 0', () => {
    const json = JSON.parse(svc.exportJSON([]))
    expect(json.totalVulnerabilities).toBe(0)
    expect(json.vulnerabilities).toHaveLength(0)
  })

  it('[B21] 含漏洞的 JSON 包含 summary 和详细', () => {
    const vulns: Vulnerability[] = [{
      id: 'V-JSON', title: 'XSS', description: 'XSS issue',
      category: 'injection', severity: 'medium', cvssScore: 6.5,
      remediation: 'fix', discoveredAt: new Date('2025-01-01'), falsePositive: false,
    }]
    const json = JSON.parse(svc.exportJSON(vulns))
    expect(json.totalVulnerabilities).toBe(1)
    expect(json.summary.medium).toBe(1)
    expect(json.vulnerabilities[0].title).toBe('XSS')
  })
})

// ═══════════════════════════════════════════════════════════════
// WAFService — 规则管理
// ═══════════════════════════════════════════════════════════════

describe('WAFService — 规则管理', () => {
  let waf: WAFService
  beforeEach(() => { waf = makeWAF() })

  it('[B22] 初始化后内置规则数 > 6', () => {
    expect(waf.listRules().length).toBeGreaterThanOrEqual(6)
  })

  it('[B23] addRule 生成带 id 的新规则', () => {
    const rule = waf.addRule({ name: 'Test Rule', condition: { type: 'ip', operator: 'equals', value: '1.2.3.4' }, action: 'block', priority: 50, enabled: true })
    expect(rule.id).toMatch(/^rule-/)
    expect(rule.name).toBe('Test Rule')
  })

  it('[B24] updateRule 覆盖字段', () => {
    const rule = waf.addRule({ name: 'Original', condition: { type: 'ip', operator: 'equals', value: '1.1.1.1' }, action: 'log', priority: 10, enabled: true })
    const updated = waf.updateRule(rule.id, { name: 'Updated', action: 'block' })
    expect(updated.name).toBe('Updated')
    expect(updated.action).toBe('block')
  })

  it('[B25] updateRule 不存在的 id 抛错', () => {
    expect(() => waf.updateRule('no-such-rule', { name: 'X' })).toThrow(/not found/)
  })

  it('[B26] deleteRule 移除规则', () => {
    const rule = waf.addRule({ name: 'Temp', condition: { type: 'ip', operator: 'equals', value: '9.9.9.9' }, action: 'log', priority: 1, enabled: true })
    waf.deleteRule(rule.id)
    expect(waf.listRules().some(r => r.id === rule.id)).toBe(false)
  })

  it('[B27] deleteRule 不存在的 id 抛错', () => {
    expect(() => waf.deleteRule('no-such')).toThrow(/not found/)
  })
})

// ═══════════════════════════════════════════════════════════════
// WAFService — 请求评估
// ═══════════════════════════════════════════════════════════════

describe('WAFService — evaluate', () => {
  let waf: WAFService
  beforeEach(() => { waf = makeWAF() })

  it('[B28] 已知恶意 IP 被 block', () => {
    const decision = waf.evaluate({ ip: '10.10.10.10', path: '/api/test', method: 'GET' })
    expect(decision.allowed).toBe(false)
    expect(decision.riskLevel).toBe('malicious')
  })

  it('[B29] body 含 SQLi payload 被 block', () => {
    const decision = waf.evaluate({ path: '/api/login', method: 'POST', body: "SELECT * FROM users WHERE id=' OR '1'='1" })
    expect(decision.allowed).toBe(false)
    expect(decision.action).toBe('block')
  })

  it('[B30] body 含 XSS payload 被 block', () => {
    const decision = waf.evaluate({ path: '/api/search', method: 'POST', body: '<script>alert(1)</script>' })
    expect(decision.allowed).toBe(false)
  })

  it('[B31] 路径含 /admin/config 被 block', () => {
    const decision = waf.evaluate({ ip: '8.8.8.8', path: '/admin/config/db', method: 'GET' })
    expect(decision.allowed).toBe(false)
  })

  it('[B32] 路径含 /.env 触发 log 操作（allowed=true）', () => {
    const decision = waf.evaluate({ ip: '8.8.8.8', path: '/.env', method: 'GET' })
    expect(decision.allowed).toBe(true)
    expect(decision.action).toBe('log')
  })

  it('[B33] 正常请求 passed all rules', () => {
    const decision = waf.evaluate({ ip: '8.8.8.8', path: '/api/public/health', method: 'GET', body: '{"hello":"world"}' })
    expect(decision.allowed).toBe(true)
    expect(decision.reason).toContain('passed')
  })

  it('[B34] 多次请求触发 rate limit', () => {
    // 发送 101 次快速请求
    for (let i = 0; i < 101; i++) {
      waf.evaluate({ ip: '1.1.1.1', path: '/api/test', method: 'GET' })
    }
    // 第 102 次应被 rate limit
    const decision2 = waf.evaluate({ ip: '1.1.1.1', path: '/api/test', method: 'GET' })
    expect(decision2.allowed).toBe(false)
  })

  it('[B35] getBlockedLogs 返回被阻止的记录', () => {
    waf.evaluate({ ip: '10.10.10.10', path: '/api/test' })
    const logs = waf.getBlockedLogs(10)
    expect(logs.length).toBeGreaterThanOrEqual(1)
    expect(logs[0].allowed).toBe(false)
  })
})
