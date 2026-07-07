// training.entity.test.ts · 培训模块实体测试
// 🐜 自动: [training] [A] 实体测试

import { describe, it, expect } from 'vitest'
import type {
  Course,
  CourseModule,
  ModuleContent,
  Quiz,
  QuizQuestion,
  Enrollment,
  QuizAttempt,
  Certificate,
  UserStats,
  RecommendedCourse,
  CourseStatus,
  ContentType,
} from './training.entity'

describe('Course entity shape', () => {
  it('should create a valid Course', () => {
    const course: Course = {
      courseId: 'course-001',
      title: '门店运营基础',
      description: '学习门店日常管理',
      modules: [],
      targetRoles: ['店长', '导购'],
      estimatedMinutes: 120,
      passingScore: 80,
      certificateTemplate: 'cert-store-mgr',
    }
    expect(course.courseId).toBe('course-001')
    expect(course.targetRoles).toHaveLength(2)
    expect(course.passingScore).toBe(80)
  })

  it('should create a Course without optional certificateTemplate', () => {
    const course: Course = {
      courseId: 'course-002',
      title: '基础课程',
      description: '无证书模板',
      modules: [],
      targetRoles: ['导购'],
      estimatedMinutes: 60,
      passingScore: 70,
    }
    expect(course.certificateTemplate).toBeUndefined()
  })

  it('should validate CourseStatus union type', () => {
    const statuses: CourseStatus[] = ['not_started', 'in_progress', 'completed', 'passed', 'failed']
    expect(statuses).toHaveLength(5)
  })

  it('should validate ContentType union type', () => {
    const types: ContentType[] = ['video', 'document', 'quiz', 'assignment', 'live']
    expect(types).toHaveLength(5)
  })
})

describe('CourseModule entity shape', () => {
  it('should create a valid CourseModule', () => {
    const mod: CourseModule = {
      moduleId: 'm1',
      title: '日常管理',
      contents: [
        { contentId: 'c1', type: 'video', title: '晨会管理', durationMinutes: 20 },
      ],
      quiz: {
        quizId: 'q1',
        questions: [],
        maxAttempts: 3,
      },
      order: 1,
    }
    expect(mod.moduleId).toBe('m1')
    expect(mod.contents).toHaveLength(1)
    expect(mod.quiz).toBeDefined()
    expect(mod.order).toBe(1)
  })

  it('should allow CourseModule without quiz', () => {
    const mod: CourseModule = {
      moduleId: 'm2',
      title: '仅文档模块',
      contents: [{ contentId: 'c2', type: 'document', title: '手册' }],
      order: 2,
    }
    expect(mod.quiz).toBeUndefined()
  })
})

describe('ModuleContent entity shape', () => {
  it('should create valid ModuleContent for each type', () => {
    const video: ModuleContent = { contentId: 'v1', type: 'video', title: '视频', url: 'https://x.com/v', durationMinutes: 15 }
    const doc: ModuleContent = { contentId: 'd1', type: 'document', title: '文档', url: 'https://x.com/doc' }
    const quiz: ModuleContent = { contentId: 'q1', type: 'quiz', title: '测验' }
    const assign: ModuleContent = { contentId: 'a1', type: 'assignment', title: '作业' }
    const live: ModuleContent = { contentId: 'l1', type: 'live', title: '直播' }

    expect(video.durationMinutes).toBe(15)
    expect(doc.transcript).toBeUndefined()
    expect(quiz.type).toBe('quiz')
    expect(assign.type).toBe('assignment')
    expect(live.type).toBe('live')
  })
})

describe('Quiz & QuizQuestion entity shape', () => {
  const questions: QuizQuestion[] = [
    { questionId: 'q1', text: '答案为A', type: 'single_choice', options: ['A', 'B'], correctAnswer: 'A', points: 10 },
    { questionId: 'q2', text: '多选', type: 'multiple_choice', options: ['X', 'Y', 'Z'], correctAnswer: ['X', 'Y'], points: 20, explanation: 'XY正确' },
    { questionId: 'q3', text: '判断题', type: 'true_false', correctAnswer: 'true', points: 10 },
    { questionId: 'q4', text: '简答题', type: 'short_answer', correctAnswer: '自由', points: 30 },
  ]

  it('should create a Quiz with questions', () => {
    const quiz: Quiz = {
      quizId: 'quiz-1',
      questions,
      maxAttempts: 3,
      timeLimitMinutes: 30,
    }
    expect(quiz.questions).toHaveLength(4)
    expect(quiz.maxAttempts).toBe(3)
    expect(quiz.timeLimitMinutes).toBe(30)
  })

  it('should create Quiz without optional timeLimitMinutes', () => {
    const quiz: Quiz = { quizId: 'quiz-2', questions: [], maxAttempts: 1 }
    expect(quiz.timeLimitMinutes).toBeUndefined()
  })

  it('should handle all question types', () => {
    const types = questions.map((q) => q.type)
    expect(types).toContain('single_choice')
    expect(types).toContain('multiple_choice')
    expect(types).toContain('true_false')
    expect(types).toContain('short_answer')
  })
})

describe('Enrollment entity shape', () => {
  it('should create a valid Enrollment', () => {
    const enrollment: Enrollment = {
      userId: 'user-1',
      courseId: 'course-1',
      enrolledAt: new Date('2026-07-06'),
      progress: 50,
      status: 'in_progress',
      completedModules: ['m1'],
      quizAttempts: [],
    }
    expect(enrollment.status).toBe('in_progress')
    expect(enrollment.progress).toBe(50)
    expect(enrollment.completedModules).toHaveLength(1)
  })

  it('should allow Enrollment with certificateId', () => {
    const enrollment: Enrollment = {
      userId: 'user-2',
      courseId: 'course-2',
      enrolledAt: new Date(),
      progress: 100,
      status: 'passed',
      completedModules: ['m1', 'm2'],
      quizAttempts: [],
      certificateId: 'cert-001',
    }
    expect(enrollment.certificateId).toBe('cert-001')
  })

  it('should support all course statuses in enrollment', () => {
    const statuses: CourseStatus[] = ['not_started', 'in_progress', 'completed', 'passed', 'failed']
    statuses.forEach((s) => {
      const e: Enrollment = {
        userId: 'u', courseId: 'c', enrolledAt: new Date(),
        progress: 0, status: s, completedModules: [], quizAttempts: [],
      }
      expect(e.status).toBe(s)
    })
  })
})

describe('QuizAttempt entity shape', () => {
  it('should create a QuizAttempt without completedAt initially', () => {
    const attempt: QuizAttempt = {
      attemptId: 'attempt-1',
      startedAt: new Date(),
      score: 0,
      passed: false,
      answers: {},
    }
    expect(attempt.completedAt).toBeUndefined()
    expect(attempt.score).toBe(0)
  })

  it('should create a completed QuizAttempt', () => {
    const attempt: QuizAttempt = {
      attemptId: 'attempt-2',
      startedAt: new Date('2026-07-06T10:00:00Z'),
      completedAt: new Date('2026-07-06T10:30:00Z'),
      score: 85,
      passed: true,
      answers: { q1: 'A', q2: ['X', 'Y'] },
    }
    expect(attempt.passed).toBe(true)
    expect(attempt.score).toBe(85)
    expect(attempt.completedAt).toBeInstanceOf(Date)
  })

  it('should store answers as Record<string, string | string[]>', () => {
    const attempt: QuizAttempt = {
      attemptId: 'attempt-3',
      startedAt: new Date(),
      score: 60,
      passed: false,
      answers: { q1: 'answer', q2: ['opt1', 'opt2'] },
    }
    expect(typeof attempt.answers.q1).toBe('string')
    expect(Array.isArray(attempt.answers.q2)).toBe(true)
  })
})

describe('Certificate entity shape', () => {
  it('should create a valid Certificate', () => {
    const cert: Certificate = {
      certificateId: 'cert-001',
      userId: 'user-1',
      courseId: 'course-1',
      issuedAt: new Date(),
      valid: true,
    }
    expect(cert.valid).toBe(true)
    expect(cert.userId).toBe('user-1')
  })
})

describe('UserStats entity shape', () => {
  it('should create valid UserStats', () => {
    const stats: UserStats = {
      coursesEnrolled: 5,
      coursesCompleted: 3,
      totalStudyMinutes: 360,
      certificatesIssued: 2,
      averageScore: 82,
    }
    expect(stats.coursesEnrolled).toBe(5)
    expect(stats.averageScore).toBe(82)
  })

  it('should allow zero values', () => {
    const stats: UserStats = {
      coursesEnrolled: 0,
      coursesCompleted: 0,
      totalStudyMinutes: 0,
      certificatesIssued: 0,
      averageScore: 0,
    }
    expect(stats.coursesEnrolled).toBe(0)
  })
})

describe('RecommendedCourse entity shape', () => {
  it('should create a valid RecommendedCourse', () => {
    const rec: RecommendedCourse = {
      courseId: 'course-1',
      title: '销售技巧',
      description: '提升转化率',
      targetRoles: ['导购'],
      estimatedMinutes: 90,
      reason: '适合导购角色',
    }
    expect(rec.reason).toBe('适合导购角色')
    expect(rec.estimatedMinutes).toBe(90)
  })
})
