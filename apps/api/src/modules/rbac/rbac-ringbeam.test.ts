/**
 * rbac-ringbeam.test.ts - V17#圈梁 Phase1 基础设施圈梁
 * 用途: PRD对齐测试 - 验证RBAC角色绑定/权限继承/显式拒绝
 * 覆盖: 正例(角色权限分配) + 反例(无权限) + 边界(权限继承/跨租户)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { RBACService, type Role, type Permission } from './rbac.service'

describe('🔵 RBACRingBeam: 角色权限控制PRD对齐', () => {
  let rbacService: RBACService

  beforeEach(() => {
    rbacService = new RBACService()
  })

  // ─── 正例: 角色分配与权限包含 ─────────────────────────────────────

  it('[P0] 分配owner角色后应拥有order:refund等全部权限', () => {
    rbacService.assignRole('user_admin', 'owner', 'tenant-demo', 'system')

    expect(rbacService.checkPermission('user_admin', 'order:refund', 'tenant-demo'))
      .toBe(true)
    expect(rbacService.checkPermission('user_admin', 'config:delete', 'tenant-demo'))
      .toBe(true)
    expect(rbacService.checkPermission('user_admin', 'user:impersonate', 'tenant-demo'))
      .toBe(true)
  })

  // ─── 反例: 没有权限应拒绝 ─────────────────────────────────────────

  it('[P0] staff角色应无config:delete权限', () => {
    rbacService.assignRole('user_staff', 'staff', 'tenant-demo', 'system')

    expect(rbacService.checkPermission('user_staff', 'config:delete', 'tenant-demo'))
      .toBe(false)
    expect(rbacService.checkPermission('user_staff', 'order:refund', 'tenant-demo'))
      .toBe(false)
  })

  // ─── 边界: 权限继承机制 ───────────────────────────────────────────

  it('[P1] admin应继承owner的80%权限并且显式拒绝config:delete', () => {
    rbacService.assignRole('user_admin', 'admin', 'tenant-demo', 'system')

    // 继承来的权限
    expect(rbacService.checkPermission('user_admin', 'order:read', 'tenant-demo'))
      .toBe(true)
    // 显式拒绝
    expect(rbacService.checkPermission('user_admin', 'config:delete', 'tenant-demo'))
      .toBe(false)
    expect(rbacService.checkPermission('user_admin', 'user:impersonate', 'tenant-demo'))
      .toBe(false)
    // 依然有普通权限
    expect(rbacService.checkPermission('user_admin', 'order:write', 'tenant-demo'))
      .toBe(true)
  })

  // ─── 边界: 跨租户隔离 ─────────────────────────────────────────────

  it('[P1] 在不同租户的角色应互不干扰', () => {
    // 用户在 tenant-A 是 owner, 在 tenant-B 是 staff
    rbacService.assignRole('user_multi', 'owner', 'tenant-a', 'system')
    rbacService.assignRole('user_multi', 'staff', 'tenant-b', 'system')

    expect(rbacService.checkPermission('user_multi', 'config:delete', 'tenant-a'))
      .toBe(true)
    expect(rbacService.checkPermission('user_multi', 'config:delete', 'tenant-b'))
      .toBe(false)
  })

  // ─── 反例: 未分配角色的用户 ───────────────────────────────────────

  it('[P1] 未分配角色的用户应无任何权限', () => {
    expect(rbacService.checkPermission('user_nobody', 'order:read', 'tenant-demo'))
      .toBe(false)
  })

  // ─── authorize验证 ────────────────────────────────────────────────

  it('[P1] authorize在无权限时应抛RBACAuthorizationError', () => {
    rbacService.assignRole('user_staff', 'staff', 'tenant-demo', 'system')

    expect(() => {
      rbacService.authorize('user_staff', 'config:delete', 'tenant-demo')
    }).toThrow()

    // 有权限不应抛
    expect(() => {
      rbacService.authorize('user_staff', 'order:read', 'tenant-demo')
    }).not.toThrow()
  })
})
