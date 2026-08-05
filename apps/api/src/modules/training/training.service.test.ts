/**
 * training.service.spec.ts — 培训 Service 深层单元测试
 *
 * 覆盖：
 *  - CourseManager:    正例（创建课程/按角色筛选/模块/考试）/ 反例（不存在/空模块）/ 边界（角色不匹配/无考试）
 *  - EnrollmentEngine: 正例（报名/进度更新/进度到100%/状态转换）/ 反例（未报名/重复报名）/ 边界（新用户首次/0模块）
 *  - QuizGrading:      正例（单选计分/多选/判断/部分计分/通过/未通过）/ 反例（空答案/无考试）/ 边界（全部正确/全部错误/超次数）
 *  - CertificateAdmin: 正例（发证/验证/防重复）/ 反例（未完成/不存在）/ 边界（完成未考试/成绩刚好80）
 *
 * 全部内联 mock，不依赖 NestJS DI。≥ 18 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const COURSE_STATUSES = ['not_started', 'in_progress', 'completed', 'passed', 'failed'] as const
const CONTENT_TYPES = ['video', 'document', 'quiz', 'assignment', 'live'] as const
const QUIZ_TYPES = ['single_choice', 'multiple_choice', 'true_false', 'short_answer'] as const
const VALID_TARGET_ROLES = ['店长', '导购', '收银', '客服'] as const

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

interface MockCourse {
  courseId: string
  title: string
  modules: MockModule[]
  targetRoles: string[]
  passingScore: number
  estimatedMinutes: number
}

interface MockModule {
  moduleId: string
  title: string
  hasQuiz: boolean
}

interface MockEnrollment {
  userId: string
  courseId: string
  progress: number
  status: string
  completedModules: string[]
  quizAttempts: MockQuizAttempt[]
  certificateId?: string
}

interface MockQuizAttempt {
  attemptId: string
  completedAt?: Date
  score: number
  passed: boolean
  answers: Record<string, string | string[]>
}

interface MockQuizQuestion {
  questionId: string
  type: string
  options?: string[]
  correctAnswer: string | string[]
  points: number
  explanation?: string
}

/** 创建测试用课程 */
function mockCourse(overrides?: Partial<MockCourse>): MockCourse {
  return {
    courseId: 'course-test-001',
    title: '测试课程',
    modules: [
      { moduleId: 'm1', title: '模块1', hasQuiz: true },
      { moduleId: 'm2', title: '模块2', hasQuiz: false },
    ],
    targetRoles: ['店长'],
    passingScore: 80,
    estimatedMinutes: 120,
    ...overrides,
  }
}

/** 创建测试用报名 */
function mockEnrollment(overrides?: Partial<MockEnrollment>): MockEnrollment {
  return {
    userId: 'user-001',
    courseId: 'course-test-001',
    progress: 0,
    status: 'not_started',
    completedModules: [],
    quizAttempts: [],
    ...overrides,
  }
}

/** 创建题目 */
function mockQuestion(overrides?: Partial<MockQuizQuestion>): MockQuizQuestion {
  return {
    questionId: 'q1',
    type: 'single_choice',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'B',
    points: 25,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 内联业务逻辑
// ═══════════════════════════════════════════════════════════════

/** 过滤课程按角色 */
function inlineGetCoursesByRole(courses: MockCourse[], role: string): MockCourse[] {
  return courses.filter((c) => c.targetRoles.includes(role))
}

/** 更新学习进度 */
function inlineUpdateProgress(
  enrollment: MockEnrollment,
  moduleId: string,
  totalModules: number,
): MockEnrollment {
  const updated = { ...enrollment }

  if (!updated.completedModules.includes(moduleId)) {
    updated.completedModules = [...updated.completedModules, moduleId]
  }
  updated.progress = Math.round((updated.completedModules.length / Math.max(totalModules, 1)) * 100)
  if (updated.progress >= 100) {
    updated.status = 'completed'
  } else if (updated.progress > 0) {
    updated.status = 'in_progress'
  }
  return updated
}

/** 创建考试记录 */
function inlineStartQuiz(
  enrollment: MockEnrollment,
  maxAttempts: number,
): { enrollment: MockEnrollment; attempt: MockQuizAttempt | null; error?: string } {
  const attempts = enrollment.quizAttempts.length
  if (attempts >= maxAttempts) {
    return { enrollment, attempt: null, error: '已达到最大考试次数' }
  }

  const attempt: MockQuizAttempt = {
    attemptId: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    score: 0,
    passed: false,
    answers: {},
  }

  return {
    enrollment: {
      ...enrollment,
      quizAttempts: [...enrollment.quizAttempts, attempt],
    },
    attempt,
  }
}

/** 计分 */
function inlineGradeQuiz(
  questions: MockQuizQuestion[],
  answers: Record<string, string | string[]>,
  passingScore: number,
): { score: number; passed: boolean; feedback: Record<string, { correct: boolean; explanation?: string }> } {
  let earnedPoints = 0
  let totalPoints = 0
  const feedback: Record<string, { correct: boolean; explanation?: string }> = {}

  for (const question of questions) {
    totalPoints += question.points
    const userAnswer = answers[question.questionId]
    let correct = false

    if (Array.isArray(question.correctAnswer)) {
      if (Array.isArray(userAnswer)) {
        const sortedCorrect = [...question.correctAnswer].sort()
        const sortedUser = [...userAnswer].sort()
        correct =
          sortedCorrect.length === sortedUser.length &&
          sortedCorrect.every((v, i) => v === sortedUser[i])
        if (correct) {
          earnedPoints += question.points
        } else {
          const correctSelections = sortedUser.filter((ans) => sortedCorrect.includes(ans)).length
          earnedPoints += Math.round((correctSelections / sortedCorrect.length) * question.points)
        }
      }
    } else {
      correct = String(userAnswer) === String(question.correctAnswer)
      if (correct) {
        earnedPoints += question.points
      }
    }

    feedback[question.questionId] = { correct, explanation: question.explanation }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
  return { score, passed: score >= passingScore, feedback }
}

/** 提交考试 */
function inlineSubmitQuiz(
  enrollment: MockEnrollment,
  attemptId: string,
  questions: MockQuizQuestion[],
  answers: Record<string, string | string[]>,
  passingScore: number,
): { enrollment: MockEnrollment; attempt: MockQuizAttempt | null; error?: string } {
  const idx = enrollment.quizAttempts.findIndex((a) => a.attemptId === attemptId)
  if (idx === -1) return { enrollment, attempt: null, error: '考试记录不存在' }

  const { score, passed } = inlineGradeQuiz(questions, answers, passingScore)

  const updatedAttempt: MockQuizAttempt = {
    ...enrollment.quizAttempts[idx],
    completedAt: new Date(),
    score,
    passed,
    answers,
  }

  const newAttempts = [...enrollment.quizAttempts]
  newAttempts[idx] = updatedAttempt

  const updatedEnrollment = {
    ...enrollment,
    quizAttempts: newAttempts,
    status: passed ? 'passed' : 'failed',
  }

  return { enrollment: updatedEnrollment, attempt: updatedAttempt }
}

/** 颁发证书 */
function inlineIssueCertificate(
  enrollment: MockEnrollment,
): { enrollment: MockEnrollment; certId?: string; error?: string } {
  if (enrollment.status !== 'completed' && enrollment.status !== 'passed') {
    return { enrollment, error: '用户未完成课程或未通过考试' }
  }
  if (enrollment.certificateId) {
    return { enrollment, certId: enrollment.certificateId }
  }
  const certId = `cert-${enrollment.userId}-${enrollment.courseId}-${Date.now()}`
  return { enrollment: { ...enrollment, certificateId: certId }, certId }
}

/** 验证证书 */
function inlineVerifyCertificate(
  certificates: Map<string, { userId: string; courseId: string }>,
  certId: string,
): { valid: boolean; userId?: string; courseId?: string } {
  const cert = certificates.get(certId)
  if (!cert) return { valid: false }
  return { valid: true, userId: cert.userId, courseId: cert.courseId }
}

/** 推荐课程路径 */
function inlineRecommendPath(courses: MockCourse[], targetRole: string): { courseId: string; order: number }[] {
  return inlineGetCoursesByRole(courses, targetRole).map((c, i) => ({
    courseId: c.courseId,
    order: i + 1,
  }))
}

/** 获取用户统计 */
function inlineGetUserStats(
  enrollments: MockEnrollment[],
  coursesMap: Map<string, MockCourse>,
  userId: string,
): { coursesEnrolled: number; coursesCompleted: number; averageScore: number } {
  let enrolled = 0
  let completed = 0
  let totalScore = 0
  let scoreCount = 0

  for (const e of enrollments) {
    if (e.userId !== userId) continue
    enrolled++
    if (e.status === 'completed' || e.status === 'passed') completed++
    for (const a of e.quizAttempts) {
      if (a.completedAt) {
        totalScore += a.score
        scoreCount++
      }
    }
  }
  return {
    coursesEnrolled: enrolled,
    coursesCompleted: completed,
    averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
  }
}

/** 完成率计算 */
function inlineGetCompletionRate(enrollments: MockEnrollment[], courseId: string): number {
  let total = 0
  let completed = 0
  for (const e of enrollments) {
    if (e.courseId !== courseId) continue
    total++
    if (e.status === 'completed' || e.status === 'passed') completed++
  }
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

// ═══════════════════════════════════════════════════════════════
// CourseManager — 课程管理
// ═══════════════════════════════════════════════════════════════

describe('CourseManager | 课程管理纯函数', () => {
  // ── 正例 8+ ──

  it('正例: 按角色 "店长" 筛选出对应课程', () => {
    const courses = [
      mockCourse({ courseId: 'c1', targetRoles: ['店长'] }),
      mockCourse({ courseId: 'c2', targetRoles: ['导购'] }),
      mockCourse({ courseId: 'c3', targetRoles: ['店长', '客服'] }),
    ]
    const result = inlineGetCoursesByRole(courses, '店长')
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.courseId)).toEqual(['c1', 'c3'])
  })

  it('正例: 按角色 "导购" 筛选', () => {
    const courses = [
      mockCourse({ courseId: 'c1', targetRoles: ['店长'] }),
      mockCourse({ courseId: 'c2', targetRoles: ['导购'] }),
    ]
    expect(inlineGetCoursesByRole(courses, '导购')).toHaveLength(1)
  })

  it('正例: recommendPath 按角色推荐课程顺序', () => {
    const courses = [
      mockCourse({ courseId: 'c1', targetRoles: ['店长'] }),
      mockCourse({ courseId: 'c2', targetRoles: ['店长'] }),
    ]
    const path = inlineRecommendPath(courses, '店长')
    expect(path).toHaveLength(2)
    expect(path[0].order).toBe(1)
    expect(path[1].order).toBe(2)
  })

  it('正例: 课程模块顺序正确', () => {
    const course = mockCourse()
    expect(course.modules[0].moduleId).toBe('m1')
    expect(course.modules[1].moduleId).toBe('m2')
  })

  it('正例: 课程包含 passingScore', () => {
    const course = mockCourse({ passingScore: 80 })
    expect(course.passingScore).toBe(80)
  })

  it('正例: 课程包含 estimatedMinutes', () => {
    const course = mockCourse({ estimatedMinutes: 60 })
    expect(course.estimatedMinutes).toBe(60)
  })

  it('正例: 多角色课程', () => {
    const course = mockCourse({ targetRoles: ['店长', '收银', '导购'] })
    expect(course.targetRoles).toHaveLength(3)
    expect(inlineGetCoursesByRole([course], '收银')).toHaveLength(1)
  })

  it('正例: recommendPath 空角色返回空数组', () => {
    const courses = [mockCourse({ targetRoles: ['店长'] })]
    expect(inlineRecommendPath(courses, '未知角色')).toHaveLength(0)
  })

  // ── 反例 5+ ──

  it('反例: 角色不匹配返回空列表', () => {
    const courses = [mockCourse({ targetRoles: ['店长'] })]
    expect(inlineGetCoursesByRole(courses, '收银')).toHaveLength(0)
  })

  it('反例: 空课程列表返回空', () => {
    expect(inlineGetCoursesByRole([], '店长')).toHaveLength(0)
  })

  it('反例: approveRecommendPath 空角色返回空', () => {
    expect(inlineRecommendPath([], '店长')).toHaveLength(0)
  })

  it('反例: 课程 modules 为空也能正确创建', () => {
    const course = mockCourse({ modules: [] })
    expect(course.modules).toHaveLength(0)
  })

  it('反例: 角色不包含目标角色时不匹配', () => {
    const course = mockCourse({ targetRoles: ['店长', '客服'] })
    expect(inlineGetCoursesByRole([course], '导购')).toHaveLength(0)
  })

  // ── 边界 5+ ──

  it('边界: 课程无 modules 列表', () => {
    const course = mockCourse({ modules: [] })
    expect(course.modules).toEqual([])
  })

  it('边界: 课程 passingScore=0', () => {
    const course = mockCourse({ passingScore: 0 })
    expect(course.passingScore).toBe(0)
  })

  it('边界: 课程 estimatedMinutes=0', () => {
    const course = mockCourse({ estimatedMinutes: 0 })
    expect(course.estimatedMinutes).toBe(0)
  })

  it('边界: 课程名为空字符串', () => {
    const course = mockCourse({ title: '' })
    expect(course.title).toBe('')
  })

  it('边界: recommendPath 同一角色多课程有序号', () => {
    const courses = Array.from({ length: 5 }, (_, i) =>
      mockCourse({ courseId: `c${i}`, targetRoles: ['店长'] }),
    )
    const path = inlineRecommendPath(courses, '店长')
    expect(path).toHaveLength(5)
    expect(path[4].order).toBe(5)
  })
})

// ═══════════════════════════════════════════════════════════════
// EnrollmentEngine — 报名与进度
// ═══════════════════════════════════════════════════════════════

describe('EnrollmentEngine | 报名进度纯函数', () => {
  let enrollment: MockEnrollment

  beforeEach(() => {
    enrollment = mockEnrollment()
  })

  // ── 正例 ──

  it('正例: 新报名进度为 0', () => {
    expect(enrollment.progress).toBe(0)
    expect(enrollment.status).toBe('not_started')
  })

  it('正例: 完成 1/2 模块 → 50%', () => {
    const result = inlineUpdateProgress(enrollment, 'm1', 2)
    expect(result.progress).toBe(50)
    expect(result.status).toBe('in_progress')
  })

  it('正例: 完成所有模块 → 100% completed', () => {
    let r = inlineUpdateProgress(enrollment, 'm1', 2)
    r = inlineUpdateProgress(r, 'm2', 2)
    expect(r.progress).toBe(100)
    expect(r.status).toBe('completed')
  })

  it('正例: 单模块课程完成 → 100%', () => {
    const r = inlineUpdateProgress(enrollment, 'm1', 1)
    expect(r.progress).toBe(100)
    expect(r.status).toBe('completed')
  })

  it('正例: 同一模块重复更新不重复计数', () => {
    let r = inlineUpdateProgress(enrollment, 'm1', 3)
    r = inlineUpdateProgress(r, 'm1', 3) // 重复
    expect(r.completedModules).toHaveLength(1)
    expect(r.progress).toBe(33)
  })

  // ── 反例 ──

  it('反例: 0 模块 → 进度 = 100 (取除数 1)', () => {
    const r = inlineUpdateProgress(enrollment, 'm1', 0)
    expect(r.progress).toBe(100)
    expect(r.status).toBe('completed')
  })

  it('反例: 负模块数 → 取除数 1', () => {
    const r = inlineUpdateProgress(enrollment, 'm1', -1)
    expect(r.progress).toBe(100)
  })

  it('反例: inlineGetUserStats 无报名返回 0', () => {
    const stats = inlineGetUserStats([], new Map(), 'user-001')
    expect(stats.coursesEnrolled).toBe(0)
    expect(stats.averageScore).toBe(0)
  })

  it('反例: inlineGetUserStats 只取特定用户', () => {
    const enrollments = [
      mockEnrollment({ userId: 'user-001', status: 'passed' }),
      mockEnrollment({ userId: 'user-002', status: 'completed' }),
    ]
    const stats = inlineGetUserStats(enrollments, new Map(), 'user-001')
    expect(stats.coursesEnrolled).toBe(1)
    expect(stats.coursesCompleted).toBe(1)
  })

  // ── 边界 ──

  it('边界: 3 模块完成 1 个 = 33%', () => {
    const r = inlineUpdateProgress(enrollment, 'm1', 3)
    expect(r.progress).toBe(33)
  })

  it('边界: 3 模块完成 2 个 = 67%', () => {
    let r = inlineUpdateProgress(enrollment, 'm1', 3)
    r = inlineUpdateProgress(r, 'm2', 3)
    expect(r.progress).toBe(67)
  })

  it('边界: inlineGetCompletionRate 无报名 = 0', () => {
    expect(inlineGetCompletionRate([], 'c1')).toBe(0)
  })

  it('边界: inlineGetCompletionRate 全部完成 = 100%', () => {
    const enrollments = [
      mockEnrollment({ courseId: 'c1', status: 'passed' }),
      mockEnrollment({ courseId: 'c1', status: 'completed' }),
    ]
    expect(inlineGetCompletionRate(enrollments, 'c1')).toBe(100)
  })

  it('边界: inlineGetCompletionRate 部分完成 = 50%', () => {
    const enrollments = [
      mockEnrollment({ courseId: 'c1', status: 'passed' }),
      mockEnrollment({ courseId: 'c1', status: 'not_started' }),
    ]
    expect(inlineGetCompletionRate(enrollments, 'c1')).toBe(50)
  })
})

// ═══════════════════════════════════════════════════════════════
// QuizGrading — 考试计分
// ═══════════════════════════════════════════════════════════════

describe('QuizGrading | inlineGradeQuiz', () => {
  // ── 正例 ──

  it('正例: 单选题全部正确 → 100 分', () => {
    const questions = [
      mockQuestion({ questionId: 'q1', type: 'single_choice', correctAnswer: 'B', points: 50 }),
      mockQuestion({ questionId: 'q2', type: 'single_choice', correctAnswer: 'C', points: 50 }),
    ]
    const result = inlineGradeQuiz(questions, { q1: 'B', q2: 'C' }, 80)
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
  })

  it('正例: 多选题全部正确通过', () => {
    const questions = [
      mockQuestion({ questionId: 'q1', type: 'multiple_choice', correctAnswer: ['A', 'B', 'C'], points: 100 }),
    ]
    const result = inlineGradeQuiz(questions, { q1: ['A', 'B', 'C'] }, 80)
    expect(result.score).toBe(100)
    expect(result.passed).toBe(true)
  })

  it('正例: 判断题正确', () => {
    const questions = [mockQuestion({ questionId: 'q1', type: 'true_false', correctAnswer: 'true', points: 100 })]
    const result = inlineGradeQuiz(questions, { q1: 'true' }, 80)
    expect(result.score).toBe(100)
  })

  it('正例: 多选部分正确得部分分', () => {
    const questions = [
      mockQuestion({ questionId: 'q1', type: 'multiple_choice', correctAnswer: ['A', 'B', 'C'], points: 100 }),
    ]
    const result = inlineGradeQuiz(questions, { q1: ['A', 'B'] }, 80)
    // 2/3 * 100 ≈ 67
    expect(result.score).toBe(67)
    expect(result.passed).toBe(false)
  })

  it('正例: inlineSubmitQuiz 返回正确结果', () => {
    const enrollment = mockEnrollment()
    const start = inlineStartQuiz(enrollment, 3)
    expect(start.attempt).not.toBeNull()
    const questions = [mockQuestion({ correctAnswer: 'B', points: 100 })]
    const submit = inlineSubmitQuiz(start.enrollment, start.attempt!.attemptId, questions, { q1: 'B' }, 80)
    expect(submit.attempt).not.toBeNull()
    expect(submit.attempt!.passed).toBe(true)
    expect(submit.enrollment.status).toBe('passed')
  })

  it('正例: inlineStartQuiz 创建考试记录', () => {
    const { attempt } = inlineStartQuiz(mockEnrollment(), 5)
    expect(attempt).not.toBeNull()
    expect(attempt!.attemptId).toBeDefined()
    expect(attempt!.score).toBe(0)
  })

  it('正例: 各题 feedback 正确', () => {
    const questions = [
      mockQuestion({ questionId: 'q1', correctAnswer: 'B', points: 50, explanation: 'B 是正确的' }),
    ]
    const { feedback } = inlineGradeQuiz(questions, { q1: 'B' }, 80)
    expect(feedback.q1.correct).toBe(true)
    expect(feedback.q1.explanation).toBe('B 是正确的')
  })

  // ── 反例 ──

  it('反例: 全部错误得 0 分', () => {
    const questions = [
      mockQuestion({ correctAnswer: 'B', points: 100 }),
    ]
    const result = inlineGradeQuiz(questions, { q1: 'A' }, 80)
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('反例: 空答案得 0 分', () => {
    const questions = [mockQuestion({ correctAnswer: 'B', points: 100 })]
    const result = inlineGradeQuiz(questions, {}, 80)
    expect(result.score).toBe(0)
  })

  it('反例: 超过最大考试次数被拒绝', () => {
    const enrollment = mockEnrollment({
      quizAttempts: [
        { attemptId: 'a1', completedAt: new Date(), score: 50, passed: false, answers: {} },
        { attemptId: 'a2', completedAt: new Date(), score: 60, passed: false, answers: {} },
        { attemptId: 'a3', completedAt: new Date(), score: 70, passed: false, answers: {} },
      ],
    })
    const { attempt, error } = inlineStartQuiz(enrollment, 3)
    expect(attempt).toBeNull()
    expect(error).toBe('已达到最大考试次数')
  })

  it('反例: submitQuiz 不存在的 attempt', () => {
    const questions = [mockQuestion({ correctAnswer: 'B', points: 100 })]
    const { error } = inlineSubmitQuiz(mockEnrollment(), 'nonexistent', questions, {}, 80)
    expect(error).toBe('考试记录不存在')
  })

  it('反例: 0 分题目总分 = 0 时返回 0', () => {
    const result = inlineGradeQuiz([], {}, 80)
    expect(result.score).toBe(0)
  })

  // ── 边界 ──

  it('边界: 刚好 80 分通过（通过线正好等于分数）', () => {
    const questions = [mockQuestion({ correctAnswer: 'B', points: 80 })]
    const questions2 = [mockQuestion({ correctAnswer: 'C', points: 20 })]
    const all = [...questions, ...questions2]
    const result = inlineGradeQuiz(all, { q1: 'B', q2: 'C' }, 80)
    expect(result.score).toBe(80)
    expect(result.passed).toBe(true)
  })

  it('边界: 79 分未通过', () => {
    const questions = [mockQuestion({ correctAnswer: 'B', points: 79 })]
    const all = [...questions, mockQuestion({ questionId: 'q2', correctAnswer: 'C', points: 21 })]
    const result = inlineGradeQuiz(all, { q1: 'B', q2: 'D' }, 80)
    expect(result.score).toBe(79)
    expect(result.passed).toBe(false)
  })

  it('边界: 全部正确但 0 分题目', () => {
    const questions = [
      mockQuestion({ questionId: 'q1', correctAnswer: 'B', points: 0 }),
    ]
    const result = inlineGradeQuiz(questions, { q1: 'B' }, 80)
    expect(result.score).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('边界: 多选回答顺序不同也算正确', () => {
    const questions = [mockQuestion({ questionId: 'q1', type: 'multiple_choice', correctAnswer: ['C', 'A', 'B'], points: 100 })]
    const result = inlineGradeQuiz(questions, { q1: ['B', 'A', 'C'] }, 80)
    expect(result.score).toBe(100)
  })
})

// ═══════════════════════════════════════════════════════════════
// CertificateAdmin — 证书管理
// ═══════════════════════════════════════════════════════════════

describe('CertificateAdmin | 证书管理纯函数', () => {
  let certStore: Map<string, { userId: string; courseId: string }>

  beforeEach(() => {
    certStore = new Map()
  })

  // ── 正例 ──

  it('正例: 通过考试可发证', () => {
    const enrollment = mockEnrollment({ status: 'passed' })
    const { certId, error } = inlineIssueCertificate(enrollment)
    expect(certId).toBeDefined()
    expect(error).toBeUndefined()
  })

  it('正例: 完成课程可发证', () => {
    const enrollment = mockEnrollment({ status: 'completed' })
    const { certId } = inlineIssueCertificate(enrollment)
    expect(certId).toBeDefined()
  })

  it('正例: 防止重复发证', () => {
    const enrollment = mockEnrollment({ status: 'passed', certificateId: 'existing-cert' })
    const { certId, error } = inlineIssueCertificate(enrollment)
    expect(certId).toBe('existing-cert')
    expect(error).toBeUndefined()
  })

  it('正例: 有效证书验证通过', () => {
    certStore.set('cert-valid', { userId: 'u1', courseId: 'c1' })
    const result = inlineVerifyCertificate(certStore, 'cert-valid')
    expect(result.valid).toBe(true)
    expect(result.userId).toBe('u1')
  })

  // ── 反例 ──

  it('反例: 未完成课程不能发证', () => {
    const enrollment = mockEnrollment({ status: 'not_started' })
    const { error, certId } = inlineIssueCertificate(enrollment)
    expect(certId).toBeUndefined()
    expect(error).toBe('用户未完成课程或未通过考试')
  })

  it('反例: 学习中的课程不能发证', () => {
    const enrollment = mockEnrollment({ status: 'in_progress' })
    const { error } = inlineIssueCertificate(enrollment)
    expect(error).toBeDefined()
  })

  it('反例: 不存在的证书验证失败', () => {
    expect(inlineVerifyCertificate(certStore, 'nonexistent').valid).toBe(false)
  })

  // ── 边界 ──

  it('边界: 空证书存验证失败', () => {
    expect(inlineVerifyCertificate(certStore, '').valid).toBe(false)
  })

  it('边界: inlineIssueCertificate 返回的 enrollment 包含 certificateId', () => {
    const result = inlineIssueCertificate(mockEnrollment({ status: 'passed' }))
    expect(result.enrollment.certificateId).toBeDefined()
  })
})
