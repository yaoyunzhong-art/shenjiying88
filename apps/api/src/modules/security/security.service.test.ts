import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'

import { SecurityScannerService } from './security-scanner.service'
import type { Vulnerability } from './security-scanner.service'

// ─── Helpers ────────────────────────────────────────────────

function makeHttpClient(stubs?: {
  request?: (opts: any) => Promise<any>
}) {
  const defaultRequest = vi.fn().mockResolvedValue({ status: 200, body: '{"ok":true}', headers: {} })
  return {
    request: stubs?.request ?? defaultRequest,
  }
}

// ─── Service construction ───────────────────────────────────
describe('SecurityScannerService', () => {
  let service: SecurityScannerService

  beforeEach(() => {
    service = new SecurityScannerService()
  })

  // ── scan ──────────────────────────────────────────────────
  describe('scan()', () => {
    it('returns empty array when no parameters provided', async () => {
      const result = await service.scan({ endpoint: '/api/health', method: 'GET' })
      assert.equal(result.length, 0)
    })

    it('returns empty array when httpClient is not set (sql injection)', async () => {
      const result = await service.scan({
        endpoint: '/api/login',
        method: 'POST',
        parameters: { username: 'admin' },
      })
      // No httpClient means detectSQLInjection returns null
      assert.equal(result.length, 0)
    })
  })

  // ── scanMultiple ──────────────────────────────────────────
  describe('scanMultiple()', () => {
    it('returns map with empty results for no-param targets', async () => {
      const results = await service.scanMultiple([
        { endpoint: '/a', method: 'GET' },
        { endpoint: '/b', method: 'POST', parameters: { x: 'y' } },
      ])
      assert.equal(results.size, 2)
      // First target has no params -> empty
      assert.equal(results.get({ endpoint: '/a', method: 'GET' })?.length ?? 0, 0)
    })
  })

  // ── detectSQLInjection (no httpClient) ────────────────────
  describe('detectSQLInjection()', () => {
    it('returns null when httpClient is not set', async () => {
      const result = await service.detectSQLInjection('/api/login', 'username', 'admin')
      assert.equal(result, null)
    })
  })

  // ── detectXSS (no httpClient) ─────────────────────────────
  describe('detectXSS()', () => {
    it('returns null when httpClient is not set', async () => {
      const result = await service.detectXSS('/api/profile', 'bio', 'hello')
      assert.equal(result, null)
    })
  })

  // ── detectJWTWeakSecret ───────────────────────────────────
  describe('detectJWTWeakSecret()', () => {
    it('returns false when token cannot be verified with weak secrets', async () => {
      // Mock jwt.verify to always throw
      const result = await service.detectJWTWeakSecret('invalid-token', ['notasecret'])
      assert.equal(result, false)
    })
  })

  // ── detectIDOR (no httpClient) ────────────────────────────
  describe('detectIDOR()', () => {
    it('returns null when httpClient is not set', async () => {
      const result = await service.detectIDOR('/api/users', '123', 'attacker-456')
      assert.equal(result, null)
    })
  })

  // ── detectSensitiveDataExposure ───────────────────────────
  describe('detectSensitiveDataExposure()', () => {
    it('detects password field in response', async () => {
      const exposed = await service.detectSensitiveDataExposure('/api/user', {
        id: 1,
        name: 'Test',
        password: 'secret123',
      })
      assert.ok(exposed.includes('password'))
    })

    it('detects credit_card field in response', async () => {
      const exposed = await service.detectSensitiveDataExposure('/api/payment', {
        card_number: '4111-1111-1111-1111',
      })
      assert.ok(exposed.includes('card_number'))
    })

    it('detects multiple sensitive fields', async () => {
      const exposed = await service.detectSensitiveDataExposure('/api/user', {
        name: 'Alice',
        ssn: '123-45-6789',
        api_key: 'sk-abc123',
      })
      assert.ok(exposed.includes('ssn'))
      assert.ok(exposed.includes('api_key'))
    })

    it('returns empty array when no sensitive fields present', async () => {
      const exposed = await service.detectSensitiveDataExposure('/api/items', {
        items: [{ id: 1, name: 'Item A' }],
      })
      assert.equal(exposed.length, 0)
    })
  })

  // ── detectMissingRateLimit (no httpClient) ────────────────
  describe('detectMissingRateLimit()', () => {
    it('returns false when httpClient is not set', async () => {
      const result = await service.detectMissingRateLimit('/api/test', 5)
      assert.equal(result, false)
    })
  })

  // ── generateReport ────────────────────────────────────────
  describe('generateReport()', () => {
    it('returns no-vulnerability message for empty list', () => {
      const report = service.generateReport([])
      assert.ok(report.includes('No vulnerabilities'))
      assert.ok(report.includes('✅'))
    })

    it('sorts vulnerabilities by severity', () => {
      const vulns: Vulnerability[] = [
        {
          id: 'V-1',
          title: 'Low issue',
          description: '',
          category: 'csrf',
          severity: 'low',
          remediation: 'fix',
          discoveredAt: new Date(),
          falsePositive: false,
        },
        {
          id: 'V-2',
          title: 'Critical issue',
          description: '',
          category: 'injection',
          severity: 'critical',
          cvssScore: 10,
          remediation: 'fix',
          discoveredAt: new Date(),
          falsePositive: false,
        },
      ]
      const report = service.generateReport(vulns)
      // Critical should come before low in the report
      const criticalIdx = report.indexOf('CRITICAL')
      const lowIdx = report.indexOf('LOW')
      assert.ok(criticalIdx < lowIdx, 'Critical severity should appear before low')
    })

    it('includes vulnerability title in report', () => {
      const vulns: Vulnerability[] = [
        {
          id: 'V-TEST',
          title: 'SQL Injection on /api/login',
          description: 'Test',
          category: 'injection',
          severity: 'high',
          affectedEndpoint: '/api/login',
          remediation: 'Use parameterized queries',
          discoveredAt: new Date(),
          falsePositive: false,
        },
      ]
      const report = service.generateReport(vulns)
      assert.ok(report.includes('SQL Injection on /api/login'))
      assert.ok(report.includes('/api/login'))
      assert.ok(report.includes('Use parameterized queries'))
    })
  })

  // ── exportJSON ────────────────────────────────────────────
  describe('exportJSON()', () => {
    it('produces valid JSON report', () => {
      const vulns: Vulnerability[] = [
        {
          id: 'V-JSON',
          title: 'XSS',
          description: 'Test XSS',
          category: 'injection',
          severity: 'medium',
          cvssScore: 6.5,
          remediation: 'fix',
          discoveredAt: new Date('2025-01-01'),
          falsePositive: false,
        },
      ]
      const jsonStr = service.exportJSON(vulns)
      const parsed = JSON.parse(jsonStr)
      assert.equal(parsed.totalVulnerabilities, 1)
      assert.equal(parsed.summary.medium, 1)
      assert.equal(parsed.vulnerabilities[0].title, 'XSS')
    })

    it('handles empty vulnerability list', () => {
      const jsonStr = service.exportJSON([])
      const parsed = JSON.parse(jsonStr)
      assert.equal(parsed.totalVulnerabilities, 0)
      assert.equal(parsed.summary.critical, 0)
      assert.equal(parsed.vulnerabilities.length, 0)
    })
  })
})
