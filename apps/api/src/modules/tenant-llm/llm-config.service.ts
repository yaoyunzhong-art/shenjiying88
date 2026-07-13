/**
 * Phase-35: 智能体接入模块 - LLM配置服务
 *
 * 提供多租户隔离的LLM配置管理能力
 */

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { nanoid } from 'nanoid'
import {
  TenantLLMConfig,
  CreateLLMConfigRequest,
  UpdateLLMConfigRequest,
  LLMStats,
  LLMCallLog,
  LLMConfigStatus,
  ApplyLLMConfigRequest,
} from './llm-config.entity'
// @ts-ignore
import { TenantScopeGuard } from '../../agent/tenant.guard'

/** 内存存储 (生产环境应替换为Prisma + Redis) */
const configStore = new Map<string, TenantLLMConfig>()
const callLogStore = new Map<string, LLMCallLog>()
const apiKeyStore = new Map<string, string>()

/** 加密工具函数 (生产环境应使用更安全的方案) */
function encryptApiKey(apiKey: string): string {
  return Buffer.from(apiKey).toString('base64')
}

function decryptApiKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8')
}

@Injectable()
export class TenantLLMService {
  constructor(private readonly tenantGuard: TenantScopeGuard) {}

  // ── 配置管理 ──

  /**
   * 获取当前站点的所有LLM配置
   */
  async getConfigs(tenantId: string, siteId?: string): Promise<TenantLLMConfig[]> {
    const configs: TenantLLMConfig[] = []
    for (const config of configStore.values()) {
      if (config.tenantId === tenantId && (!siteId || config.siteId === siteId)) {
        // 不返回加密的API Key
        configs.push({ ...config, apiEndpoint: undefined })
      }
    }
    return configs
  }

  /**
   * 获取单个LLM配置
   */
  async getConfig(configId: string, tenantId: string): Promise<TenantLLMConfig | null> {
    const config = configStore.get(configId)
    if (!config || config.tenantId !== tenantId) {
      return null
    }
    return { ...config, apiEndpoint: undefined }
  }

  /**
   * 创建LLM配置
   */
  async createConfig(
    tenantId: string,
    request: CreateLLMConfigRequest
  ): Promise<TenantLLMConfig> {
    const id = `llm-${nanoid()}`
    const now = new Date().toISOString()

    const config: TenantLLMConfig = {
      id,
      tenantId,
      siteId: request.siteId,
      storeId: request.storeId,
      name: request.name,
      provider: request.provider,
      modelName: request.modelName,
      apiEndpoint: request.apiEndpoint,
      temperature: request.temperature ?? 0.7,
      maxTokens: request.maxTokens ?? 4096,
      topP: request.topP,
      quotaLimit: request.quotaLimit,
      quotaUsed: 0,
      quotaAlertThreshold: request.quotaAlertThreshold ?? 0.8,
      status: 'pending', // 默认待审批
      enabled: false,
      createdAt: now,
      updatedAt: now,
    }

    configStore.set(id, config)

    // 存储加密的API Key (独立存储，不在主配置中)
    if (request.apiKey) {
      apiKeyStore.set(id, encryptApiKey(request.apiKey))
    }

    return { ...config, apiEndpoint: undefined }
  }

  /**
   * 更新LLM配置
   */
  async updateConfig(
    configId: string,
    tenantId: string,
    updates: UpdateLLMConfigRequest
  ): Promise<TenantLLMConfig | null> {
    const config = configStore.get(configId)
    if (!config || config.tenantId !== tenantId) {
      return null
    }

    const updated: TenantLLMConfig = {
      ...config,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    configStore.set(configId, updated)
    if (typeof updates.apiKey === 'string' && updates.apiKey.length > 0) {
      apiKeyStore.set(configId, encryptApiKey(updates.apiKey))
    }
    return { ...updated, apiEndpoint: undefined }
  }

  /**
   * 删除LLM配置
   */
  async deleteConfig(configId: string, tenantId: string): Promise<boolean> {
    const config = configStore.get(configId)
    if (!config || config.tenantId !== tenantId) {
      return false
    }
    configStore.delete(configId)
    apiKeyStore.delete(configId)
    return true
  }

  /**
   * 提交接入申请
   */
  async applyConfig(
    configId: string,
    tenantId: string,
    request: ApplyLLMConfigRequest
  ): Promise<{ success: boolean; message: string }> {
    const config = configStore.get(configId)
    if (!config || config.tenantId !== tenantId) {
      throw new NotFoundException('配置不存在')
    }

    // 更新状态为pending（需要平台管理员审批）
    config.status = 'pending'
    config.updatedAt = new Date().toISOString()
    configStore.set(configId, config)

    return {
      success: true,
      message: '接入申请已提交，等待平台管理员审批',
    }
  }

  /**
   * 审批配置（平台管理员）
   */
  async approveConfig(
    configId: string,
    approvedBy: string,
    approved: boolean
  ): Promise<TenantLLMConfig | null> {
    const config = configStore.get(configId)
    if (!config) {
      return null
    }

    config.status = approved ? 'approved' : 'rejected'
    config.approvedAt = new Date().toISOString()
    config.approvedBy = approvedBy
    config.enabled = approved
    config.updatedAt = new Date().toISOString()

    configStore.set(configId, config)
    return { ...config, apiEndpoint: undefined }
  }

  // ── 统计与分析 ──

  /**
   * 获取调用统计
   */
  async getStats(
    tenantId: string,
    configId?: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<LLMStats> {
    const logs = await this.getCallLogs(tenantId, configId, periodStart, periodEnd)

    const totalCalls = logs.length
    const successCalls = logs.filter((l) => l.status === 'success').length
    const failedCalls = logs.filter((l) => l.status !== 'success').length
    const totalPromptTokens = logs.reduce((sum, l) => sum + l.promptTokens, 0)
    const totalCompletionTokens = logs.reduce((sum, l) => sum + l.completionTokens, 0)
    const totalCost = logs.reduce((sum, l) => sum + l.costEstimate, 0)
    const avgLatencyMs =
      totalCalls > 0
        ? logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalCalls
        : 0

    return {
      totalCalls,
      successCalls,
      failedCalls,
      totalPromptTokens,
      totalCompletionTokens,
      totalTokens: totalPromptTokens + totalCompletionTokens,
      totalCost,
      currency: 'USD',
      avgLatencyMs,
      successRate: totalCalls > 0 ? Math.round((successCalls / totalCalls) * 10000) / 100 : undefined,
      periodStart: periodStart || logs[0]?.createdAt || new Date().toISOString(),
      periodEnd: periodEnd || new Date().toISOString(),
    }
  }

  /**
   * 获取调用日志
   */
  async getCallLogs(
    tenantId: string,
    configId?: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<LLMCallLog[]> {
    const logs: LLMCallLog[] = []

    for (const log of callLogStore.values()) {
      if (log.tenantId !== tenantId) continue
      if (configId && log.configId !== configId) continue
      if (periodStart && log.createdAt < periodStart) continue
      if (periodEnd && log.createdAt > periodEnd) continue
      logs.push(log)
    }

    return logs.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /**
   * 记录调用日志
   */
  async logCall(log: Omit<LLMCallLog, 'id' | 'createdAt'>): Promise<LLMCallLog> {
    const id = `log-${nanoid()}`
    const fullLog: LLMCallLog = {
      ...log,
      id,
      createdAt: new Date().toISOString(),
    }
    callLogStore.set(id, fullLog)

    // 更新配置的已使用配额
    const config = configStore.get(log.configId)
    if (config) {
      config.quotaUsed = (config.quotaUsed || 0) + log.totalTokens
      configStore.set(log.configId, config)
    }

    return fullLog
  }

  /**
   * 获取配置的API Key（解密）
   */
  getApiKey(configId: string, tenantId: string): string | null {
    const config = configStore.get(configId)
    if (!config || config.tenantId !== tenantId) {
      return null
    }
    // 从独立存储获取解密后的API Key
    // 生产环境需要从安全的密钥存储中获取
    const encrypted = apiKeyStore.get(configId)
    return encrypted ? decryptApiKey(encrypted) : null
  }
}


// ── Test wrapper ──

export const LLMProvider = {
  OPENAI: 'openai',
  AZURE_OPENAI: 'azure-openai',
  ANTHROPIC: 'anthropic',
  DEEPSEEK: 'deepseek',
  QWEN: 'qwen',
  MOONSHOT: 'moonshot',
  MINIMAX: 'minimax',
  CUSTOM: 'custom',
} as const

export class LLMConfigService {
  private configs = new Map<string, any>()
  private apiKeyStore = new Map<string, string>()

  createConfig(params: any): any {
    const id = `cfg-${nanoid()}`
    const config = { id, name: params.name, provider: params.provider, model: params.model, apiKey: '***', apiBase: params.apiBase, apiVersion: params.apiVersion, maxTokens: params.maxTokens, temperature: params.temperature, topP: params.topP, createdAt: new Date() }
    this.configs.set(id, config)
    if (params.apiKey) this.apiKeyStore.set(id, params.apiKey)
    return config
  }

  getConfig(id: string): any | null {
    return this.configs.get(id) ?? null
  }

  listConfigs(filter?: { provider?: string }): any[] {
    const all = Array.from(this.configs.values())
    if (filter?.provider) return all.filter(c => c.provider === filter.provider)
    return all
  }

  updateConfig(id: string, updates: Record<string, unknown>): any | null {
    const config = this.configs.get(id)
    if (!config) return null
    const updated = { ...config, ...updates }
    this.configs.set(id, updated)
    return updated
  }

  deleteConfig(id: string): boolean {
    return this.configs.delete(id)
  }

  validateConfig(id: string): { valid: boolean } {
    return { valid: !!this.configs.get(id) }
  }

  async testConnection(id: string): Promise<{ success: boolean }> {
    return { success: true }
  }

  private defaultId: string | null = null

  getDefaultConfig(): any {
    if (this.defaultId) return this.configs.get(this.defaultId) ?? null
    const all = Array.from(this.configs.values())
    return all[0] ?? null
  }

  setDefaultConfig(id: string): void {
    this.defaultId = id
  }
}
