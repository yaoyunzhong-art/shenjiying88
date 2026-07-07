import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AIReviewerService } from './ai-reviewer.service'
import type { ReviewRule, ReviewFinding } from './ai-reviewer.service'

describe('AIReviewerService', () => {
  let service: AIReviewerService

  beforeEach(() => {
    service = new AIReviewerService()
  })

  // ── listRules ──

  describe('listRules', () => {
    it('should return the built-in rules', () => {
      const rules = service.listRules()
      expect(rules.length).toBeGreaterThanOrEqual(5)
      const ruleIds = rules.map((r) => r.ruleId)
      expect(ruleIds).toContain('quota-double-increment')
      expect(ruleIds).toContain('unsafe-catch')
      expect(ruleIds).toContain('missing-tenant-guard')
      expect(ruleIds).toContain('undefined-data-source')
      expect(ruleIds).toContain('console-log-in-service')
    })

    it('should return a defensive copy of rules', () => {
      const rules = service.listRules()
      const originalLength = rules.length
      rules.push({} as ReviewRule)
      expect(service.listRules().length).toBe(originalLength)
    })
  })

  // ── registerRule ──

  describe('registerRule', () => {
    it('should register a new custom rule', () => {
      const customRule: ReviewRule = {
        ruleId: 'custom-hardcoded-secret',
        ruleName: '硬编码密钥',
        description: '检测硬编码的密钥或 token',
        severity: 'error',
        pattern: /password\s*=\s*['"][^'"]+['"]/,
        reference: '.trae/specs/security/secrets.md',
      }
      service.registerRule(customRule)

      const rules = service.listRules()
      const found = rules.find((r) => r.ruleId === 'custom-hardcoded-secret')
      expect(found).toBeDefined()
      expect(found!.severity).toBe('error')
    })

    it('should allow registering multiple rules with same severity', () => {
      const r1: ReviewRule = {
        ruleId: 'extra-rule-1',
        ruleName: 'Extra Rule 1',
        description: 'Desc 1',
        severity: 'warn',
        pattern: /aaa/,
        reference: 'ref1',
      }
      const r2: ReviewRule = {
        ruleId: 'extra-rule-2',
        ruleName: 'Extra Rule 2',
        description: 'Desc 2',
        severity: 'warn',
        pattern: /bbb/,
        reference: 'ref2',
      }
      service.registerRule(r1)
      service.registerRule(r2)

      const rules = service.listRules()
      expect(rules.filter((r) => r.ruleId.startsWith('extra-rule-')).length).toBe(2)
    })
  })

  // ── reviewFile ──

  describe('reviewFile', () => {
    it('should detect quota-double-increment pattern', () => {
      const content = `
        const r = quota.reserve(tenantId, QuotaResourceKind.Coupon);
        if (success) {
          quota.increment(tenantId, QuotaResourceKind.Coupon, 1);
        }
      `
      const findings = service.reviewFile('quota.service.ts', content)
      const found = findings.find((f) => f.ruleId === 'quota-double-increment')
      expect(found).toBeDefined()
      expect(found!.severity).toBe('error')
      expect(found!.file).toBe('quota.service.ts')
      expect(found!.line).toBeGreaterThan(0)
    })

    it('should detect empty catch blocks', () => {
      const content = `
        try {
          await someRiskyOperation()
        } catch (err) {}
      `
      const findings = service.reviewFile('unsafe.ts', content)
      const found = findings.find((f) => f.ruleId === 'unsafe-catch')
      expect(found).toBeDefined()
      expect(found!.severity).toBe('warn')
    })

    it('should detect console.log in service code', () => {
      const content = `
        function doSomething() {
          console.log('doing something');
          return 42;
        }
      `
      const findings = service.reviewFile('helper.ts', content)
      const found = findings.find((f) => f.ruleId === 'console-log-in-service')
      expect(found).toBeDefined()
      expect(found!.severity).toBe('info')
    })

    it('should return empty array for clean code', () => {
      const content = `
        import { Injectable, Logger } from '@nestjs/common';
        @Injectable()
        export class CleanService {
          private readonly logger = new Logger(CleanService.name);
          doWork() { this.logger.log('working'); }
        }
      `
      const findings = service.reviewFile('clean.service.ts', content)
      expect(findings.length).toBe(0)
    })

    it('should detect missing-tenant-guard in findOne', () => {
      const content = `
        const record = await this.repo.findOne({ where: { id: someId } });
      `
      const findings = service.reviewFile('leaky.ts', content)
      const found = findings.find((f) => f.ruleId === 'missing-tenant-guard')
      expect(found).toBeDefined()
      expect(found!.severity).toBe('error')
    })

    it('should detect undefined data source in service construction', () => {
      const content = 'new SomeService(undefined, undefined)'
      const findings = service.reviewFile('test.stub.ts', content)
      const found = findings.find((f) => f.ruleId === 'undefined-data-source')
      expect(found).toBeDefined()
      expect(found!.severity).toBe('info')
    })

    it('should correctly report line number', () => {
      const content = 'line1\nline2\nline3\nconsole.log("bad");'
      const findings = service.reviewFile('test.ts', content)
      const found = findings.find((f) => f.ruleId === 'console-log-in-service')
      expect(found).toBeDefined()
      expect(found!.line).toBe(4)
    })

    it('should include suggestion text in findings', () => {
      const content = 'console.log("test");'
      const findings = service.reviewFile('test.ts', content)
      const found = findings.find((f) => f.ruleId === 'console-log-in-service')
      expect(found).toBeDefined()
      expect(found!.suggestion).toBeTruthy()
      expect(found!.reference).toBeTruthy()
    })
  })

  // ── reviewFiles (batch) ──

  describe('reviewFiles', () => {
    it('should review multiple files and aggregate findings', () => {
      const files = [
        { path: 'a.ts', content: 'console.log("a");' },
        { path: 'b.ts', content: 'try {} catch (e) {}' },
        { path: 'c.ts', content: 'const x = 1;' },
      ]
      const findings = service.reviewFiles(files)
      expect(findings.length).toBeGreaterThanOrEqual(2)
      const filePaths = [...new Set(findings.map((f) => f.file))]
      expect(filePaths).toContain('a.ts')
      expect(filePaths).toContain('b.ts')
    })

    it('should handle empty file list', () => {
      const findings = service.reviewFiles([])
      expect(findings.length).toBe(0)
    })
  })

  // ── summarize ──

  describe('summarize', () => {
    it('should count findings by severity', () => {
      const findings: ReviewFinding[] = [
        { ruleId: 'r1', ruleName: 'R1', severity: 'error', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
        { ruleId: 'r2', ruleName: 'R2', severity: 'warn', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
        { ruleId: 'r3', ruleName: 'R3', severity: 'error', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
        { ruleId: 'r4', ruleName: 'R4', severity: 'info', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
      ]
      const summary = service.summarize(findings)
      expect(summary.error).toBe(2)
      expect(summary.warn).toBe(1)
      expect(summary.info).toBe(1)
    })

    it('should return zero counts for empty findings', () => {
      const summary = service.summarize([])
      expect(summary.error).toBe(0)
      expect(summary.warn).toBe(0)
      expect(summary.info).toBe(0)
    })
  })

  // ── ciVerdict ──

  describe('ciVerdict', () => {
    it('should fail CI when errors exist', () => {
      const findings: ReviewFinding[] = [
        { ruleId: 'r1', ruleName: 'R1', severity: 'error', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
      ]
      const result = service.ciVerdict(findings)
      expect(result.pass).toBe(false)
      expect(result.errorCount).toBe(1)
    })

    it('should pass CI when only warnings and infos exist', () => {
      const findings: ReviewFinding[] = [
        { ruleId: 'r1', ruleName: 'R1', severity: 'warn', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
        { ruleId: 'r2', ruleName: 'R2', severity: 'info', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
      ]
      const result = service.ciVerdict(findings)
      expect(result.pass).toBe(true)
      expect(result.errorCount).toBe(0)
    })

    it('should pass CI with no findings', () => {
      const result = service.ciVerdict([])
      expect(result.pass).toBe(true)
      expect(result.errorCount).toBe(0)
      expect(result.warnCount).toBe(0)
    })

    it('should correctly count warnings alongside errors', () => {
      const findings: ReviewFinding[] = [
        { ruleId: 'r1', ruleName: 'R1', severity: 'error', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
        { ruleId: 'r2', ruleName: 'R2', severity: 'warn', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
        { ruleId: 'r3', ruleName: 'R3', severity: 'warn', file: 'a.ts', snippet: '', message: '', suggestion: '', reference: '' },
      ]
      const result = service.ciVerdict(findings)
      expect(result.pass).toBe(false)
      expect(result.errorCount).toBe(1)
      expect(result.warnCount).toBe(2)
    })
  })

  // ── Register + Review integration ──

  describe('register then review (integration)', () => {
    it('should detect newly registered rule patterns in reviewFile', () => {
      service.registerRule({
        ruleId: 'magic-number',
        ruleName: 'Magic Number',
        description: '检测硬编码数字 42',
        severity: 'warn',
        pattern: /\b42\b/,
        reference: 'style.md',
      })

      const findings = service.reviewFile('magic.ts', 'const answer = 42;')
      const found = findings.find((f) => f.ruleId === 'magic-number')
      expect(found).toBeDefined()
      expect(found!.severity).toBe('warn')
    })

    it('should not affect existing rules when registering new ones', () => {
      const beforeCount = service.listRules().length
      service.registerRule({
        ruleId: 'extra',
        ruleName: 'Extra',
        description: 'Extra rule',
        severity: 'info',
        pattern: /extra/,
        reference: 'ref',
      })
      expect(service.listRules().length).toBe(beforeCount + 1)
    })
  })

  // ── Edge cases ──

  describe('edge cases', () => {
    it('should handle multiline snippets gracefully', () => {
      const content = `
        function bad() {
          try {
            riskyStuff()
          } catch (e) {
            // still empty
          }
        }
      `
      const findings = service.reviewFile('test.ts', content)
      const emptyCatchFindings = findings.filter((f) => f.ruleId === 'unsafe-catch')
      expect(emptyCatchFindings.length).toBe(0) // there's a comment, not truly empty
    })

    it('should handle special regex characters in file content', () => {
      const content = 'if (a + b) { console.log("has plus"); }'
      const findings = service.reviewFile('test.ts', content)
      const found = findings.find((f) => f.ruleId === 'console-log-in-service')
      expect(found).toBeDefined()
    })

    it('should detect multiple violations of the same rule in one file', () => {
      const content = `
        console.log("first");
        console.log("second");
        console.log("third");
      `
      const findings = service.reviewFile('test.ts', content)
      const consoleFindings = findings.filter((f) => f.ruleId === 'console-log-in-service')
      expect(consoleFindings.length).toBe(3)
    })
  })
})
