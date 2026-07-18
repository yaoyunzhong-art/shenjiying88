import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * Phase 96 自定义域名 Service 测试 (V10 Sprint 2 Day 22)
 *
 * 14 tests 覆盖:
 * - 域名格式校验 (3)
 * - addDomain CRUD (3)
 * - 跨租户隔离 (1)
 * - 重复域名 (1)
 * - DNS TXT 校验成功/失败 (2)
 * - 3 次失败自动 disabled (1)
 * - SSL 申请成功/失败 (2)
 * - Host → tenantId 解析 (1)
 */

import assert from 'node:assert/strict'
import { CustomDomainService } from './custom-domain.service'
import { DomainResolutionService } from './domain-resolution.service'
import {
  isValidDomain,
  generateVerificationToken,
  buildVerificationHost,
  buildVerificationValue,
  computeSslFingerprint,
} from './custom-domain.entity'
import { runWithTenant } from '../../common/context/tenant-context'
import { PortalService } from '../portal/portal.service'

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

// 共享 service (MemoryRepository 状态需要单例)
const SHARED_SERVICE = new CustomDomainService()

describe('Phase 96 自定义域名 (V10 Sprint 2 Day 22)', () => {
  // ============ 1. 域名格式校验 (3) ============
  describe('1. 域名格式校验', () => {
    it('合法 FQDN 通过', () => {
      assert.equal(isValidDomain('acme.shenjiying88.com').valid, true)
      assert.equal(isValidDomain('shop.shenjiying88.cn').valid, true)
      assert.equal(isValidDomain('a.b.c.d.e.io').valid, true)
    })

    it('非法域名被拒', () => {
      assert.equal(isValidDomain('').valid, false)
      assert.equal(isValidDomain('localhost').valid, false)
      assert.equal(isValidDomain('foo.localhost').valid, false)
      assert.equal(isValidDomain('not a domain').valid, false)
      assert.equal(isValidDomain('-bad.com').valid, false)
    })

    it('保留域名被拒', () => {
      assert.equal(isValidDomain('example.com').valid, false)
      assert.equal(isValidDomain('foo.example.com').valid, false)
      assert.equal(isValidDomain('test').valid, false)
    })
  })

  // ============ 2. 工具函数 (2) ============
  describe('2. 工具函数', () => {
    it('generateVerificationToken 返回 24 字符 base64url', () => {
      const t = generateVerificationToken()
      assert.equal(t.length, 24)
      assert.match(t, /^[A-Za-z0-9_-]+$/)
    })

    it('buildVerificationHost + buildVerificationValue 拼接正确', () => {
      const host = buildVerificationHost('acme.shenjiying88.com')
      assert.equal(host, '_shenjiying-verify.acme.shenjiying88.com')
      const value = buildVerificationValue('abc123')
      assert.equal(value, 'shenjiying-verify=abc123')
    })
  })

  // ============ 3. addDomain CRUD (3) ============
  describe('3. addDomain CRUD', () => {
    it('合法域名 → pending_verification 状态', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('shop-a.shenjiying88.com'),
      )
      assert.equal(m.status, 'pending_verification')
      assert.equal(m.tenantId, 'tenant-A')
      assert.equal(m.verificationToken.length, 24)
      assert.equal(m.verificationHost, '_shenjiying-verify.shop-a.shenjiying88.com')
      assert.equal(m.verificationFailCount, 0)
    })

    it('非法域名抛 BadRequest', async () => {
      await assert.rejects(
        () =>
          runWithTenant(TENANT_A, async () =>
            SHARED_SERVICE.addDomain('not a domain'),
          ),
        /域名格式不合法/,
      )
    })

    it('重复域名抛 BadRequest', async () => {
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('dupe.shenjiying88.com'),
      )
      await assert.rejects(
        () =>
          runWithTenant(TENANT_B, async () =>
            SHARED_SERVICE.addDomain('DUPE.shenjiying88.com'),
          ),
        /already registered/,
      )
    })
  })

  // ============ 4. 跨租户隔离 (1) ============
  describe('4. 跨租户隔离', () => {
    it('tenant B 无法看到 tenant A 的域名', async () => {
      // tenant A 添加
      const a = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('isolated.shenjiying88.com'),
      )
      // tenant B list 不应包含
      const bList = await runWithTenant(TENANT_B, async () => SHARED_SERVICE.list())
      const bIds = bList.map((d) => d.id)
      assert.ok(!bIds.includes(a.id))
      // tenant B getById 应 404
      await assert.rejects(
        () => runWithTenant(TENANT_B, async () => SHARED_SERVICE.getById(a.id)),
        /not found/,
      )
    })

    it('支持按状态和关键字筛选域名列表', async () => {
      const active = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('query-active.shenjiying88.com'),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('query-pending.shenjiying88.com'),
      )
      SHARED_SERVICE.setDnsTxtOverride(active.verificationHost, [
        buildVerificationValue(active.verificationToken),
      ])
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(active.id))

      const filtered = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.list({
          status: 'active',
          keyword: 'query-active',
          page: 1,
          pageSize: 10,
        }),
      )
      assert.ok(filtered.length >= 1)
      assert.ok(filtered.every((item) => item.status === 'active'))
      assert.ok(filtered.every((item) => item.domain.includes('query-active')))
    })

    it('支持按 domain 升序排序并返回真实分页元信息', async () => {
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('sort-zeta.shenjiying88.com'),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('sort-alpha.shenjiying88.com'),
      )

      const pageResult = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listPage({
          keyword: 'sort-',
          sortBy: 'domain',
          sortOrder: 'asc',
          page: 1,
          pageSize: 1,
        }),
      )

      assert.equal(pageResult.items.length, 1)
      assert.ok(pageResult.total >= 2)
      assert.equal(pageResult.totalPages >= 2, true)
      assert.equal(pageResult.hasNextPage, true)
      assert.equal(pageResult.hasPreviousPage, false)
      assert.equal(pageResult.sortBy, 'domain')
      assert.equal(pageResult.sortOrder, 'asc')
      assert.equal(pageResult.items[0].domain, 'sort-alpha.shenjiying88.com')
    })

    it('listPage 返回 total 与 items.length 解耦', async () => {
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('page-total-a.shenjiying88.com'),
      )
      await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('page-total-b.shenjiying88.com'),
      )

      const pageResult = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.listPage({
          keyword: 'page-total-',
          sortBy: 'domain',
          sortOrder: 'asc',
          page: 1,
          pageSize: 1,
        }),
      )

      assert.equal(pageResult.items.length, 1)
      assert.equal(pageResult.total >= 2, true)
      assert.equal(pageResult.items.length < pageResult.total, true)
    })
  })

  // ============ 5. DNS TXT 校验 (4) ============
  describe('5. DNS TXT 校验', () => {
    it('TXT 记录匹配 → active', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('verify-ok.shenjiying88.com'),
      )
      const expectedValue = buildVerificationValue(m.verificationToken)
      SHARED_SERVICE.setDnsTxtOverride(m.verificationHost, [expectedValue])
      const verified = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.verify(m.id),
      )
      assert.equal(verified.status, 'active')
      assert.equal(verified.verificationFailCount, 0)
      assert.ok(verified.lastVerifiedAt)
    })

    it('TXT 记录缺失 → BadRequest + failCount++', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('verify-missing.shenjiying88.com'),
      )
      SHARED_SERVICE.setDnsTxtOverride(m.verificationHost, []) // 模拟空记录
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(m.id)),
        /DNS TXT 校验失败/,
      )
      // 重新查
      const updated = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.getById(m.id),
      )
      assert.equal(updated.verificationFailCount, 1)
      assert.equal(updated.status, 'pending_verification')
    })

    it('TXT 记录错误值 → BadRequest + failCount++', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('verify-wrong.shenjiying88.com'),
      )
      SHARED_SERVICE.setDnsTxtOverride(m.verificationHost, ['shenjiying-verify=WRONG-TOKEN'])
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(m.id)),
        /DNS TXT 校验失败/,
      )
    })

    it('3 次连续失败 → 自动 disabled', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('verify-disabled.shenjiying88.com'),
      )
      SHARED_SERVICE.setDnsTxtOverride(m.verificationHost, [])
      for (let i = 0; i < 3; i++) {
        await assert.rejects(
          () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(m.id)),
          /DNS TXT 校验失败/,
        )
      }
      const final = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.getById(m.id),
      )
      assert.equal(final.status, 'disabled')
      assert.equal(final.verificationFailCount, 3)
    })
  })

  // ============ 6. SSL 申请 (3) ============
  describe('6. SSL 申请', () => {
    it('active → SSL 申请成功 → active_ssl', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('ssl-ok.shenjiying88.com'),
      )
      SHARED_SERVICE.setDnsTxtOverride(m.verificationHost, [
        buildVerificationValue(m.verificationToken),
      ])
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(m.id))

      const ssl = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.requestSsl(m.id),
      )
      assert.equal(ssl.status, 'active_ssl')
      assert.ok(ssl.ssl)
      assert.equal(ssl.ssl!.provider, 'letsencrypt')
      assert.ok(ssl.ssl!.fingerprint.length > 0)
      assert.ok(new Date(ssl.ssl!.expiresAt) > new Date())
    })

    it('pending 状态直接申请 SSL 抛错', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('ssl-pending.shenjiying88.com'),
      )
      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.requestSsl(m.id)),
        /must be active/,
      )
    })

    it('SSL Provider 抛错 → status=ssl_failed', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('ssl-fail.shenjiying88.com'),
      )
      SHARED_SERVICE.setDnsTxtOverride(m.verificationHost, [
        buildVerificationValue(m.verificationToken),
      ])
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(m.id))

      // 注入失败 SSL provider
      SHARED_SERVICE.setSslProvider({
        async issue(_domain: string) {
          throw new Error('ACME challenge failed')
        },
      })

      await assert.rejects(
        () => runWithTenant(TENANT_A, async () => SHARED_SERVICE.requestSsl(m.id)),
        /ACME challenge failed/,
      )
      const after = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.getById(m.id),
      )
      assert.equal(after.status, 'ssl_failed')
    })
  })

  // ============ 7. Host → tenantId 解析 (1) ============
  describe('7. Host 解析', () => {
    it('active 域名 → tenantId', async () => {
      const m = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('resolve-ok.shenjiying88.com'),
      )
      SHARED_SERVICE.setDnsTxtOverride(m.verificationHost, [
        buildVerificationValue(m.verificationToken),
      ])
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(m.id))

      const tenantId = SHARED_SERVICE.resolveTenantByHost('resolve-ok.shenjiying88.com')
      assert.equal(tenantId, 'tenant-A')
      // 带端口也能解析
      const tenantId2 = SHARED_SERVICE.resolveTenantByHost('resolve-ok.shenjiying88.com:443')
      assert.equal(tenantId2, 'tenant-A')
    })

    it('未知域名 → null', () => {
      const tenantId = SHARED_SERVICE.resolveTenantByHost('unknown.shenjiying88.com')
      assert.equal(tenantId, null)
    })

    it('setPrimary 后同 scope 仅保留一个 primary', async () => {
      const first = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('primary-first.shenjiying88.com'),
      )
      const second = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.addDomain('primary-second.shenjiying88.com'),
      )

      SHARED_SERVICE.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      SHARED_SERVICE.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(first.id))
      await runWithTenant(TENANT_A, async () => SHARED_SERVICE.verify(second.id))

      const switched = await runWithTenant(TENANT_A, async () => SHARED_SERVICE.setPrimary(second.id))
      const scopedList = await runWithTenant(TENANT_A, async () =>
        SHARED_SERVICE.list({
          keyword: 'primary-',
          sortBy: 'domain',
          sortOrder: 'asc',
          page: 1,
          pageSize: 10,
        }),
      )

      assert.equal(switched.isPrimary, true)
      assert.equal(scopedList.filter((item) => item.isPrimary).length, 1)
      assert.equal(
        scopedList.find((item) => item.domain === 'primary-second.shenjiying88.com')?.isPrimary,
        true,
      )
      assert.equal(
        scopedList.find((item) => item.domain === 'primary-first.shenjiying88.com')?.isPrimary,
        false,
      )
    })

    it('删除当前 primary 后清理解析索引并回退平台默认域名', async () => {
      const domainResolution = new DomainResolutionService()
      const isolatedService = new CustomDomainService(undefined, domainResolution)
      const portalService = new PortalService(
        {
          getMergedProfile: () => ({
            marketCode: 'cn-mainland',
            marketName: '中国大陆',
            locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
            timezone: { timezone: 'Asia/Shanghai' },
            currency: { currencyCode: 'CNY', symbol: '¥' },
            tax: { taxMode: 'INCLUDED', taxRate: 13, taxLabel: '增值税' },
            network: {
              networkRegion: 'CHINA_MAINLAND',
              apiBaseUrl: 'https://cn-api.m5.local',
              cdnBaseUrl: 'https://cn-cdn.m5.local',
              callbackBaseUrl: 'https://cn-hooks.m5.local',
            },
            email: {
              provider: 'SMTP',
              fromName: 'M5 CN',
              fromAddress: 'hello@cn.local',
              replyTo: 'support@cn.local',
            },
            social: { primaryPlatforms: ['WECHAT'], supportPlatforms: ['WECHAT'] },
          }),
          getOverrides: () => [],
        } as any,
        { getDependencySummary: () => ({ dependsOn: [], handoffContracts: [] }) } as any,
        undefined,
        domainResolution,
      )

      const added = await runWithTenant(TENANT_A, async () =>
        isolatedService.addDomain('fallback-primary.shenjiying88.com'),
      )
      isolatedService.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])
      await runWithTenant(TENANT_A, async () => isolatedService.verify(added.id))
      await runWithTenant(TENANT_A, async () => isolatedService.setPrimary(added.id))
      await runWithTenant(TENANT_A, async () => isolatedService.remove(added.id))

      assert.equal(
        domainResolution.findPrimaryDomain({
          scopeType: 'TENANT',
          tenantId: 'tenant-A',
        }),
        null,
      )
      assert.equal(isolatedService.resolveTenantByHost('fallback-primary.shenjiying88.com'), null)
      assert.equal(
        portalService.resolveTenantPortal({
          tenantId: 'tenant-A',
          marketCode: 'cn-mainland',
        }).primaryDomain,
        'tenant-A.cn-mainland.b2b.local',
      )
    })

    it('连续三次校验失败转 disabled 后不会残留解析结果', async () => {
      const domainResolution = new DomainResolutionService()
      const isolatedService = new CustomDomainService(undefined, domainResolution)
      const added = await runWithTenant(TENANT_A, async () =>
        isolatedService.addDomain('disabled-fallback.shenjiying88.com'),
      )

      for (let i = 0; i < 3; i += 1) {
        await assert.rejects(
          () => runWithTenant(TENANT_A, async () => isolatedService.verify(added.id)),
          /DNS TXT 校验失败/,
        )
      }

      const updated = await runWithTenant(TENANT_A, async () => isolatedService.getById(added.id))
      assert.equal(updated.status, 'disabled')
      assert.equal(isolatedService.resolveTenantByHost('disabled-fallback.shenjiying88.com'), null)
      assert.equal(
        domainResolution.findPrimaryDomain({
          scopeType: 'TENANT',
          tenantId: 'tenant-A',
        }),
        null,
      )
    })

    it('getCurrentPrimary 可返回当前 tenant scope 主域名，并支持删除后重选', async () => {
      const first = await runWithTenant(TENANT_ROOT, async () =>
        SHARED_SERVICE.addDomain('reselect-first.shenjiying88.com'),
      )
      const second = await runWithTenant(TENANT_ROOT, async () =>
        SHARED_SERVICE.addDomain('reselect-second.shenjiying88.com'),
      )
      SHARED_SERVICE.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      SHARED_SERVICE.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await runWithTenant(TENANT_ROOT, async () => SHARED_SERVICE.verify(first.id))
      await runWithTenant(TENANT_ROOT, async () => SHARED_SERVICE.verify(second.id))
      await runWithTenant(TENANT_ROOT, async () => SHARED_SERVICE.setPrimary(first.id))

      const initial = await runWithTenant(TENANT_ROOT, async () => SHARED_SERVICE.getCurrentPrimary())
      await runWithTenant(TENANT_ROOT, async () => SHARED_SERVICE.remove(first.id))
      const afterRemove = await runWithTenant(TENANT_ROOT, async () => SHARED_SERVICE.getCurrentPrimary())
      await runWithTenant(TENANT_ROOT, async () => SHARED_SERVICE.setPrimary(second.id))
      const afterReselect = await runWithTenant(TENANT_ROOT, async () => SHARED_SERVICE.getCurrentPrimary())

      assert.equal(initial?.domain, 'reselect-first.shenjiying88.com')
      assert.equal(afterRemove, null)
      assert.equal(afterReselect?.domain, 'reselect-second.shenjiying88.com')
      assert.equal(afterReselect?.isPrimary, true)
    })

    it('getCurrentPrimaryBatch 支持批量返回 tenant/brand/store 当前主域名', async () => {
      const isolatedService = new CustomDomainService()
      const tenantDomain = await runWithTenant(TENANT_ROOT, async () =>
        isolatedService.addDomain('batch-tenant.example.io'),
      )
      const brandDomain = await runWithTenant(BRAND_CTX, async () =>
        isolatedService.addDomain('batch-brand.example.io'),
      )
      const storeDomain = await runWithTenant(STORE_CTX, async () =>
        isolatedService.addDomain('batch-store.example.io'),
      )

      isolatedService.setDnsTxtOverride(tenantDomain.verificationHost, [
        buildVerificationValue(tenantDomain.verificationToken),
      ])
      isolatedService.setDnsTxtOverride(brandDomain.verificationHost, [
        buildVerificationValue(brandDomain.verificationToken),
      ])
      isolatedService.setDnsTxtOverride(storeDomain.verificationHost, [
        buildVerificationValue(storeDomain.verificationToken),
      ])

      await runWithTenant(TENANT_ROOT, async () => isolatedService.verify(tenantDomain.id))
      await runWithTenant(BRAND_CTX, async () => isolatedService.verify(brandDomain.id))
      await runWithTenant(STORE_CTX, async () => isolatedService.verify(storeDomain.id))
      await runWithTenant(TENANT_ROOT, async () => isolatedService.setPrimary(tenantDomain.id))
      await runWithTenant(BRAND_CTX, async () => isolatedService.setPrimary(brandDomain.id))
      await runWithTenant(STORE_CTX, async () => isolatedService.setPrimary(storeDomain.id))

      const batch = await runWithTenant(TENANT_ROOT, async () =>
        isolatedService.getCurrentPrimaryBatch([
          { scopeType: 'TENANT' },
          { scopeType: 'BRAND', brandId: 'brand-governance' },
          { scopeType: 'STORE', brandId: 'brand-governance', storeId: 'store-governance' },
        ]),
      )

      assert.equal(batch.length, 3)
      assert.equal(batch[0].item?.domain, 'batch-tenant.example.io')
      assert.equal(batch[1].item?.domain, 'batch-brand.example.io')
      assert.equal(batch[2].item?.domain, 'batch-store.example.io')
    })

    it('listActiveWithoutPrimary 返回 active 但未设主域名的治理视图', async () => {
      const isolatedService = new CustomDomainService()
      const first = await runWithTenant(BRAND_CTX, async () =>
        isolatedService.addDomain('governance-a.example.io'),
      )
      const second = await runWithTenant(BRAND_CTX, async () =>
        isolatedService.addDomain('governance-b.example.io'),
      )
      isolatedService.setDnsTxtOverride(first.verificationHost, [
        buildVerificationValue(first.verificationToken),
      ])
      isolatedService.setDnsTxtOverride(second.verificationHost, [
        buildVerificationValue(second.verificationToken),
      ])
      await runWithTenant(BRAND_CTX, async () => isolatedService.verify(first.id))
      await runWithTenant(BRAND_CTX, async () => isolatedService.verify(second.id))

      const governance = await runWithTenant(BRAND_CTX, async () =>
        isolatedService.listActiveWithoutPrimary(),
      )

      assert.equal(governance.length, 1)
      assert.equal(governance[0].scopeType, 'BRAND')
      assert.equal(governance[0].activeCount, 2)
      assert.deepEqual(
        governance[0].candidateDomains.map((item) => item.domain).sort(),
        ['governance-a.example.io', 'governance-b.example.io'],
      )
    })

    it('brand_admin 不可查询 STORE scope 当前主域名', async () => {
      const isolatedService = new CustomDomainService()

      await assert.rejects(
        () =>
          runWithTenant(BRAND_CTX, async () =>
            isolatedService.getCurrentPrimary({
              scopeType: 'STORE',
              brandId: 'brand-governance',
              storeId: 'store-governance',
            }),
          ),
        /brand_admin can only query BRAND scope domains/,
      )
    })

    it('store_admin 的治理视图只返回当前 store scope', async () => {
      const isolatedService = new CustomDomainService()
      const visible = await runWithTenant(STORE_CTX, async () =>
        isolatedService.addDomain('store-visible.example.io'),
      )
      const invisible = await runWithTenant(
        {
          tenantId: 'tenant-governance',
          brandId: 'brand-governance',
          storeId: 'store-other',
          userId: 'store-other-admin',
          role: 'store_admin' as const,
        },
        async () => isolatedService.addDomain('store-hidden.example.io'),
      )
      isolatedService.setDnsTxtOverride(visible.verificationHost, [
        buildVerificationValue(visible.verificationToken),
      ])
      isolatedService.setDnsTxtOverride(invisible.verificationHost, [
        buildVerificationValue(invisible.verificationToken),
      ])
      await runWithTenant(STORE_CTX, async () => isolatedService.verify(visible.id))
      await runWithTenant(
        {
          tenantId: 'tenant-governance',
          brandId: 'brand-governance',
          storeId: 'store-other',
          userId: 'store-other-admin',
          role: 'store_admin' as const,
        },
        async () => isolatedService.verify(invisible.id),
      )

      const governance = await runWithTenant(STORE_CTX, async () =>
        isolatedService.listActiveWithoutPrimary(),
      )

      assert.equal(governance.length, 1)
      assert.equal(governance[0].storeId, 'store-governance')
      assert.equal(governance[0].candidateDomains[0].domain, 'store-visible.example.io')
    })
  })

  // ============ 8. SSL 指纹工具 (1) ============
  describe('8. SSL 指纹工具', () => {
    it('computeSslFingerprint 提取 PEM body', () => {
      const pem = '-----BEGIN CERTIFICATE-----\nABCD1234\n-----END CERTIFICATE-----'
      const fp = computeSslFingerprint(pem)
      assert.ok(fp.length > 0)
      // 应包含 ABCD1234 的 base64
      assert.ok(fp.includes('QUJD'))
    })
  })
})
