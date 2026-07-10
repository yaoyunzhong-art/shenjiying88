import { describe, it, expect } from 'vitest'
/**
 * openapi-parser.service.test.ts - OpenAPI 路由表解析器测试
 */
import { OpenAPIParserService } from './openapi-parser.service'
import type { OpenAPIRoute, ParsedRouteTable } from './openapi-parser.service'

describe('OpenAPIParserService', () => {
  let service: OpenAPIParserService

  const sampleInput = {
    title: 'User API',
    version: '2.0.0',
    routes: [
      {
        path: '/api/users',
        method: 'GET' as const,
        parameters: [
          { name: 'page', in: 'query' as const, type: 'number' as const, required: false },
          { name: 'limit', in: 'query' as const, type: 'number' as const, required: false },
        ],
        responses: [{ status: 200, description: 'User list' }],
        tags: ['user'],
        requiresAuth: true,
      },
      {
        path: '/api/users/{id}',
        method: 'GET' as const,
        parameters: [
          { name: 'id', in: 'path' as const, type: 'string' as const, required: true },
        ],
        responses: [{ status: 200, description: 'User detail' }],
        tags: ['user'],
        requiresAuth: true,
      },
      {
        path: '/api/auth/login',
        method: 'POST' as const,
        parameters: [
          { name: 'username', in: 'body' as const, type: 'string' as const, required: true },
          { name: 'password', in: 'body' as const, type: 'string' as const, required: true },
        ],
        responses: [{ status: 200, description: 'Login success' }],
        tags: ['auth'],
        requiresAuth: false,
      },
    ],
  }

  beforeEach(() => {
    service = new OpenAPIParserService()
  })

  describe('parseFromRoutes', () => {
    it('should parse routes with full metadata', () => {
      const table = service.parseFromRoutes(sampleInput)

      expect(table.title).toBe('User API')
      expect(table.version).toBe('2.0.0')
      expect(table.routes).toHaveLength(3)
    })

    it('should fill default values for missing fields', () => {
      const table = service.parseFromRoutes({
        title: 'Minimal',
        version: '1.0.0',
        routes: [
          {
            path: '/api/health',
            method: 'GET',
          },
        ],
      })

      expect(table.routes[0].parameters).toEqual([])
      expect(table.routes[0].responses).toEqual([{ status: 200, description: 'OK' }])
      expect(table.routes[0].tags).toEqual([])
      expect(table.routes[0].requiresAuth).toBe(true)
    })

    it('should handle empty routes array', () => {
      const table = service.parseFromRoutes({
        title: 'Empty',
        version: '0.0.1',
        routes: [],
      })

      expect(table.routes).toHaveLength(0)
    })
  })

  describe('filterByTag', () => {
    it('should filter routes matching the given tag', () => {
      const table = service.parseFromRoutes(sampleInput)
      const userRoutes = service.filterByTag(table, 'user')

      expect(userRoutes).toHaveLength(2)
      expect(userRoutes.every((r) => r.tags.includes('user'))).toBe(true)
    })

    it('should return empty array for non-existent tag', () => {
      const table = service.parseFromRoutes(sampleInput)
      const result = service.filterByTag(table, 'nonexistent')

      expect(result).toHaveLength(0)
    })
  })

  describe('filterByMethod', () => {
    it('should filter routes matching the given method', () => {
      const table = service.parseFromRoutes(sampleInput)
      const getRoutes = service.filterByMethod(table, 'GET')

      expect(getRoutes).toHaveLength(2)
      expect(getRoutes.every((r) => r.method === 'GET')).toBe(true)
    })

    it('should return empty array for unused method', () => {
      const table = service.parseFromRoutes(sampleInput)
      const deleteRoutes = service.filterByMethod(table, 'DELETE')

      expect(deleteRoutes).toHaveLength(0)
    })
  })

  describe('summarize', () => {
    it('should return correct stats', () => {
      const table = service.parseFromRoutes(sampleInput)
      const stats = service.summarize(table)

      expect(stats.totalRoutes).toBe(3)
      expect(stats.byMethod['GET']).toBe(2)
      expect(stats.byMethod['POST']).toBe(1)
      expect(stats.byTag['user']).toBe(2)
      expect(stats.byTag['auth']).toBe(1)
      expect(stats.authRequiredCount).toBe(2)
    })
  })
})
