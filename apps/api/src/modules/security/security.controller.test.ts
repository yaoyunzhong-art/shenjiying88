import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { SecurityController } from './security.controller'
import { SecurityScannerService } from './security-scanner.service'
import { WAFService } from './waf.service'
import type { SecurityVulnerability, WAFRule, WAFDecision } from './security.entity'

describe('SecurityController', () => {
  let controller: SecurityController
  let scannerService: SecurityScannerService
  let wafService: WAFService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityController],
      providers: [SecurityScannerService, WAFService],
    }).compile()

    controller = module.get<SecurityController>(SecurityController)
    scannerService = module.get<SecurityScannerService>(SecurityScannerService)
    wafService = module.get<WAFService>(WAFService)
  })

  // ── scan ─────────────────────────────────────────────────────────────────

  describe('POST /security/scan', () => {
    it('should scan a target and return vulnerabilities', async () => {
      const spy = vi.spyOn(scannerService, 'scan').mockResolvedValue([
        {
          id: 'VULN-001',
          title: 'SQL Injection',
          description: 'Test SQL injection',
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
      ])

      const result = await controller.scan({
        target: {
          endpoint: 'http://example.com/api/user',
          method: 'POST',
          parameters: { id: '1' },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('SQL Injection')
      expect(spy).toHaveBeenCalledOnce()
    })

    it('should return empty array when no vulnerabilities found', async () => {
      vi.spyOn(scannerService, 'scan').mockResolvedValue([])

      const result = await controller.scan({
        target: {
          endpoint: 'http://example.com/api/safe',
          method: 'GET',
        },
      })

      expect(result).toHaveLength(0)
    })
  })

  // ── batchScan ──────────────────────────────────────────────────────────

  describe('POST /security/scan/batch', () => {
    it('should scan multiple targets', async () => {
      const results = new Map()
      results.set(
        { endpoint: 'http://example.com/a', method: 'GET' as const },
        [{ id: 'V1', title: 'XSS', description: 'xss', category: 'injection', severity: 'high', remediation: 'fix', discoveredAt: new Date(), falsePositive: false }],
      )
      results.set(
        { endpoint: 'http://example.com/b', method: 'GET' as const },
        [],
      )

      vi.spyOn(scannerService, 'scanMultiple').mockResolvedValue(results)

      const result = await controller.batchScan({
        targets: [
          { endpoint: 'http://example.com/a', method: 'GET' },
          { endpoint: 'http://example.com/b', method: 'GET' },
        ],
      })

      expect(result).toHaveLength(2)
      expect(result[0].vulnerabilities).toHaveLength(1)
      expect(result[1].vulnerabilities).toHaveLength(0)
    })
  })

  // ── detectSensitiveData ──────────────────────────────────────────────

  describe('POST /security/detect/sensitive-data', () => {
    it('should detect exposed password field', async () => {
      vi.spyOn(scannerService, 'detectSensitiveDataExposure').mockResolvedValue([
        'password',
      ])

      const result = await controller.detectSensitiveData({
        endpoint: '/api/user',
        response: { username: 'john', password: 'secret' },
      })

      expect(result.exposedFields).toContain('password')
    })

    it('should return empty array for safe response', async () => {
      vi.spyOn(scannerService, 'detectSensitiveDataExposure').mockResolvedValue([])

      const result = await controller.detectSensitiveData({
        endpoint: '/api/user',
        response: { username: 'john', email: 'john@example.com' },
      })

      expect(result.exposedFields).toHaveLength(0)
    })
  })

  // ── detectJWTWeakSecret ──────────────────────────────────────────────

  describe('POST /security/detect/jwt-weak-secret', () => {
    it('should detect weak JWT secret', async () => {
      vi.spyOn(scannerService, 'detectJWTWeakSecret').mockResolvedValue(true)

      const result = await controller.detectJWTWeakSecret({
        token: 'fake-token',
        secrets: ['secret'],
      })

      expect(result.weak).toBe(true)
    })

    it('should return false for strong secret', async () => {
      vi.spyOn(scannerService, 'detectJWTWeakSecret').mockResolvedValue(false)

      const result = await controller.detectJWTWeakSecret({
        token: 'strong-token',
        secrets: ['strong-secret'],
      })

      expect(result.weak).toBe(false)
    })
  })

  // ── detectIDOR ───────────────────────────────────────────────────────

  describe('POST /security/detect/idor', () => {
    it('should detect IDOR vulnerability', async () => {
      const vuln: SecurityVulnerability = {
        id: 'VULN-IDOR-001',
        title: 'Insecure Direct Object Reference (IDOR)',
        description: 'IDOR detected',
        category: 'idor',
        severity: 'high',
        cvssScore: 7.5,
        affectedEndpoint: '/api/resource/123',
        remediation: 'Implement authorization checks',
        discoveredAt: new Date(),
        falsePositive: false,
      }

      vi.spyOn(scannerService, 'detectIDOR').mockResolvedValue(vuln)

      const result = await controller.detectIDOR({
        endpoint: '/api/resource',
        resourceId: '123',
        attackerId: 'attacker-1',
      })

      expect(result).not.toBeNull()
      expect(result!.category).toBe('idor')
    })

    it('should return null when no IDOR found', async () => {
      vi.spyOn(scannerService, 'detectIDOR').mockResolvedValue(null)

      const result = await controller.detectIDOR({
        endpoint: '/api/resource',
        resourceId: '123',
        attackerId: 'attacker-1',
      })

      expect(result).toBeNull()
    })
  })

  // ── detectMissingRateLimit ─────────────────────────────────────────

  describe('POST /security/detect/missing-rate-limit', () => {
    it('should detect missing rate limit', async () => {
      vi.spyOn(scannerService, 'detectMissingRateLimit').mockResolvedValue(true)

      const result = await controller.detectMissingRateLimit({
        endpoint: '/api/test',
        count: 50,
      })

      expect(result.missingRateLimit).toBe(true)
    })

    it('should report present rate limit', async () => {
      vi.spyOn(scannerService, 'detectMissingRateLimit').mockResolvedValue(false)

      const result = await controller.detectMissingRateLimit({
        endpoint: '/api/test',
      })

      expect(result.missingRateLimit).toBe(false)
    })
  })

  // ── report ──────────────────────────────────────────────────────────────

  describe('POST /security/report', () => {
    it('should generate text report', () => {
      const vulns: SecurityVulnerability[] = [
        {
          id: 'V1',
          title: 'Critical SQLI',
          description: 'desc',
          category: 'injection',
          severity: 'critical',
          remediation: 'fix',
          discoveredAt: new Date(),
          falsePositive: false,
        },
      ]

      const report = controller.generateReport({ vulnerabilities: vulns })

      expect(report).toContain('Critical SQLI')
      expect(report).toContain('CRITICAL')
    })

    it('should return safe message when no vulnerabilities', () => {
      const report = controller.generateReport({ vulnerabilities: [] })
      expect(report).toContain('No vulnerabilities')
    })
  })

  // ── exportJSONReport ──────────────────────────────────────────────────

  describe('POST /security/report/json', () => {
    it('should export JSON report', () => {
      const vulns: SecurityVulnerability[] = [
        {
          id: 'V1',
          title: 'XSS',
          description: 'desc',
          category: 'injection',
          severity: 'high',
          remediation: 'fix',
          discoveredAt: new Date('2024-01-01'),
          falsePositive: false,
        },
      ]

      const report = controller.exportJSONReport({ vulnerabilities: vulns })

      expect(report.totalVulnerabilities).toBe(1)
      expect(report.summary.high).toBe(1)
      expect(report.vulnerabilities).toHaveLength(1)
    })

    it('should handle empty vulnerability list', () => {
      const report = controller.exportJSONReport({ vulnerabilities: [] })

      expect(report.totalVulnerabilities).toBe(0)
      expect(report.summary.critical).toBe(0)
    })
  })

  // ── WAF Rules CRUD ───────────────────────────────────────────────────

  describe('GET /security/waf/rules', () => {
    it('should list all WAF rules', () => {
      const rules = controller.listWAFRules()

      expect(rules.length).toBeGreaterThan(0)
      expect(rules[0]).toHaveProperty('id')
      expect(rules[0]).toHaveProperty('name')
    })
  })

  describe('POST /security/waf/rules', () => {
    it('should create a WAF rule', () => {
      const rule = controller.createWAFRule({
        name: 'Test Rule',
        condition: {
          type: 'ip',
          operator: 'equals',
          value: '1.2.3.4',
        },
        action: 'block',
        priority: 50,
        enabled: true,
      })

      expect(rule.id).toBeTruthy()
      expect(rule.name).toBe('Test Rule')
      expect(rule.action).toBe('block')
    })

    it('should create rule even with edge values (unit test without global pipe)', () => {
      // ValidationPipe 在单元测试中不生效，只验证方法能正常执行
      const rule = controller.createWAFRule({
        name: 'Edge Rule',
        condition: { type: 'ip', operator: 'equals', value: '1.2.3.4' },
        action: 'block',
        priority: 1,
        enabled: true,
      })
      expect(rule.name).toBe('Edge Rule')
    })
  })

  describe('PUT /security/waf/rules/:id', () => {
    it('should update an existing WAF rule', () => {
      const created = controller.createWAFRule({
        name: 'Original',
        condition: { type: 'ip', operator: 'equals', value: '1.2.3.4' },
        action: 'block',
        priority: 10,
        enabled: true,
      })

      const updated = controller.updateWAFRule(created.id, {
        name: 'Updated',
        priority: 20,
      })

      expect(updated.name).toBe('Updated')
      expect(updated.priority).toBe(20)
    })

    it('should throw 404 for non-existent rule', () => {
      expect(() =>
        controller.updateWAFRule('non-existent-id', { name: 'test' }),
      ).toThrow()
    })
  })

  describe('DELETE /security/waf/rules/:id', () => {
    it('should delete an existing WAF rule', () => {
      const created = controller.createWAFRule({
        name: 'To Delete',
        condition: { type: 'path', operator: 'equals', value: '/test' },
        action: 'block',
        priority: 10,
        enabled: true,
      })

      const result = controller.deleteWAFRule(created.id)
      expect(result.deleted).toBe(true)
    })

    it('should throw 404 for non-existent rule', () => {
      expect(() =>
        controller.deleteWAFRule('non-existent-id'),
      ).toThrow()
    })
  })

  // ── WAF Evaluate ────────────────────────────────────────────────────

  describe('POST /security/waf/evaluate', () => {
    it('should block malicious IP', () => {
      const decision = controller.evaluateWAF({
        ip: '192.168.100.100',
        path: '/api/test',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    it('should allow safe request', () => {
      const decision = controller.evaluateWAF({
        ip: '1.2.3.4',
        path: '/api/users',
        body: '{"name": "test"}',
      })

      expect(decision.allowed).toBe(true)
      expect(decision.riskLevel).toBe('safe')
    })
  })

  // ── WAF Logs ────────────────────────────────────────────────────────

  describe('GET /security/waf/logs', () => {
    it('should return blocked logs', () => {
      // Trigger a block
      controller.evaluateWAF({
        ip: '192.168.100.100',
        path: '/api/test',
      })

      const logs = controller.getWAFLogs()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].allowed).toBe(false)
    })

    it('should respect limit parameter', () => {
      // Trigger multiple blocks
      for (let i = 0; i < 5; i++) {
        controller.evaluateWAF({
          ip: '192.168.100.100',
          path: `/api/test/${i}`,
        })
      }

      const logs = controller.getWAFLogs(2)
      expect(logs.length).toBe(2)
    })
  })

  // ── 边界测试 ───────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle WAF evaluate with empty body', () => {
      const decision = controller.evaluateWAF({
        ip: '1.2.3.4',
        path: '/api/test',
        body: '',
      })

      expect(decision.allowed).toBe(true)
    })

    it('should handle scan with missing parameters', async () => {
      vi.spyOn(scannerService, 'scan').mockResolvedValue([])

      const result = await controller.scan({
        target: {
          endpoint: 'http://example.com/api/test',
          method: 'GET',
        },
      })

      expect(result).toHaveLength(0)
    })
  })
})
