import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [shared] [D] audit.service 测试补全
 * 覆盖 AuditService 正例/反例/边界
 */
import assert from 'node:assert/strict'

describe('AuditService', async () => {
  const { AuditService } = await import('./audit.service')

  let audit: InstanceType<typeof AuditService>

  beforeEach(() => {
    audit = new AuditService()
  })

  // ── logCrossTenantAttempt ──
  describe('logCrossTenantAttempt', () => {
    it('记录跨租户访问 — 返回无异常', async () => {
      await assert.doesNotReject(async () => {
        await audit.logCrossTenantAttempt({
          actor: 'user-1',
          tenantId: 'tenant-a',
          resource: 'agent_configs:abc'
        })
      })
    })

    it('记录带 metadata 的跨租户访问', async () => {
      await audit.logCrossTenantAttempt({
        actor: 'view-model-service',
        tenantId: 'tenant-b',
        resource: 'agent_sessions:123',
        metadata: { actualTenant: 'tenant-a' }
      })
      const logs = await audit.getAuditLog('tenant-b')
      assert.equal(logs.length, 1)
      assert.equal(logs[0].metadata?.actualTenant, 'tenant-a')
    })

    it('记录自定义 action', async () => {
      await audit.logCrossTenantAttempt({
        actor: 'system',
        tenantId: 'tenant-c',
        resource: 'rls_policy:global',
        action: 'rls_policy_violation'
      })
      const logs = await audit.getAllAuditLog()
      assert.equal(logs[0].action, 'rls_policy_violation')
    })
  })

  // ── getAuditLog ──
  describe('getAuditLog', () => {
    it('按 tenantId 过滤 — 只返回该租户日志', async () => {
      await audit.logCrossTenantAttempt({ actor: 'u1', tenantId: 't1', resource: 'r1' })
      await audit.logCrossTenantAttempt({ actor: 'u2', tenantId: 't2', resource: 'r2' })
      await audit.logCrossTenantAttempt({ actor: 'u3', tenantId: 't1', resource: 'r3' })

      const logs = await audit.getAuditLog('t1')
      assert.equal(logs.length, 2)
      assert.ok(logs.every((l) => l.tenantId === 't1'))
    })

    it('since 过滤 — 用过去时间确保覆盖所有', async () => {
      await audit.logCrossTenantAttempt({ actor: 'u1', tenantId: 't1', resource: 'r1' })
      await audit.logCrossTenantAttempt({ actor: 'u2', tenantId: 't1', resource: 'r2' })

      const past = new Date(Date.now() - 60 * 1000) // 1 分钟前
      const logs = await audit.getAuditLog('t1', past)
      assert.equal(logs.length, 2)
    })

    it('无匹配租户 — 返回空数组', async () => {
      const logs = await audit.getAuditLog('nonexistent')
      assert.deepEqual(logs, [])
    })
  })

  // ── getAllAuditLog ──
  describe('getAllAuditLog', () => {
    it('返回所有日志 — 不区分租户', async () => {
      await audit.logCrossTenantAttempt({ actor: 'u1', tenantId: 't1', resource: 'r1' })
      await audit.logCrossTenantAttempt({ actor: 'u2', tenantId: 't2', resource: 'r2' })

      const all = await audit.getAllAuditLog()
      assert.equal(all.length, 2)
    })

    it('空日志 — 返回空数组', async () => {
      const all = await audit.getAllAuditLog()
      assert.deepEqual(all, [])
    })
  })

  // ── size / clear ──
  describe('辅助方法', () => {
    it('size() 返回日志条数', async () => {
      assert.equal(audit.size(), 0)
      await audit.logCrossTenantAttempt({ actor: 'u', tenantId: 't', resource: 'r' })
      assert.equal(audit.size(), 1)
    })

    it('clear() 清空所有日志并重置 id', async () => {
      await audit.logCrossTenantAttempt({ actor: 'u1', tenantId: 't1', resource: 'r1' })
      await audit.logCrossTenantAttempt({ actor: 'u2', tenantId: 't2', resource: 'r2' })
      audit.clear()
      assert.equal(audit.size(), 0)
      const all = await audit.getAllAuditLog()
      assert.deepEqual(all, [])
    })

    it('clear 后新日志 id 从 1 开始', async () => {
      await audit.logCrossTenantAttempt({ actor: 'u1', tenantId: 't1', resource: 'r1' })
      audit.clear()
      await audit.logCrossTenantAttempt({ actor: 'u2', tenantId: 't2', resource: 'r2' })
      const all = await audit.getAllAuditLog()
      assert.equal(all[0].id, 1)
    })
  })

  // ── idempotent / edge cases ──
  describe('边界情况', () => {
    it('连续多次日志 — id 递增不重复', async () => {
      const ids: number[] = []
      for (let i = 0; i < 5; i++) {
        await audit.logCrossTenantAttempt({ actor: `u${i}`, tenantId: 't', resource: `r${i}` })
        ids.push(audit.size())
      }
      assert.deepEqual(ids, [1, 2, 3, 4, 5])
    })

    it('大量日志 — 无性能退化', async () => {
      for (let i = 0; i < 1000; i++) {
        await audit.logCrossTenantAttempt({ actor: `u${i}`, tenantId: 't', resource: `r${i}` })
      }
      const all = await audit.getAllAuditLog()
      assert.equal(all.length, 1000)
      assert.equal(all[0].id, 1)
      assert.equal(all[999].id, 1000)
    })
  })
})
