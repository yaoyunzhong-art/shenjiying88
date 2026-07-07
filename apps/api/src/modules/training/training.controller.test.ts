// training.controller.test.ts · 培训模块 Controller 测试
// 🐜 自动: [training] [A] Controller 测试

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { TrainingController } from './training.controller'
import { TrainingService } from './training.service'

function createController(): TrainingController {
  const service = new TrainingService()
  return new TrainingController(service as any)
}

describe('TrainingController', () => {
  let controller: TrainingController

  beforeEach(() => {
    controller = createController()
  })

  // ── 课程管理 ────────────────────────────────────────────────────

  describe('POST /training/courses — createCourse', () => {
    it('正常: 创建课程成功', () => {
      const course = controller.createCourse({
        title: '新课程',
        description: '描述',
        modules: [{
          moduleId: 'm1', title: '模块',
          contents: [{ contentId: 'c1', type: 'video', title: '视频' }],
          order: 1,
        }],
        targetRoles: ['导购'],
        estimatedMinutes: 60,
        passingScore: 80,
      })
      expect(course.courseId).toBeDefined()
      expect(course.title).toBe('新课程')
    })

    it('边界: 不带可选参数 certificateTemplate', () => {
      const course = controller.createCourse({
        title: '无证书模板',
        description: 'desc',
        modules: [{
          moduleId: 'm', title: 'm',
          contents: [{ contentId: 'c', type: 'document', title: 'doc' }],
          order: 1,
        }],
        targetRoles: ['店长'],
        estimatedMinutes: 30,
        passingScore: 60,
      })
      expect(course.certificateTemplate).toBeUndefined()
    })
  })

  describe('GET /training/courses — listCourses', () => {
    it('正常: 返回预设课程列表', () => {
      const courses = controller.listCourses()
      expect(courses.length).toBeGreaterThanOrEqual(12)
    })
  })

  describe('GET /training/courses/:id — getCourse', () => {
    it('正常: 按 ID 获取课程', () => {
      const created = controller.createCourse({
        title: '查找测试',
        description: 'desc',
        modules: [{ moduleId: 'm', title: 'm', contents: [{ contentId: 'c', type: 'video', title: 'v' }], order: 1 }],
        targetRoles: ['导购'], estimatedMinutes: 30, passingScore: 60,
      })
      const found = controller.getCourse(created.courseId)
      expect(found.title).toBe('查找测试')
    })

    it('异常: 不存在的课程抛出 NotFoundException', () => {
      expect(() => controller.getCourse('nonexistent')).toThrow(NotFoundException)
    })
  })

  describe('GET /training/courses/by-role/:role — getCoursesByRole', () => {
    it('正常: 按角色获取课程', () => {
      const courses = controller.getCoursesByRole('店长')
      expect(courses.length).toBeGreaterThan(0)
      courses.forEach((c) => expect(c.targetRoles).toContain('店长'))
    })

    it('边界: 不存在的角色返回空数组', () => {
      const courses = controller.getCoursesByRole('未知角色')
      expect(courses).toHaveLength(0)
    })
  })

  // ── 报名学习 ────────────────────────────────────────────────────

  describe('POST /training/enroll — enroll', () => {
    it('正常: 报名课程成功', () => {
      const enr = controller.enroll({ userId: 'u1', courseId: 'c1' })
      expect(enr.userId).toBe('u1')
      expect(enr.status).toBe('not_started')
    })

    it('边界: 重复报名返回已有记录', () => {
      const first = controller.enroll({ userId: 'u1', courseId: 'c1' })
      const second = controller.enroll({ userId: 'u1', courseId: 'c1' })
      expect(second).toBe(first)
    })
  })

  describe('POST /training/progress — updateProgress', () => {
    it('正常: 更新进度返回状态信息', () => {
      controller.enroll({ userId: 'u1', courseId: 'course-3' })
      const result = controller.updateProgress({ userId: 'u1', courseId: 'course-3', moduleId: 'staff-m1' })
      expect(result.status).toBe('in_progress')
      expect(result.progress).toBeGreaterThan(0)
    })

    it('异常: 未报名返回 NotFoundException', () => {
      expect(() =>
        controller.updateProgress({ userId: 'nobody', courseId: 'course-1', moduleId: 'm1' })
      ).toThrow(NotFoundException)
    })
  })

  describe('GET /training/enrollment — getEnrollment', () => {
    it('正常: 获取报名记录', () => {
      controller.enroll({ userId: 'u1', courseId: 'c1' })
      const enr = controller.getEnrollment('u1', 'c1')
      expect(enr.userId).toBe('u1')
    })

    it('异常: 不存在的报名记录抛出 NotFoundException', () => {
      expect(() => controller.getEnrollment('nobody', 'nocourse')).toThrow(NotFoundException)
    })
  })

  // ── 考试管理 ────────────────────────────────────────────────────

  describe('POST /training/quiz/start — startQuiz', () => {
    it('正常: 开始测验', () => {
      const attempt = controller.startQuiz({ userId: 'u1', courseId: 'course-1' })
      expect(attempt.attemptId).toBeDefined()
    })
  })

  describe('POST /training/quiz/submit — submitQuiz', () => {
    it('正常: 提交答案返回结果', () => {
      const attempt = controller.startQuiz({ userId: 'u1', courseId: 'course-1' })
      const answers = { q1: '个人休息', q2: '每周一次' }
      const result = controller.submitQuiz({ attemptId: attempt.attemptId, answers })
      expect(result.passed).toBeDefined()
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('异常: 不存在的 attemptId 抛出错误', () => {
      expect(() =>
        controller.submitQuiz({ attemptId: 'nonexistent', answers: {} })
      ).toThrow()
    })
  })

  describe('GET /training/quiz/attempts — getQuizAttempts', () => {
    it('正常: 获取测验历史', () => {
      controller.startQuiz({ userId: 'u1', courseId: 'course-1' })
      const attempts = controller.getQuizAttempts('u1', 'course-1')
      expect(attempts.length).toBeGreaterThanOrEqual(1)
    })

    it('边界: 无测验记录返回空数组', () => {
      const attempts = controller.getQuizAttempts('u1', 'nocourse')
      expect(attempts).toHaveLength(0)
    })
  })

  // ── 证书管理 ────────────────────────────────────────────────────

  describe('POST /training/certificate — generateCertificate', () => {
    it('正常: 完成课程后生成证书', () => {
      controller.enroll({ userId: 'u1', courseId: 'course-3' })
      controller.updateProgress({ userId: 'u1', courseId: 'course-3', moduleId: 'staff-m1' })
      controller.updateProgress({ userId: 'u1', courseId: 'course-3', moduleId: 'staff-m2' })

      const result = controller.generateCertificate({ userId: 'u1', courseId: 'course-3' })
      expect(result.certificateId).toBeDefined()
    })

    it('异常: 未完成课程抛出错误', () => {
      controller.enroll({ userId: 'u1', courseId: 'course-1' })
      expect(() => controller.generateCertificate({ userId: 'u1', courseId: 'course-1' })).toThrow()
    })
  })

  describe('GET /training/certificate/:id — getCertificate', () => {
    it('正常: 获取有效证书详情', () => {
      controller.enroll({ userId: 'u1', courseId: 'course-3' })
      controller.updateProgress({ userId: 'u1', courseId: 'course-3', moduleId: 'staff-m1' })
      controller.updateProgress({ userId: 'u1', courseId: 'course-3', moduleId: 'staff-m2' })
      const { certificateId } = controller.generateCertificate({ userId: 'u1', courseId: 'course-3' })

      const cert = controller.getCertificate(certificateId)
      expect(cert.valid).toBe(true)
    })

    it('异常: 无效证书抛出 NotFoundException', () => {
      expect(() => controller.getCertificate('nonexistent')).toThrow(NotFoundException)
    })
  })

  // ── 推荐与统计 ──────────────────────────────────────────────────

  describe('GET /training/recommendations — getRecommendations', () => {
    it('正常: 按角色推荐课程', () => {
      const recs = controller.getRecommendations('店长')
      expect(recs.length).toBeGreaterThan(0)
    })
  })

  describe('GET /training/stats/:userId — getUserStats', () => {
    it('正常: 获取用户统计', () => {
      controller.enroll({ userId: 'u1', courseId: 'course-1' })
      const stats = controller.getUserStats('u1')
      expect(stats.coursesEnrolled).toBeGreaterThanOrEqual(1)
    })

    it('边界: 无活动用户返回零值', () => {
      const stats = controller.getUserStats('inactive')
      expect(stats.coursesEnrolled).toBe(0)
    })
  })

  describe('GET /training/completion-rate/:courseId — getCompletionRate', () => {
    it('正常: 获取课程完成率', () => {
      const rate = controller.getCompletionRate('course-1')
      expect(rate.completionRate).toBeGreaterThanOrEqual(0)
    })

    it('边界: 无报名的课程完成率 0', () => {
      const rate = controller.getCompletionRate('nonexistent')
      expect(rate.completionRate).toBe(0)
    })
  })
})
