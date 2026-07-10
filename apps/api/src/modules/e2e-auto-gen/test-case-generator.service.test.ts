import { describe, it, expect } from 'vitest'
/**
 * test-case-generator.service.test.ts - 测试用例生成器测试
 */
import { TestCaseGeneratorService } from './test-case-generator.service'
import type { OpenAPIRoute } from './openapi-parser.service'

describe('TestCaseGeneratorService', () => {
  let service: TestCaseGeneratorService

  const getRoute: OpenAPIRoute = {
    path: '/api/users',
    method: 'GET',
    parameters: [
      { name: 'page', in: 'query', type: 'number', required: false },
      { name: 'limit', in: 'query', type: 'number', required: false },
    ],
    responses: [{ status: 200, description: 'User list' }],
    tags: ['user'],
    requiresAuth: true,
  }

  const postRoute: OpenAPIRoute = {
    path: '/api/users',
    method: 'POST',
    parameters: [
      { name: 'name', in: 'body', type: 'string', required: true },
      { name: 'age', in: 'body', type: 'number', required: false },
    ],
    responses: [{ status: 201, description: 'Created' }],
    tags: ['user'],
    requiresAuth: true,
  }

  const putRoute: OpenAPIRoute = {
    path: '/api/users/{id}',
    method: 'PUT',
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true },
      { name: 'email', in: 'body', type: 'string', required: false },
    ],
    responses: [{ status: 200, description: 'Updated' }],
    tags: ['user'],
    requiresAuth: true,
  }

  beforeEach(() => {
    service = new TestCaseGeneratorService()
  })

  describe('generate (single route)', () => {
    it('should generate NORMAL case for any route', () => {
      const cases = service.generate(getRoute)
      const normal = cases.find((c) => c.scenario === 'NORMAL')

      expect(normal).toBeDefined()
      expect(normal!.scenario).toBe('NORMAL')
      expect(normal!.request.headers['Authorization']).toBeDefined()
    })

    it('should generate BOUNDARY cases for routes with type parameters', () => {
      const cases = service.generate(postRoute)
      const boundaries = cases.filter((c) => c.scenario === 'BOUNDARY')

      expect(boundaries.length).toBeGreaterThanOrEqual(1)
      // number 'age' triggers negative value boundary
      expect(boundaries.some((b) => b.tags.includes('boundary'))).toBe(true)
    })

    it('should generate TYPE_ERROR cases for number parameters', () => {
      const cases = service.generate(getRoute)
      const typeErrors = cases.filter((c) => c.scenario === 'TYPE_ERROR')

      expect(typeErrors.length).toBeGreaterThan(0)
      expect(typeErrors[0].expectedStatus).toEqual([400, 422])
    })

    it('should generate SECURITY case for POST routes', () => {
      const cases = service.generate(postRoute)
      const security = cases.find((c) => c.scenario === 'SECURITY')

      expect(security).toBeDefined()
      expect(security!.tags).toContain('security')
      expect(security!.expectedStatus).toEqual([400, 422])
    })

    it('should NOT generate SECURITY case for GET routes', () => {
      const cases = service.generate(getRoute)
      const security = cases.find((c) => c.scenario === 'SECURITY')

      expect(security).toBeUndefined()
    })

    it('should generate SECURITY case for PUT routes', () => {
      const cases = service.generate(putRoute)
      const security = cases.find((c) => c.scenario === 'SECURITY')

      expect(security).toBeDefined()
    })

    it('should assign unique IDs to each test case', () => {
      const cases = service.generate(postRoute)
      const ids = cases.map((c) => c.id)

      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe('generateBatch', () => {
    it('should generate cases for multiple routes', () => {
      const allCases = service.generateBatch([getRoute, postRoute, putRoute])

      expect(allCases.length).toBeGreaterThan(0)
      // Should have at least 1 NORMAL per route + extra cases
      const normalCount = allCases.filter((c) => c.scenario === 'NORMAL').length
      expect(normalCount).toBe(3)
    })

    it('should handle empty route array', () => {
      const allCases = service.generateBatch([])
      expect(allCases).toHaveLength(0)
    })
  })
})
