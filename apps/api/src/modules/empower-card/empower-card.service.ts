/**
 * empower-card.service.ts — 赋能卡片业务层 (ADR-045 · PostgreSQL版)
 *
 * CRUD + 知识检索 + 引用计数 + 退化曲线
 * 使用 pg-pool 直接操作数据库
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { getPgPool } from '../../database/pg-pool'
import type { 
  CreateEmpowerCardDto, 
  EmpowerCardEntity, 
  EmpowerCardSearchQuery, 
  EmpowerCardSearchResult 
} from './empower-card.entity'

/** 启动时自动建表 */
const INIT_SQL = `
CREATE TABLE IF NOT EXISTS empower_card (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag             TEXT NOT NULL,
    summary         TEXT NOT NULL,
    source          TEXT NOT NULL,
    freshness_score INT DEFAULT 100,
    module_mapping  TEXT,
    quote_count     INT DEFAULT 0,
    last_quoted_at  TIMESTAMPTZ,
    confidence      INT DEFAULT 70,
    expert_vetted   BOOLEAN DEFAULT FALSE,
    detail_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empower_card_quote_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id         UUID NOT NULL REFERENCES empower_card(id) ON DELETE CASCADE,
    quoted_by       TEXT NOT NULL,
    quoted_at       TIMESTAMPTZ DEFAULT NOW(),
    task_name       TEXT NOT NULL,
    module_name     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_empower_card_tag ON empower_card (tag);
CREATE INDEX IF NOT EXISTS idx_empower_card_freshness ON empower_card (freshness_score DESC);
CREATE INDEX IF NOT EXISTS idx_empower_card_quotes ON empower_card (quote_count ASC);
CREATE INDEX IF NOT EXISTS idx_empower_quote_card ON empower_card_quote_log (card_id);
CREATE INDEX IF NOT EXISTS idx_empower_quote_date ON empower_card_quote_log (quoted_at DESC);
`

@Injectable()
export class EmpowerCardService {
  private readonly logger = new Logger(EmpowerCardService.name)
  private initialized = false

  private async ensureTable(): Promise<void> {
    if (this.initialized) return
    try {
      const pool = getPgPool()
      if (pool) {
        await pool.query(INIT_SQL)
        this.logger.log('empower_card 表就绪')
      } else {
        this.logger.warn('PostgreSQL 不可用，使用降级内存模式')
      }
    } catch (err) {
      this.logger.error('empower_card 建表失败', err)
    }
    this.initialized = true
  }

  private get pool() {
    return getPgPool()
  }

  // ── CRUD ──

  async create(dto: CreateEmpowerCardDto): Promise<EmpowerCardEntity> {
    await this.ensureTable()
    if (!this.pool) return this.createFallback(dto)

    const result = await this.pool.query(
      `INSERT INTO empower_card (tag, summary, source, module_mapping, detail_url) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.tag, dto.summary, dto.source, dto.moduleMapping ?? null, dto.detailUrl ?? null]
    )
    const card = result.rows[0]
    this.logger.log(`知识卡片创建: [${card.tag}] ${card.summary.substring(0, 40)}...`)
    return this.rowToEntity(card)
  }

  async getById(id: string): Promise<EmpowerCardEntity> {
    await this.ensureTable()
    if (!this.pool) {
      const fallback = this.fallbackStore.get(id)
      if (!fallback) throw new NotFoundException(`EmpowerCard ${id} not found`)
      return fallback
    }

    const result = await this.pool.query(
      'SELECT * FROM empower_card WHERE id = $1', [id]
    )
    if (!result.rows.length) throw new NotFoundException(`EmpowerCard ${id} not found`)
    return this.rowToEntity(result.rows[0])
  }

  async list(minFreshness = 0): Promise<EmpowerCardEntity[]> {
    await this.ensureTable()
    if (!this.pool) {
      return Array.from(this.fallbackStore.values())
        .filter(c => c.freshnessScore >= minFreshness)
        .sort((a, b) => b.freshnessScore - a.freshnessScore)
    }

    const result = await this.pool.query(
      'SELECT * FROM empower_card WHERE freshness_score >= $1 ORDER BY freshness_score DESC',
      [minFreshness]
    )
    return result.rows.map((r: any) => this.rowToEntity(r))
  }

  // ── 知识检索 ──

  async search(query: EmpowerCardSearchQuery): Promise<EmpowerCardSearchResult> {
    await this.ensureTable()
    const limit = query.limit ?? 3
    const minFresh = query.minFreshness ?? 50

    // 降级: 走 fallback store 匹配
    if (!this.pool) {
      let cards = Array.from(this.fallbackStore.values())
        .filter(c => c.freshnessScore >= minFresh)
      
      if (query.tag) cards = cards.filter(c => c.tag === query.tag)
      if (query.module) { const m: string = query.module; cards = cards.filter(c => c.moduleMapping?.includes(m)) }
      if (query.q) {
        const q: string = query.q.toLowerCase()
        cards = cards.filter(c => 
          c.summary.toLowerCase().includes(q) ||
          c.tag.toLowerCase().includes(q) ||
          (c.moduleMapping?.toLowerCase().includes(q) ?? false)
        )
      }

      cards.sort((a, b) => b.freshnessScore - a.freshnessScore || b.confidence - a.confidence || a.quoteCount - b.quoteCount)
      const limited = cards.slice(0, limit)
      return { cards: limited, total: limited.length }
    }
    const conditions: string[] = ['freshness_score >= $1']
    const params: any[] = [minFresh]
    let paramIdx = 2

    if (query.tag) {
      conditions.push(`tag = $${paramIdx++}`)
      params.push(query.tag)
    }
    if (query.module) {
      conditions.push(`module_mapping ILIKE $${paramIdx++}`)
      params.push(`%${query.module}%`)
    }
    if (query.q) {
      conditions.push(`(summary ILIKE $${paramIdx} OR tag ILIKE $${paramIdx} OR COALESCE(module_mapping, '') ILIKE $${paramIdx})`)
      params.push(`%${query.q}%`)
      paramIdx++
    }

    const where = conditions.join(' AND ')
    const sql = `SELECT * FROM empower_card WHERE ${where} ORDER BY freshness_score DESC, confidence DESC, quote_count ASC LIMIT ${limit}`
    
    const result = await this.pool.query(sql, params)
    const cards = result.rows.map((r: any) => this.rowToEntity(r))
    
    return { cards, total: cards.length }
  }

  async autoMatchForDispatch(moduleName: string, keywords: string[] = []): Promise<EmpowerCardEntity[]> {
    const result = await this.search({ module: moduleName, limit: 3, minFreshness: 50 })
    
    // 降级: 从 fallback 补充
    if (result.cards.length < 3) {
      const usedIds = new Set(result.cards.map(c => c.id))
      for (const [id, card] of this.fallbackStore) {
        if (usedIds.has(id)) continue
        result.cards.push(card)
        usedIds.add(id)
        if (result.cards.length >= 3) break
      }
    }

    if (result.cards.length < 3 && this.pool) {
      const usedIds = result.cards.map(c => `'${c.id}'`).join(',')
      const extras = await this.pool.query(
        `SELECT * FROM empower_card 
         WHERE id NOT IN (${usedIds || "'__none__'"}) 
           AND freshness_score >= 50 
           AND quote_count <= 1 
         ORDER BY freshness_score DESC 
         LIMIT ${3 - result.cards.length}`
      )
      result.cards.push(...extras.rows.map((r: any) => this.rowToEntity(r)))
    }
    
    return result.cards
  }

  // ── 引用日志 ──

  async recordQuote(cardId: string, taskName: string, moduleName: string, quotedBy: string): Promise<void> {
    await this.ensureTable()
    if (!this.pool) {
      // 降级: 更新 fallback store
      const card = this.fallbackStore.get(cardId)
      if (card) {
        card.quoteCount++
        card.lastQuotedAt = new Date().toISOString()
      }
      return
    }

    await this.pool.query(
      `UPDATE empower_card SET quote_count = quote_count + 1, last_quoted_at = NOW() WHERE id = $1`,
      [cardId]
    )
    await this.pool.query(
      `INSERT INTO empower_card_quote_log (card_id, task_name, module_name, quoted_by) VALUES ($1, $2, $3, $4)`,
      [cardId, taskName, moduleName, quotedBy]
    )
  }

  async getQuoteLog(sinceDays = 1): Promise<any[]> {
    await this.ensureTable()
    if (!this.pool) return []

    const result = await this.pool.query(
      `SELECT * FROM empower_card_quote_log WHERE quoted_at >= NOW() - INTERVAL '${sinceDays} days' ORDER BY quoted_at DESC LIMIT 100`
    )
    return result.rows
  }

  // ── 退化曲线 (F3) ──

  async applyDecay(): Promise<{ decayed: number; archived: number }> {
    await this.ensureTable()
    if (!this.pool) return { decayed: 0, archived: 0 }

    const decayResult = await this.pool.query(
      `UPDATE empower_card 
       SET freshness_score = GREATEST(freshness_score - 10, 0) 
       WHERE freshness_score > 20 
         AND (last_quoted_at IS NULL OR last_quoted_at < NOW() - INTERVAL '24 hours')`
    )

    const archiveResult = await this.pool.query(
      `DELETE FROM empower_card WHERE freshness_score < 20`
    )

    return { decayed: decayResult.rowCount ?? 0, archived: archiveResult.rowCount ?? 0 }
  }

  // ── 统计 ──

  async getTodayEmpowerScore(): Promise<{ score: number; quotes: number; newCards: number }> {
    await this.ensureTable()
    if (!this.pool) return { score: 0, quotes: 0, newCards: 0 }

    const quotesResult = await this.pool.query(
      `SELECT COUNT(*) as cnt FROM empower_card_quote_log WHERE quoted_at >= CURRENT_DATE`
    )
    const newCardsResult = await this.pool.query(
      `SELECT COUNT(*) as cnt FROM empower_card WHERE created_at >= CURRENT_DATE`
    )
    
    const quotes = parseInt(quotesResult.rows[0].cnt, 10)
    const newCards = parseInt(newCardsResult.rows[0].cnt, 10)

    return { score: quotes * 10 + newCards * 5, quotes, newCards }
  }

  // ── 批量导入(从usage-stats.md) ──

  async batchImport(cards: CreateEmpowerCardDto[]): Promise<number> {
    let count = 0
    for (const card of cards) {
      try { await this.create(card); count++ } catch { /* skip dup */ }
    }
    return count
  }

  // ── 降级: 内存模式 ──

  private fallbackStore = new Map<string, EmpowerCardEntity>()
  
  private createFallback(dto: CreateEmpowerCardDto): EmpowerCardEntity {
    const entity: EmpowerCardEntity = {
      id: crypto.randomUUID(),
      tag: dto.tag,
      summary: dto.summary,
      source: dto.source,
      freshnessScore: 100,
      moduleMapping: dto.moduleMapping ?? null,
      quoteCount: 0,
      lastQuotedAt: null,
      confidence: 70,
      expertVetted: false,
      detailUrl: dto.detailUrl ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.fallbackStore.set(entity.id, entity)
    return entity
  }

  // ── 辅助 ──

  private rowToEntity(row: any): EmpowerCardEntity {
    return {
      id: row.id,
      tag: row.tag,
      summary: row.summary,
      source: row.source,
      freshnessScore: row.freshness_score,
      moduleMapping: row.module_mapping,
      quoteCount: row.quote_count,
      lastQuotedAt: row.last_quoted_at?.toISOString?.() ?? row.last_quoted_at ?? null,
      confidence: row.confidence,
      expertVetted: row.expert_vetted,
      detailUrl: row.detail_url,
      createdAt: row.created_at?.toISOString?.() ?? row.created_at,
      updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    }
  }
}
