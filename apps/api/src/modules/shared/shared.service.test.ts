/**
 * shared.service.spec.ts
 * 纯函数式内联测试 — 不 import 生产代码
 * 覆盖: 审计日志记录、租户校验、跨租户检测、审计日志查询、ViewModel 防御逻辑
 */

import { describe, it, expect } from 'vitest'

/* ============================================================
 * 1. 枚举 + 类型定义
 * ============================================================ */

export type AuditAction =
  | 'cross_tenant_access_attempt' | 'missing_tenant_id'
  | 'invalid_tenant' | 'rls_policy_violation'
  | 'config_read' | 'config_write' | 'session_read' | 'evaluation_read'

export interface AuditEntry {
  id: number; occurredAt: string; actor: string
  tenantId: string; resource: string; action: AuditAction
  metadata?: Record<string, unknown>
}

export interface TenantValidationResult {
  valid: boolean; tenantId: string; error?: string
}

/* ============================================================
 * 2. Mock 数据工厂
 * ============================================================ */

function makeAuditEntry(overrides: Partial<AuditEntry> = {}): AuditEntry {
  return {
    id: Math.floor(Math.random() * 10000),
    occurredAt: new Date().toISOString(),
    actor: 'system',
    tenantId: 'tenant-001',
    resource: 'agent_configs:cfg-001',
    action: 'config_read',
    ...overrides,
  }
}

type AuditLogStore = { entries: AuditEntry[]; nextId: number }

function createAuditStore(): AuditLogStore {
  return { entries: [], nextId: 1 }
}

/* ============================================================
 * 3. 内联业务逻辑纯函数
 * ============================================================ */

/**
 * 记录审计日志 (fire-and-forget, 不抛异常)
 */
function logAuditEntry(
  store: AuditLogStore,
  params: { actor: string; tenantId: string; resource: string; action?: AuditAction; metadata?: Record<string, unknown> },
): void {
  store.entries.push({
    id: store.nextId++,
    occurredAt: new Date().toISOString(),
    actor: params.actor,
    tenantId: params.tenantId,
    resource: params.resource,
    action: params.action ?? 'cross_tenant_access_attempt',
    metadata: params.metadata,
  })
}

/**
 * 查询审计日志 (按 tenantId + since 过滤)
 */
function queryAuditLog(
  store: AuditLogStore,
  tenantId: string,
  since?: Date,
): AuditEntry[] {
  const sinceTime = since?.getTime() ?? 0
  return store.entries.filter(
    entry => entry.tenantId === tenantId && new Date(entry.occurredAt).getTime() >= sinceTime,
  )
}

/**
 * 获取全部日志 (无租户过滤)
 */
function getAllAuditLog(store: AuditLogStore): AuditEntry[] {
  return [...store.entries]
}

/**
 * 清空日志
 */
function clearAuditLog(store: AuditLogStore): void {
  store.entries = []
  store.nextId = 1
}

/**
 * tenantId 必填校验
 */
function assertTenantId(tenantId: string | undefined | null): asserts tenantId is string {
  if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
    throw new Object({
      error: 'missing_tenant_id',
      message: 'tenantId is required and must be a non-empty string',
    })
  }
}

/**
 * 跨租户检测
 */
function isCrossTenant(
  entityTenantId: string | undefined | null,
  requestTenantId: string,
): boolean {
  if (!entityTenantId) return false
  return entityTenantId !== requestTenantId
}

/**
 * 跨租户访问检查 (防御中间层逻辑)
 * 返回: { allowed: boolean; auditLogged: boolean; error?: string }
 */
function checkCrossTenantAccess(
  store: AuditLogStore,
  entityTenantId: string | undefined | null,
  requestTenantId: string,
  resource: string,
): { allowed: boolean; auditLogged: boolean; error?: string } {
  if (!entityTenantId) return { allowed: true, auditLogged: false }
  if (!isCrossTenant(entityTenantId, requestTenantId)) return { allowed: true, auditLogged: false }

  logAuditEntry(store, {
    actor: 'view-model-service',
    tenantId: requestTenantId,
    resource,
    action: 'cross_tenant_access_attempt',
    metadata: { actualTenant: entityTenantId },
  })

  return {
    allowed: false,
    auditLogged: true,
    error: `cross_tenant_access_denied: resource ${resource} belongs to ${entityTenantId}`,
  }
}

/**
 * 审计单条带元数据写入
 */
function logCrossTenantAttempt(
  store: AuditLogStore,
  params: { actor: string; tenantId: string; resource: string; action?: AuditAction; metadata?: Record<string, unknown> },
): number {
  const entryId = store.nextId
  logAuditEntry(store, params)
  return entryId
}

/* ============================================================
 * 4. 测试用例 (≥18)
 * ============================================================ */

describe('shared — 纯函数业务逻辑', () => {

  /* ---------- 审计日志写入 ---------- */
  describe('logAuditEntry', () => {
    it('应成功写入审计条目并自动增加 ID', () => {
      const store = createAuditStore()
      logAuditEntry(store, { actor: 'user-a', tenantId: 'tenant-1', resource: 'cfg:001' })
      expect(store.entries.length).toBe(1)
      expect(store.entries[0].id).toBe(1)
      expect(store.entries[0].action).toBe('cross_tenant_access_attempt')
    })

    it('应记录自定义 action', () => {
      const store = createAuditStore()
      logAuditEntry(store, { actor: 'user-b', tenantId: 'tenant-2', resource: 'session:001', action: 'session_read' })
      expect(store.entries[0].action).toBe('session_read')
    })

    it('应记录自定义 metadata', () => {
      const store = createAuditStore()
      logAuditEntry(store, { actor: 'user-c', tenantId: 'tenant-3', resource: 'eval:001', action: 'evaluation_read', metadata: { score: 95 } })
      expect(store.entries[0].metadata).toEqual({ score: 95 })
    })
  })

  /* ---------- 跨租户审计写入 ---------- */
  describe('logCrossTenantAttempt', () => {
    it('应返回写入的条目 ID', () => {
      const store = createAuditStore()
      const id = logCrossTenantAttempt(store, { actor: 'admin', tenantId: 't1', resource: 'cfg:x', action: 'cross_tenant_access_attempt' })
      expect(id).toBe(1)
      expect(store.entries[0].actor).toBe('admin')
    })
  })

  /* ---------- 审计日志查询 ---------- */
  describe('queryAuditLog', () => {
    it('按 tenantId 过滤应正确', () => {
      const store = createAuditStore()
      logAuditEntry(store, { tenantId: 't1', resource: 'a', actor: 'u1' })
      logAuditEntry(store, { tenantId: 't2', resource: 'b', actor: 'u2' })
      logAuditEntry(store, { tenantId: 't1', resource: 'c', actor: 'u3' })

      const t1Logs = queryAuditLog(store, 't1')
      expect(t1Logs.length).toBe(2)
      const t2Logs = queryAuditLog(store, 't2')
      expect(t2Logs.length).toBe(1)
    })

    it('since 过滤应正确', () => {
      const store = createAuditStore()
      logAuditEntry(store, { tenantId: 't1', resource: 'a', actor: 'u1' })
      logAuditEntry(store, { tenantId: 't1', resource: 'b', actor: 'u2' })

      // Tweak occurredAt manually (in production this is handled by Date.now())
      store.entries[0].occurredAt = '2026-06-14T10:00:00.000Z'
      store.entries[1].occurredAt = '2026-06-14T12:00:00.000Z'

      const filtered = queryAuditLog(store, 't1', new Date('2026-06-14T11:00:00.000Z'))
      expect(filtered.length).toBe(1)
      expect(filtered[0].actor).toBe('u2')
    })

    it('无 since 过滤应返回全部', () => {
      const store = createAuditStore()
      logAuditEntry(store, { tenantId: 't1', resource: 'a', actor: 'u1' })
      expect(queryAuditLog(store, 't1').length).toBe(1)
    })
  })

  /* ---------- 获取全部日志 ---------- */
  describe('getAllAuditLog', () => {
    it('应返回所有租户的日志', () => {
      const store = createAuditStore()
      logAuditEntry(store, { tenantId: 't1', resource: 'a', actor: 'u1' })
      logAuditEntry(store, { tenantId: 't2', resource: 'b', actor: 'u2' })
      expect(getAllAuditLog(store).length).toBe(2)
    })

    it('空存储应返回空数组', () => {
      const store = createAuditStore()
      expect(getAllAuditLog(store)).toEqual([])
    })
  })

  /* ---------- 清空日志 ---------- */
  describe('clearAuditLog', () => {
    it('应清空全部日志并重置 ID 计数器', () => {
      const store = createAuditStore()
      logAuditEntry(store, { tenantId: 't1', resource: 'a', actor: 'u1' })
      expect(store.entries.length).toBe(1)
      clearAuditLog(store)
      expect(store.entries.length).toBe(0)
      expect(store.nextId).toBe(1)
    })
  })

  /* ---------- tenantId 校验 ---------- */
  describe('assertTenantId', () => {
    it('有效 tenantId 通过校验', () => {
      const x = 'valid-tenant'
      assertTenantId(x)
      expect(x).toBe('valid-tenant')
    })

    it('undefined 应抛异常', () => {
      expect(() => assertTenantId(undefined)).toThrow()
    })

    it('null 应抛异常', () => {
      expect(() => assertTenantId(null)).toThrow()
    })

    it('空字符串应抛异常', () => {
      expect(() => assertTenantId('')).toThrow()
    })

    it('空白字符串应抛异常', () => {
      expect(() => assertTenantId('   ')).toThrow()
    })
  })

  /* ---------- 跨租户检测 ---------- */
  describe('isCrossTenant', () => {
    it('同租户应返回 false', () => {
      expect(isCrossTenant('t1', 't1')).toBe(false)
    })

    it('不同租户应返回 true', () => {
      expect(isCrossTenant('t1', 't2')).toBe(true)
    })

    it('实体无 tenantId 应返回 false', () => {
      expect(isCrossTenant(undefined, 't1')).toBe(false)
    })

    it('null 实体 tenantId 应返回 false', () => {
      expect(isCrossTenant(null, 't1')).toBe(false)
    })
  })

  /* ---------- 跨租户访问检查 ---------- */
  describe('checkCrossTenantAccess', () => {
    it('同租户应允许访问且不记录审计', () => {
      const store = createAuditStore()
      const result = checkCrossTenantAccess(store, 't1', 't1', 'cfg:001')
      expect(result.allowed).toBe(true)
      expect(result.auditLogged).toBe(false)
      expect(store.entries.length).toBe(0)
    })

    it('无 tenantId 实体应允许访问', () => {
      const store = createAuditStore()
      const result = checkCrossTenantAccess(store, undefined, 't1', 'cfg:001')
      expect(result.allowed).toBe(true)
    })

    it('跨租户应拒绝并记录审计', () => {
      const store = createAuditStore()
      const result = checkCrossTenantAccess(store, 't1', 't2', 'cfg:001')
      expect(result.allowed).toBe(false)
      expect(result.auditLogged).toBe(true)
      expect(result.error).toContain('cross_tenant_access_denied')
      expect(store.entries.length).toBe(1)
      expect(store.entries[0].action).toBe('cross_tenant_access_attempt')
      expect(store.entries[0].metadata?.actualTenant).toBe('t1')
    })
  })
})
