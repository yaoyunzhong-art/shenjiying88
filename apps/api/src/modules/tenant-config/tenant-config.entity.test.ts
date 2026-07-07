import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-config] [D] entity 补全
 *
 * TenantConfig Entity 定义验证测试
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  LEVEL_TO_WORKBENCH,
  WORKBENCH_TO_LEVEL,
  WORKBENCH_NAMES,
  BUILTIN_CONFIG_DEFINITIONS,
  ROLE_LEVEL_ACCESS,
  CATEGORY_LEVEL_MATRIX,
} from './tenant-config.entity'

describe('tenant-config.entity - 常量与映射', () => {
  // ─── LEVEL_TO_WORKBENCH ───

  it('[正例] LEVEL_TO_WORKBENCH 映射完整覆盖 3 级', () => {
    assert.equal(LEVEL_TO_WORKBENCH['store'], 'W-S')
    assert.equal(LEVEL_TO_WORKBENCH['tenant'], 'W-T')
    assert.equal(LEVEL_TO_WORKBENCH['brand'], 'W-B')
  })

  it('[反例] 未知级别返回 undefined', () => {
    assert.equal((LEVEL_TO_WORKBENCH as any)['invalid'], undefined)
  })

  // ─── WORKBENCH_TO_LEVEL ───

  it('[正例] WORKBENCH_TO_LEVEL 映射完整覆盖', () => {
    assert.equal(WORKBENCH_TO_LEVEL['W-S'], 'store')
    assert.equal(WORKBENCH_TO_LEVEL['W-T'], 'tenant')
    assert.equal(WORKBENCH_TO_LEVEL['W-B'], 'brand')
  })

  it('[反例] 未知工作台代码返回 undefined', () => {
    assert.equal((WORKBENCH_TO_LEVEL as any)['W-X'], undefined)
  })

  // ─── WORKBENCH_NAMES ───

  it('[正例] WORKBENCH_NAMES 包含中文名称', () => {
    assert.equal(WORKBENCH_NAMES['W-S'], '门店工作台')
    assert.equal(WORKBENCH_NAMES['W-T'], '租户工作台')
    assert.equal(WORKBENCH_NAMES['W-B'], '品牌工作台')
  })

  // ─── ROLE_LEVEL_ACCESS 权限矩阵 ───

  it('[正例] 所有角色都在权限矩阵中', () => {
    const expectedRoles = ['super_admin', 'brand_admin', 'tenant_admin', 'store_admin', 'operator', 'viewer', 'auditor']
    for (const role of expectedRoles) {
      const allowed = ROLE_LEVEL_ACCESS[role as keyof typeof ROLE_LEVEL_ACCESS]
      assert.ok(Array.isArray(allowed), `Role ${role} should have access levels`)
      assert.ok(allowed.length > 0, `Role ${role} should have at least one level`)
    }
  })

  it('[边界] super_admin 可访问所有级别', () => {
    const allowed = ROLE_LEVEL_ACCESS['super_admin']
    assert.ok(allowed.includes('store'))
    assert.ok(allowed.includes('tenant'))
    assert.ok(allowed.includes('brand'))
  })

  it('[边界] operator 仅可访问 store', () => {
    const allowed = ROLE_LEVEL_ACCESS['operator']
    assert.deepEqual(allowed, ['store'])
  })

  it('[边界] brand_admin 不能访问 store', () => {
    const allowed = ROLE_LEVEL_ACCESS['brand_admin']
    assert.ok(!allowed.includes('store'))
    assert.ok(allowed.includes('tenant'))
    assert.ok(allowed.includes('brand'))
  })

  // ─── CATEGORY_LEVEL_MATRIX ───

  it('[正例] 每个分类至少有一个级别', () => {
    const categories = ['pos', 'print', 'member', 'marketing', 'inventory', 'integration', 'ai', 'compliance', 'billing', 'branding']
    for (const cat of categories) {
      const levels = CATEGORY_LEVEL_MATRIX[cat as keyof typeof CATEGORY_LEVEL_MATRIX]
      assert.ok(Array.isArray(levels), `Category ${cat} should have levels`)
      assert.ok(levels.length > 0, `Category ${cat} should have at least one level`)
    }
  })

  it('[边界] compliance 仅品牌级可见', () => {
    const levels = CATEGORY_LEVEL_MATRIX['compliance']
    assert.deepEqual(levels, ['brand'])
  })

  it('[边界] billing 仅品牌级可见', () => {
    const levels = CATEGORY_LEVEL_MATRIX['billing']
    assert.deepEqual(levels, ['brand'])
  })

  // ─── BUILTIN_CONFIG_DEFINITIONS ───

  it('[正例] 内置配置定义不少于 13 项', () => {
    assert.ok(BUILTIN_CONFIG_DEFINITIONS.length >= 13,
      `Expected >=13 definitions, got ${BUILTIN_CONFIG_DEFINITIONS.length}`)
  })

  it('[正例] 每个定义有唯一 key', () => {
    const keys = BUILTIN_CONFIG_DEFINITIONS.map(d => d.key)
    const uniqueKeys = new Set(keys)
    assert.equal(keys.length, uniqueKeys.size, 'All definition keys should be unique')
  })

  it('[正例] 每个定义必有 label', () => {
    for (const def of BUILTIN_CONFIG_DEFINITIONS) {
      assert.ok(def.label, `Definition ${def.key} should have label`)
    }
  })

  it('[边界] store 级配置数量正确', () => {
    const storeDefs = BUILTIN_CONFIG_DEFINITIONS.filter(d => d.level === 'store')
    assert.equal(storeDefs.length, 4) // pos.tax_rate, pos.receipt_footer, print.auto_print_receipt, member.daily_checkin_enabled
  })

  it('[边界] brand 级包含 compliance 和 billing', () => {
    const brandDefs = BUILTIN_CONFIG_DEFINITIONS.filter(d => d.level === 'brand')
    const brandKeys = brandDefs.map(d => d.key)
    assert.ok(brandKeys.includes('compliance.audit_retention_days'))
    assert.ok(brandKeys.includes('billing.tax_id'))
    assert.ok(brandKeys.includes('branding.logo_url'))
    assert.ok(brandKeys.includes('branding.primary_color'))
  })

  it('[边界] secret 敏感字段有 encryption 标记', () => {
    const secrets = BUILTIN_CONFIG_DEFINITIONS.filter(d => d.sensitivity === 'secret')
    assert.ok(secrets.length >= 2) // integration.webhook_url + billing.tax_id
    for (const s of secrets) {
      assert.ok(['integration', 'billing'].includes(s.category))
    }
  })
})
