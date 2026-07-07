// training.dto.test.ts · 培训模块 DTO 测试
// 🐜 自动: [training] [A] DTO 验证测试

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  CreateCourseDto,
  EnrollDto,
  UpdateProgressDto,
  StartQuizDto,
  SubmitQuizDto,
  GenerateCertificateDto,
  RoleCoursesQueryDto,
  ModuleContentDto,
  QuizQuestionDto,
  QuizDto,
  CourseModuleDto,
} from './training.dto'

describe('ModuleContentDto', () => {
  it('should validate a valid ModuleContentDto', async () => {
    const dto = plainToInstance(ModuleContentDto, {
      contentId: 'c1',
      type: 'video',
      title: '教学视频',
      url: 'https://example.com/video',
      durationMinutes: 15,
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject missing required fields', async () => {
    const dto = plainToInstance(ModuleContentDto, {})
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject invalid ContentType', async () => {
    const dto = plainToInstance(ModuleContentDto, {
      contentId: 'c1',
      type: 'invalid_type',
      title: '测试',
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept optional fields', async () => {
    const dto = plainToInstance(ModuleContentDto, {
      contentId: 'c2',
      type: 'document',
      title: '文档',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('CreateCourseDto', () => {
  const validCourse = {
    title: '门店运营基础',
    description: '学习门店运营',
    modules: [{
      moduleId: 'm1',
      title: '日常管理',
      contents: [{ contentId: 'c1', type: 'video', title: '视频' }],
      order: 1,
    }],
    targetRoles: ['店长'],
    estimatedMinutes: 120,
    passingScore: 80,
  }

  it('should validate a valid CreateCourseDto', async () => {
    const dto = plainToInstance(CreateCourseDto, validCourse)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty modules array', async () => {
    const dto = plainToInstance(CreateCourseDto, { ...validCourse, modules: [] })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject passingScore > 100', async () => {
    const dto = plainToInstance(CreateCourseDto, { ...validCourse, passingScore: 150 })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should reject negative estimatedMinutes', async () => {
    const dto = plainToInstance(CreateCourseDto, { ...validCourse, estimatedMinutes: -1 })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept optional certificateTemplate', async () => {
    const dto = plainToInstance(CreateCourseDto, {
      ...validCourse,
      certificateTemplate: 'cert-tpl',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('EnrollDto', () => {
  it('should validate a valid EnrollDto', async () => {
    const dto = plainToInstance(EnrollDto, { userId: 'u1', courseId: 'c1' })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty userId', async () => {
    const dto = plainToInstance(EnrollDto, { userId: '', courseId: 'c1' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('UpdateProgressDto', () => {
  it('should validate valid UpdateProgressDto', async () => {
    const dto = plainToInstance(UpdateProgressDto, {
      userId: 'u1', courseId: 'c1', moduleId: 'm1',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject missing moduleId', async () => {
    const dto = plainToInstance(UpdateProgressDto, { userId: 'u1', courseId: 'c1' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('StartQuizDto', () => {
  it('should validate valid StartQuizDto', async () => {
    const dto = plainToInstance(StartQuizDto, { userId: 'u1', courseId: 'c1' })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('SubmitQuizDto', () => {
  it('should validate valid SubmitQuizDto', async () => {
    const dto = plainToInstance(SubmitQuizDto, {
      attemptId: 'a1',
      answers: { q1: 'A', q2: ['X', 'Y'] },
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty attemptId', async () => {
    const dto = plainToInstance(SubmitQuizDto, { attemptId: '', answers: {} })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('GenerateCertificateDto', () => {
  it('should validate valid GenerateCertificateDto', async () => {
    const dto = plainToInstance(GenerateCertificateDto, { userId: 'u1', courseId: 'c1' })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('RoleCoursesQueryDto', () => {
  it('should validate valid RoleCoursesQueryDto', async () => {
    const dto = plainToInstance(RoleCoursesQueryDto, { role: '店长' })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty role', async () => {
    const dto = plainToInstance(RoleCoursesQueryDto, { role: '' })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('Nested DTO: QuizQuestionDto', () => {
  const validQuestion = {
    questionId: 'q1',
    text: '答案为A',
    type: 'single_choice',
    options: ['A', 'B'],
    correctAnswer: 'A',
    points: 10,
  }

  it('should validate a valid QuizQuestionDto', async () => {
    const dto = plainToInstance(QuizQuestionDto, validQuestion)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject negative points', async () => {
    const dto = plainToInstance(QuizQuestionDto, { ...validQuestion, points: -1 })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept optional explanation', async () => {
    const dto = plainToInstance(QuizQuestionDto, {
      ...validQuestion,
      explanation: '因为A正确',
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('Nested DTO: QuizDto', () => {
  const validQuiz = {
    quizId: 'quiz-1',
    questions: [{
      questionId: 'q1',
      text: '答案为A',
      type: 'single_choice',
      options: ['A', 'B'],
      correctAnswer: 'A',
      points: 10,
    }],
    maxAttempts: 3,
  }

  it('should validate a valid QuizDto', async () => {
    const dto = plainToInstance(QuizDto, validQuiz)
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty questions array', async () => {
    const dto = plainToInstance(QuizDto, { ...validQuiz, questions: [] })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })

  it('should accept optional timeLimitMinutes', async () => {
    const dto = plainToInstance(QuizDto, { ...validQuiz, timeLimitMinutes: 30 })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })
})

describe('Nested DTO: CourseModuleDto', () => {
  it('should validate valid CourseModuleDto with nested contents', async () => {
    const dto = plainToInstance(CourseModuleDto, {
      moduleId: 'm1',
      title: '模块一',
      contents: [{ contentId: 'c1', type: 'video', title: '视频' }],
      order: 1,
    })
    const errors = await validate(dto)
    expect(errors).toHaveLength(0)
  })

  it('should reject empty contents', async () => {
    const dto = plainToInstance(CourseModuleDto, {
      moduleId: 'm1',
      title: '模块',
      contents: [],
      order: 0,
    })
    const errors = await validate(dto)
    expect(errors.length).toBeGreaterThan(0)
  })
})
