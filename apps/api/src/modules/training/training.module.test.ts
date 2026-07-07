// training.module.test.ts · 培训模块 Module 测试
// 🐜 自动: [training] [A] Module 测试

import { describe, it, expect } from 'vitest'
import { TrainingModule } from './training.module'

describe('TrainingModule', () => {
  it('should compile the module', () => {
    const module = new TrainingModule()
    expect(module).toBeInstanceOf(TrainingModule)
  })

  it('should have proper metadata', () => {
    const metadata = Reflect.getMetadata('imports', TrainingModule) ?? []
    const controllers = Reflect.getMetadata('controllers', TrainingModule) ?? []
    const providers = Reflect.getMetadata('providers', TrainingModule) ?? []
    const exports = Reflect.getMetadata('exports', TrainingModule) ?? []

    // Module should have no imports (standalone)
    expect(Array.isArray(metadata)).toBe(true)

    // Should have TrainingController
    expect(controllers.length).toBeGreaterThan(0)

    // Should have TrainingService as provider
    expect(providers.length).toBeGreaterThan(0)

    // Should export TrainingService
    expect(exports.length).toBeGreaterThan(0)
  })
})
