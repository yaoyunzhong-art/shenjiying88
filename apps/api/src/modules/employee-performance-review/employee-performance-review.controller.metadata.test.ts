import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { EmployeePerformanceReviewController } from './employee-performance-review.controller'

describe('EmployeePerformanceReviewController metadata', () => {
  it('controller should keep employee-performance path', () => {
    assert.equal(
      Reflect.getMetadata('path', EmployeePerformanceReviewController),
      'employee-performance',
    )
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [EmployeePerformanceReviewController.prototype.list, 0, '/'],
      [EmployeePerformanceReviewController.prototype.summary, 0, 'summary'],
      [EmployeePerformanceReviewController.prototype.getById, 0, ':id'],
      [EmployeePerformanceReviewController.prototype.create, 1, '/'],
      [EmployeePerformanceReviewController.prototype.delete, 3, ':id'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
