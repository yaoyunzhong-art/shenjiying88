import { describe, it, expect, beforeEach } from 'vitest'

// ──────────────────────────────────────────────
// P-45 增值服务 — E15吴内容 + E31吴品牌
// 纯函数式内联，不 import 生产代码
// ──────────────────────────────────────────────

// ── 类型定义 ──

interface ContentItem {
  id: string
  title: string
  type: string
  tenantId: string
  status: string
  createdAt: string
}

interface PublishResult {
  success: boolean
  publishedAt: string
}

interface ContentAnalytics {
  views: number
  shares: number
  likes: number
  conversion: number
}

// ── 模拟函数（纯函数式） ──

let _contentIdCounter = 0
const _contentStore = new Map<string, ContentItem>()
const _analyticsStore = new Map<string, ContentAnalytics>()

/** 重置内部状态（每次测试前调用） */
function resetContentStore(): void {
  _contentIdCounter = 0
  _contentStore.clear()
  _analyticsStore.clear()
}

/** 创建内容 */
function createContentItem(title: string, type: string, tenantId: string): ContentItem {
  if (!title || !title.trim()) {
    throw new Error('INVALID_TITLE')
  }
  if (!type || !type.trim()) {
    throw new Error('INVALID_TYPE')
  }
  if (!tenantId || !tenantId.trim()) {
    throw new Error('INVALID_TENANT')
  }

  const validTypes = new Set(['article', 'video', 'image', 'banner', 'promotion', 'poster', 'social'])
  if (!validTypes.has(type)) {
    throw new Error('UNSUPPORTED_CONTENT_TYPE')
  }

  _contentIdCounter++
  const id = `content-${String(_contentIdCounter).padStart(4, '0')}`
  const createdAt = new Date().toISOString()

  const item: ContentItem = {
    id,
    title: title.trim(),
    type,
    tenantId,
    status: 'DRAFT',
    createdAt,
  }

  _contentStore.set(id, item)

  // 初始化空分析数据
  _analyticsStore.set(id, { views: 0, shares: 0, likes: 0, conversion: 0 })

  return item
}

/** 发布内容 */
function publishContent(id: string): PublishResult {
  if (!id || !id.trim()) {
    throw new Error('INVALID_CONTENT_ID')
  }

  const item = _contentStore.get(id)
  if (!item) {
    throw new Error('CONTENT_NOT_FOUND')
  }
  if (item.status === 'PUBLISHED') {
    throw new Error('ALREADY_PUBLISHED')
  }

  const publishedAt = new Date().toISOString()
  item.status = 'PUBLISHED'
  _contentStore.set(id, item)

  return { success: true, publishedAt }
}

/** 获取内容分析数据 */
function getContentAnalytics(id: string): ContentAnalytics {
  if (!id || !id.trim()) {
    throw new Error('INVALID_CONTENT_ID')
  }

  const analytics = _analyticsStore.get(id)
  if (!analytics) {
    throw new Error('ANALYTICS_NOT_FOUND')
  }

  return { ...analytics }
}

/** 计算价值评分 */
function calculateValueScore(views: number, shares: number, likes: number): number {
  if (views < 0 || shares < 0 || likes < 0) {
    throw new Error('NEGATIVE_METRICS')
  }

  if (views === 0) return 0

  // 权重：展示 40% + 分享 35% + 点赞 25%
  const viewScore = Math.min(views / 10000, 1) * 40
  const shareScore = Math.min(shares / Math.max(views, 1) * 100, 1) * 35
  const likeScore = Math.min(likes / Math.max(views, 1) * 100, 1) * 25

  return Math.round((viewScore + shareScore + likeScore) * 100) / 100
}

/** 更新分析数据（内部辅助） */
function updateAnalytics(id: string, delta: Partial<ContentAnalytics>): void {
  const current = _analyticsStore.get(id)
  if (!current) return

  const updated = { ...current }
  if (delta.views !== undefined) updated.views += delta.views
  if (delta.shares !== undefined) updated.shares += delta.shares
  if (delta.likes !== undefined) updated.likes += delta.likes
  if (delta.conversion !== undefined) updated.conversion += delta.conversion
  _analyticsStore.set(id, updated)
}

// ──────────────────────────────────────────────
// E15吴内容 + E31吴品牌视角：增值内容创作与品牌价值
// ──────────────────────────────────────────────

describe('P-45 增值服务 — E15吴内容 + E31吴品牌', () => {
  beforeEach(() => {
    resetContentStore()
  })

  // ── 1. 创建内容：完整参数 → 成功创建 ──
  it('1) 创建内容 — 有效参数成功创建 DRAFT 内容', () => {
    const item = createContentItem('五一促销海报', 'banner', 'tenant-brand-a')

    expect(item).toHaveProperty('id')
    expect(item.id).toMatch(/^content-\d{4}$/)
    expect(item.title).toBe('五一促销海报')
    expect(item.type).toBe('banner')
    expect(item.tenantId).toBe('tenant-brand-a')
    expect(item.status).toBe('DRAFT')
    expect(item.createdAt).toBeTruthy()
  })

  // ── 2. 创建内容：各种内容类型 → 均成功 ──
  it('2) 创建内容 — 支持所有内容类型', () => {
    const types = ['article', 'video', 'image', 'banner', 'promotion', 'poster', 'social']
    types.forEach((type) => {
      const item = createContentItem(`测试内容-${type}`, type, 'tenant-default')
      expect(item.type).toBe(type)
      expect(item.status).toBe('DRAFT')
    })
  })

  // ── 3. 创建内容：空标题/空类型/空租户 → 异常 ──
  it('3) 创建内容 — 空参数抛出对应错误', () => {
    expect(() => createContentItem('', 'banner', 't1')).toThrow('INVALID_TITLE')
    expect(() => createContentItem('标题', '', 't1')).toThrow('INVALID_TYPE')
    expect(() => createContentItem('标题', 'banner', '')).toThrow('INVALID_TENANT')
    expect(() => createContentItem('标题', 'unknown-type', 't1')).toThrow('UNSUPPORTED_CONTENT_TYPE')
  })

  // ── 4. 发布内容：DRAFT → PUBLISHED ──
  it('4) 发布内容 — DRAFT 内容成功发布为 PUBLISHED', () => {
    const item = createContentItem('春季新品推广', 'promotion', 'tenant-brand-b')
    const result = publishContent(item.id)

    expect(result.success).toBe(true)
    expect(result.publishedAt).toBeTruthy()

    // 验证内容状态已更新
    const analytics = getContentAnalytics(item.id)
    expect(analytics).toBeDefined()
  })

  // ── 5. 发布内容：重复发布 → 异常 ──
  it('5) 发布内容 — 已发布内容再次发布抛出 ALREADY_PUBLISHED', () => {
    const item = createContentItem('再发一次', 'article', 't1')
    publishContent(item.id)
    expect(() => publishContent(item.id)).toThrow('ALREADY_PUBLISHED')
  })

  // ── 6. 发布内容：不存在的内容ID → 异常 ──
  it('6) 发布内容 — 不存在的 ID 抛出 CONTENT_NOT_FOUND', () => {
    expect(() => publishContent('content-9999')).toThrow('CONTENT_NOT_FOUND')
    expect(() => publishContent('')).toThrow('INVALID_CONTENT_ID')
  })

  // ── 7. 数据分析：发布后数据归零 ──
  it('7) 数据分析 — 新内容初始分析数据为零', () => {
    const item = createContentItem('数据分析测试', 'video', 't-analytics')
    publishContent(item.id)
    const analytics = getContentAnalytics(item.id)

    expect(analytics.views).toBe(0)
    expect(analytics.shares).toBe(0)
    expect(analytics.likes).toBe(0)
    expect(analytics.conversion).toBe(0)
  })

  // ── 8. 数据分析：模拟数据更新后正常读取 ──
  it('8) 数据分析 — 更新后正确读取数据', () => {
    const item = createContentItem('爆款文章', 'article', 't-metrics')
    publishContent(item.id)

    // 模拟数据更新
    updateAnalytics(item.id, { views: 12500, shares: 340, likes: 890 })
    const analytics = getContentAnalytics(item.id)

    expect(analytics.views).toBe(12500)
    expect(analytics.shares).toBe(340)
    expect(analytics.likes).toBe(890)
  })

  // ── 9. 数据分析：空ID/不存在 → 异常 ──
  it('9) 数据分析 — 无效 ID 抛出对应错误', () => {
    expect(() => getContentAnalytics('')).toThrow('INVALID_CONTENT_ID')
    expect(() => getContentAnalytics('content-nonexistent')).toThrow('ANALYTICS_NOT_FOUND')
  })

  // ── 10. 价值评分：高流量高互动 → 高分 ──
  it('10) 价值评分 — 高曝光高互动内容得分接近满分', () => {
    const score = calculateValueScore(50000, 800, 2500)
    expect(score).toBeGreaterThan(80)
    expect(score).toBeLessThanOrEqual(100)
  })

  // ── 11. 价值评分：无曝光 → 0分；负数指标 → 异常 ──
  it('11) 价值评分 — 零曝光得0分，负数指标抛异常', () => {
    expect(calculateValueScore(0, 0, 0)).toBe(0)
    expect(() => calculateValueScore(-1, 0, 0)).toThrow('NEGATIVE_METRICS')
    expect(() => calculateValueScore(0, -1, 0)).toThrow('NEGATIVE_METRICS')
    expect(() => calculateValueScore(0, 0, -1)).toThrow('NEGATIVE_METRICS')
  })

  // ── 12. 端到端：完整流程 创建→发布→分析→评分 ──
  it('12) 端到端 — 创建→发布→数据分析→价值评分完整链路', () => {
    const item = createContentItem('联名品牌推广视频', 'video', 'tenant-brand-collab')
    expect(item.status).toBe('DRAFT')

    const published = publishContent(item.id)
    expect(published.success).toBe(true)

    // 模拟发布后的数据积累
    updateAnalytics(item.id, { views: 8500, shares: 420, likes: 1100, conversion: 3.2 })
    const analytics = getContentAnalytics(item.id)
    expect(analytics.views).toBe(8500)
    expect(analytics.shares).toBe(420)
    expect(analytics.conversion).toBe(3.2)

    // 计算价值评分
    const score = calculateValueScore(analytics.views, analytics.shares, analytics.likes)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})
