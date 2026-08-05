import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
type Mocked<T> = { [K in keyof T]: T[K] extends (...args: any[]) => infer R ? T[K] & { mockReturnValue(v: R): void; mockResolvedValue(v: Awaited<R>): void } : T[K] }
/**
 * 付费授权 - Service 测试 (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 测试覆盖:
 * 1. 授权检查 (租户级/门店级)
 * 2. 授权创建与管理
 * 3. 配额消费
 * 4. 审计日志
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common'
import { runWithTenant } from '../../common/context/tenant-context'
import { LicenseService } from './license.service'
import { LicenseRepository } from './repositories/license.repository'
import { LicenseAuditLogRepository } from './repositories/license-audit-log.repository'
import type { License } from './license.entity'

// Mock repositories
const mockLicenseRepo = {
  findActiveLicense: vi.fn(),
  create: vi.fn(),
  findByTenant: vi.fn(),
  findByStore: vi.fn(),
  updateStatus: vi.fn(),
  consumeQuota: vi.fn(),
} as unknown as Mocked<LicenseRepository>

const mockAuditLogRepo = {
  create: vi.fn(),
  findByTenant: vi.fn(),
} as unknown as Mocked<LicenseAuditLogRepository>

const runInTenant = <T>(tenantId: string, fn: () => Promise<T>) =>
  runWithTenant({ tenantId, userId: 'test-user' }, fn)

describe('LicenseService (spec)', () => {
  let service: LicenseService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new LicenseService(mockLicenseRepo as any, mockAuditLogRepo as any)
  })

  describe('checkLicense - 授权检查', () => {
    it('TC01: 应该允许有效的租户级授权', async () => {
      const mockLicense: License = {
        id: 'lic-001',
        tenantId: 'tenant-A',
        scope: 'ai.capability',
        level: 'tenant',
        status: 'active',
        activationSource: 'paid',
        validFrom: new Date(Date.now() - 86400000).toISOString(),
        validUntil: new Date(Date.now() + 86400000).toISOString(),
        autoRenew: false,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockLicenseRepo.findActiveLicense.mockResolvedValue(mockLicense)

      const result = await runInTenant('tenant-A', () =>
        service.checkLicense({
          tenantId: 'tenant-A',
          scope: 'ai.capability',
        }),
      )

      expect(result.allowed).toBe(true)
      expect(result.license).toBeDefined()
      expect(mockLicenseRepo.findActiveLicense).toHaveBeenCalledWith('tenant-A', 'ai.capability', undefined)
    })

    it('TC02: 应该拒绝过期的授权', async () => {
      const mockLicense: License = {
        id: 'lic-002',
        tenantId: 'tenant-B',
        scope: 'ai.capability',
        level: 'tenant',
        status: 'expired',
        activationSource: 'trial',
        validFrom: new Date(Date.now() - 86400000 * 60).toISOString(),
        validUntil: new Date(Date.now() - 86400000 * 30).toISOString(),
        autoRenew: false,
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockLicenseRepo.findActiveLicense.mockResolvedValue(mockLicense)

      const result = await runInTenant('tenant-B', () =>
        service.checkLicense({
          tenantId: 'tenant-B',
          scope: 'ai.capability',
        }),
      )

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('expired')
    })

    it('TC03: 应该拒绝无授权的情况', async () => {
      mockLicenseRepo.findActiveLicense.mockResolvedValue(null)

      const result = await runInTenant('tenant-C', () =>
        service.checkLicense({
          tenantId: 'tenant-C',
          scope: 'ai.capability',
        }),
      )

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('No active license')
    })
  })

  describe('createLicense - 授权创建', () => {
    it('TC04: 应该成功创建授权', async () => {
      const mockLicense: License = {
        id: 'lic-003',
        tenantId: 'tenant-D',
        scope: 'ai.knowledge',
        level: 'tenant',
        status: 'active',
        quota: 100000,
        usedQuota: 0,
        activationSource: 'paid',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 365).toISOString(),
        autoRenew: true,
        priceCents: 99900,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockLicenseRepo.create.mockResolvedValue(mockLicense)

      const result = await runInTenant('tenant-D', () =>
        service.createLicense({
          tenantId: 'tenant-D',
          scope: 'ai.knowledge',
          level: 'tenant',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 86400000 * 365).toISOString(),
          quota: 100000,
          priceCents: 99900,
          autoRenew: true,
          activationSource: 'paid',
          createdBy: 'admin',
        }),
      )

      expect(result).toBeDefined()
      expect(result.tenantId).toBe('tenant-D')
      expect(result.scope).toBe('ai.knowledge')
    })
  })

  describe('suspend - 授权暂停', () => {
    it('TC05: 应该成功暂停授权', async () => {
      const mockLicense: License = {
        id: 'lic-004',
        tenantId: 'tenant-E',
        scope: 'ai.capability',
        level: 'tenant',
        status: 'suspended',
        activationSource: 'paid',
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 86400000 * 365).toISOString(),
        autoRenew: false,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockLicenseRepo.updateStatus.mockResolvedValue(mockLicense)
      mockAuditLogRepo.create.mockResolvedValue({} as any)

      const result = await runInTenant('tenant-E', () =>
        service.suspend('lic-004', 'admin', '违规使用'),
      )

      expect(result.status).toBe('suspended')
      expect(mockLicenseRepo.updateStatus).toHaveBeenCalledWith(
        'lic-004',
        'suspended',
        'admin',
        '违规使用',
      )
    })

    it('TC06: 应该抛出异常当授权不存在时', async () => {
      mockLicenseRepo.updateStatus.mockResolvedValue(null)

      await expect(
        runInTenant('tenant-E', () => service.suspend('lic-nonexistent', 'admin', 'test')),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('consumeQuota - 配额消费', () => {
    it('TC07: 应该成功消费配额', async () => {
      mockLicenseRepo.consumeQuota.mockResolvedValue(undefined)

      await runInTenant('tenant-A', () => service.consume('lic-005', 10))

      expect(mockLicenseRepo.consumeQuota).toHaveBeenCalledWith('lic-005', 10)
    })
  })

  describe('listAuditLogs - 审计日志', () => {
    it('TC08: 应该返回租户审计日志', async () => {
      const mockLogs = [
        {
          id: 'audit-001',
          licenseId: 'lic-001',
          tenantId: 'tenant-A',
          action: 'create',
          scope: 'ai.capability',
          operator: 'admin',
          result: 'success',
          timestamp: new Date().toISOString(),
        },
      ] as any

      mockAuditLogRepo.findByTenant.mockResolvedValue(mockLogs)

      const result = await runInTenant('tenant-A', () => service.listAuditLogs('tenant-A', 100))

      expect(result).toHaveLength(1)
      expect(result[0].tenantId).toBe('tenant-A')
      expect(mockAuditLogRepo.findByTenant).toHaveBeenCalledWith('tenant-A', 100)
    })
  })

  describe('requireLicense - 强制授权检查', () => {
    it('TC09: 应该成功当有有效授权时', async () => {
      const mockLicense: License = {
        id: 'lic-006',
        tenantId: 'tenant-F',
        scope: 'ai.capability',
        level: 'tenant',
        status: 'active',
        activationSource: 'paid',
        validFrom: new Date(Date.now() - 86400000).toISOString(),
        validUntil: new Date(Date.now() + 86400000).toISOString(),
        autoRenew: false,
        createdBy: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockLicenseRepo.findActiveLicense.mockResolvedValue(mockLicense)
      mockAuditLogRepo.create.mockResolvedValue({} as any)

      const result = await runInTenant('tenant-F', () =>
        service.requireLicense('tenant-F', 'user-001', 'ai.capability'),
      )

      expect(result.id).toBe('lic-006')
      expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'consume',
          result: 'success',
        }),
      )
    })

    it('TC10: 应该抛出 ForbiddenException 当无授权时', async () => {
      mockLicenseRepo.findActiveLicense.mockResolvedValue(null)
      mockAuditLogRepo.create.mockResolvedValue({} as any)

      await expect(
        runInTenant('tenant-G', () =>
          service.requireLicense('tenant-G', 'user-002', 'ai.capability'),
        ),
      ).rejects.toThrow(ForbiddenException)

      expect(mockAuditLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'reject',
          result: 'denied',
        }),
      )
    })
  })
})
