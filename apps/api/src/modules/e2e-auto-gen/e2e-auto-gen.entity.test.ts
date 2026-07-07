import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * e2e-auto-gen.entity.test.ts - Entity type tests
 */
import type {
  E2ETestConfig,
  GenTask,
  E2ETestReport,
  GenerateRequest,
  GenerateResponse,
  ExecuteRequest,
  ExecuteResponse,
} from './e2e-auto-gen.entity'

describe('e2e-auto-gen entity types', () => {
  it('should create a valid E2ETestConfig shape', () => {
    const config: E2ETestConfig = {
      id: 'cfg-1',
      projectName: 'Member API',
      specSource: './openapi.json',
      outputDir: './e2e-tests',
      testFramework: 'vitest',
      enableE2E: true,
      baseUrl: 'http://localhost:3000',
      authToken: 'test-token',
      enabled: true,
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(config.id).toBe('cfg-1')
    expect(config.projectName).toBe('Member API')
    expect(config.enabled).toBe(true)
  })

  it('should create a valid GenTask shape', () => {
    const task: GenTask = {
      id: 'task-1',
      configId: 'cfg-1',
      status: 'COMPLETED',
      generatedFiles: ['user.spec.ts', 'order.spec.ts'],
      stats: { totalFiles: 2, totalTestCases: 10, totalLines: 150 },
      createdAt: '2026-01-01T00:00:00Z',
      completedAt: '2026-01-01T00:01:00Z',
    }
    expect(task.status).toBe('COMPLETED')
    expect(task.generatedFiles).toHaveLength(2)
    expect(task.stats.totalTestCases).toBe(10)
  })

  it('should create a valid E2ETestReport shape', () => {
    const report: E2ETestReport = {
      id: 'rpt-1',
      taskId: 'task-1',
      configId: 'cfg-1',
      totalCases: 10,
      passed: 8,
      failed: 2,
      skipped: 0,
      passRate: 0.8,
      durationMs: 500,
      caseResults: [
        { caseId: 'c1', name: 'GET /users', passed: true, durationMs: 50 },
        { caseId: 'c2', name: 'POST /users', passed: false, durationMs: 60, errorMessage: '400 expected' },
      ],
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(report.passRate).toBe(0.8)
    expect(report.caseResults).toHaveLength(2)
    expect(report.caseResults[1].errorMessage).toBe('400 expected')
  })

  it('should handle empty case results in report', () => {
    const report: E2ETestReport = {
      id: 'rpt-empty',
      taskId: 'task-2',
      configId: 'cfg-2',
      totalCases: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      passRate: 0,
      durationMs: 0,
      caseResults: [],
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(report.totalCases).toBe(0)
    expect(report.passRate).toBe(0)
  })
})

describe('e2e-auto-gen request/response shapes', () => {
  it('should shape GenerateRequest', () => {
    const req: GenerateRequest = {
      spec: '{"openapi":"3.0.0"}',
      outputDir: './tests',
      testFramework: 'vitest',
      enableE2E: true,
    }
    expect(req.spec).toContain('openapi')
    expect(req.testFramework).toBe('vitest')
  })

  it('should shape GenerateResponse', () => {
    const resp: GenerateResponse = {
      taskId: 'task-1',
      status: 'COMPLETED',
      files: ['test.spec.ts'],
      stats: { totalFiles: 1, totalTestCases: 5, totalLines: 75 },
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(resp.files).toContain('test.spec.ts')
  })

  it('should shape ExecuteRequest with optional fields', () => {
    const req: ExecuteRequest = {
      configId: 'cfg-1',
      timeoutMs: 30000,
    }
    expect(req.timeoutMs).toBe(30000)

    const reqMinimal: ExecuteRequest = {
      configId: 'cfg-1',
    }
    expect(reqMinimal.fileFilter).toBeUndefined()
  })

  it('should shape ExecuteResponse', () => {
    const resp: ExecuteResponse = {
      reportId: 'rpt-1',
      totalCases: 10,
      passed: 9,
      failed: 1,
      passRate: 0.9,
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(resp.passRate).toBe(0.9)
  })
})
