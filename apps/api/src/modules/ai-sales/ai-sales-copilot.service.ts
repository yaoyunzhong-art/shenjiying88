/**
 * T114-1 AI Sales 导购副驾
 *
 * 提供:
 *   - ProductRecommendationEngine: 商品推荐引擎（上下文感知推荐、向上销售、交叉销售、亲和度排序）
 *   - ObjectionHandler: 异议处理（分类、话术生成、对话模拟）
 *   - FollowUpScheduler: 跟进提醒（生日特效、到期任务）
 *
 * 落地: P1-15 生日特效倒计时 / P1-20 入场特效预加载
 */

import { Injectable } from '@nestjs/common'
import type {
  CustomerProfile,
  Product,
  RecommendationContext,
  FollowUpReminder,
  ObjectionType,
  ScoredProduct,
  ObjectionContext,
  ConversationSimulation
} from './ai-sales.entity'

// ===== 商品推荐引擎 =====


@Injectable()
export class ProductRecommendationEngine {
  private products: Map<string, Product> = new Map()
  private purchaseHistory: Map<string, string[]> = new Map()
  private affinityScores: Map<string, Map<string, number>> = new Map()

  constructor() {
    this.seedMockProducts()
    this.seedMockAffinity()
  }

  private seedMockProducts(): void {
    const products: Product[] = [
      { id: 'prod-001', name: '基础护肤套装', category: 'skincare', price: 199, quality: 'medium', tags: ['入门', '基础'], relatedCategories: ['skincare', 'makeup', 'beauty'] },
      { id: 'prod-002', name: '焕颜精华液', category: 'skincare', price: 499, quality: 'high', tags: ['美白', '抗衰'], relatedCategories: ['skincare', 'beauty'] },
      { id: 'prod-003', name: '奢华面霜', category: 'skincare', price: 899, quality: 'premium', tags: ['抗衰', '紧致'], relatedCategories: ['skincare', 'beauty'] },
      { id: 'prod-004', name: '水感防晒霜', category: 'skincare', price: 159, quality: 'medium', tags: ['防晒', '清爽'], relatedCategories: ['skincare'] },
      { id: 'prod-005', name: '口红套装', category: 'makeup', price: 299, quality: 'high', tags: ['彩妆', '礼盒'], relatedCategories: ['makeup', 'beauty'] },
      { id: 'prod-006', name: '气垫粉底', category: 'makeup', price: 249, quality: 'medium', tags: ['底妆', '遮瑕'], relatedCategories: ['makeup'] },
      { id: 'prod-007', name: '氨基酸洁面', category: 'skincare', price: 129, quality: 'medium', tags: ['清洁', '温和'], relatedCategories: ['skincare'] },
      { id: 'prod-008', name: '美容仪 Pro', category: 'beauty', price: 1599, quality: 'premium', tags: ['仪器', '家用'], relatedCategories: ['beauty', 'skincare'] },
      { id: 'prod-009', name: '香水礼盒', category: 'beauty', price: 699, quality: 'high', tags: ['香氛', '礼盒'], relatedCategories: ['beauty'] },
      { id: 'prod-010', name: '眼部精华', category: 'skincare', price: 399, quality: 'high', tags: ['眼霜', '抗衰'], relatedCategories: ['skincare'] }
    ]

    products.forEach((p) => this.products.set(p.id, p))
  }

  private seedMockAffinity(): void {
    // 模拟品类亲和度矩阵
    const affinities = [
      { from: 'skincare', to: 'makeup', score: 0.8 },
      { from: 'skincare', to: 'beauty', score: 0.9 },
      { from: 'makeup', to: 'beauty', score: 0.7 },
      { from: 'beauty', to: 'skincare', score: 0.85 }
    ]

    affinities.forEach(({ from, to, score }) => {
      if (!this.affinityScores.has(from)) {
        this.affinityScores.set(from, new Map())
      }
      this.affinityScores.get(from)!.set(to, score)
    })
  }

  /**
   * 上下文感知推荐：综合购买历史+当前浏览+场景
   */
  recommendForCustomer(customerId: string, context: RecommendationContext): ScoredProduct[] {
    const profile = this.getCustomerProfile(customerId)
    const candidates = this.getCandidates(context)
    const scored = this.rankByAffinity(candidates, profile)

    // 场景增强
    if (context.scenario === 'birthday') {
      scored.forEach((s) => {
        s.score *= 1.2
        s.reason += '（生日特惠加成）'
      })
    }

    return scored.sort((a, b) => b.score - a.score)
  }

  /**
   * 向上销售推荐：推荐升级款/加购
   */
  recommendUpsell(productId: string): ScoredProduct[] {
    const source = this.products.get(productId)
    if (!source) return []

    const upsellCandidates: ScoredProduct[] = []

    for (const [id, product] of this.products.entries()) {
      if (id === productId) continue
      if (product.category !== source.category) continue

      const priceDiff = product.price - source.price
      const qualityRank = { low: 1, medium: 2, high: 3, premium: 4 }
      const qualityDiff = qualityRank[product.quality] - qualityRank[source.quality]

      if (priceDiff > 0 && qualityDiff >= 0) {
        const score = priceDiff * 0.3 + qualityDiff * 20
        upsellCandidates.push({
          product,
          score,
          reason: `从 ${source.name} 升级，价格+${priceDiff}元，品质提升`
        })
      }
    }

    return upsellCandidates.sort((a, b) => b.score - a.score)
  }

  /**
   * 交叉销售推荐：关联品类商品
   */
  recommendCrossSell(productId: string): ScoredProduct[] {
    const source = this.products.get(productId)
    if (!source) return []

    const crossCandidates: ScoredProduct[] = []

    for (const [id, product] of this.products.entries()) {
      if (id === productId) continue

      const affinity = this.getAffinity(source.category, product.category)
      if (affinity > 0) {
        crossCandidates.push({
          product,
          score: affinity * 100,
          reason: `与 ${source.name} 属于关联品类（${source.category}→${product.category}）`
        })
      }
    }

    return crossCandidates.sort((a, b) => b.score - a.score)
  }

  /**
   * 按亲和度排序
   */
  rankByAffinity(candidates: Product[], customerProfile: CustomerProfile): ScoredProduct[] {
    const history = customerProfile.purchaseHistory

    return candidates.map((product) => {
      let score = 0
      const reasons: string[] = []

      // 历史购买加成
      if (history.includes(product.id)) {
        score += 30
        reasons.push('历史购买过')
      }

      // 偏好匹配
      const matchingPrefs = product.tags.filter((t) => customerProfile.preferences.includes(t))
      score += matchingPrefs.length * 15
      if (matchingPrefs.length > 0) {
        reasons.push(`匹配偏好: ${matchingPrefs.join(',')}`)
      }

      // 消费水平匹配
      if (product.price <= customerProfile.avgSpend * 1.5) {
        score += 20
        reasons.push('符合消费水平')
      } else if (product.price > customerProfile.avgSpend * 2) {
        score -= 10
        reasons.push('超出常规消费')
      }

      // 生命周期加成
      if (customerProfile.lifecycleStage === 'new') {
        score += 10
        reasons.push('新客专属')
      } else if (customerProfile.lifecycleStage === 'churned') {
        score += 15
        reasons.push('唤醒流失客户')
      }

      return {
        product,
        score: Math.max(0, score),
        reason: reasons.join('；') || '默认推荐'
      }
    })
  }

  private getCustomerProfile(customerId: string): CustomerProfile {
    const history = this.purchaseHistory.get(customerId) ?? []
    const avgSpend = this.calculateAvgSpend(customerId)

    return {
      memberId: customerId,
      purchaseHistory: history,
      avgSpend,
      preferences: this.inferPreferences(customerId),
      lifecycleStage: this.inferLifecycle(history)
    }
  }

  private getCandidates(context: RecommendationContext): Product[] {
    const allProducts = Array.from(this.products.values())

    if (context.currentBrowsing) {
      // 浏览同品类商品
      const browsing = this.products.get(context.currentBrowsing)
      if (browsing) {
        const sameCategory = allProducts.filter((p) => p.category === browsing.category && p.id !== context.currentBrowsing)
        const related = allProducts.filter((p) => browsing.relatedCategories.includes(p.category))
        return [...sameCategory, ...related]
      }
    }

    if (context.recentViewed.length > 0) {
      const viewedCategories = new Set<string>()
      context.recentViewed.forEach((id) => {
        const p = this.products.get(id)
        if (p) viewedCategories.add(p.category)
      })
      return allProducts.filter((p) => viewedCategories.has(p.category))
    }

    return allProducts
  }

  private getAffinity(from: string, to: string): number {
    return this.affinityScores.get(from)?.get(to) ?? 0
  }

  private calculateAvgSpend(customerId: string): number {
    const history = this.purchaseHistory.get(customerId) ?? []
    if (history.length === 0) return 200

    const total = history.reduce((sum, id) => {
      const p = this.products.get(id)
      return sum + (p?.price ?? 0)
    }, 0)

    return Math.round(total / history.length)
  }

  private inferPreferences(customerId: string): string[] {
    const history = this.purchaseHistory.get(customerId) ?? []
    const prefSet = new Set<string>()

    history.forEach((id) => {
      const p = this.products.get(id)
      if (p) p.tags.forEach((t) => prefSet.add(t))
    })

    return Array.from(prefSet)
  }

  private inferLifecycle(history: string[]): CustomerProfile['lifecycleStage'] {
    if (history.length === 0) return 'new'
    if (history.length < 3) return 'active'
    if (history.length < 10) return 'dormant'
    return 'churned'
  }

  // 辅助方法：记录购买历史
  recordPurchase(customerId: string, productId: string): void {
    const history = this.purchaseHistory.get(customerId) ?? []
    history.push(productId)
    this.purchaseHistory.set(customerId, history)
  }

  getProduct(id: string): Product | undefined {
    return this.products.get(id)
  }

  getAllProducts(): Product[] {
    return Array.from(this.products.values())
  }
}

// ===== 异议处理 =====

@Injectable()
export class ObjectionHandler {
  private objectionPatterns: Map<ObjectionType, string[]> = new Map([
    ['price', ['太贵了', '价格高', '买不起', '划算吗', '打折', '优惠', '便宜点']],
    ['quality', ['质量怎么样', '好用吗', '是正品吗', '有保证吗', '副作用', '过敏']],
    ['competitor', ['别家更便宜', '其他品牌', '对比', 'xx牌子']],
    ['need', ['需要吗', '有用吗', '适合我吗', '合适吗']]
  ])

  private responseTemplates: Map<ObjectionType, string[]> = new Map([
    ['price', [
      '我们提供分期付款服务，最长可分12期，月供仅需XX元',
      '现在下单可享8折优惠+满减活动，综合折扣相当于65折',
      '品质决定价格，这款产品使用的是XX成分，效果是普通产品的3倍',
      '您今天购买可以申请会员专属折扣，比双十一当天还便宜'
    ]],
    ['quality', [
      '产品经过XX认证，符合国家标准，支持30天无理由退换货',
      '我们品牌深耕XX年，已服务超过XX万用户，好评率达98%',
      '产品含有XX成分，经临床验证有效，请放心使用',
      '您可以先领取小样试用，体验满意再购买正装'
    ]],
    ['competitor', [
      '感谢您的坦诚，我们可以帮您对比一下各品牌的差异',
      '我们的核心优势是XX，这也是为什么XX用户选择我们的原因',
      '虽然价格略有差异，但我们的服务+赠品价值超过XX元',
      '现在品牌的核心差异在于XX，您最看重哪一点呢'
    ]],
    ['need', [
      '根据您刚才的描述，这款产品非常适合您的需求',
      '很多客户在使用了XX疗程后，都反馈XX效果很明显',
      '我可以帮您做一个皮肤测试，看看哪些产品最适合您',
      '这款产品特别适合您这样的（描述客户特征），我可以为您详细介绍'
    ]]
  ])

  /**
   * 分类顾客异议
   */
  classifyObjection(customerReply: string): ObjectionType {
    const normalized = customerReply.toLowerCase()

    for (const [type, patterns] of this.objectionPatterns.entries()) {
      for (const pattern of patterns) {
        if (normalized.includes(pattern.toLowerCase())) {
          return type
        }
      }
    }

    return 'need' // 默认归类为需求确认
  }

  /**
   * 生成应对话术
   */
  generateResponse(objectionType: ObjectionType, context: ObjectionContext): string {
    const templates = this.responseTemplates.get(objectionType) ?? []
    if (templates.length === 0) return '感谢您的反馈，我会为您详细解答'

    // 简单轮换策略：基于客户ID哈希选择
    const index = this.hashCode(context.customerId) % templates.length
    let response = templates[index]

    // 替换占位符（如果有）
    if (context.productId) {
      response = response.replace('XX', this.getPlaceholderValue(objectionType, context.productId))
    }

    return response
  }

  /**
   * 模拟对话效果
   */
  simulateConversation(objection: string, response: string): ConversationSimulation[] {
    const turns: ConversationSimulation[] = [
      {
        turn: 1,
        speaker: 'customer',
        message: objection,
        sentiment: 'negative'
      }
    ]

    const responseSentiment = this.analyzeSentiment(response)
    turns.push({
      turn: 2,
      speaker: 'agent',
      message: response,
      sentiment: responseSentiment
    })

    // 模拟客户后续反应
    const followUpSentiment = this.calculateFollowUpSentiment(objection, response)
    turns.push({
      turn: 3,
      speaker: 'customer',
      message: this.generateFollowUpMessage(followUpSentiment, objection),
      sentiment: followUpSentiment
    })

    return turns
  }

  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  private getPlaceholderValue(type: ObjectionType, productId: string): string {
    const values: Record<ObjectionType, string> = {
      'price': '199',
      'quality': '30天',
      'competitor': '100万',
      'need': '非常适合'
    }
    return values[type]
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['好', '优', '棒', '赞', '满意', '放心', '感谢']
    const negativeWords = ['差', '坏', '糟', '问题', '担心', '顾虑']

    let score = 0
    for (const word of positiveWords) {
      if (text.includes(word)) score++
    }
    for (const word of negativeWords) {
      if (text.includes(word)) score--
    }

    if (score > 0) return 'positive'
    if (score < 0) return 'negative'
    return 'neutral'
  }

  private calculateFollowUpSentiment(objection: string, response: string): 'positive' | 'neutral' | 'negative' {
    const type = this.classifyObjection(objection)
    // 价格异议得到有效回应后更可能正面
    if (type === 'price' && (response.includes('折扣') || response.includes('优惠'))) {
      return 'positive'
    }
    return 'neutral'
  }

  private generateFollowUpMessage(sentiment: 'positive' | 'neutral' | 'negative', originalObjection: string): string {
    if (sentiment === 'positive') {
      return '听起来不错，那我现在可以下单吗？'
    } else if (sentiment === 'neutral') {
      return '好的，我再考虑一下'
    } else {
      const type = this.classifyObjection(originalObjection)
      if (type === 'price') return '价格还是有点高，有没有更大的优惠？'
      if (type === 'quality') return '我还是有点担心质量问题'
      return '我再看看其他选择吧'
    }
  }
}

// ===== 跟进提醒 =====

@Injectable()
export class FollowUpScheduler {
  private reminders: Map<string, FollowUpReminder> = new Map()
  private customerBirthdays: Map<string, string> = new Map() // customerId -> birthday ISO string

  constructor() {
    this.seedMockData()
  }

  private seedMockData(): void {
    // 模拟客户生日数据
    this.customerBirthdays.set('cust-001', '1995-07-15')
    this.customerBirthdays.set('cust-002', '1990-01-20')
    this.customerBirthdays.set('cust-003', '1988-12-25')
  }

  /**
   * 安排跟进
   * P1-15 生日特效倒计时实现
   */
  scheduleFollowUp(customerId: string, reminder: Omit<FollowUpReminder, 'id' | 'createdAt' | 'status'>): FollowUpReminder {
    const id = `followup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // 生日特效倒计时计算
    if (reminder.type === 'birthday') {
      const birthdayCountdown = this.calculateBirthdayCountdown(customerId)
      reminder.message = `🎂 生日特惠：您的生日还有 ${birthdayCountdown} 天！我们为您准备了专属优惠券`
      reminder.priority = birthdayCountdown <= 7 ? 1 : 2
    }

    const fullReminder: FollowUpReminder = {
      ...reminder,
      id,
      status: 'pending',
      createdAt: now
    }

    this.reminders.set(id, fullReminder)
    return fullReminder
  }

  /**
   * 获取到期跟进任务
   */
  getDueFollowUps(salesId: string): FollowUpReminder[] {
    const now = new Date()
    const due: FollowUpReminder[] = []

    for (const reminder of this.reminders.values()) {
      if (reminder.salesId !== salesId) continue
      if (reminder.status !== 'pending') continue

      const scheduledTime = new Date(reminder.scheduledAt)
      if (scheduledTime <= now) {
        due.push(reminder)
      }
    }

    return due.sort((a, b) => {
      // 按优先级排序
      if (a.priority !== b.priority) return a.priority - b.priority
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    })
  }

  /**
   * 标记完成
   */
  markCompleted(followUpId: string): FollowUpReminder | undefined {
    const reminder = this.reminders.get(followUpId)
    if (!reminder) return undefined

    reminder.status = 'completed'
    return reminder
  }

  /**
   * 计算生日倒计时天数
   * P1-15 生日特效倒计时
   */
  private calculateBirthdayCountdown(customerId: string): number {
    const birthdayStr = this.customerBirthdays.get(customerId)
    if (!birthdayStr) return -1

    const birthday = new Date(birthdayStr)
    const today = new Date()

    // 今年的生日
    let thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())

    // 如果今年的生日已过，计算到明年的
    if (thisYearBirthday < today) {
      thisYearBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate())
    }

    const diffMs = thisYearBirthday.getTime() - today.getTime()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  }

  /**
   * 获取即将到来的生日提醒（用于入场特效预加载）
   * P1-20 入场特效预加载
   */
  getUpcomingBirthdays(daysAhead: number = 7): Array<{ customerId: string; daysUntil: number }> {
    const results: Array<{ customerId: string; daysUntil: number }> = []

    for (const [customerId] of this.customerBirthdays.entries()) {
      const daysUntil = this.calculateBirthdayCountdown(customerId)
      if (daysUntil >= 0 && daysUntil <= daysAhead) {
        results.push({ customerId, daysUntil })
      }
    }

    return results.sort((a, b) => a.daysUntil - b.daysUntil)
  }

  /**
   * 获取所有待处理的跟进
   */
  getAllPending(salesId?: string): FollowUpReminder[] {
    const all = Array.from(this.reminders.values())
      .filter((r) => r.status === 'pending')

    if (salesId) {
      return all.filter((r) => r.salesId === salesId)
    }
    return all
  }

  /**
   * 设置客户生日
   */
  setCustomerBirthday(customerId: string, birthday: string): void {
    this.customerBirthdays.set(customerId, birthday)
  }
}
