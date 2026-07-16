/**
 * 知识库统计API — Knowledge Base Stats
 * 返回DB中知识库的概览统计
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  try {
    const { Pool } = await import('pg')
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying',
      max: 5,
    })

    const [countResult, kindResult, recentResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM knowledge_documents'),
      pool.query('SELECT kind, COUNT(*) as cnt FROM knowledge_documents GROUP BY kind ORDER BY cnt DESC'),
      pool.query('SELECT title, kind, created_at FROM knowledge_documents ORDER BY created_at DESC LIMIT 5'),
    ])

    await pool.end()

    return NextResponse.json({
      success: true,
      data: {
        totalDocuments: parseInt(String(countResult.rows[0]?.count || '0'), 10),
        byKind: kindResult.rows.map((r: any) => ({ kind: r.kind, count: parseInt(r.cnt, 10) })),
        recentEntries: recentResult.rows.map((r: any) => ({
          title: r.title,
          kind: r.kind,
          createdAt: r.created_at,
        })),
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: `Stats failed: ${error.message}`,
    }, { status: 500 })
  }
}
