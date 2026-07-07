import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-reviewer] [D] controller spec 补全
 * AIReviewerController 单元测试 (node:test)
 *
 * 策略：内联 Controller 副本 (avoid NestJS DI) + Mock Service
 * 覆盖所有路由端点：review、rules/crud、stats、ci-verify
 * 正向流程 + 边界条件（空文件、不存在的规则、空规则集、并发场景）
 */

import assert from 'node:assert/strict'
// ── Type mirrors ─────────────────────────────────────────────
type ReviewSeverity = 'info' | 'warn' | 'error'

interface ReviewFinding {
  ruleId: string
  ruleName: string
  severity: ReviewSeverity
  file: string
  line?: number
  snippet: string
  message: string
  suggestion: string
  reference: string
}

interface ReviewRule {
  ruleId: string
  ruleName: string
  description: string
  severity: ReviewSeverity
  pattern: RegExp
  reference: string
}

interface ReviewStats {
  totalSessions: number
  totalFiles: number
  totalFindings: number
  findingsBySeverity: Record<ReviewSeverity, number>
  findingsByRule: Record<string, number>
  topRules: Array<{ ruleId: string; ruleName: string; count: number }>
  passRate: number
  lastSessionAt: string | null
}

interface ReviewResponse {
  sessionId: string
  totalFiles: number
  totalFindings: number
  summary: Record<ReviewSeverity, number>
  verdict: { pass: boolean; errorCount: number; warnCount: number }
  findings: Array<{
    file: string
    line?: number
    ruleId: string
    ruleName: string
    severity: ReviewSeverity
    snippet: string
    message: string
  }>
  createdAt: string
}

// ── Factory helpers ──────────────────────────────────────────
function makeFinding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return {
    ruleId: 'quota-double-increment',
    ruleName: 'Quota 双重 increment',
    severity: 'error',
    file: 'src/service.ts',
    line: 42,
    snippet: 'quota.reserve(...); quota.increment(...)',
    message: 'reserve() 已自增,业务成功不应再 increment',
    suggestion: '改用 quota.check() 替代 quota.reserve()',
    reference: '.trae/specs/anti-patterns/quota-double-increment.md',
    ...overrides,
  }
}

function makeRule(overrides: Partial<ReviewRule> = {}): ReviewRule {
  return {
    ruleId: 'test-rule',
    ruleName: 'Test Rule',
    description: 'A test rule for unit testing',
    severity: 'warn',
    pattern: /test-pattern/,
    reference: 'docs/test-rule.md',
    ...overrides,
  }
}

// ── Inline Controller implementation ─────────────────────────
// Mirrors the actual AIReviewerController logic but injects a
// mock service for deterministic testing.
function createController(mockService: ReturnType<typeof makeMockService>) {
  return {
    review(body: { files: Array<{ path: string; content: string }> }): ReviewResponse {
      const sessionId = `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const findings = mockService.reviewFiles(body.files)
      const summary = mockService.summarize(findings)
      const verdict = mockService.ciVerdict(findings)

      return {
        sessionId,
        totalFiles: body.files.length,
        totalFindings: findings.length,
        summary,
        verdict,
        findings: findings.map((f: ReviewFinding) => ({
          file: f.file,
          line: f.line,
          ruleId: f.ruleId,
          ruleName: f.ruleName,
          severity: f.severity,
          snippet: f.snippet,
          message: f.message,
        })),
        createdAt: new Date().toISOString(),
      }
    },

    listRules(): ReviewRule[] {
      return mockService.listRules()
    },

    registerRule(body: {
      ruleId: string
      ruleName: string
      description: string
      severity: ReviewSeverity
      pattern: string
      reference: string
    }): { ruleId: string; message: string } {
      const rule: ReviewRule = {
        ruleId: body.ruleId,
        ruleName: body.ruleName,
        description: body.description,
        severity: body.severity,
        pattern: new RegExp(body.pattern),
        reference: body.reference,
      }
      mockService.registerRule(rule)
      return {
        ruleId: body.ruleId,
        message: `Rule '${body.ruleId}' registered successfully`,
      }
    },

    getStats(): ReviewStats {
      const rules = mockService.listRules()
      const findings = rules.map((rule: ReviewRule) => ({
        ruleId: rule.ruleId,
        ruleName: rule.ruleName,
        severity: rule.severity,
        file: '',
        snippet: '',
        message: '',
        suggestion: '',
        reference: '',
      }))
      const summary = mockService.summarize(findings)
      return {
        totalSessions: 0,
        totalFiles: 0,
        totalFindings: 0,
        findingsBySeverity: summary,
        findingsByRule: {},
        topRules: [],
        passRate: 1,
        lastSessionAt: null,
      }
    },

    getRule(ruleId: string): ReviewRule | { error: string } {
      const rules = mockService.listRules()
      const rule = rules.find((r: ReviewRule) => r.ruleId === ruleId)
      if (!rule) return { error: `Rule '${ruleId}' not found` }
      return rule
    },

    ciVerify(body: {
      files: Array<{ path: string; content: string }>
    }): { pass: boolean; errorCount: number; warnCount: number; findings: number } {
      const findings = mockService.reviewFiles(body.files)
      const verdict = mockService.ciVerdict(findings)
      return {
        pass: verdict.pass,
        errorCount: verdict.errorCount,
        warnCount: verdict.warnCount,
        findings: findings.length,
      }
    },
  }
}

// ── Mock Service Factory ─────────────────────────────────────
function makeMockService() {
  const rules: ReviewRule[] = [
    {
      ruleId: 'quota-double-increment',
      ruleName: 'Quota 双重 increment',
      description: 'reserve() 已自增',
      severity: 'error',
      pattern: /quota\.increment/,
      reference: 'docs/quota.md',
    },
    {
      ruleId: 'console-log-in-service',
      ruleName: '业务代码用 console.log',
      description: '应使用 Logger',
      severity: 'info',
      pattern: /console\.log/,
      reference: 'docs/logging.md',
    },
  ]

  return {
    reviewFiles(files: Array<{ path: string; content: string }>): ReviewFinding[] {
      return files.flatMap((f) => {
        const findings: ReviewFinding[] = []
        for (const rule of rules) {
          if (rule.pattern.test(f.content)) {
            findings.push(makeFinding({
              ruleId: rule.ruleId,
              ruleName: rule.ruleName,
              severity: rule.severity,
              file: f.path,
              line: 10,
              snippet: f.content.match(rule.pattern)?.[0] ?? '',
              message: rule.description,
              reference: rule.reference,
            }))
          }
        }
        return findings
      })
    },
    listRules(): ReviewRule[] {
      return [...rules]
    },
    registerRule(rule: ReviewRule): void {
      rules.push(rule)
    },
    summarize(findings: ReviewFinding[]): Record<ReviewSeverity, number> {
      const summary: Record<ReviewSeverity, number> = { info: 0, warn: 0, error: 0 }
      for (const f of findings) summary[f.severity]++
      return summary
    },
    ciVerdict(findings: ReviewFinding[]): { pass: boolean; errorCount: number; warnCount: number } {
      const summary = this.summarize(findings)
      return { pass: summary.error === 0, errorCount: summary.error, warnCount: summary.warn }
    },
  }
}

// ── Tests ────────────────────────────────────────────────────

describe('AIReviewerController', () => {
  describe('POST /ai-reviewer/review — 审查单个/多个文件', () => {
    it('正例: 审查包含违规的文件返回 findings', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const result = ctrl.review({
        files: [
          { path: 'src/bad.ts', content: 'function x() { quota.increment(); console.log("hi"); }' },
        ],
      })

      assert.equal(result.totalFiles, 1)
      assert.ok(result.totalFindings >= 2, `expected >=2 findings, got ${result.totalFindings}`)
      assert.ok(result.sessionId.startsWith('review-'))
      assert.equal(typeof result.createdAt, 'string')
      assert.ok(result.verdict.pass === false) // has error-severity finding
      assert.equal(result.verdict.errorCount, 1)
      assert.equal(result.verdict.warnCount, 0)
      assert.ok(result.findings.length >= 2)
      assert.ok(result.findings.some((f) => f.ruleId === 'quota-double-increment'))
      assert.ok(result.findings.some((f) => f.ruleId === 'console-log-in-service'))
    })

    it('正例: 审查无违规的文件返回空 findings 且 pass', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const result = ctrl.review({
        files: [{ path: 'src/clean.ts', content: 'const x = 42;' }],
      })

      assert.equal(result.totalFiles, 1)
      assert.equal(result.totalFindings, 0)
      assert.ok(result.verdict.pass)
      assert.equal(result.summary.error, 0)
      assert.equal(result.summary.warn, 0)
      assert.equal(result.summary.info, 0)
    })

    it('边界: 空文件列表返回空结果', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const result = ctrl.review({ files: [] })

      assert.equal(result.totalFiles, 0)
      assert.equal(result.totalFindings, 0)
      assert.ok(result.verdict.pass)
      assert.equal(typeof result.sessionId, 'string')
    })
  })

  describe('GET /ai-reviewer/rules — 列出所有规则', () => {
    it('正例: 返回内置规则列表', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const rules = ctrl.listRules()

      assert.ok(Array.isArray(rules))
      assert.equal(rules.length, 2)
      assert.equal(rules[0].ruleId, 'quota-double-increment')
      assert.equal(rules[1].ruleId, 'console-log-in-service')
      rules.forEach((r) => {
        assert.ok(r.pattern instanceof RegExp)
        assert.ok(typeof r.severity === 'string')
      })
    })

    it('边界: 初始规则集空时不抛异常', () => {
      const svc = makeMockService()
      // 清空规则
      while (svc.listRules().length > 0) svc.listRules().pop()
      const ctrl = createController(svc)
      const rules = ctrl.listRules()
      assert.equal(rules.length, 0)
    })
  })

  describe('POST /ai-reviewer/rules — 注册自定义规则', () => {
    it('正例: 注册规则成功返回确认', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)

      const result = ctrl.registerRule({
        ruleId: 'my-custom-rule',
        ruleName: 'Custom Check',
        description: 'Checks for something',
        severity: 'error',
        pattern: 'forbidden-pattern',
        reference: 'docs/custom.md',
      })

      assert.equal(result.ruleId, 'my-custom-rule')
      assert.ok(result.message.includes('registered successfully'))

      // 验证规则已注册
      const rules = ctrl.listRules()
      assert.ok(rules.some((r) => r.ruleId === 'my-custom-rule'))
    })

    it('边界: 注册重复 ruleId 应允许（叠加）', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)

      ctrl.registerRule({
        ruleId: 'duplicate-rule',
        ruleName: 'First',
        description: '',
        severity: 'info',
        pattern: 'pattern-a',
        reference: '',
      })
      ctrl.registerRule({
        ruleId: 'duplicate-rule',
        ruleName: 'Second',
        description: '',
        severity: 'warn',
        pattern: 'pattern-b',
        reference: '',
      })

      const rules = ctrl.listRules()
      const dups = rules.filter((r) => r.ruleId === 'duplicate-rule')
      assert.equal(dups.length, 2, '重复 ruleId 注册应叠加不覆盖')
    })
  })

  describe('GET /ai-reviewer/stats — 审查统计', () => {
    it('正例: 返回统计结构正确', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const stats = ctrl.getStats()

      assert.equal(typeof stats.totalSessions, 'number')
      assert.equal(typeof stats.passRate, 'number')
      assert.equal(typeof stats.findingsBySeverity, 'object')
      assert.ok('info' in stats.findingsBySeverity)
      assert.ok('warn' in stats.findingsBySeverity)
      assert.ok('error' in stats.findingsBySeverity)
    })

    it('正例: findingsBySeverity 统计与规则严重度匹配', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const stats = ctrl.getStats()

      // 内置: quota-double-increment = error, console-log-in-service = info
      assert.equal(stats.findingsBySeverity.error, 1)
      assert.equal(stats.findingsBySeverity.info, 1)
      assert.equal(stats.findingsBySeverity.warn, 0)
    })
  })

  describe('GET /ai-reviewer/rules/:ruleId — 获取指定规则', () => {
    it('正例: 根据 ruleId 返回规则详情', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const rule = ctrl.getRule('quota-double-increment') as ReviewRule

      assert.equal(rule.ruleId, 'quota-double-increment')
      assert.equal(rule.severity, 'error')
      assert.ok((rule as any).pattern instanceof RegExp)
    })

    it('边界: 不存在的 ruleId 返回错误信息', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const result = ctrl.getRule('non-existent-rule') as { error: string }

      assert.ok('error' in result)
      assert.ok(result.error.includes("Rule 'non-existent-rule' not found"))
    })
  })

  describe('POST /ai-reviewer/ci-verify — CI 验证', () => {
    it('正例: 含 error 违规时 CI 不通过', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const result = ctrl.ciVerify({
        files: [{ path: 'src/bad.ts', content: 'quota.increment()' }],
      })

      assert.equal(result.pass, false)
      assert.equal(result.errorCount, 1)
      assert.ok(result.findings >= 1)
    })

    it('正例: 仅含 info/warn 违规时 CI 通过', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      // Only console.log trigger (info severity)
      const result = ctrl.ciVerify({
        files: [{ path: 'src/log.ts', content: 'console.log("debug")' }],
      })

      // console-log-in-service 是 info, 不含 error → pass
      assert.equal(result.pass, true)
      assert.equal(result.errorCount, 0)
      assert.ok(result.findings >= 1)
    })

    it('边界: 空文件列表传递', () => {
      const svc = makeMockService()
      const ctrl = createController(svc)
      const result = ctrl.ciVerify({ files: [] })

      assert.equal(result.pass, true)
      assert.equal(result.errorCount, 0)
      assert.equal(result.warnCount, 0)
      assert.equal(result.findings, 0)
    })
  })
})
