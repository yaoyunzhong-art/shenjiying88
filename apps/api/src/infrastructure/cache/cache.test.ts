import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { CacheService, InMemoryCacheService } from './cache.module.js'

describe('InMemoryCacheService — 基本操作', () => {
  it('set / get round-trip', async () => {
    const cache: CacheService = new InMemoryCacheService()
    await cache.set('greeting', { hello: 'world' }, 60)
    const value = await cache.get<{ hello: string }>('greeting')
    assert.deepEqual(value, { hello: 'world' })
  })

  it('get 不存在的 key 返回 null', async () => {
    const cache = new InMemoryCacheService()
    const value = await cache.get('missing')
    assert.equal(value, null)
  })

  it('del 返回 true,false', async () => {
    const cache = new InMemoryCacheService()
    await cache.set('foo', 'bar')
    assert.equal(await cache.del('foo'), true)
    assert.equal(await cache.del('foo'), false)
  })

  it('delByPrefix 删除所有匹配前缀', async () => {
    const cache = new InMemoryCacheService()
    await cache.set('user:1', 'a')
    await cache.set('user:2', 'b')
    await cache.set('order:1', 'c')
    const deleted = await cache.delByPrefix('user:')
    assert.equal(deleted, 2)
    assert.equal(await cache.get('order:1'), 'c')
  })

  it('incr 原子自增', async () => {
    const cache = new InMemoryCacheService()
    assert.equal(await cache.incr('counter'), 1)
    assert.equal(await cache.incr('counter'), 2)
    assert.equal(await cache.incr('counter'), 3)
  })

  it('expire 设置过期时间,返回 1/0', async () => {
    const cache = new InMemoryCacheService()
    await cache.set('ephemeral', 'data')
    assert.equal(await cache.expire('ephemeral', 60), true)
    assert.equal(await cache.expire('nonexistent', 60), false)
  })

  it('wrap:首次 loader,二次取 cache', async () => {
    const cache = new InMemoryCacheService()
    let loaderCalls = 0
    const loader = async () => {
      loaderCalls++
      return { value: 'fresh', ts: Date.now() }
    }

    const first = await cache.wrap<{ value: string }>('payload', 60, loader)
    const second = await cache.wrap<{ value: string }>('payload', 60, loader)

    assert.equal(first.value, 'fresh')
    assert.deepEqual(second, first)
    assert.equal(loaderCalls, 1, 'loader 应只调用一次')
  })

  it('wrap:loader 抛错时不写 cache', async () => {
    const cache = new InMemoryCacheService()
    const failing = async () => {
      throw new Error('boom')
    }

    await assert.rejects(() => cache.wrap('key', 60, failing), /boom/)
    assert.equal(await cache.get('key'), null, '失败时不应写入')
  })

  it('wrap:loader 返回 null/undefined 时不写 cache', async () => {
    const cache = new InMemoryCacheService()
    const loader = async () => null
    await cache.wrap('key', 60, loader)
    assert.equal(await cache.get('key'), null)
  })

  it('backend 标识', () => {
    const cache = new InMemoryCacheService()
    assert.equal(cache.backend, 'memory')
  })

  it('ping 永远 true', async () => {
    const cache = new InMemoryCacheService()
    assert.equal(await cache.ping(), true)
  })

  it('TTL 过期后 get 返回 null', async () => {
    const cache = new InMemoryCacheService()
    await cache.set('short', 'data', 0.05) // 50ms
    await new Promise((r) => setTimeout(r, 80))
    assert.equal(await cache.get('short'), null)
  })

  it('复杂对象 + 数组 set/get 正常', async () => {
    const cache = new InMemoryCacheService()
    const complex = {
      users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }],
      meta: { total: 2, page: 1 },
      tags: ['admin', 'verified'] as const,
    }
    await cache.set('complex', complex, 60)
    assert.deepEqual(await cache.get('complex'), complex)
  })
})

describe('InMemoryCacheService — clear / size helpers', () => {
  it('clear 清空所有', () => {
    const cache = new InMemoryCacheService()
    cache.set('a', 1)
    cache.set('b', 2)
    assert.equal(cache.size(), 2)
    cache.clear()
    assert.equal(cache.size(), 0)
  })

  it('size 反映 entries 数', () => {
    const cache = new InMemoryCacheService()
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    assert.equal(cache.size(), 3)
  })
})