/**
 * clickhouse.service.spec.ts — ClickHouse Service 深层单元测试
 *
 * 覆盖:
 *  - ClickHouseClient: 连接管理 / 查询 / 插入 / DDL / 错误处理
 *  - FakeClickHouseClient: 模拟数据管理 / 游标 / 清空
 *  - PrismaToClickHouseBridge: 同步 / 批量同步 / 游标 / 错误处理
 *  - AnalyticsDataPipeline: 事件记录 / 事件查询 / 会员画像 / 门店指标 / 边界
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 30 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  FakeClickHouseClient,
  ClickHouseClient,
  PrismaToClickHouseBridge,
  AnalyticsDataPipeline,
  type ClickHouseConfig,
  type EventRecord,
} from './clickhouse.service'
import { PrismaClient } from '@prisma/client'

// ══════════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════════

function makeEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    eventType: 'page_view',
    tenantId: 'tenant_001',
    payload: { url: '/home' },
    occurredAt: new Date().toISOString(),
    ...overrides,
  }
}

function fakePrismaClient(): PrismaClient {
  // Return a minimal mock — PrismaToClickHouseBridge only uses findMany
  const db: Record<string, any[]> = {
    member: [
      { id: 1, name: 'Alice', email: 'alice@test.com', updatedAt: new Date('2026-07-01') },
      { id: 2, name: 'Bob', email: 'bob@test.com', updatedAt: new Date('2026-07-02') },
    ],
    order: [
      { id: 10, total: 100, status: 'paid', updatedAt: new Date('2026-07-01') },
    ],
  }
  return {
    member: {
      findMany: async (args: any) => {
        let data = [...db.member]
        if (args?.where?.updatedAt?.gte) {
          data = data.filter((r) => r.updatedAt >= args.where.updatedAt.gte)
        }
        if (args?.orderBy?.id) data.sort((a, b) => (a.id > b.id ? 1 : -1))
        return data
      },
    },
    order: {
      findMany: async (args: any) => {
        let data = [...db.order]
        if (args?.where?.updatedAt?.gte) {
          data = data.filter((r) => r.updatedAt >= args.where.updatedAt.gte)
        }
        return data
      },
    },
  } as unknown as PrismaClient
}

// ══════════════════════════════════════════════════════════════
// ClickHouseClient
// ══════════════════════════════════════════════════════════════

describe('ClickHouseClient', () => {
  let fake: FakeClickHouseClient
  let client: ClickHouseClient

  beforeEach(() => {
    fake = new FakeClickHouseClient()
    const config: ClickHouseConfig = {
      host: 'localhost',
      port: 8123,
      database: 'test',
      username: 'default',
      password: '',
    }
    client = new ClickHouseClient(config, fake)
  })

  describe('连接管理', () => {
    it('connect 成功后 isConnected 返回 true', async () => {
      await client.connect()
      expect(await client.ping()).toBe(true)
    })

    it('未 connect 时 ping 返回 false', async () => {
      expect(await client.ping()).toBe(false)
    })

    it('可重复 connect 不抛异常', async () => {
      await client.connect()
      await client.connect()
      expect(await client.ping()).toBe(true)
    })
  })

  describe('查询', () => {
    beforeEach(async () => {
      await client.connect()
    })

    it('空数据库查询返回空数组', async () => {
      const result = await client.query('SELECT * FROM events')
      expect(result.data).toEqual([])
      expect(result.rows).toBe(0)
    })

    it('插入后查询可获取数据', async () => {
      await client.insert('events', [{ eventId: 'e1', tenantId: 't1', eventType: 'click' }])
      const result = await client.query('SELECT * FROM events')
      expect(result.rows).toBe(1)
      expect(result.data[0].eventId).toBe('e1')
    })

    it('参数化查询支持 tenantId 过滤', async () => {
      await client.insert('events', [
        { eventId: 'e1', tenantId: 't1', eventType: 'click' },
        { eventId: 'e2', tenantId: 't2', eventType: 'view' },
      ])
      const result = await client.query('SELECT * FROM events', { tenantId: 't1' })
      expect(result.rows).toBe(1)
      expect(result.data[0].eventId).toBe('e1')
    })

    it('参数化查询支持 memberId 过滤', async () => {
      await client.insert('events', [
        { eventId: 'e1', memberId: 'm1', tenantId: 't1' },
        { eventId: 'e2', memberId: 'm2', tenantId: 't1' },
      ])
      const result = await client.query('SELECT * FROM events', { memberId: 'm1' })
      expect(result.rows).toBe(1)
    })

    it('参数化查询支持 limit', async () => {
      for (let i = 0; i < 10; i++) {
        await client.insert('events', [{ eventId: `e${i}`, tenantId: 't1' }])
      }
      const result = await client.query('SELECT * FROM events', { limit: 3 })
      expect(result.rows).toBe(3)
    })
  })

  describe('DDL 操作', () => {
    beforeEach(async () => {
      await client.connect()
    })

    it('createDatabase 不抛异常', async () => {
      await expect(client.createDatabase('analytics')).resolves.toBeUndefined()
    })

    it('createTable 后可以查询', async () => {
      await client.createTable('default', 'users', {
        columns: [{ name: 'id', type: 'String' }],
      })
      await client.insert('users', [{ id: 'u1' }])
      const result = await client.query('SELECT * FROM users')
      expect(result.rows).toBe(1)
    })
  })

  describe('FakeClickHouseClient 工具方法', () => {
    beforeEach(async () => {
      await fake.connect()
    })

    it('getLastSyncCursor 默认 undefined', () => {
      expect(fake.getLastSyncCursor('members')).toBeUndefined()
    })

    it('setLastSyncCursor 后可以读取', () => {
      fake.setLastSyncCursor({ tableName: 'members', lastSyncAt: '2026-07-01T00:00:00Z', count: 10 })
      const cursor = fake.getLastSyncCursor('members')
      expect(cursor?.count).toBe(10)
      expect(cursor?.tableName).toBe('members')
    })

    it('clear 重置所有状态', async () => {
      await fake.insert('events', [{ eventId: 'e1' }])
      fake.setLastSyncCursor({ tableName: 'members', lastSyncAt: '2026-07-01T00:00:00Z', count: 1 })
      fake.clear()
      expect(fake.getAllRows('events')).toEqual([])
      expect(fake.getLastSyncCursor('members')).toBeUndefined()
    })

    it('getAllRows 返回插入的所有行', async () => {
      await fake.insert('events', [{ eventId: 'e1' }, { eventId: 'e2' }])
      const rows = fake.getAllRows('events')
      expect(rows).toHaveLength(2)
    })
  })

  describe('错误处理', () => {
    it('未 connect 时 query 抛出错误', async () => {
      const ch = new FakeClickHouseClient()
      await expect(ch.query('SELECT 1')).rejects.toThrow('Not connected')
    })

    it('未 connect 时 insert 抛出错误', async () => {
      const ch = new FakeClickHouseClient()
      await expect(ch.insert('t', [{}])).rejects.toThrow('Not connected')
    })

    it('未 connect 时 createDatabase 抛出错误', async () => {
      const ch = new FakeClickHouseClient()
      await expect(ch.createDatabase('x')).rejects.toThrow('Not connected')
    })

    it('未 connect 时 createTable 抛出错误', async () => {
      const ch = new FakeClickHouseClient()
      await expect(ch.createTable('x', 'y', { columns: [] })).rejects.toThrow('Not connected')
    })
  })
})

// ══════════════════════════════════════════════════════════════
// PrismaToClickHouseBridge
// ══════════════════════════════════════════════════════════════

describe('PrismaToClickHouseBridge', () => {
  let fake: FakeClickHouseClient
  let prisma: PrismaClient
  let bridge: PrismaToClickHouseBridge

  beforeEach(async () => {
    fake = new FakeClickHouseClient()
    await fake.connect()
    prisma = fakePrismaClient()
    bridge = new PrismaToClickHouseBridge(prisma, fake)
  })

  describe('syncTable', () => {
    it('全量同步 member 表返回 synced 计数', async () => {
      const result = await bridge.syncTable('member', undefined, true)
      expect(result.synced).toBe(2)
      expect(result.cursor.tableName).toBe('member')
      expect(typeof result.cursor.lastSyncedId).toBe('string')
    })

    it('同步后数据实际写入 ClickHouse', async () => {
      await bridge.syncTable('member')
      const rows = fake.getAllRows('member')
      expect(rows).toHaveLength(2)
      expect(rows[0].name).toBe('Alice')
    })

    it('since 参数过滤只同步指定时间后的记录', async () => {
      await bridge.syncTable('member', '2026-07-02T00:00:00Z')
      const rows = fake.getAllRows('member')
      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe('Bob')
    })

    it('无新数据时 synced 为 0', async () => {
      const result = await bridge.syncTable('member', '2099-01-01T00:00:00Z')
      expect(result.synced).toBe(0)
    })

    it('游标记录 lastSyncAt 和 lastSyncedId', async () => {
      await bridge.syncTable('member')
      const cursor = bridge.getLastSyncCursor('member')
      expect(cursor).toBeDefined()
      expect(cursor!.lastSyncedId).toBe('2')
      expect(cursor!.count).toBe(2)
    })

    it('未知表名抛出异常', async () => {
      await expect(bridge.syncTable('unknown_table')).rejects.toThrow('Unknown')
    })

    it('PrismaRowToClickHouseRow 将 Date 转为 ISO 字符串', async () => {
      await bridge.syncTable('member')
      const rows = fake.getAllRows('member')
      expect(typeof rows[0].updatedAt).toBe('string')
      expect(rows[0].updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/)
    })
  })

  describe('batchSync', () => {
    it('批量同步多张表', async () => {
      const result = await bridge.batchSync(['member', 'order'])
      expect(result.results.member.synced).toBe(2)
      expect(result.results.order.synced).toBe(1)
    })

    it('未知表不会导致整体失败', async () => {
      const result = await bridge.batchSync(['member', 'nonexistent'])
      expect(result.results.member.synced).toBe(2)
      expect(result.results.nonexistent.synced).toBe(0)
    })

    it('空表数组返回空结果', async () => {
      const result = await bridge.batchSync([])
      expect(result.results).toEqual({})
    })
  })
})

// ══════════════════════════════════════════════════════════════
// AnalyticsDataPipeline
// ══════════════════════════════════════════════════════════════

describe('AnalyticsDataPipeline', () => {
  let fake: FakeClickHouseClient
  let pipeline: AnalyticsDataPipeline

  beforeEach(async () => {
    fake = new FakeClickHouseClient()
    await fake.connect()
    pipeline = new AnalyticsDataPipeline(fake)
  })

  describe('recordEvent', () => {
    it('记录单个事件到 ClickHouse', async () => {
      const event = makeEvent({ eventType: 'page_view' })
      await pipeline.recordEvent(event)
      const rows = fake.getAllRows('events')
      expect(rows).toHaveLength(1)
      expect(rows[0].eventId).toBe(event.eventId)
    })

    it('payload 被序列化为 JSON 字符串', async () => {
      await pipeline.recordEvent(makeEvent({ payload: { url: '/product', meta: { ref: 'google' } } }))
      const rows = fake.getAllRows('events')
      expect(typeof rows[0].payload).toBe('string')
      expect(JSON.parse(rows[0].payload as string).url).toBe('/product')
    })

    it('空 memberId/storeId 被处理为空字符串', async () => {
      const event = makeEvent({ memberId: undefined, storeId: undefined })
      await pipeline.recordEvent(event)
      const rows = fake.getAllRows('events')
      expect(rows[0].memberId).toBe('')
      expect(rows[0].storeId).toBe('')
    })
  })

  describe('recordEvents', () => {
    it('批量记录返回写入计数', async () => {
      const events = [makeEvent({ eventId: 'e1' }), makeEvent({ eventId: 'e2' }), makeEvent({ eventId: 'e3' })]
      const result = await pipeline.recordEvents(events)
      expect(result.written).toBe(3)
    })

    it('空数组写入 0 条', async () => {
      const result = await pipeline.recordEvents([])
      expect(result.written).toBe(0)
    })
  })

  describe('queryEvents', () => {
    beforeEach(async () => {
      await pipeline.recordEvents([
        makeEvent({ eventId: 'e1', tenantId: 't1', eventType: 'page_view', occurredAt: '2026-07-01T10:00:00Z' }),
        makeEvent({ eventId: 'e2', tenantId: 't1', eventType: 'click', occurredAt: '2026-07-01T11:00:00Z' }),
        makeEvent({ eventId: 'e3', tenantId: 't2', eventType: 'page_view', occurredAt: '2026-07-01T12:00:00Z' }),
      ])
    })

    it('按 tenant 过滤事件', async () => {
      const events = await pipeline.queryEvents({ tenantId: 't1' })
      expect(events).toHaveLength(2)
    })

    it('按 eventType 过滤事件', async () => {
      const events = await pipeline.queryEvents({ tenantId: 't1', eventType: 'click' })
      expect(events).toHaveLength(1)
      expect(events[0].eventType).toBe('click')
    })

    it('按 limit 限制返回数量', async () => {
      const events = await pipeline.queryEvents({ tenantId: 't1', limit: 1 })
      expect(events).toHaveLength(1)
    })

    it('payload 从 JSON 字符串反序列化为对象', async () => {
      const events = await pipeline.queryEvents({ tenantId: 't1', limit: 1 })
      expect(typeof events[0].payload).toBe('object')
      expect(events[0].payload).not.toBeNull()
    })
  })

  describe('buildMemberProfile', () => {
    beforeEach(async () => {
      await pipeline.recordEvents([
        makeEvent({ tenantId: 't1', memberId: 'm1', eventType: 'page_view', occurredAt: '2026-07-01T10:00:00Z' }),
        makeEvent({ tenantId: 't1', memberId: 'm1', eventType: 'click', occurredAt: '2026-07-01T11:00:00Z' }),
        makeEvent({ tenantId: 't1', memberId: 'm1', eventType: 'page_view', occurredAt: '2026-07-01T12:00:00Z', storeId: 's1' }),
        makeEvent({ tenantId: 't1', memberId: 'm2', eventType: 'purchase', occurredAt: '2026-07-02T00:00:00Z' }),
      ])
    })

    it('计算会员总事件数', async () => {
      const profile = await pipeline.buildMemberProfile('m1', 't1')
      expect(profile.totalEvents).toBe(3)
    })

    it('按 eventType 分类统计', async () => {
      const profile = await pipeline.buildMemberProfile('m1', 't1')
      expect(profile.eventTypes.page_view).toBe(2)
      expect(profile.eventTypes.click).toBe(1)
    })

    it('记录访问过的门店', async () => {
      const profile = await pipeline.buildMemberProfile('m1', 't1')
      expect(profile.storesVisited).toContain('s1')
    })

    it('记录最早和最晚事件时间', async () => {
      const profile = await pipeline.buildMemberProfile('m1', 't1')
      expect(profile.firstEventAt).toBe('2026-07-01T10:00:00Z')
      expect(profile.lastEventAt).toBe('2026-07-01T12:00:00Z')
    })

    it('无事件的会员返回空画像', async () => {
      const profile = await pipeline.buildMemberProfile('m_ghost', 't1')
      expect(profile.totalEvents).toBe(0)
      expect(profile.eventTypes).toEqual({})
    })
  })

  describe('buildStoreMetrics', () => {
    beforeEach(async () => {
      await pipeline.recordEvents([
        makeEvent({ tenantId: 't1', storeId: 's1', eventType: 'page_view', occurredAt: '2026-07-01T10:00:00Z', memberId: 'm1' }),
        makeEvent({ tenantId: 't1', storeId: 's1', eventType: 'click', occurredAt: '2026-07-01T11:00:00Z', memberId: 'm2' }),
        makeEvent({ tenantId: 't1', storeId: 's1', eventType: 'page_view', occurredAt: '2026-07-01T14:00:00Z', memberId: 'm1' }),
        makeEvent({ tenantId: 't1', storeId: 's2', eventType: 'purchase', occurredAt: '2026-07-01T15:00:00Z' }),
      ])
    })

    it('计算门店总事件数', async () => {
      const metrics = await pipeline.buildStoreMetrics('s1', 't1', '2026-01-01T00:00:00Z')
      expect(metrics.totalEvents).toBe(3)
    })

    it('按 eventType 分解事件', async () => {
      const metrics = await pipeline.buildStoreMetrics('s1', 't1', '2026-01-01T00:00:00Z')
      expect(metrics.eventBreakdown.page_view).toBe(2)
      expect(metrics.eventBreakdown.click).toBe(1)
    })

    it('统计去重访客数', async () => {
      const metrics = await pipeline.buildStoreMetrics('s1', 't1', '2026-01-01T00:00:00Z')
      expect(metrics.uniqueMembers).toBe(2)
    })

    it('统计小时分布', async () => {
      const metrics = await pipeline.buildStoreMetrics('s1', 't1', '2026-01-01T00:00:00Z')
      expect(metrics.hourlyDistribution[10]).toBe(1)
      expect(metrics.hourlyDistribution[11]).toBe(1)
      expect(metrics.hourlyDistribution[14]).toBe(1)
    })

    it('no-since 范围返回 0 事件', async () => {
      const metrics = await pipeline.buildStoreMetrics('s1', 't1', '2099-01-01T00:00:00Z')
      expect(metrics.totalEvents).toBe(0)
    })
  })
})
