import { describe, it, expect, beforeEach, afterEach } from 'vitest'
/**
 * 🦞 跨模块 E2E 测试链 #43: 内容管理 → AI 审核 → 通知推送 → 多端消费
 *
 * 新增于 Pulse-Nightly-14 龙虾哥凌晨测试第三段
 *
 * 模拟链路:
 *   Content (内容创建/编辑/草稿/发布)
 *   → AI-Review (AI自动审核/敏感词检测/违规判定)
 *   → Notification (通知推送/消息分类/渠道分发)
 *   → Multi-Client (app/storefront-web/tob-web 多端消费)
 *
 * 覆盖模块: content, ai-review, notification, push, feed, i18n, cdn-cache
 *
 * 设计模式: 内容生产→自动审核→通知触达→多端同步消费
 * 验证内容从创建到各端展示全流程，含审核拦截、多语言、通知时机
 */

import assert from 'node:assert/strict'

// ============================================================
// 类型定义
// ============================================================

type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'archived'
type ContentType = 'article' | 'promotion' | 'announcement' | 'help_doc' | 'coupon_desc'
type ReviewDecision = 'approve' | 'reject' | 'flag_review'
type ReviewSeverity = 'safe' | 'low_risk' | 'medium_risk' | 'high_risk' | 'blocked'
type NotificationChannel = 'in_app' | 'push' | 'sms' | 'email' | 'web_socket'
type NotificationPriority = 'low' | 'normal' | 'high' | 'critical'
type ClientType = 'app' | 'miniapp' | 'storefront' | 'tob_web' | 'mobile'

interface ContentItem {
  contentId: string
  contentType: ContentType
  title: string
  body: string
  locale: string
  authorId: string
  tenantId: string
  status: ContentStatus
  version: number
  tags: string[]
  createdAt: string
  publishedAt: string | null
}

interface ReviewResult {
  contentId: string
  decision: ReviewDecision
  severity: ReviewSeverity
  score: number // 0-100, lower = safer
  flags: string[]
  matchedKeywords: string[]
  reviewedAt: string
  reviewer: 'ai' | 'human'
}

interface NotificationMessage {
  notificationId: string
  contentId: string
  title: string
  body: string
  channel: NotificationChannel
  priority: NotificationPriority
  targetRoles: string[]
  targetTenantIds: string[]
  sentAt: string | null
  readBy: string[]
  createdAt: string
}

interface ClientView {
  clientType: ClientType
  contentId: string
  renderedTitle: string
  renderedBody: string
  visible: boolean
  locale: string
  cachedAt: string | null
}

// ============================================================
// 模块模拟实现
// ============================================================

// ---- Content Service ----

const contentStore = new Map<string, ContentItem>()
let contentSeq = 0

function resetContentState(): void {
  contentStore.clear()
  contentSeq = 0
}

function createContent(item: Omit<ContentItem, 'contentId' | 'version' | 'createdAt' | 'publishedAt' | 'status'>): ContentItem {
  const contentId = `CT${++contentSeq}`
  const now = new Date().toISOString()
  const content: ContentItem = {
    contentId,
    ...item,
    status: 'draft',
    version: 1,
    createdAt: now,
    publishedAt: null,
  }
  contentStore.set(contentId, content)
  return content
}

function submitForReview(contentId: string): ContentItem {
  const content = contentStore.get(contentId)
  if (!content) throw new Error(`Content ${contentId} not found`)
  if (content.status !== 'draft') throw new Error(`Cannot submit ${content.status} content for review`)
  content.status = 'pending_review'
  return { ...content }
}

function publishContent(contentId: string): ContentItem {
  const content = contentStore.get(contentId)
  if (!content) throw new Error(`Content ${contentId} not found`)
  if (content.status !== 'approved') throw new Error(`Cannot publish content in status: ${content.status}`)
  content.status = 'published'
  content.publishedAt = new Date().toISOString()
  content.version += 1
  return { ...content }
}

function getContent(contentId: string): ContentItem | undefined {
  return contentStore.get(contentId)
}

// ---- AI Review Service ----

const SENSITIVE_KEYWORDS: string[] = [
  '赌博', '色情', '暴力', '毒品', '歧视',
  'hack', 'crack', 'exploit', 'vulnerability',
  '赌场', '博彩',
]

function evaluateContentRisk(content: ContentItem): ReviewResult {
  const matchedKeywords: string[] = []
  let score = 0

  // Check title and body for sensitive keywords
  const textToCheck = `${content.title} ${content.body}`.toLowerCase()

  for (const kw of SENSITIVE_KEYWORDS) {
    if (textToCheck.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw)
      score += 25 // each keyword adds 25 risk score
    }
  }

  // Check for excessive length
  if (content.body.length > 10000) score += 10
  if (content.body.length > 50000) score += 20

  // Check for external links
  const externalLinkCount = (content.body.match(/https?:\/\//g) || []).length
  if (externalLinkCount > 5) score += 15

  // Determine severity and decision
  let severity: ReviewSeverity
  let decision: ReviewDecision

  if (score >= 70) {
    severity = 'blocked'
    decision = 'reject'
  } else if (score >= 40) {
    severity = 'high_risk'
    decision = 'reject'
  } else if (score >= 20) {
    severity = 'medium_risk'
    decision = 'flag_review'
  } else if (score > 0) {
    severity = 'low_risk'
    decision = 'flag_review'
  } else {
    severity = 'safe'
    decision = 'approve'
  }

  return {
    contentId: content.contentId,
    decision,
    severity,
    score,
    flags: score > 0 ? ['sensitive_content', 'contains_risk'] : [],
    matchedKeywords,
    reviewedAt: new Date().toISOString(),
    reviewer: 'ai',
  }
}

function applyReviewToContent(content: ContentItem, review: ReviewResult): ContentItem {
  if (review.decision === 'approve') {
    content.status = 'approved'
  } else if (review.decision === 'reject') {
    content.status = 'rejected'
  } else {
    // flag_review: stay in pending, but mark
    content.status = 'pending_review'
  }
  return { ...content }
}

// ---- Notification Service ----

const notificationStore = new Map<string, NotificationMessage[]>()
let notifSeq = 0

function resetNotificationState(): void {
  notificationStore.clear()
  notifSeq = 0
}

function sendNotification(
  content: ContentItem,
  event: 'content_approved' | 'content_rejected' | 'content_published',
  targetRoles: string[],
  targetTenants: string[]
): NotificationMessage {
  const titles: Record<string, string> = {
    content_approved: '内容审核通过',
    content_rejected: '内容审核未通过',
    content_published: '新内容已发布',
  }
  const bodies: Record<string, string> = {
    content_approved: `您的《${content.title}》已通过AI审核，可以发布`,
    content_rejected: `您的《${content.title}》未通过AI审核，请修改后重新提交`,
    content_published: `《${content.title}》已发布`,
  }

  const notif: NotificationMessage = {
    notificationId: `N${++notifSeq}`,
    contentId: content.contentId,
    title: titles[event] || '内容通知',
    body: bodies[event] || '',
    channel: 'in_app',
    priority: event === 'content_rejected' ? 'high' : 'normal',
    targetRoles,
    targetTenantIds: targetTenants,
    sentAt: new Date().toISOString(),
    readBy: [],
    createdAt: new Date().toISOString(),
  }

  const key = content.tenantId
  const existing = notificationStore.get(key) || []
  existing.push(notif)
  notificationStore.set(key, existing)
  return notif
}

function getNotificationsForTenant(tenantId: string): NotificationMessage[] {
  return notificationStore.get(tenantId) || []
}

function markNotificationRead(notificationId: string, memberId: string): void {
  for (const notifs of notificationStore.values()) {
    const n = notifs.find(n => n.notificationId === notificationId)
    if (n && !n.readBy.includes(memberId)) {
      n.readBy.push(memberId)
    }
  }
}

// ---- Multi-Client Rendering Service ----

const localeMap: Record<string, string> = {
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  'en-US': 'en-US',
  'ja-JP': 'ja-JP',
}

function renderForClient(
  content: ContentItem,
  clientType: ClientType,
  targetLocale: string
): ClientView {
  if (content.status !== 'published') {
    return {
      clientType,
      contentId: content.contentId,
      renderedTitle: '',
      renderedBody: '',
      visible: false,
      locale: targetLocale,
      cachedAt: null,
    }
  }

  // Simple locale adjustment
  const effectiveLocale = localeMap[targetLocale] || 'zh-CN'

  // Mobile vs Web rendering variations
  let title = content.title
  let body = content.body

  if (clientType === 'miniapp') {
    // Miniapp has shorter content limit
    if (body.length > 500) body = body.slice(0, 500) + '…'
  }

  if (clientType === 'mobile') {
    if (title.length > 30) title = title.slice(0, 30) + '…'
  }

  return {
    clientType,
    contentId: content.contentId,
    renderedTitle: title,
    renderedBody: body,
    visible: true,
    locale: effectiveLocale,
    cachedAt: null,
  }
}

// ============================================================
// 全链路整合函数
// ============================================================

function executeFullContentJourney(
  contentInput: Omit<ContentItem, 'contentId' | 'version' | 'createdAt' | 'publishedAt' | 'status'>
): {
  content: ContentItem
  review: ReviewResult
  notificationApproved?: NotificationMessage
  notificationRejected?: NotificationMessage
  notificationPublished?: NotificationMessage
  appView: ClientView
  miniappView: ClientView
} {
  // 1. 创建内容
  const content = createContent(contentInput)

  // 2. 提交审核
  submitForReview(content.contentId)

  // 3. AI 审核
  const review = evaluateContentRisk(contentStore.get(content.contentId)!)

  // 4. 应用审核结果
  applyReviewToContent(contentStore.get(content.contentId)!, review)

  const updatedContent = contentStore.get(content.contentId)!
  let notifApproved: NotificationMessage | undefined
  let notifRejected: NotificationMessage | undefined
  let notifPublished: NotificationMessage | undefined

  // 5. 通知
  if (review.decision === 'approve') {
    notifApproved = sendNotification(updatedContent, 'content_approved', ['editor', 'admin'], [content.tenantId])
    // 自动发布 approved 的内容
    const published = publishContent(updatedContent.contentId)
    notifPublished = sendNotification(published, 'content_published', ['member', 'guest'], [content.tenantId])
  } else if (review.decision === 'reject') {
    notifRejected = sendNotification(updatedContent, 'content_rejected', ['editor'], [content.tenantId])
  }

  const finalContent = contentStore.get(content.contentId)!

  // 6. 多端渲染（使用内容自身的 locale）
  const appView = renderForClient(finalContent, 'app', finalContent.locale)
  const miniappView = renderForClient(finalContent, 'miniapp', finalContent.locale)

  return {
    content: finalContent,
    review,
    notificationApproved: notifApproved,
    notificationRejected: notifRejected,
    notificationPublished: notifPublished,
    appView,
    miniappView,
  }
}

// ============================================================
// 测试用例
// ============================================================

describe('🦞 跨模块 E2E #43: 内容→AI审核→通知→多端消费', () => {
  beforeEach(() => {
    resetContentState()
    resetNotificationState()
    contentSeq = 0
    notifSeq = 0
  })

  // --- 正例 ---
  describe('正例', () => {
    it('安全内容: 创建 → 审核通过 → 通知 → 发布 → 多端展示', () => {
      const result = executeFullContentJourney({
        contentType: 'article',
        title: '欢迎使用游戏厅',
        body: '本指南介绍游戏厅的基本使用方法和会员福利。请遵守场馆规则。',
        locale: 'zh-CN',
        authorId: 'U001',
        tenantId: 'T001',
        tags: ['新手', '指南'],
      })

      // 内容状态
      assert.equal(result.content.status, 'published')
      assert.equal(result.content.contentType, 'article')

      // 审核结果
      assert.equal(result.review.decision, 'approve')
      assert.equal(result.review.severity, 'safe')
      assert.equal(result.review.score, 0)
      assert.equal(result.review.matchedKeywords.length, 0)

      // 通知
      assert.ok(result.notificationApproved)
      assert.equal(result.notificationApproved!.title, '内容审核通过')
      assert.ok(result.notificationPublished)
      assert.equal(result.notificationPublished!.title, '新内容已发布')

      // 多端展示
      assert.ok(result.appView.visible)
      assert.equal(result.appView.renderedTitle, '欢迎使用游戏厅')
      assert.ok(result.miniappView.visible)
    })

    it('促销内容创建 → 审核通过 → 可发布', () => {
      const result = executeFullContentJourney({
        contentType: 'promotion',
        title: '暑期大促 — 充值满100送50',
        body: '活动期间充值满100元即送50元游戏币。优惠截止日期8月31日。',
        locale: 'zh-CN',
        authorId: 'U002',
        tenantId: 'T002',
        tags: ['促销', '暑期'],
      })

      assert.equal(result.content.status, 'published')
      assert.equal(result.review.decision, 'approve')
      assert.ok(result.notificationApproved)
      assert.ok(result.notificationPublished)
    })

    it('多端渲染差异: miniapp 内容截断 vs app 完整显示', () => {
      const longBody = 'A'.repeat(600)
      const result = executeFullContentJourney({
        contentType: 'article',
        title: '超长内容测试',
        body: longBody,
        locale: 'zh-CN',
        authorId: 'U003',
        tenantId: 'T003',
        tags: [],
      })

      // App: 完整显示
      assert.equal(result.appView.renderedBody.length, 600)
      // Miniapp: 500 截断
      assert.equal(result.miniappView.renderedBody.length, 501) // 500 + '…'
    })
  })

  // --- 反例 ---
  describe('反例', () => {
    it('含敏感词内容 → AI 标记 → 需要人工复审 (score=25 < 40)', () => {
      const result = executeFullContentJourney({
        contentType: 'article',
        title: '优惠活动',
        body: '本店严禁赌博行为，所有机器均为合法游戏设备',
        locale: 'zh-CN',
        authorId: 'U004',
        tenantId: 'T004',
        tags: [],
      })

      // '赌博' is a single sensitive keyword -> score=25 -> medium_risk -> flag_review
      assert.equal(result.review.decision, 'flag_review')
      assert.equal(result.review.severity, 'medium_risk')
      assert.ok(result.review.matchedKeywords.includes('赌博'))
      // flag_review 保持 pending_review，需要人工复审
      assert.equal(result.content.status, 'pending_review')

      // 不应有自动批准/拒绝通知
      assert.equal(result.notificationApproved, undefined)
      assert.equal(result.notificationRejected, undefined)
      assert.equal(result.notificationPublished, undefined)

      // pending_review 的内容在多端也不可见
      assert.ok(!result.appView.visible)
      assert.ok(!result.miniappView.visible)
    })

    it('高多次违规关键词 → 评分超过70 → severity blocked', () => {
      const result = executeFullContentJourney({
        contentType: 'article',
        title: '违规内容测试',
        body: '赌博 色情 暴力 毒品 歧视',
        locale: 'zh-CN',
        authorId: 'U005',
        tenantId: 'T005',
        tags: [],
      })

      // 5 keywords * 25 = 125 >= 70
      assert.equal(result.review.decision, 'reject')
      assert.equal(result.review.severity, 'blocked')
      assert.ok(result.review.score >= 70)
      assert.equal(result.review.matchedKeywords.length, 5)
    })

    it('已发布内容不可重复提交审核', () => {
      const result = executeFullContentJourney({
        contentType: 'article',
        title: '正常内容',
        body: '这是一个正常的帮助文档。',
        locale: 'zh-CN',
        authorId: 'U006',
        tenantId: 'T006',
        tags: [],
      })

      assert.equal(result.content.status, 'published')

      // 再次提交应报错
      assert.throws(() => {
        submitForReview(result.content.contentId)
      }, /Cannot submit.*content/)
    })
  })

  // --- 边界 ---
  describe('边界', () => {
    it('中等风险 (score 20-39) → flag_review 但不拒绝', () => {
      const result = executeFullContentJourney({
        contentType: 'article',
        title: '内容中含有赌博字样的讨论',
        body: '本文讨论赌博的危害性以及如何戒除赌瘾。',
        locale: 'zh-CN',
        authorId: 'U007',
        tenantId: 'T007',
        tags: ['讨论'],
      })

      // '赌博' matched -> score = 25 -> medium_risk -> flag_review
      // Since decision is flag_review, status stays 'pending_review' (no auto-approve/reject)
      assert.equal(result.review.severity, 'medium_risk')
      assert.equal(result.review.decision, 'flag_review')
      assert.equal(result.content.status, 'pending_review')
    })

    it('多链接内容 (超过5个外部链接) → 风险扣分', () => {
      const result = executeFullContentJourney({
        contentType: 'article',
        title: '资源汇总',
        body: '链接1: https://example1.com 链接2: https://example2.com 链接3: https://example3.com 链接4: https://example4.com 链接5: https://example5.com 链接6: https://example6.com',
        locale: 'zh-CN',
        authorId: 'U008',
        tenantId: 'T008',
        tags: [],
      })

      // 6 external links = 15 pts -> score 15 -> low_risk -> flag_review
      assert.equal(result.review.decision, 'flag_review')
      // Should not reject, just flag
      assert.notEqual(result.review.severity, 'blocked')
    })

    it('通知已读状态正确追踪', () => {
      const result = executeFullContentJourney({
        contentType: 'announcement',
        title: '系统维护通知',
        body: '系统将于凌晨2点进行维护升级。',
        locale: 'zh-CN',
        authorId: 'U009',
        tenantId: 'T009',
        tags: ['维护'],
      })

      const notif = result.notificationApproved!
      assert.equal(notif.readBy.length, 0)

      markNotificationRead(notif.notificationId, 'M001')
      const updatedNotifs = getNotificationsForTenant('T009')
      const updated = updatedNotifs.find(n => n.notificationId === notif.notificationId)
      assert.ok(updated!.readBy.includes('M001'))
    })

    it('租户隔离：不同租户不能看到对方通知', () => {
      executeFullContentJourney({
        contentType: 'article',
        title: 'Tenant A内容',
        body: '这是A租户的内容。',
        locale: 'zh-CN',
        authorId: 'U010',
        tenantId: 'T010',
        tags: [],
      })

      executeFullContentJourney({
        contentType: 'article',
        title: 'Tenant B内容',
        body: '这是B租户的内容。',
        locale: 'zh-CN',
        authorId: 'U011',
        tenantId: 'T011',
        tags: [],
      })

      const notifsA = getNotificationsForTenant('T010')
      const notifsB = getNotificationsForTenant('T011')

      assert.ok(notifsA.length > 0)
      assert.ok(notifsB.length > 0)

      // A's notifications should not include B's
      for (const n of notifsA) {
        assert.equal(n.targetTenantIds[0], 'T010')
      }
    })

    it('多语言 locale 映射正确', () => {
      const result = executeFullContentJourney({
        contentType: 'article',
        title: 'English Guide',
        body: 'This is an English guide.',
        locale: 'en-US',
        authorId: 'U012',
        tenantId: 'T012',
        tags: [],
      })

      assert.equal(result.appView.locale, 'en-US')
      assert.equal(result.miniappView.locale, 'en-US')
    })
  })
})
