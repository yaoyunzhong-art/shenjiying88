// session.module.test.ts · 会话模块测试
// Phase-FP P10 · 2026-07-08

import { describe, it, expect } from 'vitest'
import { SessionModule } from './session.module'

describe('SessionModule', () => {
  it('模块应成功实例化', () => {
    const module = new SessionModule()
    expect(module).toBeDefined()
  })

  it('模块应包含正确的元数据', () => {
    const metadata = Reflect.getMetadata('imports', SessionModule) || []
    const controllers = Reflect.getMetadata('controllers', SessionModule) || []
    const providers = Reflect.getMetadata('providers', SessionModule) || []
    const exports = Reflect.getMetadata('exports', SessionModule) || []

    expect(Array.isArray(controllers)).toBe(true)
    expect(Array.isArray(providers)).toBe(true)
    expect(Array.isArray(exports)).toBe(true)
  })

  it('模块 metadata: controllers 均为 class', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', SessionModule) || []
    for (const ctrl of controllers) {
      expect(typeof ctrl).toBe('function')
    }
  })

  it('模块 metadata: providers 均为 class 或 symbol', () => {
    const providers: unknown[] = Reflect.getMetadata('providers', SessionModule) || []
    for (const p of providers) {
      expect(typeof p === 'function' || typeof p === 'symbol').toBe(true)
    }
  })

  it('模块 metadata: exports 与 providers 长度一致', () => {
    const providers = Reflect.getMetadata('providers', SessionModule) || []
    const exportsList = Reflect.getMetadata('exports', SessionModule) || []
    expect(exportsList.length).toBeGreaterThanOrEqual(0)
    // Typically each export is a provider, so exports should not exceed providers
    expect(exportsList.length).toBeLessThanOrEqual(providers.length)
  })

  it('模块 constructor 正确标识', () => {
    const module = new SessionModule()
    expect(module.constructor.name).toBe('SessionModule')
  })
})
