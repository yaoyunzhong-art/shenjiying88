import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { SwaggerGenService, EndpointInfo } from './swagger-gen.service'

describe('SwaggerGenService', () => {
  let service: SwaggerGenService

  beforeEach(() => {
    service = new SwaggerGenService()
  })

  describe('registerEndpoint', () => {
    it('should register an endpoint', () => {
      const endpoint: EndpointInfo = {
        method: 'GET',
        path: '/api/users',
        summary: 'Get users',
        responses: [{ statusCode: 200, description: 'Success' }],
      }
      service.registerEndpoint('UserController', endpoint)
      const spec = service.generateSpec({ title: 'Test API', version: '1.0.0' })
      expect(spec.paths['/api/users']).toBeDefined()
    })
  })

  describe('registerSchema', () => {
    it('should register a schema', () => {
      service.registerSchema('User', { type: 'object', properties: { id: { type: 'string' } } })
      const spec = service.generateSpec({ title: 'Test API', version: '1.0.0' })
      expect(spec.components?.schemas?.['User']).toBeDefined()
    })
  })

  describe('generateSpec', () => {
    it('should generate OpenAPI spec with correct version', () => {
      const spec = service.generateSpec({ title: 'Test API', version: '1.0.0' })
      expect(spec.openapi).toBe('3.0.3')
      expect(spec.info.title).toBe('Test API')
    })
  })

  describe('exportJSON', () => {
    it('should export spec as JSON string', () => {
      const spec = service.generateSpec({ title: 'Test API', version: '1.0.0' })
      const json = service.exportJSON(spec)
      expect(typeof json).toBe('string')
      expect(() => JSON.parse(json)).not.toThrow()
    })
  })

  describe('exportYAML', () => {
    it('should export spec as YAML string', () => {
      const spec = service.generateSpec({ title: 'Test API', version: '1.0.0' })
      const yaml = service.exportYAML(spec)
      expect(typeof yaml).toBe('string')
      expect(yaml).toContain('openapi:')
    })
  })

  describe('exportRedocHTML', () => {
    it('should export Redoc HTML with spec embedded', () => {
      const spec = service.generateSpec({ title: 'Test API', version: '1.0.0' })
      const html = service.exportRedocHTML(spec)
      expect(html).toContain('<redoc spec-url')
      expect(html).toContain('redoc.standalone.js')
    })
  })

  describe('addTag', () => {
    it('should add a tag to the spec', () => {
      service.addTag('users', 'User management endpoints')
      const spec = service.generateSpec({ title: 'Test API', version: '1.0.0' })
      expect(spec.tags?.some(t => t.name === 'users')).toBe(true)
    })
  })

  describe('parseJSDocAnnotations', () => {
    it('should return empty annotations by default', () => {
      const annotations = service.parseJSDocAnnotations('UserController', 'getUsers')
      expect(annotations.summary).toBe('')
    })

    it('should return set annotations', () => {
      service.setJSDocAnnotation('UserController', 'getUsers', {
        summary: 'Get all users',
        description: 'Retrieves a list of users',
        params: { limit: 'Maximum number of results' },
        returns: 'Array of User objects',
      })
      const annotations = service.parseJSDocAnnotations('UserController', 'getUsers')
      expect(annotations.summary).toBe('Get all users')
    })
  })
})
