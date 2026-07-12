/**
 * 🐜 自动 [security] C类型 role-extended 补全
 * 8 角色视角扩展测试 — 每角色至少 2 用例（正常流程 + 权限/边界）
 *
 * 👔店长(安全合规总览) 🛒前台(扫码/请求安全) 👥HR(数据隐私)
 * 🔧安监(WAF规则/漏洞扫描) 🎮导玩员(设备安全) 🎯运行专员(系统加固)
 * 🤝团建(批量检测) 📢营销(报表生成)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SecurityScannerService, type Vulnerability } from './security-scanner.service'
import { WAFService, type WAFRule, type WAFDecision } from './waf.service'
import type { SecurityScanTarget } from './security.entity'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

interface Ctx {
  scanner: SecurityScannerService
  waf: WAFService
}

function makeVuln(overrides: Partial<Vulnerability> = {}): Vulnerability {
  return {
    id: 'V-test',
    title: 'test',
    description: 'test description',
    category: 'injection',
    severity: 'medium',
    remediation: 'fix it',
    discoveredAt: new Date(),
    falsePositive: false,
    ...overrides,
  }
}

function setup(): Ctx {
  return {
    scanner: new SecurityScannerService(),
    waf: new WAFService(),
  }
}

// ──────────── 👔 店长：安全合规总览 ────────────
describe(`${ROLES.StoreManager} security 扩展测试`, () => {
  let ctx: Ctx
  beforeEach(() => { ctx = setup() })

  it('店长生成空漏洞报告（正常流程）', () => {
    const report = ctx.scanner.generateReport([])
    expect(report).toBeDefined()
    expect(typeof report).toBe('string')
    expect(report).toContain('No vulnerabilities found')
  })

  it('店长生成多漏洞报告包含严重级别统计（正常流程）', () => {
    const vulns = [
      makeVuln({ id: 'V-001', title: 'SQL Injection', severity: 'high', category: 'injection', remediation: '参数化查询', affectedEndpoint: '/api/login', cvssScore: 8.5 }),
      makeVuln({ id: 'V-002', title: 'XSS漏洞', severity: 'medium', category: 'data_exposure', remediation: '输出转义', affectedEndpoint: '/api/search', cvssScore: 5.0 }),
    ]
    const report = ctx.scanner.generateReport(vulns)
    expect(report).toContain('V-001')
    expect(report).toContain('SQL Injection')
    expect(report).toContain('HIGH')
    expect(report).toContain('MEDIUM')
  })

  it('店长查看全部 WAF 规则列表（正常流程）', () => {
    const rules = ctx.waf.listRules()
    expect(Array.isArray(rules)).toBe(true)
    expect(rules.length).toBeGreaterThanOrEqual(1)
  })
})

// ──────────── 🛒 前台：扫码/请求安全 ────────────
describe(`${ROLES.FrontDesk} security 扩展测试`, () => {
  let ctx: Ctx
  beforeEach(() => { ctx = setup() })

  it('前台放行正常的 GET 请求（正常流程）', () => {
    const result = ctx.waf.evaluate({
      path: '/api/public/health',
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      ip: '1.2.3.4',
    })
    expect(result.allowed).toBe(true)
  })

  it('前台拦截 SQL 注入模式的请求（权限边界）', () => {
    const result = ctx.waf.evaluate({
      path: '/api/login',
      method: 'POST',
      headers: {},
      body: JSON.stringify({ username: "admin' OR '1'='1", password: 'test' }),
      ip: '10.0.0.1',
    })
    expect(result.allowed).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.riskLevel).toBe('malicious')
  })

  it('前台放行正常 POST 表单请求（正常流程）', () => {
    const result = ctx.waf.evaluate({
      path: '/api/order',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'p001', quantity: 2 }),
      ip: '192.168.1.1',
    })
    expect(result.allowed).toBe(true)
  })
})

// ──────────── 👥 HR：数据隐私 ────────────
describe(`${ROLES.HR} security 扩展测试`, () => {
  let ctx: Ctx
  beforeEach(async () => { ctx = setup() })

  it('HR 检测响应中的敏感数据暴露（正常流程）', async () => {
    const responseBody = {
      id: 1,
      name: '张三',
      password: 's3cret!',
      credit_card: '4111-1111-1111-1111',
      api_key: 'sk-abc123',
    }
    const exposed = await ctx.scanner.detectSensitiveDataExposure('/api/hr/employee', responseBody)
    expect(Array.isArray(exposed)).toBe(true)
    expect(exposed.length).toBeGreaterThanOrEqual(2)
  })

  it('HR 检测无敏感数据的响应返回空列表（边界）', async () => {
    const responseBody = { id: 1, name: '张三', department: '技术部' }
    const exposed = await ctx.scanner.detectSensitiveDataExposure('/api/hr/safe', responseBody)
    expect(exposed).toHaveLength(0)
  })

  it('HR 检测 JWT 弱密钥（正常流程）', async () => {
    const result = await ctx.scanner.detectJWTWeakSecret(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doS6s5dQFnBf4Z_GHzfBcKDlC6TmWMkNh7gAn8cToz8',
      ['secret', 'password', 'key'],
    )
    expect(typeof result).toBe('boolean')
  })

  it('HR 对空 JWT 检测应正常返回（边界）', async () => {
    const result = await ctx.scanner.detectJWTWeakSecret('', ['secret'])
    expect(typeof result).toBe('boolean')
  })
})

// ──────────── 🔧 安监：WAF 规则管理/漏洞扫描 ────────────
describe(`${ROLES.Safety} security 扩展测试`, () => {
  let ctx: Ctx
  beforeEach(async () => { ctx = setup() })

  it('安监创建多条 WAF 规则（正常流程）', () => {
    ctx.waf.addRule({ name: 'Block Admin', condition: { type: 'path', operator: 'regex', value: '^/admin' }, action: 'block', priority: 10, enabled: true })
    ctx.waf.addRule({ name: 'Rate Limit', condition: { type: 'rate', operator: 'gt', value: '100' }, action: 'block', priority: 8, enabled: true })
    const rules = ctx.waf.listRules()
    expect(rules.length).toBeGreaterThanOrEqual(2)
  })

  it('安监删除存在的 WAF 规则（正常流程）', () => {
    const rule = ctx.waf.addRule({ name: 'Temp Rule', condition: { type: 'ip', operator: 'equals', value: '0.0.0.0' }, action: 'block', priority: 1, enabled: true })
    ctx.waf.deleteRule(rule.id)
    const rules = ctx.waf.listRules()
    expect(rules.find(r => r.id === rule.id)).toBeUndefined()
  })

  it('安监删除不存在的 WAF 规则应抛异常（反例）', () => {
    expect(() => ctx.waf.deleteRule('non-existent-id')).toThrow()
  })

  it('安监扫描单个目标（正常流程）', async () => {
    const target: SecurityScanTarget = { endpoint: 'https://test.example.com', method: 'GET' }
    const vulns = await ctx.scanner.scan(target)
    expect(Array.isArray(vulns)).toBe(true)
  })

  it('安监检测 IDOR 漏洞（正常流程）', async () => {
    const vuln = await ctx.scanner.detectIDOR('/api/order', 'order-001', 'attacker-001')
    expect(vuln === null || (typeof vuln === 'object' && 'id' in vuln)).toBe(true)
  })

  it('安监检测缺少速率限制（正常流程）', async () => {
    const result = await ctx.scanner.detectMissingRateLimit('/api/login', 100)
    expect(typeof result).toBe('boolean')
  })
})

// ──────────── 🎮 导玩员：设备安全 ────────────
describe(`${ROLES.Guide} security 扩展测试`, () => {
  let ctx: Ctx
  beforeEach(async () => { ctx = setup() })

  it('导玩员对正常设备请求 WAF 放行（正常流程）', () => {
    const result = ctx.waf.evaluate({
      path: '/api/game/status',
      method: 'GET',
      headers: { 'X-Device-ID': 'arcade-001' },
      ip: '10.10.10.1',
    })
    expect(result.allowed).toBe(true)
  })

  it('导玩员检测设备错误响应中的敏感信息（正常流程）', async () => {
    const responseBody = {
      error: 'DB_CONNECTION_FAILED',
      stack: 'at Database.connect (/app/db.js:42)',
      auth_token: 'ghp_abc123',
    }
    const exposed = await ctx.scanner.detectSensitiveDataExposure('/api/game/error', responseBody)
    expect(Array.isArray(exposed)).toBe(true)
  })

  it('导玩员对已知恶意 IP 的请求应被拦截（权限边界）', () => {
    const result = ctx.waf.evaluate({
      path: '/api/game/leaderboard',
      method: 'GET',
      headers: {},
      ip: '192.168.1.100',
    })
    expect(result.allowed).toBe(false)
    expect(result.riskLevel).toBe('malicious')
  })
})

// ──────────── 🎯 运行专员：系统加固 ────────────
describe(`${ROLES.Ops} security 扩展测试`, () => {
  let ctx: Ctx
  beforeEach(async () => { ctx = setup() })

  it('运行专员批量扫描多个目标（正常流程）', async () => {
    const targets: SecurityScanTarget[] = [
      { endpoint: 'https://svc1.example.com', method: 'GET' },
      { endpoint: 'https://svc2.example.com', method: 'POST' },
    ]
    const results = await ctx.scanner.scanMultiple(targets)
    expect(results.size).toBe(2)
  })

  it('运行专员更新存在的 WAF 规则（正常流程）', () => {
    const rule = ctx.waf.addRule({ name: 'Update Me', condition: { type: 'ip', operator: 'equals', value: '9.9.9.9' }, action: 'block', priority: 5, enabled: true })
    const updated = ctx.waf.updateRule(rule.id, { name: 'Updated Rule', priority: 1 })
    expect(updated.name).toBe('Updated Rule')
    expect(updated.priority).toBe(1)
  })

  it('运行专员更新不存在的 WAF 规则应抛异常（反例）', () => {
    expect(() => ctx.waf.updateRule('ghost-id', { name: 'Ghost' })).toThrow()
  })

  it('运行专员禁用 WAF 规则后该规则不生效（权限边界）', () => {
    ctx.waf.addRule({ name: 'Block ALL', condition: { type: 'path', operator: 'equals', value: '/api/admin' }, action: 'block', priority: 1, enabled: false })
    const result = ctx.waf.evaluate({ path: '/api/admin', method: 'GET', headers: {}, ip: '9.9.9.9' })
    expect(result.allowed).toBe(true)
  })
})

// ──────────── 🤝 团建：批量安全检测 ────────────
describe(`${ROLES.Teambuilding} security 扩展测试`, () => {
  let ctx: Ctx
  beforeEach(() => { ctx = setup() })

  it('团建专员导出 JSON 格式漏洞报告（正常流程）', () => {
    const vulns = [
      makeVuln({ id: 'V-001', title: 'SQLi', severity: 'high', category: 'injection', remediation: '参数化', affectedEndpoint: '/login', cvssScore: 7.5 }),
    ]
    const jsonStr = ctx.scanner.exportJSON(vulns)
    const parsed = JSON.parse(jsonStr)
    expect(Array.isArray(parsed.vulnerabilities)).toBe(true)
    expect(parsed.vulnerabilities[0].id).toBe('V-001')
  })

  it('团建专员导出空 JSON 报告不报错（边界）', () => {
    const jsonStr = ctx.scanner.exportJSON([])
    const parsed = JSON.parse(jsonStr)
    expect(parsed.vulnerabilities).toHaveLength(0)
  })

  it('团建专员对 3 个端点批量 WAF 评估（正常流程）', () => {
    const endpoints = [
      { path: '/api/public', method: 'GET', ip: '1.1.1.1' },
      { path: '/api/admin', method: 'POST', ip: '2.2.2.2', body: JSON.stringify({ action: 'delete_all' }) },
      { path: '/api/health', method: 'GET', ip: '3.3.3.3' },
    ]
    for (const ep of endpoints) {
      const result = ctx.waf.evaluate({ path: ep.path, method: ep.method, headers: {}, body: (ep as any).body, ip: ep.ip })
      expect(typeof result.allowed).toBe('boolean')
      expect(result).toHaveProperty('reason')
      expect(result).toHaveProperty('riskLevel')
    }
  })
})

// ──────────── 📢 营销：报表生成与合规 ────────────
describe(`${ROLES.Marketing} security 扩展测试`, () => {
  let ctx: Ctx
  beforeEach(() => { ctx = setup() })

  it('营销生成多漏洞综合报告（正常流程）', () => {
    const vulns = [
      makeVuln({ id: 'V-100', title: 'XSS漏洞', severity: 'medium', category: 'data_exposure', remediation: '输出编码', affectedEndpoint: '/search', cvssScore: 5.0 }),
      makeVuln({ id: 'V-101', title: 'CSRF漏洞', severity: 'low', category: 'csrf', remediation: '添加 Token', affectedEndpoint: '/profile/update', cvssScore: 2.5 }),
      makeVuln({ id: 'V-102', title: 'RCE漏洞', severity: 'critical', category: 'injection', remediation: '严格校验上传文件', affectedEndpoint: '/file/upload', cvssScore: 9.5 }),
    ]
    const report = ctx.scanner.generateReport(vulns)
    expect(report).toContain('XSS漏洞')
    expect(report).toContain('CSRF漏洞')
    expect(report).toContain('RCE漏洞')
    expect(report).toContain('CRITICAL')
    expect(report).toContain('LOW')
  })

  it('营销查看 WAF 被阻止的日志（正常流程）', () => {
    // 触发 WAF 阻止：SQL注入模式
    ctx.waf.evaluate({ path: '/api/login', method: 'POST', headers: {}, body: JSON.stringify({ username: "' OR 1=1--" }), ip: '10.0.0.1' })
    // 已知恶意 IP
    ctx.waf.evaluate({ path: '/api/admin', method: 'GET', headers: {}, ip: '192.168.1.100' })
    const logs = ctx.waf.getBlockedLogs(10)
    expect(Array.isArray(logs)).toBe(true)
    expect(logs.length).toBeGreaterThanOrEqual(1)
  })

  it('营销限制 WAF 阻止日志返回数量（正常流程）', () => {
    for (let i = 0; i < 20; i++) {
      ctx.waf.evaluate({ path: '/api/login', method: 'POST', headers: {}, body: JSON.stringify({ username: "' OR 1=1--" }), ip: `10.0.0.${i}` })
    }
    const logs5 = ctx.waf.getBlockedLogs(5)
    expect(logs5.length).toBeLessThanOrEqual(5)
    const logs10 = ctx.waf.getBlockedLogs(10)
    expect(logs10.length).toBeLessThanOrEqual(10)
  })
})

// ──────────── 📦 跨角色通用测试 ────────────
describe('跨角色 security 通用边界测试', () => {
  let ctx: Ctx
  beforeEach(async () => { ctx = setup() })

  it('所有角色可查看 WAF 列表（通用能力）', () => {
    const rules = ctx.waf.listRules()
    expect(Array.isArray(rules)).toBe(true)
    for (const rule of rules) {
      expect(rule).toHaveProperty('id')
      expect(rule).toHaveProperty('name')
      expect(rule).toHaveProperty('condition')
      expect(rule).toHaveProperty('action')
    }
  })

  it('所有角色可以触发 WAF 评估并获取结构化结果（通用能力）', () => {
    const result = ctx.waf.evaluate({ path: '/api/test', method: 'GET', headers: {}, ip: '1.2.3.4' })
    expect(result).toHaveProperty('allowed')
    expect(result).toHaveProperty('reason')
    expect(result).toHaveProperty('riskLevel')
    expect(typeof result.allowed).toBe('boolean')
  })

  it('所有角色扫描未知端点应不崩溃（边界）', async () => {
    const target: SecurityScanTarget = { endpoint: 'https://unknown.local', method: 'GET' }
    const result = await ctx.scanner.scan(target)
    expect(Array.isArray(result)).toBe(true)
  })
})
