import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: Foundation / Identity-Access 身份授权 HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → IdentityAccessService
 *
 * 验证:
 *   - resolveActorContext 把 actor + tenant 合并
 *   - hasAnyRole / hasAllPermissions 判定
 *   - isPrivilegedActor 判定 (platform-admin / super-admin / tenant:*)
 *   - validateTenantScope 按 tenant/brand/store 校验
 *   - authorizeAction 输出 allowed/denied 决策
 *   - getDescriptor 暴露模块描述
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { NextFunction, Request, Response } from 'express'
import { ResponseInterceptor } from '../../../common/interceptors/response.interceptor'
import { IdentityAccessService } from './identity-access.service'
import type { RequestActorContext, TenantAwareRequest } from '../../tenant/tenant.types'

function attachTenantContext(req: Request, _res: Response, next: NextFunction) {
  const ctx = req as unknown as TenantAwareRequest
  ctx.tenantContext = {
    tenantId: (req.header('x-tenant-id') as string | undefined) ?? 'tenant-001',
    brandId: (req.header('x-brand-id') as string | undefined) ?? 'brand-001',
    storeId: (req.header('x-store-id') as string | undefined) ?? 'store-001',
    marketCode: (req.header('x-market-code') as string | undefined) ?? 'cn-mainland'
  }
  const actorId = req.header('x-actor-id') as string | undefined
  if (actorId) {
    ctx.actorContext = {
      actorId,
      actorType: 'user',
      actorName: req.header('x-actor-name') ?? actorId,
      tenantId: ctx.tenantContext.tenantId,
      brandId: ctx.tenantContext.brandId,
      storeId: ctx.tenantContext.storeId,
      roles: (req.header('x-actor-roles') ?? '').split(',').filter(Boolean),
      permissions: (req.header('x-actor-permissions') ?? '').split(',').filter(Boolean),
      authenticated: true
    } as unknown as RequestActorContext
  }
  next()
}

@Controller('foundation/identity-access')
class TestIdentityAccessController {
  constructor(
    @Inject(IdentityAccessService) private readonly identityAccess: IdentityAccessService
  ) {}

  @Get('resolve')
  resolve(@Req() req: TenantAwareRequest) {
    return this.identityAccess.resolveActorContext(req.tenantContext, req.actorContext)
  }

  @Post('has-role')
  hasRole(@Req() req: TenantAwareRequest, @Body() body: { roles: string[] }) {
    return {
      result: this.identityAccess.hasAnyRole(req.actorContext, body.roles)
    }
  }

  @Post('has-permissions')
  hasPerms(@Req() req: TenantAwareRequest, @Body() body: { permissions: string[] }) {
    return {
      result: this.identityAccess.hasAllPermissions(req.actorContext, body.permissions)
    }
  }

  @Get('is-privileged')
  isPrivileged(@Req() req: TenantAwareRequest) {
    return {
      result: this.identityAccess.isPrivilegedActor(req.actorContext)
    }
  }

  @Post('validate-tenant-scope')
  validateScope(@Req() req: TenantAwareRequest, @Body() body: { tenantId?: string; brandId?: string; storeId?: string }) {
    return {
      result: this.identityAccess.validateTenantScope(req.tenantContext, req.actorContext, body)
    }
  }

  @Post('authorize')
  authorize(
    @Req() req: TenantAwareRequest,
    @Body() body: { action: string; resourceScope: Record<string, string | undefined> }
  ) {
    return this.identityAccess.authorizeAction(body.action, body.resourceScope, req.tenantContext, req.actorContext)
  }

  @Get('descriptor')
  descriptor() {
    return this.identityAccess.getDescriptor()
  }
}

async function buildApp() {
  const identityAccess = new IdentityAccessService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestIdentityAccessController],
    providers: [{ provide: IdentityAccessService, useValue: identityAccess }]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.use(attachTenantContext)
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, identityAccess }
}

it('e2e: resolve actor context without actor header returns authenticated: false', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/foundation/identity-access/resolve')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.authenticated, false)
    assert.equal(res.body.data.actor, null)
    assert.equal(res.body.data.effectiveTenantId, 'tenant-001')
  } finally {
    await app.close()
  }
})

it('e2e: resolve actor context with actor header returns authenticated: true', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/resolve')
      .set('x-actor-id', 'op-1')
      .set('x-actor-roles', 'operator,auditor')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.authenticated, true)
    assert.equal(res.body.data.actor.actorId, 'op-1')
    assert.deepEqual(res.body.data.roles, ['operator', 'auditor'])
  } finally {
    await app.close()
  }
})

it('e2e: hasAnyRole returns true when actor has matching role', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-role')
      .set('x-actor-id', 'op-2')
      .set('x-actor-roles', 'operator')
      .send({ roles: ['admin', 'operator'] })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: hasAnyRole returns false when actor has no matching role', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-role')
      .set('x-actor-id', 'op-3')
      .set('x-actor-roles', 'operator')
      .send({ roles: ['admin', 'super'] })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: hasAnyRole returns false when no actor', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-role')
      .send({ roles: ['admin'] })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: hasAllPermissions honors wildcard * permission', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-permissions')
      .set('x-actor-id', 'op-4')
      .set('x-actor-permissions', '*')
      .send({ permissions: ['refund:approve', 'order:cancel'] })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: hasAllPermissions returns false when one permission missing', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-permissions')
      .set('x-actor-id', 'op-5')
      .set('x-actor-permissions', 'refund:approve')
      .send({ permissions: ['refund:approve', 'order:cancel'] })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: isPrivilegedActor true for platform-admin', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/is-privileged')
      .set('x-actor-id', 'admin-1')
      .set('x-actor-roles', 'platform-admin')
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: isPrivilegedActor true for super-admin', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/is-privileged')
      .set('x-actor-id', 'sa-1')
      .set('x-actor-roles', 'super-admin')
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: isPrivilegedActor true for tenant:* permission', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/is-privileged')
      .set('x-actor-id', 'cross-1')
      .set('x-actor-permissions', 'tenant:*')
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: isPrivilegedActor false for regular operator', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/is-privileged')
      .set('x-actor-id', 'op-6')
      .set('x-actor-roles', 'operator')
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: validateTenantScope matches when tenant/brand/store align', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/validate-tenant-scope')
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .set('x-store-id', 'store-001')
      .send({ tenantId: 'tenant-001', brandId: 'brand-001', storeId: 'store-001' })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: validateTenantScope fails when store mismatches', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/validate-tenant-scope')
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .set('x-store-id', 'store-001')
      .send({ tenantId: 'tenant-001', storeId: 'store-other' })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e: validateTenantScope succeeds for privileged actor regardless of scope', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/validate-tenant-scope')
      .set('x-actor-id', 'admin-2')
      .set('x-actor-roles', 'platform-admin')
      .send({ tenantId: 'tenant-XXX', brandId: 'brand-XXX' })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e: authorizeAction returns allowed when both permission and scope match', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'op-7')
      .set('x-actor-permissions', 'refund:approve')
      .set('x-tenant-id', 'tenant-001')
      .send({
        action: 'refund:approve',
        resourceScope: { tenantId: 'tenant-001' }
      })
    assert.equal(res.body.data.status, 'allowed')
    assert.equal(res.body.data.permissionMatched, true)
    assert.equal(res.body.data.tenantScopeMatched, true)
  } finally {
    await app.close()
  }
})

it('e2e: authorizeAction returns denied when permission missing', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'op-8')
      .set('x-actor-permissions', 'order:view')
      .send({
        action: 'refund:approve',
        resourceScope: { tenantId: 'tenant-001' }
      })
    assert.equal(res.body.data.status, 'denied')
  } finally {
    await app.close()
  }
})

it('e2e: authorizeAction denied when scope mismatches for non-privileged actor', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'op-9')
      .set('x-actor-permissions', 'refund:approve')
      .set('x-tenant-id', 'tenant-001')
      .send({
        action: 'refund:approve',
        resourceScope: { tenantId: 'tenant-other' }
      })
    assert.equal(res.body.data.status, 'denied')
  } finally {
    await app.close()
  }
})

it('e2e: getDescriptor returns module key and capabilities', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/foundation/identity-access/descriptor')
    assert.equal(res.statusCode, 200)
    assert.equal(res.body.data.key, 'identity-access')
    assert.ok(Array.isArray(res.body.data.capabilities))
    assert.ok(res.body.data.capabilities.length >= 3)
  } finally {
    await app.close()
  }
})

it('e2e: resolve actor context with no actor header defaults effectiveTenantId to header', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/resolve')
      .set('x-tenant-id', 'tenant-999')
    assert.equal(res.body.data.effectiveTenantId, 'tenant-999')
    assert.equal(res.body.data.effectiveMarketCode, 'cn-mainland')
  } finally {
    await app.close()
  }
})

it('e2e: resolve actor context with missing marketCode defaults to us-default', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/resolve')
      .set('x-tenant-id', 'tenant-001')
    assert.equal(res.body.data.effectiveMarketCode, 'cn-mainland')
  } finally {
    await app.close()
  }
})

// ---------------------------------------------------------------------------
// Phase-4 扩展：覆盖 IdentityAccessService 的更多授权边界与返回值细节
// ---------------------------------------------------------------------------

it('e2e phase-4: hasAnyRole returns true when required roles array is empty', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-role')
      .send({ roles: [] })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: hasAllPermissions returns true when required permissions array is empty', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-permissions')
      .send({ permissions: [] })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: hasAllPermissions returns true for single matching permission', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-permissions')
      .set('x-actor-id', 'op-p4-1')
      .set('x-actor-permissions', 'order:view,refund:approve')
      .send({ permissions: ['refund:approve'] })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: hasAllPermissions returns false when actor missing for non-empty list', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/has-permissions')
      .send({ permissions: ['refund:approve'] })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: isPrivilegedActor true for tenant:cross-scope permission', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/is-privileged')
      .set('x-actor-id', 'cross-2')
      .set('x-actor-permissions', 'tenant:cross-scope')
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: isPrivilegedActor false when no actor header provided', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/foundation/identity-access/is-privileged')
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: validateTenantScope returns true for empty requiredScope body', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/validate-tenant-scope')
      .set('x-tenant-id', 'tenant-001')
      .send({})
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: validateTenantScope returns false when brandId mismatches', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/validate-tenant-scope')
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .send({ tenantId: 'tenant-001', brandId: 'brand-other' })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: validateTenantScope returns false for non-privileged actor when tenantId required but missing in context', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/validate-tenant-scope')
      .set('x-actor-id', 'op-p4-2')
      .set('x-actor-roles', 'operator')
      .send({ tenantId: 'tenant-required-but-no-context' })
    assert.equal(res.body.data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: authorizeAction returns allowed for platform-admin even with mismatched scope', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'admin-p4')
      .set('x-actor-roles', 'platform-admin')
      .set('x-actor-permissions', 'refund:approve')
      .set('x-tenant-id', 'tenant-001')
      .send({
        action: 'refund:approve',
        resourceScope: { tenantId: 'tenant-other', brandId: 'brand-other', storeId: 'store-other' }
      })
    assert.equal(res.body.data.status, 'allowed')
    assert.equal(res.body.data.tenantScopeMatched, true)
    assert.equal(res.body.data.permissionMatched, true)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: authorizeAction decision carries enforcedBy metadata', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'op-p4-3')
      .set('x-actor-permissions', 'order:view')
      .send({
        action: 'refund:approve',
        resourceScope: { tenantId: 'tenant-001' }
      })
    assert.equal(res.body.data.status, 'denied')
    assert.equal(res.body.data.permissionMatched, false)
    assert.equal(res.body.data.action, 'refund:approve')
    assert.ok(Array.isArray(res.body.data.enforcedBy))
    assert.ok(res.body.data.enforcedBy.length >= 2)
    assert.ok(res.body.data.enforcedBy.includes('IdentityAccessService.hasAllPermissions'))
  } finally {
    await app.close()
  }
})

it('e2e phase-4: authorizeAction returns denied when both permission and scope missing', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'op-p4-4')
      .set('x-actor-permissions', 'order:view')
      .set('x-tenant-id', 'tenant-001')
      .send({
        action: 'configuration:rotate-secret',
        resourceScope: { tenantId: 'tenant-other' }
      })
    assert.equal(res.body.data.status, 'denied')
    assert.equal(res.body.data.permissionMatched, false)
    assert.equal(res.body.data.tenantScopeMatched, false)
  } finally {
    await app.close()
  }
})

it('e2e phase-4: resolve actor context normalizes duplicate roles via Set', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/resolve')
      .set('x-actor-id', 'op-p4-5')
      .set('x-actor-roles', 'operator,operator,auditor')
      .set('x-actor-permissions', 'order:view,order:view,refund:approve')
    assert.equal(res.body.data.authenticated, true)
    assert.deepEqual(res.body.data.roles, ['operator', 'auditor'])
    assert.deepEqual(res.body.data.permissions, ['order:view', 'refund:approve'])
  } finally {
    await app.close()
  }
})

it('e2e phase-4: resolve actor context with whitespace-only roles header yields empty roles', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/resolve')
      .set('x-actor-id', 'op-p4-6')
      .set('x-actor-roles', '   ,  ,')
    assert.equal(res.body.data.authenticated, true)
    assert.deepEqual(res.body.data.roles, [])
  } finally {
    await app.close()
  }
})

it('e2e phase-4: descriptor exposes capabilities with consumers and entrypoints', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/foundation/identity-access/descriptor')
    assert.equal(res.body.data.key, 'identity-access')
    const capabilities = res.body.data.capabilities
    assert.ok(Array.isArray(capabilities))
    assert.ok(capabilities.length >= 3)
    const authn = capabilities.find((c: { key: string }) => c.key === 'authentication')
    assert.ok(authn)
    assert.ok(Array.isArray(authn.consumers))
    assert.ok(authn.consumers.length >= 1)
    assert.ok(Array.isArray(authn.entrypoints))
    assert.equal(authn.status, 'active')
  } finally {
    await app.close()
  }
})

it('e2e phase-4: descriptor exposes inbound and outbound contracts', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/foundation/identity-access/descriptor')
    assert.ok(Array.isArray(res.body.data.inboundContracts))
    assert.ok(res.body.data.inboundContracts.length >= 2)
    assert.ok(Array.isArray(res.body.data.outboundContracts))
    assert.ok(res.body.data.outboundContracts.includes('Resolved actor context'))
  } finally {
    await app.close()
  }
})

it('e2e phase-4: validateTenantScope tenant-only match succeeds when brandId/storeId not required', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/validate-tenant-scope')
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .set('x-store-id', 'store-001')
      .send({ tenantId: 'tenant-001' })
    assert.equal(res.body.data.result, true)
  } finally {
    await app.close()
  }
})

// ──────────────────────────────────────────────────────────────────────────
// Phase-5 Wave-2 🐜5 补强：identity-access D-E2E auth 边界 / 集成路径
// ──────────────────────────────────────────────────────────────────────────

it('e2e phase-5: resolve actor with no token returns anonymous fallback', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/foundation/identity-access/resolve')
    const data = res.body.data ?? res.body
    assert.equal(res.statusCode, 200)
    assert.equal(data.authenticated, false)
    assert.equal(data.actor, null)
  } finally {
    await app.close()
  }
})

it('e2e phase-5: authorizeAction with multiple roles returns allowed when any matches', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'multi-role-user')
      .set('x-actor-roles', 'OPERATIONS,FINANCE_ADMIN,MARKETING')
      .set('x-actor-permissions', 'foundation.refund.approve')
      .send({
        action: 'foundation.refund.approve',
        resourceScope: { resource: 'refund', action: 'approve' }
      })
    const data = res.body.data ?? res.body
    assert.equal(res.statusCode, 201)
    assert.equal(data.status, 'allowed')
  } finally {
    await app.close()
  }
})

it('e2e phase-5: authorizeAction with insufficient roles returns denied with reason', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'low-priv-user')
      .set('x-actor-roles', 'GUEST')
      .send({
        action: 'foundation.config-entry.write',
        resourceScope: { resource: 'configuration', action: 'write' }
      })
    const data = res.body.data ?? res.body
    assert.equal(res.statusCode, 201)
    assert.equal(data.status, 'denied')
    assert.ok(data.permissionMatched === false, 'expected permissionMatched=false')
  } finally {
    await app.close()
  }
})

it('e2e phase-5: descriptor metadata includes key', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/foundation/identity-access/descriptor')
    const data = res.body.data ?? res.body
    assert.equal(res.statusCode, 200)
    assert.ok(data, 'expected descriptor object')
    assert.ok(typeof data.key === 'string' && data.key.length > 0, `expected non-empty key, got ${data.key}`)
  } finally {
    await app.close()
  }
})

it('e2e phase-5: validate-tenant-scope with mismatched store returns false', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/validate-tenant-scope')
      .set('x-tenant-id', 'tenant-001')
      .set('x-brand-id', 'brand-001')
      .set('x-store-id', 'store-001')
      .send({ tenantId: 'tenant-001', brandId: 'brand-001', storeId: 'store-WRONG' })
    const data = res.body.data ?? res.body
    assert.equal(res.statusCode, 201)
    assert.equal(data.result, false)
  } finally {
    await app.close()
  }
})

it('e2e phase-5: resolve actor with platform-admin role marks as privileged', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/foundation/identity-access/is-privileged')
      .set('x-actor-id', 'platform-admin-001')
      .set('x-actor-roles', 'platform-admin,OPERATIONS')
    const data = res.body.data ?? res.body
    assert.equal(res.statusCode, 200)
    assert.equal(data.result, true, `expected result=true, got ${data.result}`)
  } finally {
    await app.close()
  }
})

it('e2e phase-5: authorizeAction with super-admin role grants access', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/foundation/identity-access/authorize')
      .set('x-actor-id', 'super-admin-001')
      .set('x-actor-roles', 'SUPER_ADMIN')
      .set('x-actor-permissions', 'foundation.secret.read')
      .send({
        action: 'foundation.secret.read',
        resourceScope: { resource: 'secret', action: 'read' }
      })
    const data = res.body.data ?? res.body
    assert.equal(res.statusCode, 201)
    assert.equal(data.status, 'allowed')
  } finally {
    await app.close()
  }
})
