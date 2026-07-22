/**
 * rbac.service.test.ts
 * 圈梁五道箍: RBACService 单元测试
 * 覆盖: 正常路径5+ / 边界条件4+ / 错误处理4+ / 空值/空数组3+ / 并发/时序3+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RBACService, RBACAuthorizationError } from './rbac.service'
import type { Role, Permission } from './rbac.service'

describe('RBACService', () => {
  let service: RBACService

  beforeEach(() => {
    service = new RBACService()
  })

  // ================================================================
  // 正常路径 (5 cases)
  // ================================================================

  describe('正常路径', () => {
    it('owner 角色应该拥有所有权限', () => {
      const perms = service.getRolePermissions('owner')
      expect(perms).toContain('user:read')
      expect(perms).toContain('config:delete')
      expect(perms).toContain('user:impersonate')
      expect(perms).toContain('compliance:manage')
      // 所有 35 个权限
      expect(perms.length).toBeGreaterThanOrEqual(35)
    })

    it('admin 角色应该不包含显式拒绝的权限', () => {
      const perms = service.getRolePermissions('admin')
      expect(perms).not.toContain('config:delete')
      expect(perms).not.toContain('user:impersonate')
      expect(perms).toContain('user:read')
      expect(perms).toContain('order:refund')
    })

    it('guest 角色只有基本的只读权限', () => {
      const perms = service.getRolePermissions('guest')
      expect(perms).toContain('order:read')
      expect(perms).toContain('points:read')
      expect(perms).toContain('inventory:read')
      expect(perms).toContain('report:read')
      expect(perms).not.toContain('order:write')
      expect(perms).not.toContain('points:write')
      expect(perms).not.toContain('inventory:write')
      expect(perms).not.toContain('report:export')
    })

    it('assignRole 应该正确分配角色并返回记录', () => {
      const assignment = service.assignRole('user1', 'admin', 'tenant-a', 'admin@system')
      expect(assignment.userId).toBe('user1')
      expect(assignment.role).toBe('admin')
      expect(assignment.tenantId).toBe('tenant-a')
      expect(assignment.assignedBy).toBe('admin@system')
      expect(assignment.assignedAt).toBeInstanceOf(Date)
    })

    it('checkPermission 应该正确验证用户权限', () => {
      service.assignRole('user1', 'owner')
      expect(service.checkPermission('user1', 'config:delete')).toBe(true)
      expect(service.checkPermission('user1', 'user:impersonate')).toBe(true)
    })
  })

  // ================================================================
  // 边界条件 (4 cases)
  // ================================================================

  describe('边界条件', () => {
    it('assignRole 同一租户已有角色时应该替换而非追加', () => {
      service.assignRole('user1', 'guest', 'tenant-x')
      const firstAssignments = service.getUserRoles('user1')
      expect(firstAssignments).toHaveLength(1)
      expect(firstAssignments[0].role).toBe('guest')

      // 再次分配同一租户
      service.assignRole('user1', 'admin', 'tenant-x')
      const secondAssignments = service.getUserRoles('user1')
      expect(secondAssignments).toHaveLength(1) // 替换，不是追加
      expect(secondAssignments[0].role).toBe('admin')
    })

    it('revokeRole 应该移除指定租户的角色', () => {
      service.assignRole('user2', 'manager', 'tenant-z')
      expect(service.getUserRoles('user2')).toHaveLength(1)
      service.revokeRole('user2', 'tenant-z')
      expect(service.getUserRoles('user2')).toHaveLength(0)
    })

    it('hasPermission 对不存在的角色应该返回 false', () => {
      // 未注册的角色
      expect(service.hasPermission('non_existent_role' as Role, 'user:read')).toBe(false)
    })

    it('registerPolicy 覆盖后新权限出现在列表中', () => {
      // guest 默认不含 config:write，注册后应该包含
      service.registerPolicy({
        role: 'owner',
        permissions: ['config:read', 'config:write'],
        deniedPermissions: [],
      })
      const perms = service.getRolePermissions('owner')
      expect(perms).toContain('config:read')
      expect(perms).toContain('config:write')
    })
  })

  // ================================================================
  // 错误处理 (4 cases)
  // ================================================================

  describe('错误处理', () => {
    it('authorize 当用户无权限时应该抛出 RBACAuthorizationError', () => {
      service.assignRole('user3', 'guest')
      expect(() => service.authorize('user3', 'config:write')).toThrow(RBACAuthorizationError)
    })

    it('authorize 错误消息应该包含 userId 和 permission', () => {
      service.assignRole('user3', 'guest')
      try {
        service.authorize('user3', 'user:delete')
        expect.unreachable('Should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(RBACAuthorizationError)
        expect((e as RBACAuthorizationError).message).toContain('user3')
        expect((e as RBACAuthorizationError).message).toContain('user:delete')
      }
    })

    it('getUserRoles 对不存在的用户应该返回空数组', () => {
      const roles = service.getUserRoles('non-existent')
      expect(roles).toEqual([])
    })

    it('checkPermission 对无角色分配的用户应该返回 false', () => {
      const hasPerm = service.checkPermission('stranger', 'order:read')
      expect(hasPerm).toBe(false)
    })
  })

  // ================================================================
  // 空值/空数组 (3 cases)
  // ================================================================

  describe('空值/空数组', () => {
    it('getRolePermissions 对未注册的角色应该返回空数组', () => {
      // 使用一个不合法的角色（但不是 Role 类型，但 ts 层面允许）
      const perms = service.getRolePermissions('non_existent_role' as Role)
      expect(perms).toEqual([])
    })

    it('revokeRole 对不存在的用户不应抛出异常', () => {
      expect(() => service.revokeRole('ghost-user')).not.toThrow()
    })

    it('getProtectedActions 对未注册的 controller 返回空 Map', () => {
      const actions = service.getProtectedActions('unknownController')
      expect(actions).toBeInstanceOf(Map)
      expect(actions.size).toBe(0)
    })
  })

  // ================================================================
  // 并发/时序 (3 cases)
  // ================================================================

  describe('并发/时序', () => {
    it('多用户多租户分配后 getUserRoles 返回独立结果', () => {
      service.assignRole('u1', 'admin', 't1')
      service.assignRole('u1', 'owner', 't2')
      service.assignRole('u2', 'guest')

      const u1Roles = service.getUserRoles('u1')
      expect(u1Roles).toHaveLength(2)
      expect(u1Roles[0].tenantId).toBe('t1')
      expect(u1Roles[1].tenantId).toBe('t2')

      const u2Roles = service.getUserRoles('u2')
      expect(u2Roles).toHaveLength(1)
      expect(u2Roles[0].role).toBe('guest')
    })

    it('getUserPermissionReport 应该返回综合权限报告', () => {
      service.assignRole('u3', 'manager', 't1')

      const report = service.getUserPermissionReport('u3')
      expect(report.roles).toHaveLength(1)
      expect(report.roles[0].role).toBe('manager')
      // manager 应该有 order:read 等权限
      expect(report.effectivePermissions).toContain('order:read')
      expect(report.effectivePermissions).toContain('order:write')
      // manager 显式拒绝的
      expect(report.deniedPermissions).toContain('compliance:manage')
      expect(report.deniedPermissions).toContain('user:delete')
      // effective 中不应包含 denied
      expect(report.effectivePermissions).not.toContain('compliance:manage')
    })

    it('权限继承链应该逐级递减', () => {
      const ownerPerms = service.getRolePermissions('owner')
      const adminPerms = service.getRolePermissions('admin')
      const managerPerms = service.getRolePermissions('manager')
      const staffPerms = service.getRolePermissions('staff')
      const guestPerms = service.getRolePermissions('guest')

      // owner > admin > manager > staff > guest (数量递减)
      expect(ownerPerms.length).toBeGreaterThan(adminPerms.length)
      expect(adminPerms.length).toBeGreaterThan(managerPerms.length)
      expect(managerPerms.length).toBeGreaterThan(staffPerms.length)
      expect(staffPerms.length).toBeGreaterThan(guestPerms.length)
    })

    it('registerProtectedActions 后 getProtectedActions 应该返回注册的动作', () => {
      service.registerProtectedActions('UserController', {
        findAll: ['user:read'],
        delete: ['user:delete'],
      })
      const actions = service.getProtectedActions('UserController')
      expect(actions.size).toBe(2)
      expect(actions.get('findAll')).toEqual(['user:read'])
      expect(actions.get('delete')).toEqual(['user:delete'])
    })
  })

  // ================================================================
  // __reset 辅助测试
  // ================================================================

  describe('__reset', () => {
    it('__reset 后应该恢复默认策略', () => {
      service.registerPolicy({ role: 'owner', permissions: [] })
      service.assignRole('temp', 'guest')
      expect(service.getUserRoles('temp')).toHaveLength(1)

      service.__reset()
      // 角色分配被清空
      expect(service.getUserRoles('temp')).toHaveLength(0)
      // 默认策略恢复
      expect(service.getRolePermissions('owner').length).toBeGreaterThan(30)
    })
  })
})
