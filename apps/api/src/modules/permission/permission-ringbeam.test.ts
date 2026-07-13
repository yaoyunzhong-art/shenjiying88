/**
 * permission-ringbeam.test.ts - V17#圈梁 Phase1 基础设施圈梁
 * 用途: PRD对齐测试 - 验证权限检查核心流程
 * 覆盖: 正例(有权限通过) + 反例(无权限拒绝) + 边界(通配符/role权限)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PermissionService } from './permission.service'
import { RbacService } from './rbac.service'
import { DataScopeService } from './data-scope.service'
import { PermissionContext, ActionType } from './permission.types'

describe('🔵 PermissionRingBeam: 权限控制PRD对齐', () => {
  let permissionService: PermissionService
  let rbacService: RbacService
  let dataScopeService: DataScopeService

  beforeEach(() => {
    dataScopeService = new DataScopeService()
    rbacService = new RbacService()
    permissionService = new PermissionService(rbacService, dataScopeService)
  })

  // ─── 正例: context有直接权限应通过 ──────────────────────────────

  it('[P0] context包含order:read权限的用户应具备order读取权限', () => {
    const context: PermissionContext = {
      userId: 'user_admin',
      tenantId: 'tenant-demo',
      roles: [],
      permissions: ['order:read', 'order:write'],
    }

    const result = permissionService.checkPermission({
      context,
      resource: 'order',
      action: 'read' as ActionType,
    })

    expect(result.allowed).toBe(true)
    expect(result.reason).toBe('Permission granted')
  })

  // ─── 反例: 无权限应拒绝 ───────────────────────────────────────────

  it('[P0] context无对应权限应返回拒绝', () => {
    const context: PermissionContext = {
      userId: 'user_staff',
      tenantId: 'tenant-demo',
      roles: [],
      permissions: ['order:read'],
    }

    const result = permissionService.checkPermission({
      context,
      resource: 'config',
      action: 'delete' as ActionType,
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBeDefined()
    expect(result.reason).toContain('Missing permission')
  })

  // ─── 正例: 通配符权限 ────────────────────────────────────────────

  it('[P1] 通配符*权限应能通过任意资源检查', () => {
    const context: PermissionContext = {
      userId: 'user_super',
      tenantId: 'tenant-demo',
      roles: [],
      permissions: ['*'],
    }

    const result = permissionService.checkPermission({
      context,
      resource: 'unknown_resource',
      action: 'delete' as ActionType,
    })

    expect(result.allowed).toBe(true)
  })

  // ─── 正例: quickCheck快速接口 ─────────────────────────────────────

  it('[P1] quickCheck对拥有通配权限应返回true', () => {
    const context: PermissionContext = {
      userId: 'user_admin',
      tenantId: 'tenant-demo',
      roles: ['PLATFORM_ADMIN'],
      permissions: [],
    }

    const allowed = permissionService.quickCheck(context, 'config', 'delete')
    expect(allowed).toBe(true)
  })

  // ─── 边界: getUserPermissions通过角色解析 ────────────────────────

  it('[P1] 通过角色解析的用户权限应包含角色已授予权限', () => {
    const context: PermissionContext = {
      userId: 'user_staff',
      tenantId: 'tenant-demo',
      roles: ['MEMBER'],
      permissions: [],
    }

    const permissions = permissionService.getUserPermissions(context)
    expect(permissions).toBeInstanceOf(Array)
    // MEMBER角色有 member:read
    expect(permissions).toContain('member:read')
  })

  // ─── 边界: batchCheck ───────────────────────────────────────────

  it('[P1] batchCheck应正确处理多个权限请求', () => {
    const context: PermissionContext = {
      userId: 'user_admin',
      tenantId: 'tenant-demo',
      roles: [],
      permissions: ['*'],
    }

    const results = permissionService.batchCheck([
      { context, resource: 'order', action: 'read' as ActionType },
      { context, resource: 'order', action: 'write' as ActionType },
      { context, resource: 'nonexistent', action: 'delete' as ActionType },
    ])

    expect(results).toHaveLength(3)
    expect(results[0].allowed).toBe(true)
    expect(results[1].allowed).toBe(true)
    expect(results[2].allowed).toBe(true) // 通配符 * 全部通过
  })
})
