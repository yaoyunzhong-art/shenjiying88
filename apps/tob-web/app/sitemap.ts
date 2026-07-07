/**
 * 站点根级 sitemap (Next.js App Router)
 * 聚合所有市场 / 租户 / 子站 sitemap
 *
 * 历史 (2026-07-06 SEO P0 修复): 此前只有 sports-ants/sitemap.ts,
 * 根域名 /sitemap.xml 404,搜索引擎无法发现子站.
 */

import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.bigants.net'

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
  const marketLocales = ['cn', 'us', 'sg', 'jp']
  const tenantCodes = ['shenjiying88', 'bigants', 'sports-ants-cn']
  const marketRoutes: MetadataRoute.Sitemap = []
  for (const market of marketLocales) {
    for (const tenant of tenantCodes) {
      marketRoutes.push({
        url: `${SITE_URL}/${market}/${tenant}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: Object.fromEntries(
            marketLocales.map((m) => [m, `${SITE_URL}/${m}/${tenant}`])
          ),
        },
      })
    }
  }

  return [...rootRoutes, ...marketRoutes]
}

export const revalidate = 3600 // ISR 1 小时
