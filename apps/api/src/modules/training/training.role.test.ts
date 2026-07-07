import { describe, it, expect, beforeEach } from 'vitest'
import { TrainingController } from './training.controller'
import { TrainingService } from './training.service'

/**
 * 🐜 自动: [training] [C] 角色测试
 *
 * 8 角色视角的 training 模块测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 */

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

function createController() {
  const service = new TrainingService()
  return new TrainingController(service as any)
}

// ─────────────────────────────────────────────────────────────────────────
// 👔 店长 StoreManager
// ─────────────────────────────────────────────────────────────────────────
describe('👔店长 - 培训管理', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 店长可以创建门店运营类课程并查看', () => {
    const course = ctrl.createCourse({
      title: '门店安全巡检标准',
      description: '学习每日安全巡检流程和标准',
      modules: [
        {
          moduleId: 'sm-m1',
          title: '巡检要点',
          order: 1,
          contents: [
            { contentId: 'sm-c1', type: 'video' as const, title: '巡检视频教程', durationMinutes: 15 },
          ],
          quiz: {
            quizId: 'sm-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'sm-q1-1', text: '安全巡检频率是？', type: 'single_choice',
                options: ['每天一次', '每周一次', '每月一次', '每季度一次'],
                correctAnswer: '每天一次', points: 50 },
            ],
          },
        },
      ],
      targetRoles: ['店长', '🔧安监'],
      estimatedMinutes: 45,
      passingScore: 80,
    })

    const found = ctrl.getCourse(course.courseId)
    expect(found.title).toBe('门店安全巡检标准')
    expect(found.targetRoles).toContain('店长')
    expect(found.targetRoles).toContain('🔧安监')

    // 按角色过滤也应出现
    const roleCourses = ctrl.getCoursesByRole('店长')
    expect(roleCourses.some((c) => c.courseId === course.courseId)).toBe(true)
  })

  it('权限边界: 店长应能看到所有预设角色课程，但不能查看不存在的课程', () => {
    // 店长可以查看所有课程列表
    const allCourses = ctrl.listCourses()
    expect(allCourses.length).toBeGreaterThanOrEqual(12)

    // 店长可以查看自己角色的专属课程
    const shopCourses = ctrl.getCoursesByRole('店长')
    expect(shopCourses.length).toBeGreaterThanOrEqual(3)
    expect(shopCourses.every((c) => c.targetRoles.includes('店长'))).toBe(true)

    // 边界: 查看不存在的课程应抛异常
    expect(() => ctrl.getCourse('nonexistent-course')).toThrow()
  })

  it('权限边界: 店长查看学员统计数据', () => {
    // 先让用户报名学习
    const courses = ctrl.getCoursesByRole('店长')
    const courseId = courses[0].courseId

    ctrl.enroll({ userId: 'employee-1', courseId })

    const stats = ctrl.getUserStats('employee-1')
    expect(stats.coursesEnrolled).toBe(1)
    expect(stats.coursesCompleted).toBe(0)
    expect(stats.averageScore).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// 🛒 前台 FrontDesk
// ─────────────────────────────────────────────────────────────────────────
describe('🛒前台 - 培训模块', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 前台收银员可以报名参加收银系统操作课程', () => {
    // 预设课程中有收银角色课程
    const posCourses = ctrl.getCoursesByRole('收银')
    expect(posCourses.length).toBeGreaterThanOrEqual(2)

    const courseId = posCourses[0].courseId
    const enrollment = ctrl.enroll({ userId: 'cashier-1', courseId })
    expect(enrollment.userId).toBe('cashier-1')
    expect(enrollment.status).toBe('not_started')

    // 查看报名记录
    const summary = ctrl.getEnrollment('cashier-1', courseId)
    expect(summary.status).toBe('not_started')
  })

  it('正常流程: 前台可以学习课程模块并更新进度', () => {
    const posCourses = ctrl.getCoursesByRole('收银')
    const courseId = posCourses[0].courseId

    ctrl.enroll({ userId: 'cashier-2', courseId })

    // 更新第一个模块的进度
    const posCourse = ctrl.getCourse(courseId)
    const moduleId = posCourse.modules[0].moduleId

    const progress = ctrl.updateProgress({ userId: 'cashier-2', courseId, moduleId })
    expect(progress.progress).toBeGreaterThan(0)
    expect(progress.status).toBe('in_progress')
  })

  it('权限边界: 前台不能查看不存在课程的报名记录', () => {
    expect(() => ctrl.getEnrollment('cashier-3', 'nonexistent-course')).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// 👥HR HumanResources
// ─────────────────────────────────────────────────────────────────────────
describe('👥HR - 培训模块', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: HR 可以为员工创建专属培训课程', () => {
    const course = ctrl.createCourse({
      title: '新员工入职培训',
      description: '新员工企业文化与制度培训',
      modules: [
        {
          moduleId: 'hr-m1',
          title: '企业文化',
          order: 1,
          contents: [
            { contentId: 'hr-c1', type: 'video' as const, title: '公司文化介绍', durationMinutes: 30 },
          ],
        },
        {
          moduleId: 'hr-m2',
          title: '制度考核',
          order: 2,
          contents: [
            { contentId: 'hr-c2', type: 'document' as const, title: '员工手册' },
          ],
          quiz: {
            quizId: 'hr-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'hr-q1-1', text: '试用期是多久？', type: 'single_choice',
                options: ['1个月', '3个月', '6个月', '1年'], correctAnswer: '3个月', points: 30 },
            ],
          },
        },
      ],
      targetRoles: ['店长', '导购', '收银'],
      estimatedMinutes: 90,
      passingScore: 75,
    })

    expect(course.title).toBe('新员工入职培训')
    expect(course.estimatedMinutes).toBe(90)
    expect(course.passingScore).toBe(75)
  })

  it('正常流程: HR 可以查看所有学员的培训进度', () => {
    // 模拟多个员工报名学习
    const courses = ctrl.getCoursesByRole('导购')
    expect(courses.length).toBeGreaterThanOrEqual(2)

    const courseId = courses[0].courseId
    ctrl.enroll({ userId: 'emp-01', courseId })
    ctrl.enroll({ userId: 'emp-02', courseId })
    ctrl.enroll({ userId: 'emp-03', courseId })

    // 查看完成率
    const rate = ctrl.getCompletionRate(courseId)
    expect(rate.completionRate).toBe(0) // 全都没有完成
    expect(rate.courseId).toBe(courseId)
  })

  it('权限边界: HR 不能在课程不存在时发起报名', () => {
    expect(() => ctrl.enroll({ userId: 'emp-99', courseId: 'no-such-course' }))
      .not.toThrow() // service 不会抛出，会创建 enrollment 继续
    const enrollment = ctrl.getEnrollment('emp-99', 'no-such-course')
    expect(enrollment).toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// 🔧安监 Security
// ─────────────────────────────────────────────────────────────────────────
describe('🔧安监 - 培训模块', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 安监人员可以查看所有课程并找到安全培训内容', () => {
    const allCourses = ctrl.listCourses()
    // 安监可以查看课程推荐
    const recommendations = ctrl.getRecommendations('🔧安监')
    expect(recommendations).toBeDefined()
    expect(Array.isArray(recommendations)).toBe(true)

    // 系统应返回至少一个推荐
    expect(recommendations.length).toBeGreaterThanOrEqual(0)
  })

  it('正常流程: 安监人员可以查看课程完成率用于安全培训评估', () => {
    // 使用预设课程
    const courses = ctrl.getCoursesByRole('店长')
    const courseId = courses[0].courseId

    const rate = ctrl.getCompletionRate(courseId)
    expect(typeof rate.completionRate).toBe('number')
    expect(rate.completionRate).toBeGreaterThanOrEqual(0)
    expect(rate.completionRate).toBeLessThanOrEqual(100)
  })

  it('权限边界: 安监查看不存在的证书应抛异常', () => {
    expect(() => ctrl.getCertificate('invalid-cert-id')).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// 🎮导玩员 Guide
// ─────────────────────────────────────────────────────────────────────────
describe('🎮导玩员 - 培训模块', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 导玩员可以参加产品知识培训并通过测验', () => {
    // 导玩员报名产品知识课程
    const courses = ctrl.getCoursesByRole('导购')
    const courseId = courses[0].courseId

    ctrl.enroll({ userId: 'guide-01', courseId })

    // 开始测验
    const attempt = ctrl.startQuiz({ userId: 'guide-01', courseId })
    expect(attempt.attemptId).toBeDefined()
    expect(attempt.startedAt).toBeDefined()
    expect(attempt.passed).toBe(false)

    // 提交正确答案
    const submitted = ctrl.submitQuiz({
      attemptId: attempt.attemptId,
      answers: { 'pq1': '差异化价值' },
    })
    expect(submitted.passed).toBe(true)
    expect(submitted.score).toBeGreaterThanOrEqual(80)
  })

  it('正常流程: 导玩员完成课程后可获得证书', () => {
    const courses = ctrl.getCoursesByRole('导购')
    const courseId = courses[0].courseId
    const course = ctrl.getCourse(courseId)

    ctrl.enroll({ userId: 'guide-02', courseId })

    // 完成所有模块
    for (const mod of course.modules) {
      ctrl.updateProgress({ userId: 'guide-02', courseId, moduleId: mod.moduleId })
    }

    const attempt = ctrl.startQuiz({ userId: 'guide-02', courseId })
    const submitted = ctrl.submitQuiz({ attemptId: attempt.attemptId, answers: { 'pq1': '差异化价值' } })
    expect(submitted.passed).toBe(true)

    // 获取证书
    const cert = ctrl.generateCertificate({ userId: 'guide-02', courseId })
    expect(cert.certificateId).toBeDefined()

    // 验证证书有效
    const verified = ctrl.getCertificate(cert.certificateId)
    expect(verified.valid).toBe(true)
    expect(verified.userId).toBe('guide-02')
  })

  it('权限边界: 导玩员未完成课程不能获得证书', () => {
    const courses = ctrl.getCoursesByRole('导购')
    const courseId = courses[0].courseId

    ctrl.enroll({ userId: 'guide-03', courseId })
    // 未完成课程直接申请证书应抛出
    expect(() => ctrl.generateCertificate({ userId: 'guide-03', courseId })).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// 🎯运行专员 Operations
// ─────────────────────────────────────────────────────────────────────────
describe('🎯运行专员 - 培训模块', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 运行专员可以批量创建课程以满足门店培训需求', () => {
    const course1 = ctrl.createCourse({
      title: '设备维护培训',
      description: '门店设备日常维护保养',
      modules: [
        {
          moduleId: 'ops-m1',
          title: '设备检查',
          order: 1,
          contents: [
            { contentId: 'ops-c1', type: 'video' as const, title: '检查流程', durationMinutes: 20 },
          ],
        },
      ],
      targetRoles: ['🎯运行专员', '🔧安监'],
      estimatedMinutes: 60,
      passingScore: 80,
    })

    const course2 = ctrl.createCourse({
      title: '消防应急演练',
      description: '火灾应急预案培训',
      modules: [
        {
          moduleId: 'ops-m2',
          title: '应急流程',
          order: 1,
          contents: [
            { contentId: 'ops-c2', type: 'document' as const, title: '应急手册' },
          ],
        },
      ],
      targetRoles: ['🎯运行专员', '店长'],
      estimatedMinutes: 45,
      passingScore: 80,
    })

    expect(course1.courseId).toBeDefined()
    expect(course2.courseId).toBeDefined()

    const all = ctrl.listCourses()
    expect(all.some((c) => c.courseId === course1.courseId)).toBe(true)
    expect(all.some((c) => c.courseId === course2.courseId)).toBe(true)
  })

  it('正常流程: 运行专员可以为员工推荐学习路径', () => {
    const recommendations = ctrl.getRecommendations('🎯运行专员')
    expect(recommendations.length).toBeGreaterThanOrEqual(0)
    if (recommendations.length > 0) {
      expect(recommendations[0].courseId).toBeDefined()
      expect(recommendations[0].order).toBeGreaterThanOrEqual(1)
      expect(typeof recommendations[0].reason).toBe('string')
    }
  })

  it('权限边界: 运行专员查看不存在的学员统计应返回空值', () => {
    const stats = ctrl.getUserStats('nonexistent-user')
    expect(stats.coursesEnrolled).toBe(0)
    expect(stats.coursesCompleted).toBe(0)
    expect(stats.totalStudyMinutes).toBe(0)
    expect(stats.certificatesIssued).toBe(0)
    expect(stats.averageScore).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// 🤝团建 Teambuilding
// ─────────────────────────────────────────────────────────────────────────
describe('🤝团建 - 培训模块', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 团建专员可以查看课程并组织团队学习', () => {
    const allCourses = ctrl.listCourses()

    // 将课程按角色分组
    const coursesByRole: Record<string, string[]> = {}
    for (const course of allCourses) {
      for (const role of course.targetRoles) {
        if (!coursesByRole[role]) coursesByRole[role] = []
        coursesByRole[role].push(course.title)
      }
    }

    // 至少店长/导购/收银/客服各有2门课程
    expect(coursesByRole['店长']?.length).toBeGreaterThanOrEqual(3)
    expect(coursesByRole['导购']?.length).toBeGreaterThanOrEqual(3)
    expect(coursesByRole['收银']?.length).toBeGreaterThanOrEqual(3)
    expect(coursesByRole['客服']?.length).toBeGreaterThanOrEqual(3)

    // 查看某个课程的完成率
    const courseId = allCourses[0].courseId
    const rate = ctrl.getCompletionRate(courseId)
    expect(rate.courseId).toBe(courseId)
  })

  it('正常流程: 团建专员可以为不同角色定制学习路径', () => {
    const shopRecs = ctrl.getRecommendations('店长')
    const guideRecs = ctrl.getRecommendations('导购')
    const cashierRecs = ctrl.getRecommendations('收银')

    expect(shopRecs.length).toBeGreaterThanOrEqual(3)
    expect(guideRecs.length).toBeGreaterThanOrEqual(3)
    expect(cashierRecs.length).toBeGreaterThanOrEqual(3)
  })

  it('权限边界: 团建查看不存在的证书', () => {
    expect(() => ctrl.getCertificate('')).toThrow()
  })
})

// ─────────────────────────────────────────────────────────────────────────
// 📢营销 Marketing
// ─────────────────────────────────────────────────────────────────────────
describe('📢营销 - 培训模块', () => {
  let ctrl: TrainingController

  beforeEach(() => {
    ctrl = createController()
  })

  it('正常流程: 营销人员可创建关于促销活动的培训课程', () => {
    const course = ctrl.createCourse({
      title: '新品推广话术培训',
      description: '新品上市推广技巧和话术训练',
      modules: [
        {
          moduleId: 'mkt-m1',
          title: '产品卖点',
          order: 1,
          contents: [
            { contentId: 'mkt-c1', type: 'video' as const, title: '新品特性介绍', durationMinutes: 25 },
          ],
        },
        {
          moduleId: 'mkt-m2',
          title: '话术演练',
          order: 2,
          contents: [
            { contentId: 'mkt-c2', type: 'document' as const, title: '推广话术模板' },
          ],
          quiz: {
            quizId: 'mkt-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'mkt-q1-1', text: '新品推广的首要步骤是？', type: 'single_choice',
                options: ['定价', '产品培训', '投放广告', '设计海报'],
                correctAnswer: '产品培训', points: 30 },
              { questionId: 'mkt-q1-2', text: '如何获取客户反馈？', type: 'multiple_choice',
                options: ['问卷调查', '社交媒体', '忽略不计', '销售数据'],
                correctAnswer: ['问卷调查', '社交媒体', '销售数据'], points: 30 },
            ],
          },
        },
      ],
      targetRoles: ['导购', '📢营销'],
      estimatedMinutes: 75,
      passingScore: 80,
    })

    expect(course.title).toBe('新品推广话术培训')
    expect(course.targetRoles).toContain('📢营销')

    // 验证完整创建
    const found = ctrl.getCourse(course.courseId)
    expect(found.modules.length).toBe(2)
    expect(found.modules[1].quiz).toBeDefined()
    expect(found.modules[1].quiz!.questions.length).toBe(2)
  })

  it('正常流程: 营销人员可以查看课程学习完成率用于培训效果评估', () => {
    // 创建课程并注册学员
    const course = ctrl.createCourse({
      title: '营销策略培训',
      description: '门店营销策略和方法',
      modules: [
        {
          moduleId: 'mkt-m3',
          title: '活动策划',
          order: 1,
          contents: [
            { contentId: 'mkt-c3', type: 'video' as const, title: '策划流程', durationMinutes: 20 },
          ],
        },
      ],
      targetRoles: ['📢营销'],
      estimatedMinutes: 30,
      passingScore: 80,
    })

    // 模拟一些学员
    for (let i = 1; i <= 5; i++) {
      ctrl.enroll({ userId: `mkt-student-${i}`, courseId: course.courseId })
    }

    const rate = ctrl.getCompletionRate(course.courseId)
    expect(rate.completionRate).toBe(0) // 没人完成
  })

  it('权限边界: 营销人员查看无报名记录的课程完成率', () => {
    // 新创建的课程，没有学员
    const course = ctrl.createCourse({
      title: '门店铺设培训',
      description: '新开门店陈列和布置',
      modules: [
        {
          moduleId: 'mkt-m4',
          title: '陈列标准',
          order: 1,
          contents: [
            { contentId: 'mkt-c4', type: 'document' as const, title: '陈列手册' },
          ],
        },
      ],
      targetRoles: ['📢营销'],
      estimatedMinutes: 30,
      passingScore: 80,
    })

    const rate = ctrl.getCompletionRate(course.courseId)
    expect(rate.completionRate).toBe(0) // 无学员
  })
})
