/**
 * generate-sitemap.ts — P-49 Sitemap 生成器 (数据库→XML)
 *
 * 用法: npx tsx scripts/generate-sitemap.ts [outputDir]
 * 默认输出到 apps/tob-web/public/
 *
 * 从 empower_card + 模拟门店数据生成索引sitemap
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// ─── 配置 ─────────────────────────────────────────────

const BASE_URL = 'https://domain.com'

interface SitemapEntry {
  loc: string
  lastmod: string
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority: number
}

// ─── 数据源 ────────────────────────────────────────────

/** 模拟门店 (PRD从数据库读取) */
function getStores(): SitemapEntry[] {
  return [
    { loc: `${BASE_URL}/stores/shanghai-xuhui`, lastmod: '2026-07-19', changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/stores/beijing-chaoyang`, lastmod: '2026-07-18', changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/stores/shenzhen-nanshan`, lastmod: '2026-07-17', changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/stores/chengdu-jinjiang`, lastmod: '2026-07-16', changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE_URL}/stores/guangzhou-tianhe`, lastmod: '2026-07-15', changefreq: 'weekly', priority: 0.8 },
  ]
}

/** 模拟活动 */
function getActivities(): SitemapEntry[] {
  return [
    { loc: `${BASE_URL}/activities/summer-2026`, lastmod: '2026-07-19', changefreq: 'daily', priority: 0.7 },
    { loc: `${BASE_URL}/activities/weekend-special`, lastmod: '2026-07-18', changefreq: 'daily', priority: 0.7 },
    { loc: `${BASE_URL}/deals/family-pack`, lastmod: '2026-07-19', changefreq: 'daily', priority: 0.6 },
  ]
}

/** 静态页面 */
function getStaticPages(): SitemapEntry[] {
  return [
    { loc: BASE_URL, lastmod: '2026-07-19', changefreq: 'daily', priority: 0.9 },
    { loc: `${BASE_URL}/about`, lastmod: '2026-06-01', changefreq: 'monthly', priority: 0.5 },
    { loc: `${BASE_URL}/faq`, lastmod: '2026-06-01', changefreq: 'monthly', priority: 0.4 },
    { loc: `${BASE_URL}/contact`, lastmod: '2026-06-01', changefreq: 'monthly', priority: 0.4 },
  ]
}

// ─── XML 生成 ─────────────────────────────────────────

function urlXml(entries: SitemapEntry[]): string {
  return entries.map(e => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`).join('\n')
}

function sitemapXml(entries: SitemapEntry[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlXml(entries)}
</urlset>`
}

function indexXml(children: { loc: string; lastmod: string }[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children.map(c => `  <sitemap>
    <loc>${c.loc}</loc>
    <lastmod>${c.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`
}

// ─── 主流程 ────────────────────────────────────────────

function main() {
  const outputDir = resolve(process.argv[2] || './apps/tob-web/public')
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })

  const stores = getStores()
  const activities = getActivities()
  const pages = getStaticPages()

  // 分索引
  writeFileSync(resolve(outputDir, 'sitemap-stores.xml'), sitemapXml(stores))
  writeFileSync(resolve(outputDir, 'sitemap-activities.xml'), sitemapXml(activities))
  writeFileSync(resolve(outputDir, 'sitemap-pages.xml'), sitemapXml(pages))

  // 索引文件
  const now = new Date().toISOString().split('T')[0]!
  writeFileSync(resolve(outputDir, 'sitemap.xml'), indexXml([
    { loc: `${BASE_URL}/sitemap-stores.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-activities.xml`, lastmod: now },
    { loc: `${BASE_URL}/sitemap-pages.xml`, lastmod: now },
  ]))

  const total = stores.length + activities.length + pages.length
  console.log(`✅ Sitemap 生成完成: ${total} URLs, ${3} 分索引 + 1 索引文件`)
  console.log(`   📍 ${outputDir}/sitemap.xml`)
  console.log(`   📍 ${outputDir}/sitemap-stores.xml (${stores.length} stores)`)
  console.log(`   📍 ${outputDir}/sitemap-activities.xml (${activities.length} activities)`)
  console.log(`   📍 ${outputDir}/sitemap-pages.xml (${pages.length} pages)`)
}

main()
