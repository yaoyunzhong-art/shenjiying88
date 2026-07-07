import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-config] [D] contract 补全
 *
 * TenantConfig 合约映射测试
 * 验证 maskConfigResponse 和响应结构的字段完整性
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { maskConfigResponse } from './tenant-config.dto'
import type { ConfigInstance } from './tenant-config.entity'

describe('tenant-config.contract - maskConfigResponse 合约映射', () => {
  // ── 基础实体 ──

  function makeInstance(overrides: Partial<ConfigInstance> = {}): ConfigInstance {
    return {
      id: 'cfg-001',
      key: 'pos.tax_rate',
      value: '0.13',
      encrypted: false,
      category: 'pos',
      level: 'store',
      ownerId: 'store-001',
      inherits: false,
      version: 1,
      updatedBy: 'admin',
      updatedAt: '2026-06-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      ...overrides,
    }
  }

  // ─── 正例: 公开敏感度 ───

  it('[正例] public 敏感度返回明文', () => {
    const cfg = makeInstance()
    const result = maskConfigResponse(cfg, 'public')
    assert.equal(result.id, 'cfg-001')
    assert.equal(result.key, 'pos.tax_rate')
    assert.equal(result.value, '0.13')
    assert.equal(result.category, 'pos')
    assert.equal(result.level, 'store')
    assert.equal(result.ownerId, 'store-001')
    assert.equal(result.inherits, false)
    assert.equal(result.version, 1)
    assert.equal(result.updatedBy, 'admin')
    assert.equal(result.updatedAt, '2026-06-01T00:00:00Z')
    assert.equal(result.isMasked, false)
  })

  it('[正例] internal 敏感度返回明文，非掩码', () => {
    const cfg = makeInstance({
      key: 'marketing.default_campaign_budget',
      value: '50000',
      category: 'marketing',
      level: 'tenant',
    })
    const result = maskConfigResponse(cfg, 'internal')
    assert.equal(result.value, '50000')
    assert.equal(result.isMasked, false)
  })

  // ─── 脱敏: secret / restricted ───

  it('[正例] secret 敏感度值被掩码', () => {
    const cfg = makeInstance({
      key: 'integration.webhook_url',
      value: 'https://hooks.example.com/secret-token-xyz123',
      category: 'integration',
      level: 'tenant',
    })
    const result = maskConfigResponse(cfg, 'secret')
    assert.match(result.value, /^\*\*\*-/)
    assert.equal(result.isMasked, true)
  })

  it('[正例] restricted 敏感度值也被掩码', () => {
    const cfg = makeInstance({
      key: 'compliance.audit_retention_days',
      value: '180',
      category: 'compliance',
      level: 'brand',
    })
    const result = maskConfigResponse(cfg, 'restricted')
    assert.match(result.value, /^\*\*\*-/)
    assert.equal(result.isMasked, true)
  })

  it('[边界] secret 字段空值时返回空字符串', () => {
    const cfg = makeInstance({
      key: 'integration.webhook_url',
      value: '',
      category: 'integration',
      level: 'tenant',
    })
    const result = maskConfigResponse(cfg, 'secret')
    assert.equal(result.value, '')
    assert.equal(result.isMasked, true)
  })

  it('[边界] secret 字段极短值掩码', () => {
    const cfg = makeInstance({
      key: 'billing.tax_id',
      value: 'ab',
      category: 'billing',
      level: 'brand',
    })
    const result = maskConfigResponse(cfg, 'secret')
    assert.match(result.value, /^\*\*\*-/)
    assert.equal(result.isMasked, true)
  })

  // ─── 继承状态 ───

  it('[边界] inherits=true 保留', () => {
    const cfg = makeInstance({ inherits: true })
    const result = maskConfigResponse(cfg, 'public')
    assert.equal(result.inherits, true)
  })

  // ─── 版本号 ───

  it('[边界] version 字段传递', () => {
    const cfg = makeInstance({ version: 5 })
    const result = maskConfigResponse(cfg, 'public')
    assert.equal(result.version, 5)
  })

  // ─── 所有字段都存在 ───

  it('[边界] 合约包含所有必要字段', () => {
    const cfg = makeInstance()
    const result = maskConfigResponse(cfg, 'public')
    const requiredFields = ['id', 'key', 'value', 'category', 'level', 'ownerId', 'inherits', 'version', 'updatedBy', 'updatedAt']
    for (const field of requiredFields) {
      assert.ok(field in result, `Response should contain field: ${field}`)
    }
  })
})
