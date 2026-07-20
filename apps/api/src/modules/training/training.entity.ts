/**
 * 培训模块实体定义
 */

export type CourseStatus = 'not_started' | 'in_progress' | 'completed' | 'passed' | 'failed'
export type ContentType = 'video' | 'document' | 'quiz' | 'assignment' | 'live'

/** 课程 */
export interface Course {
  courseId: string
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId: string
  title: string
  description: string
  modules: CourseModule[]
  targetRoles: string[]
  estimatedMinutes: number
  passingScore: number
  certificateTemplate?: string
}

/** 课程模块 */
export interface CourseModule {
  moduleId: string
  title: string
  contents: ModuleContent[]
  quiz?: Quiz
  order: number
}

/** 模块内容 */
export interface ModuleContent {
  contentId: string
  type: ContentType
  title: string
  url?: string
  durationMinutes?: number
  transcript?: string
}

/** 测验 */
export interface Quiz {
  quizId: string
  questions: QuizQuestion[]
  timeLimitMinutes?: number
  maxAttempts: number
}

/** 测验题目 */
export interface QuizQuestion {
  questionId: string
  text: string
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer'
  options?: string[]
  correctAnswer: string | string[]
  explanation?: string
  points: number
}

/** 报名记录 */
export interface Enrollment {
  userId: string
  courseId: string
  /** 租户 ID（RLS 多租户隔离字段） */
  tenantId: string
  enrolledAt: Date
  progress: number
  status: CourseStatus
  completedModules: string[]
  quizAttempts: QuizAttempt[]
  certificateId?: string
}

/** 测验尝试 */
export interface QuizAttempt {
  attemptId: string
  startedAt: Date
  completedAt?: Date
  score: number
  passed: boolean
  answers: Record<string, string | string[]>
}

/** 证书 */
export interface Certificate {
  certificateId: string
  userId: string
  courseId: string
  issuedAt: Date
  valid: true
}

/** 学员统计 */
export interface UserStats {
  coursesEnrolled: number
  coursesCompleted: number
  totalStudyMinutes: number
  certificatesIssued: number
  averageScore: number
}

/** 推荐课程 */
export interface RecommendedCourse {
  courseId: string
  title: string
  description: string
  targetRoles: string[]
  estimatedMinutes: number
  reason: string
}
