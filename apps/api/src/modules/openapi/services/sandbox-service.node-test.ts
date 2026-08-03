import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { SandboxService } from './sandbox.service'
import { SandboxAdapter } from '../datasources/sandbox.adapter'

describe('SandboxService - 沙箱业务层', () => {
  let service: SandboxService
  let adapter: SandboxAdapter

  beforeEach(() => {
    adapter = new SandboxAdapter()
    service = new SandboxService(adapter)
  })

  it('create 创建沙箱环境', () => {
    const env = service.create({
      parentTenantId: 't-001',
      name: 'My Sandbox',
      ttlDays: 30,
      dataMaskingEnabled: true
    })
    assert.ok(env.id)
    assert.ok(env.tenantId.startsWith('t-sandbox-'))
    assert.equal(env.parentTenantId, 't-001')
    assert.equal(env.name, 'My Sandbox')
    assert.equal(env.status, 'ACTIVE')
    assert.equal(env.ttlDays, 30)
    assert.equal(env.dataMaskingEnabled, true)
  })

  it('create 默认参数: ttl=30, masking=true', () => {
    const env = service.create({ parentTenantId: 't-001', name: 'Default Sandbox' })
    assert.equal(env.ttlDays, 30)
    assert.equal(env.dataMaskingEnabled, true)
  })

  it('get 按沙箱 tenantId 查询', () => {
    const env = service.create({ parentTenantId: 't-001', name: 'My Sandbox' })
    const found = service.get(env.tenantId)
    assert.ok(found)
    assert.equal(found!.name, 'My Sandbox')
  })

  it('get 不存在的沙箱返回 null', () => {
    assert.equal(service.get('nonexistent'), null)
  })

  it('listByParent 列出关联沙箱', () => {
    service.create({ parentTenantId: 't-001', name: 'S1' })
    service.create({ parentTenantId: 't-001', name: 'S2' })
    service.create({ parentTenantId: 't-002', name: 'S3' })
    const list = service.listByParent('t-001')
    assert.equal(list.length, 2)
  })

  it('setStatus 切换状态', () => {
    const env = service.create({ parentTenantId: 't-001', name: 'S1' })
    const updated = service.setStatus(env.tenantId, 'EXPIRED')
    assert.ok(updated)
    assert.equal(updated!.status, 'EXPIRED')
  })

  it('setStatus 不存在的沙箱返回 null', () => {
    assert.equal(service.setStatus('nonexistent', 'PURGED'), null)
  })

  it('maskData 脱敏 PII 字段', () => {
    const masked = service.maskData({
      email: 'user@example.com',
      phone: '13800138000',
      idCard: '123456',
      password: 'secret',
      name: '张三', // 非 PII
      age: 30       // 非 PII
    })
    assert.equal(masked.email, '***MASKED***')
    assert.equal(masked.phone, '***MASKED***')
    assert.equal(masked.password, '***MASKED***')
    assert.equal(masked.name, '张三')
    assert.equal(masked.age, 30)
  })

  it('maskData null 输入返回 null', () => {
    assert.equal(service.maskData(null as any), null)
  })

  it('maskData 空对象返回空', () => {
    const result = service.maskData({})
    assert.deepEqual(result, {})
  })

  it('isSandbox 检测沙箱租户', () => {
    assert.ok(service.isSandbox('t-sandbox-abc'))
    assert.ok(!service.isSandbox('t-001'))
  })

  it('isExpired 判断是否过期', () => {
    const env = service.create({ parentTenantId: 't-001', name: 'S1', ttlDays: 1 })
    // 刚创建未过期
    assert.ok(!service.isExpired(env, Date.parse(env.createdAt)))
    // 100 天后过期
    assert.ok(service.isExpired(env, Date.parse(env.createdAt) + 100 * 86400000))
  })

  it('cleanupExpired 清理过期沙箱', () => {
    const env = service.create({ parentTenantId: 't-001', name: 'Expired', ttlDays: 1 })
    const result = service.cleanupExpired()
    // 如果沙箱已过期才会被清理
    // 刚创建的不会过期, 所以 cleaned = 0
    assert.equal(result.cleaned, 0)
    // 手动过期再清理
    adapter.updateStatus(env.tenantId, env.id, 'EXPIRED')
    const result2 = service.cleanupExpired()
    assert.equal(result2.cleaned, 1)
    assert.equal(result2.sandboxIds[0], env.tenantId)
  })
})
