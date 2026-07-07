/**
 * security.dto.test.ts · 安全模块 DTO 校验测试
 *
 * 覆盖所有请求/响应 DTO 类的创建和字段赋值
 */

import 'reflect-metadata'
import { describe, it, expect } from 'vitest'
import {
  ScanTargetDto,
  ScanRequestDto,
  BatchScanRequestDto,
  SensitiveDataCheckDto,
  JWTWeakSecretCheckDto,
  IDORCheckDto,
  WAFRuleConditionDto,
  CreateWAFRuleDto,
  UpdateWAFRuleDto,
  EvaluateRequestDto,
} from './security.dto'

describe('security.dto', () => {
  // ── ScanTargetDto ───────────────────────────────────────────
  describe('ScanTargetDto', () => {
    it('should create a valid scan target', () => {
      const dto = new ScanTargetDto()
      dto.endpoint = '/api/users'
      dto.method = 'GET'
      expect(dto.endpoint).toBe('/api/users')
      expect(dto.method).toBe('GET')
    })

    it('should accept POST method', () => {
      const dto = new ScanTargetDto()
      dto.endpoint = '/api/login'
      dto.method = 'POST'
      expect(dto.method).toBe('POST')
    })

    it('should accept optional parameters', () => {
      const dto = new ScanTargetDto()
      dto.endpoint = '/api/search'
      dto.method = 'GET'
      dto.parameters = { q: 'test', page: '1' }
      expect(dto.parameters).toEqual({ q: 'test', page: '1' })
    })
  })

  // ── ScanRequestDto ──────────────────────────────────────────
  describe('ScanRequestDto', () => {
    it('should create a scan request with nested target', () => {
      const target = new ScanTargetDto()
      target.endpoint = '/api/users'
      target.method = 'GET'

      const dto = new ScanRequestDto()
      dto.target = target
      expect(dto.target).toBe(target)
      expect(dto.target.endpoint).toBe('/api/users')
    })
  })

  // ── BatchScanRequestDto ─────────────────────────────────────
  describe('BatchScanRequestDto', () => {
    it('should create a batch scan request with multiple targets', () => {
      const t1 = new ScanTargetDto()
      t1.endpoint = '/api/users'
      t1.method = 'GET'

      const t2 = new ScanTargetDto()
      t2.endpoint = '/api/login'
      t2.method = 'POST'

      const dto = new BatchScanRequestDto()
      dto.targets = [t1, t2]
      expect(dto.targets).toHaveLength(2)
      expect(dto.targets[0].endpoint).toBe('/api/users')
      expect(dto.targets[1].endpoint).toBe('/api/login')
    })
  })

  // ── SensitiveDataCheckDto ───────────────────────────────────
  describe('SensitiveDataCheckDto', () => {
    it('should create a sensitive data check DTO', () => {
      const dto = new SensitiveDataCheckDto()
      dto.endpoint = '/api/profile'
      dto.response = { name: 'John', email: 'john@example.com' }
      expect(dto.endpoint).toBe('/api/profile')
      expect(dto.response.email).toBe('john@example.com')
    })
  })

  // ── JWTWeakSecretCheckDto ──────────────────────────────────
  describe('JWTWeakSecretCheckDto', () => {
    it('should create a JWT check DTO with secrets list', () => {
      const dto = new JWTWeakSecretCheckDto()
      dto.token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ'
      dto.secrets = ['secret', 'password', '123456']
      expect(dto.token).toBe('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ')
      expect(dto.secrets).toHaveLength(3)
      expect(dto.secrets).toContain('secret')
    })
  })

  // ── IDORCheckDto ───────────────────────────────────────────
  describe('IDORCheckDto', () => {
    it('should create an IDOR check DTO', () => {
      const dto = new IDORCheckDto()
      dto.endpoint = '/api/orders/ORDER-001'
      dto.resourceId = 'ORDER-001'
      dto.attackerId = 'user-002'
      expect(dto.endpoint).toBe('/api/orders/ORDER-001')
      expect(dto.resourceId).toBe('ORDER-001')
      expect(dto.attackerId).toBe('user-002')
    })
  })

  // ── WAFRuleConditionDto ─────────────────────────────────────
  describe('WAFRuleConditionDto', () => {
    it('should create a WAF rule condition', () => {
      const dto = new WAFRuleConditionDto()
      dto.type = 'ip'
      dto.operator = 'equals'
      dto.value = '192.168.1.1'
      expect(dto.type).toBe('ip')
      expect(dto.operator).toBe('equals')
      expect(dto.value).toBe('192.168.1.1')
    })

    it('should accept regex operator', () => {
      const dto = new WAFRuleConditionDto()
      dto.type = 'path'
      dto.operator = 'regex'
      dto.value = '^/api/.*'
      expect(dto.operator).toBe('regex')
    })
  })

  // ── CreateWAFRuleDto ────────────────────────────────────────
  describe('CreateWAFRuleDto', () => {
    it('should create a WAF rule with all required fields', () => {
      const condition = new WAFRuleConditionDto()
      condition.type = 'ip'
      condition.operator = 'equals'
      condition.value = '10.0.0.1'

      const dto = new CreateWAFRuleDto()
      dto.name = 'Block Internal IP'
      dto.condition = condition
      dto.action = 'block'
      dto.priority = 100
      dto.enabled = true
      expect(dto.name).toBe('Block Internal IP')
      expect(dto.action).toBe('block')
      expect(dto.priority).toBe(100)
      expect(dto.enabled).toBe(true)
    })

    it('should accept allow action with low priority', () => {
      const condition = new WAFRuleConditionDto()
      condition.type = 'path'
      condition.operator = 'contains'
      condition.value = '/health'

      const dto = new CreateWAFRuleDto()
      dto.name = 'Allow Health Check'
      dto.condition = condition
      dto.action = 'allow'
      dto.priority = 9999
      dto.enabled = true
      expect(dto.action).toBe('allow')
      expect(dto.priority).toBe(9999)
    })
  })

  // ── UpdateWAFRuleDto ────────────────────────────────────────
  describe('UpdateWAFRuleDto', () => {
    it('should allow partial updates', () => {
      const dto = new UpdateWAFRuleDto()
      dto.enabled = false
      expect(dto.enabled).toBe(false)
      expect(dto.name).toBeUndefined()
      expect(dto.action).toBeUndefined()
    })

    it('should update condition fields', () => {
      const condition = new WAFRuleConditionDto()
      condition.type = 'rate'
      condition.operator = 'gt'
      condition.value = '100'

      const dto = new UpdateWAFRuleDto()
      dto.name = 'Rate Limit Updated'
      dto.condition = condition
      dto.action = 'challenge'
      expect(dto.name).toBe('Rate Limit Updated')
      expect(dto.condition?.operator).toBe('gt')
      expect(dto.action).toBe('challenge')
    })
  })

  // ── EvaluateRequestDto ──────────────────────────────────────
  describe('EvaluateRequestDto', () => {
    it('should create an evaluate request with basic fields', () => {
      const dto = new EvaluateRequestDto()
      dto.ip = '203.0.113.1'
      dto.path = '/api/admin'
      dto.method = 'POST'
      dto.body = '{"action":"delete"}'
      expect(dto.ip).toBe('203.0.113.1')
      expect(dto.path).toBe('/api/admin')
      expect(dto.method).toBe('POST')
      expect(dto.body).toBe('{"action":"delete"}')
    })

    it('should accept optional headers', () => {
      const dto = new EvaluateRequestDto()
      dto.headers = { 'User-Agent': 'curl/8.0', Authorization: 'Bearer token123' }
      expect(dto.headers).toBeDefined()
      expect(dto.headers!['User-Agent']).toBe('curl/8.0')
    })

    it('should work with minimal fields (all optional)', () => {
      const dto = new EvaluateRequestDto()
      dto.ip = '10.0.0.1'
      expect(dto.path).toBeUndefined()
      expect(dto.method).toBeUndefined()
      expect(dto.headers).toBeUndefined()
    })
  })
})
