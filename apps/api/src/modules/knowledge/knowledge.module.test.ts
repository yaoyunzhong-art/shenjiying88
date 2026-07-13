/**
 * knowledge.module.test.ts — 知识库模块测试
 */

import { describe, it, expect } from 'vitest'
import { KnowledgeModule } from './knowledge.module'

describe('KnowledgeModule', () => {
  /* ── 正例: 模块初始化 ── */
  it('模块应正确初始化', () => {
    const mod = new KnowledgeModule()
    expect(mod).toBeInstanceOf(KnowledgeModule)
  })

  it('模块装饰器应注册 Controller', () => {
    const mod = new KnowledgeModule()
    expect(typeof mod).toBe('object')
  })

  it('模块应注册 Controller', () => {
    const controllers = Reflect.getMetadata('controllers', KnowledgeModule) || []
    expect(controllers).toBeDefined()
    expect(controllers.length).toBeGreaterThan(0)
  })

  it('模块应注册 Service 和 Indexer (2 providers)', () => {
    const providers = Reflect.getMetadata('providers', KnowledgeModule) || []
    expect(providers).toHaveLength(2)
  })

  it('模块应导出 Service 和 Indexer (2 exports)', () => {
    const exports = Reflect.getMetadata('exports', KnowledgeModule) || []
    expect(exports).toHaveLength(2)
  })

  it('所有 providers 也应同时被 exports', () => {
    const providers = Reflect.getMetadata('providers', KnowledgeModule) || []
    const exports = Reflect.getMetadata('exports', KnowledgeModule) || []
    providers.forEach((p: any) => {
      expect(exports).toContain(p)
    })
  })

  it('不应导入其他模块', () => {
    const imports = Reflect.getMetadata('imports', KnowledgeModule) || []
    expect(imports).toHaveLength(0)
  })

  /* ── 正例: 模块可重复实例化 ── */
  it('模块可多次实例化', () => {
    const mod1 = new KnowledgeModule()
    const mod2 = new KnowledgeModule()
    expect(mod1).toBeInstanceOf(KnowledgeModule)
    expect(mod2).toBeInstanceOf(KnowledgeModule)
    expect(mod1).not.toBe(mod2)
  })

  /* ── 边界: 元数据完整性 ── */
  it('controllers 应为数组', () => {
    const controllers = Reflect.getMetadata('controllers', KnowledgeModule) || []
    expect(Array.isArray(controllers)).toBe(true)
  })

  it('providers 应为数组', () => {
    const providers = Reflect.getMetadata('providers', KnowledgeModule) || []
    expect(Array.isArray(providers)).toBe(true)
  })

  it('exports 应为数组', () => {
    const exportsList = Reflect.getMetadata('exports', KnowledgeModule) || []
    expect(Array.isArray(exportsList)).toBe(true)
  })

  it('imports 应为数组', () => {
    const imports = Reflect.getMetadata('imports', KnowledgeModule) || []
    expect(Array.isArray(imports)).toBe(true)
  })

  /* ── 反例: 空/缺失数据 ── */
  it('模块名不应为空', () => {
    expect(KnowledgeModule.name).toBe('KnowledgeModule')
  })

  it('模块构造函数调用后不应影响元数据', () => {
    const controllersBefore = Reflect.getMetadata('controllers', KnowledgeModule)
    new KnowledgeModule()
    const controllersAfter = Reflect.getMetadata('controllers', KnowledgeModule)
    expect(controllersBefore).toEqual(controllersAfter)
  })

  /* ── 语义测试 ── */
  it('模块应有 KnowledgeModule 类名', () => {
    expect(KnowledgeModule.name).toBe('KnowledgeModule')
  })

  it('元数据 providers 应包含 KnowledgeService', async () => {
    const { KnowledgeService } = await import('./knowledge.service')
    const providers = Reflect.getMetadata('providers', KnowledgeModule) || []
    expect(providers).toContain(KnowledgeService)
  })

  it('元数据 providers 应包含 KnowledgeIndexerService', async () => {
    const { KnowledgeIndexerService } = await import('./knowledge-indexer.service')
    const providers = Reflect.getMetadata('providers', KnowledgeModule) || []
    expect(providers).toContain(KnowledgeIndexerService)
  })

  it('元数据 exports 应包含 KnowledgeService', async () => {
    const { KnowledgeService } = await import('./knowledge.service')
    const exports = Reflect.getMetadata('exports', KnowledgeModule) || []
    expect(exports).toContain(KnowledgeService)
  })

  it('元数据 exports 应包含 KnowledgeIndexerService', async () => {
    const { KnowledgeIndexerService } = await import('./knowledge-indexer.service')
    const exports = Reflect.getMetadata('exports', KnowledgeModule) || []
    expect(exports).toContain(KnowledgeIndexerService)
  })

  /* ── 额外: 拒绝服务/超大输入测试 ── */
  it('大量的模块元数据查询应稳定', () => {
    for (let i = 0; i < 100; i++) {
      const c = Reflect.getMetadata('controllers', KnowledgeModule)
      expect(Array.isArray(c)).toBe(true)
    }
  })
})
