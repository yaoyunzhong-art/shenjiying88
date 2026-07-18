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
import {
  isValidDomain,
  generateVerificationToken,
  buildVerificationHost,
  buildVerificationValue,
  computeSslFingerprint,
} from './custom-domain.entity'
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
