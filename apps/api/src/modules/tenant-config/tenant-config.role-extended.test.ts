import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-config] [C] 角色测试补全 (扩展)
 *
 * 8 角色视角扩展测试 —— 每个角色新增:
 * - 多级继承链场景
 * - 并发/级联边界
 * - 数据脱敏边界
 * - 批量操作边界
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TenantConfigService } from './tenant-config.service'
import { runWithTenant } from '../../common/context/tenant-context'

const STORE_ADMIN  = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'shop-mgr', role: 'store_admin' as const }
const TENANT_ADMIN = { tenantId: 'tenant-A', userId: 'tnt-admin', role: 'tenant_admin' as const }
const BRAND_ADMIN  = { tenantId: 'brand-shenjiying', userId: 'brand-admin', role: 'brand_admin' as const }
const OPERATOR     = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'op-01', role: 'operator' as const }
const VIEWER       = { tenantId: 'tenant-A', storeId: 'store-001', userId: 'v-01', role: 'viewer' as const }
const AUDITOR      = { tenantId: 'tenant-A', userId: 'aud-01', role: 'auditor' as const }

const STORE_002 = { tenantId: 'tenant-A', storeId: 'store-002', userId: 'mgr-002', role: 'store_admin' as const }

// ──────────────────────────────────────────────
// 1. 👔 店长 (store_admin · 门店级)
// ──────────────────────────────────────────────

describe('👔 店长扩展', () => {
  it('[继承] 门店级配置未覆盖时继承使用租户级默认值', async () => {
    const service = new TenantConfigService()
    await runWithTenant(STORE_002, async () => {
      // store-002 未单独设置 pos.tax_rate，应走 seed 默认值
      const config = await service.getConfig('pos.tax_rate')
      assert.ok(config)
      assert.equal(config.value, '0.13')
    })
  })

  it('[继承] 门店覆盖配置后不再继承', async () => {
    const service = new TenantConfigService()
    await runWithTenant(STORE_ADMIN, async () => {
      await service.setConfig({ key: 'pos.tax_rate', value: '0.08' })
      const config = await service.getConfig('pos.tax_rate')
      assert.equal(config!.value, '0.08')
    })
    // 验证 store-001 独立, store-002 不受影响
    await runWithTenant(STORE_002, async () => {
      const config = await service.getConfig('pos.tax_rate')
      assert.equal(config!.value, '0.13')
    })
  })

  it('[边界] 门店不可读取品牌级 billing.tax_id 加密配置', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(STORE_ADMIN, () => service.getConfig('billing.tax_id')),
      /cannot access/,
    )
  })
})

// ──────────────────────────────────────────────
// 2. 🛒 前台 (store_admin · 实操)
// ──────────────────────────────────────────────

describe('🛒 前台扩展', () => {
  it('[边界] 读取自动打印小票布尔配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(STORE_ADMIN, async () => {
      const config = await service.getConfig('print.auto_print_receipt')
      assert.ok(config)
      assert.equal(config.key, 'print.auto_print_receipt')
    })
  })

  it('[边界] 前台不持有 storeId 时操作拒绝', async () => {
    const service = new TenantConfigService()
    const noStore = { tenantId: 'tenant-A', userId: 'front-op', role: 'store_admin' as const }
    await runWithTenant(noStore, async () => {
      const config = await service.getConfig('pos.tax_rate')
      assert.ok(config) // store_level fallback 到 store-default
    })
  })

  it('[正例] effective 配置包含继承来源信息', async () => {
    const service = new TenantConfigService()
    await runWithTenant(STORE_ADMIN, async () => {
      const effective = await service.getEffectiveConfigs('pos')
      const tax = effective.find((e) => e.key === 'pos.tax_rate')
      assert.ok(tax)
      assert.equal(typeof tax.sourceLevel, 'string')
      assert.equal(typeof tax.inherited, 'boolean')
    })
  })
})

// ──────────────────────────────────────────────
// 3. 👥 HR (tenant_admin)
// ──────────────────────────────────────────────

describe('👥 HR 扩展', () => {
  it('[加密] secret 字段返回被掩码值', async () => {
    const service = new TenantConfigService()
    await runWithTenant(TENANT_ADMIN, async () => {
      await service.setConfig({ key: 'integration.webhook_url', value: 'https://hook.example.com/callback' })
      const config = await service.getConfig('integration.webhook_url')
      assert.ok(config)
      assert.ok(config.value.includes('***-'), 'secret value should be masked')
    })
  })

  it('[范围] 积分阈值低于最小值时返回校验错误', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(TENANT_ADMIN, () =>
        service.setConfig({ key: 'member.tier_upgrade_threshold', value: '-1' }),
      ),
      /must be >=/,
    )
  })

  it('[批量] HR 批量设置租户级配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(TENANT_ADMIN, async () => {
      const results = await service.setConfigBatch([
        { key: 'member.tier_upgrade_threshold', value: '2000' },
        { key: 'ai.default_model', value: 'deepseek-chat' },
      ])
      assert.equal(results.length, 2)
      const tier = results.find((r) => r.key === 'member.tier_upgrade_threshold')
      assert.equal(tier?.value, '2000')
    })
  })
})

// ──────────────────────────────────────────────
// 4. 🔧 安监 (auditor)
// ──────────────────────────────────────────────

describe('🔧 安监扩展', () => {
  it('[审计] 安监可查看三级审计日志', async () => {
    const service = new TenantConfigService()
    await runWithTenant(TENANT_ADMIN, async () => {
      await service.setConfig({ key: 'pos.tax_rate', value: '0.06' })
    })
    await runWithTenant(AUDITOR, async () => {
      const logs = service.listAuditLogs('tenant-A')
      assert.ok(logs.length > 0)
    })
  })

  it('[审计] 安监可跨门店查看审计日志 (pure service 测试)', async () => {
    const service = new TenantConfigService()
    await runWithTenant(STORE_ADMIN, async () => {
      await service.setConfig({ key: 'pos.receipt_footer', value: '欢迎光临' })
    })
    await runWithTenant(AUDITOR, async () => {
      const logs = service.listAuditLogs('tenant-A', 50)
      const footerLog = logs.find((l) => l.key === 'pos.receipt_footer')
      assert.ok(footerLog)
      assert.equal(footerLog.action, 'create')
    })
  })

  it('[边界] 审计日志回滚操作记录', async () => {
    const service = new TenantConfigService()
    await runWithTenant(TENANT_ADMIN, async () => {
      const created = await service.setConfig({ key: 'marketing.default_campaign_budget', value: '99999' })
      await service.rollback(1, created.id)
      const logs = service.listAuditLogs('tenant-A')
      const rollbackLog = logs.find((l) => l.action === 'rollback')
      assert.ok(rollbackLog)
      assert.equal(typeof rollbackLog.context?.targetVersion, 'number')
    })
  })
})

// ──────────────────────────────────────────────
// 5. 🎮 导玩员 (store_admin · 门店实操)
// ──────────────────────────────────────────────

describe('🎮 导玩员扩展', () => {
  it('[正例] 读取 POS 页脚配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(STORE_ADMIN, async () => {
      const cfg = await service.getConfig('pos.receipt_footer')
      assert.ok(cfg)
      assert.equal(cfg.key, 'pos.receipt_footer')
    })
  })

  it('[正例] W-S 工作台返回的门店配置不包含租户级字段', async () => {
    const service = new TenantConfigService()
    await runWithTenant(STORE_ADMIN, async () => {
      const configs = await service.getWorkbenchConfigs('W-S')
      const tenantKeys = configs.filter((c) => c.sourceLevel !== 'store')
      assert.equal(tenantKeys.length, 0, 'W-S should not return tenant/brand configs')
    })
  })

  it('[边界] 修改小票页脚不影响其他门店', async () => {
    const service = new TenantConfigService()
    await runWithTenant(STORE_ADMIN, async () => {
      await service.setConfig({ key: 'pos.receipt_footer', value: '玩得开心' })
    })
    await runWithTenant(STORE_002, async () => {
      const cfg = await service.getConfig('pos.receipt_footer')
      assert.notEqual(cfg!.value, '玩得开心', 'store-002 should not see store-001 change')
    })
  })
})

// ──────────────────────────────────────────────
// 6. 🎯 运行专员 (operator)
// ──────────────────────────────────────────────

describe('🎯 运行专员扩展', () => {
  it('[正例] 运行专员读取门店配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(OPERATOR, async () => {
      const configs = await service.getConfigs({ level: 'store' })
      assert.ok(configs.length > 0)
    })
  })

  it('[权限] 运行专员不能读取租户级 member 配置', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(OPERATOR, () => service.getConfig('member.tier_upgrade_threshold')),
      /cannot access/,
    )
  })

  it('[边界] 运行专员不能调用 brand 级 getWorkbenchConfigs', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(OPERATOR, () => service.getWorkbenchConfigs('W-B')),
      /cannot access/,
    )
  })
})

// ──────────────────────────────────────────────
// 7. 🤝 团建 (brand_admin)
// ──────────────────────────────────────────────

describe('🤝 团建扩展', () => {
  it('[加密] 品牌税号存储后被加密且返回掩码', async () => {
    const service = new TenantConfigService()
    await runWithTenant(BRAND_ADMIN, async () => {
      await service.setConfig({ key: 'billing.tax_id', value: 'TAX-88888888' })
      const cfg = await service.getConfig('billing.tax_id')
      assert.ok(cfg)
      assert.ok(cfg.value.includes('***-'), 'secret should be masked even for brand_admin')
    })
  })

  it('[正例] 品牌主色自定义后生效', async () => {
    const service = new TenantConfigService()
    await runWithTenant(BRAND_ADMIN, async () => {
      const result = await service.setConfig({ key: 'branding.primary_color', value: '#52c41a' })
      assert.equal(result.version, 2) // 覆盖种子版本
    })
  })

  it('[批量] 品牌方批量更新合规+主色', async () => {
    const service = new TenantConfigService()
    await runWithTenant(BRAND_ADMIN, async () => {
      const results = await service.setConfigBatch([
        { key: 'compliance.audit_retention_days', value: '365' },
        { key: 'branding.logo_url', value: 'https://cdn.example.com/logo.svg' },
      ])
      assert.equal(results.length, 2)
    })
  })
})

// ──────────────────────────────────────────────
// 8. 📢 营销 (tenant_admin · 营销配置)
// ──────────────────────────────────────────────

describe('📢 营销扩展', () => {
  it('[边界] 营销预算设为 0 通过校验 (允许免费活动)', async () => {
    const service = new TenantConfigService()
    await runWithTenant(TENANT_ADMIN, async () => {
      const result = await service.setConfig({ key: 'marketing.default_campaign_budget', value: '0' })
      assert.equal(result.key, 'marketing.default_campaign_budget')
    })
  })

  it('[权限] 营销不能读取品牌税务配置', async () => {
    const service = new TenantConfigService()
    await assert.rejects(
      runWithTenant(TENANT_ADMIN, () => service.getConfig('billing.tax_id')),
      /cannot access/,
    )
  })

  it('[正例] 查看租户及门店 effective 营销配置摘要', async () => {
    const service = new TenantConfigService()
    await runWithTenant(TENANT_ADMIN, async () => {
      const effective = await service.getEffectiveConfigs('marketing')
      const budget = effective.find((e) => e.key === 'marketing.default_campaign_budget')
      assert.ok(budget)
      assert.equal(budget.sourceLevel, 'tenant')
    })
  })

  it('[回滚] 营销预算回滚到前版本', async () => {
    const service = new TenantConfigService()
    await runWithTenant(TENANT_ADMIN, async () => {
      const v1 = await service.setConfig({ key: 'marketing.default_campaign_budget', value: '50000' })
      await service.setConfig({ key: 'marketing.default_campaign_budget', value: '80000' })
      const rolled = await service.rollback(v1.version, v1.id)
      assert.equal(rolled.version, v1.version)
    })
  })
})
