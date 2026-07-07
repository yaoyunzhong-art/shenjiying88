import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { validate } from 'class-validator'
import {
  ReviewFileDto,
  ReviewRequestDto,
  RegisterRuleDto,
  ReviewConfigDto,
  type ReviewResponse,
} from './ai-reviewer.dto'

describe('ai-reviewer.dto', () => {
  describe('ReviewFileDto', () => {
    it('should validate a correct ReviewFileDto', async () => {
      const dto = new ReviewFileDto()
      dto.path = 'src/test.ts'
      dto.content = 'console.log("hello")'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty path', async () => {
      const dto = new ReviewFileDto()
      dto.path = ''
      dto.content = 'content'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject empty content', async () => {
      const dto = new ReviewFileDto()
      dto.path = 'test.ts'
      dto.content = ''

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('ReviewRequestDto', () => {
    it('should validate with at least one file', async () => {
      const fileDto = new ReviewFileDto()
      fileDto.path = 'test.ts'
      fileDto.content = 'content'

      const dto = new ReviewRequestDto()
      dto.files = [fileDto]

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject empty files array', async () => {
      const dto = new ReviewRequestDto()
      dto.files = []

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('RegisterRuleDto', () => {
    it('should validate a correct RegisterRuleDto', async () => {
      const dto = new RegisterRuleDto()
      dto.ruleId = 'my-custom-rule'
      dto.ruleName = 'My Custom Rule'
      dto.description = 'Check for something'
      dto.severity = 'warn'
      dto.pattern = 'something'
      dto.reference = 'docs/custom.md'

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should reject invalid severity', async () => {
      const dto = new RegisterRuleDto()
      dto.ruleId = 'rule-1'
      dto.ruleName = 'Rule 1'
      dto.description = 'desc'
      dto.severity = 'critical' as any
      dto.pattern = 'pattern'
      dto.reference = 'ref'

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should reject missing required fields', async () => {
      const dto = new RegisterRuleDto()
      // leave all fields empty
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
    })
  })

  describe('ReviewConfigDto', () => {
    it('should validate a correct ReviewConfigDto', async () => {
      const dto = new ReviewConfigDto()
      dto.id = 'cfg-1'
      dto.name = 'Default'
      dto.tenantId = 'tenant-001'
      dto.ciMode = true
      dto.maxFiles = 50
      dto.maxLinesPerFile = 1000

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should accept optional fields as null', async () => {
      const dto = new ReviewConfigDto()
      dto.id = 'cfg-2'
      dto.name = 'Minimal'
      dto.tenantId = 'tenant-002'
      // optional fields left undefined

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('ReviewResponse interface', () => {
    it('should be constructable as a plain object', () => {
      const response: ReviewResponse = {
        sessionId: 'session-001',
        totalFiles: 2,
        totalFindings: 1,
        summary: { info: 0, warn: 1, error: 0 },
        verdict: { pass: true, errorCount: 0, warnCount: 1 },
        findings: [
          {
            file: 'test.ts',
            ruleId: 'console-log-in-service',
            ruleName: '业务代码用 console.log',
            severity: 'info',
            snippet: 'console.log("hi")',
            message: '业务代码应使用 Logger',
          },
        ],
        createdAt: '2026-06-26T02:00:00.000Z',
      }

      expect(response.sessionId).toBe('session-001')
      expect(response.findings).toHaveLength(1)
      expect(response.verdict.pass).toBe(true)
    })
  })
})
