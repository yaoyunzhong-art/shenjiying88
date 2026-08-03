/**
 * ClickHouse Infrastructure — Docker + Prisma Bridge + Data Pipeline
 *
 * 设计目标:
 *   - ClickHouseClient: ClickHouse 连接管理（支持内存模拟）
 *   - PrismaToClickHouseBridge: Prisma → ClickHouse 数据桥接（增量/全量同步）
 *   - AnalyticsDataPipeline: 分析数据管道（事件记录、查询、聚合）
 */

import { PrismaClient, Prisma } from '@prisma/client'

// ─────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────

export interface ClickHouseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface QueryResult {
  data: Record<string, unknown>[]
  meta: { name: string; type: string }[]
  rows: number
  statistics: { elapsed: number; rows_read: number; bytes_read: number }
}

export interface InsertRow {
  [column: string]: unknown
}

export interface TableSchema {
  columns: { name: string; type: string; default?: string }[]
  engine?: string
  orderBy?: string[]
  partitionBy?: string[]
}

export interface SyncCursor {
  tableName: string
  lastSyncAt: string
  lastSyncedId?: string
  count: number
}

export interface EventRecord {
  eventId: string
  eventType: string
  memberId?: string
  storeId?: string
  tenantId: string
  payload: Record<string, unknown>
  occurredAt: string
}

export interface EventFilter {
  eventType?: string
  memberId?: string
  storeId?: string
  tenantId: string
  since?: string
  until?: string
  limit?: number
}

export interface MemberProfile {
  memberId: string
  tenantId: string
  totalEvents: number
  eventTypes: Record<string, number>
  firstEventAt: string
  lastEventAt: string
  storesVisited: string[]
  recentEvents: EventRecord[]
}

export interface StoreMetrics {
  storeId: string
  tenantId: string
  period: { since: string; until: string }
  totalEvents: number
  eventBreakdown: Record<string, number>
  uniqueMembers: number
  hourlyDistribution: Record<number, number>
}

// ─────────────────────────────────────────────────────────────
// In-Memory ClickHouse Fake (for testing)
// ─────────────────────────────────────────────────────────────

interface InMemoryTable {
  schema: TableSchema
  rows: InsertRow[]
}

interface InMemoryDatabase {
  [tableName: string]: InMemoryTable
}

/**
 * FakeClickHouseClient — 内存模拟 ClickHouse
 * 不依赖真实 Docker/网络，用于测试
 */
export class FakeClickHouseClient {
  private connected = false
  private databases: Map<string, InMemoryDatabase> = new Map()
  private cursors: Map<string, SyncCursor> = new Map()

  async connect(): Promise<void> {
    this.connected = true
  }

  isConnected(): boolean {
    return this.connected
  }

  async ping(): Promise<boolean> {
    return this.connected
  }

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: Record<string, unknown>
  ): Promise<QueryResult> {
    if (!this.connected) throw new Error('Not connected to ClickHouse')
    // 简单 SQL 解析模拟
    const sqlLower = sql.toLowerCase().trim()

    if (sqlLower.startsWith('select')) {
      return this.handleSelect(sql, params)
    }
    if (sqlLower.startsWith('insert')) {
      return { data: [], meta: [], rows: 0, statistics: { elapsed: 0, rows_read: 0, bytes_read: 0 } }
    }
    return { data: [], meta: [], rows: 0, statistics: { elapsed: 0, rows_read: 0, bytes_read: 0 } }
  }

  private handleSelect(sql: string, params?: Record<string, unknown>): QueryResult {
    // 模拟 SELECT * FROM events WHERE ...
    const sqlLower = sql.toLowerCase()
    const allEvents: InsertRow[] = []
    const db = this.databases.get('default')
    if (db?.['events']) {
      allEvents.push(...db['events'].rows)
    }

    // 模拟参数化查询
    let filtered = allEvents
    if (params) {
      if (params['tenantId']) {
        filtered = filtered.filter((r) => r['tenantId'] === params['tenantId'])
      }
      if (params['memberId']) {
        filtered = filtered.filter((r) => r['memberId'] === params['memberId'])
      }
      if (params['eventType']) {
        filtered = filtered.filter((r) => r['eventType'] === params['eventType'])
      }
    }

    const limited = params?.['limit'] ? filtered.slice(0, Number(params['limit'])) : filtered
    return {
      data: limited as Record<string, unknown>[],
      meta: limited.length > 0
        ? Object.keys(limited[0]).map((name) => ({ name, type: typeof limited[0][name] as string }))
        : [],
      rows: limited.length,
      statistics: { elapsed: 0.001, rows_read: limited.length, bytes_read: limited.length * 100 }
    }
  }

  async insert(table: string, rows: InsertRow[]): Promise<{ written: number }> {
    if (!this.connected) throw new Error('Not connected to ClickHouse')
    let db = this.databases.get('default')
    if (!db) {
      db = {}
      this.databases.set('default', db)
    }
    if (!db[table]) {
      db[table] = { schema: { columns: [] }, rows: [] }
    }
    db[table].rows.push(...rows)
    return { written: rows.length }
  }

  async createDatabase(dbName: string): Promise<void> {
    if (!this.connected) throw new Error('Not connected to ClickHouse')
    if (!this.databases.has(dbName)) {
      this.databases.set(dbName, {})
    }
  }

  async createTable(dbName: string, tableName: string, schema: TableSchema): Promise<void> {
    if (!this.connected) throw new Error('Not connected to ClickHouse')
    const db = this.databases.get(dbName) ?? {}
    db[tableName] = { schema, rows: [] }
    this.databases.set(dbName, db)
  }

  getLastSyncCursor(tableName: string): SyncCursor | undefined {
    return this.cursors.get(tableName)
  }

  setLastSyncCursor(cursor: SyncCursor): void {
    this.cursors.set(cursor.tableName, cursor)
  }

  getAllRows(table: string): InsertRow[] {
    const db = this.databases.get('default')
    return db?.[table]?.rows ?? []
  }

  clear(): void {
    this.databases.clear()
    this.cursors.clear()
    this.connected = false
  }
}

// ─────────────────────────────────────────────────────────────
// ClickHouseClient
// ─────────────────────────────────────────────────────────────

export interface IClickHouseClient {
  connect(): Promise<void>
  ping(): Promise<boolean>
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: Record<string, unknown>
  ): Promise<QueryResult>
  insert(table: string, rows: InsertRow[]): Promise<{ written: number }>
  createDatabase(dbName: string): Promise<void>
  createTable(dbName: string, tableName: string, schema: TableSchema): Promise<void>
}

/**
 * ClickHouseClient — 连接管理
 *
 * 支持:
 *   - connect() 建立连接
 *   - query(sql, params?) 参数化查询
 *   - insert(table, rows[]) 批量插入
 *   - createDatabase / createTable DDL 操作
 */
export class ClickHouseClient implements IClickHouseClient {
  private config: ClickHouseConfig
  private client: IClickHouseClient

  constructor(config: ClickHouseConfig, client?: IClickHouseClient) {
    this.config = config
    // 注入 fake 用于测试
    this.client = client ?? new FakeClickHouseClient()
  }

  async connect(): Promise<void> {
    await this.client.connect()
  }

  async ping(): Promise<boolean> {
    return this.client.ping()
  }

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: Record<string, unknown>
  ): Promise<QueryResult> {
    return this.client.query<T>(sql, params)
  }

  async insert(table: string, rows: InsertRow[]): Promise<{ written: number }> {
    return this.client.insert(table, rows)
  }

  async createDatabase(dbName: string): Promise<void> {
    return this.client.createDatabase(dbName)
  }

  async createTable(dbName: string, tableName: string, schema: TableSchema): Promise<void> {
    return this.client.createTable(dbName, tableName, schema)
  }
}

// ─────────────────────────────────────────────────────────────
// PrismaToClickHouseBridge
// ─────────────────────────────────────────────────────────────

/**
 * PrismaToClickHouseBridge — Prisma → ClickHouse 数据桥接
 *
 * 支持:
 *   - syncTable(tableName, since?) 增量/全量同步
 *   - batchSync(tables[], since?) 批量同步
 *   - getLastSyncCursor / setLastSyncCursor 游标管理
 */
export class PrismaToClickHouseBridge {
  private prisma: PrismaClient
  private clickhouse: IClickHouseClient
  private cursorStore: Map<string, SyncCursor> = new Map()

  constructor(prisma: PrismaClient, clickhouse: IClickHouseClient) {
    this.prisma = prisma
    this.clickhouse = clickhouse
  }

  /**
   * 获取上次同步游标
   */
  getLastSyncCursor(tableName: string): SyncCursor | undefined {
    return this.cursorStore.get(tableName)
  }

  /**
   * 设置同步游标
   */
  setLastSyncCursor(cursor: SyncCursor): void {
    this.cursorStore.set(cursor.tableName, cursor)
  }

  /**
   * 同步 Prisma 表到 ClickHouse
   * @param tableName Prisma 模型名（小写）
   * @param since 可选时间戳，只同步该时间之后的记录
   * @param fullSync 是否全量同步（true 时先清空目标表）
   */
  async syncTable(
    tableName: string,
    since?: string,
    fullSync = false
  ): Promise<{ synced: number; cursor: SyncCursor }> {
    const model = this.getPrismaModel(tableName)
    if (!model) throw new Error(`Unknown Prisma model: ${tableName}`)

    // 全量同步：先清空 ClickHouse 表
    if (fullSync) {
      await this.clickhouse.query(`TRUNCATE TABLE ${tableName}`)
    }

    // 构建查询
    const where: any = since
      ? { updatedAt: { gte: new Date(since) } }
      : {}

    const records = await (model as unknown as { findMany: (args: unknown) => Promise<Record<string, unknown>[]> }).findMany({
      where,
      orderBy: { id: 'asc' },
    })

    if (records.length === 0) {
      const existing = this.getLastSyncCursor(tableName)
      return {
        synced: 0,
        cursor: existing ?? {
          tableName,
          lastSyncAt: new Date().toISOString(),
          count: 0,
        },
      }
    }

    // 转换为 ClickHouse 行
    const rows = records.map((r: any) => this.prismaRowToClickHouseRow(r))

    // 批量插入
    await this.clickhouse.insert(tableName, rows)

    // 更新游标
    const lastRecord = records[records.length - 1]
    const cursor: SyncCursor = {
      tableName,
      lastSyncAt: new Date().toISOString(),
      lastSyncedId: String(lastRecord.id),
      count: records.length,
    }
    this.setLastSyncCursor(cursor)

    return { synced: records.length, cursor }
  }

  /**
   * 批量同步多张表
   */
  async batchSync(
    tables: string[],
    since?: string
  ): Promise<{ results: Record<string, { synced: number }> }> {
    const results: Record<string, { synced: number }> = {}

    for (const table of tables) {
      try {
        const { synced } = await this.syncTable(table, since)
        results[table] = { synced }
      } catch (err) {
        results[table] = { synced: 0 }
      }
    }

    return { results }
  }

  private getPrismaModel(name: string): any {
    const modelNames = [
      'member', 'order', 'product', 'store', 'payment',
      'refund', 'inventory', 'coupon', 'loyalty', 'report',
    ]
    if (!modelNames.includes(name)) return null
    // 委托给注入的 Prisma Client
    return (this.prisma as unknown as Record<string, unknown>)[name]
  }

  private prismaRowToClickHouseRow(row: any): InsertRow {
    const result: InsertRow = {}
    for (const [key, value] of Object.entries(row)) {
      if (value instanceof Date) {
        result[key] = value.toISOString()
      } else if (typeof value === 'bigint') {
        result[key] = Number(value)
      } else {
        result[key] = value
      }
    }
    return result
  }
}

// ─────────────────────────────────────────────────────────────
// AnalyticsDataPipeline
// ─────────────────────────────────────────────────────────────

/**
 * AnalyticsDataPipeline — 分析数据管道
 *
 * 支持:
 *   - recordEvent(event) 记录事件到 ClickHouse
 *   - queryEvents(filter) 查询事件流
 *   - buildMemberProfile(memberId) 构建会员画像
 *   - buildStoreMetrics(storeId, since) 构建门店指标
 */
export class AnalyticsDataPipeline {
  private clickhouse: IClickHouseClient

  constructor(clickhouse: IClickHouseClient) {
    this.clickhouse = clickhouse
  }

  /**
   * 记录事件到 ClickHouse
   */
  async recordEvent(event: EventRecord): Promise<void> {
    const row: InsertRow = {
      eventId: event.eventId,
      eventType: event.eventType,
      memberId: event.memberId ?? '',
      storeId: event.storeId ?? '',
      tenantId: event.tenantId,
      payload: JSON.stringify(event.payload),
      occurredAt: event.occurredAt,
    }
    await this.clickhouse.insert('events', [row])
  }

  /**
   * 批量记录事件
   */
  async recordEvents(events: EventRecord[]): Promise<{ written: number }> {
    const rows = events.map((e) => ({
      eventId: e.eventId,
      eventType: e.eventType,
      memberId: e.memberId ?? '',
      storeId: e.storeId ?? '',
      tenantId: e.tenantId,
      payload: JSON.stringify(e.payload),
      occurredAt: e.occurredAt,
    }))
    return this.clickhouse.insert('events', rows)
  }

  /**
   * 查询事件流
   */
  async queryEvents(filter: EventFilter): Promise<EventRecord[]> {
    const params: Record<string, unknown> = {
      tenantId: filter.tenantId,
    }
    if (filter.memberId) params['memberId'] = filter.memberId
    if (filter.eventType) params['eventType'] = filter.eventType
    if (filter.limit) params['limit'] = filter.limit

    const result = await this.clickhouse.query(
      `SELECT * FROM events WHERE tenantId = {tenantId} ORDER BY occurredAt DESC`,
      params
    )

    return result.data.map((row) => ({
      eventId: row['eventId'] as string,
      eventType: row['eventType'] as string,
      memberId: (row['memberId'] as string) || undefined,
      storeId: (row['storeId'] as string) || undefined,
      tenantId: row['tenantId'] as string,
      payload: typeof row['payload'] === 'string' ? JSON.parse(row['payload'] as string) : (row['payload'] as Record<string, unknown>),
      occurredAt: row['occurredAt'] as string,
    }))
  }

  /**
   * 构建会员画像
   */
  async buildMemberProfile(memberId: string, tenantId: string): Promise<MemberProfile> {
    const result = await this.queryEvents({
      memberId,
      tenantId,
      limit: 1000,
    })

    const eventTypes: Record<string, number> = {}
    const storesVisited = new Set<string>()
    let totalEvents = 0
    let firstEventAt = ''
    let lastEventAt = ''

    for (const e of result) {
      totalEvents++
      eventTypes[e.eventType] = (eventTypes[e.eventType] ?? 0) + 1
      if (e.storeId) storesVisited.add(e.storeId)
      if (!firstEventAt || e.occurredAt < firstEventAt) firstEventAt = e.occurredAt
      if (!lastEventAt || e.occurredAt > lastEventAt) lastEventAt = e.occurredAt
    }

    return {
      memberId,
      tenantId,
      totalEvents,
      eventTypes,
      firstEventAt,
      lastEventAt,
      storesVisited: Array.from(storesVisited),
      recentEvents: result.slice(0, 10),
    }
  }

  /**
   * 构建门店指标
   */
  async buildStoreMetrics(
    storeId: string,
    tenantId: string,
    since: string
  ): Promise<StoreMetrics> {
    const result = await this.queryEvents({
      storeId,
      tenantId,
      since,
      limit: 10000,
    })

    const eventBreakdown: Record<string, number> = {}
    const hourlyDistribution: Record<number, number> = {}
    const uniqueMembers = new Set<string>()

    for (const e of result) {
      eventBreakdown[e.eventType] = (eventBreakdown[e.eventType] ?? 0) + 1
      if (e.memberId) uniqueMembers.add(e.memberId)
      const hour = new Date(e.occurredAt).getHours()
      hourlyDistribution[hour] = (hourlyDistribution[hour] ?? 0) + 1
    }

    return {
      storeId,
      tenantId,
      period: { since, until: new Date().toISOString() },
      totalEvents: result.length,
      eventBreakdown,
      uniqueMembers: uniqueMembers.size,
      hourlyDistribution,
    }
  }
}
