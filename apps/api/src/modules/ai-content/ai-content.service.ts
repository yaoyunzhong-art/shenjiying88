/**
 * ai-content.service.ts - T114-3
 * 团建报告 AI + 裁判审核服务
 *
 * 包含四个核心类:
 * - TeamBuildingReportGenerator: 团建报告生成 (P1-16 团建 AI+审核)
 * - ContentModerationService: 内容审核
 * - VideoDeduplicationService: 视频去重 (P2-4 画面去重)
 * - ProgressAnalyzer: 进步幅度分析 (P2-6 进步幅度)
 */

import { Injectable, Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TeamBuildingEvent {
  id: string
  name: string
  date: string
  participants: number
  duration: number // 分钟
  activities: string[]
  attendance: number
  budget: number
}

export interface TeamBuildingReport {
  id: string
  eventId: string
  summary: string
  highlights: string[]
  stats: {
    participationRate: number
    avgDuration: number
    topActivity: string
  }
  sharedWith: string[]
  createdAt: string
  updatedAt: string
}

export interface ModerationResult {
  passed: boolean
  violations: Violation[]
  flagged: boolean
}

export interface Violation {
  type: 'political' | 'violence' | 'advertising' | 'other'
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface VideoFingerprint {
  videoId: string
  hash: string
  frames: number[]
  duration: number
}

export interface PerformanceMetric {
  memberId: string
  period: string
  metric: string
  value: number
}

export interface PerformanceComparison {
  before: number
  after: number
  improvement: number
  improvementPercent: number
}

// ── TeamBuildingReportGenerator ───────────────────────────────────────────────

@Injectable()
export class TeamBuildingReportGenerator {
  private readonly logger = new Logger(TeamBuildingReportGenerator.name)
  private readonly reports = new Map<string, TeamBuildingReport>()
  private readonly eventData = new Map<string, TeamBuildingEvent>()

  /**
   * 生成团建报告 (AI 总结活动亮点)
   */
  async generateReport(eventId: string): Promise<TeamBuildingReport | null> {
    const event = this.getEventData(eventId)
    if (!event) {
      this.logger.warn(`[Report] Event ${eventId} not found`)
      return null
    }

    const reportId = `report-${crypto.randomUUID().slice(0, 8)}`
    const participationRate = (event.attendance / event.participants) * 100
    const avgDuration = event.duration / Math.max(event.activities.length, 1)
    const topActivity = this.findTopActivity(event)

    // AI 生成总结
    const summary = this.generateAISummary(event, participationRate)

    const report: TeamBuildingReport = {
      id: reportId,
      eventId,
      summary,
      highlights: [],
      stats: {
        participationRate: Math.round(participationRate * 10) / 10,
        avgDuration: Math.round(avgDuration),
        topActivity,
      },
      sharedWith: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.reports.set(reportId, report)
    this.logger.log(`[Report] Generated report ${reportId} for event ${eventId}`)
    return report
  }

  /**
   * 添加亮点
   */
  addHighlights(reportId: string, highlights: string[]): TeamBuildingReport | null {
    const report = this.reports.get(reportId)
    if (!report) {
      this.logger.warn(`[Report] Report ${reportId} not found`)
      return null
    }

    report.highlights.push(...highlights)
    report.updatedAt = new Date().toISOString()
    this.logger.log(`[Report] Added ${highlights.length} highlights to report ${reportId}`)
    return report
  }

  /**
   * 获取报告
   */
  getReport(eventId: string): TeamBuildingReport | null {
    for (const report of this.reports.values()) {
      if (report.eventId === eventId) {
        return report
      }
    }
    return null
  }

  /**
   * 分享报告
   */
  shareReport(reportId: string, recipients: string[]): TeamBuildingReport | null {
    const report = this.reports.get(reportId)
    if (!report) {
      this.logger.warn(`[Report] Report ${reportId} not found`)
      return null
    }

    report.sharedWith.push(...recipients)
    report.updatedAt = new Date().toISOString()
    this.logger.log(`[Report] Shared report ${reportId} with ${recipients.join(', ')}`)
    return report
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private getEventData(eventId: string): TeamBuildingEvent | null {
    // 检查已有数据
    if (this.eventData.has(eventId)) {
      return this.eventData.get(eventId)!
    }

    // 模拟事件数据
    const mockEvents: Record<string, TeamBuildingEvent> = {
      'evt-001': {
        id: 'evt-001',
        name: '春季团建',
        date: '2024-03-15',
        participants: 50,
        duration: 240,
        activities: ['破冰游戏', '拓展训练', '烧烤晚宴', '才艺展示'],
        attendance: 45,
        budget: 15000,
      },
      'evt-002': {
        id: 'evt-002',
        name: '夏日漂流',
        date: '2024-07-20',
        participants: 30,
        duration: 360,
        activities: ['漂流', '露营', '篝火晚会'],
        attendance: 28,
        budget: 20000,
      },
    }

    return mockEvents[eventId] ?? null
  }

  private findTopActivity(event: TeamBuildingEvent): string {
    // 模拟：返回第一个活动作为最受欢迎活动
    return event.activities[0] ?? '未知活动'
  }

  private generateAISummary(event: TeamBuildingEvent, participationRate: number): string {
    const templates = [
      `${event.name}于${event.date}成功举办，参与率${participationRate.toFixed(1)}%。` +
        `活动包含${event.activities.length}个环节，总时长${event.duration}分钟。` +
        `参与人数${event.attendance}人，使用预算${event.budget}元。` +
        `整体表现良好，建议后续增加互动环节提升参与度。`,

      `本次${event.name}累计${event.duration}分钟，${event.activities.join('、')}等活动环节深受好评。` +
        `出勤率${participationRate.toFixed(1)}%，人均消费${(event.budget / event.attendance).toFixed(0)}元。` +
        `建议：可增加团队协作类活动，进一步增强凝聚力。`,

      `${event.date}的${event.name}圆满结束。` +
        `${event.attendance}/${event.participants}人参与，覆盖率${participationRate.toFixed(1)}%。` +
        `活动涵盖${event.activities.join('、')}，预算执行率${((event.budget / event.budget) * 100).toFixed(0)}%。` +
        `AI评估：活动组织有序，建议继续保持。`,
    ]

    return templates[Math.floor(Math.random() * templates.length)]
  }
}

// ── ContentModerationService ───────────────────────────────────────────────────

export type ContentType = 'text' | 'image_description'

@Injectable()
export class ContentModerationService {
  private readonly logger = new Logger(ContentModerationService.name)
  private readonly contentStore = new Map<string, { content: string; type: ContentType; status: string }>()
  private readonly reviewQueue = new Set<string>()

  // 违规关键词库
  private readonly politicalKeywords = ['分裂', '颠覆', '非法集会', '反动']
  private readonly violenceKeywords = ['暴力', '打架', '伤害', '威胁']
  private readonly advertisingKeywords = ['微信', 'QQ', '联系电话', '加我', '优惠', '促销']

  /**
   * 审核内容 (文字/图片描述)
   */
  moderateContent(content: string, type: ContentType = 'text'): ModerationResult {
    const violations = this.detectViolation(content)
    const hasHighSeverity = violations.some((v) => v.severity === 'high')
    const hasMediumSeverity = violations.some((v) => v.severity === 'medium')

    return {
      passed: violations.length === 0,
      violations,
      flagged: hasHighSeverity || hasMediumSeverity,
    }
  }

  /**
   * 检测违规 (政治/暴力/广告)
   */
  detectViolation(content: string): Violation[] {
    const violations: Violation[] = []
    const lowerContent = content.toLowerCase()

    // 政治敏感检测
    for (const keyword of this.politicalKeywords) {
      if (lowerContent.includes(keyword)) {
        violations.push({
          type: 'political',
          severity: 'high',
          description: `包含政治敏感词: ${keyword}`,
        })
      }
    }

    // 暴力内容检测
    for (const keyword of this.violenceKeywords) {
      if (lowerContent.includes(keyword)) {
        violations.push({
          type: 'violence',
          severity: 'medium',
          description: `包含暴力相关词: ${keyword}`,
        })
      }
    }

    // 广告内容检测
    for (const keyword of this.advertisingKeywords) {
      if (lowerContent.includes(keyword)) {
        violations.push({
          type: 'advertising',
          severity: 'low',
          description: `可能包含广告内容: ${keyword}`,
        })
      }
    }

    return violations
  }

  /**
   * 标记待人工复查
   */
  flagForReview(contentId: string): boolean {
    if (!this.contentStore.has(contentId)) {
      this.logger.warn(`[Moderation] Content ${contentId} not found`)
      return false
    }

    this.reviewQueue.add(contentId)
    this.contentStore.get(contentId)!.status = 'pending_review'
    this.logger.log(`[Moderation] Flagged content ${contentId} for review`)
    return true
  }

  /**
   * 人工通过
   */
  approveContent(contentId: string): boolean {
    if (!this.contentStore.has(contentId)) {
      this.logger.warn(`[Moderation] Content ${contentId} not found`)
      return false
    }

    this.reviewQueue.delete(contentId)
    this.contentStore.get(contentId)!.status = 'approved'
    this.logger.log(`[Moderation] Approved content ${contentId}`)
    return true
  }

  /**
   * 存储内容 (供测试用)
   */
  storeContent(contentId: string, content: string, type: ContentType): void {
    this.contentStore.set(contentId, { content, type, status: 'pending' })
  }

  /**
   * 获取待审核队列
   */
  getReviewQueue(): string[] {
    return Array.from(this.reviewQueue)
  }
}

// ── VideoDeduplicationService ──────────────────────────────────────────────────

@Injectable()
export class VideoDeduplicationService {
  private readonly logger = new Logger(VideoDeduplicationService.name)
  private readonly fingerprints = new Map<string, VideoFingerprint>()

  /**
   * 计算视频指纹
   */
  computeVideoFingerprint(videoId: string): VideoFingerprint {
    if (this.fingerprints.has(videoId)) {
      return this.fingerprints.get(videoId)!
    }

    // 模拟视频指纹计算 (基于视频ID生成伪随机但一致的哈希)
    const hash = this.generateHash(videoId)
    const frames = this.extractFrames(videoId)
    const duration = this.estimateDuration(videoId)

    const fingerprint: VideoFingerprint = {
      videoId,
      hash,
      frames,
      duration,
    }

    this.fingerprints.set(videoId, fingerprint)
    this.logger.log(`[Dedupe] Computed fingerprint for video ${videoId}: ${hash}`)
    return fingerprint
  }

  /**
   * 查找相似视频
   */
  findDuplicates(videoId: string): { videoId: string; similarity: number }[] {
    const target = this.computeVideoFingerprint(videoId)
    const duplicates: { videoId: string; similarity: number }[] = []

    for (const [otherId, otherFp] of this.fingerprints.entries()) {
      if (otherId === videoId) continue

      const similarity = this.computeSimilarity(target.hash, otherFp.hash)
      if (similarity > 0.8) {
        duplicates.push({ videoId: otherId, similarity })
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity)
  }

  /**
   * 计算相似度 (0-1)
   */
  computeSimilarity(fingerprint1: string, fingerprint2: string): number {
    if (fingerprint1 === fingerprint2) return 1.0
    if (fingerprint1.length !== fingerprint2.length) return 0.0

    let matches = 0
    for (let i = 0; i < fingerprint1.length; i++) {
      if (fingerprint1[i] === fingerprint2[i]) {
        matches++
      }
    }

    return matches / fingerprint1.length
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private generateHash(videoId: string): string {
    // 简化哈希：取 videoId 的字符编码和
    let hash = ''
    let sum = 0
    for (let i = 0; i < 16; i++) {
      const charCode = videoId.charCodeAt(i % videoId.length)
      sum += charCode
      hash += (sum % 16).toString(16)
    }
    return hash
  }

  private extractFrames(videoId: string): number[] {
    // 模拟帧提取：生成伪随机但一致的帧索引
    const frameCount = 30
    const frames: number[] = []
    let seed = videoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

    for (let i = 0; i < frameCount; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      frames.push(seed % 1000)
    }

    return frames
  }

  private estimateDuration(videoId: string): number {
    // 模拟时长估计：基于ID生成
    const seed = videoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return 30 + (seed % 270) // 30秒到5分钟
  }
}

// ── ProgressAnalyzer ───────────────────────────────────────────────────────────

@Injectable()
export class ProgressAnalyzer {
  private readonly logger = new Logger(ProgressAnalyzer.name)
  private readonly performanceHistory = new Map<string, PerformanceMetric[]>()

  /**
   * 比较两时期表现
   */
  comparePerformance(
    memberId: string,
    beforePeriod: string,
    afterPeriod: string,
  ): PerformanceComparison | null {
    const beforeMetrics = this.getMetricsForPeriod(memberId, beforePeriod)
    const afterMetrics = this.getMetricsForPeriod(memberId, afterPeriod)

    if (beforeMetrics.length === 0 || afterMetrics.length === 0) {
      this.logger.warn(`[Progress] Insufficient data for member ${memberId}`)
      return null
    }

    const beforeAvg = beforeMetrics.reduce((sum, m) => sum + m.value, 0) / beforeMetrics.length
    const afterAvg = afterMetrics.reduce((sum, m) => sum + m.value, 0) / afterMetrics.length
    const improvement = afterAvg - beforeAvg
    const improvementPercent = beforeAvg !== 0 ? (improvement / beforeAvg) * 100 : 0

    return {
      before: Math.round(beforeAvg * 100) / 100,
      after: Math.round(afterAvg * 100) / 100,
      improvement: Math.round(improvement * 100) / 100,
      improvementPercent: Math.round(improvementPercent * 100) / 100,
    }
  }

  /**
   * 计算进步幅度
   */
  calculateImprovement(memberId: string, metric: string): number | null {
    const metrics = this.performanceHistory.get(memberId)?.filter((m) => m.metric === metric)

    if (!metrics || metrics.length < 2) {
      // 返回模拟数据
      return this.getMockImprovement(memberId, metric)
    }

    const sorted = metrics.sort((a, b) => a.period.localeCompare(b.period))
    const first = sorted[0].value
    const last = sorted[sorted.length - 1].value

    if (first === 0) return null
    return ((last - first) / first) * 100
  }

  /**
   * 记录表现数据 (供测试用)
   */
  recordMetric(memberId: string, period: string, metric: string, value: number): void {
    if (!this.performanceHistory.has(memberId)) {
      this.performanceHistory.set(memberId, [])
    }

    this.performanceHistory.get(memberId)!.push({ memberId, period, metric, value })
  }

  // ── Internal ─────────────────────────────────────────────────────────────────

  private getMetricsForPeriod(memberId: string, period: string): PerformanceMetric[] {
    return this.performanceHistory.get(memberId)?.filter((m) => m.period === period) ?? []
  }

  private getMockImprovement(memberId: string, metric: string): number {
    // 基于 memberId 和 metric 生成伪随机但一致的进步值
    const seed = memberId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) +
      metric.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)

    // 生成 -30% 到 +50% 的伪随机改进值
    const improvement = ((seed % 80) - 30)
    return improvement
  }
}
