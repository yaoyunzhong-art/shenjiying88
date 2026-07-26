import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { CustomerSatisfactionController } from './customer-satisfaction.controller'

describe('CustomerSatisfactionController metadata', () => {
  it('controller should keep customer-satisfaction path', () => {
    assert.equal(
      Reflect.getMetadata('path', CustomerSatisfactionController),
      'customer-satisfaction',
    )
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CustomerSatisfactionController.prototype.list, 0, '/'],
      [CustomerSatisfactionController.prototype.summary, 0, 'summary'],
      [CustomerSatisfactionController.prototype.getById, 0, ':id'],
      [CustomerSatisfactionController.prototype.create, 1, '/'],
      [CustomerSatisfactionController.prototype.delete, 3, ':id'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
