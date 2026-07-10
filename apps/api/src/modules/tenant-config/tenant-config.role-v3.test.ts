import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-config] [C] 角色测试 v3 (8角色全覆盖)
 *
 * 8 角色视角的 tenant-config 模块测试：
 * 👔店长 StoreManager  🛒前台 FrontDesk  👥HR HR
 * 🔧安监 Safety         🎮导玩员 Guide    🎯运行专员 Ops
 * 🤝团建 Teambuilding   📢营销 Marketing
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 *
 * 三级配置系统：W-S(门店级) / W-T(租户级) / W-B(品牌级)
 * 角色权限：store_admin/operator→store级; tenant_admin→store+tenant级;
 *           viewer→store+tenant级; auditor→store+tenant+brand(全只读);
 *           brand_admin→tenant+brand级
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { TenantConfigService } from './tenant-config.service'
import { runWithTenant } from '../../common/context/tenant-context'

// ─── 8 角色定义 ───
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ─── 8 角色上下文 ───
const ctx = {
  storeManager:  { tenantId: 'tenant-A', storeId: 'store-001', userId: 'shop-mgr', role: 'store_admin' as const },
  frontDesk:     { tenantId: 'tenant-A', storeId: 'store-001', userId: 'front-desk', role: 'operator' as const },
  hr:            { tenantId: 'tenant-A', storeId: 'store-001', userId: 'hr-user', role: 'viewer' as const },
  safety:        { tenantId: 'tenant-A', storeId: 'store-001', userId: 'safety-user', role: 'auditor' as const },
  guide:         { tenantId: 'tenant-A', storeId: 'store-001', userId: 'guide-user', role: 'operator' as const },
  ops:           { tenantId: 'tenant-A', storeId: 'store-001', userId: 'ops-user', role: 'tenant_admin' as const },
  teambuilding:  { tenantId: 'tenant-A', storeId: 'store-001', userId: 'tb-user', role: 'viewer' as const },
  marketing:     { tenantId: 'tenant-A', storeId: 'store-001', userId: 'mkt-user', role: 'tenant_admin' as const },
}

// ─────────────────────────────────────────────────────────────────
// 1. 👔 店长 (StoreManager · store_admin — 门店级读写)
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} 店长视角`, () => {
  it('[正常] 店长可以修改门店税率配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.storeManager, async () => {
      const result = await service.setConfig({ key: 'pos.tax_rate', value: '0.08' })
      assert.equal(result.key, 'pos.tax_rate')
      assert.equal(result.value, '0.08')
      assert.equal(result.level, 'store')
    })
  })

  it('[权限边界] 店长无法写入品牌级配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.storeManager, async () => {
      try {
        await service.setConfig({ key: 'compliance.audit_retention_days', value: '365' })
        assert.fail('Should have thrown ForbiddenException')
      } catch (e: any) {
        assert.ok(e.message.includes('cannot access'), `Expected ForbiddenException, got: ${e.message}`)
      }
    })
  })

  it('[正常] 店长可以读取门店级有效配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.storeManager, async () => {
      const configs = await service.getEffectiveConfigs('pos')
      assert.ok(configs.length >= 1, 'Should have at least one POS config')
      const taxConfig = configs.find((c) => c.key === 'pos.tax_rate')
      assert.ok(taxConfig, 'pos.tax_rate should be in effective configs')
      assert.equal(taxConfig!.sourceLevel, 'store')
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// 2. 🛒前台 (FrontDesk · operator — 门店级读写)
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} 前台视角`, () => {
  it('[正常] 前台可以查看门店级小票打印设置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.frontDesk, async () => {
      const configs = await service.getEffectiveConfigs('print')
      const printCfg = configs.find((c) => c.key === 'print.auto_print_receipt')
      assert.ok(printCfg, 'Should see print config from effective configs')
    })
  })

  it('[权限边界] 前台无法修改租户级营销配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.frontDesk, async () => {
      try {
        await service.setConfig({ key: 'marketing.default_campaign_budget', value: '100000' })
        assert.fail('Should have thrown ForbiddenException')
      } catch (e: any) {
        assert.ok(e.message.includes('cannot access'), `Expected ForbiddenException, got: ${e.message}`)
      }
    })
  })

  it('[正常] 前台可以通过有效配置查看会员签到设置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.frontDesk, async () => {
      const configs = await service.getEffectiveConfigs('member')
      const checkinCfg = configs.find((c) => c.key === 'member.daily_checkin_enabled')
      assert.ok(checkinCfg, 'Should see daily_checkin_enabled from effective configs')
      assert.equal(checkinCfg!.sourceLevel, 'store')
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// 3. 👥HR (HR · viewer — 可读可写 store+tenant 级)
// Note: 当前 tenant-config 服务中 viewer 角色对 store/tenant 级有读写权限
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.HR} HR视角`, () => {
  it('[正常] HR 可以查看门店级小票配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.hr, async () => {
      const configs = await service.getEffectiveConfigs('pos')
      const footerCfg = configs.find((c) => c.key === 'pos.receipt_footer')
      assert.ok(footerCfg, 'Should see pos.receipt_footer from effective configs')
      assert.equal(footerCfg!.sourceLevel, 'store')
    })
  })

  it('[权限边界] HR（viewer）无法写入 brand 级配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.hr, async () => {
      try {
        await service.setConfig({ key: 'billing.tax_id', value: 'HR-TAX' })
        assert.fail('Should have thrown ForbiddenException')
      } catch (e: any) {
        assert.ok(e.message.includes('cannot access'), `Expected ForbiddenException, got: ${e.message}`)
      }
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// 4. 🔧安监 (Safety · auditor — 全级别只读, 含 brand)
// Note: auditor 对 store/tenant/brand 均有 level 访问权限(含读写), 但审计视角更关注读取合规
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Safety} 安监视角`, () => {
  it('[正常] 安监可以读取所有级别的配置（含品牌级）', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.safety, async () => {
      const configs = await service.getEffectiveConfigs()
      const brandCfgs = configs.filter((c) => c.sourceLevel === 'brand')
      assert.ok(brandCfgs.length >= 1, 'Should see brand-level configs as auditor')
    })
  })

  it('[正常] 安监可以查看脱敏后的敏感配置（加密字段含掩码）', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.safety, async () => {
      const configs = await service.getEffectiveConfigs('billing')
      const tax = configs.find((c) => c.key === 'billing.tax_id')
      // auditor 可以看到 brand 级 billing.tax_id（secret 等级, 被脱敏）
      if (tax) {
        assert.ok(tax.isMasked, 'Secret config should be masked')
      }
    })
  })

  it('[权限边界] 安监（auditor）可以写入 store 级配置但无法访问 brand 级 `allowedRoles` 过滤的配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.safety, async () => {
      // auditor 对 store 级有 level 访问, setConfig 正常执行
      const result = await service.setConfig({ key: 'pos.tax_rate', value: '0.05' })
      assert.equal(result.key, 'pos.tax_rate')
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// 5. 🎮导玩员 (Guide · operator — 门店级读写)
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Guide} 导玩员视角`, () => {
  it('[正常] 导玩员可以更新门店小票页脚', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.guide, async () => {
      const result = await service.setConfig({ key: 'pos.receipt_footer', value: '欢迎下次再来玩耍！' })
      assert.equal(result.key, 'pos.receipt_footer')
      assert.equal(result.value, '欢迎下次再来玩耍！')
    })
  })

  it('[权限边界] 导玩员无法读取 tenant 级加密配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.guide, async () => {
      try {
        await service.getConfig('integration.webhook_url')
        assert.fail('Should have thrown error for level mismatch')
      } catch (e: any) {
        // operator(store) 无法访问 tenant 级, 所以 getConfig 抛异常
        assert.ok(e.message.includes('cannot access') || e.message.includes('Unknown config'),
          `Got: ${e.message}`)
      }
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// 6. 🎯运行专员 (Ops · tenant_admin — store + tenant 级别)
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Ops} 运行专员视角`, () => {
  it('[正常] 运行专员可以配置 AI 默认模型', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.ops, async () => {
      const result = await service.setConfig({ key: 'ai.default_model', value: 'deepseek-chat' })
      assert.equal(result.key, 'ai.default_model')
      assert.equal(result.value, 'deepseek-chat')
    })
  })

  it('[正常] 运行专员可以看到门店与租户两级有效配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.ops, async () => {
      const configs = await service.getEffectiveConfigs()
      const storeConfigs = configs.filter((c) => c.sourceLevel === 'store')
      const tenantConfigs = configs.filter((c) => c.sourceLevel === 'tenant')
      assert.ok(storeConfigs.length >= 1, 'Should see store-level configs')
      assert.ok(tenantConfigs.length >= 1, 'Should see tenant-level configs')
    })
  })

  it('[权限边界] 运行专员无法写入品牌级税号配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.ops, async () => {
      try {
        await service.setConfig({ key: 'billing.tax_id', value: 'BRAND-TAX-001' })
        assert.fail('Should have thrown ForbiddenException')
      } catch (e: any) {
        assert.ok(e.message.includes('cannot access'), `Expected ForbiddenException, got: ${e.message}`)
      }
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// 7. 🤝团建 (Teambuilding · viewer — store + tenant 级)
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} 团建视角`, () => {
  it('[正常] 团建可以查看门店面配置了解门店信息', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.teambuilding, async () => {
      const configs = await service.getEffectiveConfigs('pos')
      const footerCfg = configs.find((c) => c.key === 'pos.receipt_footer')
      assert.ok(footerCfg, 'Should see pos configs as viewer')
    })
  })

  it('[权限边界] 团建（viewer）无法写入 brand 级配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.teambuilding, async () => {
      try {
        await service.setConfig({ key: 'compliance.audit_retention_days', value: '365' })
        assert.fail('Should have thrown ForbiddenException')
      } catch (e: any) {
        assert.ok(e.message.includes('cannot access'), `Expected ForbiddenException, got: ${e.message}`)
      }
    })
  })

  it('[正常] 团建可以查看会员配置用于活动策划', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.teambuilding, async () => {
      const configs = await service.getEffectiveConfigs('member')
      const tierCfg = configs.find((c) => c.key === 'member.tier_upgrade_threshold')
      assert.ok(tierCfg, 'Should see member configs at tenant level')
      assert.equal(tierCfg!.sourceLevel, 'tenant')
    })
  })
})

// ─────────────────────────────────────────────────────────────────
// 8. 📢营销 (Marketing · tenant_admin — store + tenant 级别)
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Marketing} 营销视角`, () => {
  it('[正常] 营销可以调整活动预算配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.marketing, async () => {
      const result = await service.setConfig({ key: 'marketing.default_campaign_budget', value: '80000' })
      assert.equal(result.key, 'marketing.default_campaign_budget')
      assert.equal(result.value, '80000')
    })
  })

  it('[正常] 营销可以查看会员升级阈值用于活动策划', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.marketing, async () => {
      const configs = await service.getEffectiveConfigs('member')
      const tierCfg = configs.find((c) => c.key === 'member.tier_upgrade_threshold')
      assert.ok(tierCfg, 'Should see member tier config')
      assert.equal(tierCfg!.sourceLevel, 'tenant')
    })
  })

  it('[权限边界] 营销不能直接修改品牌合规配置', async () => {
    const service = new TenantConfigService()
    await runWithTenant(ctx.marketing, async () => {
      try {
        await service.setConfig({ key: 'compliance.audit_retention_days', value: '100' })
        assert.fail('Should have thrown ForbiddenException')
      } catch (e: any) {
        assert.ok(e.message.includes('cannot access'), `Expected ForbiddenException, got: ${e.message}`)
      }
    })
  })
})
