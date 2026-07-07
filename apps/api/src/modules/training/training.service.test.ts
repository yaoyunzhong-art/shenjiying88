// training.service.test.ts · 培训模块 Service 测试
// 🐜 自动: [training] [A] Service 测试

import { describe, it, expect, beforeEach } from 'vitest'
import { TrainingService } from './training.service'

describe('TrainingService', () => {
  let service: TrainingService

  beforeEach(() => {
    service = new TrainingService()
  })

  // ── 课程管理 ────────────────────────────────────────────────────

  describe('课程管理', () => {
    it('createCourse 创建课程并返回 ID', () => {
      const course = service.createCourse({
        title: '测试课程',
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
      expect(course.title).toBe('测试课程')
    })

    it('getCourse 返回已有课程', () => {
      const created = service.createCourse({
        title: '可查找', description: 'desc',
        modules: [{ moduleId: 'm', title: 'm', contents: [{ contentId: 'c', type: 'video', title: 'v' }], order: 1 }],
        targetRoles: ['店长'], estimatedMinutes: 30, passingScore: 60,
      })
      const found = service.getCourse(created.courseId)
      expect(found).not.toBeNull()
      expect(found!.title).toBe('可查找')
    })

    it('getCourse 对不存在的课程返回 null', () => {
      expect(service.getCourse('nonexistent')).toBeNull()
    })

    it('listCourses 返回预设课程列表', () => {
      const courses = service.listCourses()
      expect(courses.length).toBeGreaterThanOrEqual(12)
    })

    it('getCoursesByRole 按角色过滤', () => {
      const storeCourses = service.getCoursesByRole('店长')
      expect(storeCourses.length).toBeGreaterThan(0)
      storeCourses.forEach((c) => {
        expect(c.targetRoles).toContain('店长')
      })
    })

    it('getCoursesByRole 返回空数组当角色无课程', () => {
      expect(service.getCoursesByRole('不存在角色')).toHaveLength(0)
    })
  })

  // ── 报名学习 ────────────────────────────────────────────────────

  describe('报名学习', () => {
    it('enroll 创建报名记录', () => {
      const enr = service.enroll('user-1', 'course-1')
      expect(enr.userId).toBe('user-1')
      expect(enr.status).toBe('not_started')
      expect(enr.progress).toBe(0)
    })

    it('enroll 重复报名返回已有记录', () => {
      const first = service.enroll('user-1', 'course-1')
      const second = service.enroll('user-1', 'course-1')
      expect(second).toBe(first)
    })

    it('getEnrollment 返回报名记录', () => {
      service.enroll('user-1', 'course-1')
      const enr = service.getEnrollment('user-1', 'course-1')
      expect(enr).not.toBeNull()
    })

    it('getEnrollment 未报名返回 null', () => {
      expect(service.getEnrollment('nobody', 'nocourse')).toBeNull()
    })
  })

  // ── 进度管理 ────────────────────────────────────────────────────

  describe('进度管理', () => {
    it('updateProgress 更新模块完成进度', () => {
      service.enroll('user-1', 'course-3') // course-3 是店长"人员管理"课程
      service.updateProgress('user-1', 'course-3', 'staff-m1')
      const enr = service.getEnrollment('user-1', 'course-3')!
      expect(enr.progress).toBeGreaterThan(0)
      expect(enr.status).toBe('in_progress')
    })

    it('updateProgress 完成所有模块后状态为 completed', () => {
      service.enroll('user-1', 'course-3')
      service.updateProgress('user-1', 'course-3', 'staff-m1')
      service.updateProgress('user-1', 'course-3', 'staff-m2')
      const enr = service.getEnrollment('user-1', 'course-3')!
      expect(enr.progress).toBe(100)
      expect(enr.status).toBe('completed')
    })

    it('updateProgress 不会重复记录同一个模块', () => {
      service.enroll('user-1', 'course-3')
      service.updateProgress('user-1', 'course-3', 'staff-m1')
      service.updateProgress('user-1', 'course-3', 'staff-m1')
      const enr = service.getEnrollment('user-1', 'course-3')!
      expect(enr.completedModules).toHaveLength(1)
    })

    it('updateProgress 未报名不报错', () => {
      expect(() => service.updateProgress('nobody', 'course-1', 'm1')).not.toThrow()
    })
  })

  // ── 考试管理 ────────────────────────────────────────────────────

  describe('考试管理', () => {
    it('startQuiz 开始测验', () => {
      const attempt = service.startQuiz('user-1', 'course-1')
      expect(attempt.attemptId).toBeDefined()
      expect(attempt.startedAt).toBeInstanceOf(Date)
    })

    it('startQuiz 自动报名未注册用户', () => {
      const attempt = service.startQuiz('new-user', 'course-1')
      expect(attempt.attemptId).toBeDefined()
      const enr = service.getEnrollment('new-user', 'course-1')
      expect(enr).not.toBeNull()
    })

    it('startQuiz 超过最大尝试次数报错', () => {
      expect(() => {
        for (let i = 0; i < 4; i++) {
          service.startQuiz('user-1', 'course-1')
        }
      }).toThrow()
    })

    it('submitQuiz 提交答案并计算分数', () => {
      const attempt = service.startQuiz('user-1', 'course-1')
      const quizQuestions = [
        { questionId: 'q1', answer: '个人休息' },
        { questionId: 'q2', answer: '每周一次' },
      ]
      const answers: Record<string, string> = {}
      quizQuestions.forEach((q) => { answers[q.questionId] = q.answer })

      const result = service.submitQuiz(attempt.attemptId, answers)
      expect(result.completedAt).toBeInstanceOf(Date)
      expect(result.score).toBeGreaterThanOrEqual(0)
    })

    it('submitQuiz 不存在的 attempt 抛出错误', () => {
      expect(() => service.submitQuiz('nonexistent', {})).toThrow()
    })
  })

  // ── 证书管理 ────────────────────────────────────────────────────

  describe('证书管理', () => {
    it('issueCertificate 完成课程后颁发证书', () => {
      service.enroll('user-pass', 'course-3')
      service.updateProgress('user-pass', 'course-3', 'staff-m1')
      service.updateProgress('user-pass', 'course-3', 'staff-m2')
      const certId = service.issueCertificate('user-pass', 'course-3')
      expect(certId).toBeDefined()
    })

    it('issueCertificate 未完成课程抛出错误', () => {
      service.enroll('user-fail', 'course-1')
      expect(() => service.issueCertificate('user-fail', 'course-1')).toThrow()
    })

    it('issueCertificate 未报名抛出错误', () => {
      expect(() => service.issueCertificate('nobody', 'course-1')).toThrow()
    })

    it('verifyCertificate 验证有效证书', () => {
      service.enroll('user-v', 'course-3')
      service.updateProgress('user-v', 'course-3', 'staff-m1')
      service.updateProgress('user-v', 'course-3', 'staff-m2')
      const certId = service.issueCertificate('user-v', 'course-3')
      const result = service.verifyCertificate(certId)
      expect(result.valid).toBe(true)
      expect(result.userId).toBe('user-v')
    })

    it('verifyCertificate 无效证书返回 valid:false', () => {
      const result = service.verifyCertificate('nonexistent')
      expect(result.valid).toBe(false)
    })
  })

  // ── 学习路径推荐 ────────────────────────────────────────────────

  describe('学习路径', () => {
    it('recommendPath 按角色推荐课程', () => {
      const path = service.recommendPath('user-1', '店长')
      expect(path.length).toBeGreaterThan(0)
      expect(path[0].reason).toContain('店长')
    })

    it('recommendPath 不存在的角色返回空', () => {
      const path = service.recommendPath('user-1', '不存在角色')
      expect(path).toHaveLength(0)
    })
  })

  // ── 统计分析 ────────────────────────────────────────────────────

  describe('统计分析', () => {
    it('getUserStats 返回用户统计', () => {
      service.enroll('stat-user', 'course-1')
      service.enroll('stat-user', 'course-2')
      const stats = service.getUserStats('stat-user')
      expect(stats.coursesEnrolled).toBe(2)
    })

    it('getUserStats 未活动用户返回零值', () => {
      const stats = service.getUserStats('inactive-user')
      expect(stats.coursesEnrolled).toBe(0)
      expect(stats.coursesCompleted).toBe(0)
      expect(stats.averageScore).toBe(0)
    })

    it('getCourseCompletionRate 返回完成率', () => {
      service.enroll('u1', 'course-1')
      service.enroll('u2', 'course-1')
      service.enroll('u3', 'course-3')
      service.updateProgress('u3', 'course-3', 'staff-m1')
      service.updateProgress('u3', 'course-3', 'staff-m2')

      const rate = service.getCourseCompletionRate('course-3')
      expect(rate).toBeGreaterThan(0)
    })

    it('getCourseCompletionRate 无报名课程返回 0', () => {
      expect(service.getCourseCompletionRate('nonexistent')).toBe(0)
    })
  })

  // ── 边界场景 ────────────────────────────────────────────────────

  describe('边界场景', () => {
    it('calculateScore 全部正确得 100 分', () => {
      const quiz = {
        quizId: 'test-q',
        maxAttempts: 3,
        questions: [
          { questionId: 'tq1', text: 'A?', type: 'single_choice' as const, options: ['A', 'B'], correctAnswer: 'A', points: 50 },
          { questionId: 'tq2', text: 'B?', type: 'true_false' as const, correctAnswer: 'true', points: 50 },
        ],
      }
      const attempt = {
        attemptId: 'ta1', startedAt: new Date(), score: 0, passed: false,
        answers: { tq1: 'A', tq2: 'true' },
      }
      const result = (service as any).calculateScore(quiz, attempt)
      expect(result.score).toBe(100)
      expect(result.passed).toBe(true)
    })

    it('calculateScore 全部错误得 0 分', () => {
      const quiz = {
        quizId: 'test-q',
        maxAttempts: 3,
        questions: [
          { questionId: 'tq1', text: 'A?', type: 'single_choice' as const, options: ['A', 'B'], correctAnswer: 'A', points: 50 },
        ],
      }
      const attempt = {
        attemptId: 'ta2', startedAt: new Date(), score: 0, passed: false,
        answers: { tq1: 'B' },
      }
      const result = (service as any).calculateScore(quiz, attempt)
      expect(result.score).toBe(0)
      expect(result.passed).toBe(false)
    })
  })
})
