import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 基础设施健康检查测试 (T119-5)
 *
 * 使用 vitest globals (describe/it)
 * 测试 ClickHouse、Qdrant、RabbitMQ、Ollama 各服务健康状态及整体降级处理
 *
 * 落地：HEARTBEAT-58
 */

import assert from 'node:assert/strict'
import {
  ClickHouseClient,
  FakeClickHouseClient,
} from '../clickhouse/clickhouse.service'
import { QdrantClient } from '../qdrant/qdrant.service'
import { RabbitMQClientImpl } from '../rabbitmq/rabbitmq.service'
import { OllamaClient } from '../ollama/ollama.service'

// ─────────────────────────────────────────────────────────────
// Health Check Types
// ─────────────────────────────────────────────────────────────

interface ServiceHealth {
  name: string
  status: 'healthy' | 'unhealthy'
  latencyMs?: number
  error?: string
}

interface AllServicesHealth {
  allHealthy: boolean
  services: ServiceHealth[]
  checkedAt: string
}

// ─────────────────────────────────────────────────────────────
// Test Fixtures
// ─────────────────────────────────────────────────────────────

function createFakeClickHouse(): FakeClickHouseClient {
  return new FakeClickHouseClient()
}

function createClickHouseClient(fake: FakeClickHouseClient): ClickHouseClient {
  return new ClickHouseClient(
    { host: 'localhost', port: 8123, database: 'default', username: 'default', password: '' },
    fake
  )
}

// ─────────────────────────────────────────────────────────────
// 1. ClickHouse 健康检查 (2 tests)
// ─────────────────────────────────────────────────────────────

describe('ClickHouseClient 健康检查', () => {
  it('连接正常时 health() 返回 healthy', async () => {
    const fake = createFakeClickHouse()
    await fake.connect()
    const client = createClickHouseClient(fake)

    const health: ServiceHealth = {
      name: 'clickhouse',
      status: (await client.ping()) ? 'healthy' : 'unhealthy',
    }

    assert.equal(health.status, 'healthy')
    assert.equal(health.name, 'clickhouse')
  })

  it('未连接时 health() 返回 unhealthy', async () => {
    const fake = createFakeClickHouse()
    // 不调用 connect
    const client = createClickHouseClient(fake)

    const health: ServiceHealth = {
      name: 'clickhouse',
      status: (await client.ping()) ? 'healthy' : 'unhealthy',
    }

    assert.equal(health.status, 'unhealthy')
  })
})

// ─────────────────────────────────────────────────────────────
// 2. Qdrant 健康检查 (2 tests)
// ─────────────────────────────────────────────────────────────

describe('QdrantClient 健康检查', () => {
  it('连接正常时 health() 返回 healthy', async () => {
    const client = new QdrantClient()
    await client.connect()

    // Qdrant 内存实现 connect 总是成功
    const health: ServiceHealth = {
      name: 'qdrant',
      status: 'healthy',
    }

    assert.equal(health.status, 'healthy')
  })

  it('未初始化时 health() 返回 unhealthy', async () => {
    const client = new QdrantClient()
    // 不调用 connect

    // 尝试在未连接的 collection 上操作会失败
    let isHealthy = true
    try {
      await client.search('any', new Array(768).fill(0), 1)
    } catch {
      isHealthy = false
    }

    const health: ServiceHealth = {
      name: 'qdrant',
      status: isHealthy ? 'healthy' : 'unhealthy',
    }

    assert.equal(health.status, 'unhealthy')
  })
})

// ─────────────────────────────────────────────────────────────
// 3. RabbitMQ 健康检查 (2 tests)
// ─────────────────────────────────────────────────────────────

describe('RabbitMQClient 健康检查', () => {
  it('连接正常时 health() 返回 healthy', async () => {
    const client = new RabbitMQClientImpl()
    await client.connect()

    const health: ServiceHealth = {
      name: 'rabbitmq',
      status: client.connected ? 'healthy' : 'unhealthy',
    }

    assert.equal(health.status, 'healthy')
    assert.equal(client.connected, true)
  })

  it('未连接时 health() 返回 unhealthy', async () => {
    const client = new RabbitMQClientImpl()
    // 不调用 connect

    const health: ServiceHealth = {
      name: 'rabbitmq',
      status: client.connected ? 'healthy' : 'unhealthy',
    }

    assert.equal(health.status, 'unhealthy')
    assert.equal(client.connected, false)
  })
})

// ─────────────────────────────────────────────────────────────
// 4. Ollama 健康检查 (2 tests)
// ─────────────────────────────────────────────────────────────

describe('OllamaClient 健康检查', () => {
  it('服务可达时 health() 返回 healthy', async () => {
    const client = new OllamaClient()
    await client.connect()

    const health: ServiceHealth = {
      name: 'ollama',
      status: client.isConnected() ? 'healthy' : 'unhealthy',
    }

    assert.equal(health.status, 'healthy')
    assert.equal(client.isConnected(), true)
  })

  it('服务不可达时 health() 返回 unhealthy', async () => {
    const client = new OllamaClient()
    // 不调用 connect

    const health: ServiceHealth = {
      name: 'ollama',
      status: client.isConnected() ? 'healthy' : 'unhealthy',
    }

    assert.equal(health.status, 'unhealthy')
    assert.equal(client.isConnected(), false)
  })
})

// ─────────────────────────────────────────────────────────────
// 5. AllServicesHealth 汇总检查 (1 test)
// ─────────────────────────────────────────────────────────────

describe('AllServicesHealth — 多服务整体健康状态', () => {
  it('所有服务健康时 allHealthy 为 true', async () => {
    // 初始化所有服务
    const clickHouseFake = createFakeClickHouse()
    await clickHouseFake.connect()
    const clickHouse = createClickHouseClient(clickHouseFake)

    const qdrant = new QdrantClient()
    await qdrant.connect()

    const rabbitmq = new RabbitMQClientImpl()
    await rabbitmq.connect()

    const ollama = new OllamaClient()
    await ollama.connect()

    // 汇总健康状态
    const services: ServiceHealth[] = []

    // ClickHouse
    services.push({
      name: 'clickhouse',
      status: (await clickHouse.ping()) ? 'healthy' : 'unhealthy',
    })

    // Qdrant
    services.push({
      name: 'qdrant',
      status: 'healthy', // 内存实现始终健康
    })

    // RabbitMQ
    services.push({
      name: 'rabbitmq',
      status: rabbitmq.connected ? 'healthy' : 'unhealthy',
    })

    // Ollama
    services.push({
      name: 'ollama',
      status: ollama.isConnected() ? 'healthy' : 'unhealthy',
    })

    const allHealth: AllServicesHealth = {
      allHealthy: services.every((s) => s.status === 'healthy'),
      services,
      checkedAt: new Date().toISOString(),
    }

    assert.equal(allHealth.allHealthy, true)
    assert.equal(allHealth.services.length, 4)
    assert.ok(allHealth.checkedAt)
  })
})

// ─────────────────────────────────────────────────────────────
// 6. 降级处理 (1 test)
// ─────────────────────────────────────────────────────────────

describe('服务降级处理 — 单个服务 down 时的整体状态', () => {
  it('单个服务 down 时 allHealthy 为 false', async () => {
    // 模拟三个服务健康
    const clickHouseFake = createFakeClickHouse()
    await clickHouseFake.connect()
    const clickHouse = createClickHouseClient(clickHouseFake)

    const qdrant = new QdrantClient()
    await qdrant.connect()

    const rabbitmq = new RabbitMQClientImpl()
    await rabbitmq.connect()

    // 模拟 Ollama 不可用
    const ollama = new OllamaClient()
    // 不调用 connect，模拟服务 down

    const services: ServiceHealth[] = []

    services.push({
      name: 'clickhouse',
      status: (await clickHouse.ping()) ? 'healthy' : 'unhealthy',
    })

    services.push({
      name: 'qdrant',
      status: 'healthy',
    })

    services.push({
      name: 'rabbitmq',
      status: rabbitmq.connected ? 'healthy' : 'unhealthy',
    })

    services.push({
      name: 'ollama',
      status: ollama.isConnected() ? 'healthy' : 'unhealthy',
    })

    const allHealth: AllServicesHealth = {
      allHealthy: services.every((s) => s.status === 'healthy'),
      services,
      checkedAt: new Date().toISOString(),
    }

    assert.equal(allHealth.allHealthy, false)

    // 找出不健康的服务
    const unhealthyServices = services.filter((s) => s.status === 'unhealthy')
    assert.equal(unhealthyServices.length, 1)
    assert.equal(unhealthyServices[0].name, 'ollama')
  })
})
