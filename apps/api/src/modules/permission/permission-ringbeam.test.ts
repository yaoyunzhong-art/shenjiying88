/**
 * permission-ringbeam.test.ts - V17#圈梁 Phase1 基础设施圈梁
 * 用途: PRD对齐测试 - 验证权限检查核心流程
 * 覆盖: 正例(有权限通过) + 反例(无权限拒绝) + 边界(跨租户/批量)
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
    // 给 admin 用户分配 owner 角色
    rbacService.assignRole('user_admin', 'owner', 'tenant-demo', 'system')
    rbacService.assignRole('user_staff', 'staff', 'tenant-demo', 'system')
    permissionService = new PermissionService(rbacService, dataScopeService)
  })

  // ─── 正例: 拥有权限应通过 ─────────────────────────────────────────

  it('[P0] 拥有owner角色的用户应具备order:refund权限', () => {
    const context: PermissionContext = {
      userId: 'user_admin',
      tenantId: 'tenant-demo',
      roles: ['owner'],
    }

    const result = permissionService.checkPermission({
      context,
      resource: 'order',
      action: 'refund' as ActionType,
    })

    expect(result.allowed).toBe(true)
    expect(result.reason).toBe('Permission granted')
  })

  // ─── 反例: 无权限应拒绝 ───────────────────────────────────────────

  it('[P0] staff角色的用户不应具备order:refund权限', () => {
    const context: PermissionContext = {
      userId: 'user_staff',
      tenantId: 'tenant-demo',
      roles: ['staff'],
    }

    const result = permissionService.checkPermission({
      context,
      resource: 'order',
      action: 'refund' as ActionType,
    })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBeDefined()
  })

  // ─── 反例: 未分配角色的用户 ───────────────────────────────────────

  it('[P1] 未分配角色的用户应无任何权限', () => {
    const context: PermissionContext = {
      userId: 'user_unknown',
      tenantId: 'tenant-other',
      roles: [],
    }

    const result = permissionService.checkPermission({
      context,
      resource: 'order',
      action: 'read' as ActionType,
    })

    expect(result.allowed).toBe(false)
  })

  // ─── 正例: quickCheck快速接口 ─────────────────────────────────────

  it('[P1] quickCheck对拥有权限应返回true', () => {
    const context: PermissionContext = {
      userId: 'user_admin',
      tenantId: 'tenant-demo',
      roles: ['owner'],
    }

    const allowed = permissionService.quickCheck(context, 'config', 'delete')
    expect(allowed).toBe(true)
  })

  // ─── 边界: 批量检查 ───────────────────────────────────────────────

  it('[P1] batchCheck应正确处理多个权限请求', () => {
    const context: PermissionContext = {
      userId: 'user_admin',
      tenantId: 'tenant-demo',
      roles: ['owner'],
    }

    const results = permissionService.batchCheck([
      { context, resource: 'order', action: 'read' as ActionType },
      { context, resource: 'order', action: 'write' as ActionType },
      { context, resource: 'nonexistent', action: 'read' as ActionType },
    ])

    expect(results).toHaveLength(3)
    expect(results[0].allowed).toBe(true)
    expect(results[1].allowed).toBe(true)
    expect(results[2].allowed).toBe(false) // 不存在资源不应通过
  })

  // ─── getUserPermissions ────────────────────────────────────────────

  it('[P1] getUserPermissions应返回用户有效权限列表', () => {
    const context: PermissionContext = {
      userId: 'user_admin',
      tenantId: 'tenant-demo',
      roles: ['owner'],
    }

    const permissions = permissionService.getUserPermissions(context)
    expect(permissions).toBeInstanceOf(Array)
    expect(permissions.length).toBeGreaterThan(0)
    // owner应有order:refund
    expect(permissions).toContain('order:refund')
  })
})
