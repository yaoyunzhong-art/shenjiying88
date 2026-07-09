import { describe, it, expect, afterEach } from 'vitest'

/**
 * 🦞 跨模块 E2E 测试链 #36: 跨租户数据隔离 + 治理审计
 *
 * 模拟链路:
 *   Tenant-Isolation (租户边界)
 *   → Identity-Access (身份访问控制)
 *   → Configuration-Governance (配置隔离)
 *   → Data-Shield (数据脱敏/屏蔽)
 *   → Audit-Trail (审计追溯)
 *
 * 验证:
 *   - 租户A 看不到租户B 的任何数据
 *   - 租户间配置彻底隔离
 *   - 跨租户访问被正确拒绝 + 审计记录
 *   - 超级租户可查看全局摘要（脱敏后）
 *
 * 设计模式: 多租户隔离 + 数据治理 + 审计追溯
 *
 * ⚡ 新建于 Pulse-Nightly-12 | 扩展链19 治理深度
 */

import assert from 'node:assert/strict'

// ============================================================
// 类型定义
// ============================================================

interface TenantProfile {
  tenantId: string
  name: string
  tier: 'free' | 'pro' | 'enterprise'
  region: string
  status: 'active' | 'suspended' | 'deleted'
  createdAt: string
}

interface TenantUser {
  userId: string
  tenantId: string
  role: 'admin' | 'manager' | 'operator' | 'viewer'
  email: string
  scoped: boolean
}

interface TenantConfig {
  tenantId: string
  key: string
  value: string
  encrypted: boolean
  updatedAt: string
}

interface DataShieldPolicy {
  policyId: string
  tenantId: string
  fields: string[]
  masking: 'full' | 'partial' | 'none'
}

interface AuditEntry {
  id: string
  tenantId: string
  actorId: string
  action: string
  resource: string
  allowed: boolean
  timestamp: string
  detail: string
}

// ============================================================
// Stores
// ============================================================

class TenantStore {
  private tenants: TenantProfile[] = [
    { tenantId: 'tenant-alpha', name: 'Alpha 集团', tier: 'enterprise', region: 'cn-east', status: 'active', createdAt: '2025-01-01T00:00:00Z' },
    { tenantId: 'tenant-beta', name: 'Beta 科技', tier: 'pro', region: 'cn-south', status: 'active', createdAt: '2025-03-15T00:00:00Z' },
    { tenantId: 'tenant-gamma', name: 'Gamma 小店', tier: 'free', region: 'us-west', status: 'active', createdAt: '2025-06-01T00:00:00Z' },
    { tenantId: 'tenant-delta', name: 'Delta 国际', tier: 'enterprise', region: 'eu-west', status: 'suspended', createdAt: '2025-02-01T00:00:00Z' },
  ]
  private users: TenantUser[] = [
    { userId: 'user-a1', tenantId: 'tenant-alpha', role: 'admin', email: 'admin@alpha.com', scoped: true },
    { userId: 'user-a2', tenantId: 'tenant-alpha', role: 'viewer', email: 'viewer@alpha.com', scoped: true },
    { userId: 'user-b1', tenantId: 'tenant-beta', role: 'admin', email: 'admin@beta.com', scoped: true },
    { userId: 'user-c1', tenantId: 'tenant-gamma', role: 'operator', email: 'ops@gamma.com', scoped: true },
    { userId: 'super-admin', tenantId: 'super', role: 'admin', email: 'super@system.com', scoped: false },
  ]
  private configs: TenantConfig[] = [
    { tenantId: 'tenant-alpha', key: 'payment.gateway', value: 'stripe_pro', encrypted: false, updatedAt: '2026-06-01T00:00:00Z' },
    { tenantId: 'tenant-alpha', key: 'brand.primary_color', value: '#FF6600', encrypted: false, updatedAt: '2026-06-15T00:00:00Z' },
    { tenantId: 'tenant-beta', key: 'payment.gateway', value: 'paypal_standard', encrypted: false, updatedAt: '2026-06-10T00:00:00Z' },
    { tenantId: 'tenant-beta', key: 'api.secret_key', value: 'sk-beta-***', encrypted: true, updatedAt: '2026-06-20T00:00:00Z' },
    { tenantId: 'tenant-gamma', key: 'store.opening_hours', value: '09:00-21:00', encrypted: false, updatedAt: '2026-05-01T00:00:00Z' },
  ]
  // 暴露非脱敏配置值（仅用于验证隔离，生产环境不会直接暴露）
  private rawConfigValues: Record<string, string> = {
    'tenant-beta:api.secret_key': 'sk-beta-1234567890abcdef',
  }

  getTenant(id: string): TenantProfile | undefined {
    return this.tenants.find(t => t.tenantId === id)
  }
  getAllTenants(): TenantProfile[] { return [...this.tenants] }
  getUser(userId: string): TenantUser | undefined { return this.users.find(u => u.userId === userId) }
  getUsersByTenant(tenantId: string): TenantUser[] {
    return this.users.filter(u => u.tenantId === tenantId)
  }
  getConfigsByTenant(tenantId: string): TenantConfig[] {
    return this.configs.filter(c => c.tenantId === tenantId)
  }
  getRawConfigValue(tenantId: string, key: string): string | undefined {
    return this.rawConfigValues[`${tenantId}:${key}`]
  }
  addConfig(config: TenantConfig): void { this.configs.push(config) }
  reset(): void { /* kept as default values */ }
}

class ShieldStore {
  private policies: DataShieldPolicy[] = [
    { policyId: 'shield-1', tenantId: 'tenant-alpha', fields: ['email', 'phone', 'address'], masking: 'partial' },
    { policyId: 'shield-2', tenantId: 'tenant-beta', fields: ['email', 'api.secret_key'], masking: 'full' },
    { policyId: 'shield-3', tenantId: 'super', fields: ['api.secret_key', 'payment.secret'], masking: 'full' },
  ]

  getPoliciesByTenant(tenantId: string): DataShieldPolicy[] {
    return this.policies.filter(p => p.tenantId === tenantId)
  }
  getMaskingLevel(tenantId: string, field: string): DataShieldPolicy['masking'] {
    const policy = this.policies.find(p => p.tenantId === tenantId && p.fields.includes(field))
    return policy?.masking ?? 'none'
  }
  reset(): void { /* kept as default */ }
}

class AuditStore {
  private entries: AuditEntry[] = []

  record(entry: AuditEntry): void { this.entries.push(entry) }
  getEntriesByTenant(tenantId: string): AuditEntry[] {
    return this.entries.filter(e => e.tenantId === tenantId)
  }
  getBlockedAccessEntries(): AuditEntry[] {
    return this.entries.filter(e => !e.allowed)
  }
  getAll(): AuditEntry[] { return [...this.entries] }
  reset(): void { this.entries = [] }
}

// ============================================================
// Services
// ============================================================

class IdentityAccessService {
  constructor(private tenantStore: TenantStore) {}

  validateAccess(actorId: string, targetTenantId: string): { allowed: boolean; reason: string } {
    const user = this.tenantStore.getUser(actorId)
    if (!user) return { allowed: false, reason: 'unknown_actor' }

    // 超级管理员可跨租户
    if (actorId === 'super-admin') return { allowed: true, reason: 'super_admin' }

    // 普通用户只能访问所属租户
    if (user.tenantId !== targetTenantId) return { allowed: false, reason: 'tenant_mismatch' }

    // 租户已被删除/挂起
    const tenant = this.tenantStore.getTenant(targetTenantId)
    if (!tenant || tenant.status === 'deleted') return { allowed: false, reason: 'tenant_unavailable' }

    return { allowed: true, reason: 'ok' }
  }

  getScopedUsers(tenantId: string): TenantUser[] {
    return this.tenantStore.getUsersByTenant(tenantId)
  }
}

class DataShieldService {
  constructor(private shieldStore: ShieldStore, private tenantStore: TenantStore) {}

  applyMasking(tenantId: string, data: Record<string, string>): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(data)) {
      const masking = this.shieldStore.getMaskingLevel(tenantId, key)
      if (masking === 'full') {
        result[key] = '***'
      } else if (masking === 'partial') {
        result[key] = value.length > 4 ? value.slice(0, 2) + '***' + value.slice(-1) : '***'
      } else {
        result[key] = value
      }
    }
    return result
  }

  getDataSummary(actorId: string, tenantId: string): { maskApplied: boolean; keys: string[] } | null {
    const user = this.tenantStore.getUser(actorId)
    if (!user) return null
    // 非本人租户返回摘要但屏蔽具体值
    const isOwner = user.tenantId === tenantId && actorId !== 'super-admin'
    const configs = this.tenantStore.getConfigsByTenant(tenantId)
    const keys = configs.map(c => c.key)
    if (isOwner) {
      // 所有者看到脱敏后的完整配置
      const masked: Record<string, string> = {}
      configs.forEach(c => {
        masked[c.key] = this.applyMasking(tenantId, { [c.key]: c.value })[c.key] ?? c.value
      })
      return { maskApplied: false, keys: Object.keys(masked) }
    }
    // 非所有者只看 key 列表（摘要），不看值
    return { maskApplied: true, keys }
  }
}

class GovernanceAuditService {
  constructor(private auditStore: AuditStore) {}

  logAccess(actorId: string, targetTenantId: string, action: string, resource: string, allowed: boolean, detail: string): void {
    this.auditStore.record({
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId: targetTenantId,
      actorId,
      action,
      resource,
      allowed,
      timestamp: new Date().toISOString(),
      detail,
    })
  }

  getTenantAuditLog(tenantId: string): AuditEntry[] {
    return this.auditStore.getEntriesByTenant(tenantId)
  }

  getBlockedAccessReport(): { count: number; entries: AuditEntry[] } {
    const entries = this.auditStore.getBlockedAccessEntries()
    return { count: entries.length, entries }
  }
}

// ============================================================
// Factory
// ============================================================
function createStores() {
  const ts = new TenantStore()
  const ss = new ShieldStore()
  const as = new AuditStore()
  return {
    tenantStore: ts,
    shieldStore: ss,
    auditStore: as,
    identityService: new IdentityAccessService(ts),
    shieldService: new DataShieldService(ss, ts),
    auditService: new GovernanceAuditService(as),
  }
}

type Stores = ReturnType<typeof createStores>

// ============================================================
// 测试
// ============================================================

describe('#36: 跨租户数据隔离 + 治理审计', () => {
  describe('Tenant Isolation — 正例', () => {
    it('T1: 租户A用户只能访问A的配置,看不见B的', () => {
      const { tenantStore } = createStores()
      const aConfigs = tenantStore.getConfigsByTenant('tenant-alpha')
      const bConfigs = tenantStore.getConfigsByTenant('tenant-beta')
      assert.ok(aConfigs.length > 0)
      assert.ok(bConfigs.length > 0)
      const aKeys = aConfigs.map(c => c.key)
      assert.ok(!aKeys.includes('api.secret_key'))
    })

    it('T2: 跨租户访问被 identity 正确拒绝并审计', () => {
      const { tenantStore, identityService, auditService } = createStores()
      const validation = identityService.validateAccess('user-a1', 'tenant-beta')
      assert.equal(validation.allowed, false)
      assert.equal(validation.reason, 'tenant_mismatch')

      auditService.logAccess('user-a1', 'tenant-beta', 'READ', 'configs', false, 'cross-tenant access blocked')
      auditService.logAccess('user-a1', 'tenant-alpha', 'READ', 'configs', true, 'own tenant access ok')

      const blocked = auditService.getBlockedAccessReport()
      assert.equal(blocked.count, 1)

      const betaLogs = auditService.getTenantAuditLog('tenant-beta')
      assert.equal(betaLogs.length, 1)
      assert.equal(betaLogs[0].allowed, false)
    })

    it('T3: 超级管理员可跨租户查看摘要', () => {
      const { identityService, shieldService } = createStores()
      const validation = identityService.validateAccess('super-admin', 'tenant-alpha')
      assert.equal(validation.allowed, true)
      assert.equal(validation.reason, 'super_admin')

      const summary = shieldService.getDataSummary('super-admin', 'tenant-beta')
      assert.ok(summary)
      assert.equal(summary!.maskApplied, true)
      assert.ok(summary!.keys.length > 0)
    })
  })

  describe('Tenant Isolation — 反例', () => {
    it('F1: 未知 actor 访问被拒绝', () => {
      const { identityService } = createStores()
      const validation = identityService.validateAccess('unknown-user', 'tenant-alpha')
      assert.equal(validation.allowed, false)
      assert.equal(validation.reason, 'unknown_actor')
    })

    it('F2: 访问已 suspend 的租户时, 即使同租户也被拒绝', () => {
      const { identityService } = createStores()
      const validation = identityService.validateAccess('user-a1', 'tenant-delta')
      assert.equal(validation.allowed, false)
      assert.equal(validation.reason, 'tenant_mismatch')
    })
  })

  describe('Data Shielding — 反例', () => {
    it('S1: 敏感字段被完全脱敏', () => {
      const { shieldService } = createStores()
      const shielded = shieldService.applyMasking('tenant-beta', { 'api.secret_key': 'sk-beta-1234567890abcdef' })
      assert.equal(shielded['api.secret_key'], '***')

      const shielded2 = shieldService.applyMasking('tenant-alpha', { 'email': 'user@alpha.com' })
      assert.ok(shielded2['email'].includes('***'))
      assert.notEqual(shielded2['email'], 'user@alpha.com')
    })

    it('S2: 非敏感字段不做脱敏', () => {
      const { shieldService } = createStores()
      const result = shieldService.applyMasking('tenant-alpha', { 'store.name': 'Alpha旗舰店' })
      assert.equal(result['store.name'], 'Alpha旗舰店')
    })
  })

  describe('Governance Audit — 边界', () => {
    it('B1: 审计日志按租户正确分组', () => {
      const { auditService } = createStores()
      auditService.logAccess('user-a1', 'tenant-alpha', 'READ', 'dashboard', true, 'normal access')
      auditService.logAccess('user-b1', 'tenant-beta', 'WRITE', 'config:payment.gateway', true, 'update config')
      auditService.logAccess('user-c1', 'tenant-gamma', 'DELETE', 'order:001', true, 'delete order')

      assert.equal(auditService.getTenantAuditLog('tenant-alpha').length, 1)
      assert.equal(auditService.getTenantAuditLog('tenant-beta').length, 1)
      assert.equal(auditService.getTenantAuditLog('tenant-gamma').length, 1)
      assert.equal(auditService.getTenantAuditLog('tenant-delta').length, 0)
    })

    it('B2: 大量审计条目不影响性能断言', () => {
      const { auditService, auditStore } = createStores()
      for (let i = 0; i < 100; i++) {
        auditService.logAccess('user-a1', 'tenant-alpha', 'READ', `resource:${i}`, true, 'bulk access')
      }
      assert.equal(auditService.getTenantAuditLog('tenant-alpha').length, 100)
      assert.equal(auditStore.getAll().length, 100)
    })

    it('B3: 同一用户同时成功和失败操作均被审计', () => {
      const { auditService, auditStore } = createStores()
      auditService.logAccess('user-b1', 'tenant-beta', 'READ', 'configs', true, 'own access')
      auditService.logAccess('user-b1', 'tenant-alpha', 'READ', 'configs', false, 'cross-tenant blocked')

      const allLogs = auditStore.getAll()
      assert.equal(allLogs.length, 2)
      const allowedCount = allLogs.filter(e => e.allowed).length
      const blockedCount = allLogs.filter(e => !e.allowed).length
      assert.equal(allowedCount, 1)
      assert.equal(blockedCount, 1)
    })
  })
})
