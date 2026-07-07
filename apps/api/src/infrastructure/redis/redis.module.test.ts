import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { RedisService } from './redis.module.js'

/**
 * 单元测试:用 stub 模拟 Redis client,避免依赖真实 Redis 实例。
 * stub 设计为:`ping()` 返回 'PONG';`info(section)` 返回可控字符串。
 */
function createStubRedis(behavior: {
  pingResult?: 'PONG' | Error
  infoResponses?: Record<string, string>
}) {
  const stub: any = {}
  stub.ping = async () => {
    if (behavior.pingResult === 'PONG') return 'PONG'
    throw behavior.pingResult ?? new Error('connection refused')
  }
  stub.info = async (section: string) => behavior.infoResponses?.[section] ?? ''
  stub.quit = async () => 'OK'
  stub.disconnect = () => undefined
  return stub
}

describe('RedisService — ping', () => {
  it('ping 返回 true 当 reply 为 PONG', async () => {
    const service = new RedisService(createStubRedis({ pingResult: 'PONG' }) as any)
    assert.equal(await service.ping(), true)
  })

  it('ping 返回 false 当抛错', async () => {
    const service = new RedisService(
      createStubRedis({ pingResult: new Error('ECONNREFUSED') }) as any
    )
    assert.equal(await service.ping(), false)
  })
})

describe('RedisService — info', () => {
  it('info 解析 connected_clients / used_memory / uptime', async () => {
    const stub = createStubRedis({
      infoResponses: {
        clients: 'connected_clients:42\n',
        memory: 'used_memory_human:5.21M\n',
        server: 'uptime_in_seconds:3600\n',
      },
    })
    const service = new RedisService(stub as any)
    const result = await service.info()
    assert.deepEqual(result, {
      connectedClients: 42,
      usedMemory: '5.21M',
      uptimeSeconds: 3600,
    })
  })

  it('info 返回 null 当 info 抛错', async () => {
    const stub: any = {
      ping: async () => 'PONG',
      info: async () => {
        throw new Error('READONLY')
      },
      quit: async () => 'OK',
      disconnect: () => undefined,
    }
    const service = new RedisService(stub)
    assert.equal(await service.info(), null)
  })

  it('info 缺失字段返回 0 / unknown', async () => {
    const stub = createStubRedis({ infoResponses: {} })
    const service = new RedisService(stub as any)
    const result = await service.info()
    assert.deepEqual(result, { connectedClients: 0, usedMemory: 'unknown', uptimeSeconds: 0 })
  })
})

describe('RedisService — onModuleDestroy', () => {
  it('quit 成功时调用 client.quit', async () => {
    const stub: any = {
      ping: async () => 'PONG',
      info: async () => '',
      quit: async () => 'OK',
      disconnect: () => undefined,
    }
    const service = new RedisService(stub)
    await service.onModuleDestroy()
    // 已 quit,不会调用 disconnect
  })

  it('quit 抛错时 fallback 到 disconnect', async () => {
    let disconnectCalled = false
    const stub: any = {
      ping: async () => 'PONG',
      info: async () => '',
      quit: async () => {
        throw new Error('disconnect mid-flight')
      },
      disconnect: () => {
        disconnectCalled = true
      },
    }
    const service = new RedisService(stub)
    await service.onModuleDestroy()
    assert.equal(disconnectCalled, true)
  })
})

describe('RedisService — client 暴露', () => {
  it('client 字段提供原始 ioredis 实例', () => {
    const stub = createStubRedis({})
    const service = new RedisService(stub as any)
    assert.equal(service.client, stub)
  })
})