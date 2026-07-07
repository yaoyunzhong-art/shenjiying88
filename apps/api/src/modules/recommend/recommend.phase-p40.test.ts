import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [P-40智能推荐] E9吴AI+E40杨客户 角色模拟测试
 *
 * 模拟函数（纯函数式内联）：
 *   - getRecommendations / calculateScore / personalizeResults / filterOutPurchased
 *
 * E9 吴AI视角：推荐引擎 · 评分计算 · 冷启动 · 兴趣匹配 · 多样性
 * E40 杨客户视角：个性化筛选 · 去重 · 空历史兜底 · 评分排序 · 边界
 *
 * 12 项测试覆盖 E9+E40 视角。每个测试 ≤ 3 步（Arrange → Act → Assert）。
 */

// ════════════════════════════════════════════════════════════
// 类型定义
// ════════════════════════════════════════════════════════════

interface Recommendation {
  itemId: string
  score: number
  reason: string
}

interface UserProfile {
  userId: string
  preferredCategories: string[]
  preferredTags: string[]
  userTier: 'new' | 'active' | 'vip'
}

interface ScoredItem {
  itemId: string
  category: string
  tags: string[]
  popularity: number // 0 ~ 1
}

// ════════════════════════════════════════════════════════════
// 模拟函数（纯函数式内联，无外部依赖）
// ════════════════════════════════════════════════════════════

/**
 * 根据用户历史行为生成推荐列表。
 * 冷启动（空历史）: 返回热门兜底（popularity ≥ 0.5 且 score 基于热度）。
 * 有历史: 基于历史 item 的标签/分类做相似匹配。
 */
function getRecommendations(userId: string, history: string[]): Recommendation[] {
  // 预置全量商品池（模拟）
  const catalog: Record<string, { category: string; tags: string[]; popularity: number }> = {
    p_basketball: { category: '设备', tags: ['热门', '竞技', '投篮'], popularity: 0.92 },
    p_dance:      { category: '设备', tags: ['热门', '竞技', '跳舞'], popularity: 0.88 },
    p_vr:         { category: '设备', tags: ['科技', '热门'], popularity: 0.76 },
    p_bear:       { category: '礼品', tags: ['亲子', '可爱'], popularity: 0.65 },
    p_figure:     { category: '礼品', tags: ['收藏', '热门'], popularity: 0.82 },
    p_snack:      { category: '食品', tags: ['日常', '零食'], popularity: 0.45 },
    p_drink:      { category: '食品', tags: ['日常'], popularity: 0.30 },
    p_capsule:    { category: '礼品', tags: ['热门', '收集'], popularity: 0.71 },
    p_racing:     { category: '设备', tags: ['竞技', '热门', '赛车'], popularity: 0.85 },
    p_plush:      { category: '礼品', tags: ['亲子', '可爱', '大号'], popularity: 0.60 },
  }

  const reasons = [
    '热门推荐',
    '与您浏览的商品相似',
    '猜您喜欢',
    '同类商品人气高',
    '上新推荐',
    '和您一样的人也在看',
  ]

  if (!history || history.length === 0) {
    // 冷启动 — 按热度排序取前 N
    return Object.entries(catalog)
      .filter(([, info]) => info.popularity >= 0.5)
      .sort((a, b) => b[1].popularity - a[1].popularity)
      .slice(0, 5)
      .map(([itemId, info]) => ({
        itemId,
        score: Math.round(info.popularity * 100) / 100,
        reason: '热门推荐',
      }))
  }

  // 有历史 — 基于浏览/购买记录找相似
  const seenTags = new Set<string>()
  const seenCategories = new Set<string>()
  for (const hId of history) {
    const item = catalog[hId]
    if (item) {
      for (const tag of item.tags) seenTags.add(tag)
      seenCategories.add(item.category)
    }
  }

  const scored: Recommendation[] = []
  for (const [itemId, info] of Object.entries(catalog)) {
    if (history.includes(itemId)) continue // 已购买/已浏览的不推荐

    let scoreBase = info.popularity * 0.3 // 热度贡献

    // 标签匹配加分
    const tagOverlap = info.tags.filter(t => seenTags.has(t)).length
    scoreBase += (tagOverlap / Math.max(info.tags.length, 1)) * 0.4

    // 分类匹配加分
    if (seenCategories.has(info.category)) {
      scoreBase += 0.3
    }

    // 随机选一个合适的理由
    const reasonIdx = tagOverlap > 0 ? 1 : info.popularity >= 0.7 ? 0 : 3
    scored.push({
      itemId,
      score: Math.round(scoreBase * 100) / 100,
      reason: reasons[reasonIdx % reasons.length],
    })
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 10)
}

/**
 * 根据用户等级和商品热门度计算匹配得分 (0 ~ 1)。
 * - 'new' 用户更偏向热门商品
 * - 'vip' 用户更看重新奇/长尾
 * - 'active' 用户平衡两者
 */
function calculateScore(userTier: string, itemPopularity: number): number {
  const tierMap: Record<string, number> = { new: 0.7, active: 1.0, vip: 0.4 }
  const tierWeight = tierMap[userTier] ?? 0.5
  return Math.round(Math.pow(itemPopularity, tierWeight) * 100) / 100
}

/**
 * 根据用户画像个性化排序推荐结果。
 * 优先展示符合 preferredCategories / preferredTags 的商品。
 */
function personalizeResults(items: ScoredItem[], userProfile: UserProfile): ScoredItem[] {
  if (!items || items.length === 0) return []

  const boosted = items.map(item => {
    let bonus = 0
    const catMatch = userProfile.preferredCategories.includes(item.category)
    const tagMatch = item.tags.some(t => userProfile.preferredTags.includes(t))

    if (catMatch) bonus += 0.15
    if (tagMatch) bonus += 0.1

    return {
      itemId: item.itemId,
      category: item.category,
      tags: item.tags,
      popularity: Math.min(item.popularity + bonus, 1),
    }
  })

  return boosted.sort((a, b) => b.popularity - a.popularity)
}

/**
 * 过滤掉已购买的商品。
 */
function filterOutPurchased(items: ScoredItem[], purchasedIds: string[]): ScoredItem[] {
  if (!items || items.length === 0) return []
  if (!purchasedIds || purchasedIds.length === 0) return items

  const purchasedSet = new Set(purchasedIds)
  return items.filter(item => !purchasedSet.has(item.itemId))
}

// ═══════════════════════════════════════════════════════════════════════
// 🅴⁹ E9 吴AI视角 — 推荐引擎与算法
// ═══════════════════════════════════════════════════════════════════════

describe('🅴⁹ E9 吴AI视角 — 推荐引擎算法', () => {
  // ── E9-01: 冷启动推荐 ──
  it('E9-01 冷启动推荐：空历史用户获取热门兜底推荐', () => {
    const recs = getRecommendations('新用户', [])

    expect(recs.length).toBeGreaterThanOrEqual(1)
    expect(recs.length).toBeLessThanOrEqual(5)
    for (const r of recs) {
      expect(r.score).toBeGreaterThanOrEqual(0.5)
      expect(r.reason).toBe('热门推荐')
    }
    // 按分数降序排列
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].score).toBeLessThanOrEqual(recs[i - 1].score)
    }
  })

  // ── E9-02: 基于历史浏览的推荐 ──
  it('E9-02 基于历史推荐：浏览投篮机后推荐同类竞技设备', () => {
    const recs = getRecommendations('m_zhang', ['p_basketball'])

    expect(recs.length).toBeGreaterThan(0)
    // 应包含与投篮机同分类（设备）或同标签（竞技）的商品
    const hasRelevant = recs.some(r => ['p_dance', 'p_vr', 'p_racing'].includes(r.itemId))
    expect(hasRelevant).toBe(true)
    // 已浏览的不应出现
    expect(recs.find(r => r.itemId === 'p_basketball')).toBeUndefined()
  })

  // ── E9-03: 多种历史商品推荐 ──
  it('E9-03 多历史商品：浏览设备+礼品后推荐覆盖两类', () => {
    const recs = getRecommendations('m_li', ['p_basketball', 'p_bear'])

    expect(recs.length).toBeGreaterThan(1)
    const categories = new Set(recs.map(r => {
      if (['p_dance', 'p_vr', 'p_racing'].includes(r.itemId)) return '设备'
      if (['p_figure', 'p_capsule', 'p_plush'].includes(r.itemId)) return '礼品'
      return '食品'
    }))
    // 应覆盖设备和礼品两个分类
    expect(categories.has('设备')).toBe(true)
    expect(categories.has('礼品')).toBe(true)
  })

  // ── E9-04: 等级评分计算 ──
  it('E9-04 等级评分计算：VIP 用户看新奇，新用户看热门', () => {
    const newScore = calculateScore('new', 0.9)
    const vipScore = calculateScore('vip', 0.3)
    const activeScore = calculateScore('active', 0.6)

    // new 用户: pow(0.9, 0.7) ≈ 0.929
    expect(newScore).toBeGreaterThan(0.9)
    // vip 用户: pow(0.3, 0.4) ≈ 0.618
    expect(vipScore).toBeGreaterThan(0.5)
    expect(vipScore).toBeLessThan(0.7)
    // active 用户: pow(0.6, 1.0) = 0.6
    expect(activeScore).toBe(0.6)
    // 新用户热门度折扣小 → 分值更高
    expect(newScore).toBeGreaterThan(vipScore)
  })

  // ── E9-05: 未知等级默认降级 ──
  it('E9-05 未知等级默认降级：未定义的 tier 按 0.5 处理', () => {
    const score = calculateScore('unknown_tier', 0.64)
    // pow(0.64, 0.5) ≈ 0.8
    expect(score).toBeCloseTo(0.8, 1)
  })

  // ── E9-06: 极高热度评分上限 ──
  it('E9-06 极高热度评分：popularity=1 时各等级得分不超过 1', () => {
    expect(calculateScore('new', 1)).toBe(1)
    expect(calculateScore('active', 1)).toBe(1)
    expect(calculateScore('vip', 1)).toBe(1)
    expect(calculateScore('new', 1)).toBeLessThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// 🅴⁴⁰ E40 杨客户视角 — 个性化筛选与体验
// ═══════════════════════════════════════════════════════════════════════

describe('🅴⁴⁰ E40 杨客户视角 — 个性化推荐体验', () => {
  const sampleItems: ScoredItem[] = [
    { itemId: 'p_basketball', category: '设备', tags: ['热门', '竞技', '投篮'], popularity: 0.92 },
    { itemId: 'p_dance',      category: '设备', tags: ['热门', '竞技', '跳舞'], popularity: 0.88 },
    { itemId: 'p_bear',       category: '礼品', tags: ['亲子', '可爱'], popularity: 0.65 },
    { itemId: 'p_figure',     category: '礼品', tags: ['收藏', '热门'], popularity: 0.82 },
    { itemId: 'p_snack',      category: '食品', tags: ['日常', '零食'], popularity: 0.45 },
  ]

  // ── E40-07: 个性化排序 ──
  it('E40-07 个性化排序：偏好设备的客户设备类商品排前面', () => {
    const profile: UserProfile = {
      userId: 'm_wang',
      preferredCategories: ['设备'],
      preferredTags: ['热门'],
      userTier: 'active',
    }
    const personalized = personalizeResults(sampleItems, profile)

    expect(personalized.length).toBe(5)
    // 设备类商品（有 category 加成）应排在礼品和食品前面
    const deviceItems = personalized.filter(i => i.category === '设备')
    const firstNonDevice = personalized.findIndex(i => i.category !== '设备')
    if (firstNonDevice >= 0 && deviceItems.length > 0) {
      // 所有设备类商品应在非设备类前面
      for (const d of deviceItems) {
        const idx = personalized.indexOf(d)
        expect(idx).toBeLessThan(firstNonDevice)
      }
    }
  })

  // ── E40-08: 标签匹配加分 ──
  it('E40-08 标签匹配加分：偏好"亲子"标签时匹配商品排前', () => {
    const profile: UserProfile = {
      userId: 'm_zhou',
      preferredCategories: [],
      preferredTags: ['亲子', '可爱'],
      userTier: 'vip',
    }
    const personalized = personalizeResults(sampleItems, profile)

    // 亲子/可爱标签的商品 p_bear(0.65+0.1=0.75), 应有提升
    const bear = personalized.find(i => i.itemId === 'p_bear')
    expect(bear).toBeDefined()
    expect(bear!.popularity).toBe(0.75)
  })

  // ── E40-09: 已购商品过滤 ──
  it('E40-09 已购商品过滤：去除已购买过的商品', () => {
    const purchased = ['p_basketball', 'p_snack']
    const filtered = filterOutPurchased(sampleItems, purchased)

    expect(filtered.length).toBe(3)
    expect(filtered.find(i => i.itemId === 'p_basketball')).toBeUndefined()
    expect(filtered.find(i => i.itemId === 'p_snack')).toBeUndefined()
    expect(filtered.find(i => i.itemId === 'p_dance')).toBeDefined()
  })

  // ── E40-10: 空已购列表不过滤 ──
  it('E40-10 空已购列表：purchasedIds 为空时返回全部', () => {
    const filtered = filterOutPurchased(sampleItems, [])
    expect(filtered.length).toBe(5)

    const filtered2 = filterOutPurchased(sampleItems, undefined as unknown as string[])
    expect(filtered2.length).toBe(5)
  })

  // ── E40-11: 空商品降级 ──
  it('E40-11 空商品降级：items=null/undefined 返回空数组', () => {
    expect(personalizeResults([], { userId: 'm_0', preferredCategories: [], preferredTags: [], userTier: 'new' })).toEqual([])
    expect(personalizeResults(null as unknown as ScoredItem[], { userId: 'm_0', preferredCategories: [], preferredTags: [], userTier: 'new' })).toEqual([])
    expect(filterOutPurchased([], ['p1'])).toEqual([])
    expect(filterOutPurchased(null as unknown as ScoredItem[], ['p1'])).toEqual([])
  })

  // ── E40-12: 空历史推荐兜底 ──
  it('E40-12 空历史推荐兜底：新用户无访问记录获得热门推荐', () => {
    const recs = getRecommendations('匿名用户', [])
    expect(recs.length).toBeGreaterThanOrEqual(1)
    expect(recs.length).toBeLessThanOrEqual(5)
    // 所有推荐 score ≥ 0.5（仅热门商品）
    for (const r of recs) {
      expect(r.score).toBeGreaterThanOrEqual(0.5)
    }
  })
})
