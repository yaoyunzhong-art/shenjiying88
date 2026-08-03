/**
 * seo-health.service.ts — SEO健康检测 (P-49 V2)
 *
 * 扫描页面: 检查结构化数据完整性/元数据存在性/sitemap配置
 */
import { Injectable, Logger } from '@nestjs/common'
import { SeoService } from './seo.service'

export interface SeoAuditResult {
  path: string
  hasMetadata: boolean
  hasSitemap: boolean
  metadataScore: number  // 0-100
  suggestions: string[]
}

export interface SeoOverallHealth {
  totalPages: number
  pagesWithMetadata: number
  pagesWithSitemap: number
  avgMetadataScore: number
  coverageRate: number
  issues: { path: string; severity: 'high' | 'medium' | 'low'; suggestion: string }[]
}

@Injectable()
export class SeoHealthService {
  private readonly logger = new Logger(SeoHealthService.name)

  constructor(private readonly seoService: SeoService) {}

  /**
   * 全量SEO健康报告
   */
  generateHealthReport(tenantId: string): SeoOverallHealth {
    // 模拟扫描10个页面
    const mockPaths = [
      '/', '/about', '/stores/shanghai', '/stores/beijing',
      '/activities/summer', '/deals/weekend', '/faq', '/contact',
      '/stores/chengdu', '/stores/shenzhen',
    ]
    const metadataList = this.seoService.listMetadata({ tenantId })
    const sitemapEntries = this.seoService.getSitemapEntries(tenantId)
    const sitemapPaths = new Set(sitemapEntries.map(s => s.path))
    const metaPaths = new Set(metadataList.items.map(m => m.path))

    const results: SeoAuditResult[] = mockPaths.map(path => {
      const hasMetadata = metaPaths.has(path)
      const hasSitemap = sitemapPaths.has(path)
      const metadataScore = hasMetadata ? 85 : 0
      const suggestions: string[] = []
      if (!hasMetadata) suggestions.push('缺少SEO元数据 (title/description)')
      if (!hasSitemap) suggestions.push('未在sitemap中注册')
      return { path, hasMetadata, hasSitemap, metadataScore, suggestions }
    })

    const issues = results
      .filter(r => r.suggestions.length > 0)
      .flatMap(r => r.suggestions.map(s => ({
        path: r.path,
        severity: (!r.hasMetadata && !r.hasSitemap) ? 'high' as const : 'medium' as const,
        suggestion: s,
      })))

    return {
      totalPages: mockPaths.length,
      pagesWithMetadata: results.filter(r => r.hasMetadata).length,
      pagesWithSitemap: results.filter(r => r.hasSitemap).length,
      avgMetadataScore: Math.round(results.reduce((a, r) => a + r.metadataScore, 0) / results.length),
      coverageRate: Math.round((results.filter(r => r.hasMetadata || r.hasSitemap).length / results.length) * 100),
      issues,
    }
  }

  /**
   * 单页SEO评分
   */
  scorePage(path: string, title: string, description: string): number {
    let score = 0
    if (title && title.length >= 10 && title.length <= 70) score += 30
    else if (title) score += 15
    if (description && description.length >= 50 && description.length <= 160) score += 30
    else if (description) score += 15
    // 标题应含城市 (模拟)
    if (title && /[北京上海广州深圳成都杭州]/.test(title)) score += 20
    // 描述含场景词
    if (description && /[娱乐电玩亲子聚会团购套餐优惠]/.test(description)) score += 20
    return Math.min(score, 100)
  }
}
