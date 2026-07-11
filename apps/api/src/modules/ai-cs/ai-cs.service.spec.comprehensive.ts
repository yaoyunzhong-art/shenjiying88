/**
 * ai-cs.service.spec.ts — 扩展版 AI 客服 Service 综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiCsService } from './ai-cs.service'

describe('AiCsService', () => {
  let service: AiCsService

  beforeEach(() => {
    service = new AiCsService()
  })

  describe('query', () => {
    it('应返回客服回答', async () => {
      const answer = await service.query('如何重置密码？')
      expect(answer).toBeDefined()
      expect(typeof answer).toBe('string')
    })
  })

  describe('handleConversation', () => {
    it('应处理对话消息并返回回复', () => {
      const reply = service.handleConversation('如何退货？')
      expect(reply).toBeDefined()
    })
  })
})

describe('CsEngine (via service)', () => {
  it('应支持多轮上下文', () => {
    const reply1 = service.handleConversation('你好')
    const reply2 = service.handleConversation('我想退货')
    expect(reply1).toBeDefined()
    expect(reply2).toBeDefined()
  })
})

/**
 * ai-model-config.service.spec.ts — 扩展版 AI 模型配置 Service 测试
 */
import { AiModelConfigService } from './ai-model-config.service'

describe('AiModelConfigService', () => {
  let service: AiModelConfigService

  beforeEach(() => {
    service = new AiModelConfigService()
  })

  it('应返回模型列表', () => {
    const models = service.getModels()
    expect(models).toBeInstanceOf(Array)
  })

  it('应获取模型配置', () => {
    const config = service.getConfig('model-1')
    expect(config).toBeDefined()
  })

  it('应更新模型配置', () => {
    const updated = service.updateConfig('model-1', { temperature: 0.8 })
    expect(updated).toBeDefined()
  })

  it('应切换模型版本', () => {
    const result = service.switchVersion('model-1', '2.0')
    expect(result).toBeDefined()
  })

  it('应删除模型配置', () => {
    const result = service.deleteConfig('model-1')
    expect(result).toBe(true)
  })
})
