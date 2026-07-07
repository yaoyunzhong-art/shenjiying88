import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { LLMConfigService, LLMProvider } from './llm-config.service'

describe('LLMConfigService', () => {
  let service: LLMConfigService

  beforeEach(() => {
    service = new LLMConfigService()
  })

  describe('createConfig', () => {
    it('should create LLM config', () => {
      const config = service.createConfig({
        name: 'Test Config',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'test-key',
        maxTokens: 1000,
        temperature: 0.7,
        topP: 0.9,
      })
      expect(config.id).toBeDefined()
      expect(config.name).toBe('Test Config')
      expect(config.apiKey).toBe('***')
    })

    it('should create Azure OpenAI config', () => {
      const config = service.createConfig({
        name: 'Azure Config',
        provider: LLMProvider.AZURE_OPENAI,
        model: 'gpt-4',
        apiKey: 'azure-key',
        apiBase: 'https://example.openai.azure.com',
        apiVersion: '2024-01-01',
      })
      expect(config.provider).toBe(LLMProvider.AZURE_OPENAI)
    })

    it('should create Claude config', () => {
      const config = service.createConfig({
        name: 'Claude Config',
        provider: LLMProvider.ANTHROPIC,
        model: 'claude-3-opus',
        apiKey: 'claude-key',
      })
      expect(config.provider).toBe(LLMProvider.ANTHROPIC)
    })
  })

  describe('getConfig', () => {
    it('should return config by id', () => {
      const created = service.createConfig({
        name: 'Test Config',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'test-key',
      })
      const config = service.getConfig(created.id)
      expect(config?.name).toBe('Test Config')
    })

    it('should return null for non-existent config', () => {
      const config = service.getConfig('nonexistent')
      expect(config).toBeNull()
    })
  })

  describe('listConfigs', () => {
    it('should list all configs', () => {
      service.createConfig({
        name: 'Config 1',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'key1',
      })
      service.createConfig({
        name: 'Config 2',
        provider: LLMProvider.ANTHROPIC,
        model: 'claude-3',
        apiKey: 'key2',
      })
      const configs = service.listConfigs()
      expect(configs.length).toBe(2)
    })

    it('should filter by provider', () => {
      service.createConfig({
        name: 'Config 1',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'key1',
      })
      service.createConfig({
        name: 'Config 2',
        provider: LLMProvider.ANTHROPIC,
        model: 'claude-3',
        apiKey: 'key2',
      })
      const configs = service.listConfigs({ provider: LLMProvider.OPENAI })
      expect(configs.every((c: any) => c.provider === LLMProvider.OPENAI)).toBe(true)
    })
  })

  describe('updateConfig', () => {
    it('should update config', () => {
      const created = service.createConfig({
        name: 'Original',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'test-key',
      })
      const updated = service.updateConfig(created.id, { name: 'Updated' })
      expect(updated?.name).toBe('Updated')
    })
  })

  describe('deleteConfig', () => {
    it('should delete config', () => {
      const created = service.createConfig({
        name: 'To Delete',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'test-key',
      })
      const result = service.deleteConfig(created.id)
      expect(result).toBe(true)
      expect(service.getConfig(created.id)).toBeNull()
    })
  })

  describe('validateConfig', () => {
    it('should validate OpenAI config', () => {
      const config = service.createConfig({
        name: 'Test',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'sk-test',
      })
      const result = service.validateConfig(config.id)
      expect(result.valid).toBe(true)
    })

    it('should validate Azure OpenAI config', () => {
      const config = service.createConfig({
        name: 'Azure Test',
        provider: LLMProvider.AZURE_OPENAI,
        model: 'gpt-4',
        apiKey: 'azure-key',
        apiBase: 'https://example.openai.azure.com',
        apiVersion: '2024-01-01',
      })
      const result = service.validateConfig(config.id)
      expect(result.valid).toBe(true)
    })

    it('should validate Claude config', () => {
      const config = service.createConfig({
        name: 'Claude Test',
        provider: LLMProvider.ANTHROPIC,
        model: 'claude-3-opus',
        apiKey: 'claude-key',
      })
      const result = service.validateConfig(config.id)
      expect(result.valid).toBe(true)
    })
  })

  describe('testConnection', () => {
    it('should test connection', async () => {
      const config = service.createConfig({
        name: 'Test',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'sk-test',
      })
      const result = await service.testConnection(config.id)
      expect(result.success).toBe(true)
    })
  })

  describe('getDefaultConfig', () => {
    it('should return default config', () => {
      const config = service.getDefaultConfig()
      expect(config).toBeDefined()
    })
  })

  describe('setDefaultConfig', () => {
    it('should set default config', () => {
      const created = service.createConfig({
        name: 'New Default',
        provider: LLMProvider.OPENAI,
        model: 'gpt-4',
        apiKey: 'test-key',
      })
      service.setDefaultConfig(created.id)
      const defaultConfig = service.getDefaultConfig()
      expect(defaultConfig?.id).toBe(created.id)
    })
  })
})
