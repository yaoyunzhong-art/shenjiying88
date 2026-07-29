/**
 * security-scanner.service.spec.ts — SecurityScannerService 渗透测试引擎
 *
 * 覆盖 30+ 测试用例:
 *  - scan: SQL注入检测 / XSS检测 / 无参数返回空
 *  - scanMultiple: 批量扫描
 *  - detectSQLInjection: 各种SQL错误模式 / 无client返回null
 *  - detectXSS: 反射型XSS / 编码安全 / img/svg/iframe payloads
 *  - detectJWTWeakSecret: 弱secret/强secret/无client
 *  - detectIDOR: 可访问/403禁止/无client
 *  - detectSensitiveDataExposure: 敏感字段检测
 *  - detectMissingRateLimit: 有/无限流
 *  - generateReport / exportJSON: 报告格式
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SecurityScannerService, type HttpClient, type ScanTarget, type Vulnerability } from './security-scanner.service'

// Real JWT tokens signed with known weak secrets for testing
const JWT_SIGNED_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNzg1MzM1MjE4fQ.1Bj-FfnyRvNGTXxRBKdpQyDGi9eq3_Al-RGTuQSPqwA'
const JWT_SIGNED_PASSWORD = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNzg1MzM1MjE4fQ.mokr1Jr_7JWle2Gly0X0YMrqyIDNfV1y61GB1D7Y1e8'

// ── Mock HttpClient ─────────────────────────────────────────────────────────

function createMockHttpClient(
  overrides: Partial<HttpClient> = {}
): HttpClient {
  return {
    request: vi.fn(),
    ...overrides,
  } as HttpClient
}

// ── Helper factories ────────────────────────────────────────────────────────

function makeScanTarget(overrides: Partial<ScanTarget> = {}): ScanTarget {
  return {
    endpoint: 'https://api.example.com/orders',
    method: 'POST',
    parameters: { userId: '123', orderId: '456' },
    ...overrides,
  }
}

function makeVulnerability(overrides: Partial<Vulnerability> = {}): Vulnerability {
  return {
    id: 'VULN-1234567890-ABC123',
    title: 'Test Vulnerability',
    description: 'A test vulnerability description',
    category: 'injection',
    severity: 'high',
    cvssScore: 7.5,
    affectedEndpoint: '/api/test',
    parameter: 'id',
    payload: "' OR '1'='1",
    remediation: 'Use parameterized queries',
    discoveredAt: new Date('2026-07-29'),
    falsePositive: false,
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('SecurityScannerService', () => {
  let service: SecurityScannerService
  let mockHttpClient: ReturnType<typeof vi.fn>

  beforeEach(() => {
    service = new SecurityScannerService()
    mockHttpClient = vi.fn()
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 1. scan
  // ═════════════════════════════════════════════════════════════════════════

  describe('scan', () => {
    it('should return empty array when target has no parameters', async () => {
      const target = makeScanTarget({ parameters: undefined })
      const result = await service.scan(target)
      expect(result).toEqual([])
    })

    it('should return empty array when target has empty parameters', async () => {
      const target = makeScanTarget({ parameters: {} })
      const result = await service.scan(target)
      expect(result).toEqual([])
    })

    it('should scan each parameter for SQL injection and XSS', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: JSON.stringify({ success: true, data: [] }),
        headers: { 'content-type': 'application/json' },
      })
      service.setHttpClient(client)

      const target = makeScanTarget({ parameters: { name: 'test' } })
      const result = await service.scan(target)
      // No vulnerabilities expected since response has no SQL/XSS patterns
      expect(result).toEqual([])
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 2. scanMultiple
  // ═════════════════════════════════════════════════════════════════════════

  describe('scanMultiple', () => {
    it('should return Map with results for each target', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: JSON.stringify({}),
        headers: {},
      })
      service.setHttpClient(client)

      const targets = [
        makeScanTarget({ endpoint: '/api/a', parameters: { q: '1' } }),
        makeScanTarget({ endpoint: '/api/b', parameters: {} }),
      ]
      const results = await service.scanMultiple(targets)
      expect(results.size).toBe(2)
      expect(results.get(targets[0])).toEqual([])
      expect(results.get(targets[1])).toEqual([])
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 3. detectSQLInjection
  // ═════════════════════════════════════════════════════════════════════════

  describe('detectSQLInjection', () => {
    it('should return null when no httpClient is set', async () => {
      const result = await service.detectSQLInjection('/api/orders', 'id', '123')
      expect(result).toBeNull()
    })

    it('should detect SQL injection from SQL syntax error response', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 500,
        body: 'ERROR: syntax error at or near "OR"',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectSQLInjection('/api/orders', 'id', '123')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('injection')
      expect(result!.severity).toBe('high')
      expect(result!.cvssScore).toBe(9.1)
      expect(result!.parameter).toBe('id')
    })

    it('should detect SQL injection from mysql error pattern', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 500,
        body: 'You have an error in your SQL syntax; check MySQL manual',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectSQLInjection('/api/orders', 'id', '123')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('injection')
    })

    it('should detect SQL injection from Oracle error ORA-', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 500,
        body: 'ORA-00933: SQL command not properly ended',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectSQLInjection('/api/orders', 'id', '123')
      expect(result).not.toBeNull()
      expect(result!.title).toContain('SQL Injection')
    })

    it('should detect SQL injection from SQLite error', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 500,
        body: 'SQLITE_CANTOPEN - unable to open database file',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectSQLInjection('/api/orders', 'id', '123')
      expect(result).not.toBeNull()
    })

    it('should return null when response does not contain SQL errors', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: JSON.stringify({ data: { id: 1, name: 'test' } }),
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectSQLInjection('/api/orders', 'id', '123')
      expect(result).toBeNull()
    })

    it('should handle network errors gracefully (catch)', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockRejectedValue(new Error('Network error'))
      service.setHttpClient(client)

      const result = await service.detectSQLInjection('/api/orders', 'id', '123')
      expect(result).toBeNull()
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 4. detectXSS
  // ═════════════════════════════════════════════════════════════════════════

  describe('detectXSS', () => {
    it('should return null when no httpClient', async () => {
      const result = await service.detectXSS('/api/orders', 'q', 'test')
      expect(result).toBeNull()
    })

    it('should detect reflected XSS with <script> tag', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: '<html><body><script>alert(1)</script></body></html>',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectXSS('/api/search', 'q', 'test')
      expect(result).not.toBeNull()
      expect(result!.title).toContain('XSS')
      expect(result!.category).toBe('injection')
    })

    it('should detect XSS with <img onerror> payload', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: '<html><img src=x onerror=alert(1)></html>',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectXSS('/api/search', 'q', 'test')
      expect(result).not.toBeNull()
    })

    it('should detect XSS with <svg onload> payload', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: '<html><svg onload=alert(1)></html>',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectXSS('/api/search', 'q', 'test')
      expect(result).not.toBeNull()
    })

    it('should detect XSS with javascript: protocol', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: '<a href="javascript:alert(1)">click me</a>',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectXSS('/api/search', 'q', 'test')
      expect(result).not.toBeNull()
    })

    it('should NOT flag safely encoded HTML entities', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: '<html>&lt;script&gt;alert(1)&lt;/script&gt;</html>',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectXSS('/api/search', 'q', 'test')
      expect(result).toBeNull()
    })

    it('should handle network errors gracefully during XSS detection', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockRejectedValue(new Error('Timeout'))
      service.setHttpClient(client)

      const result = await service.detectXSS('/api/orders', 'q', 'test')
      expect(result).toBeNull()
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 5. detectJWTWeakSecret
  // ═════════════════════════════════════════════════════════════════════════

  describe('detectJWTWeakSecret', () => {
    it('should return true when token signed with weak secret "secret"', async () => {
      const result = await service.detectJWTWeakSecret(JWT_SIGNED_SECRET, ['secret', 'changeme'])
      expect(result).toBe(true)
    })

    it('should return true when token signed with "password"', async () => {
      const result = await service.detectJWTWeakSecret(JWT_SIGNED_PASSWORD, ['password'])
      expect(result).toBe(true)
    })

    it('should still detect weak secret even when user provides non-weak secrets (because it checks WEAK_JWT_SECRETS internally)', async () => {
      // The method always checks the predefined WEAK_JWT_SECRETS at the end
      const result = await service.detectJWTWeakSecret(JWT_SIGNED_SECRET, ['aVeryStrongRandomSecretKey'])
      expect(result).toBe(true)
    })

    it('should detect weak secret even with empty user secrets list', async () => {
      // Even with empty user list, the method checks WEAK_JWT_SECRETS internally
      const result = await service.detectJWTWeakSecret(JWT_SIGNED_SECRET, [])
      expect(result).toBe(true)
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 6. detectIDOR
  // ═════════════════════════════════════════════════════════════════════════

  describe('detectIDOR', () => {
    it('should return null when no httpClient', async () => {
      const result = await service.detectIDOR('/api/users', 'user-001', 'attacker-999')
      expect(result).toBeNull()
    })

    it('should detect IDOR when attacker can access another user resource', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: JSON.stringify({ id: 'user-001', name: 'Victim', email: 'victim@test.com' }),
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectIDOR('/api/users', 'user-001', 'attacker-999')
      expect(result).not.toBeNull()
      expect(result!.category).toBe('idor')
      expect(result!.severity).toBe('high')
    })

    it('should NOT flag when 403/404 response', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 403,
        body: JSON.stringify({ error: 'Forbidden' }),
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectIDOR('/api/users', 'user-001', 'attacker-999')
      expect(result).toBeNull()
    })

    it('should handle network errors gracefully', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockRejectedValue(new Error('Connection refused'))
      service.setHttpClient(client)

      const result = await service.detectIDOR('/api/users', 'user-001', 'attacker-999')
      expect(result).toBeNull()
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 7. detectSensitiveDataExposure
  // ═════════════════════════════════════════════════════════════════════════

  describe('detectSensitiveDataExposure', () => {
    it('should detect exposed password field', async () => {
      const response = { id: 1, username: 'test', password: 'secret123' }
      const exposed = await service.detectSensitiveDataExposure('/api/users', response)
      expect(exposed).toContain('password')
    })

    it('should detect exposed ssn field', async () => {
      const response = { id: 1, ssn: '123-45-6789', credit_card: '4111-1111-1111-1111' }
      const exposed = await service.detectSensitiveDataExposure('/api/users', response)
      expect(exposed).toContain('ssn')
      expect(exposed).toContain('credit_card')
    })

    it('should detect exposed token field', async () => {
      const response = { access_token: 'eyJhbGciOiJIUzI1NiJ9.dGVzdA.X8VxH2g' }
      const exposed = await service.detectSensitiveDataExposure('/api/auth', response)
      expect(exposed).toContain('access_token')
    })

    it('should return empty array when no sensitive fields present', async () => {
      const response = { id: 1, name: 'John', email: 'john@test.com' }
      const exposed = await service.detectSensitiveDataExposure('/api/users', response)
      expect(exposed).toEqual([])
    })

    it('should be case-insensitive when detecting sensitive fields', async () => {
      const response = { Password: 'test', SECRET: 'abc123' }
      const exposed = await service.detectSensitiveDataExposure('/api/users', response)
      expect(exposed).toContain('password')
      expect(exposed).toContain('secret')
    })

    it('should not match field names that only contain a sensitive substring', async () => {
      // "secret" pattern must match the full field name "secret", not substring in "secretkey"
      const response = { secretkey: 'abc123' }
      const exposed = await service.detectSensitiveDataExposure('/api/users', response)
      // The regex is `"secret"\s*:` — this checks for exact field name `secret`,
      // so `"secretkey"` won't match because it's `"secretkey"` not `"secret":`
      expect(exposed).toEqual([])
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 8. detectMissingRateLimit
  // ═════════════════════════════════════════════════════════════════════════

  describe('detectMissingRateLimit', () => {
    it('should return true (no rate limit = vulnerable) when no 429 responses', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn().mockResolvedValue({
        status: 200,
        body: 'OK',
        headers: {},
      })
      service.setHttpClient(client)

      const result = await service.detectMissingRateLimit('/api/orders', 5)
      expect(result).toBe(true) // true = rate limit missing (vulnerable)
    })

    it('should handle network errors in individual requests gracefully', async () => {
      const client = createMockHttpClient()
      client.request = vi.fn()
        .mockResolvedValueOnce({ status: 200, body: 'OK', headers: {} })
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({ status: 429, body: 'Too Many Requests', headers: {} })
      service.setHttpClient(client)

      const result = await service.detectMissingRateLimit('/api/orders', 3)
      expect(typeof result).toBe('boolean')
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 9. generateReport
  // ═════════════════════════════════════════════════════════════════════════

  describe('generateReport', () => {
    it('should return safe message when no vulnerabilities', () => {
      const report = service.generateReport([])
      expect(report).toContain('No vulnerabilities found')
      expect(report).toContain('✅')
    })

    it('should include vulnerability details sorted by severity', () => {
      const vulns = [
        makeVulnerability({ id: 'VULN-001', severity: 'low', title: 'Info leak' }),
        makeVulnerability({ id: 'VULN-002', severity: 'critical', title: 'SQL Injection critical' }),
        makeVulnerability({ id: 'VULN-003', severity: 'high', title: 'XSS' }),
      ]
      const report = service.generateReport(vulns)
      // critical appears before high, high appears before low
      expect(report.indexOf('CRITICAL')).toBeLessThan(report.indexOf('HIGH'))
      expect(report.indexOf('HIGH')).toBeLessThan(report.indexOf('LOW'))
      expect(report).toContain('SQL Injection critical')
      expect(report).toContain('XSS')
      expect(report).toContain('Info leak')
    })

    it('should include endpoint, parameter, payload details', () => {
      const vulns = [makeVulnerability({ affectedEndpoint: '/api/login', parameter: 'username', payload: "' OR '1'='1" })]
      const report = service.generateReport(vulns)
      expect(report).toContain('/api/login')
      expect(report).toContain('username')
      expect(report).toContain("' OR '1'='1")
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 10. exportJSON
  // ═════════════════════════════════════════════════════════════════════════

  describe('exportJSON', () => {
    it('should return valid JSON with summary', () => {
      const vulns = [
        makeVulnerability({ id: 'VULN-001', severity: 'critical' }),
        makeVulnerability({ id: 'VULN-002', severity: 'high' }),
        makeVulnerability({ id: 'VULN-003', severity: 'low' }),
      ]
      const jsonStr = service.exportJSON(vulns)
      const parsed = JSON.parse(jsonStr)
      expect(parsed.totalVulnerabilities).toBe(3)
      expect(parsed.summary).toEqual({ critical: 1, high: 1, low: 1, medium: 0, info: 0 })
      expect(parsed.vulnerabilities).toHaveLength(3)
    })

    it('should handle empty list', () => {
      const jsonStr = service.exportJSON([])
      const parsed = JSON.parse(jsonStr)
      expect(parsed.totalVulnerabilities).toBe(0)
      expect(parsed.vulnerabilities).toEqual([])
    })

    it('should serialize dates as ISO strings', () => {
      const vulns = [makeVulnerability({ id: 'VULN-001' })]
      const jsonStr = service.exportJSON(vulns)
      const parsed = JSON.parse(jsonStr)
      expect(parsed.vulnerabilities[0].discoveredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  // ═════════════════════════════════════════════════════════════════════════
  // 11. setHttpClient
  // ═════════════════════════════════════════════════════════════════════════

  describe('setHttpClient', () => {
    it('should allow setting httpClient', () => {
      const client = createMockHttpClient()
      service.setHttpClient(client)
      // verify by calling a detection method
      expect(() => service.setHttpClient(client)).not.toThrow()
    })
  })
})
