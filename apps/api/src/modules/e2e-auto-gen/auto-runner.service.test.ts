import { describe, it, expect } from 'vitest'
/**
 * auto-runner.service.test.ts - CI集成 + 测试报告自动运行器测试
 */
import { AutoRunnerService } from './auto-runner.service'
import type { GeneratedTestCase } from './test-case-generator.service'

describe('AutoRunnerService', () => {
  let service: AutoRunnerService

  const mockCases: GeneratedTestCase[] = [
    {
      id: 'GET-/api/users-normal',
      route: {
        path: '/api/users',
        method: 'GET',
        parameters: [],
        responses: [{ status: 200, description: 'OK' }],
        tags: ['user'],
        requiresAuth: true,
      },
      scenario: 'NORMAL',
      description: '正常请求 GET /api/users',
      request: { pathParams: {}, queryParams: {}, body: {}, headers: { Authorization: 'Bearer test' } },
      expectedStatus: [200, 201],
      tags: ['normal'],
    },
    {
      id: 'POST-/api/users-type-name',
      route: {
        path: '/api/users',
        method: 'POST',
        parameters: [
          { name: 'name', in: 'body', type: 'string', required: true },
        ],
        responses: [{ status: 201, description: 'Created' }],
        tags: ['user'],
        requiresAuth: true,
      },
      scenario: 'TYPE_ERROR',
      description: 'name 应为 string, 传入 number',
      request: { pathParams: {}, queryParams: {}, body: { name: 12345 }, headers: {} },
      expectedStatus: [400, 422],
      tags: ['type-error'],
    },
    {
      id: 'SECURITY-case-XSS',
      route: {
        path: '/api/users',
        method: 'POST',
        parameters: [],
        responses: [{ status: 201, description: 'Created' }],
        tags: ['security'],
        requiresAuth: true,
      },
      scenario: 'SECURITY',
      description: 'XSS payload',
      request: { pathParams: {}, queryParams: {}, body: { input: '<script>alert(1)</script>' }, headers: {} },
      expectedStatus: [400],
      tags: ['security', 'xss'],
    },
  ]

  beforeEach(() => {
    service = new AutoRunnerService()
  })

  describe('run', () => {
    it('should execute all cases and return results with report', async () => {
      const { results, report } = await service.run(mockCases)

      expect(results).toHaveLength(mockCases.length)
      expect(report.totalCases).toBe(mockCases.length)
      expect(report.passRate).toBeGreaterThanOrEqual(0)
      expect(report.durationMs).toBeGreaterThan(0)
    })

    it('should mark all cases as passed by default', async () => {
      const { results, report } = await service.run(mockCases)

      expect(results.every((r) => r.passed)).toBe(true)
      expect(report.passed).toBe(mockCases.length)
      expect(report.failed).toBe(0)
    })

    it('should handle SECURITY scenario with 4xx expected status', async () => {
      const { results } = await service.run([mockCases[2]]) // SECURITY case

      expect(results[0].passed).toBe(true)
    })

    it('should build byScenario breakdown correctly', async () => {
      const { report } = await service.run(mockCases)

      expect(report.byScenario['NORMAL']).toBeDefined()
      expect(report.byScenario['TYPE_ERROR']).toBeDefined()
      expect(report.byScenario['SECURITY']).toBeDefined()
      expect(report.byScenario['NORMAL'].passed).toBe(1)
    })

    it('should handle empty case array', async () => {
      const { results, report } = await service.run([])

      expect(results).toHaveLength(0)
      expect(report.totalCases).toBe(0)
      expect(report.passRate).toBe(0)
    })
  })

  describe('ciVerdict', () => {
    it('should return pass when passRate >= 0.95', async () => {
      const { report } = await service.run(mockCases)
      expect(service.ciVerdict(report)).toBe('pass')
    })

    it('should return fail when passRate < 0.95', () => {
      const report = {
        totalCases: 100,
        passed: 90,
        failed: 10,
        skipped: 0,
        durationMs: 1000,
        passRate: 0.9,
        byScenario: {},
        failures: [],
      }
      expect(service.ciVerdict(report)).toBe('fail')
    })

    it('should return pass for exactly 0.95', () => {
      const report = {
        totalCases: 100,
        passed: 95,
        failed: 5,
        skipped: 0,
        durationMs: 1000,
        passRate: 0.95,
        byScenario: {},
        failures: [],
      }
      expect(service.ciVerdict(report)).toBe('pass')
    })
  })
})
