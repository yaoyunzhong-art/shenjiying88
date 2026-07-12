import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 付费授权 - Service 单元测试 (V9 需求 2 · V10 Day 4 Phase 88)
 *
 * 测试覆盖:
 * - 4 类激活源 (paid / trial / tier-match / whitelist)
 * - 租户级 + 门店级 双层授权
 * - 双拦截前置校验
 * - 配额消耗 + 拒绝
 * - 审计日志
 */

import assert from 'node:assert/strict'
import { LicenseService } from './license.service'
import { runWithTenant } from '../../common/context/tenant-context'

const CTX_A = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'admin-A',
  role: 'tenant_admin' as const,
}

const CTX_B = {
  tenantId: 'tenant-B',
  storeId: 'store-B1',
  userId: 'admin-B',
  role: 'tenant_admin' as const,
}

const CTX_CHAMPION = {
  tenantId: 'tenant-champion',
  storeId: 'store-champion-1',
  userId: 'champion',
  role: 'super_admin' as const,
}

const CTX_INTERNAL = {
  tenantId: 'tenant-internal',
  storeId: 'store-internal-1',
  userId: 'internal',
  role: 'super_admin' as const,
}

describe('LicenseService (V10 Day 4 Phase 88)', () => {
  let service: LicenseService

  beforeEach(() => {
    const { createInMemoryLicenseRepos } = require('./repositories/in-memory.repository')
    const repos = createInMemoryLicenseRepos()
    service = new LicenseService(repos.licenseRepo, repos.auditLogRepo)
    // 显式植入种子数据（因为直接构造不触发 constructor fallback）
    ;(service as any).seedInMemory()
  })

  // ============ 1. 已付费 (paid) ============

  describe('1. 已付费授权', () => {
    it('tenant A 有 paid 授权,应允许', async () => {
      await runWithTenant(CTX_A, async () => {
        const result = await service.checkLicense({ scope: 'ai.capability' })
        assert.equal(result.allowed, true)
        assert.equal(result.license?.activationSource, 'paid')
        assert.equal(result.license?.status, 'active')
      })
    })

    it('paid 授权包含配额 (10万)', async () => {
      await runWithTenant(CTX_A, async () => {
        const result = await service.checkLicense({ scope: 'ai.capability' })
        assert.equal(result.quotaRemaining, 100000 - 1234)
      })
    })
  })

  // ============ 2. 试用 (trial) ============

  describe('2. 试用授权 (30 天)', () => {
    it('tenant B 有 trial 授权,应允许', async () => {
      await runWithTenant(CTX_B, async () => {
        const result = await service.checkLicense({ scope: 'ai.capability' })
        assert.equal(result.allowed, true)
        assert.equal(result.license?.activationSource, 'trial')
        assert.ok(result.trialDaysRemaining !== undefined)
        assert.ok(result.trialDaysRemaining >= 0)
        assert.ok(result.trialDaysRemaining <= 30)
      })
    })
  })

  // ============ 3. 等级达标 (tier-match) ============

  describe('3. 等级达标自动激活', () => {
    it('tenant-champion 自动激活知识库授权', async () => {
      await runWithTenant(CTX_CHAMPION, async () => {
        const result = await service.checkLicense({ scope: 'ai.knowledge' })
        assert.equal(result.allowed, true)
        assert.equal(result.license?.activationSource, 'tier-match')
      })
    })

    it('autoActivate 创建新授权', async () => {
      const license = await runWithTenant({ tenantId: 'tenant-new', userId: 'admin', role: 'tenant_admin' as const }, async () => {
        return service.autoActivate('tenant-new', 'ai.capability', 'tier-match', 365)
      })
      assert.equal(license.activationSource, 'tier-match')
      assert.equal(license.status, 'active')
    })
  })

  // ============ 4. 白名单 (whitelist) ============

  describe('4. 内部白名单', () => {
    it('tenant-internal 白名单允许 integration.open', async () => {
      await runWithTenant(CTX_INTERNAL, async () => {
        const result = await service.checkLicense({ scope: 'integration.open' })
        assert.equal(result.allowed, true)
        assert.equal(result.license?.activationSource, 'whitelist')
      })
    })
  })

  // ============ 5. 拒绝路径 ============

  describe('5. 无授权拒绝', () => {
    it('tenant-A 没有 ai.industry 授权,应拒绝', async () => {
      await runWithTenant(CTX_A, async () => {
        const result = await service.checkLicense({ scope: 'ai.industry' })
        assert.equal(result.allowed, false)
        assert.match(result.reason!, /No active license/)
      })
    })

    it('requireLicense 抛 ForbiddenException', async () => {
      await runWithTenant(CTX_A, async () => {
        await assert.rejects(
          () => (service as any).requireLicense('ai.industry'),
          {
            name: 'ForbiddenException',
            // NestJS ForbiddenException 默认 message
          },
        )
      })
    })
  })

  // ============ 6. 配额管理 ============

  describe('6. 配额管理', () => {
    it('consume 增加 usedQuota', async () => {
      let licenseId = ''
      await runWithTenant(CTX_A, async () => {
        const result = await service.checkLicense({ scope: 'ai.capability' })
        licenseId = result.license!.id
        const before = result.license!.usedQuota ?? 0
        await service.consume(licenseId, 10)
        const after = await service.checkLicense({ scope: 'ai.capability' })
        assert.equal(after.license!.usedQuota, before + 10)
      })
    })

    it('quota 耗尽后拒绝', async () => {
      // 创建一个 quota=1 的小授权
      await runWithTenant({ tenantId: 'tenant-test', userId: 'test', role: 'tenant_admin' as const }, async () => {
        await service.createLicense({
          tenantId: 'tenant-test',
          scope: 'ai.capability',
          level: 'tenant',
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
          quota: 1,
          activationSource: 'paid',
          createdBy: 'test',
        })
      })

      await runWithTenant(
        { tenantId: 'tenant-test', userId: 'test', role: 'tenant_admin' as const },
        async () => {
          const result = await service.checkLicense({ scope: 'ai.capability' })
          assert.equal(result.allowed, true)
          // consume 1 次
          await service.consume(result.license!.id, 1)
          // 再校验应该拒绝
          const resultAfter = await service.checkLicense({ scope: 'ai.capability' })
          assert.equal(resultAfter.allowed, false)
          assert.match(resultAfter.reason!, /Quota/)
        },
      )
    })
  })

  // ============ 7. 暂停 + 状态 ============

  describe('7. 暂停授权', () => {
    it('suspend 后拒绝', async () => {
      let licenseId = ''
      await runWithTenant(CTX_A, async () => {
        const result = await service.checkLicense({ scope: 'ai.capability' })
        licenseId = result.license!.id
        await service.suspend(licenseId, 'admin', 'test suspend')
      })

      await runWithTenant(CTX_A, async () => {
        const result = await service.checkLicense({ scope: 'ai.capability' })
        assert.equal(result.allowed, false)
        assert.match(result.reason!, /suspended/)
      })
    })
  })

  // ============ 8. 审计日志 ============

  describe('8. 审计日志 (180 天保留)', () => {
    it('拒绝时记录 deny 日志', async () => {
      await runWithTenant(CTX_A, async () => {
        try {
          await service.requireLicense(CTX_A.tenantId, CTX_A.userId, 'ai.industry')
        } catch {
          /* expected */
        }
      })

      const logs = await runWithTenant(CTX_A, () => service.listAuditLogs(CTX_A.tenantId))
      const denies = logs.filter((l: any) => l.result === 'denied')
      assert.ok(denies.length > 0)
    })

    it('成功校验记录 consume 日志', async () => {
      await runWithTenant(CTX_A, async () => {
        await service.requireLicense(CTX_A.tenantId, CTX_A.userId, 'ai.capability')
      })
      const logs = await runWithTenant(CTX_A, () => service.listAuditLogs(CTX_A.tenantId))
      const consumes = logs.filter((l: any) => l.action === 'consume' && l.result === 'success')
      assert.ok(consumes.length > 0)
    })
  })

  // ============ 9. 列出授权 ============

  describe('9. 列出租户/门店授权', () => {
    it('listLicensesByTenant 返回该 tenant 全部授权', async () => {
      const list = await runWithTenant({ tenantId: 'tenant-A', userId: 'admin-A', role: 'tenant_admin' as const }, async () => {
        return service.listLicensesByTenant('tenant-A')
      })
      assert.ok(list.length >= 1)
      assert.ok(list.every((l: any) => l.tenantId === 'tenant-A'))
    })

    it('listLicensesByStore 包含继承自 tenant 的授权', async () => {
      const list = await runWithTenant({ tenantId: 'tenant-A', userId: 'admin-A', role: 'tenant_admin' as const }, async () => {
        return service.listLicensesByStore('tenant-A', 'store-001')
      })
      assert.ok(list.length >= 1)
    })
  })
})