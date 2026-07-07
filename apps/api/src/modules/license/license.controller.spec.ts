import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 付费授权 - Controller 测试 (V10 适配真实 Controller API)
 *
 * 覆盖: check / listTenantLicenses / listStoreLicenses / listAudit / suspend
 *       activate / generateActivationCode / verifyActivationCode
 * 正例 + 反例 + 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { LicenseController } from './license.controller'
import { LicenseService } from './license.service'
import { ActivationCodeService } from './services/activation-code.service'

// ── Mocks ──

function createMockLicenseService(overrides: Record<string, any> = {}) {
  return {
    checkLicense: overrides.checkLicense ?? (async () => ({ valid: true, scope: 'ai.capability' })),
    listLicensesByTenant: overrides.listLicensesByTenant ?? (async () => [{ id: 'lic-1' }]),
    listLicensesByStore: overrides.listLicensesByStore ?? (async () => [{ id: 'lic-2' }]),
    listAuditLogs: overrides.listAuditLogs ?? (async () => [{ action: 'create' }]),
    suspend: overrides.suspend ?? (async (id: string) => ({ id, status: 'suspended' })),
  } as unknown as LicenseService
}

function createMockActivationCodeService(overrides: Record<string, any> = {}) {
  return {
    generateCode: overrides.generateCode ?? (async () => 'LIC-NEW-CODE'),
    verifyAndActivate: overrides.verifyAndActivate ?? (async () => ({
      success: true, licenseId: 'lic-new-1', message: 'ok', expiresAt: new Date('2027-01-01'),
    })),
    validateFormat: overrides.validateFormat ?? (() => true),
  } as unknown as ActivationCodeService
}

const makeReq = (overrides: any = {}) => ({
  user: { tenantId: 'tenant-123', id: 'user-456', role: 'tenant_admin', ...overrides },
  headers: {},
})

// ── Tests ──

describe('LicenseController (spec)', () => {
  // ============ check ============
  describe('check()', () => {
    it('正例: 返回授权校验结果', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const result = await ctrl.check(makeReq() as any, 'ai.capability' as any, 'store-1')
      assert.ok(result)
      assert.equal((result as any).valid, true)
    })

    it('反例: 缺少 tenantId 抛错', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      await assert.rejects(
        () => ctrl.check({ user: {} } as any, 'ai.capability' as any),
        /Missing tenantId/,
      )
    })
  })

  // ============ listTenantLicenses ============
  describe('listTenantLicenses()', () => {
    it('正例: 返回租户授权列表', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const result = await ctrl.listTenantLicenses(makeReq() as any)
      assert.ok(Array.isArray(result.data))
      assert.equal(result.data.length, 1)
    })
  })

  // ============ listStoreLicenses ============
  describe('listStoreLicenses()', () => {
    it('正例: 返回门店授权列表', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const result = await ctrl.listStoreLicenses(makeReq() as any, 'store-1')
      assert.ok(Array.isArray(result.data))
    })
  })

  // ============ listAudit ============
  describe('listAudit()', () => {
    it('正例: 返回审计日志', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const result = await ctrl.listAudit(makeReq() as any, '50')
      assert.ok(Array.isArray(result.data))
    })

    it('边界: limit 上限为 500', async () => {
      let capturedLimit = 0
      const ctrl = new LicenseController(
        createMockLicenseService({
          listAuditLogs: async (_tenantId: string, limit: number) => {
            capturedLimit = limit
            return []
          },
        }),
        createMockActivationCodeService(),
      )
      await ctrl.listAudit(makeReq() as any, '1000')
      assert.equal(capturedLimit, 500)
    })
  })

  // ============ suspend ============
  describe('suspend()', () => {
    it('正例: 暂停授权成功', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const result = await ctrl.suspend(makeReq() as any, 'lic-1', 'violation')
      assert.equal((result as any).data.status, 'suspended')
    })

    it('反例: 授权不存在抛错', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService({
          suspend: async () => { throw new Error('Not found') },
        }),
        createMockActivationCodeService(),
      )
      await assert.rejects(
        () => ctrl.suspend(makeReq() as any, 'invalid-id', 'test'),
        /Not found/,
      )
    })
  })

  // ============ activate ============
  describe('activate()', () => {
    it('正例: 有效激活码激活成功', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const result = await ctrl.activate(makeReq() as any, 'LIC-ABCD', 'ai.capability' as any, 'store-1')
      assert.equal(result.success, true)
      assert.equal(result.licenseId, 'lic-new-1')
    })

    it('反例: 过期激活码抛 ForbiddenException', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService({
          verifyAndActivate: async () => ({ success: false, message: '激活码已过期' }),
        }),
      )
      await assert.rejects(
        () => ctrl.activate(makeReq() as any, 'LIC-EXPIRED', 'ai.capability' as any),
      )
    })
  })

  // ============ generateActivationCode ============
  describe('generateActivationCode()', () => {
    it('正例: 管理员生成激活码', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const req = makeReq({ role: 'admin' })
      const body = { scope: 'ai.capability', durationDays: 365, level: 'tenant' as const, quota: 100, count: 2 }
      const result = await ctrl.generateActivationCode(req as any, body)
      assert.equal(result.codes.length, 2)
    })

    it('反例: 非管理员拒绝生成', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const body = { scope: 'ai.capability', durationDays: 365, level: 'tenant' as const }
      await assert.rejects(
        () => ctrl.generateActivationCode(makeReq() as any, body),
      )
    })
  })

  // ============ verifyActivationCode ============
  describe('verifyActivationCode()', () => {
    it('正例: 格式正确返回 formatValid=true', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService(),
      )
      const result = await ctrl.verifyActivationCode('LIC-ABCD-1234', 'ai.capability')
      assert.equal(result.formatValid, true)
    })

    it('反例: 格式错误返回 formatValid=false', async () => {
      const ctrl = new LicenseController(
        createMockLicenseService(),
        createMockActivationCodeService({
          validateFormat: () => false,
        }),
      )
      const result = await ctrl.verifyActivationCode('BAD-CODE', 'ai.capability')
      assert.equal(result.formatValid, false)
    })
  })
})
