/**
 * import-empower-cards.ts — 从 usage-stats.md 导入赋能卡片到数据库
 * 
 * 用法: npx tsx scripts/import-empower-cards.ts
 * 
 * ADR-045 科学知识体系V2 · R3→S2→S3 链路
 * 采集(usage-stats.md) → 结构化 → 数据库入库
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8098/api'

interface CardDef {
  tag: string
  summary: string
  source: string
  moduleMapping?: string
}

function parseCardsFromMd(): CardDef[] {
  const md = readFileSync(resolve(__dirname, '../docs/knowledge/usage-stats.md'), 'utf-8')
  const cards: CardDef[] = []
  
  // 解析活跃知识条目表格
  const lines = md.split('\n')
  let inTable = false
  for (const line of lines) {
    // 匹配表格行: | 1 | [标签] 摘要 | 来源 | 新鲜度 | 引用 | ...
    const match = line.match(/^\|\s*\d+\s*\|\s*\[([^\]]+)\]\s*(.+?)\s*\|\s*(.+?)\s*\|/)
    if (match) {
      const tag = match[1].trim()
      let summary = match[2].trim()
      const source = match[3].trim().replace(/\s*\|.*$/, '')
      
      // 截断摘要 ≤140字
      if (summary.length > 140) summary = summary.substring(0, 137) + '...'

      // 从来源推断 moduleMapping
      let moduleMapping: string | undefined
      if (tag === '技术') {
        if (summary.includes('P-38') || summary.includes('财务') || summary.includes('cost')) moduleMapping = 'P-38'
        else if (summary.includes('RLS') || summary.includes('NestJS')) moduleMapping = 'P-31'
        else if (summary.includes('Next.js') || summary.includes('React')) moduleMapping = 'storefront'
        else moduleMapping = '全模块'
      } else if (tag === '竞品') {
        moduleMapping = '竞品分析'
      } else if (tag === '用户') {
        moduleMapping = '用户研究'
      } else if (tag === '合规') {
        moduleMapping = '安全合规'
      } else if (tag === '市场') {
        moduleMapping = '市场分析'
      }

      cards.push({ tag, summary, source, moduleMapping })
    }
  }

  return cards
}

async function importCards(cards: CardDef[]): Promise<void> {
  let imported = 0
  let skipped = 0

  for (const card of cards) {
    try {
      const res = await fetch(`${API_BASE}/empower-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: card.tag,
          summary: card.summary,
          source: card.source,
          moduleMapping: card.moduleMapping,
        }),
      })
      if (res.ok) {
        imported++
        console.log(`✅ [${card.tag}] ${card.summary.substring(0, 50)}...`)
      } else {
        const body = await res.text()
        console.warn(`⚠️  跳过 [${card.tag}] ${card.summary.substring(0, 50)}... (${res.status}: ${body.substring(0, 60)})`)
        skipped++
      }
    } catch (err) {
      console.error(`❌ 失败 [${card.tag}] ${card.summary.substring(0, 50)}...`, (err as Error).message)
      skipped++
    }
  }

  console.log(`\n📊 导入完成: ${imported} 成功 / ${skipped} 跳过`)
}

async function main(): Promise<void> {
  console.log('📚 赋能卡片导入工具 (ADR-045 R3→S2)')
  console.log('='.repeat(50))
  
  const cards = parseCardsFromMd()
  console.log(`\n📖 从 usage-stats.md 解析到 ${cards.length} 条知识\n`)
  
  cards.forEach((c, i) => console.log(`  ${i + 1}. [${c.tag}] ${c.summary.substring(0, 60)}... → ${c.moduleMapping || '通用'}`))
  
  console.log('\n--- 开始导入到数据库 ---\n')
  await importCards(cards)
}

main().catch(console.error)
