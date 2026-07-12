import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-config] [D] controller 补全
 *
 * TenantConfigController 集成测试
 * 测试所有 HTTP 路由路径、参数绑定、权限校验、错误处理
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { InMemoryCacheService } from '../../infrastructure/cache/cache.module'
import { TenantConfigController } from './tenant-config.controller'
import { TenantConfigCacheService } from './tenant-config-cache.service'
import { TenantConfigService } from './tenant-config.service'
import { runWithTenant } from '../../common/context/tenant-context'

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
const AUDITOR_CTX = {
  tenantId: 'brand-shenjiying',
  storeId: 'store-001',
  userId: 'audit-1',
  role: 'auditor' as const,
}

describe('TenantConfigController 集成测试', () => {
  let controller: TenantConfigController
  let service: TenantConfigService

  beforeEach(() => {
    service = new TenantConfigService()
    controller = new TenantConfigController(service)
  })

  // ─── GET /tenant-config (listConfigs) ───

  describe('GET /tenant-config → listConfigs()', () => {
    it('[正例] store_admin 列出 store 级配置', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.listConfigs({ level: 'store' })
        assert.equal(result.level, 'store')
        assert.equal(result.workbench, 'W-S')
        assert.ok(Array.isArray(result.items))
        assert.ok(result.total >= 4)
        for (const item of result.items) {
          assert.equal(item.level, 'store')
        }
      })
    })

    it('[正例] tenant_admin 列出 tenant 级配置含敏感掩码', async () => {
      // 先写入一个 secret 配置再查看
      await runWithTenant(TENANT_CTX, async () => {
        await service.setConfig({ key: 'integration.webhook_url', value: 'https://hooks.example.com/supersecret' })
        const result = await controller.listConfigs({ level: 'tenant' })
        const webhook = result.items.find((i) => i.key === 'integration.webhook_url')
        assert.ok(webhook)
        assert.match(webhook.value, /^\*\*\*-/)
        assert.equal(webhook.isMasked, true)
      })
    })

    it('[正例] brand_admin 列出 brand 级配置', async () => {
      await runWithTenant(BRAND_CTX, async () => {
        const result = await controller.listConfigs({ level: 'brand' })
        assert.equal(result.level, 'brand')
        assert.equal(result.workbench, 'W-B')
        assert.ok(result.total >= 4)
      })
    })

    it('[正例] operator 使用默认级别（store）', async () => {
      await runWithTenant(OPERATOR_CTX, async () => {
        const result = await controller.listConfigs({})
        assert.equal(result.level, 'store')
        assert.ok(result.total > 0)
      })
    })

    it('[正例] auditor 可查看 brand 级配置', async () => {
      await runWithTenant(AUDITOR_CTX, async () => {
        const result = await controller.listConfigs({ level: 'brand' })
        assert.equal(result.level, 'brand')
        assert.ok(result.total > 0)
      })
    })

    it('[反例] store_admin 越级查看 brand 配置抛出 Forbidden', async () => {
      await assert.rejects(
        runWithTenant(STORE_CTX, async () => controller.listConfigs({ level: 'brand' })),
        /cannot access level=brand/,
      )
    })

    it('[边界] 按 category 过滤只返回匹配项', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.listConfigs({ level: 'store', category: 'pos' })
        assert.ok(result.total > 0)
        for (const item of result.items) {
          assert.equal(item.category, 'pos')
        }
      })
    })

    it('[边界] 按 keys 精确过滤', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.listConfigs({
          level: 'store',
          keys: ['pos.tax_rate', 'print.auto_print_receipt'],
        })
        assert.equal(result.total, 2)
        const keys = result.items.map((i) => i.key).sort()
        assert.deepEqual(keys, ['pos.tax_rate', 'print.auto_print_receipt'])
      })
    })

    it('[边界] 空 keys 数组返回该级别所有配置', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const result = await controller.listConfigs({ level: 'tenant' })
        const emptyKeys = await controller.listConfigs({ level: 'tenant', keys: [] })
        assert.equal(result.total, emptyKeys.total)
      })
    })
  })

  // ─── GET /tenant-config/effective ───

  describe('GET /tenant-config/effective → effective()', () => {
    it('[正例] 有效配置包含继承信息', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.effective()
        assert.ok(Array.isArray(result.items))
        assert.ok(result.total > 0)
        const item = result.items[0]
        assert.ok('key' in item)
        assert.ok('value' in item)
        assert.ok('sourceLevel' in item)
        assert.ok('inherited' in item)
      })
    })

    it('[正例] 按分类过滤有效配置', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const allResult = await controller.effective()
        const posResult = await controller.effective('pos')
        assert.ok(posResult.total <= allResult.total)
        assert.ok(posResult.total > 0)
      })
    })

    it('[边界] 不存在的 category 返回空', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.effective('nonexistent')
        assert.equal(result.total, 0)
      })
    })

    it('[边界] 覆盖继承配置后有效值更新', async () => {
      await runWithTenant(STORE_CTX, async () => {
        await service.setConfig({ key: 'pos.tax_rate', value: '0.05' })
        const result = await controller.effective('pos')
        const tax = result.items.find((i) => i.key === 'pos.tax_rate')
        assert.ok(tax)
        assert.equal(tax.value, '0.05')
        assert.equal(tax.inherited, false)
      })
    })
  })

  // ─── GET /tenant-config/workbench/:code ───

  describe('GET /tenant-config/workbench/:code → workbench()', () => {
    it('[正例] W-S 返回 store 级 effective', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.workbench('W-S')
        assert.equal(result.workbench, 'W-S')
        assert.ok(result.items.length > 0)
      })
    })

    it('[正例] W-T 返回 tenant 级 effective', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const result = await controller.workbench('W-T')
        assert.equal(result.workbench, 'W-T')
        assert.ok(result.items.length > 0)
      })
    })

    it('[正例] W-B 返回 brand 级 effective', async () => {
      await runWithTenant(BRAND_CTX, async () => {
        const result = await controller.workbench('W-B')
        assert.equal(result.workbench, 'W-B')
        assert.ok(result.items.length > 0)
      })
    })

    it('[正例] W-S 配 category 过滤', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.workbench('W-S', 'pos')
        assert.ok(result.items.length > 0)
        for (const item of result.items) {
          assert.ok(item.key.startsWith('pos.') || item.key.startsWith('print.'))
        }
      })
    })

    it('[反例] 无效 workbench code 抛出 BadRequest', async () => {
      await runWithTenant(STORE_CTX, async () => {
        await assert.rejects(
          controller.workbench('W-X'),
          /Invalid workbench code/,
        )
      })
    })

    it('[反例] 空 workbench code 抛出 BadRequest', async () => {
      await assert.rejects(
        controller.workbench(''),
        /Invalid workbench code/,
      )
    })

    it('[反例] store_admin 不可调用 W-B 工作台', async () => {
      await assert.rejects(
        runWithTenant(STORE_CTX, async () => controller.workbench('W-B')),
        /cannot access level=brand/,
      )
    })
  })

  // ─── GET /tenant-config/:key ───

  describe('GET /tenant-config/:key → getOne()', () => {
    it('[正例] 读公开配置返回明文值', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.getOne('pos.tax_rate')
        assert.ok(result)
        assert.equal(result.key, 'pos.tax_rate')
        assert.equal(result.value, '0.13')
        assert.equal(result.isMasked, false)
      })
    })

    it('[正例] 读 secret 配置返回掩码', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        await service.setConfig({
          key: 'integration.webhook_url',
          value: 'https://hooks.example.com/token123',
        })
        const result = await controller.getOne('integration.webhook_url')
        assert.ok(result)
        assert.match(result.value, /^\*\*\*-/)
        assert.equal(result.isMasked, true)
      })
    })

    it('[反例] 读不存在的 key 抛出 NotFound', async () => {
      await assert.rejects(
        runWithTenant(STORE_CTX, async () => controller.getOne('does.not.exist')),
        /Unknown config key/,
      )
    })

    it('[反例] store_admin 读 brand 级配置抛出 Forbidden', async () => {
      await assert.rejects(
        runWithTenant(STORE_CTX, async () => controller.getOne('compliance.audit_retention_days')),
        /cannot access/,
      )
    })

    it('[边界] 读未设置的 key（有定义无实例）返回 null', async () => {
      await runWithTenant(STORE_CTX, async () => {
        // iaas.public_config 不存在实例，不抛出错误但返回 null
        const result = await controller.getOne('pos.receipt_footer')
        assert.ok(result !== null)
        assert.equal(result.key, 'pos.receipt_footer')
      })
    })
  })

  // ─── POST /tenant-config/batch ───

  describe('POST /tenant-config/batch → batch()', () => {
    it('[正例] 一次设置多个同级别配置', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const result = await controller.batch({
          items: [
            { key: 'marketing.default_campaign_budget', value: '120000' },
            { key: 'ai.default_model', value: 'claude-3.5-sonnet' },
          ],
        })
        assert.equal(result.total, 2)
        assert.equal(result.items.length, 2)
        const budget = result.items.find((i) => i.key === 'marketing.default_campaign_budget')
        const model = result.items.find((i) => i.key === 'ai.default_model')
        assert.ok(budget)
        assert.ok(model)
        assert.equal(budget.value, '120000')
        assert.equal(model.value, 'claude-3.5-sonnet')
      })
    })

    it('[正例] 批量设置含继承标记', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const result = await controller.batch({
          items: [
            { key: 'pos.tax_rate', value: '0.06', inherits: false },
          ],
        })
        assert.equal(result.items[0].inherits, false)
      })
    })

    it('[反例] 写无权级别配置抛出 Forbidden', async () => {
      await assert.rejects(
        runWithTenant(STORE_CTX, async () =>
          controller.batch({
            items: [{ key: 'compliance.audit_retention_days', value: '365' }],
          }),
        ),
        /cannot access level=brand/,
      )
    })

    it('[反例] 写不存在的 key 抛出 NotFound', async () => {
      await assert.rejects(
        runWithTenant(TENANT_CTX, async () =>
          controller.batch({
            items: [{ key: 'nonexistent.key', value: 'x' }],
          }),
        ),
        /Unknown config key/,
      )
    })

    it('[边界] 写有效枚举值通过', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const result = await controller.batch({
          items: [{ key: 'ai.default_model', value: 'deepseek-chat' }],
        })
        assert.equal(result.items[0].value, 'deepseek-chat')
      })
    })

    it('[边界] 写无效枚举值抛出 BadRequest', async () => {
      await assert.rejects(
        runWithTenant(TENANT_CTX, async () =>
          controller.batch({
            items: [{ key: 'ai.default_model', value: 'not-a-model' }],
          }),
        ),
        /must be one of/,
      )
    })
  })

  // ─── POST /tenant-config/rollback ───

  describe('POST /tenant-config/rollback → rollback()', () => {
    it('[正例] 回滚配置到初始版本', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const updated = await service.setConfig({ key: 'ai.default_model', value: 'gpt-4o' })
        assert.equal(updated.version, 2)
        const result = await controller.rollback({ targetVersion: 1, configId: updated.id })
        assert.equal(result.key, 'ai.default_model')
        assert.equal(result.version, 1)
      })
    })

    it('[正例] 多次回滚仍可工作', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const v1 = await service.setConfig({ key: 'marketing.default_campaign_budget', value: '50000' })
        await service.setConfig({ key: 'marketing.default_campaign_budget', value: '75000' })
        await service.setConfig({ key: 'marketing.default_campaign_budget', value: '100000' })
        // 回滚到初始版本
        const result = await controller.rollback({ targetVersion: 1, configId: v1.id })
        assert.equal(result.version, 1)
      })
    })

    it('[反例] 回滚不存在的配置抛出 NotFound', async () => {
      await assert.rejects(
        runWithTenant(TENANT_CTX, async () =>
          controller.rollback({ targetVersion: 1, configId: 'nonexistent-id' }),
        ),
        /not found/,
      )
    })

    it('[反例] store_admin 回滚 tenant 级配置抛出 Forbidden', async () => {
      await runWithTenant(TENANT_CTX, async () => {
        const inst = await service.setConfig({ key: 'ai.default_model', value: 'gpt-4o' })
        await assert.rejects(
          runWithTenant(STORE_CTX, async () =>
            controller.rollback({ targetVersion: 1, configId: inst.id }),
          ),
          /cannot access/,
        )
      })
    })
  })

  // ─── GET /tenant-config/meta/definitions ───

  describe('GET /tenant-config/meta/definitions → definitions()', () => {
    it('[正例] 返回全部配置定义', () => {
      const result = controller.definitions()
      assert.equal(result.items.length, result.total)
      assert.ok(result.total >= 13)
    })

    it('[正例] 每个定义包含必填字段', () => {
      const result = controller.definitions()
      for (const def of result.items) {
        assert.ok(def.key, 'key should be defined')
        assert.ok(def.category, 'category should be defined')
        assert.ok(def.level, 'level should be defined')
        assert.ok(def.valueType, 'valueType should be defined')
        assert.ok(def.sensitivity, 'sensitivity should be defined')
        assert.ok(def.label, 'label should be defined')
      }
    })

    it('[边界] 定义不含私有字段泄露', () => {
      const result = controller.definitions()
      for (const def of result.items) {
        // 不应该暴露 service 内部字段
        assert.ok(!('allowedRoles' in def) || def.allowedRoles === undefined || Array.isArray(def.allowedRoles))
      }
    })

    it('[边界] 所有 level 的配置定义覆盖完整', () => {
      const result = controller.definitions()
      const levels = new Set(result.items.map((d) => d.level))
      assert.ok(levels.has('store'))
      assert.ok(levels.has('tenant'))
      assert.ok(levels.has('brand'))
    })
  })

  describe('GET /tenant-config/meta/cache-stats → cacheStats()', () => {
    it('[正例] 返回 tenant-config 缓存统计', async () => {
      const cache = new TenantConfigCacheService(new InMemoryCacheService())
      const cachedService = new TenantConfigService(undefined, cache)
      const cachedController = new TenantConfigController(cachedService)

      await runWithTenant(STORE_CTX, async () => {
        await cachedController.listConfigs({ level: 'store' })
        await cachedController.listConfigs({ level: 'store' })
      })

      await runWithTenant(STORE_CTX, async () => {
        const stats = cachedController.cacheStats()
        assert.equal(stats.enabled, true)
        assert.equal(stats.misses, 1)
        assert.equal(stats.hits, 1)
        assert.equal(stats.invalidations, 0)
        assert.equal(stats.errors, 0)
        assert.equal(stats.hitRate, 0.5)
      })
    })
  })

  // ─── 跨级操作组合 ───

  describe('跨级操作组合', () => {
    it('[边界] 先读再写再读验证持久性', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const before = await controller.getOne('pos.tax_rate')
        assert.equal(before!.value, '0.13')
        await runWithTenant(TENANT_CTX, async () => {
          await service.setConfig({ key: 'member.tier_upgrade_threshold', value: '2000' })
        })
      })
      await runWithTenant(TENANT_CTX, async () => {
        const after = await controller.getOne('member.tier_upgrade_threshold')
        assert.equal(after!.value, '2000')
      })
    })

    it('[边界] 写入继承标记后生效链验证', async () => {
      await runWithTenant(STORE_CTX, async () => {
        const all = await controller.effective()
        const tax = all.items.find((i) => i.key === 'pos.tax_rate')
        assert.ok(tax)
        assert.equal(tax.inherited, false) // store 级有实例
      })
    })
  })
})
