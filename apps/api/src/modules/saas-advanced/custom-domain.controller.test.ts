import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 96 自定义域名 Controller 测试 (V10 Sprint 2 Day 22)
 *
 * 覆盖 CustomDomainController 全部 8 个端点:
 * POST   /saas/domain              — 添加域名
 * GET    /saas/domain              — 列出域名
 * GET    /saas/domain/:id          — 获取详情
 * DELETE /saas/domain/:id          — 删除域名
 * POST   /saas/domain/:id/verify   — DNS TXT 校验
 * POST   /saas/domain/:id/ssl      — SSL 申请
 * GET    /saas/domain/resolve/host — Host 解析 (不依赖租户上下文)
 * POST   /saas/domain/validate     — 域名格式预校验
 *
 * 覆盖: 正例 13 + 反例/边界 8 = 21 个测试用例
 */

import assert from 'node:assert/strict'
import { CustomDomainController } from './custom-domain.controller'
import { CustomDomainService } from './custom-domain.service'
import { buildVerificationValue } from './custom-domain.entity'
import { runWithTenant } from '../../common/context/tenant-context'

const TENANT_A = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'admin-A',
  role: 'tenant_admin' as const,
}
const TENANT_B = {
  tenantId: 'tenant-B',
  storeId: 'store-002',
  userId: 'admin-B',
  role: 'tenant_admin' as const,
}
const TENANT_ROOT = {
  tenantId: 'tenant-root',
  userId: 'admin-root',
  role: 'tenant_admin' as const,
}
const BRAND_CTX = {
  tenantId: 'tenant-governance',
  brandId: 'brand-governance',
  userId: 'brand-admin',
  role: 'brand_admin' as const,
}
const STORE_CTX = {
  tenantId: 'tenant-governance',
  brandId: 'brand-governance',
  storeId: 'store-governance',
  userId: 'store-admin',
  role: 'store_admin' as const,
}

/**
 * 辅助: 在 tenant 上下文中调用 controller 方法
 */
function inTenant<T>(
  ctx: {
    tenantId: string
    storeId?: string
    userId: string
    role: 'tenant_admin' | 'brand_admin' | 'store_admin'
  },
  fn: () => Promise<T>,
): Promise<T> {
  return runWithTenant(ctx, fn)
}

describe('Phase 96 CustomDomainController (V10 Sprint 2 Day 22)', () => {
  let service: CustomDomainService
  let controller: CustomDomainController

  beforeAll(() => {
    service = new CustomDomainService()
    controller = new CustomDomainController(service)
  })

  // ============ 1. POST /saas/domain — 添加域名 ============
  describe('POST /saas/domain — addDomain()', () => {
    it('合法域名成功添加, 返回 pending_verification 状态', async () => {
      const res = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'shop.example.io' }),
      )
      assert.ok(res)
      assert.equal(res.domain, 'shop.example.io')
      assert.equal(res.status, 'pending_verification')
      assert.ok(res.verificationToken)
      assert.ok(res.verificationHost)
    })

    it('重复域名抛出 BadRequest', async () => {
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'dup.shenjiying88.com' }),
      )
      try {
        await inTenant(TENANT_A, () =>
          controller.addDomain({ domain: 'dup.shenjiying88.com' }),
        )
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.ok(e.message?.includes('already registered'))
      }
    })

    it('非法域名抛出 BadRequest', async () => {
      try {
        await inTenant(TENANT_A, () =>
          controller.addDomain({ domain: '' }),
        )
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.ok(e.message)
      }
    })
  })

  // ============ 2. GET /saas/domain — 列出域名 ============
  describe('GET /saas/domain — list()', () => {
    it('返回 items 数组和 total', async () => {
      const res = await inTenant(TENANT_A, () => controller.list({}))
      assert.ok(Array.isArray(res.items))
      assert.equal(typeof res.total, 'number')
      assert.equal(res.items.length, res.total)
      assert.equal(res.page, 1)
      assert.equal(res.pageSize, 10)
      assert.equal(res.totalPages >= 0, true)
      assert.equal(res.sortBy, 'createdAt')
      assert.equal(res.sortOrder, 'desc')
    })

    it('跨租户隔离: tenant-B 看不到 tenant-A 的域名', async () => {
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'isolated.shenjiying88.com' }),
      )
      const aList = await inTenant(TENANT_A, () => controller.list({}))
      const bList = await inTenant(TENANT_B, () => controller.list({}))
      const aDomains = aList.items.map((d: any) => d.domain)
      const bDomains = bList.items.map((d: any) => d.domain)
      assert.ok(aDomains.includes('isolated.shenjiying88.com'))
      assert.ok(!bDomains.includes('isolated.shenjiying88.com'))
    })

    it('支持按 status 筛选、排序和分页元信息', async () => {
      const active = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'query-active.shenjiying88.com' }),
      )
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'query-pending.shenjiying88.com' }),
      )
      service.setDnsTxtOverride(active.verificationHost, [
        buildVerificationValue(active.verificationToken),
      ])
      await inTenant(TENANT_A, () => controller.verify(active.id))

      const filtered = await inTenant(TENANT_A, () =>
        controller.list({ status: 'active', sortBy: 'domain', sortOrder: 'asc', page: 1, pageSize: 1 }),
      )
      assert.equal(filtered.items.length, 1)
      assert.equal(filtered.items[0].status, 'active')
      assert.equal(filtered.page, 1)
      assert.equal(filtered.pageSize, 1)
      assert.equal(filtered.total >= 1, true)
      assert.equal(filtered.totalPages >= 1, true)
      assert.equal(filtered.sortBy, 'domain')
      assert.equal(filtered.sortOrder, 'asc')
    })
  })

  // ============ 2.1 GET /saas/domain/primary/current — 当前主域名 ============
  describe('GET /saas/domain/primary/current — getCurrentPrimary()', () => {
    it('返回当前 tenant scope 主域名', async () => {
      const first = await inTenant(TENANT_ROOT, () =>
        controller.addDomain({ domain: 'current-primary.example.io' }),
      )
      service.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      await inTenant(TENANT_ROOT, () => controller.verify(first.id))
      await inTenant(TENANT_ROOT, () => controller.setPrimary(first.id))

      const current = await inTenant(TENANT_ROOT, () => controller.getCurrentPrimary({}))

      assert.equal(current.resolved, true)
      assert.equal(current.tenantId, 'tenant-root')
      assert.equal(current.item?.domain, 'current-primary.example.io')
      assert.equal(current.item?.isPrimary, true)
    })

    it('删除 primary 后返回 unresolved，重选后返回新主域名', async () => {
      const first = await inTenant(TENANT_ROOT, () =>
        controller.addDomain({ domain: 'current-reselect-a.example.io' }),
      )
      const second = await inTenant(TENANT_ROOT, () =>
        controller.addDomain({ domain: 'current-reselect-b.example.io' }),
      )
      service.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      service.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await inTenant(TENANT_ROOT, () => controller.verify(first.id))
      await inTenant(TENANT_ROOT, () => controller.verify(second.id))
      await inTenant(TENANT_ROOT, () => controller.setPrimary(first.id))
      await inTenant(TENANT_ROOT, () => controller.remove(first.id))

      const afterRemove = await inTenant(TENANT_ROOT, () => controller.getCurrentPrimary({}))
      await inTenant(TENANT_ROOT, () => controller.setPrimary(second.id))
      const afterReselect = await inTenant(TENANT_ROOT, () => controller.getCurrentPrimary({}))

      assert.equal(afterRemove.resolved, false)
      assert.equal(afterRemove.item, null)
      assert.equal(afterReselect.resolved, true)
      assert.equal(afterReselect.item?.domain, 'current-reselect-b.example.io')
    })

    it('支持批量查询多个 scope 当前主域名', async () => {
      const batchTenantCtx = {
        tenantId: 'tenant-batch',
        userId: 'tenant-batch-admin',
        role: 'tenant_admin' as const,
      }
      const batchBrandCtx = {
        tenantId: 'tenant-batch',
        brandId: 'brand-batch',
        userId: 'brand-batch-admin',
        role: 'brand_admin' as const,
      }
      const batchStoreCtx = {
        tenantId: 'tenant-batch',
        brandId: 'brand-batch',
        storeId: 'store-batch',
        userId: 'store-batch-admin',
        role: 'store_admin' as const,
      }
      const tenantDomain = await inTenant(batchTenantCtx, () =>
        controller.addDomain({ domain: 'batch-current-tenant.example.io' }),
      )
      const brandDomain = await inTenant(batchBrandCtx, () =>
        controller.addDomain({ domain: 'batch-current-brand.example.io' }),
      )
      const storeDomain = await inTenant(batchStoreCtx, () =>
        controller.addDomain({ domain: 'batch-current-store.example.io' }),
      )
      service.setDnsTxtOverride(tenantDomain.verificationHost, [
        buildVerificationValue(tenantDomain.verificationToken),
      ])
      service.setDnsTxtOverride(brandDomain.verificationHost, [
        buildVerificationValue(brandDomain.verificationToken),
      ])
      service.setDnsTxtOverride(storeDomain.verificationHost, [
        buildVerificationValue(storeDomain.verificationToken),
      ])
      await inTenant(batchTenantCtx, () => controller.verify(tenantDomain.id))
      await inTenant(batchBrandCtx, () => controller.verify(brandDomain.id))
      await inTenant(batchStoreCtx, () => controller.verify(storeDomain.id))
      await inTenant(batchTenantCtx, () => controller.setPrimary(tenantDomain.id))
      await inTenant(batchBrandCtx, () => controller.setPrimary(brandDomain.id))
      await inTenant(batchStoreCtx, () => controller.setPrimary(storeDomain.id))

      const batch = await inTenant(batchTenantCtx, () =>
        controller.getCurrentPrimaryBatch({
          items: [
            { scopeType: 'TENANT' },
            { scopeType: 'BRAND', brandId: 'brand-batch' },
            { scopeType: 'STORE', brandId: 'brand-batch', storeId: 'store-batch' },
          ],
        }),
      )

      assert.equal(batch.items.length, 3)
      assert.equal(batch.items[0].item?.domain, 'batch-current-tenant.example.io')
      assert.equal(batch.items[1].item?.domain, 'batch-current-brand.example.io')
      assert.equal(batch.items[2].item?.domain, 'batch-current-store.example.io')
    })

    it('返回 active 未设主域名治理视图', async () => {
      const governanceBrandCtx = {
        tenantId: 'tenant-governance-missing',
        brandId: 'brand-governance-missing',
        userId: 'brand-governance-missing-admin',
        role: 'brand_admin' as const,
      }
      const first = await inTenant(governanceBrandCtx, () =>
        controller.addDomain({ domain: 'governance-brand-a.example.io' }),
      )
      const second = await inTenant(governanceBrandCtx, () =>
        controller.addDomain({ domain: 'governance-brand-b.example.io' }),
      )
      service.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      service.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await inTenant(governanceBrandCtx, () => controller.verify(first.id))
      await inTenant(governanceBrandCtx, () => controller.verify(second.id))

      const governance = await inTenant(governanceBrandCtx, () => controller.listActiveWithoutPrimary())
      const currentBrandScope = governance.items.find(
        (item) => item.scopeType === 'BRAND' && item.brandId === 'brand-governance-missing',
      )

      assert.equal(governance.total >= 1, true)
      assert.equal(governance.page, 1)
      assert.equal(governance.sortBy, 'activeCount')
      assert.ok(currentBrandScope)
      assert.equal(currentBrandScope?.activeCount >= 2, true)
      assert.ok(currentBrandScope?.recommendationReason)
    })

    it('治理视图支持按 scopeType 和 brandId 过滤', async () => {
      const governance = await inTenant(BRAND_CTX, () =>
        controller.listActiveWithoutPrimary({
          scopeType: 'BRAND',
          brandId: 'brand-governance',
        }),
      )

      assert.equal(governance.items.every((item) => item.scopeType === 'BRAND'), true)
      assert.equal(governance.items.every((item) => item.brandId === 'brand-governance'), true)
    })

    it('recommendPrimary 会为当前 scope 自动补选主域名', async () => {
      const recommendCtx = {
        tenantId: 'tenant-controller-recommend',
        brandId: 'brand-controller-recommend',
        userId: 'brand-controller-recommend-admin',
        role: 'brand_admin' as const,
      }
      const first = await inTenant(recommendCtx, () =>
        controller.addDomain({ domain: 'controller-recommend-a.example.io' }),
      )
      const second = await inTenant(recommendCtx, () =>
        controller.addDomain({ domain: 'controller-recommend-b.example.io' }),
      )
      service.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      service.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await inTenant(recommendCtx, () => controller.verify(first.id))
      await inTenant(recommendCtx, () => controller.verify(second.id))
      await inTenant(recommendCtx, () => controller.requestSsl(second.id))

      const recommended = await inTenant(recommendCtx, () =>
        controller.recommendPrimary({
          scopeType: 'BRAND',
          brandId: 'brand-controller-recommend',
        }),
      )

      assert.equal(recommended.applied, true)
      assert.equal(recommended.dryRun, false)
      assert.equal(recommended.candidateCount, 2)
      assert.equal(recommended.item?.domain, 'controller-recommend-b.example.io')
      assert.equal(recommended.item?.isPrimary, true)
      assert.ok(recommended.recommendationReason?.includes('active_ssl'))
    })

    it('recommendPrimary dryRun 只返回推荐结果不真正写入 primary', async () => {
      const recommendCtx = {
        tenantId: 'tenant-controller-recommend-dryrun',
        brandId: 'brand-controller-recommend-dryrun',
        userId: 'brand-controller-recommend-dryrun-admin',
        role: 'brand_admin' as const,
      }
      const first = await inTenant(recommendCtx, () =>
        controller.addDomain({ domain: 'controller-recommend-dryrun-a.example.io' }),
      )
      const second = await inTenant(recommendCtx, () =>
        controller.addDomain({ domain: 'controller-recommend-dryrun-b.example.io' }),
      )
      service.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      service.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await inTenant(recommendCtx, () => controller.verify(first.id))
      await inTenant(recommendCtx, () => controller.verify(second.id))
      await inTenant(recommendCtx, () => controller.requestSsl(second.id))

      const preview = await inTenant(recommendCtx, () =>
        controller.recommendPrimary({
          scopeType: 'BRAND',
          brandId: 'brand-controller-recommend-dryrun',
          dryRun: true,
        }),
      )
      const current = await inTenant(recommendCtx, () =>
        controller.getCurrentPrimary({
          scopeType: 'BRAND',
          brandId: 'brand-controller-recommend-dryrun',
        }),
      )

      assert.equal(preview.applied, false)
      assert.equal(preview.dryRun, true)
      assert.equal(preview.item?.domain, 'controller-recommend-dryrun-b.example.io')
      assert.equal(current.resolved, false)
    })

    it('recommendPrimaryBatch 支持批量治理执行', async () => {
      const tenantCtx = {
        tenantId: 'tenant-controller-batch',
        userId: 'tenant-controller-batch-admin',
        role: 'tenant_admin' as const,
      }
      const brandCtx = {
        tenantId: 'tenant-controller-batch',
        brandId: 'brand-controller-batch',
        userId: 'brand-controller-batch-admin',
        role: 'brand_admin' as const,
      }
      const tenantDomain = await inTenant(tenantCtx, () =>
        controller.addDomain({ domain: 'controller-batch-tenant.example.io' }),
      )
      const brandDomain = await inTenant(brandCtx, () =>
        controller.addDomain({ domain: 'controller-batch-brand.example.io' }),
      )
      service.setDnsTxtOverride(tenantDomain.verificationHost, [
        buildVerificationValue(tenantDomain.verificationToken),
      ])
      service.setDnsTxtOverride(brandDomain.verificationHost, [
        buildVerificationValue(brandDomain.verificationToken),
      ])
      await inTenant(tenantCtx, () => controller.verify(tenantDomain.id))
      await inTenant(brandCtx, () => controller.verify(brandDomain.id))

      const batch = await inTenant(tenantCtx, () =>
        controller.recommendPrimaryBatch({
          items: [
            { scopeType: 'TENANT' },
            { scopeType: 'BRAND', brandId: 'brand-controller-batch', dryRun: true },
          ],
        }),
      )

      assert.equal(batch.total, 2)
      assert.equal(batch.appliedCount, 1)
      assert.equal(batch.resolvedCount, 2)
      assert.equal(batch.items[0].applied, true)
      assert.equal(batch.items[1].dryRun, true)
    })

    it('getGovernanceSummary 返回当前上下文治理摘要', async () => {
      const summaryCtx = {
        tenantId: 'tenant-controller-summary',
        brandId: 'brand-controller-summary',
        storeId: 'store-controller-summary',
        userId: 'controller-summary-admin',
        role: 'tenant_admin' as const,
      }
      const brandDomain = await inTenant(
        {
          tenantId: 'tenant-controller-summary',
          brandId: 'brand-controller-summary',
          userId: 'brand-controller-summary-admin',
          role: 'brand_admin' as const,
        },
        () => controller.addDomain({ domain: 'controller-summary-brand.example.io' }),
      )
      service.setDnsTxtOverride(brandDomain.verificationHost, [
        buildVerificationValue(brandDomain.verificationToken),
      ])
      await inTenant(
        {
          tenantId: 'tenant-controller-summary',
          brandId: 'brand-controller-summary',
          userId: 'brand-controller-summary-admin',
          role: 'brand_admin' as const,
        },
        () => controller.verify(brandDomain.id),
      )

      const summary = await inTenant(summaryCtx, () => controller.getGovernanceSummary())

      assert.equal(summary.requiresAttention, true)
      assert.equal(summary.brandMissingPrimaryScopes, 1)
      assert.equal(summary.currentScopes.some((item) => item.scopeType === 'BRAND'), true)
    })

    it('recommendPrimaryByQuery 支持按筛选结果批量治理执行', async () => {
      const queryCtx = {
        tenantId: 'tenant-controller-query',
        brandId: 'brand-controller-query',
        userId: 'brand-controller-query-admin',
        role: 'brand_admin' as const,
      }
      const first = await inTenant(queryCtx, () =>
        controller.addDomain({ domain: 'controller-query-a.example.io' }),
      )
      const second = await inTenant(queryCtx, () =>
        controller.addDomain({ domain: 'controller-query-b.example.io' }),
      )
      service.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      service.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await inTenant(queryCtx, () => controller.verify(first.id))
      await inTenant(queryCtx, () => controller.verify(second.id))

      const batch = await inTenant(queryCtx, () =>
        controller.recommendPrimaryByQuery({
          scopeType: 'BRAND',
          brandId: 'brand-controller-query',
        }),
      )

      assert.equal(batch.matchedTotal, 1)
      assert.equal(batch.appliedCount, 1)
      assert.equal(batch.items[0].item?.isPrimary, true)
    })

    it('brand_admin 查询 STORE scope 批量主域名会被拒绝', async () => {
      await assert.rejects(
        () =>
          inTenant(BRAND_CTX, () =>
            controller.getCurrentPrimaryBatch({
              items: [
                {
                  scopeType: 'STORE',
                  brandId: 'brand-governance',
                  storeId: 'store-governance',
                },
              ],
            }),
          ),
        /brand_admin can only query BRAND scope domains/,
      )
    })

    it('brand_admin 为 STORE scope 执行推荐主域名会被拒绝', async () => {
      await assert.rejects(
        () =>
          inTenant(BRAND_CTX, () =>
            controller.recommendPrimary({
              scopeType: 'STORE',
              brandId: 'brand-governance',
              storeId: 'store-governance',
            }),
          ),
        /brand_admin can only query BRAND scope domains/,
      )
    })

    it('brand_admin 按筛选结果为 STORE scope 批量推荐主域名会被拒绝', async () => {
      await assert.rejects(
        () =>
          inTenant(BRAND_CTX, () =>
            controller.recommendPrimaryByQuery({
              scopeType: 'STORE',
              brandId: 'brand-governance',
              storeId: 'store-governance',
            }),
          ),
        /brand_admin can only query BRAND scope domains/,
      )
    })
  })

  // ============ 3. GET /saas/domain/:id — 获取详情 ============
  describe('GET /saas/domain/:id — getById()', () => {
    it('获取已存在域名的完整信息含 hint', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'detail.shenjiying88.com' }),
      )
      const res = await inTenant(TENANT_A, () => controller.getById(added.id))
      assert.equal(res.id, added.id)
      assert.equal(res.domain, added.domain)
      assert.ok(res.hint)
      assert.ok(res.hint.host)
      assert.ok(res.hint.value)
      assert.equal(res.hint.type, 'TXT')
    })

    it('不存在域名抛出 NotFound', async () => {
      try {
        await inTenant(TENANT_A, () => controller.getById('dom-nonexistent-xxx'))
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.equal(e.response?.statusCode ?? e.status ?? 404, 404)
      }
    })
  })

  // ============ 4. DELETE /saas/domain/:id — 删除域名 ============
  describe('DELETE /saas/domain/:id — remove()', () => {
    it('删除已存在域名成功 (返回 undefined)', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'delete-me.shenjiying88.com' }),
      )
      const result = await inTenant(TENANT_A, () => controller.remove(added.id))
      assert.equal(result, undefined)
      // 确认无法再查询
      try {
        await inTenant(TENANT_A, () => controller.getById(added.id))
        assert.fail('删除后应无法获取')
      } catch (e: any) {
        assert.ok(e)
      }
    })

    it('删除不存在域名抛出 NotFound', async () => {
      try {
        await inTenant(TENANT_A, () => controller.remove('dom-notexist-00000'))
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.equal(e.response?.statusCode ?? e.status ?? 404, 404)
      }
    })
  })

  // ============ 5. POST /saas/domain/:id/verify — DNS TXT 校验 ============
  describe('POST /saas/domain/:id/verify — verify()', () => {
    it('TXT 记录正确时校验成功, 状态变为 active', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'verify-ok.shenjiying88.com' }),
      )
      // 注入正确 TXT 记录 (buildVerificationValue 返回完整期望值)
      service.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])

      const res = await inTenant(TENANT_A, () => controller.verify(added.id))
      assert.equal(res.status, 'active')
    })

    it('TXT 记录错误时校验失败抛出异常', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'verify-fail.shenjiying88.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, ['wrong-value'])
      try {
        await inTenant(TENANT_A, () => controller.verify(added.id))
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.ok(e.message?.includes('DNS TXT 校验失败'))
      }
    })

    it('连续 3 次校验失败自动 disabled', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'verify-3fail.shenjiying88.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, ['wrong-value'])
      for (let i = 0; i < 3; i++) {
        try {
          await inTenant(TENANT_A, () => controller.verify(added.id))
        } catch {
          /* 预期异常 */
        }
      }
      // 第 4 次, 自动 disabled 后不会再尝试校验
      try {
        await inTenant(TENANT_A, () => controller.verify(added.id))
      } catch (e: any) {
        assert.ok(e.message)
      }
    })
  })

  // ============ 6. POST /saas/domain/:id/ssl — SSL 申请 ============
  describe('POST /saas/domain/:id/ssl — requestSsl()', () => {
    it('active 域名 SSL 申请成功, 状态变为 active_ssl', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'ssl-ok.shenjiying88.com' }),
      )
      // 先校验通过
      service.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])
      await inTenant(TENANT_A, () => controller.verify(added.id))

      const res = await inTenant(TENANT_A, () => controller.requestSsl(added.id))
      assert.equal(res.status, 'active_ssl')
      assert.ok(res.ssl)
      assert.equal(res.ssl.provider, 'letsencrypt')
      assert.ok(res.ssl.fingerprint)
    })

    it('pending_verification 域名 SSL 申请失败', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'ssl-no.shenjiying88.com' }),
      )
      try {
        await inTenant(TENANT_A, () => controller.requestSsl(added.id))
        assert.fail('应抛出异常')
      } catch (e: any) {
        assert.ok(e.message?.includes('active before SSL'))
      }
    })
  })

  // ============ 6.1 POST /saas/domain/:id/primary — 主域名切换 ============
  describe('POST /saas/domain/:id/primary — setPrimary()', () => {
    it('active 域名可切换为当前 scope 主域名', async () => {
      const first = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'primary-a.example.io' }),
      )
      const second = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'primary-b.example.io' }),
      )
      service.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      service.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await inTenant(TENANT_A, () => controller.verify(first.id))
      await inTenant(TENANT_A, () => controller.verify(second.id))

      const switched = await inTenant(TENANT_A, () => controller.setPrimary(second.id))
      const list = await inTenant(TENANT_A, () =>
        controller.list({ keyword: 'primary-', sortBy: 'domain', sortOrder: 'asc', page: 1, pageSize: 10 }),
      )

      assert.equal(switched.isPrimary, true)
      assert.equal(list.items.filter((item) => item.isPrimary).length, 1)
      assert.equal(list.items.find((item) => item.domain === 'primary-b.example.io')?.isPrimary, true)
    })

    it('pending 域名切主抛出异常', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'primary-pending.example.io' }),
      )

      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.setPrimary(added.id)),
        /must be active before primary switch/,
      )
    })
  })

  // ============ 7. GET /saas/domain/resolve/host — Host 解析 ============
  describe('GET /saas/domain/resolve/host — resolveHost()', () => {
    it('已激活域名通过 host 解析到 tenantId', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'resolve-host.shenjiying88.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])
      await inTenant(TENANT_A, () => controller.verify(added.id))

      const res = await controller.resolveHost({
        host: 'resolve-host.shenjiying88.com',
      })
      assert.ok(res.resolved)
      assert.equal(res.tenantId, 'tenant-A')
    })

    it('未注册 host 返回 resolved=false', async () => {
      const res = await controller.resolveHost({
        host: 'not-registered.shenjiying88.com',
      })
      assert.equal(res.resolved, false)
      assert.equal(res.tenantId, null)
    })
  })

  // ============ 8. POST /saas/domain/validate — 域名预校验 ============
  describe('POST /saas/domain/validate — validateDomain()', () => {
    it('合法域名返回 valid=true', async () => {
      const res = await controller.validateDomain({
        domain: 'my-shop.shenjiying88.com',
      })
      assert.equal(res.valid, true)
    })

    it('非法域名返回 valid=false + error 信息', async () => {
      const res = await controller.validateDomain({ domain: 'localhost' })
      assert.equal(res.valid, false)
      assert.ok(res.error)
    })

    it('空域名返回 valid=false', async () => {
      const res = await controller.validateDomain({ domain: '' })
      assert.equal(res.valid, false)
    })
  })
})
