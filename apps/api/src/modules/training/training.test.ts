import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { TrainingService } from './training.service'

describe('TrainingService', () => {
  let service: TrainingService

  beforeEach(() => {
    service = new TrainingService()
  })

  // 1. createCourse → getCourse 往返
  describe('课程管理', () => {
    it('createCourse 创建课程后可以通过 getCourse 获取', () => {
      const courseData = {
        title: '测试课程',
        description: '这是一门测试课程',
        targetRoles: ['导购'],
        estimatedMinutes: 60,
        passingScore: 80,
        modules: [
          {
            moduleId: 'm1',
            title: '模块1',
            order: 1,
            contents: [
              { contentId: 'c1', type: 'video' as const, title: '视频1', durationMinutes: 20 }
            ]
          }
        ]
      }

      const created = service.createCourse(courseData)
      expect(created.courseId).toBeDefined()
      expect(created.title).toBe('测试课程')

      const retrieved = service.getCourse(created.courseId)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.courseId).toBe(created.courseId)
      expect(retrieved!.title).toBe('测试课程')
    })

    it('getCourse 对不存在的课程返回 null', () => {
      const result = service.getCourse('nonexistent')
      expect(result).toBeNull()
    })
  })

  // 11. getCoursesByRole 按角色过滤
  describe('按角色获取课程', () => {
    it('getCoursesByRole 返回指定角色的课程', () => {
      const shopCourses = service.getCoursesByRole('店长')
      expect(shopCourses.length).toBeGreaterThanOrEqual(3) // 门店运营基础、财务对账、人员管理
      expect(shopCourses.every((c) => c.targetRoles.includes('店长'))).toBe(true)
    })

    it('getCoursesByRole 对不存在的角色返回空数组', () => {
      const courses = service.getCoursesByRole('不存在的角色')
      expect(courses).toEqual([])
    })

    it('每个预设角色至少有2门课程', () => {
      const roles = ['店长', '导购', '收银', '客服']
      for (const role of roles) {
        const courses = service.getCoursesByRole(role)
        expect(courses.length).toBeGreaterThanOrEqual(2)
      }
    })
  })

  // 2. enroll 创建 Enrollment
  describe('报名学习', () => {
    it('enroll 创建报名记录', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const courseId = shopCourses[0].courseId

      const enrollment = service.enroll('user1', courseId)

      expect(enrollment.userId).toBe('user1')
      expect(enrollment.courseId).toBe(courseId)
      expect(enrollment.status).toBe('not_started')
      expect(enrollment.progress).toBe(0)
      expect(enrollment.completedModules).toEqual([])
    })

    it('enroll 对已报名用户返回现有记录', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const courseId = shopCourses[0].courseId

      const enrollment1 = service.enroll('user1', courseId)
      const enrollment2 = service.enroll('user1', courseId)

      expect(enrollment1).toBe(enrollment2)
    })

    it('getEnrollment 获取报名记录', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const courseId = shopCourses[0].courseId

      service.enroll('user1', courseId)
      const enrollment = service.getEnrollment('user1', courseId)

      expect(enrollment).not.toBeNull()
      expect(enrollment!.userId).toBe('user1')
    })

    it('getEnrollment 对未报名用户返回 null', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const courseId = shopCourses[0].courseId

      const enrollment = service.getEnrollment('nonexistent', courseId)
      expect(enrollment).toBeNull()
    })
  })

  // 3. updateProgress 更新进度
  describe('更新学习进度', () => {
    it('updateProgress 更新模块完成状态和进度', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId
      const moduleId = course.modules[0].moduleId

      service.enroll('user1', courseId)
      service.updateProgress('user1', courseId, moduleId)

      const enrollment = service.getEnrollment('user1', courseId)
      expect(enrollment!.completedModules).toContain(moduleId)
      expect(enrollment!.progress).toBeGreaterThan(0)
    })

    it('updateProgress 所有模块完成时进度为100%', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId

      service.enroll('user1', courseId)

      for (const module of course.modules) {
        service.updateProgress('user1', courseId, module.moduleId)
      }

      const enrollment = service.getEnrollment('user1', courseId)
      expect(enrollment!.progress).toBe(100)
      expect(enrollment!.status).toBe('completed')
    })

    it('updateProgress 部分完成时状态为 in_progress', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId

      service.enroll('user1', courseId)

      // 只完成第一个模块
      if (course.modules.length > 0) {
        service.updateProgress('user1', courseId, course.modules[0].moduleId)
      }

      const enrollment = service.getEnrollment('user1', courseId)
      expect(enrollment!.status).toBe('in_progress')
    })
  })

  // 4. startQuiz → submitQuiz → calculateScore
  describe('考试流程', () => {
    it('startQuiz 开始考试创建 QuizAttempt', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0] // 门店运营基础有quiz
      const courseId = course.courseId

      service.enroll('user1', courseId)
      const attempt = service.startQuiz('user1', courseId)

      expect(attempt.attemptId).toBeDefined()
      expect(attempt.startedAt).toBeInstanceOf(Date)
      expect(attempt.score).toBe(0)
      expect(attempt.passed).toBe(false)
    })

    it('submitQuiz 提交答案并计算分数', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId
      const quiz = course.modules.find((m) => m.quiz)!.quiz!

      service.enroll('user1', courseId)
      const attempt = service.startQuiz('user1', courseId)

      // 准备正确答案
      const answers: Record<string, string | string[]> = {}
      for (const q of quiz.questions) {
        if (Array.isArray(q.correctAnswer)) {
          answers[q.questionId] = [...q.correctAnswer]
        } else {
          answers[q.questionId] = String(q.correctAnswer)
        }
      }

      const result = service.submitQuiz(attempt.attemptId, answers)

      expect(result.score).toBe(100)
      expect(result.passed).toBe(true)
      expect(result.completedAt).toBeInstanceOf(Date)
    })

    it('submitQuiz 错误答案导致不及格', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId
      const quiz = course.modules.find((m) => m.quiz)!.quiz!

      service.enroll('user1', courseId)
      const attempt = service.startQuiz('user1', courseId)

      // 准备错误答案
      const answers: Record<string, string | string[]> = {}
      for (const q of quiz.questions) {
        answers[q.questionId] = 'wrong_answer'
      }

      const result = service.submitQuiz(attempt.attemptId, answers)

      expect(result.score).toBeLessThan(80)
      expect(result.passed).toBe(false)
    })

    it('calculateScore 正确计算得分', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const quiz = course.modules.find((m) => m.quiz)!.quiz!

      const attempt = {
        attemptId: 'test-attempt',
        startedAt: new Date(),
        score: 0,
        passed: false,
        answers: {
          [quiz.questions[0].questionId]: quiz.questions[0].correctAnswer
        } as Record<string, string | string[]>
      }

      const { score, passed, feedback } = service.calculateScore(quiz, attempt)

      expect(score).toBeGreaterThan(0)
      expect(typeof passed).toBe('boolean')
      expect(feedback[quiz.questions[0].questionId].correct).toBe(true)
    })
  })

  // 5. getQuizAttempts 返回历史
  describe('获取考试历史', () => {
    it('getQuizAttempts 返回用户的考试记录', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId

      service.enroll('user1', courseId)
      service.startQuiz('user1', courseId)

      const attempts = service.getQuizAttempts('user1', courseId)

      expect(attempts.length).toBeGreaterThan(0)
    })

    it('getQuizAttempts 对未参加考试的用户返回空数组', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const courseId = shopCourses[0].courseId

      const attempts = service.getQuizAttempts('nonexistent', courseId)

      expect(attempts).toEqual([])
    })
  })

  // 6. issueCertificate 生成证书
  describe('证书生成', () => {
    it('issueCertificate 生成证书', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId

      service.enroll('user1', courseId)

      // 完成所有模块
      for (const module of course.modules) {
        service.updateProgress('user1', courseId, module.moduleId)
      }

      const certificateId = service.issueCertificate('user1', courseId)

      expect(certificateId).toBeDefined()
      expect(certificateId.length).toBeGreaterThan(0) // UUID格式
    })

    it('issueCertificate 未完成课程时抛出错误', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const courseId = shopCourses[0].courseId

      service.enroll('user1', courseId)

      expect(() => service.issueCertificate('user1', courseId)).toThrow('用户未完成课程或未通过考试')
    })

    it('issueCertificate 未报名时抛出错误', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const courseId = shopCourses[0].courseId

      expect(() => service.issueCertificate('nonexistent', courseId)).toThrow('用户未报名该课程')
    })
  })

  // 7. verifyCertificate 验证通过
  describe('证书验证', () => {
    it('verifyCertificate 验证有效的证书', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId

      service.enroll('user1', courseId)

      // 完成所有模块
      for (const module of course.modules) {
        service.updateProgress('user1', courseId, module.moduleId)
      }

      const certificateId = service.issueCertificate('user1', courseId)
      const verification = service.verifyCertificate(certificateId)

      expect(verification.valid).toBe(true)
      expect(verification.userId).toBe('user1')
      expect(verification.courseId).toBe(courseId)
      expect(verification.issuedAt).toBeInstanceOf(Date)
    })

    it('verifyCertificate 对无效证书返回 valid: false', () => {
      const verification = service.verifyCertificate('invalid-certificate-id')

      expect(verification.valid).toBe(false)
      expect(verification.userId).toBeUndefined()
    })
  })

  // 8. recommendPath 返回路径推荐
  describe('学习路径推荐', () => {
    it('recommendPath 返回指定角色的学习路径', () => {
      const path = service.recommendPath('user1', '店长')

      expect(path.length).toBeGreaterThan(0)
      expect(path[0].courseId).toBeDefined()
      expect(path[0].order).toBeDefined()
      expect(path[0].reason).toBeDefined()
    })

    it('recommendPath 对不存在的角色返回空数组', () => {
      const path = service.recommendPath('user1', '不存在的角色')

      expect(path).toEqual([])
    })
  })

  // 9. getUserStats 统计正确
  describe('用户统计', () => {
    it('getUserStats 返回正确的统计数据', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId

      service.enroll('user1', courseId)

      // 完成一个模块
      if (course.modules.length > 0) {
        service.updateProgress('user1', courseId, course.modules[0].moduleId)
      }

      const stats = service.getUserStats('user1')

      expect(stats.coursesEnrolled).toBe(1)
      expect(stats.coursesCompleted).toBe(0) // 还没全部完成
      expect(stats.totalStudyMinutes).toBeGreaterThanOrEqual(0)
      expect(stats.certificatesIssued).toBe(0)
      expect(typeof stats.averageScore).toBe('number')
    })

    it('getUserStats 对不存在的用户返回零值', () => {
      const stats = service.getUserStats('nonexistent')

      expect(stats.coursesEnrolled).toBe(0)
      expect(stats.coursesCompleted).toBe(0)
      expect(stats.totalStudyMinutes).toBe(0)
      expect(stats.certificatesIssued).toBe(0)
      expect(stats.averageScore).toBe(0)
    })
  })

  // 10. getCourseCompletionRate 计算完成率
  describe('课程完成率', () => {
    it('getCourseCompletionRate 正确计算完成率', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[0]
      const courseId = course.courseId

      service.enroll('user1', courseId)

      // 完成所有模块
      for (const module of course.modules) {
        service.updateProgress('user1', courseId, module.moduleId)
      }

      const rate = service.getCourseCompletionRate(courseId)

      expect(rate).toBe(100)
    })

    it('getCourseCompletionRate 无人报名时返回0', () => {
      // 使用一个没有报名的课程ID
      const shopCourses = service.getCoursesByRole('导购')
      const courseId = shopCourses[0].courseId

      // 创建一个新课程
      const newCourse = service.createCourse({
        title: '新课程',
        description: '描述',
        targetRoles: ['测试'],
        estimatedMinutes: 30,
        passingScore: 80,
        modules: []
      })

      const rate = service.getCourseCompletionRate(newCourse.courseId)

      expect(rate).toBe(0)
    })
  })

  // 额外测试：多选题评分
  describe('多选题评分', () => {
    it('多选题部分答对时计算正确得分', () => {
      const shopCourses = service.getCoursesByRole('店长')
      const course = shopCourses[2] // 人员管理有多选题
      const courseId = course.courseId
      const quiz = course.modules.find((m) => m.quiz)!.quiz!

      service.enroll('user1', courseId)
      const attempt = service.startQuiz('user1', courseId)

      // 只提交第一个问题的答案（多选题）
      const mq = quiz.questions.find((q) => q.type === 'multiple_choice')
      if (mq) {
        const answers: Record<string, string | string[]> = {
          [mq.questionId]: ['销售额'] // 只选了一个，正确答案是3个
        }

        const result = service.submitQuiz(attempt.attemptId, answers)

        expect(result.score).toBeLessThan(100)
        expect(result.score).toBeGreaterThan(0)
      }
    })
  })
})
