/**
 * sync-kb-to-db.ts — 知识库md文件→数据库导入脚本
 *
 * 一次性脚本: 读取 docs/knowledge 下所有 md 文件(含archive/和expert-team/)
 * 导入到 knowledge_documents 表
 *
 * 用法: npx ts-node --transpile-only scripts/sync-kb-to-db.ts
 * 前置条件: PostgreSQL 运行中且 knowledge_documents 表已创建
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { Pool } from 'pg'

const PROJECT_ROOT = join(__dirname, '..')
const KNOWLEDGE_DIR = join(PROJECT_ROOT, 'docs/knowledge')

// 从 .env 读取 DATABASE_URL
function loadEnv(): string {
  const envPath = join(PROJECT_ROOT, '.env')
  if (!existsSync(envPath)) {
    console.warn('⚠️  .env not found, using default local connection')
    return 'postgresql://postgres:postgres@127.0.0.1:5432/shenjiying'
  }
  const content = readFileSync(envPath, 'utf-8')
  const match = content.match(/DATABASE_URL=(.+)/)
  if (!match) {
    console.warn('⚠️  DATABASE_URL not found in .env')
    return 'postgresql://postgres:postgres@127.0.0.1:5432/shenjiying'
  }
  return match[1].trim().replace(/\\*\\*/g, '') // remove ***
}

// 从路径推断 kind
function inferKind(relativePath: string): string {
  const lower = relativePath.toLowerCase()
  if (relativePath.includes('expert-team/')) return 'expert-brief'
  if (relativePath.includes('archive/')) return 'archive'
  if (lower.includes('evolution')) return 'doc'
  if (lower.includes('phase')) return 'phase-progress'
  if (lower.includes('daily-plan')) return 'daily-plan'
  if (lower.includes('daily-brief')) return 'daily-plan'
  if (lower.includes('competitor') || lower.includes('competitive')) return 'competitor'
  if (lower.includes('venue') || lower.includes('national')) return 'venue'
  if (lower.includes('pattern') || lower.includes('anti')) return 'pattern'
  if (lower.includes('lesson') || lower.includes('learning')) return 'lesson'
  if (lower.includes('spec')) return 'spec'
  if (lower.includes('decision')) return 'decision'
  return 'doc'
}

// 提取标题(第一行#号标题或文件名)
function extractTitle(filePath: string, content: string): string {
  const firstLine = content.split('\n')[0]
  if (firstLine.startsWith('# ')) {
    return firstLine.replace(/^#\s+/, '').trim()
  }
  return filePath.split('/').pop()?.replace('.md', '') ?? filePath
}

async function main() {
  console.log('📚 知识库md→DB同步脚本')
  console.log(`   PROJECT_ROOT: ${PROJECT_ROOT}`)
  console.log(`   KNOWLEDGE_DIR: ${KNOWLEDGE_DIR}`)

  if (!existsSync(KNOWLEDGE_DIR)) {
    console.error(`❌ Knowledge directory not found: ${KNOWLEDGE_DIR}`)
    process.exit(1)
  }

  // 连接 DB
  const url = loadEnv()
  console.log(`   Connecting to PostgreSQL...`)
  const pool = new Pool({ connectionString: url })

  try {
    await pool.query('SELECT 1')
    console.log('✅  Database connected')
  } catch (e: any) {
    console.error(`❌  Cannot connect to database: ${e.message}`)
    console.log('   Make sure PostgreSQL is running and DATABASE_URL is correct.')
    console.log('   DB_URL:', url.replace(/\/\/.*@/, '//***@'))
    await pool.end()
    process.exit(1)
  }

  // 创建迁移
  const migrationPath = join(PROJECT_ROOT, 'apps/api/src/database/migrations/20260711_create_knowledge_tables.sql')
  if (existsSync(migrationPath)) {
    console.log('   Running migration...')
    const sql = readFileSync(migrationPath, 'utf-8')
    const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'))
    for (const stmt of statements) {
      try { await pool.query(stmt + ';') } catch (e: any) {
        if (!e.message?.includes('already exists')) throw e
      }
    }
    console.log('✅  Migration applied')
  }

  // 递归扫描所有 md 文件
  function scanDir(dir: string, base: string): { path: string; relative: string }[] {
    const results: { path: string; relative: string }[] = []
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        const relPath = relative(base, fullPath)
        if (entry.isDirectory()) {
          results.push(...scanDir(fullPath, base))
        } else if (entry.name.endsWith('.md')) {
          results.push({ path: fullPath, relative: relPath })
        }
      }
    } catch { /* skip */ }
    return results
  }

  const files = scanDir(KNOWLEDGE_DIR, KNOWLEDGE_DIR)
  console.log(`   Found ${files.length} .md files`)

  // 逐文件导入
  let imported = 0
  let skipped = 0

  for (const file of files) {
    try {
      const content = readFileSync(file.path, 'utf-8').trim()
      if (!content) { skipped++; continue }

      const title = extractTitle(file.path, content)
      const kind = inferKind(file.relative)
      const isArchive = file.relative.includes('archive/')
      const tags = file.relative.split('/').filter(Boolean)

      // 检查是否已存在(按source_path去重)
      const existing = await pool.query(
        `SELECT id FROM knowledge_documents WHERE source_path = $1`,
        [file.relative]
      )

      if (existing.rows.length > 0) {
        // 更新
        await pool.query(
          `UPDATE knowledge_documents SET content = $1, title = $2, kind = $3, 
           tags = $4, is_archive = $5, updated_at = NOW()
           WHERE source_path = $6`,
          [content, title, kind, tags, isArchive, file.relative]
        )
      } else {
        // 插入
        await pool.query(
          `INSERT INTO knowledge_documents (source_path, title, kind, tags, content, is_archive)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [file.relative, title, kind, tags, content, isArchive]
        )
      }
      imported++
      if (imported % 20 === 0) process.stdout.write(`.`)
    } catch (e: any) {
      console.error(`\n❌  Error importing ${file.path}: ${e.message}`)
    }
  }

  console.log(`\n✅  Import complete: ${imported} imported, ${skipped} skipped`)

  // 验证
  const count = await pool.query('SELECT COUNT(*) FROM knowledge_documents')
  console.log(`   Total documents in DB: ${count.rows[0].count}`)

  await pool.end()
}

main().catch(e => {
  console.error('Fatal:', e)
  process.exit(1)
})
