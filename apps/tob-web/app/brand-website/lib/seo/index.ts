/**
 * SEO服务导出索引
 */

// SEO元标签生成服务
export { seoMetaGenerator, type MetaGeneratorOptions as SEOMetaOptions } from './meta-generator';

// 站点地图生成服务
export {
  SitemapGenerator,
  createBrandWebsiteSitemap,
  brandWebsiteRoutes,
  type SitemapConfig,
  type SitemapUrl,
} from './sitemap-generator';

// 性能监控服务
export {
  PerformanceMonitor,
  globalPerformanceMonitor,
  WEB_VITALS_THRESHOLDS,
  type WebVitalsMetrics,
  type PerformanceThresholds,
  type PerformanceReport,
} from './performance-monitor';
