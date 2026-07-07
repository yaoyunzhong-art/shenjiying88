import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { DBOptimizeService } from './db-optimize.service'

describe('DBOptimizeService', () => {
  let service: DBOptimizeService

  beforeEach(() => {
    service = new DBOptimizeService()
  })

  // 1. analyzeQuery SELECT 分析正确
  it('analyzeQuery 正确分析 SELECT 查询', () => {
    const result = service.analyzeQuery('SELECT * FROM users WHERE id = 1')

    expect(result.queryType).toBe('select')
    expect(result.tableName).toBe('users')
    expect(result.rowsExamined).toBeGreaterThan(0)
    expect(result.rowsReturned).toBeGreaterThan(0)
    expect(result.recommendations.length).toBeGreaterThanOrEqual(0)
  })

  // 2. analyzeQueries 批量分析
  it('analyzeQueries 批量分析多个查询', () => {
    const queries = [
      'SELECT * FROM users WHERE id = 1',
      'INSERT INTO users (name) VALUES (\'test\')',
      'SELECT * FROM orders WHERE status = \'active\''
    ]

    const results = service.analyzeQueries(queries)

    expect(results).toHaveLength(3)
    expect(results[0].queryType).toBe('select')
    expect(results[1].queryType).toBe('insert')
    expect(results[2].queryType).toBe('select')
  })

  // 3. explainPlan 返回执行计划节点
  it('explainPlan 返回正确的执行计划节点', () => {
    const result = service.explainPlan('SELECT * FROM users WHERE id = 1')

    expect(result.nodeType).toMatch(/Seq Scan|Index Scan/)
    expect(result.estimatedCost).toBeGreaterThan(0)
    expect(result.estimatedRows).toBeGreaterThanOrEqual(0)
    expect(result.warnings).toBeDefined()
  })

  // 4. recommendIndexes 推荐创建索引
  it('recommendIndexes 推荐创建有效索引', () => {
    const queries = ['SELECT * FROM users WHERE email = \'test@example.com\'']
    const tableStats = {
      users: {
        rowCount: 100000,
        columnCardinality: { email: 100000 }
      }
    }

    const results = service.recommendIndexes(queries, tableStats)

    expect(results.length).toBeGreaterThan(0)
    const createRecs = results.filter((r) => r.recommendation === 'create')
    expect(createRecs.length).toBeGreaterThan(0)
  })

  // 5. recommendIndexes 推荐删除无效索引
  it('recommendIndexes 推荐删除无效索引', () => {
    const queries = ['SELECT * FROM users WHERE status = \'active\'']
    const tableStats = {
      users: {
        rowCount: 100000,
        columnCardinality: { status: 2 } // 低基数列
      }
    }

    const results = service.recommendIndexes(queries, tableStats)

    expect(results.length).toBeGreaterThan(0)
    const dropRecs = results.filter((r) => r.recommendation === 'drop')
    expect(dropRecs.length).toBeGreaterThan(0)
  })

  // 6. initPool → getPoolStats 数据一致
  it('initPool 后 getPoolStats 返回正确数据', () => {
    service.initPool({
      minConnections: 5,
      maxConnections: 20,
      acquireTimeout: 30000,
      idleTimeout: 60000,
      connectionTimeout: 5000,
      healthCheckInterval: 30000
    })

    const stats = service.getPoolStats()

    expect(stats.totalConnections).toBe(5)
    expect(stats.idleConnections).toBe(5)
    expect(stats.activeConnections).toBe(0)
    expect(stats.waitingRequests).toBe(0)
  })

  // 7. executeQuery 模拟查询执行
  it('executeQuery 模拟查询执行并返回结果', async () => {
    service.initPool({
      minConnections: 2,
      maxConnections: 10,
      acquireTimeout: 5000,
      idleTimeout: 30000,
      connectionTimeout: 5000,
      healthCheckInterval: 10000
    })

    const result = await service.executeQuery('SELECT * FROM users')

    expect(result.rows).toBeDefined()
    expect(Array.isArray(result.rows)).toBe(true)
    expect(result.time).toBeGreaterThan(0)
  })

  // 8. rewriteQuery 优化查询（添加 LIMIT 等）
  it('rewriteQuery 添加 LIMIT 优化查询', () => {
    const result = service.rewriteQuery('SELECT * FROM users WHERE id > 10')

    expect(result.rewritten).toContain('LIMIT')
    expect(result.improvement).toContain('LIMIT')
  })

  // 9. cacheResult / getCachedResult TTL 过期
  it('cacheResult 和 getCachedResult 正确处理缓存', () => {
    service.cacheResult('test_key', { data: 'value' }, 1)

    const cached = service.getCachedResult('test_key')
    expect(cached).toEqual({ data: 'value' })
  })

  it('getCachedResult 在 TTL 过期后返回 null', async () => {
    service.cacheResult('expire_key', { data: 'value' }, 0) // 0 秒 TTL

    // 等待一小段时间确保过期
    await new Promise((resolve) => setTimeout(resolve, 10))

    const cached = service.getCachedResult('expire_key')
    expect(cached).toBeNull()
  })

  // 10. generateShardKey 均匀分布
  it('generateShardKey 生成均匀分布的分片键', () => {
    const shardCount = 4
    const distribution: number[] = new Array(shardCount).fill(0)

    for (let i = 0; i < 1000; i++) {
      const shard = service.generateShardKey(shardCount, `user_${i}`)
      distribution[shard]++
    }

    // 验证分布相对均匀（每个分片至少有一些数据）
    for (const count of distribution) {
      expect(count).toBeGreaterThan(0)
    }
  })

  // 11. shouldUseReplica SELECT 走从库
  it('shouldUseReplica 对于 SELECT 返回 true', () => {
    const result = service.shouldUseReplica('SELECT * FROM users')

    expect(result).toBe(true)
  })

  it('shouldUseReplica 对于非 SELECT 返回 false', () => {
    const insertResult = service.shouldUseReplica('INSERT INTO users (name) VALUES (\'test\')')
    const updateResult = service.shouldUseReplica('UPDATE users SET name = \'test\'')
    const deleteResult = service.shouldUseReplica('DELETE FROM users')

    expect(insertResult).toBe(false)
    expect(updateResult).toBe(false)
    expect(deleteResult).toBe(false)
  })

  // 12. getConnection 读写路由正确
  it('getConnection 正确返回主库/从库', () => {
    const writeConn = service.getConnection(true)
    const readConn = service.getConnection(false)

    expect(writeConn).toBe('primary')
    expect(readConn).toBe('replica')
  })
})
