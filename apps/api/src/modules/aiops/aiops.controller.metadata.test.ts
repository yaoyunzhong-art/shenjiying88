import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AIOpsController } from './aiops.controller'

describe('AIOpsController metadata', () => {
  it('controller should keep aiops path', () => {
    assert.equal(Reflect.getMetadata('path', AIOpsController), 'aiops')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AIOpsController.prototype.detect, 1, 'detect'],
      [AIOpsController.prototype.predict, 1, 'predict'],
      [AIOpsController.prototype.detectAttack, 1, 'attack'],
      [AIOpsController.prototype.heal, 1, 'heal'],
      [AIOpsController.prototype.getStatus, 0, 'status'],
      [AIOpsController.prototype.getHealth, 0, 'health'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
