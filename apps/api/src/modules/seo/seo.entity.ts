/**
 * seo.entity.ts — P-49 SEO 数据模块实体
 *
 * 结构化数据管理 (组织+场地+活动的 JSON-LD)
 * SEO 页面元数据 (title/description/keywords/canonical)
 * Sitemap 条目数据 (url/lastmod/changefreq/priority)
 * GEO 地域标签数据 (城市+商圈+地标+经纬度)
 */

// ── 变更频率枚举 ────────────────────────────────────────────────────────────

export type ChangeFreq = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export const CHANGE_FREQ_VALUES: ChangeFreq[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'never',
]

// ── SEO 页面元数据 ──────────────────────────────────────────────────────────

export interface SeoMetadata {
  id: string
  /** URL 路径（唯一） */
  path: string
  title: string
  description: string
  /** SEO 关键词列表 */
  keywords: string[]
  canonical: string
  /** 区域设置（如 zh-CN, en-US） */
  locale: string
  /** Open Graph 图片 URL */
  ogImage: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

// ── Sitemap 条目 ────────────────────────────────────────────────────────────

export interface SitemapEntry {
  id: string
  /** URL 路径（唯一） */
  path: string
  /** 变更频率 */
  changefreq: ChangeFreq
  /** 优先级（0.0 ~ 1.0） */
  priority: number
  /** 最后修改时间 */
  lastmod: string
  tenantId: string
  createdAt: string
  updatedAt: string
}

// ── GEO 地域位置 ────────────────────────────────────────────────────────────

export interface GeoLocation {
  id: string
  city: string
  district: string
  landmark: string
  lat: number
  lng: number
  /** 搜索半径（km） */
  radiusKm: number
  tenantId: string
  createdAt: string
  updatedAt: string
}
