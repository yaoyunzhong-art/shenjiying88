// ai-content.module.test.ts · AI 内容模块测试
// Phase-T114-3 · 2026-07-08

import { describe, it, expect } from 'vitest'
import { AiContentModule } from './ai-content.module'

describe('AiContentModule', () => {
  it('模块应成功实例化', () => {
    const module = new AiContentModule()
    expect(module).toBeDefined()
  })

  it('模块应包含正确的元数据', () => {
    const controllers = Reflect.getMetadata('controllers', AiContentModule) || []
    const providers = Reflect.getMetadata('providers', AiContentModule) || []
    const exports = Reflect.getMetadata('exports', AiContentModule) || []

    expect(Array.isArray(controllers)).toBe(true)
    expect(Array.isArray(providers)).toBe(true)
    expect(Array.isArray(exports)).toBe(true)
    expect(controllers.length).toBeGreaterThanOrEqual(1)
    expect(providers.length).toBeGreaterThanOrEqual(1)
  })

  it('模块应注册 AiContentController', () => {
    const controllers = Reflect.getMetadata('controllers', AiContentModule) || []
    const names = controllers.map((c: any) => c.name)
    expect(names).toContain('AiContentController')
  })

  it('模块应注册所有必要的 provider', () => {
    const providers = Reflect.getMetadata('providers', AiContentModule) || []
    const names = providers.map((p: any) => (typeof p === 'function' ? p.name : p.provide?.name || ''))

    expect(names).toContain('TeamBuildingReportGenerator')
    expect(names).toContain('ContentModerationService')
    expect(names).toContain('VideoDeduplicationService')
    expect(names).toContain('ProgressAnalyzer')
  })

  it('模块应导出所有 provider', () => {
    const exports = Reflect.getMetadata('exports', AiContentModule) || []
    const names = exports.map((e: any) => (typeof e === 'function' ? e.name : ''))

    expect(names).toContain('TeamBuildingReportGenerator')
    expect(names).toContain('ContentModerationService')
    expect(names).toContain('VideoDeduplicationService')
    expect(names).toContain('ProgressAnalyzer')
  })
})
