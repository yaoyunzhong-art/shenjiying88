import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 V23 SaaS 配置设置 - Controller 测试
 *
 * 覆盖 CRUD 操作、权限校验、值校验、审计日志
 * ≥10 个测试用例
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  SystemConfigController,
  type SystemSetting,
  type SystemSettingCategory,
  type SystemSettingValueType,
} from './saas-settings.controller'
import { runWithTenant } from '../../common/context/tenant-context'

/** super_admin 上下文 */
const ADMIN_CTX = {
  tenantId: 'platform',
  userId: 'admin-1',
  role: 'super_admin' as const,
  storeId: undefined as string | undefined,
}

/** brand_admin 上下文 */
const BRAND_ADMIN_CTX = {
  tenantId: 'brand-shenjiying',
  userId: 'brand-1',
  role: 'brand_admin' as const,
  storeId: undefined as string | undefined,
}

/** auditor 上下文 */
const AUDITOR_CTX = {
  tenantId: 'platform',
  userId: 'audit-1',
  role: 'auditor' as const,
  storeId: undefined as string | undefined,
}

/** tenant_admin 上下文 (无权限) */
const TENANT_ADMIN_CTX = {
  tenantId: 'tenant-A',
  userId: 'admin-1',
  role: 'tenant_admin' as const,
  storeId: undefined as string | undefined,
}

/** operator 上下文 (无权限) */
const OPERATOR_CTX = {
  tenantId: 'tenant-A',
  storeId: 'store-001',
  userId: 'op-1',
  role: 'operator' as const,
}

describe('SystemConfigController 系统配置测试', () => {
  let controller: SystemConfigController

  beforeEach(() => {
    controller = new SystemConfigController()
  })

  // ─── 1. GET /system-config (listSettings) ───

  describe('listSettings()', () => {
    it('[正例] super_admin 可列出全部系统配置', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.listSettings()
        assert.ok(Array.isArray(result.items), 'items should be an array')
        assert.ok(result.total > 0, 'should have at least 1 item')
        assert.ok(result.total >= 12, `expected ≥12 built-in settings, got ${result.total}`)
        assert.ok(Array.isArray(result.categories), 'categories should be an array')
        // Verify specific setting exists
        const ff = result.items.find((s) => s.key === 'feature_flag.auto_approve_new_tenant')
        assert.ok(ff, 'auto_approve_new_tenant should be present')
        assert.equal(ff.category, 'feature_flag')
        assert.equal(ff.valueType, 'boolean')
      })
    })

    it('[正例] 按分类过滤返回正确结果', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.listSettings('feature_flag')
        assert.equal(result.categories.length, 7)
        for (const item of result.items) {
          assert.equal(item.category, 'feature_flag')
        }
      })
    })

    it('[正例] brand_admin 也可查看系统配置', async () => {
      await runWithTenant(BRAND_ADMIN_CTX, async () => {
        const result = controller.listSettings('rate_limit')
        assert.ok(result.total >= 2, 'should have at least 2 rate_limit settings')
      })
    })

    it('[正例] auditor 也可查看系统配置', async () => {
      await runWithTenant(AUDITOR_CTX, async () => {
        const result = controller.listSettings()
        assert.ok(result.total > 0)
      })
    })

    it('[反例] tenant_admin 查看系统配置抛出 ForbiddenException', async () => {
      await runWithTenant(TENANT_ADMIN_CTX, async () => {
        assert.throws(
          () => controller.listSettings(),
          (err: Error) => {
            assert.match(err.message, /Insufficient role/)
            return true
          },
        )
      })
    })

    it('[反例] operator 查看系统配置抛出 ForbiddenException', async () => {
      await runWithTenant(OPERATOR_CTX, async () => {
        assert.throws(
          () => controller.listSettings(),
          (err: Error) => {
            assert.match(err.message, /Insufficient role/)
            return true
          },
        )
      })
    })
  })

  // ─── 2. GET /system-config/:key (getSetting) ───

  describe('getSetting()', () => {
    it('[正例] 获取存在的单个配置项', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.getSetting('maintenance.mode')
        assert.equal(result.key, 'maintenance.mode')
        assert.equal(result.value, 'false')
        assert.equal(result.valueType, 'boolean')
      })
    })

    it('[反例] 获取不存在的配置项抛出 NotFoundException', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.getSetting('nonexistent.setting'),
          (err: Error) => {
            assert.ok(err.message.includes('not found'))
            return true
          },
        )
      })
    })
  })

  // ─── 3. PUT /system-config/:key (updateSetting) ───

  describe('updateSetting()', () => {
    it('[正例] super_admin 更新配置值成功', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.updateSetting('feature_flag.auto_approve_new_tenant', {
          value: 'true',
        })
        assert.equal(result.key, 'feature_flag.auto_approve_new_tenant')
        assert.equal(result.value, 'true')
        assert.equal(result.version, 2, 'version should increment')
        assert.equal(result.updatedBy, 'admin-1')
      })
    })

    it('[正例] 更新 number 类型配置到有效值', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.updateSetting('rate_limit.api_global', { value: '2000' })
        assert.equal(result.value, '2000')
        assert.equal(result.version, 2)
      })
    })

    it('[反例] super_admin 更新 boolean 为非法值抛出 BadRequest', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('feature_flag.auto_approve_new_tenant', { value: 'invalid' }),
          (err: Error) => {
            assert.ok(err.message.includes('Boolean value must be'))
            return true
          },
        )
      })
    })

    it('[反例] 更新不存在的配置抛出 NotFoundException', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('nonexistent.key', { value: 'test' }),
          (err: Error) => {
            assert.ok(err.message.includes('not found'))
            return true
          },
        )
      })
    })

    it('[反例] brand_admin 更新配置抛出 ForbiddenException', async () => {
      await runWithTenant(BRAND_ADMIN_CTX, async () => {
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

  // ─── 4. POST /system-config (createSetting) ───

  describe('createSetting()', () => {
    it('[正例] super_admin 创建新配置成功', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.createSetting({
          key: 'feature_flag.new_feature_x',
          category: 'feature_flag',
          value: 'true',
          valueType: 'boolean',
          description: '新功能 X 开关',
        })
        assert.equal(result.key, 'feature_flag.new_feature_x')
        assert.equal(result.value, 'true')
        assert.equal(result.version, 1)
        assert.equal(result.defaultValue, 'true')

        // 验证可通过 GET 查看到
        const getResult = controller.getSetting('feature_flag.new_feature_x')
        assert.equal(getResult.value, 'true')
      })
    })

    it('[反例] 创建已存在的配置抛出 BadRequestException', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () =>
            controller.createSetting({
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

    it('[反例] 使用非法分类抛出 BadRequestException', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () =>
            controller.createSetting({
              key: 'custom.test',
              category: 'custom' as SystemSettingCategory,
              value: 'test',
              valueType: 'string',
              description: '非法分类',
            }),
          (err: Error) => {
            assert.ok(err.message.includes('Invalid category'))
            return true
          },
        )
      })
    })

    it('[反例] tenant_admin 创建配置抛出 ForbiddenException', async () => {
      await runWithTenant(TENANT_ADMIN_CTX, async () => {
        assert.throws(
          () =>
            controller.createSetting({
              key: 'test.key',
              category: 'feature_flag',
              value: 'true',
              valueType: 'boolean',
              description: 'test',
            }),
          (err: Error) => {
            assert.match(err.message, /Only super_admin/)
            return true
          },
        )
      })
    })
  })

  // ─── 5. DELETE /system-config/:key (resetSetting) ───

  describe('resetSetting()', () => {
    it('[正例] super_admin 重置配置到默认值', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        // 先更新值
        controller.updateSetting('feature_flag.auto_approve_new_tenant', { value: 'true' })
        // 再重置
        const result = controller.resetSetting('feature_flag.auto_approve_new_tenant')
        assert.equal(result.value, result.defaultValue, 'should reset to default')
        assert.equal(result.value, 'false', 'default value of auto_approve should be false')
      })
    })

    it('[反例] brand_admin 重置配置抛出 ForbiddenException', async () => {
      await runWithTenant(BRAND_ADMIN_CTX, async () => {
        assert.throws(
          () => controller.resetSetting('maintenance.mode'),
          (err: Error) => {
            assert.match(err.message, /Only super_admin/)
            return true
          },
        )
      })
    })
  })

  // ─── 6. GET /system-config/meta/categories ───

  describe('getCategories()', () => {
    it('[正例] 返回所有分类', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.getCategories()
        assert.ok(Array.isArray(result.categories))
        assert.equal(result.categories.length, 7)
        assert.ok(result.categories.includes('feature_flag'))
        assert.ok(result.categories.includes('maintenance'))
        assert.ok(result.categories.includes('rate_limit'))
        assert.ok(result.categories.includes('sso'))
        assert.ok(result.categories.includes('whitelist'))
        assert.ok(result.categories.includes('notification'))
        assert.ok(result.categories.includes('platform'))
      })
    })
  })

  // ─── 7. GET /system-config/meta/audit-log ───

  describe('getAuditLog()', () => {
    it('[正例] 变更操作后审计日志应有记录', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        // 执行一次更新
        controller.updateSetting('maintenance.mode', { value: 'true' })

        const logResult = controller.getAuditLog()
        assert.ok(Array.isArray(logResult.items))
        assert.ok(logResult.total >= 1)

        const lastLog = logResult.items[0]
        assert.equal(lastLog.key, 'maintenance.mode')
        assert.equal(lastLog.operator, 'admin-1')
        assert.equal(lastLog.previousValue, 'false')
        assert.equal(lastLog.newValue, 'true')
      })
    })

    it('[正例] 多次审计日志按时间倒序排列', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        controller.updateSetting('rate_limit.api_global', { value: '500' })
        controller.updateSetting('rate_limit.api_per_tenant', { value: '50' })

        const logResult = controller.getAuditLog('10')
        assert.ok(logResult.total >= 2)
        assert.ok(logResult.items.length <= 10)
        // 最早的操作在数组末尾
        assert.ok(new Date(logResult.items[0].timestamp) >= new Date(logResult.items[logResult.items.length - 1].timestamp))
      })
    })

    it('[正例] auditor 也可查看审计日志', async () => {
      await runWithTenant(AUDITOR_CTX, async () => {
        const logResult = controller.getAuditLog()
        assert.ok(Array.isArray(logResult.items))
      })
    })
  })

  // ─── 8. 边界与错误 ───

  describe('值校验边界', () => {
    it('[反例] JSON array 类型传入非数组值抛出 BadRequestException', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => controller.updateSetting('whitelist.allowed_ips', { value: '{"foo":"bar"}' }),
          (err: any) => {
            const msg = err.message || err.response?.message || JSON.stringify(err)
            assert.ok(msg.includes('array') || msg.includes('JSON'), `Expected error about JSON array, got: ${msg}`)
            return true
          },
        )
      })
    })

    it('[反例] JSON 类型传入非法 JSON 抛出 BadRequest', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        assert.throws(
          () => {
            // 假设有一个 json 类型的配置
            controller.createSetting({
              key: 'test.json_config',
              category: 'platform',
              value: '{invalid}',
              valueType: 'json',
              description: 'test',
            })
          },
          (err: Error) => {
            assert.ok(err.message.includes('Invalid json'))
            return true
          },
        )
      })
    })

    it('[正例] JSON array 有效值通过校验', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.updateSetting('whitelist.allowed_ips', {
          value: '["192.168.1.1","10.0.0.1"]',
        })
        assert.equal(result.value, '["192.168.1.1","10.0.0.1"]')
      })
    })

    it('[正例] number 类型默认值', async () => {
      await runWithTenant(ADMIN_CTX, async () => {
        const result = controller.getSetting('platform.session_timeout_minutes')
        assert.equal(result.value, '1440')
        assert.equal(result.valueType, 'number')
      })
    })
  })
})
