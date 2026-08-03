/**
 * 🐜 SystemConfigController 扩展测试 — 圈梁五道箍指令
 * 覆盖: 正常CRUD / 边界条件 / 异常场景 / 业务规则 / 值校验 / 审计日志
 * 共 18+ 条独立测试用例
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  SystemConfigController,
  type SystemSettingCategory,
  type SystemSettingValueType,
} from './saas-settings.controller'
import { runWithTenant } from '../../common/context/tenant-context'

const ADMIN_CTX = {
  tenantId: 'platform',
  userId: 'admin-1',
  role: 'super_admin' as const,
  storeId: undefined as string | undefined,
}

const AUDITOR_CTX = {
  tenantId: 'platform',
  userId: 'audit-1',
  role: 'auditor' as const,
  storeId: undefined as string | undefined,
}

const TENANT_ADMIN_CTX = {
  tenantId: 'tenant-A',
  userId: 'tadmin-1',
  role: 'tenant_admin' as const,
  storeId: undefined as string | undefined,
}

const BRAND_ADMIN_CTX = {
  tenantId: 'brand-shenjiying',
  userId: 'brand-1',
  role: 'brand_admin' as const,
  storeId: undefined as string | undefined,
}

describe('SystemConfigController — 扩展测试 (18+ 条)', () => {
  let controller: SystemConfigController

  beforeEach(() => {
    controller = new SystemConfigController()
  })

  // ───────────────────────────────────────────────
  // listSettings 扩展
  // ───────────────────────────────────────────────

  describe('listSettings() 扩展', () => {
    it('[正例] 列表返回所有内置配置 (≥12 个)', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.listSettings()
        assert.ok(result.total >= 12)
        // 验证特定配置存在
        const keys = result.items.map((s) => s.key)
        expect(keys).toContain('feature_flag.auto_approve_new_tenant')
        expect(keys).toContain('rate_limit.api_global')
        expect(keys).toContain('maintenance.mode')
        expect(keys).toContain('whitelist.allowed_ips')
        expect(keys).toContain('sso.default_provider')
        expect(keys).toContain('notification.email_global_enabled')
        expect(keys).toContain('platform.default_locale')
      })
    })

    it('[边界] 使用不存在的 category 过滤返回全部（controller 不做未知分类过滤）', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.listSettings('unknown_cat' as SystemSettingCategory)
        // Controller 的过滤只对 ALLOWED_ADMIN_CATEGORIES 生效
        assert.ok(result.total >= 12)
        assert.ok(Array.isArray(result.items))
      })
    })

    it('[正例] 按 sso 分类过滤只返回 SSO 配置', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.listSettings('sso')
        assert.equal(result.total, 1)
        assert.equal(result.items[0].key, 'sso.default_provider')
      })
    })

    it('[正例] brand_admin 可查看 whitelist 分类', async () => {
      await runWithTenant(BRAND_ADMIN_CTX, async () => {
        const result = controller.listSettings('whitelist')
        assert.ok(result.total >= 2)
      })
    })
  })

  // ───────────────────────────────────────────────
  // getSetting 扩展
  // ───────────────────────────────────────────────

  describe('getSetting() 扩展', () => {
    it('[正例] 获取 number 类型配置返回数值字符串', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const setting = controller.getSetting('rate_limit.api_per_tenant')
        assert.equal(setting.valueType, 'number')
        assert.equal(Number(setting.value), 100)
      })
    })

    it('[正例] 获取 json_array 类型配置返回可解析 JSON', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const setting = controller.getSetting('whitelist.allowed_domains')
        assert.equal(setting.valueType, 'json_array')
        const parsed = JSON.parse(setting.value)
        assert.ok(Array.isArray(parsed))
        assert.ok(parsed.includes('shenjiying.com'))
      })
    })

    it('[异常] 获取不存在的 key 抛 NotFoundException', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.getSetting('not.exist.at.all'),
          (err: Error) => {
            assert.ok(err.message.includes('not found'))
            return true
          },
        )
      })
    })
  })

  // ───────────────────────────────────────────────
  // createSetting 扩展
  // ───────────────────────────────────────────────

  describe('createSetting() 扩展', () => {
    it('[正例] 创建 string 类型配置', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.createSetting({
          key: 'platform.custom_banner',
          category: 'platform',
          value: 'Welcome!',
          valueType: 'string',
          description: '自定义横幅',
        })
        assert.equal(result.key, 'platform.custom_banner')
        assert.equal(result.value, 'Welcome!')
        assert.equal(result.version, 1)
      })
    })

    it('[正例] 创建 json_array 类型配置', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.createSetting({
          key: 'whitelist.custom_endpoints',
          category: 'whitelist',
          value: '["/api/v1","/api/v2"]',
          valueType: 'json_array',
          description: '自定义端点白名单',
        })
        assert.equal(result.valueType, 'json_array')
        const parsed = JSON.parse(result.value)
        assert.ok(Array.isArray(parsed))
      })
    })

    it('[异常] 创建已存在配置抛 BadRequest', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.createSetting({
            key: 'maintenance.mode',
            category: 'maintenance',
            value: 'true',
            valueType: 'boolean',
            description: '重复创建',
          }),
          (err: Error) => {
            assert.ok(err.message.includes('already exists'))
            return true
          },
        )
      })
    })

    it('[异常] 使用非法 valueType 抛 BadRequest', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.createSetting({
            key: 'test.invalid_type',
            category: 'platform',
            value: 'test',
            valueType: 'date' as SystemSettingValueType,
            description: '无效类型',
          }),
          (err: Error) => {
            assert.ok(err.message.includes('Invalid valueType'))
            return true
          },
        )
      })
    })

    it('[异常] tenant_admin 创建配置抛 Forbidden', async () => {
      await runWithTenant(TENANT_ADMIN_CTX, async () => {
        assert.throws(
          () => controller.createSetting({
            key: 'test.key', category: 'feature_flag',
            value: 'true', valueType: 'boolean', description: '无权限',
          }),
          (err: Error) => {
            assert.match(err.message, /Only super_admin/)
            return true
          },
        )
      })
    })
  })

  // ───────────────────────────────────────────────
  // updateSetting 扩展
  // ───────────────────────────────────────────────

  describe('updateSetting() 扩展', () => {
    it('[正例] 更新 number 类型配置后版本递增', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.updateSetting('rate_limit.api_global', { value: '5000' })
        assert.equal(result.value, '5000')
        assert.equal(result.version, 2)
        assert.equal(result.updatedBy, 'admin-1')
      })
    })

    it('[正例] 更新 json_array 类型配置', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.updateSetting('whitelist.allowed_ips', {
          value: '["10.0.0.0/8","192.168.0.0/16"]',
        })
        const parsed = JSON.parse(result.value)
        assert.equal(parsed.length, 2)
        assert.equal(result.version, 2)
      })
    })

    it('[异常] 更新 boolean 为非法值抛 BadRequest', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('maintenance.mode', { value: 'yes' }),
          (err: Error) => {
            assert.ok(err.message.includes('Boolean value must be'))
            return true
          },
        )
      })
    })

    it('[异常] 更新 number 为 NaN 抛 BadRequest', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('rate_limit.api_global', { value: 'abc' }),
          (err: Error) => {
            assert.ok(err.message.includes('must be numeric'))
            return true
          },
        )
      })
    })

    it('[异常] 更新不存在的 key 抛 NotFoundException', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('nonexistent.setting', { value: 'x' }),
          (err: Error) => {
            assert.ok(err.message.includes('not found'))
            return true
          },
        )
      })
    })
  })

  // ───────────────────────────────────────────────
  // resetSetting 扩展
  // ───────────────────────────────────────────────

  describe('resetSetting() 扩展', () => {
    it('[正例] 重置后 version 递增且值恢复为 default', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        // 先更新
        controller.updateSetting('notification.email_global_enabled', { value: 'false' })
        // 重置
        const result = controller.resetSetting('notification.email_global_enabled')
        assert.equal(result.value, result.defaultValue)
        assert.equal(result.value, 'true')
        assert.equal(result.version, 3) // 初始1 + 更新2 + 重置3
      })
    })

    it('[异常] 重置不存在的配置抛 NotFoundException', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.resetSetting('nonexistent'),
          (err: Error) => {
            assert.ok(err.message.includes('not found'))
            return true
          },
        )
      })
    })
  })

  // ───────────────────────────────────────────────
  // 审计日志扩展
  // ───────────────────────────────────────────────

  describe('审计日志扩展', () => {
    it('[正例] 创建配置记录审计日志', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        controller.createSetting({
          key: 'feature_flag.test_feature',
          category: 'feature_flag',
          value: 'false',
          valueType: 'boolean',
          description: '测试功能',
        })
        const audit = controller.getAuditLog()
        const createLogs = audit.items.filter((l) => l.key === 'feature_flag.test_feature')
        assert.ok(createLogs.length >= 1)
        assert.equal(createLogs[0].operator, 'admin-1')
        assert.equal(createLogs[0].previousValue, '')
      })
    })

    it('[正例] 多次更新全部记录在审计日志中', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        controller.updateSetting('rate_limit.api_global', { value: '2000' })
        controller.updateSetting('rate_limit.api_global', { value: '3000' })
        controller.updateSetting('rate_limit.api_global', { value: '1000' })

        const audit = controller.getAuditLog()
        const related = audit.items.filter((l) => l.key === 'rate_limit.api_global')
        assert.ok(related.length >= 3)
      })
    })

    it('[正例] auditor 可查看审计日志', async () => {
      await runWithTenant(AUDITOR_CTX, async () => {
        const audit = controller.getAuditLog()
        assert.ok(Array.isArray(audit.items))
      })
    })

    it('[正例] 审计日志 limit 参数控制返回条数', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        // 只 limit 为 1
        const audit = controller.getAuditLog('1')
        assert.ok(audit.items.length <= 1)
      })
    })
  })

  // ───────────────────────────────────────────────
  // 值校验边界
  // ───────────────────────────────────────────────

  describe('值校验边界', () => {
    it("[边界] boolean 值 'true' 和 'false' 都合法", async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const r1 = controller.updateSetting('maintenance.mode', { value: 'true' })
        assert.equal(r1.value, 'true')
        const r2 = controller.updateSetting('maintenance.mode', { value: 'false' })
        assert.equal(r2.value, 'false')
      })
    })

    it('[边界] number 为 0 合法', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.updateSetting('rate_limit.api_per_tenant', { value: '0' })
        assert.equal(result.value, '0')
      })
    })

    it('[边界] 更新 json 为空数组', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.updateSetting('whitelist.allowed_ips', { value: '[]' })
        assert.equal(result.value, '[]')
      })
    })

    it('[异常] json_array 传入字符串非数组抛 BadRequest', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('whitelist.allowed_ips', { value: '"just-a-string"' }),
          (err: Error) => {
            assert.ok(err.message.includes('JSON') || err.message.includes('array'))
            return true
          },
        )
      })
    })

    it('[异常] json_array 传入对象抛 BadRequest', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('whitelist.allowed_ips', { value: '{"key":"val"}' }),
          (err: Error) => {
            assert.ok(err.message.includes('array'))
            return true
          },
        )
      })
    })
  })

  // ───────────────────────────────────────────────
  // getCategories 扩展
  // ───────────────────────────────────────────────

  describe('getCategories() 扩展', () => {
    it('[正例] 返回所有 7 个分类', () => {
      const result = controller.getCategories()
      assert.equal(result.categories.length, 7)
      assert.ok(result.categories.includes('feature_flag'))
      assert.ok(result.categories.includes('platform'))
      // 不再重复校验全部，已覆盖
    })
  })

  // ───────────────────────────────────────────────
  // 角色权限验证扩展
  // ───────────────────────────────────────────────

  describe('角色权限验证扩展', () => {
    it('[异常] tenant_admin 无法更新配置', async () => {
      await runWithTenant(TENANT_ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('maintenance.mode', { value: 'true' }),
          (err: Error) => {
            assert.match(err.message, /Only super_admin/)
            return true
          },
        )
      })
    })

    it('[异常] tenant_admin 无法重置配置', async () => {
      await runWithTenant(TENANT_ADMIN_CTX, async () => {
        assert.throws(
          () => controller.resetSetting('maintenance.mode'),
          (err: Error) => {
            assert.match(err.message, /Only super_admin/)
            return true
          },
        )
      })
    })

    it('[异常] auditor 无法更新配置', async () => {
      await runWithTenant(AUDITOR_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('maintenance.mode', { value: 'true' }),
          (err: Error) => {
            assert.match(err.message, /Only super_admin/)
            return true
          },
        )
      })
    })
  })
})
