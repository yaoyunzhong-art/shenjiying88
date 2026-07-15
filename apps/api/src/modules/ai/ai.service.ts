/**
 * ai.service.ts - AI分析微服务
 *
 * 提供文本分析、类别分类、情感评分、关键词提取等AI能力。
 * 采用内存数据源模拟AI推理，可切换为真实LLM/ML服务。
 *
 * 功能:
 *   - analyzeText(): 综合分析（类别+情感+关键词）
 *   - classifyCategory(): 文本分类
 *   - sentimentScore(): 情感打分
 *   - extractKeywords(): 关键词提取
 *
 * 树哥后台自动执行: AI 分析引擎
 */

import { Injectable, Logger } from '@nestjs/common'

// ── 类型 ──

export interface AnalysisResult {
  text: string
  category: string
  sentiment: SentimentResult
  keywords: string[]
  confidence: number
  processedAt: string
  tokensConsumed: number
}

export interface SentimentResult {
  score: number // -1.0 ~ 1.0
  label: SentimentLabel
  breakdown: {
    positive: number
    neutral: number
    negative: number
  }
}

export type SentimentLabel = 'positive' | 'neutral' | 'negative'

export interface CategoryResult {
  category: string
  subCategory?: string
  confidence: number
}

export interface KeywordResult {
  keyword: string
  score: number
}

export interface ClassifyOptions {
  maxCategories?: number
  minConfidence?: number
}

export interface KeywordOptions {
  topN?: number
  minScore?: number
}

// ── 预定义类别 ──

const PREDEFINED_CATEGORIES = [
  'technology', 'finance', 'healthcare', 'education',
  'entertainment', 'sports', 'politics', 'lifestyle',
  'business', 'science',
] as const

type Category = (typeof PREDEFINED_CATEGORIES)[number]

// ── 情感词库 ──

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
  'happy', 'love', 'beautiful', 'awesome', 'brilliant', 'outstanding',
  'superb', 'delightful', 'perfect', 'impressive', 'positive', 'success',
  'benefit', 'profit', 'growth', 'innovation', 'efficient',
  '好', '优秀', '出色', '完美', '棒', '喜欢', '爱', '精彩', '卓越',
])

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'poor', 'ugly',
  'hate', 'sad', 'angry', 'disappointing', 'worst', 'failure',
  'negative', 'loss', 'decline', 'damage', 'risk', 'problem',
  'crisis', 'error', 'bug', 'failed', 'broken',
  '差', '糟糕', '失败', '坏', '烂', '恶心', '讨厌', '愤怒',
])

const NEUTRAL_WORDS = new Set([
  'maybe', 'perhaps', 'normal', 'average', 'standard', 'regular',
  'ok', 'fine', 'moderate', 'medium', 'typical', 'common',
  '一般', '普通', '还行', '中等',
])

// ── 科技/金融等关键词词典 ──

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  technology: ['software', 'hardware', 'app', 'code', 'programming', 'AI', 'data',
    'algorithm', 'cloud', 'API', '机器学习', '算法', '编程', '云', '数据'],
  finance: ['money', 'bank', 'loan', 'investment', 'stock', 'market', 'finance',
    'capital', 'fund', 'trading', '金融', '银行', '投资', '贷款', '股票'],
  healthcare: ['hospital', 'doctor', 'patient', 'medical', 'drug', 'health',
    'treatment', 'surgery', 'medicine', 'care', '医疗', '医院', '药物', '治疗'],
  education: ['school', 'teacher', 'student', 'course', 'class', 'learning',
    'study', 'training', 'exam', 'lecture', '教育', '学校', '学习', '课程'],
  entertainment: ['movie', 'music', 'game', 'show', 'film', 'concert', 'play',
    'art', 'entertainment', 'actor', '娱乐', '电影', '音乐', '演出'],
  sports: ['game', 'team', 'player', 'score', 'match', 'champion', 'win',
    'sports', 'football', 'basketball', '体育', '足球', '篮球', '比赛'],
  politics: ['government', 'policy', 'law', 'election', 'president', 'party',
    'vote', 'political', 'reform', 'congress', '政治', '政府', '选举', '政策'],
  lifestyle: ['food', 'travel', 'fashion', 'home', 'garden', 'recipe',
    'health', 'fitness', 'yoga', 'lifestyle', '生活', '美食', '旅行', '时尚'],
  business: ['business', 'startup', 'enterprise', 'company', 'strategy',
    'management', 'leadership', 'marketing', 'revenue', 'CEO', '商业', '企业', '管理'],
  science: ['research', 'lab', 'experiment', 'theory', 'physics', 'chemistry',
    'biology', 'space', 'gene', 'discovery', '科学', '研究', '实验', '物理'],
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private readonly analysisLog: Array<{
    textPreview: string
    category: string
    sentimentLabel: SentimentLabel
    processedAt: string
  }> = []

  /**
   * 综合分析: 返回类别 + 情感 + 关键词一次完成
   */
  analyzeText(text: string, options?: { topKKeywords?: number; maxCategories?: number }): AnalysisResult {
    if (!text || text.trim().length === 0) {
      this.logger.warn('[analyzeText] 空文本输入')
      return {
        text,
        category: 'unknown',
        sentiment: {
          score: 0,
          label: 'neutral',
          breakdown: { positive: 0, neutral: 1, negative: 0 },
        },
        keywords: [],
        confidence: 0,
        processedAt: new Date().toISOString(),
        tokensConsumed: 0,
      }
    }

    const category = this.classifyCategory(text, { maxCategories: options?.maxCategories ?? 3 })
    const sentiment = this.sentimentScore(text)
    const topK = options?.topKKeywords ?? 5
    const keywords = this.extractKeywords(text, { topN: topK })

    this.analysisLog.push({
      textPreview: text.slice(0, 40),
      category: category.category,
      sentimentLabel: sentiment.label,
      processedAt: new Date().toISOString(),
    })

    this.logger.log(`[analyzeText] 类别=${category.category} 情感=${sentiment.label} 关键词=${keywords.length}个`)

    return {
      text,
      category: category.category,
      sentiment,
      keywords: keywords.map(k => k.keyword),
      confidence: category.confidence,
      processedAt: new Date().toISOString(),
      tokensConsumed: text.length * 2, // 模拟token消耗
    }
  }

  /**
   * 文本分类: 基于关键词匹配 + 权重打分
   */
  classifyCategory(text: string, options?: ClassifyOptions): CategoryResult {
    if (!text || text.trim().length === 0) {
      return { category: 'unknown', confidence: 0 }
    }

    const lower = text.toLowerCase()
    const scores: Array<{ cat: Category; score: number }> = []

    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0
      for (const kw of keywords) {
        if (lower.includes(kw.toLowerCase())) {
          score += 1
        }
      }
      if (score > 0) {
        scores.push({ cat: cat as Category, score })
      }
    }

    if (scores.length === 0) {
      return { category: 'general', confidence: 0.3 }
    }

    // 排序取 top
    scores.sort((a, b) => b.score - a.score)
    const top = scores.slice(0, options?.maxCategories ?? 1)
    const totalScore = top.reduce((s, t) => s + t.score, 0)
    const finalCategory = top[0].cat
    const confidence = Math.min(1, totalScore / 10)

    this.logger.debug(`[classifyCategory] ${finalCategory} confidence=${confidence.toFixed(2)}`)

    return {
      category: finalCategory,
      subCategory: top.length > 1 ? top[1].cat : undefined,
      confidence,
    }
  }

  /**
   * 情感评分: 基于情感词典计分
   */
  sentimentScore(text: string): SentimentResult {
    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        label: 'neutral',
        breakdown: { positive: 0, neutral: 1, negative: 0 },
      }
    }

    const words = this.tokenize(text)
    let posCount = 0
    let negCount = 0
    let neuCount = 0

    for (const word of words) {
      if (POSITIVE_WORDS.has(word)) posCount++
      else if (NEGATIVE_WORDS.has(word)) negCount++
      else if (NEUTRAL_WORDS.has(word)) neuCount++
    }

    const total = posCount + negCount + neuCount || 1
    const score = total > 0 ? (posCount - negCount) / Math.max(posCount + negCount, 1) : 0
    const clamped = Math.max(-1, Math.min(1, score))

    let label: SentimentLabel
    if (clamped > 0.2) label = 'positive'
    else if (clamped < -0.2) label = 'negative'
    else label = 'neutral'

    return {
      score: Math.round(clamped * 100) / 100,
      label,
      breakdown: {
        positive: Math.round((posCount / total) * 100) / 100,
        neutral: Math.round((neuCount / total) * 100) / 100,
        negative: Math.round((negCount / total) * 100) / 100,
      },
    }
  }

  /**
   * 关键词提取: 基于词频 + 权重
   */
  extractKeywords(text: string, options?: KeywordOptions): KeywordResult[] {
    if (!text || text.trim().length === 0) {
      return []
    }

    const topN = options?.topN ?? 5
    const minScore = options?.minScore ?? 0
    const words = this.tokenize(text)

    // 词频
    const freqMap = new Map<string, number>()
    for (const w of words) {
      if (w.length < 2) continue
      freqMap.set(w, (freqMap.get(w) ?? 0) + 1)
    }

    // 打分: freq + 长度权重 + 是否在类别词典中
    const scored: KeywordResult[] = []
    for (const [word, freq] of freqMap) {
      let score = freq / words.length
      score += word.length * 0.01 // 长词加分
      // 检查是否在类别关键词中
      for (const kwList of Object.values(CATEGORY_KEYWORDS)) {
        if (kwList.some(k => k.toLowerCase() === word.toLowerCase())) {
          score += 0.1
          break
        }
      }
      scored.push({
        keyword: word,
        score: Math.round(score * 100) / 100,
      })
    }

    // 排序 + topN
    scored.sort((a, b) => b.score - a.score)
    const filtered = scored.filter(k => k.score >= minScore)

    this.logger.debug(`[extractKeywords] ${filtered.slice(0, topN).map(k => k.keyword).join(', ')}`)

    return filtered.slice(0, topN)
  }

  /**
   * 返回分析日志统计
   */
  getAnalysisStats(): { total: number; categories: Record<string, number>; sentiments: Record<string, number> } {
    const categories: Record<string, number> = {}
    const sentiments: Record<string, number> = {}

    for (const log of this.analysisLog) {
      categories[log.category] = (categories[log.category] ?? 0) + 1
      sentiments[log.sentimentLabel] = (sentiments[log.sentimentLabel] ?? 0) + 1
    }

    return {
      total: this.analysisLog.length,
      categories,
      sentiments,
    }
  }

  // ── Private ──

  private tokenize(text: string): string[] {
    // 简单分词: 按空白/标点分割，保留中文字符
    return text
      .toLowerCase()
      .split(/[\s,，。！？、；：""''【】《》（）\(\)\[\]{}.!?;:'"<>/\-–—|@#$%^&*+=~`]+/)
      .filter(w => w.length > 0)
  }
}
