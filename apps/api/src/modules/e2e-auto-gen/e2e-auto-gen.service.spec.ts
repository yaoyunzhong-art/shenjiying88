/**
 * e2e-auto-gen.service.spec.ts — E2EAutoGenService 纯函数式单元测试
 *
 * 覆盖：
 *   generate         — 正例（有效spec/空routes/大routes）
 *                     反例（无效JSON/空字符串）
 *                     边界（单route/无参数route）
 *   createConfig     — 正例（全量/默认值）
 *                     反例（最小输入）
 *   updateConfig     — 正例（更新字段/启用开关）
 *                     反例（不存在config抛NotFoundException）
 *   listConfigs      — 正例（空列表/多个配置）
 *   execute          — 正例（执行返回报告）
 *                     反例（不存在配置抛NotFoundException）
 *   task/report查询  — 正例（正确返回）
 *                     反例（不存在返回undefined）
 *
 * ≥ 18 项测试，纯内联 DI 注入 mock services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { E2EAutoGenService } from './e2e-auto-gen.service'
import { OpenAPIParserService } from './openapi-parser.service'
import { TestCaseGeneratorService } from './test-case-generator.service'
import { AutoRunnerService } from './auto-runner.service'

// ═══════════════════════════════════════════════════════════════
// mock 工厂
// ═══════════════════════════════════════════════════════════════

function createService(): E2EAutoGenService {
  const parser = new OpenAPIParserService()
  const generator = new TestCaseGeneratorService()
  const runner = new AutoRunnerService()
  return new E2EAutoGenService(parser, generator, runner)
}

const singleRouteSpec = JSON.stringify({
  title: 'Minimal API',
  version: '1.0.0',
  routes: [
    {
      path: '/api/health',
      method: 'GET',
      parameters: [],
      responses: [{ status: 200, description: 'OK' }],
      tags: ['health'],
    },
  ],
})

const multiRouteSpec = JSON.stringify({
  title: 'Shop API',
  version: '2.0.0',
  routes: [
    { path: '/api/products', method: 'GET', parameters: [{ name: 'page', in: 'query', type: 'number', required: false }], responses: [{ status: 200, description: 'List' }], tags: ['product'] },
    { path: '/api/products', method: 'POST', parameters: [{ name: 'name', in: 'body', type: 'string', required: true }], responses: [{ status: 201, description: 'Created' }], tags: ['product'], requiresAuth: true },
    { path: '/api/orders', method: 'GET', parameters: [], responses: [{ status: 200, description: 'List' }], tags: ['order'] },
    { path: '/api/orders', method: 'POST', parameters: [{ name: 'items', in: 'body', type: 'array', required: true }], responses: [{ status: 201, description: 'Created' }], tags: ['order'], requiresAuth: true },
    { path: '/api/users/{id}', method: 'GET', parameters: [{ name: 'id', in: 'path', type: 'string', required: true }], responses: [{ status: 200, description: 'User' }], tags: ['user'] },
  ],
})

// ═══════════════════════════════════════════════════════════════
// E2EAutoGenService
// ═══════════════════════════════════════════════════════════════

describe('E2EAutoGenService', () => {
  let svc: E2EAutoGenService

  beforeEach(() => {
    svc = createService()
  })

  // ── generate ────────────────────────────────────────────────

  describe('generate', () => {
    it('正例: 单 route 生成完成', () => {
      const result = svc.generate({ spec: singleRouteSpec })
      expect(result.taskId).toBeDefined()
      expect(result.status).toBe('COMPLETED')
      expect(result.files.length).toBeGreaterThan(0)
      expect(result.stats.totalTestCases).toBeGreaterThan(0)
    })

    it('正例: 5 个 route 生成更多测试用例', () => {
      const result = svc.generate({ spec: multiRouteSpec })
      expect(result.status).toBe('COMPLETED')
      // 每个 route 至少 4 个用例 (normal + boundaries + type errors + security)
      expect(result.stats.totalTestCases).toBeGreaterThanOrEqual(5)
    })

    it('正例: 无 routes 返回空文件列表', () => {
      const result = svc.generate({
        spec: JSON.stringify({ title: 'Empty API', version: '1.0.0' }),
      })
      expect(result.status).toBe('COMPLETED')
      expect(result.files).toHaveLength(0)
      expect(result.stats.totalTestCases).toBe(0)
    })

    it('反例: 无效 JSON 抛出异常', () => {
      expect(() => svc.generate({ spec: 'not-json' })).toThrow()
    })

    it('反例: 空字符串抛出异常', () => {
      expect(() => svc.generate({ spec: '' })).toThrow()
    })

    it('边界: route 无 parameters 也能生成', () => {
      const result = svc.generate({ spec: singleRouteSpec })
      expect(result.status).toBe('COMPLETED')
      expect(result.stats.totalFiles).toBe(1)
    })

    it('输出目录可定制', () => {
      const result = svc.generate({ spec: singleRouteSpec, outputDir: './custom-dir' })
      expect(result.files[0]).toContain('custom-dir')
    })
  })

  // ── createConfig ─────────────────────────────────────────────

  describe('createConfig', () => {
    it('正例: 创建全量配置', () => {
      const config = svc.createConfig({
        projectName: 'My API',
        specSource: './openapi.json',
        testFramework: 'vitest',
        outputDir: './tests',
        enableE2E: true,
        baseUrl: 'http://localhost:3000',
        authToken: 'token-123',
      })
      expect(config.id).toBeDefined()
      expect(config.projectName).toBe('My API')
      expect(config.enabled).toBe(true)
      expect(config.baseUrl).toBe('http://localhost:3000')
      expect(config.createdAt).toBeDefined()
    })

    it('正例: 最小输入使用默认值', () => {
      const config = svc.createConfig({
        projectName: 'Minimal',
        specSource: './spec.json',
      })
      expect(config.testFramework).toBe('vitest')
      expect(config.outputDir).toBe('./generated-tests')
      expect(config.enableE2E).toBe(false)
      expect(config.enabled).toBe(true)
    })

    it('每次创建生成唯一 ID', () => {
      const c1 = svc.createConfig({ projectName: 'A', specSource: './a.json' })
      const c2 = svc.createConfig({ projectName: 'B', specSource: './b.json' })
      expect(c1.id).not.toBe(c2.id)
    })
  })

  // ── updateConfig ─────────────────────────────────────────────

  describe('updateConfig', () => {
    it('正例: 更新 projectName', () => {
      const created = svc.createConfig({ projectName: 'Original', specSource: './s.json' })
      const updated = svc.updateConfig(created.id, { projectName: 'Updated' })
      expect(updated).toBeDefined()
      expect(updated!.projectName).toBe('Updated')
    })

    it('正例: 更新 enabled 状态', () => {
      const created = svc.createConfig({ projectName: 'T', specSource: './s.json' })
      const updated = svc.updateConfig(created.id, { enabled: false })
      expect(updated!.enabled).toBe(false)
    })

    it('正例: 更新后 updatedAt 非空', () => {
      const created = svc.createConfig({ projectName: 'T', specSource: './s.json' })
      const updated = svc.updateConfig(created.id, {})
      expect(updated!.updatedAt).toBeDefined()
    })

    it('反例: 不存在的 ID 抛出 NotFoundException', () => {
      expect(() => svc.updateConfig('non-existent', { projectName: 'X' })).toThrow(NotFoundException)
    })
  })

  // ── listConfigs ──────────────────────────────────────────────

  describe('listConfigs', () => {
    it('正例: 空列表', () => {
      expect(svc.listConfigs()).toHaveLength(0)
    })

    it('正例: 返回所有创建的配置', () => {
      svc.createConfig({ projectName: 'A', specSource: './a.json' })
      svc.createConfig({ projectName: 'B', specSource: './b.json' })
      expect(svc.listConfigs()).toHaveLength(2)
    })
  })

  // ── execute ──────────────────────────────────────────────────

  describe('execute', () => {
    it('反例: 不存在的 configId 抛出 NotFoundException', async () => {
      await expect(svc.execute({ configId: 'non-existent' })).rejects.toThrow(NotFoundException)
    })

    it('正例: 执行返回完整报告', async () => {
      const config = svc.createConfig({ projectName: 'T', specSource: './s.json', testFramework: 'vitest' })
      // 先生成一些用例
      svc.generate({ spec: multiRouteSpec })
      const response = await svc.execute({ configId: config.id })
      expect(response.reportId).toBeDefined()
      expect(response.totalCases).toBeGreaterThanOrEqual(0)
      expect(response.passRate).toBeGreaterThanOrEqual(0)
    })
  })

  // ── getTask / getReport ──────────────────────────────────────

  describe('getTask / getReport', () => {
    it('正例: getTask 未找到返回 undefined', () => {
      expect(svc.getTask('non-existent')).toBeUndefined()
    })

    it('正例: getReport 未找到返回 undefined', () => {
      expect(svc.getReport('non-existent')).toBeUndefined()
    })

    it('生成后 getTask 返回正确状态', () => {
      const result = svc.generate({ spec: singleRouteSpec })
      const task = svc.getTask(result.taskId)
      expect(task).toBeDefined()
      expect(task!.status).toBe('COMPLETED')
      expect(task!.stats.totalTestCases).toBeGreaterThan(0)
    })
  })
})
