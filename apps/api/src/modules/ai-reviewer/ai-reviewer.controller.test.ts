import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { AIReviewerController } from './ai-reviewer.controller'
import { AIReviewerService } from './ai-reviewer.service'
import type { ReviewRequestDto } from './ai-reviewer.dto'

describe('AIReviewerController', () => {
  let controller: AIReviewerController
  let service: AIReviewerService

  beforeEach(() => {
    service = new AIReviewerService()
    controller = new AIReviewerController(service)
  })

  describe('POST /ai-reviewer/review', () => {
    it('should review files and return findings', () => {
      const body: ReviewRequestDto = {
        files: [
          { path: 'test.ts', content: 'console.log("hello");\ntry { foo(); } catch (e) {}' },
        ],
        projectPath: '/app',
        triggeredBy: 'test',
      }

      const result = controller.review(body)

      expect(result.sessionId).toBeDefined()
      expect(result.totalFiles).toBe(1)
      expect(result.totalFindings).toBeGreaterThan(0)
      expect(result.summary).toBeDefined()
      expect(result.verdict).toBeDefined()
      expect(result.createdAt).toBeDefined()
    })

    it('should return pass=false when errors found', () => {
      const body: ReviewRequestDto = {
        files: [
          {
            path: 'coupon.service.ts',
            content: `
              const r = quota.reserve(tenantId, QuotaResourceKind.Coupon);
              if (success) quota.increment(tenantId, QuotaResourceKind.Coupon, 1);
            `,
          },
        ],
      }

      const result = controller.review(body)
      expect(result.verdict.pass).toBe(false)
      expect(result.verdict.errorCount).toBeGreaterThan(0)
    })

    it('should return pass=true for clean code', () => {
      const body: ReviewRequestDto = {
        files: [
          {
            path: 'good.service.ts',
            content: `
              import { Logger } from '@nestjs/common';
              @Injectable()
              export class GoodService {
                private readonly logger = new Logger(GoodService.name);
                async do() {
                  try { await foo(); } catch (err) {
                    this.logger.error('Failed: ' + err.message);
                    throw err;
                  }
                }
              }
            `,
          },
        ],
      }

      const result = controller.review(body)
      expect(result.verdict.pass).toBe(true)
    })
  })

  describe('GET /ai-reviewer/rules', () => {
    it('should list all rules', () => {
      const rules = controller.listRules()
      expect(rules.length).toBeGreaterThanOrEqual(5)
      expect(rules[0]).toHaveProperty('ruleId')
      expect(rules[0]).toHaveProperty('pattern')
      expect(rules[0].pattern).toBeInstanceOf(RegExp)
    })
  })

  describe('POST /ai-reviewer/rules', () => {
    it('should register a custom rule', () => {
      const result = controller.registerRule({
        ruleId: 'custom-rule-1',
        ruleName: 'Custom Rule',
        description: 'A custom test rule',
        severity: 'warn',
        pattern: 'custom-pattern',
        reference: 'docs/custom.md',
      })

      expect(result.ruleId).toBe('custom-rule-1')
      expect(result.message).toContain('registered successfully')

      const rules = controller.listRules()
      expect(rules.some((r) => r.ruleId === 'custom-rule-1')).toBe(true)
    })
  })

  describe('GET /ai-reviewer/rules/:ruleId', () => {
    it('should return a specific rule', () => {
      const rule = controller.getRule('unsafe-catch')
      expect(rule).not.toHaveProperty('error')
      expect(rule).toHaveProperty('ruleId', 'unsafe-catch')
    })

    it('should return error for unknown rule', () => {
      const result = controller.getRule('non-existent-rule')
      expect(result).toHaveProperty('error')
    })
  })

  describe('GET /ai-reviewer/stats', () => {
    it('should return review stats', () => {
      const stats = controller.getStats()
      expect(stats).toHaveProperty('totalSessions')
      expect(stats).toHaveProperty('findingsBySeverity')
      expect(stats.findingsBySeverity).toHaveProperty('info')
      expect(stats.findingsBySeverity).toHaveProperty('warn')
      expect(stats.findingsBySeverity).toHaveProperty('error')
    })
  })

  describe('POST /ai-reviewer/ci-verify', () => {
    it('should return CI verdict', () => {
      const body: ReviewRequestDto = {
        files: [
          { path: 'test.ts', content: 'try {} catch (e) {}' },
        ],
      }

      const result = controller.ciVerify(body)
      expect(result).toHaveProperty('pass')
      expect(result).toHaveProperty('errorCount')
      expect(result).toHaveProperty('warnCount')
      expect(result).toHaveProperty('findings')
    })

    it('should pass for clean code', () => {
      const body: ReviewRequestDto = {
        files: [
          { path: 'clean.ts', content: 'const x = 1;\nexport { x };' },
        ],
      }

      const result = controller.ciVerify(body)
      expect(result.pass).toBe(true)
      expect(result.errorCount).toBe(0)
    })
  })
})
