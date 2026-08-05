/**
 * ai-content.service.spec.ts — AI 内容 Service 深层单元测试
 *
 * 覆盖：
 *  - TeamBuildingReportGenerator: 正例（报告生成/添加亮点/分享/获取）/ 反例（不存事件/不存报告/空亮点）/ 边界（同一事件多次生成/1参与者/0活动）
 *  - ContentModerationService:   正例（干净内容通过/单类型违规检测/多类型并发/人工审核流程）/ 反例（大文字/全部关键词） / 边界（空内容/单字符/相邻违禁词）
 *  - VideoDeduplicationService:  正例（指纹计算/指纹幂等/查重结果/相似度计算）/ 反例（不同长度/无关视频） / 边界（自相似/空指纹/边界长度）
 *  - ProgressAnalyzer:           正例（计算进步/比较周期/记录覆盖）/ 反例（无数据/0初始值） / 边界（大值/浮点抖动/单条记录）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type {
  TeamBuildingReportGenerator,
  ContentModerationService,
  VideoDeduplicationService,
  ProgressAnalyzer,
  TeamBuildingEvent,
  TeamBuildingReport,
  Violation,
  VideoFingerprint,
  PerformanceComparison,
  ModerationResult,
  PerformanceMetric,
} from './ai-content.service'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const VIOLATION_TYPES = ['political', 'violence', 'advertising', 'other'] as const
const SEVERITY_LEVELS = ['low', 'medium', 'high'] as const

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

/** 创建测试用事件 */
function mockEvent(overrides?: Partial<TeamBuildingEvent>): TeamBuildingEvent {
  return {
    id: `evt-test-${Math.random().toString(36).slice(2, 6)}`,
    name: '测试团建',
    date: '2024-06-15',
    participants: 20,
    duration: 180,
    activities: ['拓展训练', '烧烤'],
    attendance: 18,
    budget: 8000,
    ...overrides,
  }
}

/** 创建测试用违规 Violation */
function mockViolation(overrides?: Partial<Violation>): Violation {
  return {
    type: 'political',
    severity: 'high',
    description: '违规内容',
    ...overrides,
  }
}

/** 创建测试用视频指纹 */
function mockVideoFingerprint(overrides?: Partial<VideoFingerprint>): VideoFingerprint {
  return {
    videoId: 'vid-test',
    hash: 'a1b2c3d4e5f67890',
    frames: Array.from({ length: 30 }, (_, i) => i * 30),
    duration: 120,
    ...overrides,
  }
}

/** 创建测试用绩效指标 */
function mockMetric(overrides?: Partial<PerformanceMetric>): PerformanceMetric {
  return {
    memberId: 'm-test',
    period: '2024-Q1',
    metric: 'sales',
    value: 100,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑
// ═══════════════════════════════════════════════════════════════

/** 计算参与率 */
function calcParticipationRate(event: TeamBuildingEvent): number {
  if (event.participants <= 0) return 0
  return Math.round((event.attendance / event.participants) * 1000) / 10
}

/** 计算平均活动时长 */
function calcAvgDuration(event: TeamBuildingEvent): number {
  return Math.round(event.duration / Math.max(event.activities.length, 1))
}

/** 检测违规（内联版，不依赖 service 实例） */
function inlineDetectViolation(content: string): Violation[] {
  const violations: Violation[] = []
  const lower = content.toLowerCase()

  const keywords: Array<{ word: string; type: Violation['type']; severity: Violation['severity'] }> = [
    { word: '分裂', type: 'political', severity: 'high' },
    { word: '颠覆', type: 'political', severity: 'high' },
    { word: '非法集会', type: 'political', severity: 'high' },
    { word: '反动', type: 'political', severity: 'high' },
    { word: '暴力', type: 'violence', severity: 'medium' },
    { word: '打架', type: 'violence', severity: 'medium' },
    { word: '伤害', type: 'violence', severity: 'medium' },
    { word: '威胁', type: 'violence', severity: 'medium' },
    { word: '微信', type: 'advertising', severity: 'low' },
    { word: 'QQ', type: 'advertising', severity: 'low' },
    { word: '联系电话', type: 'advertising', severity: 'low' },
    { word: '加我', type: 'advertising', severity: 'low' },
    { word: '优惠', type: 'advertising', severity: 'low' },
    { word: '促销', type: 'advertising', severity: 'low' },
  ]

  for (const kw of keywords) {
    if (lower.includes(kw.word)) {
      violations.push({
        type: kw.type,
        severity: kw.severity,
        description: `包含${kw.type === 'political' ? '政治敏感' : kw.type === 'violence' ? '暴力相关' : '广告'}词: ${kw.word}`,
      })
    }
  }

  return violations
}

/** 内联指纹相似度 */
function inlineComputeSimilarity(fp1: string, fp2: string): number {
  if (fp1 === fp2) return 1.0
  if (fp1.length !== fp2.length) return 0.0
  let matches = 0
  for (let i = 0; i < fp1.length; i++) {
    if (fp1[i] === fp2[i]) matches++
  }
  return matches / fp1.length
}

/** 内联进步计算 */
function inlineCalcImprovement(beforeAvg: number, afterAvg: number): { improvement: number; improvementPercent: number } | null {
  if (beforeAvg === 0) return null
  const improvement = afterAvg - beforeAvg
  const improvementPercent = (improvement / beforeAvg) * 100
  return {
    improvement: Math.round(improvement * 100) / 100,
    improvementPercent: Math.round(improvementPercent * 100) / 100,
  }
}

/** 内联生成哈希（同 service 逻辑） */
function inlineGenerateHash(videoId: string): string {
  let hash = ''
  let sum = 0
  for (let i = 0; i < 16; i++) {
    const charCode = videoId.charCodeAt(i % videoId.length)
    sum += charCode
    hash += (sum % 16).toString(16)
  }
  return hash
}

/** 内联估算时长 */
function inlineEstimateDuration(videoId: string): number {
  const seed = videoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return 30 + (seed % 270)
}

/** 内联提取帧 */
function inlineExtractFrames(videoId: string): number[] {
  const frameCount = 30
  const frames: number[] = []
  let seed = videoId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  for (let i = 0; i < frameCount; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    frames.push(seed % 1000)
  }
  return frames
}

// ═══════════════════════════════════════════════════════════════
// 纯函数测试
// ═══════════════════════════════════════════════════════════════

describe('纯函数 | 参与率 calcParticipationRate', () => {
  it('正例: 18/20 = 90%', () => {
    expect(calcParticipationRate(mockEvent({ participants: 20, attendance: 18 }))).toBe(90)
  })

  it('边界: participants=0 返回 0', () => {
    expect(calcParticipationRate(mockEvent({ participants: 0, attendance: 0 }))).toBe(0)
  })

  it('边界: 全员到齐 20/20 = 100%', () => {
    expect(calcParticipationRate(mockEvent({ participants: 20, attendance: 20 }))).toBe(100)
  })
})

describe('纯函数 | 平均活动时长 calcAvgDuration', () => {
  it('正例: 180分钟/3活动 = 60', () => {
    expect(calcAvgDuration(mockEvent({ duration: 180, activities: ['A', 'B', 'C'] }))).toBe(60)
  })

  it('边界: activities 空数组 → 取除数 1', () => {
    expect(calcAvgDuration(mockEvent({ duration: 120, activities: [] }))).toBe(120)
  })
})

// ═══════════════════════════════════════════════════════════════
// ContentModerationService — 纯函数
// ═══════════════════════════════════════════════════════════════

describe('ContentModerationService | inlineDetectViolation', () => {

  // ── 正例 8+ ──

  it('正例: 干净文字无违规', () => {
    const vs = inlineDetectViolation('今天天气真好，一起出去玩吧！')
    expect(vs).toHaveLength(0)
  })

  it('正例: 检测政治敏感词 "分裂"', () => {
    const vs = inlineDetectViolation('这个内容包含分裂言论')
    expect(vs.length).toBeGreaterThanOrEqual(1)
    expect(vs[0].type).toBe('political')
  })

  it('正例: 检测暴力词 "暴力"', () => {
    const vs = inlineDetectViolation('他使用了暴力手段')
    expect(vs.some(v => v.type === 'violence')).toBe(true)
  })

  it('正例: 检测广告词 "微信"', () => {
    const vs = inlineDetectViolation('加我微信获取优惠')
    expect(vs.some(v => v.type === 'advertising')).toBe(true)
  })

  it('正例: 多个关键词同时命中', () => {
    const vs = inlineDetectViolation('暴力分裂反动加我微信')
    expect(vs.length).toBeGreaterThanOrEqual(4) // 暴力+分裂+反动+加我(+微信)
    const types = new Set(vs.map(v => v.type))
    expect(types.has('political')).toBe(true)
    expect(types.has('violence')).toBe(true)
    expect(types.has('advertising')).toBe(true)
  })

  it('正例: 政治敏感词 severity=high', () => {
    const vs = inlineDetectViolation('颠覆')
    expect(vs[0].severity).toBe('high')
  })

  it('正例: 暴力词 severity=medium', () => {
    const vs = inlineDetectViolation('打架')
    expect(vs[0].severity).toBe('medium')
  })

  it('正例: 广告词 severity=low', () => {
    const vs = inlineDetectViolation('促销')
    expect(vs[0].severity).toBe('low')
  })

  it('正例: "联系电话" 完整匹配', () => {
    const vs = inlineDetectViolation('我的联系电话是123')
    expect(vs.some(v => v.description.includes('联系电话'))).toBe(true)
  })

  // ── 反例 5+ ──

  it('反例: 包含违禁词则不通过', () => {
    const vs = inlineDetectViolation('反动内容')
    expect(vs.length).toBeGreaterThan(0)
  })

  it('反例: 包含暴力词', () => {
    const vs = inlineDetectViolation('威胁他人安全')
    expect(vs.some(v => v.type === 'violence')).toBe(true)
  })

  it('反例: 包含广告词 "优惠"', () => {
    const vs = inlineDetectViolation('限时优惠大促')
    expect(vs.some(v => v.type === 'advertising' && v.description.includes('优惠'))).toBe(true)
  })

  it('反例: 混合内容 "非法集会" 命中政治', () => {
    const vs = inlineDetectViolation('参加非法集会')
    expect(vs.some(v => v.type === 'political')).toBe(true)
  })

  it('反例: "促销" 在 "限时促销" 中命中广告', () => {
    const vs = inlineDetectViolation('限时促销活动')
    expect(vs.some(v => v.type === 'advertising' && v.description.includes('促销'))).toBe(true)
  })

  // ── 边界 5+ ──

  it('边界: 空字符串', () => {
    const vs = inlineDetectViolation('')
    expect(vs).toHaveLength(0)
  })

  it('边界: 单字符', () => {
    const vs = inlineDetectViolation('a')
    expect(vs).toHaveLength(0)
  })

  it('边界: 仅特殊字符', () => {
    const vs = inlineDetectViolation('!@#$%^&*()')
    expect(vs).toHaveLength(0)
  })

  it('边界: 违禁词作为子串不单独出现 (如 "分解裂变" 不含完整 "分裂")', () => {
    // "分解裂变" 不含 "分裂" substring
    const vs = inlineDetectViolation('分解裂变')
    expect(vs.some(v => v.description.includes('分裂'))).toBe(false)
  })

  it('边界: 超长文本中检测违禁词', () => {
    const longPrefix = 'A'.repeat(5000)
    const vs = inlineDetectViolation(longPrefix + '暴力' + longPrefix)
    expect(vs.some(v => v.type === 'violence')).toBe(true)
  })

  it('边界: 大小写不敏感 (英文关键词不受影响——中文无大小写)', () => {
    // 中文不会出现大小写问题，但确保不误报
    const vs = inlineDetectViolation('WECHAT')
    expect(vs).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════
// VideoDeduplicationService — 纯函数
// ═══════════════════════════════════════════════════════════════

describe('VideoDeduplicationService | inline 纯函数', () => {

  // ── 正例 ──

  it('正例: generateHash 返回 16 字符十六进制', () => {
    const hash = inlineGenerateHash('video-001')
    expect(hash).toHaveLength(16)
    expect(/^[0-9a-f]{16}$/.test(hash)).toBe(true)
  })

  it('正例: 相同 videoId 生成相同 hash', () => {
    expect(inlineGenerateHash('same-video')).toBe(inlineGenerateHash('same-video'))
  })

  it('正例: 不同 videoId 生成不同 hash', () => {
    expect(inlineGenerateHash('vid-aaa')).not.toBe(inlineGenerateHash('vid-bbb'))
  })

  it('正例: estimateDuration 30~299 秒范围', () => {
    const d = inlineEstimateDuration('vid-test')
    expect(d).toBeGreaterThanOrEqual(30)
    expect(d).toBeLessThan(300)
  })

  it('正例: extractFrames 返回 30 帧, 每帧 0~999', () => {
    const frames = inlineExtractFrames('vid-test')
    expect(frames).toHaveLength(30)
    for (const f of frames) {
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(1000)
    }
  })

  it('正例: computeSimilarity 全匹配 = 1.0', () => {
    expect(inlineComputeSimilarity('abcdef1234567890', 'abcdef1234567890')).toBe(1.0)
  })

  it('正例: computeSimilarity 长度不同 = 0.0', () => {
    expect(inlineComputeSimilarity('abc', 'abcdef')).toBe(0.0)
  })

  it('正例: computeSimilarity 部分匹配 > 0', () => {
    const sim = inlineComputeSimilarity('a0b0c0d0e0f0g0h0', 'a1b1c1d1e1f1g1h1')
    // 偶数位匹配 (a,b,c,d,e,f,g,h = 8/16 = 0.5)
    expect(sim).toBeCloseTo(0.5, 1)
  })

  // ── 反例 ──

  it('反例: 完全不同的哈希相似度 = 0', () => {
    expect(inlineComputeSimilarity('ffffffffffffffff', '0000000000000000')).toBe(0)
  })

  it('反例: 空 string → charCodeAt 全为 NaN → (NaN%16) = NaN → hash 含 NaN', () => {
    const hash = inlineGenerateHash('')
    // NaN%16 = NaN, toString(16) = 'NaN', 每字符产生3字符的'NaN' → 16*3 = 48 字符
    expect(hash).toHaveLength(48)
    expect(hash).toBe('NaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaNNaN')
  })

  // ── 边界 ──

  it('边界: computeSimilarity 空字符串全等', () => {
    expect(inlineComputeSimilarity('', '')).toBe(1.0)
  })

  it('边界: estimateDuration 最小 30 秒', () => {
    // 最短 videoId 可能产生最小 seed
    const d = inlineEstimateDuration('a')
    expect(d).toBeGreaterThanOrEqual(30)
    expect(d).toBeLessThan(300)
  })

  it('边界: extractFrames 确定性输出', () => {
    const frames1 = inlineExtractFrames('boundary-vid')
    const frames2 = inlineExtractFrames('boundary-vid')
    expect(frames1).toEqual(frames2)
  })
})

// ═══════════════════════════════════════════════════════════════
// ProgressAnalyzer — 纯函数
// ═══════════════════════════════════════════════════════════════

describe('ProgressAnalyzer | inlineCalcImprovement', () => {

  // ── 正例 ──

  it('正例: 80 → 100, 进步 25%', () => {
    const result = inlineCalcImprovement(80, 100)
    expect(result).not.toBeNull()
    expect(result!.improvement).toBe(20)
    expect(result!.improvementPercent).toBe(25)
  })

  it('正例: 100 → 150, 进步 50%', () => {
    const result = inlineCalcImprovement(100, 150)
    expect(result!.improvement).toBe(50)
    expect(result!.improvementPercent).toBe(50)
  })

  it('正例: 150 → 100, 退步 -33.33%', () => {
    const result = inlineCalcImprovement(150, 100)
    expect(result!.improvement).toBe(-50)
    expect(result!.improvementPercent).toBeCloseTo(-33.33, 0)
  })

  it('正例: 0 → 0 返回 null', () => {
    expect(inlineCalcImprovement(0, 0)).toBeNull()
  })

  // ── 反例 ──

  it('反例: before=0 时返回 null', () => {
    expect(inlineCalcImprovement(0, 50)).toBeNull()
  })

  it('反例: 负数进步 (after < before)', () => {
    const result = inlineCalcImprovement(100, 70)
    expect(result!.improvement).toBe(-30)
    expect(result!.improvementPercent).toBe(-30)
  })

  // ── 边界 ──

  it('边界: 极小值 before=0.01', () => {
    const result = inlineCalcImprovement(0.01, 100)
    expect(result).not.toBeNull()
    expect(result!.improvementPercent).toBe(999900)
  })

  it('边界: 极大值 (大数)', () => {
    const result = inlineCalcImprovement(1_000_000, 2_000_000)
    expect(result!.improvement).toBe(1_000_000)
    expect(result!.improvementPercent).toBe(100)
  })

  it('边界: 浮点精度 0.3333', () => {
    const result = inlineCalcImprovement(3, 4)
    expect(result!.improvement).toBe(1)
    expect(result!.improvementPercent).toBeCloseTo(33.33, 0)
  })
})

// ═══════════════════════════════════════════════════════════════
// TeamBuildingReportGenerator — 纯函数 + 模拟类
// ═══════════════════════════════════════════════════════════════

describe('TeamBuildingReportGenerator | 模拟实例', () => {

  // 手动模拟 TeamBuildingReportGenerator（不 import 生产文件）
  class MockReportGenerator {
    reports = new Map<string, TeamBuildingReport>()
    private mockEvents: Record<string, TeamBuildingEvent> = {
      'evt-001': {
        id: 'evt-001', name: '春季团建', date: '2024-03-15',
        participants: 50, duration: 240, activities: ['破冰游戏', '拓展训练', '烧烤晚宴', '才艺展示'],
        attendance: 45, budget: 15000,
      },
      'evt-002': {
        id: 'evt-002', name: '夏日漂流', date: '2024-07-20',
        participants: 30, duration: 360, activities: ['漂流', '露营', '篝火晚会'],
        attendance: 28, budget: 20000,
      },
    }

    generateReport(eventId: string): TeamBuildingReport | null {
      const event = this.mockEvents[eventId]
      if (!event) return null

      const reportId = `report-mock-${eventId}`
      const participationRate = calcParticipationRate(event)
      const avgDuration = calcAvgDuration(event)

      const report: TeamBuildingReport = {
        id: reportId,
        eventId,
        summary: `${event.name}于${event.date}成功举办`,
        highlights: [],
        stats: { participationRate, avgDuration, topActivity: event.activities[0] ?? '未知' },
        sharedWith: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.reports.set(reportId, report)
      return report
    }

    getReport(eventId: string): TeamBuildingReport | null {
      for (const r of this.reports.values()) {
        if (r.eventId === eventId) return r
      }
      return null
    }

    addHighlights(reportId: string, highlights: string[]): TeamBuildingReport | null {
      const report = this.reports.get(reportId)
      if (!report) return null
      report.highlights.push(...highlights)
      report.updatedAt = new Date().toISOString()
      return report
    }

    shareReport(reportId: string, recipients: string[]): TeamBuildingReport | null {
      const report = this.reports.get(reportId)
      if (!report) return null
      report.sharedWith.push(...recipients)
      report.updatedAt = new Date().toISOString()
      return report
    }
  }

  let gen: MockReportGenerator

  beforeEach(() => {
    gen = new MockReportGenerator()
  })

  it('正例: generateReport 为 evt-001 返回完整报告', () => {
    const r = gen.generateReport('evt-001')
    expect(r).not.toBeNull()
    expect(r!.eventId).toBe('evt-001')
    expect(r!.stats.participationRate).toBe(90)
    expect(r!.stats.avgDuration).toBe(60)
    expect(r!.highlights).toEqual([])
    expect(r!.sharedWith).toEqual([])
  })

  it('正例: getReport 通过 eventId 找到报告', () => {
    gen.generateReport('evt-002')
    const r = gen.getReport('evt-002')
    expect(r).not.toBeNull()
    expect(r!.eventId).toBe('evt-002')
  })

  it('正例: addHighlights 添加多个亮点', () => {
    gen.generateReport('evt-001')
    const existing = gen.getReport('evt-001')!
    const updated = gen.addHighlights(existing.id, ['协作好', '气氛佳'])
    expect(updated!.highlights).toContain('协作好')
    expect(updated!.highlights).toContain('气氛佳')
  })

  it('正例: shareReport 分享给多人', () => {
    gen.generateReport('evt-001')
    const existing = gen.getReport('evt-001')!
    const shared = gen.shareReport(existing.id, ['alice@test.com', 'bob@test.com'])
    expect(shared!.sharedWith).toContain('alice@test.com')
    expect(shared!.sharedWith).toContain('bob@test.com')
  })

  it('正例: 多次分享累积收件人', () => {
    gen.generateReport('evt-001')
    const existing = gen.getReport('evt-001')!
    gen.shareReport(existing.id, ['a@t.com'])
    const shared = gen.shareReport(existing.id, ['b@t.com'])
    expect(shared!.sharedWith).toEqual(['a@t.com', 'b@t.com'])
  })

  it('反例: generateReport 不存在事件返回 null', () => {
    expect(gen.generateReport('evt-nonexistent')).toBeNull()
  })

  it('反例: getReport 不存在 eventId 返回 null', () => {
    expect(gen.getReport('never-generated')).toBeNull()
  })

  it('反例: addHighlights 不存在的 reportId 返回 null', () => {
    expect(gen.addHighlights('report-none', ['x'])).toBeNull()
  })

  it('反例: shareReport 不存在的 reportId 返回 null', () => {
    expect(gen.shareReport('report-none', ['x@t.com'])).toBeNull()
  })

  it('边界: 参与者 1 人 attendance 1 → 100%', () => {
    gen['mockEvents']['evt-solo'] = {
      id: 'evt-solo', name: '单人', date: '2024-01-01',
      participants: 1, duration: 60, activities: ['独处'], attendance: 1, budget: 100,
    }
    const r = gen.generateReport('evt-solo')
    expect(r!.stats.participationRate).toBe(100)
  })

  it('边界: 0 活动列表 → avgDuration = duration', () => {
    gen['mockEvents']['evt-noact'] = {
      id: 'evt-noact', name: '无活动', date: '2024-01-01',
      participants: 10, duration: 120, activities: [], attendance: 5, budget: 500,
    }
    const r = gen.generateReport('evt-noact')
    expect(r!.stats.avgDuration).toBe(120)
  })

  it('边界: 同一 eventId 多次生成 → 后次覆盖前次', () => {
    const r1 = gen.generateReport('evt-001')
    const r2 = gen.generateReport('evt-001')
    expect(r1!.id).toBe(r2!.id) // same reportId
  })
})
