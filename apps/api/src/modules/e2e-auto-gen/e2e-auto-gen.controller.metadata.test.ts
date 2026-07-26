import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

import { E2EAutoGenController } from './e2e-auto-gen.controller'

describe('E2EAutoGenController metadata', () => {
  it('controller should keep e2e-auto-gen path', () => {
    assert.equal(Reflect.getMetadata('path', E2EAutoGenController), 'e2e-auto-gen')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [E2EAutoGenController.prototype.generate, 1, 'generate'],
      [E2EAutoGenController.prototype.execute, 1, 'execute'],
      [E2EAutoGenController.prototype.getTask, 0, 'tasks/:taskId'],
      [E2EAutoGenController.prototype.getReport, 0, 'reports/:reportId'],
      [E2EAutoGenController.prototype.listConfigs, 0, 'configs'],
      [E2EAutoGenController.prototype.createConfig, 1, 'configs'],
      [E2EAutoGenController.prototype.updateConfig, 1, 'configs/:configId'],
      [E2EAutoGenController.prototype.health, 0, 'health'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
