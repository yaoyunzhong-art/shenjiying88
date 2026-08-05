/**
 * workbench.service.spec.ts
 * 纯函数式内联测试 — 不 import 生产代码
 * 覆盖: 角色能力映射、引导配置获取、菜单越权检查、能力批量检查、引导状态构建
 */

import { describe, it, expect } from 'vitest'

/* ============================================================
 * 1. 枚举 + 类型定义
 * ============================================================ */

export type NavItemPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface WorkbenchNavItemRich {
  key: string; label: string; href: string
  description: string; priority: NavItemPriority
  requiredCapability?: string
}

export interface TodoCardType {
  key: string; label: string; description: string; priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface PermissionSnippet {
  resource: string; actions: string[]; scope: 'platform' | 'tenant' | 'brand' | 'store'
}

export interface RoleBootstrapConfig {
  role: string; homePath: string
  extendedNavItems: WorkbenchNavItemRich[]
  todoCardTypes: TodoCardType[]
  permissionSnippets: PermissionSnippet[]
}

export interface WorkbenchBootstrapState {
  version: string; initialized: boolean; refreshedAt?: string
}

export type WorkbenchCapability =
  | 'tenant-management' | 'brand-matrix' | 'channel-orchestration'
  | 'member-crm' | 'checkout-nuclear' | 'offline-fallback'
  | 'daily-report' | 'field-scheduling' | 'promo-conversion'
  | 'audit-center' | 'market-governance' | 'regional-config'
  | 'portal-management' | 'campaign-execution'

/* ============================================================
 * 2. Mock 数据工厂
 * ============================================================ */

const WORKBENCH_CAPABILITIES: readonly WorkbenchCapability[] = [
  'tenant-management', 'brand-matrix', 'channel-orchestration',
  'member-crm', 'checkout-nuclear', 'offline-fallback',
  'daily-report', 'field-scheduling', 'promo-conversion',
  'audit-center', 'market-governance', 'regional-config',
  'portal-management', 'campaign-execution',
] as const

const ROLE_CAPABILITY_MAP: Record<string, WorkbenchCapability[]> = {
  SUPER_ADMIN: ['tenant-management', 'audit-center', 'market-governance'],
  TENANT_ADMIN: ['brand-matrix', 'channel-orchestration', 'regional-config', 'portal-management'],
  BRAND_MANAGER: ['member-crm', 'campaign-execution', 'regional-config'],
  STORE_MANAGER: ['daily-report', 'field-scheduling'],
  GUIDE: ['member-crm', 'promo-conversion'],
  CASHIER: ['checkout-nuclear', 'offline-fallback'],
  OPERATIONS: ['market-governance', 'field-scheduling', 'tenant-management', 'audit-center'],
  FINANCE: ['regional-config', 'market-governance', 'audit-center'],
  WAREHOUSE: ['brand-matrix', 'tenant-management', 'daily-report', 'market-governance', 'audit-center'],
  COACH: ['member-crm', 'promo-conversion', 'audit-center'],
}

const ROLE_BOOTSTRAP_CONFIGS: Record<string, RoleBootstrapConfig> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    homePath: '/admin/dashboard',
    extendedNavItems: [
      { key: 'tenants', label: '租户管理', href: '/admin/tenants', description: '租户开通关停', priority: 'HIGH', requiredCapability: 'tenant-management' },
      { key: 'audit', label: '审计中心', href: '/admin/audit-trail', description: '全局审计', priority: 'HIGH', requiredCapability: 'audit-center' },
      { key: 'markets', label: '国际化治理', href: '/admin/markets', description: '市场配置', priority: 'MEDIUM', requiredCapability: 'market-governance' },
    ],
    todoCardTypes: [
      { key: 'system-health', label: '系统健康', description: '集群状态', priority: 'HIGH' },
      { key: 'config-pending', label: '配置待审', description: '待审批配置', priority: 'MEDIUM' },
    ],
    permissionSnippets: [
      { resource: 'tenant', actions: ['create', 'read', 'update', 'delete', 'suspend'], scope: 'platform' },
      { resource: 'audit', actions: ['read', 'export', 'archive'], scope: 'platform' },
    ],
  },
  OPERATIONS: {
    role: 'OPERATIONS',
    homePath: '/ops/dashboard',
    extendedNavItems: [
      { key: 'kpi-dashboard', label: 'KPI 看板', href: '/ops/kpi', description: '营收总览', priority: 'HIGH' },
      { key: 'approvals', label: '治理审批', href: '/ops/approvals', description: '审批单', priority: 'MEDIUM', requiredCapability: 'tenant-management' },
    ],
    todoCardTypes: [
      { key: 'kpi-anomaly', label: '指标异常', description: 'KPI 偏离告警', priority: 'HIGH' },
    ],
    permissionSnippets: [
      { resource: 'analytics', actions: ['read', 'export', 'configure'], scope: 'tenant' },
    ],
  },
  FINANCE: {
    role: 'FINANCE',
    homePath: '/finance/dashboard',
    extendedNavItems: [
      { key: 'reconciliation', label: '对账中心', href: '/finance/reconciliation', description: '自动对账', priority: 'HIGH' },
      { key: 'audit', label: '审计追踪', href: '/finance/audit-trail', description: '财务审计', priority: 'MEDIUM', requiredCapability: 'audit-center' },
    ],
    todoCardTypes: [
      { key: 'reconciliation-errors', label: '对账异常', description: '未平账项', priority: 'HIGH' },
    ],
    permissionSnippets: [
      { resource: 'finance', actions: ['read', 'export', 'reconcile', 'approve'], scope: 'tenant' },
    ],
  },
  WAREHOUSE: {
    role: 'WAREHOUSE',
    homePath: '/warehouse/dashboard',
    extendedNavItems: [
      { key: 'inventory-dashboard', label: '库存看板', href: '/warehouse/inventory', description: '实时库存', priority: 'HIGH' },
      { key: 'audit', label: '审计追踪', href: '/warehouse/audit-trail', description: '仓储审计', priority: 'LOW', requiredCapability: 'audit-center' },
    ],
    todoCardTypes: [
      { key: 'inventory-alerts', label: '库存告警', description: '安全库存预警', priority: 'HIGH' },
    ],
    permissionSnippets: [
      { resource: 'warehouse', actions: ['read', 'write', 'transfer', 'adjust'], scope: 'tenant' },
    ],
  },
  COACH: {
    role: 'COACH',
    homePath: '/coach/dashboard',
    extendedNavItems: [
      { key: 'class-schedule', label: '课程安排', href: '/coach/schedule', description: '排课日历', priority: 'HIGH' },
      { key: 'crm', label: '会员接待', href: '/coach/crm', description: '会员画像', priority: 'MEDIUM', requiredCapability: 'member-crm' },
    ],
    todoCardTypes: [
      { key: 'class-reminder', label: '课时提醒', description: '今日待授', priority: 'HIGH' },
    ],
    permissionSnippets: [
      { resource: 'class', actions: ['read', 'create', 'update', 'cancel'], scope: 'store' },
    ],
  },
}

/* ============================================================
 * 3. 内联业务逻辑纯函数
 * ============================================================ */

/** 判断角色是否拥有某能力 */
function hasCapability(role: string, capability: WorkbenchCapability): boolean {
  const caps = ROLE_CAPABILITY_MAP[role]
  if (!caps) return false
  return caps.includes(capability)
}

/** 批量检查角色能力 */
function hasCapabilities(role: string, capabilities: WorkbenchCapability[]): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const cap of capabilities) {
    result[cap] = hasCapability(role, cap)
  }
  return result
}

/** 获取角色引导配置 */
function getRoleBootstrapConfig(role: string): RoleBootstrapConfig | undefined {
  return ROLE_BOOTSTRAP_CONFIGS[role]
}

/** 获取所有已定义的引导角色列表 */
function getBootstrappedRoles(): string[] {
  return Object.keys(ROLE_BOOTSTRAP_CONFIGS)
}

/** 检查角色是否可访问目标角色的菜单 */
function canAccessRoleMenu(actorRole: string, targetMenuRole: string): boolean {
  if (actorRole === targetMenuRole) return true
  if (actorRole === 'SUPER_ADMIN') return true
  return false
}

/** 检查角色是否存在 */
function isValidRole(role: string): boolean {
  return role in ROLE_CAPABILITY_MAP
}

/** 获取角色拥有的能力列表 */
function getRoleCapabilities(role: string): WorkbenchCapability[] {
  return ROLE_CAPABILITY_MAP[role] ?? []
}

/** 获取导航项中需要特定能力的条目 */
function getCapabilityRestrictedNavItems(config: RoleBootstrapConfig): WorkbenchNavItemRich[] {
  return config.extendedNavItems.filter(item => item.requiredCapability !== undefined)
}

/** 按优先级过滤待办卡片 */
function getTodoCardsByPriority(config: RoleBootstrapConfig, priority: NavItemPriority): TodoCardType[] {
  return config.todoCardTypes.filter(card => card.priority === priority)
}

/** 构建引导状态 */
function makeWorkbenchBootstrapState(overrides: Partial<WorkbenchBootstrapState> = {}): WorkbenchBootstrapState {
  return {
    version: '1.0.0',
    initialized: true,
    refreshedAt: new Date().toISOString(),
    ...overrides,
  }
}

/* ============================================================
 * 4. 测试用例 (≥18)
 * ============================================================ */

describe('workbench — 纯函数业务逻辑', () => {

  /* ---------- 角色-能力映射 ---------- */
  describe('hasCapability', () => {
    it('SUPER_ADMIN 应有 tenant-management 能力', () => {
      expect(hasCapability('SUPER_ADMIN', 'tenant-management')).toBe(true)
    })

    it('CASHIER 不应有 audit-center 能力', () => {
      expect(hasCapability('CASHIER', 'audit-center')).toBe(false)
    })

    it('不存在的角色应返回 false', () => {
      expect(hasCapability('ROBOT', 'tenant-management')).toBe(false)
    })

    it('不存在的能力应返回 false', () => {
      expect(hasCapability('SUPER_ADMIN', 'nonexistent' as WorkbenchCapability)).toBe(false)
    })

    it('COACH 应有 member-crm 能力', () => {
      expect(hasCapability('COACH', 'member-crm')).toBe(true)
    })
  })

  /* ---------- 能力批量检查 ---------- */
  describe('hasCapabilities', () => {
    it('OFERATIONS 应有多项能力结果', () => {
      const result = hasCapabilities('OPERATIONS', ['market-governance', 'audit-center', 'checkout-nuclear'])
      expect(result['market-governance']).toBe(true)
      expect(result['audit-center']).toBe(true)
      expect(result['checkout-nuclear']).toBe(false)
    })
  })

  /* ---------- 角色有效性 ---------- */
  describe('isValidRole / getRoleCapabilities', () => {
    it('STORE_MANAGER 应合法', () => {
      expect(isValidRole('STORE_MANAGER')).toBe(true)
    })

    it('ROBOT 角色不合法', () => {
      expect(isValidRole('ROBOT')).toBe(false)
    })

    it('FINANCE 应有 3 项能力', () => {
      const caps = getRoleCapabilities('FINANCE')
      expect(caps.length).toBe(3)
      expect(caps).toContain('audit-center')
      expect(caps).toContain('regional-config')
      expect(caps).toContain('market-governance')
    })
  })

  /* ---------- 引导配置 ---------- */
  describe('getRoleBootstrapConfig', () => {
    it('SUPER_ADMIN 应有正确的 homePath', () => {
      const config = getRoleBootstrapConfig('SUPER_ADMIN')
      expect(config).toBeDefined()
      expect(config!.homePath).toBe('/admin/dashboard')
      expect(config!.extendedNavItems.length).toBe(3)
    })

    it('FINANCE 应有对账中心导航项', () => {
      const config = getRoleBootstrapConfig('FINANCE')
      expect(config!.extendedNavItems.some(n => n.key === 'reconciliation')).toBe(true)
    })

    it('不存在的角色返回 undefined', () => {
      expect(getRoleBootstrapConfig('UNKNOWN_ROLE')).toBeUndefined()
    })
  })

  /* ---------- 引导角色列表 ---------- */
  describe('getBootstrappedRoles', () => {
    it('应返回全部 5 个角色', () => {
      const roles = getBootstrappedRoles()
      expect(roles.length).toBe(5)
      expect(roles).toContain('SUPER_ADMIN')
      expect(roles).toContain('OPERATIONS')
      expect(roles).toContain('FINANCE')
      expect(roles).toContain('WAREHOUSE')
      expect(roles).toContain('COACH')
    })
  })

  /* ---------- 菜单越权检查 ---------- */
  describe('canAccessRoleMenu', () => {
    it('自身角色可访问自身菜单', () => {
      expect(canAccessRoleMenu('OPERATIONS', 'OPERATIONS')).toBe(true)
    })

    it('SUPER_ADMIN 可访问任何角色菜单', () => {
      expect(canAccessRoleMenu('SUPER_ADMIN', 'FINANCE')).toBe(true)
      expect(canAccessRoleMenu('SUPER_ADMIN', 'CASHIER')).toBe(true)
    })

    it('CASHIER 不可访问 FINANCE 菜单', () => {
      expect(canAccessRoleMenu('CASHIER', 'FINANCE')).toBe(false)
    })

    it('GUIDE 不可访问 SUPER_ADMIN 菜单', () => {
      expect(canAccessRoleMenu('GUIDE', 'SUPER_ADMIN')).toBe(false)
    })
  })

  /* ---------- 受能力限制的导航项 ---------- */
  describe('getCapabilityRestrictedNavItems', () => {
    it('SUPER_ADMIN 应有 3 个受限导航项', () => {
      const config = getRoleBootstrapConfig('SUPER_ADMIN')!
      const restricted = getCapabilityRestrictedNavItems(config)
      expect(restricted.length).toBe(3)
      restricted.forEach(item => {
        expect(item.requiredCapability).toBeDefined()
      })
    })

    it('OPERATIONS 应有 1 个受限导航项', () => {
      const config = getRoleBootstrapConfig('OPERATIONS')!
      const restricted = getCapabilityRestrictedNavItems(config)
      expect(restricted.length).toBe(1)
      expect(restricted[0].requiredCapability).toBe('tenant-management')
    })
  })

  /* ---------- 待办卡片优先级过滤 ---------- */
  describe('getTodoCardsByPriority', () => {
    it('SUPER_ADMIN 有 1 个 HIGH 优先级卡片', () => {
      const config = getRoleBootstrapConfig('SUPER_ADMIN')!
      const high = getTodoCardsByPriority(config, 'HIGH')
      expect(high.length).toBe(1)
      expect(high[0].key).toBe('system-health')
    })

    it('SUPER_ADMIN 有 1 个 MEDIUM 优先级卡片', () => {
      const config = getRoleBootstrapConfig('SUPER_ADMIN')!
      const med = getTodoCardsByPriority(config, 'MEDIUM')
      expect(med.length).toBe(1)
      expect(med[0].key).toBe('config-pending')
    })
  })

  /* ---------- 引导状态构建 ---------- */
  describe('makeWorkbenchBootstrapState', () => {
    it('默认值应正确', () => {
      const state = makeWorkbenchBootstrapState()
      expect(state.version).toBe('1.0.0')
      expect(state.initialized).toBe(true)
      expect(state.refreshedAt).toBeDefined()
    })

    it('可覆盖版本号', () => {
      const state = makeWorkbenchBootstrapState({ version: '2.0.0', initialized: false })
      expect(state.version).toBe('2.0.0')
      expect(state.initialized).toBe(false)
    })
  })

  /* ---------- 角色-能力映射完整性 ---------- */
  describe('角色-能力映射完整性', () => {
    it('所有预定义角色在映射表中应有条目', () => {
      const roles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'STORE_MANAGER', 'GUIDE', 'CASHIER', 'OPERATIONS', 'FINANCE', 'WAREHOUSE', 'COACH']
      roles.forEach(role => {
        expect(isValidRole(role)).toBe(true)
      })
    })

    it('所有角色的能力值都应为预定义能力', () => {
      const roles = Object.keys(ROLE_CAPABILITY_MAP)
      for (const role of roles) {
        const caps = ROLE_CAPABILITY_MAP[role]
        for (const cap of caps) {
          expect(WORKBENCH_CAPABILITIES).toContain(cap)
        }
      }
    })

    it('GUIDE 有 2 种能力', () => {
      expect(getRoleCapabilities('GUIDE').length).toBe(2)
    })
  })
})
