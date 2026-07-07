import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * e2e-auto-gen.service.test.ts - Service tests
 */
import { NotFoundException } from '@nestjs/common'
import { E2EAutoGenService } from './e2e-auto-gen.service'
import { OpenAPIParserService } from './openapi-parser.service'
import { TestCaseGeneratorService } from './test-case-generator.service'
import { AutoRunnerService } from './auto-runner.service'

describe('E2EAutoGenService', () => {
  let service: E2EAutoGenService
  let parser: OpenAPIParserService
  let generator: TestCaseGeneratorService
  let runner: AutoRunnerService

  const validSpec = JSON.stringify({
    title: 'Test API',
    version: '1.0.0',
    routes: [
      {
        path: '/api/users',
        method: 'GET',
        parameters: [],
        responses: [{ status: 200, description: 'OK' }],
        tags: ['user'],
        requiresAuth: true,
      },
      {
        path: '/api/users',
        method: 'POST',
        parameters: [
          { name: 'name', in: 'body', type: 'string', required: true },
          { name: 'age', in: 'body', type: 'number', required: false },
        ],
        responses: [{ status: 201, description: 'Created' }],
        tags: ['user'],
        requiresAuth: true,
      },
    ],
  })

  beforeEach(() => {
    parser = new OpenAPIParserService()
    generator = new TestCaseGeneratorService()
    runner = new AutoRunnerService()
    service = new E2EAutoGenService(parser, generator, runner)
  })

  describe('generate', () => {
    it('should generate test cases from valid spec', () => {
      const result = service.generate({
        spec: validSpec,
        testFramework: 'vitest',
      })

      expect(result.taskId).toBeDefined()
      expect(result.status).toBe('COMPLETED')
      expect(result.files.length).toBeGreaterThan(0)
      expect(result.stats.totalTestCases).toBeGreaterThan(0)
    })

    it('should handle spec without routes', () => {
      const result = service.generate({
        spec: JSON.stringify({ title: 'Empty', version: '1.0.0' }),
      })

      expect(result.status).toBe('COMPLETED')
      expect(result.files).toHaveLength(0)
      expect(result.stats.totalTestCases).toBe(0)
    })

    it('should throw on invalid JSON spec', () => {
      expect(() => {
        service.generate({
          spec: 'not-json',
        })
      }).toThrow()
    })
  })

  describe('config operations', () => {
    it('should create a config', () => {
      const config = service.createConfig({
        projectName: 'Test Project',
        specSource: './spec.json',
        testFramework: 'vitest',
        outputDir: './tests',
        enableE2E: true,
      })

      expect(config.id).toBeDefined()
      expect(config.projectName).toBe('Test Project')
      expect(config.enabled).toBe(true)
    })

    it('should list configs', () => {
      (service as any).createConfig({ projectName: 'A', specSource: './a.json' })
      (service as any).createConfig({ projectName: 'B', specSource: './b.json' })

      const configs = service.listConfigs()
      expect(configs.length).toBe(2)
    })

    it('should update a config', () => {
      const created = (service as any).createConfig({
        projectName: 'Original',
        specSource: './spec.json',
      })
      const updated = service.updateConfig(created.id, {
        projectName: 'Updated',
        enabled: false,
      })

      expect(updated!.projectName).toBe('Updated')
      expect(updated!.enabled).toBe(false)
    })

    it('should throw on update non-existent config', () => {
      expect(() => service.updateConfig('non-existent', {})).toThrow(NotFoundException)
    })
  })

  describe('task and report', () => {
    it('should return undefined for non-existent task', () => {
      const task = service.getTask('non-existent')
      expect(task).toBeUndefined()
    })

    it('should return undefined for non-existent report', () => {
      const report = service.getReport('non-existent')
      expect(report).toBeUndefined()
    })
  })
})
