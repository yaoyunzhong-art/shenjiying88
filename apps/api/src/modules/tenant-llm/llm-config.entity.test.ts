import { describe, it, expect } from 'vitest'
import {
  LLMProvider,
  LLMConfigStatus,
  LLMCallResult,
  LLMCallRequest,
  ToolDefinition,
  LLMStats,
  LLMCallLog,
  LLMPermission,
  TenantLLMConfig,
  CreateLLMConfigRequest,
  UpdateLLMConfigRequest,
  ApplyLLMConfigRequest,
  GlobalRegionConfig,
} from './llm-config.entity'

describe('llm-config entity - type aliases', () => {
  it('LLMProvider should accept all supported providers', () => {
    const providers: LLMProvider[] = [
      'openai', 'anthropic', 'deepseek', 'qwen',
      'moonshot', 'minimax', 'custom',
    ]
    expect(providers).toHaveLength(7)
    expect(providers).toContain('openai')
    expect(providers).toContain('deepseek')
  })

  it('LLMConfigStatus should accept all status values', () => {
    const statuses: LLMConfigStatus[] = [
      'pending', 'approved', 'rejected', 'suspended',
    ]
    expect(statuses).toHaveLength(4)
    expect(statuses).toContain('pending')
    expect(statuses).toContain('suspended')
  })
})

describe('llm-config entity - TenantLLMConfig', () => {
  it('should be constructable with all fields for a complete config', () => {
    const config: TenantLLMConfig = {
      id: 'llm-cfg-001',
      tenantId: 'tenant-arcade-01',
      siteId: 'site-shanghai',
      storeId: 'store-huangpu',
      name: '沪上AI助手',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiEndpoint: 'https://api.deepseek.com/v1',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 0.9,
      quotaLimit: 1000000,
      quotaUsed: 250000,
      quotaAlertThreshold: 0.8,
      status: 'approved',
      enabled: true,
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-08T00:00:00Z',
      approvedAt: '2026-07-02T00:00:00Z',
      approvedBy: 'admin-01',
    }

    expect(config.id).toBe('llm-cfg-001')
    expect(config.tenantId).toBe('tenant-arcade-01')
    expect(config.name).toBe('沪上AI助手')
    expect(config.provider).toBe('deepseek')
    expect(config.modelName).toBe('deepseek-chat')
    expect(config.temperature).toBe(0.7)
    expect(config.maxTokens).toBe(4096)
    expect(config.topP).toBe(0.9)
    expect(config.status).toBe('approved')
    expect(config.enabled).toBe(true)
    expect(config.quotaLimit).toBe(1000000)
    expect(config.quotaUsed).toBe(250000)
    expect(config.approvedBy).toBe('admin-01')
  })

  it('should allow minimal config without optional fields', () => {
    const config: TenantLLMConfig = {
      id: 'llm-min-001',
      tenantId: 'tenant-min',
      name: '最小配置',
      provider: 'openai',
      modelName: 'gpt-4o-mini',
      temperature: 0.5,
      maxTokens: 2048,
      status: 'pending',
      enabled: false,
      createdAt: '2026-07-08T00:00:00Z',
      updatedAt: '2026-07-08T00:00:00Z',
    }

    expect(config.id).toBe('llm-min-001')
    expect(config.siteId).toBeUndefined()
    expect(config.storeId).toBeUndefined()
    expect(config.apiEndpoint).toBeUndefined()
    expect(config.topP).toBeUndefined()
    expect(config.quotaLimit).toBeUndefined()
    expect(config.quotaUsed).toBeUndefined()
    expect(config.quotaAlertThreshold).toBeUndefined()
    expect(config.approvedAt).toBeUndefined()
    expect(config.approvedBy).toBeUndefined()
    expect(config.enabled).toBe(false)
  })

  it('should support all provider values as TenantLLMConfig provider', () => {
    const providers: Array<{ provider: LLMProvider; model: string }> = [
      { provider: 'openai', model: 'gpt-4o' },
      { provider: 'anthropic', model: 'claude-3-5-sonnet' },
      { provider: 'deepseek', model: 'deepseek-chat' },
      { provider: 'qwen', model: 'qwen-max' },
      { provider: 'moonshot', model: 'moonshot-v1' },
      { provider: 'minimax', model: 'minimax-pro' },
      { provider: 'custom', model: 'custom-model' },
    ]

    for (const p of providers) {
      const config: TenantLLMConfig = {
        id: `llm-${p.provider}`,
        tenantId: 'tenant-test',
        name: `Test-${p.provider}`,
        provider: p.provider,
        modelName: p.model,
        temperature: 0.7,
        maxTokens: 4096,
        status: 'pending',
        enabled: false,
        createdAt: '2026-07-08T00:00:00Z',
        updatedAt: '2026-07-08T00:00:00Z',
      }
      expect(config.provider).toBe(p.provider)
      expect(config.modelName).toBe(p.model)
    }
  })

  it('should support status transitions', () => {
    const pending: TenantLLMConfig = {
      id: 'llm-trans-001',
      tenantId: 'tenant-trans',
      name: '待审批',
      provider: 'qwen',
      modelName: 'qwen-max',
      temperature: 0.8,
      maxTokens: 8192,
      status: 'pending',
      enabled: false,
      createdAt: '2026-07-01T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    }
    expect(pending.status).toBe('pending')
    expect(pending.enabled).toBe(false)

    const approved: TenantLLMConfig = {
      ...pending,
      status: 'approved',
      enabled: true,
      approvedAt: '2026-07-02T00:00:00Z',
      approvedBy: 'admin-001',
      updatedAt: '2026-07-02T00:00:00Z',
    }
    expect(approved.status).toBe('approved')
    expect(approved.enabled).toBe(true)
    expect(approved.approvedBy).toBe('admin-001')

    const suspended: TenantLLMConfig = {
      ...approved,
      status: 'suspended',
      enabled: false,
      updatedAt: '2026-07-08T00:00:00Z',
    }
    expect(suspended.status).toBe('suspended')
    expect(suspended.enabled).toBe(false)
  })
})

describe('llm-config entity - request DTOs', () => {
  it('CreateLLMConfigRequest should accept all fields', () => {
    const req: CreateLLMConfigRequest = {
      name: '门店AI配置',
      provider: 'deepseek',
      modelName: 'deepseek-chat',
      apiEndpoint: 'https://api.deepseek.com',
      apiKey: 'sk-xxxxxxxxxxxxxxxx',
      temperature: 0.6,
      maxTokens: 4096,
      topP: 0.95,
      quotaLimit: 500000,
      quotaAlertThreshold: 0.85,
      siteId: 'site-001',
      storeId: 'store-001',
    }
    expect(req.name).toBe('门店AI配置')
    expect(req.provider).toBe('deepseek')
    expect(req.apiKey).toBe('sk-xxxxxxxxxxxxxxxx')
    expect(req.temperature).toBe(0.6)
  })

  it('CreateLLMConfigRequest should work with only required fields', () => {
    const req: CreateLLMConfigRequest = {
      name: 'Minimal',
      provider: 'openai',
      modelName: 'gpt-4o',
      apiKey: 'sk-min',
    }
    expect(req.name).toBe('Minimal')
    expect(req.apiEndpoint).toBeUndefined()
    expect(req.temperature).toBeUndefined()
    expect(req.quotaLimit).toBeUndefined()
    expect(req.siteId).toBeUndefined()
  })

  it('UpdateLLMConfigRequest should allow partial update', () => {
    const update1: UpdateLLMConfigRequest = {
      temperature: 0.9,
      maxTokens: 8192,
    }
    expect(update1.temperature).toBe(0.9)
    expect(update1.name).toBeUndefined()

    const update2: UpdateLLMConfigRequest = {
      enabled: false,
    }
    expect(update2.enabled).toBe(false)
    expect(update2.provider).toBeUndefined()
  })

  it('UpdateLLMConfigRequest should allow full update', () => {
    const update: UpdateLLMConfigRequest = {
      name: '新名称',
      provider: 'anthropic',
      modelName: 'claude-3-opus',
      apiEndpoint: 'https://api.anthropic.com',
      apiKey: 'sk-anthropic-new',
      temperature: 0.3,
      maxTokens: 16384,
      topP: 0.8,
      quotaLimit: 2000000,
      quotaAlertThreshold: 0.9,
      enabled: true,
    }
    expect(update.name).toBe('新名称')
    expect(update.enabled).toBe(true)
  })

  it('ApplyLLMConfigRequest should validate all fields', () => {
    const valid: ApplyLLMConfigRequest = {
      configId: 'llm-cfg-001',
      useCase: '客户服务智能问答',
      expectedVolume: 50000,
      businessJustification: '提升门店客服效率，24小时自动回复',
    }
    expect(valid.configId).toBe('llm-cfg-001')
    expect(valid.useCase).toContain('客户')
    expect(valid.expectedVolume).toBeGreaterThan(0)
    expect(valid.businessJustification).toBeDefined()

    const minimal: ApplyLLMConfigRequest = {
      configId: 'llm-cfg-002',
      useCase: '简单测试',
      expectedVolume: 100,
    }
    expect(minimal.businessJustification).toBeUndefined()
  })
})

describe('llm-config entity - LLMCallResult & LLMCallRequest', () => {
  it('LLMCallResult should report successful calls', () => {
    const result: LLMCallResult = {
      content: '你好，我是AI助手，有什么可以帮助您的？',
      finishReason: 'stop',
      usage: {
        promptTokens: 150,
        completionTokens: 45,
        totalTokens: 195,
      },
      latencyMs: 1234,
    }
    expect(result.content).toContain('AI助手')
    expect(result.finishReason).toBe('stop')
    expect(result.usage!.totalTokens).toBe(195)
    expect(result.error).toBeUndefined()
  })

  it('LLMCallResult should handle error responses', () => {
    const errorResult: LLMCallResult = {
      content: '',
      finishReason: 'error',
      latencyMs: 5000,
      error: 'API rate limit exceeded',
    }
    expect(errorResult.finishReason).toBe('error')
    expect(errorResult.error).toBe('API rate limit exceeded')
    expect(errorResult.usage).toBeUndefined()
  })

  it('LLMCallResult should support tool calls finish reason', () => {
    const toolResult: LLMCallResult = {
      content: '需要调用查询工具获取信息',
      finishReason: 'tool_calls',
      latencyMs: 800,
    }
    expect(toolResult.finishReason).toBe('tool_calls')
  })

  it('LLMCallRequest should support system messages', () => {
    const req: LLMCallRequest = {
      configId: 'llm-cfg-001',
      messages: [
        { role: 'system', content: '你是一个门店AI助手' },
        { role: 'user', content: '今天有什么促销？' },
      ],
      temperature: 0.3,
      maxTokens: 1024,
    }
    expect(req.messages).toHaveLength(2)
    expect(req.messages[0].role).toBe('system')
    expect(req.temperature).toBe(0.3)
    expect(req.tools).toBeUndefined()
  })

  it('LLMCallRequest should support tool definitions', () => {
    const req: LLMCallRequest = {
      configId: 'llm-cfg-002',
      messages: [{ role: 'user', content: '查询订单状态' }],
      tools: [
        {
          name: 'queryOrder',
          description: '查询订单状态',
          inputSchema: {
            type: 'object',
            properties: { orderId: { type: 'string' } },
            required: ['orderId'],
          },
        },
      ],
    }
    expect(req.tools).toHaveLength(1)
    expect(req.tools![0].name).toBe('queryOrder')
    expect(req.tools![0].inputSchema.required).toContain('orderId')
  })
})

describe('llm-config entity - ToolDefinition', () => {
  it('should support multiple tool definitions', () => {
    const tools: ToolDefinition[] = [
      {
        name: 'getInventory',
        description: '查询商品库存',
        inputSchema: {
          type: 'object',
          properties: { sku: { type: 'string' } },
          required: ['sku'],
        },
      },
      {
        name: 'createTicket',
        description: '创建工单',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: ['title', 'priority'],
        },
      },
    ]
    expect(tools).toHaveLength(2)
    expect(tools[0].name).toBe('getInventory')
    expect(tools[1].inputSchema.required).toEqual(['title', 'priority'])
  })
})

describe('llm-config entity - LLMStats', () => {
  it('should return comprehensive statistics', () => {
    const stats: LLMStats = {
      totalCalls: 1500,
      successCalls: 1420,
      failedCalls: 80,
      totalPromptTokens: 450000,
      totalCompletionTokens: 120000,
      totalTokens: 570000,
      totalCost: 28.50,
      currency: 'USD',
      avgLatencyMs: 890,
      periodStart: '2026-07-01T00:00:00Z',
      periodEnd: '2026-07-08T00:00:00Z',
    }
    expect(stats.totalCalls).toBe(1500)
    expect(stats.successRate).toBeUndefined()
    expect(stats.failedCalls + stats.successCalls).toBe(stats.totalCalls)
    expect(stats.totalTokens).toBe(stats.totalPromptTokens + stats.totalCompletionTokens)
    expect(stats.avgLatencyMs).toBeLessThan(1000)
  })

  it('should handle zero calls scenario', () => {
    const empty: LLMStats = {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      currency: 'USD',
      avgLatencyMs: 0,
      periodStart: '2026-07-01T00:00:00Z',
      periodEnd: '2026-07-08T00:00:00Z',
    }
    expect(empty.avgLatencyMs).toBe(0)
    expect(empty.totalCost).toBe(0)
  })
})

describe('llm-config entity - LLMCallLog', () => {
  it('should record a successful call log', () => {
    const log: LLMCallLog = {
      id: 'log-001',
      configId: 'llm-cfg-001',
      tenantId: 'tenant-arcade',
      sessionId: 'sess-abc-123',
      promptTokens: 200,
      completionTokens: 80,
      totalTokens: 280,
      costEstimate: 0.014,
      currency: 'USD',
      latencyMs: 950,
      status: 'success',
      createdAt: '2026-07-08T10:30:00Z',
    }
    expect(log.status).toBe('success')
    expect(log.totalTokens).toBe(280)
    expect(log.costEstimate).toBeGreaterThan(0)
    expect(log.sessionId).toBeDefined()
  })

  it('should record an error call log', () => {
    const log: LLMCallLog = {
      id: 'log-002',
      configId: 'llm-cfg-002',
      tenantId: 'tenant-arcade',
      promptTokens: 50,
      completionTokens: 0,
      totalTokens: 50,
      costEstimate: 0,
      currency: 'USD',
      latencyMs: 30000,
      status: 'timeout',
      errorMessage: 'Request timed out after 30s',
      createdAt: '2026-07-08T10:31:00Z',
    }
    expect(log.status).toBe('timeout')
    expect(log.errorMessage).toContain('timed out')
    expect(log.completionTokens).toBe(0)
  })

  it('should allow optional sessionId to be absent', () => {
    const log: LLMCallLog = {
      id: 'log-003',
      configId: 'llm-cfg-003',
      tenantId: 'tenant-arcade',
      promptTokens: 100,
      completionTokens: 50,
      totalTokens: 150,
      costEstimate: 0.008,
      currency: 'USD',
      latencyMs: 600,
      status: 'success',
      createdAt: '2026-07-08T10:32:00Z',
    }
    expect(log.sessionId).toBeUndefined()
    expect(log.errorMessage).toBeUndefined()
  })
})

describe('llm-config entity - LLMPermission', () => {
  it('should support admin role permissions', () => {
    const adminPerm: LLMPermission = {
      roleId: 'role-admin',
      roleName: '管理员',
      canView: true,
      canEdit: true,
      canDelete: true,
      allowedTools: ['*'],
    }
    expect(adminPerm.canView).toBe(true)
    expect(adminPerm.canEdit).toBe(true)
    expect(adminPerm.canDelete).toBe(true)
    expect(adminPerm.allowedTools).toContain('*')
  })

  it('should support operator role with limited permissions', () => {
    const operatorPerm: LLMPermission = {
      roleId: 'role-operator',
      roleName: '运营专员',
      canView: true,
      canEdit: false,
      canDelete: false,
      allowedTools: ['queryOrder', 'getInventory'],
    }
    expect(operatorPerm.canView).toBe(true)
    expect(operatorPerm.canEdit).toBe(false)
    expect(operatorPerm.canDelete).toBe(false)
    expect(operatorPerm.allowedTools).toHaveLength(2)
  })

  it('should support viewer role read-only', () => {
    const viewerPerm: LLMPermission = {
      roleId: 'role-viewer',
      roleName: '查看者',
      canView: true,
      canEdit: false,
      canDelete: false,
      allowedTools: [],
    }
    expect(viewerPerm.canView).toBe(true)
    expect(viewerPerm.canEdit).toBe(false)
    expect(viewerPerm.allowedTools).toHaveLength(0)
  })
})

describe('llm-config entity - GlobalRegionConfig', () => {
  it('should have all region configuration fields', () => {
    const region: GlobalRegionConfig = {
      regionCode: 'CN-SH',
      regionName: '上海',
      language: 'zh-CN',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      socialChannels: ['wechat', 'weibo', 'douyin'],
    }
    expect(region.regionCode).toBe('CN-SH')
    expect(region.language).toBe('zh-CN')
    expect(region.currency).toBe('CNY')
    expect(region.timezone).toBe('Asia/Shanghai')
    expect(region.socialChannels).toHaveLength(3)
  })

  it('should support global/US region config', () => {
    const region: GlobalRegionConfig = {
      regionCode: 'US-CA',
      regionName: 'California',
      language: 'en-US',
      currency: 'USD',
      timezone: 'America/Los_Angeles',
      socialChannels: ['facebook', 'instagram', 'tiktok', 'twitter'],
    }
    expect(region.socialChannels).toHaveLength(4)
    expect(region.socialChannels).toContain('tiktok')
  })
})

describe('llm-config entity - edge cases', () => {
  it('should support empty socialChannels in GlobalRegionConfig', () => {
    const region: GlobalRegionConfig = {
      regionCode: 'XX-YY',
      regionName: '测试区域',
      language: 'test',
      currency: 'XXX',
      timezone: 'UTC',
      socialChannels: [],
    }
    expect(region.socialChannels).toHaveLength(0)
  })

  it('should allow empty allowedTools in LLMPermission', () => {
    const perm: LLMPermission = {
      roleId: 'role-test',
      roleName: '测试角色',
      canView: true,
      canEdit: false,
      canDelete: false,
      allowedTools: [],
    }
    expect(perm.allowedTools).toEqual([])
  })

  it('should handle null quota values', () => {
    const config: TenantLLMConfig = {
      id: 'llm-edge-001',
      tenantId: 'tenant-edge',
      name: '无配额限制',
      provider: 'openai',
      modelName: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4096,
      status: 'approved',
      enabled: true,
      createdAt: '2026-07-08T00:00:00Z',
      updatedAt: '2026-07-08T00:00:00Z',
    }
    expect(config.quotaLimit).toBeUndefined()
    expect(config.quotaUsed).toBeUndefined()
    expect(config.quotaAlertThreshold).toBeUndefined()
  })
})
