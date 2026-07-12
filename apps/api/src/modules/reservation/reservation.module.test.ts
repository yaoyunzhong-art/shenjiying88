/**
 * 🐜 自动: [reservation] [A] module.test 补全
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'

describe('ReservationModule', () => {
  it('should be defined', () => {
    const mod = new ReservationModule()
    assert.ok(mod instanceof ReservationModule)
  })

  it('should have correct module metadata', async () => {
    const { ReservationModule } = await import('./reservation.module')
    const { ReservationController } = await import('./reservation.controller')
    const { ReservationService } = await import('./reservation.service')

    const controllers = Reflect.getMetadata('controllers', ReservationModule)
    const providers = Reflect.getMetadata('providers', ReservationModule)
    const exports = Reflect.getMetadata('exports', ReservationModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers?.includes?.(ReservationController))
    assert.ok(providers?.includes?.(ReservationService))
    assert.ok(exports?.includes?.(ReservationService))
  })
})
