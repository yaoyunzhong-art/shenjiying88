/**
 * 🐜 自动: [push] [D] module test 补全
 */
import { describe, it, expect } from 'vitest'
import { PushModule } from './push.module'

describe('PushModule', () => {
  it('PUSH-MODULE-1 module should be defined', () => {
    expect(PushModule).toBeDefined()
  })

  it('PUSH-MODULE-2 should have controllers array', () => {
    const controllers = Reflect.getMetadata('controllers', PushModule) ?? []
    expect(Array.isArray(controllers)).toBe(true)
    expect(controllers.length).toBeGreaterThan(0)
  })

  it('PUSH-MODULE-3 should have providers array', () => {
    const providers = Reflect.getMetadata('providers', PushModule) ?? []
    expect(Array.isArray(providers)).toBe(true)
    expect(providers.length).toBeGreaterThan(0)
  })

  it('PUSH-MODULE-4 should export services', () => {
    const exports = Reflect.getMetadata('exports', PushModule) ?? []
    expect(Array.isArray(exports)).toBe(true)
    expect(exports.length).toBeGreaterThan(0)
  })
})
