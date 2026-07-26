import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { PlatformController } from './platform.controller'

describe('PlatformController metadata', () => {
  it('controller should keep platform path', () => {
    assert.equal(Reflect.getMetadata('path', PlatformController), 'platform')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [PlatformController.prototype.overview, 0, '/'],
      [PlatformController.prototype.health, 0, 'health'],
      [PlatformController.prototype.uptime, 0, 'uptime'],
      [PlatformController.prototype.recordMetric, 1, 'metrics'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
