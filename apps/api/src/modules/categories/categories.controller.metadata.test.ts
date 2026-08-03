import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { CategoriesController } from './categories.controller'

describe('CategoriesController metadata', () => {
  it('controller should keep categories path', () => {
    assert.equal(Reflect.getMetadata('path', CategoriesController), 'categories')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CategoriesController.prototype.findAll, 0, '/'],
      [CategoriesController.prototype.getStats, 0, 'stats'],
      [CategoriesController.prototype.findByName, 0, ':name'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
