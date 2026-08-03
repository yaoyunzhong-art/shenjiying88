import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { KeyGenerator } from './key-generator'
import { APIKeyAdapter } from './datasources/api-key.adapter'
import type { APIKey, APIKeyEnvironment, APIKeyScope } from './openapi.entity'

describe('KeyGenerator - API Key 生成引擎', () => {
  let gen: KeyGenerator

  beforeEach(() => {
    gen = new KeyGenerator()
  })

  it('generate 返回 apiKey + plaintextSecret', () => {
    const result = gen.generate({
      tenantId: 't-001',
      environment: 'LIVE',
      name: '测试 Key',
      scopes: [{ resource: 'orders', actions: ['read'] }],
      createdBy: 'admin'
    })

    assert.ok(result.apiKey)
    assert.ok(result.plaintextSecret)
    assert.match(result.plaintextSecret, /^sk_live_/)
    assert.equal(result.apiKey.keyHash.length > 0, true)
    assert.equal(result.apiKey.status, 'ACTIVE')
    assert.equal(result.apiKey.tenantId, 't-001')
  })

  it('generate 不同环境使用不同前缀 (LIVE/TEST/SANDBOX)', () => {
    const envs: APIKeyEnvironment[] = ['LIVE', 'TEST', 'SANDBOX']
    const prefixes: Record<string, string> = {
      LIVE: 'sk_live_',
      TEST: 'sk_test_',
      SANDBOX: 'sk_sandbox_'
    }
    for (const env of envs) {
      const result = gen.generate({
        tenantId: 't-001',
        environment: env,
        name: `key-${env}`,
        scopes: [{ resource: '*', actions: ['*'] }],
        createdBy: 'admin'
      })
      assert.ok(result.plaintextSecret.startsWith(prefixes[env]), `expected ${prefixes[env]} prefix for ${env}`)
    }
  })

  it('hashSecret 是确定性的 (相同输入 → 相同 hash)', () => {
    const h1 = gen.hashSecret('sk_live_abc123_xyz')
    const h2 = gen.hashSecret('sk_live_abc123_xyz')
    assert.equal(h1, h2)
  })

  it('hashSecret 不同输入 → 不同 hash', () => {
    const h1 = gen.hashSecret('sk_live_abc123_xyz')
    const h2 = gen.hashSecret('sk_live_def456_uvw')
    assert.notEqual(h1, h2)
  })

  it('parseKey 正确解析完整 plaintext', () => {
    const parsed = gen.parseKey('sk_live_abcdef123456_xyzsecret')
    assert.ok(parsed)
    assert.equal(parsed.keyId, 'sk_live_abcdef123456')
    assert.equal(parsed.secret, 'xyzsecret')
  })

  it('parseKey 对格式错误返回 null', () => {
    assert.equal(gen.parseKey(''), null)
    assert.equal(gen.parseKey('invalid'), null)
    assert.equal(gen.parseKey('sk_wrong_abc'), null)
  })

  it('hasScope 精确匹配 resource+action', () => {
    const key: APIKey = {
      id: 'k1', tenantId: 't-001', keyId: 'sk_live_abc', keyHash: 'hash',
      environment: 'LIVE', name: 'test', scopes: [{ resource: 'orders', actions: ['read'] }],
      status: 'ACTIVE', createdAt: new Date().toISOString(), createdBy: 'admin'
    }
    assert.ok(gen.hasScope(key, 'orders', 'read'))
    assert.ok(!gen.hasScope(key, 'orders', 'write'))
    assert.ok(!gen.hasScope(key, 'members', 'read'))
  })

  it('hasScope 通配符 * 匹配一切', () => {
    const key: APIKey = {
      id: 'k1', tenantId: 't-001', keyId: 'sk_live_abc', keyHash: 'hash',
      environment: 'LIVE', name: 'test', scopes: [{ resource: '*', actions: ['*'] }],
      status: 'ACTIVE', createdAt: new Date().toISOString(), createdBy: 'admin'
    }
    assert.ok(gen.hasScope(key, 'orders', 'read'))
    assert.ok(gen.hasScope(key, 'members', 'write'))
    assert.ok(gen.hasScope(key, 'products', 'delete'))
  })

  it('isExpired 无 expiresAt → 永不过期', () => {
    const key: APIKey = {
      id: 'k1', tenantId: 't-001', keyId: 'sk_live_abc', keyHash: 'hash',
      environment: 'LIVE', name: 'test', scopes: [{ resource: '*', actions: ['*'] }],
      status: 'ACTIVE', createdAt: new Date().toISOString(), createdBy: 'admin'
    }
    assert.ok(!gen.isExpired(key))
  })

  it('isExpired 过期时间早于当前 → 过期', () => {
    const key: APIKey = {
      id: 'k1', tenantId: 't-001', keyId: 'sk_live_abc', keyHash: 'hash',
      environment: 'LIVE', name: 'test', scopes: [{ resource: '*', actions: ['*'] }],
      status: 'ACTIVE', createdAt: new Date().toISOString(), createdBy: 'admin',
      expiresAt: '2020-01-01T00:00:00.000Z'
    }
    assert.ok(gen.isExpired(key, Date.parse('2025-01-01')))
  })

  it('isExpired 未过期返回 false', () => {
    const key: APIKey = {
      id: 'k1', tenantId: 't-001', keyId: 'sk_live_abc', keyHash: 'hash',
      environment: 'LIVE', name: 'test', scopes: [{ resource: '*', actions: ['*'] }],
      status: 'ACTIVE', createdAt: new Date().toISOString(), createdBy: 'admin',
      expiresAt: '2099-01-01T00:00:00.000Z'
    }
    assert.ok(!gen.isExpired(key, Date.parse('2025-01-01')))
  })

  it('isValidKeyId 校验格式', () => {
    assert.ok(gen.isValidKeyId('sk_live_abcdef123456'))
    assert.ok(gen.isValidKeyId('sk_test_abcdef123456'))
    assert.ok(gen.isValidKeyId('sk_sandbox_abcdef123456'))
    assert.ok(!gen.isValidKeyId('sk_wrong_abc'))
    assert.ok(!gen.isValidKeyId(''))
    assert.ok(!gen.isValidKeyId('abc'))
  })
})

describe('APIKeyAdapter - 持久化', () => {
  let adapter: APIKeyAdapter

  beforeEach(() => {
    adapter = new APIKeyAdapter()
  })

  it('save + queryByKeyId 保存和查询', () => {
    const key: APIKey = {
      id: 'k1', tenantId: 't-001', keyId: 'sk_live_abc', keyHash: 'hash',
      environment: 'LIVE', name: 'test', scopes: [],
      status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin'
    }
    adapter.save(key)
    const found = adapter.queryByKeyId('sk_live_abc')
    assert.ok(found)
    assert.equal(found!.tenantId, 't-001')
  })

  it('queryByTenant 按租户 + 环境过滤', () => {
    adapter.save({ id: 'k1', tenantId: 't-001', keyId: 'sk_live_a', keyHash: 'h', environment: 'LIVE', name: 'a', scopes: [], status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin' })
    adapter.save({ id: 'k2', tenantId: 't-001', keyId: 'sk_test_b', keyHash: 'h', environment: 'TEST', name: 'b', scopes: [], status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin' })
    adapter.save({ id: 'k3', tenantId: 't-002', keyId: 'sk_live_c', keyHash: 'h', environment: 'LIVE', name: 'c', scopes: [], status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin' })

    const t1Live = adapter.queryByTenant('t-001', 'LIVE')
    assert.equal(t1Live.length, 1)
    assert.equal(t1Live[0].keyId, 'sk_live_a')

    const t1All = adapter.queryByTenant('t-001')
    assert.equal(t1All.length, 2)
  })

  it('revoke 标记撤销 + 保存撤销原因', () => {
    const key: APIKey = { id: 'k1', tenantId: 't-001', keyId: 'sk_live_a', keyHash: 'h', environment: 'LIVE', name: 'a', scopes: [], status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin' }
    adapter.save(key)
    const revoked = adapter.revoke('t-001', 'sk_live_a', 'security_breach')
    assert.ok(revoked)
    assert.equal(revoked!.status, 'REVOKED')
    assert.equal(revoked!.revokedReason, 'security_breach')
  })

  it('revoke 不同租户的 key 返回 null', () => {
    adapter.save({ id: 'k1', tenantId: 't-001', keyId: 'sk_live_a', keyHash: 'h', environment: 'LIVE', name: 'a', scopes: [], status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin' })
    const r = adapter.revoke('t-002', 'sk_live_a', 'test')
    assert.equal(r, null)
  })

  it('countByStatus 分状态统计', () => {
    adapter.seed([
      { id: 'k1', tenantId: 't-001', keyId: 'sk_live_a', keyHash: 'h', environment: 'LIVE', name: 'a', scopes: [], status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin' },
      { id: 'k2', tenantId: 't-001', keyId: 'sk_live_b', keyHash: 'h', environment: 'LIVE', name: 'b', scopes: [], status: 'REVOKED', createdAt: '2025-01-01', createdBy: 'admin' },
      { id: 'k3', tenantId: 't-001', keyId: 'sk_live_c', keyHash: 'h', environment: 'LIVE', name: 'c', scopes: [], status: 'ACTIVE', createdAt: '2025-01-02', createdBy: 'admin' }
    ])
    const s = adapter.countByStatus('t-001')
    assert.equal(s.ACTIVE, 2)
    assert.equal(s.REVOKED, 1)
  })

  it('reset 清空所有数据', () => {
    adapter.save({ id: 'k1', tenantId: 't-001', keyId: 'sk_live_a', keyHash: 'h', environment: 'LIVE', name: 'a', scopes: [], status: 'ACTIVE', createdAt: '2025-01-01', createdBy: 'admin' })
    adapter.reset()
    assert.equal(adapter.count('t-001'), 0)
  })
})
