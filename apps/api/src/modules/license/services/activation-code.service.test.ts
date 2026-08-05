import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 付费授权 - 激活码服务测试 (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * TC21-TC25: 激活码服务测试套件
 * - TC21: 激活码生成
 * - TC22: 激活码验证与核销
 * - TC23: 防暴力破解
 * - TC24: 激活码格式验证
 * - TC25: Redis不可用降级
 */

import { Test, TestingModule } from '@nestjs/testing'
import { ActivationCodeService, GenerateCodeInput, ActivationCodePayload } from './activation-code.service'

describe('ActivationCodeService', () => {
  let service: ActivationCodeService

  // Mock Redis client
  const mockRedis = {
    status: 'ready',
    setex: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    multi: vi.fn(),
  }

  // Mock multi result
  const mockMulti = {
    incr: vi.fn().mockReturnThis(),
    expire: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue([1, 1]),
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRedis.status = 'ready'
    mockRedis.multi.mockReturnValue(mockMulti)

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivationCodeService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile()

    service = module.get<ActivationCodeService>(ActivationCodeService)
  })

  describe('TC21: 激活码生成', () => {
    it('TC21: 应该生成格式正确的激活码', async () => {
      const input: GenerateCodeInput = {
        scope: 'ai.capability',
        durationDays: 365,
        quota: 1000,
        level: 'tenant',
      }

      const code = await service.generateCode(input)

      // 验证格式: LIC-XXXX-XXXX-XXXX-XXXX
      expect(code).toMatch(/^LIC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    })

    it('TC21: 应该将激活码元数据存储到Redis', async () => {
      const input: GenerateCodeInput = {
        scope: 'ai.capability',
        durationDays: 30,
        level: 'store',
        metadata: { customField: 'value' },
      }

      await service.generateCode(input)

      expect(mockRedis.setex).toHaveBeenCalled()
      const [key, ttl, value] = mockRedis.setex.mock.calls[0]
      expect(key).toMatch(/^activation:code:[a-f0-9]{16}$/)
      expect(ttl).toBe(30 * 86400) // 30天转换为秒
      
      const metadata = JSON.parse(value)
      expect(metadata.scope).toBe('ai.capability')
      expect(metadata.level).toBe('store')
      expect(metadata.customField).toBe('value')
    })
  })

  describe('TC22: 激活码验证与核销', () => {
    it('TC22: 应该成功验证并核销有效激活码', async () => {
      const payload: ActivationCodePayload = {
        code: 'LIC-1234-5678-9ABC-DEF0',
        scope: 'ai.capability',
        tenantId: 'tenant-123',
      }

      // Mock Redis返回有效激活码元数据
      mockRedis.get.mockResolvedValue(JSON.stringify({
        scope: 'ai.capability',
        durationDays: 365,
        level: 'tenant',
        createdAt: new Date().toISOString(),
      }))

      const result = await service.verifyAndActivate(payload)

      expect(result.success).toBe(true)
      expect(result.licenseId).toMatch(/^lic-\d+-[a-z0-9]+$/)
      expect(result.message).toBe('激活成功')
      expect(result.expiresAt).toBeInstanceOf(Date)
    })

    it('TC22: 应该拒绝无效或过期的激活码', async () => {
      const payload: ActivationCodePayload = {
        code: 'LIC-INVALID-CODE',
        scope: 'ai.capability',
        tenantId: 'tenant-123',
      }

      // Redis返回null表示激活码不存在
      mockRedis.get.mockResolvedValue(null)

      const result = await service.verifyAndActivate(payload)

      expect(result.success).toBe(false)
      expect(result.message).toBe('激活码无效或已过期')
    })

    it('TC22: 应该拒绝作用域不匹配的激活码', async () => {
      const payload: ActivationCodePayload = {
        code: 'LIC-1234-5678-9ABC-DEF0',
        scope: 'wrong.scope',
        tenantId: 'tenant-123',
      }

      mockRedis.get.mockResolvedValue(JSON.stringify({
        scope: 'ai.capability', // 不同的作用域
        durationDays: 365,
        level: 'tenant',
      }))

      const result = await service.verifyAndActivate(payload)

      expect(result.success).toBe(false)
      expect(result.message).toContain('激活码不适用于此服务')
    })
  })

  describe('TC23: 防暴力破解', () => {
    it('TC23: 应该在超过最大尝试次数后锁定', async () => {
      const payload: ActivationCodePayload = {
        code: 'LIC-WRONG-CODE',
        scope: 'ai.capability',
        tenantId: 'tenant-123',
      }

      // 模拟已达到最大尝试次数
      mockRedis.get.mockResolvedValueOnce('5')

      const result = await service.verifyAndActivate(payload)

      expect(result.success).toBe(false)
      expect(result.message).toContain('尝试次数过多')
    })

    it('TC23: 应该统计失败的尝试次数', async () => {
      const payload: ActivationCodePayload = {
        code: 'LIC-WRONG-CODE',
        scope: 'ai.capability',
        tenantId: 'tenant-123',
      }

      mockRedis.get.mockResolvedValue(null) // 激活码无效

      await service.verifyAndActivate(payload)

      // 验证Redis multi被调用以记录尝试
      expect(mockRedis.multi).toHaveBeenCalled()
    })
  })

  describe('TC24: 激活码格式验证', () => {
    it('TC24: 应该验证正确格式的激活码', () => {
      const validCode = 'LIC-1234-ABCD-5678-EFGH'
      expect(service.validateFormat(validCode)).toBe(true)
    })

    it('TC24: 应该拒绝格式错误的激活码', () => {
      const invalidCodes = [
        'LIC-123-ABCD-5678-EFGH', // 3位
        'LIC-12345-ABCD-5678-EFGH', // 5位
        'ABC-1234-ABCD-5678-EFGH', // 前缀错误
        'LIC-1234-ABCD-5678', // 缺少组
        'LIC-1234-ABCD-5678-EFGH-IJKL', // 多余组
        'lic-1234-abcd-5678-efgh', // 小写
      ]

      invalidCodes.forEach(code => {
        expect(service.validateFormat(code)).toBe(false)
      })
    })
  })

  describe('TC25: Redis不可用降级', () => {
    it('TC25: 应该在Redis不可用时返回服务不可用', async () => {
      // 模拟Redis不可用
      mockRedis.status = 'end'

      const payload: ActivationCodePayload = {
        code: 'LIC-1234-5678-9ABC-DEF0',
        scope: 'ai.capability',
        tenantId: 'tenant-123',
      }

      const result = await service.verifyAndActivate(payload)

      expect(result.success).toBe(false)
      expect(result.message).toContain('激活服务暂时不可用')
    })

    it('TC25: 应该允许生成激活码并跳过不可用 Redis 存储', async () => {
      mockRedis.status = 'end'

      const input: GenerateCodeInput = {
        scope: 'ai.capability',
        durationDays: 365,
        level: 'tenant',
      }

      // 生成激活码应该仍然返回code，即使Redis存储失败
      const code = await service.generateCode(input)
      
      expect(code).toMatch(/^LIC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)
      expect(mockRedis.setex).not.toHaveBeenCalled()
    })
  })
})
