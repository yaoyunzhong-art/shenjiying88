import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://storefront.shenjiying.com'

  const staticPages = [
    { url: baseUrl, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/members`, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/members/growth`, changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/recommendations`, changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/reports`, changeFrequency: 'daily' as const, priority: 0.8 },
  ]

  return staticPages.map((page) => ({
    ...page,
    lastModified: new Date(),
  }))
}
