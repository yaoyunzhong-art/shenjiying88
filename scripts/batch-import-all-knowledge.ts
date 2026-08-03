/**
 * batch-import-all-knowledge.ts — 批量导入所有历史知识到 empower_card 数据库
 * 
 * 覆盖来源:
 *   S1 docs/knowledge/competitive-intelligence.md
 *   S2 docs/knowledge/adr/*.md
 *   S3 docs/knowledge/code-ringbeam-alignment.md
 *   S4 docs/knowledge/daily-brief.md
 *   S5 docs/knowledge/learning/daily-research-*.md
 *   S6 MEMORY.md (反模式AM + 正模式PP)
 * 
 * 用法: npx tsx scripts/batch-import-all-knowledge.ts
 * 或: node --import tsx scripts/batch-import-all-knowledge.ts
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { Pool } from 'pg'
import crypto from 'crypto'

const ROOT = resolve(__dirname, '..')

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgresql://yaoyunzhong@127.0.0.1:5432/shenjiying',
  max: 5,
})

interface CardDef {
  tag: string
  summary: string
  source: string
  moduleMapping: string | null
  confidence: number
  detailUrl: string | null
}

// ── 来源1: S1 竞品智能 ──
function extractFromCompetitorIntel(): CardDef[] {
  const md = readFileSync(resolve(ROOT, 'docs/knowledge/competitive-intelligence.md'), 'utf-8')
  const cards: CardDef[] = []

  // 提取关键洞察行 (带 "竞品" 或 "趋势" 或 "行业" 的段落)
  const lines = md.split('\n').filter(l => l.trim() && !l.startsWith('#'))
  const insights: string[] = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim()
    // 带数字/% 且含关键字的句子
    if (/[\d]+%|\d+亿|\d+万|渗透|占比|竞争|下沉|抖音|美团|小红书/.test(l) && l.length < 120) {
      insights.push(l.replace(/^-\s*\*{0,2}/, '').replace(/\*{0,2}$/, '').trim())
    }
  }

  // 去重并截断
  const seen = new Set<string>()
  for (const ins of insights) {
    const key = ins.substring(0, 30)
    if (seen.has(key)) continue
    seen.add(key)
    const summary = ins.length > 140 ? ins.substring(0, 137) + '...' : ins
    cards.push({
      tag: '竞品',
      summary,
      source: 'competitive-intelligence.md',
      moduleMapping: '竞品分析',
      confidence: 70,
      detailUrl: 'docs/knowledge/competitive-intelligence.md',
    })
  }

  console.log(`  📊 竞品智能: ${cards.length} 条`)
  return cards
}

// ── 来源2: S2 ADR 决策 ──
function extractFromAdr(): CardDef[] {
  const adrDir = resolve(ROOT, 'docs/knowledge/adr')
  const files: string[] = []
  try { files.push(...readdirSync(adrDir).filter(f => f.endsWith('.md') && !f.includes('archive'))) } catch { }

  const cards: CardDef[] = []
  for (const file of files) {
    const md = readFileSync(resolve(adrDir, file), 'utf-8')
    // 提取标题和状态
    const titleMatch = md.match(/^#\s*(ADR-\d+.*)$/m)
    const statusMatch = md.match(/状态[：:]\s*(.+)/)
    const tagMatch = md.match(/标签[：:]\s*(.+)/)
    const summaryMatch = md.match(/(?:背景|摘要)[：:]\s*(.{10,120})/)

    if (titleMatch) {
      const summary = summaryMatch?.[1]?.trim()?.substring(0, 100) ?? titleMatch[1].trim()
      const tag = tagMatch?.[1]?.includes('安全') ? '合规' :
                  tagMatch?.[1]?.includes('架构') ? '技术' : '技术'
      cards.push({
        tag,
        summary: summary.length > 140 ? summary.substring(0, 137) + '...' : summary,
        source: file,
        moduleMapping: tagMatch?.[1] || null,
        confidence: statusMatch?.[1]?.includes('实施') ? 95 : 80,
        detailUrl: `docs/knowledge/adr/${file}`,
      })
    }
  }

  console.log(`  📊 ADR决策: ${cards.length} 条`)
  return cards
}

// ── 来源3: S4+S5 反/正模式库 ──
function extractFromRingbeam(): CardDef[] {
  const md = readFileSync(resolve(ROOT, 'docs/knowledge/code-ringbeam-alignment.md'), 'utf-8')
  const cards: CardDef[] = []

  // 反模式 AM-xxx
  const amMatches = md.matchAll(/\| (AM-\d+)\s*\|(.+?)\s*\|/g)
  for (const m of amMatches) {
    cards.push({
      tag: '技术',
      summary: `反模式 ${m[1]}: ${m[2].trim().substring(0, 120)}`,
      source: 'code-ringbeam-alignment.md',
      moduleMapping: '全模块',
      confidence: 95,
      detailUrl: 'docs/knowledge/code-ringbeam-alignment.md',
    })
  }

  // 正向模式 PP-xxx
  const ppMatches = md.matchAll(/\| (PP-\d+)\s*\|(.+?)\s*\|/g)
  for (const m of ppMatches) {
    cards.push({
      tag: '技术',
      summary: `正向模式 ${m[1]}: ${m[2].trim().substring(0, 120)}`,
      source: 'code-ringbeam-alignment.md',
      moduleMapping: '全模块',
      confidence: 90,
      detailUrl: 'docs/knowledge/code-ringbeam-alignment.md',
    })
  }

  console.log(`  📊 反/正模式: ${cards.length} 条`)
  return cards
}

// ── 来源4: S6 每日简报 ──
function extractFromDailyBrief(): CardDef[] {
  try {
    const md = readFileSync(resolve(ROOT, 'docs/knowledge/daily-brief.md'), 'utf-8')
    const cards: CardDef[] = []
    const lines = md.split('\n')
    
    for (const l of lines) {
      const trimmed = l.trim()
      // 匹配关键指标行
      if (/[\d]+%|\d+\.\d+测试|\d+commits|\d+🏆|知识/.test(trimmed) && trimmed.length < 120 && trimmed.length > 10) {
        cards.push({
          tag: '技术',
          summary: trimmed.substring(0, 140),
          source: 'daily-brief.md',
          moduleMapping: null,
          confidence: 80,
          detailUrl: 'docs/knowledge/daily-brief.md',
        })
      }
    }
    console.log(`  📊 每日简报: ${cards.length} 条`)
    return cards
  } catch {
    return []
  }
}

// ── 来源5: 日采研究 ──
function extractFromDailyResearch(): CardDef[] {
  const researchDir = resolve(ROOT, 'docs/knowledge/learning')
  let files: string[] = []
  try { files = readdirSync(researchDir).filter(f => f.startsWith('daily-research') && f.endsWith('.md')) } catch { }

  const cards: CardDef[] = []
  for (const file of files) {
    const md = readFileSync(resolve(researchDir, file), 'utf-8')
    const blocks = md.split(/### |## /)
    
    for (const block of blocks) {
      const lines = block.split('\n').filter(l => l.trim())
      if (lines.length < 2) continue
      
      // 提取第一句话作为摘要
      const firstLine = lines[0].replace(/^[*\s]+/, '').trim()
      if (firstLine.length > 10 && firstLine.length < 120) {
        const hasPercent = /[\d]+%/.test(firstLine)
        cards.push({
          tag: hasPercent ? '用户' : '技术',
          summary: firstLine.substring(0, 140),
          source: file,
          moduleMapping: hasPercent ? '用户研究' : null,
          confidence: 70,
          detailUrl: `docs/knowledge/learning/${file}`,
        })
      }
    }
  }

  console.log(`  📊 日采研究: ${cards.length} 条`)
  return cards
}

// ── 来源6: MEMORY.md (反/正模式库+进化洞察) ──
function extractFromMemory(): CardDef[] {
  try {
    const md = readFileSync(resolve(ROOT, '../.openclaw/workspace/MEMORY.md'), 'utf-8')
  } catch {
    // fallback: 从 workspace 路径读
  }
  // 从 MEMORY.md 的内容模式中提取（已经在代码中有写好的反模式/正向模式表）
  // 使用已固化到项目文档中的 ringbeam-alignment 数据，不再重复
  return []
}

// ── 批量导入 ──
async function batchImport(cards: CardDef[]): Promise<{ imported: number; skipped: number }> {
  let imported = 0
  let skipped = 0

  for (const card of cards) {
    try {
      await pool.query(
        `INSERT INTO empower_card (tag, summary, source, module_mapping, confidence, detail_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [card.tag, card.summary, card.source, card.moduleMapping, card.confidence, card.detailUrl]
      )
      imported++
    } catch (err) {
      skipped++
      if (skipped <= 3) console.warn(`  ⚠️ 跳过: ${(err as Error).message.substring(0, 60)}`)
    }
  }

  return { imported, skipped }
}

async function main(): Promise<void> {
  console.log('📚 批量导入所有历史知识到 empower_card 数据库')
  console.log('='.repeat(50))

  const allCards: CardDef[] = [
    ...extractFromCompetitorIntel(),
    ...extractFromAdr(),
    ...extractFromRingbeam(),
    ...extractFromDailyBrief(),
    ...extractFromDailyResearch(),
  ]

  console.log(`\n📖 总计 ${allCards.length} 条知识待导入\n`)

  // 去重 (基于 summary 前30字符)
  const seen = new Set<string>()
  const unique = allCards.filter(c => {
    const key = c.summary.substring(0, 30)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`🎯 去重后 ${unique.length} 条唯一知识\n`)

  const { imported, skipped } = await batchImport(unique)
  
  console.log(`\n📊 导入结果:`)
  console.log(`  ✅ 成功: ${imported}`)
  console.log(`  ⚠️  跳过: ${skipped}`)

  const count = await pool.query('SELECT COUNT(*) FROM empower_card')
  console.log(`  📦 数据库总计: ${count.rows[0].count} 条`)

  await pool.end()
}

main().catch(err => { console.error(err); process.exit(1) })
