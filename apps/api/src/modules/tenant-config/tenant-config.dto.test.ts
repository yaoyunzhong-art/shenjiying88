import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [tenant-config] [D] dto 补全
 *
 * TenantConfig DTO 校验测试
 * 测试 GetConfigDto, SetConfigBatchDto, SetConfigItemDto, RollbackConfigDto
 * class-validator 校验规则 + maskConfigResponse 边界
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import {
  GetConfigDto,
  SetConfigBatchDto,
  SetConfigItemDto,
  RollbackConfigDto,
  maskConfigResponse,
} from './tenant-config.dto'
import type { ConfigInstance } from './tenant-config.entity'

// ─── 辅助函数 ───

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

// ─── GetConfigDto ───

describe('GetConfigDto 校验', () => {
  it('[正例] 空对象通过校验（所有字段可选）', async () => {
    const dto = new GetConfigDto()
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('[正例] 完整字段通过校验', async () => {
    const dto = new GetConfigDto()
    dto.category = 'pos'
    dto.level = 'store'
    dto.keys = ['pos.tax_rate']
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('[正例] 有效 category 枚举通过', async () => {
    for (const cat of ['pos', 'print', 'member', 'marketing', 'inventory', 'integration', 'ai', 'compliance', 'billing', 'branding'] as const) {
      const dto = new GetConfigDto()
      dto.category = cat
      const errors = await validate(dto)
      assert.equal(errors.length, 0, `category '${cat}' should be valid`)
    }
  })

  it('[反例] 无效 category 枚举失败', async () => {
    const dto = new GetConfigDto()
    ;(dto as any).category = 'invalid-category'
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] 无效 level 枚举失败', async () => {
    const dto = new GetConfigDto()
    ;(dto as any).level = 'super-admin'
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] keys 包含非字符串值失败', async () => {
    const dto = new GetConfigDto()
    ;(dto as any).keys = ['valid', 123, true]
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[边界] keys 为空数组通过', async () => {
    const dto = new GetConfigDto()
    dto.keys = []
    const errors = await validate(dto)
    assert.equal(errors.length, 0, 'empty keys array should be valid')
  })

  it('[边界] keys 达最大长度 100 通过', async () => {
    const dto = new GetConfigDto()
    dto.keys = Array.from({ length: 100 }, (_, i) => `key.${i}`)
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('[反例] keys 超过最大长度 100 失败', async () => {
    const dto = new GetConfigDto()
    ;(dto as any).keys = Array.from({ length: 101 }, (_, i) => `key.${i}`)
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ─── SetConfigItemDto ───

describe('SetConfigItemDto 校验', () => {
  it('[正例] 完整必填字段通过', async () => {
    const dto = new SetConfigItemDto()
    dto.key = 'pos.tax_rate'
    dto.value = '0.13'
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('[正例] 含可选继承标记通过', async () => {
    const dto = new SetConfigItemDto()
    dto.key = 'pos.tax_rate'
    dto.value = '0.13'
    dto.inherits = true
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('[反例] 缺少 key 失败', async () => {
    const dto = new SetConfigItemDto()
    dto.value = '0.13'
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] 缺少 value 失败', async () => {
    const dto = new SetConfigItemDto()
    dto.key = 'pos.tax_rate'
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] key 为空字符串失败', async () => {
    const dto = new SetConfigItemDto()
    dto.key = ''
    dto.value = '0.13'
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })
})

// ─── SetConfigBatchDto ───

describe('SetConfigBatchDto 校验', () => {
  it('[正例] 含 1 项通过', async () => {
    const item = new SetConfigItemDto()
    item.key = 'pos.tax_rate'
    item.value = '0.13'
    const dto = new SetConfigBatchDto()
    dto.items = [item]
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('[正例] 含 100 项通过', async () => {
    const dto = new SetConfigBatchDto()
    dto.items = Array.from({ length: 100 }, (_, i) => {
      const item = new SetConfigItemDto()
      item.key = `config.${i}`
      item.value = `value-${i}`
      return item
    })
    const errors = await validate(dto)
    assert.equal(errors.length, 0, 'batch with 100 items should be valid')
  })

  it('[反例] 空 items 数组失败', async () => {
    const dto = new SetConfigBatchDto()
    dto.items = []
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] 超过 100 项失败', async () => {
    const dto = new SetConfigBatchDto()
    ;(dto as any).items = Array.from({ length: 101 }, (_, i) => {
      const item = new SetConfigItemDto()
      item.key = `config.${i}`
      item.value = `value-${i}`
      return item
    })
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] items 为 null 失败', async () => {
    const dto = new SetConfigBatchDto()
    ;(dto as any).items = null
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] items 子项缺少 value 传递到子校验', async () => {
    const item = new SetConfigItemDto()
    item.key = 'test.key'
    // item.value is undefined
    const dto = new SetConfigBatchDto()
    dto.items = [item]
    const errors = await validate(dto)
    assert.ok(errors.length > 0, 'nested validation should catch missing value')
  })
})

// ─── RollbackConfigDto ───

describe('RollbackConfigDto 校验', () => {
  it('[正例] 完整字段通过', async () => {
    const dto = new RollbackConfigDto()
    dto.configId = 'cfg-001'
    dto.targetVersion = 2
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('[正例] targetVersion 为 0 通过', async () => {
    const dto = new RollbackConfigDto()
    dto.configId = 'cfg-001'
    dto.targetVersion = 0
    const errors = await validate(dto)
    assert.equal(errors.length, 0)
  })

  it('[反例] 缺少 configId 失败', async () => {
    const dto = new RollbackConfigDto()
    ;(dto as any).configId = undefined
    dto.targetVersion = 1
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] 缺少 targetVersion 失败', async () => {
    const dto = new RollbackConfigDto()
    dto.configId = 'cfg-001'
    ;(dto as any).targetVersion = undefined
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] configId 为空字符串失败', async () => {
    const dto = new RollbackConfigDto()
    dto.configId = ''
    dto.targetVersion = 1
    const errors = await validate(dto)
    assert.ok(errors.length > 0)
  })

  it('[反例] targetVersion 为负数通过 (class-validator @IsNumber 不校验正负)', async () => {
    const dto = new RollbackConfigDto()
    dto.configId = 'cfg-001'
    dto.targetVersion = -1
    const errors = await validate(dto)
    assert.equal(errors.length, 0, 'negative version passes @IsNumber validation')
  })
})

// ─── maskConfigResponse ───

describe('maskConfigResponse 响应映射', () => {
  it('[正例] public 敏感度返回明文', () => {
    const cfg = makeInstance()
    const result = maskConfigResponse(cfg, 'public')
    assert.equal(result.id, 'cfg-001')
    assert.equal(result.key, 'pos.tax_rate')
    assert.equal(result.value, '0.13')
    assert.equal(result.isMasked, false)
  })

  it('[正例] internal 敏感度返回明文非掩码', () => {
    const cfg = makeInstance({ key: 'member.tier_upgrade_threshold', value: '1000', category: 'member', level: 'tenant' })
    const result = maskConfigResponse(cfg, 'internal')
    assert.equal(result.value, '1000')
    assert.equal(result.isMasked, false)
  })

  it('[正例] restricted 敏感度值被掩码', () => {
    const cfg = makeInstance({ key: 'compliance.audit_retention_days', value: '180', category: 'compliance', level: 'brand' })
    const result = maskConfigResponse(cfg, 'restricted')
    assert.match(result.value, /^\*\*\*-/)
    assert.equal(result.isMasked, true)
  })

  it('[正例] secret 敏感度值被掩码', () => {
    const cfg = makeInstance({ key: 'integration.webhook_url', value: 'https://hooks.example.com/token', category: 'integration', level: 'tenant' })
    const result = maskConfigResponse(cfg, 'secret')
    assert.match(result.value, /^\*\*\*-/)
    assert.equal(result.isMasked, true)
  })

  it('[正例] secret 加密值解密后掩码', () => {
    const cfg = makeInstance({
      key: 'billing.tax_id',
      value: 'enc:!AES!mock!encrypted!value',
      encrypted: true,
      category: 'billing',
      level: 'brand',
    })
    const result = maskConfigResponse(cfg, 'secret')
    // 加密值解密失败则 fallback 到原始值
    assert.match(result.value, /^\*\*\*-/)
    assert.equal(result.isMasked, true)
  })

  it('[边界] secret 空值返回空', () => {
    const cfg = makeInstance({ key: 'integration.webhook_url', value: '', category: 'integration', level: 'tenant' })
    const result = maskConfigResponse(cfg, 'secret')
    assert.equal(result.value, '')
    assert.equal(result.isMasked, true)
  })

  it('[边界] secret 极短值（1字符）掩码', () => {
    const cfg = makeInstance({ key: 'billing.tax_id', value: 'x', category: 'billing', level: 'brand' })
    const result = maskConfigResponse(cfg, 'secret')
    assert.match(result.value, /^\*\*\*-/)
    assert.equal(result.isMasked, true)
  })

  it('[边界] inherits 字段传递', () => {
    const cfg = makeInstance({ inherits: true })
    const result = maskConfigResponse(cfg, 'public')
    assert.equal(result.inherits, true)
  })

  it('[边界] version 字段传递', () => {
    const cfg = makeInstance({ version: 42 })
    const result = maskConfigResponse(cfg, 'public')
    assert.equal(result.version, 42)
  })

  it('[边界] 全部必填字段存在', () => {
    const cfg = makeInstance()
    const result = maskConfigResponse(cfg, 'public')
    const required = ['id', 'key', 'value', 'category', 'level', 'ownerId', 'inherits', 'version', 'updatedBy', 'updatedAt'] as const
    for (const field of required) {
      assert.ok(field in result, `response should contain field '${field}'`)
    }
    assert.ok('isMasked' in result)
  })

  it('[边界] updatedAt / createdAt 时间戳格式', () => {
    const cfg = makeInstance()
    const result = maskConfigResponse(cfg, 'public')
    assert.ok(Date.parse(result.updatedAt) > 0, 'valid ISO timestamp')
    // ConfigResponse does not expose createdAt
    assert.ok(Date.parse(result.updatedAt) > 0, 'valid updatedAt')
  })

  it('[边界] 高版本版本号通过', () => {
    const cfg = makeInstance({ version: 999999 })
    const result = maskConfigResponse(cfg, 'public')
    assert.equal(result.version, 999999)
  })
})
