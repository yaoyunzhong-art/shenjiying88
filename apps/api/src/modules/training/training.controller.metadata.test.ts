import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { TrainingController } from './training.controller'

describe('TrainingController metadata', () => {
  it('controller should keep training path', () => {
    assert.equal(Reflect.getMetadata('path', TrainingController), 'training')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [TrainingController.prototype.createCourse, 1, 'courses'],
      [TrainingController.prototype.listCourses, 0, 'courses'],
      [TrainingController.prototype.getCourse, 0, 'courses/:id'],
      [TrainingController.prototype.getCoursesByRole, 0, 'courses/by-role/:role'],
      [TrainingController.prototype.enroll, 1, 'enroll'],
      [TrainingController.prototype.updateProgress, 1, 'progress'],
      [TrainingController.prototype.getEnrollment, 0, 'enrollment'],
      [TrainingController.prototype.startQuiz, 1, 'quiz/start'],
      [TrainingController.prototype.submitQuiz, 1, 'quiz/submit'],
      [TrainingController.prototype.getQuizAttempts, 0, 'quiz/attempts'],
      [TrainingController.prototype.generateCertificate, 1, 'certificate'],
      [TrainingController.prototype.getCertificate, 0, 'certificate/:id'],
      [TrainingController.prototype.getRecommendations, 0, 'recommendations'],
      [TrainingController.prototype.getUserStats, 0, 'stats/:userId'],
      [TrainingController.prototype.getCompletionRate, 0, 'completion-rate/:courseId'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
