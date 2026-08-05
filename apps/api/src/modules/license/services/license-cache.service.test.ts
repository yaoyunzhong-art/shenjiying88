import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
type Mocked<T> = { [K in keyof T]: T[K] extends (...args: any[]) => infer R ? T[K] & { mockReturnValue(v: R): void; mockResolvedValue(v: Awaited<R>): void } : T[K] }
/**
 * 付费授权 - License 缓存服务测试 (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * TC11-TC20: 缓存服务测试套件
 * - TC11: 缓存命中场景
 * - TC12: 缓存未命中场景
 * - TC13: 缓存降级回源
 * - TC14: 缓存穿透保护
 * - TC15: 批量缓存操作
 * - TC16: 缓存失效操作
 * - TC17: 租户级缓存失效
 * - TC18: 统计信息正确性
 * - TC19: 空值缓存处理
 * - TC20: 批量加载异常处理
 */

import { Test, TestingModule } from '@nestjs/testing'
import { LicenseCacheService } from './license-cache.service'
import { CACHE_SERVICE, CacheService } from '../../../infrastructure/cache/cache.module'
import type { License } from '../license.entity'

// Mock CacheService
const mockCacheService: any = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  delByPrefix: vi.fn(),
}

describe('LicenseCacheService', () => {
  let service: LicenseCacheService

  const mockLicense: License = {
    id: 'lic-123',
    tenantId: 'tenant-A',
    scope: 'ai.capability',
    level: 'tenant',
    activationSource: 'paid' as any,
    autoRenew: false,
    createdBy: 'system',
    status: 'active',
    validFrom: '2024-01-01T00:00:00Z',
    validUntil: '2025-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseCacheService,
        {
          provide: CACHE_SERVICE,
          useValue: mockCacheService,
        },
      ],
    }).compile()

    service = module.get<LicenseCacheService>(LicenseCacheService)

    // Reset mocks
    vi.clearAllMocks()
    service.resetStats()
  })

  describe('TC11: 缓存命中场景', () => {
    it('TC11: 应该从缓存直接返回数据当缓存存在时', async () => {
      const cachedData = {
        data: mockLicense,
        timestamp: Date.now(),
        ttl: 300,
      }
      mockCacheService.get.mockResolvedValue(cachedData)

      const loader = vi.fn().mockResolvedValue(mockLicense)
      const result = await service.getLicense('tenant-A', 'ai.capability', loader)

      expect(result).toEqual(mockLicense)
      expect(mockCacheService.get).toHaveBeenCalledWith('license:tenant-A:ai.capability:tenant')
      expect(loader).not.toHaveBeenCalled() // 未调用loader
      
      const stats = service.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(0)
    })
  })

  describe('TC12: 缓存未命中场景', () => {
    it('TC12: 应该回源加载并写入缓存当缓存不存在时', async () => {
      mockCacheService.get.mockResolvedValue(undefined)
      mockCacheService.set.mockResolvedValue(undefined)

      const loader = vi.fn().mockResolvedValue(mockLicense)
      const result = await service.getLicense('tenant-A', 'ai.capability', loader)

      expect(result).toEqual(mockLicense)
      expect(loader).toHaveBeenCalledTimes(1)
      expect(mockCacheService.set).toHaveBeenCalled()
      
      const stats = service.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(1)
    })
  })

  describe('TC13: 缓存降级回源', () => {
    it('TC13: 应该在缓存读取异常时降级为 miss 并继续回源', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Redis connection failed'))

      const loader = vi.fn().mockResolvedValue(mockLicense)
      const result = await service.getLicense('tenant-A', 'ai.capability', loader)

      expect(result).toEqual(mockLicense)
      expect(loader).toHaveBeenCalledTimes(1)
      
      const stats = service.getStats()
      expect(stats.misses).toBe(1)
      expect(stats.fallbacks).toBe(0)
      expect(stats.errors).toBe(0)
    })
  })

  describe('TC14: 缓存穿透保护', () => {
    it('TC14: 应该缓存空值防止缓存穿透', async () => {
      mockCacheService.get.mockResolvedValue(undefined)
      mockCacheService.set.mockResolvedValue(undefined)

      const loader = vi.fn().mockResolvedValue(null) // 返回null表示无授权
      const result = await service.getLicense('tenant-A', 'ai.capability', loader)

      expect(result).toBeNull()
      
      // 验证空值被缓存(使用较短的TTL)
      const setCall = mockCacheService.set.calls[0]
      const cachedValue = setCall[1] as { data: null; ttl: number }
      expect(cachedValue.data).toBeNull()
    })
  })

  describe('TC15: 批量缓存操作', () => {
    it('TC15: 应该支持批量获取和写入缓存', async () => {
      const keys = [
        { tenantId: 'tenant-A', scope: 'ai.capability' },
        { tenantId: 'tenant-B', scope: 'ai.capability' },
        { tenantId: 'tenant-C', scope: 'analytics' },
      ]

      // 模拟部分缓存命中
      const cachedA = { data: { ...mockLicense, tenantId: 'tenant-A' }, timestamp: Date.now(), ttl: 300 }
      mockCacheService.get
        .mockResolvedValueOnce(cachedA) // tenant-A 命中
        .mockResolvedValueOnce(undefined) // tenant-B 未命中
        .mockResolvedValueOnce(undefined) // tenant-C 未命中

      mockCacheService.set.mockResolvedValue(undefined)

      const loadedLicenses = new Map([
        ['license:tenant-B:ai.capability:tenant', { ...mockLicense, tenantId: 'tenant-B' }],
        ['license:tenant-C:analytics:tenant', { ...mockLicense, tenantId: 'tenant-C', scope: 'analytics' }],
      ])

      const loader = vi.fn().mockResolvedValue(loadedLicenses)
      const result = await service.getLicenses(keys, loader)

      expect(result.size).toBe(3)
      expect(result.get('license:tenant-A:ai.capability:tenant')).toBeDefined()
      expect(result.get('license:tenant-B:ai.capability:tenant')).toBeDefined()
      expect(result.get('license:tenant-C:analytics:tenant')).toBeDefined()
    })
  })

  describe('TC16: 缓存失效操作', () => {
    it('TC16: 应该能正确使单条缓存失效', async () => {
      mockCacheService.del.mockResolvedValue(true)

      await service.invalidate('tenant-A', 'ai.capability')

      expect(mockCacheService.del).toHaveBeenCalledWith('license:tenant-A:ai.capability:tenant')
    })

    it('TC16: 应该能正确使门店级缓存失效', async () => {
      mockCacheService.del.mockResolvedValue(true)

      await service.invalidate('tenant-A', 'ai.capability', 'store-001')

      expect(mockCacheService.del).toHaveBeenCalledWith('license:tenant-A:ai.capability:store:store-001')
    })
  })

  describe('TC17: 租户级缓存失效', () => {
    it('TC17: 应该能批量使租户的所有缓存失效', async () => {
      mockCacheService.delByPrefix.mockResolvedValue(5)

      const count = await service.invalidateByTenant('tenant-A')

      expect(mockCacheService.delByPrefix).toHaveBeenCalledWith('license:tenant-A:*')
      expect(count).toBe(5)
    })
  })

  describe('TC18: 统计信息正确性', () => {
    it('TC18: 应该正确计算缓存命中率', async () => {
      // 模拟3次命中，1次未命中
      const cachedData = { data: mockLicense, timestamp: Date.now(), ttl: 300 }
      mockCacheService.get
        .mockResolvedValueOnce(cachedData)
        .mockResolvedValueOnce(cachedData)
        .mockResolvedValueOnce(cachedData)
        .mockResolvedValueOnce(undefined)

      mockCacheService.set.mockResolvedValue(undefined)

      const loader = vi.fn().mockResolvedValue(mockLicense)

      // 执行4次查询
      await service.getLicense('tenant-A', 'scope-1', loader)
      await service.getLicense('tenant-A', 'scope-2', loader)
      await service.getLicense('tenant-A', 'scope-3', loader)
      await service.getLicense('tenant-A', 'scope-4', loader)

      const stats = service.getStats()
      expect(stats.hits).toBe(3)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(0.75) // 75%命中率
    })

    it('TC18: 应该能重置统计信息', () => {
      // 先模拟一些统计数据
      service.getStats()
      
      service.resetStats()
      const stats = service.getStats()
      
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.fallbacks).toBe(0)
      expect(stats.errors).toBe(0)
      expect(stats.hitRate).toBe(0)
    })
  })

  describe('TC19: 空值缓存处理', () => {
    it('TC19: 应该为null值使用较短的TTL', async () => {
      mockCacheService.get.mockResolvedValue(undefined)
      mockCacheService.set.mockResolvedValue(undefined)

      const loader = vi.fn().mockResolvedValue(null)
      await service.getLicense('tenant-A', 'ai.capability', loader)

      const setCall = mockCacheService.set.calls[0]
      const ttl = setCall[2] as number
      expect(ttl).toBe(60) // 空值使用60秒TTL
    })

    it('TC19: 应该正确读取缓存的空值', async () => {
      const cachedNull = { data: null, timestamp: Date.now(), ttl: 60 }
      mockCacheService.get.mockResolvedValue(cachedNull)

      const loader = vi.fn().mockResolvedValue(null)
      const result = await service.getLicense('tenant-A', 'ai.capability', loader)

      expect(result).toBeNull()
      expect(loader).not.toHaveBeenCalled() // 缓存命中，不需要loader
    })
  })

  describe('TC20: 批量加载异常处理', () => {
    it('TC20: 应该处理批量加载中的部分失败', async () => {
      const keys = [
        { tenantId: 'tenant-A', scope: 'ai.capability' },
        { tenantId: 'tenant-B', scope: 'ai.capability' },
      ]

      mockCacheService.get.mockResolvedValue(undefined)

      // loader返回部分失败的结果
      const partialResult = new Map([
        ['license:tenant-A:ai.capability:tenant', mockLicense],
        // tenant-B 的数据缺失
      ])

      const loader = vi.fn().mockResolvedValue(partialResult)
      const result = await service.getLicenses(keys, loader)

      expect(result.size).toBe(1)
      expect(result.get('license:tenant-A:ai.capability:tenant')).toBeDefined()
    })

    it('TC20: 应该处理批量加载完全失败的情况', async () => {
      const keys = [
        { tenantId: 'tenant-A', scope: 'ai.capability' },
      ]

      mockCacheService.get.mockResolvedValue(undefined)

      const loader = vi.fn().mockRejectedValue(new Error('Database connection failed'))
      const result = await service.getLicenses(keys, loader)

      expect(result.size).toBe(0) // 返回空Map
      const stats = service.getStats()
      expect(stats.errors).toBeGreaterThan(0)
    })
  })
})
