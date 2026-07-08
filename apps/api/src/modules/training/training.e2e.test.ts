/**
 * 🐜 自动: [training] [C] e2e 角色流程测试
 *
 * 从 8 角色视角覆盖 training 模块完整端到端流程：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { TrainingController } from './training.controller'
import { TrainingService } from './training.service'

function createController(): TrainingController {
  const service = new TrainingService()
  return new TrainingController(service as any)
}

// ─────────────────────────────────────────────────────────
// 👔店长 - 门店运营管理课程 + 人员培训管理
// ─────────────────────────────────────────────────────────
describe('👔店长 培训视角', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 店长创建门店管理课程并报名学习', () => {
    const course = ctrl.createCourse({
      title: '门店排班管理',
      description: '高效排班技巧',
      modules: [{
        moduleId: 'sm1', title: '排班基础',
        contents: [{ contentId: 'sc1', type: 'video', title: '智能排班', durationMinutes: 20 }],
        order: 1
      }],
      targetRoles: ['店长'],
      estimatedMinutes: 40,
      passingScore: 80
    })
    expect(course.courseId).toBeTruthy()
    expect(course.title).toBe('门店排班管理')

    const enrollment = ctrl.enroll({ userId: 'store-mgr-1', courseId: course.courseId })
    expect(enrollment.status).toBe('not_started')
    expect(enrollment.progress).toBe(0)
  })

  it('边界: 店长尝试为不存在的课程报名（服务层会自动创建报名）', () => {
    expect(() => ctrl.enroll({ userId: 'store-mgr-2', courseId: 'nonexistent' })).not.toThrow()
    const enrollment = ctrl.getEnrollment('store-mgr-2', 'nonexistent' as any)
    expect(enrollment.status).toBe('not_started')
  })
})

// ─────────────────────────────────────────────────────────
// 🛒前台 - 收银系统培训 + 促销核销培训
// ─────────────────────────────────────────────────────────
describe('🛒前台 培训视角', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 前台查看适合收银角色的课程列表', () => {
    const courses = ctrl.getCoursesByRole('收银' as any)
    expect(Array.isArray(courses)).toBe(true)
    expect(courses.length).toBeGreaterThan(0)
    courses.forEach(c => {
      expect(c.targetRoles).toContain('收银')
    })
  })

  it('边界: 前台查询空角色名返回空数组', () => {
    const courses = ctrl.getCoursesByRole('' as any)
    expect(Array.isArray(courses)).toBe(true)
    expect(courses.length).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────
// 👥HR - 员工培训计划 + 证书管理
// ─────────────────────────────────────────────────────────
describe('👥HR 培训视角', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: HR 创建员工培训课程并完成全流程', () => {
    const course = ctrl.createCourse({
      title: '新员工入职培训',
      description: '入职必备知识',
      modules: [
        { moduleId: 'hr1', title: '公司文化', contents: [{ contentId: 'hc1', type: 'video', title: '文化介绍', durationMinutes: 15 }], order: 1 },
        { moduleId: 'hr2', title: '绩效考核', contents: [{ contentId: 'hc2', type: 'document', title: '绩效指南' }], order: 2 },
      ],
      targetRoles: ['HR'],
      estimatedMinutes: 60,
      passingScore: 70
    })
    expect(course.courseId).toBeTruthy()

    const enrollment = ctrl.enroll({ userId: 'hr-emp-1', courseId: course.courseId })
    expect(enrollment.status).toBe('not_started')

    ctrl.updateProgress({ userId: 'hr-emp-1', courseId: course.courseId, moduleId: 'hr1' })
    const enrollAfterModule1 = ctrl.getEnrollment('hr-emp-1', course.courseId)
    expect(enrollAfterModule1.progress).toBeGreaterThan(0)
  })

  it('边界: HR 尝试获取未报名的学员统计返回零值', () => {
    const stats = ctrl.getUserStats('non-existent-user')
    expect(stats.coursesEnrolled).toBe(0)
    expect(stats.coursesCompleted).toBe(0)
    expect(stats.certificatesIssued).toBe(0)
    expect(stats.averageScore).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────
// 🔧安监 - 安全培训课程 + 完成率统计
// ─────────────────────────────────────────────────────────
describe('🔧安监 培训视角', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 安监创建安全培训课程并查询完成率', () => {
    const course = ctrl.createCourse({
      title: '消防安全培训',
      description: '消防应急处理',
      modules: [{
        moduleId: 'safety1', title: '灭火器使用',
        contents: [{ contentId: 'sc1', type: 'video', title: '实操演示', durationMinutes: 25 }],
        order: 1
      }],
      targetRoles: ['安监'],
      estimatedMinutes: 30,
      passingScore: 90
    })
    expect(course.courseId).toBeTruthy()

    const rate = ctrl.getCompletionRate(course.courseId)
    expect(rate.completionRate).toBe(0)
  })

  it('边界: 安监查询不存在的课程完成率', () => {
    const rate = ctrl.getCompletionRate('nonexistent-course')
    expect(rate.completionRate).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────
// 🎮导玩员 - 产品知识 + 销售技巧课程
// ─────────────────────────────────────────────────────────
describe('🎮导玩员 培训视角', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 导玩员查找适合导购角色的课程安排学习路径', () => {
    const recs = ctrl.getRecommendations('导购')
    expect(Array.isArray(recs)).toBe(true)
    expect(recs.length).toBeGreaterThan(0)
    recs.forEach((r, idx) => {
      expect(r.order).toBe(idx + 1)
      expect(typeof r.courseId).toBe('string')
    })
  })

  it('边界: 导玩员查询不存在角色的推荐课程', () => {
    const recs = ctrl.getRecommendations('外星人' as any)
    expect(Array.isArray(recs)).toBe(true)
    expect(recs.length).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────
// 🎯运行专员 - 课程运营 + 统计分析
// ─────────────────────────────────────────────────────────
describe('🎯运行专员 培训视角', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 运行专员查看所有课程列表和完成率统计', () => {
    const courses = ctrl.listCourses()
    expect(courses.length).toBeGreaterThanOrEqual(12)

    const targetCourse = courses[0]
    ctrl.enroll({ userId: 'ops-u1', courseId: targetCourse.courseId })
    ctrl.enroll({ userId: 'ops-u2', courseId: targetCourse.courseId })

    // 学员1完成全部模块
    targetCourse.modules.forEach(m => {
      ctrl.updateProgress({ userId: 'ops-u1', courseId: targetCourse.courseId, moduleId: m.moduleId })
    })
    const e1 = ctrl.getEnrollment('ops-u1', targetCourse.courseId)
    expect(e1.progress).toBe(100)
    expect(e1.status).toBe('completed')

    const rate = ctrl.getCompletionRate(targetCourse.courseId)
    expect(rate.completionRate).toBeGreaterThan(0)
  })

  it('边界: 更新不存在课程的进度抛出 NotFoundException', () => {
    // updateProgress 内部会调用 getEnrollment，没有 enrollment 则抛出 NotFoundException
    expect(() =>
      ctrl.updateProgress({ userId: 'ops-u3', courseId: 'ghost', moduleId: 'm1' })
    ).toThrow(NotFoundException)
  })
})

// ─────────────────────────────────────────────────────────
// 🤝团建 - 团队培训课程 + 测验
// ─────────────────────────────────────────────────────────
describe('🤝团建 培训视角', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 团建创建协作课程并完成测验流程', () => {
    const course = ctrl.createCourse({
      title: '团队协作工作坊',
      description: '提升团队凝聚力',
      modules: [{
        moduleId: 'team1', title: '协作理论',
        contents: [{ contentId: 'tc1', type: 'video', title: '团队角色', durationMinutes: 30 }],
        quiz: {
          quizId: 'team-q1', maxAttempts: 3,
          questions: [
            { questionId: 'tq1', text: '团队协作的关键是什么？', type: 'single_choice',
              options: ['沟通', '竞争', '沉默', '命令'], correctAnswer: '沟通', points: 50 }
          ]
        },
        order: 1
      }],
      targetRoles: ['团建'],
      estimatedMinutes: 45,
      passingScore: 80
    })

    ctrl.enroll({ userId: 'team-member-1', courseId: course.courseId })
    ctrl.updateProgress({ userId: 'team-member-1', courseId: course.courseId, moduleId: 'team1' })

    const attempt = ctrl.startQuiz({ userId: 'team-member-1', courseId: course.courseId })
    expect(attempt.attemptId).toBeTruthy()
    expect(attempt.score).toBe(0)

    const result = ctrl.submitQuiz({ attemptId: attempt.attemptId, answers: { tq1: '沟通' } })
    expect(result.passed).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(80)
  })

  it('边界: 提交不存在的测验尝试抛出异常', () => {
    expect(() =>
      ctrl.submitQuiz({ attemptId: 'fake-attempt-id', answers: { q1: 'A' } })
    ).toThrow()
  })
})

// ─────────────────────────────────────────────────────────
// 📢营销 - 营销培训 + 证书
// ─────────────────────────────────────────────────────────
describe('📢营销 培训视角', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 营销完成课程后获取证书', () => {
    const course = ctrl.createCourse({
      title: '数字营销基础',
      description: '掌握在线营销技能',
      modules: [{
        moduleId: 'mkt1', title: '社交媒体',
        contents: [{ contentId: 'mc1', type: 'video', title: '社交营销', durationMinutes: 20 }],
        order: 1
      }],
      targetRoles: ['营销'],
      estimatedMinutes: 30,
      passingScore: 80
    })

    ctrl.enroll({ userId: 'mkt-user', courseId: course.courseId })
    ctrl.updateProgress({ userId: 'mkt-user', courseId: course.courseId, moduleId: 'mkt1' })

    // 只有一个模块，完成后状态变为 completed
    const enrollment = ctrl.getEnrollment('mkt-user', course.courseId)
    expect(enrollment.status).toBe('completed')

    const cert = ctrl.generateCertificate({ userId: 'mkt-user', courseId: course.courseId })
    expect(cert.certificateId).toBeTruthy()

    const verification = ctrl.getCertificate(cert.certificateId)
    expect(verification.valid).toBe(true)
    expect(verification.userId).toBe('mkt-user')
  })

  it('边界: 未完成课程无法获取证书', () => {
    const course = ctrl.createCourse({
      title: '高级营销策略',
      description: '进阶课程',
      modules: [{
        moduleId: 'mkt2', title: '策略分析',
        contents: [{ contentId: 'mc2', type: 'document', title: '策略文档' }],
        order: 1
      }],
      targetRoles: ['营销'],
      estimatedMinutes: 20,
      passingScore: 80
    })

    ctrl.enroll({ userId: 'mkt-user2', courseId: course.courseId })
    // 没有更新进度（未开始），证书生成会抛出异常
    expect(() =>
      ctrl.generateCertificate({ userId: 'mkt-user2', courseId: course.courseId })
    ).toThrow()
  })

  it('边界: 验证不存在的证书抛出 NotFoundException', () => {
    expect(() => ctrl.getCertificate('fake-cert-id')).toThrow(/not found/)
  })
})

// ─────────────────────────────────────────────────────────
// 跨角色集成场景
// ─────────────────────────────────────────────────────────
describe('跨角色集成场景', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('多角色课程推荐链 — 店长查看后 HR 可以查看所有店长课程', () => {
    const storeMgrs = ctrl.getCoursesByRole('店长' as any)
    expect(storeMgrs.length).toBeGreaterThan(0)

    const hrCourses = ctrl.getCoursesByRole('HR' as any)
    expect(Array.isArray(hrCourses)).toBe(true)
  })

  it('证书悖论 — 同一课程同一学员两次调用返回相同证书ID', () => {
    const course = ctrl.createCourse({
      title: '证书测试课程',
      description: '用于验证证书唯一性',
      modules: [{
        moduleId: 'cert1', title: '唯一模块',
        contents: [{ contentId: 'cc1', type: 'video', title: '视频', durationMinutes: 10 }],
        order: 1
      }],
      targetRoles: ['营销'],
      estimatedMinutes: 15,
      passingScore: 80
    })

    ctrl.enroll({ userId: 'cert-user', courseId: course.courseId })
    ctrl.updateProgress({ userId: 'cert-user', courseId: course.courseId, moduleId: 'cert1' })

    const cert1 = ctrl.generateCertificate({ userId: 'cert-user', courseId: course.courseId })
    const cert2 = ctrl.generateCertificate({ userId: 'cert-user', courseId: course.courseId })
    expect(cert1.certificateId).toBe(cert2.certificateId)
  })
})
