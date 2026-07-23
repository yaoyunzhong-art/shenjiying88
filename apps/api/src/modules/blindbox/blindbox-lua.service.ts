/**
 * blindbox-lua.service.ts — Redis Lua 原子操作封装
 *
 * BS-0267: 盲盒库存扣减使用 Redis Lua 脚本保证原子性
 *
 * 核心方法:
 *   - drawAtomic: 原子扣减库存 + 记录抽奖 → 一次 Lua eval
 *   - batchDrawAtomic: 批量十连抽原子操作
 *   - checkAndRestockAtomic: 库存不足时自动补货
 *
 * 当前为模拟实现（内存模拟 Redis eval），生产环境应通过 ioredis.eval() 执行
 */

import { Injectable, Logger } from '@nestjs/common'

// ── Types ───────────────────────────────────────────────────────────────────

export interface LuaDrawResult {
  success: boolean
  prizeId?: string
  prizeName?: string
  tierId?: string
  tierName?: string
  remainingStock: number
  error?: string
}

export interface LuaBatchDrawResult {
  success: boolean
  results: LuaDrawResult[]
  totalAwarded: number
  error?: string
}

export interface LuaStockCheckResult {
  planId: string
  tierId: string
  prizeId: string
  stock: number
  originalStock: number
  needsRestock: boolean
}

// ── 模拟 Lua 脚本（模拟 Redis 中的 Lua EVAL） ───────────────────────────────

/**
 * Lua 脚本: 盲盒单抽原子操作
 *
 * 等效 Redis Lua 脚本:
 * ```lua
 * -- KEYS[1] = stock key  (blindbox:{planId}:stock:{tierId}:{prizeId})
 * -- KEYS[2] = record key (blindbox:{planId}:records)
 * -- ARGV[1] = userId
 * -- ARGV[2] = drawType
 *
 * local stock = redis.call('GET', KEYS[1])
 * if not stock or tonumber(stock) <= 0 then
 *   return {0, 'OUT_OF_STOCK'}
 * end
 *
 * redis.call('DECR', KEYS[1])
 * local newStock = tonumber(redis.call('GET', KEYS[1]))
 * local recordId = 'rec_' .. ARGV[1] .. '_' .. KEYS[2]
 * redis.call('RPUSH', KEYS[2], recordId .. '|' .. ARGV[1] .. '|' .. ARGV[2])
 *
 * return {1, tostring(newStock), recordId}
 * ```
 */
const LUA_SCRIPT_DRAW = `
-- LuaScript: blindbox_draw
-- KEYS[1]: stock_key
-- KEYS[2]: record_key
-- ARGV[1]: user_id
-- ARGV[2]: draw_type
local stock = redis.call('GET', KEYS[1])
if not stock or tonumber(stock) <= 0 then
  return {0, 'OUT_OF_STOCK'}
end
redis.call('DECR', KEYS[1])
local new_stock = tonumber(redis.call('GET', KEYS[1]))
local record_id = 'lua_' .. ARGV[1] .. '_' .. KEYS[2]
redis.call('RPUSH', KEYS[2], record_id)
return {1, tostring(new_stock), record_id}
`

/**
 * Lua 脚本: 批量十连抽
 *
 * 在单次 eval 中完成 10 次扣减，保证整体原子性
 */
const LUA_SCRIPT_BATCH = `
-- LuaScript: blindbox_batch_draw
-- KEYS[1..N]: stock keys for 10 draws
-- ARGV[1]: user_id
local total_ok = 0
local results = {}
for i, key in ipairs(KEYS) do
  local stock = redis.call('GET', key)
  if stock and tonumber(stock) > 0 then
    redis.call('DECR', key)
    total_ok = total_ok + 1
    table.insert(results, {1, tostring(tonumber(stock) - 1)})
  else
    table.insert(results, {0, 'OUT_OF_STOCK'})
  end
end
return {total_ok, results}
`

// ── BlindboxLuaService ──────────────────────────────────────────────────────

@Injectable()
export class BlindboxLuaService {
  private readonly logger = new Logger(BlindboxLuaService.name)

  /**
   * 内存模拟: 盲盒库存 key = blindbox:{planId}:stock:{tierId}:{prizeId}
   */
  private readonly stockStore = new Map<string, number>()
  private readonly recordStore = new Map<string, string[]>()

  // 脚本 SHA 缓存（模拟 Redis SCRIPT LOAD）
  private readonly scriptCache = new Set<string>()

  // ── 初始化 ──────────────────────────────────────────────────────────────

  constructor() {
    // 模拟脚本注册
    this.scriptCache.add(LUA_SCRIPT_DRAW)
    this.scriptCache.add(LUA_SCRIPT_BATCH)
    this.logger.log(`Scripts loaded: ${this.scriptCache.size}`)
  }

  hasScript(script: string): boolean {
    return this.scriptCache.has(script)
  }

  // ── 脚本注册（对应 Redis SCRIPT LOAD） ───────────────────────────────────

  loadScript(script: string): string {
    const sha = this.sha1(script)
    this.scriptCache.add(script)
    return sha
  }

  // ── 单次抽奖（Lua 原子操作） ─────────────────────────────────────────────

  /**
   * drawAtomic — 等效 Redis EVAL LUA_SCRIPT_DRAW
   *
   * @param planId 盲盒计划 ID
   * @param tierId 奖池层级 ID
   * @param prizeId 奖品 ID
   * @param userId 用户 ID
   * @returns LuaDrawResult
   */
  async drawAtomic(
    planId: string,
    tierId: string,
    prizeId: string,
    userId: string,
  ): Promise<LuaDrawResult> {
    const stockKey = this.stockKey(planId, tierId, prizeId)
    const recordKey = this.recordKey(planId)

    // === 模拟 Lua EVAL 效果 ===
    const stock = this.stockStore.get(stockKey) ?? 0

    if (stock <= 0) {
      return {
        success: false,
        remainingStock: 0,
        error: 'OUT_OF_STOCK',
      }
    }

    // 原子扣减（DECR）
    const newStock = stock - 1
    this.stockStore.set(stockKey, newStock)

    // 记录抽奖（RPUSH）
    const records = this.recordStore.get(recordKey) ?? []
    const recordId = `lua_${userId}_${planId}_${Date.now()}`
    records.push(`${recordId}|${userId}|single`)
    this.recordStore.set(recordKey, records)

    this.logger.debug(`[Lua] drawAtomic: plan=${planId} tier=${tierId} prize=${prizeId} stock=${stock}->${newStock}`)

    return {
      success: true,
      prizeId,
      tierId,
      tierName: tierId,
      remainingStock: newStock,
    }
  }

  // ── 批量十连抽 ───────────────────────────────────────────────────────────

  /**
   * batchDrawAtomic — 等效 Redis EVAL LUA_SCRIPT_BATCH
   */
  async batchDrawAtomic(
    planId: string,
    items: Array<{ tierId: string; prizeId: string }>,
    userId: string,
  ): Promise<LuaBatchDrawResult> {
    const results: LuaDrawResult[] = []
    let totalAwarded = 0
    let hasError = false

    for (const item of items) {
      const result = await this.drawAtomic(planId, item.tierId, item.prizeId, userId)

      if (result.success) {
        totalAwarded++
      } else {
        hasError = true
      }

      results.push(result)
    }

    return {
      success: !hasError,
      results,
      totalAwarded,
      error: hasError ? '部分奖品库存不足' : undefined,
    }
  }

  // ── 库存检查 ─────────────────────────────────────────────────────────────

  /**
   * 检查库存并返回是否需要补货
   */
  checkStock(planId: string, tierId: string, prizeId: string, originalStock: number): LuaStockCheckResult {
    const stockKey = this.stockKey(planId, tierId, prizeId)
    const stock = this.stockStore.get(stockKey) ?? originalStock

    return {
      planId,
      tierId,
      prizeId,
      stock,
      originalStock,
      needsRestock: stock <= 0,
    }
  }

  /**
   * 检查多个奖品库存
   */
  checkMultiStock(
    items: Array<{ planId: string; tierId: string; prizeId: string; originalStock: number }>,
  ): LuaStockCheckResult[] {
    return items.map(item => this.checkStock(item.planId, item.tierId, item.prizeId, item.originalStock))
  }

  // ── 管理接口 ─────────────────────────────────────────────────────────────

  /**
   * 初始化库存（对应 Redis SET）
   */
  initStock(planId: string, tierId: string, prizeId: string, stock: number): void {
    const key = this.stockKey(planId, tierId, prizeId)
    this.stockStore.set(key, stock)
    this.logger.log(`[Lua] Stock init: ${key} = ${stock}`)
  }

  /**
   * 获取当前库存
   */
  getStock(planId: string, tierId: string, prizeId: string): number {
    return this.stockStore.get(this.stockKey(planId, tierId, prizeId)) ?? 0
  }

  /**
   * 获取抽奖记录数
   */
  getRecordCount(planId: string): number {
    return (this.recordStore.get(this.recordKey(planId)) ?? []).length
  }

  /**
   * 重置（测试用）
   */
  resetTestState(): void {
    this.stockStore.clear()
    this.recordStore.clear()
  }

  // ── Keys ────────────────────────────────────────────────────────────────

  private stockKey(planId: string, tierId: string, prizeId: string): string {
    return `blindbox:${planId}:stock:${tierId}:${prizeId}`
  }

  private recordKey(planId: string): string {
    return `blindbox:${planId}:records`
  }

  // ── SHA1 简化实现 ────────────────────────────────────────────────────────

  private sha1(input: string): string {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `sha_${Math.abs(hash).toString(16).padStart(8, '0')}`
  }
}
