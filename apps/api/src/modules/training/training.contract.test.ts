/**
 * 🐜 自动: [training] [D] contract 测试补全
 *
 * 培训模块合约测试
 */
import { describe, it, expect } from 'vitest'
import type {
  CourseQueryContract,
  EnrollContract,
  ProgressContract,
  CertificateValidationContract,
  TrainingStatsContract,
  ITrainingServiceContract,
} from './training.contract'
import type { Course } from './training.entity'

describe('TrainingContract', () => {
  describe('CourseQueryContract', () => {
    it('应该接受完整查询参数', () => {
      const query: CourseQueryContract = {
        role: '店长',
        keyword: '运营',
        page: 1,
        pageSize: 20,
      }
      expect(query.role).toBe('店长')
      expect(query.keyword).toBe('运营')
      expect(query.page).toBe(1)
      expect(query.pageSize).toBe(20)
    })

    it('应该接受空查询', () => {
      const query: CourseQueryContract = {}
      expect(query.role).toBeUndefined()
      expect(query.keyword).toBeUndefined()
    })
  })

  describe('EnrollContract', () => {
    it('应该包含报名必需字段', () => {
      const contract: EnrollContract = {
        userId: 'user-001',
        courseId: 'course-1',
      }
      expect(contract.userId).toBe('user-001')
      expect(contract.courseId).toBe('course-1')
    })
  })

  describe('ProgressContract', () => {
    it('应该包含进度更新必需字段', () => {
      const contract: ProgressContract = {
        userId: 'user-001',
        courseId: 'course-1',
        moduleId: 'module-1',
      }
      expect(contract.userId).toBe('user-001')
      expect(contract.courseId).toBe('course-1')
      expect(contract.moduleId).toBe('module-1')
    })
  })

  describe('CertificateValidationContract', () => {
    it('应该支持有效证书', () => {
      const result: CertificateValidationContract = {
        valid: true,
        userId: 'user-001',
        courseId: 'course-1',
        issuedAt: new Date('2026-07-11'),
      }
      expect(result.valid).toBe(true)
      expect(result.userId).toBe('user-001')
    })

    it('应该支持无效证书', () => {
      const result: CertificateValidationContract = { valid: false }
      expect(result.valid).toBe(false)
      expect(result.userId).toBeUndefined()
    })
  })

  describe('TrainingStatsContract', () => {
    it('应该包含统计必需字段', () => {
      const stats: TrainingStatsContract = {
        totalCourses: 12,
        totalEnrollments: 100,
        completionRate: 75,
        avgScore: 85,
      }
      expect(stats.totalCourses).toBe(12)
      expect(stats.completionRate).toBe(75)
      expect(stats.avgScore).toBe(85)
    })
  })

  describe('ITrainingServiceContract', () => {
    it('接口定义应该包含所有核心方法', () => {
      // 类型检查 - 验证接口方法签名
      const service: ITrainingServiceContract = {
        listCourses: () => [],
        getCourse: () => null,
        getCoursesByRole: () => [],
        enroll: () => ({ userId: '', courseId: '', enrolledAt: new Date(), completedModules: [], progress: 0, quizAttempts: [], status: 'not_started' }),
        updateProgress: () => {},
        getEnrollment: () => null,
        getUserStats: () => ({ coursesEnrolled: 0, coursesCompleted: 0, totalStudyMinutes: 0, certificatesIssued: 0, averageScore: 0 }),
        getCourseCompletionRate: () => 0,
        verifyCertificate: () => ({ valid: false }),
        recommendPath: () => [],
      }

      expect(typeof service.listCourses).toBe('function')
      expect(typeof service.enroll).toBe('function')
      expect(typeof service.updateProgress).toBe('function')
      expect(typeof service.verifyCertificate).toBe('function')
      expect(typeof service.recommendPath).toBe('function')
    })
  })
})
