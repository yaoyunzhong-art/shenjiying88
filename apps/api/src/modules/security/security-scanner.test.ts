import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import {
  SecurityScannerService,
  type HttpClient,
  type Vulnerability,
} from './security-scanner.service'

describe('SecurityScannerService', () => {
  let service: SecurityScannerService
  let mockHttpClient: HttpClient

  beforeEach(() => {
    service = new SecurityScannerService()
    mockHttpClient = {
      request: vi.fn(),
    }
    service.setHttpClient(mockHttpClient)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── detectSQLInjection Tests ───────────────────────────────────────────────

  describe('detectSQLInjection', () => {
    it('should detect SQL injection vulnerability when SQL error is returned', async () => {
      // 模拟返回 SQL 错误响应
      vi.mocked(mockHttpClient.request).mockResolvedValueOnce({
        status: 500,
        body: 'You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version',
        headers: {},
      })

      const vuln = await service.detectSQLInjection(
        'http://example.com/api/user',
        'id',
        '123',
      )

      expect(vuln).not.toBeNull()
      expect(vuln!.title).toBe('SQL Injection Vulnerability')
      expect(vuln!.severity).toBe('high')
      expect(vuln!.category).toBe('injection')
      expect(vuln!.cvssScore).toBe(9.1)
      expect(vuln!.parameter).toBe('id')
      expect(vuln!.payload).toBe("' OR '1'='1")
      expect(vuln!.falsePositive).toBe(false)
    })

    it('should detect SQL injection with DROP TABLE payload', async () => {
      // 按顺序返回：第一个 payload 不触发 SQL 错误，第二个触发
      vi.mocked(mockHttpClient.request)
        .mockResolvedValueOnce({
          status: 200,
          body: '{"id": 1}', // 第一个 payload 不返回 SQL 错误
          headers: {},
        })
        .mockResolvedValueOnce({
          status: 500,
          body: 'SQLite3::exec(): near "DROP": syntax error in',
          headers: {},
        })

      const vuln = await service.detectSQLInjection(
        'http://example.com/api/user',
        'id',
        '123',
      )

      expect(vuln).not.toBeNull()
      expect(vuln!.payload).toBe("'; DROP TABLE users;--")
    })

    it('should detect SQL injection with UNION SELECT payload', async () => {
      // 前两个 payload 不触发 SQL 错误，第三个触发
      vi.mocked(mockHttpClient.request)
        .mockResolvedValueOnce({
          status: 200,
          body: '{"id": 1}',
          headers: {},
        })
        .mockResolvedValueOnce({
          status: 200,
          body: '{"id": 1}',
          headers: {},
        })
        .mockResolvedValueOnce({
          status: 500,
          body: 'PostgreSQL ERROR: syntax error at or near "UNION"',
          headers: {},
        })

      const vuln = await service.detectSQLInjection(
        'http://example.com/api/user',
        'id',
        '123',
      )

      expect(vuln).not.toBeNull()
      expect(vuln!.payload).toBe("' UNION SELECT NULL--")
    })

    it('should return null when no SQL injection is detected', async () => {
      vi.mocked(mockHttpClient.request).mockResolvedValue({
        status: 200,
        body: '{"id": 1, "name": "John"}',
        headers: {},
      })

      const vuln = await service.detectSQLInjection(
        'http://example.com/api/user',
        'id',
        '123',
      )

      expect(vuln).toBeNull()
    })

    it('should return null when httpClient is not set', async () => {
      const serviceWithoutClient = new SecurityScannerService()
      const vuln = await serviceWithoutClient.detectSQLInjection(
        'http://example.com/api/user',
        'id',
        '123',
      )

      expect(vuln).toBeNull()
    })
  })

  // ── detectXSS Tests ─────────────────────────────────────────────────────────

  describe('detectXSS', () => {
    it('should detect XSS vulnerability when unsanitized script tag is reflected', async () => {
      vi.mocked(mockHttpClient.request).mockResolvedValueOnce({
        status: 200,
        body: '<div>You entered: <script>alert(1)</script></div>',
        headers: {},
      })

      const vuln = await service.detectXSS(
        'http://example.com/api/search',
        'q',
        'test',
      )

      expect(vuln).not.toBeNull()
      expect(vuln!.title).toBe('Cross-Site Scripting (XSS) Vulnerability')
      expect(vuln!.severity).toBe('high')
      expect(vuln!.category).toBe('injection')
      expect(vuln!.cvssScore).toBe(8.1)
      expect(vuln!.parameter).toBe('q')
      expect(vuln!.payload).toBe('<script>alert(1)</script>')
    })

    it('should detect XSS with img onerror payload', async () => {
      // detectXSS 遍历所有 payloads，所以需要为每个 payload 设置 mock
      // 第一个 payload (<script>) 不触发，返回正常响应
      // 第二个 payload (<img>) 触发 XSS
      vi.mocked(mockHttpClient.request)
        .mockResolvedValueOnce({
          status: 200,
          body: '{"result":"safe content"}',
          headers: {},
        })
        .mockResolvedValueOnce({
          status: 200,
          body: '{"result":"<img src=x onerror=alert(1)>"}',
          headers: {},
        })

      const vuln = await service.detectXSS(
        'http://example.com/api/search',
        'q',
        'test',
      )

      expect(vuln).not.toBeNull()
      expect(vuln!.payload).toBe('<img src=x onerror=alert(1)>')
    })

    it('should detect XSS with svg onload payload', async () => {
      vi.mocked(mockHttpClient.request)
        .mockResolvedValueOnce({
          status: 200,
          body: '{"result":"safe content"}',
          headers: {},
        })
        .mockResolvedValueOnce({
          status: 200,
          body: '{"result":"safe content"}',
          headers: {},
        })
        .mockResolvedValueOnce({
          status: 200,
          body: '{"result":"<svg onload=alert(1)>"}',
          headers: {},
        })

      const vuln = await service.detectXSS(
        'http://example.com/api/search',
        'q',
        'test',
      )

      expect(vuln).not.toBeNull()
      expect(vuln!.payload).toBe('<svg onload=alert(1)>')
    })

    it('should return null when XSS payload is properly escaped', async () => {
      vi.mocked(mockHttpClient.request).mockResolvedValue({
        status: 200,
        body: '&lt;script&gt;alert(1)&lt;/script&gt;',
        headers: {},
      })

      const vuln = await service.detectXSS(
        'http://example.com/api/search',
        'q',
        'test',
      )

      expect(vuln).toBeNull()
    })

    it('should return null when httpClient is not set', async () => {
      const serviceWithoutClient = new SecurityScannerService()
      const vuln = await serviceWithoutClient.detectXSS(
        'http://example.com/api/search',
        'q',
        'test',
      )

      expect(vuln).toBeNull()
    })
  })

  // ── detectJWTWeakSecret Tests ───────────────────────────────────────────────

  describe('detectJWTWeakSecret', () => {
    it('should detect weak JWT secret "secret"', async () => {
      // 创建一个使用 'secret' 作为 secret 的 JWT token
      const jwt = await import('jsonwebtoken' as any)
      const token = jwt.sign({ userId: 1 }, 'secret', { expiresIn: '1h' })

      const result = await service.detectJWTWeakSecret(token, ['secret'])

      expect(result).toBe(true)
    })

    it('should detect weak JWT secret "password"', async () => {
      const jwt = await import('jsonwebtoken' as any)
      const token = jwt.sign({ userId: 1 }, 'password', { expiresIn: '1h' })

      const result = await service.detectJWTWeakSecret(token, ['password'])

      expect(result).toBe(true)
    })

    it('should return false for strong secrets', async () => {
      const jwt = await import('jsonwebtoken' as any)
      const token = jwt.sign({ userId: 1 }, 'my-super-secret-key-that-is-long-and-random', {
        expiresIn: '1h',
      })

      const result = await service.detectJWTWeakSecret(token, [
        'my-super-secret-key-that-is-long-and-random',
      ])

      expect(result).toBe(false)
    })

    it('should return false for invalid tokens', async () => {
      const result = await service.detectJWTWeakSecret('invalid-token', ['secret'])

      expect(result).toBe(false)
    })
  })

  // ── detectIDOR Tests ────────────────────────────────────────────────────────

  describe('detectIDOR', () => {
    it('should detect IDOR when attacker can access another user resource', async () => {
      vi.mocked(mockHttpClient.request).mockResolvedValueOnce({
        status: 200,
        body: '{"id": "resource-123", "ownerId": "user-456", "data": "sensitive"}',
        headers: {},
      })

      const vuln = await service.detectIDOR(
        'http://example.com/api/resource',
        'resource-123',
        'attacker-id',
      )

      expect(vuln).not.toBeNull()
      expect(vuln!.title).toBe('Insecure Direct Object Reference (IDOR)')
      expect(vuln!.severity).toBe('high')
      expect(vuln!.category).toBe('idor')
      expect(vuln!.cvssScore).toBe(7.5)
    })

    it('should return null when resource is properly protected', async () => {
      vi.mocked(mockHttpClient.request).mockResolvedValue({
        status: 403,
        body: 'Forbidden - You do not have access to this resource',
        headers: {},
      })

      const vuln = await service.detectIDOR(
        'http://example.com/api/resource',
        'resource-123',
        'attacker-id',
      )

      expect(vuln).toBeNull()
    })

    it('should return null when resource not found', async () => {
      vi.mocked(mockHttpClient.request).mockResolvedValue({
        status: 404,
        body: 'Not Found',
        headers: {},
      })

      const vuln = await service.detectIDOR(
        'http://example.com/api/resource',
        'resource-123',
        'attacker-id',
      )

      expect(vuln).toBeNull()
    })

    it('should return null when httpClient is not set', async () => {
      const serviceWithoutClient = new SecurityScannerService()
      const vuln = await serviceWithoutClient.detectIDOR(
        'http://example.com/api/resource',
        'resource-123',
        'attacker-id',
      )

      expect(vuln).toBeNull()
    })
  })

  // ── detectSensitiveDataExposure Tests ─────────────────────────────────────

  describe('detectSensitiveDataExposure', () => {
    it('should detect password field in response', async () => {
      const response = {
        id: '123',
        username: 'john',
        password: 'secret123',
      }

      const exposed = await service.detectSensitiveDataExposure(
        'http://example.com/api/user',
        response,
      )

      expect(exposed).toContain('password')
    })

    it('should detect credit_card field in response', async () => {
      const response = {
        id: '123',
        order: 'order-456',
        credit_card: '4111111111111111',
      }

      const exposed = await service.detectSensitiveDataExposure(
        'http://example.com/api/payment',
        response,
      )

      expect(exposed).toContain('credit_card')
    })

    it('should detect multiple sensitive fields', async () => {
      const response = {
        id: '123',
        username: 'john',
        password: 'secret123',
        ssn: '123-45-6789',
        api_key: 'sk-1234567890',
      }

      const exposed = await service.detectSensitiveDataExposure(
        'http://example.com/api/user',
        response,
      )

      expect(exposed).toContain('password')
      expect(exposed).toContain('ssn')
      expect(exposed).toContain('api_key')
    })

    it('should return empty array when no sensitive data is exposed', async () => {
      const response = {
        id: '123',
        username: 'john',
        email: 'john@example.com',
      }

      const exposed = await service.detectSensitiveDataExposure(
        'http://example.com/api/user',
        response,
      )

      expect(exposed).toHaveLength(0)
    })
  })

  // ── detectMissingRateLimit Tests ────────────────────────────────────────────

  describe('detectMissingRateLimit', () => {
    it('should detect missing rate limit when requests are not throttled', async () => {
      // 模拟所有请求都成功（没有被限制）
      vi.mocked(mockHttpClient.request).mockResolvedValue({
        status: 200,
        body: '{"success": true}',
        headers: {},
      })

      const hasRateLimit = await service.detectMissingRateLimit(
        'http://example.com/api/test',
        50,
      )

      // 没有被阻止的请求，说明缺少 rate limit
      expect(hasRateLimit).toBe(true)
    })

    it('should return false when rate limit is present', async () => {
      // 模拟大部分请求被限流
      let callCount = 0
      ;(vi.mocked(mockHttpClient.request) as any).mockImplementation(async () => {
        callCount++
        if (callCount > 30) {
          return {
            status: 429,
            body: 'Too Many Requests',
            headers: { 'retry-after': '60' },
          }
        }
        return {
          status: 200,
          body: '{"success": true}',
          headers: {},
        }
      })

      const hasRateLimit = await service.detectMissingRateLimit(
        'http://example.com/api/test',
        50,
      )

      // 有请求被阻止，说明有 rate limit
      expect(hasRateLimit).toBe(false)
    })

    it('should return false when httpClient is not set', async () => {
      const serviceWithoutClient = new SecurityScannerService()
      const hasRateLimit = await serviceWithoutClient.detectMissingRateLimit(
        'http://example.com/api/test',
        50,
      )

      expect(hasRateLimit).toBe(false)
    })
  })

  // ── scan Tests ───────────────────────────────────────────────────────────────

  describe('scan', () => {
    it('should scan endpoint and detect vulnerabilities', async () => {
      // 模拟 SQL 注入响应
      vi.mocked(mockHttpClient.request).mockResolvedValueOnce({
        status: 500,
        body: 'You have an error in your SQL syntax',
        headers: {},
      })

      // 模拟 XSS 响应
      vi.mocked(mockHttpClient.request).mockResolvedValueOnce({
        status: 200,
        body: '<div><script>alert(1)</script></div>',
        headers: {},
      })

      const vulnerabilities = await service.scan({
        endpoint: 'http://example.com/api/user',
        method: 'POST',
        parameters: { id: '123', name: 'test' },
      })

      expect(vulnerabilities.length).toBeGreaterThan(0)
    })

    it('should return empty array when no vulnerabilities found', async () => {
      vi.mocked(mockHttpClient.request).mockResolvedValue({
        status: 200,
        body: '{"success": true}',
        headers: {},
      })

      const vulnerabilities = await service.scan({
        endpoint: 'http://example.com/api/user',
        method: 'POST',
        parameters: { id: '123' },
      })

      expect(vulnerabilities).toHaveLength(0)
    })

    it('should return empty array when no parameters provided', async () => {
      const vulnerabilities = await service.scan({
        endpoint: 'http://example.com/api/user',
        method: 'GET',
      })

      expect(vulnerabilities).toHaveLength(0)
    })
  })

  // ── scanMultiple Tests ───────────────────────────────────────────────────────

  describe('scanMultiple', () => {
    it('should scan multiple targets', async () => {
      vi.mocked(mockHttpClient.request).mockResolvedValue({
        status: 200,
        body: '{"success": true}',
        headers: {},
      })

      const targets = [
        { endpoint: 'http://example.com/api/user', method: 'POST', parameters: { id: '1' } },
        { endpoint: 'http://example.com/api/post', method: 'POST', parameters: { id: '2' } },
      ] as any

      const results = await service.scanMultiple(targets)

      expect(results.size).toBe(2)
    })
  })

  // ── generateReport Tests ─────────────────────────────────────────────────────

  describe('generateReport', () => {
    it('should generate report with no vulnerabilities', () => {
      const report = service.generateReport([])

      expect(report).toContain('No vulnerabilities found')
    })

    it('should generate report sorted by severity', () => {
      const vulnerabilities: Vulnerability[] = [
        {
          id: 'v1',
          title: 'Low severity vuln',
          description: 'test',
          category: 'injection',
          severity: 'low',
          discoveredAt: new Date(),
          falsePositive: false,
          remediation: 'fix it',
        },
        {
          id: 'v2',
          title: 'Critical severity vuln',
          description: 'test',
          category: 'injection',
          severity: 'critical',
          discoveredAt: new Date(),
          falsePositive: false,
          remediation: 'fix it',
        },
        {
          id: 'v3',
          title: 'High severity vuln',
          description: 'test',
          category: 'injection',
          severity: 'high',
          discoveredAt: new Date(),
          falsePositive: false,
          remediation: 'fix it',
        },
      ]

      const report = service.generateReport(vulnerabilities)

      // critical 应该在最前面
      const criticalIndex = report.indexOf('CRITICAL')
      const highIndex = report.indexOf('HIGH')
      const lowIndex = report.indexOf('LOW')

      expect(criticalIndex).toBeLessThan(highIndex)
      expect(highIndex).toBeLessThan(lowIndex)
    })

    it('should include vulnerability details in report', () => {
      const vulnerabilities: Vulnerability[] = [
        {
          id: 'VULN-001',
          title: 'SQL Injection',
          description: 'SQL injection detected',
          category: 'injection',
          severity: 'high',
          cvssScore: 9.1,
          affectedEndpoint: '/api/user',
          parameter: 'id',
          payload: "' OR '1'='1",
          remediation: 'Use parameterized queries',
          discoveredAt: new Date(),
          falsePositive: false,
        },
      ]

      const report = service.generateReport(vulnerabilities)

      expect(report).toContain('VULN-001')
      expect(report).toContain('SQL Injection')
      expect(report).toContain('/api/user')
      expect(report).toContain("' OR '1'='1")
      expect(report).toContain('9.1')
    })
  })

  // ── exportJSON Tests ─────────────────────────────────────────────────────────

  describe('exportJSON', () => {
    it('should export vulnerabilities as JSON', () => {
      const vulnerabilities: Vulnerability[] = [
        {
          id: 'VULN-001',
          title: 'SQL Injection',
          description: 'SQL injection detected',
          category: 'injection',
          severity: 'high',
          cvssScore: 9.1,
          affectedEndpoint: '/api/user',
          remediation: 'Use parameterized queries',
          discoveredAt: new Date('2024-01-01T00:00:00Z'),
          falsePositive: false,
        },
      ]

      const json = service.exportJSON(vulnerabilities)
      const parsed = JSON.parse(json)

      expect(parsed.totalVulnerabilities).toBe(1)
      expect(parsed.vulnerabilities).toHaveLength(1)
      expect(parsed.vulnerabilities[0].id).toBe('VULN-001')
      expect(parsed.summary.high).toBe(1)
    })

    it('should include generated timestamp', () => {
      const json = service.exportJSON([])
      const parsed = JSON.parse(json)

      expect(parsed.generatedAt).toBeTruthy()
    })

    it('should handle empty vulnerabilities array', () => {
      const json = service.exportJSON([])
      const parsed = JSON.parse(json)

      expect(parsed.totalVulnerabilities).toBe(0)
      expect(parsed.vulnerabilities).toHaveLength(0)
      expect(parsed.summary.critical).toBe(0)
      expect(parsed.summary.high).toBe(0)
    })
  })
})
