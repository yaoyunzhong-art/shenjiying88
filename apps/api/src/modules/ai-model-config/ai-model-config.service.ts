/**
 * AI 模型配置 - Service V2 (V9 需求 1 · V10 Day 2)
 *
 * 升级要点 (Day 1 -> Day 2):
 * - 数据层: 内存 Map -> Repository (PG 自动 / 内存 fallback)
 * - 多租户: 强制 requireTenantContext() (V9 需求 5 字段/实例级隔离)
 * - 操作员: 记录 createdBy / changedBy (审计)
 * - 切换延迟: 仍 < 500ms 目标 (V9 硬约束)
 * - 健康检查: HTTP HEAD (Day 1 仅格式校验)
 */

import { Injectable, ForbiddenException } from '@nestjs/common'
import { createRepository, type AiModelConfigRepository, type NewStoreConfig, maskApiKey } from './ai-model-config.repository'
import {
  type AiModelPreset,
  type AiModelStoreConfig,
  type AiModelConfigHistory,
  type SwitchAiModelRequest,
  type SwitchAiModelResponse,
  type AiModelProvider,
} from './ai-model-config.entity'
import {
  runWithTenant,
  requireTenantContext,
  assertStoreOwnership,
  type TenantContext,
} from '../../common/context/tenant-context'

/** 响应形状: API key 脱敏 (V9 需求 5 字段级隔离) */
export type StoreConfigResponse = Omit<AiModelStoreConfig, 'apiKeyEncrypted'> & { apiKeyMasked: string }

@Injectable()
export class AiModelConfigService {
  private readonly repo: AiModelConfigRepository

  constructor() {
    this.repo = createRepository()
  }

  // ============ 1. 系统预设 (跨租户共享) ============

  /** 查询所有预设 */
  async listPresets(filter?: {
    provider?: AiModelProvider
    industry?: string
    isActive?: boolean
  }): Promise<AiModelPreset[]> {
    const presets = await this.repo.listPresets(filter)
    if (filter?.isActive !== undefined) {
      return presets.filter((p) => p.isActive === filter.isActive)
    }
    return presets
  }

  /** 根据 ID 查询预设 */
  async getPreset(id: string): Promise<AiModelPreset | null> {
    return this.repo.getPreset(id)
  }

  // ============ 2. 门店自主配置 (RLS 隔离) ============

  /**
   * 创建门店配置 (Day 2: 加 tenant 强制注入)
   */
  async createStoreConfig(input: {
    storeId: string
    configName: string
    provider: AiModelProvider
    endpointUrl: string
    apiKey: string
    contextWindow: number
    temperature: number
    maxTokens: number
    customHeaders?: Record<string, string>
  }): Promise<StoreConfigResponse> {
    const ctx = requireTenantContext()
    assertStoreOwnership(input.storeId)

    const config = await this.repo.createStoreConfig({
      tenantId: ctx.tenantId,
      storeId: input.storeId,
      configName: input.configName,
      provider: input.provider,
      endpointUrl: input.endpointUrl,
      apiKey: input.apiKey,
      contextWindow: input.contextWindow,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      customHeaders: input.customHeaders,
      createdBy: ctx.userId ?? 'system',
    })

    return this.mask(config)
  }

  /** 列出门店配置 (脱敏 API key) */
  async listStoreConfigs(storeId: string): Promise<StoreConfigResponse[]> {
    const ctx = requireTenantContext()
    assertStoreOwnership(storeId)
    const configs = await this.repo.listStoreConfigsByStore(storeId)
    return configs.map((c) => this.mask(c))
  }

  /** 获取当前生效配置 */
  async getCurrentConfig(storeId: string): Promise<StoreConfigResponse | null> {
    const ctx = requireTenantContext()
    assertStoreOwnership(storeId)
    const config = await this.repo.getCurrentConfig(storeId)
    return config ? this.mask(config) : null
  }

  // ============ 3. 一键切换 (热加载) ============

  async switchConfig(request: SwitchAiModelRequest): Promise<SwitchAiModelResponse> {
    const ctx = requireTenantContext()
    const result = await this.repo.switchConfig(request.configId, ctx.userId ?? 'system', request.reason)
    return {
      config: this.mask(result.config),
      latencyMs: result.latencyMs,
      healthCheckOk: result.healthCheckOk,
    }
  }

  // ============ 4. 历史 + 回滚 ============

  async listHistory(configId: string, limit = 50): Promise<AiModelConfigHistory[]> {
    const ctx = requireTenantContext()
    // RLS 自动过滤: 只能看本租户历史
    void ctx
    return this.repo.listHistory(configId, limit)
  }

  async rollbackToHistory(
    historyId: string,
    reason: string,
  ): Promise<StoreConfigResponse> {
    const ctx = requireTenantContext()
    const config = await this.repo.rollbackToHistory(historyId, ctx.userId ?? 'system', reason)
    return this.mask(config)
  }

  // ============ 5. 内部工具 (service 暴露给其他 module) ============

  /**
   * 解密 API key (内部 service 调用,不暴露给 controller)
   * V9 需求 5 字段级访问控制: 仅 service 层可解密
   */
  async getDecryptedApiKey(configId: string): Promise<string | null> {
    const ctx = requireTenantContext()
    if (ctx.role !== 'super_admin' && ctx.role !== 'brand_admin' && ctx.role !== 'tenant_admin') {
      throw new ForbiddenException('Only admin roles can decrypt API key')
    }
    const configs = await this.repo.listStoreConfigsByStore(ctx.storeId ?? '')
    const config = configs.find((c) => c.id === configId)
    if (!config) return null
    const { decryptField } = await import('./encryption.util')
    return decryptField(config.apiKeyEncrypted)
  }

  // ============ 6. Tenant 注入助手 (controller 层调用) ============

  /**
   * 在 tenant context 内执行 (供 controller 包一层)
   * 用法:
   *   await this.service.withTenant({ tenantId, storeId, userId, role }, () =>
   *     this.service.listStoreConfigs('store-001'),
   *   )
   */
  async withTenant<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
    return runWithTenant(context, fn)
  }

  // ============ 内部辅助: 脱敏 ============

  private mask(config: AiModelStoreConfig): StoreConfigResponse {
    const { apiKeyEncrypted, ...rest } = config
    return {
      ...rest,
      apiKeyMasked: maskApiKey(apiKeyEncrypted),
    }
  }
}