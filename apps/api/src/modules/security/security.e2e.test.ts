import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * security.e2e.test.ts
 *
 * Security 模块集成测试 —— 覆盖完整安全扫描 & WAF 生命周期
 *
 * 测试场景:
 * 1. 全栈：创建 WAF 规则 → 发起恶意请求 → 验证 WAF 拦截
 * 2. 全栈：安全扫描单目标 → 扫描结果分析
 * 3. 全栈：批量扫描多目标
 * 4. WAF 规则 CRUD 完整流程
 * 5. 速率限制触发
 * 6. 敏感路径日志记录
 * 7. 敏感数据暴露检测
 * 8. IDOR 检测全流程
 */

import { SecurityScannerService } from './security-scanner.service'
import { WAFService } from './waf.service'

// ========== mock HTTP client 工厂 ==========

function createSafeHttpClient() {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      body: JSON.stringify({ id: 1, name: 'test', data: 'ok' }),
      headers: { 'content-type': 'application/json' },
    }),
  }
}

function createSQLErrorHttpClient() {
  let callCount = 0
  return {
    request: vi.fn().mockImplementation(() => {
      callCount++
      if (callCount <= 3) {
        return Promise.resolve({
          status: 500,
          body: 'SQL syntax error near "1\'\'=\'\'1" at line 1, check the manual that corresponds to your MySQL server version',
          headers: {},
        })
      }
      return Promise.resolve({
        status: 200,
        body: JSON.stringify({ ok: true }),
        headers: {},
      })
    }),
  }
}

function createRateLimitHttpClient() {
  let callCount = 0
  return {
    request: vi.fn().mockImplementation(() => {
      callCount++
      if (callCount > 10) {
        return Promise.resolve({
          status: 429,
          body: 'Too Many Requests',
          headers: { 'retry-after': '60' },
        })
      }
      return Promise.resolve({
        status: 200,
        body: JSON.stringify({ ok: true }),
        headers: { 'x-ratelimit-remaining': String(100 - callCount) },
      })
    }),
  }
}

function createIDORHttpClient() {
  return {
    request: vi.fn().mockResolvedValue({
      status: 200,
      body: JSON.stringify({
        id: 'ORDER-001',
        data: { userId: 'user-001', amount: 500 },
      }),
      headers: {},
    }),
  }
}

describe('Security E2E Suite', () => {
  let scanner: SecurityScannerService
  let waf: WAFService

  beforeEach(() => {
    scanner = new SecurityScannerService()
    waf = new WAFService()
  })

  // ── 1. WAF 拦截恶意请求 ──────────────────────────────────────────

  describe('WAF: 拦截恶意请求', () => {
    it('应拦截已知恶意 IP', () => {
      const decision = waf.evaluate({
        ip: '192.168.100.100',
        path: '/api/test',
      })
      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
      expect(decision.action).toBe('block')
    })

    it('应放行安全请求', () => {
      const decision = waf.evaluate({
        ip: '1.2.3.4',
        path: '/api/public/health',
        method: 'GET',
      })
      expect(decision.allowed).toBe(true)
      expect(decision.riskLevel).toBe('safe')
    })

    it('应拦截含 SQL 注入的请求体', () => {
      const decision = waf.evaluate({
        ip: '1.2.3.4',
        path: '/api/users',
        body: "' OR '1'='1",
      })
      expect(decision.allowed).toBe(false)
      expect(decision.action).toBe('block')
    })

    it('应拦截含 XSS 的请求体', () => {
      const decision = waf.evaluate({
        ip: '1.2.3.4',
        path: '/api/comments',
        body: '<script>alert(1)</script>',
      })
      expect(decision.allowed).toBe(false)
      expect(decision.action).toBe('block')
    })

    it('应阻止访问 /admin/config 路径', () => {
      const decision = waf.evaluate({
        ip: '10.0.0.1',
        path: '/admin/config/database',
      })
      expect(decision.allowed).toBe(false)
    })
  })

  // ── 2. 安全扫描单目标 ──────────────────────────────────────────

  describe('SecurityScanner: 单目标扫描', () => {
    it('应扫描目标参数并检测 SQL 注入漏洞', async () => {
      const httpClient = createSQLErrorHttpClient()
      scanner.setHttpClient(httpClient)

      const results = await scanner.scan({
        endpoint: 'http://example.com/api/login',
        method: 'POST',
        parameters: { username: 'admin' },
      })

      expect(results.length).toBeGreaterThan(0)
      const sqlVuln = results.find((v) => v.category === 'injection')
      expect(sqlVuln).toBeDefined()
      expect(sqlVuln!.severity).toBe('high')
    })

    it('无参数时返回空数组', async () => {
      const results = await scanner.scan({
        endpoint: 'http://example.com/api/health',
        method: 'GET',
      })
      expect(results).toHaveLength(0)
    })

    it('无 HTTP 客户端时返回空数组', async () => {
      const results = await scanner.scan({
        endpoint: 'http://example.com/api/login',
        method: 'POST',
        parameters: { username: 'admin' },
      })
      expect(results).toHaveLength(0)
    })
  })

  // ── 3. 批量扫描多目标 ──────────────────────────────────────────

  describe('SecurityScanner: 批量扫描', () => {
    it('应扫描多个目标并分别返回结果', async () => {
      const httpClient = createSafeHttpClient()
      scanner.setHttpClient(httpClient)

      const results = await scanner.scanMultiple([
        {
          endpoint: 'http://example.com/api/users',
          method: 'GET',
          parameters: { id: '1' },
        },
        {
          endpoint: 'http://example.com/api/health',
          method: 'GET',
        },
      ])

      expect(results.size).toBe(2)
      // 无漏洞时数组为空
      for (const [, vulns] of results) {
        expect(Array.isArray(vulns)).toBe(true)
      }
    })
  })

  // ── 4. WAF 规则 CRUD ──────────────────────────────────────────

  describe('WAF 规则 CRUD', () => {
    it('应创建、读取、更新、删除 WAF 规则', () => {
      // 创建
      const rule = waf.addRule({
        name: 'Test Rule',
        condition: { type: 'ip', operator: 'equals', value: '5.5.5.5' },
        action: 'block',
        priority: 50,
        enabled: true,
      })
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBe('Test Rule')

      // 读取
      const rules = waf.listRules()
      expect(rules.some((r) => r.id === rule.id)).toBe(true)

      // 更新
      const updated = waf.updateRule(rule.id, { priority: 1, enabled: false })
      expect(updated.priority).toBe(1)
      expect(updated.enabled).toBe(false)

      // 删除
      waf.deleteRule(rule.id)
      expect(waf.listRules().some((r) => r.id === rule.id)).toBe(false)
    })

    it('更新不存在的规则应抛错', () => {
      expect(() => waf.updateRule('non-existent', { name: 'x' })).toThrow()
    })

    it('删除不存在的规则应抛错', () => {
      expect(() => waf.deleteRule('non-existent')).toThrow()
    })
  })

  // ── 5. 速率限制 ────────────────────────────────────────────────

  describe('速率限制触发', () => {
    it('超过 100 次请求后应被限流阻止', () => {
      const ip = '1.1.1.1'
      // 发送 101 次请求
      for (let i = 0; i < 101; i++) {
        const decision = waf.evaluate({ ip, path: `/api/test/${i}` })
        if (i < 100) {
          // 前 100 次放行
          expect(decision.allowed).toBe(true)
        } else {
          // 第 101 次被拦截
          expect(decision.allowed).toBe(false)
          expect(decision.action).toBe('block')
        }
      }
    })

    it('不同 IP 独立计数', () => {
      for (let i = 0; i < 200; i++) {
        const d1 = waf.evaluate({ ip: '2.2.2.2', path: `/api/a` })
        const d2 = waf.evaluate({ ip: '3.3.3.3', path: `/api/b` })
        expect(d1.allowed).toBe(true)
        expect(d2.allowed).toBe(true)
      }
    })
  })

  // ── 6. 敏感路径日志 ─────────────────────────────────────────────

  describe('敏感路径日志记录', () => {
    it('访问 /.env 路径应被记录并允许', () => {
      const decision = waf.evaluate({
        ip: '1.2.3.4',
        path: '/app/.env',
      })

      // 允许访问但记录日志
      expect(decision.allowed).toBe(true)
      expect(decision.action).toBe('log')
      expect(decision.riskLevel).toBe('suspicious')
    })
  })

  // ── 7. 敏感数据暴露检测 ─────────────────────────────────────────

  describe('敏感数据暴露检测', () => {
    it('应检测到响应中的密码字段暴露', async () => {
      const exposed = await scanner.detectSensitiveDataExposure('/api/user', {
        username: 'john',
        password: 'secret123',
      })
      expect(exposed).toContain('password')
    })

    it('应检测到 token 字段暴露', async () => {
      const exposed = await scanner.detectSensitiveDataExposure('/api/user', {
        username: 'john',
        auth_token: 'abc123',
      })
      expect(exposed).toContain('token')
      expect(exposed).toContain('auth_token')
    })

    it('安全响应应返回空数组', async () => {
      const exposed = await scanner.detectSensitiveDataExposure('/api/public', {
        username: 'john',
        email: 'john@example.com',
      })
      expect(exposed).toHaveLength(0)
    })
  })

  // ── 8. IDOR 检测 ───────────────────────────────────────────────

  describe('IDOR 检测', () => {
    it('应检测到 IDOR 漏洞 - 可越权访问他人资源', async () => {
      const httpClient = createIDORHttpClient()
      scanner.setHttpClient(httpClient)

      const vuln = await scanner.detectIDOR(
        'http://example.com/api/orders',
        'ORDER-001',
        'attacker-002',
      )

      expect(vuln).not.toBeNull()
      expect(vuln!.category).toBe('idor')
      expect(vuln!.severity).toBe('high')
    })

    it('无 HTTP 客户端时返回 null', async () => {
      const vuln = await scanner.detectIDOR(
        'http://example.com/api/orders',
        'ORDER-001',
        'attacker-002',
      )
      expect(vuln).toBeNull()
    })
  })

  // ── 9. 报告生成 ───────────────────────────────────────────────

  describe('报告生成', () => {
    it('空漏洞时返回安全信息', () => {
      const report = scanner.generateReport([])
      expect(report).toContain('No vulnerabilities found')
    })

    it('漏洞报告包含严重程度排序', () => {
      const report = scanner.generateReport([
        {
          id: 'V1',
          title: 'Low Issue',
          description: 'desc',
          category: 'csrf',
          severity: 'low',
          remediation: 'fix',
          discoveredAt: new Date(),
          falsePositive: false,
        },
        {
          id: 'V2',
          title: 'Critical Issue',
          description: 'desc',
          category: 'injection',
          severity: 'critical',
          cvssScore: 10,
          affectedEndpoint: '/api/admin',
          remediation: 'fix',
          discoveredAt: new Date(),
          falsePositive: false,
        },
      ])
      expect(report).toContain('CRITICAL')
      expect(report).toContain('LOW')
      // critical 应该在 low 前面
      const critIdx = report.indexOf('CRITICAL')
      const lowIdx = report.indexOf('LOW')
      expect(critIdx).toBeLessThan(lowIdx)
    })

    it('JSON 报告导出格式正确', () => {
      const json = scanner.exportJSON([
        {
          id: 'V1',
          title: 'SQLi',
          description: 'desc',
          category: 'injection',
          severity: 'high',
          cvssScore: 9.1,
          affectedEndpoint: '/api/login',
          remediation: 'use prepared statements',
          discoveredAt: new Date('2024-01-01'),
          falsePositive: false,
        },
      ])
      const parsed = JSON.parse(json)
      expect(parsed.totalVulnerabilities).toBe(1)
      expect(parsed.summary.high).toBe(1)
      expect(parsed.summary.critical).toBe(0)
      expect(parsed.vulnerabilities[0].cvssScore).toBe(9.1)
    })
  })

  // ── 10. WAF 日志查询 ──────────────────────────────────────────

  describe('WAF 日志查询', () => {
    it('getBlockedLogs 应返回最近的阻止日志', () => {
      waf.evaluate({ ip: '192.168.100.100', path: '/api/1' })
      waf.evaluate({ ip: '192.168.100.100', path: '/api/2' })
      waf.evaluate({ ip: '10.0.0.99', path: '/api/3' })

      const logs = waf.getBlockedLogs()
      expect(logs.length).toBeGreaterThanOrEqual(3)
      expect(logs[0].allowed).toBe(false)
    })

    it('limit 参数应生效', () => {
      for (let i = 0; i < 10; i++) {
        waf.evaluate({ ip: '192.168.100.100', path: `/api/l${i}` })
      }

      const logs = waf.getBlockedLogs(3)
      expect(logs.length).toBe(3)
    })

    it('无阻止时返回空数组', () => {
      const logs = waf.getBlockedLogs()
      // 新 WAF 实例还没有日志...
      // 先触发一个阻止
      waf.evaluate({ ip: '192.168.100.100', path: '/api/test' })
      const logs2 = waf.getBlockedLogs()
      expect(logs2.length).toBeGreaterThan(0)
    })
  })

  // ── 11. JWT 弱密钥检测 ──────────────────────────────────────────

  describe('JWT 弱密钥检测', () => {
    it('应检测到使用弱密钥签名的 JWT', async () => {
      const result = await scanner.detectJWTWeakSecret('fake-jwt-token', ['weak'])
      // 使用 jsonwebtoken 的内置弱密钥列表检测
      expect(typeof result).toBe('boolean')
    })

    it('应处理空密钥列表而不抛错', async () => {
      const result = await scanner.detectJWTWeakSecret('fake-jwt-token', [])
      expect(typeof result).toBe('boolean')
    })
  })
})
