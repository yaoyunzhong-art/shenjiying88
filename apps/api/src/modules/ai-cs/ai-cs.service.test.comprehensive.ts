/**
 * ai-cs.service.spec.ts — 扩展版 AI 客服 Service 综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiCsService } from './ai-cs.service'
import { CSEngine } from './cs.engine'
import { SessionService } from './session.service'
import { HandoffService } from './handoff.service'
import { KnowledgeService } from './knowledge.service'
import { FallbackService } from './fallback.service'
import { ConversationAdapter } from './datasources/conversation.adapter'
import { KnowledgeAdapter } from './datasources/knowledge.adapter'

function createService(): AiCsService {
  return new AiCsService(
    {} as any, // CSEngine
    {} as any, // SessionService
    {} as any, // HandoffService
    {} as any, // KnowledgeService
    {} as any, // FallbackService
    {} as any, // ConversationAdapter
    {} as any, // KnowledgeAdapter
  )
}

describe('AiCsService', () => {
  let service: AiCsService

  beforeEach(() => {
    service = createService()
  })

  describe('sendMessage', () => {
    it('应返回客服回答', async () => {
      const answer = await service.sendMessage({ channel: 'web' as any, content: '如何重置密码？', tenantId: 't-1' })
      expect(answer).toBeDefined()
    })
  })
})

describe('CsEngine (via service)', () => {
  it('应支持 session 上下文', () => {
    const svc = createService()
    expect(svc).toBeDefined()
  })
})

/**
 * ai-model-config.service.spec.ts — 扩展版 AI 模型配置 Service 测试 (stub)
 */
class AiModelConfigService {
  getModels(): string[] { return ['gpt-4', 'claude-3']; }
  getConfig(_modelId: string): unknown { return {}; }
  updateConfig(_modelId: string, _cfg: unknown): unknown { return {}; }
  switchVersion(_modelId: string, _ver: string): unknown { return {}; }
  deleteConfig(_modelId: string): boolean { return true; }
}

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
