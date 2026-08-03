#!/usr/bin/env tsx
/**
 * dispatch-knowledge.ts — 派单知识赋能工具 (ADR-045 V2)
 *
 * 用法: tsx scripts/dispatch-knowledge.ts <模块名> [关键词...]
 * 示例: tsx scripts/dispatch-knowledge.ts storefront 动态路由 三态
 *
 * 模式:
 *  - API优先: 调用 POST /api/empower-cards/match (需 NestJS 运行在 8098)
 *  - 直连降级: 直连 PostgreSQL (api 不在线时自动切换)
 *  - manual降级: 以上都不可用
 */

import pg from 'pg'

const API_BASE = process.env.EMPOWER_API ?? 'http://127.0.0.1:8098/api/empower-cards'

interface EmpowerCard {
  id: string
  tag: string
  summary: string
  source: string
  freshness_score?: number
  confidence?: number
  quote_count?: number
  module_mapping?: string
  detail_url?: string
}

const poolConfig = {
  user: 'yaoyunzhong',
  host: '127.0.0.1',
  database: 'shenjiying',
  port: 5432,
  max: 1,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
}

/** 直连 PostgreSQL 查询 */
async function pgMatch(moduleName: string, keywords: string[]): Promise<EmpowerCard[]> {
  const pool = new pg.Pool(poolConfig)

  try {
    const moduleLike = `%${moduleName}%`
    let sql: string
    let params: any[]

    if (keywords.length > 0) {
      const conditions = [`module_mapping ILIKE $1`]
      const vals: string[] = [moduleLike]
      let idx = 2
      for (const kw of keywords) {
        conditions.push(`(summary ILIKE $${idx} OR module_mapping ILIKE $${idx})`)
        vals.push(`%${kw}%`)
        idx++
      }
      sql = `SELECT * FROM empower_card WHERE ${conditions.join(' AND ')} ORDER BY freshness_score * 0.3 + confidence * 0.2 + quote_count * 0.1 DESC LIMIT 3`
      params = vals
    } else {
      sql = `SELECT * FROM empower_card WHERE module_mapping ILIKE $1 ORDER BY freshness_score DESC, quote_count DESC LIMIT 3`
      params = [moduleLike]
    }

    const result = await pool.query(sql, params)
    return result.rows
  } finally {
    await pool.end()
  }
}

/** 补充通用知识（当匹配不足3条时） */
async function pgFallback(count: number): Promise<EmpowerCard[]> {
  const pool = new pg.Pool(poolConfig)
  try {
    const result = await pool.query(
      `SELECT * FROM empower_card ORDER BY freshness_score DESC, quote_count DESC LIMIT $1`,
      [count]
    )
    return result.rows
  } finally {
    await pool.end()
  }
}

function formatCard(c: EmpowerCard, i: number): string {
  const tag = c.tag || '一般'
  const freshness = c.freshness_score ?? 85
  const confidence = c.confidence ?? 70
  const source = c.source || '内部知识库'
  const quotes = c.quote_count ?? 0
  const moduleMap = c.module_mapping ? ` (关联: ${c.module_mapping})` : ''
  return `  ${i + 1}. [${tag}] ${c.summary}${moduleMap}
     (${source}, 新鲜度${freshness}/可信度${confidence}, 已引用${quotes}次)`
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.error('用法: tsx scripts/dispatch-knowledge.ts <模块名> [关键词...]')
    console.error('  示例: tsx scripts/dispatch-knowledge.ts storefront 动态路由 三态')
    process.exit(1)
  }

  const moduleName = args[0]
  const keywords = args.slice(1)

  console.log(`🎯 关联模块: ${moduleName} ${keywords.length > 0 ? `(关键词: ${keywords.join(', ')})` : ''}`)
  console.log('')

  let cards: EmpowerCard[] = []

  // ── 模式1: API 优先 ──
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const res = await fetch(`${API_BASE}/match`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ module: moduleName, keywords }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.ok) {
      cards = await res.json()
      console.log('📡 模式: API 自动检索')
    } else {
      throw new Error(`API ${res.status}`)
    }
  } catch (_1: any) {
    console.log(`  API不可用: ${_1?.message || _1}`)
  }

  // ── 模式2: 直连 PostgreSQL ──
  if (cards.length === 0) {
    try {
      console.log('  → 尝试数据库直连...')
      cards = await pgMatch(moduleName, keywords)
      if (cards.length > 0) console.log('📡 模式: 数据库直连')
    } catch (_2: any) {
      console.log(`  数据库直连失败: ${_2?.message || _2}`)
    }
  }

  // ── 补充不足3条 ──
  if (cards.length > 0 && cards.length < 3) {
    try {
      const extras = await pgFallback(3 - cards.length)
      cards.push(...extras)
    } catch (_3: any) {
      console.log(`  补充失败: ${_3?.message || _3}`)
    }
  }

  // ── 输出 ──
  if (cards.length === 0) {
    console.log('⚠️  未匹配到知识卡片')
    console.log('---')
    console.log('📚 知识赋能参考（降级·manual）:')
    console.log('- [标签] 摘要内容 (来源, 新鲜度分)')
    console.log('---')
    process.exit(0)
  }

  console.log(`📚 知识赋能参考（自动检索·${cards.length}条）:`)
  console.log('')
  for (let i = 0; i < cards.length; i++) {
    console.log(formatCard(cards[i], i))
    if (i < cards.length - 1) console.log('')
  }
  console.log('')
  console.log('---')
  console.log('↑ 复制上段到派单 prompt 末尾')
}

main().catch((err) => {
  console.error('❌ 脚本错误:', err)
  process.exit(1)
})
