import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { TrainingController } from './training.controller'
import { TrainingService } from './training.service'

describe('TrainingController', () => {
  let controller: TrainingController
  let service: TrainingService

  beforeEach(() => {
    service = new TrainingService()
    controller = new TrainingController(service as any)
  })

  describe('课程管理', () => {
    it('createCourse 创建课程成功', () => {
      const course = controller.createCourse({
        title: '测试课程',
        description: '课程描述',
        modules: [{
          moduleId: 'm1',
          title: '模块一',
          contents: [{ contentId: 'c1', type: 'video' as const, title: '介绍视频', durationMinutes: 10 }],
          order: 1
        }],
        targetRoles: ['导购'],
        estimatedMinutes: 60,
        passingScore: 80
      })
      assert.ok(course.courseId)
      assert.equal(course.title, '测试课程')
      assert.equal(course.targetRoles[0], '导购')
    })

    it('listCourses 返回所有预设课程', () => {
      const courses = controller.listCourses()
      // 预设 12 门课程
      assert.ok(courses.length >= 12)
    })

    it('getCourse 按 ID 获取课程', () => {
      const created = controller.createCourse({
        title: '找课程',
        description: '描述',
        modules: [{ moduleId: 'fm1', title: '模块', contents: [{ contentId: 'fc1', type: 'video' as const, title: '视频' }], order: 1 }],
        targetRoles: ['店长'],
        estimatedMinutes: 30,
        passingScore: 60
      })
      const found = controller.getCourse(created.courseId)
      assert.equal(found.title, '找课程')
    })

    it('getCourse 对不存在课程抛出 NotFoundException', () => {
      assert.throws(() => controller.getCourse('nonexistent'), /not found/)
    })

    it('getCoursesByRole 按角色过滤课程', () => {
      // Must call with string param explicitly for the controller
      const courses = controller.getCoursesByRole('导购' as any)
      assert.ok(courses.length >= 3)
    })

    it('getCoursesByRole 对未知角色返回空数组', () => {
      const courses = controller.getCoursesByRole('unknown_role' as any)
      assert.equal(courses.length, 0)
    })
  })

  describe('报名与进度', () => {
    it('enroll 学员报名成功', () => {
      const course = controller.listCourses()[0]
      const enrollment = controller.enroll({ userId: 'user-001', courseId: course.courseId })
      assert.equal(enrollment.userId, 'user-001')
      assert.equal(enrollment.status, 'not_started')
    })

    it('enroll 重复报名返回已有记录', () => {
      const courseId = 'course-0'
      const e1 = controller.enroll({ userId: 'user-002', courseId })
      const e2 = controller.enroll({ userId: 'user-002', courseId })
      assert.equal(e1.enrolledAt.toISOString(), e2.enrolledAt.toISOString())
    })

    it('updateProgress 更新进度正确', () => {
      const course = controller.createCourse({
        title: '进度课',
        description: 'desc',
        modules: [
          { moduleId: 'pm1', title: '模块1', contents: [{ contentId: 'pc1', type: 'video' as const, title: '视频1' }], order: 1 },
          { moduleId: 'pm2', title: '模块2', contents: [{ contentId: 'pc2', type: 'video' as const, title: '视频2' }], order: 2 }
        ],
        targetRoles: ['店长'],
        estimatedMinutes: 60,
        passingScore: 80
      })
      controller.enroll({ userId: 'up-user', courseId: course.courseId })
      const result = controller.updateProgress({ userId: 'up-user', courseId: course.courseId, moduleId: 'pm1' })
      assert.equal(result.progress, 50)
      assert.equal(result.status, 'in_progress')
    })

    it('updateProgress 全部模块完成标记 completed', () => {
      const course = controller.createCourse({
        title: '完成课',
        description: 'desc',
        modules: [{ moduleId: 'cm1', title: '模块1', contents: [{ contentId: 'cc1', type: 'video' as const, title: '视频1' }], order: 1 }],
        targetRoles: ['店长'],
        estimatedMinutes: 30,
        passingScore: 80
      })
      controller.enroll({ userId: 'done-user', courseId: course.courseId })
      const result = controller.updateProgress({ userId: 'done-user', courseId: course.courseId, moduleId: 'cm1' })
      assert.equal(result.progress, 100)
      assert.equal(result.status, 'completed')
    })

    it('getEnrollment 返回报名记录', () => {
      const course = controller.listCourses()[0]
      controller.enroll({ userId: 'eq-user', courseId: course.courseId })
      const enrollment = controller.getEnrollment('eq-user' as any, course.courseId as any)
      assert.equal(enrollment.courseId, course.courseId)
    })

    it('getEnrollment 对不存在返回 NotFound', () => {
      assert.throws(() => controller.getEnrollment('no-user' as any, 'no-course' as any), /not found/)
    })
  })

  describe('测验', () => {
    it('startQuiz 开始测验返回 attempt', () => {
      const courses = controller.listCourses()
      const course = courses.find(c => c.modules.some(m => m.quiz))
      assert.ok(course, 'Need a course with quiz')

      controller.enroll({ userId: 'qz-user', courseId: course.courseId })
      const attempt = controller.startQuiz({ userId: 'qz-user', courseId: course.courseId })
      assert.ok(attempt.attemptId)
      assert.equal(attempt.score, 0)
    })

    it('startQuiz 自动报名未报名用户', () => {
      const courses = controller.listCourses()
      const course = courses.find(c => c.modules.some(m => m.quiz))
      assert.ok(course)

      const attempt = controller.startQuiz({ userId: 'auto-enroll', courseId: course.courseId })
      assert.ok(attempt.attemptId)
    })

    it('submitQuiz 计算分数并标记完成', () => {
      const courses = controller.listCourses()
      const course = courses.find(c => c.modules.some(m => m.quiz))
      assert.ok(course)

      controller.enroll({ userId: 'sb-user', courseId: course.courseId })
      const attempt = controller.startQuiz({ userId: 'sb-user', courseId: course.courseId })
      const result = controller.submitQuiz({ attemptId: attempt.attemptId, answers: { q1: '个人休息', fq1: '核对收支', fq2: 'true', sq1: ['销售额', '客户满意度', '出勤率'] } })
      assert.ok(result.score > 0)
      assert.ok(result.completedAt)
    })

    it('submitQuiz 无效 attempt 抛错', () => {
      assert.throws(
        () => controller.submitQuiz({ attemptId: 'invalid', answers: {} }),
        /考试记录不存在/
      )
    })
  })

  describe('证书', () => {
    it('generateCertificate 通过后生成证书', () => {
      const course = controller.createCourse({
        title: '证书课',
        description: 'desc',
        modules: [{
          moduleId: 'cert-m1', title: '模块',
          contents: [{ contentId: 'cert-c1', type: 'video' as const, title: '视频' }],
          quiz: { quizId: 'cert-q1', maxAttempts: 3, questions: [{ questionId: 'cert-qq1', text: '1+1=?', type: 'single_choice' as const, options: ['1', '2', '3'], correctAnswer: '2', points: 100 }] },
          order: 1
        }],
        targetRoles: ['店长'],
        estimatedMinutes: 10,
        passingScore: 80
      })
      controller.enroll({ userId: 'cert-user', courseId: course.courseId })
      controller.updateProgress({ userId: 'cert-user', courseId: course.courseId, moduleId: 'cert-m1' })
      const attempt = controller.startQuiz({ userId: 'cert-user', courseId: course.courseId })
      controller.submitQuiz({ attemptId: attempt.attemptId, answers: { 'cert-qq1': '2' } })

      const result = controller.generateCertificate({ userId: 'cert-user', courseId: course.courseId })
      assert.ok(result.certificateId)
    })

    it('getCertificate 按 ID 获取证书详情', () => {
      const course = controller.createCourse({
        title: '证书查询', description: 'desc',
        modules: [{
          moduleId: 'gcm1', title: '模块',
          contents: [{ contentId: 'gcc1', type: 'video' as const, title: '视频' }],
          quiz: { quizId: 'cert-q2', maxAttempts: 3, questions: [{ questionId: 'gq1', text: 'test', type: 'true_false' as const, correctAnswer: 'true', points: 100 }] },
          order: 1
        }],
        targetRoles: ['店长'], estimatedMinutes: 10, passingScore: 80
      })
      controller.enroll({ userId: 'cert-get', courseId: course.courseId })
      controller.updateProgress({ userId: 'cert-get', courseId: course.courseId, moduleId: 'gcm1' })
      const attempt = controller.startQuiz({ userId: 'cert-get', courseId: course.courseId })
      controller.submitQuiz({ attemptId: attempt.attemptId, answers: { gq1: 'true' } })
      const { certificateId } = controller.generateCertificate({ userId: 'cert-get', courseId: course.courseId })

      const cert = controller.getCertificate(certificateId)
      assert.equal(cert.valid, true)
      assert.equal(cert.userId, 'cert-get')
    })

    it('getCertificate 不存在的证书抛 NotFound', () => {
      assert.throws(() => controller.getCertificate('nonexistent'), /not found/)
    })
  })

  describe('统计与推荐', () => {
    it('getUserStats 新用户返回零值', () => {
      const stats = controller.getUserStats('unknown-user' as any)
      assert.equal(stats.coursesEnrolled, 0)
      assert.equal(stats.coursesCompleted, 0)
    })

    it('getUserStats 学习后累积统计', () => {
      const course = controller.createCourse({
        title: '统计课', description: 'desc',
        modules: [{ moduleId: 'stat-m1', title: '模块', contents: [{ contentId: 'stat-c1', type: 'video' as const, title: '视频', durationMinutes: 15 }], order: 1 }],
        targetRoles: ['店长'], estimatedMinutes: 15, passingScore: 80
      })
      controller.enroll({ userId: 'stats-u', courseId: course.courseId })
      controller.updateProgress({ userId: 'stats-u', courseId: course.courseId, moduleId: 'stat-m1' })
      const stats = controller.getUserStats('stats-u' as any)
      assert.equal(stats.totalStudyMinutes, 15)
    })

    it('getCompletionRate 无报名返回 0', () => {
      const course = controller.createCourse({
        title: '完成率测', description: 'desc',
        modules: [{ moduleId: 'cr-m1', title: '模块', contents: [{ contentId: 'cr-c1', type: 'video' as const, title: '视频' }], order: 1 }],
        targetRoles: ['店长'], estimatedMinutes: 10, passingScore: 80
      })
      const result = controller.getCompletionRate(course.courseId)
      assert.equal(result.completionRate, 0)
    })

    it('getCompletionRate 部分完成计算正确', () => {
      const course = controller.createCourse({
        title: '完成率100', description: 'desc',
        modules: [{ moduleId: 'cr-m1', title: '模块', contents: [{ contentId: 'cr-c1', type: 'video' as const, title: '视频' }], order: 1 }],
        targetRoles: ['店长'], estimatedMinutes: 10, passingScore: 80
      })
      controller.enroll({ userId: 'cr-u1', courseId: course.courseId })
      controller.updateProgress({ userId: 'cr-u1', courseId: course.courseId, moduleId: 'cr-m1' })
      controller.enroll({ userId: 'cr-u2', courseId: course.courseId })
      const result = controller.getCompletionRate(course.courseId)
      assert.equal(result.completionRate, 50)
    })

    it('getRecommendations 按角色返回推荐', () => {
      const recs = controller.getRecommendations('店长' as any)
      assert.ok(recs.length > 0)
      recs.forEach(r => {
        assert.ok(r.courseId)
        assert.ok(r.reason)
      })
    })
  })
})
