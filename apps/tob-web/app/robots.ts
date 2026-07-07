/**
 * 站点根级 robots.txt (Next.js App Router)
 *
 * 规则:
 *   - 允许公开营销页
 *   - 禁止后台、登录、注册、API 路由
 *   - 指向根级 sitemap
 *
 * 历史 (2026-07-06 SEO P0 修复): 此前根域名无 robots,
 * 爬虫默认规则会爬取后台,泄露敏感路径.
 */

import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bigants.net'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/brand-website/', '/sports-ants/', '/api/public/'],
        disallow: [
          '/admin/',
          '/api/',
          '/console/',
          '/login/',
          '/register/',
          '/forgot-password/',
          '/_next/',
          '/internal/',
        ],
      },
      // 主流搜索引擎 UA 单独锁定 (防止伪装 UA 抓取敏感路径)
      {
        userAgent: ['Googlebot', 'Bingbot', 'YandexBot'],
        allow: ['/'],
        disallow: ['/api/', '/admin/', '/console/', '/internal/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
