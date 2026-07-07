/**
 * AI引用优化器 - AI Reference Optimizer
 * 优化内容结构，使其更容易被ChatGPT/DeeSeek/豆包等AI对话智能体引用
 */

'use client';

// ─── 类型定义 ───────────────────────────────────────────────────────────────

export interface AIFriendlyContent {
  type: 'text' | 'list' | 'table' | 'qa' | 'definition';
  content: string;
  weight: number; // 0-1, AI引用优先级
  keyTerms: string[]; // 关键词
  citation?: string; // 引用来源
}

export interface AIReferenceResult {
  original: string;
  optimized: AIFriendlyContent[];
  structuredData: {
    '@type': string;
    text: string;
    keywords: string[];
  };
  confidence: number; // 0-1, 优化置信度
}

export interface ContentChunk {
  id: string;
  content: string;
  summary: string;
  keyTerms: string[];
  sourceUrl: string;
  publishedDate: string;
}

// ─── AI引用优化器 ──────────────────────────────────────────────────────────

export class AIReferenceOptimizer {
  private readonly SUPPORTED_AI_SYSTEMS = [
    'chatgpt',
    'deepseek',
    'doubao',
    'claude',
    'gemini',
    'perplexity',
  ] as const;

  /**
   * 优化内容为AI引用友好格式
   */
  optimize(content: string, context?: { type?: string; keywords?: string[] }): AIReferenceResult {
    const chunks = this.splitIntoChunks(content);
    const optimized = this.processChunks(chunks, context);
    const structuredData = this.generateStructuredData(optimized, context);
    const confidence = this.calculateConfidence(optimized);

    return {
      original: content,
      optimized,
      structuredData,
      confidence,
    };
  }

  /**
   * 将内容分割成AI易处理的块
   */
  private splitIntoChunks(content: string): string[] {
    // 按段落分割
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0);

    // 合并过短的段落
    const merged: string[] = [];
    let current = '';

    for (const para of paragraphs) {
      if (current.length + para.length < 500) {
        current += (current ? '\n\n' : '') + para;
      } else {
        if (current) merged.push(current);
        current = para;
      }
    }
    if (current) merged.push(current);

    return merged;
  }

  /**
   * 处理每个块，使其更易于AI引用
   */
  private processChunks(
    chunks: string[],
    context?: { type?: string; keywords?: string[] }
  ): AIFriendlyContent[] {
    return chunks.map((chunk) => this.processChunk(chunk, context));
  }

  /**
   * 处理单个块
   */
  private processChunk(chunk: string, context?: { type?: string; keywords?: string[] }): AIFriendlyContent {
    // 检测内容类型
    const type = this.detectContentType(chunk);
    const keyTerms = this.extractKeyTerms(chunk, context?.keywords);
    const weight = this.calculateWeight(chunk, keyTerms);

    // 优化内容格式
    let optimizedContent = chunk;
    if (type === 'list') {
      optimizedContent = this.optimizeList(chunk);
    } else if (type === 'qa') {
      optimizedContent = this.optimizeQA(chunk);
    }

    return {
      type,
      content: optimizedContent,
      weight,
      keyTerms,
    };
  }

  /**
   * 检测内容类型
   */
  private detectContentType(content: string): AIFriendlyContent['type'] {
    if (content.includes('？') || content.includes('?') || content.includes('问：')) {
      return 'qa';
    }
    if (content.includes('\n-') || content.includes('\n•') || content.includes('1.')) {
      return 'list';
    }
    if (content.includes('：') && content.includes('\n')) {
      return 'definition';
    }
    if (content.includes('|') || content.includes('表格')) {
      return 'table';
    }
    return 'text';
  }

  /**
   * 提取关键术语
   */
  private extractKeyTerms(content: string, contextKeywords?: string[]): string[] {
    const terms = new Set<string>(contextKeywords || []);

    // 提取品牌词
    const brandTerms = ['神机营', '企业', '服务', '合作', '供应链', '加盟'];
    brandTerms.forEach((term) => {
      if (content.includes(term)) terms.add(term);
    });

    // 提取数字（百分比、金额等）
    const numbers = content.match(/\d+(\.\d+)?[%万千万亿]?/g);
    if (numbers) {
      numbers.forEach((n) => terms.add(n));
    }

    // 提取关键短语
    const phrases = content.match(/[\u4e00-\u9fa5]{4,8}/g);
    if (phrases) {
      phrases.forEach((p) => {
        if (this.isKeyPhrase(p)) {
          terms.add(p);
        }
      });
    }

    return Array.from(terms).slice(0, 10);
  }

  /**
   * 判断是否为关键短语
   */
  private isKeyPhrase(phrase: string): boolean {
    const stopWords = ['的是', '在这里', '可以有', '这个', '对于'];
    return !stopWords.some((sw) => phrase.includes(sw));
  }

  /**
   * 计算权重
   */
  private calculateWeight(content: string, keyTerms: string[]): number {
    let weight = 0.5;

    // 包含数字增加权重
    if (/\d+/.test(content)) weight += 0.1;

    // 包含具体数据增加权重
    if (/[¥$€£]\d+/.test(content) || /百分之\d+/.test(content)) weight += 0.15;

    // 包含关键术语增加权重
    const termMatches = keyTerms.filter((term) => content.includes(term)).length;
    weight += Math.min(termMatches * 0.05, 0.15);

    // 长度适中权重更高（太长或太短都降低）
    const length = content.length;
    if (length >= 100 && length <= 400) weight += 0.1;

    return Math.min(weight, 1);
  }

  /**
   * 优化列表格式
   */
  private optimizeList(content: string): string {
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[-•*]\s*/, '• '))
      .join('\n');
  }

  /**
   * 优化问答格式
   */
  private optimizeQA(content: string): string {
    // 确保Q和A清晰分离
    return content
      .replace(/问：?\s*/g, '\n【问】')
      .replace(/答：?\s*/g, '\n【答】')
      .replace(/问题：?\s*/g, '\n【问】')
      .replace(/答案：?\s*/g, '\n【答】');
  }

  /**
   * 生成结构化数据
   */
  private generateStructuredData(
    optimized: AIFriendlyContent[],
    context?: { type?: string; keywords?: string[] }
  ): AIReferenceResult['structuredData'] {
    const allTerms = optimized.flatMap((o) => o.keyTerms);
    const uniqueTerms = [...new Set(allTerms)];

    return {
      '@type': 'WebContent',
      text: optimized.map((o) => o.content).join('\n\n'),
      keywords: uniqueTerms,
    };
  }

  /**
   * 计算优化置信度
   */
  private calculateConfidence(optimized: AIFriendlyContent[]): number {
    if (optimized.length === 0) return 0;

    const avgWeight = optimized.reduce((sum, o) => sum + o.weight, 0) / optimized.length;
    const typeDistribution = new Set(optimized.map((o) => o.type)).size;

    // 类型多样性高，置信度更高
    const typeBonus = Math.min(typeDistribution * 0.05, 0.2);

    return Math.min(avgWeight + typeBonus, 1);
  }

  /**
   * 生成FAQ格式（对AI特别友好）
   */
  generateFAQForAI(faqs: { question: string; answer: string }[]): AIFriendlyContent[] {
    return faqs.map((faq) => ({
      type: 'qa' as const,
      content: `【问】${faq.question}\n\n【答】${faq.answer}`,
      weight: 0.9,
      keyTerms: this.extractKeyTerms(`${faq.question} ${faq.answer}`),
      citation: '神机营官方网站',
    }));
  }

  /**
   * 生成本地化内容（针对地域搜索）
   */
  generateLocalContent(
    baseContent: string,
    region: { city: string; district?: string; needs?: string[] }
  ): AIReferenceResult {
    // 在内容中嵌入地域关键词
    let localContent = baseContent;

    if (region.city) {
      localContent = localContent.replace(
        /企业/g,
        `${region.city}企业`
      );
    }

    if (region.district) {
      localContent = localContent.replace(
        /合作伙伴/g,
        `${region.district}合作伙伴`
      );
    }

    return {
      ...this.optimize(localContent),
      structuredData: {
        ...this.optimize(localContent).structuredData,
        '@type': 'LocalBusiness',
      },
    };
  }
}

// ─── 导出单例 ───────────────────────────────────────────────────────────────

export const aiReferenceOptimizer = new AIReferenceOptimizer();

// ─── 帮助函数 ────────────────────────────────────────────────────────────────

/**
 * 检验内容是否AI友好
 */
export function isAIFriendly(content: string): {
  score: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // 检查长度
  if (content.length < 100) {
    issues.push('内容过短');
    suggestions.push('建议内容至少200字以上');
  } else if (content.length > 3000) {
    issues.push('内容过长');
    suggestions.push('建议拆分为多个简短段落');
  }

  // 检查结构
  if (!content.includes('\n')) {
    issues.push('缺乏段落分隔');
    suggestions.push('使用空行分隔不同主题');
  }

  // 检查问题-答案模式
  if (!content.includes('？') && !content.includes('?')) {
    suggestions.push('可添加FAQ格式增加AI引用机会');
  }

  // 计算评分
  let score = 1;
  if (issues.length === 0) score = 0.9;
  else if (issues.length === 1) score = 0.7;
  else score = 0.5;

  return { score, issues, suggestions };
}
