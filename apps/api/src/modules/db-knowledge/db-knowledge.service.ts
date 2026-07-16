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
        console.warn('[DbKnowledgeService] Migration failed:', e.message)
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
      } catch (e: any) {
        // 忽略 "already exists" 错误
        if (!e.message?.includes('already exists')) {
          throw e
        }
      }
    }
    console.log('[DbKnowledgeService] ✅ Migration applied')
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
    const params: any[] = [query]
    if (kind) {
      sql += ` AND kind = $2`
      params.push(kind)
    }
    sql += ` ORDER BY score DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await this.pool!.query(sql, params)
    return result.rows.map((r: any) => ({
      id: r.id,
      sourcePath: r.source_path,
      title: r.title,
      kind: r.kind,
      content: r.content.substring(0, 500),
      score: r.score,
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
    const params: any[] = []
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
    const params: any[] = []
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

  private mapDoc(r: any): KnowledgeDoc {
    return {
      id: r.id,
      sourcePath: r.source_path,
      title: r.title,
      kind: r.kind,
      tags: r.tags,
      content: r.content,
      summary: r.summary,
      chunkCount: r.chunk_count,
      isArchive: r.is_archive,
      metadata: r.metadata,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }
  }

  private mapExpert(r: any): ExpertProfile {
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      groupId: r.group_id,
      role: r.role,
      specialization: r.specialization,
      activePhases: r.active_phases,
      activityLevel: r.activity_level,
      insights: r.insights,
      learningNotes: r.learning_notes,
      feedbackLog: r.feedback_log,
      evolutionLog: r.evolution_log,
    }
  }

  private mapPulse(r: any): AcceptancePulse {
    return {
      id: r.id,
      pulseNumber: r.pulse_number,
      module: r.module,
      status: r.status,
      basePass: r.base_pass,
      servicePass: r.service_pass,
      controllerPass: r.controller_pass,
      ctestPass: r.ctest_pass,
      streakCount: r.streak_count,
      fixCount: r.fix_count,
      closedPulse: r.closed_pulse,
      createdAt: r.created_at,
    }
  }

  private mapPattern(r: any): PatternRecord {
    return {
      id: r.id,
      patternType: r.pattern_type,
      code: r.code,
      title: r.title,
      description: r.description,
      discoveryDate: r.discovery_date,
      rootCause: r.root_cause,
      fixDescription: r.fix_description,
      relatedPhases: r.related_phases,
      severity: r.severity,
      resolved: r.resolved,
    }
  }

  private mapPhase(r: any): PhaseRecord {
    return {
      id: r.id,
      phaseCode: r.phase_code,
      name: r.name,
      owner: r.owner,
      deadline: r.deadline,
      completionPct: r.completion_pct,
      status: r.status,
      storeARequired: r.store_a_required,
      frontendDone: r.frontend_done,
      backendDone: r.backend_done,
      testDone: r.test_done,
      acceptanceDone: r.acceptance_done,
      notes: r.notes,
    }
  }

  private mapBrief(r: any): DailyBrief {
    return {
      id: r.id,
      date: r.date,
      commits: r.commits,
      treeCommits: r.tree_commits,
      lobsterCommits: r.lobster_commits,
      expertCommits: r.expert_commits,
      acceptancePulses: r.acceptance_pulses,
      streakMax: r.streak_max,
      testsPass: r.tests_pass,
      testsFail: r.tests_fail,
      tscModules: r.tsc_modules,
      tscPassed: r.tsc_passed,
      cronsEnabled: r.crons_enabled,
      balance: r.balance,
      summary: r.summary,
      highlights: r.highlights,
      issues: r.issues,
    }
  }

  private mapVenue(r: any): CompetitorVenue {
    return {
      id: r.id,
      city: r.city,
      venueName: r.venue_name,
      venueType: r.venue_type,
      sourcePlatform: r.source_platform,
      data9dims: r.data_9dims,
      scoutNotes: r.scout_notes,
    }
  }
}
