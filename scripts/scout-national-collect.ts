/**
 * scout-national-collect.ts — 侦察兵全国采集脚本
 *
 * 功能:
 * 1. 按城市tier轮询采集(5层采集流程: L1→L5)
 * 2. 数据同时写入 PostgreSQL (scout_cities / scout_collection_logs / competitor_venues)
 * 3. 数据同步写入 competitive-intelligence.md 知识库
 * 4. 中断恢复(记录采集进度到 scout_collection_logs)
 * 5. 限流控制(每城≥5分钟间隔)
 *
 * 用法:
 *   npx ts-node --transpile-only scripts/scout-national-collect.ts --tier T1,T2    # 指定等级
 *   npx ts-node --transpile-only scripts/scout-national-collect.ts --resume        # 中断恢复
 *   npx ts-node --transpile-only scripts/scout-national-collect.ts --weekly        # 周日全量更新
 *   npx ts-node --transpile-only scripts/scout-national-collect.ts --city 北京     # 单城采集
 *
 * 限制: platform_limit=5 时只覆盖5个核心平台; platform_limit=3 时只覆盖3个
 */

import { readFileSync, existsSync, appendFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'

// ============================================================================
// Config
// ============================================================================

const PROJECT_ROOT = join(__dirname, '..')
const KNOWLEDGE_DIR = join(PROJECT_ROOT, 'docs/knowledge')
const COMPETITIVE_FILE = join(KNOWLEDGE_DIR, 'competitive-intelligence.md')
const COMPETITIVE_ARCHIVE = join(KNOWLEDGE_DIR, 'archive', 'competitive-intelligence-archive.md')

const MIN_CITY_INTERVAL_MS = 5 * 60 * 1000 // 每城采集间隔 ≥5分钟
const MAX_RETRIES = 3 // 失败重试次数
const MAX_CONCURRENT_CITIES = 3 // 同时采集城市数

interface CityInfo {
  id: string
  name: string
  tier: string
  region: string
  priority: number
}

interface CollectResult {
  cityId: string
  cityName: string
  platform: string
  itemsCount: number
  status: 'completed' | 'partial' | 'failed'
  errors: string[]
}

// ============================================================================
// Database
// ============================================================================

function loadEnv(): string {
  const envPath = join(PROJECT_ROOT, '.env')
  if (!existsSync(envPath)) {
    console.warn('⚠️  .env not found, using default local connection')
    return 'postgresql://postgres:postgres@127.0.0.1:5432/shenjiying'
  }
  const content = readFileSync(envPath, 'utf-8')
  let match = content.match(/POSTGRES_URL=(.+)/)
  if (!match) match = content.match(/DATABASE_URL=(.+)/)
  if (!match) return 'postgresql://postgres:postgres@127.0.0.1:5432/shenjiying'
  return match[1].trim().replace(/\\*\\*/g, '')
}

async function createPool(): Promise<Pool> {
  const url = loadEnv()
  const pool = new Pool({ connectionString: url })
  try {
    await pool.query('SELECT 1')
    console.log('✅  Database connected')
  } catch (e: any) {
    console.error(`❌  Cannot connect to database: ${e.message}`)
    console.log('   DB_URL:', url.replace(/\/\/.*@/, '//***@'))
    await pool.end()
    process.exit(1)
  }
  return pool
}

async function ensureMigration(pool: Pool): Promise<void> {
  const migrationPath = join(
    PROJECT_ROOT,
    'apps/api/src/database/migrations/20260712_create_scout_national_tables.sql'
  )
  if (existsSync(migrationPath)) {
    console.log('⏳  Running scout national migration...')
    const sql = readFileSync(migrationPath, 'utf-8')
    // Split by semicolons but preserve BEGIN/COMMIT blocks
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT')
    for (const stmt of statements) {
      try {
        await pool.query(stmt + ';')
      } catch (e: any) {
        if (!e.message?.includes('already exists') && !e.message?.includes('duplicate key')) {
          console.warn(`   [migration] ${e.message?.slice(0, 100)}`)
        }
      }
    }
    console.log('✅  Scout national migration applied/verified')
  }
}

// ============================================================================
// City Operations
// ============================================================================

async function getCitiesForCollection(pool: Pool, tierFilter?: string[]): Promise<CityInfo[]> {
  let query = `SELECT id, name, tier, region, priority FROM scout_cities WHERE status = 'active'`
  const params: string[] = []

  if (tierFilter && tierFilter.length > 0) {
    query += ` AND tier = ANY($1::text[])`
    params.push(JSON.stringify(tierFilter))
  }

  query += ` ORDER BY priority DESC, name ASC`
  const result = await pool.query(query, params.length > 0 ? [tierFilter] : [])
  return result.rows
}

async function getLastCollectionTime(pool: Pool, cityId: string): Promise<Date | null> {
  const result = await pool.query(
    `SELECT completed_at FROM scout_collection_logs
     WHERE city_id = $1 AND status = 'completed'
     ORDER BY completed_at DESC LIMIT 1`,
    [cityId]
  )
  return result.rows.length > 0 ? result.rows[0].completed_at : null
}

function canCollect(lastTime: Date | null): boolean {
  if (!lastTime) return true
  return Date.now() - lastTime.getTime() >= MIN_CITY_INTERVAL_MS
}

async function createBatchLog(
  pool: Pool,
  cityId: string,
  platform: string,
  isResume: boolean,
  resumeFrom?: string
): Promise<{ batchNo: string; logId: string }> {
  const city = (await pool.query('SELECT name FROM scout_cities WHERE id = $1', [cityId])).rows[0]
  const now = new Date()
  const batchNo = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}-${city?.name || cityId.slice(0, 8)}`

  const result = await pool.query(
    `INSERT INTO scout_collection_logs (city_id, batch_no, platform, status, is_resume, resume_from, started_at)
     VALUES ($1, $2, $3, 'running', $4, $5::uuid, NOW())
     RETURNING id`,
    [cityId, batchNo, platform, isResume, resumeFrom || null]
  )

  return { batchNo, logId: result.rows[0].id }
}

async function completeBatchLog(
  pool: Pool,
  logId: string,
  status: 'completed' | 'partial' | 'failed',
  itemsCount: number,
  errors: string[]
): Promise<void> {
  await pool.query(
    `UPDATE scout_collection_logs
     SET status = $1, items_count = $2, error_log = $3::jsonb, completed_at = NOW()
     WHERE id = $4`,
    [status, itemsCount, JSON.stringify(errors.map(e => ({ time: new Date().toISOString(), error: e }))), logId]
  )

  // Update city's last_collected
  await pool.query(
    `UPDATE scout_cities SET last_collected = NOW() WHERE id = (SELECT city_id FROM scout_collection_logs WHERE id = $1)`,
    [logId]
  )
}

async function findUnfinishedBatch(pool: Pool): Promise<{ logId: string; cityId: string; batchNo: string; platform: string } | null> {
  const result = await pool.query(
    `SELECT id, city_id, batch_no, platform FROM scout_collection_logs
     WHERE status = 'running'
     ORDER BY started_at ASC LIMIT 1`
  )
  return result.rows.length > 0 ? result.rows[0] : null
}

// ============================================================================
// Simulated Collection (Platform Scraping Logic)
// ============================================================================

/**
 * 模拟采集. 实际使用时应替换为真实的平台API/爬虫调用.
 *
 * 5层采集:
 *   L1 — 榜单爬取(抖音/美团) → 新店发现
 *   L2 — 平台深度比对(大众点评/小红书) → 竞品档案
 *   L3 — 深度验证(天眼查/BOSS直聘) → 经营状态
 *   L4 — 全渠道校验(所有平台交叉) → 完整画像
 *   L5 — 暗访(实地/电话) → 人工验证
 *
 * 8平台: 抖音·美团·大众点评·小红书·猫眼·携程·天眼查·BOSS直聘
 */
const PLATFORMS = ['抖音', '美团', '大众点评', '小红书', '猫眼', '携程', '天眼查', 'BOSS直聘'] as const
type Platform = typeof PLATFORMS[number]

function getPlatformsForTier(tier: string, platformLimit?: number): readonly string[] {
  switch (tier) {
    case 'T1': return platformLimit && platformLimit < 8 ? PLATFORMS.slice(0, platformLimit) : PLATFORMS
    case 'T2': return platformLimit && platformLimit < 5 ? ['抖音', '美团', '大众点评', '小红书', '天眼查'].slice(0, platformLimit) : ['抖音', '美团', '大众点评', '小红书', '天眼查']
    case 'T3': return platformLimit && platformLimit < 3 ? ['抖音', '美团', '大众点评'].slice(0, platformLimit) : ['抖音', '美团', '大众点评']
    default: return ['抖音', '美团']
  }
}

function getExpectedItemsPerPlatform(tier: string): number {
  switch (tier) {
    case 'T1': return 20
    case 'T2': return 12
    case 'T3': return 8
    default: return 5
  }
}

/**
 * 模拟对单个平台的数据采集.
 * 生产环境应替换为:
 *   - 抖音 openAPI / 爬虫 → 团购详情/门店页
 *   - 美团 openAPI → 团购页/评价/销量
 *   - 大众点评 → 评价/评分/排名
 *   - 小红书 → 种草内容/笔记
 *   - 猫眼 → 赛事/活动
 *   - 携程 → 旅游客群/门票
 *   - 天眼查 → 工商信息
 *   - BOSS直聘 → 招聘动态/经营状态
 */
async function collectPlatformData(
  city: CityInfo,
  platform: string,
  level: number // 1-5 对应 L1-L5
): Promise<{ items: any[]; errors: string[] }> {
  const errors: string[] = []
  const items: any[] = []

  try {
    // 模拟采集耗时 (实际调用平台API)
    const delayMs = 500 + Math.random() * 2000
    await new Promise(resolve => setTimeout(resolve, delayMs))

    if (Math.random() < 0.05) {
      // 5%概率模拟失败
      errors.push(`${platform}: 请求超时或限流`)
      return { items: [], errors }
    }

    // 返回模拟数据
    const count = Math.floor(Math.random() * getExpectedItemsPerPlatform(city.tier)) + 2
    for (let i = 0; i < count; i++) {
      items.push({
        city: city.name,
        city_tier: city.tier,
        region: city.region,
        venue_name: `模拟场馆_${city.name}_${platform}_${i + 1}`,
        venue_type: ['电玩城', '游乐场', '亲子乐园', '潮玩馆'][Math.floor(Math.random() * 4)],
        source_platform: platform,
        collection_level: `L${level}`,
        data_9dims: {
          price_range: `¥${10 + Math.floor(Math.random() * 90)}-${30 + Math.floor(Math.random() * 170)}`,
          score: (3.5 + Math.random() * 1.5).toFixed(1),
          review_count: Math.floor(Math.random() * 500),
          has_membership: Math.random() > 0.3,
          device_types: ['抓娃娃', '赛车', '射击', '音乐', 'VR'],
          activity_level: Math.random() > 0.5 ? 'high' : 'medium',
          social_heat: Math.floor(Math.random() * 1000),
          recruitment_active: Math.random() > 0.6,
          business_status: Math.random() > 0.05 ? 'normal' : 'under_review'
        },
        scout_notes: `${city.name}${platform}采集 L${level} #${new Date().toISOString()}`
      })
    }

    console.log(`   ✅  ${city.name} / ${platform} / L${level}: ${items.length} items`)
  } catch (e: any) {
    errors.push(`${platform}: ${e.message}`)
  }

  return { items, errors }
}

// ============================================================================
// Knowledge Base Sync
// ============================================================================

function formatDate(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateFull(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function syncToCompetitiveKB(content: string, isWeekly: boolean): void {
  const now = new Date()
  const cityInfo = content.split('\n').filter(l => l.includes('|'))
  const todayStr = formatDateFull(now)

  let appendContent = `\n\n### 全国采集更新 (${todayStr})\n`

  if (isWeekly) {
    appendContent += `**🔄 周日全量周更新**\n\n`
    appendContent += `| 城市 | 等级 | 采集时间 | 采集平台 | 场馆数 | 状态 |\n`
    appendContent += `|:----:|:----:|:--------:|:--------:|:------:|:----:|\n`
  } else {
    appendContent += `**🕐 日常采集增量**\n\n`
    appendContent += `| 城市 | 等级 | 采集时间 | 场馆数 | 状态 |\n`
    appendContent += `|:----:|:----:|:--------:|:------:|:----:|\n`
  }

  // 提取城市采集结果添加到KB
  const lines = content.split('\n')
  for (const line of lines) {
    const match = line.match(/\[采集完成\]\s+(.+?)\s+\|\s+(T\d)/)
    if (match) {
      const cityName = match[1].trim()
      const tier = match[2]
      appendContent += `| ${cityName} | ${tier} | ${todayStr} | ✅ |\n`
    }
  }

  try {
    if (existsSync(COMPETITIVE_FILE)) {
      appendFileSync(COMPETITIVE_FILE, appendContent + '\n---\n')
      console.log(`✅  知识库同步: competitive-intelligence.md 已更新`)
    }
  } catch (e: any) {
    console.warn(`⚠️  知识库同步失败: ${e.message}`)
  }
}

function archiveMonthlyKB(force: boolean = false): void {
  try {
    if (!existsSync(COMPETITIVE_FILE)) return

    const now = new Date()
    const isLastDayOfMonth = now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    if (!force && !isLastDayOfMonth) return

    const content = readFileSync(COMPETITIVE_FILE, 'utf-8')
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    if (existsSync(COMPETITIVE_ARCHIVE)) {
      appendFileSync(COMPETITIVE_ARCHIVE, `\n\n---\n## 📦 月度归档: ${monthStr}\n\n${content}`)
    } else {
      writeFileSync(COMPETITIVE_ARCHIVE, `# 🕵️ 竞品情报数据库 - 归档层\n\n## 📦 月度归档: ${monthStr}\n\n${content}`)
    }

    console.log(`✅  月度归档完成: competitive-intelligence-archive.md (${monthStr})`)
  } catch (e: any) {
    console.warn(`⚠️  月度归档失败: ${e.message}`)
  }
}

// ============================================================================
// Main Collection Logic
// ============================================================================

async function collectCity(
  pool: Pool,
  city: CityInfo,
  platformLimit?: number
): Promise<CollectResult[]> {
  const results: CollectResult[] = []
  const platforms = getPlatformsForTier(city.tier, platformLimit)

  // L1 榜单采集
  console.log(`\n📡 采集 [${city.tier}] ${city.name}`)
  console.log(`   平台: ${platforms.join(', ')}`)

  for (const platform of platforms) {
    const isResume = false
    const batch = await createBatchLog(pool, city.id, platform, isResume)
    let allErrors: string[] = []
    let totalItems: any[] = []
    let finalStatus: 'completed' | 'partial' | 'failed' = 'completed'

    // L1+L2 循环 (每日/周级别)
    for (let level = 1; level <= 3; level++) {
      const { items, errors } = await collectPlatformData(city, platform, level)
      totalItems.push(...items)
      allErrors.push(...errors)
    }

    // 写入 competitor_venues
    for (const item of totalItems) {
      try {
        await pool.query(
          `INSERT INTO competitor_venues
           (city, venue_name, venue_type, source_platform, data_9dims, scout_notes, region, city_tier, collection_batch, scout_updated_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, NOW())
           ON CONFLICT (city, venue_name)
           DO UPDATE SET
             source_platform = EXCLUDED.source_platform,
             data_9dims = EXCLUDED.data_9dims,
             scout_notes = EXCLUDED.scout_notes,
             region = EXCLUDED.region,
             city_tier = EXCLUDED.city_tier,
             collection_batch = EXCLUDED.collection_batch,
             scout_updated_at = NOW()`,
          [
            item.city, item.venue_name, item.venue_type,
            item.source_platform, JSON.stringify(item.data_9dims),
            item.scout_notes, item.region, item.city_tier,
            batch.batchNo
          ]
        )
      } catch (e: any) {
        allErrors.push(`DB写入[${item.venue_name}]: ${e.message.slice(0, 100)}`)
      }
    }

    if (allErrors.length > 0) {
      finalStatus = totalItems.length > 0 ? 'partial' : 'failed'
    }

    await completeBatchLog(pool, batch.logId, finalStatus, totalItems.length, allErrors)

    results.push({
      cityId: city.id,
      cityName: city.name,
      platform,
      itemsCount: totalItems.length,
      status: finalStatus,
      errors: allErrors
    })

    // 平台间限流延迟
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
  }

  return results
}

async function runWeeklyUpdate(pool: Pool): Promise<void> {
  console.log('\n🔄 ===== 周日全量周更新 =====')
  const cities = await getCitiesForCollection(pool)

  for (const city of cities) {
    if (!canCollect(await getLastCollectionTime(pool, city.id))) {
      console.log(`⏸️  跳过 ${city.name} (低于5分钟间隔)`)
      continue
    }
    await collectCity(pool, city)
  }

  // 全量同步到知识库
  console.log('\n📝 同步到 competitive-intelligence.md ...')
  syncToCompetitiveKB(`[采集完成] 全量周更新 | T1-T3\n`, true)

  // 检查是否为月末
  archiveMonthlyKB()
}

// ============================================================================
// CLI Entry
// ============================================================================

interface CliArgs {
  tier: string[] | null
  resume: boolean
  weekly: boolean
  city: string | null
  platformLimit: number | null
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)
  const result: CliArgs = { tier: null, resume: false, weekly: false, city: null, platformLimit: null }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--tier':
        result.tier = (args[++i] || '').split(',').map(s => s.trim().toUpperCase())
        break
      case '--resume':
        result.resume = true
        break
      case '--weekly':
        result.weekly = true
        break
      case '--city':
        result.city = args[++i] || null
        break
      case '--platform-limit':
        result.platformLimit = parseInt(args[++i], 10) || null
        break
    }
  }

  return result
}

async function main() {
  console.log('🕵️  侦察兵全国采集脚本')
  console.log(`    PROJECT_ROOT: ${PROJECT_ROOT}`)
  console.log(`    运行时间: ${new Date().toISOString()}`)

  const args = parseArgs()
  console.log(`    CLI参数: tier=${args.tier?.join(',') || 'all'} resume=${args.resume} weekly=${args.weekly} city=${args.city || 'all'}`)

  // 连接数据库
  const pool = await createPool()

  // 确保迁移已应用
  await ensureMigration(pool)

  try {
    // 中断恢复
    if (args.resume) {
      const unfinished = await findUnfinishedBatch(pool)
      if (unfinished) {
        console.log(`\n⏯️  发现未完成批次: ${unfinished.batch_no} (${unfinished.platform})`)
        const city = (await pool.query('SELECT * FROM scout_cities WHERE id = $1', [unfinished.cityId])).rows[0]
        if (city) {
          console.log(`续采城市: ${city.name}`)
          // 创建新的续采批次
          const newBatch = await createBatchLog(pool, city.id, unfinished.platform, true, unfinished.logId)
          // 重试采集
          const { items, errors } = await collectPlatformData(city, unfinished.platform, 3)
          // 写入DB
          for (const item of items) {
            await pool.query(
              `INSERT INTO competitor_venues (city, venue_name, venue_type, source_platform, data_9dims, scout_notes, region, city_tier, collection_batch, scout_updated_at)
               VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, NOW())
               ON CONFLICT (city, venue_name) DO UPDATE SET scout_updated_at = NOW()`,
              [item.city, item.venue_name, item.venue_type, item.source_platform,
               JSON.stringify(item.data_9dims), item.scout_notes, item.region,
               item.city_tier, newBatch.batchNo]
            )
          }
          await completeBatchLog(pool, newBatch.logId, items.length > 0 ? 'completed' : 'failed', items.length, errors)
          console.log(`✅  续采完成: ${city.name} / ${items.length} items`)
        }
      } else {
        console.log('ℹ️  没有未完成的批次需要恢复')
      }
    }

    // 全量周更新
    if (args.weekly) {
      await runWeeklyUpdate(pool)
      console.log('\n✅ 周日全量周更新完成')
      await pool.end()
      return
    }

    // 单城采集
    if (args.city) {
      const cities = await pool.query(
        `SELECT * FROM scout_cities WHERE name = $1 AND status = 'active'`,
        [args.city]
      )
      if (cities.rows.length === 0) {
        console.error(`❌  未找到城市: ${args.city}`)
        await pool.end()
        process.exit(1)
      }
      const results = await collectCity(pool, cities.rows[0], args.platformLimit || undefined)

      // 同步知识库
      let kbContent = `[采集完成] ${args.city} | ${cities.rows[0].tier}\n`
      for (const r of results) {
        kbContent += `${r.platform}: ${r.itemsCount} items | ${r.status}\n`
      }
      syncToCompetitiveKB(kbContent, false)

      console.log(`\n✅  单城采集完成: ${args.city}`)
      await pool.end()
      return
    }

    // 按等级采集
    const cities = args.tier
      ? await pool.query(
          `SELECT * FROM scout_cities WHERE tier = ANY($1::text[]) AND status = 'active' ORDER BY priority DESC`,
          [args.tier]
        )
      : await pool.query(
          `SELECT * FROM scout_cities WHERE status = 'active' ORDER BY priority DESC`
        )

    console.log(`\n📋 待采集城市: ${cities.rows.length}`)
    let kbContent = ''

    for (const city of cities.rows) {
      // 限流检查
      const lastTime = await getLastCollectionTime(pool, city.id)
      if (!canCollect(lastTime)) {
        const waitMs = MIN_CITY_INTERVAL_MS - (Date.now() - (lastTime?.getTime() || 0))
        console.log(`⏸️  跳过 ${city.name} (需等待 ${Math.ceil(waitMs / 1000)}s)`)
        continue
      }

      const results = await collectCity(pool, city, args.platformLimit || undefined)
      kbContent += `[采集完成] ${city.name} | ${city.tier}\n`
      for (const r of results) {
        kbContent += `  ${r.platform}: ${r.itemsCount} items | ${r.status}\n`
      }

      // 城市间限流
      if (cities.rows.length > 1) {
        console.log(`   ⏳ 等待 ${Math.ceil(MIN_CITY_INTERVAL_MS / 1000)}s 城市间隔...`)
        await new Promise(resolve => setTimeout(resolve, MIN_CITY_INTERVAL_MS))
      }
    }

    // 同步知识库
    syncToCompetitiveKB(kbContent, false)

    // 月末归档检查
    archiveMonthlyKB()

    console.log(`\n✅ 采集完成`)

    // 打印汇总
    const summary = await pool.query(`
      SELECT
        COUNT(DISTINCT city_id) as cities_collected,
        SUM(items_count) as total_items,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_batches
      FROM scout_collection_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `)
    if (summary.rows.length > 0) {
      console.log(`   今日汇总: ${summary.rows[0].cities_collected || 0}城 / ${summary.rows[0].total_items || 0}条 / 失败${summary.rows[0].failed_batches || 0}批次`)
    }
  } catch (e: any) {
    console.error('❌  Fatal:', e.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
