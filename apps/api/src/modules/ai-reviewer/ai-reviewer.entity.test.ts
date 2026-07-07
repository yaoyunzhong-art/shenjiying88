import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import type { ReviewSession, ReviewConfig, ReviewStats, ReviewFinding, ReviewRule } from './ai-reviewer.entity'

describe('ai-reviewer.entity', () => {
  describe('ReviewSession', () => {
    it('should create a valid ReviewSession', () => {
      const session: ReviewSession = {
        id: 'session-001',
        files: [{ path: 'test.ts', content: 'console.log("hi")' }],
        findings: [],
        summary: { info: 0, warn: 0, error: 0 },
        verdict: { pass: true, errorCount: 0, warnCount: 0 },
        createdAt: '2026-06-26T02:00:00.000Z',
        triggeredBy: 'ci-bot',
        projectPath: '/app/src',
      }

      expect(session.id).toBe('session-001')
      expect(session.files).toHaveLength(1)
      expect(session.verdict.pass).toBe(true)
      expect(session.triggeredBy).toBe('ci-bot')
    })

    it('should accept ReviewFinding in findings', () => {
      const finding: ReviewFinding = {
        ruleId: 'unsafe-catch',
        ruleName: '吞掉错误的 catch',
        severity: 'warn',
        file: 'test.ts',
        snippet: 'catch (err) {}',
        message: 'catch 块不应静默吞错',
        suggestion: '加 logger.error',
        reference: 'docs/catch.md',
      }

      expect(finding.severity).toBe('warn')
      expect(finding.ruleId).toBe('unsafe-catch')
    })

    it('should allow empty findings array', () => {
      const session: ReviewSession = {
        id: 'session-002',
        files: [],
        findings: [],
        summary: { info: 0, warn: 0, error: 0 },
        verdict: { pass: true, errorCount: 0, warnCount: 0 },
        createdAt: '2026-06-26T02:00:00.000Z',
        triggeredBy: 'dev',
        projectPath: '/',
      }

      expect(session.findings).toHaveLength(0)
    })
  })

  describe('ReviewConfig', () => {
    it('should create a valid ReviewConfig', () => {
      const config: ReviewConfig = {
        id: 'config-001',
        name: 'Default Config',
        enabledRules: ['unsafe-catch', 'console-log-in-service'],
        ignorePatterns: ['*.test.ts', '*.d.ts'],
        ciMode: true,
        maxFiles: 50,
        maxLinesPerFile: 1000,
        updatedAt: '2026-06-26T02:00:00.000Z',
        tenantId: 'tenant-001',
      }

      expect(config.enabledRules).toHaveLength(2)
      expect(config.ciMode).toBe(true)
      expect(config.tenantId).toBe('tenant-001')
    })

    it('should allow empty rule and ignore lists', () => {
      const config: ReviewConfig = {
        id: 'config-002',
        name: 'Loose Config',
        enabledRules: [],
        ignorePatterns: [],
        ciMode: false,
        maxFiles: 10,
        maxLinesPerFile: 500,
        updatedAt: '2026-06-26T02:00:00.000Z',
        tenantId: 'tenant-002',
      }

      expect(config.enabledRules).toHaveLength(0)
      expect(config.ignorePatterns).toHaveLength(0)
    })
  })

  describe('ReviewStats', () => {
    it('should create valid ReviewStats with zeros', () => {
      const stats: ReviewStats = {
        totalSessions: 0,
        totalFiles: 0,
        totalFindings: 0,
        findingsBySeverity: { info: 0, warn: 0, error: 0 },
        findingsByRule: {},
        topRules: [],
        passRate: 1,
        lastSessionAt: null,
      }

      expect(stats.passRate).toBe(1)
      expect(stats.lastSessionAt).toBeNull()
    })

    it('should create valid ReviewStats with data', () => {
      const stats: ReviewStats = {
        totalSessions: 10,
        totalFiles: 45,
        totalFindings: 23,
        findingsBySeverity: { info: 5, warn: 12, error: 6 },
        findingsByRule: { 'unsafe-catch': 8, 'console-log-in-service': 15 },
        topRules: [
          { ruleId: 'console-log-in-service', ruleName: '业务代码用 console.log', count: 15 },
          { ruleId: 'unsafe-catch', ruleName: '吞掉错误的 catch', count: 8 },
        ],
        passRate: 0.4,
        lastSessionAt: '2026-06-26T02:00:00.000Z',
      }

      expect(stats.totalSessions).toBe(10)
      expect(stats.topRules).toHaveLength(2)
      expect(stats.findingsBySeverity.error).toBe(6)
    })
  })

  describe('ReviewRule type compatibility', () => {
    it('should accept a ReviewRule pattern as RegExp', () => {
      const rule: ReviewRule = {
        ruleId: 'test-rule',
        ruleName: 'Test',
        description: 'A test rule',
        severity: 'info',
        pattern: /test/,
        reference: 'docs/test.md',
      }

      expect(rule.pattern.test('this is a test')).toBe(true)
      expect(rule.pattern.test('no match')).toBe(false)
    })
  })
})
