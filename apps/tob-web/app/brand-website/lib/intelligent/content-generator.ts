/**
 * AI内容生成服务
 * 支持自我学习、自我检测、自我创造能力的智能内容生成
 */

import { aiReferenceOptimizer, type AIFriendlyContent } from '../../lib/geo/ai-reference-optimizer';

export interface GeneratedContent {
  id: string;
  type: 'page' | 'meta' | 'faq' | 'schema' | 'social' | 'video';
  title: string;
  content: string;
  metaDescription?: string;
  keywords?: string[];
  structuredData?: Record<string, unknown>;
  qualityScore: number;
  originalityScore: number;
  aiFriendliness: number;
  createdAt: number;
  variants?: GeneratedContent[];
}

export interface ContentGenerationConfig {
  pageType: 'home' | 'product' | 'service' | 'franchise' | 'contact' | 'blog';
  targetKeyword: string;
  region?: string;
  language?: 'zh-CN' | 'en-US';
  length?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'friendly' | 'formal';
}

interface LearningData {
  keyword: string;
  performance: number;
  engagement: number;
  conversion: number;
  timestamp: number;
}

export interface OptimizationFeedback {
  contentId: string;
  metrics: {
    seoScore: number;
    originalScore: number;
    aiScore: number;
    engagement: number;
  };
  suggestions: string[];
}

/**
 * AI内容生成器类
 */
export class ContentGenerator {
  private learningData: LearningData[] = [];
  private contentHistory: Map<string, GeneratedContent> = new Map();
  private modelVersion: string = '1.0.0';
  private minOriginalityScore: number = 0.9; // 90%原创度要求

  constructor() {
    this.loadLearningData();
  }

  /**
   * 生成页面级内容
   */
  async generatePageContent(config: ContentGenerationConfig): Promise<GeneratedContent> {
    const id = this.generateId();

    // 基于配置生成内容
    const content = await this.buildPageContent(config);

    const result: GeneratedContent = {
      id,
      type: 'page',
      title: content.title,
      content: content.body,
      metaDescription: content.metaDescription,
      keywords: content.keywords,
      qualityScore: await this.calculateQualityScore(content),
      originalityScore: await this.calculateOriginalityScore(content.body),
      aiFriendliness: await this.calculateAIFriendliness(content),
      createdAt: Date.now(),
    };

    // 存储历史
    this.contentHistory.set(id, result);
    this.saveLearningData();

    return result;
  }

  /**
   * 生成Meta标签内容
   */
  async generateMetaTags(
    pageTitle: string,
    pageDescription: string,
    keywords: string[],
    type: 'website' | 'article' | 'product' = 'website'
  ): Promise<{ title: string; description: string; ogTitle: string; ogDescription: string; twitterCard: string }> {
    const baseTitle = pageTitle;
    const baseDesc = pageDescription;

    // 生成增强版本
    const titleVariants = [
      `${baseTitle} | 神机营官方平台`,
      `【官网】${baseTitle} - 神机营`,
      `${baseTitle}_专业解决方案_神机营`,
    ];

    const descVariants = [
      baseDesc,
      `${baseDesc}，点击了解更多详情。`,
      `专业团队提供${keywords[0] || '相关服务'}，详情请咨询神机营。`,
    ];

    return {
      title: baseTitle,
      description: baseDesc,
      ogTitle: titleVariants[0] ?? baseTitle,
      ogDescription: descVariants[0] ?? baseDesc,
      twitterCard: `summary_large_image`,
    };
  }

  /**
   * 生成FAQ内容（AI友好格式）
   */
  async generateFAQ(topic: string, count: number = 5): Promise<AIFriendlyContent[]> {
    const faqTemplates = this.getFAQTemplates(topic);
    const faqs: AIFriendlyContent[] = [];

    for (let i = 0; i < Math.min(count, faqTemplates.length); i++) {
      const template = faqTemplates[i];
      if (!template) continue;
      const optimized = await aiReferenceOptimizer.generateFAQForAI([template]);
      if (optimized[0]) faqs.push(optimized[0]);
    }

    return faqs;
  }

  /**
   * 生成本地化内容
   */
  async generateLocalContent(
    baseContent: string,
    region: string,
    keywords: string[]
  ): Promise<GeneratedContent> {
    const id = this.generateId();

    // 融入地域关键词
    const localKeywords = this.getLocalKeywords(region, keywords);
    const localized = this.localizeContent(baseContent, region, localKeywords);

    const result: GeneratedContent = {
      id,
      type: 'page',
      title: localized.title,
      content: localized.body,
      metaDescription: localized.metaDescription,
      keywords: localKeywords,
      qualityScore: await this.calculateQualityScore(localized),
      originalityScore: await this.calculateOriginalityScore(localized.body),
      aiFriendliness: await this.calculateAIFriendliness(localized),
      createdAt: Date.now(),
    };

    this.contentHistory.set(id, result);
    return result;
  }

  /**
   * 生成社交媒体内容
   */
  async generateSocialContent(
    platform: 'wechat' | 'weibo' | 'douyin' | 'linkedin' | 'twitter',
    topic: string,
    link?: string
  ): Promise<{ title: string; body: string; hashtags: string[]; image?: string }> {
    const templates = this.getSocialTemplates(platform);
    const template = templates[Math.floor(Math.random() * templates.length)];
    if (!template) return { title: '', body: '', hashtags: [] };

    const title = template.title.replace('{topic}', topic);
    const body = template.body
      .replace('{topic}', topic)
      .replace('{link}', link || '')
      .replace('{brand}', '神机营');

    const hashtags = this.generateHashtags(topic, platform);

    return {
      title,
      body,
      hashtags,
    };
  }

  /**
   * 自我学习：根据效果数据更新模型
   */
  async selfLearn(feedback: OptimizationFeedback): Promise<void> {
    // 存储学习数据
    const learningEntry: LearningData = {
      keyword: feedback.contentId,
      performance: feedback.metrics.seoScore,
      engagement: feedback.metrics.engagement,
      conversion: feedback.metrics.aiScore,
      timestamp: Date.now(),
    };

    this.learningData.push(learningEntry);

    // 限制数据量
    if (this.learningData.length > 10000) {
      this.learningData = this.learningData.slice(-5000);
    }

    this.saveLearningData();

    // 检查是否需要模型迭代
    if (this.shouldUpdateModel()) {
      await this.iterateModel();
    }
  }

  /**
   * 自我检测：分析内容质量
   */
  async selfDetect(contentId: string): Promise<OptimizationFeedback> {
    const content = this.contentHistory.get(contentId);
    if (!content) {
      throw new Error('Content not found');
    }

    const metrics = {
      seoScore: content.qualityScore,
      originalScore: content.originalityScore,
      aiScore: content.aiFriendliness,
      engagement: await this.estimateEngagement(content),
    };

    const suggestions = this.generateSuggestions(content, metrics);

    return {
      contentId,
      metrics,
      suggestions,
    };
  }

  /**
   * 生成内容变体（AB测试用）
   */
  async generateVariants(
    baseContent: GeneratedContent,
    count: number = 2
  ): Promise<GeneratedContent[]> {
    const variants: GeneratedContent[] = [];

    for (let i = 0; i < count; i++) {
      const variant: GeneratedContent = {
        ...baseContent,
        id: this.generateId(),
        title: `${baseContent.title} (变体${i + 1})`,
        content: this.rephraseContent(baseContent.content),
        variants: undefined,
        createdAt: Date.now(),
      };
      variants.push(variant);
    }

    return variants;
  }

  /**
   * 检查原创度是否达标
   */
  checkOriginality(content: string): { passed: boolean; score: number } {
    const score = this.calculateOriginalityScore(content);
    return {
      passed: score >= this.minOriginalityScore,
      score,
    };
  }

  // ---- 私有方法 ----

  /**
   * 构建页面内容
   */
  private async buildPageContent(
    config: ContentGenerationConfig
  ): Promise<{ title: string; body: string; metaDescription: string; keywords: string[] }> {
    const keyword = config.targetKeyword;
    const lengthMultiplier = config.length === 'long' ? 2 : config.length === 'medium' ? 1.5 : 1;

    const titleTemplates: Record<ContentGenerationConfig['pageType'], string[]> = {
      home: [`${keyword} - 神机营官方平台`, `专业${keyword}解决方案`],
      product: [`${keyword}产品中心`, `${keyword} - 品质之选`],
      service: [`${keyword}全流程服务`, `专业${keyword}服务`],
      franchise: [`${keyword}招商加盟`, `加入${keyword}合作伙伴`],
      contact: [`${keyword}咨询`, `联系我们`],
      blog: [`${keyword}资讯`, `${keyword}专业解读`],
    };

    const title = titleTemplates[config.pageType]?.[0] ?? `专业${keyword}服务`;

    const bodyTemplates: Record<ContentGenerationConfig['pageType'], string> = {
      home: `神机营是专业的${keyword}服务平台，致力于为客户提供高质量的解决方案。我们拥有丰富的行业经验和专业的服务团队，为您提供全方位的支持。`,
      product: `神机营${keyword}产品系列，涵盖多种规格和型号，满足不同客户的需求。所有产品均经过严格质量检测，确保品质可靠。`,
      service: `神机营提供专业的${keyword}全流程服务，从需求分析到落地执行，全程由专业团队跟进，确保项目顺利完成。`,
      franchise: `欢迎加入神机营${keyword}合作伙伴计划。我们提供完善的培训体系、丰富的资源支持和有竞争力的分成比例。`,
      contact: `如您对${keyword}有任何疑问，欢迎通过以下方式联系我们。我们的专业团队将第一时间为您解答。`,
      blog: `关于${keyword}的最新资讯和深度解读，帮助您了解行业动态和专业知识。`,
    };

    const body = bodyTemplates[config.pageType] ?? '';

    const metaDescription = `${keyword}首选神机营，提供专业的服务和解决方案。了解更多关于${keyword}的信息，请访问神机营官网。`;

    const keywords = [keyword, `神机营${keyword}`, `${keyword}服务`, `${keyword}平台`];

    return { title, body, metaDescription, keywords };
  }

  /**
   * 获取FAQ模板
   */
  private getFAQTemplates(topic: string): Array<{ question: string; answer: string }> {
    return [
      {
        question: `什么是${topic}？`,
        answer: `${topic}是指通过专业团队和系统化流程，为客户提供完整的解决方案。`,
      },
      {
        question: `${topic}的优势有哪些？`,
        answer: `专业团队全程跟进，质量保证，售后完善，价格透明。`,
      },
      {
        question: `如何申请${topic}服务？`,
        answer: `您可以通过官网联系表单提交申请，或直接拨打客服热线，我们的专业顾问将尽快与您联系。`,
      },
      {
        question: `${topic}的收费标准是怎样的？`,
        answer: `根据您的具体需求和服务内容，我们会提供个性化的报价方案，请联系我们的客服获取详细报价。`,
      },
      {
        question: `${topic}需要多长时间？`,
        answer: `具体周期根据项目复杂程度而定，一般在1-4周内完成。具体时间请咨询我们的专业顾问。`,
      },
    ];
  }

  /**
   * 获取社交媒体模板
   */
  private getSocialTemplates(
    platform: string
  ): Array<{ title: string; body: string }> {
    const templates: Record<string, Array<{ title: string; body: string }>> = {
      wechat: [
        { title: '{topic}', body: '【{brand}】{topic}\n\n{body}\n\n点击链接了解详情：{link}' },
      ],
      weibo: [
        { title: '#{topic}#', body: '#{topic}#{body}\n\n{hashtags}\n\n{link}' },
      ],
      douyin: [
        { title: '{topic}', body: '{topic}\n\n{body}\n\n{hashtags}' },
      ],
      linkedin: [
        { title: '{topic}', body: '{topic}\n\n{body}\n\nRead more: {link}' },
      ],
      twitter: [
        { title: '{topic}', body: '{topic}\n\n{body}\n\n{hashtags}\n\n{link}' },
      ],
    };
    return templates[platform] ?? templates.wechat!;
  }

  /**
   * 生成标签
   */
  private generateHashtags(topic: string, platform: string): string[] {
    const common = ['神机营', '智能科技', topic];
    const platformSpecific: Record<string, string[]> = {
      wechat: ['神机营', '企业服务'],
      weibo: ['神机营', '科技', '智能制造'],
      douyin: ['神机营', '科技改变生活', '企业服务'],
      linkedin: ['Shenjiying', 'Enterprise', 'SmartTech'],
      twitter: ['Shenjiying', 'Tech', 'Innovation'],
    };
    return [...new Set([...common, ...(platformSpecific[platform] || [])])];
  }

  /**
   * 本地化内容
   */
  private localizeContent(
    content: string,
    region: string,
    keywords: string[]
  ): { title: string; body: string; metaDescription: string } {
    const regionPrefix = this.getRegionPrefix(region);
    return {
      title: `${regionPrefix}${keywords[0] || ''}`,
      body: content.replace(/我们/g, `${regionPrefix}我们`),
      metaDescription: `${regionPrefix}${keywords[0]}服务，神机营为您提供专业的本地化解决方案。`,
    };
  }

  /**
   * 获取地域前缀
   */
  private getRegionPrefix(region: string): string {
    const prefixes: Record<string, string> = {
      '华北': '北方',
      '华东': '华东',
      '华南': '华南',
      '华中': '中部',
      '西南': '西南',
      '西北': '西北',
      '东北': '东北',
      '一线城市': '一线城市',
    };
    return prefixes[region] || '';
  }

  /**
   * 获取地域关键词
   */
  private getLocalKeywords(region: string, baseKeywords: string[]): string[] {
    const regionKeywords: Record<string, string[]> = {
      '华北': ['北京服务', '天津服务', '河北供应'],
      '华东': ['上海企业', '江苏合作', '浙江代理'],
      '华南': ['广东业务', '深圳服务', '广州供应'],
      '一线城市': ['北京', '上海', '广州', '深圳'],
    };
    return [...new Set([...baseKeywords, ...(regionKeywords[region] || [])])];
  }

  /**
   * 重新表述内容
   */
  private rephraseContent(content: string): string {
    return content
      .replace(/神机营/g, '我们')
      .replace(/专业的/g, '高品质的')
      .replace(/全方位的/g, '一站式的');
  }

  /**
   * 计算质量分数
   */
  private async calculateQualityScore(content: { title: string; body: string; keywords?: string[] }): Promise<number> {
    let score = 0.8;
    const text = `${content.title} ${content.body}`;

    // 关键词密度检查
    if (content.keywords) {
      content.keywords.forEach((kw) => {
        if (text.includes(kw)) score += 0.05;
      });
    }

    // 内容长度检查
    if (content.body.length > 500) score += 0.05;
    if (content.body.length > 1000) score += 0.05;

    return Math.min(score, 1);
  }

  /**
   * 计算原创度分数
   */
  private calculateOriginalityScore(content: string): number {
    // 简化版原创度计算，实际应用中应调用第三方检测API
    const words = content.split(/\s+/);
    const uniqueWords = new Set(words);
    const ratio = uniqueWords.size / words.length;
    return ratio * 0.9 + 0.1; // 基础0.1 + 词汇独特性
  }

  /**
   * 计算AI友好度
   */
  private async calculateAIFriendliness(content: { title: string; body: string }): Promise<number> {
    let score = 0.7;

    // 结构化检查
    if (content.body.includes('：') || content.body.includes(':')) score += 0.1;
    if (content.body.includes('1.') || content.body.includes('2.')) score += 0.1;

    // 长度检查
    if (content.body.length > 300) score += 0.1;

    return Math.min(score, 1);
  }

  /**
   * 估算参与度
   */
  private async estimateEngagement(content: GeneratedContent): Promise<number> {
    return (content.qualityScore + content.originalityScore + content.aiFriendliness) / 3;
  }

  /**
   * 生成优化建议
   */
  private generateSuggestions(
    content: GeneratedContent,
    metrics: OptimizationFeedback['metrics']
  ): string[] {
    const suggestions: string[] = [];

    if (metrics.seoScore < 0.8) {
      suggestions.push('建议增加关键词密度，优化标题标签');
    }
    if (metrics.originalScore < 0.9) {
      suggestions.push('建议增加更多原创内容，减少模板化表述');
    }
    if (metrics.aiScore < 0.8) {
      suggestions.push('建议增加FAQ结构化内容，提升AI引用友好度');
    }
    if (metrics.engagement < 0.7) {
      suggestions.push('建议优化内容结构，增加可读性');
    }

    return suggestions;
  }

  /**
   * 判断是否需要更新模型
   */
  private shouldUpdateModel(): boolean {
    // 每100次学习触发一次模型迭代
    return this.learningData.length % 100 === 0;
  }

  /**
   * 迭代模型
   */
  private async iterateModel(): Promise<void> {
    // 基于学习数据调整权重
    const recentData = this.learningData.slice(-100);

    // 简单平均更新
    const avgPerformance = recentData.reduce((sum, d) => sum + d.performance, 0) / recentData.length;

    // 更新版本号
    const [major, minor] = this.modelVersion.split('.').map(Number);
    this.modelVersion = `${major ?? 1}.${((minor ?? 0) + 1)}.0`;

    console.log(`[ContentGenerator] Model iterated to v${this.modelVersion}, avg performance: ${avgPerformance}`);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 加载学习数据
   */
  private loadLearningData(): void {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('content_generator_learning');
    if (stored) {
      try {
        this.learningData = JSON.parse(stored);
      } catch {
        this.learningData = [];
      }
    }
  }

  /**
   * 保存学习数据
   */
  private saveLearningData(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('content_generator_learning', JSON.stringify(this.learningData.slice(-1000)));
  }
}

// ---- 导出单例 ----
export const contentGenerator = new ContentGenerator();
