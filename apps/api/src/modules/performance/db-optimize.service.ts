export type QueryType = 'select' | 'insert' | 'update' | 'delete' | 'transaction'
export type IndexType = 'btree' | 'hash' | 'gin' | 'gist' | 'brin'

export interface QueryAnalysis {
  query: string
  queryType: QueryType
  estimatedCost: number
  rowsExamined: number
  rowsReturned: number
  executionTime: number // ms
  recommendations: string[]
  indexUsed?: string
  tableName?: string
}

export interface IndexCandidate {
  tableName: string
  column: string
  indexName: string
  indexType: IndexType
  selectivity: number // 0-1，越高越适合建索引
  estimatedSize: number // bytes
  recommendation: 'create' | 'drop' | 'consider'
  reason: string
}

export interface ConnectionPoolConfig {
  minConnections: number
  maxConnections: number
  acquireTimeout: number // ms
  idleTimeout: number // ms
  connectionTimeout: number
  healthCheckInterval: number
}

export interface PoolStats {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingRequests: number
  avgAcquireTime: number // ms
  avgQueryTime: number // ms
  hitRate: number // 缓存命中率
  connectionErrors: number
}

export interface QueryExecutionPlan {
  query: string
  nodeType: string // 'Seq Scan' | 'Index Scan' | 'Nested Loop' | 'Hash Join' | etc
  estimatedCost: number
  estimatedRows: number
  actualRows: number
  actualTime: number[]
  warnings: string[]
}

interface CacheEntry {
  result: unknown
  expiresAt: number
}

export class DBOptimizeService {
  private poolConfig: ConnectionPoolConfig | null = null
  private poolStats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    avgAcquireTime: 0,
    avgQueryTime: 0,
    hitRate: 0,
    connectionErrors: 0
  }
  private queryTimes: number[] = []
  private acquireTimes: number[] = []
  private cache = new Map<string, CacheEntry>()
  private indexUsageData = new Map<string, { usage: number; lastUsed: Date; size: number }>()

  // ── 查询分析 ──────────────────────────────────────────────────────

  analyzeQuery(query: string): QueryAnalysis {
    const normalizedQuery = query.trim().toUpperCase()
    const queryType = this.detectQueryType(normalizedQuery)
    const tableName = this.extractTableName(query)
    const hasWhere = /WHERE/i.test(query)
    const hasJoin = /JOIN/i.test(query)
    const hasIndex = /INDEX/i.test(query) || hasWhere && tableName

    let estimatedCost = 10
    let rowsExamined = 100
    let rowsReturned = 10
    const recommendations: string[] = []

    switch (queryType) {
      case 'select':
        if (!hasWhere) {
          estimatedCost += 1000
          recommendations.push('添加 WHERE 条件避免全表扫描')
        }
        if (hasJoin) {
          rowsExamined = rowsReturned * 10
          estimatedCost += 50
        }
        if (hasWhere && !hasIndex) {
          estimatedCost += 100
          recommendations.push(`表 ${tableName} 的 WHERE 字段缺少索引`)
        }
        rowsReturned = this.estimateRowsReturned(query)
        rowsExamined = hasJoin ? rowsReturned * 10 : rowsReturned * 2
        break
      case 'insert':
        estimatedCost = 20
        rowsExamined = 1
        rowsReturned = 1
        break
      case 'update':
        estimatedCost = 30
        rowsExamined = hasWhere ? 10 : 100
        rowsReturned = hasWhere ? 5 : 50
        if (!hasWhere) {
          estimatedCost += 1000
          recommendations.push('UPDATE 语句建议添加 WHERE 条件')
        }
        break
      case 'delete':
        estimatedCost = 30
        rowsExamined = hasWhere ? 10 : 100
        rowsReturned = hasWhere ? 5 : 50
        if (!hasWhere) {
          estimatedCost += 1000
          recommendations.push('DELETE 语句建议添加 WHERE 条件')
        }
        break
      case 'transaction':
        estimatedCost = 5
        rowsExamined = 0
        rowsReturned = 0
        break
    }

    return {
      query,
      queryType,
      estimatedCost,
      rowsExamined,
      rowsReturned,
      executionTime: estimatedCost * 0.5,
      recommendations,
      indexUsed: hasIndex ? `idx_${tableName}_col` : undefined,
      tableName
    }
  }

  analyzeQueries(queries: string[]): QueryAnalysis[] {
    return queries.map((q) => this.analyzeQuery(q))
  }

  explainPlan(query: string): QueryExecutionPlan {
    const normalizedQuery = query.trim().toUpperCase()
    const analysis = this.analyzeQuery(query)

    let nodeType = 'Seq Scan'
    const warnings: string[] = []

    if (/SELECT.*FROM.*WHERE/i.test(normalizedQuery)) {
      if (/JOIN/i.test(normalizedQuery)) {
        nodeType = 'Hash Join'
      } else if (analysis.indexUsed) {
        nodeType = 'Index Scan'
      }
    } else if (/SELECT.*FROM/i.test(normalizedQuery) && !/WHERE/i.test(normalizedQuery)) {
      nodeType = 'Seq Scan'
      warnings.push('全表扫描，建议添加 WHERE 条件或 LIMIT')
    } else if (/INSERT/i.test(normalizedQuery)) {
      nodeType = 'Insert'
    } else if (/UPDATE/i.test(normalizedQuery)) {
      nodeType = 'Update'
    } else if (/DELETE/i.test(normalizedQuery)) {
      nodeType = 'Delete'
    }

    return {
      query,
      nodeType,
      estimatedCost: analysis.estimatedCost,
      estimatedRows: analysis.rowsReturned,
      actualRows: analysis.rowsReturned,
      actualTime: [0, analysis.executionTime],
      warnings
    }
  }

  // ── 索引优化 ─────────────────────────────────────────────────────

  recommendIndexes(
    queries: string[],
    tableStats: Record<string, { rowCount: number; columnCardinality: Record<string, number> }>
  ): IndexCandidate[] {
    const candidates: IndexCandidate[] = []

    for (const query of queries) {
      const tableName = this.extractTableName(query)
      const stats = tableStats[tableName]
      if (!stats) continue

      const whereColumns = this.extractWhereColumns(query)
      for (const column of whereColumns) {
        const cardinality = stats.columnCardinality[column] || 1
        const selectivity = cardinality / stats.rowCount
        const rowsExamined = this.analyzeQuery(query).rowsExamined

        let recommendation: 'create' | 'drop' | 'consider' = 'consider'
        let reason = ''

        if (selectivity > 0.1) {
          if (rowsExamined > 1000 || selectivity > 0.5) {
            recommendation = 'create'
            reason = `选择率 ${(selectivity * 100).toFixed(1)}% 适合建索引${rowsExamined > 1000 ? `，且扫描行数 ${rowsExamined} 较大` : '（高选择性列）'}`
          } else {
            recommendation = 'consider'
            reason = `选择率 ${(selectivity * 100).toFixed(1)}%，扫描行数 ${rowsExamined} 不大，可根据实际场景决定`
          }
        } else if (selectivity < 0.01) {
          recommendation = 'drop'
          reason = `选择率 ${(selectivity * 100).toFixed(1)}% 过低，索引效果差`
        } else {
          recommendation = 'consider'
          reason = `选择率 ${(selectivity * 100).toFixed(1)}%，需根据实际场景决定`
        }

        candidates.push({
          tableName,
          column,
          indexName: `idx_${tableName}_${column}`,
          indexType: 'btree',
          selectivity,
          estimatedSize: stats.rowCount * 8 * 2, // 假设每行 8 bytes，放大 2 倍
          recommendation,
          reason
        })
      }
    }

    return candidates
  }

  analyzeIndexUsage(indexName: string, tableName: string): {
    usage: number
    lastUsed: Date
    size: number
    recommendation: string
  } {
    const data = this.indexUsageData.get(`${tableName}.${indexName}`)
    if (!data) {
      return {
        usage: 0,
        lastUsed: new Date(0),
        size: 0,
        recommendation: '该索引未被跟踪，建议检查索引有效性'
      }
    }

    let recommendation = '保留该索引'
    if (data.usage < 10) {
      recommendation = '该索引使用率较低，考虑删除'
    } else if (data.size > 100 * 1024 * 1024) {
      recommendation = '该索引体积较大，建议定期重建'
    }

    return {
      usage: data.usage,
      lastUsed: data.lastUsed,
      size: data.size,
      recommendation
    }
  }

  rebuildIndex(indexName: string): void {
    // 模拟重建索引
    const existing = this.indexUsageData.get(indexName)
    if (existing) {
      existing.lastUsed = new Date()
    }
  }

  // ── 连接池管理 ───────────────────────────────────────────────────

  initPool(config: ConnectionPoolConfig): void {
    this.poolConfig = config
    this.poolStats = {
      totalConnections: config.minConnections,
      activeConnections: 0,
      idleConnections: config.minConnections,
      waitingRequests: 0,
      avgAcquireTime: 0,
      avgQueryTime: 0,
      hitRate: 0,
      connectionErrors: 0
    }
  }

  getPoolStats(): PoolStats {
    return { ...this.poolStats }
  }

  async executeQuery(sql: string): Promise<{ rows: unknown[]; time: number }> {
    if (!this.poolConfig) {
      throw new Error('连接池未初始化，请先调用 initPool')
    }

    const startTime = Date.now()
    const acquireStart = Date.now()

    // 模拟获取连接
    if (this.poolStats.activeConnections >= this.poolConfig.maxConnections) {
      this.poolStats.waitingRequests++
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10))
    }

    this.poolStats.activeConnections++
    const acquireTime = Date.now() - acquireStart
    this.acquireTimes.push(acquireTime)

    // 模拟查询执行
    const queryTime = Math.random() * 190 + 10 // 10-200ms
    await new Promise((resolve) => setTimeout(resolve, queryTime))

    const executionTime = Date.now() - startTime
    this.queryTimes.push(executionTime)

    this.poolStats.activeConnections--
    this.poolStats.idleConnections++

    // 更新统计
    if (this.acquireTimes.length > 0) {
      this.poolStats.avgAcquireTime = this.acquireTimes.reduce((a, b) => a + b, 0) / this.acquireTimes.length
    }
    if (this.queryTimes.length > 0) {
      this.poolStats.avgQueryTime = this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length
    }

    return { rows: [{ id: 1 }], time: executionTime }
  }

  // ── 查询优化 ──────────────────────────────────────────────────────

  rewriteQuery(query: string): { rewritten: string; improvement: string } {
    const normalizedQuery = query.trim().toUpperCase()
    let rewritten = query
    let improvements: string[] = []

    // 先替换 SELECT *
    if (/SELECT\s+\*/i.test(normalizedQuery)) {
      rewritten = query.replace(/SELECT\s+\*/i, 'SELECT column1, column2')
      improvements.push('避免 SELECT *，指定需要的列')
    }

    // 再添加 LIMIT
    if (/^SELECT.*FROM.*WHERE/i.test(normalizedQuery) && !/LIMIT/i.test(normalizedQuery)) {
      rewritten = rewritten.replace(/;?\s*$/, '') + ' LIMIT 100'
      improvements.push('添加 LIMIT 限制返回行数，避免全表扫描返回过多数据')
    }

    const improvement = improvements.length > 0 ? improvements.join('; ') : '查询已优化，无需改进'

    return { rewritten, improvement }
  }

  cacheResult(key: string, result: unknown, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { result, expiresAt })
  }

  getCachedResult(key: string): unknown | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  // ── 分库分表策略 ──────────────────────────────────────────────────

  generateShardKey(shardCount: number, value: string | number): number {
    let hash = 0
    const str = String(value)
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash) % shardCount
  }

  resolveShard(shardKey: string, shardCount: number): number {
    return this.generateShardKey(shardCount, shardKey)
  }

  // ── 读写分离路由 ──────────────────────────────────────────────────

  shouldUseReplica(query: string): boolean {
    const normalizedQuery = query.trim().toUpperCase()
    return /^SELECT/i.test(normalizedQuery)
  }

  getConnection(forWrite: boolean): 'primary' | 'replica' {
    return forWrite ? 'primary' : 'replica'
  }

  // ── 私有辅助方法 ─────────────────────────────────────────────────

  private detectQueryType(query: string): QueryType {
    if (/^SELECT/i.test(query)) return 'select'
    if (/^INSERT/i.test(query)) return 'insert'
    if (/^UPDATE/i.test(query)) return 'update'
    if (/^DELETE/i.test(query)) return 'delete'
    if (/^BEGIN|^COMMIT|^ROLLBACK/i.test(query)) return 'transaction'
    return 'select'
  }

  private extractTableName(query: string): string {
    const match = query.match(/FROM\s+(\w+)/i) || query.match(/INTO\s+(\w+)/i) || query.match(/UPDATE\s+(\w+)/i)
    return match ? match[1] : 'unknown_table'
  }

  private extractWhereColumns(query: string): string[] {
    const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i)
    if (!whereMatch) return []

    const whereClause = whereMatch[1]
    const columns: string[] = []

    // 匹配 column = value 或 column > value 等模式
    const matches = whereClause.matchAll(/(\w+)\s*[=<>]/gi)
    for (const m of matches) {
      columns.push(m[1])
    }

    return [...new Set(columns)]
  }

  private estimateRowsReturned(query: string): number {
    const limitMatch = query.match(/LIMIT\s+(\d+)/i)
    if (limitMatch) {
      return parseInt(limitMatch[1], 10)
    }
    return 10 // 默认返回 10 行
  }
}
