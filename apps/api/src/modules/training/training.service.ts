import { randomUUID } from 'crypto'
import { Injectable } from '@nestjs/common'

export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed'
export type ContentType = 'video' | 'document' | 'quiz' | 'assignment' | 'live'

// Types migrated to training.entity.ts — re-exports above

export interface Course {
  courseId: string
  title: string
  description: string
  modules: CourseModule[]
  targetRoles: string[]
  estimatedMinutes: number
  passingScore: number
  certificateTemplate?: string
}

export interface CourseModule {
  moduleId: string
  title: string
  contents: ModuleContent[]
  quiz?: Quiz
  order: number
}

export interface ModuleContent {
  contentId: string
  type: ContentType
  title: string
  url?: string
  durationMinutes?: number
  transcript?: string
}

export interface Quiz {
  quizId: string
  questions: QuizQuestion[]
  timeLimitMinutes?: number
  maxAttempts: number
}

export interface QuizQuestion {
  questionId: string
  text: string
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
}

export interface Enrollment {
  userId: string
  courseId: string
  enrolledAt: Date
  progress: number
  status: CourseStatus
  completedModules: string[]
  quizAttempts: QuizAttempt[]
  certificateId?: string
}

export interface QuizAttempt {
  attemptId: string
  startedAt: Date
  completedAt?: Date
  score: number
  passed: boolean
  answers: Record<string, string | string[]>
}

interface Certificate {
  certificateId: string
  userId: string
  courseId: string
  issuedAt: Date
  valid: true
}

@Injectable()
export class TrainingService {
  private courses = new Map<string, Course>()
  private enrollments = new Map<string, Enrollment>() // key: `${userId}:${courseId}`
  private certificates = new Map<string, Certificate>()
  private nextCourseId = 0
  private nextQuizId = 0

  constructor() {
    this.initPresetCourses()
  }

  private initPresetCourses(): void {
    // 店长：门店运营基础
    this.createCourse({
      title: '门店运营基础',
      description: '学习门店日常运营管理的核心知识和技能',
      targetRoles: ['店长'],
      estimatedMinutes: 120,
      passingScore: 80,
      modules: [
        {
          moduleId: 'shop-m1',
          title: '门店日常管理',
          order: 1,
          contents: [
            { contentId: 'shop-c1', type: 'video', title: '晨会管理', url: 'https://example.com/video1', durationMinutes: 20 },
            { contentId: 'shop-c2', type: 'document', title: '门店卫生标准', url: 'https://example.com/doc1' }
          ]
        },
        {
          moduleId: 'shop-m2',
          title: '库存管理',
          order: 2,
          contents: [
            { contentId: 'shop-c3', type: 'video', title: '库存盘点流程', url: 'https://example.com/video2', durationMinutes: 25 }
          ],
          quiz: {
            quizId: 'shop-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'q1', text: '门店日常管理不包括以下哪项？', type: 'single_choice', options: ['晨会', '库存盘点', '个人休息', '陈列调整'], correctAnswer: '个人休息', points: 20, explanation: '门店日常管理包括晨会、库存盘点、陈列调整等' },
              { questionId: 'q2', text: '库存盘点频率应为？', type: 'single_choice', options: ['每周一次', '每月一次', '每天一次', '每年一次'], correctAnswer: '每周一次', points: 20 }
            ]
          }
        }
      ]
    })

    // 店长：财务对账
    this.createCourse({
      title: '财务对账',
      description: '掌握门店财务对账流程和常见问题处理',
      targetRoles: ['店长'],
      estimatedMinutes: 90,
      passingScore: 80,
      modules: [
        {
          moduleId: 'finance-m1',
          title: '对账基础',
          order: 1,
          contents: [
            { contentId: 'finance-c1', type: 'video', title: '对账流程讲解', url: 'https://example.com/video3', durationMinutes: 30 }
          ]
        },
        {
          moduleId: 'finance-m2',
          title: '常见问题',
          order: 2,
          contents: [
            { contentId: 'finance-c2', type: 'document', title: '对账异常处理手册', url: 'https://example.com/doc2' }
          ],
          quiz: {
            quizId: 'finance-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'fq1', text: '对账的主要目的是？', type: 'single_choice', options: ['核对库存', '核对收支', '核对人员', '核对设备'], correctAnswer: '核对收支', points: 25 },
              { questionId: 'fq2', text: '以下哪种情况需要标记异常？', type: 'true_false', correctAnswer: 'true', points: 25 }
            ]
          }
        }
      ]
    })

    // 店长：人员管理
    this.createCourse({
      title: '人员管理',
      description: '学习店员排班、培训和绩效考核方法',
      targetRoles: ['店长'],
      estimatedMinutes: 100,
      passingScore: 80,
      modules: [
        {
          moduleId: 'staff-m1',
          title: '排班管理',
          order: 1,
          contents: [
            { contentId: 'staff-c1', type: 'video', title: '智能排班系统使用', url: 'https://example.com/video4', durationMinutes: 20 }
          ]
        },
        {
          moduleId: 'staff-m2',
          title: '绩效考核',
          order: 2,
          contents: [
            { contentId: 'staff-c2', type: 'document', title: '绩效考核模板', url: 'https://example.com/doc3' }
          ],
          quiz: {
            quizId: 'staff-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'sq1', text: '绩效考核维度包括？', type: 'multiple_choice', options: ['销售额', '客户满意度', '出勤率', '个人爱好'], correctAnswer: ['销售额', '客户满意度', '出勤率'], points: 30 }
            ]
          }
        }
      ]
    })

    // 导购：产品知识
    this.createCourse({
      title: '产品知识',
      description: '全面了解产品特点、卖点和使用方法',
      targetRoles: ['导购'],
      estimatedMinutes: 80,
      passingScore: 80,
      modules: [
        {
          moduleId: 'product-m1',
          title: '产品分类',
          order: 1,
          contents: [
            { contentId: 'product-c1', type: 'video', title: '产品线介绍', url: 'https://example.com/video5', durationMinutes: 25 }
          ]
        },
        {
          moduleId: 'product-m2',
          title: '卖点提炼',
          order: 2,
          contents: [
            { contentId: 'product-c2', type: 'document', title: '卖点话术手册', url: 'https://example.com/doc4' }
          ],
          quiz: {
            quizId: 'product-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'pq1', text: '产品卖点的核心是什么？', type: 'single_choice', options: ['价格低', '差异化价值', '外观好看', '品牌大'], correctAnswer: '差异化价值', points: 25 }
            ]
          }
        }
      ]
    })

    // 导购：销售技巧
    this.createCourse({
      title: '销售技巧',
      description: '提升销售转化率和客户满意度',
      targetRoles: ['导购'],
      estimatedMinutes: 110,
      passingScore: 80,
      modules: [
        {
          moduleId: 'sales-m1',
          title: '客户需求分析',
          order: 1,
          contents: [
            { contentId: 'sales-c1', type: 'video', title: '需求挖掘技巧', url: 'https://example.com/video6', durationMinutes: 30 }
          ]
        },
        {
          moduleId: 'sales-m2',
          title: '成交技巧',
          order: 2,
          contents: [
            { contentId: 'sales-c2', type: 'document', title: '促成成交话术', url: 'https://example.com/doc5' }
          ],
          quiz: {
            quizId: 'sales-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'sq2', text: 'FAB法则指？', type: 'single_choice', options: ['功能、优势、收益', '价格、价值、服务', '功能、价值、利益', '服务、品质、收益'], correctAnswer: '功能、优势、利益', points: 30 }
            ]
          }
        }
      ]
    })

    // 导购：会员运营
    this.createCourse({
      title: '会员运营',
      description: '维护会员关系，提升复购率',
      targetRoles: ['导购'],
      estimatedMinutes: 90,
      passingScore: 80,
      modules: [
        {
          moduleId: 'vip-m1',
          title: '会员权益',
          order: 1,
          contents: [
            { contentId: 'vip-c1', type: 'video', title: '会员体系解读', url: 'https://example.com/video7', durationMinutes: 20 }
          ]
        },
        {
          moduleId: 'vip-m2',
          title: '会员维护',
          order: 2,
          contents: [
            { contentId: 'vip-c2', type: 'document', title: '会员维护SOP', url: 'https://example.com/doc6' }
          ],
          quiz: {
            quizId: 'vip-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'vq1', text: '会员维护的关键指标是？', type: 'single_choice', options: ['新会员数量', '复购率', '退货率', '广告曝光'], correctAnswer: '复购率', points: 25 }
            ]
          }
        }
      ]
    })

    // 收银：收银系统操作
    this.createCourse({
      title: '收银系统操作',
      description: '熟练掌握收银系统各项功能',
      targetRoles: ['收银'],
      estimatedMinutes: 60,
      passingScore: 80,
      modules: [
        {
          moduleId: 'pos-m1',
          title: '基础操作',
          order: 1,
          contents: [
            { contentId: 'pos-c1', type: 'video', title: '收银界面介绍', url: 'https://example.com/video8', durationMinutes: 15 }
          ]
        },
        {
          moduleId: 'pos-m2',
          title: '高级功能',
          order: 2,
          contents: [
            { contentId: 'pos-c2', type: 'document', title: '收银操作手册', url: 'https://example.com/doc7' }
          ],
          quiz: {
            quizId: 'pos-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'pq2', text: '如何进行退货操作？', type: 'single_choice', options: ['直接删除', '使用退货功能', '忽略不计', '重新扫描'], correctAnswer: '使用退货功能', points: 20 }
            ]
          }
        }
      ]
    })

    // 收银：促销核销
    this.createCourse({
      title: '促销核销',
      description: '各类促销活动的核销流程和注意事项',
      targetRoles: ['收银'],
      estimatedMinutes: 50,
      passingScore: 80,
      modules: [
        {
          moduleId: 'promo-m1',
          title: '促销类型',
          order: 1,
          contents: [
            { contentId: 'promo-c1', type: 'video', title: '促销活动分类', url: 'https://example.com/video9', durationMinutes: 15 }
          ]
        },
        {
          moduleId: 'promo-m2',
          title: '核销流程',
          order: 2,
          contents: [
            { contentId: 'promo-c2', type: 'document', title: '核销操作指南', url: 'https://example.com/doc8' }
          ],
          quiz: {
            quizId: 'promo-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'prq1', text: '优惠券核销的正确顺序是？', type: 'single_choice', options: ['先优惠券后折扣', '先折扣后优惠券', '无所谓', '不能同时使用'], correctAnswer: '先折扣后优惠券', points: 25 }
            ]
          }
        }
      ]
    })

    // 收银：退款处理
    this.createCourse({
      title: '退款处理',
      description: '规范退款流程，妥善处理客户退款需求',
      targetRoles: ['收银'],
      estimatedMinutes: 45,
      passingScore: 80,
      modules: [
        {
          moduleId: 'refund-m1',
          title: '退款政策',
          order: 1,
          contents: [
            { contentId: 'refund-c1', type: 'video', title: '退款政策解读', url: 'https://example.com/video10', durationMinutes: 15 }
          ]
        },
        {
          moduleId: 'refund-m2',
          title: '操作流程',
          order: 2,
          contents: [
            { contentId: 'refund-c2', type: 'document', title: '退款操作流程', url: 'https://example.com/doc9' }
          ],
          quiz: {
            quizId: 'refund-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'rq1', text: '退款需要哪些权限？', type: 'single_choice', options: ['普通收银员', '店长授权', '财务审批', '无需权限'], correctAnswer: '店长授权', points: 25 }
            ]
          }
        }
      ]
    })

    // 客服：FAQ 处理
    this.createCourse({
      title: 'FAQ 处理',
      description: '常见问题解答技巧和服务规范',
      targetRoles: ['客服'],
      estimatedMinutes: 70,
      passingScore: 80,
      modules: [
        {
          moduleId: 'faq-m1',
          title: '常见问题',
          order: 1,
          contents: [
            { contentId: 'faq-c1', type: 'video', title: 'FAQ 使用方法', url: 'https://example.com/video11', durationMinutes: 20 }
          ]
        },
        {
          moduleId: 'faq-m2',
          title: '解答技巧',
          order: 2,
          contents: [
            { contentId: 'faq-c2', type: 'document', title: '问题解答话术', url: 'https://example.com/doc10' }
          ],
          quiz: {
            quizId: 'faq-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'faqq1', text: '处理 FAQ 的关键是？', type: 'single_choice', options: ['快速复制答案', '准确理解问题', '延迟回复', '转交上级'], correctAnswer: '准确理解问题', points: 25 }
            ]
          }
        }
      ]
    })

    // 客服：投诉升级
    this.createCourse({
      title: '投诉升级',
      description: '投诉处理流程和升级机制',
      targetRoles: ['客服'],
      estimatedMinutes: 65,
      passingScore: 80,
      modules: [
        {
          moduleId: 'escalate-m1',
          title: '投诉分类',
          order: 1,
          contents: [
            { contentId: 'escalate-c1', type: 'video', title: '投诉类型识别', url: 'https://example.com/video12', durationMinutes: 20 }
          ]
        },
        {
          moduleId: 'escalate-m2',
          title: '升级流程',
          order: 2,
          contents: [
            { contentId: 'escalate-c2', type: 'document', title: '升级处理指南', url: 'https://example.com/doc11' }
          ],
          quiz: {
            quizId: 'escalate-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'eq1', text: '投诉升级的标准是？', type: 'single_choice', options: ['客户要求', '超出权限范围', '任何投诉', '拒绝回复时'], correctAnswer: '超出权限范围', points: 30 }
            ]
          }
        }
      ]
    })

    // 客服：退款跟进
    this.createCourse({
      title: '退款跟进',
      description: '客户退款需求的处理和跟进技巧',
      targetRoles: ['客服'],
      estimatedMinutes: 55,
      passingScore: 80,
      modules: [
        {
          moduleId: 'cs-refund-m1',
          title: '退款沟通',
          order: 1,
          contents: [
            { contentId: 'cs-refund-c1', type: 'video', title: '退款沟通技巧', url: 'https://example.com/video13', durationMinutes: 20 }
          ]
        },
        {
          moduleId: 'cs-refund-m2',
          title: '进度跟踪',
          order: 2,
          contents: [
            { contentId: 'cs-refund-c2', type: 'document', title: '退款进度查询', url: 'https://example.com/doc12' }
          ],
          quiz: {
            quizId: 'cs-refund-q1',
            maxAttempts: 3,
            questions: [
              { questionId: 'crq1', text: '退款处理时限是多久？', type: 'single_choice', options: ['1天', '3-7天', '30天', '无限期'], correctAnswer: '3-7天', points: 25 }
            ]
          }
        }
      ]
    })
  }

  // ── 课程管理 ──────────────────────────────────────────────────────

  createCourse(course: Omit<Course, 'courseId'>): Course {
    const courseId = `course-${++this.nextCourseId}`
    const newCourse: Course = { ...course, courseId }
    this.courses.set(courseId, newCourse)
    return newCourse
  }

  getCourse(courseId: string): Course | null {
    return this.courses.get(courseId) || null
  }

  listCourses(): Course[] {
    return Array.from(this.courses.values())
  }

  getCoursesByRole(role: string): Course[] {
    return Array.from(this.courses.values()).filter((course) =>
      course.targetRoles.includes(role)
    )
  }

  // ── 报名学习 ──────────────────────────────────────────────────────

  enroll(userId: string, courseId: string): Enrollment {
    const key = `${userId}:${courseId}`
    const existing = this.enrollments.get(key)
    if (existing) {
      return existing
    }

    const enrollment: Enrollment = {
      userId,
      courseId,
      enrolledAt: new Date(),
      progress: 0,
      status: 'not_started',
      completedModules: [],
      quizAttempts: []
    }
    this.enrollments.set(key, enrollment)
    return enrollment
  }

  updateProgress(userId: string, courseId: string, moduleId: string): void {
    const key = `${userId}:${courseId}`
    const enrollment = this.enrollments.get(key)
    if (!enrollment) {
      return
    }

    const course = this.courses.get(courseId)
    if (!course) {
      return
    }

    if (!enrollment.completedModules.includes(moduleId)) {
      enrollment.completedModules.push(moduleId)
    }

    // 计算进度
    const totalModules = course.modules.length
    enrollment.progress = Math.round((enrollment.completedModules.length / totalModules) * 100)

    // 更新状态
    if (enrollment.progress === 100) {
      enrollment.status = 'completed'
    } else if (enrollment.progress > 0) {
      enrollment.status = 'in_progress'
    }
  }

  getEnrollment(userId: string, courseId: string): Enrollment | null {
    return this.enrollments.get(`${userId}:${courseId}`) || null
  }

  // ── 考试 ─────────────────────────────────────────────────────────

  startQuiz(userId: string, courseId: string): QuizAttempt {
    const key = `${userId}:${courseId}`
    let enrollment = this.enrollments.get(key)

    if (!enrollment) {
      enrollment = this.enroll(userId, courseId)
    }

    const course = this.courses.get(courseId)
    if (!course) {
      throw new Error('课程不存在')
    }

    // 获取课程的 quiz
    const quiz = this.findCourseQuiz(course)
    if (!quiz) {
      throw new Error('课程没有考试')
    }

    // 检查尝试次数
    const attempts = enrollment.quizAttempts.filter((a) => !a.completedAt || a.completedAt)
    if (attempts.length >= quiz.maxAttempts) {
      throw new Error('已达到最大考试次数')
    }

    const attempt: QuizAttempt = {
      attemptId: randomUUID(),
      startedAt: new Date(),
      score: 0,
      passed: false,
      answers: {}
    }

    enrollment.quizAttempts.push(attempt)
    return attempt
  }

  submitQuiz(attemptId: string, answers: Record<string, string | string[]>): QuizAttempt {
    // 找到 attempt
    let foundAttempt: QuizAttempt | null = null
    let foundEnrollment: Enrollment | null = null
    let foundQuiz: Quiz | null = null

    for (const enrollment of this.enrollments.values()) {
      for (const attempt of enrollment.quizAttempts) {
        if (attempt.attemptId === attemptId) {
          foundAttempt = attempt
          foundEnrollment = enrollment
          const course = this.courses.get(enrollment.courseId)
          if (course) {
            foundQuiz = this.findCourseQuiz(course) || null
          }
          break
        }
      }
      if (foundAttempt) break
    }

    if (!foundAttempt || !foundEnrollment || !foundQuiz) {
      throw new Error('考试记录不存在')
    }

    foundAttempt.answers = answers
    foundAttempt.completedAt = new Date()

    // 计算分数
    const { score, passed } = this.calculateScore(foundQuiz, foundAttempt)
    foundAttempt.score = score
    foundAttempt.passed = passed

    // 更新 enrollment 状态
    if (passed) {
      foundEnrollment.status = 'passed'
    } else {
      foundEnrollment.status = 'failed'
    }

    return foundAttempt
  }

  calculateScore(
    quiz: Quiz,
    attempt: QuizAttempt
  ): { score: number; passed: boolean; feedback: Record<string, { correct: boolean; explanation?: string }> } {
    let earnedPoints = 0
    let totalPoints = 0
    const feedback: Record<string, { correct: boolean; explanation?: string }> = {}

    for (const question of quiz.questions) {
      totalPoints += question.points
      const userAnswer = attempt.answers[question.questionId]

      let correct = false
      if (Array.isArray(question.correctAnswer)) {
        // 多选：使用部分计分
        if (Array.isArray(userAnswer)) {
          const sortedCorrect = [...question.correctAnswer].sort()
          const sortedUser = [...userAnswer].sort()
          correct = sortedCorrect.length === sortedUser.length &&
            sortedCorrect.every((v, i) => v === sortedUser[i])

          if (correct) {
            earnedPoints += question.points
          } else {
            // 部分计分：计算选对的答案比例
            const correctSelections = sortedUser.filter((ans) => sortedCorrect.includes(ans)).length
            const partialPoints = Math.round((correctSelections / sortedCorrect.length) * question.points)
            earnedPoints += partialPoints
          }
        }
      } else {
        // 单选/判断/简答
        correct = String(userAnswer) === String(question.correctAnswer)
        if (correct) {
          earnedPoints += question.points
        }
      }

      feedback[question.questionId] = {
        correct,
        explanation: question.explanation
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = score >= 80 // 默认 passingScore 为 80%

    return { score, passed, feedback }
  }

  getQuizAttempts(userId: string, courseId: string): QuizAttempt[] {
    const enrollment = this.enrollments.get(`${userId}:${courseId}`)
    return enrollment?.quizAttempts || []
  }

  // ── 证书 ─────────────────────────────────────────────────────────

  issueCertificate(userId: string, courseId: string): string {
    const enrollment = this.enrollments.get(`${userId}:${courseId}`)
    if (!enrollment) {
      throw new Error('用户未报名该课程')
    }

    if (enrollment.status !== 'completed' && enrollment.status !== 'passed') {
      throw new Error('用户未完成课程或未通过考试')
    }

    if (enrollment.certificateId) {
      return enrollment.certificateId
    }

    const certificateId = randomUUID()
    const certificate: Certificate = {
      certificateId,
      userId,
      courseId,
      issuedAt: new Date(),
      valid: true
    }

    this.certificates.set(certificateId, certificate)
    enrollment.certificateId = certificateId

    return certificateId
  }

  verifyCertificate(certificateId: string): { valid: boolean; userId?: string; courseId?: string; issuedAt?: Date } {
    const certificate = this.certificates.get(certificateId)
    if (!certificate || !certificate.valid) {
      return { valid: false }
    }

    return {
      valid: true,
      userId: certificate.userId,
      courseId: certificate.courseId,
      issuedAt: certificate.issuedAt
    }
  }

  // ── 学习路径 ─────────────────────────────────────────────────────

  recommendPath(
    userId: string,
    targetRole: string
  ): { courseId: string; order: number; reason: string }[] {
    const courses = this.getCoursesByRole(targetRole)

    // 简单的学习路径推荐：按课程难度/顺序推荐
    return courses.map((course, index) => ({
      courseId: course.courseId,
      order: index + 1,
      reason: `适合 ${targetRole} 角色的核心课程`
    }))
  }

  // ── 统计 ─────────────────────────────────────────────────────────

  getUserStats(userId: string): {
    coursesEnrolled: number
    coursesCompleted: number
    totalStudyMinutes: number
    certificatesIssued: number
    averageScore: number
  } {
    let coursesEnrolled = 0
    let coursesCompleted = 0
    let totalStudyMinutes = 0
    let certificatesIssued = 0
    let totalScore = 0
    let scoreCount = 0

    for (const enrollment of this.enrollments.values()) {
      if (enrollment.userId !== userId) continue

      coursesEnrolled++

      if (enrollment.status === 'completed' || enrollment.status === 'passed') {
        coursesCompleted++
      }

      if (enrollment.certificateId) {
        certificatesIssued++
      }

      // 累加学习时间（按进度估算）
      const course = this.courses.get(enrollment.courseId)
      if (course) {
        totalStudyMinutes += Math.round((course.estimatedMinutes * enrollment.progress) / 100)
      }

      // 计算平均分
      for (const attempt of enrollment.quizAttempts) {
        if (attempt.completedAt) {
          totalScore += attempt.score
          scoreCount++
        }
      }
    }

    return {
      coursesEnrolled,
      coursesCompleted,
      totalStudyMinutes,
      certificatesIssued,
      averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0
    }
  }

  getCourseCompletionRate(courseId: string): number {
    let totalEnrollments = 0
    let completedCount = 0

    for (const enrollment of this.enrollments.values()) {
      if (enrollment.courseId !== courseId) continue

      totalEnrollments++
      if (enrollment.status === 'completed' || enrollment.status === 'passed') {
        completedCount++
      }
    }

    return totalEnrollments > 0 ? Math.round((completedCount / totalEnrollments) * 100) : 0
  }

  // ── 私有辅助方法 ───────────────────────────────────────────────

  private findCourseQuiz(course: Course): Quiz | null {
    for (const module of course.modules) {
      if (module.quiz) {
        return module.quiz
      }
    }
    return null
  }
}

export const trainingService = new TrainingService()
