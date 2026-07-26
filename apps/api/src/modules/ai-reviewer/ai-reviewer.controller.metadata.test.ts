import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AIReviewerController } from './ai-reviewer.controller'

describe('AIReviewerController metadata', () => {
  it('controller should keep ai-reviewer path', () => {
    assert.equal(Reflect.getMetadata('path', AIReviewerController), 'ai-reviewer')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AIReviewerController.prototype.review, 1, 'review'],
      [AIReviewerController.prototype.listRules, 0, 'rules'],
      [AIReviewerController.prototype.registerRule, 1, 'rules'],
      [AIReviewerController.prototype.getStats, 0, 'stats'],
      [AIReviewerController.prototype.getRule, 0, 'rules/:ruleId'],
      [AIReviewerController.prototype.ciVerify, 1, 'ci-verify'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
