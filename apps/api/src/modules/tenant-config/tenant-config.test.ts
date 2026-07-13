import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * tenant-config.test.ts - 三级独立配置模块测试
 * 
 * 覆盖:
 * - TenantConfigService: 三级独立读写、字段级隔离、继承链解析、审计日志
 * - 配置定义、校验、脱敏边界
 * - 工作台视角
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InMemoryCacheService } from '../../infrastructure/cache/cache.module'
import { TenantConfigService } from './tenant-config.service'
import { TenantConfigCacheService } from './tenant-config-cache.service'
import { TenantConfigController } from './tenant-config.controller'
import {
  BUILTIN_CONFIG_DEFINITIONS,
  LEVEL_TO_WORKBENCH,
  WORKBENCH_TO_LEVEL,
  WORKBENCH_NAMES,
  CATEGORY_LEVEL_MATRIX,
  ROLE_LEVEL_ACCESS,
} from './tenant-config.entity'
import { runWithTenant } from '../../common/context/tenant-context'

// ── 测试上下文工厂 ──

const STORE_CTX = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'op-1',
  role: 'store_admin' as const,
}
const TENANT_CTX = {
  tenantId: 'tenant-A',
  userId: 'admin-1',
  role: 'tenant_admin' as const,
}
const BRAND_CTX = {
  tenantId: 'brand-shenjiying',
  userId: 'brand-1',
  role: 'brand_admin' as const,
}
const OPERATOR_CTX = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'op-2',
  role: 'operator' as const,
}
const SUPER_ADMIN_CTX = {
  tenantId: 'brand-shenjiying',
  storeId: 'store-001',
  userId: 'super-1',
  role: 'super_admin' as const,
}

function makeService(): TenantConfigService {
  return new TenantConfigService()
}

function makeController(service?: TenantConfigService): TenantConfigController {
  const s = service ?? makeService()
  return new TenantConfigController(s)
}

// ═══════════════════════════════════════════════════════════════════
// 1. Config Definitions (配置定义)
// ═══════════════════════════════════════════════════════════════════

describe('BUILTIN_CONFIG_DEFINITIONS', () => {
  it('TC-1 should have at least 13 builtin config definitions', () => {
    assert.ok(BUILTIN_CONFIG_DEFINITIONS.length >= 13)
  })

  it('TC-2 each definition must have key, category, level, valueType, sensitivity', () => {
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      assert.ok(def.key, `missing key: ${JSON.stringify(def)}`)
      assert.ok(def.category, `missing category: ${def.key}`)
      assert.ok(def.level, `missing level: ${def.key}`)
      assert.ok(def.valueType, `missing valueType: ${def.key}`)
      assert.ok(def.sensitivity, `missing sensitivity: ${def.key}`)
      assert.ok(def.label, `missing label: ${def.key}`)
    }
  })

  it('TC-3 all levels must have at least one definition', () => {
    const levels = new Set(BUILTIN_CONFIG_DEFINITIONS.map((d) => d.level))
    assert.ok(levels.has('store'))
    assert.ok(levels.has('tenant'))
    assert.ok(levels.has('brand'))
  })

  it('TC-4 store level configs should have store|tenant in CATEGORY_LEVEL_MATRIX', () => {
    const storeDefs = BUILTIN_CONFIG_DEFINITIONS.filter((d) => d.level === 'store')
    for (const def of storeDefs) {
      const allowed = CATEGORY_LEVEL_MATRIX[def.category]
      assert.ok(allowed, `category ${def.category} not in matrix`)
      assert.ok(allowed.includes('store'), `${def.key} category ${def.category} should allow store`)
    }
  })

  it('TC-5 brand level configs should have brand in CATEGORY_LEVEL_MATRIX', () => {
    const brandDefs = BUILTIN_CONFIG_DEFINITIONS.filter((d) => d.level === 'brand')
    for (const def of brandDefs) {
      const allowed = CATEGORY_LEVEL_MATRIX[def.category]
      assert.ok(allowed, `category ${def.category} not in matrix`)
      assert.ok(allowed.includes('brand'), `${def.key} category ${def.category} should allow brand`)
    }
  })

  it('TC-6 validation should have correct min/max for numeric configs', () => {
    const tax = BUILTIN_CONFIG_DEFINITIONS.find((d) => d.key === 'pos.tax_rate')
    assert.equal(tax!.validation!.min, 0)
    assert.equal(tax!.validation!.max, 1)

    const retention = BUILTIN_CONFIG_DEFINITIONS.find((d) => d.key === 'compliance.audit_retention_days')
    assert.equal(retention!.validation!.min, 30)
    assert.equal(retention!.validation!.max, 2555)
  })

  it('TC-6A should expose tenant locale policy definitions for G1 i18n', () => {
    const defaultLanguage = BUILTIN_CONFIG_DEFINITIONS.find((d) => d.key === 'locale.default_language')
    const supportedLanguages = BUILTIN_CONFIG_DEFINITIONS.find((d) => d.key === 'locale.supported_languages')

    assert.equal(defaultLanguage?.level, 'tenant')
    assert.deepEqual(defaultLanguage?.validation?.enum, ['zh-CN', 'en-US', 'ja-JP'])
    assert.equal(supportedLanguages?.level, 'tenant')
    assert.equal(supportedLanguages?.category, 'locale')
  })
})

describe('G1 locale policy', () => {
  it('G1-1 resolves locale policy from tenant-config and keeps default language in supported list', () => {
    const service = makeService()

    const policy = service.resolveLocalePolicyForContext(TENANT_CTX, {
      defaultLanguage: 'zh-CN',
      supportedLanguages: ['zh-CN'],
    })

    assert.equal(policy.defaultLanguage, 'zh-CN')
    assert.deepEqual(policy.supportedLanguages, ['zh-CN', 'en-US'])
  })

  it('G1-2 rejects invalid locale.default_language writes', async () => {
    const service = makeService()

    await assert.rejects(
      runWithTenant(TENANT_CTX, async () =>
        service.setConfig({ key: 'locale.default_language', value: 'de-DE' })),
      /must be one of zh-CN,en-US,ja-JP/,
    )
  })
})

// ═══════════════════════════════════════════════════════════════════
// 2. Level Mapping (级别映射)
// ═══════════════════════════════════════════════════════════════════

describe('LEVEL_TO_WORKBENCH & WORKBENCH_TO_LEVEL', () => {
  it('TC-7 every level should map to a workbench', () => {
    assert.equal(LEVEL_TO_WORKBENCH.store, 'W-S')
    assert.equal(LEVEL_TO_WORKBENCH.tenant, 'W-T')
    assert.equal(LEVEL_TO_WORKBENCH.brand, 'W-B')
  })

  it('TC-8 every workbench should map back to a level', () => {
    assert.equal(WORKBENCH_TO_LEVEL['W-S'], 'store')
    assert.equal(WORKBENCH_TO_LEVEL['W-T'], 'tenant')
    assert.equal(WORKBENCH_TO_LEVEL['W-B'], 'brand')
  })

  it('TC-9 WORKBENCH_NAMES should have names for all codes', () => {
    assert.ok(WORKBENCH_NAMES['W-S'].length > 0)
    assert.ok(WORKBENCH_NAMES['W-T'].length > 0)
    assert.ok(WORKBENCH_NAMES['W-B'].length > 0)
  })
})

// ═══════════════════════════════════════════════════════════════════
// 3. Role Level Access (权限矩阵)
// ═══════════════════════════════════════════════════════════════════

describe('ROLE_LEVEL_ACCESS', () => {
  it('TC-10 super_admin should access all levels', () => {
    assert.deepEqual(ROLE_LEVEL_ACCESS.super_admin, ['store', 'tenant', 'brand'])
  })

  it('TC-11 store_admin should only access store level', () => {
    assert.deepEqual(ROLE_LEVEL_ACCESS.store_admin, ['store'])
  })

  it('TC-12 operator should only access store level', () => {
    assert.deepEqual(ROLE_LEVEL_ACCESS.operator, ['store'])
  })

  it('TC-13 viewer should access store and tenant', () => {
    assert.ok(ROLE_LEVEL_ACCESS.viewer.includes('store'))
    assert.ok(ROLE_LEVEL_ACCESS.viewer.includes('tenant'))
  })

  it('TC-14 brand_admin should access tenant and brand', () => {
    assert.ok(ROLE_LEVEL_ACCESS.brand_admin.includes('tenant'))
    assert.ok(ROLE_LEVEL_ACCESS.brand_admin.includes('brand'))
  })

  it('TC-15 auditor should access all three levels', () => {
    assert.ok(ROLE_LEVEL_ACCESS.auditor.includes('store'))
    assert.ok(ROLE_LEVEL_ACCESS.auditor.includes('tenant'))
    assert.ok(ROLE_LEVEL_ACCESS.auditor.includes('brand'))
  })
})

// ═══════════════════════════════════════════════════════════════════
// 4. TenantConfigService - getConfigs (三级独立读取)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigService.getConfigs', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-16 store_admin should read store level configs', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const configs = await service.getConfigs({ level: 'store' })
      // Seed has 1 store config (pos.tax_rate) for store-001
      assert.ok(configs.length >= 1)
      for (const cfg of configs) {
        assert.equal(cfg.level, 'store')
      }
    })
  })

  it('TC-17 tenant_admin should read tenant level configs', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const configs = await service.getConfigs({ level: 'tenant' })
      // Seed has 3 tenant configs for tenant-A
      assert.ok(configs.length >= 1)
    })
  })

  it('TC-18 brand_admin should read brand level configs', async () => {
    await runWithTenant(BRAND_CTX, async () => {
      const configs = await service.getConfigs({ level: 'brand' })
      // Seed has 2 brand configs
      assert.ok(configs.length >= 1)
    })
  })

  it('TC-19 store_admin should NOT read brand configs (forbidden)', async () => {
    await assert.rejects(
      runWithTenant(STORE_CTX, async () => service.getConfigs({ level: 'brand' })),
      /cannot access level=brand/,
    )
  })

  it('TC-20 operator should NOT read tenant configs (forbidden)', async () => {
    await assert.rejects(
      runWithTenant(OPERATOR_CTX, async () => service.getConfigs({ level: 'tenant' })),
      /cannot access level=tenant/,
    )
  })

  it('TC-21 should filter by category', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const configs = await service.getConfigs({ level: 'store', category: 'pos' })
      for (const cfg of configs) {
        assert.equal(cfg.category, 'pos')
      }
    })
  })

  it('TC-22 should filter by keys', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const configs = await service.getConfigs({
        level: 'store',
        keys: ['pos.tax_rate', 'member.daily_checkin_enabled'],
      })
      assert.ok(configs.length >= 1)
      assert.ok(configs.every(c => ['pos.tax_rate', 'member.daily_checkin_enabled'].includes(c.key)))
    })
  })

  it('TC-23 super_admin should read and set any level', async () => {
    await runWithTenant(SUPER_ADMIN_CTX, async () => {
      const storeConfigs = await service.getConfigs({ level: 'store' })
      assert.ok(Array.isArray(storeConfigs))
      // super_admin can also write at any level
      const stored = await service.setConfig({ key: 'compliance.audit_retention_days', value: '365' })
      assert.equal(stored.level, 'brand')
      const tenantSet = await service.setConfig({ key: 'ai.default_model', value: 'gpt-4o' })
      assert.equal(tenantSet.level, 'tenant')
    })
  })

  it('TC-24 getConfigs returns seeded configs at store level', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const all = await service.getConfigs({ level: 'store' })
      // Seed has 1 config at store level (pos.tax_rate for store-001)
      assert.ok(all.length >= 1)
      const keys = all.map(c => c.key)
      assert.ok(keys.includes('pos.tax_rate'))
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 5. TenantConfigService - setConfig (三级独立写入)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigService.setConfig', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-25 should set store level config', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const inst = await service.setConfig({ key: 'pos.tax_rate', value: '0.08' })
      assert.equal(inst.key, 'pos.tax_rate')
      assert.equal(inst.level, 'store')
      assert.equal(inst.ownerId, 'store-001')
    })
  })

  it('TC-26 should set tenant level config', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const inst = await service.setConfig({
        key: 'marketing.default_campaign_budget',
        value: '75000',
      })
      assert.equal(inst.key, 'marketing.default_campaign_budget')
      assert.equal(inst.level, 'tenant')
    })
  })

  it('TC-27 should set brand level config', async () => {
    await runWithTenant(BRAND_CTX, async () => {
      const inst = await service.setConfig({
        key: 'branding.primary_color',
        value: '#ff0000',
      })
      assert.equal(inst.key, 'branding.primary_color')
      assert.equal(inst.level, 'brand')
    })
  })

  it('TC-28 should increment version on update', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const v1 = await service.setConfig({
        key: 'ai.default_model',
        value: 'gpt-4o',
      })
      assert.equal(v1.version, 2) // seed version 1, now 2

      const v2 = await service.setConfig({
        key: 'ai.default_model',
        value: 'claude-3.5-sonnet',
      })
      assert.equal(v2.version, 3)
    })
  })

  it('TC-29 should reject unknown key', async () => {
    await assert.rejects(
      runWithTenant(STORE_CTX, async () =>
        service.setConfig({ key: 'unknown.key', value: 'x' }),
      ),
      /Unknown config key/,
    )
  })

  it('TC-30 should reject config at wrong level', async () => {
    await assert.rejects(
      runWithTenant(STORE_CTX, async () =>
        service.setConfig({ key: 'compliance.audit_retention_days', value: '365' }),
      ),
      /cannot access/,
    )
  })

  it('TC-31 should validate number type', async () => {
    await assert.rejects(
      runWithTenant(STORE_CTX, async () =>
        service.setConfig({ key: 'pos.tax_rate', value: 'not-a-number' }),
      ),
      /must be a number/,
    )
  })

  it('TC-32 should validate number range (min)', async () => {
    await assert.rejects(
      runWithTenant(STORE_CTX, async () =>
        service.setConfig({ key: 'pos.tax_rate', value: '-1' }),
      ),
      /must be >=/,
    )
  })

  it('TC-33 should validate number range (max)', async () => {
    await assert.rejects(
      runWithTenant(STORE_CTX, async () =>
        service.setConfig({ key: 'pos.tax_rate', value: '2' }),
      ),
      /must be <=/,
    )
  })

  it('TC-34 should validate enum', async () => {
    await assert.rejects(
      runWithTenant(TENANT_CTX, async () =>
        service.setConfig({ key: 'ai.default_model', value: 'invalid-model' }),
      ),
      /must be one of/,
    )
  })

  it('TC-35 should validate pattern (hex color)', async () => {
    await assert.rejects(
      runWithTenant(BRAND_CTX, async () =>
        service.setConfig({ key: 'branding.primary_color', value: 'red' }),
      ),
      /does not match pattern/,
    )
  })

  it('TC-36 should accept valid enum values', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const inst = await service.setConfig({ key: 'ai.default_model', value: 'deepseek-chat' })
      assert.ok(inst)
      assert.equal(inst.value, 'deepseek-chat')
    })
  })

  it('TC-37 should store inherits flag', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const inst = await service.setConfig({
        key: 'pos.tax_rate',
        value: '0.06',
        inherits: false,
      })
      assert.equal(inst.inherits, false)
    })
  })

  it('TC-38 operator should NOT set tenant config', async () => {
    await assert.rejects(
      runWithTenant(OPERATOR_CTX, async () =>
        service.setConfig({ key: 'ai.default_model', value: 'gpt-4o' }),
      ),
      /cannot access/,
    )
  })
})

// ═══════════════════════════════════════════════════════════════════
// 6. TenantConfigService - setConfigBatch (批量写入)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigService.setConfigBatch', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-39 should set multiple configs at once', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const results = await service.setConfigBatch([
        { key: 'marketing.default_campaign_budget', value: '100000' },
        { key: 'ai.default_model', value: 'gpt-4o' },
      ])
      assert.equal(results.length, 2)
    })
  })

  it('TC-40 batch should partial-fail on invalid item', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      await assert.rejects(
        service.setConfigBatch([
          { key: 'marketing.default_campaign_budget', value: '100000' },
          { key: 'unknown.key', value: 'x' },
        ]),
        /Unknown config key/,
      )
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 7. TenantConfigService - getConfig (单个读取 + 脱敏)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigService.getConfig', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-41 should return public config without masking', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const cfg = await service.getConfig('pos.tax_rate')
      assert.ok(cfg)
      assert.equal(cfg.value, '0.13')
    })
  })

  it('TC-42 should mask secret config', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      await service.setConfig({
        key: 'integration.webhook_url',
        value: 'https://hooks.example.com/token-secret-xyz',
      })
      const cfg = await service.getConfig('integration.webhook_url')
      assert.ok(cfg)
      assert.match(cfg.value, /^\*\*\*-/)
    })
  })

  it('TC-43 should return seed instance for pos.receipt_footer', async () => {
    await runWithTenant(STORE_CTX, async () => {
      // pos.receipt_footer 已在 seed() 中预置 (fromSeed: true)
      // getConfig 应该返回 seed instance 而非 null
      const cfg = await service.getConfig('pos.receipt_footer')
      assert.ok(cfg, 'seeded config should be returned, not null')
      assert.equal(cfg!.value, '谢谢惠顾')
      assert.equal(cfg!.key, 'pos.receipt_footer')
      // Phase-FP P0-D1 修复: 业务影响完整断言
      assert.equal(cfg!.level, 'store')
      assert.equal(cfg!.ownerId, 'store-001')
      assert.equal(cfg!.fromSeed, true)
      assert.equal(cfg!.version, 1)
      assert.match(cfg!.id, /^cfg-seed-store-pos-receipt_footer$/)
      assert.equal(cfg!.encrypted, false)
      assert.equal(cfg!.category, 'pos')
    })
  })

  it('TC-44 should reject access to restricted level', async () => {
    await assert.rejects(
      runWithTenant(STORE_CTX, async () =>
        service.getConfig('compliance.audit_retention_days'),
      ),
      /cannot access/,
    )
  })
})

// ═══════════════════════════════════════════════════════════════════
// 8. TenantConfigService - getEffectiveConfigs (继承链)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigService.getEffectiveConfigs', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-45 should return effective configs with inheritance info', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const configs = await service.getEffectiveConfigs()
      assert.ok(configs.length > 0)
      for (const cfg of configs) {
        assert.ok('key' in cfg)
        assert.ok('value' in cfg)
        assert.ok('sourceLevel' in cfg)
        assert.ok('inherited' in cfg)
      }
    })
  })

  it('TC-46 effective config should show store-level override', async () => {
    await runWithTenant(STORE_CTX, async () => {
      await service.setConfig({ key: 'pos.tax_rate', value: '0.05' })
      const configs = await service.getEffectiveConfigs('pos')
      const tax = configs.find((c) => c.key === 'pos.tax_rate')
      assert.ok(tax)
      assert.equal(tax.value, '0.05')
      assert.equal(tax.inherited, false)
    })
  })

  it('TC-47 effective config should show inherited from tenant', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const configs = await service.getEffectiveConfigs('member')
      const threshold = configs.find((c) => c.key === 'member.tier_upgrade_threshold')
      if (threshold) {
        assert.equal(threshold.inherited, false) // tenant level has seed
      }
    })
  })

  it('TC-48 should filter by category', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const posConfigs = await service.getEffectiveConfigs('pos')
      for (const cfg of posConfigs) {
        assert.ok(cfg.key.startsWith('pos.'))
      }
    })
  })

  it('TC-49 should return empty for non-existent category', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const configs = await service.getEffectiveConfigs('non-existent-category' as any)
      assert.equal(configs.length, 0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 9. TenantConfigService - getWorkbenchConfigs (工作台视角)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigService.getWorkbenchConfigs', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-50 W-S should return store-level effective configs', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const configs = await service.getWorkbenchConfigs('W-S')
      assert.ok(configs.length > 0)
    })
  })

  it('TC-51 W-T should return tenant-level effective configs', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const configs = await service.getWorkbenchConfigs('W-T')
      assert.ok(configs.length > 0)
    })
  })

  it('TC-52 W-B should return brand-level effective configs', async () => {
    await runWithTenant(BRAND_CTX, async () => {
      const configs = await service.getWorkbenchConfigs('W-B')
      assert.ok(configs.length > 0)
    })
  })

  it('TC-53 store_admin should NOT access W-B', async () => {
    await assert.rejects(
      runWithTenant(STORE_CTX, async () => service.getWorkbenchConfigs('W-B')),
      /cannot access level=brand/,
    )
  })

  it('TC-54 should filter workbench configs by category', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const configs = await service.getWorkbenchConfigs('W-S', 'pos')
      for (const cfg of configs) {
        assert.ok(cfg.key.startsWith('pos.') || cfg.key.startsWith('print.'))
      }
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 10. TenantConfigService - rollback (回滚)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigService.rollback', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-55 should rollback config to target version', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const v1 = await service.setConfig({ key: 'ai.default_model', value: 'gpt-4o' })
      await service.setConfig({ key: 'ai.default_model', value: 'claude-3.5-sonnet' })

      const rolled = await service.rollback(1, v1.id)
      assert.equal(rolled.version, 1)
    })
  })

  it('TC-56 should reject rollback of non-existent config', async () => {
    await assert.rejects(
      runWithTenant(TENANT_CTX, async () =>
        service.rollback(1, 'nonexistent-id'),
      ),
      /not found/,
    )
  })

  it('TC-57 should reject rollback by user without level access', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const v1 = await service.setConfig({ key: 'ai.default_model', value: 'gpt-4o' })
      await assert.rejects(
        runWithTenant(STORE_CTX, async () =>
          service.rollback(1, v1.id),
        ),
        /cannot access/,
      )
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 11. TenantConfigService - Audit Log (审计日志)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigService.listAuditLogs', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-58 should record audit log on setConfig', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      await service.setConfig({ key: 'marketing.default_campaign_budget', value: '80000' })
      const logs = await service.listAuditLogs(100, 'tenant-A')
      assert.ok(logs.length > 0)
      const log = logs.find((l) => l.action === 'update' || l.action === 'create')
      assert.ok(log, 'should have audit log for setConfig')
    })
  })

  it('TC-59 should record audit log on rollback', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const v1 = await service.setConfig({ key: 'ai.default_model', value: 'gpt-4o' })
      await service.rollback(1, v1.id)
      const logs = await service.listAuditLogs(100, 'tenant-A')
      const rollbackLog = logs.find((l) => l.action === 'rollback')
      assert.ok(rollbackLog, 'should have rollback audit log')
      assert.equal(rollbackLog.operatorRole, 'tenant_admin')
    })
  })

  it('TC-60 should record operator role in audit log', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      await service.setConfig({ key: 'marketing.default_campaign_budget', value: '60000' })
      const logs = await service.listAuditLogs(100, 'tenant-A')
      const log = logs.find((l) => l.key === 'marketing.default_campaign_budget')
      assert.ok(log, 'should have audit log for campaign budget')
      assert.equal(log.operatorRole, 'tenant_admin')
      assert.ok(log.timestamp)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 12. TenantConfigController - Meta + Edge Cases (边界情况)
// ═══════════════════════════════════════════════════════════════════

describe('TenantConfigController', () => {
  let controller: TenantConfigController

  beforeEach(() => {
    controller = makeController()
  })

  it('TC-61 definitions() should return all builtin defs', () => {
    const result = controller.definitions()
    assert.equal(result.total, BUILTIN_CONFIG_DEFINITIONS.length)
    assert.equal(result.items.length, result.total)
  })

  it('TC-62 each definition should have label in Chinese', () => {
    const result = controller.definitions()
    for (const def of result.items) {
      assert.ok(def.label.length >= 2, `label too short for ${def.key}: ${def.label}`)
    }
  })

  it('TC-62B cacheStats() should expose default zero stats', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const result = controller.cacheStats()
      assert.equal(result.enabled, false)
      assert.equal(result.hits, 0)
      assert.equal(result.misses, 0)
      assert.equal(result.invalidations, 0)
      assert.equal(result.errors, 0)
      assert.equal(result.hitRate, 0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════
// 13. CATEGORY_LEVEL_MATRIX consistency
// ═══════════════════════════════════════════════════════════════════

describe('CATEGORY_LEVEL_MATRIX consistency', () => {
  it('TC-63 every config category should exist in matrix', () => {
    const categories = new Set(BUILTIN_CONFIG_DEFINITIONS.map((d) => d.category))
    for (const cat of categories) {
      assert.ok(CATEGORY_LEVEL_MATRIX[cat], `category ${cat} missing from CATEGORY_LEVEL_MATRIX`)
    }
  })

  it('TC-64 every config level should be in its category matrix', () => {
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      const allowed = CATEGORY_LEVEL_MATRIX[def.category]
      assert.ok(allowed.includes(def.level), `${def.key} level ${def.level} not in matrix for category ${def.category}`)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════
// 14. 极限/边界场景
// ═══════════════════════════════════════════════════════════════════

describe('Edge cases', () => {
  let service: TenantConfigService

  beforeEach(() => {
    service = makeService()
  })

  it('TC-65 should encrypt secret config values', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const inst = await service.setConfig({
        key: 'integration.webhook_url',
        value: 'my-super-secret-token',
      })
      assert.equal(inst.encrypted, true)
      // stored value should be different from original
      assert.notEqual(inst.value, 'my-super-secret-token')
    })
  })

  it('TC-66 public config values should not be encrypted', async () => {
    await runWithTenant(STORE_CTX, async () => {
      const inst = await service.setConfig({ key: 'pos.tax_rate', value: '0.10' })
      assert.equal(inst.encrypted, false)
      assert.equal(inst.value, '0.10')
    })
  })

  it('TC-67 listAuditLogs should return logs filtered by tenant', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      await service.setConfig({ key: 'marketing.default_campaign_budget', value: '60000' })
      const logs = await service.listAuditLogs(100, 'tenant-A')
      assert.ok(logs.length >= 1)
      // all logs should be for tenant-A
      for (const log of logs) {
        assert.ok(log.ownerId.startsWith('tenant-A'))
      }
    })
  })

  it('TC-68 rollback should record new audit log entry', async () => {
    await runWithTenant(TENANT_CTX, async () => {
      const beforeCount = (await service.listAuditLogs(100, 'tenant-A')).length
      const v1 = await service.setConfig({ key: 'ai.default_model', value: 'gpt-4o' })
      await service.rollback(1, v1.id)
      const afterCount = (await service.listAuditLogs(100, 'tenant-A')).length
      assert.ok(afterCount > beforeCount)
    })
  })

  it('TC-69 same key set by different owners should not conflict', async () => {
    await runWithTenant(
      { ...STORE_CTX, storeId: 'store-001' },
      async () => {
        await service.setConfig({ key: 'pos.tax_rate', value: '0.08' })
      },
    )
    await runWithTenant(
      { ...STORE_CTX, storeId: 'store-002' },
      async () => {
        await service.setConfig({ key: 'pos.tax_rate', value: '0.10' })
      },
    )
    // verify store-001 still has 0.08
    await runWithTenant(
      { ...STORE_CTX, storeId: 'store-001' },
      async () => {
        const cfg = await service.getConfig('pos.tax_rate')
        assert.equal(cfg!.value, '0.08')
      },
    )
  })
})

// ═══════════════════════════════════════════════════════════════════
// Phase-FP P0-J1 + J2 + J3: H4/H5/H9/H11 安全边界 + H8 留痕 + H12 原文
// ═══════════════════════════════════════════════════════════════════

/** 业务租户伪装品牌租户: tenantId 以 'brand-' 开头, role 是 tenant_admin (非特权) */
const EVIL_BRAND_CTX = {
  tenantId: 'brand-evil',
  storeId: 'store-evil',
  userId: 'evil-op',
  role: 'tenant_admin' as const,
}

describe('P0-J1 8 入口 assertTenantIdFormat 防御矩阵', () => {
  it('[J1-1] getConfigs: 业务租户 brand- 前缀 → 抛 Forbidden', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(EVIL_BRAND_CTX, async () => service.getConfigs({ level: 'store' })),
      /reserved 'brand-' prefix/,
    )
  })

  it('[J1-2] getConfig: 业务租户 brand- 前缀 → 抛 Forbidden', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(EVIL_BRAND_CTX, async () => service.getConfig('pos.tax_rate')),
      /reserved 'brand-' prefix/,
    )
  })

  it('[J1-3] getEffectiveConfigs: 业务租户 brand- 前缀 → 抛 Forbidden', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(EVIL_BRAND_CTX, async () => service.getEffectiveConfigs()),
      /reserved 'brand-' prefix/,
    )
  })

  it('[J1-4] getWorkbenchConfigs: 业务租户 brand- 前缀 → 抛 Forbidden', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(EVIL_BRAND_CTX, async () => service.getWorkbenchConfigs('W-S')),
      /reserved 'brand-' prefix/,
    )
  })

  it('[J1-5] listAuditLogs: 业务租户 brand- 前缀 → 抛 Forbidden (P0-H9)', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(EVIL_BRAND_CTX, async () => service.listAuditLogs(10)),
      /reserved 'brand-' prefix/,
    )
  })

  it('[J1-6] setConfig: 业务租户 brand- 前缀 → 抛 Forbidden', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(EVIL_BRAND_CTX, async () =>
        service.setConfig({ key: 'pos.tax_rate', value: '0.1' }),
      ),
      /reserved 'brand-' prefix/,
    )
  })

  it('[J1-7] setConfigBatch: 业务租户 brand- 前缀 → 抛 Forbidden (P0-H11)', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(EVIL_BRAND_CTX, async () =>
        service.setConfigBatch([{ key: 'pos.tax_rate', value: '0.1' }]),
      ),
      /reserved 'brand-' prefix/,
    )
  })

  it('[J1-8] rollback: 业务租户 brand- 前缀 → 抛 Forbidden', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(EVIL_BRAND_CTX, async () => service.rollback(1, 'cfg-x')),
      /reserved 'brand-' prefix/,
    )
  })
})

describe('P0-J2 H8 跨租户 recordAudit 留痕验证', () => {
  it('[J2] super_admin 跨租户 brandId 注入 → auditLogs 增加 cross_tenant_brand_passthrough', async () => {
    const service = new TenantConfigService()
    const ctx = {
      tenantId: 'tenant-A',
      brandId: 'tenant-B::cross',
      userId: 'super-1',
      role: 'super_admin' as const,
    }
    const before = (await runWithTenant(ctx, async () => service.listAuditLogs(100))).length
    await runWithTenant(ctx, async () => service.getConfig('branding.primary_color'))
    const after = (await runWithTenant(ctx, async () => service.listAuditLogs(100))).length
    // 注: getConfig 内部 ownerIdFor 调 2 次 (主路径 + defaultValue fallback), 至少 1 次 recordAudit
    assert.ok(after >= before + 1, `auditLogs 应至少增加 1 条 (实际 +${after - before})`)
    const logs = await runWithTenant(ctx, async () => service.listAuditLogs(100))
    const passthroughLog = logs.find((l) => l.action === 'cross_tenant_brand_passthrough')
    assert.ok(passthroughLog, '必须存在 cross_tenant_brand_passthrough 记录')
    assert.equal(passthroughLog.key, '_meta_brand_id_passthrough')
  })
})

describe('P0-J3 H12 context 原文追溯验证', () => {
  it('[J3] super_admin 全角 brandId 注入 → context.originalBrandId 保留全角原文', async () => {
    const service = new TenantConfigService()
    const ctx = {
      tenantId: 'tenant-A',
      // 全角字符 - NFKC 归一化后与 tenant-A 归属, 但原文必须留存
      brandId: 'ＴＥＮＡＮＴ-Ａ::fullwidth',
      userId: 'super-1',
      role: 'super_admin' as const,
    }
    await runWithTenant(ctx, async () => service.getConfig('branding.primary_color'))
    const logs = await runWithTenant(ctx, async () => service.listAuditLogs(100))
    const passthroughLog = logs.find((l) => l.action === 'cross_tenant_brand_passthrough')
    assert.ok(passthroughLog, '必须存在 cross_tenant_brand_passthrough 记录')
    assert.equal(passthroughLog.context?.['originalBrandId'], 'ＴＥＮＡＮＴ-Ａ::fullwidth',
      '原文全角 brandId 必须保留在 context.originalBrandId')
  })
})

// ═══════════════════════════════════════════════════════════════════
// P1-F1-7: 二级索引同步矩阵 (验证 setConfig / setConfigBatch / deleteConfig 三入口双写)
// ═══════════════════════════════════════════════════════════════════

describe('P1-F1 二级索引同步矩阵', () => {
  it('[F1-7-1] setConfig 后 getConfigs 立即可见 (O(1) 索引同步)', async () => {
    const service = makeService()
    // STORE_CTX 写入 pos.tax_rate = '0.18' (覆盖 seed 0.13)
    await runWithTenant(STORE_CTX, async () => {
      const set = await service.setConfig({ key: 'pos.tax_rate', value: '0.18' })
      assert.equal(set.value, '0.18')
    })
    // 立即读取 - 如果索引没同步, getConfigs 走慢路径也可能命中, 但 version 必须 = 2
    await runWithTenant(STORE_CTX, async () => {
      const all = await service.getConfigs({ level: 'store' })
      const tax = all.find((c) => c.key === 'pos.tax_rate')
      assert.ok(tax, 'pos.tax_rate 必须存在')
      assert.equal(tax!.value, '0.18', '索引同步后值已更新')
      assert.equal(tax!.version, 2, 'setConfig 后 version 递增到 2')
    })
  })

  it('[F1-7-2] setConfigBatch 完成后索引批量同步', async () => {
    const service = makeService()
    await runWithTenant(STORE_CTX, async () => {
      // 批量更新 3 项
      const results = await service.setConfigBatch([
        { key: 'pos.tax_rate', value: '0.20' },
        { key: 'pos.receipt_footer', value: '欢迎光临' },
        { key: 'member.daily_checkin_enabled', value: 'false' },
      ])
      assert.equal(results.length, 3)
      // 索引同步验证
      const all = await service.getConfigs({ level: 'store' })
      const tax = all.find((c) => c.key === 'pos.tax_rate')
      const footer = all.find((c) => c.key === 'pos.receipt_footer')
      const checkin = all.find((c) => c.key === 'member.daily_checkin_enabled')
      assert.equal(tax!.value, '0.20')
      assert.equal(footer!.value, '欢迎光临')
      assert.equal(checkin!.value, 'false')
    })
  })

  it('[F1-7-3] deleteConfig 后索引清理, getConfigs 不再返回', async () => {
    const service = makeService()
    let configId: string = ''
    await runWithTenant(STORE_CTX, async () => {
      // 先确保存在
      const before = await service.getConfigs({ level: 'store' })
      const tax = before.find((c) => c.key === 'pos.tax_rate')
      assert.ok(tax)
      configId = tax!.id
    })
    // 删除
    await runWithTenant(STORE_CTX, async () => {
      await service.deleteConfig(configId)
    })
    // 删除后 getConfigs 不再返回该 instance (但 getEffectiveConfigs 会 fallback 到 defaultValue)
    await runWithTenant(STORE_CTX, async () => {
      const after = await service.getConfigs({ level: 'store' })
      const tax = after.find((c) => c.key === 'pos.tax_rate')
      assert.equal(tax, undefined, '索引清理后 pos.tax_rate 不再存在')
    })
  })

  it('[F1-F1-4] 跨租户 setConfig 互不污染 (索引按 ownerId 隔离)', async () => {
    const service = makeService()
    // tenant-A store-001 写 pos.tax_rate = '0.18'
    await runWithTenant(STORE_CTX, async () => {
      await service.setConfig({ key: 'pos.tax_rate', value: '0.18' })
    })
    // tenant-A store-002 读 pos.tax_rate - 应该是 seed 默认 0.13, 不是 0.18
    await runWithTenant(
      { tenantId: 'tenant-A', storeId: 'store-002', userId: 'op-2', role: 'store_admin' as const },
      async () => {
        const all = await service.getConfigs({ level: 'store' })
        const tax = all.find((c) => c.key === 'pos.tax_rate')
        // store-002 没 seed (只有 store-001 有), 索引应为空, 返回 undefined
        // 这证明索引按 idxKey='store::store-002' 隔离
        assert.equal(tax, undefined, 'store-002 索引应隔离, 不继承 store-001 的 0.18')
      },
    )
    // tenant-A store-001 再读, 应该是 0.18
    await runWithTenant(STORE_CTX, async () => {
      const all = await service.getConfigs({ level: 'store' })
      const tax = all.find((c) => c.key === 'pos.tax_rate')
      assert.equal(tax!.value, '0.18', 'store-001 自己的写入不受其他 store 影响')
    })
  })

  it('[F1-F1-5] getEffectiveConfigs 走索引 O(1) 命中 (非 O(n×m) 遍历)', async () => {
    const service = makeService()
    await runWithTenant(TENANT_CTX, async () => {
      // tenant-A tenant_admin 读 effective: member.tier_upgrade_threshold 应来自 tenant 级
      const eff = await service.getEffectiveConfigs('member')
      const tier = eff.find((e) => e.key === 'member.tier_upgrade_threshold')
      assert.ok(tier)
      assert.equal(tier!.inherited, false, 'tenant 级有 seed, 不应继承')
      assert.equal(tier!.value, '1000', 'tenant 级 seed 值是 1000')
      assert.equal(tier!.sourceLevel, 'tenant')
    })
  })

  it('[F1-T1] 并发 100 次 setConfig 同一 key → instances 与 index 最终一致', async () => {
    const service = makeService()
    const promises: Promise<unknown>[] = []
    for (let i = 0; i < 100; i++) {
      promises.push(
        runWithTenant(STORE_CTX, async () => {
          await service.setConfig({ key: 'pos.tax_rate', value: `0.${i.toString().padStart(2, '0')}` })
        }),
      )
    }
    await Promise.all(promises)

    // F1-T1 验证: instances Map 和 index 指向同一 instance (最终一致)
    await runWithTenant(STORE_CTX, async () => {
      const all = await service.getConfigs({ level: 'store' })
      const tax = all.find((c) => c.key === 'pos.tax_rate')
      assert.ok(tax)
      // version: seed 算 1, 100 次并发 setConfig 累加 100 次 = 101
      // 注: 实际 version 由 setConfig 串行累加, 并发时 V8 单线程保证原子性
      assert.equal(tax!.version, 101, '100 次并发写入后 version 应 = 1 (seed) + 100 = 101')
      // value 必须是 0.00-0.99 中某一个 (最后写入的)
      assert.match(tax!.value, /^0\.\d{2}$/, 'value 应是 0.XX 格式')
    })
  })
})

describe('F2 tenant-config 缓存闭环', () => {
  class SlowInvalidationCacheBackend extends InMemoryCacheService {
    invalidated = false
    delByPrefixCalls = 0

    override async delByPrefix(prefix: string): Promise<number> {
      this.delByPrefixCalls++
      await new Promise((resolve) => setTimeout(resolve, 20))
      const count = await super.delByPrefix(prefix)
      this.invalidated = true
      return count
    }
  }

  it('[F2-4] getConfigs 同上下文第二次命中缓存', async () => {
    const cache = new TenantConfigCacheService(new InMemoryCacheService())
    const service = new TenantConfigService(undefined, cache)

    await runWithTenant(STORE_CTX, async () => {
      const first = await service.getConfigs({ level: 'store' })
      const second = await service.getConfigs({ level: 'store' })
      assert.ok(first.length >= 1)
      assert.deepEqual(second, first)
    })

    const stats = cache.getStats()
    assert.equal(stats.misses, 1)
    assert.equal(stats.hits, 1)
  })

  it('[F2-5] setConfig 后租户缓存失效，再读返回新值', async () => {
    const cache = new TenantConfigCacheService(new InMemoryCacheService())
    const service = new TenantConfigService(undefined, cache)

    await runWithTenant(STORE_CTX, async () => {
      const before = await service.getConfigs({ level: 'store' })
      const taxBefore = before.find((c) => c.key === 'pos.tax_rate')
      assert.equal(taxBefore?.value, '0.13')
    })
    assert.equal(cache.getStats().misses, 1)

    await runWithTenant(STORE_CTX, async () => {
      await service.setConfig({ key: 'pos.tax_rate', value: '0.21' })
    })

    await runWithTenant(STORE_CTX, async () => {
      const after = await service.getConfigs({ level: 'store' })
      const taxAfter = after.find((c) => c.key === 'pos.tax_rate')
      assert.equal(taxAfter?.value, '0.21')
    })

    const stats = cache.getStats()
    assert.equal(stats.misses, 2, '写入后应失效并重新 miss 一次')
    assert.ok(stats.invalidations >= 1, '写入后必须触发租户级缓存失效')
  })

  it('[F2-6] setConfig 返回前必须已完成缓存失效，避免脏读窗口', async () => {
    const backend = new SlowInvalidationCacheBackend()
    const cache = new TenantConfigCacheService(backend)
    const service = new TenantConfigService(undefined, cache)

    await runWithTenant(STORE_CTX, async () => {
      await service.getConfigs({ level: 'store' })
      await service.setConfig({ key: 'pos.tax_rate', value: '0.22' })
      assert.equal(backend.invalidated, true, 'setConfig resolve 前应等待 delByPrefix 完成')
    })
  })

  it('[F2-7] cacheStats 只返回当前 tenant 的统计，不串其他租户', async () => {
    const cache = new TenantConfigCacheService(new InMemoryCacheService())
    const service = new TenantConfigService(undefined, cache)
    const controller = new TenantConfigController(service)

    await runWithTenant(STORE_CTX, async () => {
      await controller.listConfigs({ level: 'store' })
      await controller.listConfigs({ level: 'store' })
    })
    await runWithTenant({ ...STORE_CTX, tenantId: 'tenant-B', storeId: 'store-009' }, async () => {
      await controller.listConfigs({ level: 'store' })
    })

    await runWithTenant(STORE_CTX, async () => {
      const stats = controller.cacheStats()
      assert.equal(stats.hits, 1)
      assert.equal(stats.misses, 1)
      assert.equal(stats.hitRate, 0.5)
    })
  })

  it('[F2-9] setConfigBatch 只做一次最终缓存失效，不对每条 item 重复失效', async () => {
    const backend = new SlowInvalidationCacheBackend()
    const cache = new TenantConfigCacheService(backend)
    const service = new TenantConfigService(undefined, cache)

    await runWithTenant(TENANT_CTX, async () => {
      await service.getConfigs({ level: 'tenant' })
      await service.setConfigBatch([
        { key: 'member.tier_upgrade_threshold', value: '2001' },
        { key: 'member.daily_checkin_enabled', value: 'false' },
      ])
    })

    assert.equal(
      backend.delByPrefixCalls,
      3,
      'batch 预热后的失效应只发生在最终 config/configs/effective-configs 三个 scope，各 1 次',
    )
  })
})
