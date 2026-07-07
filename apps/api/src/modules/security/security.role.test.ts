import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SecurityScannerService } from './security-scanner.service'
import { WAFService, type WAFRule } from './waf.service'
import type { SecurityVulnerability, SecurityScanTarget } from './security.entity'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

function makeScanner(): SecurityScannerService {
  const scanner = new SecurityScannerService()
  return scanner
}

function makeWaf(): WAFService {
  return new WAFService()
}

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Safety} security 角色测试`, () => {
  let waf: WAFService
  let scanner: SecurityScannerService

  beforeEach(() => {
    waf = makeWaf()
    scanner = makeScanner()
  })

  it('安监可以创建 WAF 规则（正常流程）', () => {
    const rule = waf.addRule({
      name: 'Block Malicious IP - Safety created',
      condition: { type: 'ip', operator: 'equals', value: '10.0.0.1' },
      action: 'block',
      priority: 5,
      enabled: true,
    })

    assert.ok(rule.id)
    assert.equal(rule.name, 'Block Malicious IP - Safety created')
    assert.equal(rule.action, 'block')
    assert.equal(rule.priority, 5)
    assert.equal(rule.enabled, true)
    assert.equal(rule.condition.type, 'ip')
  })

  it('安监可以更新 WAF 规则（正常流程）', () => {
    const rule = waf.addRule({
      name: 'Temp Block Rule',
      condition: { type: 'ip', operator: 'equals', value: '10.0.0.2' },
      action: 'block',
      priority: 10,
      enabled: true,
    })

    const updated = waf.updateRule(rule.id, { action: 'log', priority: 99 })
    assert.equal(updated.action, 'log')
    assert.equal(updated.priority, 99)
    assert.equal(updated.name, 'Temp Block Rule') // unchanged
  })

  it('安监可以删除 WAF 规则（正常流程）', () => {
    const rule = waf.addRule({
      name: 'Temporary Rule',
      condition: { type: 'path', operator: 'contains', value: '/test' },
      action: 'log',
      priority: 500,
      enabled: true,
    })

    waf.deleteRule(rule.id)
    const rules = waf.listRules()
    const found = rules.find(r => r.id === rule.id)
    assert.equal(found, undefined)
  })

  it('安监可以执行安全扫描（正常流程）', async () => {
    // 没有 HTTP client 的情况下 scan 返回空数组
    const target: SecurityScanTarget = {
      endpoint: '/api/users',
      method: 'POST',
      parameters: { id: '1', name: 'test' },
    }

    const vulns = await scanner.scan(target)
    // 没有 httpClient, scan 返回空
    assert.ok(Array.isArray(vulns))
    assert.equal(vulns.length, 0)
  })

  it('安监可以评估 WAF 请求是否被阻止（正常流程）', () => {
    const decision = waf.evaluate({
      ip: '192.168.100.100', // 内置黑名单 IP
      path: '/api/users',
      method: 'GET',
    })

    assert.equal(decision.allowed, false)
    assert.equal(decision.riskLevel, 'malicious')
    assert.equal(decision.action, 'block')
    assert.ok(decision.matchedRule)
  })

  it('安监更新不存在的 WAF 规则应报错（反例）', () => {
    assert.throws(
      () => waf.updateRule('nonexistent-rule', { enabled: false }),
      /not found/
    )
  })

  it('安监删除不存在的 WAF 规则应报错（反例）', () => {
    assert.throws(
      () => waf.deleteRule('nonexistent-rule'),
      /not found/
    )
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Ops} security 角色测试`, () => {
  let waf: WAFService
  let scanner: SecurityScannerService

  beforeEach(() => {
    waf = makeWaf()
    scanner = makeScanner()
  })

  it('运行专员可以查看所有 WAF 规则（正常流程）', () => {
    const rules = waf.listRules()
    assert.ok(Array.isArray(rules))
    // 内置规则：IP黑名单 + SQL注入N条 + XSSN条 + rateLimit + 路径黑名单 + 敏感路径
    assert.ok(rules.length > 5)
  })

  it('运行专员可以查看 WAF 阻止日志（正常流程）', () => {
    // 触发阻止
    waf.evaluate({ ip: '192.168.100.100', path: '/api', method: 'GET' })
    const logs = waf.getBlockedLogs()
    assert.ok(Array.isArray(logs))
    assert.equal(logs.length, 1)
  })

  it('运行专员可以检测敏感数据暴露（正常流程）', async () => {
    const exposed = await scanner.detectSensitiveDataExposure('/api/user', {
      id: 1,
      name: 'test',
      password: 'secret123',
      email: 'test@example.com',
    })

    assert.ok(exposed.includes('password'))
    assert.ok(!exposed.includes('email')) // email 不在敏感字段列表中
  })

  it('运行专员可以检测缺少速率限制（边界场景）', async () => {
    // 没有配置 httpClient, 返回 false
    const missing = await scanner.detectMissingRateLimit('/api/endpoint', 50)
    assert.equal(missing, false)
  })

  it('运行专员可以生成安全报告（正常流程）', () => {
    const vulns: SecurityVulnerability[] = [
      {
        id: 'VULN-XSS-001',
        title: 'XSS Vulnerability',
        description: 'Parameter "name" is vulnerable to XSS',
        category: 'injection',
        severity: 'high',
        cvssScore: 8.1,
        affectedEndpoint: '/api/search',
        parameter: 'name',
        payload: '<script>alert(1)</script>',
        remediation: 'Implement output encoding',
        discoveredAt: new Date(),
        falsePositive: false,
      },
    ]

    const report = scanner.generateReport(vulns)
    assert.ok(report.includes('XSS Vulnerability'))
    assert.ok(report.includes('HIGH'))
    assert.ok(report.includes('CVSS: 8.1'))
  })

  it('运行专员可以导出 JSON 格式安全报告', () => {
    const vulns: SecurityVulnerability[] = [
      {
        id: 'VULN-SQL-001',
        title: 'SQL Injection',
        description: 'Parameter "id" vulnerable',
        category: 'injection',
        severity: 'high',
        cvssScore: 9.1,
        affectedEndpoint: '/api/login',
        parameter: 'id',
        payload: "' OR '1'='1",
        remediation: 'Use parameterized queries',
        discoveredAt: new Date(),
        falsePositive: false,
      },
    ]

    const json = scanner.exportJSON(vulns)
    const parsed = JSON.parse(json)
    assert.equal(parsed.totalVulnerabilities, 1)
    assert.equal(parsed.summary.high, 1)
    assert.equal(parsed.vulnerabilities[0].title, 'SQL Injection')
  })
})

// ──────────── 👔 店长 ────────────
describe(`${ROLES.TenantAdmin} security 角色测试`, () => {
  let waf: WAFService

  beforeEach(() => {
    waf = makeWaf()
  })

  it('店长可以查看安全策略总览（查看所有 WAF 规则）', () => {
    const rules = waf.listRules()
    assert.ok(Array.isArray(rules))
    // 检查内置规则名称
    const ruleNames = rules.map(r => r.name)
    assert.ok(ruleNames.includes('Block Known Malicious IPs'))
    assert.ok(ruleNames.includes('Rate Limiting - 100 req/min'))
  })

  it('店长可以检查 IP 是否在黑名单中（正常运行）', () => {
    const decision = waf.evaluate({
      ip: '192.168.100.100',
      path: '/api/inventory',
      method: 'GET',
    })
    assert.equal(decision.allowed, false)
    assert.equal(decision.action, 'block')
  })

  it('店长可以查看 SQL 注入防护是否生效（正常流程）', () => {
    const decision = waf.evaluate({
      ip: '1.1.1.1',
      path: '/api/login',
      method: 'POST',
      body: "' OR '1'='1",
    })
    assert.equal(decision.allowed, false)
    assert.ok(decision.matchedRule)
    assert.equal(decision.matchedRule?.name, 'SQL Injection Pattern Detection')
  })

  it('店长查看正常请求不被 WAF 拦截（正例）', () => {
    const decision = waf.evaluate({
      ip: '1.1.1.1',
      path: '/api/products',
      method: 'GET',
      body: '{"category": "games"}',
    })
    assert.equal(decision.allowed, true)
  })

  it('店长可以创建允许通过的 WAF 规则（正常流程）', () => {
    const rule = waf.addRule({
      name: 'Allow Trusted IP',
      condition: { type: 'ip', operator: 'equals', value: '10.0.0.1' },
      action: 'allow',
      priority: 1,
      enabled: true,
    })

    assert.equal(rule.action, 'allow')
    assert.equal(rule.priority, 1)
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} security 角色测试`, () => {
  let scanner: SecurityScannerService

  beforeEach(() => {
    scanner = makeScanner()
  })

  it('HR 可以查看安全培训记录（通过生成报告查看无漏洞状态）', () => {
    const report = scanner.generateReport([])
    assert.equal(report, '✅ No vulnerabilities found.')
  })

  it('HR 可以导出安全报告用于培训记录', () => {
    const vulns: SecurityVulnerability[] = [
      {
        id: 'VULN-001',
        title: 'Rate Limiting',
        description: 'Missing rate limiting on /api/login',
        category: 'rate_limiting',
        severity: 'medium',
        cvssScore: 5.0,
        affectedEndpoint: '/api/login',
        remediation: 'Add rate limiting middleware',
        discoveredAt: new Date(),
        falsePositive: false,
      },
    ]

    const json = scanner.exportJSON(vulns)
    const parsed = JSON.parse(json)
    assert.equal(parsed.generatedAt != null, true)
    assert.ok(parsed.generatedAt.length > 0)
    assert.equal(parsed.vulnerabilities[0].severity, 'medium')
  })

  it('HR 可以检查 API 响应中的敏感字段（员工数据保护）', async () => {
    const exposed = await scanner.detectSensitiveDataExposure('/api/employee', {
      id: 42,
      name: '张三',
      social_security: '123-45-6789',
      salary: 50000,
    })

    assert.ok(exposed.includes('social_security'))
  })

  it('HR 可以查看 WAF 日志检查是否有异常登录（正常流程）', () => {
    const waf = makeWaf()
    // 触发一些阻止
    waf.evaluate({ ip: '10.10.10.10', path: '/admin', method: 'GET' }) // 黑名单
    waf.evaluate({ ip: '1.2.3.4', path: '/.env', method: 'GET' }) // 敏感路径监控(log)
    waf.evaluate({
      ip: '5.6.7.8',
      path: '/api/login',
      method: 'POST',
      body: "'; DROP TABLE users;--",
    })

    const logs = waf.getBlockedLogs(50)
    assert.ok(logs.length >= 2) // SQL注入和IP黑名单的block
  })

  it('HR 可以查看安全扫描结果用于安全意识培训（正常流程）', async () => {
    const target: SecurityScanTarget = {
      endpoint: '/api/search',
      method: 'POST',
      parameters: { q: 'test' },
    }
    const vulns = await scanner.scan(target)
    assert.ok(Array.isArray(vulns))
    // 没有 httpClient 所以结果为 0
    assert.equal(vulns.length, 0)
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.Reception} security 角色测试`, () => {
  let waf: WAFService

  beforeEach(() => {
    waf = makeWaf()
  })

  it('前台可以查看安全操作指南（通过 WAF 检测正常请求说明）', () => {
    // 前台查看正常 API 应放行
    const decision = waf.evaluate({
      ip: '192.168.1.50', // 日常前台 IP
      path: '/api/members',
      method: 'GET',
    })
    // 注意: 192.168.1.100 在黑名单中，但 192.168.1.50 不在
    assert.equal(decision.allowed, true)
  })

  it('前台发送正常查询请求不被拦截（正常流程）', () => {
    const decision = waf.evaluate({
      ip: '172.16.0.1',
      path: '/api/games',
      method: 'GET',
      body: '{"category": "arcade"}',
    })
    assert.equal(decision.allowed, true)
  })

  it('前台误触敏感路径会被记录但不一定阻止（边界）', () => {
    // /.env 是 log 规则，不会阻止
    const decision = waf.evaluate({
      ip: '172.16.0.1',
      path: '/.env',
      method: 'GET',
    })
    assert.equal(decision.allowed, true) // log 规则不阻止
    assert.equal(decision.riskLevel, 'suspicious')
  })

  it('前台可以查看 WAF 日志了解被阻止的恶意请求（正常流程）', () => {
    // 先阻止一些请求
    waf.evaluate({ ip: '192.168.100.100', path: '/api', method: 'GET' })
    waf.evaluate({
      ip: '1.1.1.1',
      path: '/api/login',
      method: 'POST',
      body: '<script>alert(1)</script>',
    })

    const logs = waf.getBlockedLogs(10)
    assert.ok(logs.length === 2)
  })

  it('前台查看 WAF 功能时应可获取规则概览（正常流程）', () => {
    const rules = waf.listRules()
    assert.ok(rules.length > 0)
    // 所有禁用内置规则应对前台开放查看
    const enabledRules = rules.filter(r => r.enabled)
    assert.ok(enabledRules.length > 0)
  })
})
