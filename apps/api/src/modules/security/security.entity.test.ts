import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  SecurityVulnerability,
  SecurityScanTarget,
  SecurityScanSummary,
  SecurityReport,
  WAFRule,
  WAFDecision,
  WAFLogEntry,
  VulnerabilitySeverity,
  VulnerabilityCategory,
  WAFRuleAction,
  WAFConditionType,
  WAFConditionOperator,
  ScanRequest,
  BatchScanRequest,
  CreateWAFRuleRequest,
} from './security.entity'

// ── VulnerabilitySeverity type ────────────────────────────────
describe('security.entity: VulnerabilitySeverity', () => {
  it('accepts all severity levels', () => {
    const levels: VulnerabilitySeverity[] = ['info', 'low', 'medium', 'high', 'critical']
    assert.equal(levels.length, 5)
    assert.ok(levels.includes('critical'))
    assert.ok(levels.includes('info'))
  })
})

// ── VulnerabilityCategory type ────────────────────────────────
describe('security.entity: VulnerabilityCategory', () => {
  it('accepts all vulnerability categories', () => {
    const cats: VulnerabilityCategory[] = [
      'injection', 'auth_bypass', 'data_exposure', 'idor',
      'csrf', 'rate_limiting', 'sensitive_data', 'cryptography',
    ]
    assert.equal(cats.length, 8)
    assert.ok(cats.includes('injection'))
    assert.ok(cats.includes('idor'))
    assert.ok(cats.includes('cryptography'))
  })
})

// ── SecurityVulnerability interface ───────────────────────────
describe('security.entity: SecurityVulnerability', () => {
  it('creates a valid vulnerability with all required fields', () => {
    const vuln: SecurityVulnerability = {
      id: 'VULN-001',
      title: 'SQL Injection on /api/login',
      description: '反射型 SQL 注入漏洞',
      category: 'injection',
      severity: 'critical',
      cvssScore: 9.8,
      affectedEndpoint: '/api/login',
      parameter: 'username',
      payload: "' OR '1'='1",
      remediation: '使用参数化查询',
      discoveredAt: new Date('2025-01-01'),
      falsePositive: false,
    }

    assert.equal(vuln.id, 'VULN-001')
    assert.equal(vuln.title, 'SQL Injection on /api/login')
    assert.equal(vuln.category, 'injection')
    assert.equal(vuln.severity, 'critical')
    assert.equal(vuln.cvssScore, 9.8)
    assert.equal(vuln.falsePositive, false)
  })

  it('optional cvssScore can be undefined', () => {
    const vuln: SecurityVulnerability = {
      id: 'VULN-002',
      title: 'Info leak',
      description: '信息泄露',
      category: 'data_exposure',
      severity: 'low',
      remediation: '移除敏感头',
      discoveredAt: new Date(),
      falsePositive: false,
    }
    assert.equal(vuln.cvssScore, undefined)
  })

  it('optional fixedAt may be undefined when unfixed', () => {
    const vuln: SecurityVulnerability = {
      id: 'VULN-003',
      title: '未修复',
      description: '待修复',
      category: 'auth_bypass',
      severity: 'high',
      remediation: '鉴权加固',
      discoveredAt: new Date(),
      falsePositive: false,
    }
    assert.equal(vuln.fixedAt, undefined)
  })

  it('falsePositive flag marks non-issues', () => {
    const fp: SecurityVulnerability = {
      id: 'VULN-FP',
      title: '误报',
      description: '误报检查',
      category: 'csrf',
      severity: 'info',
      remediation: '无需修复',
      discoveredAt: new Date(),
      falsePositive: true,
    }
    assert.equal(fp.falsePositive, true)
  })

  it('can have parameter and payload for exploit details', () => {
    const vuln: SecurityVulnerability = {
      id: 'VULN-XSS',
      title: 'XSS on profile',
      description: '存储型XSS',
      category: 'injection',
      severity: 'high',
      affectedEndpoint: '/api/profile',
      parameter: 'bio',
      payload: '<script>alert("xss")</script>',
      remediation: '输出编码',
      discoveredAt: new Date(),
      falsePositive: false,
    }
    assert.equal(vuln.parameter, 'bio')
    assert.ok(vuln.payload!.includes('<script>'))
  })
})

// ── SecurityScanTarget interface ─────────────────────────────
describe('security.entity: SecurityScanTarget', () => {
  it('creates a valid scan target', () => {
    const target: SecurityScanTarget = {
      endpoint: '/api/login',
      method: 'POST',
      parameters: { username: 'admin' },
    }
    assert.equal(target.endpoint, '/api/login')
    assert.equal(target.method, 'POST')
    assert.deepEqual(target.parameters, { username: 'admin' })
  })

  it('GET scan target without parameters', () => {
    const target: SecurityScanTarget = {
      endpoint: '/api/health',
      method: 'GET',
    }
    assert.equal(target.method, 'GET')
    assert.equal(target.parameters, undefined)
  })

  it('supports all HTTP methods', () => {
    const methods: SecurityScanTarget['method'][] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    const get: SecurityScanTarget = { endpoint: '/a', method: 'GET' }
    const del: SecurityScanTarget = { endpoint: '/b', method: 'DELETE' }
    const patch: SecurityScanTarget = { endpoint: '/c', method: 'PATCH' }
    assert.equal(get.method, 'GET')
    assert.equal(del.method, 'DELETE')
    assert.equal(patch.method, 'PATCH')
  })
})

// ── SecurityReport / SecurityScanSummary ─────────────────────
describe('security.entity: SecurityReport & SecurityScanSummary', () => {
  it('creates a valid summary', () => {
    const summary: SecurityScanSummary = {
      totalVulnerabilities: 10,
      critical: 2,
      high: 3,
      medium: 3,
      low: 1,
      info: 1,
      generatedAt: '2025-06-01T00:00:00Z',
    }
    assert.equal(summary.totalVulnerabilities, 10)
    assert.equal(summary.critical + summary.high + summary.medium + summary.low + summary.info, 10)
  })

  it('creates a valid report referencing summary', () => {
    const vuln: SecurityVulnerability = {
      id: 'V-RPT',
      title: 'Test',
      description: '',
      category: 'injection',
      severity: 'high',
      remediation: 'fix',
      discoveredAt: new Date(),
      falsePositive: false,
    }
    const report: SecurityReport = {
      generatedAt: '2025-06-01T00:00:00Z',
      totalVulnerabilities: 1,
      summary: {
        totalVulnerabilities: 1,
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        info: 0,
        generatedAt: '2025-06-01T00:00:00Z',
      },
      vulnerabilities: [vuln],
    }
    assert.equal(report.totalVulnerabilities, 1)
    assert.equal(report.vulnerabilities.length, 1)
    assert.equal(report.summary.high, 1)
  })
})

// ── WAFRuleAction type ───────────────────────────────────────
describe('security.entity: WAFRuleAction', () => {
  it('supports all actions', () => {
    const actions: WAFRuleAction[] = ['allow', 'block', 'challenge', 'log']
    assert.equal(actions.length, 4)
  })
})

// ── WAFConditionType & WAFConditionOperator ──────────────────
describe('security.entity: WAFConditionType', () => {
  it('supports all condition types', () => {
    const types: WAFConditionType[] = ['ip', 'path', 'header', 'body', 'rate']
    assert.equal(types.length, 5)
  })
})

describe('security.entity: WAFConditionOperator', () => {
  it('supports all operators', () => {
    const ops: WAFConditionOperator[] = ['equals', 'contains', 'regex', 'gt', 'lt']
    assert.equal(ops.length, 5)
  })
})

// ── WAFRule interface ────────────────────────────────────────
describe('security.entity: WAFRule', () => {
  it('creates a valid block rule', () => {
    const rule: WAFRule = {
      id: 'waf-001',
      name: 'Block SQLi',
      condition: {
        type: 'body',
        operator: 'contains',
        value: "' OR",
      },
      action: 'block',
      priority: 100,
      enabled: true,
    }
    assert.equal(rule.id, 'waf-001')
    assert.equal(rule.condition.type, 'body')
    assert.equal(rule.action, 'block')
    assert.equal(rule.enabled, true)
  })

  it('can have allow action', () => {
    const rule: WAFRule = {
      id: 'waf-allow',
      name: 'Allow internal IP',
      condition: { type: 'ip', operator: 'equals', value: '192.168.1.0/24' },
      action: 'allow',
      priority: 1,
      enabled: true,
    }
    assert.equal(rule.action, 'allow')
  })

  it('can be disabled', () => {
    const rule: WAFRule = {
      id: 'waf-disabled',
      name: 'Deprecated',
      condition: { type: 'path', operator: 'contains', value: '/old' },
      action: 'log',
      priority: 999,
      enabled: false,
    }
    assert.equal(rule.enabled, false)
  })
})

// ── WAFDecision interface ────────────────────────────────────
describe('security.entity: WAFDecision', () => {
  it('creates a blocked decision with matched rule', () => {
    const rule: WAFRule = {
      id: 'waf-block',
      name: 'Block XSS',
      condition: { type: 'body', operator: 'contains', value: '<script>' },
      action: 'block',
      priority: 50,
      enabled: true,
    }
    const decision: WAFDecision = {
      allowed: false,
      matchedRule: rule,
      reason: 'Matched XSS payload pattern',
      riskLevel: 'malicious',
      action: 'block',
    }
    assert.equal(decision.allowed, false)
    assert.equal(decision.matchedRule?.id, 'waf-block')
    assert.equal(decision.riskLevel, 'malicious')
  })

  it('creates an allowed decision', () => {
    const decision: WAFDecision = {
      allowed: true,
      reason: 'No rules matched',
      riskLevel: 'safe',
    }
    assert.equal(decision.allowed, true)
    assert.equal(decision.riskLevel, 'safe')
  })

  it('supports suspicious risk level', () => {
    const decision: WAFDecision = {
      allowed: true,
      reason: 'Unknown user-agent',
      riskLevel: 'suspicious',
      action: 'challenge',
    }
    assert.equal(decision.riskLevel, 'suspicious')
    assert.equal(decision.action, 'challenge')
  })
})

// ── WAFLogEntry interface ────────────────────────────────────
describe('security.entity: WAFLogEntry', () => {
  it('creates a valid log entry', () => {
    const entry: WAFLogEntry = {
      timestamp: '2025-06-01T12:00:00Z',
      ip: '192.168.1.100',
      path: '/api/login',
      method: 'POST',
      decision: {
        allowed: false,
        reason: 'Blocked by SQLi rule',
        riskLevel: 'malicious',
      },
    }
    assert.equal(entry.ip, '192.168.1.100')
    assert.equal(entry.method, 'POST')
    assert.equal(entry.decision.allowed, false)
  })
})

// ── Request DTO types ────────────────────────────────────────
describe('security.entity: ScanRequest & BatchScanRequest', () => {
  it('creates a valid scan request', () => {
    const req: ScanRequest = {
      target: { endpoint: '/api/login', method: 'POST' },
    }
    assert.equal(req.target.endpoint, '/api/login')
  })

  it('creates a valid batch scan request', () => {
    const req: BatchScanRequest = {
      targets: [
        { endpoint: '/api/login', method: 'POST' },
        { endpoint: '/api/profile', method: 'GET' },
      ],
    }
    assert.equal(req.targets.length, 2)
  })
})

// ── CreateWAFRuleRequest ─────────────────────────────────────
describe('security.entity: CreateWAFRuleRequest', () => {
  it('creates a valid request', () => {
    const req: CreateWAFRuleRequest = {
      name: 'Block path traversal',
      condition: { type: 'path', operator: 'contains', value: '../' },
      action: 'block',
      priority: 80,
      enabled: true,
    }
    assert.equal(req.name, 'Block path traversal')
    assert.equal(req.condition.value, '../')
  })
})
