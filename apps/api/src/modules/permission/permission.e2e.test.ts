import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🐜 自动: [permission] [D] E2E 测试
 *
 * E2E: Permission HTTP 链路
 *
 * 链路:
 *   HTTP → TestController → PermissionService
 *
 * 验证:
 *   - 角色查询 (GET /permission/roles)
 *   - 权限查询 (GET /permission/permissions)
 *   - 权限检查 (POST /permission/check)
 *   - 批量检查 (POST /permission/batch-check)
 *   - 当前用户权限 (GET /permission/my)
 *   - 权限拒绝场景
 *   - 匿名用户场景
 *   - 边界场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { Body, Controller, Get, Post, Headers, HttpCode, HttpStatus, ForbiddenException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import { ActionType } from './permission.types'

// ─── 测试用 Controller ───────────────────────────────────────────────────

const TEST_ROLE_CONTEXTS: Record<string, {
  userId: string
  tenantId: string
  brandId?: string
  storeId?: string
  roles: string[]
  permissions: string[]
}> = {
  'admin-token': {
    userId: 'user_001',
    tenantId: 'tenant-demo',
    brandId: 'brand_001',
    storeId: 'store_001',
    roles: ['TENANT_ADMIN'],
    permissions: ['*'],
  },
  storeManager: {
    userId: 'user_sm',
    tenantId: 'tenant-demo',
    storeId: 'store_001',
    roles: ['STORE_MANAGER'],
    permissions: ['store:read', 'store:update', 'order:*'],
  },
  cashier: {
    userId: 'user_cashier',
    tenantId: 'tenant-demo',
    storeId: 'store_001',
    roles: ['CASHIER'],
    permissions: ['order:create', 'order:read', 'payment:execute'],
  },
}

@Controller('permission')
class TestPermissionController {
  constructor(
    private readonly permissionService: PermissionService,
  ) {}

  @Get('roles')
  getAllRoles() {
    return this.permissionService.getAllRoles()
  }

  @Get('permissions')
  getAllPermissions() {
    return this.permissionService.getAllPermissions()
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  checkPermission(
    @Body() body: { resource: string; action: string },
    @Headers('authorization') auth?: string,
  ) {
    const context = this.extractContext(auth)
    const result = this.permissionService.checkPermission({
      context,
      resource: body.resource,
      action: body.action as ActionType,
    })
    if (!result.allowed) {
      throw new ForbiddenException(result.reason || 'Insufficient permission')
    }
    return result
  }

  @Post('batch-check')
  @HttpCode(HttpStatus.OK)
  batchCheck(
    @Body() body: { checks: Array<{ resource: string; action: string }> },
    @Headers('authorization') auth?: string,
  ) {
    const context = this.extractContext(auth)
    return body.checks.map((check) =>
      this.permissionService.checkPermission({
        context,
        resource: check.resource,
        action: check.action as ActionType,
      }),
    )
  }

  @Get('my')
  getMyPermissions(@Headers('authorization') auth?: string) {
    const context = this.extractContext(auth)
    const permissions = this.permissionService.getUserPermissions(context)
    return {
      context: {
        userId: context.userId,
        tenantId: context.tenantId,
        roles: context.roles,
      },
      permissions,
    }
  }

  private extractContext(auth: string | undefined) {
    if (!auth) {
      return { userId: 'anonymous', tenantId: 'anonymous', roles: [], permissions: [] }
    }
    const match = auth.match(/^Bearer\s+(\S+)$/i)
    const roleKey = match?.[1]
    if (roleKey && TEST_ROLE_CONTEXTS[roleKey]) {
      return TEST_ROLE_CONTEXTS[roleKey]
    }
    return { userId: 'anonymous', tenantId: 'anonymous', roles: [], permissions: [] }
  }
}

// ─── 测试用 App 构建 ──────────────────────────────────────────────────────

async function buildApp() {
  const rbacService = new RbacService()
  const dataScopeService = new DataScopeService()
  const permissionService = new PermissionService(rbacService, dataScopeService)

  const moduleRef = await Test.createTestingModule({
    controllers: [TestPermissionController],
    providers: [
      { provide: PermissionService, useValue: permissionService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, permissionService }
}

// ─── E2E 测试 ────────────────────────────────────────────────────────────

describe('[permission] e2e: GET /permission/roles', () => {
  it('返回所有内置角色', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/permission/roles')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      const data = res.body.data
      assert.ok(data.length >= 6)
      const roleNames = data.map((r: any) => r.roleName)
      assert.ok(roleNames.includes('PLATFORM_ADMIN'))
      assert.ok(roleNames.includes('TENANT_ADMIN'))
      assert.ok(roleNames.includes('STORE_MANAGER'))
      assert.ok(roleNames.includes('CASHIER'))
      assert.ok(roleNames.includes('SALES_GUIDE'))
      assert.ok(roleNames.includes('MEMBER'))
    } finally {
      await app.close()
    }
  })

  it('每个角色包含必要字段', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/permission/roles')
      assert.equal(res.statusCode, 200)
      const data = res.body.data
      for (const role of data) {
        assert.equal(typeof role.roleId, 'string')
        assert.equal(typeof role.roleName, 'string')
        assert.equal(typeof role.roleNameZh, 'string')
        assert.equal(typeof role.level, 'string')
        assert.ok(Array.isArray(role.permissions))
      }
    } finally {
      await app.close()
    }
  })
})

describe('[permission] e2e: GET /permission/permissions', () => {
  it('返回所有内置权限', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer()).get('/permission/permissions')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.ok(res.body.data.length >= 15)
    } finally {
      await app.close()
    }
  })
})

describe('[permission] e2e: POST /permission/check', () => {
  it('admin 可执行任意操作', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/permission/check')
        .set('Authorization', 'Bearer admin-token')
        .send({ resource: 'member', action: 'delete' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.allowed, true)
    } finally {
      await app.close()
    }
  })

  it('收银员可创建订单但不可删除品牌', async () => {
    const { app } = await buildApp()
    try {
      const res1 = await request(app.getHttpServer())
        .post('/permission/check')
        .set('Authorization', 'Bearer cashier')
        .send({ resource: 'order', action: 'create' })
      assert.equal(res1.statusCode, 200)
      assert.equal(res1.body.success, true)
      assert.equal(res1.body.data.allowed, true)

      const res2 = await request(app.getHttpServer())
        .post('/permission/check')
        .set('Authorization', 'Bearer cashier')
        .send({ resource: 'brand', action: 'delete' })
      assert.equal(res2.statusCode, 403)
    } finally {
      await app.close()
    }
  })

  it('匿名用户被拒绝', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/permission/check')
        .send({ resource: 'order', action: 'read' })
      assert.equal(res.statusCode, 403)
    } finally {
      await app.close()
    }
  })
})

describe('[permission] e2e: POST /permission/batch-check', () => {
  it('批量检查混合权限', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/permission/batch-check')
        .set('Authorization', 'Bearer cashier')
        .send({
          checks: [
            { resource: 'order', action: 'create' },
            { resource: 'finance', action: 'read' },
            { resource: 'order', action: 'read' },
          ],
        })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      const data = res.body.data
      assert.equal(data.length, 3)
      assert.equal(data[0].allowed, true)    // order:create ✓
      assert.equal(data[1].allowed, false)   // finance:read ✗
      assert.equal(data[2].allowed, true)    // order:read ✓
    } finally {
      await app.close()
    }
  })
})

describe('[permission] e2e: GET /permission/my', () => {
  it('admin 获取自己的权限', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/permission/my')
        .set('Authorization', 'Bearer admin-token')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.context.userId, 'user_001')
      assert.ok(res.body.data.permissions.length >= 1)
      assert.ok(res.body.data.permissions.includes('*'))
    } finally {
      await app.close()
    }
  })

  it('经理获取自己的权限和角色', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/permission/my')
        .set('Authorization', 'Bearer storeManager')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.data.context.roles.includes('STORE_MANAGER'), true)
    } finally {
      await app.close()
    }
  })
})

describe('[permission] e2e: 边界场景', () => {
  it('storeManager 可管理订单', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/permission/check')
        .set('Authorization', 'Bearer storeManager')
        .send({ resource: 'order', action: 'delete' })
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.allowed, true)
    } finally {
      await app.close()
    }
  })

  it('收银员无财务权限返回 403', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .post('/permission/check')
        .set('Authorization', 'Bearer cashier')
        .send({ resource: 'finance', action: 'read' })
      assert.equal(res.statusCode, 403)
    } finally {
      await app.close()
    }
  })

  it('不带 Authorization 头的请求视为匿名 (GET /permission/my)', async () => {
    const { app } = await buildApp()
    try {
      const res = await request(app.getHttpServer())
        .get('/permission/my')
      assert.equal(res.statusCode, 200)
      assert.equal(res.body.success, true)
      assert.equal(res.body.data.context.userId, 'anonymous')
    } finally {
      await app.close()
    }
  })
})
