/**
 * Phase-33: Postgres 连接池配置
 *
 * 生产环境用真实 pg.Pool
 * 开发/CI 环境可用 in-memory 模拟 (通过 EventStoreService 内部)
 *
 * 配置: POSTGRES_URL 环境变量
 *   格式: postgres://user:pass@host:port/db
 *
 * 用法:
 *   import { getPgPool } from '../database/pg-pool'
 *   const pool = getPgPool()
 *   const result = await pool.query('SELECT 1')
 */
// @ts-ignore - pg types not installed
import { Pool } from 'pg'

let poolInstance: Pool | null = null

/**
 * 获取全局 Postgres Pool (单例)
 * 如果 POSTGRES_URL 未配置, 返回 null (EventStore 自动降级到内存模式)
 */
export function getPgPool(): Pool | null {
  if (poolInstance) return poolInstance

  const url = process.env.POSTGRES_URL
  if (!url) {
    return null
  }

  poolInstance = new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  })

  poolInstance.on('error', (err: any) => {
    // eslint-disable-next-line no-console
    console.error('[pg-pool] unexpected error on idle client', err)
  })

  return poolInstance
}

/**
 * 关闭连接池 (用于 graceful shutdown)
 */
export async function closePgPool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end()
    poolInstance = null
  }
}