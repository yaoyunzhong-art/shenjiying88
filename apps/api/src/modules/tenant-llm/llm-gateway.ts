/**
 * Phase-35: 智能体接入模块 - 多租户LLM网关
 *
 * 提供完全隔离的LLM调用能力，每个站点的调用链路独立
 */

import { Injectable, UnauthorizedException } from '@nestjs/common'
import { TenantLLMService } from './llm-config.service'
import { LLMCallRequest, LLMCallResult, ToolDefinition } from './llm-config.entity'

/** LLM Provider API端点映射 */
const PROVIDER_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  qwen: 'https://dashscope.aliyuncs.com/api/v1',
  moonshot: 'https://api.moonshot.cn/v1',
  minimax: 'https://api.minimax.chat/v1',
}

/** 模型定价 (USD per 1M tokens) */
const MODEL_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gpt-4': { prompt: 30, completion: 60 },
  'gpt-4-turbo': { prompt: 10, completion: 30 },
  'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
  'claude-3-opus': { prompt: 15, completion: 75 },
  'claude-3-sonnet': { prompt: 3, completion: 15 },
  'claude-3-haiku': { prompt: 0.25, completion: 1.25 },
  'deepseek-v3': { prompt: 0.5, completion: 1.5 },
  'qwen-turbo': { prompt: 0.6, completion: 1.8 },
  'qwen-plus': { prompt: 4, completion: 12 },
  'moonshot-v1-8k': { prompt: 1, completion: 3 },
  'moonshot-v1-32k': { prompt: 2, completion: 6 },
  'minimax-abab5.5': { prompt: 1, completion: 1 },
}

@Injectable()
export class TenantLLMGateway {
  constructor(private readonly llmService: TenantLLMService) {}

  /**
   * 执行LLM调用（完全隔离的租户上下文）
   */
  async call(
    tenantId: string,
    request: LLMCallRequest
  ): Promise<LLMCallResult> {
    const startTime = Date.now()

    // 1. 获取配置并验证
    const config = await this.llmService.getConfig(request.configId, tenantId)
    if (!config) {
      throw new UnauthorizedException('LLM配置不存在或无权访问')
    }

    if (!config.enabled || config.status !== 'approved') {
      throw new UnauthorizedException('LLM配置未启用或未审批')
    }

    // 2. 配额检查
    if (config.quotaLimit && config.quotaUsed && config.quotaUsed >= config.quotaLimit) {
      throw new UnauthorizedException('LLM配额已用尽')
    }

    try {
      // 3. 获取API Key
      const apiKey = this.llmService.getApiKey(request.configId, tenantId)
      if (!apiKey) {
        throw new Error('API Key未配置')
      }

      // 4. 构建请求
      const endpoint = this.resolveEndpoint(config.provider, config.apiEndpoint)
      const headers = this.buildHeaders(config.provider, apiKey)
      const body = this.buildBody(config, request)

      // 5. 执行调用
      const response = await this.executeRequest(endpoint, headers, body)
      const latencyMs = Date.now() - startTime

      // 6. 解析响应
      const result = this.parseResponse(response, config.provider)

      // 7. 记录调用日志
      await this.llmService.logCall({
        configId: request.configId,
        tenantId,
        sessionId: (request as any).sessionId,
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        totalTokens: result.usage?.totalTokens || 0,
        costEstimate: this.estimateCost(config.modelName, result.usage),
        currency: 'USD',
        latencyMs,
        status: 'success',
      })

      return { ...result, latencyMs } as { content: string; finishReason: 'stop' | 'tool_calls' | 'length' | 'error'; usage?: { promptTokens: number; completionTokens: number; totalTokens: number }; latencyMs: number }
    } catch (error) {
      const latencyMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // 记录错误日志
      await this.llmService.logCall({
        configId: request.configId,
        tenantId,
        sessionId: (request as any).sessionId,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        costEstimate: 0,
        currency: 'USD',
        latencyMs,
        status: 'error',
        errorMessage,
      })

      return {
        content: '',
        finishReason: 'error',
        latencyMs,
        error: errorMessage,
      }
    }
  }

  /**
   * 解析Provider端点
   */
  private resolveEndpoint(provider: string, customEndpoint?: string): string {
    if (customEndpoint) {
      return customEndpoint.endsWith('/') ? customEndpoint.slice(0, -1) : customEndpoint
    }
    return PROVIDER_ENDPOINTS[provider] || PROVIDER_ENDPOINTS.openai
  }

  /**
   * 构建请求头
   */
  private buildHeaders(provider: string, apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    switch (provider) {
      case 'openai':
      case 'deepseek':
      case 'moonshot':
      case 'minimax':
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      case 'anthropic':
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        break
      case 'qwen':
        headers['Authorization'] = `Bearer ${apiKey}`
        break
      default:
        headers['Authorization'] = `Bearer ${apiKey}`
    }

    return headers
  }

  /**
   * 构建请求体
   */
  private buildBody(
    config: { provider: string; modelName: string; temperature: number; maxTokens: number },
    request: LLMCallRequest
  ): Record<string, unknown> {
    const base = {
      model: config.modelName,
      temperature: request.temperature ?? config.temperature,
      max_tokens: request.maxTokens ?? config.maxTokens,
    }

    // Anthropic 使用不同的格式
    if (config.provider === 'anthropic') {
      return {
        model: config.modelName,
        messages: request.messages,
        temperature: request.temperature ?? config.temperature,
        max_tokens: request.maxTokens ?? config.maxTokens,
      }
    }

    // OpenAI 兼容格式
    return {
      ...base,
      messages: request.messages,
      ...(request.tools && { tools: request.tools }),
    }
  }

  /**
   * 执行HTTP请求
   */
  private async executeRequest(
    endpoint: string,
    headers: Record<string, string>,
    body: Record<string, unknown>
  ): Promise<unknown> {
    const path = headers['anthropic-version'] ? '/messages' : '/chat/completions'

    const response = await fetch(`${endpoint}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LLM API调用失败: ${response.status} - ${error}`)
    }

    return response.json()
  }

  /**
   * 解析Provider响应
   */
  private parseResponse(
    response: unknown,
    provider: string
  ): { content: string; finishReason: string; usage?: { promptTokens: number; completionTokens: number; totalTokens: number } } {
    if (provider === 'anthropic') {
      const resp = response as { content: Array<{ text: string }>; usage?: { input_tokens: number; output_tokens: number } }
      return {
        content: resp.content?.[0]?.text || '',
        finishReason: 'stop',
        usage: resp.usage
          ? {
              promptTokens: resp.usage.input_tokens,
              completionTokens: resp.usage.output_tokens,
              totalTokens: resp.usage.input_tokens + resp.usage.output_tokens,
            }
          : undefined,
      }
    }

    // OpenAI兼容格式
    const resp = response as {
      choices?: Array<{ message?: { content: string }; finish_reason?: string }>
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
    }

    return {
      content: resp.choices?.[0]?.message?.content || '',
      finishReason: resp.choices?.[0]?.finish_reason || 'stop',
      usage: resp.usage
        ? {
            promptTokens: resp.usage.prompt_tokens,
            completionTokens: resp.usage.completion_tokens,
            totalTokens: resp.usage.total_tokens,
          }
        : undefined,
    }
  }

  /**
   * 估算调用费用
   */
  private estimateCost(
    modelName: string,
    usage?: { promptTokens: number; completionTokens: number }
  ): number {
    const pricing = MODEL_PRICING[modelName]
    if (!pricing || !usage) return 0

    const promptCost = (usage.promptTokens / 1_000_000) * pricing.prompt
    const completionCost = (usage.completionTokens / 1_000_000) * pricing.completion
    return promptCost + completionCost
  }
}
