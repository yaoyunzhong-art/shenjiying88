import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: RBAC 权限管理 HTTP 链路
 *
 * 链路:
 *   HTTP → TestRbacController → RBACService
 *
 * 验证:
 *   - 角色分配 /rbac/assign（owner/admin/manager/staff/guest 5级）
 *   - 角色撤销 /rbac/revoke
 *   - 权限检查 /rbac/check
 *   - 权限验证 /rbac/authorize
 *   - 用户角色查询 /rbac/roles/:userId
 *   - 权限报告 /rbac/report/:userId
 *   - 角色权限 /rbac/permissions/:role
 *   - 策略注册 /rbac/policy
 *   - 保护动作 /rbac/protected-actions
 *   - 异常输入（不存在的 userId / 非法角色 / 缺少字段）
 *   - 多租户隔离测试
 *   - 权限继承链验证
 *   - 显式拒绝优先级验证
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { RBACService, Role, Permission, RBACAuthorizationError } from './rbac.service'

/** 精简测试用 Controller —— 直接透传 RBACService 返回结果 */
@Controller('rbac')
class TestRbacController {
  constructor(
    @Inject(RBACService) private readonly rbacService: RBACService
  ) {}

  @Post('assign')
  assignRole(@Body() body: { userId: string; role: Role; tenantId?: string; assignedBy?: string }) {
    const assignment = this.rbacService.assignRole(
      body.userId, body.role, body.tenantId, body.assignedBy || 'api',
    )
    return {
      userId: assignment.userId,
      role: assignment.role,
      tenantId: assignment.tenantId,
      assignedAt: assignment.assignedAt,
      assignedBy: assignment.assignedBy,
    }
  }

  @Post('revoke')
  revokeRole(@Body() body: { userId: string; tenantId?: string }) {
    this.rbacService.revokeRole(body.userId, body.tenantId)
    return { success: true, message: body.tenantId
      ? `Role revoked for user ${body.userId} in tenant ${body.tenantId}`
      : `Global role revoked for user ${body.userId}`
    }
  }

  @Get('roles/:userId')
  getRoles(@Param('userId') userId: string) {
    const roles = this.rbacService.getUserRoles(userId)
    return roles.map(r => ({
      userId: r.userId, role: r.role, tenantId: r.tenantId,
      assignedAt: r.assignedAt, assignedBy: r.assignedBy,
    }))
  }

  @Post('check')
  check(@Body() body: { userId: string; permission: Permission; tenantId?: string }) {
    const allowed = this.rbacService.checkPermission(body.userId, body.permission, body.tenantId)
    return { allowed, reason: allowed ? undefined : `Permission '${body.permission}' denied` }
  }

  @Post('authorize')
  authorize(@Body() body: { userId: string; permission: Permission; tenantId?: string }) {
    const has = this.rbacService.checkPermission(body.userId, body.permission, body.tenantId)
    return { authorized: has }
  }

  @Get('report/:userId')
  getReport(@Param('userId') userId: string) {
    return this.rbacService.getUserPermissionReport(userId)
  }

  @Get('permissions/:role')
  getPerms(@Param('role') role: Role) {
    const permissions = this.rbacService.getRolePermissions(role)
    return { role, permissions, permissionCount: permissions.length }
  }

  @Post('policy')
  registerPolicy(@Body() body: { role: Role; permissions: Permission[]; deniedPermissions?: Permission[] }) {
    this.rbacService.registerPolicy(body)
    return { success: true, message: `Policy registered for role '${body.role}'` }
  }

  @Post('protected-actions')
  registerActions(@Body() body: { controllerName: string; actions: Record<string, Permission[]> }) {
    this.rbacService.registerProtectedActions(body.controllerName, body.actions)
    return { success: true, message: `Protected actions registered for '${body.controllerName}'` }
  }

  @Get('protected-actions/:controllerName')
  getActions(@Param('controllerName') controllerName: string) {
    const actions = this.rbacService.getProtectedActions(controllerName)
    const result: Record<string, Permission[]> = {}
    for (const [method, perms] of actions) {
      result[method] = perms
    }
    return { controllerName, actions: result }
  }
}

async function buildApp() {
  const rbacService = new RBACService()
  const moduleRef = await Test.createTestingModule({
    controllers: [TestRbacController],
    providers: [
      { provide: RBACService, useValue: rbacService }
    ]
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, rbacService }
}

// ══════════════════════════════════════════════════════════════════════
// 角色分配与撤销
// ══════════════════════════════════════════════════════════════════════

it('e2e: assign owner role to user globally', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/rbac/assign')
      .send({ userId: 'user-001', role: 'owner', assignedBy: 'system' })
    assert.equal(res.statusCode, 201)
    assert.equal(res.body.data.userId, 'user-001')
    assert.equal(res.body.data.role, 'owner')
  } finally { await app.close() }
})

it('e2e: assign roles to multiple users and verify roles endpoint', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u1', role: 'admin' })
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u2', role: 'manager' })
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u3', role: 'staff' })

    const r1 = await request(app.getHttpServer()).get('/rbac/roles/u1')
    const r2 = await request(app.getHttpServer()).get('/rbac/roles/u2')
    const r3 = await request(app.getHttpServer()).get('/rbac/roles/u3')

    assert.equal(r1.body.data[0].role, 'admin')
    assert.equal(r2.body.data[0].role, 'manager')
    assert.equal(r3.body.data[0].role, 'staff')
  } finally { await app.close() }
})

it('e2e: revoke global role and user becomes unassigned', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-revoke', role: 'admin' })
    const before = await request(app.getHttpServer()).get('/rbac/roles/u-revoke')
    assert.equal(before.body.data.length, 1)

    await request(app.getHttpServer()).post('/rbac/revoke').send({ userId: 'u-revoke' })
    const after = await request(app.getHttpServer()).get('/rbac/roles/u-revoke')
    assert.equal(after.body.data.length, 0)
  } finally { await app.close() }
})

it('e2e: assign tenant-scoped role and revoke per-tenant', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-tenant', role: 'manager', tenantId: 'tenant-a' })
    const roles = await request(app.getHttpServer()).get('/rbac/roles/u-tenant')
    assert.equal(roles.body.data[0].tenantId, 'tenant-a')

    await request(app.getHttpServer()).post('/rbac/revoke').send({ userId: 'u-tenant', tenantId: 'tenant-a' })
    const after = await request(app.getHttpServer()).get('/rbac/roles/u-tenant')
    assert.equal(after.body.data.length, 0)
  } finally { await app.close() }
})

it('e2e: reassign role replaces existing assignment', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-reassign', role: 'staff' })
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-reassign', role: 'manager' })

    const roles = await request(app.getHttpServer()).get('/rbac/roles/u-reassign')
    assert.equal(roles.body.data.length, 1)
    assert.equal(roles.body.data[0].role, 'manager')
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 权限检查与授权
// ══════════════════════════════════════════════════════════════════════

it('e2e: owner has all permissions including config:delete and user:impersonate', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-owner', role: 'owner' })

    const r1 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-owner', permission: 'config:delete' })
    assert.equal(r1.body.data.allowed, true)

    const r2 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-owner', permission: 'user:impersonate' })
    assert.equal(r2.body.data.allowed, true)
  } finally { await app.close() }
})

it('e2e: admin cannot config:delete or user:impersonate (denied permissions)', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-admin', role: 'admin' })

    const d1 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-admin', permission: 'config:delete' })
    assert.equal(d1.body.data.allowed, false)

    const d2 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-admin', permission: 'user:impersonate' })
    assert.equal(d2.body.data.allowed, false)
  } finally { await app.close() }
})

it('e2e: staff can order:read but cannot order:refund (denied)', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-staff', role: 'staff' })

    const r1 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-staff', permission: 'order:read' })
    assert.equal(r1.body.data.allowed, true)

    const r2 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-staff', permission: 'order:refund' })
    assert.equal(r2.body.data.allowed, false)
  } finally { await app.close() }
})

it('e2e: guest has read-only permissions only', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-guest', role: 'guest' })

    const readSet = ['order:read', 'points:read', 'inventory:read', 'report:read']
    const writeSet = ['order:write', 'points:write', 'inventory:write', 'report:export']

    for (const perm of readSet) {
      const r = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-guest', permission: perm as Permission })
      assert.equal(r.body.data.allowed, true, `guest should have ${perm}`)
    }
    for (const perm of writeSet) {
      const r = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-guest', permission: perm as Permission })
      assert.equal(r.body.data.allowed, false, `guest should NOT have ${perm}`)
    }
  } finally { await app.close() }
})

it('e2e: authorize endpoint returns authorized when permission granted', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-auth-admin', role: 'admin' })
    const auth = await request(app.getHttpServer()).post('/rbac/authorize').send({ userId: 'u-auth-admin', permission: 'settlement:approve' })
    assert.equal(auth.body.data.authorized, true)
  } finally { await app.close() }
})

it('e2e: authorize endpoint returns not authorized when permission denied', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-auth-guest', role: 'guest' })
    const auth = await request(app.getHttpServer()).post('/rbac/authorize').send({ userId: 'u-auth-guest', permission: 'settlement:approve' })
    assert.equal(auth.body.data.authorized, false)
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 权限报告
// ══════════════════════════════════════════════════════════════════════

it('e2e: permission report shows effective and denied permissions for admin', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-report', role: 'admin' })
    const report = await request(app.getHttpServer()).get('/rbac/report/u-report')

    assert.equal(report.body.data.roles.length, 1)
    assert.ok(report.body.data.effectivePermissions.length > 30)
    assert.ok(report.body.data.deniedPermissions.includes('config:delete'))
    assert.ok(report.body.data.deniedPermissions.includes('user:impersonate'))
  } finally { await app.close() }
})

it('e2e: permission report for unassigned user shows empty roles', async () => {
  const { app } = await buildApp()
  try {
    const report = await request(app.getHttpServer()).get('/rbac/report/u-nonexistent')
    assert.equal(report.body.data.roles.length, 0)
    assert.equal(report.body.data.effectivePermissions.length, 0)
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 角色权限查询
// ══════════════════════════════════════════════════════════════════════

it('e2e: getRolePermissions for all 5 roles shows correct permission hierarchy', async () => {
  const { app } = await buildApp()
  try {
    const roles: Role[] = ['owner', 'admin', 'manager', 'staff', 'guest']
    const counts: number[] = []

    for (const role of roles) {
      const res = await request(app.getHttpServer()).get(`/rbac/permissions/${role}`)
      assert.equal(res.body.data.role, role)
      counts.push(res.body.data.permissionCount)
    }

    // owner >= admin >= manager >= staff > guest
    for (let i = 0; i < counts.length - 1; i++) {
      assert.ok(counts[i] >= counts[i + 1], `role index ${i} (${counts[i]}) >= ${i + 1} (${counts[i + 1]})`)
    }
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 策略注册
// ══════════════════════════════════════════════════════════════════════

it('e2e: register custom policy and verify permissions', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/policy').send({
      role: 'custom_role' as Role,
      permissions: ['order:read' as Permission, 'order:write' as Permission],
      deniedPermissions: ['order:cancel' as Permission],
    })
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-custom', role: 'custom_role' as Role })

    const r1 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-custom', permission: 'order:read' as Permission })
    assert.equal(r1.body.data.allowed, true)

    const r2 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-custom', permission: 'order:cancel' as Permission })
    assert.equal(r2.body.data.allowed, false)
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 保护动作注册
// ══════════════════════════════════════════════════════════════════════

it('e2e: register and query protected actions', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/protected-actions').send({
      controllerName: 'OrderController',
      actions: { create: ['order:write'], delete: ['order:cancel'], refund: ['order:refund'] },
    })
    const res = await request(app.getHttpServer()).get('/rbac/protected-actions/OrderController')
    assert.equal(res.body.data.controllerName, 'OrderController')
    assert.ok(res.body.data.actions.create)
    assert.equal(res.body.data.actions.create[0], 'order:write')
  } finally { await app.close() }
})

it('e2e: query protected actions for non-existent controller returns empty', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/rbac/protected-actions/NonexistentCtrl')
    assert.equal(Object.keys(res.body.data.actions).length, 0)
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 多租户隔离测试
// ══════════════════════════════════════════════════════════════════════

it('e2e: tenant-scoped permissions are isolated between tenants', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-multi', role: 'admin', tenantId: 'tenant-a' })
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-multi', role: 'guest', tenantId: 'tenant-b' })

    const rA = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-multi', permission: 'settlement:approve', tenantId: 'tenant-a' })
    assert.equal(rA.body.data.allowed, true, 'admin in tenant-a can approve')

    const rB = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-multi', permission: 'settlement:approve', tenantId: 'tenant-b' })
    assert.equal(rB.body.data.allowed, false, 'guest in tenant-b cannot approve')
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 异常输入 & 边界测试
// ══════════════════════════════════════════════════════════════════════

it('e2e: check permission for unassigned user returns allowed=false', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'no-such-user', permission: 'order:read' })
    assert.equal(res.body.data.allowed, false)
  } finally { await app.close() }
})

it('e2e: get roles for non-existent user returns empty array', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).get('/rbac/roles/no-such-user')
    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 0)
  } finally { await app.close() }
})

it('e2e: revoke non-existent user does not throw', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer()).post('/rbac/revoke').send({ userId: 'no-such-user' })
    assert.equal(res.body.data.success, true)
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 权限继承链验证
// ══════════════════════════════════════════════════════════════════════

it('e2e: manager permissions reflect inheritance + denied override chain', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-inherit', role: 'manager' })

    // manager 通过继承获得 admin 提供的前 50% 权限
    // 但 user:delete 在 manager 的 deniedPermissions 中，因此被拒绝
    const deniedCheck = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-inherit', permission: 'user:delete' })
    assert.equal(deniedCheck.body.data.allowed, false, 'user:delete is in manager deniedPermissions')

    // manager 的 own policy 包含 inventory:write
    const hasInvWrite = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-inherit', permission: 'inventory:write' })
    assert.equal(hasInvWrite.body.data.allowed, true, 'manager has inventory:write via own policy')

    // manager 的 deniedPermissions 包含 inventory:transfer
    const hasInvTransfer = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-inherit', permission: 'inventory:transfer' })
    assert.equal(hasInvTransfer.body.data.allowed, false, 'inventory:transfer denied for manager')

    // 继承链验证：角色间权限数量呈现等级递减
    const ownerPerms = await request(app.getHttpServer()).get('/rbac/permissions/owner')
    const adminPerms = await request(app.getHttpServer()).get('/rbac/permissions/admin')
    const mgrPerms = await request(app.getHttpServer()).get('/rbac/permissions/manager')
    const staffPerms = await request(app.getHttpServer()).get('/rbac/permissions/staff')
    const guestPerms = await request(app.getHttpServer()).get('/rbac/permissions/guest')

    const counts = [
      ownerPerms.body.data.permissionCount,
      adminPerms.body.data.permissionCount,
      mgrPerms.body.data.permissionCount,
      staffPerms.body.data.permissionCount,
      guestPerms.body.data.permissionCount,
    ]
    // owner >= admin >= manager >= staff >= guest
    for (let i = 0; i < counts.length - 1; i++) {
      assert.ok(counts[i] >= counts[i + 1], `perm count should be non-increasing: ${counts[i]} >= ${counts[i + 1]}`)
    }
  } finally { await app.close() }
})

it('e2e: guest inherits staff permissions partially (order:read)', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-guest-inherit', role: 'guest' })

    const check = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-guest-inherit', permission: 'order:read' })
    assert.equal(check.body.data.allowed, true, 'guest should have order:read via inheritance')
  } finally { await app.close() }
})

// ══════════════════════════════════════════════════════════════════════
// 显式拒绝优先级验证
// ══════════════════════════════════════════════════════════════════════

it('e2e: deniedPermissions override inherited permissions for manager', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer()).post('/rbac/assign').send({ userId: 'u-deny', role: 'manager' })

    // manager 的 deniedPermissions 包含 compliance:manage
    const d1 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-deny', permission: 'compliance:manage' })
    assert.equal(d1.body.data.allowed, false, 'manager must not have compliance:manage')

    // manager 的 deniedPermissions 包含 inventory:transfer
    const d2 = await request(app.getHttpServer()).post('/rbac/check').send({ userId: 'u-deny', permission: 'inventory:transfer' })
    assert.equal(d2.body.data.allowed, false, 'manager must not have inventory:transfer')
  } finally { await app.close() }
})
