/**
 * import-national-venues.ts — 全国场馆+竞品数据导入脚本
 *
 * 用法: npx ts-node --transpile-only scripts/import-national-venues.ts
 * 功能: 读取 docs/knowledge/ 下数据文件 → venues + competitor_* 表
 *       事务写入 + 回滚 + 导入日志
 */

import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { Pool } from 'pg'

const PROJECT_ROOT = join(__dirname, '..')
const KNOWLEDGE_DIR = join(PROJECT_ROOT, 'docs/knowledge')
const BATCH_NO = new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' +
                 new Date().toTimeString().slice(0,8).replace(/:/g,'') + '-' + 'import'

function loadEnv(): string {
  const envPath = join(PROJECT_ROOT, '.env')
  if (!existsSync(envPath)) return 'postgresql://postgres:postgres@127.0.0.1:5432/shenjiying'
  const c = readFileSync(envPath, 'utf-8')
  let m = c.match(/POSTGRES_URL=(.+)/)
  if (!m) m = c.match(/DATABASE_URL=(.+)/)
  return m ? m[1].trim().replace(/\\*\\*/g,'') : 'postgresql://postgres:postgres@127.0.0.1:5432/shenjiying'
}

interface VenueRow {
  name: string; city?: string; city_tier?: string; region?: string
  category?: string; status?: string; source?: string; rating?: number
  review_count?: number; tags?: string[]
}

interface PriceRow { venue_id: number; game_type?: string; unit_price?: number; package_name?: string; package_price?: number; member_price?: number; duration?: string; source?: string; captured_at?: Date }

interface DeviceRow { venue_id: number; device_name?: string; device_type?: string; brand?: string; quantity?: number; source?: string }

enum Platform { Douyin = '抖音', Meituan = '美团', Dianping = '点评', Xiaohongshu = '小红书',
  Maoyan = '猫眼', Ctrip = '携程', Tianyancha = '天眼查', Boss = 'boss直聘' }

async function run() {
  const url = loadEnv()
  const pool = new Pool({ connectionString: url })
  const client = await pool.connect()

  try {
    console.log('📦  Batch:', BATCH_NO)
    await client.query('BEGIN')

    // 1. 解析知识库文件中的场馆数据
    const files = readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'))
    const venues: VenueRow[] = []
    const prices: PriceRow[] = []
    const devices: DeviceRow[] = []

    for (const f of files) {
      const content = readFileSync(join(KNOWLEDGE_DIR, f), 'utf-8')
      // 扫描行内标记: <!--venue:...-->
      const vMatches = content.matchAll(/<!--venue:\s*({.+?})\s*-->/g)
      for (const m of vMatches) {
        try { venues.push(JSON.parse(m[1])) } catch { /* skip */ }
      }
      // 扫描行内标记: <!--price:...-->
      const pMatches = content.matchAll(/<!--price:\s*({.+?})\s*-->/g)
      for (const m of pMatches) {
        try { prices.push(JSON.parse(m[1])) } catch { /* skip */ }
      }
      // 扫描行内标记: <!--device:...-->
      const dMatches = content.matchAll(/<!--device:\s*({.+?})\s*-->/g)
      for (const m of dMatches) {
        try { devices.push(JSON.parse(m[1])) } catch { /* skip */ }
      }
    }

    console.log(`📊  Found ${venues.length} venues, ${prices.length} prices, ${devices.length} devices`)

    // 2. 写入 venues
    let venueCount = 0
    for (const v of venues) {
      const r = await client.query(
        `INSERT INTO venues (name, city, city_tier, region, category, status, source, rating, review_count, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT DO NOTHING RETURNING id`,
        [v.name, v.city||null, v.city_tier||null, v.region||null,
         v.category||null, v.status||'active', v.source||null,
         v.rating||null, v.review_count||null, v.tags||[]]
      )
      if (r.rows.length > 0) venueCount++
    }

    console.log(`✅  Inserted ${venueCount} venues`)

    // 3. 写入 competitor_prices
    let priceCount = 0
    for (const p of prices) {
      await client.query(
        `INSERT INTO competitor_prices (venue_id, game_type, unit_price, package_name, package_price, member_price, duration, source, captured_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [p.venue_id, p.game_type||null, p.unit_price||null, p.package_name||null,
         p.package_price||null, p.member_price||null, p.duration||null,
         p.source||'手动导入', p.captured_at||new Date()]
      )
      priceCount++
    }

    // 4. 写入 competitor_devices
    let deviceCount = 0
    for (const d of devices) {
      await client.query(
        `INSERT INTO competitor_devices (venue_id, device_name, device_type, brand, quantity, source)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [d.venue_id, d.device_name||null, d.device_type||null, d.brand||null,
         d.quantity||null, d.source||'手动导入']
      )
      deviceCount++
    }

    // 5. 记录导入日志
    await client.query(
      `INSERT INTO scout_collection_logs (batch_no, platform, status, items_count)
       VALUES ($1,'all','completed',$2)`,
      [BATCH_NO, venueCount + priceCount + deviceCount]
    )

    await client.query('COMMIT')
    console.log(`🎉  Import complete: ${venueCount} venues + ${priceCount} prices + ${deviceCount} devices`)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('❌  Import failed, rolled back:', e)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// 种子数据导入 — 从 seed-national-cities-data.ts 导入120个全国场馆
// ══════════════════════════════════════════════════════════════════════════════

/** 从种子数据导入120个场馆到 competitor_venues 表（或导出JSON回退） */
async function importVenueSeedData(): Promise<void> {
  let nationalCityVenueData: any[]
  try {
    const mod = await import('./seed-national-cities-data.ts')
    nationalCityVenueData = mod.nationalCityVenueData || mod.default
  } catch (e: any) {
    console.error('❌ 无法加载种子数据文件:', e.message)
    process.exit(1)
  }

  if (!Array.isArray(nationalCityVenueData) || nationalCityVenueData.length === 0) {
    console.error('❌ 种子数据为空')
    process.exit(1)
  }

  console.log(`📦 种子数据: ${nationalCityVenueData.length} 个场馆`)

  let pgAvailable = false
  let pool: Pool | null = null
  let client: any = null

  // 尝试连接 PG
  try {
    const url = loadEnv()
    pool = new Pool({ connectionString: url, connectionTimeoutMillis: 3000 })
    client = await pool.connect()
    await client.query('SELECT 1')
    pgAvailable = true
    console.log('✅ PostgreSQL 连接成功')
  } catch (e: any) {
    pgAvailable = false
    console.log('⚠️  PostgreSQL 不可用，将导出 JSON 文件:', e.message.slice(0, 80))
  }

  let inserted = 0
  let skipped = 0
  let errors = 0

  if (pgAvailable && client && pool) {
    try {
      await client.query('BEGIN')

      for (const venue of nationalCityVenueData) {
        try {
          const data9dims = JSON.stringify({
            rating: venue.rating,
            review_count: venue.review_count,
            address: venue.address,
            tags: venue.tags,
          })

          const r = await client.query(
            `INSERT INTO competitor_venues
             (city, venue_name, venue_type, source_platform, data_9dims, region, city_tier, collection_batch, scout_updated_at)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, NOW())
             ON CONFLICT (city, venue_name) DO NOTHING
             RETURNING id`,
            [
              venue.city,
              venue.name,
              venue.category || null,
              venue.source || null,
              data9dims,
              venue.region || null,
              venue.city_tier || null,
              BATCH_NO,
            ]
          )

          if (r.rows.length > 0) {
            inserted++
          } else {
            skipped++
          }
        } catch (e: any) {
          errors++
          console.error(`  ❌ 插入失败 [${venue.name}]: ${e.message.slice(0, 100)}`)
        }

        // 进度打印（每30个输出一次）
        const processed = inserted + skipped + errors
        if (processed % 30 === 0 || processed === nationalCityVenueData.length) {
          console.log(`  📊 进度: ${processed}/${nationalCityVenueData.length} (已插入${inserted}, 跳过${skipped}, 错误${errors})`)
        }
      }

      await client.query('COMMIT')
      console.log(`\n✅ 种子数据导入完成: 插入${inserted}, 跳过${skipped}, 错误${errors}`)
    } catch (e: any) {
      await client.query('ROLLBACK')
      console.error('❌ 事务回滚:', e.message)
      pgAvailable = false
    } finally {
      client.release()
      await pool.end()
    }
  }

  // PG 不可用 → 导出 JSON 文件
  if (!pgAvailable) {
    const exportDir = join(PROJECT_ROOT, 'docs', 'knowledge')
    mkdirSync(exportDir, { recursive: true })

    const exportPath = join(exportDir, 'venue-seed-export.json')

    const exportData = nationalCityVenueData.map(v => ({
      city: v.city,
      venue_name: v.name,
      venue_type: v.category,
      source_platform: v.source,
      data_9dims: {
        rating: v.rating,
        review_count: v.review_count,
        address: v.address,
        tags: v.tags,
      },
      region: v.region,
      city_tier: v.city_tier,
      collection_batch: BATCH_NO,
    }))

    writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8')
    console.log(`\n📄 已导出 ${exportData.length} 条场馆数据到 ${exportPath}`)
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CLI入口
// ══════════════════════════════════════════════════════════════════════════════

const command = process.argv[2]
if (command === 'import-seed') {
  importVenueSeedData()
} else {
  run()
}
