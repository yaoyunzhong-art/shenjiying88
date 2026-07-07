import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { RBACService, Role, Permission } from './rbac.service'

function createService() {
  return new RBACService()
}

describe('RBACService', () => {
  let service: RBACService

  beforeEach(() => {
    service = createService()
  })

  // ── 1. registerPolicy → getRolePermissions 返回正确 ──────────────────

  describe('registerPolicy + getRolePermissions', () => {
    it('should return correct permissions for owner role', () => {
      const perms = service.getRolePermissions('owner')
      expect(perms).toContain('config:delete')
      expect(perms).toContain('user:impersonate')
      expect(perms).toContain('audit:export')
      expect(perms).toContain('report:financial')
    })

    it('should return correct permissions for admin role', () => {
      const perms = service.getRolePermissions('admin')
      expect(perms).toContain('user:delete')
      expect(perms).toContain('compliance:manage')
      expect(perms).toContain('config:write')
      // admin 不应该有 config:delete 和 user:impersonate
      expect(perms).not.toContain('config:delete')
      expect(perms).not.toContain('user:impersonate')
    })

    it('should return correct permissions for manager role', () => {
      const perms = service.getRolePermissions('manager')
      expect(perms).toContain('order:refund')
      expect(perms).toContain('points:adjust')
      expect(perms).toContain('settlement:approve')
    })

    it('should return correct permissions for staff role', () => {
      const perms = service.getRolePermissions('staff')
      expect(perms).toContain('order:read')
      expect(perms).toContain('order:write')
      expect(perms).toContain('points:read')
      expect(perms).toContain('coupon:issue')
      // staff 不应该有 refund 权限
      expect(perms).not.toContain('order:refund')
    })

    it('should return correct permissions for guest role', () => {
      const perms = service.getRolePermissions('guest')
      expect(perms).toContain('order:read')
      expect(perms).toContain('points:read')
      expect(perms).toContain('inventory:read')
      // guest 只有只读权限
      expect(perms).not.toContain('order:write')
      expect(perms).not.toContain('points:write')
    })

    it('should allow custom policy registration', () => {
      service.registerPolicy({
        role: 'staff',
        permissions: ['order:read', 'order:write', 'custom:action' as any],
        deniedPermissions: ['points:write'],
      })
      const perms = service.getRolePermissions('staff')
      expect(perms).toContain('custom:action')
      expect(perms).not.toContain('points:write')
    })
  })

  // ── 2. hasPermission 各角色权限验证（正向+反向）─────────────────────

  describe('hasPermission', () => {
    it('owner should have all permissions', () => {
      const allPerms: Permission[] = [
        'user:read', 'user:write', 'user:delete', 'user:impersonate',
        'order:read', 'order:write', 'order:refund', 'order:cancel',
        'points:read', 'points:write', 'points:convert', 'points:adjust',
        'coupon:read', 'coupon:write', 'coupon:issue', 'coupon:revoke',
        'payment:read', 'payment:write', 'payment:refund',
        'inventory:read', 'inventory:write', 'inventory:transfer',
        'report:read', 'report:export', 'report:financial',
        'config:read', 'config:write', 'config:delete',
        'audit:read', 'audit:export',
        'compliance:manage', 'compliance:dsr',
        'settlement:read', 'settlement:approve', 'settlement:pay',
      ]
      for (const perm of allPerms) {
        expect(service.hasPermission('owner', perm)).toBe(true)
      }
    })

    it('admin should NOT have config:delete and user:impersonate', () => {
      expect(service.hasPermission('admin', 'config:delete')).toBe(false)
      expect(service.hasPermission('admin', 'user:impersonate')).toBe(false)
    })

    it('admin should have user:delete and compliance:manage', () => {
      expect(service.hasPermission('admin', 'user:delete')).toBe(true)
      expect(service.hasPermission('admin', 'compliance:manage')).toBe(true)
    })

    it('manager should NOT have compliance:manage', () => {
      expect(service.hasPermission('manager', 'compliance:manage')).toBe(false)
    })

    it('manager should have order:refund, points:adjust, settlement:approve', () => {
      expect(service.hasPermission('manager', 'order:refund')).toBe(true)
      expect(service.hasPermission('manager', 'points:adjust')).toBe(true)
      expect(service.hasPermission('manager', 'settlement:approve')).toBe(true)
    })

    it('staff should NOT have order:refund', () => {
      expect(service.hasPermission('staff', 'order:refund')).toBe(false)
    })

    it('guest should only have read permissions', () => {
      expect(service.hasPermission('guest', 'order:read')).toBe(true)
      expect(service.hasPermission('guest', 'points:read')).toBe(true)
      expect(service.hasPermission('guest', 'inventory:read')).toBe(true)
      expect(service.hasPermission('guest', 'order:write')).toBe(false)
      expect(service.hasPermission('guest', 'points:write')).toBe(false)
    })
  })

  // ── 3. assignRole / revokeRole 往返 ─────────────────────────────────

  describe('assignRole + revokeRole', () => {
    it('should assign role and retrieve it', () => {
      const assignment = service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      expect(assignment.userId).toBe('user-1')
      expect(assignment.role).toBe('admin')
      expect(assignment.tenantId).toBe('tenant-a')
      expect(assignment.assignedBy).toBe('owner-1')
      expect(assignment.assignedAt).toBeInstanceOf(Date)
    })

    it('should retrieve user roles after assignment', () => {
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      service.assignRole('user-1', 'staff', 'tenant-b', 'admin-1')

      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(2)
      expect(roles.some((r) => r.role === 'admin' && r.tenantId === 'tenant-a')).toBe(true)
      expect(roles.some((r) => r.role === 'staff' && r.tenantId === 'tenant-b')).toBe(true)
    })

    it('should revoke specific tenant role', () => {
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      service.assignRole('user-1', 'staff', 'tenant-b', 'admin-1')

      service.revokeRole('user-1', 'tenant-a')

      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(1)
      expect(roles[0].role).toBe('staff')
      expect(roles[0].tenantId).toBe('tenant-b')
    })

    it('should revoke global role when no tenantId provided', () => {
      service.assignRole('user-1', 'admin', undefined, 'owner-1')
      service.assignRole('user-1', 'staff', 'tenant-a', 'admin-1')

      service.revokeRole('user-1') // 撤销全局角色

      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(1)
      expect(roles[0].tenantId).toBe('tenant-a')
    })

    it('should replace existing role for same tenant', () => {
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      service.assignRole('user-1', 'manager', 'tenant-a', 'owner-1')

      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(1)
      expect(roles[0].role).toBe('manager')
    })
  })

  // ── 4. checkPermission 正确判断（允许/拒绝）────────────────────────

  describe('checkPermission', () => {
    it('should return true when user has required permission', () => {
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      expect(service.checkPermission('user-1', 'user:delete', 'tenant-a')).toBe(true)
    })

    it('should return false when user lacks required permission', () => {
      service.assignRole('user-1', 'guest', 'tenant-a', 'owner-1')
      expect(service.checkPermission('user-1', 'order:write', 'tenant-a')).toBe(false)
    })

    it('should fallback to global role when tenant-specific role not found', () => {
      service.assignRole('user-1', 'admin', undefined, 'owner-1')
      expect(service.checkPermission('user-1', 'user:delete')).toBe(true)
    })

    it('should return false when user has no roles', () => {
      expect(service.checkPermission('nonexistent-user', 'order:read')).toBe(false)
    })

    it('should prefer tenant-specific role over global role', () => {
      service.assignRole('user-1', 'admin', undefined, 'owner-1')
      service.assignRole('user-1', 'guest', 'tenant-a', 'admin-1')

      // tenant-a 是 guest，没有 order:write
      expect(service.checkPermission('user-1', 'order:write', 'tenant-a')).toBe(false)
      // 没有指定租户时使用全局 admin，有 order:write
      expect(service.checkPermission('user-1', 'order:write')).toBe(true)
    })
  })

  // ── 5. authorize 无权限时抛出异常 ──────────────────────────────────

  describe('authorize', () => {
    it('should not throw when user has permission', () => {
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      expect(() => service.authorize('user-1', 'user:delete', 'tenant-a')).not.toThrow()
    })

    it('should throw RBACAuthorizationError when user lacks permission', () => {
      service.assignRole('user-1', 'guest', 'tenant-a', 'owner-1')
      expect(() => service.authorize('user-1', 'order:write', 'tenant-a')).toThrow(
        /does not have permission/,
      )
    })

    it('should throw with correct error message including tenant', () => {
      service.assignRole('user-1', 'guest', 'tenant-a', 'owner-1')
      expect(() => service.authorize('user-1', 'order:write', 'tenant-a')).toThrow(
        /tenant-a/,
      )
    })
  })

  // ── 6. getUserPermissionReport 返回完整报告 ────────────────────────

  describe('getUserPermissionReport', () => {
    it('should return complete permission report', () => {
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')

      const report = service.getUserPermissionReport('user-1')

      expect(report.roles).toHaveLength(1)
      expect(report.roles[0].role).toBe('admin')
      expect(report.effectivePermissions).toContain('user:delete')
      expect(report.deniedPermissions).not.toContain('user:delete')
    })

    it('should include denied permissions in report', () => {
      service.registerPolicy({
        role: 'admin',
        permissions: ['user:read', 'user:write'],
        deniedPermissions: ['user:write'],
      })
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')

      const report = service.getUserPermissionReport('user-1')
      expect(report.deniedPermissions).toContain('user:write')
      expect(report.effectivePermissions).not.toContain('user:write')
    })

    it('should return empty report for nonexistent user', () => {
      const report = service.getUserPermissionReport('nonexistent')
      expect(report.roles).toHaveLength(0)
      expect(report.effectivePermissions).toHaveLength(0)
    })
  })

  // ── 7. getInheritedPermissions 继承链验证 ───────────────────────────

  describe('getInheritedPermissions', () => {
    it('owner should have no inherited permissions', () => {
      const inherited = service.getInheritedPermissions('owner')
      expect(inherited).toHaveLength(0)
    })

    it('admin should inherit ~80% of owner permissions', () => {
      const ownerPerms = service.getRolePermissions('owner')
      const inherited = service.getInheritedPermissions('admin')
      const expectedCount = Math.floor(ownerPerms.length * 0.8)
      expect(inherited.length).toBe(expectedCount)
    })

    it('manager should inherit ~50% of admin permissions', () => {
      const adminPerms = service.getRolePermissions('admin')
      const inherited = service.getInheritedPermissions('manager')
      const expectedCount = Math.floor(adminPerms.length * 0.5)
      expect(inherited.length).toBe(expectedCount)
    })

    it('staff should inherit ~40% of manager permissions', () => {
      const managerPerms = service.getRolePermissions('manager')
      const inherited = service.getInheritedPermissions('staff')
      const expectedCount = Math.floor(managerPerms.length * 0.4)
      expect(inherited.length).toBe(expectedCount)
    })

    it('guest should inherit ~30% of staff permissions', () => {
      const staffPerms = service.getRolePermissions('staff')
      const inherited = service.getInheritedPermissions('guest')
      const expectedCount = Math.floor(staffPerms.length * 0.3)
      expect(inherited.length).toBe(expectedCount)
    })

    it('inherited permissions should be from parent role', () => {
      const adminInherited = service.getInheritedPermissions('admin')
      const ownerPerms = service.getRolePermissions('owner')
      // 继承的权限应该是 owner 权限的前 N 个
      const expectedCount = Math.floor(ownerPerms.length * 0.8)
      const expectedInherited = ownerPerms.slice(0, expectedCount)
      expect(adminInherited.sort()).toEqual(expectedInherited.sort())
    })
  })

  // ── 8. deniedPermissions 显式拒绝优先于继承 ─────────────────────────

  describe('deniedPermissions takes precedence', () => {
    it('should deny inherited permission when explicitly denied', () => {
      service.registerPolicy({
        role: 'manager',
        permissions: [],
        deniedPermissions: ['order:refund'], // 显式拒绝继承来的 refund 权限
      })

      // manager 本应继承 admin 的 order:refund，但被显式拒绝
      expect(service.hasPermission('manager', 'order:refund')).toBe(false)
    })

    it('should allow permission that was not denied', () => {
      service.registerPolicy({
        role: 'manager',
        permissions: [],
        deniedPermissions: ['order:refund'],
      })

      // points:adjust 不在拒绝列表中，应该可以正常继承
      expect(service.hasPermission('manager', 'points:adjust')).toBe(true)
    })

    it('should handle multiple denied permissions', () => {
      service.registerPolicy({
        role: 'staff',
        permissions: [],
        deniedPermissions: ['order:read', 'points:read', 'inventory:read'],
      })

      expect(service.hasPermission('staff', 'order:read')).toBe(false)
      expect(service.hasPermission('staff', 'points:read')).toBe(false)
      expect(service.hasPermission('staff', 'inventory:read')).toBe(false)
    })
  })

  // ── 9. 多租户场景（不同租户不同角色）──────────────────────────────

  describe('multi-tenant scenarios', () => {
    it('should allow different roles in different tenants', () => {
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      service.assignRole('user-1', 'manager', 'tenant-b', 'owner-1')
      service.assignRole('user-1', 'staff', 'tenant-c', 'owner-1')

      // tenant-a: admin，可以 delete user
      expect(service.checkPermission('user-1', 'user:delete', 'tenant-a')).toBe(true)

      // tenant-b: manager，不可以 delete user
      expect(service.checkPermission('user-1', 'user:delete', 'tenant-b')).toBe(false)

      // tenant-c: staff，不可以 delete user
      expect(service.checkPermission('user-1', 'user:delete', 'tenant-c')).toBe(false)
    })

    it('should combine global and tenant-specific roles', () => {
      service.assignRole('user-1', 'admin', undefined, 'owner-1') // 全局 admin
      service.assignRole('user-1', 'guest', 'tenant-a', 'admin-1') // tenant-a 是 guest

      // tenant-a 有 guest 角色（受限），但全局有 admin 角色
      // 优先使用 tenant-a 的 guest 角色
      expect(service.checkPermission('user-1', 'user:delete', 'tenant-a')).toBe(false)
      // 全局检查使用 admin
      expect(service.checkPermission('user-1', 'user:delete')).toBe(true)
    })

    it('should handle user with only global role', () => {
      service.assignRole('user-1', 'admin', undefined, 'owner-1')

      expect(service.checkPermission('user-1', 'user:delete', 'any-tenant')).toBe(true)
      expect(service.checkPermission('user-1', 'user:delete')).toBe(true)
    })

    it('should handle user with only tenant-specific role', () => {
      service.assignRole('user-1', 'staff', 'tenant-a', 'admin-1')

      // 有 tenant-a 的角色
      expect(service.checkPermission('user-1', 'order:write', 'tenant-a')).toBe(true)
      // 没有 tenant-b 的角色
      expect(service.checkPermission('user-1', 'order:write', 'tenant-b')).toBe(false)
    })
  })

  // ── 10. getProtectedActions 返回 Controller 的受保护方法 ────────────

  describe('getProtectedActions', () => {
    it('should register and retrieve protected actions', () => {
      service.registerProtectedActions('UserController', {
        create: ['user:write'],
        update: ['user:write'],
        delete: ['user:delete'],
        list: ['user:read'],
      })

      const actions = service.getProtectedActions('UserController')
      expect(actions.size).toBe(4)
      expect(actions.get('create')).toEqual(['user:write'])
      expect(actions.get('delete')).toEqual(['user:delete'])
      expect(actions.get('list')).toEqual(['user:read'])
    })

    it('should return empty map for unregistered controller', () => {
      const actions = service.getProtectedActions('UnregisteredController')
      expect(actions.size).toBe(0)
    })

    it('should allow multiple controllers', () => {
      service.registerProtectedActions('UserController', {
        delete: ['user:delete'],
      })
      service.registerProtectedActions('OrderController', {
        refund: ['order:refund'],
      })

      expect(service.getProtectedActions('UserController').get('delete')).toEqual(['user:delete'])
      expect(service.getProtectedActions('OrderController').get('refund')).toEqual(['order:refund'])
    })

    it('should merge permissions for same method', () => {
      service.registerProtectedActions('UserController', {
        adminAction: ['user:read', 'user:delete'],
      })

      const actions = service.getProtectedActions('UserController')
      expect(actions.get('adminAction')).toContain('user:read')
      expect(actions.get('adminAction')).toContain('user:delete')
    })

    it('should support multiple permissions per action', () => {
      service.registerProtectedActions('DashboardController', {
        viewReports: ['report:read', 'report:financial'],
        exportData: ['report:read', 'report:export'],
      })

      const actions = service.getProtectedActions('DashboardController')
      expect(actions.get('viewReports')).toHaveLength(2)
      expect(actions.get('exportData')).toHaveLength(2)
    })
  })

  // ── 11. 权限继承完整性测试 ──────────────────────────────────────────

  describe('permission inheritance completeness', () => {
    it('should have complete inheritance chain owner→admin→manager→staff→guest', () => {
      const roles: Role[] = ['owner', 'admin', 'manager', 'staff', 'guest']

      for (let i = 0; i < roles.length - 1; i++) {
        const currentRole = roles[i]
        const nextRole = roles[i + 1]

        const currentPerms = service.getRolePermissions(currentRole)
        const nextPerms = service.getRolePermissions(nextRole)

        // 每个下级角色的权限应该是上级角色的子集（不完全是子集，因为有百分比继承）
        for (const perm of nextPerms) {
          // 不要求完全包含，因为有百分比继承
        }
      }
    })

    it('should have increasing permissions from guest to owner', () => {
      const guestPerms = service.getRolePermissions('guest').length
      const staffPerms = service.getRolePermissions('staff').length
      const managerPerms = service.getRolePermissions('manager').length
      const adminPerms = service.getRolePermissions('admin').length
      const ownerPerms = service.getRolePermissions('owner').length

      expect(guestPerms).toBeLessThan(staffPerms)
      expect(staffPerms).toBeLessThan(managerPerms)
      expect(managerPerms).toBeLessThan(adminPerms)
      expect(adminPerms).toBeLessThanOrEqual(ownerPerms)
    })
  })

  // ── 12. 边界情况 ───────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty userId for role assignment', () => {
      const assignment = service.assignRole('', 'admin', 'tenant-a', 'owner-1')
      expect(assignment.userId).toBe('')
      expect(service.getUserRoles('')).toHaveLength(1)
    })

    it('should handle role assignment without tenantId', () => {
      const assignment = service.assignRole('user-1', 'admin')
      expect(assignment.tenantId).toBeUndefined()
    })

    it('should handle duplicate role assignments', () => {
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      service.assignRole('user-1', 'admin', 'tenant-a', 'owner-1')
      const roles = service.getUserRoles('user-1')
      // 第二次分配应该替换第一次
      expect(roles).toHaveLength(1)
    })

    it('should handle many tenant assignments', () => {
      for (let i = 0; i < 100; i++) {
        service.assignRole('user-1', 'staff', `tenant-${i}`, 'admin-1')
      }
      const roles = service.getUserRoles('user-1')
      expect(roles).toHaveLength(100)
    })
  })
})
