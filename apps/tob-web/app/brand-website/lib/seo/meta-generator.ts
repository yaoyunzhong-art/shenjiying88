/**
 * SEO元标签智能生成服务
 * 基于页面内容AI生成优化的meta标签、OG标签、Twitter卡片
 */

'use client';

// ─── 类型定义 ───────────────────────────────────────────────────────────────

export interface MetaGeneratorOptions {
  page: string;
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product' | 'business';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export interface GeneratedMeta {
  title: string;
  description: string;
  keywords: string[];
  og: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
    siteName: string;
    locale: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
    site: string;
    creator: string;
  };
  robots: string;
  canonical: string;
  alternate?: {
    lang: string;
    url: string;
  }[];
}

export interface SEOPattern {
  templates: {
    title: (data: { title: string; brand: string; suffix?: string }) => string;
    description: (data: { description: string; location?: string }) => string;
    keywords: (data: { keywords: string[]; industry: string }) => string[];
  };
  rules: {
    maxTitleLength: number;
    maxDescriptionLength: number;
    titlePrefix: string;
    descriptionSuffix: string;
  };
}

// ─── 默认配置 ───────────────────────────────────────────────────────────────

const SEO_CONFIG = {
  brand: '神机营',
  siteUrl: 'https://shenjiying.com',
  defaultOgImage: '/og-image.jpg',
  twitterHandle: '@shenjiying',
  locale: 'zh_CN',
  supportedLocales: ['zh_CN', 'en_US'],
  patterns: {
    maxTitleLength: 60,
    maxDescriptionLength: 160,
    titleSuffix: ' | 神机营',
  },
} as const;

// ─── 核心生成器 ─────────────────────────────────────────────────────────────

class SEOMetaGenerator {
  private config = SEO_CONFIG;

  /**
   * 生成完整的SEO meta标签对象
   */
  generate(options: MetaGeneratorOptions): GeneratedMeta {
    const {
      page,
      title,
      description,
      keywords = [],
      ogImage,
      canonical,
      noindex = false,
      type = 'website',
      publishedTime,
      modifiedTime,
      author,
      section,
      tags = [],
    } = options;

    const fullTitle = this.generateTitle(title);
    const fullDescription = this.generateDescription(description);
    const finalKeywords = keywords.length > 0 ? keywords : this.generateKeywords(title, section, tags);

    return {
      title: fullTitle,
      description: fullDescription,
      keywords: finalKeywords,
      og: this.generateOG(page, fullTitle, fullDescription, ogImage, type),
      twitter: this.generateTwitter(fullTitle, fullDescription, ogImage),
      robots: this.generateRobots(noindex),
      canonical: this.generateCanonical(page, canonical),
      alternate: this.generateAlternate(page),
    };
  }

  /**
   * 生成页面标题
   * 格式: 页面标题 | 品牌名
   */
  generateTitle(title: string, addSuffix = true): string {
    const maxLength = this.config.patterns.maxTitleLength;
    let fullTitle = addSuffix ? `${title}${this.config.patterns.titleSuffix}` : title;

    if (fullTitle.length > maxLength) {
      fullTitle = fullTitle.substring(0, maxLength - 3) + '...';
    }

    return fullTitle;
  }

  /**
   * 生成Meta描述
   */
  generateDescription(description: string, maxLength = 160): string {
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength - 3) + '...';
  }

  /**
   * 生成关键词
   */
  generateKeywords(title: string, section?: string, tags: string[] = []): string[] {
    const keywords = new Set<string>();

    // 添加品牌词
    keywords.add(this.config.brand);
    keywords.add('企业服务');
    keywords.add('B2B');

    // 从标题提取
    const titleWords = title.split(/[,\s]+/);
    titleWords.forEach((word) => {
      if (word.length >= 2 && word.length <= 6) {
        keywords.add(word);
      }
    });

    // 添加section
    if (section) {
      keywords.add(section);
    }

    // 添加标签
    tags.forEach((tag) => keywords.add(tag));

    return Array.from(keywords).slice(0, 10);
  }

  /**
   * 生成Open Graph标签
   */
  private generateOG(
    page: string,
    title: string,
    description: string,
    ogImage?: string,
    type = 'website'
  ): GeneratedMeta['og'] {
    return {
      title,
      description: description.substring(0, 200),
      image: ogImage || `${this.config.siteUrl}${this.config.defaultOgImage}`,
      url: this.generateUrl(page),
      type,
      siteName: this.config.brand,
      locale: this.config.locale,
    };
  }

  /**
   * 生成Twitter卡片
   */
  private generateTwitter(title: string, description: string, ogImage?: string): GeneratedMeta['twitter'] {
    return {
      card: 'summary_large_image',
      title,
      description: description.substring(0, 200),
      image: ogImage || `${this.config.siteUrl}${this.config.defaultOgImage}`,
      site: this.config.twitterHandle,
      creator: this.config.twitterHandle,
    };
  }

  /**
   * 生成robots指令
   */
  private generateRobots(noindex: boolean): string {
    if (noindex) {
      return 'noindex, nofollow';
    }
    return 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  }

  /**
   * 生成规范链接
   */
  private generateCanonical(page: string, canonical?: string): string {
    if (canonical) {
      return canonical.startsWith('http') ? canonical : `${this.config.siteUrl}${canonical}`;
    }
    return this.generateUrl(page);
  }

  /**
   * 生成多语言替代链接
   */
  private generateAlternate(page: string): GeneratedMeta['alternate'] {
    return this.config.supportedLocales.map((lang) => ({
      lang,
      url: `${this.config.siteUrl}/${lang}${page}`,
    }));
  }

  /**
   * 生成完整URL
   */
  private generateUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.siteUrl}${cleanPath}`;
  }

  /**
   * 生成JSON-LD脚本内容
   */
  generateJsonLd(data: Record<string, unknown>): string {
    return JSON.stringify({
      '@context': 'https://schema.org',
      ...data,
    });
  }
}

// ─── 导出单例 ───────────────────────────────────────────────────────────────

export const seoMetaGenerator = new SEOMetaGenerator();

// ─── 预设页面Meta ────────────────────────────────────────────────────────────

export const PRESET_META: Record<string, MetaGeneratorOptions> = {
  home: {
    page: '/',
    title: '神机营 - 企业级全链路服务品牌',
    description: '神机营专注为企业客户提供产品供应链、EPC+O全流程服务、数字运动潮玩馆一站式解决方案，助力合作伙伴实现商业增长',
    keywords: ['企业服务', '供应链', 'EPC', '数字运动', '招商加盟', '神机营'],
    type: 'website',
  },
  products: {
    page: '/products',
    title: '产品销售合作 - 全品类供应链支持',
    description: '涵盖食品、饮料、日用品、电子、服装等全品类产品，灵活的供货政策和价格体系，满足不同规模企业的采购需求',
    keywords: ['产品销售', '供应链', '企业采购', '批发', '供货商'],
    type: 'website',
  },
  franchise: {
    page: '/franchise',
    title: '招商加盟合作 - 三类模式灵活选择',
    description: '提供特许加盟、合资联营、品牌授权三种合作模式，灵活的政策和全方位的支持体系，助力合作伙伴快速起步',
    keywords: ['招商加盟', '特许加盟', '合资联营', '品牌授权', '投资'],
    type: 'website',
  },
  contact: {
    page: '/contact',
    title: '联系我们 - 开启商业合作之旅',
    description: '无论您选择哪种合作模式，我们的专业团队都将为您提供定制化的解决方案。填写表单或直接联系我们',
    keywords: ['联系我们', '商务合作', '咨询热线', '企业咨询'],
    type: 'website',
  },
};

// ─── 帮助函数 ────────────────────────────────────────────────────────────────

/**
 * 生成面包屑结构化数据
 */
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SEO_CONFIG.siteUrl}${item.url}`,
    })),
  });
}

/**
 * 生成FAQ结构化数据
 */
export function generateFAQJsonLd(
  faqs: { question: string; answer: string }[]
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  });
}

/**
 * 生成Organization结构化数据
 */
export function generateOrganizationJsonLd(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '神机营',
    url: SEO_CONFIG.siteUrl,
    logo: `${SEO_CONFIG.siteUrl}/logo.png`,
    description: '企业级全链路服务品牌，专注供应链、EPC+O、数字运动三大核心业务',
    foundingDate: '2020',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: '500',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '400-888-8888',
      contactType: 'customer service',
      availableLanguage: ['Chinese', 'English'],
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '21:00',
      },
    },
    sameAs: [
      'https://weibo.com/shenjiying',
      'https://www.xiaohongshu.com/shenjiying',
      'https://www.douyin.com/shenjiying',
    ],
  });
}

/**
 * 生成LocalBusiness结构化数据
 */
export function generateLocalBusinessJsonLd(
  location: {
    name: string;
    address: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
    latitude?: number;
    longitude?: number;
  }
): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: location.name,
    image: `${SEO_CONFIG.siteUrl}/og-image.jpg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.address,
      addressLocality: location.city,
      addressRegion: location.region,
      postalCode: location.postalCode,
      addressCountry: location.country,
    },
    geo: location.latitude && location.longitude
      ? {
          '@type': 'GeoCoordinates',
          latitude: location.latitude,
          longitude: location.longitude,
        }
      : undefined,
    telephone: location.phone,
    url: SEO_CONFIG.siteUrl,
    priceRange: '¥¥¥',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    sameAs: [
      'https://weibo.com/shenjiying',
      'https://www.xiaohongshu.com/shenjiying',
    ],
  });
}
