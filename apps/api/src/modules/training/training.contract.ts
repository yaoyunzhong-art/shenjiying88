/**
 * 🐜 自动: [training] [D] contract 补全
 *
 * 培训模块：跨模块合约类型
 * 定义 training 模块对外暴露的稳定合约接口，
 * 供其他模块（member, notification, portal, workbench 等）消费。
 */
import type {
  Course,
  Enrollment,
  Certificate,
  UserStats,
  RecommendedCourse,
} from './training.entity'

/**
 * 课程查询合约
 */
export interface CourseQueryContract {
  role?: string
  keyword?: string
  page?: number
  pageSize?: number
}

/**
 * 学员报名输入合约
 */
export interface EnrollContract {
  userId: string
  courseId: string
}

/**
 * 学习进度合约
 */
export interface ProgressContract {
  userId: string
  courseId: string
  moduleId: string
}

/**
 * 证书验证结果合约
 */
export interface CertificateValidationContract {
  valid: boolean
  userId?: string
  courseId?: string
  issuedAt?: Date
}

/**
 * 培训统计合约
 */
export interface TrainingStatsContract {
  totalCourses: number
  totalEnrollments: number
  completionRate: number
  avgScore: number
}

/**
 * 培训模块暴露的稳定服务接口
 */
export interface ITrainingServiceContract {
  listCourses(query?: CourseQueryContract): Course[]
  getCourse(courseId: string): Course | null
  getCoursesByRole(role: string): Course[]
  enroll(userId: string, courseId: string): Enrollment
  updateProgress(userId: string, courseId: string, moduleId: string): void
  getEnrollment(userId: string, courseId: string): Enrollment | null
  getUserStats(userId: string): UserStats
  getCourseCompletionRate(courseId: string): number
  verifyCertificate(certificateId: string): CertificateValidationContract
  recommendPath(userId: string, targetRole: string): RecommendedCourse[]
}
