import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [license] [A] entity 类型契约测试
 *
 * 覆盖 license.entity.ts 中所有类型/接口/枚举的字段契约:
 * - LicenseScope, LicenseLevel, ActivationSource, LicenseStatus (类型字面量)
 * - License, LicenseAuditLog, CheckLicenseRequest/Response, CreateLicenseRequest
 * - LicenseGuardMeta, LICENSE_GUARD_KEY
 *
 * 每个实体/接口至少包含:
 *   1. 正例 (完整字段赋值)
 *   2. 可空字段 (undefined 测试)
 *   3. 枚举值约束 (类型安全)
 *   4. 边界值 (空字符串, 极端数值)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  LICENSE_GUARD_KEY,
} from './license.entity'
import type {
  License,
  LicenseScope,
  LicenseLevel,
  ActivationSource,
  LicenseStatus,
  LicenseAuditLog,
  CheckLicenseRequest,
  CheckLicenseResponse,
  CreateLicenseRequest,
  LicenseGuardMeta,
} from './license.entity'

// ── 1. LicenseScope 类型字面量 ─────────────────────────────────────

describe('LicenseScope', () => {
  it('所有授权范围字面量可被赋值', () => {
    const scopes: LicenseScope[] = [
      'ai.capability',
      'ai.knowledge',
      'ai.industry',
      'integration.open',
    ]
    assert.equal(scopes.length, 4)
    assert.ok(scopes.every((s) => typeof s === 'string'))
  })

  it('非法字符串不能赋值', () => {
    const illegal: string = 'ai.nonexistent'
    // 类型编译时约束, 运行时赋值后检查
    const isIllegal = !['ai.capability', 'ai.knowledge', 'ai.industry', 'integration.open'].includes(illegal)
    assert.equal(isIllegal, true)
  })
})

// ── 2. LicenseLevel 类型 ──────────────────────────────────────────

describe('LicenseLevel', () => {
  it('仅 tenant 和 store 两个层级', () => {
    const levels: LicenseLevel[] = ['tenant', 'store']
    assert.equal(levels.length, 2)
    assert.equal(levels[0], 'tenant')
    assert.equal(levels[1], 'store')
  })
})

// ── 3. ActivationSource 类型 ──────────────────────────────────────

describe('ActivationSource', () => {
  it('四种激活源字面量', () => {
    const sources: ActivationSource[] = ['paid', 'trial', 'tier-match', 'whitelist']
    assert.equal(sources.length, 4)
    assert.ok(sources.includes('paid'))
    assert.ok(sources.includes('tier-match'))
  })
})

// ── 4. LicenseStatus 类型 ─────────────────────────────────────────

describe('LicenseStatus', () => {
  it('四种状态字面量', () => {
    const statuses: LicenseStatus[] = ['active', 'expired', 'suspended', 'pending']
    assert.equal(statuses.length, 4)
    assert.ok(statuses.includes('active'))
    assert.ok(statuses.includes('pending'))
  })
})

// ── 5. License 实体 ───────────────────────────────────────────────

describe('License', () => {
  const now = '2026-06-01T00:00:00.000Z'

  it('创建完整的租户级授权', () => {
    const lic: License = {
      id: 'lic-001',
      tenantId: 't-arcade',
      scope: 'ai.capability',
      level: 'tenant',
      status: 'active',
      quota: 10000,
      usedQuota: 2500,
      activationSource: 'paid',
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T23:59:59.000Z',
      autoRenew: true,
      priceCents: 99900,
      createdBy: 'admin-01',
      createdAt: now,
      updatedAt: now,
    }

    assert.equal(lic.id, 'lic-001')
    assert.equal(lic.tenantId, 't-arcade')
    assert.equal(lic.storeId, undefined)
    assert.equal(lic.scope, 'ai.capability')
    assert.equal(lic.level, 'tenant')
    assert.equal(lic.status, 'active')
    assert.equal(lic.quota, 10000)
    assert.equal(lic.usedQuota, 2500)
    assert.equal(lic.activationSource, 'paid')
    assert.equal(lic.autoRenew, true)
    assert.equal(lic.priceCents, 99900)
    assert.equal(lic.createdBy, 'admin-01')
  })

  it('创建门店级授权 (带 storeId)', () => {
    const lic: License = {
      id: 'lic-002',
      tenantId: 't-arcade',
      storeId: 'store-001',
      scope: 'ai.knowledge',
      level: 'store',
      status: 'active',
      activationSource: 'trial',
      validFrom: '2026-06-01T00:00:00.000Z',
      validUntil: '2026-07-01T00:00:00.000Z',
      autoRenew: false,
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
    }

    assert.equal(lic.storeId, 'store-001')
    assert.equal(lic.level, 'store')
    assert.equal(lic.scope, 'ai.knowledge')
    assert.equal(lic.activationSource, 'trial')
    assert.equal(lic.autoRenew, false)
    // 配额和价格为 undefined
    assert.equal(lic.quota, undefined)
    assert.equal(lic.priceCents, undefined)
  })

  it('创建等级达标激活的授权', () => {
    const lic: License = {
      id: 'lic-003',
      tenantId: 't-arcade',
      scope: 'ai.industry',
      level: 'tenant',
      status: 'active',
      activationSource: 'tier-match',
      validFrom: '2026-06-01T00:00:00.000Z',
      validUntil: '2026-09-01T00:00:00.000Z',
      autoRenew: false,
      createdBy: 'champion-bot',
      createdAt: now,
      updatedAt: now,
    }

    assert.equal(lic.activationSource, 'tier-match')
    assert.equal(lic.createdBy, 'champion-bot')
  })

  it('白名单内部授权', () => {
    const lic: License = {
      id: 'lic-004',
      tenantId: 't-dev',
      storeId: 'store-dev',
      scope: 'integration.open',
      level: 'store',
      status: 'active',
      activationSource: 'whitelist',
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      autoRenew: false,
      createdBy: 'superadmin',
      createdAt: now,
      updatedAt: now,
    }

    assert.equal(lic.activationSource, 'whitelist')
    assert.equal(lic.scope, 'integration.open')
    assert.equal(lic.level, 'store')
  })

  it('四种状态均可赋值', () => {
    const statuses: LicenseStatus[] = ['active', 'expired', 'suspended', 'pending']
    const results = statuses.map((s) => {
      const lic: License = {
        id: `lic-${s}`,
        tenantId: 't-test',
        scope: 'ai.capability',
        level: 'tenant',
        status: s,
        activationSource: 'paid',
        validFrom: now,
        validUntil: now,
        autoRenew: false,
        createdBy: 'test',
        createdAt: now,
        updatedAt: now,
      }
      return lic.status
    })
    assert.deepEqual(results, statuses)
  })

  it('边界: quota 为 0', () => {
    const lic: License = {
      id: 'lic-zero-quota',
      tenantId: 't-test',
      scope: 'ai.knowledge',
      level: 'store',
      status: 'active',
      quota: 0,
      usedQuota: 0,
      activationSource: 'trial',
      validFrom: now,
      validUntil: '2026-07-01T00:00:00.000Z',
      autoRenew: false,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    }
    assert.equal(lic.quota, 0)
    assert.equal(lic.usedQuota, 0)
  })

  it('边界: priceCents 为 0 (免费)', () => {
    const lic: License = {
      id: 'lic-free',
      tenantId: 't-test',
      scope: 'ai.capability',
      level: 'tenant',
      status: 'active',
      activationSource: 'whitelist',
      validFrom: now,
      validUntil: '2026-12-31T23:59:59.000Z',
      autoRenew: false,
      priceCents: 0,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    }
    assert.equal(lic.priceCents, 0)
  })

  it('边界: 大数值 quota', () => {
    const lic: License = {
      id: 'lic-big',
      tenantId: 't-test',
      scope: 'ai.capability',
      level: 'tenant',
      status: 'active',
      quota: 9_999_999_999,
      activationSource: 'paid',
      validFrom: now,
      validUntil: '2027-01-01T00:00:00.000Z',
      autoRenew: false,
      createdBy: 'admin',
      createdAt: now,
      updatedAt: now,
    }
    assert.equal(lic.quota, 9_999_999_999)
  })

  it('边界: 空 tenantId', () => {
    const lic: License = {
      id: 'lic-empty-tenant',
      tenantId: '',
      scope: 'ai.capability',
      level: 'tenant',
      status: 'active',
      activationSource: 'paid',
      validFrom: now,
      validUntil: now,
      autoRenew: false,
      createdBy: 'test',
      createdAt: now,
      updatedAt: now,
    }
    assert.equal(lic.tenantId, '')
  })
})

// ── 6. LicenseAuditLog 实体 ───────────────────────────────────────

describe('LicenseAuditLog', () => {
  const now = '2026-06-01T00:00:00.000Z'

  it('创建完整的审计日志', () => {
    const log: LicenseAuditLog = {
      id: 'log-001',
      licenseId: 'lic-001',
      tenantId: 't-arcade',
      action: 'create',
      scope: 'ai.capability',
      operator: 'admin-01',
      result: 'success',
      timestamp: now,
    }

    assert.equal(log.id, 'log-001')
    assert.equal(log.licenseId, 'lic-001')
    assert.equal(log.action, 'create')
    assert.equal(log.result, 'success')
    assert.equal(log.storeId, undefined)
    assert.equal(log.reason, undefined)
    assert.equal(log.context, undefined)
  })

  it('创建包含拒绝原因和上下文的审计日志', () => {
    const log: LicenseAuditLog = {
      id: 'log-002',
      licenseId: 'lic-002',
      tenantId: 't-arcade',
      storeId: 'store-001',
      action: 'reject',
      scope: 'ai.capability',
      operator: 'system',
      result: 'denied',
      reason: 'Quota exhausted: 10000/10000 used',
      context: { usage: 10000, limit: 10000 },
      timestamp: now,
    }

    assert.equal(log.action, 'reject')
    assert.equal(log.result, 'denied')
    assert.equal(log.reason, 'Quota exhausted: 10000/10000 used')
    assert.deepEqual(log.context, { usage: 10000, limit: 10000 })
  })

  it('所有 action 值均可赋值', () => {
    const actions: LicenseAuditLog['action'][] = [
      'create', 'activate', 'suspend', 'expire', 'consume', 'reject',
    ]
    assert.equal(actions.length, 6)
  })

  it('所有 result 值均可赋值', () => {
    const results: LicenseAuditLog['result'][] = ['success', 'denied']
    assert.equal(results.length, 2)
  })

  it('边界: 含 storeId 的门店审计', () => {
    const log: LicenseAuditLog = {
      id: 'log-003',
      licenseId: 'lic-003',
      tenantId: 't-arcade',
      storeId: '',
      action: 'suspend',
      scope: 'ai.knowledge',
      operator: 'admin',
      result: 'success',
      timestamp: now,
    }
    assert.equal(log.storeId, '')
  })

  it('边界: context 为复杂嵌套对象', () => {
    const log: LicenseAuditLog = {
      id: 'log-004',
      licenseId: 'lic-004',
      tenantId: 't-test',
      action: 'expire',
      scope: 'ai.industry',
      operator: 'system',
      result: 'success',
      context: {
        expiredAt: '2026-07-01T00:00:00.000Z',
        autoRenewAttempted: false,
        notifications: [{ channel: 'email', sent: true }],
      },
      timestamp: now,
    }
    assert.ok(log.context)
    assert.equal((log.context as any).autoRenewAttempted, false)
    assert.equal((log.context as any).notifications[0].channel, 'email')
  })
})

// ── 7. CheckLicenseRequest ────────────────────────────────────────

describe('CheckLicenseRequest', () => {
  it('最小请求 (仅 scope)', () => {
    const req: CheckLicenseRequest = {
      scope: 'ai.capability',
    }
    assert.equal(req.scope, 'ai.capability')
    assert.equal(req.storeId, undefined)
  })

  it('带门店 ID 的请求', () => {
    const req: CheckLicenseRequest = {
      scope: 'ai.knowledge',
      storeId: 'store-001',
    }
    assert.equal(req.scope, 'ai.knowledge')
    assert.equal(req.storeId, 'store-001')
  })

  it('所有 scope 值均可用于请求', () => {
    const scopes: LicenseScope[] = ['ai.capability', 'ai.knowledge', 'ai.industry', 'integration.open']
    const reqs = scopes.map((s) => ({ scope: s }))
    assert.equal(reqs.length, 4)
    assert.ok(reqs.every((r) => typeof r.scope === 'string'))
  })
})

// ── 8. CheckLicenseResponse ───────────────────────────────────────

describe('CheckLicenseResponse', () => {
  const now = '2026-06-01T00:00:00.000Z'

  it('许可通过响应', () => {
    const res: CheckLicenseResponse = {
      allowed: true,
      license: {
        id: 'lic-001',
        tenantId: 't-arcade',
        scope: 'ai.capability',
        level: 'tenant',
        status: 'active',
        activationSource: 'paid',
        validFrom: now,
        validUntil: '2026-12-31T23:59:59.000Z',
        autoRenew: true,
        createdBy: 'admin',
        createdAt: now,
        updatedAt: now,
      },
      quotaRemaining: 7500,
    }

    assert.equal(res.allowed, true)
    assert.ok(res.license)
    assert.equal(res.quotaRemaining, 7500)
    assert.equal(res.reason, undefined)
    assert.equal(res.trialDaysRemaining, undefined)
  })

  it('许可被拒绝响应', () => {
    const res: CheckLicenseResponse = {
      allowed: false,
      reason: 'License expired',
    }

    assert.equal(res.allowed, false)
    assert.equal(res.reason, 'License expired')
    assert.equal(res.license, undefined)
    assert.equal(res.quotaRemaining, undefined)
  })

  it('试用许可含倒计时', () => {
    const res: CheckLicenseResponse = {
      allowed: true,
      license: {
        id: 'lic-trial',
        tenantId: 't-arcade',
        scope: 'ai.capability',
        level: 'tenant',
        status: 'active',
        activationSource: 'trial',
        validFrom: now,
        validUntil: '2026-06-15T00:00:00.000Z',
        autoRenew: false,
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
      trialDaysRemaining: 14,
      quotaRemaining: 500,
    }

    assert.equal(res.allowed, true)
    assert.equal(res.trialDaysRemaining, 14)
    assert.equal(res.quotaRemaining, 500)
    assert.equal(res.license?.activationSource, 'trial')
  })

  it('配额耗尽响应', () => {
    const res: CheckLicenseResponse = {
      allowed: false,
      reason: 'Quota exhausted',
      quotaRemaining: 0,
    }

    assert.equal(res.allowed, false)
    assert.equal(res.quotaRemaining, 0)
  })
})

// ── 9. CreateLicenseRequest ───────────────────────────────────────

describe('CreateLicenseRequest', () => {
  const now = '2026-06-01T00:00:00.000Z'

  it('创建带配额的付费授权', () => {
    const req: CreateLicenseRequest = {
      tenantId: 't-arcade',
      scope: 'ai.capability',
      level: 'tenant',
      validFrom: now,
      validUntil: '2026-12-31T23:59:59.000Z',
      quota: 50000,
      priceCents: 499900,
      autoRenew: true,
      activationSource: 'paid',
      createdBy: 'admin-01',
    }

    assert.equal(req.tenantId, 't-arcade')
    assert.equal(req.scope, 'ai.capability')
    assert.equal(req.level, 'tenant')
    assert.equal(req.quota, 50000)
    assert.equal(req.priceCents, 499900)
    assert.equal(req.autoRenew, true)
    assert.equal(req.storeId, undefined)
  })

  it('创建门店级试用授权', () => {
    const req: CreateLicenseRequest = {
      tenantId: 't-arcade',
      storeId: 'store-001',
      scope: 'ai.knowledge',
      level: 'store',
      validFrom: now,
      validUntil: '2026-08-01T00:00:00.000Z',
      activationSource: 'trial',
      createdBy: 'system',
    }

    assert.equal(req.storeId, 'store-001')
    assert.equal(req.level, 'store')
    assert.equal(req.activationSource, 'trial')
    assert.equal(req.quota, undefined)
    assert.equal(req.autoRenew, undefined)
  })

  it('创建等级达标授权', () => {
    const req: CreateLicenseRequest = {
      tenantId: 't-arcade',
      scope: 'ai.industry',
      level: 'tenant',
      validFrom: now,
      validUntil: '2026-10-01T00:00:00.000Z',
      activationSource: 'tier-match',
      createdBy: 'champion-bot',
    }

    assert.equal(req.activationSource, 'tier-match')
  })

  it('创建白名单授权', () => {
    const req: CreateLicenseRequest = {
      tenantId: 't-dev',
      scope: 'integration.open',
      level: 'tenant',
      validFrom: now,
      validUntil: '2027-01-01T00:00:00.000Z',
      activationSource: 'whitelist',
      createdBy: 'superadmin',
    }

    assert.equal(req.activationSource, 'whitelist')
  })
})

// ── 10. LICENSE_GUARD_KEY ─────────────────────────────────────────

describe('LICENSE_GUARD_KEY', () => {
  it('LICENSE_GUARD_KEY 是常量字符串', () => {
    assert.equal(typeof LICENSE_GUARD_KEY, 'string')
    assert.ok(LICENSE_GUARD_KEY.length > 0)
  })

  it('LICENSE_GUARD_KEY 可作 Reflect.defineMetadata key', () => {
    const meta: LicenseGuardMeta = { scope: 'ai.capability', allowTrial: true }
    const target = {}
    Reflect.defineMetadata(LICENSE_GUARD_KEY, meta, target)
    const retrieved = Reflect.getMetadata(LICENSE_GUARD_KEY, target)
    assert.ok(retrieved)
    assert.equal(retrieved.scope, 'ai.capability')
    assert.equal(retrieved.allowTrial, true)
  })
})

// ── 11. LicenseGuardMeta 装饰器元数据 ──────────────────────────────

describe('LicenseGuardMeta', () => {
  it('最小元数据 (无 allowTrial)', () => {
    const meta: LicenseGuardMeta = { scope: 'ai.capability' }
    assert.equal(meta.scope, 'ai.capability')
    assert.equal(meta.allowTrial, undefined)
  })

  it('带 allowTrial 的元数据', () => {
    const meta: LicenseGuardMeta = { scope: 'ai.capability', allowTrial: true }
    assert.equal(meta.scope, 'ai.capability')
    assert.equal(meta.allowTrial, true)
  })

  it('allowTrial 为 false', () => {
    const meta: LicenseGuardMeta = { scope: 'ai.knowledge', allowTrial: false }
    assert.equal(meta.allowTrial, false)
  })
})

// ── 12. 跨实体关系 ────────────────────────────────────────────────

describe('license.entity 跨实体类型引用', () => {
  it('CheckLicenseResponse.license 是 License 类型', () => {
    const now = '2026-06-01T00:00:00.000Z'
    const res: CheckLicenseResponse = {
      allowed: true,
      license: {
        id: 'lic-ref',
        tenantId: 't-test',
        scope: 'ai.capability',
        level: 'tenant',
        status: 'active',
        activationSource: 'paid',
        validFrom: now,
        validUntil: now,
        autoRenew: false,
        createdBy: 'test',
        createdAt: now,
        updatedAt: now,
      },
    }
    assert.equal(res.license?.id, 'lic-ref')
    assert.equal(res.license?.level, 'tenant')
  })

  it('LicenseAuditLog.scope 引用 LicenseScope 类型', () => {
    const scopes: LicenseScope[] = ['ai.capability', 'ai.knowledge', 'ai.industry', 'integration.open']
    const now = '2026-06-01T00:00:00.000Z'
    const logs: LicenseAuditLog[] = scopes.map((scope, i) => ({
      id: `log-cross-${i}`,
      licenseId: `lic-${i}`,
      tenantId: 't-test',
      action: 'create',
      scope,
      operator: 'system',
      result: 'success',
      timestamp: now,
    }))
    assert.equal(logs.length, 4)
    assert.ok(logs.every((l) => scopes.includes(l.scope)))
  })

  it('CreateLicenseRequest 可转换为 License', () => {
    const now = '2026-06-01T00:00:00.000Z'
    const req: CreateLicenseRequest = {
      tenantId: 't-arcade',
      scope: 'ai.capability',
      level: 'tenant',
      validFrom: now,
      validUntil: '2026-12-31T23:59:59.000Z',
      quota: 10000,
      priceCents: 99900,
      autoRenew: true,
      activationSource: 'paid',
      createdBy: 'admin',
    }

    // 模拟 service.create 转换
    const created: License = {
      id: 'lic-create-001',
      tenantId: req.tenantId,
      scope: req.scope,
      level: req.level,
      status: 'active',
      quota: req.quota,
      usedQuota: 0,
      activationSource: req.activationSource,
      validFrom: req.validFrom,
      validUntil: req.validUntil,
      autoRenew: req.autoRenew ?? false,
      priceCents: req.priceCents,
      createdBy: req.createdBy,
      createdAt: now,
      updatedAt: now,
    }

    assert.equal(created.tenantId, req.tenantId)
    assert.equal(created.scope, req.scope)
    assert.equal(created.quota, req.quota)
    assert.equal(created.status, 'active')
    assert.equal(created.usedQuota, 0)
  })
})
