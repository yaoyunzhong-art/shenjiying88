import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium, type ConsoleMessage, type Page } from '@playwright/test'

interface RouteExpectation {
  name: string
  path: string
  expectedTitle: string
  expectedLang: string
  expectedCanonical: string
  expectedOgLocale?: string
  expectedDescription?: string
  headingText?: string
}

interface RouteEvidence {
  name: string
  url: string
  title: string
  lang: string
  canonical: string | null
  ogLocale: string | null
  description: string | null
  headingText: string | null
  consoleMessages: string[]
  screenshotPath: string
  checkedAt: string
}

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3005'
const OUTPUT_DIR = path.resolve(process.cwd(), 'tmp', 'phase49-seo-geo')

const ROUTES: RouteExpectation[] = [
  {
    name: 'cn-mainland-tenant',
    path: '/cn-mainland/demo-tenant',
    expectedTitle: 'demo-tenant ToB 官网 | 中国大陆 | 神机营',
    expectedLang: 'zh-CN',
    expectedCanonical: 'https://www.bigants.net/cn-mainland/demo-tenant',
    expectedOgLocale: 'zh-CN',
    headingText: 'demo-tenant 企业级经营官网',
  },
  {
    name: 'sea-sg-tenant',
    path: '/sea-sg/demo-tenant',
    expectedTitle: 'demo-tenant ToB 官网 | Singapore | 神机营',
    expectedLang: 'en-SG',
    expectedCanonical: 'https://www.bigants.net/sea-sg/demo-tenant',
    expectedOgLocale: 'en-SG',
    headingText: 'demo-tenant 企业级经营官网',
  },
  {
    name: 'jp-tokyo-tenant',
    path: '/jp-tokyo/demo-tenant',
    expectedTitle: 'demo-tenant ToB 官网 | Japan | 神机营',
    expectedLang: 'ja-JP',
    expectedCanonical: 'https://www.bigants.net/jp-tokyo/demo-tenant',
    expectedOgLocale: 'ja-JP',
    headingText: 'demo-tenant 企业级经营官网',
  },
  {
    name: 'eu-de-brand',
    path: '/eu-de/demo-tenant/sportslife',
    expectedTitle: 'sportslife 品牌 ToB 官网 | Germany | 神机营',
    expectedLang: 'de-DE',
    expectedCanonical: 'https://www.bigants.net/eu-de/demo-tenant/sportslife',
    expectedOgLocale: 'de-DE',
    expectedDescription: '面向招商加盟、品牌合作、联合营销、赛事活动和品牌后台登录的统一入口。',
    headingText: 'sportslife 品牌增长官网',
  },
]

async function waitForStablePage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded')
  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 })
  } catch {
    await page.waitForTimeout(1500)
  }
}

async function collectEvidence(
  page: Page,
  route: RouteExpectation,
  consoleMessages: string[]
): Promise<RouteEvidence> {
  const url = new URL(route.path, BASE_URL).toString()
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await waitForStablePage(page)

  const payload = await page.evaluate(() => ({
    title: document.title,
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    ogLocale: document.querySelector('meta[property="og:locale"]')?.getAttribute('content') ?? null,
    description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? null,
    headingText:
      document.querySelector('main h1')?.textContent?.trim() ??
      document.querySelector('h1')?.textContent?.trim() ??
      null,
  }))

  assert.equal(payload.title, route.expectedTitle, `${route.name} title 不符合预期`)
  assert.equal(payload.lang, route.expectedLang, `${route.name} html lang 不符合预期`)
  assert.equal(payload.canonical, route.expectedCanonical, `${route.name} canonical 不符合预期`)

  if (route.expectedOgLocale) {
    assert.equal(payload.ogLocale, route.expectedOgLocale, `${route.name} og:locale 不符合预期`)
  }

  if (route.expectedDescription) {
    assert.equal(payload.description, route.expectedDescription, `${route.name} description 不符合预期`)
  }

  if (route.headingText) {
    assert.equal(payload.headingText, route.headingText, `${route.name} h1 不符合预期`)
  }

  assert.equal(consoleMessages.length, 0, `${route.name} 页面存在控制台告警/报错`)

  const screenshotPath = path.join(OUTPUT_DIR, `${route.name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })

  return {
    name: route.name,
    url,
    title: payload.title,
    lang: payload.lang,
    canonical: payload.canonical,
    ogLocale: payload.ogLocale,
    description: payload.description,
    headingText: payload.headingText,
    consoleMessages,
    screenshotPath,
    checkedAt: new Date().toISOString(),
  }
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })

  const report: {
    baseUrl: string
    generatedAt: string
    routes: RouteEvidence[]
  } = {
    baseUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    routes: [],
  }

  try {
    for (const route of ROUTES) {
      const page = await context.newPage()
      const consoleMessages: string[] = []
      page.on('console', (message: ConsoleMessage) => {
        if (message.type() === 'warning' || message.type() === 'error') {
          consoleMessages.push(`[${message.type()}] ${message.text()}`)
        }
      })
      page.on('pageerror', (error) => {
        consoleMessages.push(`[pageerror] ${error.message}`)
      })

      try {
        const evidence = await collectEvidence(page, route, consoleMessages)
        report.routes.push(evidence)
        console.log(`✓ ${route.name}: ${evidence.title} | ${evidence.lang}`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }

  const reportPath = path.join(OUTPUT_DIR, 'report.json')
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf-8')
  console.log(`\nPhase-49 SEO/GEO 浏览器验收完成，证据输出: ${reportPath}`)
}

main().catch((error) => {
  console.error('Phase-49 SEO/GEO 浏览器验收失败')
  console.error(error)
  process.exitCode = 1
})
