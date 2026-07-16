# P-49 SEO/GEO 系统详细设计文档

## 1. 概述

### 1.1 模块定位
SEO/GEO (Search Engine Optimization / Generative Engine Optimization) 系统是 M5 Platform V17 的核心流量获取模块，负责：
- **传统 SEO**: Sitemap 自治、结构化数据、Meta 标签优化
- **GEO 优化**: AI 引用优化、知识图谱适配、大模型友好内容

### 1.2 核心目标
| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| 搜索引擎收录率 | > 95% | 核心页面 48h 内收录 |
| 自然搜索流量占比 | > 40% | 月度同比增长 > 15% |
| AI 引用准确率 | > 90% | 品牌信息被 AI 正确引用 |
| Core Web Vitals | 全绿 | LCP < 2.5s, CLS < 0.1 |

### 1.3 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                     SEO/GEO 系统架构                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Sitemap    │  │  Meta Tag   │  │  Structured Data    │  │
│  │  Generator  │  │  Injector   │  │  (JSON-LD)          │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │            │
│  ┌──────▼────────────────▼────────────────────▼──────────┐  │
│  │              Content Delivery Layer                  │  │
│  │         (CDN + Edge Cache + SSR)                     │  │
│  └──────┬───────────────────────────────────────────────┘  │
│         │                                                  │
│  ┌──────▼──────────────────────────────────────────────┐  │
│  │              GEO (AI Optimization) Layer               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │  Knowledge  │  │  AI Snippet │  │  Entity      │  │  │
│  │  │  Graph      │  │  Optimizer  │  │  Extraction  │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 核心模块设计

### 2.1 Sitemap 自治系统

#### 2.1.1 功能概述
- **增量生成**: 仅生成变更页面，支持优先级队列
- **多格式输出**: XML Sitemap、RSS、Atom、TXT
- **自动提交**: 主动推送至 Google/Bing/Baidu Index API
- **监控告警**: 收录率监控、索引异常告警

#### 2.1.2 数据模型

```typescript
// Sitemap 配置
interface SitemapConfig {
  id: string;
  tenantId: string;
  siteUrl: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number; // 0.0 - 1.0
  autoSubmit: boolean;
  submitTargets: ('google' | 'bing' | 'baidu')[];
  lastGeneratedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sitemap 条目
interface SitemapEntry {
  id: string;
  sitemapId: string;
  url: string;
  lastmod?: Date;
  changefreq?: string;
  priority?: number;
  alternates?: {
    hreflang: string;
    href: string;
  }[];
  images?: {
    loc: string;
    caption?: string;
    title?: string;
  }[];
  isIndexed: boolean;
  indexedAt?: Date;
  clickCount: number;
  impressionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// 索引提交记录
interface IndexSubmission {
  id: string;
  entryId: string;
  target: 'google' | 'bing' | 'baidu';
  status: 'pending' | 'success' | 'failed';
  response?: string;
  submittedAt: Date;
  completedAt?: Date;
  retryCount: number;
}
```

#### 2.1.3 核心服务

```typescript
@Injectable()
export class SitemapService {
  constructor(
    @InjectRepository(SitemapConfig)
    private configRepo: Repository<SitemapConfig>,
    @InjectRepository(SitemapEntry)
    private entryRepo: Repository<SitemapEntry>,
    private indexSubmitter: IndexSubmitterService,
    private urlDiscovery: UrlDiscoveryService,
    private cache: CacheService,
  ) {}

  /**
   * 生成完整 Sitemap
   */
  async generateSitemap(configId: string): Promise<GeneratedSitemap> {
    const config = await this.configRepo.findOne({ where: { id: configId } });
    if (!config) throw new NotFoundException('Sitemap config not found');

    // 1. 发现所有 URL
    const urls = await this.urlDiscovery.discoverUrls(config.tenantId);

    // 2. 批量生成条目
    const entries = await this.batchCreateEntries(configId, urls);

    // 3. 生成 XML
    const xml = this.generateXml(config, entries);

    // 4. 更新配置
    config.lastGeneratedAt = new Date();
    await this.configRepo.save(config);

    // 5. 自动提交到搜索引擎
    if (config.autoSubmit) {
      await this.submitToSearchEngines(config, entries);
    }

    return {
      configId,
      entryCount: entries.length,
      xml,
      generatedAt: new Date(),
    };
  }

  /**
   * 增量更新 Sitemap
   */
  async incrementalUpdate(configId: string, changedUrls: string[]): Promise<void> {
    const config = await this.configRepo.findOne({ where: { id: configId } });
    if (!config) return;

    for (const url of changedUrls) {
      const existing = await this.entryRepo.findOne({ where: { url } });
      
      if (existing) {
        // 更新现有条目
        existing.lastmod = new Date();
        await this.entryRepo.save(existing);
      } else {
        // 创建新条目
        await this.createEntry(configId, url);
      }
    }

    // 标记需要重新生成
    await this.cache.del(`sitemap:${configId}:xml`);
  }

  /**
   * 提交到搜索引擎索引 API
   */
  private async submitToSearchEngines(
    config: SitemapConfig,
    entries: SitemapEntry[],
  ): Promise<void> {
    const highPriorityEntries = entries
      .filter(e => (e.priority || 0) >= 0.8)
      .slice(0, 100); // 每批最多 100 个

    for (const target of config.submitTargets) {
      for (const entry of highPriorityEntries) {
        await this.indexSubmitter.submit({
          url: entry.url,
          target,
          entryId: entry.id,
        });
      }
    }
  }

  /**
   * 生成 XML Sitemap
   */
  private generateXml(config: SitemapConfig, entries: SitemapEntry[]): string {
    const urls = entries.map(entry => {
      let urlXml = `  <url>\n`;
      urlXml += `    <loc>${this.escapeXml(entry.url)}</loc>\n`;
      
      if (entry.lastmod) {
        urlXml += `    <lastmod>${entry.lastmod.toISOString().split('T')[0]}</lastmod>\n`;
      }
      
      if (entry.changefreq) {
        urlXml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
      }
      
      if (entry.priority !== undefined) {
        urlXml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      }

      // 多语言支持
      if (entry.alternates?.length) {
        for (const alt of entry.alternates) {
          urlXml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${this.escapeXml(alt.hrefhref)}" />\n`;
        }
      }

      // 图片支持
      if (entry.images?.length) {
        for (const img of entry.images) {
          urlXml += `    <image:image>\n`;
          urlXml += `      <image:loc>${this.escapeXml(img.loc)}</image:loc>\n`;
          if (img.caption) urlXml += `      <image:caption>${this.escapeXml(img.caption)}</image:caption>\n`;
          if (img.title) urlXml += `      <image:title>${this.escapeXml(img.title)}</image:title>\n`;
          urlXml += `    </image:image>\n`;
        }
      }

      urlXml += `  </url>`;
      return urlXml;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
           `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"` +
           ` xmlns:xhtml="http://www.w3.org/1999/xhtml"` +
           ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
           urls.join('\n') + `\n</urlset>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
```

#### 2.1.4 接口设计

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 生成 Sitemap | POST | `/api/v1/seo/sitemap/:configId/generate` | 触发完整生成 |
| 增量更新 | POST | `/api/v1/seo/sitemap/:configId/incremental` | 增量更新指定 URL |
| 获取 Sitemap | GET | `/sitemap.xml` | 公开访问的 Sitemap |
| 获取索引状态 | GET | `/api/v1/seo/sitemap/:configId/index-status` | 查询索引收录状态 |
| 提交 URL | POST | `/api/v1/seo/sitemap/submit-url` | 手动提交 URL 到搜索引擎 |

---

### 2.2 GEO (AI 引用优化) 系统

#### 2.2.1 功能概述
- **知识图谱实体**: 构建品牌/产品/地点的结构化实体
- **AI Snippet 优化**: 针对大模型回答的特征优化
- **引用追踪**: 监控品牌被 AI 引用的频次和上下文

#### 2.2.2 数据模型

```typescript
// 实体定义 (Entity)
interface GeoEntity {
  id: string;
  tenantId: string;
  type: 'brand' | 'product' | 'location' | 'person' | 'event';
  name: string;
  description: string;
  aliases: string[]; // 别名/同义词
  sameAs: string[]; // 外部链接 (Wikipedia, Wikidata 等)
  image?: string;
  properties: Record<string, unknown>;
  schemaMarkup: object; // JSON-LD 结构化数据
  confidenceScore: number; // 实体置信度
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// AI 引用记录
interface AICitation {
  id: string;
  tenantId: string;
  entityId: string;
  source: 'chatgpt' | 'claude' | 'bard' | 'perplexity' | 'other';
  query: string; // 用户查询
  response: string; // AI 回答
  citationContext: string; // 引用的上下文
  isAccurate: boolean; // 引用是否准确
  sentiment: 'positive' | 'neutral' | 'negative';
  detectedAt: Date;
}

// 内容优化建议
interface ContentOptimization {
  id: string;
  tenantId: string;
  pageUrl: string;
  suggestions: {
    type: 'schema_markup' | 'entity_mention' | 'faq' | 'snippet_optimization';
    priority: 'high' | 'medium' | 'low';
    description: string;
    example: string;
    expectedImpact: string;
  }[];
  createdAt: Date;
}
```

#### 2.2.3 核心服务

```typescript
@Injectable()
export class GeoOptimizationService {
  constructor(
    @InjectRepository(GeoEntity)
    private entityRepo: Repository<GeoEntity>,
    @InjectRepository(AICitation)
    private citationRepo: Repository<AICitation>,
    private aiMonitor: AIMonitoringService,
    private schemaGenerator: SchemaMarkupService,
  ) {}

  /**
   * 注册实体到知识图谱
   */
  async registerEntity(entity: Omit<GeoEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeoEntity> {
    // 生成 JSON-LD Schema
    const schemaMarkup = this.schemaGenerator.generateEntitySchema(entity);
    
    const newEntity = this.entityRepo.create({
      ...entity,
      schemaMarkup,
      confidenceScore: 1.0,
      isVerified: false,
    });

    return this.entityRepo.save(newEntity);
  }

  /**
   * 监控 AI 引用
   */
  async monitorAICitations(tenantId: string, duration: number = 24 * 60 * 60 * 1000): Promise<{
    totalCitations: number;
    accurateRate: number;
    sentimentDistribution: { positive: number; neutral: number; negative: number };
  }> {
    const startTime = new Date(Date.now() - duration);
    
    const citations = await this.citationRepo.find({
      where: {
        tenantId,
        detectedAt: MoreThan(startTime),
      },
    });

    const total = citations.length;
    const accurate = citations.filter(c => c.isAccurate).length;
    const sentimentDist = {
      positive: citations.filter(c => c.sentiment === 'positive').length,
      neutral: citations.filter(c => c.sentiment === 'neutral').length,
      negative: citations.filter(c => c.sentiment === 'negative').length,
    };

    return {
      totalCitations: total,
      accurateRate: total > 0 ? accurate / total : 0,
      sentimentDistribution: sentimentDist,
    };
  }

  /**
   * 生成页面优化建议
   */
  async generateOptimizationSuggestions(pageUrl: string, tenantId: string): Promise<ContentOptimization> {
    const suggestions = [];

    // 1. 检查 Schema Markup
    const schemaCheck = await this.checkSchemaMarkup(pageUrl);
    if (!schemaCheck.hasRequiredSchema) {
      suggestions.push({
        type: 'schema_markup',
        priority: 'high',
        description: '页面缺少必要的结构化数据标记',
        example: this.generateSchemaExample(schemaCheck.detectedEntities),
        expectedImpact: '提升搜索结果富媒体展示率 30%+',
      });
    }

    // 2. 检查实体提及
    const entityCheck = await this.checkEntityMentions(pageUrl, tenantId);
    if (entityCheck.missingCoreEntities.length > 0) {
      suggestions.push({
        type: 'entity_mention',
        priority: 'medium',
        description: `页面未提及核心实体: ${entityCheck.missingCoreEntities.join(', ')}`,
        example: `在首段自然融入实体名称，如"${entityCheck.suggestedSentence}"`,
        expectedImpact: '提升实体关联度和知识图谱收录概率',
      });
    }

    // 3. FAQ 优化
    const faqCheck = await this.checkFAQOptimization(pageUrl);
    if (!faqCheck.hasFAQ) {
      suggestions.push({
        type: 'faq',
        priority: 'medium',
        description: '页面缺少 FAQ 结构化数据',
        example: this.generateFAQExample(),
        expectedImpact: '获取搜索结果 FAQ 富媒体展示位',
      });
    }

    const optimization = this.contentOptimizationRepo.create({
      tenantId,
      pageUrl,
      suggestions,
    });

    return this.contentOptimizationRepo.save(optimization);
  }
}
```

#### 2.2.4 接口设计

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 注册实体 | POST | `/api/v1/geo/entities` | 注册知识图谱实体 |
| 获取实体 | GET | `/api/v1/geo/entities/:id` | 查询实体详情 |
| 更新实体 | PUT | `/api/v1/geo/entities/:id` | 更新实体信息 |
| 删除实体 | DELETE | `/api/v1/geo/entities/:id` | 删除实体 |
| 获取 AI 引用统计 | GET | `/api/v1/geo/citations/stats` | 获取 AI 引用统计数据 |
| 生成优化建议 | POST | `/api/v1/geo/optimization/suggest` | 生成页面优化建议 |
| 获取优化建议 | GET | `/api/v1/geo/optimization/:id` | 查询优化建议详情 |

---

## 3. 数据库模型 (Prisma)

```prisma
// SEO/GEO 系统数据模型

// Sitemap 配置
model SitemapConfig {
  id              String   @id @default(uuid())
  tenantId        String
  siteUrl         String
  changefreq      String   @default("daily")
  priority        Float    @default(0.5)
  autoSubmit      Boolean  @default(true)
  submitTargets   String[] // google, bing, baidu
  lastGeneratedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  entries SitemapEntry[]

  @@index([tenantId])
  @@map("sitemap_configs")
}

// Sitemap 条目
model SitemapEntry {
  id                String   @id @default(uuid())
  sitemapId         String
  url               String
  lastmod           DateTime?
  changefreq        String?
  priority          Float?
  alternates        Json? // { hreflang, href }[]
  images            Json? // { loc, caption?, title? }[]
  isIndexed         Boolean  @default(false)
  indexedAt         DateTime?
  clickCount        Int      @default(0)
  impressionCount   Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  sitemap     SitemapConfig    @relation(fields: [sitemapId], references: [id], onDelete: Cascade)
  submissions IndexSubmission[]

  @@index([sitemapId])
  @@index([url])
  @@map("sitemap_entries")
}

// 索引提交记录
model IndexSubmission {
  id          String   @id @default(uuid())
  entryId     String
  target      String   // google, bing, baidu
  status      String   // pending, success, failed
  response    String?
  submittedAt DateTime @default(now())
  completedAt DateTime?
  retryCount  Int      @default(0)

  entry SitemapEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)

  @@index([entryId])
  @@map("index_submissions")
}

// GEO 实体
model GeoEntity {
  id              String   @id @default(uuid())
  tenantId        String
  type            String   // brand, product, location, person, event
  name            String
  description     String
  aliases         String[]
  sameAs          String[] // 外部链接
  image           String?
  properties      Json     // 扩展属性
  schemaMarkup    Json     // JSON-LD 结构化数据
  confidenceScore Float    @default(1.0)
  isVerified      Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  citations AICitation[]

  @@index([tenantId])
  @@index([type])
  @@map("geo_entities")
}

// AI 引用记录
model AICitation {
  id               String   @id @default(uuid())
  tenantId         String
  entityId         String
  source           String   // chatgpt, claude, bard, perplexity, other
  query            String
  response         String   @db.Text
  citationContext  String   @db.Text
  isAccurate       Boolean
  sentiment        String   // positive, neutral, negative
  detectedAt       DateTime @default(now())

  entity GeoEntity @relation(fields: [entityId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([entityId])
  @@index([detectedAt])
  @@map("ai_citations")
}

// 内容优化建议
model ContentOptimization {
  id          String   @id @default(uuid())
  tenantId    String
  pageUrl     String
  suggestions Json     // 优化建议列表
  appliedAt   DateTime?
  createdAt   DateTime @default(now())

  @@index([tenantId])
  @@index([pageUrl])
  @@map("content_optimizations")
}
```

---

## 4. 监控与告警

### 4.1 核心指标

```yaml
# SEO/GEO 监控指标
seo_metrics:
  - name: sitemap_coverage
    description: Sitemap 覆盖率
    type: gauge
    labels: [tenant_id, site_url]
    
  - name: index_rate
    description: 搜索引擎索引率
    type: gauge
    labels: [tenant_id, search_engine]
    
  - name: organic_traffic
    description: 自然搜索流量
    type: counter
    labels: [tenant_id, landing_page]
    
  - name: core_web_vitals_lcp
    description: 最大内容渲染时间
    type: histogram
    labels: [tenant_id, page_url]
    buckets: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0]
    
  - name: ai_citation_count
    description: AI 引用次数
    type: counter
    labels: [tenant_id, entity_id, source]
    
  - name: ai_citation_accuracy
    description: AI 引用准确率
    type: gauge
    labels: [tenant_id, source]

geo_alerts:
  - name: LowIndexRate
    condition: index_rate < 0.8
    severity: warning
    
  - name: CriticalLCP
    condition: core_web_vitals_lcp > 2.5
    severity: critical
    
  - name: AICitationDrop
    condition: rate(ai_citation_count[1h]) < 10
    severity: warning
```

---

## 5. 部署与配置

### 5.1 环境变量

```bash
# SEO/GEO 系统配置

# Sitemap 配置
SITEMAP_DEFAULT_CHANGEFREQ=daily
SITEMAP_DEFAULT_PRIORITY=0.5
SITEMAP_MAX_ENTRIES=50000
SITEMAP_AUTO_SUBMIT=true

# 搜索引擎 API 配置
GOOGLE_INDEX_API_KEY=xxx
GOOGLE_CLIENT_EMAIL=xxx
BING_WEBMASTER_API_KEY=xxx
BAIDU_ZHANZHANG_TOKEN=xxx

# GEO 配置
GEO_ENTITY_CONFIDENCE_THRESHOLD=0.8
GEO_CITATION_MONITOR_ENABLED=true
GEO_AI_SOURCES=chatgpt,claude,bard,perplexity

# 监控
SEO_METRICS_ENABLED=true
SEO_ALERTS_ENABLED=true
```

### 5.2 Nginx 配置

```nginx
# Sitemap 和 SEO 优化配置

server {
    listen 80;
    server_name example.com;
    
    # Sitemap 路由
    location = /sitemap.xml {
        proxy_pass http://api:3000/sitemap.xml;
        proxy_cache sitemap_cache;
        proxy_cache_valid 200 1h;
        add_header Content-Type application/xml;
    }
    
    # Robots.txt
    location = /robots.txt {
        proxy_pass http://api:3000/robots.txt;
    }
    
    # 静态资源缓存优化 (Core Web Vitals)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 6M;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
}
```

---

## 6. 验收标准

### 6.1 功能验收

| 验收项 | 验收标准 | 优先级 |
|--------|----------|--------|
| Sitemap 生成 | XML 格式正确，符合 sitemaps.org 标准 | P0 |
| 搜索引擎提交 | 自动提交到 Google/Bing/Baidu Index API | P0 |
| 实体注册 | 支持品牌/产品/地点等实体类型 | P0 |
| AI 引用监控 | 捕获 ChatGPT/Claude 等 AI 的引用 | P1 |
| 结构化数据 | 自动生成 JSON-LD Schema Markup | P0 |

### 6.2 性能验收

| 指标 | 目标值 | 验收标准 |
|------|--------|----------|
| Sitemap 生成时间 | < 30s | 50,000 个 URL |
| 索引提交延迟 | < 5s | 单条 URL |
| 实体查询响应 | < 100ms | P95 |
| AI 监控覆盖率 | > 90% | 主流 AI 平台 |

---

## 7. 附录

### 7.1 JSON-LD Schema 示例

```json
{
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  "name": "M5 数字运动潮玩馆",
  "description": "集运动、科技、娱乐于一体的数字运动体验中心",
  "url": "https://example.com/venue/m5-beijing",
  "telephone": "+86-10-12345678",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "朝阳区建国路 88 号",
    "addressLocality": "北京",
    "addressRegion": "北京市",
    "postalCode": "100022",
    "addressCountry": "CN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 39.9042,
    "longitude": 116.4074
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "10:00",
      "closes": "22:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday", "Sunday"],
      "opens": "09:00",
      "closes": "23:00"
    }
  ],
  "priceRange": "$$",
  "image": [
    "https://example.com/images/venue-1.jpg",
    "https://example.com/images/venue-2.jpg"
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "256"
  }
}
```

### 7.2 相关文档索引

| 文档 | 路径 | 描述 |
|------|------|------|
| 性能优化设计 | [performance-optimization-design.md](./performance-optimization-design.md) | P-55 性能模块 |
| 多租户架构 | [tenant-architecture-design.md](./tenant-architecture-design.md) | P-31 租户模块 |
| 运维手册 | [../operations/README.md](../operations/README.md) | 部署运维指南 |

---

**文档版本**: v1.0.0  
**最后更新**: 2026-07-16  
**作者**: M5 Platform Team
