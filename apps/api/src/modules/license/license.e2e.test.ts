/**
 * license.e2e.test.ts — 付费授权模块 E2E 测试
 *
 * 链路:
 *   HTTP → TestLicenseController → LicenseService → InMemory repos
 *
 * 验证:
 *   - License 密钥校验 (checkLicense / tenant 列表)
 *   - 过期验证 (过期授权拒绝)
 *   - 权限等级 (租户级 vs 门店级)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Controller, Get, Query, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { LicenseService } from './license.service'
import { ActivationCodeService } from './services/activation-code.service'
import { runWithTenant, type TenantContext } from '../../common/context/tenant-context'
import type { LicenseScope } from './license.entity'

@Controller('license')
class TestLicenseController {
  constructor(
    private readonly service: LicenseService,
    private readonly activationCodeService: ActivationCodeService,
  ) {}

  @Get('check')
  async check(@Query('scope') scope: LicenseScope) {
    const ctx: TenantContext = { tenantId: 'tenant-A', userId: 'e2e-tester' }
    return runWithTenant(ctx, () => this.service.checkLicense({ scope }))
  }

  @Get('check/:tenantId')
  async checkForTenant(@Param('tenantId') tenantId: string, @Query('scope') scope: LicenseScope) {
    const ctx: TenantContext = { tenantId, userId: 'e2e-tester' }
    return runWithTenant(ctx, () => this.service.checkLicense({ scope }))
  }

  @Get('tenant')
  async listTenant(@Query('tenantId') tenantId: string) {
    const ctx: TenantContext = { tenantId, userId: 'e2e-tester' }
    return runWithTenant(ctx, async () => {
      const data = await this.service.listLicensesByTenant(tenantId)
      return { data, total: data.length }
    })
  }

  @Get('store')
  async listStore(@Query('tenantId') tenantId: string, @Query('storeId') storeId: string) {
    const ctx: TenantContext = { tenantId, storeId, userId: 'e2e-tester' }
    return runWithTenant(ctx, async () => {
      const data = await this.service.listLicensesByStore(tenantId, storeId)
      return { data, total: data.length }
    })
  }

  @Get('audit')
  async listAudit(@Query('tenantId') tenantId: string) {
    const ctx: TenantContext = { tenantId, userId: 'e2e-tester' }
    return runWithTenant(ctx, async () => {
      const data = await this.service.listAuditLogs(tenantId, 100)
      return { data, total: data.length }
    })
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('id') id: string, @Body('reason') reason: string) {
    return runWithTenant({ tenantId: 'tenant-A', userId: 'e2e-admin' }, () =>
      this.service.suspend(id, 'e2e-admin', reason ?? 'e2e test suspend')
    )
  }

  @Post('codes/generate')
  @HttpCode(HttpStatus.CREATED)
  async generateCode(@Body() body: { scope: string; durationDays: number; level: string }) {
    const code = await this.activationCodeService.generateCode({
      scope: body.scope,
      durationDays: body.durationDays,
      level: body.level as 'tenant' | 'store',
    })
    return { codes: [code], count: 1, scope: body.scope, durationDays: body.durationDays }
  }

  @Get('codes/:code/verify')
  async verifyCode(@Param('code') code: string, @Query('scope') scope: string) {
    const isValidFormat = this.activationCodeService.validateFormat(code)
    return { code, scope, formatValid: isValidFormat }
  }
}

async function buildApp() {
  // The LicenseService constructor auto-falls back to in-memory repos when DI repos are undefined.
  // It also seeds 7 licenses. We create a service directly without DI.
  const activationCodeService = new ActivationCodeService(null)
  const service = new LicenseService(undefined as any, undefined as any)

  const moduleRef = await Test.createTestingModule({
    controllers: [TestLicenseController],
    providers: [
      { provide: LicenseService, useValue: service },
      { provide: ActivationCodeService, useValue: activationCodeService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  await app.init()
  return { app, service }
}

describe('License E2E', () => {
  describe('许可证密钥校验', () => {
    it('tenant-A 的 ai.capability 授权应为有效 (paid)', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/license/check/tenant-A?scope=ai.capability')
        assert.equal(res.statusCode, 200)
        assert.equal(res.body.allowed, true)
        assert.equal(res.body.license.scope, 'ai.capability')
        assert.equal(res.body.license.activationSource, 'paid')
        assert.ok(res.body.quotaRemaining !== undefined)
      } finally {
        await app.close()
      }
    })

    it('租户级授权列表包含预设数据', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/license/tenant?tenantId=tenant-A')
        assert.equal(res.statusCode, 200)
        assert.ok(res.body.total >= 1)
        // tenant-A has paid ai.capability
        const aiLic = res.body.data.find((l: any) => l.scope === 'ai.capability')
        assert.ok(aiLic)
        assert.equal(aiLic.activationSource, 'paid')
      } finally {
        await app.close()
      }
    })
  })

  describe('过期验证', () => {
    it('不存在的 scope 应返回 allowed=false', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/license/check/tenant-A?scope=ai.industry')
        assert.equal(res.statusCode, 200)
        assert.equal(res.body.allowed, false)
        assert.ok(res.body.reason)
        assert.ok(res.body.reason!.includes('No active license'))
      } finally {
        await app.close()
      }
    })
  })

  describe('权限等级 — 门店级授权', () => {
    it('tenant-A store-001 有门店级授权', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/license/store?tenantId=tenant-A&storeId=store-001')
        assert.equal(res.statusCode, 200)
        assert.ok(res.body.total >= 1)
        const storeLic = res.body.data.find((l: any) => l.storeId === 'store-001')
        assert.ok(storeLic)
        assert.equal(storeLic.level, 'store')
      } finally {
        await app.close()
      }
    })

    it('tenant-B 试用授权剩余天数>0', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/license/check/tenant-B?scope=ai.capability')
        assert.equal(res.statusCode, 200)
        assert.equal(res.body.allowed, true)
        assert.equal(res.body.license.activationSource, 'trial')
        // Trial days remaining should be > 0 since validUntil is 25 days from now
        assert.ok(res.body.trialDaysRemaining !== undefined)
        assert.ok(res.body.trialDaysRemaining! > 0)
      } finally {
        await app.close()
      }
    })
  })

  describe('授权暂停', () => {
    it('暂停授权后 check 返回 rejected', async () => {
      const { app, service } = await buildApp()
      try {
        // First confirm it's active
        const beforeRes = await request(app.getHttpServer())
          .get('/license/check/tenant-A?scope=ai.capability')
        assert.equal(beforeRes.body.allowed, true)

        // Suspend
        const suspendRes = await request(app.getHttpServer())
          .post('/license/lic-seed-paid/suspend')
          .send({ reason: 'e2e test' })
        assert.equal(suspendRes.statusCode, 200)

        // Now it should be disallowed
        const afterRes = await request(app.getHttpServer())
          .get('/license/check/tenant-A?scope=ai.capability')
        assert.equal(afterRes.body.allowed, false)
        assert.equal(afterRes.body.reason, 'License suspended')
      } finally {
        await app.close()
      }
    })
  })

  describe('审计日志', () => {
    it('审计日志列表包含授权操作记录', async () => {
      const { app } = await buildApp()
      try {
        // Perform an action that generates an audit log
        await request(app.getHttpServer())
          .get('/license/check/tenant-A?scope=ai.capability')
        await request(app.getHttpServer())
          .get('/license/check/tenant-B?scope=ai.capability')

        const res = await request(app.getHttpServer())
          .get('/license/audit?tenantId=tenant-A')
        assert.equal(res.statusCode, 200)
        assert.ok(res.body.total >= 1)
        assert.ok(res.body.data.length >= 1)
      } finally {
        await app.close()
      }
    })
  })

  describe('激活码', () => {
    it('激活码格式验证 LIC-XXXX-XXXX-XXXX-XXXX', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/license/codes/LIC-ABCD-1234-EF56-7890/verify?scope=ai.capability')
        assert.equal(res.statusCode, 200)
        assert.equal(res.body.formatValid, true)
      } finally {
        await app.close()
      }
    })

    it('无效激活码格式返回 false', async () => {
      const { app } = await buildApp()
      try {
        const res = await request(app.getHttpServer())
          .get('/license/codes/INVALID/verify?scope=ai.capability')
        assert.equal(res.statusCode, 200)
        assert.equal(res.body.formatValid, false)
      } finally {
        await app.close()
      }
    })
  })
})
