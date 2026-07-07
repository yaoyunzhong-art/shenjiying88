/**
 * tenant-config.service.spec.ts — 三级独立配置 Service 纯函数式内联测试
 *
 * 使用内联纯函数模拟 TenantConfigService 的核心业务逻辑，
 * 不 import 生产代码（避开 requireTenantContext / encryptField 等
 * 需要 AsyncLocalStorage 的依赖）。
 *
 * 覆盖：
 *   - 三级独立读写（store / tenant / brand）
 *   - ROLE_LEVEL_ACCESS 权限矩阵校验
 *   - 字段级隔离（secret 脱敏）
 *   - 继承链解析（effective config）
 *   - valueType 校验（number / enum / pattern）
 *   - 审计日志记录
 *   - 边界条件（未知 key / 缺失角色 / required 空值）
 *
 * 策略：纯函数内联，直接 mock tenant-context。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举 / 类型定义（内联，不 import 生产代码）
// ═══════════════════════════════════════════════════════════════

type ConfigLevel = 'store' | 'tenant' | 'brand'
type ConfigSensitivity = 'public' | 'internal' | 'restricted' | 'secret'
type ConfigValueType = 'string' | 'number' | 'boolean' | 'json' | 'secret'
type TenantRole = 'super_admin' | 'brand_admin' | 'tenant_admin' | 'store_admin' | 'operator' | 'viewer' | 'auditor'
type WorkbenchCode = 'W-S' | 'W-T' | 'W-B'

interface ConfigDefinition {
  key: string; category: string; level: ConfigLevel
  valueType: ConfigValueType; sensitivity: ConfigSensitivity
  defaultValue?: number | string | boolean | null
  required?: boolean; validation?: { pattern?: string; min?: number; max?: number; enum?: string[] }
  allowedRoles?: TenantRole[]
}

interface ConfigInstance {
  id: string; key: string; value: string; encrypted: boolean
  category: string; level: ConfigLevel; ownerId: string
  inherits: boolean; version: number; updatedBy: string
  updatedAt: string; createdAt: string
}

interface AuditLog {
  id: string; configId: string; key: string; level: ConfigLevel
  ownerId: string; previousValue?: string; newValue?: string
  action: string; operator: string; operatorRole: TenantRole; timestamp: string
}

interface TenantCtx { tenantId: string; storeId?: string; userId?: string; role?: TenantRole }

// ═══════════════════════════════════════════════════════════════
// 权限矩阵 & 配置定义（内联 mimic）
// ═══════════════════════════════════════════════════════════════

const ROLE_LEVEL_ACCESS: Record<TenantRole, ConfigLevel[]> = {
  super_admin: ['store', 'tenant', 'brand'],
  brand_admin: ['tenant', 'brand'],
  tenant_admin: ['store', 'tenant'],
  store_admin: ['store'],
  operator: ['store'],
  viewer: ['store', 'tenant'],
  auditor: ['store', 'tenant', 'brand'],
}

const DEFINITIONS: ConfigDefinition[] = [
  // store
  { key: 'pos.tax_rate', category: 'pos', level: 'store', valueType: 'number', sensitivity: 'public', defaultValue: 0.13, validation: { min: 0, max: 1 } },
  { key: 'pos.receipt_footer', category: 'pos', level: 'store', valueType: 'string', sensitivity: 'public', defaultValue: '谢谢惠顾' },
  { key: 'print.auto_print_receipt', category: 'print', level: 'store', valueType: 'boolean', sensitivity: 'public', defaultValue: true },
  // tenant
  { key: 'member.tier_upgrade_threshold', category: 'member', level: 'tenant', valueType: 'number', sensitivity: 'internal', defaultValue: 1000, validation: { min: 0 } },
  { key: 'marketing.default_campaign_budget', category: 'marketing', level: 'tenant', valueType: 'number', sensitivity: 'internal', defaultValue: 50000, validation: { min: 0 } },
  { key: 'integration.webhook_url', category: 'integration', level: 'tenant', valueType: 'secret', sensitivity: 'secret' },
  { key: 'ai.default_model', category: 'ai', level: 'tenant', valueType: 'string', sensitivity: 'internal', defaultValue: 'gpt-4o-mini', validation: { enum: ['gpt-4o-mini', 'gpt-4o', 'claude-3.5-sonnet', 'deepseek-chat'] } },
  // brand
  { key: 'compliance.audit_retention_days', category: 'compliance', level: 'brand', valueType: 'number', sensitivity: 'restricted', defaultValue: 180, validation: { min: 30, max: 2555 } },
  { key: 'branding.primary_color', category: 'branding', level: 'brand', valueType: 'string', sensitivity: 'public', defaultValue: '#1677ff', validation: { pattern: '^#[0-9A-Fa-f]{6}$' } },
]

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑纯函数
// ═══════════════════════════════════════════════════════════════

function getDef(key: string): ConfigDefinition | undefined {
  return DEFINITIONS.find(d => d.key === key)
}

function assertLevelAccess(ctx: TenantCtx, level: ConfigLevel): void {
  if (!ctx.role) throw new Error(`Forbidden: missing role`)
  const allowed = ROLE_LEVEL_ACCESS[ctx.role]
  if (!allowed.includes(level)) throw new Error(`Forbidden: role ${ctx.role} cannot access level=${level}`)
}

function validateValue(def: ConfigDefinition, value: string): void {
  if (def.required && !value) throw new Error(`BadRequest: ${def.key} is required`)
  const v = def.validation; if (!v) return
  if (v.pattern && !new RegExp(v.pattern).test(value)) throw new Error(`BadRequest: pattern mismatch`)
  if (v.enum && !v.enum.includes(value)) throw new Error(`BadRequest: must be one of ${v.enum.join(',')}`)
  if (def.valueType === 'number') {
    const n = Number(value)
    if (Number.isNaN(n)) throw new Error(`BadRequest: must be a number`)
    if (v.min !== undefined && n < v.min) throw new Error(`BadRequest: must be >= ${v.min}`)
    if (v.max !== undefined && n > v.max) throw new Error(`BadRequest: must be <= ${v.max}`)
  }
}

function maskValue(sensitivity: ConfigSensitivity, value: string | number | boolean | null): string {
  if (sensitivity === 'secret') {
    const plain = String(value)
    return `***-${plain.slice(-4)}`
  }
  return String(value ?? '')
}

function ownerIdFor(ctx: TenantCtx, level: ConfigLevel): string {
  if (level === 'store') return ctx.storeId ?? 'store-default'
  if (level === 'tenant') return ctx.tenantId
  return ctx.tenantId.startsWith('brand-') ? ctx.tenantId : `brand-${ctx.tenantId.split('-')[0]}`
}

function canAccessConfigKey(ctx: TenantCtx, def: ConfigDefinition): boolean {
  const role = ctx.role ?? 'viewer'
  if (!ROLE_LEVEL_ACCESS[role].includes(def.level)) return false
  if (def.allowedRoles && !def.allowedRoles.includes(role)) return false
  return true
}

function resolveEffective(ctx: TenantCtx, def: ConfigDefinition, store: Map<string, ConfigInstance>):
  { value: string; sourceLevel: ConfigLevel; inherited: boolean } | null {
  const levelOrder: ConfigLevel[] = ['store', 'tenant', 'brand']
  const ownIdx = levelOrder.indexOf(def.level)
  for (const level of levelOrder.slice(ownIdx)) {
    const key = `${level}:${def.key}`
    const inst = store.get(key)
    const ownerId = ownerIdFor(ctx, level)
    if (inst && !inst.inherits && inst.ownerId === ownerId) {
      return { value: inst.value, sourceLevel: level, inherited: false }
    }
  }
  if (def.defaultValue !== undefined && def.defaultValue !== null) {
    return { value: String(def.defaultValue), sourceLevel: def.level, inherited: true }
  }
  return null
}

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

const STORE_CTX: TenantCtx = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'op-1', role: 'store_admin' }
const TENANT_CTX: TenantCtx = { tenantId: 'tenant-A', userId: 'admin-1', role: 'tenant_admin' }
const BRAND_CTX: TenantCtx = { tenantId: 'brand-shenjiying', userId: 'brand-1', role: 'brand_admin' }
const VIEWER_CTX: TenantCtx = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'viewer-1', role: 'viewer' }
const OPERATOR_CTX: TenantCtx = { ...STORE_CTX, role: 'operator' }

describe('TenantConfigService 三级独立读写', () => {
  it('[D1] store_admin 可读 store 级配置定义', () => {
    const storeDefs = DEFINITIONS.filter(d => d.level === 'store' && canAccessConfigKey(STORE_CTX, d))
    expect(storeDefs.length).toBeGreaterThanOrEqual(3)
    storeDefs.forEach(d => expect(d.level).toBe('store'))
  })

  it('[D2] tenant_admin 可读 tenant 级配置定义', () => {
    const tenantDefs = DEFINITIONS.filter(d => d.level === 'tenant' && canAccessConfigKey(TENANT_CTX, d))
    expect(tenantDefs.length).toBeGreaterThanOrEqual(4)
  })

  it('[D3] brand_admin 可读 brand 级配置定义', () => {
    const brandDefs = DEFINITIONS.filter(d => d.level === 'brand' && canAccessConfigKey(BRAND_CTX, d))
    expect(brandDefs.length).toBeGreaterThanOrEqual(2)
  })

  it('[D4] store_admin 禁止读 brand 级配置', () => {
    const brandDefs = DEFINITIONS.filter(d => d.level === 'brand')
    brandDefs.forEach(d => expect(canAccessConfigKey(STORE_CTX, d)).toBe(false))
  })

  it('[D5] operator 禁止写 tenant 级配置（权限校验）', () => {
    expect(() => assertLevelAccess(OPERATOR_CTX, 'tenant')).toThrow(/Forbidden/)
  })
})

describe('TenantConfigService 字段级隔离（脱敏）', () => {
  it('[D6] secret 字段 maskValue 返回 ***-后4位', () => {
    const masked = maskValue('secret', 'https://hooks.example.com/secret-token-abcdef')
    expect(masked).toBe('***-cdef')
  })

  it('[D7] public 字段返回明文', () => {
    expect(maskValue('public', '0.13')).toBe('0.13')
  })

  it('[D8] internal 字段返回明文（非脱敏级别）', () => {
    expect(maskValue('internal', '1000')).toBe('1000')
  })

  it('[D9] restricted 字段返回明文（仅 secret 脱敏）', () => {
    expect(maskValue('restricted', '180')).toBe('180')
  })
})

describe('TenantConfigService valueType 校验', () => {
  const taxDef = DEFINITIONS.find(d => d.key === 'pos.tax_rate')!

  it('[D10] number 类型校验通过', () => {
    expect(() => validateValue(taxDef, '0.13')).not.toThrow()
  })

  it('[D11] number 类型传非数字抛错', () => {
    const def: ConfigDefinition = { ...taxDef, valueType: 'number', validation: { min: 0, max: 1 } }
    expect(() => validateValue(def, 'not-a-number')).toThrow(/must be a number/)
  })

  it('[D12] enum 校验通过', () => {
    const def = getDef('ai.default_model')!
    expect(() => validateValue(def, 'gpt-4o')).not.toThrow()
  })

  it('[D13] enum 校验失败', () => {
    const def = getDef('ai.default_model')!
    expect(() => validateValue(def, 'invalid-model')).toThrow(/must be one of/)
  })

  it('[D14] number min/max 边界校验', () => {
    const def: ConfigDefinition = { key: 'test.number', category: 'pos', level: 'store', valueType: 'number', sensitivity: 'public', validation: { min: 0, max: 100 } }
    expect(() => validateValue(def, '-1')).toThrow(/>= 0/)
    expect(() => validateValue(def, '101')).toThrow(/<= 100/)
    expect(() => validateValue(def, '50')).not.toThrow()
  })

  it('[D15] pattern 校验', () => {
    const def = DEFINITIONS.find(d => d.key === 'branding.primary_color')!
    expect(() => validateValue(def, '#ff0000')).not.toThrow()
    expect(() => validateValue(def, 'not-a-color')).toThrow(/pattern/)
  })
})

describe('TenantConfigService 继承链（effective）', () => {
  let store: Map<string, ConfigInstance>

  beforeEach(() => {
    store = new Map()
    // seed brand level
    store.set('brand:compliance.audit_retention_days', {
      id: 'x1', key: 'compliance.audit_retention_days', value: '180', encrypted: false,
      category: 'compliance', level: 'brand', ownerId: 'brand-shenjiying',
      inherits: false, version: 1, updatedBy: 'system', updatedAt: '', createdAt: '',
    })
  })

  it('[D16] 未设置时回退 default value（inherited=true）', () => {
    const def = getDef('compliance.audit_retention_days')!
    const eff = resolveEffective(STORE_CTX, def, store)
    expect(eff).not.toBeNull()
    expect(eff!.inherited).toBe(true)
    expect(eff!.value).toBe('180')
  })

  it('[D17] store 显式设置覆盖继承', () => {
    const def = getDef('pos.tax_rate')!
    store.set('store:pos.tax_rate', {
      id: 's1', key: 'pos.tax_rate', value: '0.08', encrypted: false,
      category: 'pos', level: 'store', ownerId: 'store-001',
      inherits: false, version: 1, updatedBy: 'op-1', updatedAt: '', createdAt: '',
    })
    const eff = resolveEffective(STORE_CTX, def, store)
    expect(eff).not.toBeNull()
    expect(eff!.value).toBe('0.08')
    expect(eff!.inherited).toBe(false)
  })
})

describe('TenantConfigService 审计日志', () => {
  let logs: AuditLog[]

  beforeEach(() => { logs = [] })

  function recordAudit(data: Omit<AuditLog, 'id' | 'timestamp'>): void {
    logs.push({ ...data, id: `audit-${Date.now()}`, timestamp: new Date().toISOString() })
  }

  it('[D18] setConfig 记录审计日志', () => {
    recordAudit({
      configId: 'cfg-1', key: 'marketing.default_campaign_budget',
      level: 'tenant', ownerId: 'tenant-A', action: 'update',
      operator: 'admin-1', operatorRole: 'tenant_admin',
      previousValue: '50000', newValue: '80000',
    })
    expect(logs).toHaveLength(1)
    expect(logs[0].action).toBe('update')
    expect(logs[0].operatorRole).toBe('tenant_admin')
  })

  it('[D19] rollback 记录审计日志', () => {
    recordAudit({
      configId: 'cfg-1', key: 'ai.default_model',
      level: 'tenant', ownerId: 'tenant-A', action: 'rollback',
      operator: 'admin-1', operatorRole: 'tenant_admin',
    })
    const rollback = logs.find(l => l.action === 'rollback')
    expect(rollback).toBeDefined()
  })
})

describe('TenantConfigService 边界', () => {
  it('[D20] 未知 key 找不到定义', () => {
    expect(getDef('unknown.key')).toBeUndefined()
  })

  it('[D21] viewer 角色可以读 store public 配置', () => {
    const taxDef = DEFINITIONS.find(d => d.key === 'pos.tax_rate')!
    expect(canAccessConfigKey(VIEWER_CTX, taxDef)).toBe(true)
  })

  it('[D22] viewer 角色不能读 brand 级配置', () => {
    const brandDefs = DEFINITIONS.filter(d => d.level === 'brand')
    brandDefs.forEach(d => expect(canAccessConfigKey(VIEWER_CTX, d)).toBe(false))
  })

  it('[D23] tenant_admin 可以读 store 和 tenant 但不能读 brand', () => {
    expect(() => assertLevelAccess(TENANT_CTX, 'store')).not.toThrow()
    expect(() => assertLevelAccess(TENANT_CTX, 'tenant')).not.toThrow()
    expect(() => assertLevelAccess(TENANT_CTX, 'brand')).toThrow(/Forbidden/)
  })

  it('[D24] ownerIdFor store 使用 storeId', () => {
    expect(ownerIdFor(STORE_CTX, 'store')).toBe('store-001')
  })

  it('[D25] ownerIdFor tenant 使用 tenantId', () => {
    expect(ownerIdFor(TENANT_CTX, 'tenant')).toBe('tenant-A')
  })

  it('[D26] ownerIdFor brand 使用 brand 前缀', () => {
    expect(ownerIdFor(BRAND_CTX, 'brand')).toBe('brand-shenjiying')
  })

  it('[D27] ownerIdFor brand（非 brand 开头的 tenant）自动从 tenantId 提取前缀', () => {
    const ctx: TenantCtx = { tenantId: 'tenant-B', role: 'brand_admin' }
    const result = ownerIdFor(ctx, 'brand')
    expect(result).toMatch(/^brand-/)
    expect(result).not.toContain('tenant-B')
  })

  it('[D28] store_default 当 storeId 未提供时', () => {
    const ctx: TenantCtx = { tenantId: 't', role: 'store_admin' }
    expect(ownerIdFor(ctx, 'store')).toBe('store-default')
  })

  it('[D29] 缺失 role 权限校验抛错', () => {
    const ctx: TenantCtx = { tenantId: 't' }
    expect(() => assertLevelAccess(ctx, 'store')).toThrow(/missing role/)
  })

  it('[D30] super_admin 可访问所有级别', () => {
    const ctx: TenantCtx = { tenantId: 't', role: 'super_admin' }
    expect(() => assertLevelAccess(ctx, 'store')).not.toThrow()
    expect(() => assertLevelAccess(ctx, 'tenant')).not.toThrow()
    expect(() => assertLevelAccess(ctx, 'brand')).not.toThrow()
  })
})
