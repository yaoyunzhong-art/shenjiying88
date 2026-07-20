/**
 * seo.controller.ts — P-49 SEO 数据模块控制器
 * V2 增强: 结构化数据生成 + GEO搜索 + 健康检测 + 评分
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
UseGuards,
} from '@nestjs/common'
import { SeoService } from './seo.service'
import { GeoSearchService } from './geo-search.service'
import { SeoHealthService } from './seo-health.service'
import type { ChangeFreq } from './seo.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('seo')
@UseGuards(TenantGuard)
export class SeoController {
  constructor(
    private readonly seoService: SeoService,
    private readonly geoSearchService: GeoSearchService,
    private readonly seoHealthService: SeoHealthService,
  ) {}

  // ── Metadata CRUD ──

  @Put('metadata')
  upsertMetadata(@Body() body: { path: string; title: string; description: string; keywords?: string[]; canonical: string; locale?: string; tenantId?: string }) {
    return this.seoService.upsertMetadata(body.path, body)
  }

  @Get('metadata/:path')
  getMetadata(@Param('path') path: string, @Query('locale') locale?: string) {
    const meta = this.seoService.getMetadata(path, locale || 'zh-CN')
    if (!meta) throw new NotFoundException(`路径 ${path} 无SEO元数据`)
    return meta
  }

  @Delete('metadata/:path')
  deleteMetadata(@Param('path') path: string, @Query('locale') locale?: string) {
    this.seoService.deleteMetadata(path)
    return { success: true }
  }

  @Get('metadata')
  listMetadata(@Query('tenantId') tenantId?: string, @Query('locale') locale?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.seoService.listMetadata({
      tenantId, locale,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    })
  }

  // ── Sitemap CRUD ──

  @Post('sitemap')
  createSitemap(@Body() body: { path: string; changefreq?: ChangeFreq; priority?: number; tenantId?: string }) {
    return this.seoService.upsertSitemap(body.path, body)
  }

  @Get('sitemap')
  listSitemap(@Query('tenantId') tenantId?: string, @Query('changefreq') changefreq?: ChangeFreq) {
    return this.seoService.getSitemapEntries(tenantId || 'default', changefreq)
  }

  @Get('sitemap/:path')
  getSitemapByPath(@Param('path') path: string, @Query('tenantId') tenantId?: string) {
    const entries = this.seoService.getSitemapEntries(tenantId || 'default').filter(e => e.path === path)
    return entries[0] || null
  }

  @Post('sitemap/batch')
  batchSitemap(@Body() body: { entries: { path: string; changefreq?: ChangeFreq; priority?: number; tenantId?: string }[] }) {
    return this.seoService.batchUpsertSitemap(body.entries)
  }

  // ── GeoLocation CRUD ──

  @Post('geo-locations')
  createGeoLocation(@Body() body: { city: string; district: string; landmark: string; lat: number; lng: number; radiusKm?: number; tenantId?: string }) {
    return this.seoService.createGeoLocation(body)
  }

  @Get('geo-locations')
  listGeoLocations(@Query('tenantId') tenantId?: string) {
    return this.seoService.getAllGeoLocations(tenantId)
  }

  @Get('geo-locations/search')
  searchGeoLocations(@Query('city') city: string, @Query('district') district: string, @Query('keyword') keyword?: string) {
    try { return this.seoService.searchGeoLocations(city, district, keyword) } catch (err: any) {
      throw new HttpException(err.message || '搜索失败', HttpStatus.BAD_REQUEST)
    }
  }

  // ── V2 增强: 结构化数据生成 ──

  @Post('generate-structured-data/:path')
  generateStructuredData(@Param('path') path: string, @Body() body?: { pageType?: 'store' | 'event' | 'page' }) {
    const pageType = body?.pageType || 'page'
    const meta = this.seoService.getMetadata(path, 'zh-CN')
    if (!meta) throw new NotFoundException(`路径 ${path} 无SEO元数据`)
    const base = { '@context': 'https://schema.org', '@id': `https://domain.com${path}#webpage`, name: meta.title, description: meta.description, url: `https://domain.com${path}` }
    if (pageType === 'store') return { ...base, '@type': ['LocalBusiness', 'EntertainmentBusiness'] }
    if (pageType === 'event') return { ...base, '@type': 'Event' }
    return { ...base, '@type': 'WebPage', isPartOf: { '@type': 'WebSite', '@id': 'https://domain.com#website', url: 'https://domain.com' } }
  }

  // ── V2 增强: GEO搜索 ──

  @Post('geo-search')
  geoSearch(@Body() body: { query: string; city?: string; district?: string; lat?: number; lng?: number; page?: number; pageSize?: number }) {
    return this.geoSearchService.search({ query: body.query, city: body.city, district: body.district, lat: body.lat, lng: body.lng, page: body.page, pageSize: body.pageSize })
  }

  // ── V2 增强: 健康报告 ──

  @Get('health')
  getHealth(@Query('tenantId') tenantId?: string) {
    return this.seoHealthService.generateHealthReport(tenantId || 'default')
  }

  // ── V2 增强: SEO统计 ──

  @Get('stats')
  getStats(@Query('tenantId') tenantId?: string) {
    const tid = tenantId || 'default'
    const metadata = this.seoService.listMetadata({ tenantId: tid })
    const sitemaps = this.seoService.getSitemapEntries(tid)
    const geos = this.seoService.getAllGeoLocations(tid)
    return { totalMetadata: metadata.total, totalSitemaps: sitemaps.length, totalGeos: geos.length, lastUpdated: new Date().toISOString() }
  }

  // ── V2 增强: 页面评分 ──

  @Get('score-page')
  scorePage(@Query('path') path: string, @Query('title') title: string, @Query('description') description: string) {
    return { path, score: this.seoHealthService.scorePage(path, title || '', description || '') }
  }
}
