import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * docs-training-e2e.test.ts - Phase-24 T129-5
 * 文档 + 培训 E2E 测试
 *
 * 测试内容:
 * 1. OpenAPI 文档生成 → 导出 JSON → 验证规范完整性
 * 2. Redoc HTML 生成 → 验证包含 Redoc CDN
 * 3. Postman Collection 生成 → 验证 Collection 格式
 * 4. 店长运营手册 → 导出 Markdown → 包含7章节
 * 5. 客服手册搜索 → 关键词匹配 → 返回匹配内容
 * 6. 课程报名 → 学习进度 → 考试 → 获证
 * 7. 告警映射 → 触发告警 → 找到对应 Runbook
 * 8. 运维 Runbook → 执行报告 → Markdown 格式
 * 9. 培训统计 → 用户完成率 → 课程完成率
 */

import { SwaggerGenService } from '../modules/docs/swagger-gen.service'
import { OpsManualService } from '../modules/ops-manual/ops-manual.service'
import { TrainingService } from '../modules/training/training.service'
import { randomUUID } from 'crypto'

// ─────────────────────────────────────────────────────────────
// Mock RunbookService + AlertMapping（用于 E2E 测试）
// ─────────────────────────────────────────────────────────────

interface AlertMapping {
  alertRuleId: string
  runbookId: string
  keywords: string[]
  createdAt: Date
}

interface RunbookStep {
  title: string
  description: string
  timestamp: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
}

class RunbookService {
  private alertMappings = new Map<string, AlertMapping>()
  private runbooks = new Map<string, { id: string; description: string }>()

  constructor() {
    // 预设默认 runbook
    this.runbooks.set('rb-cpu-high', { id: 'rb-cpu-high', description: 'CPU 高负载处理' })
    this.runbooks.set('rb-memory-leak', { id: 'rb-memory-leak', description: '内存泄漏处理' })
  }

  mapAlert(alertRuleId: string, runbookId: string, keywords: string[]): AlertMapping {
    const mapping: AlertMapping = {
      alertRuleId,
      runbookId,
      keywords,
      createdAt: new Date(),
    }
    this.alertMappings.set(alertRuleId, mapping)
    return mapping
  }

  findByAlert(alertRuleId: string): AlertMapping | undefined {
    return this.alertMappings.get(alertRuleId)
  }

  generateExecutionReport(runbookId: string, steps: RunbookStep[]): string {
    const lines: string[] = []
    lines.push(`# Runbook 执行报告`)
    lines.push('')
    lines.push(`**Runbook ID**: ${runbookId}`)
    lines.push(`**执行时间**: ${new Date().toISOString()}`)
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('## 执行步骤')
    lines.push('')

    for (const step of steps) {
      lines.push(`### ${step.title}`)
      lines.push('')
      lines.push(`- 描述: ${step.description}`)
      lines.push(`- 时间戳: ${step.timestamp.toISOString()}`)
      lines.push(`- 状态: ${step.status}`)
      lines.push('')
    }

    lines.push('---')
    lines.push('')
    lines.push('**报告生成完毕**')

    return lines.join('\n')
  }
}

// ─────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────

describe('Docs + Training E2E', () => {
  let docs: SwaggerGenService
  let manual: OpsManualService
  let training: TrainingService
  let runbook: RunbookService

  beforeAll(() => {
    docs = new SwaggerGenService()
    manual = new OpsManualService()
    training = new TrainingService()
    runbook = new RunbookService()
  })

  // ── 1. OpenAPI 文档生成 → 导出 JSON → 验证规范完整性 ──────────────

  it('OpenAPI 文档生成 → 导出 JSON → 验证规范完整性', () => {
    // 1. generateSpec with title/version
    // 2. registerEndpoint(POST /orders) - must be BEFORE generateSpec
    docs.registerEndpoint('OrderController', {
      method: 'POST',
      path: '/orders',
      summary: '创建订单',
      description: '创建一个新的销售订单',
      tags: ['订单'],
      requestBody: {
        contentType: 'application/json',
        schema: {
          type: 'object',
          properties: {
            customerId: { type: 'string' },
            items: { type: 'array' },
            totalAmount: { type: 'number' },
          },
        },
        example: {
          customerId: 'CUST-001',
          items: [{ productId: 'PROD-001', quantity: 2 }],
          totalAmount: 299.00,
        },
      },
      responses: [
        { statusCode: 201, description: '订单创建成功', schema: { type: 'object' } },
        { statusCode: 400, description: '参数错误' },
      ],
    })

    const spec = docs.generateSpec({
      title: '神机营订单 API',
      version: '2.0.0',
      description: '订单全生命周期管理 API',
    })

    // 3. exportJSON → parse JSON
    const jsonStr = docs.exportJSON(spec)
    const parsed = JSON.parse(jsonStr)

    // 4. 验证 paths['/orders'] 存在
    expect(parsed.paths).toBeDefined()
    expect(parsed.paths['/orders']).toBeDefined()
    expect(parsed.paths['/orders']['post']).toBeDefined()
    expect(parsed.paths['/orders']['post'].summary).toBe('创建订单')
    expect(parsed.openapi).toBe('3.0.3')
    expect(parsed.info.title).toBe('神机营订单 API')
    expect(parsed.info.version).toBe('2.0.0')
  })

  // ── 2. Redoc HTML 生成 → 验证包含 Redoc CDN ───────────────────────

  it('Redoc HTML 生成 → 验证包含 Redoc CDN', () => {
    // 1. exportRedocHTML(spec)
    const spec = docs.generateSpec({
      title: 'Test API',
      version: '1.0.0',
    })

    docs.registerEndpoint('TestController', {
      method: 'GET',
      path: '/test',
      summary: '测试端点',
      responses: [{ statusCode: 200, description: '成功' }],
    })

    const html = docs.exportRedocHTML(spec)

    // 2. 验证包含 redoc-static-engine CDN
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
    expect(html).toContain('redoc')
    expect(html).toContain('cdn.jsdelivr.net')
    expect(html).toContain('data:application/json')
  })

  // ── 3. Postman Collection 生成 → 验证 Collection 格式 ─────────────

  it('Postman Collection 生成 → 验证 Collection 格式', () => {
    // 1. exportPostman(spec)
    const spec = docs.generateSpec({
      title: 'Test API',
      version: '1.0.0',
    })

    docs.registerEndpoint('UserController', {
      method: 'GET',
      path: '/users',
      summary: '获取用户列表',
      responses: [{ statusCode: 200, description: '成功' }],
    })

    docs.registerEndpoint('UserController', {
      method: 'POST',
      path: '/users',
      summary: '创建用户',
      responses: [{ statusCode: 201, description: '创建成功' }],
    })

    const postmanStr = docs.exportPostman(spec)

    // 2. 解析 JSON → 验证 info.name 存在
    const collection = JSON.parse(postmanStr)
    expect(collection.info).toBeDefined()
    expect(collection.info.name).toBe('Test API')
    expect(collection.info.schema).toContain('postman.com')
    expect(Array.isArray(collection.item)).toBe(true)
    expect(collection.item.length).toBeGreaterThanOrEqual(2)
  })

  // ── 4. 店长运营手册 → 导出 Markdown → 包含7章节 ──────────────────

  it('店长运营手册 → 导出 Markdown → 包含7章节', () => {
    // 1. generateStoreManagerManual()
    const storeManagerManual = manual.generateStoreManagerManual()

    // 2. exportMarkdown → 包含7个章节标题
    const markdown = manual.exportMarkdown(storeManagerManual)

    // 验证手册包含7个章节
    expect(storeManagerManual.sections.length).toBe(7)
    expect(markdown).toContain('# 店长运营手册')

    // 验证7个章节标题
    const expectedSections = [
      '门店运营概览',
      '人员管理',
      '财务管理',
      '库存管理',
      '营销活动',
      '客诉处理',
      '数据看板',
    ]

    for (const section of expectedSections) {
      expect(markdown).toContain(section)
    }
  })

  // ── 5. 客服手册搜索 → 关键词匹配 → 返回匹配内容 ──────────────────

  it('客服手册搜索 → 关键词匹配 → 返回匹配内容', () => {
    // 1. searchManual('customer_service', '退款')
    const results = manual.searchManual('customer_service', '退款')

    // 2. 验证返回结果包含"退款"关键词
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)

    // 至少有一个结果包含"退款"
    const hasRefundResult = results.some(
      (r) =>
        r.matchedContent.includes('退款') ||
        r.title.includes('退款')
    )
    expect(hasRefundResult).toBe(true)
  })

  // ── 6. 课程报名 → 学习进度 → 考试 → 获证 ─────────────────────────

  it('课程报名 → 学习进度 → 考试 → 获证', () => {
    const userId = `user-${randomUUID()}`
    const courseId = 'course-1' // 门店运营基础

    // 1. enroll(user1, course1)
    const enrollment = training.enroll(userId, courseId)
    expect(enrollment).toBeDefined()
    expect(enrollment.userId).toBe(userId)
    expect(enrollment.courseId).toBe(courseId)
    expect(enrollment.status).toBe('not_started')
    expect(enrollment.progress).toBe(0)

    // 2. updateProgress → progress > 0
    training.updateProgress(userId, courseId, 'shop-m1')
    const afterProgress = training.getEnrollment(userId, courseId)
    expect(afterProgress).toBeDefined()
    expect(afterProgress!.progress).toBeGreaterThan(0)
    expect(afterProgress!.status).toBe('in_progress')

    // 3. startQuiz → attemptId
    const attempt = training.startQuiz(userId, courseId)
    expect(attempt).toBeDefined()
    expect(attempt.attemptId).toBeDefined()
    expect(attempt.score).toBe(0)

    // 4. submitQuiz → score >= passingScore
    const course = training.getCourse(courseId)
    expect(course).toBeDefined()
    const quiz = course!.modules.find((m) => m.quiz)?.quiz
    expect(quiz).toBeDefined()

    // 模拟正确答题
    const correctAnswers: Record<string, string | string[]> = {}
    for (const q of quiz!.questions) {
      if (Array.isArray(q.correctAnswer)) {
        correctAnswers[q.questionId] = q.correctAnswer
      } else {
        correctAnswers[q.questionId] = q.correctAnswer
      }
    }

    const submittedAttempt = training.submitQuiz(attempt.attemptId, correctAnswers)
    expect(submittedAttempt.score).toBeGreaterThanOrEqual(course!.passingScore)
    expect(submittedAttempt.passed).toBe(true)

    // 5. issueCertificate → certificateId
    const certificateId = training.issueCertificate(userId, courseId)
    expect(certificateId).toBeDefined()
    expect(typeof certificateId).toBe('string')

    // 6. verifyCertificate → valid=true
    const verification = training.verifyCertificate(certificateId)
    expect(verification.valid).toBe(true)
    expect(verification.userId).toBe(userId)
    expect(verification.courseId).toBe(courseId)
  })

  // ── 7. 告警映射 → 触发告警 → 找到对应 Runbook ───────────────────

  it('告警映射 → 触发告警 → 找到对应 Runbook', () => {
    // 1. mapAlert('ALERT_cpu_high', runbookId, ['高负载'])
    const mapping = runbook.mapAlert('ALERT_cpu_high', 'rb-cpu-high', ['高负载', 'CPU'])

    expect(mapping).toBeDefined()
    expect(mapping.alertRuleId).toBe('ALERT_cpu_high')
    expect(mapping.runbookId).toBe('rb-cpu-high')
    expect(mapping.keywords).toContain('高负载')

    // 2. findByAlert('ALERT_cpu_high') → AlertMapping
    const found = runbook.findByAlert('ALERT_cpu_high')
    expect(found).toBeDefined()
    expect(found!.alertRuleId).toBe('ALERT_cpu_high')
    expect(found!.runbookId).toBe('rb-cpu-high')
  })

  // ── 8. 运维 Runbook → 执行报告 → Markdown 格式 ──────────────────

  it('运维 Runbook → 执行报告 → Markdown 格式', () => {
    // 1. generateExecutionReport(runbookId, [...steps])
    const steps: RunbookStep[] = [
      {
        title: 'Step 1: 检查 CPU 使用率',
        description: '使用 top 命令检查当前 CPU 使用情况',
        timestamp: new Date('2026-07-04T10:00:00Z'),
        status: 'completed',
      },
      {
        title: 'Step 2: 分析进程占用',
        description: '识别高占用进程并记录 PID',
        timestamp: new Date('2026-07-04T10:01:00Z'),
        status: 'completed',
      },
      {
        title: 'Step 3: 执行弹性扩容',
        description: '调用 K8s API 扩容 Pod 副本数',
        timestamp: new Date('2026-07-04T10:02:00Z'),
        status: 'completed',
      },
    ]

    const report = runbook.generateExecutionReport('rb-cpu-high', steps)

    // 2. 验证输出包含 step 标题和时间戳
    expect(report).toContain('# Runbook 执行报告')
    expect(report).toContain('rb-cpu-high')
    expect(report).toContain('Step 1: 检查 CPU 使用率')
    expect(report).toContain('Step 2: 分析进程占用')
    expect(report).toContain('Step 3: 执行弹性扩容')
    expect(report).toContain('2026-07-04T10:00:00.000Z')
    expect(report).toContain('completed')
  })

  // ── 9. 培训统计 → 用户完成率 → 课程完成率 ───────────────────────

  it('培训统计 → 用户完成率 → 课程完成率', () => {
    const userId = `user-stats-${randomUUID()}`
    const courseId = 'course-2' // 财务对账

    // 1. enroll + updateProgress
    training.enroll(userId, courseId)

    // 完成第一个模块
    training.updateProgress(userId, courseId, 'finance-m1')

    // 获取用户统计
    const userStats = training.getUserStats(userId)

    // 2. verify coursesEnrolled > 0
    expect(userStats.coursesEnrolled).toBeGreaterThan(0)
    expect(userStats.coursesEnrolled).toBeGreaterThanOrEqual(1)

    // 课程完成率
    const completionRate = training.getCourseCompletionRate(courseId)
    expect(typeof completionRate).toBe('number')
    expect(completionRate).toBeGreaterThanOrEqual(0)
    expect(completionRate).toBeLessThanOrEqual(100)
  })
})
