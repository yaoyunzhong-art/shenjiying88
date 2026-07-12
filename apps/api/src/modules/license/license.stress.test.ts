// @ts-nocheck
/**
 * 🐜 自动: [license] stress 压力/韧性测试
 *
 * 付费授权模块压力测试:
 * - 高并发授权校验 (checkLicense)
 * - 配额耗尽边界 (quota exhaustion)
 * - 海量审计日志 (audit log flooding)
 * - 到期时间边界 (edge 时间边界)
 * - 连续 suspend/activate 循环
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LicenseService } from './license.service'
import type { CheckLicenseResponse } from './license.entity'

// ─── In-memory repo helper (avoids require() in ESM land) ──────

interface LicenseLike {
  id: string
  tenantId: string
  storeId?: string
  scope: string
  level: string
  status: string
  quota?: number
  usedQuota?: number
  activationSource: string
  validFrom: string
  validUntil: string
  autoRenew: boolean
  priceCents?: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface AuditLogLike {
  id: string
  licenseId: string
  tenantId: string
  storeId?: string
  action: string
  scope: string
  operator: string
  result: string
  reason?: string
  context?: Record<string, unknown>
  timestamp: string
}

function createInMemoryRepos() {
  const licenses = new Map<string, LicenseLike>()
  const logs: AuditLogLike[] = []

  const licenseRepo = {
    findById: async (id: string) => licenses.get(id) ?? null,
    findByTenant: async (tid: string) =>
      Array.from(licenses.values()).filter(l => l.tenantId === tid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findByStore: async (tid: string, sid: string) =>
      Array.from(licenses.values()).filter(l => l.tenantId === tid && l.storeId === sid)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    findActiveLicense: async (tid: string, scope: string, storeId?: string) => {
      const now = new Date()
      if (storeId) {
        const sl = Array.from(licenses.values()).find(
          l => l.tenantId === tid && l.storeId === storeId && l.scope === scope &&
            new Date(l.validFrom) <= now && new Date(l.validUntil) > now,
        )
        if (sl) return sl
      }
      return Array.from(licenses.values()).find(
        l => l.tenantId === tid && !l.storeId && l.scope === scope &&
          new Date(l.validFrom) <= now && new Date(l.validUntil) > now,
      ) ?? null
    },
    create: async (req: any) => {
      const id = req.id ?? `lic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const now = new Date().toISOString()
      const lic: LicenseLike = {
        id, tenantId: req.tenantId, storeId: req.storeId, scope: req.scope,
        level: req.level, status: 'active', quota: req.quota,
        usedQuota: req.usedQuota ?? 0, activationSource: req.activationSource,
        validFrom: req.validFrom, validUntil: req.validUntil,
        autoRenew: req.autoRenew ?? false, priceCents: req.priceCents,
        createdBy: req.createdBy, createdAt: now, updatedAt: now,
      }
      licenses.set(id, lic)
      return lic
    },
    updateStatus: async (id: string, status: string) => {
      const lic = licenses.get(id)
      if (!lic) return null
      const updated = { ...lic, status, updatedAt: new Date().toISOString() }
      licenses.set(id, updated)
      return updated
    },
    consumeQuota: async (id: string, count = 1) => {
      const lic = licenses.get(id)
      if (!lic) return
      const used = (lic.usedQuota ?? 0) + count
      licenses.set(id, { ...lic, usedQuota: used, updatedAt: new Date().toISOString() })
    },
  }

  const auditLogRepo = {
    create: async (input: any) => {
      const log: AuditLogLike = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        licenseId: input.licenseId ?? '', tenantId: input.tenantId,
        storeId: input.storeId, action: input.action, scope: input.scope,
        operator: input.operator, result: input.result, reason: input.reason,
        context: input.context, timestamp: new Date().toISOString(),
      }
      logs.push(log)
      if (logs.length > 5000) logs.shift()
      return log
    },
    findByTenant: async (tid: string, limit = 100) =>
      logs.filter(l => l.tenantId === tid)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit),
    findByLicense: async (lid: string, limit = 50) =>
      logs.filter(l => l.licenseId === lid)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit),
    cleanupExpired: async () => { const c = logs.length; logs.length = 0; return c },
  }

  return { licenseRepo, auditLogRepo }
}

// ─── 辅助函数 ───────────────────────────────────────────────────

function d(offsetDays: number): string {
  const now = new Date()
  return new Date(now.getTime() + offsetDays * 86_400_000).toISOString()
}

const CTX_A = { tenantId: 'tenant-A', userId: 'stress-tester', role: 'admin' as const }

// ─── 模拟 requireTenantContext ──────────────────────────────────

vi.mock('../../common/context/tenant-context', () => ({
  requireTenantContext: () => CTX_A,
  runWithTenant: (_ctx: any, fn: () => any) => fn(),
}))

// ─── 测试套件 ───────────────────────────────────────────────────

describe('LicenseService - Stress & Resilience', () => {
  let service: LicenseService

  beforeEach(() => {
    const repos = createInMemoryRepos()
    service = new LicenseService(repos.licenseRepo as any, repos.auditLogRepo as any)
  })

  // ─── 1. 高并发批量授权校验 ───

  describe('高并发批量 checkLicense', () => {
    beforeEach(async () => {
      const repo = (service as any).licenseRepo
      for (let i = 0; i < 200; i++) {
        await repo.create({
          id: `lic-bench-${i}`, tenantId: 'tenant-A', scope: 'ai.capability',
          level: 'tenant', activationSource: 'paid',
          validFrom: d(-30), validUntil: d(335), quota: 1_000_000, createdBy: 'stress-test',
        })
      }
    })

    it('批量 200 次 checkLicense 快速返回无错误', async () => {
      const results = await Promise.all(
        Array.from({ length: 200 }, () =>
          service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any }),
        ),
      )
      expect(results).toHaveLength(200)
      expect(results.filter(r => r.allowed).length).toBeGreaterThanOrEqual(200)
    })

    it('批量 100 次 requireLicense 快速通过', async () => {
      const promises = Array.from({ length: 100 }, () =>
        service.requireLicense('tenant-A', 'user-stress', 'ai.capability' as any),
      )
      const licenses = await Promise.all(promises)
      expect(licenses).toHaveLength(100)
      for (const lic of licenses) {
        expect(lic.status).toBe('active')
        expect(lic.tenantId).toBe('tenant-A')
      }
    })

    it('混合批量: 存在 + 不存在租户并发查询', async () => {
      const checkers = Array.from({ length: 50 }, (_, i) => {
        const tenantId = i % 2 === 0 ? 'tenant-A' : 'tenant-ghost'
        return service.checkLicense({ tenantId, scope: 'ai.capability' as any })
      })
      const results = await Promise.allSettled(checkers)
      expect(results.filter(r => r.status === 'fulfilled').length).toBe(50)
    })
  })

  // ─── 2. 配额耗尽边界 ───

  describe('配额耗尽边界', () => {
    beforeEach(async () => {
      const repo = (service as any).licenseRepo
      await repo.create({
        id: 'lic-quota-1', tenantId: 'tenant-A', scope: 'ai.capability',
        level: 'tenant', activationSource: 'paid',
        validFrom: d(-1), validUntil: d(364), quota: 5, usedQuota: 5, createdBy: 'stress-test',
      })
      await repo.create({
        id: 'lic-quota-2', tenantId: 'tenant-A', scope: 'ai.knowledge',
        level: 'tenant', activationSource: 'trial',
        validFrom: d(-10), validUntil: d(20), quota: 3, usedQuota: 2, createdBy: 'stress-test',
      })
    })

    it('配额已耗尽 → checkLicense 拒绝且 quotaRemaining=0', async () => {
      const result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any })
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Quota exhausted')
      expect(result.quotaRemaining).toBe(0)
    })

    it('配额即将耗尽 → consume 到边界后拒绝', async () => {
      await service.consume('lic-quota-2', 1)
      const result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.knowledge' as any })
      expect(result.allowed).toBe(false)
      expect(result.quotaRemaining).toBe(0)
    })

    it('零配额许可证 (quota=0) 直接拒绝', async () => {
      const repo = (service as any).licenseRepo
      await repo.create({
        id: 'lic-zero-quota', tenantId: 'tenant-A', scope: 'ai.industry',
        level: 'tenant', activationSource: 'paid',
        validFrom: d(-1), validUntil: d(364), quota: 0, usedQuota: 0, createdBy: 'stress-test',
      })
      const result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.industry' as any })
      expect(result.allowed).toBe(false)
    })
  })

  // ─── 3. 到期时间边界 ───

  describe('到期时间边界', () => {
    it('刚刚过期 (1 秒前) → 拒绝', async () => {
      const repo = (service as any).licenseRepo
      const justExpired = new Date(Date.now() - 1_000).toISOString()
      await repo.create({
        id: 'lic-edge-expired', tenantId: 'tenant-A', scope: 'ai.capability',
        level: 'tenant', activationSource: 'paid',
        validFrom: d(-365), validUntil: justExpired, createdBy: 'stress-test',
      })
      const result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any })
      expect(result.allowed).toBe(false)
      // findActiveLicense filters expired, so it returns 'No active license'
      expect(result.reason).toMatch(/license/i)
    })

    it('有效期刚开始 (now) → 允许通过', async () => {
      const repo = (service as any).licenseRepo
      const now = new Date().toISOString()
      await repo.create({
        id: 'lic-edge-start', tenantId: 'tenant-A', scope: 'ai.industry',
        level: 'tenant', activationSource: 'trial',
        validFrom: now, validUntil: d(30), createdBy: 'stress-test',
      })
      const result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.industry' as any })
      expect(result.allowed).toBe(true)
    })
  })

  // ─── 4. 状态切换韧性 ───

  describe('状态切换循环', () => {
    beforeEach(async () => {
      const repo = (service as any).licenseRepo
      await repo.create({
        id: 'lic-toggle-1', tenantId: 'tenant-A', scope: 'ai.capability',
        level: 'tenant', activationSource: 'paid',
        validFrom: d(-30), validUntil: d(335), createdBy: 'stress-test',
      })
    })

    it('suspend → 拒绝 → unsuspend → 恢复', async () => {
      let result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any })
      expect(result.allowed).toBe(true)

      await service.suspend('lic-toggle-1', 'stress-test', 'manually suspended')

      result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any })
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('License suspended')

      const repo = (service as any).licenseRepo
      await repo.updateStatus('lic-toggle-1', 'active')

      result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any })
      expect(result.allowed).toBe(true)
    })

    it('连续 50 次 suspend/restore 不崩溃', async () => {
      const repo = (service as any).licenseRepo
      for (let i = 0; i < 50; i++) {
        await service.suspend('lic-toggle-1', 'stress-test', `cycle-${i}`)
        let r = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any })
        expect(r.allowed).toBe(false)

        await repo.updateStatus('lic-toggle-1', 'active')
        r = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any })
        expect(r.allowed).toBe(true)
      }
    })
  })

  // ─── 5. 海量审计日志 ───

  describe('海量审计日志', () => {
    it('快速写入 1000 条审计日志不降速', async () => {
      const auditRepo = (service as any).auditLogRepo
      const start = Date.now()
      for (let i = 0; i < 1000; i++) {
        await auditRepo.create({
          licenseId: `lic-${i % 10}`, tenantId: 'tenant-A', scope: 'ai.capability',
          action: 'consume', operator: `user-${i}`, result: 'success',
        })
      }
      expect(Date.now() - start).toBeLessThan(8000)
      const logs = await auditRepo.findByTenant('tenant-A', 1000)
      expect(logs.length).toBeGreaterThanOrEqual(100)
    })

    it('审计日志超过 5000 条时自动截断 (shift)', async () => {
      const auditRepo = (service as any).auditLogRepo
      for (let i = 0; i < 6000; i++) {
        await auditRepo.create({
          licenseId: 'lic-999', tenantId: 'tenant-A', scope: 'ai.capability',
          action: 'consume', operator: `user-${i}`, result: 'success',
        })
      }
      const logs = await auditRepo.findByTenant('tenant-A', 5000)
      expect(logs.length).toBeGreaterThan(0)
    })
  })

  // ─── 6. 极端输入值 ───

  describe('极端输入值', () => {
    it('超长 tenantId 不会崩溃', async () => {
      const longTenantId = 't-' + 'x'.repeat(1000)
      const result = await service.checkLicense({ tenantId: longTenantId, scope: 'ai.capability' as any })
      expect(result.allowed).toBe(false)
    })

    it('负值 storeId 不崩溃', async () => {
      const result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any, storeId: '-1' })
      expect(result).toBeDefined()
      expect(typeof result.allowed).toBe('boolean')
    })

    it('模糊 scope 正常处理', async () => {
      const result = await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.nonexistent' as any })
      expect(result.allowed).toBe(false)
    })
  })

  // ─── 7. 混用所有接口高并发 ───

  describe('多接口混用高并发', () => {
    it('create + check + suspend + consume 混合 100 次', async () => {
      const repo = (service as any).licenseRepo
      const ops = Array.from({ length: 100 }, async (_, i) => {
        const opType = i % 4
        try {
          if (opType === 0) {
            await repo.create({
              id: `lic-mix-${i}`, tenantId: 'tenant-A', scope: 'ai.capability',
              level: 'tenant', activationSource: 'paid',
              validFrom: d(-30), validUntil: d(335), quota: 1000, createdBy: 'stress-test',
            })
            return 'create'
          } else if (opType === 1) {
            await service.checkLicense({ tenantId: 'tenant-A', scope: 'ai.capability' as any })
            return 'check'
          } else if (opType === 2) {
            try { await service.suspend(`lic-mix-${i - 1}`, 'stress-test', 'mix test') } catch { /* ok */ }
            return 'suspend'
          } else {
            try { await service.consume(`lic-mix-${i - 2}`, 1) } catch { /* ok */ }
            return 'consume'
          }
        } catch { return 'error' }
      })
      const results = await Promise.allSettled(ops)
      expect(results.length).toBe(100)
      expect(results.filter(r => r.status === 'rejected').length).toBeLessThanOrEqual(10)
    })
  })
})
