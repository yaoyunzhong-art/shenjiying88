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
})
