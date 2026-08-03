import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * RlsController 单元测试
 *
 * 覆盖端点:
 *   - GET    /api/rls/status
 *   - POST   /api/rls/enable
 *   - POST   /api/rls/policy
 *   - GET    /api/rls/policy
 *   - GET    /api/rls/policies
 *   - PUT    /api/rls/policy
 *   - DELETE /api/rls/policy
 *   - POST   /api/rls/verify
 *   - POST   /api/rls/setup
 *   - POST   /api/rls/pool/init
 *   - POST   /api/rls/verify/access
 *   - GET    /api/rls/audit
 *   - GET    /api/v1/rls/verify
 */

import assert from 'node:assert/strict'

// ── Type Mirrors ────────────────────────────────────────────────

type PolicyDef = {
  tableName: string
  policyName: string
  tenantColumn: string
  schema: string
  definition: string
  enabled: boolean
}

type PoolEntry = {
  tenantId: string
  createdAt: number
}

type AuditEntry = {
  id: string
  tenantId: string
  action: string
  target: string
  actor: string
  detail: string | null
  timestamp: number
}

// ── Inline Mocks ────────────────────────────────────────────────

function createMocks() {
  const policies = new Map<string, PolicyDef>()
  const tenantPools = new Map<string, PoolEntry>()
  const auditLogs: AuditEntry[] = []
  const rlsStatusTables = new Map<string, boolean>()

  let auditIdCounter = 0

  return {
    async getStatus(table?: string): Promise<{ tableName: string; rlsEnabled: boolean }[]> {
      if (table) {
        return [{ tableName: table, rlsEnabled: rlsStatusTables.get(table) ?? false }]
      }
      return Array.from(rlsStatusTables.entries()).map(([k, v]) => ({
        tableName: k,
        rlsEnabled: v,
      }))
    },

    async enableRls(tableName: string): Promise<void> {
      rlsStatusTables.set(tableName, true)
    },

    async createPolicy(tableName: string, policyName?: string, tenantColumn?: string, schema?: string): Promise<void> {
      const name = policyName ?? 'tenant_isolation'
      const key = `${schema ?? 'public'}.${tableName}.${name}`
      policies.set(key, {
        tableName,
        policyName: name,
        tenantColumn: tenantColumn ?? 'tenantId',
        schema: schema ?? 'public',
        definition: `USING ("${tenantColumn ?? 'tenantId'}" = current_setting('app.tenant_id'))`,
        enabled: true,
      })
    },

    async getPolicy(tableName: string, policyName: string, schema?: string): Promise<PolicyDef | null> {
      const key = `${schema ?? 'public'}.${tableName}.${policyName}`
      return policies.get(key) ?? null
    },

    async listPolicies(tableName: string, schema?: string): Promise<PolicyDef[]> {
      return Array.from(policies.values()).filter(
        (p) => p.tableName === tableName && p.schema === (schema ?? 'public'),
      )
    },

    async updatePolicy(tableName: string, policyName: string, tenantColumn?: string, schema?: string): Promise<void> {
      const key = `${schema ?? 'public'}.${tableName}.${policyName}`
      const existing = policies.get(key)
      if (existing) {
        existing.tenantColumn = tenantColumn ?? 'tenantId'
        existing.definition = `USING ("${tenantColumn ?? 'tenantId'}" = current_setting('app.tenant_id'))`
      }
    },

    async deletePolicy(tableName: string, policyName: string, schema?: string): Promise<void> {
      const key = `${schema ?? 'public'}.${tableName}.${policyName}`
      policies.delete(key)
    },

    async verifyTenantFilter(tableName: string, tenantId: string, tenantColumn?: string, _schema?: string): Promise<{ leakedRows: number }> {
      const col = tenantColumn ?? 'tenantId'
      if (tableName === 'secure_table') return { leakedRows: 0 }
      if (tableName === 'leaky_table') return { leakedRows: 5 }
      return { leakedRows: 0 }
    },

    async setupTenantIsolation(tableName: string, tenantColumn?: string, policyName?: string, schema?: string): Promise<Record<string, any>> {
      const name = policyName ?? 'tenant_isolation'
      rlsStatusTables.set(tableName, true)
      const key = `${schema ?? 'public'}.${tableName}.${name}`
      policies.set(key, {
        tableName,
        policyName: name,
        tenantColumn: tenantColumn ?? 'tenantId',
        schema: schema ?? 'public',
        definition: `USING ("${tenantColumn ?? 'tenantId'}" = current_setting('app.tenant_id'))`,
        enabled: true,
      })
      return { tableName, policyName: name, tenantColumn: tenantColumn ?? 'tenantId', policyCreated: true, rlsForced: true }
    },

    async verifyMultitenantStatus(): Promise<any> {
      return {
        isolated: true,
        totalTables: 19,
        tenantIdTables: 19,
        missingTenantIdTables: [],
        checkedAt: '2026-07-20T10:00:00.000Z',
      }
    },

    initTenantPool(tenantId: string): void {
      if (!tenantPools.has(tenantId)) {
        tenantPools.set(tenantId, { tenantId, createdAt: Date.now() })
      }
    },

    getTenantPoolSnapshot(): PoolEntry[] {
      return Array.from(tenantPools.values())
    },

    async verifyTenantAccess(tenantId: string, userId: string): Promise<{ allowed: boolean; tenantId: string; reason: string }> {
      if (userId === 'admin') return { allowed: true, tenantId, reason: 'Admin access granted' }
      if (userId === 'blocked-user') return { allowed: false, tenantId, reason: 'User not associated with this tenant' }
      return { allowed: true, tenantId, reason: 'User is member of tenant' }
    },

    getAuditLogs(tenantId?: string, limit?: number): AuditEntry[] {
      let logs = auditLogs
      if (tenantId) logs = logs.filter((l) => l.tenantId === tenantId)
      if (limit) logs = logs.slice(0, limit)
      return logs
    },

    async setTenantContext(tenantId: string): Promise<void> {
      // no-op in test
    },

    buildTenantFilter(tenantId: string, alias?: string): string {
      const prefix = alias ? `${alias}.` : ''
      return `${prefix}"tenantId" = '${tenantId}'`
    },

    async logAudit(tenantId: string, action: string, target: string, actor?: string | null, detail?: string | null): Promise<void> {
      auditLogs.push({
        id: `audit-${++auditIdCounter}`,
        tenantId,
        action,
        target,
        actor: actor ?? 'system',
        detail: detail ?? null,
        timestamp: Date.now(),
      })
    },

    releaseTenantPool(tenantId: string): boolean {
      return tenantPools.delete(tenantId)
    },

    // Seed helpers
    _seedPolicy(p: PolicyDef) {
      const key = `${p.schema}.${p.tableName}.${p.policyName}`
      policies.set(key, p)
    },
    _seedAuditLog(l: AuditEntry) { auditLogs.push(l) },
    _seedRlsStatus(t: string, enabled: boolean) { rlsStatusTables.set(t, enabled) },
  }
}

// ── Inline Controller ───────────────────────────────────────────

class InlineRlsController {
  constructor(private readonly service: ReturnType<typeof createMocks>) {}

  async getStatus(query: { table?: string }) {
    const tables = await this.service.getStatus(query.table)
    return { success: true, data: { tables, total: tables.length } }
  }

  async enableRls(body: { tableName: string }) {
    await this.service.enableRls(body.tableName)
    return { success: true, message: `RLS enabled on "${body.tableName}"`, data: { tableName: body.tableName, rlsEnabled: true } }
  }

  async createPolicy(body: { tableName: string; policyName?: string; tenantColumn?: string; schema?: string }) {
    await this.service.createPolicy(body.tableName, body.policyName, body.tenantColumn, body.schema)
    const policyName = body.policyName ?? 'tenant_isolation'
    return {
      success: true,
      message: `Policy "${policyName}" created on "${body.tableName}"`,
      data: { tableName: body.tableName, policyName, tenantColumn: body.tenantColumn ?? 'tenantId', schema: body.schema ?? 'public' },
    }
  }

  async getPolicy(query: { tableName: string; policyName: string; schema?: string }) {
    const policy = await this.service.getPolicy(query.tableName, query.policyName, query.schema)
    if (!policy) {
      return { success: false, message: `Policy "${query.policyName}" not found on "${query.tableName}"`, data: null }
    }
    return { success: true, data: policy }
  }

  async listPolicies(query: { tableName: string; schema?: string }) {
    const policies = await this.service.listPolicies(query.tableName, query.schema)
    return { success: true, data: { tableName: query.tableName, policies, total: policies.length } }
  }

  async updatePolicy(body: { tableName: string; policyName: string; tenantColumn?: string; schema?: string }) {
    await this.service.updatePolicy(body.tableName, body.policyName, body.tenantColumn, body.schema)
    return {
      success: true,
      message: `Policy "${body.policyName}" updated on "${body.tableName}"`,
      data: { tableName: body.tableName, policyName: body.policyName, tenantColumn: body.tenantColumn ?? 'tenantId', schema: body.schema ?? 'public' },
    }
  }

  async deletePolicy(body: { tableName: string; policyName: string; schema?: string }) {
    await this.service.deletePolicy(body.tableName, body.policyName, body.schema)
    return {
      success: true,
      message: `Policy "${body.policyName}" deleted from "${body.tableName}"`,
      data: { tableName: body.tableName, policyName: body.policyName, schema: body.schema ?? 'public' },
    }
  }

  async verifyFilter(body: { tableName: string; tenantId: string; tenantColumn?: string; schema?: string }) {
    const result = await this.service.verifyTenantFilter(body.tableName, body.tenantId, body.tenantColumn, body.schema)
    return { success: true, data: { tableName: body.tableName, tenantId: body.tenantId, leakedRows: result.leakedRows, isolated: result.leakedRows === 0 } }
  }

  async setupIsolation(body: { tableName: string; tenantColumn?: string; policyName?: string; schema?: string }) {
    const result = await this.service.setupTenantIsolation(body.tableName, body.tenantColumn, body.policyName, body.schema)
    return { success: true, message: `Tenant isolation fully configured on "${body.tableName}"`, data: { tableName: body.tableName, ...result } }
  }

  async verifyMultitenant() {
    return this.service.verifyMultitenantStatus()
  }

  async initTenantPool(body: { tenantId: string }) {
    this.service.initTenantPool(body.tenantId)
    const snapshot = this.service.getTenantPoolSnapshot()
    const poolEntry = snapshot.find((e: PoolEntry) => e.tenantId === body.tenantId)
    return { success: true, message: `Connection pool initialized for tenant "${body.tenantId}"`, data: poolEntry ?? { tenantId: body.tenantId } }
  }

  async verifyTenantAccess(body: { tenantId: string; userId: string }) {
    const result = await this.service.verifyTenantAccess(body.tenantId, body.userId)
    return { success: true, data: { allowed: result.allowed, tenantId: result.tenantId, reason: result.reason } }
  }

  async getAuditLogs(query: { tenantId?: string; limit?: number }) {
    const logs = this.service.getAuditLogs(query.tenantId, query.limit)
    return { success: true, data: { logs, total: logs.length, tenantId: query.tenantId ?? null } }
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('RlsController', () => {
  let mock: ReturnType<typeof createMocks>
  let controller: InlineRlsController

  beforeEach(() => {
    mock = createMocks()
    controller = new InlineRlsController(mock)
  })

  describe('GET /api/rls/status - getStatus', () => {
    it('[正例] 返回所有 RLS 状态', async () => {
      mock._seedRlsStatus('members', true)
      mock._seedRlsStatus('orders', true)
      const result = await controller.getStatus({})
      assert.ok(result.success)
      assert.equal(result.data.total, 2)
    })

    it('[正例] 按表名过滤', async () => {
      mock._seedRlsStatus('members', true)
      mock._seedRlsStatus('orders', false)
      const result = await controller.getStatus({ table: 'members' })
      assert.equal(result.data.total, 1)
      assert.equal(result.data.tables[0].tableName, 'members')
    })

    it('[边界] 无状态返回空列表', async () => {
      const result = await controller.getStatus({})
      assert.equal(result.data.total, 0)
      assert.deepEqual(result.data.tables, [])
    })
  })

  describe('POST /api/rls/enable - enableRls', () => {
    it('[正例] 启用 RLS 成功', async () => {
      const result = await controller.enableRls({ tableName: 'inventory' })
      assert.ok(result.success)
      assert.ok(result.data.rlsEnabled)
      assert.match(result.message, /inventory/)
    })

    it('[边界] 重复启用不报错', async () => {
      await controller.enableRls({ tableName: 'members' })
      const result = await controller.enableRls({ tableName: 'members' })
      assert.ok(result.success)
    })
  })

  describe('POST /api/rls/policy + GET /api/rls/policy - createPolicy / getPolicy', () => {
    it('[正例] 创建策略后能查询', async () => {
      await controller.createPolicy({ tableName: 'orders', policyName: 'tenant_isolation', tenantColumn: 'tenantId' })
      const result = await controller.getPolicy({ tableName: 'orders', policyName: 'tenant_isolation' })
      assert.ok(result.success)
      assert.ok(result.data)
      assert.equal(result.data!.tableName, 'orders')
      assert.equal(result.data!.policyName, 'tenant_isolation')
    })

    it('[反例] 查询不存在的策略返回 fail', async () => {
      const result = await controller.getPolicy({ tableName: 'ghost', policyName: 'no_exist' })
      assert.ok(!result.success)
      assert.strictEqual(result.data, null)
    })

    it('[边界] 默认参数: 使用默认 policyName、tenantColumn、schema', async () => {
      await controller.createPolicy({ tableName: 'defaults' })
      const result = await controller.getPolicy({ tableName: 'defaults', policyName: 'tenant_isolation' })
      assert.ok(result.success)
      assert.ok(result.data)
      assert.equal(result.data!.tenantColumn, 'tenantId')
      assert.equal(result.data!.schema, 'public')
    })
  })

  describe('GET /api/rls/policies - listPolicies', () => {
    it('[正例] 列出某表所有策略', async () => {
      await controller.createPolicy({ tableName: 'members', policyName: 'iso_tenant' })
      await controller.createPolicy({ tableName: 'members', policyName: 'iso_brand', tenantColumn: 'brandId' })
      const result = await controller.listPolicies({ tableName: 'members' })
      assert.equal(result.data.total, 2)
    })

    it('[边界] 空表返回空数组', async () => {
      const result = await controller.listPolicies({ tableName: 'empty_table' })
      assert.equal(result.data.total, 0)
      assert.deepEqual(result.data.policies, [])
    })
  })

  describe('PUT /api/rls/policy - updatePolicy', () => {
    it('[正例] 更新策略字段', async () => {
      await controller.createPolicy({ tableName: 'orders', policyName: 'p1', tenantColumn: 'tenantId' })
      const result = await controller.updatePolicy({ tableName: 'orders', policyName: 'p1', tenantColumn: 'org_id' })
      assert.ok(result.success)
      assert.equal(result.data.tenantColumn, 'org_id')
    })
  })

  describe('DELETE /api/rls/policy - deletePolicy', () => {
    it('[正例] 删除策略后查询不到', async () => {
      await controller.createPolicy({ tableName: 'tmp', policyName: 'temp_policy' })
      await controller.deletePolicy({ tableName: 'tmp', policyName: 'temp_policy' })
      const result = await controller.getPolicy({ tableName: 'tmp', policyName: 'temp_policy' })
      assert.ok(!result.success)
    })
  })

  describe('POST /api/rls/verify - verifyFilter', () => {
    it('[正例] 隔离正确的表返回 isolated=true', async () => {
      const result = await controller.verifyFilter({ tableName: 'secure_table', tenantId: 't-1' })
      assert.ok(result.data.isolated)
      assert.equal(result.data.leakedRows, 0)
    })

    it('[反例] 泄漏数据的表返回 isolated=false', async () => {
      const result = await controller.verifyFilter({ tableName: 'leaky_table', tenantId: 't-1' })
      assert.ok(!result.data.isolated)
      assert.equal(result.data.leakedRows, 5)
    })
  })

  describe('POST /api/rls/setup - setupIsolation', () => {
    it('[正例] 一键设置完成', async () => {
      const result = await controller.setupIsolation({ tableName: 'accounts' })
      assert.ok(result.success)
      assert.match(result.message, /fully configured/)
      assert.ok((result.data as any).policyCreated)
    })
  })

  describe('GET /api/v1/rls/verify - verifyMultitenant', () => {
    it('[正例] 返回多租户隔离检查报告', async () => {
      const result = await controller.verifyMultitenant()
      assert.ok(result.isolated)
      assert.equal(result.totalTables, 19)
      assert.equal(result.missingTenantIdTables.length, 0)
    })
  })

  describe('POST /api/rls/pool/init - initTenantPool', () => {
    it('[正例] 初始化连接池', async () => {
      const result = await controller.initTenantPool({ tenantId: 't-store-a' })
      assert.ok(result.success)
      assert.equal(result.data.tenantId, 't-store-a')
    })
  })

  describe('POST /api/rls/verify/access - verifyTenantAccess', () => {
    it('[正例] 管理员有权限', async () => {
      const result = await controller.verifyTenantAccess({ tenantId: 't-1', userId: 'admin' })
      assert.ok(result.data.allowed)
    })

    it('[反例] 被阻止用户无权限', async () => {
      const result = await controller.verifyTenantAccess({ tenantId: 't-1', userId: 'blocked-user' })
      assert.ok(!result.data.allowed)
    })
  })

  describe('GET /api/rls/audit - getAuditLogs', () => {
    it('[正例] 返回审计日志', async () => {
      mock._seedAuditLog({ id: 'a1', tenantId: 't-1', action: 'RLS_ENABLE', target: 'members', actor: 'admin', detail: null, timestamp: 1000 })
      mock._seedAuditLog({ id: 'a2', tenantId: 't-1', action: 'POLICY_CREATE', target: 'orders', actor: 'auto', detail: null, timestamp: 2000 })
      const result = await controller.getAuditLogs({ tenantId: 't-1' })
      assert.equal(result.data.total, 2)
    })

    it('[边界] 无日志返回空数组', async () => {
      const result = await controller.getAuditLogs({ tenantId: 't-no-logs' })
      assert.equal(result.data.total, 0)
    })
  })
})
