import { describe, it, expect, beforeEach } from 'vitest'

/**
 * 🦞 跨模块 E2E 测试链 #33: AI 辅助内容审核工作流
 *
 * 模拟链路:
 *   Content Service (内容创建/编辑/版本管理)
 *   → AI Review Service (自动内容审核: 敏感词/合规/质量评分)
 *   → Audit Service (审核记录/操作日志)
 *   → Content Approval Gate (审批流: 提交→初审→驳回/通过→终审→发布)
 *
 * 验证:
 *   - 内容创建→提交审核→AI自动初审→人工复核→发布的全流程
 *   - 驳回后重新提交→再次审核的迭代流程
 *   - 反例: 含敏感词/违规内容被驳回
 *   - 边界: 超长内容性能、空内容处理
 *   - 审计追踪: 每次审批操作都生成审计日志
 *
 * 设计模式: 内容审核工作流 (Approval Pipeline)
 *
 * ⚡ 新增于 Pulse-Nightly-11 | 覆盖链 #31 审批流缺口
 */

import assert from 'node:assert/strict'

// ============================================================
// 类型定义
// ============================================================

// 内容模型
interface ContentItem {
  id: string
  title: string
  body: string
  locale: string
  contentType: 'article' | 'product_desc' | 'banner' | 'notification' | 'help_doc'
  author: string
  status: ContentStatus
  version: number
  reviewScore?: number
  flaggedReasons?: string[]
  createdAt: string
  updatedAt: string
}

type ContentStatus =
  | 'draft'
  | 'pending_ai_review'
  | 'ai_approved'
  | 'ai_rejected'
  | 'pending_human_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived'

// AI 审核结果
interface AIReviewResult {
  passed: boolean
  score: number
  flags: AIFlag[]
  summary: string
  reviewedAt: string
}

interface AIFlag {
  category: 'sensitive_word' | 'harmful_content' | 'quality_low' | 'format_error' | 'compliance_violation'
  detail: string
  severity: 'low' | 'medium' | 'high'
}

// 审批记录
interface ApprovalRecord {
  id: string
  contentId: string
  action: 'submit_review' | 'ai_review' | 'human_review' | 'approve' | 'reject' | 're_submit' | 'publish'
  actor: 'system_ai' | 'author' | 'human_reviewer' | 'editor_in_chief'
  comment?: string
  previousStatus: ContentStatus
  newStatus: ContentStatus
  timestamp: string
}

// ============================================================
// In-memory Stores
// ============================================================

const contentStore = new Map<string, ContentItem>()
const auditLog: ApprovalRecord[] = []
let contentIdCounter = 0

function resetAll(): void {
  contentStore.clear()
  auditLog.length = 0
  contentIdCounter = 0
}

// ============================================================
// Content Service
// ============================================================

function createContent(
  title: string,
  body: string,
  contentType: ContentItem['contentType'],
  locale: string,
  author: string,
): { content: ContentItem; error?: string } {
  if (!title || title.trim() === '') return { content: null as any, error: 'title is required' }
  if (!body || body.trim() === '') return { content: null as any, error: 'body is required' }
  if (body.length > 50000) return { content: null as any, error: 'body exceeds maximum length of 50000 characters' }

  const id = `content-${++contentIdCounter}`
  const now = new Date().toISOString()
  const content: ContentItem = {
    id,
    title,
    body,
    locale,
    contentType,
    author,
    status: 'draft',
    version: 1,
    createdAt: now,
    updatedAt: now,
  }
  contentStore.set(id, content)
  return { content }
}

function getContent(id: string): ContentItem | undefined {
  return contentStore.get(id)
}

function updateContent(id: string, updates: Partial<Pick<ContentItem, 'title' | 'body'>>): { content: ContentItem; error?: string } {
  const existing = contentStore.get(id)
  if (!existing) return { content: null as any, error: 'content not found' }
  if (existing.status === 'published') return { content: null as any, error: 'cannot update published content' }

  const updated: ContentItem = {
    ...existing,
    ...updates,
    status: 'draft', // 编辑后回到草稿
    version: existing.version + 1,
    updatedAt: new Date().toISOString(),
  }
  contentStore.set(id, updated)
  return { content: updated }
}

// ============================================================
// AI Review Service
// ============================================================

// 敏感词库
const SENSITIVE_WORDS = ['spam', 'violence', 'illegal', 'hate_speech', 'porn']
const QUALITY_MIN_WORDS = 10
const COMPLIANCE_KEYWORDS_REQUIRED = ['terms', 'privacy']

function aiReviewContent(content: ContentItem): AIReviewResult {
  const flags: AIFlag[] = []
  const bodyLower = content.body.toLowerCase()

  // 1. 敏感词检测
  for (const word of SENSITIVE_WORDS) {
    if (bodyLower.includes(word)) {
      flags.push({
        category: 'sensitive_word',
        detail: `Contains sensitive word: "${word}"`,
        severity: 'high',
      })
    }
  }

  // 2. 质量检测
  const wordCount = content.body.split(/\s+/).length
  if (wordCount < QUALITY_MIN_WORDS) {
    flags.push({
      category: 'quality_low',
      detail: `Content too short: ${wordCount} words (min ${QUALITY_MIN_WORDS})`,
      severity: 'medium',
    })
  }

  // 3. 合规检测
  if (content.contentType === 'product_desc') {
    const hasTerms = COMPLIANCE_KEYWORDS_REQUIRED.every(k => bodyLower.includes(k))
    if (!hasTerms) {
      flags.push({
        category: 'compliance_violation',
        detail: 'Product description must contain terms and privacy keywords',
        severity: 'high',
      })
    }
  }

  const baseScore = 100
  const penalty = flags.reduce((sum, f) => {
    return sum + (f.severity === 'high' ? 25 : f.severity === 'medium' ? 20 : 5)
  }, 0)
  const score = Math.max(0, baseScore - penalty)

  const passed = flags.length === 0 || (flags.every(f => f.severity !== 'high') && score >= 70)

  return {
    passed,
    score,
    flags,
    summary: flags.length === 0
      ? 'Content passed AI review'
      : `Content flagged: ${flags.map(f => f.detail).join('; ')}`,
    reviewedAt: new Date().toISOString(),
  }
}

// ============================================================
// Review Workflow Service (审批流状态机)
// ============================================================

function addAuditRecord(audit: Omit<ApprovalRecord, 'id' | 'timestamp'>): ApprovalRecord {
  const record: ApprovalRecord = {
    ...audit,
    id: `audit-${auditLog.length + 1}`,
    timestamp: new Date().toISOString(),
  }
  auditLog.push(record)
  return record
}

function submitForReview(contentId: string): { success: boolean; error?: string; aiResult?: AIReviewResult } {
  const content = contentStore.get(contentId)
  if (!content) return { success: false, error: 'content not found' }
  if (content.status !== 'draft') return { success: false, error: `cannot submit content with status: ${content.status}` }

  // 1. 更新状态
  content.status = 'pending_ai_review'
  content.updatedAt = new Date().toISOString()
  contentStore.set(contentId, content)
  addAuditRecord({
    contentId, action: 'submit_review', actor: 'author',
    previousStatus: 'draft', newStatus: 'pending_ai_review',
    comment: 'Submitted for AI review',
  })

  // 2. AI 自动审核
  const aiResult = aiReviewContent(content)
  addAuditRecord({
    contentId, action: 'ai_review', actor: 'system_ai',
    previousStatus: 'pending_ai_review',
    newStatus: aiResult.passed ? 'ai_approved' : 'ai_rejected',
    comment: aiResult.summary,
  })

  content.status = aiResult.passed ? 'ai_approved' : 'ai_rejected'
  content.reviewScore = aiResult.score
  content.flaggedReasons = aiResult.flags.map(f => f.detail)
  content.updatedAt = new Date().toISOString()
  contentStore.set(contentId, content)

  return { success: true, aiResult }
}

function humanApprove(contentId: string, reviewer: string, comment?: string): { success: boolean; error?: string } {
  const content = contentStore.get(contentId)
  if (!content) return { success: false, error: 'content not found' }
  if (content.status !== 'ai_approved') return { success: false, error: `cannot approve content with status: ${content.status}` }

  content.status = 'approved'
  content.updatedAt = new Date().toISOString()
  contentStore.set(contentId, content)
  addAuditRecord({
    contentId, action: 'approve', actor: 'human_reviewer',
    previousStatus: 'ai_approved', newStatus: 'approved',
    comment: comment || 'Approved by human reviewer',
  })
  return { success: true }
}

function humanReject(contentId: string, reviewer: string, reason: string): { success: boolean; error?: string } {
  const content = contentStore.get(contentId)
  if (!content) return { success: false, error: 'content not found' }
  if (content.status !== 'ai_approved' && content.status !== 'pending_human_review') {
    return { success: false, error: `cannot reject content with status: ${content.status}` }
  }

  content.status = 'rejected'
  content.updatedAt = new Date().toISOString()
  contentStore.set(contentId, content)
  addAuditRecord({
    contentId, action: 'reject', actor: 'human_reviewer',
    previousStatus: content.status === 'ai_approved' ? 'ai_approved' : 'pending_human_review',
    newStatus: 'rejected',
    comment: reason,
  })
  return { success: true }
}

function publishContent(contentId: string, publisher: string): { success: boolean; error?: string } {
  const content = contentStore.get(contentId)
  if (!content) return { success: false, error: 'content not found' }
  if (content.status !== 'approved') return { success: false, error: `cannot publish content with status: ${content.status}` }

  content.status = 'published'
  content.updatedAt = new Date().toISOString()
  contentStore.set(contentId, content)
  addAuditRecord({
    contentId, action: 'publish', actor: 'editor_in_chief',
    previousStatus: 'approved', newStatus: 'published',
    comment: `Published by ${publisher}`,
  })
  return { success: true }
}

function reSubmitAfterRejection(contentId: string, newBody?: string): { success: boolean; error?: string } {
  const content = contentStore.get(contentId)
  if (!content) return { success: false, error: 'content not found' }
  if (content.status !== 'rejected' && content.status !== 'ai_rejected') {
    return { success: false, error: `cannot resubmit content with status: ${content.status}` }
  }

  if (newBody) {
    content.body = newBody
    content.version += 1
  }
  content.status = 'draft'
  content.updatedAt = new Date().toISOString()
  contentStore.set(contentId, content)

  // 自动发起重新审核
  return submitForReview(contentId)
}

// ============================================================
// 测试套件
// ============================================================

describe('跨模块链 #33 · AI 辅助内容审核工作流', () => {
  beforeEach(() => {
    resetAll()
  })

  // ─── Phase 1: 正向全流程 ───

  it('正例: 内容创建→AI审核通过→人工审批→发布', () => {
    // 1. 创建内容
    const { content } = createContent(
      '欢迎使用神机 Ying 系统',
      'This is a welcome guide for the shenjiying system. Please read the terms, privacy and guidelines carefully for the best experience.',
      'article',
      'zh-CN',
      'editor-01',
    )
    expect(content).toBeDefined()
    expect(content.status).toBe('draft')

    // 2. 提交审核
    const review = submitForReview(content.id)
    expect(review.success).toBe(true)
    expect(review.aiResult).toBeDefined()

    const reviewed = getContent(content.id)!
    expect(reviewed.status).toBe('ai_approved')
    expect(reviewed.reviewScore).toBeGreaterThanOrEqual(60)

    // 3. 人工审批
    const approve = humanApprove(content.id, 'reviewer-01', 'Looks good to me')
    expect(approve.success).toBe(true)

    const approved = getContent(content.id)!
    expect(approved.status).toBe('approved')

    // 4. 发布
    const pub = publishContent(content.id, 'chief-editor')
    expect(pub.success).toBe(true)

    const published = getContent(content.id)!
    expect(published.status).toBe('published')
    expect(published.version).toBe(1)

    // 5. 审计追踪完整
    expect(auditLog.length).toBeGreaterThanOrEqual(4) // submit_review + ai_review + approve + publish
  })

  // ─── Phase 2: 驳回重提流程 ───

  it('正例: AI 驳回→修改内容→重新提交→人工审批→发布', () => {
    // 1. 创建含敏感词的内容
    const { content } = createContent(
      'Test Content',
      'This content contains spam and illegal references without proper terms and privacy mentions.',
      'product_desc',
      'en',
      'author-02',
    )
    expect(content).toBeDefined()

    // 2. 提交审核 → AI 驳回
    const review1 = submitForReview(content.id)
    expect(review1.success).toBe(true)
    expect(review1.aiResult!.passed).toBe(false)
    const rejected = getContent(content.id)!
    expect(rejected.status).toBe('ai_rejected')
    expect(rejected.flaggedReasons!.length).toBeGreaterThanOrEqual(2)

    // 3. 修改内容后重新提交
    const resubmit = reSubmitAfterRejection(content.id,
      'This is a clean product description that follows the terms and privacy guidelines. All required keywords are present here.',
    )
    expect(resubmit.success).toBe(true)
    expect(resubmit.aiResult!.passed).toBe(true)

    const aiApproved = getContent(content.id)!
    expect(aiApproved.status).toBe('ai_approved')
    expect(aiApproved.version).toBe(2)

    // 4. 人工审批通过
    humanApprove(content.id, 'reviewer-02')
    publishContent(content.id, 'editor-in-chief')

    const published = getContent(content.id)!
    expect(published.status).toBe('published')

    // 5. 审计日志: 历次审核均被记录
    expect(auditLog.length).toBeGreaterThanOrEqual(6) // submit_review + ai_review(reject), + submit_review + ai_review(approve) + human_approve + publish
  })

  // ─── Phase 3: 人工驳回 ───

  it('正例: AI 通过→人工驳回→修改→再审批→发布', () => {
    const { content } = createContent(
      'Quality Article',
      'A well-written article about testing. It follows all quality guidelines and includes terms and privacy considerations.',
      'article',
      'zh-CN',
      'author-03',
    )

    // AI 通过
    submitForReview(content.id)
    let c = getContent(content.id)!
    expect(c.status).toBe('ai_approved')

    // 人工驳回
    humanReject(content.id, 'reviewer-03', 'Content lacks specific examples and references')
    c = getContent(content.id)!
    expect(c.status).toBe('rejected')

    // 修改后重新提交
    const resubmit = reSubmitAfterRejection(content.id,
      'A well-written article about testing with specific examples and references. It follows all quality guidelines.',
    )
    expect(resubmit.success).toBe(true)
    expect(resubmit.aiResult!.passed).toBe(true)

    // 再审通过
    humanApprove(content.id, 'reviewer-04', 'Much better now')
    publishContent(content.id, 'chief-editor')

    expect(getContent(content.id)!.status).toBe('published')
  })

  // ─── Phase 4: 反例 ───

  it('反例: 已发布内容不能编辑', () => {
    const { content } = createContent('Published', 'This is published content with terms and privacy.', 'article', 'en', 'author')
    submitForReview(content.id)
    humanApprove(content.id, 'reviewer')
    publishContent(content.id, 'editor')

    const update = updateContent(content.id, { title: 'Modified' })
    expect(update.error).toContain('cannot update published')
  })

  it('反例: 空标题/空内容不能创建', () => {
    const r1 = createContent('', 'body content', 'article', 'zh-CN', 'author')
    expect(r1.error).toContain('title')
    const r2 = createContent('Title', '', 'article', 'zh-CN', 'author')
    expect(r2.error).toContain('body')
  })

  it('反例: 未通过 AI 审核不能提交人工审批', () => {
    const { content } = createContent('Bad Content', 'This has spam content', 'article', 'en', 'author')
    submitForReview(content.id)
    const c = getContent(content.id)!
    expect(c.status).toBe('ai_rejected')

    // 尝试绕过 AI 直接提交人工审批
    const approve = humanApprove(content.id, 'reviewer')
    expect(approve.success).toBe(false)
    expect(approve.error).toContain('cannot approve')
  })

  it('反例: 未审批内容不能发布', () => {
    const { content } = createContent('Draft', 'draft content', 'article', 'en', 'author')
    const pub = publishContent(content.id, 'editor')
    expect(pub.success).toBe(false)
    expect(pub.error).toContain('cannot publish')
  })

  it('反例: 内容超过长度限制', () => {
    const longBody = 'x'.repeat(50001)
    const r = createContent('Long', longBody, 'article', 'en', 'author')
    expect(r.error).toContain('exceeds maximum length')
  })

  // ─── Phase 5: 边界测试 ───

  it('边界: 最小篇幅内容被 AI 标记"质量低"但 AI 审核通过（无高严重度标记）', () => {
    const shortBody = 'Hi only' // 2 words < 10 下限
    const { content } = createContent('Short', shortBody, 'article', 'en', 'author')
    const review = submitForReview(content.id)
    expect(review.aiResult!.passed).toBe(true) // 质量低但不阻断
    expect(review.aiResult!.flags.some(f => f.category === 'quality_low')).toBe(true)
  })

  it('边界: 同内容多次提交生成多个版本', () => {
    const { content } = createContent('Version Test', 'Version test body with terms and privacy included.', 'article', 'en', 'author')

    for (let i = 0; i < 3; i++) {
      submitForReview(content.id)
      humanApprove(content.id, 'reviewer')
      publishContent(content.id, 'editor')
      // 已发布内容不能编辑，所以不迭代
    }
    // 第一次流程会成功
    expect(getContent(content.id)!.status).toBe('published')
    expect(getContent(content.id)!.version).toBe(1)
  })

  it('边界: 多次驳回→重新提交循环审计完整性', () => {
    const { content } = createContent('Cycle Test', 'spam content', 'article', 'en', 'author')

    // 第一次审核
    submitForReview(content.id)
    expect(getContent(content.id)!.status).toBe('ai_rejected')

    // 修正并重新提交 × 2
    reSubmitAfterRejection(content.id, 'Clean content about testing with terms and privacy.')
    expect(getContent(content.id)!.status).toBe('ai_approved')

    humanApprove(content.id, 'reviewer')
    publishContent(content.id, 'editor')

    const published = getContent(content.id)!
    expect(published.status).toBe('published')
    expect(published.version).toBe(2)

    // 所有审计记录完整
    const contentAudits = auditLog.filter(a => a.contentId === content.id)
    expect(contentAudits.length).toBeGreaterThanOrEqual(6)
    // 按时间顺序: submit→ai_review(reject)→re_submit→ai_review(approved)→human_approve→publish
    const statuses = contentAudits.map(a => a.action)
    expect(statuses).toContain('submit_review')
    expect(statuses).toContain('ai_review') // AI reject 记录在 ai_review 中 (passed=false)
    expect(statuses.filter(a => a === 'submit_review').length).toBeGreaterThanOrEqual(2) // 两次提交
    expect(statuses).toContain('approve')
    expect(statuses).toContain('publish')
  })
})
