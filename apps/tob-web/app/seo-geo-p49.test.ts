import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { describe, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import rootRobots from './robots'
import rootSitemap from './sitemap'
import { GET as getBrandGeo } from './brand-website/api/geo/route'
import { GET as getBrandRobots } from './brand-website/robots.txt/route'
import { GET as getBrandSitemap } from './brand-website/sitemap.xml/route'
import { aiReferenceOptimizer, isAIFriendly } from './brand-website/lib/geo/ai-reference-optimizer'
import { IntelligentSystem } from './brand-website/lib/intelligent/self-system'
import {
  generateLocalBusinessJsonLd,
  generateOrganizationJsonLd,
  seoMetaGenerator,
} from './brand-website/lib/seo/meta-generator'
import { resolveDocumentLanguageFromPathname, sanitizeDocumentLanguage } from './lib/document-language'
import { metadata as sportsAntsMetadata } from './sports-ants/layout'
import {
  generateMetadata as generateTenantPortalMetadata,
} from './[marketCode]/[tenantCode]/page'
import {
  generateMetadata as generateBrandPortalMetadata,
} from './[marketCode]/[tenantCode]/[brandCode]/page'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BRAND_PAGE_SOURCE = readFileSync(resolve(__dirname, 'brand-website/page.tsx'), 'utf-8')
const SPORTS_PAGE_SOURCE = readFileSync(resolve(__dirname, 'sports-ants/page.tsx'), 'utf-8')

describe('PRD-015 SEO/GEO 根级入口', () => {
  test('AC-49-12: 根级 /sitemap.xml 聚合公开站点与市场链接', () => {
    const entries = rootSitemap()

    assert.ok(entries.some((entry) => entry.url.endsWith('/')), '缺少根首页 sitemap')
    assert.ok(entries.some((entry) => entry.url.endsWith('/brand-website')), '缺少品牌官网 sitemap')
    assert.ok(entries.some((entry) => entry.url.endsWith('/sports-ants')), '缺少运动蚂蚁 sitemap')

    const marketEntry = entries.find((entry) => entry.url.includes('/cn-mainland/shenjiying88'))
    assert.ok(marketEntry, '缺少市场/租户级 sitemap')
    assert.deepEqual(
      Object.keys(marketEntry.alternates?.languages ?? {}),
      ['zh-CN', 'en-US', 'en-SG', 'ja-JP', 'de-DE']
    )
  })

  test('AC-49-13: 根级 /robots.txt 暴露爬虫规则与 sitemap 地址', () => {
    const robots = rootRobots()

    assert.equal(robots.sitemap, 'https://www.bigants.net/sitemap.xml')
    assert.equal(robots.host, 'https://www.bigants.net')
    assert.ok(Array.isArray(robots.rules), 'robots 规则应为数组')
    assert.ok(
      robots.rules.some(
        (rule) =>
          Array.isArray(rule.disallow) &&
          rule.disallow.includes('/admin/') &&
          rule.disallow.includes('/api/')
      ),
      'robots 应阻止后台与 API 路径'
    )
  })
})

describe('PRD-015 SEO/GEO 品牌站路由', () => {
  test('AC-49-12: 品牌站 sitemap.xml 返回合法 XML 且包含核心页面', async () => {
    const response = await getBrandSitemap()
    const xml = await response.text()

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'application/xml')
    assert.match(xml, /<urlset[\s\S]*<\/urlset>/)
    assert.match(xml, /https:\/\/www\.shenjiying\.com\/products/)
    assert.match(xml, /https:\/\/www\.shenjiying\.com\/contact/)
  })

  test('AC-49-13: 品牌站 robots.txt 返回公开规则与 sitemap', async () => {
    const response = await getBrandRobots()
    const text = await response.text()

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'text/plain')
    assert.match(text, /User-agent: \*/)
    assert.match(text, /Disallow: \/admin\//)
    assert.match(text, /Sitemap: https:\/\/www\.shenjiying\.com\/sitemap\.xml/)
  })

  test('AC-49-15: GEO 路由可基于请求 IP 输出地域结果与本地内容', async () => {
    const response = await getBrandGeo(
      new Request('http://tob.local/brand-website/api/geo', {
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      }) as any
    )
    const payload = await response.json()

    assert.equal(response.status, 200)
    assert.equal(payload.ip, '127.0.0.1')
    assert.equal(payload.location.country, 'China')
    assert.equal(payload.location.city, 'Beijing')
    assert.equal(payload.region.code, 'national')
    assert.equal(payload.regionContent.regionCode, 'national')
    assert.equal(payload.regionContent.serviceAvailable, true)
  })
})

describe('PRD-015 SEO/GEO 内容生成与 AI 引用优化', () => {
  test('AC-49-11: SEO meta 生成器输出 title/description/OG/canonical', () => {
    const meta = seoMetaGenerator.generate({
      page: '/franchise',
      title: '招商加盟合作',
      description: '为直营网点和联营伙伴提供标准化选址、投建和运营支持。',
      keywords: ['招商加盟', '数字运动', '神机营'],
      type: 'business',
    })

    assert.equal(meta.title, '招商加盟合作 | 神机营')
    assert.equal(meta.robots, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    assert.equal(meta.og.url, 'https://shenjiying.com/franchise')
    assert.equal(meta.canonical, 'https://shenjiying.com/franchise')
    assert.equal(meta.alternate?.length, 2)
  })

  test('AC-49-14: JSON-LD 生成器可输出 Organization / LocalBusiness 结构化数据', () => {
    const organization = JSON.parse(generateOrganizationJsonLd())
    const localBusiness = JSON.parse(
      generateLocalBusinessJsonLd({
        name: '神机营华南服务中心',
        address: '天河路88号',
        city: '广州',
        region: '广东',
        postalCode: '510000',
        country: 'CN',
        phone: '400-888-8888',
        latitude: 23.1291,
        longitude: 113.2644,
      })
    )

    assert.equal(organization['@type'], 'Organization')
    assert.equal(localBusiness['@type'], 'LocalBusiness')
    assert.equal(localBusiness.address.addressLocality, '广州')
    assert.equal(localBusiness.telephone, '400-888-8888')
  })

  test('RQ-49-15: AI 引用优化器可生成结构化片段与地域化内容', () => {
    const optimized = aiReferenceOptimizer.optimize(
      '神机营为企业客户提供数字运动空间建设、供应链服务和招商加盟支持。问题：如何快速完成门店落地？答案：标准化 EPC+O 流程可将交付周期控制在 45 天内。',
      { type: 'faq', keywords: ['数字运动', 'EPC+O'] }
    )
    const localContent = aiReferenceOptimizer.generateLocalContent(
      '神机营帮助企业寻找合作伙伴并建立标准化服务流程。',
      { city: '广州', district: '天河区' }
    )

    assert.equal(optimized.structuredData['@type'], 'WebContent')
    assert.ok(optimized.confidence > 0.5, 'AI 引用优化结果置信度过低')
    assert.ok(optimized.structuredData.keywords.includes('数字运动'))
    assert.equal(localContent.structuredData['@type'], 'LocalBusiness')
    assert.match(localContent.original, /广州企业/)
    assert.match(localContent.original, /天河区合作伙伴/)
  })

  test('RQ-49-15: AI 友好性检测能识别结构不足并给出建议', () => {
    const review = isAIFriendly('神机营服务企业。')

    assert.ok(review.score < 0.9)
    assert.ok(review.issues.includes('内容过短'))
    assert.ok(review.suggestions.length > 0)
  })
})

describe('PRD-015 监控、转化与自治闭环', () => {
  test('AC-49-17: 页面已接入分享/联系/转化追踪组件', () => {
    assert.match(BRAND_PAGE_SOURCE, /ShareButtons/)
    assert.match(BRAND_PAGE_SOURCE, /ContactButtons/)
    assert.match(SPORTS_PAGE_SOURCE, /ConversionTracker/)
    assert.match(SPORTS_PAGE_SOURCE, /conversionService\.trackCTAClick/)
  })

  test('AC-49-11: sports-ants layout 提供独立 metadata，避免继承 ToB Admin 标题', () => {
    assert.equal(sportsAntsMetadata.title, '运动蚂蚁 BigAnts | 数字运动潮玩一站式提供商')
    assert.equal(sportsAntsMetadata.alternates?.canonical, 'https://www.bigants.net')
    assert.equal(sportsAntsMetadata.openGraph?.url, 'https://www.bigants.net')
  })

  test('AC-49-11: 多市场租户门户生成独立 metadata，避免复用后台标题', async () => {
    const metadata = await generateTenantPortalMetadata({
      params: Promise.resolve({
        marketCode: 'cn-mainland',
        tenantCode: 'demo-tenant',
      }),
    })

    assert.equal(metadata.title, 'demo-tenant ToB 官网 | 中国大陆 | 神机营')
    assert.equal(metadata.description, '统一承接租户解决方案、渠道合作、门店网络能力展示与后台登录入口。')
    assert.equal(metadata.alternates?.canonical, 'https://www.bigants.net/cn-mainland/demo-tenant')
    assert.equal(metadata.alternates?.languages?.['zh-CN'], 'https://www.bigants.net/cn-mainland/demo-tenant')
    assert.equal(metadata.openGraph?.url, 'https://www.bigants.net/cn-mainland/demo-tenant')
  })

  test('AC-49-11: 多品牌门户生成独立 metadata，隔离 market / tenant / brand 作用域', async () => {
    const metadata = await generateBrandPortalMetadata({
      params: Promise.resolve({
        marketCode: 'us-default',
        tenantCode: 'demo-tenant',
        brandCode: 'demo-brand',
      }),
    })

    assert.equal(metadata.title, 'demo-brand 品牌 ToB 官网 | United States | 神机营')
    assert.equal(metadata.description, '面向招商加盟、品牌合作、联合营销、赛事活动和品牌后台登录的统一入口。')
    assert.equal(metadata.alternates?.canonical, 'https://www.bigants.net/us-default/demo-tenant/demo-brand')
    assert.equal(
      metadata.alternates?.languages?.['en-US'],
      'https://www.bigants.net/us-default/demo-tenant/demo-brand'
    )
    assert.equal(metadata.openGraph?.url, 'https://www.bigants.net/us-default/demo-tenant/demo-brand')
  })

  test('AC-49-11: 新加坡市场 metadata 不再误报为 United States', async () => {
    const metadata = await generateTenantPortalMetadata({
      params: Promise.resolve({
        marketCode: 'sea-sg',
        tenantCode: 'demo-tenant',
      }),
    })

    assert.equal(metadata.title, 'demo-tenant ToB 官网 | Singapore | 神机营')
    assert.equal(metadata.alternates?.languages?.['en-SG'], 'https://www.bigants.net/sea-sg/demo-tenant')
    assert.equal(metadata.openGraph?.locale, 'en-SG')
  })

  test('AC-49-11: 德国市场品牌 metadata 使用 de-DE locale 与 Germany 标识', async () => {
    const metadata = await generateBrandPortalMetadata({
      params: Promise.resolve({
        marketCode: 'eu-de',
        tenantCode: 'demo-tenant',
        brandCode: 'sportslife',
      }),
    })

    assert.equal(metadata.title, 'sportslife 品牌 ToB 官网 | Germany | 神机营')
    assert.equal(metadata.alternates?.languages?.['de-DE'], 'https://www.bigants.net/eu-de/demo-tenant/sportslife')
    assert.equal(metadata.openGraph?.locale, 'de-DE')
  })

  test('AC-49-11: 动态门户 document lang 可按市场路径切换', () => {
    assert.equal(resolveDocumentLanguageFromPathname('/jp-tokyo/demo-tenant'), 'ja-JP')
    assert.equal(resolveDocumentLanguageFromPathname('/eu-de/demo-tenant/sportslife'), 'de-DE')
    assert.equal(resolveDocumentLanguageFromPathname('/brand-website'), 'zh-CN')
  })

  test('AC-49-11: document lang header 仅接受受支持的市场语言', () => {
    assert.equal(sanitizeDocumentLanguage('en-SG'), 'en-SG')
    assert.equal(sanitizeDocumentLanguage('de-DE'), 'de-DE')
    assert.equal(sanitizeDocumentLanguage('fr-FR'), 'zh-CN')
    assert.equal(sanitizeDocumentLanguage(undefined), 'zh-CN')
  })

  test('AC-49-16: 智能自治系统可刷新 SEO/GEO 健康快照', async () => {
    const system = new IntelligentSystem()

    await system.triggerCycle()
    const health = system.getHealthStatus()

    assert.ok(health.lastCycleTime > 0, '自治循环未更新 lastCycleTime')
    assert.ok(health.seoMetrics.organicTraffic > 0, 'SEO 指标未写入')
    assert.ok(health.geoMetrics.brandCitations > 0, 'GEO 指标未写入')
  })

  test('AC-49-18: 性能异常可生成待执行优化任务', () => {
    const system = new IntelligentSystem()

    ;(system as any).handlePerformanceAnomaly('lcp', 3200)
    const tasks = system.getTasks()

    assert.equal(tasks.length, 1)
    assert.equal(tasks[0]?.type, 'performance')
    assert.equal(tasks[0]?.status, 'pending')
    assert.equal(tasks[0]?.target, 'lcp')
  })
})
