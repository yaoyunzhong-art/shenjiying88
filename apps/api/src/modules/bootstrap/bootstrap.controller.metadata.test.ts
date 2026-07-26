import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { BootstrapController } from './bootstrap.controller'

describe('BootstrapController metadata', () => {
  it('controller should keep bootstrap path', () => {
    assert.equal(Reflect.getMetadata('path', BootstrapController), 'bootstrap')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [BootstrapController.prototype.getHealth, 0, 'health'],
      [BootstrapController.prototype.getBootstrapMetadata, 0, 'metadata'],
      [BootstrapController.prototype.getModules, 0, 'modules'],
      [BootstrapController.prototype.getModule, 0, 'modules/:module'],
      [BootstrapController.prototype.registerModule, 1, 'modules/register'],
      [BootstrapController.prototype.markRunning, 1, 'mark-running'],
      [BootstrapController.prototype.getSummary, 0, 'summary'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
