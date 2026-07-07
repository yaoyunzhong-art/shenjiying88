// gateway.dto.test.ts — Gateway DTO 校验测试
import { describe, it, expect } from 'vitest'
import { validate } from 'class-validator'
import {
  AuthCheckDto,
  RouteLookupDto,
  QuotaSetDto,
  QuotaQueryDto,
  CreateApiKeyDto,
  RevokeApiKeyDto,
} from './gateway.dto'

describe('Gateway DTO 校验', () => {
  // ── AuthCheckDto ──
  describe('AuthCheckDto', () => {
    it('应通过有效数据校验', async () => {
      const dto = new AuthCheckDto()
      dto.apiKey = 'sk-test-key'
      dto.path = '/api/users'
      dto.method = 'POST'
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少 apiKey 不应通过', async () => {
      const dto = new AuthCheckDto()
      dto.path = '/api/users'
      dto.method = 'POST'
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
      expect(errors.some((e) => e.property === 'apiKey')).toBe(true)
    })

    it('空字符串字段不应通过', async () => {
      const dto = new AuthCheckDto()
      dto.apiKey = ''
      dto.path = ''
      dto.method = ''
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(3)
    })
  })

  // ── RouteLookupDto ──
  describe('RouteLookupDto', () => {
    it('应通过有效数据校验', async () => {
      const dto = new RouteLookupDto()
      dto.path = '/api/users'
      dto.method = 'GET'
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少 path 不应通过', async () => {
      const dto = new RouteLookupDto()
      dto.method = 'GET'
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
      expect(errors[0].property).toBe('path')
    })
  })

  // ── QuotaSetDto ──
  describe('QuotaSetDto', () => {
    it('应通过最小必填字段校验', async () => {
      const dto = new QuotaSetDto()
      dto.clientId = 'client-1'
      dto.endpoint = '/api/users:GET'
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('应通过含可选字段校验', async () => {
      const dto = new QuotaSetDto()
      dto.clientId = 'client-1'
      dto.endpoint = '/api/users:GET'
      dto.maxTokens = 100
      dto.refillRate = 10
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('maxTokens 为 0 不应通过', async () => {
      const dto = new QuotaSetDto()
      dto.clientId = 'client-1'
      dto.endpoint = '/api/users:GET'
      dto.maxTokens = 0
      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })

    it('缺少 clientId 不应通过', async () => {
      const dto = new QuotaSetDto()
      dto.endpoint = '/api/users:GET'
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'clientId')).toBe(true)
    })
  })

  // ── QuotaQueryDto ──
  describe('QuotaQueryDto', () => {
    it('应通过必填字段校验', async () => {
      const dto = new QuotaQueryDto()
      dto.clientId = 'client-1'
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('应通过含可选 endpoint 字段校验', async () => {
      const dto = new QuotaQueryDto()
      dto.clientId = 'client-1'
      dto.endpoint = '/api/users:GET'
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少 clientId 不应通过', async () => {
      const dto = new QuotaQueryDto()
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'clientId')).toBe(true)
    })
  })

  // ── CreateApiKeyDto ──
  describe('CreateApiKeyDto', () => {
    it('应通过有效数据校验', async () => {
      const dto = new CreateApiKeyDto()
      dto.name = '测试密钥'
      dto.ownerId = 'user-1'
      dto.scopes = ['read:users', 'write:orders']
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('scopes 为空数组应通过', async () => {
      const dto = new CreateApiKeyDto()
      dto.name = '限读密钥'
      dto.ownerId = 'user-2'
      dto.scopes = []
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少 ownerId 不应通过', async () => {
      const dto = new CreateApiKeyDto()
      dto.name = '测试'
      dto.scopes = ['read']
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'ownerId')).toBe(true)
    })
  })

  // ── RevokeApiKeyDto ──
  describe('RevokeApiKeyDto', () => {
    it('应通过有效数据校验', async () => {
      const dto = new RevokeApiKeyDto()
      dto.keyId = 'key-12345'
      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('缺少 keyId 不应通过', async () => {
      const dto = new RevokeApiKeyDto()
      const errors = await validate(dto)
      expect(errors.some((e) => e.property === 'keyId')).toBe(true)
    })
  })
})
