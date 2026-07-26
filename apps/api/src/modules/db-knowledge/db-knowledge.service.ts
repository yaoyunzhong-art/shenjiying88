/**
 * db-knowledge.service.ts — 数据库知识库服务
 *
 * 提供对 knowledge_documents 表的 CRUD + 全文搜索
 * 作为 FileKnowledgeService 的替代,当 PostgreSQL 可用时自动切换
 *
 * 表: knowledge_documents | expert_profiles | acceptance_pulses
 *     pattern_records | phase_progress | daily_briefs
 *     competitor_venues | evolution_logs
 */

import { Injectable } from '@nestjs/common'
import { getPgPool } from '../../database/pg-pool'

const SHOULD_LOG_INIT_DEBUG = process.env.DEBUG_INIT_LOGS === '1'

// ── 类型定义 ─────────────────────────────────────────────

export interface KnowledgeDoc {
  id: string
  sourcePath: string
  title: string
  kind: string
  tags: string[]
  content: string
  summary?: string
  chunkCount: number
  isArchive: boolean
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface ExpertProfile {
  id: string
  code: string
  name: string
  groupId: string
  role: string
  specialization: string[]
  activePhases: string[]
  activityLevel: string
  insights: unknown[]
  learningNotes: unknown[]
  feedbackLog: unknown[]
  evolutionLog: unknown[]
}

export interface AcceptancePulse {
  id: string
  pulseNumber: number
  module: string
  status: string
  basePass: boolean
  servicePass: boolean
  controllerPass: boolean
  ctestPass: boolean
  streakCount: number
  fixCount: number
  closedPulse?: number
  createdAt: string
}

export interface PatternRecord {
  id: string
  patternType: 'anti-pattern' | 'positive-pattern'
  code: string
  title: string
  description: string
  discoveryDate: string
  rootCause?: string
  fixDescription?: string
  relatedPhases: string[]
  severity?: string
  resolved: boolean
}

export interface PhaseRecord {
  id: string
  phaseCode: string
  name: string
  owner: string
  deadline?: string
  completionPct: number
  status: string
  storeARequired: boolean
  frontendDone: boolean
  backendDone: boolean
  testDone: boolean
  acceptanceDone: boolean
  notes?: string
}

export interface DailyBrief {
  id: string
  date: string
  commits: number
  treeCommits: number
  lobsterCommits: number
  expertCommits: number
  acceptancePulses: number
  streakMax: number
  testsPass: number
  testsFail: number
  tscModules: number
  tscPassed: number
  cronsEnabled: number
  balance?: number
  summary?: string
  highlights: unknown[]
  issues: unknown[]
}

export interface CompetitorVenue {
  id: string
  city: string
  venueName: string
  venueType?: string
  sourcePlatform?: string
  data9dims: Record<string, unknown>
  scoutNotes?: string
}

export interface EvolutionLog {
  id: string
  date: string
  eventType: string
  title: string
  description: string
  rootCause?: string
  resolution?: string
  affectedCrons: string[]
}

export interface SearchResult {
  id: string
  sourcePath: string
  title: string
  kind: string
  content: string
  score: number
  summary?: string
}

// ── 服务 ────────────────────────────────────────────────

@Injectable()
export class DbKnowledgeService {
  private pool = getPgPool()
  private isAvailable = false

  constructor() {
    this.isAvailable = this.pool !== null
    if (this.isAvailable) {
      this.runMigration().catch(e =>
        console.warn('[DbKnowledgeService] Migration failed:', (e as Error).message)
      )
    }
  }

  /** 检查 DB 是否可用 */
  get available(): boolean {
    return this.isAvailable
  }

  /** 自动运行迁移 */
  private async runMigration(): Promise<void> {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const sql = fs.readFileSync(
      path.join(__dirname, '../../database/migrations/20260711_create_knowledge_tables.sql'),
      'utf-8'
    )
    const statements = this.splitSqlStatements(sql)
    for (const stmt of statements) {
      try {
        await this.pool!.query(stmt)
      } catch (e: unknown) {
        // 忽略 "already exists" 错误
        if (!(e as Error).message?.includes('already exists')) {
          throw e
        }
      }
    }
    if (SHOULD_LOG_INIT_DEBUG) {
      console.log('[DbKnowledgeService] ✅ Migration applied')
    }
  }

  /**
   * 按 SQL 语句拆分，保留 $$...$$ / $tag$...$tag$ 内部的分号。
   */
  private splitSqlStatements(sql: string): string[] {
    const statements: string[] = []
    let current = ''
    let dollarQuoteTag: string | null = null

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i]

      if (char === '$') {
        const rest = sql.slice(i)
        const match = rest.match(/^\$[A-Za-z0-9_]*\$/)
        if (match) {
          const tag = match[0]
          current += tag
          i += tag.length - 1
          if (dollarQuoteTag === tag) {
            dollarQuoteTag = null
          } else if (dollarQuoteTag === null) {
            dollarQuoteTag = tag
          }
          continue
        }
      }

      if (char === ';' && dollarQuoteTag === null) {
        const statement = current
          .split('\n')
          .filter(line => !line.trim().startsWith('--'))
          .join('\n')
          .trim()
        if (statement) {
          statements.push(statement + ';')
        }
        current = ''
        continue
      }

      current += char
    }

    const trailing = current
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim()
    if (trailing) {
      statements.push(trailing.endsWith(';') ? trailing : trailing + ';')
    }

    return statements
  }

  /** 全文搜索 */
  async search(query: string, kind?: string, limit = 10): Promise<SearchResult[]> {
    if (!this.isAvailable) return []
    let sql = `
      SELECT id, source_path, title, kind, content,
             ts_rank(to_tsvector('simple', content), plainto_tsquery('simple', $1)) AS score
      FROM knowledge_documents
      WHERE to_tsvector('simple', content) @@ plainto_tsquery('simple', $1)
    `
    const params: unknown[] = [query]
    if (kind) {
      sql += ` AND kind = $2`
      params.push(kind)
    }
    sql += ` ORDER BY score DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await this.pool!.query(sql, params)
    return result.rows.map((r: Record<string, unknown>) => ({
      id: r.id as string,
      sourcePath: r.source_path as string,
      title: r.title as string,
      kind: r.kind as string,
      content: (r.content as string).substring(0, 500),
      score: r.score as number,
    }))
  }

  /** 按种类查询文档 */
  async getDocumentsByKind(kind: string): Promise<KnowledgeDoc[]> {
    if (!this.isAvailable) return []
    const result = await this.pool!.query(
      `SELECT * FROM knowledge_documents WHERE kind = $1 ORDER BY updated_at DESC`,
      [kind]
    )
    return result.rows.map(this.mapDoc)
  }

  /** 查询所有专家 */
  async getExperts(groupId?: string): Promise<ExpertProfile[]> {
    if (!this.isAvailable) return []
    let sql = `SELECT * FROM expert_profiles`
    const params: unknown[] = []
    if (groupId) {
      sql += ` WHERE group_id = $1`
      params.push(groupId)
    }
    sql += ` ORDER BY code`
    const result = await this.pool!.query(sql, params)
    return result.rows.map(this.mapExpert)
  }

  /** 获取最近N条验收脉冲 */
  async getRecentPulses(limit = 20): Promise<AcceptancePulse[]> {
    if (!this.isAvailable) return []
    const result = await this.pool!.query(
      `SELECT * FROM acceptance_pulses ORDER BY pulse_number DESC LIMIT $1`,
      [limit]
    )
    return result.rows.map(this.mapPulse)
  }

  /** 获取所有活跃Phase */
  async getActivePhases(): Promise<PhaseRecord[]> {
    if (!this.isAvailable) return []
    const result = await this.pool!.query(
      `SELECT * FROM phase_progress WHERE status <> '✅' ORDER BY deadline ASC NULLS LAST`
    )
    return result.rows.map(this.mapPhase)
  }

  /** 获取反模式/正向模式 */
  async getPatterns(type?: 'anti-pattern' | 'positive-pattern'): Promise<PatternRecord[]> {
    if (!this.isAvailable) return []
    let sql = `SELECT * FROM pattern_records`
    const params: unknown[] = []
    if (type) {
      sql += ` WHERE pattern_type = $1`
      params.push(type)
    }
    sql += ` ORDER BY discovery_date DESC`
    const result = await this.pool!.query(sql, params)
    return result.rows.map(this.mapPattern)
  }

  /** 竞品数据: 按城市查询 */
  async getVenuesByCity(city: string): Promise<CompetitorVenue[]> {
    if (!this.isAvailable) return []
    const result = await this.pool!.query(
      `SELECT * FROM competitor_venues WHERE city = $1`,
      [city]
    )
    return result.rows.map(this.mapVenue)
  }

  /** 获取今日简报 */
  async getTodayBrief(): Promise<DailyBrief | null> {
    if (!this.isAvailable) return null
    const result = await this.pool!.query(
      `SELECT * FROM daily_briefs WHERE date = CURRENT_DATE LIMIT 1`
    )
    return result.rows.length ? this.mapBrief(result.rows[0]) : null
  }

  /** 记录搜索日志 */
  async logSearch(query: string, count: number, ms: number): Promise<void> {
    if (!this.isAvailable) return
    await this.pool!.query(
      `INSERT INTO knowledge_search_log (query_text, result_count, duration_ms) VALUES ($1, $2, $3)`,
      [query, count, ms]
    )
  }

  // ── 映射函数 ──

  private mapDoc(r: Record<string, unknown>): KnowledgeDoc {
    return {
      id: r.id as string,
      sourcePath: r.source_path as string,
      title: r.title as string,
      kind: r.kind as string,
      tags: r.tags as string[],
      content: r.content as string,
      summary: r.summary as string | undefined,
      chunkCount: r.chunk_count as number,
      isArchive: r.is_archive as boolean,
      metadata: r.metadata as Record<string, unknown>,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    }
  }

  private mapExpert(r: Record<string, unknown>): ExpertProfile {
    return {
      id: r.id as string,
      code: r.code as string,
      name: r.name as string,
      groupId: r.group_id as string,
      role: r.role as string,
      specialization: r.specialization as string[],
      activePhases: r.active_phases as string[],
      activityLevel: r.activity_level as string,
      insights: r.insights as unknown[],
      learningNotes: r.learning_notes as unknown[],
      feedbackLog: r.feedback_log as unknown[],
      evolutionLog: r.evolution_log as unknown[],
    }
  }

  private mapPulse(r: Record<string, unknown>): AcceptancePulse {
    return {
      id: r.id as string,
      pulseNumber: r.pulse_number as number,
      module: r.module as string,
      status: r.status as string,
      basePass: r.base_pass as boolean,
      servicePass: r.service_pass as boolean,
      controllerPass: r.controller_pass as boolean,
      ctestPass: r.ctest_pass as boolean,
      streakCount: r.streak_count as number,
      fixCount: r.fix_count as number,
      closedPulse: r.closed_pulse as number | undefined,
      createdAt: r.created_at as string,
    }
  }

  private mapPattern(r: Record<string, unknown>): PatternRecord {
    return {
      id: r.id as string,
      patternType: r.pattern_type as 'anti-pattern' | 'positive-pattern',
      code: r.code as string,
      title: r.title as string,
      description: r.description as string,
      discoveryDate: r.discovery_date as string,
      rootCause: r.root_cause as string | undefined,
      fixDescription: r.fix_description as string | undefined,
      relatedPhases: r.related_phases as string[],
      severity: r.severity as string | undefined,
      resolved: r.resolved as boolean,
    }
  }

  private mapPhase(r: Record<string, unknown>): PhaseRecord {
    return {
      id: r.id as string,
      phaseCode: r.phase_code as string,
      name: r.name as string,
      owner: r.owner as string,
      deadline: String(r.deadline ?? ''),
      completionPct: r.completion_pct as number,
      status: r.status as string,
      storeARequired: r.store_a_required as boolean,
      frontendDone: r.frontend_done as boolean,
      backendDone: r.backend_done as boolean,
      testDone: r.test_done as boolean,
      acceptanceDone: r.acceptance_done as boolean,
      notes: r.notes as string | undefined,
    }
  }

  private mapBrief(r: Record<string, unknown>): DailyBrief {
    return {
      id: r.id as string,
      date: r.date as string,
      commits: r.commits as number,
      treeCommits: r.tree_commits as number,
      lobsterCommits: r.lobster_commits as number,
      expertCommits: r.expert_commits as number,
      acceptancePulses: r.acceptance_pulses as number,
      streakMax: r.streak_max as number,
      testsPass: r.tests_pass as number,
      testsFail: r.tests_fail as number,
      tscModules: r.tsc_modules as number,
      tscPassed: r.tsc_passed as number,
      cronsEnabled: r.crons_enabled as number,
      balance: r.balance as number | undefined,
      summary: r.summary as string | undefined,
      highlights: r.highlights as unknown[],
      issues: r.issues as unknown[],
    }
  }

  private mapVenue(r: Record<string, unknown>): CompetitorVenue {
    return {
      id: r.id as string,
      city: r.city as string,
      venueName: r.venue_name as string,
      venueType: r.venue_type as string,
      sourcePlatform: r.source_platform as string | undefined,
      data9dims: r.data_9dims as Record<string, unknown>,
      scoutNotes: r.scout_notes as string | undefined,
    }
  }
}
