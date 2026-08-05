import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2EAutoGenController 单元测试 (node:test)
 *
 * 策略：内联 Controller + Mock Service，覆盖所有路由端点。
 * 正向流程 + 边界条件（空数据集、未知 ID、无效 spec）。
 */

import assert from 'node:assert/strict'
import { E2EAutoGenController } from './e2e-auto-gen.controller'
import type { GenerateRequest, ExecuteRequest } from './e2e-auto-gen.entity'

// ── 辅助工厂 ────────────────────────────────────────────

function makeValidSpec(): string {
  return JSON.stringify({
    title: 'Test API',
    version: '1.0.0',
    routes: [
      {
        path: '/api/users',
        method: 'GET',
        parameters: [
          { name: 'page', in: 'query', type: 'number', required: false },
        ],
        responses: [{ status: 200, description: 'User list' }],
        tags: ['users'],
        requiresAuth: true,
      },
      {
        path: '/api/users/:id',
        method: 'GET',
        parameters: [
          { name: 'id', in: 'path', type: 'string', required: true },
        ],
        responses: [{ status: 200, description: 'User detail' }],
        tags: ['users'],
        requiresAuth: true,
      },
    ],
  })
}

function makeInvalidSpec(): string {
  return 'not-json-at-all'
}

function makeGenerateRequest(overrides: Record<string, unknown> = {}): GenerateRequest {
  return {
    spec: makeValidSpec(),
    testFramework: 'vitest',
    ...overrides,
  } as GenerateRequest
}

function makeExecuteRequest(overrides: Record<string, unknown> = {}): ExecuteRequest {
  return {
    configId: 'cfg-001',
    ...overrides,
  } as ExecuteRequest
}

// ── Mock Service 工厂 ────────────────────────────────────

function createMockService() {
  const configs = new Map<string, Record<string, unknown>>()
  const tasks = new Map<string, Record<string, unknown>>()
  const reports = new Map<string, Record<string, unknown>>()

  return {
    generate: vi.fn((request: GenerateRequest) => {
      const taskId = 'task-' + Date.now()
      const response = {
        taskId,
        status: 'COMPLETED',
        files: [
          './generated-tests/get-api-users.spec.ts',
          './generated-tests/get-api-users-id.spec.ts',
        ],
        stats: { totalFiles: 2, totalTestCases: 4, totalLines: 60 },
        createdAt: new Date().toISOString(),
      }
      tasks.set(taskId, response)
      return response
    }),

    execute: vi.fn(async (request: ExecuteRequest) => {
      if (!configs.has(request.configId) && request.configId === 'unknown-cfg') {
        throw new Error('Config not found')
      }
      const reportId = 'report-' + Date.now()
      const response = {
        reportId,
        totalCases: 10,
        passed: 8,
        failed: 2,
        passRate: 0.8,
        createdAt: new Date().toISOString(),
      }
      reports.set(reportId, response)
      return response
    }),

    getTask: vi.fn((taskId: string) => {
      return tasks.get(taskId) ?? undefined
    }),

    getReport: vi.fn((reportId: string) => {
      return reports.get(reportId) ?? undefined
    }),

    listConfigs: vi.fn(() => {
      return Array.from(configs.values())
    }),

    createConfig: vi.fn((input: Record<string, unknown>) => {
      const id = 'cfg-' + configs.size
      const config = {
        id,
        projectName: input.projectName,
        specSource: input.specSource,
        outputDir: input.outputDir ?? './generated-tests',
        testFramework: input.testFramework ?? 'vitest',
        enableE2E: input.enableE2E ?? false,
        baseUrl: input.baseUrl,
        authToken: input.authToken,
        enabled: true,
        createdAt: new Date().toISOString(),
      }
      configs.set(id, config)
      return config
    }),

    updateConfig: vi.fn((configId: string, input: Record<string, unknown>) => {
      const existing = configs.get(configId)
      if (!existing) throw new Error(`Config ${configId} not found`)
      const updated = { ...existing, ...input, id: existing.id, createdAt: existing.createdAt, updatedAt: new Date().toISOString() }
      configs.set(configId, updated)
      return updated
    }),
  }
}

// ── 测试套件 ──────────────────────────────────────────────

describe('[e2e-auto-gen] Controller: health', () => {
  it('GET /health 返回健康状态', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const result = ctrl.health()
    assert.equal(result.status, 'ok')
    assert.equal(result.module, 'e2e-auto-gen')
    assert.ok(result.timestamp)
  })
})

describe('[e2e-auto-gen] Controller: generate', () => {
  it('POST /generate 正常生成测试用例', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const result = ctrl.generate(makeGenerateRequest())
    assert.ok(result.taskId)
    assert.equal(result.status, 'COMPLETED')
    assert.ok(Array.isArray(result.files))
    assert.ok(result.files.length >= 1)
    assert.equal(svc.generate.mock.calls.length, 1)
  })

  it('POST /generate 包含所有可选字段', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const result = ctrl.generate(
      makeGenerateRequest({
        outputDir: './custom-output',
        testFramework: 'playwright',
        enableE2E: true,
        baseUrl: 'http://localhost:3000',
        authToken: 'test-token',
      })
    )
    assert.ok(result.taskId)
    assert.equal(result.status, 'COMPLETED')
  })
})

describe('[e2e-auto-gen] Controller: execute', () => {
  it('POST /execute 执行已知配置', async () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    // 先创建配置
    svc.createConfig({ projectName: 'Test', specSource: './spec.json' })
    const result = await ctrl.execute(makeExecuteRequest())
    assert.ok(result.reportId)
    assert.equal(typeof result.passRate, 'number')
    assert.equal(result.totalCases, 10)
    assert.equal(result.passed + result.failed, result.totalCases)
    assert.equal(svc.execute.mock.calls.length, 1)
  })

  it('POST /execute 文件过滤', async () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    svc.createConfig({ projectName: 'Test', specSource: './spec.json' })
    const result = await ctrl.execute(
      makeExecuteRequest({ fileFilter: ['users'] })
    )
    assert.ok(result.reportId)
  })
})

describe('[e2e-auto-gen] Controller: getTask', () => {
  it('GET /tasks/:taskId 获取已知任务', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    // 先生成一个任务
    const genResult = ctrl.generate(makeGenerateRequest())
    const task = ctrl.getTask(genResult.taskId)
    assert.ok(task)
    assert.equal(task.status, 'COMPLETED')
    assert.equal((task as any).taskId, genResult.taskId)
    assert.ok(task.stats.totalFiles >= 1)
  })

  it('GET /tasks/:taskId 未知任务返回 undefined', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const task = ctrl.getTask('nonexistent-task-id')
    assert.equal(task, undefined)
  })
})

describe('[e2e-auto-gen] Controller: getReport', () => {
  it('GET /reports/:reportId 获取已知报告', async () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    svc.createConfig({ projectName: 'Test', specSource: './spec.json' })
    const execResult = await ctrl.execute(makeExecuteRequest())
    const report = ctrl.getReport(execResult.reportId)
    assert.ok(report)
    assert.equal((report as any).reportId, execResult.reportId)
  })

  it('GET /reports/:reportId 未知报告返回 undefined', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const report = ctrl.getReport('nonexistent-report-id')
    assert.equal(report, undefined)
  })
})

describe('[e2e-auto-gen] Controller: configs', () => {
  it('GET /configs 初始返回空数组', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const configs = ctrl.listConfigs()
    assert.ok(Array.isArray(configs))
    assert.equal(configs.length, 0)
    assert.equal(svc.listConfigs.mock.calls.length, 1)
  })

  it('POST /configs 创建配置成功', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const config = ctrl.createConfig({
      projectName: 'MyProject',
      specSource: 'https://api.example.com/openapi.json',
      testFramework: 'vitest',
      enableE2E: true,
      baseUrl: 'https://api.example.com',
      authToken: 'sk-xxx',
    })
    assert.ok(config.id)
    assert.equal(config.projectName, 'MyProject')
    assert.equal(config.specSource, 'https://api.example.com/openapi.json')
    assert.equal(config.testFramework, 'vitest')
    assert.equal(config.enableE2E, true)
    assert.equal(config.baseUrl, 'https://api.example.com')
    assert.ok(config.createdAt)
    assert.equal(svc.createConfig.mock.calls.length, 1)
  })

  it('POST /configs 创建配置（最小字段）', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const config = ctrl.createConfig({
      projectName: 'Minimal',
      specSource: './spec.json',
    })
    assert.ok(config.id)
    assert.equal(config.projectName, 'Minimal')
    // 默认值
    assert.equal(config.testFramework, 'vitest')
    assert.equal(config.enableE2E, false)
  })

  it('GET /configs 创建后返回非空列表', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    ctrl.createConfig({ projectName: 'A', specSource: './a.json' })
    ctrl.createConfig({ projectName: 'B', specSource: './b.json' })
    const configs = ctrl.listConfigs()
    assert.equal(configs.length, 2)
  })

  it('POST /configs/:configId 更新配置成功', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const created = ctrl.createConfig({
      projectName: 'Original',
      specSource: './original.json',
    })
    const updated = ctrl.updateConfig(created.id, {
      projectName: 'Updated',
      enabled: false,
    })
    assert.equal(updated!.projectName, 'Updated')
    assert.equal(updated!.enabled, false)
    assert.ok(updated!.updatedAt)
    assert.equal(svc.updateConfig.mock.calls.length, 1)
  })
})

describe('[e2e-auto-gen] Controller: 边界条件', () => {
  it('无效 spec 会抛出异常（由 service 层处理）', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    svc.generate.mockImplementationOnce(() => {
      throw new Error('Invalid spec: JSON parse error')
    })
    assert.throws(
      () => ctrl.generate(makeGenerateRequest({ spec: makeInvalidSpec() })),
      /Invalid spec/
    )
  })

  it('未知 configId 执行会抛出异常', async () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    await assert.rejects(
      () => ctrl.execute(makeExecuteRequest({ configId: 'unknown-cfg' })),
      /Config not found/
    )
  })

  it('更新未知 configId 会抛出异常', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    assert.throws(
      () => ctrl.updateConfig('non-existent', { projectName: 'Nope' }),
      /not found/
    )
  })

  it('健康检查返回时间戳', () => {
    const svc = createMockService()
    const ctrl = new E2EAutoGenController(svc as any)
    const before = new Date(Date.now() - 1000).toISOString()
    const result = ctrl.health()
    const after = new Date(Date.now() + 1000).toISOString()
    assert.ok(result.timestamp >= before || result.timestamp <= after)
    assert.ok(result.timestamp >= before)
  })
})
