import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { APIKeyService } from './api-key.service'
import { KeyGenerator } from '../key-generator'
import { APIKeyAdapter } from '../datasources/api-key.adapter'

describe('APIKeyService - API Key 业务层', () => {
  let service: APIKeyService
  let adapter: APIKeyAdapter

  beforeEach(() => {
    adapter = new APIKeyAdapter()
    service = new APIKeyService(new KeyGenerator(), adapter)
  })

  it('create 创建 API Key 并保存', () => {
    const result = service.create({
      tenantId: 't-001', environment: 'LIVE', name: 'My Key',
      scopes: [{ resource: 'orders', actions: ['read'] }],
      createdBy: 'admin'
    })
    assert.ok(result.apiKey)
    assert.ok(result.plaintextSecret.startsWith('sk_live_'))
    assert.equal(result.apiKey.status, 'ACTIVE')
    const found = adapter.queryByKeyId(result.apiKey.keyId)
    assert.ok(found)
  })

  it('create 空名字抛错', () => {
    assert.throws(() => {
      service.create({
        tenantId: 't-001', environment: 'LIVE', name: '',
        scopes: [{ resource: 'orders', actions: ['read'] }],
        createdBy: 'admin'
      })
    }, /name_required/)
  })

  it('create 空 scopes 抛错', () => {
    assert.throws(() => {
      service.create({
        tenantId: 't-001', environment: 'LIVE', name: 'My Key',
        scopes: [], createdBy: 'admin'
      })
    }, /scopes_required/)
  })

  it('list 按租户列出', () => {
    service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    service.create({ tenantId: 't-001', environment: 'TEST', name: 'K2', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    service.create({ tenantId: 't-002', environment: 'LIVE', name: 'K3', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    assert.equal(service.list('t-001').length, 2)
    assert.equal(service.list('t-002').length, 1)
  })

  it('list 按环境过滤', () => {
    service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    service.create({ tenantId: 't-001', environment: 'TEST', name: 'K2', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    assert.equal(service.list('t-001', 'LIVE').length, 1)
    assert.equal(service.list('t-001', 'TEST').length, 1)
    assert.equal(service.list('t-001', 'SANDBOX').length, 0)
  })

  it('get 查询单个 key', () => {
    const { apiKey } = service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    const found = service.get('t-001', apiKey.keyId)
    assert.ok(found)
    assert.equal(found!.name, 'K1')
  })

  it('get 跨租户隔离', () => {
    const { apiKey } = service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    assert.equal(service.get('t-002', apiKey.keyId), null)
  })

  it('revoke 撤销 key', () => {
    const { apiKey } = service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    const revoked = service.revoke('t-001', apiKey.keyId, 'compromised')
    assert.equal(revoked!.status, 'REVOKED')
    const found = service.get('t-001', apiKey.keyId)
    assert.equal(found!.status, 'REVOKED')
  })

  it('revoke 已撤销 key 抛错', () => {
    const { apiKey } = service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    service.revoke('t-001', apiKey.keyId, 'reason')
    assert.throws(() => service.revoke('t-001', apiKey.keyId, 'again'), /cannot_revoke_revoked/)
  })

  it('revoke 不存在的 key 返回 null', () => {
    assert.equal(service.revoke('t-001', 'nonexistent', 'reason'), null)
  })

  it('validate 检查 active + scope', () => {
    const { apiKey } = service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: 'orders', actions: ['read'] }], createdBy: 'admin' })
    const v1 = service.validate('t-001', apiKey.keyId, 'orders', 'read')
    assert.equal(v1.valid, true)
    const v2 = service.validate('t-001', apiKey.keyId, 'orders', 'write')
    assert.equal(v2.valid, false)
    assert.equal(v2.reason, 'scope_mismatch')
  })

  it('validate REVOKED key 返回 revoked', () => {
    const { apiKey } = service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    service.revoke('t-001', apiKey.keyId, 'test')
    const v = service.validate('t-001', apiKey.keyId, 'orders', 'read')
    assert.equal(v.valid, false)
    assert.equal(v.reason, 'revoked')
  })

  it('validate 不存在的 key 返回 not_found', () => {
    const v = service.validate('t-001', 'nonexistent', 'orders', 'read')
    assert.equal(v.valid, false)
    assert.equal(v.reason, 'not_found')
  })

  it('stats 统计', () => {
    service.create({ tenantId: 't-001', environment: 'LIVE', name: 'K1', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    service.create({ tenantId: 't-001', environment: 'TEST', name: 'K2', scopes: [{ resource: '*', actions: ['*'] }], createdBy: 'admin' })
    const s = service.stats('t-001')
    assert.equal(s.total, 2)
    assert.equal(s.byStatus.ACTIVE, 2)
    assert.equal(s.byEnvironment.LIVE, 1)
    assert.equal(s.byEnvironment.TEST, 1)
  })

  it('detectEnvironment 根据 keyId 前缀判断', () => {
    assert.equal(service.detectEnvironment('sk_live_abc'), 'LIVE')
    assert.equal(service.detectEnvironment('sk_test_abc'), 'TEST')
    assert.equal(service.detectEnvironment('sk_sandbox_abc'), 'SANDBOX')
    assert.equal(service.detectEnvironment('invalid'), null)
  })
})
