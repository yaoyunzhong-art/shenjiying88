/**
 * 🐜 自动: [training] [C] 8角色测试补全
 *
 * 培训模块 - 8 角色视角端到端测试
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TrainingService } from './training.service'

describe('TrainingModule - 8角色测试', () => {
  let service: TrainingService

  beforeEach(() => {
    service = new TrainingService()
  })

  // ─── 👔 店长 ─────────────────────────────────────────────────
  describe('👔 店长', () => {
    it('店长应能看到门店运营相关课程', () => {
      const courses = service.getCoursesByRole('店长')
      const titles = courses.map(c => c.title)
      expect(titles).toContain('门店运营基础')
      expect(titles).toContain('财务对账')
      expect(titles).toContain('人员管理')
      expect(courses.length).toBeGreaterThanOrEqual(3)
    })

    it('店长报名并完成课程应获得证书', () => {
      const course = service.getCoursesByRole('店长')[0]
      service.enroll('shop-manager-01', course.courseId)
      course.modules.forEach(m => service.updateProgress('shop-manager-01', course.courseId, m.moduleId))
      const certId = service.issueCertificate('shop-manager-01', course.courseId)
      expect(certId).toBeDefined()
      const validation = service.verifyCertificate(certId)
      expect(validation.valid).toBe(true)
    })

    it('店长查看自身培训统计', () => {
      const stats = service.getUserStats('shop-manager-01-progress')
      // 新用户零值
      expect(stats.coursesEnrolled).toBe(0)
      expect(stats.coursesCompleted).toBe(0)
    })
  })

  // ─── 🛒 前台 ─────────────────────────────────────────────────
  describe('🛒 前台', () => {
    it('前台（收银）应看到收银系统操作和促销核销课程', () => {
      const courses = service.getCoursesByRole('收银')
      const titles = courses.map(c => c.title)
      expect(titles).toContain('收银系统操作')
      expect(titles).toContain('促销核销')
      expect(titles).toContain('退款处理')
    })

    it('前台参加考试并获得分数', () => {
      const courses = service.getCoursesByRole('收银')
      const course = courses.find(c => c.modules.some(m => m.quiz))
      expect(course).toBeDefined()

      service.enroll('cashier-01', course!.courseId)
      const quiz = course!.modules.find(m => m.quiz)!.quiz!
      const attempt = service.startQuiz('cashier-01', course!.courseId)
      const answers: Record<string, string | string[]> = {}
      quiz.questions.forEach(q => {
        if (Array.isArray(q.correctAnswer)) {
          answers[q.questionId] = q.correctAnswer
        } else {
          answers[q.questionId] = q.correctAnswer as string
        }
      })
      const result = service.submitQuiz(attempt.attemptId, answers)
      expect(result.score).toBeGreaterThanOrEqual(80)
      expect(result.passed).toBe(true)
    })

    it('前台超次数考试应报错', () => {
      const courses = service.getCoursesByRole('收银')
      const course = courses.find(c => c.modules.some(m => m.quiz))
      expect(course).toBeDefined()
      const quiz = course!.modules.find(m => m.quiz)!.quiz!

      service.enroll('cashier-overlimit', course!.courseId)
      // 先耗尽所有尝试次数
      for (let i = 0; i < quiz.maxAttempts; i++) {
        const attempt = service.startQuiz('cashier-overlimit', course!.courseId)
        const answers: Record<string, string | string[]> = {}
        quiz.questions.forEach(q => {
          if (Array.isArray(q.correctAnswer)) {
            answers[q.questionId] = q.correctAnswer
          } else {
            answers[q.questionId] = q.correctAnswer as string
          }
        })
        service.submitQuiz(attempt.attemptId, answers)
      }
      // 再次尝试应抛出错误
      expect(() => service.startQuiz('cashier-overlimit', course!.courseId))
        .toThrow('已达到最大考试次数')
    })
  })

  // ─── 👥 HR ───────────────────────────────────────────────────
  describe('👥 HR', () => {
    it('HR 应能跨角色查看课程列表', () => {
      const allCourses = service.listCourses()
      const roles = new Set(allCourses.flatMap(c => c.targetRoles))
      expect(roles.size).toBeGreaterThanOrEqual(3) // 至少店长/导购/收银/客服
    })

    it('HR 查询学员完成率', () => {
      // 模拟一些学员学习
      const course = service.getCoursesByRole('店长')[0]
      service.enroll('hr-staff-01', course.courseId)
      service.updateProgress('hr-staff-01', course.courseId, course.modules[0].moduleId)

      service.enroll('hr-staff-02', course.courseId)
      course.modules.forEach(m => service.updateProgress('hr-staff-02', course.courseId, m.moduleId))

      const rate = service.getCourseCompletionRate(course.courseId)
      expect(rate).toBe(50) // 1/2 完成
    })
  })

  // ─── 🔧 安监 ─────────────────────────────────────────────────
  describe('🔧 安监', () => {
    it('安监角色查询 - 返回空课程', () => {
      const courses = service.getCoursesByRole('安监')
      // 预设课程中没有专门为安监设计的
      // 安全角色可能需要合规、安全检查相关培训
      expect(courses.length).toBe(0)
    })

    it('安监参加课程应有完整的学员记录', () => {
      // 安监可以参加通用课程
      const course = service.listCourses()[0]
      service.enroll('security-01', course.courseId)
      const enrollment = service.getEnrollment('security-01', course.courseId)
      expect(enrollment).not.toBeNull()
      expect(enrollment!.status).toBe('not_started')
      expect(enrollment!.progress).toBe(0)
    })

    it('安监重复报名应返回已有记录', () => {
      const course = service.listCourses()[0]
      const e1 = service.enroll('security-01-dup', course.courseId)
      const e2 = service.enroll('security-01-dup', course.courseId)
      expect(e1.enrolledAt.toISOString()).toBe(e2.enrolledAt.toISOString())
    })
  })

  // ─── 🎮 导玩员 ───────────────────────────────────────────────
  describe('🎮 导玩员', () => {
    it('导玩员应看到导购相关产品知识课程', () => {
      const courses = service.getCoursesByRole('导购')
      const titles = courses.map(c => c.title)
      expect(titles).toContain('产品知识')
      expect(titles).toContain('销售技巧')
      expect(titles).toContain('会员运营')
    })

    it('导玩员学习进度更新正确', () => {
      const course = service.getCoursesByRole('导购')[0]
      service.enroll('guide-01', course.courseId)

      // 完成第一个模块
      course.modules.forEach(m => {
        service.updateProgress('guide-01', course.courseId, m.moduleId)
      })
      const enrollment = service.getEnrollment('guide-01', course.courseId)
      expect(enrollment!.progress).toBe(100)
      expect(enrollment!.status).toBe('completed')
    })
  })

  // ─── 🎯 运行专员 ─────────────────────────────────────────────
  describe('🎯 运行专员', () => {
    it('运行专员查询推荐学习路径', () => {
      const path = service.recommendPath('ops-01', '运营')
      // 可退化为通用推荐
      expect(Array.isArray(path)).toBe(true)
    })

    it('运行专员查看学员整体统计', () => {
      // 模拟多个学员数据
      const course = service.listCourses()[0]
      service.enroll('ops-student-01', course.courseId)
      service.enroll('ops-student-02', course.courseId)

      const rate = service.getCourseCompletionRate(course.courseId)
      expect(typeof rate).toBe('number')
      expect(rate).toBeGreaterThanOrEqual(0)
    })
  })

  // ─── 🤝 团建 ─────────────────────────────────────────────────
  describe('🤝 团建', () => {
    it('团建角色可查看跨部门培训课程', () => {
      const allCourses = service.listCourses()
      const targetRoles = [...new Set(allCourses.flatMap(c => c.targetRoles))]
      expect(targetRoles).toContain('店长')
      expect(targetRoles).toContain('导购')
      expect(targetRoles).toContain('收银')
      expect(targetRoles).toContain('客服')
    })

    it('团建举办培训 - 统计参与人数', () => {
      const course = service.listCourses()[0]
      for (let i = 0; i < 10; i++) {
        service.enroll(`team-building-user-${i}`, course.courseId)
      }
      const rate = service.getCourseCompletionRate(course.courseId)
      // 无人完成
      expect(rate).toBe(0)

      // 5人完成
      for (let i = 0; i < 5; i++) {
        course.modules.forEach(m => service.updateProgress(`team-building-user-${i}`, course.courseId, m.moduleId))
      }
      const rateAfter = service.getCourseCompletionRate(course.courseId)
      expect(rateAfter).toBe(50)
    })
  })

  // ─── 📢 营销 ─────────────────────────────────────────────────
  describe('📢 营销', () => {
    it('营销角色查看所有课程以设计培训推广', () => {
      const courses = service.listCourses()
      expect(courses.length).toBeGreaterThanOrEqual(12)
      const allTitles = courses.map(c => c.title)
      expect(allTitles).toContain('产品知识')
      expect(allTitles).toContain('销售技巧')
      expect(allTitles).toContain('门店运营基础')
    })

    it('营销设计推广时查看课程详情', () => {
      const courses = service.listCourses()
      const course = service.getCourse(courses[0].courseId)
      expect(course).not.toBeNull()
      expect(course!.modules.length).toBeGreaterThan(0)
      expect(course!.targetRoles).toBeDefined()
      expect(course!.estimatedMinutes).toBeGreaterThan(0)
    })
  })
})
