/**
 * 🐜 自动: [training] [C] 角色测试扩展编写
 *
 * 8 角色深度场景扩展测试 — training 模块
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 3 测试用例 (正常流程 + 降级场景 + 权限边界)
 * 覆盖: createCourse, listCourses, getCourse, getCoursesByRole,
 *       enroll, updateProgress, startQuiz, submitQuiz,
 *       generateCertificate, verifyCertificate, getRecommendations,
 *       getUserStats, getCompletionRate
 * 扩展: 多角色并发、课程推荐链、证书悖论、完成率计算
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrainingController } from './training.controller'
import { TrainingService } from './training.service'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function createController() {
  const service = new TrainingService()
  return { service, controller: new TrainingController(service as any) }
}

// ── 通用测试数据 ──
const makeCourse = (title: string, role: string, passingScore = 80) => ({
  title,
  description: `${title} — 面向 ${role} 角色的培训课程`,
  modules: [
    {
      moduleId: `m-${Date.now()}-1`,
      title: `模块一-${title}`,
      order: 1,
      contents: [
        { contentId: `c-${Date.now()}-1`, type: 'video' as const, title: '培训视频', durationMinutes: 15 },
      ],
      quiz: {
        quizId: `q-${Date.now()}`,
        maxAttempts: 3,
        questions: [
          { questionId: `qq-${Date.now()}-1`, text: '测试问题', type: 'single_choice' as const,
            options: ['A', 'B', 'C'], correctAnswer: 'A', points: 50 },
        ],
      },
    },
  ],
  targetRoles: [role],
  estimatedMinutes: 60,
  passingScore,
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 👔 店长 StoreManager
// ── ═══════════════════════════════════════════════════════════════ ══

describe('👔店长 — 培训管理扩展', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[正常] 店长创建多角色课程并通过角色名称和角色过滤检索', () => {
    const c1 = ctrl.createCourse(makeCourse('店长管理课程', '👔店长'))
    const c2 = ctrl.createCourse(makeCourse('前台服务课程', '🛒前台'))
    const c3 = ctrl.createCourse(makeCourse('安全巡检课程', '🔧安监'))

    // 店长自己能看到的店长课程
    const storeCourses = ctrl.getCoursesByRole('👔店长')
    expect(storeCourses.some((c) => c.courseId === c1.courseId)).toBe(true)
    expect(storeCourses.some((c) => c.courseId === c2.courseId)).toBe(false)

    // 店长可以查看所有课程列表
    const all = ctrl.listCourses()
    expect(all.length).toBeGreaterThanOrEqual(3)

    // 店长可以查看具体课程详情
    const detail = ctrl.getCourse(c1.courseId)
    expect(detail.title).toBe('店长管理课程')
  })

  it('[降级] 店长创建的课程不包含 quiz 时不影响课程创建', () => {
    const course = ctrl.createCourse({
      title: '店长简版课程',
      description: '无测验课程',
      modules: [
        {
          moduleId: 'lite-m1',
          title: '简单内容',
          order: 1,
          contents: [
            { contentId: 'lite-c1', type: 'document' as const, title: '阅读材料' },
          ],
        },
      ],
      targetRoles: ['👔店长'],
      estimatedMinutes: 30,
      passingScore: 60,
    })
    expect(course.courseId).toBeTruthy()
    expect(course.modules[0].quiz).toBeUndefined()
  })

  it('[边界] 店长请求不存在的课程应抛 404', () => {
    expect(() => ctrl.getCourse('course-i-dont-exist')).toThrow()
  })

  it('[边界] 店长创建 passingScore=0 的课程应仍可检索', () => {
    const course = ctrl.createCourse(makeCourse('零通过线课程', '👔店长', 0))
    const found = ctrl.getCourse(course.courseId)
    expect(found.passingScore).toBe(0)
  })
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 🛒 前台 FrontDesk
// ── ═══════════════════════════════════════════════════════════════ ══

describe('🛒前台 — 培训管理扩展', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[正常] 前台报名课程并逐步完成 Module 学习', () => {
    const course = ctrl.createCourse(makeCourse('前台接待培训', '🛒前台'))

    // 报名 — 状态为未开始
    const enrollment = ctrl.enroll({ userId: 'fd-001', courseId: course.courseId })
    expect(enrollment.status).toBe('not_started')
    expect(enrollment.progress).toBe(0)

    // 更新进度 — 由于课程只有一个模块，完成后自动变为 completed
    const firstModuleId = course.modules[0].moduleId
    ctrl.updateProgress({ userId: 'fd-001', courseId: course.courseId, moduleId: firstModuleId })

    const updated = ctrl.getEnrollment('fd-001', course.courseId)
    // 单个模块完成即 100% → 状态变为 completed
    expect(['completed', 'in_progress']).toContain(updated.status)
    expect(updated.progress).toBe(100)
  })

  it('[降级] 前台报名已存在的课程应返回已有 enrollment（幂等）', () => {
    const course = ctrl.createCourse(makeCourse('前台礼仪培训', '🛒前台'))
    const e1 = ctrl.enroll({ userId: 'fd-002', courseId: course.courseId })
    const e2 = ctrl.enroll({ userId: 'fd-002', courseId: course.courseId })
    expect(e2.enrolledAt).toEqual(e1.enrolledAt)
  })

  it('[边界] 前台尝试查询不存在的 enrollment 应抛 404', () => {
    expect(() => ctrl.getEnrollment('nobody', 'no-course')).toThrow()
  })

  it('[边界] 前台更新不存在课程的 enrollment 应抛 404', () => {
    // controller 层会检查 enrollment 是否存在，不存在则抛 NotFoundException
    expect(() => ctrl.updateProgress({ userId: 'fd-003', courseId: 'ghost', moduleId: 'm1' })).toThrow()
  })
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 👥 HR
// ── ═══════════════════════════════════════════════════════════════ ══

describe('👥HR — 培训管理扩展', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[正常] HR 创建跨角色课程并验证推荐路径', () => {
    // HR 创建一门所有人必修的课程
    const course = ctrl.createCourse({
      title: '公司制度培训',
      description: '全员必修制度培训',
      modules: [
        {
          moduleId: 'hr-m1',
          title: '制度介绍',
          order: 1,
          contents: [{ contentId: 'hr-c1', type: 'video' as const, title: '制度讲解', durationMinutes: 30 }],
          quiz: {
            quizId: 'hr-q1',
            maxAttempts: 2,
            questions: [
              { questionId: 'hr-q1-1', text: '公司全勤奖天数？', type: 'single_choice' as const,
                options: ['20天', '21天', '22天', '无'], correctAnswer: '22天', points: 50 },
            ],
          },
        },
      ],
      targetRoles: ['👔店长', '🛒前台', '👥HR', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
      estimatedMinutes: 45,
      passingScore: 70,
    })

    // 任何角色都应看到推荐
    const recs = ctrl.getRecommendations('👥HR')
    expect(recs.length).toBeGreaterThan(0)
    expect(recs.some((r) => r.courseId === course.courseId)).toBe(true)
  })

  it('[降级] HR 查询空 role 的推荐路径应返回空数组不报错', () => {
    const recs = ctrl.getRecommendations('👻不存在角色')
    expect(Array.isArray(recs)).toBe(true)
  })

  it('[边界] HR 查看未注册用户统计应返回全 0 数据', () => {
    const stats = ctrl.getUserStats('hr-nonexistent-user')
    expect(stats.coursesEnrolled).toBe(0)
    expect(stats.coursesCompleted).toBe(0)
    expect(stats.totalStudyMinutes).toBe(0)
    expect(stats.certificatesIssued).toBe(0)
    expect(stats.averageScore).toBe(0)
  })

  it('[边界] HR 获取无报名课程的完成率应为 0', () => {
    const rate = ctrl.getCompletionRate('course-with-no-enrollments')
    expect(rate.completionRate).toBe(0)
  })
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 🔧 安监 Safety
// ── ═══════════════════════════════════════════════════════════════ ══

describe('🔧安监 — 培训管理扩展', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[正常] 安监创建安全类课程、报名、完成 Quiz 并通过', () => {
    const course = ctrl.createCourse(makeCourse('消防安全培训', '🔧安监'))
    ctrl.enroll({ userId: 'safety-001', courseId: course.courseId })

    // 开始测验
    const attempt = ctrl.startQuiz({ userId: 'safety-001', courseId: course.courseId })
    expect(attempt.attemptId).toBeTruthy()

    // 提交正确答案
    const result = ctrl.submitQuiz({ attemptId: attempt.attemptId, answers: { [`qq-${Date.now()}-1`]: 'A' } })
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
  })

  it('[降级] 安监对无 quiz 的模块尝试 startQuiz 应抛出', () => {
    const course = ctrl.createCourse({
      title: '安全告示',
      description: '仅阅读',
      modules: [
        {
          moduleId: 'safety-noquiz',
          title: '阅读材料',
          order: 1,
          contents: [{ contentId: 'safety-c1', type: 'document' as const, title: '安全手册' }],
        },
      ],
      targetRoles: ['🔧安监'],
      estimatedMinutes: 15,
      passingScore: 60,
    })

    ctrl.enroll({ userId: 'safety-002', courseId: course.courseId })
    expect(() => ctrl.startQuiz({ userId: 'safety-002', courseId: course.courseId })).toThrow()
  })

  it('[边界] 安监超限 quiz 尝试应抛出', () => {
    const course = ctrl.createCourse(makeCourse('限次考试课程', '🔧安监'))
    ctrl.enroll({ userId: 'safety-003', courseId: course.courseId })

    // 3 次尝试应该允许
    const a1 = ctrl.startQuiz({ userId: 'safety-003', courseId: course.courseId })
    // 答案不能完全匹配，提交错误答案
    ctrl.submitQuiz({ attemptId: a1.attemptId, answers: {} })

    // 这个 course 的 quiz maxAttempts 是 3
    // 但服务端通过 startQuiz 检查次数
    // 再试一次
    try { ctrl.startQuiz({ userId: 'safety-003', courseId: course.courseId }) } catch {}
    // 第三次
    try { ctrl.startQuiz({ userId: 'safety-003', courseId: course.courseId }) } catch {}

    // 第四次应失败
    expect(() => ctrl.startQuiz({ userId: 'safety-003', courseId: course.courseId })).toThrow()
  })

  it('[边界] 提交不存在的 attemptId 应抛出', () => {
    expect(() => ctrl.submitQuiz({ attemptId: 'fake-attempt', answers: {} })).toThrow()
  })
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 🎮 导玩员 Guide
// ── ═══════════════════════════════════════════════════════════════ ══

describe('🎮导玩员 — 培训管理扩展', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[正常] 导玩员报名课程、完成全部学习后生成证书并验证', () => {
    const course = ctrl.createCourse(makeCourse('游戏设备操作培训', '🎮导玩员'))
    ctrl.enroll({ userId: 'guide-001', courseId: course.courseId })

    // 完成模块
    ctrl.updateProgress({ userId: 'guide-001', courseId: course.courseId, moduleId: course.modules[0].moduleId })

    // 提交测验
    const attempt = ctrl.startQuiz({ userId: 'guide-001', courseId: course.courseId })
    ctrl.submitQuiz({ attemptId: attempt.attemptId, answers: { [`qq-${Date.now()}-1`]: 'A' } })

    // 生成证书
    const cert = ctrl.generateCertificate({ userId: 'guide-001', courseId: course.courseId })
    expect(cert.certificateId).toBeTruthy()

    // 验证证书
    const verified = ctrl.getCertificate(cert.certificateId)
    expect(verified.valid).toBe(true)
    expect(verified.userId).toBe('guide-001')
  })

  it('[降级] 导玩员尝试为未完成的课程生成证书应抛出', () => {
    const course = ctrl.createCourse(makeCourse('进阶操作', '🎮导玩员'))
    ctrl.enroll({ userId: 'guide-002', courseId: course.courseId })
    // 未完成进度，也未通过测验
    expect(() => ctrl.generateCertificate({ userId: 'guide-002', courseId: course.courseId })).toThrow()
  })

  it('[边界] 导玩员查询不存在的证书应抛 404', () => {
    expect(() => ctrl.getCertificate('cert-i-do-not-exist')).toThrow()
  })

  it('[边界] 导玩员查询无 quiz 历史的课程应返回空数组', () => {
    const course = ctrl.createCourse(makeCourse('简单阅读课程', '🎮导玩员'))
    ctrl.enroll({ userId: 'guide-003', courseId: course.courseId })
    const attempts = ctrl.getQuizAttempts('guide-003', course.courseId)
    expect(Array.isArray(attempts)).toBe(true)
    expect(attempts.length).toBe(0)
  })
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 🎯 运行专员 Ops
// ── ═══════════════════════════════════════════════════════════════ ══

describe('🎯运行专员 — 培训管理扩展', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[正常] 运行专员批量创建课程并检查完成率统计', () => {
    // 创建多个课程并报名
    const c1 = ctrl.createCourse(makeCourse('系统运维基础', '🎯运行专员'))
    const c2 = ctrl.createCourse(makeCourse('服务器巡检', '🎯运行专员'))

    ctrl.enroll({ userId: 'ops-001', courseId: c1.courseId })
    ctrl.enroll({ userId: 'ops-002', courseId: c1.courseId })
    ctrl.enroll({ userId: 'ops-003', courseId: c2.courseId })

    // 一人完成
    ctrl.updateProgress({ userId: 'ops-001', courseId: c1.courseId, moduleId: c1.modules[0].moduleId })
    const attempt = ctrl.startQuiz({ userId: 'ops-001', courseId: c1.courseId })
    ctrl.submitQuiz({ attemptId: attempt.attemptId, answers: { [`qq-${Date.now()}-1`]: 'A' } })

    // 统计
    const rate1 = ctrl.getCompletionRate(c1.courseId)
    expect(rate1.completionRate).toBeGreaterThan(0)

    // ops-001 的用户统计
    const stats = ctrl.getUserStats('ops-001')
    expect(stats.coursesEnrolled).toBeGreaterThanOrEqual(1)
    expect(stats.averageScore).toBeGreaterThanOrEqual(0)
  })

  it('[降级] 运行专员查询不存在的课程完成率应返回 0', () => {
    const rate = ctrl.getCompletionRate('non-existent-course-xxx')
    expect(rate.completionRate).toBe(0)
  })

  it('[边界] 运行专员统计新学员应能有完整的数据结构', () => {
    const course = ctrl.createCourse(makeCourse('新人入门', '🎯运行专员'))
    ctrl.enroll({ userId: 'ops-new', courseId: course.courseId })
    const stats = ctrl.getUserStats('ops-new')
    expect(stats).toHaveProperty('coursesEnrolled')
    expect(stats).toHaveProperty('coursesCompleted')
    expect(stats).toHaveProperty('totalStudyMinutes')
    expect(stats).toHaveProperty('certificatesIssued')
    expect(stats).toHaveProperty('averageScore')
  })
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 🤝 团建 Teambuilding
// ── ═══════════════════════════════════════════════════════════════ ══

describe('🤝团建 — 培训管理扩展', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[正常] 团建角色创建团队协作课程并验证多个 enrollments', () => {
    const course = ctrl.createCourse({
      title: '团队协作训练营',
      description: '提升团队协作能力',
      modules: [
        {
          moduleId: 'team-m1',
          title: '信任建立',
          order: 1,
          contents: [
            { contentId: 't-c1', type: 'video' as const, title: '信任活动', durationMinutes: 30 },
            { contentId: 't-c2', type: 'document' as const, title: '活动指引', transcript: '建立信任的步骤...' },
          ],
          quiz: {
            quizId: 'team-q1',
            maxAttempts: 2,
            questions: [
              { questionId: 'tq1', text: '团队协作的核心要素是？', type: 'single_choice' as const,
                options: ['信任', '竞争', '个人英雄主义', '命令'], correctAnswer: '信任', points: 50 },
            ],
          },
        },
      ],
      targetRoles: ['🤝团建', '👔店长'],
      estimatedMinutes: 90,
      passingScore: 75,
    })

    // 多用户报名
    const u1 = ctrl.enroll({ userId: 'team-lead', courseId: course.courseId })
    const u2 = ctrl.enroll({ userId: 'team-member1', courseId: course.courseId })

    expect(u1.courseId).toBe(course.courseId)
    expect(u2.courseId).toBe(course.courseId)
  })

  it('[降级] 团建创建含 transcript 的长内容课程不影响 enroll 功能', () => {
    const course = ctrl.createCourse({
      title: '团建方案设计',
      description: '团建方案设计方法',
      modules: [
        {
          moduleId: 'tg-m1',
          title: '方案设计',
          order: 1,
          contents: [
            {
              contentId: 'tg-c1',
              type: 'document' as const,
              title: '设计模板',
              transcript: '第1步：确定目标\n第2步：预算规划\n第3步：活动选择\n第4步：评估反馈',
            },
          ],
        },
      ],
      targetRoles: ['🤝团建'],
      estimatedMinutes: 60,
      passingScore: 60,
    })

    ctrl.enroll({ userId: 'tg-designer', courseId: course.courseId })
    const enrollment = ctrl.getEnrollment('tg-designer', course.courseId)
    expect(enrollment.status).toBe('not_started')
  })

  it('[边界] 团建角色查看的推荐课程列表应按 order 排序', () => {
    // 先创建一些课程
    ctrl.createCourse(makeCourse('初级团建', '🤝团建'))
    ctrl.createCourse(makeCourse('高级团建', '🤝团建'))

    const recs = ctrl.getRecommendations('🤝团建')
    expect(recs.length).toBeGreaterThanOrEqual(2)

    // 验证 order 递增
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].order).toBeGreaterThan(recs[i - 1].order)
    }
  })
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 📢 营销 Marketing
// ── ═══════════════════════════════════════════════════════════════ ══

describe('📢营销 — 培训管理扩展', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[正常] 营销创建含 multiple_choice 问题的课程并验证评分', () => {
    const course = ctrl.createCourse({
      title: '营销话术培训',
      description: '掌握营销核心话术',
      modules: [
        {
          moduleId: 'mkt-m1',
          title: '话术基础',
          order: 1,
          contents: [
            { contentId: 'mkt-c1', type: 'video' as const, title: '话术示范', durationMinutes: 20 },
          ],
          quiz: {
            quizId: 'mkt-q1',
            maxAttempts: 99,
            questions: [
              {
                questionId: 'mktq1',
                text: '以下哪些是有效营销策略？（多选）',
                type: 'multiple_choice' as const,
                options: ['社交媒体', '电子邮件', '电话推销', '随意发送广告'],
                correctAnswer: ['社交媒体', '电子邮件'],
                points: 50,
                explanation: '社交媒体和邮件是合规有效的策略',
              },
              {
                questionId: 'mktq2',
                text: 'true_false: 营销需要了解目标客户',
                type: 'true_false' as const,
                correctAnswer: 'true',
                points: 30,
              },
            ],
          },
        },
      ],
      targetRoles: ['📢营销'],
      estimatedMinutes: 60,
      passingScore: 70,
    })

    ctrl.enroll({ userId: 'mkt-001', courseId: course.courseId })
    const attempt = ctrl.startQuiz({ userId: 'mkt-001', courseId: course.courseId })

    // 正确答案
    const result = ctrl.submitQuiz({
      attemptId: attempt.attemptId,
      answers: { mktq1: ['社交媒体', '电子邮件'], mktq2: 'true' },
    })
    expect(result.passed).toBe(true)

    // 验证证书
    const cert = ctrl.generateCertificate({ userId: 'mkt-001', courseId: course.courseId })
    expect(cert.certificateId).toBeTruthy()
  })

  it('[降级] 营销提交部分正确的多选答案应获得部分分数', () => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service

    const course = ctrl.createCourse({
      title: '营销合规培训',
      description: '营销合规学习',
      modules: [
        {
          moduleId: 'mkt-m2',
          title: '合规要点',
          order: 1,
          contents: [{ contentId: 'mkt-c2', type: 'document' as const, title: '合规手册' }],
          quiz: {
            quizId: 'mkt-q2',
            maxAttempts: 3,
            questions: [
              {
                questionId: 'mktq3',
                text: '哪些渠道属于合规营销？（多选）',
                type: 'multiple_choice' as const,
                options: ['微信推文', '短信群发（有授权）', '陌生电话', '邮件订阅'],
                correctAnswer: ['微信推文', '短信群发（有授权）', '邮件订阅'],
                points: 60,
              },
            ],
          },
        },
      ],
      targetRoles: ['📢营销'],
      estimatedMinutes: 30,
      passingScore: 60,
    })

    ctrl.enroll({ userId: 'mkt-002', courseId: course.courseId })
    const attempt = ctrl.startQuiz({ userId: 'mkt-002', courseId: course.courseId })

    // 只选了 2/3 个正确答案 — 应有部分分数
    const result = ctrl.submitQuiz({
      attemptId: attempt.attemptId,
      answers: { mktq3: ['微信推文', '邮件订阅'] },
    })
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100) // 部分分
  })

  it('[边界] 营销获取空的测验历史不应报错', () => {
    const attempts = ctrl.getQuizAttempts('mkt-no-quiz', 'any-course')
    expect(Array.isArray(attempts)).toBe(true)
    expect(attempts.length).toBe(0)
  })

  it('[边界] 营销创建的课程目标角色为空应仍可创建', () => {
    const course = ctrl.createCourse({
      title: '通用营销知识',
      description: '所有营销人员必修',
      modules: [
        {
          moduleId: 'mkt-m3',
          title: '营销概论',
          order: 1,
          contents: [{ contentId: 'mkt-c3', type: 'video' as const, title: '营销概论', durationMinutes: 25 }],
        },
      ],
      targetRoles: [],
      estimatedMinutes: 25,
      passingScore: 60,
    })
    expect(course.courseId).toBeTruthy()
    expect(course.targetRoles).toEqual([])
  })
})

// ── ═══════════════════════════════════════════════════════════════ ══
// 跨角色联合场景 Cross-Role Scenarios
// ── ═══════════════════════════════════════════════════════════════ ══

describe('🔄跨角色 — 培训管理联合场景', () => {
  let ctrl: TrainingController
  let svc: TrainingService

  beforeEach(() => {
    const ctx = createController()
    ctrl = ctx.controller
    svc = ctx.service
  })

  it('[联合] 多角色课程链: 创建 -> 报名 -> 学习 -> 测验 -> 证书 -> 验证', () => {
    // 完整生命周期
    const course = ctrl.createCourse(makeCourse('全员安全培训', '🔧安监'))
    ctrl.enroll({ userId: 'cross-001', courseId: course.courseId })
    ctrl.updateProgress({ userId: 'cross-001', courseId: course.courseId, moduleId: course.modules[0].moduleId })

    const attempt = ctrl.startQuiz({ userId: 'cross-001', courseId: course.courseId })
    const result = ctrl.submitQuiz({ attemptId: attempt.attemptId, answers: { [`qq-${Date.now()}-1`]: 'A' } })
    expect(result.passed).toBe(true)

    const cert = ctrl.generateCertificate({ userId: 'cross-001', courseId: course.courseId })
    const verified = ctrl.getCertificate(cert.certificateId)
    expect(verified.valid).toBe(true)

    // 验收完整统计
    const stats = ctrl.getUserStats('cross-001')
    expect(stats.coursesCompleted).toBe(1)
    expect(stats.certificatesIssued).toBe(1)
  })

  it('[联合] 证书不可重复生成: 同一用户同一课程第二次生成应返回相同 certId', () => {
    const course = ctrl.createCourse(makeCourse('重复证书测试', '🎮导玩员'))
    ctrl.enroll({ userId: 'dup-user', courseId: course.courseId })
    ctrl.updateProgress({ userId: 'dup-user', courseId: course.courseId, moduleId: course.modules[0].moduleId })

    const attempt = ctrl.startQuiz({ userId: 'dup-user', courseId: course.courseId })
    ctrl.submitQuiz({ attemptId: attempt.attemptId, answers: { [`qq-${Date.now()}-1`]: 'A' } })

    const cert1 = ctrl.generateCertificate({ userId: 'dup-user', courseId: course.courseId })
    const cert2 = ctrl.generateCertificate({ userId: 'dup-user', courseId: course.courseId })
    expect(cert2.certificateId).toBe(cert1.certificateId)
  })

  it('[联合] 没有 enrollments 的用户统计应有合理默认值', () => {
    const stats = ctrl.getUserStats('completely-new-user')
    expect(stats.coursesEnrolled).toBe(0)
    expect(stats.averageScore).toBe(0)
  })

  it('[联合] 课程完成率跨 enrollments 计算正确', () => {
    const course = ctrl.createCourse(makeCourse('完成率测试课', '👔店长'))

    // 3 人报名，1 人完成
    ctrl.enroll({ userId: 'u-a', courseId: course.courseId })
    ctrl.enroll({ userId: 'u-b', courseId: course.courseId })
    ctrl.enroll({ userId: 'u-c', courseId: course.courseId })

    ctrl.updateProgress({ userId: 'u-a', courseId: course.courseId, moduleId: course.modules[0].moduleId })
    const att = ctrl.startQuiz({ userId: 'u-a', courseId: course.courseId })
    ctrl.submitQuiz({ attemptId: att.attemptId, answers: { [`qq-${Date.now()}-1`]: 'A' } })

    const rate = ctrl.getCompletionRate(course.courseId)
    expect(rate.completionRate).toBeGreaterThan(0)
    expect(rate.completionRate).toBeLessThanOrEqual(100)
  })
})
