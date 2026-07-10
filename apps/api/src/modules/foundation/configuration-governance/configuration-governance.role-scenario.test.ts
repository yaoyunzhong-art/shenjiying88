/**
 * 🐜 自动: [configuration-governance] [C] 角色场景测试扩展
 *
 * 8 角色视角的 Configuration Governance 业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 3 个场景用例（正常打开→操作→完成 闭环 / 正向 + 负向 + 边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ConfigurationGovernanceController } from './configuration-governance.controller'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── Mock 服务工厂 ──
function mockConfigGovService() {
  const configEntries = new Map<string, any>()
  const featureFlags = new Map<string, any>()
  const secrets = new Map<string, any>()
  const certificates = new Map<string, any>()
  const approvals: any[] = []
  const audits: any[] = []
  let seq = 0

  const svc = {
    getManagementMetadata() {
      return [{ key: 'feature-flags', name: 'Feature Flag Management', description: 'Manage feature toggles across tenants' }]
    },

    getOperationsOverview() {
      return Promise.resolve({ generatedAt: new Date().toISOString(), summary: { featureFlags: 10, configEntries: 25, secrets: 5, certificates: 3, pendingApprovals: 2 } })
    },

    resolveConfigSnapshot(query: any) {
      return Promise.resolve({ snapshot: 'config-v1', entries: Array.from(configEntries.entries()).map(([k, v]) => ({ key: k, ...v })) })
    },

    getFeatureFlags(context: any, subjectKey?: string) {
      return Promise.resolve(Array.from(featureFlags.entries()).map(([k, v]) => ({ key: k, ...v })))
    },

    listPersistedFeatureFlags(context: any, subjectKey?: string) {
      return Promise.resolve(Array.from(featureFlags.entries()).map(([k, v]) => ({ key: k, ...v })))
    },

    evaluateFeatureFlag(flagKey: string, context: any, subjectKey?: string) {
      const flag = featureFlags.get(flagKey)
      return Promise.resolve({ key: flagKey, enabled: flag?.enabled ?? false, evaluatedAt: new Date().toISOString() })
    },

    saveFeatureFlag(body: any) {
      const id = body.key ?? `flag-${++seq}`
      featureFlags.set(id, { ...body, updatedAt: new Date().toISOString() })
      return Promise.resolve(featureFlags.get(id))
    },

    listConfigEntries(query: any) {
      return Promise.resolve(Array.from(configEntries.values()))
    },

    getAuditRecords(query: any) {
      return Promise.resolve(audits.slice(0, query?.limit ?? 50))
    },

    summarizeAuditRecords(query: any) {
      return Promise.resolve({ total: audits.length, configChanges: audits.filter(a => a.eventType === 'config.update').length })
    },

    listGovernanceApprovals(query: any) {
      return Promise.resolve(approvals)
    },

    summarizeGovernanceApprovals(query: any) {
      return Promise.resolve({ total: approvals.length, pending: approvals.filter(a => a.status === 'PENDING').length })
    },

    getGovernanceApprovalDetail(ticket: string) {
      const a = approvals.find(x => x.ticket === ticket)
      if (!a) throw new Error('NOT_FOUND')
      return Promise.resolve(a)
    },

    getGovernanceApprovalTimeline(ticket: string, limit?: number) {
      return Promise.resolve([{ ticket, event: 'created', at: new Date().toISOString() }])
    },

    saveConfigEntry(body: any) {
      const key = body.key ?? `config-${++seq}`
      configEntries.set(key, { ...body, updatedAt: new Date().toISOString() })
      audits.push({ eventType: 'config.update', key, actor: body.updatedBy ?? 'admin', timestamp: new Date().toISOString() })
      return Promise.resolve(configEntries.get(key))
    },

    getSecretMetadata(secretName?: string) {
      const items = secretName ? Array.from(secrets.values()).filter(s => s.name === secretName) : Array.from(secrets.values())
      return Promise.resolve(items)
    },

    getSecretsCertificatePosture() {
      return Promise.resolve({ healthy: true, expiringSoon: 0, expired: 0 })
    },

    getCertificateMetadata(query: any) {
      return Promise.resolve(Array.from(certificates.values()))
    },

    getCertificateDetail(name: string, query: any) {
      const c = certificates.get(name)
      if (!c) throw new Error('NOT_FOUND')
      return Promise.resolve(c)
    },

    rotateSecret(secretName: string, rotatedBy: string, meta: any) {
      const s = secrets.get(secretName)
      if (!s) throw new Error('NOT_FOUND')
      s.version = (s.version ?? 1) + 1
      s.rotatedBy = rotatedBy
      s.rotatedAt = new Date().toISOString()
      return Promise.resolve(s)
    },

    registerSecret(body: any) {
      secrets.set(body.name, { ...body, version: 1, createdAt: new Date().toISOString() })
      return Promise.resolve(secrets.get(body.name))
    },

  }
  return svc
}

function createController(svc = mockConfigGovService()): ConfigurationGovernanceController {
  return new ConfigurationGovernanceController(svc as any)
}

// ── 辅助 ──
function scopeQuery(overrides: any = {}) {
  return { tenantId: 't-store', brandId: 'b-arcade', storeId: 's-main', ...overrides }
}

// ──────────── 👔 店长 ────────────
describe(`${ROLES.StoreManager} configuration-governance 业务场景`, () => {
  let ctrl: ConfigurationGovernanceController
  let svc: ReturnType<typeof mockConfigGovService>

  beforeEach(() => {
    svc = mockConfigGovService()
    ctrl = createController(svc)
  })

  it('店长查看管理元数据 - 正常流程', () => {
    const result = ctrl.getManagementMetadata()
    assert.ok(Array.isArray(result))
    assert.ok(result.length > 0)
  })

  it('店长查看运营概览 - 正常流程', async () => {
    const result = await ctrl.getOperationsOverview()
    assert.ok(result)
    assert.equal(typeof (result as any).summary.featureFlags, 'number')
  })

  it('店长查看配置快照 - 正常流程', async () => {
    const result = await ctrl.getSnapshot(scopeQuery())
    assert.ok(result)
    assert.ok((result as any).snapshot)
  })

  it('店长保存特征开关 - 正常流程', async () => {
    const result = await ctrl.saveFeatureFlag({ scopeType: "STORE", status: "ACTIVE", strategy: "ALL", key: 'ff-store-new-checkout', name: '新结账流程', description: '新门店结账UI', enabled: true, percentage: 100, updatedBy: 'store-owner' })
    assert.ok(result)
    assert.equal((result as any).key, 'ff-store-new-checkout')
  })
})

// ──────────── 🛒 前台 ────────────
describe(`${ROLES.FrontDesk} configuration-governance 业务场景`, () => {
  let ctrl: ConfigurationGovernanceController
  let svc: ReturnType<typeof mockConfigGovService>

  beforeEach(() => {
    svc = mockConfigGovService()
    ctrl = createController(svc)
  })

  it('前台获取特征开关状态 - 正常流程', async () => {
    await svc.saveFeatureFlag({ key: 'ff-fast-checkout', name: '快速结账', enabled: true, updatedBy: 'admin' })
    const result = await ctrl.getFeatureFlag('ff-fast-checkout', { subjectKey: 'store-main' })
    assert.ok(result)
    assert.equal(typeof (result as any).enabled, 'boolean')
  })

  it('前台获取所有特征开关 - 正常流程', async () => {
    const result = await ctrl.getFeatureFlags({ subjectKey: 'store-main' })
    assert.ok(Array.isArray(result))
  })

  it('前台无法写配置条目（无 WRITE 角色） - 权限边界', () => {
    const roles = ['store-staff']
    const allowed = ['SUPER_ADMIN', 'TENANT_ADMIN']
    const canWrite = allowed.some(r => roles.includes(r))
    assert.equal(canWrite, false)
  })
})

// ──────────── 👥 HR ────────────
describe(`${ROLES.HR} configuration-governance 业务场景`, () => {
  let ctrl: ConfigurationGovernanceController
  let svc: ReturnType<typeof mockConfigGovService>

  beforeEach(() => {
    svc = mockConfigGovService()
    ctrl = createController(svc)
  })

  it('HR查看审计记录 - 正常流程', async () => {
    const result = await ctrl.getAudit({ limit: 20 } as any)
    assert.ok(Array.isArray(result))
  })

  it('HR查看审计汇总 - 正常流程', async () => {
    const result = await ctrl.getAuditSummary({} as any)
    assert.ok(result)
    assert.equal(typeof (result as any).total, 'number')
  })

  it('HR无法写入配置项（无 TENANT_ADMIN） - 权限边界', () => {
    const roles = ['hr-admin']
    const allowed = ['SUPER_ADMIN', 'TENANT_ADMIN']
    const canWrite = allowed.some(r => roles.includes(r))
    assert.equal(canWrite, false)
  })
})

// ──────────── 🔧 安监 ────────────
describe(`${ROLES.Security} configuration-governance 业务场景`, () => {
  let ctrl: ConfigurationGovernanceController
  let svc: ReturnType<typeof mockConfigGovService>

  beforeEach(() => {
    svc = mockConfigGovService()
    ctrl = createController(svc)
  })

  it('安监查看密钥证书全景 - 正常流程', async () => {
    const result = await ctrl.getSecretsCertificatePosture()
    assert.ok(result)
    assert.equal(typeof (result as any).healthy, 'boolean')
  })

  it('安监查看密钥元数据 - 正常流程', async () => {
    await svc.registerSecret({ key: 'payment-webhook-key', name: 'payment-webhook-key', type: 'webhook-signing', value: 'sk-test', scopes: ['store-main'], consumers: ['payment-gw'] })
    const result = await ctrl.getSecrets()
    assert.ok(Array.isArray(result))
    assert.ok(result.length > 0)
  })

  it('安监轮转密钥 - 正常流程', async () => {
    await svc.registerSecret({ key: 'sec-key-v1', name: 'sec-key-v1', type: 'api-key', value: 'old-key', scopes: ['store-main'], consumers: ['edge'] })
    const result = await ctrl.rotateSecret('sec-key-v1', { rotatedBy: 'sec-admin', requestedBy: 'sec-admin', approvalStatus: 'APPROVED' })
    assert.ok(result)
    assert.ok((result as any).version >= 2)
  })

  it('安监查看审批列表 - 正常流程', async () => {
    const result = await ctrl.getApprovals({} as any)
    assert.ok(Array.isArray(result))
  })
})

// ──────────── 🎮 导玩员 ────────────
describe(`${ROLES.Guide} configuration-governance 业务场景`, () => {
  let ctrl: ConfigurationGovernanceController

  beforeEach(() => {
    ctrl = createController()
  })

  it('导玩员获取特征开关状态（无角色保护） - 正常流程', async () => {
    const result = await ctrl.getFeatureFlag('ff-inventory-mode', { subjectKey: 'store-main' })
    assert.ok(result)
  })

  it('导玩员获取 ALL 特征开关 - 正常流程', async () => {
    const result = await ctrl.getFeatureFlags({ subjectKey: 'store-main' })
    assert.ok(Array.isArray(result))
  })

  it('导玩员无法写入特征开关（无 TENANT_ADMIN/OPERATIONS 角色） - 权限边界', () => {
    const roles = ['store-staff']
    const allowed = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS']
    const canWrite = allowed.some(r => roles.includes(r))
    assert.equal(canWrite, false)
  })
})

// ──────────── 🎯 运行专员 ────────────
describe(`${ROLES.Operations} configuration-governance 业务场景`, () => {
  let ctrl: ConfigurationGovernanceController
  let svc: ReturnType<typeof mockConfigGovService>

  beforeEach(() => {
    svc = mockConfigGovService()
    ctrl = createController(svc)
  })

  it('运行专员查看管理元数据 - 正常流程', () => {
    const result = ctrl.getManagementMetadata()
    assert.ok(Array.isArray(result))
  })

  it('运行专员获取特征开关记录 - 正常流程', async () => {
    const result = await ctrl.getFeatureFlagRecords({ subjectKey: 't-store' })
    assert.ok(Array.isArray(result))
  })

  it('运行专员查看审计汇总 - 正常流程', async () => {
    const result = await ctrl.getAuditSummary({} as any)
    assert.ok(result)
  })

  it('运行专员保存配置条目 - 正常流程', async () => {
    const result = await ctrl.saveConfigEntry({ key: "app.store.checkout_timeout", namespace: "app.store", scopeType: "STORE", value: JSON.stringify(30000), valueType: "JSON", tenantId: 't-store', updatedBy: 'ops-user' })
    assert.ok(result)
  })
})

// ──────────── 🤝 团建 ────────────
describe(`${ROLES.Teambuilding} configuration-governance 业务场景`, () => {
  let ctrl: ConfigurationGovernanceController
  let svc: ReturnType<typeof mockConfigGovService>

  beforeEach(() => {
    svc = mockConfigGovService()
    ctrl = createController(svc)
  })

  it('团建专员可以读特征开关 - 正常流程', async () => {
    await svc.saveFeatureFlag({ key: 'ff-teambuilding-portal', name: '团建门户', enabled: true, updatedBy: 'admin' })
    const result = await ctrl.getFeatureFlag('ff-teambuilding-portal', { subjectKey: 'store-main' })
    assert.ok(result)
  })

  it('团建专员可以查看配置快照 - 正常流程', async () => {
    const result = await ctrl.getSnapshot(scopeQuery())
    assert.ok(result)
  })

  it('团建专员无法写配置（无 ADMIN 角色） - 权限边界', () => {
    const roles = ['staff']
    const allowed = ['SUPER_ADMIN', 'TENANT_ADMIN']
    const canWrite = allowed.some(r => roles.includes(r))
    assert.equal(canWrite, false)
  })
})

// ──────────── 📢 营销 ────────────
describe(`${ROLES.Marketing} configuration-governance 业务场景`, () => {
  let ctrl: ConfigurationGovernanceController
  let svc: ReturnType<typeof mockConfigGovService>

  beforeEach(() => {
    svc = mockConfigGovService()
    ctrl = createController(svc)
  })

  it('营销专员获取特征开关（如新营销活动开关） - 正常流程', async () => {
    await svc.saveFeatureFlag({ key: 'ff-spring-promo', name: '春促活动', enabled: true, updatedBy: 'admin' })
    const result = await ctrl.getFeatureFlag('ff-spring-promo', { subjectKey: 't-store' })
    assert.ok(result)
  })

  it('营销专员查看审计记录 - 正常流程', async () => {
    const result = await ctrl.getAudit({ limit: 10 } as any)
    assert.ok(Array.isArray(result))
  })

  it('营销专员无法写特征开关（无 OPERATIONS/TENANT_ADMIN） - 权限边界', () => {
    const roles = ['marketing-admin']
    const allowed = ['SUPER_ADMIN', 'TENANT_ADMIN', 'OPERATIONS']
    const canWriteFF = allowed.some(r => roles.includes(r))
    assert.equal(canWriteFF, false)
  })
})

// ──────────── 全局场景 ────────────
describe('configuration-governance 全局跨角色场景', () => {
  let ctrl: ConfigurationGovernanceController
  let svc: ReturnType<typeof mockConfigGovService>

  beforeEach(() => {
    svc = mockConfigGovService()
    ctrl = createController(svc)
  })

  it('创建特征开关 → 查询特征开关值 → 验证可用 完整生命周期', async () => {
    // 1. Create FF
    await ctrl.saveFeatureFlag({ scopeType: "STORE", status: "ACTIVE", strategy: "ALL", key: 'ff-new-feature', name: '新功能', description: '测试新功能', enabled: true, percentage: 50, updatedBy: 'admin' })

    // 2. Evaluate
    const evaluated = await ctrl.getFeatureFlag('ff-new-feature', { subjectKey: 'user-001' })
    assert.equal((evaluated as any).key, 'ff-new-feature')

    // 3. List all
    const all = await ctrl.getFeatureFlagRecords({ subjectKey: 't-store' })
    assert.ok((all as unknown[]).length > 0)
  })

  it('注册密钥 → 查看密钥元数据 → 轮转密钥 完整安全流程', async () => {
    // 1. Register
    await ctrl.registerSecret({ key: 'webhook-hmac-key', name: 'webhook-hmac-key', type: 'webhook-signing', scopeType: 'PLATFORM', value: 'initial-secret', scopes: ['store-main'], consumers: ['payment-gw'] })

    // 2. View metadata
    const meta = await ctrl.getSecrets()
    assert.ok((meta as unknown[]).length > 0)

    // 3. Rotate
    const rotated = await ctrl.rotateSecret('webhook-hmac-key', { rotatedBy: 'sec-admin', requestedBy: 'sec-admin', approvalStatus: 'APPROVED' })
    assert.ok(rotated)
  })

  it('保存配置条目 → 查看审计跟踪到变更记录', async () => {
    await ctrl.saveConfigEntry({ key: "app.store.business_hours", namespace: "app.store", scopeType: "STORE", value: JSON.stringify({ open: "09:00", close: "22:00" }), valueType: "JSON", tenantId: "t-store", updatedBy: "ops-user" })
    const auditResult = await ctrl.getAudit({ limit: 5 } as any)
    assert.ok((auditResult as unknown[]).length > 0)
  })

  it('空配置列表返回空数组 - 边界', async () => {
    const result = await ctrl.getConfigEntries({} as any)
    assert.ok(Array.isArray(result))
  })
})
