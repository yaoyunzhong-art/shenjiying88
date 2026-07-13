/**
 * 站点根级 sitemap (Next.js App Router)
 * 聚合所有市场 / 租户 / 子站 sitemap
 *
 * 历史 (2026-07-06 SEO P0 修复): 此前只有 sports-ants/sitemap.ts,
 * 根域名 /sitemap.xml 404,搜索引擎无法发现子站.
 */

import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bigants.net'
const MARKET_LANGUAGE_MAP: Record<string, string> = {
  'cn-mainland': 'zh-CN',
  'us-default': 'en-US',
  'sea-sg': 'en-SG',
  'jp-tokyo': 'ja-JP',
  'eu-de': 'de-DE',
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // 1. 根级营销页
  const rootRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/brand-website`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/sports-ants`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/admin`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ]

  // 2. 多市场 / 多租户落地页 (从公开元数据推断,避免枚举写死)
  const marketCodes = ['cn-mainland', 'us-default', 'sea-sg', 'jp-tokyo', 'eu-de']
  const tenantCodes = ['shenjiying88', 'bigants', 'sports-ants-cn']
  const marketRoutes: MetadataRoute.Sitemap = []
  for (const market of marketCodes) {
    for (const tenant of tenantCodes) {
      marketRoutes.push({
        url: `${SITE_URL}/${market}/${tenant}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            marketCodes.map((marketCode) => [
              MARKET_LANGUAGE_MAP[marketCode],
              `${SITE_URL}/${marketCode}/${tenant}`,
            ])
          ),
        },
      })
    }
  }

  return [...rootRoutes, ...marketRoutes]
}

export const revalidate = 3600 // ISR 1 小时
