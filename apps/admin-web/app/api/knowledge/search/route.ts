/**
 * 知识库搜索路由 — Knowledge Base Search API
 * 
 * 提供对 PostgreSQL knowledge_documents 表的全文搜索
 * 100篇知识库数据已于2026-07-15入库
 */

import { NextRequest, NextResponse } from 'next/server'

interface SearchResult {
  id: string
  title: string
  kind: string
  tags: string[]
  summary: string
  score: number
  createdAt: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    tookMs: number
  }
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<SearchResult[]>>> {
  const startTime = Date.now()
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  const kind = searchParams.get('kind')?.trim() || undefined
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 50)
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
  const offset = (page - 1) * limit

  if (!query) {
    return NextResponse.json({
      success: false,
      error: 'Missing required parameter: q (search query)',
      meta: { total: 0, tookMs: Date.now() - startTime },
    }, { status: 400 })
  }

  try {
    const { Pool } = await import('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying',
      max: 5,
    })

    let sql = `
      SELECT id, title, kind, tags, summary,
             ts_rank(to_tsvector('simple', content), plainto_tsquery('simple', $1)) AS score,
             created_at
      FROM knowledge_documents
      WHERE to_tsvector('simple', content) @@ plainto_tsquery('simple', $1)
    `
    const params: any[] = [query]

    if (kind) {
      sql += ` AND kind = $${params.length + 1}`
      params.push(kind)
    }

    // 总结果数
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM')
    const countResult = await pool.query(countSql, params)
    const total = parseInt(countResult.rows[0]?.count || '0', 10)

    // 分页
    sql += ` ORDER BY score DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(sql, params)
    await pool.end()

    const data: SearchResult[] = result.rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      kind: r.kind,
      tags: r.tags || [],
      summary: r.summary || '',
      score: parseFloat(r.score) || 0,
      createdAt: r.created_at,
    }))

    return NextResponse.json({
      success: true,
      data,
      meta: { total, tookMs: Date.now() - startTime },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Search failed: ${error.message}`,
      meta: { total: 0, tookMs: Date.now() - startTime },
    }, { status: 500 })
  }
}
