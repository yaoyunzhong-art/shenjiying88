/**
 * ai-model-config.service.comprehensive.test.ts — AI 模型配置 Service 深层测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiModelConfigService } from './ai-model-config.service'

describe('AiModelConfigService (Complete)', () => {
  let service: AiModelConfigService

  beforeEach(() => { service = new AiModelConfigService() })

  it('getModels 应返回模型列表', () => {
    const models = service.getModels()
    expect(models).toBeInstanceOf(Array)
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
