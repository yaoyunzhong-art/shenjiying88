import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [reservation] [A] module.test 补全
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'

describe('ReservationModule', () => {
  it('should be defined', () => {
    const { ReservationModule } = require('./reservation.module')
    const mod = new ReservationModule()
    assert.ok(mod instanceof ReservationModule)
  })

  it('should have correct module metadata', () => {
    const { ReservationModule } = require('./reservation.module')
    const { ReservationController } = require('./reservation.controller')
    const { ReservationService } = require('./reservation.service')

    const controllers = Reflect.getMetadata('controllers', ReservationModule)
    const providers = Reflect.getMetadata('providers', ReservationModule)
    const exports = Reflect.getMetadata('exports', ReservationModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(ReservationController))
    assert.ok(providers.includes(ReservationService))
    assert.ok(exports.includes(ReservationService))
  })
})
