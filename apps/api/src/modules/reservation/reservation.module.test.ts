/**
 * reservation.module.test.ts — 模块元数据验证
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'

let ReservationModule: new () => void
let ReservationController: new () => void
let ReservationService: new () => void

describe('ReservationModule', () => {
  beforeAll(async () => {
    const mod = await import('./reservation.module')
    ReservationModule = mod.ReservationModule
    const ctrl = await import('./reservation.controller')
    ReservationController = ctrl.ReservationController
    const svc = await import('./reservation.service')
    ReservationService = svc.ReservationService
  })

  it('should be defined', () => {
    const instance = new ReservationModule()
    assert.ok(instance instanceof ReservationModule)
  })

  it('should have correct module metadata', () => {
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
