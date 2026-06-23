/**
 * 🐜 自动: [svip] [A] module.test 补全
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'

describe('SvipModule', () => {
  test('should be defined', () => {
    const { SvipModule } = require('./svip.module')
    const mod = new SvipModule()
    assert.ok(mod instanceof SvipModule)
  })

  test('should have correct module metadata', () => {
    const { SvipModule } = require('./svip.module')
    const { SvipController } = require('./svip.controller')
    const { SvipService } = require('./svip.service')

    const controllers = Reflect.getMetadata('controllers', SvipModule)
    const providers = Reflect.getMetadata('providers', SvipModule)
    const exports = Reflect.getMetadata('exports', SvipModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(SvipController))
    assert.ok(providers.includes(SvipService))
    assert.ok(exports.includes(SvipService))
  })
})
