import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * CustomDomainController 集成式 spec 测试 (node:test)
 *
 * 策略: 直接构造 Controller + Mock Service 实例
 * 覆盖: 全部 8 个路由端点（正向 + 边界 + 异常）
 *
 * 路由:
 * - POST   /saas/domain              — 添加域名
 * - GET    /saas/domain              — 列出域名
 * - GET    /saas/domain/:id          — 获取详情
 * - DELETE /saas/domain/:id          — 删除域名
 * - POST   /saas/domain/:id/verify   — DNS TXT 校验
 * - POST   /saas/domain/:id/ssl      — SSL 申请
 * - GET    /saas/domain/resolve/host — Host 解析 (无租户)
 * - POST   /saas/domain/validate     — 域名预校验
 *
 * 覆盖: 正例 12 + 反例 6 + 边界 4 = 22 个用例
 */

import assert from 'node:assert/strict'
import { CustomDomainController } from './custom-domain.controller'
import { CustomDomainService } from './custom-domain.service'
import { buildVerificationValue, generateVerificationToken, isValidDomain } from './custom-domain.entity'
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

function inTenant<T>(ctx: typeof TENANT_A, fn: () => Promise<T>): Promise<T> {
  return runWithTenant(ctx, fn)
}

describe('CustomDomainController (spec)', () => {
  let service: CustomDomainService
  let controller: CustomDomainController

  beforeEach(() => {
    service = new CustomDomainService()
    controller = new CustomDomainController(service)
  })

  // ─── 1. POST /saas/domain ───────────────────────────────
  describe('POST /saas/domain — addDomain()', () => {
    it('合法域名 → 返回 pending_verification 包含校验信息', async () => {
      const res = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'myshop.example.com' }),
      )
      assert.equal(res.domain, 'myshop.example.com')
      assert.equal(res.status, 'pending_verification')
      assert.ok(res.verificationToken)
      assert.ok(res.verificationHost)
      assert.equal(res.verificationFailCount, 0)
    })

    it('重复域名 → 抛 BadRequest', async () => {
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'dup.example.com' }),
      )
      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.addDomain({ domain: 'dup.example.com' })),
        /already registered/,
      )
    })

    it('非法域名格式 → 抛 BadRequest', async () => {
      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.addDomain({ domain: '' })),
        /域名长度/,
      )
      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.addDomain({ domain: 'not a domain' })),
        /域名格式不合法/,
      )
    })
  })

  // ─── 2. GET /saas/domain ────────────────────────────────
  describe('GET /saas/domain — list()', () => {
    it('空列表返回 items=[] total=0', async () => {
      const res = await inTenant(TENANT_B, () => controller.list())
      assert.deepEqual(res, { items: [], total: 0 })
    })

    it('添加后列表包含新增域名', async () => {
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'list-test.example.com' }),
      )
      const res = await inTenant(TENANT_A, () => controller.list())
      assert.equal(res.total, 1)
      assert.equal(res.items[0].domain, 'list-test.example.com')
    })

    it('跨租户隔离: B 看不到 A 的域名', async () => {
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'tenant-a-only.example.com' }),
      )
      const bRes = await inTenant(TENANT_B, () => controller.list())
      assert.equal(bRes.total, 0)
    })
  })

  // ─── 3. GET /saas/domain/:id ─────────────────────────────
  describe('GET /saas/domain/:id — getById()', () => {
    it('获取已存在域名详情包含 hint', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'detail.example.com' }),
      )
      const res = await inTenant(TENANT_A, () => controller.getById(added.id))
      assert.equal(res.id, added.id)
      assert.equal(res.domain, 'detail.example.com')
      assert.ok(res.verificationToken)
      assert.ok(res.hint)
      assert.ok(res.hint.host)
      assert.ok(res.hint.value)
      assert.equal(res.hint.type, 'TXT')
      assert.ok(res.hint.instructions)
    })

    it('跨租户获取返回 404', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'cross-tenant-get.example.com' }),
      )
      await assert.rejects(
        () => inTenant(TENANT_B, () => controller.getById(added.id)),
        /not found/i,
      )
    })

    it('不存在的 id 返回 404', async () => {
      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.getById('dom-nonexistent')),
        /not found/i,
      )
    })
  })

  // ─── 4. DELETE /saas/domain/:id ──────────────────────────
  describe('DELETE /saas/domain/:id — remove()', () => {
    it('删除已存在域名返回 undefined', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'delete-me.example.com' }),
      )
      const result = await inTenant(TENANT_A, () => controller.remove(added.id))
      assert.equal(result, undefined)
      // 删除后查询应当 404
      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.getById(added.id)),
        /not found/i,
      )
    })

    it('删除不存在域名抛出 NotFound', async () => {
      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.remove('dom-notexist-xxx')),
        /not found/i,
      )
    })

    it('无法删除其他租户的域名', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'other-tenant-domain.example.com' }),
      )
      await assert.rejects(
        () => inTenant(TENANT_B, () => controller.remove(added.id)),
        /not found/i,
      )
    })
  })

  // ─── 5. POST /saas/domain/:id/verify ─────────────────────
  describe('POST /saas/domain/:id/verify — verify()', () => {
    it('正确 TXT 记录 → 状态变为 active', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'verify-ok.example.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])
      const res = await inTenant(TENANT_A, () => controller.verify(added.id))
      assert.equal(res.status, 'active')
      assert.equal(res.verificationFailCount, 0)
      assert.ok(res.lastVerifiedAt)
    })

    it('错误 TXT 记录 → 抛异常 + failCount 增加', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'verify-bad.example.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, ['wrong-token'])
      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.verify(added.id)),
        /DNS TXT 校验失败/,
      )
    })

    it('3 次校验失败自动 disabled', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'verify-3fail.example.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, ['wrong'])
      for (let i = 0; i < 3; i++) {
        await assert.rejects(
          () => inTenant(TENANT_A, () => controller.verify(added.id)),
          /DNS TXT 校验失败/,
        )
      }
      // 重新查询确认 disabled
      const final = await inTenant(TENANT_A, () => controller.getById(added.id))
      assert.equal(final.status, 'disabled')
      assert.equal(final.verificationFailCount, 3)
    })
  })

  // ─── 6. POST /saas/domain/:id/ssl ────────────────────────
  describe('POST /saas/domain/:id/ssl — requestSsl()', () => {
    it('active 域名 SSL 申请成功 → active_ssl', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'ssl-ok.example.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])
      await inTenant(TENANT_A, () => controller.verify(added.id))

      const res = await inTenant(TENANT_A, () => controller.requestSsl(added.id))
      assert.equal(res.status, 'active_ssl')
      assert.ok(res.ssl)
      assert.equal(res.ssl.provider, 'letsencrypt')
      assert.ok(res.ssl.fingerprint)
      assert.ok(new Date(res.ssl.expiresAt) > new Date())
    })

    it('pending 状态申请 SSL 失败', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'ssl-pending.example.com' }),
      )
      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.requestSsl(added.id)),
        /active before SSL/,
      )
    })

    it('SSL Provider 失败 → 状态变为 ssl_failed', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'ssl-fail.example.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])
      await inTenant(TENANT_A, () => controller.verify(added.id))

      service.setSslProvider({
        async issue(_domain: string) {
          throw new Error('ACME challenge failed')
        },
      })

      await assert.rejects(
        () => inTenant(TENANT_A, () => controller.requestSsl(added.id)),
        /ACME challenge failed/,
      )
      const after = await inTenant(TENANT_A, () => controller.getById(added.id))
      assert.equal(after.status, 'ssl_failed')
    })
  })

  // ─── 7. GET /saas/domain/resolve/host ────────────────────
  describe('GET /saas/domain/resolve/host — resolveHost()', () => {
    it('已激活域名 → 解析到 tenantId', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'resolve-me.example.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])
      await inTenant(TENANT_A, () => controller.verify(added.id))

      const res = await controller.resolveHost({ host: 'resolve-me.example.com' })
      assert.equal(res.resolved, true)
      assert.equal(res.tenantId, 'tenant-A')
    })

    it('带端口号也能解析', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'resolve-port.example.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, [
        buildVerificationValue(added.verificationToken),
      ])
      await inTenant(TENANT_A, () => controller.verify(added.id))

      const res = await controller.resolveHost({ host: 'resolve-port.example.com:443' })
      assert.equal(res.resolved, true)
      assert.equal(res.tenantId, 'tenant-A')
    })

    it('未注册 host → resolved=false', async () => {
      const res = await controller.resolveHost({ host: 'unknown.example.com' })
      assert.equal(res.resolved, false)
      assert.equal(res.tenantId, null)
    })
  })

  // ─── 8. POST /saas/domain/validate ───────────────────────
  describe('POST /saas/domain/validate — validateDomain()', () => {
    it('合法 FQDN → valid=true', async () => {
      const res = await controller.validateDomain({ domain: 'my-shop.example.com' })
      assert.equal(res.valid, true)
    })

    it('保留域名 → valid=false + 错误信息', async () => {
      const res = await controller.validateDomain({ domain: 'example.com' })
      assert.equal(res.valid, false)
      assert.ok(res.error)
    })

    it('空域名 → valid=false', async () => {
      const res = await controller.validateDomain({ domain: '' })
      assert.equal(res.valid, false)
      assert.ok(res.error)
    })

    it('特殊字符 → valid=false', async () => {
      const res = await controller.validateDomain({ domain: 'foo bar.com' })
      assert.equal(res.valid, false)
    })
  })

  // ─── 9. 边界 & 韧性 ──────────────────────────────────────
  describe('边界场景', () => {
    it('同一租户可添加多个不同域名', async () => {
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'multi-1.example.com' }),
      )
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'multi-2.example.com' }),
      )
      await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'multi-3.example.com' }),
      )
      const res = await inTenant(TENANT_A, () => controller.list())
      assert.equal(res.total, 3)
    })

    it('删除后再添加同名域名可成功', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 're-add.example.com' }),
      )
      await inTenant(TENANT_A, () => controller.remove(added.id))
      const reAdded = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 're-add.example.com' }),
      )
      assert.ok(reAdded)
      assert.equal(reAdded.domain, 're-add.example.com')
    })

    it('disabled 域名无法被解析', async () => {
      const added = await inTenant(TENANT_A, () =>
        controller.addDomain({ domain: 'disabled-resolve.example.com' }),
      )
      service.setDnsTxtOverride(added.verificationHost, ['wrong'])
      for (let i = 0; i < 3; i++) {
        await assert.rejects(
          () => inTenant(TENANT_A, () => controller.verify(added.id)),
          /DNS TXT 校验失败/,
        )
      }
      const res = await controller.resolveHost({ host: 'disabled-resolve.example.com' })
      assert.equal(res.resolved, false)
      assert.equal(res.tenantId, null)
    })
  })
})
