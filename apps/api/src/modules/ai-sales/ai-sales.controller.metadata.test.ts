import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { AiSalesController } from './ai-sales.controller'

describe('AiSalesController metadata', () => {
  it('controller should keep ai-sales path', () => {
    assert.equal(Reflect.getMetadata('path', AiSalesController), 'ai-sales')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiSalesController.prototype.recommend, 1, 'recommend'],
      [AiSalesController.prototype.recommendUpsell, 1, 'recommend/upsell'],
      [AiSalesController.prototype.recommendCrossSell, 1, 'recommend/cross-sell'],
      [AiSalesController.prototype.getAllProducts, 0, 'products'],
      [AiSalesController.prototype.getProduct, 0, 'products/:id'],
      [AiSalesController.prototype.recordPurchase, 1, 'purchase'],
      [AiSalesController.prototype.classifyObjection, 1, 'objection/classify'],
      [AiSalesController.prototype.generateResponse, 1, 'objection/respond'],
      [AiSalesController.prototype.simulateConversation, 1, 'objection/simulate'],
      [AiSalesController.prototype.scheduleFollowUp, 1, 'follow-up'],
      [AiSalesController.prototype.getDueFollowUps, 0, 'follow-up/due/:salesId'],
      [AiSalesController.prototype.getPendingFollowUps, 0, 'follow-up/pending'],
      [AiSalesController.prototype.markCompleted, 1, 'follow-up/complete'],
      [AiSalesController.prototype.getUpcomingBirthdays, 0, 'follow-up/upcoming-birthdays'],
      [AiSalesController.prototype.setBirthday, 1, 'follow-up/birthday'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
