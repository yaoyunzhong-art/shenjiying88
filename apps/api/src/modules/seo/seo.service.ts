/**
 * seo.service.ts — P-49 SEO 数据模块服务 (≥120行)
 */
import { randomUUID } from 'node:crypto'
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import {
  SeoMetadata,
  SitemapEntry,
  GeoLocation,
  ChangeFreq,
  CHANGE_FREQ_VALUES,
} from './seo.entity'

// ── 输入类型 ────────────────────────────────────────────────────────────────

export interface UpsertMetadataInput {
  title: string
  description: string
  keywords?: string[]
  canonical: string
  locale?: string
  ogImage?: string
  tenantId?: string
}

export interface UpsertSitemapInput {
  changefreq?: ChangeFreq
  priority?: number
  lastmod?: string
  tenantId?: string
}

export interface CreateGeoLocationInput {
  city: string
  district: string
  landmark: string
  lat: number
  lng: number
  radiusKm?: number
  tenantId?: string
}

export interface ListMetadataQuery {
  tenantId?: string
  locale?: string
  page?: number
  pageSize?: number
}

// ── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class SeoService {
  private readonly logger = new Logger(SeoService.name)

  /** 内存存储 */
  private readonly metadata = new Map<string, SeoMetadata>()
  private readonly sitemaps = new Map<string, SitemapEntry>()
  private readonly geoLocations = new Map<string, GeoLocation>()

  // ── 私有工具 ───────────────────────────────────────────────────────────

  private nextId(): string {
    // 模拟 ULID 格式
    return `seo-${randomUUID().slice(0, 26)}`
  }

  private now(): string {
    return new Date().toISOString()
  }

  private assertPathValid(path: string): void {
    if (!path?.trim()) {
      throw new BadRequestException('路径不能为空')
    }
  }

  private assertPriorityValid(priority: number): void {
    if (priority < 0 || priority > 1) {
      throw new BadRequestException('优先级必须在 0.0 ~ 1.0 之间')
    }
  }

  private assertChangeFreqValid(freq: string): asserts freq is ChangeFreq {
    if (!CHANGE_FREQ_VALUES.includes(freq as ChangeFreq)) {
      throw new BadRequestException(
        `无效的变更频率: ${freq}，允许的值: ${CHANGE_FREQ_VALUES.join(', ')}`,
      )
    }
  }

  private assertLatValid(lat: number): void {
    if (lat < -90 || lat > 90) {
      throw new BadRequestException('纬度必须在 -90 ~ 90 之间')
    }
  }

  private assertLngValid(lng: number): void {
    if (lng < -180 || lng > 180) {
      throw new BadRequestException('经度必须在 -180 ~ 180 之间')
    }
  }

  // ── Metadata CRUD ──────────────────────────────────────────────────────

  upsertMetadata(path: string, data: UpsertMetadataInput): SeoMetadata {
    this.assertPathValid(path)
    if (!data.title?.trim()) {
      throw new BadRequestException('标题不能为空')
    }
    if (!data.description?.trim()) {
      throw new BadRequestException('描述不能为空')
    }
    if (!data.canonical?.trim()) {
      throw new BadRequestException('规范 URL 不能为空')
    }

    const existing = this.metadata.get(path)
    const now = this.now()
    const tenantId = data.tenantId ?? 'default'

    if (existing) {
      const updated: SeoMetadata = {
        ...existing,
        title: data.title.trim(),
        description: data.description.trim(),
        keywords: data.keywords ?? existing.keywords,
        canonical: data.canonical.trim(),
        locale: data.locale ?? existing.locale,
        ogImage: data.ogImage ?? existing.ogImage,
        tenantId: data.tenantId ?? existing.tenantId,
        updatedAt: now,
      }
      this.metadata.set(path, updated)
      return updated
    }

    const created: SeoMetadata = {
      id: this.nextId(),
      path,
      title: data.title.trim(),
      description: data.description.trim(),
      keywords: data.keywords ?? [],
      canonical: data.canonical.trim(),
      locale: data.locale ?? 'zh-CN',
      ogImage: data.ogImage ?? '',
      tenantId,
      createdAt: now,
      updatedAt: now,
    }
    this.metadata.set(path, created)
    return created
  }

  getMetadata(path: string, locale?: string): SeoMetadata {
    this.assertPathValid(path)
    const entry = this.metadata.get(path)
    if (!entry) {
      throw new NotFoundException(`路径 ${path} 的 SEO 元数据不存在`)
    }
    if (locale && entry.locale !== locale) {
      throw new NotFoundException(
        `路径 ${path} 在区域 ${locale} 的 SEO 元数据不存在`,
      )
    }
    return entry
  }

  deleteMetadata(path: string): void {
    this.assertPathValid(path)
    if (!this.metadata.has(path)) {
      throw new NotFoundException(`路径 ${path} 的 SEO 元数据不存在`)
    }
    this.metadata.delete(path)
  }

  listMetadata(query: ListMetadataQuery = {}): {
    items: SeoMetadata[]
    total: number
  } {
    let items = Array.from(this.metadata.values())

    if (query.tenantId) {
      items = items.filter((m) => m.tenantId === query.tenantId)
    }
    if (query.locale) {
      items = items.filter((m) => m.locale === query.locale)
    }

    // 按更新时间排序（最新的在前）
    items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

    const total = items.length
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)

    return { items: paged, total }
  }

  // ── Sitemap CRUD ───────────────────────────────────────────────────────

  upsertSitemap(path: string, data: UpsertSitemapInput): SitemapEntry {
    this.assertPathValid(path)
    const changefreq = data.changefreq ?? 'weekly'
    this.assertChangeFreqValid(changefreq)
    const priority = data.priority ?? 0.5
    this.assertPriorityValid(priority)

    const existing = this.sitemaps.get(path)
    const now = this.now()
    const tenantId = data.tenantId ?? 'default'

    if (existing) {
      const updated: SitemapEntry = {
        ...existing,
        changefreq,
        priority,
        lastmod: data.lastmod ?? now,
        tenantId: data.tenantId ?? existing.tenantId,
        updatedAt: now,
      }
      this.sitemaps.set(path, updated)
      return updated
    }

    const created: SitemapEntry = {
      id: this.nextId(),
      path,
      changefreq,
      priority,
      lastmod: data.lastmod ?? now,
      tenantId,
      createdAt: now,
      updatedAt: now,
    }
    this.sitemaps.set(path, created)
    return created
  }

  getSitemapEntries(
    tenantId?: string,
    changefreq?: ChangeFreq,
  ): SitemapEntry[] {
    let items = Array.from(this.sitemaps.values())

    if (tenantId) {
      items = items.filter((s) => s.tenantId === tenantId)
    }
    if (changefreq) {
      items = items.filter((s) => s.changefreq === changefreq)
    }

    return items.sort((a, b) =>
      b.lastmod.localeCompare(a.lastmod),
    )
  }

  getSitemapByPath(path: string): SitemapEntry {
    this.assertPathValid(path)
    const entry = this.sitemaps.get(path)
    if (!entry) {
      throw new NotFoundException(`路径 ${path} 的 Sitemap 条目不存在`)
    }
    return entry
  }

  deleteSitemap(path: string): void {
    this.assertPathValid(path)
    if (!this.sitemaps.has(path)) {
      throw new NotFoundException(`路径 ${path} 的 Sitemap 条目不存在`)
    }
    this.sitemaps.delete(path)
  }

  batchUpsertSitemap(entries: Array<{ path: string } & UpsertSitemapInput>): SitemapEntry[] {
    if (!entries || entries.length === 0) {
      throw new BadRequestException('批量条目不不能为空')
    }
    return entries.map((e) => this.upsertSitemap(e.path, e))
  }

  // ── GeoLocation CRUD ──────────────────────────────────────────────────

  createGeoLocation(data: CreateGeoLocationInput): GeoLocation {
    if (!data.city?.trim()) {
      throw new BadRequestException('城市不能为空')
    }
    if (!data.district?.trim()) {
      throw new BadRequestException('区域不能为空')
    }
    if (!data.landmark?.trim()) {
      throw new BadRequestException('地标不能为空')
    }
    this.assertLatValid(data.lat)
    this.assertLngValid(data.lng)

    const now = this.now()
    const tenantId = data.tenantId ?? 'default'

    const geo: GeoLocation = {
      id: this.nextId(),
      city: data.city.trim(),
      district: data.district.trim(),
      landmark: data.landmark.trim(),
      lat: data.lat,
      lng: data.lng,
      radiusKm: data.radiusKm ?? 1,
      tenantId,
      createdAt: now,
      updatedAt: now,
    }
    this.geoLocations.set(geo.id, geo)
    return geo
  }

  searchGeoLocations(
    city: string,
    district: string,
    keyword?: string,
  ): GeoLocation[] {
    if (!city?.trim()) {
      throw new BadRequestException('城市不能为空')
    }
    if (!district?.trim()) {
      throw new BadRequestException('区域不能为空')
    }

    let results = Array.from(this.geoLocations.values()).filter(
      (g) =>
        g.city === city.trim() && g.district === district.trim(),
    )

    if (keyword?.trim()) {
      const kw = keyword.trim().toLowerCase()
      results = results.filter(
        (g) =>
          g.landmark.toLowerCase().includes(kw) ||
          g.city.toLowerCase().includes(kw) ||
          g.district.toLowerCase().includes(kw),
      )
    }

    return results
  }

  getAllGeoLocations(tenantId?: string): GeoLocation[] {
    let items = Array.from(this.geoLocations.values())
    if (tenantId) {
      items = items.filter((g) => g.tenantId === tenantId)
    }
    return items
  }

  getGeoLocationById(id: string): GeoLocation {
    const geo = this.geoLocations.get(id)
    if (!geo) {
      throw new NotFoundException(`GEO 位置 ${id} 不存在`)
    }
    return geo
  }

  deleteGeoLocation(id: string): void {
    if (!this.geoLocations.has(id)) {
      throw new NotFoundException(`GEO 位置 ${id} 不存在`)
    }
    this.geoLocations.delete(id)
  }

  // ── 测试辅助 ──────────────────────────────────────────────────────────

  /** 清空所有存储（仅在测试中使用） */
  clear(): void {
    this.metadata.clear()
    this.sitemaps.clear()
    this.geoLocations.clear()
  }
}
