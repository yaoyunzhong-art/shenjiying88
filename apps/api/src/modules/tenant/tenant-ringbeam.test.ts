/**
 * tenant-ringbeam.test.ts - V17#圈梁 Phase2 基础设施圈梁
 * 用途: PRD对齐测试 - 验证租户生命周期/上下文解析/配额管理/隔离
 * 覆盖: 正例(租户创建+上下文+配额) + 反例(重复初始化/无效访问) + 边界(Suspend/Reactivate/超额配额)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TenantService } from './tenant.service'
import { TenantLifecycleService } from './tenant-lifecycle.service'
import { TenantLifecycleStatus, TenantStatusReason } from './tenant-lifecycle.entity'
import { TenantQuotaService } from './tenant-quota.service'
import { TenantTier, QuotaResourceKind } from './tenant-quota.entity'

describe('🔵 TenantRingBeam: 租户模块PRD对齐', () => {
  let tenantService: TenantService
  let lifecycleService: TenantLifecycleService
  let quotaService: TenantQuotaService

  beforeEach(() => {
    tenantService = new TenantService()
    lifecycleService = new TenantLifecycleService()
    quotaService = new TenantQuotaService()
  })

  // ─── 1. 租户上下文解析 ────────────────────────────────────────────

  describe('租户上下文解析', () => {
    it('[P0] 从tenantContext正常解析effectiveTenantId', () => {
      const resolved = tenantService.resolveTenantContext({
        tenantId: 'tenant-prod-001',
        marketCode: 'CN',
      })

      expect(resolved.effectiveTenantId).toBe('tenant-prod-001')
      expect(resolved.effectiveMarketCode).toBe('CN')
    })

    it('[P0] actorContext可覆盖tenantContext的值', () => {
      const resolved = tenantService.resolveTenantContext(
        { tenantId: 'tenant-default', marketCode: 'US' },
        {
          actorId: 'actor-001',
          actorType: 'platform-user',
          tenantId: 'tenant-override',
          brandId: 'brand-ali',
          authenticated: true, roles: ["admin"], permissions: ["*"], source: "web",
        }
      )

      expect(resolved.effectiveTenantId).toBe('tenant-override')
      expect(resolved.effectiveBrandId).toBe('brand-ali')
    })

    it('[P1] 无actorContext时使用默认tenant-demo', () => {
      const resolved = tenantService.resolveTenantContext({} as any)

      expect(resolved.effectiveTenantId).toBe('tenant-demo')
      expect(resolved.effectiveMarketCode).toBe('default')
    })

    it('[P1] 不带actor时actor字段为null且authenticated为false', () => {
      const resolved = tenantService.resolveTenantContext({
        tenantId: 'tenant-test',
        marketCode: 'CN',
      })

      expect(resolved.actor).toBeNull()
      expect(resolved.authenticated).toBe(false)
    })

    it('[P1] marketCode未传递时使用默认值', () => {
      const resolved = tenantService.resolveTenantContext({
        tenantId: 'tenant-test',
      })

      // marketCode 未传递时走 'default'
      expect(resolved.effectiveMarketCode).toBe('default')
    })
  })

  // ─── 2. 租户生命周期 ──────────────────────────────────────────────

  describe('租户生命周期', () => {
    it('[P0] 初始化租户lifecycle应返回active状态', () => {
      const lifecycle = lifecycleService.initialize('tenant-new-001')

      expect(lifecycle.tenantId).toBe('tenant-new-001')
      expect(lifecycle.status).toBe(TenantLifecycleStatus.Active)
    })

    it('[P0] suspend租户应改变状态为suspended', () => {
      lifecycleService.initialize('tenant-suspend-001')
      const suspended = lifecycleService.suspend(
        'tenant-suspend-001',
        TenantStatusReason.PolicyViolation,
        'admin',
        '违规操作暂停',
      )

      expect(suspended.status).toBe(TenantLifecycleStatus.Suspended)
      expect(suspended.statusChangedAt).toBeDefined()
    })

    it('[P0] reactivate已暂停租户应恢复为active', () => {
      lifecycleService.initialize('tenant-reactivate-001')
      lifecycleService.suspend('tenant-reactivate-001', TenantStatusReason.PolicyViolation, 'admin', '暂停')
      const reactivated = lifecycleService.reactivate('tenant-reactivate-001', 'admin', '已整改')

      expect(reactivated.status).toBe(TenantLifecycleStatus.Active)
    })

    it('[P1] 重复初始化同一租户应抛出ConflictException', () => {
      lifecycleService.initialize('tenant-duplicate-001')
      expect(() => {
        lifecycleService.initialize('tenant-duplicate-001')
      }).toThrow()
    })

    it('[P1] 查询未初始化的租户返回undefined', () => {
      const lifecycle = lifecycleService.getLifecycle('tenant-nonexistent')
      expect(lifecycle).toBeUndefined()
    })

    it('[P1] softDelete租户应标记为deleted保留记录', () => {
      lifecycleService.initialize('tenant-delete-001')
      const deleted = lifecycleService.softDelete('tenant-delete-001', TenantStatusReason.UserRequest, 'tenant-request')

      expect(deleted.status).toBe(TenantLifecycleStatus.Deleted)
      expect(deleted.statusChangedAt).toBeDefined()
    })

    it('[P1] 对已删除的租户可查询但不可操作', () => {
      lifecycleService.initialize('tenant-gone-001')
      lifecycleService.softDelete('tenant-gone-001', TenantStatusReason.AdminDelete, 'abandoned')

      const lifecycle = lifecycleService.getLifecycle('tenant-gone-001')
      expect(lifecycle).toBeDefined()
      expect(lifecycle!.status).toBe(TenantLifecycleStatus.Deleted)
    })

    it('[P1] canWrite对已暂停租户返回false', () => {
      lifecycleService.initialize('tenant-write-001')
      lifecycleService.suspend('tenant-write-001', TenantStatusReason.AdminSuspend, 'admin')
      expect(lifecycleService.canWrite('tenant-write-001')).toBe(false)
      expect(lifecycleService.canRead('tenant-write-001')).toBe(true)
    })
  })

  // ─── 3. 租户配额 ──────────────────────────────────────────────────

  describe('租户配额管理', () => {
    it('[P0] 初始化租户配额返回默认Free配额', () => {
      const quota = quotaService.initialize('tenant-quota-001')

      expect(quota.tenantId).toBe('tenant-quota-001')
      expect(quota.tier).toBe(TenantTier.Free)
      expect(quota.maxBrands).toBeGreaterThan(0)
      expect(quota.maxStores).toBeGreaterThan(0)
    })

    it('[P0] 升级tier应增加配额上限', () => {
      const quota = quotaService.initialize('tenant-tier-001', TenantTier.Free)
      expect(quota.tier).toBe(TenantTier.Free)
      const freeBrands = quota.maxBrands

      const upgraded = quotaService.setTier('tenant-tier-001', TenantTier.Pro)
      expect(upgraded.tier).toBe(TenantTier.Pro)
      expect(upgraded.maxBrands).toBeGreaterThan(freeBrands)
    })

    it('[P1] 检查配额未超限时allowed应为true', () => {
      quotaService.initialize('tenant-check-001', TenantTier.Free)
      const check = quotaService.check('tenant-check-001', QuotaResourceKind.Member)

      expect(check.allowed).toBe(true)
      expect(check.currentUsage).toBe(0)
    })

    it('[P1] 超过配额上限应拒绝', () => {
      quotaService.initialize('tenant-over-001', TenantTier.Free)

      // Free tier maxMembers=100, 预留超过上限
      for (let i = 0; i < 101; i++) {
        quotaService.reserve('tenant-over-001', QuotaResourceKind.Member)
      }

      const check = quotaService.check('tenant-over-001', QuotaResourceKind.Member)
      expect(check.allowed).toBe(false)
    })

    it('[P1] 已使用配额统计正确', () => {
      quotaService.initialize('tenant-usage-001', TenantTier.Free)

      quotaService.reserve('tenant-usage-001', QuotaResourceKind.Member)
      quotaService.reserve('tenant-usage-001', QuotaResourceKind.Member)
      const usage = quotaService.getUsage('tenant-usage-001')

      expect(usage.members).toBe(2)
    })

    it('[P1] 不存在的租户配额查询返回undefined', () => {
      const quota = quotaService.getQuota('tenant-nonexistent')
      expect(quota).toBeUndefined()
    })
  })

  // ─── 4. 租户隔离 ──────────────────────────────────────────────────

  describe('租户隔离', () => {
    it('[P0] 不同租户的数据应完全隔离', () => {
      const q1 = quotaService.initialize('tenant-iso-001', TenantTier.Free)
      const q2 = quotaService.initialize('tenant-iso-002', TenantTier.Pro)

      quotaService.reserve('tenant-iso-001', QuotaResourceKind.Member)
      const u1 = quotaService.getUsage('tenant-iso-001')
      const u2 = quotaService.getUsage('tenant-iso-002')

      expect(u1.members).toBe(1)
      expect(u2.members).toBe(0)
      expect(q1.tier).toBe(TenantTier.Free)
      expect(q2.tier).toBe(TenantTier.Pro)
    })

    it('[P1] override配额应只影响指定租户', () => {
      quotaService.initialize('tenant-override-a-001', TenantTier.Free)
      quotaService.initialize('tenant-override-b-001', TenantTier.Free)

      const qa = quotaService.getQuota('tenant-override-a-001')!
      const originalBrands = qa.maxBrands

      quotaService.overrideQuota('tenant-override-a-001', {
        maxBrands: originalBrands + 10,
      })

      const updatedA = quotaService.getQuota('tenant-override-a-001')
      const unchangedB = quotaService.getQuota('tenant-override-b-001')

      expect(updatedA!.maxBrands).toBe(originalBrands + 10)
      expect(unchangedB!.maxBrands).toBe(originalBrands)
    })
  })
})
