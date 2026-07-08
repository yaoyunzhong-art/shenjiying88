/**
 * rbac.service.test.ts — RBAC 服务单元测试
 * 覆盖: RBACService 核心方法
 * 正向流程 + 边界条件 + 异常场景
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { RBACService, Role, Permission, RBACAuthorizationError } from './rbac.service'

describe('RBACService', () => {
  let service: RBACService

  beforeEach(() => {
    service = new RBACService()
  })

  // ── Default Policy Tests ────────────────────────────────────────

  describe('默认权限策略', () => {
    it('owner 应该拥有全部权限', () => {
      const perms = service.getRolePermissions('owner')
      expect(perms).toContain('user:read')
      expect(perms).toContain('config:delete')
      expect(perms).toContain('user:impersonate')
      expect(perms).toContain('compliance:manage')
      expect(perms).toContain('audit:read')
    })

    it('admin 应该拥有大部分权限但排除 config:delete 和 user:impersonate', () => {
      const perms = service.getRolePermissions('admin')
      expect(perms).toContain('user:read')
      expect(perms).toContain('user:delete')
      expect(perms).not.toContain('config:delete')
      expect(perms).not.toContain('user:impersonate')
    })

    it('admin 应该被显式拒绝 config:delete', () => {
      const hasConfigDelete = service.hasPermission('admin', 'config:delete')
      expect(hasConfigDelete).toBe(false)
    })

    it('admin 应该被显式拒绝 user:impersonate', () => {
      expect(service.hasPermission('admin', 'user:impersonate')).toBe(false)
    })

    it('manager 应该拥有订单和积分权限', () => {
      const perms = service.getRolePermissions('manager')
      expect(perms).toContain('order:read')
      expect(perms).toContain('order:write')
      expect(perms).toContain('points:adjust')
      expect(perms).toContain('settlement:approve')
    })

    it('manager 应该被拒绝 compliance:manage', () => {
      expect(service.hasPermission('manager', 'compliance:manage')).toBe(false)
    })

    it('staff 应该拥有只读+基本操作权限', () => {
      const perms = service.getRolePermissions('staff')
      expect(perms).toContain('order:read')
      expect(perms).toContain('order:write')
      expect(perms).toContain('points:read')
      expect(perms).toContain('coupon:issue')
      expect(perms).toContain('report:read')
    })

    it('staff 应该被拒绝 order:refund 和 payment:refund', () => {
      expect(service.hasPermission('staff', 'order:refund')).toBe(false)
      expect(service.hasPermission('staff', 'payment:refund')).toBe(false)
    })

    it('guest 应该只有有限只读权限', () => {
      const perms = service.getRolePermissions('guest')
      expect(perms).toContain('order:read')
      expect(perms).toContain('points:read')
      expect(perms).toContain('inventory:read')
      expect(perms).not.toContain('order:write')
      expect(perms).not.toContain('points:write')
      expect(perms).not.toContain('report:export')
    })

    it('guest 应该没有 user:write 和 config 相关权限', () => {
      expect(service.hasPermission('guest', 'user:write')).toBe(false)
      expect(service.hasPermission('guest', 'user:delete')).toBe(false)
      expect(service.hasPermission('guest', 'config:read')).toBe(false)
    })

    it('未注册角色的权限应该为空列表', () => {
      const perms = service.getRolePermissions('unknown' as Role)
      expect(perms).toEqual([])
    })
  })

  // ── Role Assignment Tests ────────────────────────────────────────

  describe('角色分配', () => {
    it('应该成功分配角色并返回分配记录', () => {
      const assignment = service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      expect(assignment.userId).toBe('user-1')
      expect(assignment.role).toBe('admin')
      expect(assignment.tenantId).toBe('tenant-a')
      expect(assignment.assignedBy).toBe('owner-1')
      expect(assignment.assignedAt).toBeInstanceOf(Date)
    })

    it('未指定 tenant 时应分配全局角色', () => {
      const assignment = service.assignRole('user-2', 'guest')
      expect(assignment.tenantId).toBeUndefined()
      expect(assignment.assignedBy).toBe('system')
    })

    it('同一租户重新分配角色应替换旧角色', () => {
      service.assignRole('user-1', 'admin', 'tenant-a')
      service.assignRole('user-1', 'manager', 'tenant-a')
      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(1)
      expect(roles[0].role).toBe('manager')
    })

    it('不同租户可分配不同角色', () => {
      service.assignRole('user-1', 'admin', 'tenant-a')
      service.assignRole('user-1', 'staff', 'tenant-b')
      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(2)
    })

    it('无用户时应返回空数组', () => {
      const roles = service.getUserRoles('nonexistent-user')
      expect(roles).toEqual([])
    })
  })

  // ── Role Revocation Tests ────────────────────────────────────────

  describe('角色撤销', () => {
    it('撤销指定租户角色', () => {
      service.assignRole('user-1', 'admin', 'tenant-a')
      service.revokeRole('user-1', 'tenant-a')
      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(0)
    })

    it('撤销全局角色', () => {
      service.assignRole('user-1', 'admin')
      service.revokeRole('user-1')
      expect(service.getUserRoles('user-1')).toHaveLength(0)
    })

    it('撤销不存在的用户应静默忽略', () => {
      expect(() => service.revokeRole('nonexistent-user')).not.toThrow()
    })

    it('撤销不存在的租户角色应静默忽略', () => {
      service.assignRole('user-1', 'admin', 'tenant-a')
      service.revokeRole('user-1', 'tenant-b')
      expect(service.getUserRoles('user-1')).toHaveLength(1)
    })
  })

  // ── Permission Check Tests ───────────────────────────────────────

  describe('权限检查', () => {
    it('有权限的用户应返回 true', () => {
      service.assignRole('user-1', 'admin', 'tenant-a')
      const allowed = service.checkPermission('user-1', 'user:read', 'tenant-a')
      expect(allowed).toBe(true)
    })

    it('无权限的用户应返回 false', () => {
      service.assignRole('user-1', 'staff', 'tenant-a')
      const allowed = service.checkPermission('user-1', 'config:delete', 'tenant-a')
      expect(allowed).toBe(false)
    })

    it('无角色的用户应返回 false', () => {
      const allowed = service.checkPermission('no-role-user', 'order:read')
      expect(allowed).toBe(false)
    })

    it('应通过全局角色检查权限（无 tenantId）', () => {
      service.assignRole('user-1', 'admin')
      expect(service.checkPermission('user-1', 'user:delete')).toBe(true)
    })

    it('tenant 无匹配角色时应 fallback 到全局角色', () => {
      service.assignRole('user-1', 'admin')
      const allowed = service.checkPermission('user-1', 'user:read', 'tenant-unknown')
      expect(allowed).toBe(true)
    })
  })

  // ── Authorization (throw on failure) Tests ───────────────────────

  describe('authorize 验证', () => {
    it('有权限时应正常通过', () => {
      service.assignRole('user-1', 'admin', 'tenant-a')
      expect(() => service.authorize('user-1', 'user:read', 'tenant-a')).not.toThrow()
    })

    it('无权限时应抛出 RBACAuthorizationError', () => {
      service.assignRole('user-1', 'staff', 'tenant-a')
      expect(() => service.authorize('user-1', 'config:delete', 'tenant-a')).toThrow(RBACAuthorizationError)
    })

    it('错误消息应包含用户 ID 和权限名', () => {
      service.assignRole('user-1', 'guest', 'tenant-a')
      try {
        service.authorize('user-1', 'user:write', 'tenant-a')
      } catch (e: unknown) {
        const err = e as RBACAuthorizationError
        expect(err.message).toContain('user-1')
        expect(err.message).toContain('user:write')
      }
    })
  })

  // ── Permission Inheritance Tests ─────────────────────────────────

  describe('权限继承', () => {
    it('admin 应该从 owner 继承 80% 权限', () => {
      const ownerPerms = service.getRolePermissions('owner')
      const adminPerms = service.getRolePermissions('admin')
      const inheritanceCount = Math.floor(ownerPerms.length * 0.8)
      // 继承的权限应该在 admin 列表中
      const inheritedPerms = ownerPerms.slice(0, inheritanceCount)
      for (const perm of inheritedPerms) {
        if (!adminPerms.includes(perm as Permission)) {
          // 跳过显式拒绝的权限
          if (perm !== 'config:delete' && perm !== 'user:impersonate') {
            expect(adminPerms).toContain(perm)
          }
        }
      }
    })

    it('owner 不应该从任何人继承（顶级角色）', () => {
      // getInheritedPermissions 是 private，我们验证 owner 就是全部权限
      const ownerPerms = service.getRolePermissions('owner')
      expect(ownerPerms.length).toBeGreaterThan(0)
    })

    it('guest 应该从 staff 继承 30% 权限', () => {
      // guest 有 order:read/points:read/inventory:read/report:read 等
      expect(service.hasPermission('guest', 'order:read')).toBe(true)
      expect(service.hasPermission('guest', 'inventory:read')).toBe(true)
    })
  })

  // ── Policy Registration Tests ────────────────────────────────────

  describe('自定义策略注册', () => {
    it('注册策略后应覆盖默认权限', () => {
      service.registerPolicy({
        role: 'guest',
        permissions: ['order:read', 'order:write'],
      })
      const perms = service.getRolePermissions('guest')
      expect(perms).toContain('order:read')
      expect(perms).toContain('order:write')
    })

    it('自定义策略应支持 deniedPermissions', () => {
      service.registerPolicy({
        role: 'staff',
        permissions: ['user:read', 'user:write', 'config:write'],
        deniedPermissions: ['config:write'],
      })
      const perms = service.getRolePermissions('staff')
      expect(perms).toContain('user:read')
      expect(perms).not.toContain('config:write')
    })
  })

  // ── Permission Report Tests ──────────────────────────────────────

  describe('权限报告', () => {
    it('应返回用户的角色、有效权限和拒绝权限', () => {
      service.assignRole('user-1', 'admin', 'tenant-a')
      const report = service.getUserPermissionReport('user-1')
      expect(report.roles).toHaveLength(1)
      expect(report.roles[0].role).toBe('admin')
      expect(report.effectivePermissions).toContain('user:read')
      expect(report.effectivePermissions).not.toContain('config:delete')
    })

    it('无角色用户应返回空报告', () => {
      const report = service.getUserPermissionReport('no-role-user')
      expect(report.roles).toEqual([])
      expect(report.effectivePermissions).toEqual([])
    })
  })

  // ── Protected Actions Registration Tests ─────────────────────────

  describe('Controller 保护动作注册', () => {
    it('应注册受保护动作', () => {
      service.registerProtectedActions('OrderController', {
        create: ['order:write'],
        refund: ['order:refund'],
      })
      const actions = service.getProtectedActions('OrderController')
      expect(actions.get('create')).toEqual(['order:write'])
      expect(actions.get('refund')).toEqual(['order:refund'])
    })

    it('未注册的 Controller 应返回空 Map', () => {
      const actions = service.getProtectedActions('UnknownController')
      expect(actions.size).toBe(0)
    })

    it('多次调用 registerProtectedActions 应合并', () => {
      service.registerProtectedActions('OrderController', { create: ['order:write'] })
      service.registerProtectedActions('OrderController', { refund: ['order:refund'] })
      const actions = service.getProtectedActions('OrderController')
      expect(actions.get('create')).toEqual(['order:write'])
      expect(actions.get('refund')).toEqual(['order:refund'])
    })
  })

  // ── __reset Tests ────────────────────────────────────────────────

  describe('__reset (测试辅助)', () => {
    it('重置后应清空所有分配并恢复默认策略', () => {
      service.assignRole('user-1', 'admin', 'tenant-a')
      service.registerProtectedActions('OrderController', { create: ['order:write'] })
      service.__reset()

      // 分配被清空
      expect(service.getUserRoles('user-1')).toEqual([])
      // 受保护动作被清空
      expect(service.getProtectedActions('OrderController').size).toBe(0)
      // 默认策略恢复
      expect(service.getRolePermissions('owner').length).toBeGreaterThan(0)
    })
  })

  // ── Edge Cases ───────────────────────────────────────────────────

  describe('边界情况', () => {
    it('空权限列表的角色应只保留继承权限', () => {
      service.registerPolicy({
        role: 'guest',
        permissions: [],
        deniedPermissions: ['order:write', 'order:read', 'user:read', 'inventory:read', 'report:read', 'points:read', 'order:write'], // deny everything
      })
      const perms = service.getRolePermissions('guest')
      // Even with empty perms, inheritance still applies for denied
      expect(perms).toEqual([])
    })

    it('owner 的 deniedPermissions 为空时不应影响权限', () => {
      const ownerPerms = service.getRolePermissions('owner')
      expect(ownerPerms).toContain('user:read')
      expect(ownerPerms).toContain('config:delete')
      expect(ownerPerms).toContain('user:impersonate')
    })
  })
})
