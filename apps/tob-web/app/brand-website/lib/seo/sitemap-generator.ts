/**
 * 动态站点地图生成器
 * 支持多语言、优先级、自定义频率配置
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages?: Record<string, string>;
  };
}

export interface SitemapConfig {
  baseUrl: string;
  defaultChangefreq?: SitemapUrl['changefreq'];
  defaultPriority?: number;
  routes: Array<{
    path: string;
    priority?: number;
    changefreq?: SitemapUrl['changefreq'];
    lastmod?: string;
  }>;
}

/**
 * 站点地图生成器类
 */
export class SitemapGenerator {
  private config: Required<SitemapConfig>;

  constructor(config: SitemapConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      defaultChangefreq: config.defaultChangefreq || 'weekly',
      defaultPriority: config.defaultPriority || 0.5,
      routes: config.routes,
    };
  }

  /**
   * 生成XML格式的站点地图
   */
  generate(): string {
    const urls = this.buildUrls();
    return this.buildXml(urls);
  }

  /**
   * 生成站点地图索引（多sitemap场景）
   */
  generateIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (sitemap) => `  <sitemap>
    <loc>${sitemap.loc}</loc>
    ${sitemap.lastmod ? `<lastmod>${sitemap.lastmod}</lastmod>` : ''}
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;
  }

  /**
   * 生成新闻站点地图
   */
  generateNews(news: Array<{ url: string; title: string; pubDate: string; keywords?: string[] }>): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${news
  .map(
    (item) => `  <url>
    <loc>${item.url}</loc>
    <news:news>
      <news:publication>
        <news:name>神机营</news:name>
        <news:language>zh-CN</news:language>
      </news:publication>
      <news:publication_date>${item.pubDate}</news:publication_date>
      <news:title>${this.escapeXml(item.title)}</news:title>
      ${item.keywords ? `<news:keywords>${item.keywords.join(', ')}</news:keywords>` : ''}
    </news:news>
  </url>`
  )
  .join('\n')}
</urlset>`;
  }

  /**
   * 生成视频站点地图
   */
  generateVideo(videos: Array<{
    url: string;
    title: string;
    description: string;
    thumbnail?: string;
    duration?: number;
    publishDate?: string;
    tags?: string[];
  }>): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${videos
  .map(
    (video) => `  <url>
    <loc>${video.url}</loc>
    <video:video>
      <video:title>${this.escapeXml(video.title)}</video:title>
      <video:description>${this.escapeXml(video.description)}</video:description>
      ${video.thumbnail ? `<video:thumbnail_loc>${video.thumbnail}</video:thumbnail_loc>` : ''}
      ${video.duration ? `<video:duration>${video.duration}</video:duration>` : ''}
      ${video.publishDate ? `<video:publication_date>${video.publishDate}</video:publication_date>` : ''}
      ${video.tags ? video.tags.map((tag) => `<video:tag>${this.escapeXml(tag)}</video:tag>`).join('\n      ') : ''}
    </video:video>
  </url>`
  )
  .join('\n')}
</urlset>`;
  }

  /**
   * 构建URL列表
   */
  private buildUrls(): SitemapUrl[] {
    return this.config.routes.map((route) => ({
      loc: `${this.config.baseUrl}${route.path}`,
      lastmod: route.lastmod || this.getCurrentDate(),
      changefreq: route.changefreq || this.config.defaultChangefreq,
      priority: route.priority ?? this.calculatePriority(route.path),
    }));
  }

  /**
   * 根据路径计算优先级
   */
  private calculatePriority(path: string): number {
    if (path === '/') return 1.0;
    if (path === '/contact' || path === '/franchise') return 0.9;
    if (path.startsWith('/products') || path.startsWith('/service')) return 0.8;
    if (path.includes('/detail')) return 0.6;
    return this.config.defaultPriority;
  }

  /**
   * 构建XML
   */
  private buildXml(urls: SitemapUrl[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${(url.priority ?? 0.5).toFixed(1)}</priority>
    ${url.alternates?.languages ? this.buildAlternates(url.alternates.languages) : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;
  }

  /**
   * 构建多语言替代链接
   */
  private buildAlternates(languages: Record<string, string>): string {
    return Object.entries(languages)
      .map(([lang, url]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${url}" />`)
      .join('\n');
  }

  /**
   * XML转义
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 获取当前日期 (ISO 8601)
   */
  private getCurrentDate(): string {
    return new Date().toISOString().split('T')[0] ?? new Date().toISOString().substring(0, 10);
  }
}

// ---- Next.js App Router 集成 ----

/**
 * 品牌官网路由配置
 */
export const brandWebsiteRoutes: Array<{
  path: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
}> = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/products', priority: 0.9, changefreq: 'weekly' },
  { path: '/epc', priority: 0.8, changefreq: 'weekly' },
  { path: '/digital-sports', priority: 0.8, changefreq: 'weekly' },
  { path: '/franchise', priority: 0.9, changefreq: 'weekly' },
  { path: '/supply-chain', priority: 0.8, changefreq: 'weekly' },
  { path: '/service', priority: 0.8, changefreq: 'weekly' },
  { path: '/contact', priority: 0.9, changefreq: 'monthly' },
];

/**
 * 创建品牌官网站点地图生成器
 */
export function createBrandWebsiteSitemap(baseUrl: string) {
  return new SitemapGenerator({
    baseUrl,
    routes: brandWebsiteRoutes,
  });
}
