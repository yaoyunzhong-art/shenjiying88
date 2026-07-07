import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { KeyGenerator } from './key-generator'
import { APIKeyAdapter } from './datasources/api-key.adapter'

describe('KeyGenerator', () => {
  let gen: KeyGenerator
  let adapter: APIKeyAdapter

  beforeEach(() => {
    gen = new KeyGenerator()
    adapter = new APIKeyAdapter()
  })

  describe('生成 API Key', () => {
    it('LIVE 环境生成 sk_live_ 前缀', () => {
      const r = gen.generate({
        tenantId: 't1', environment: 'LIVE',
        name: 'prod-key', scopes: [{ resource: '*', actions: ['*'] }],
        createdBy: 'admin'
      })
      assert.match(r.apiKey.keyId, /^sk_live_[a-z0-9]{16}$/)
      assert.equal(r.apiKey.environment, 'LIVE')
    })

    it('TEST 环境生成 sk_test_ 前缀', () => {
      const r = gen.generate({
        tenantId: 't1', environment: 'TEST',
        name: 'test-key', scopes: [{ resource: '*', actions: ['*'] }],
        createdBy: 'admin'
      })
      assert.match(r.apiKey.keyId, /^sk_test_[a-z0-9]{16}$/)
    })

    it('SANDBOX 环境生成 sk_sandbox_ 前缀', () => {
      const r = gen.generate({
        tenantId: 't1', environment: 'SANDBOX',
        name: 'sandbox-key', scopes: [{ resource: '*', actions: ['*'] }],
        createdBy: 'admin'
      })
      assert.match(r.apiKey.keyId, /^sk_sandbox_[a-z0-9]{16}$/)
    })

    it('plaintextSecret 仅生成时返回', () => {
      const r = gen.generate({
        tenantId: 't1', environment: 'LIVE',
        name: 'k', scopes: [{ resource: '*', actions: ['*'] }],
        createdBy: 'a'
      })
      assert.ok(r.plaintextSecret.length > 0)
      // 私钥不存明文, 仅存 hash
      assert.equal(r.apiKey.keyHash, gen.hashSecret(r.plaintextSecret))
      assert.ok(!r.apiKey.keyHash.includes(r.plaintextSecret.slice(0, 20)))
    })

    it('不同生成调用产生不同 secret', () => {
      const r1 = gen.generate({
        tenantId: 't1', environment: 'LIVE',
        name: 'k1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a'
      })
      const r2 = gen.generate({
        tenantId: 't1', environment: 'LIVE',
        name: 'k2', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'a'
      })
      assert.notEqual(r1.plaintextSecret, r2.plaintextSecret)
    })
  })

  describe('hashSecret', () => {
    it('相同 secret 产生相同 hash', () => {
      const h1 = gen.hashSecret('sk_live_abc_secret_123')
      const h2 = gen.hashSecret('sk_live_abc_secret_123')
      assert.equal(h1, h2)
    })

    it('不同 secret 产生不同 hash', () => {
      const h1 = gen.hashSecret('secret_a')
      const h2 = gen.hashSecret('secret_b')
      assert.notEqual(h1, h2)
    })

    it('hash 以 sha256_ 前缀', () => {
      const h = gen.hashSecret('test')
      assert.match(h, /^sha256_/)
    })
  })

  describe('parseKey', () => {
    it('解析 LIVE key', () => {
      const r = gen.parseKey('sk_live_abc123_def456')
      assert.ok(r)
      assert.equal(r!.keyId, 'sk_live_abc123')
      assert.equal(r!.secret, 'def456')
    })

    it('解析 SANDBOX key', () => {
      const r = gen.parseKey('sk_sandbox_xyz789_aaa')
      assert.ok(r)
      assert.equal(r!.keyId, 'sk_sandbox_xyz789')
    })

    it('非法格式返回 null', () => {
      assert.equal(gen.parseKey('invalid'), null)
      assert.equal(gen.parseKey('sk_xxx_yyy_zzz'), null)
    })
  })

  describe('scope 检查', () => {
    it('* 资源匹配任何', () => {
      const k = makeKey('*', ['read'])
      assert.equal(gen.hasScope(k, 'orders', 'read'), true)
      assert.equal(gen.hasScope(k, 'members', 'read'), true)
    })

    it('具体资源匹配', () => {
      const k = makeKey('orders', ['read', 'write'])
      assert.equal(gen.hasScope(k, 'orders', 'read'), true)
      assert.equal(gen.hasScope(k, 'orders', 'write'), true)
      assert.equal(gen.hasScope(k, 'orders', 'delete'), false)
      assert.equal(gen.hasScope(k, 'members', 'read'), false)
    })

    it('* action 匹配任何', () => {
      const k = makeKey('orders', ['*'])
      assert.equal(gen.hasScope(k, 'orders', 'read'), true)
      assert.equal(gen.hasScope(k, 'orders', 'admin'), true)
    })
  })

  describe('isExpired', () => {
    it('未设过期 = 永不过期', () => {
      const k = makeKey('*', ['*'])
      assert.equal(gen.isExpired(k, Date.now()), false)
    })

    it('已过期 = true', () => {
      const k = { ...makeKey('*', ['*']), expiresAt: '2020-01-01T00:00:00.000Z' }
      assert.equal(gen.isExpired(k, Date.now()), true)
    })

    it('未过期 = false', () => {
      const k = { ...makeKey('*', ['*']), expiresAt: new Date(Date.now() + 86400000).toISOString() }
      assert.equal(gen.isExpired(k, Date.now()), false)
    })
  })

  describe('isValidKeyId', () => {
    it('合法 keyId', () => {
      assert.equal(gen.isValidKeyId('sk_live_abc123def456'), true)
      assert.equal(gen.isValidKeyId('sk_test_xyz789'), true)
      assert.equal(gen.isValidKeyId('sk_sandbox_qq'), true)
    })

    it('非法 keyId', () => {
      assert.equal(gen.isValidKeyId('pk_live_xxx'), false)  // 不是 sk_
      assert.equal(gen.isValidKeyId('sk_unknown_xxx'), false)  // 非法 env
      assert.equal(gen.isValidKeyId('invalid'), false)
    })
  })

  function makeKey(resource: string, actions: string[]) {
    return {
      id: 'k1', tenantId: 't1', keyId: 'sk_live_test', keyHash: 'h',
      environment: 'LIVE' as const, name: 'k',
      scopes: [{ resource, actions }],
      status: 'ACTIVE' as const,
      createdAt: new Date().toISOString(),
      createdBy: 'admin'
    }
  }
})