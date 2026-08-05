/**
 * SecurityController spec 单元测试
 *
 * 覆盖所有路由端点：
 * - 安全扫描端点（scan, batchScan, detectSensitiveData, detectJWTWeakSecret, detectIDOR, detectMissingRateLimit）
 * - 报告生成端点（generateReport, exportJSONReport）
 * - WAF 规则管理 CRUD（listRules, createWAFRule, updateWAFRule, deleteWAFRule）
 * - WAF 请求评估（evaluateWAF, getWAFLogs）
 *
 * 策略：真实 Controller + Mock Service，覆盖正常流程 + 边界条件 + 异常路径。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { SecurityController } from './security.controller'
import { SecurityScannerService } from './security-scanner.service'
import { WAFService } from './waf.service'
import type { SecurityVulnerability, WAFRule, WAFDecision } from './security.entity'

describe('SecurityController.spec', () => {
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

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/scan
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/scan', () => {
    it('正例: 扫描目标返回漏洞列表', async () => {
      const mockVuln: SecurityVulnerability = {
        id: 'VULN-001',
        title: 'SQL Injection',
        description: 'Parameter id vulnerable to SQL injection',
        category: 'injection',
        severity: 'high',
        cvssScore: 9.1,
        affectedEndpoint: '/api/users',
        parameter: 'id',
        payload: "' OR '1'='1",
        remediation: 'Use parameterized queries',
        discoveredAt: new Date(),
        falsePositive: false,
      }
      const scanSpy = vi.spyOn(scannerService, 'scan').mockResolvedValue([mockVuln])

      const result = await controller.scan({
        target: {
          endpoint: 'http://example.com/api/users',
          method: 'POST',
          parameters: { id: '1' },
        },
      })

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('SQL Injection')
      expect(result[0].category).toBe('injection')
      expect(scanSpy).toHaveBeenCalledTimes(1)
    })

    it('正例: 扫描安全目标返回空数组', async () => {
      vi.spyOn(scannerService, 'scan').mockResolvedValue([])

      const result = await controller.scan({
        target: { endpoint: 'http://example.com/safe', method: 'GET' },
      })

      expect(result).toEqual([])
    })

    it('边界: 扫描无参数的端点返回空数组', async () => {
      vi.spyOn(scannerService, 'scan').mockResolvedValue([])

      const result = await controller.scan({
        target: { endpoint: 'http://example.com/health', method: 'GET' },
      })

      expect(result).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/scan/batch
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/scan/batch', () => {
    it('正例: 批量扫描多个目标', async () => {
      const results = new Map()
      results.set(
        { endpoint: 'http://example.com/a', method: 'GET' as const },
        [{
          id: 'V1', title: 'XSS', description: 'xss found',
          category: 'injection' as const, severity: 'medium' as const,
          remediation: 'encode output', discoveredAt: new Date(), falsePositive: false,
        }],
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

    it('边界: 空目标列表返回空数组', async () => {
      vi.spyOn(scannerService, 'scanMultiple').mockResolvedValue(new Map())

      const result = await controller.batchScan({ targets: [] })

      expect(result).toEqual([])
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/detect/sensitive-data
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/detect/sensitive-data', () => {
    it('正例: 检测到密码字段暴露', async () => {
      vi.spyOn(scannerService, 'detectSensitiveDataExposure').mockResolvedValue(['password'])

      const result = await controller.detectSensitiveData({
        endpoint: '/api/user',
        response: { username: 'john', password: 'secret123' },
      })

      expect(result.endpoint).toBe('/api/user')
      expect(result.exposedFields).toContain('password')
    })

    it('正例: 安全响应无暴露', async () => {
      vi.spyOn(scannerService, 'detectSensitiveDataExposure').mockResolvedValue([])

      const result = await controller.detectSensitiveData({
        endpoint: '/api/user',
        response: { username: 'john', email: 'john@test.com' },
      })

      expect(result.exposedFields).toHaveLength(0)
    })

    it('边界: 空响应体', async () => {
      vi.spyOn(scannerService, 'detectSensitiveDataExposure').mockResolvedValue([])

      const result = await controller.detectSensitiveData({
        endpoint: '/api/user',
        response: {},
      })

      expect(result.exposedFields).toHaveLength(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/detect/jwt-weak-secret
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/detect/jwt-weak-secret', () => {
    it('正例: 检测到弱密钥', async () => {
      vi.spyOn(scannerService, 'detectJWTWeakSecret').mockResolvedValue(true)

      const result = await controller.detectJWTWeakSecret({
        token: 'eyJhbGciOiJIUzI1NiJ9.dGVzdA.abc',
        secrets: ['secret', 'password'],
      })

      expect(result.weak).toBe(true)
    })

    it('正例: 强密钥返回 false', async () => {
      vi.spyOn(scannerService, 'detectJWTWeakSecret').mockResolvedValue(false)

      const result = await controller.detectJWTWeakSecret({
        token: 'eyJhbGciOiJIUzI1NiJ9.dGVzdA.abc',
        secrets: ['aB3#k9mX!pQ7$vR2'],
      })

      expect(result.weak).toBe(false)
    })

    it('边界: 空密钥列表', async () => {
      vi.spyOn(scannerService, 'detectJWTWeakSecret').mockResolvedValue(false)

      const result = await controller.detectJWTWeakSecret({
        token: 'test-token',
        secrets: [],
      })

      expect(result.weak).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/detect/idor
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/detect/idor', () => {
    it('正例: 检测到 IDOR 漏洞', async () => {
      const vuln: SecurityVulnerability = {
        id: 'VULN-IDOR-001',
        title: 'Insecure Direct Object Reference (IDOR)',
        description: 'User attacker-1 can access resource 123',
        category: 'idor',
        severity: 'high',
        cvssScore: 7.5,
        affectedEndpoint: '/api/resource/123',
        remediation: 'Implement proper authorization checks',
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
      expect(result!.severity).toBe('high')
    })

    it('正例: 未发现 IDOR 返回 null', async () => {
      vi.spyOn(scannerService, 'detectIDOR').mockResolvedValue(null)

      const result = await controller.detectIDOR({
        endpoint: '/api/resource',
        resourceId: '999',
        attackerId: 'attacker-2',
      })

      expect(result).toBeNull()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/detect/missing-rate-limit
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/detect/missing-rate-limit', () => {
    it('正例: 检测到缺少速率限制', async () => {
      vi.spyOn(scannerService, 'detectMissingRateLimit').mockResolvedValue(true)

      const result = await controller.detectMissingRateLimit({
        endpoint: '/api/login',
        count: 50,
      })

      expect(result.missingRateLimit).toBe(true)
      expect(result.endpoint).toBe('/api/login')
    })

    it('正例: 已存在速率限制', async () => {
      vi.spyOn(scannerService, 'detectMissingRateLimit').mockResolvedValue(false)

      const result = await controller.detectMissingRateLimit({
        endpoint: '/api/login',
      })

      expect(result.missingRateLimit).toBe(false)
    })

    it('边界: 不传 count 使用默认值', async () => {
      const spy = vi.spyOn(scannerService, 'detectMissingRateLimit').mockResolvedValue(false)

      await controller.detectMissingRateLimit({
        endpoint: '/api/login',
      })

      expect(spy).toHaveBeenCalledWith('/api/login', 100)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/report
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/report', () => {
    it('正例: 生成文本报告含漏洞信息', () => {
      const vulns: SecurityVulnerability[] = [{
        id: 'V1', title: 'Critical SQLI',
        description: 'SQL injection in login',
        category: 'injection', severity: 'critical',
        remediation: 'Use prepared statements',
        discoveredAt: new Date(), falsePositive: false,
      }]

      const report = controller.generateReport({ vulnerabilities: vulns })

      expect(report).toContain('Critical SQLI')
      expect(report).toContain('CRITICAL')
      expect(report).toContain('Use prepared statements')
    })

    it('正例: 无漏洞时返回安全信息', () => {
      const report = controller.generateReport({ vulnerabilities: [] })
      expect(report).toContain('No vulnerabilities found')
    })

    it('边界: 大量漏洞报告生成', () => {
      const vulns: SecurityVulnerability[] = Array.from({ length: 100 }, (_, i) => ({
        id: `V${i}`, title: `Vuln ${i}`,
        description: `Description ${i}`,
        category: 'injection' as const, severity: 'low' as const,
        remediation: 'Fix it',
        discoveredAt: new Date(), falsePositive: false,
      }))

      const report = controller.generateReport({ vulnerabilities: vulns })
      expect(report).toContain('Total Vulnerabilities: 100')
      expect(report).toContain('LOW (100)')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/report/json
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/report/json', () => {
    it('正例: 导出 JSON 格式报告', () => {
      const vulns: SecurityVulnerability[] = [{
        id: 'V1', title: 'XSS',
        description: 'Cross-site scripting',
        category: 'injection', severity: 'high',
        remediation: 'Encode output',
        discoveredAt: new Date('2024-06-01'), falsePositive: false,
      }]

      const report = controller.exportJSONReport({ vulnerabilities: vulns })

      expect(report.totalVulnerabilities).toBe(1)
      expect(report.summary.high).toBe(1)
      expect(report.vulnerabilities).toHaveLength(1)
      expect(report.generatedAt).toBeDefined()
    })

    it('正例: 空漏洞列表', () => {
      const report = controller.exportJSONReport({ vulnerabilities: [] })
      expect(report.totalVulnerabilities).toBe(0)
      expect(report.summary.critical).toBe(0)
      expect(report.summary.high).toBe(0)
      expect(report.summary.medium).toBe(0)
      expect(report.summary.low).toBe(0)
      expect(report.summary.info).toBe(0)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GET /security/waf/rules
  // ═══════════════════════════════════════════════════════════════

  describe('GET /security/waf/rules', () => {
    it('正例: 列出所有 WAF 规则（含内置规则）', () => {
      const rules = controller.listWAFRules()

      expect(rules.length).toBeGreaterThan(0)
      expect(rules[0]).toHaveProperty('id')
      expect(rules[0]).toHaveProperty('name')
      expect(rules[0]).toHaveProperty('condition')
      expect(rules[0]).toHaveProperty('action')
      expect(rules[0]).toHaveProperty('priority')
      expect(rules[0]).toHaveProperty('enabled')
    })

    it('正例: 规则按优先级排序', () => {
      const rules = controller.listWAFRules()
      for (let i = 1; i < rules.length; i++) {
        expect(rules[i].priority).toBeGreaterThanOrEqual(rules[i - 1].priority)
      }
    })

    it('正例: 包含已知内置规则', () => {
      const rules = controller.listWAFRules()
      const names = rules.map((r) => r.name)
      expect(names).toContain('Block Known Malicious IPs')
      expect(names).toContain('SQL Injection Pattern Detection')
      expect(names).toContain('XSS Pattern Detection')
      expect(names).toContain('Rate Limiting - 100 req/min')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/waf/rules
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/waf/rules', () => {
    it('正例: 创建 WAF 规则', () => {
      const rule = controller.createWAFRule({
        name: 'Block Specific IP',
        condition: { type: 'ip', operator: 'equals', value: '10.0.0.1' },
        action: 'block',
        priority: 5,
        enabled: true,
      })

      expect(rule.id).toBeTruthy()
      expect(rule.name).toBe('Block Specific IP')
      expect(rule.action).toBe('block')
      expect(rule.priority).toBe(5)
      expect(rule.enabled).toBe(true)
    })

    it('边界: 创建最低优先级规则', () => {
      const rule = controller.createWAFRule({
        name: 'Low Priority Log',
        condition: { type: 'path', operator: 'contains', value: '/debug' },
        action: 'log',
        priority: 0,
        enabled: false,
      })

      expect(rule.priority).toBe(0)
      expect(rule.enabled).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  PUT /security/waf/rules/:id
  // ═══════════════════════════════════════════════════════════════

  describe('PUT /security/waf/rules/:id', () => {
    it('正例: 更新已存在的规则', () => {
      const created = controller.createWAFRule({
        name: 'Temp Rule',
        condition: { type: 'ip', operator: 'equals', value: '1.1.1.1' },
        action: 'block',
        priority: 10,
        enabled: true,
      })

      const updated = controller.updateWAFRule(created.id, {
        name: 'Updated Rule',
        priority: 99,
        enabled: false,
      })

      expect(updated.name).toBe('Updated Rule')
      expect(updated.priority).toBe(99)
      expect(updated.enabled).toBe(false)
      // id 保持不变
      expect(updated.id).toBe(created.id)
    })

    it('异常: 更新不存在的规则抛出错误', () => {
      expect(() =>
        controller.updateWAFRule('non-existent-id', { name: 'test' }),
      ).toThrow()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  DELETE /security/waf/rules/:id
  // ═══════════════════════════════════════════════════════════════

  describe('DELETE /security/waf/rules/:id', () => {
    it('正例: 删除已存在的规则', () => {
      const created = controller.createWAFRule({
        name: 'To Delete',
        condition: { type: 'path', operator: 'equals', value: '/delete-me' },
        action: 'block',
        priority: 50,
        enabled: true,
      })

      const result = controller.deleteWAFRule(created.id)
      expect(result.deleted).toBe(true)
    })

    it('异常: 删除不存在的规则抛出错误', () => {
      expect(() =>
        controller.deleteWAFRule('ghost-rule'),
      ).toThrow()
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  POST /security/waf/evaluate
  // ═══════════════════════════════════════════════════════════════

  describe('POST /security/waf/evaluate', () => {
    it('正例: 阻止已知恶意 IP', () => {
      const decision = controller.evaluateWAF({
        ip: '192.168.100.100',
        path: '/api/admin',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
      expect(decision.action).toBe('block')
    })

    it('正例: 允许安全请求通过', () => {
      const decision = controller.evaluateWAF({
        ip: '203.0.113.42',
        path: '/api/public/health',
        method: 'GET',
      })

      expect(decision.allowed).toBe(true)
      expect(decision.riskLevel).toBe('safe')
    })

    it('正例: 检测 SQL 注入 payload 在请求体中', () => {
      const decision = controller.evaluateWAF({
        ip: '8.8.8.8',
        path: '/api/login',
        body: "username=admin&password=' OR '1'='1",
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    it('边界: 无 IP 时安全放行', () => {
      const decision = controller.evaluateWAF({
        path: '/api/test',
        body: '{"name": "test"}',
      })

      expect(decision.allowed).toBe(true)
      expect(decision.riskLevel).toBe('safe')
    })

    it('边界: 空 body 请求', () => {
      const decision = controller.evaluateWAF({
        ip: '1.2.3.4',
        path: '/api/test',
        body: '',
      })

      expect(decision.allowed).toBe(true)
    })

    it('正例: XSS payload 被阻止', () => {
      const decision = controller.evaluateWAF({
        ip: '8.8.4.4',
        path: '/api/comment',
        body: '<script>alert("xss")</script>',
      })

      expect(decision.allowed).toBe(false)
      expect(decision.riskLevel).toBe('malicious')
    })

    it('边界: 路径命中敏感路径监控（log 规则）', () => {
      const decision = controller.evaluateWAF({
        ip: '203.0.113.1',
        path: '/.env',
        method: 'GET',
      })

      // log 规则不阻止请求，但标记为 suspicious
      expect(decision.allowed).toBe(true)
      expect(decision.riskLevel).toBe('suspicious')
      expect(decision.action).toBe('log')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  GET /security/waf/logs
  // ═══════════════════════════════════════════════════════════════

  describe('GET /security/waf/logs', () => {
    it('正例: 返回被阻止的请求日志', () => {
      // 触发一次阻止
      controller.evaluateWAF({
        ip: '192.168.100.100',
        path: '/api/admin/delete',
      })

      const logs = controller.getWAFLogs()
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].allowed).toBe(false)
      expect(logs[0].reason).toContain('Block Known Malicious IPs')
    })

    it('正例: limit 参数生效', () => {
      // 触发多次阻止
      for (let i = 0; i < 10; i++) {
        controller.evaluateWAF({
          ip: '192.168.100.100',
          path: `/api/test/${i}`,
        })
      }

      const logs = controller.getWAFLogs(3)
      expect(logs.length).toBe(3)
    })

    it('正例: 默认 limit 为 100', () => {
      const logs = controller.getWAFLogs()
      expect(logs.length).toBeLessThanOrEqual(100)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  //  跨功能场景
  // ═══════════════════════════════════════════════════════════════

  describe('跨功能场景', () => {
    it('创建规则后列表包含新规则', () => {
      const created = controller.createWAFRule({
        name: 'New Custom Rule',
        condition: { type: 'ip', operator: 'equals', value: '9.9.9.9' },
        action: 'block',
        priority: 3,
        enabled: true,
      })

      const rules = controller.listWAFRules()
      const found = rules.find((r) => r.id === created.id)
      expect(found).toBeDefined()
      expect(found!.name).toBe('New Custom Rule')
    })

    it('删除规则后列表不再包含', () => {
      const created = controller.createWAFRule({
        name: 'Temporary Rule',
        condition: { type: 'path', operator: 'equals', value: '/tmp' },
        action: 'block',
        priority: 25,
        enabled: true,
      })

      controller.deleteWAFRule(created.id)
      const rules = controller.listWAFRules()
      expect(rules.find((r) => r.id === created.id)).toBeUndefined()
    })
  })
})
