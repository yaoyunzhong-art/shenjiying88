import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * e2e-auto-gen.controller.test.ts - Controller tests
 */
import { E2EAutoGenController } from './e2e-auto-gen.controller'
import { E2EAutoGenService } from './e2e-auto-gen.service'
import { OpenAPIParserService } from './openapi-parser.service'
import { TestCaseGeneratorService } from './test-case-generator.service'
import { AutoRunnerService } from './auto-runner.service'

describe('E2EAutoGenController', () => {
  let controller: E2EAutoGenController
  let service: E2EAutoGenService
  let parser: OpenAPIParserService
  let generator: TestCaseGeneratorService
  let runner: AutoRunnerService

  beforeEach(() => {
    parser = new OpenAPIParserService()
    generator = new TestCaseGeneratorService()
    runner = new AutoRunnerService()
    service = new E2EAutoGenService(parser, generator, runner)
    controller = new E2EAutoGenController(service)
  })

  describe('health', () => {
    it('should return health status', () => {
      const result = controller.health()
      expect(result.status).toBe('ok')
      expect(result.module).toBe('e2e-auto-gen')
      expect(result.timestamp).toBeDefined()
    })
  })

  describe('generate', () => {
    it('should return generate response', () => {
      const result = controller.generate({
        spec: JSON.stringify({
          title: 'Test',
          version: '1.0.0',
          routes: [
            {
              path: '/api/test',
              method: 'GET',
              parameters: [],
              responses: [{ status: 200, description: 'OK' }],
              tags: ['test'],
              requiresAuth: true,
            },
          ],
        }),
        testFramework: 'vitest',
      })
      expect(result.taskId).toBeDefined()
      expect(result.status).toBe('COMPLETED')
    })
  })

  describe('configs', () => {
    it('should list configs (empty initially)', () => {
      const configs = controller.listConfigs()
      expect(configs).toEqual([])
    })

    it('should create a config', () => {
      const config = controller.createConfig({
        projectName: 'Test',
        specSource: './spec.json',
        testFramework: 'vitest',
      })
      expect(config.id).toBeDefined()
      expect(config.projectName).toBe('Test')
    })

    it('should update a config', () => {
      const created = controller.createConfig({
        projectName: 'Original',
        specSource: './spec.json',
      })
      const updated = controller.updateConfig(created.id, {
        projectName: 'Updated',
      })
      expect(updated!.projectName).toBe('Updated')
    })

    it('should list configs after creation', () => {
      controller.createConfig({ projectName: 'A', specSource: './a.json' })
      controller.createConfig({ projectName: 'B', specSource: './b.json' })
      const configs = controller.listConfigs()
      expect(configs).toHaveLength(2)
    })
  })

  describe('tasks and reports', () => {
    it('should return undefined for unknown task', () => {
      const task = controller.getTask('unknown')
      expect(task).toBeUndefined()
    })

    it('should return undefined for unknown report', () => {
      const report = controller.getReport('unknown')
      expect(report).toBeUndefined()
    })
  })
})
