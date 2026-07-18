/**
 * VRT Snapshot Tool · 截取关键页面基线/当前快照
 *
 * 用法:
 *   tsx scripts/vrt/snapshot.ts --baseline   # 生成基线
 *   tsx scripts/vrt/snapshot.ts              # 截取当前版本
 *
 * 依赖:
 *   npm i -D @playwright/test pixelmatch
 */

import path from 'node:path'
import fs from 'node:fs'
import { chromium } from '@playwright/test'

const ROOT = path.resolve(__dirname, '../..')
const VRT_DIR = path.resolve(ROOT, 'scripts/vrt')
const BASELINE_DIR = path.resolve(VRT_DIR, 'baseline')
const SCREENSHOTS_DIR = path.resolve(VRT_DIR, 'screenshots')
const DIFFS_DIR = path.resolve(VRT_DIR, 'diffs')
const CONFIG_PATH = path.resolve(VRT_DIR, 'vrt.config.json')

interface VRTConfig {
  threshold: number
  includeAA: boolean
  alpha: number
  diffColor: [number, number, number]
  viewport: { width: number; height: number }
  devices: Array<{ name: string; width: number; height: number }>
  pages: Array<{ name: string; url: string; priority: string }>
}

const DEFAULT_CONFIG: VRTConfig = {
  threshold: 0.1,
  includeAA: false,
  alpha: 0.1,
  diffColor: [255, 0, 0],
  viewport: { width: 1280, height: 720 },
  devices: [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'tablet', width: 768, height: 1024 },
  ],
  pages: [
    { name: 'pos', url: '/pos', priority: 'P0' },
    { name: 'members', url: '/members', priority: 'P0' },
    { name: 'members-detail', url: '/members/mock-id', priority: 'P0' },
    { name: 'stock', url: '/stock', priority: 'P1' },
    { name: 'coupons', url: '/coupons', priority: 'P1' },
    { name: 'reconciliation', url: '/finance/reconciliation', priority: 'P1' },
    { name: 'profit-loss', url: '/finance/profit-loss', priority: 'P1' },
    { name: 'reports', url: '/reports', priority: 'P1' },
    { name: 'settings', url: '/settings', priority: 'P2' },
    { name: 'security', url: '/security', priority: 'P2' },
  ],
}

function loadConfig(): VRTConfig {
  if (fs.existsSync(CONFIG_PATH)) {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2))
  return DEFAULT_CONFIG
}

async function main() {
  const isBaseline = process.argv.includes('--baseline')
  const baseUrl = process.env.VRT_BASE_URL || 'http://localhost:3000'
  const config = loadConfig()

  // Ensure directories
  for (const dir of [BASELINE_DIR, SCREENSHOTS_DIR, DIFFS_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: config.viewport })
  const page = await context.newPage()

  const results: Array<{ name: string; device: string; status: string; error?: string }> = []

  for (const pg of config.pages) {
    for (const device of config.devices) {
      await page.setViewportSize({ width: device.width, height: device.height })
      try {
        const url = `${baseUrl}${pg.url}`
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })

        const filename = `${pg.name}-${device.name}.png`
        const targetDir = isBaseline ? BASELINE_DIR : SCREENSHOTS_DIR
        await page.screenshot({ path: path.resolve(targetDir, filename), fullPage: false })

        results.push({ name: pg.name, device: device.name, status: 'ok' })
        console.log(`✅ [${device.name}] ${pg.name} → ${filename}`)
      } catch (err) {
        results.push({ name: pg.name, device: device.name, status: 'fail', error: (err as Error).message })
        console.error(`❌ [${device.name}] ${pg.name}: ${(err as Error).message}`)
      }
    }
  }

  await browser.close()

  // Summary
  const pass = results.filter(r => r.status === 'ok').length
  const fail = results.filter(r => r.status === 'fail').length
  console.log(`\n=== VRT ${isBaseline ? '基线' : '截图'} 完成 ===`)
  console.log(`总计: ${results.length} | 通过: ${pass} | 失败: ${fail}`)

  if (fail > 0) {
    process.exit(1)
  }
}

main().catch(err => {
  console.error('VRT snapshot failed:', err)
  process.exit(1)
})
