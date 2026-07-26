import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { ModulesController } from './modules.controller'

describe('ModulesController metadata', () => {
  it('controller should keep modules path', () => {
    assert.equal(Reflect.getMetadata('path', ModulesController), 'modules')
  })

  it('GET routes should keep REST metadata', () => {
    const cases = [
      [ModulesController.prototype.getAll, '/'],
      [ModulesController.prototype.topology, 'topology'],
      [ModulesController.prototype.getById, ':id'],
      [ModulesController.prototype.checkDeps, ':id/check'],
    ] as const

    cases.forEach(([handler, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), 0)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })

  it('POST routes should keep REST metadata', () => {
    const cases = [
      [ModulesController.prototype.register, 'register'],
      [ModulesController.prototype.toggle, ':id/toggle'],
    ] as const

    cases.forEach(([handler, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), 1)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
