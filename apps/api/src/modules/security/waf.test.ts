import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { WAFService, type WAFRule } from './waf.service'

describe('WAFService', () => {
  let service: WAFService

  beforeEach(() => {
    service = new WAFService()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── Rule Management Tests ─────────────────────────────────────────────────

  describe('Rule Management', () => {
    it('should add a rule', () => {
      const rule = service.addRule({
        name: 'Test Rule',
        condition: {
          type: 'ip',
          operator: 'equals',
          value: '192.168.1.1',
        },
        action: 'block',
        priority: 10,
        enabled: true,
      })

      expect(rule.id).toBeTruthy()
      expect(rule.name).toBe('Test Rule')
    })

    it('should update a rule', () => {
      const rule = service.addRule({
        name: 'Test Rule',
        condition: {
          type: 'ip',
          operator: 'equals',
          value: '192.168.1.1',
        },
        action: 'block',
        priority: 10,
        enabled: true,
      })

      const updated = service.updateRule(rule.id, {
        name: 'Updated Rule',
        priority: 20,
      })

      expect(updated.name).toBe('Updated Rule')
      expect(updated.priority).toBe(20)
    })

    it('should delete a rule', () => {
      const rule = service.addRule({
        name: 'Test Rule',
        condition: {
          type: 'ip',
          operator: 'equals',
          value: '192.168.1.1',
        },
        action: 'block',
        priority: 10,
        enabled: true,
      })

      service.deleteRule(rule.id)

      expect(() => service.deleteRule(rule.id)).toThrow()
    })

    it('should list rules sorted by priority', () => {
      service.addRule({
        name: 'Low Priority',
        condition: { type: 'path', operator: 'equals', value: '/test' },
        action: 'allow',
        priority: 100,
        enabled: true,
      })

      service.addRule({
        name: 'High Priority',
        condition: { type: 'path', operator: 'equals', value: '/test' },
        action: 'block',
        priority: 0, // Use priority 0 to ensure it comes before built-in rules with priority 1
        enabled: true,
      })

      const rules = service.listRules()

      // Find the indices of our custom rules
      const highPriorityIndex = rules.findIndex(r => r.name === 'High Priority')
      const lowPriorityIndex = rules.findIndex(r => r.name === 'Low Priority')

      // High Priority (priority 0) should come before Low Priority (priority 100)
      expect(highPriorityIndex).toBeLessThan(lowPriorityIndex)
    })
  })

  // ── Evaluate Tests ───────────────────────────────────────────────────────

  describe('evaluate', () => {
    // 1. WAF evaluate 阻止恶意 IP
    it('should block malicious IP', () => {
      const decision = service.evaluate({
        ip: '192.168.100.100', // 已知恶意 IP
        path: '/api/test',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
      expect(decision.matchedRule?.name).toBe('Block Known Malicious IPs')
    })

    // 2. WAF evaluate 阻止 SQL 注入 pattern
    it('should block SQL injection pattern', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/user',
        body: "'; DROP TABLE users;--",
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    it('should block SQL injection with UNION SELECT', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/search',
        body: "' UNION SELECT NULL--",
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    // 3. WAF evaluate 允许正常请求
    it('should allow normal request', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/users',
        body: '{"name": "John", "email": "john@example.com"}',
      })

      expect(decision.allowed).toBe(true)
      expect(decision.riskLevel).toBe('safe')
    })

    it('should allow request with safe content', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/search',
        body: 'search term',
      })

      expect(decision.allowed).toBe(true)
    })

    // ── XSS Pattern Detection ──────────────────────────────────────────────

    it('should block XSS with script tag', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/comment',
        body: '<script>alert(1)</script>',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    it('should block XSS with img onerror', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/comment',
        body: '<img src=x onerror=alert(1)>',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    it('should block XSS with svg onload', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/comment',
        body: '<svg onload=alert(1)>',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    it('should block XSS with javascript protocol', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/link',
        body: 'javascript:alert(1)',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    // ── Path-based Blocking ─────────────────────────────────────────────────

    it('should block admin config path', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/admin/config',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    it('should log sensitive paths', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/.env',
      })

      // log 规则应该允许通过但记录
      expect(decision.allowed).toBe(true)
      expect(decision.matchedRule?.name).toBe('Log Sensitive Paths')
    })

    // ── Rate Limiting ──────────────────────────────────────────────────────

    it('should block when rate limit exceeded', async () => {
      // 先触发多个请求模拟超过限制
      vi.advanceTimersByTime(0)

      // 发送 101 个请求（超过默认的 100 限制）
      for (let i = 0; i < 101; i++) {
        service.evaluate({
          ip: '5.6.7.8',
          path: '/api/test',
        })
      }

      // 最后一个请求应该被阻止
      const decision = service.evaluate({
        ip: '5.6.7.8',
        path: '/api/test',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.matchedRule?.name).toBe('Rate Limiting - 100 req/min')
    })

    // ── Edge Cases ─────────────────────────────────────────────────────────

    it('should allow request without ip', () => {
      const decision = service.evaluate({
        path: '/api/test',
      })

      // 没有 IP 的请求不应该被 IP 黑名单阻止
      expect(decision.allowed).toBe(true)
    })

    it('should handle empty body', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/test',
        body: '',
      })

      expect(decision.allowed).toBe(true)
    })

    it('should handle undefined body', () => {
      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/test',
      })

      expect(decision.allowed).toBe(true)
    })
  })

  // ── getBlockedLogs Tests ─────────────────────────────────────────────────

  describe('getBlockedLogs', () => {
    it('should return blocked logs', () => {
      // 触发一个阻止
      service.evaluate({
        ip: '192.168.100.100',
        path: '/api/test',
      })

      const logs = service.getBlockedLogs()

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].allowed).toBe(false)
    })

    it('should respect limit parameter', () => {
      // 触发多个阻止
      for (let i = 0; i < 5; i++) {
        service.evaluate({
          ip: '192.168.100.100',
          path: `/api/test${i}`,
        })
      }

      const logs = service.getBlockedLogs(3)

      expect(logs.length).toBe(3)
    })

    it('should return empty array when no blocked requests', () => {
      const logs = service.getBlockedLogs()

      expect(logs.length).toBe(0)
    })
  })

  // ── Built-in Rules Tests ─────────────────────────────────────────────────

  describe('Built-in Rules', () => {
    it('should have SQL injection detection rules', () => {
      const rules = service.listRules()

      const sqlRules = rules.filter(
        (r) => r.name === 'SQL Injection Pattern Detection' && r.enabled,
      )

      expect(sqlRules.length).toBeGreaterThan(0)
    })

    it('should have XSS detection rules', () => {
      const rules = service.listRules()

      const xssRules = rules.filter(
        (r) => r.name === 'XSS Pattern Detection' && r.enabled,
      )

      expect(xssRules.length).toBeGreaterThan(0)
    })

    it('should have rate limiting rule', () => {
      const rules = service.listRules()

      const rateLimitRule = rules.find(
        (r) => r.name === 'Rate Limiting - 100 req/min' && r.enabled,
      )

      expect(rateLimitRule).toBeTruthy()
      expect(rateLimitRule!.condition.type).toBe('rate')
    })

    it('should have IP blacklist rule', () => {
      const rules = service.listRules()

      const ipBlacklistRule = rules.find(
        (r) => r.name === 'Block Known Malicious IPs' && r.enabled,
      )

      expect(ipBlacklistRule).toBeTruthy()
      expect(ipBlacklistRule!.condition.type).toBe('ip')
      expect(ipBlacklistRule!.action).toBe('block')
    })
  })

  // ── Custom Rules Tests ────────────────────────────────────────────────────

  describe('Custom Rules', () => {
    it('should apply custom block rule', () => {
      service.addRule({
        name: 'Block Specific Path',
        condition: {
          type: 'path',
          operator: 'contains',
          value: '/blocked',
        },
        action: 'block',
        priority: 1,
        enabled: true,
      })

      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/api/blocked/endpoint',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.matchedRule?.name).toBe('Block Specific Path')
    })

    it('should apply custom allow rule', () => {
      service.addRule({
        name: 'Allow Internal',
        condition: {
          type: 'ip',
          operator: 'equals',
          value: '10.0.0.1',
        },
        action: 'allow',
        priority: 1,
        enabled: true,
      })

      const decision = service.evaluate({
        ip: '10.0.0.1',
        path: '/api/test',
        body: '<script>alert(1)</script>', // 会被内置 XSS 规则阻止
      })

      // allow 规则优先级更高
      expect(decision.allowed).toBe(true)
    })

    it('should respect rule priority order', () => {
      // 添加一个高优先级的 allow 规则和一个低优先级的 block 规则
      service.addRule({
        name: 'High Priority Allow',
        condition: {
          type: 'ip',
          operator: 'equals',
          value: '10.0.0.1',
        },
        action: 'allow',
        priority: 0, // Use priority 0 to ensure it comes before built-in rules with priority 1
        enabled: true,
      })

      const rules = service.listRules()
      expect(rules[0].name).toBe('High Priority Allow')
    })
  })

  // ── Update/Delete Rules Tests ────────────────────────────────────────────

  describe('Update and Delete Rules', () => {
    it('should throw when updating non-existent rule', () => {
      expect(() =>
        service.updateRule('non-existent-id', { name: 'test' }),
      ).toThrow()
    })

    it('should throw when deleting non-existent rule', () => {
      expect(() => service.deleteRule('non-existent-id')).toThrow()
    })

    it('should update rule priority', () => {
      const rule = service.addRule({
        name: 'Test Rule',
        condition: { type: 'path', operator: 'equals', value: '/test' },
        action: 'block',
        priority: 10,
        enabled: true,
      })

      const updated = service.updateRule(rule.id, { priority: 5 })

      expect(updated.priority).toBe(5)
    })

    it('should disable rule via update', () => {
      const rule = service.addRule({
        name: 'Test Rule',
        condition: { type: 'path', operator: 'equals', value: '/test' },
        action: 'block',
        priority: 10,
        enabled: true,
      })

      service.updateRule(rule.id, { enabled: false })

      const decision = service.evaluate({
        ip: '1.2.3.4',
        path: '/test',
      })

      // 规则被禁用，应该允许通过
      expect(decision.allowed).toBe(true)
    })
  })
})
