/**
 * ai-rag.module.test.ts - RAG 知识库模块测试
 */
import { describe, it, expect } from 'vitest'
import { AiRagModule } from './ai-rag.module'

describe('AiRagModule', () => {
  it('RAG-MODULE-1 should be defined', () => {
    expect(AiRagModule).toBeDefined()
  })

  it('RAG-MODULE-2 should have controllers array', () => {
    const metadata = Reflect.getMetadata('imports', AiRagModule) ?? []
    const controllers = Reflect.getMetadata('controllers', AiRagModule) ?? []
    expect(Array.isArray(controllers)).toBe(true)
    expect(controllers.length).toBeGreaterThan(0)
  })

  it('RAG-MODULE-3 should have providers array', () => {
    const providers = Reflect.getMetadata('providers', AiRagModule) ?? []
    expect(Array.isArray(providers)).toBe(true)
    expect(providers.length).toBeGreaterThan(0)
  })

  it('RAG-MODULE-4 should export services', () => {
    const exports = Reflect.getMetadata('exports', AiRagModule) ?? []
    expect(Array.isArray(exports)).toBe(true)
    expect(exports.length).toBeGreaterThan(0)
  })
})
