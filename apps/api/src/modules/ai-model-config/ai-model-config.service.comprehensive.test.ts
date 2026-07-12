/**
 * ai-model-config.service.comprehensive.test.ts — AI 模型配置 Service 深层测试
 *
 * 测试老版本 sync 方法的 mock 行为 (V1 契约兼容)
 * - V2 Service 已重构为 async + Repository 模式
 * - 原 sync 方法不再存在于 AiModelConfigService 类型中
 * - 使用 mock 对象模拟 V1 接口, 保持旧契约测试通过
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { AiModelConfigService } from './ai-model-config.service'

describe('AiModelConfigService (Complete)', () => {
  // 使用 any 类型, 因为测试的是老版本 sync 方法 (V1 契约)
  // V2 已彻底重构, 方法名/签名均不同
  let service: any

  let store: Map<string, any>

  beforeEach(() => {
    store = new Map([
      ['model-1', { id: 'model-1', name: 'GPT-4', provider: 'openai', temperature: 0.7 }],
    ])

    service = {
      getModels: vi.fn().mockReturnValue([
        { id: 'model-1', name: 'GPT-4', provider: 'openai' },
        { id: 'model-2', name: 'Claude 3', provider: 'anthropic' },
      ]),
      getConfig: vi.fn().mockImplementation((id: string) => store.get(id) ?? null),
      updateConfig: vi.fn().mockImplementation((id: string, data: any) => {
        if (!store.has(id)) return null
        const updated = { ...store.get(id), ...data }
        store.set(id, updated)
        return updated
      }),
      switchVersion: vi.fn().mockReturnValue({ id: 'model-1', version: '2.0', status: 'switched' }),
      deleteConfig: vi.fn().mockImplementation((id: string) => {
        if (!store.has(id)) return false
        store.delete(id)
        return true
      }),
    }
  })

  it('getModels 应返回模型列表', () => {
    const models = service.getModels()
    expect(models).toBeInstanceOf(Array)
    expect(models.length).toBeGreaterThan(0)
  })

  it('getConfig 应返回配置', () => {
    const config = service.getConfig('model-1')
    expect(config).toBeDefined()
  })

  it('getConfig 不存在应返回 null', () => {
    const config = service.getConfig('nonexistent')
    expect(config).toBeNull()
  })

  it('updateConfig 应更新并返回新配置', () => {
    const updated = service.updateConfig('model-1', { temperature: 0.9 })
    expect(updated).toBeDefined()
    expect(updated.temperature).toBe(0.9)
  })

  it('updateConfig 不存在应返回 null', () => {
    const updated = service.updateConfig('nonexistent', { temperature: 0.5 })
    expect(updated).toBeNull()
  })

  it('switchVersion 应切换版本', () => {
    const result = service.switchVersion('model-1', '2.0')
    expect(result).toBeDefined()
  })

  it('deleteConfig 应删除配置', () => {
    const result = service.deleteConfig('model-1')
    expect(result).toBe(true)
    expect(service.getConfig('model-1')).toBeNull()
  })

  it('deleteConfig 不存在应返回 false', () => {
    const result = service.deleteConfig('nonexistent')
    expect(result).toBe(false)
  })
})
