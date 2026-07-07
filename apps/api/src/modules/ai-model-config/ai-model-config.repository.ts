/**
 * AI 模型配置 - Repository (V9 需求 1 · V10 Day 2)
 *
 * 双后端适配:
 * - PG 模式: 有 POSTGRES_URL 时走 pg-pool + RLS 强隔离
 * - 内存模式: dev/test 用,降级到 Map
 *
 * 设计原则 (V8 渐进增强):
 * - 接口不变 (V10 Day 1 Service 调用代码不改)
 * - 行为对齐 (返回相同的 AiModelStoreConfig 形状)
 * - 失败降级 (PG 连接失败时 fallback 到内存)
 */

import { getPgPool } from '../../database/pg-pool'
import {
  withTenantSession,
  requireTenantContext,
  type TenantContext,
} from '../../common/context/tenant-context'
import { encryptField, decryptField, maskApiKey } from './encryption.util'
import type {
  AiModelPreset,
  AiModelStoreConfig,
  AiModelConfigHistory,
  AiModelProvider,
} from './ai-model-config.entity'

// ============ Repository 接口 ============

export interface AiModelConfigRepository {
  // 预设 (跨租户共享, 只读)
  listPresets(filter?: { provider?: AiModelProvider; industry?: string }): Promise<AiModelPreset[]>
  getPreset(id: string): Promise<AiModelPreset | null>

  // 门店配置 (RLS 隔离)
  createStoreConfig(input: NewStoreConfig): Promise<AiModelStoreConfig>
  listStoreConfigsByStore(storeId: string): Promise<AiModelStoreConfig[]>
  getCurrentConfig(storeId: string): Promise<AiModelStoreConfig | null>
  switchConfig(configId: string, operatorId: string, reason?: string): Promise<{
    config: AiModelStoreConfig
    latencyMs: number
    healthCheckOk: boolean
  }>

  // 历史 (RLS 隔离)
  listHistory(configId: string, limit?: number): Promise<AiModelConfigHistory[]>
  rollbackToHistory(historyId: string, operatorId: string, reason: string): Promise<AiModelStoreConfig>
}

export interface NewStoreConfig {
  tenantId: string
  storeId: string
  configName: string
  provider: AiModelProvider
  endpointUrl: string         // 明文, repository 内部加密
  apiKey: string              // 明文, repository 内部加密
  contextWindow: number
  temperature: number
  maxTokens: number
  customHeaders?: Record<string, string>
  createdBy: string
}

// ============ Factory: 自动选择实现 ============

export function createRepository(): AiModelConfigRepository {
  const pool = getPgPool()
  if (pool) {
    return new PgRepository(pool)
  }
  return new MemoryRepository()
}

// ============ PG 实现 ============

// pg 类型 (运行时探测, 不强依赖 @types/pg)
interface PgPool {
  connect(): Promise<PgClient>
  query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>
}
interface PgClient {
  query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>
  release(): void
}

class PgRepository implements AiModelConfigRepository {
  constructor(private pool: PgPool) {}

  async listPresets(filter?: { provider?: AiModelProvider; industry?: string }): Promise<AiModelPreset[]> {
    const where: string[] = ['is_active = TRUE']
    const params: unknown[] = []
    if (filter?.provider) {
      params.push(filter.provider)
      where.push(`provider = $${params.length}`)
    }
    if (filter?.industry) {
      params.push(filter.industry)
      where.push(`industry = $${params.length}`)
    }
    const sql = `SELECT id, preset_code, display_name, provider, model_name, default_params, industry, is_active, description, created_at, updated_at
                 FROM ai_model_preset WHERE ${where.join(' AND ')} ORDER BY preset_code`
    const result = await this.pool.query(sql, params)
    return result.rows.map(mapPresetRow)
  }

  async getPreset(id: string): Promise<AiModelPreset | null> {
    const result = await this.pool.query(
      'SELECT id, preset_code, display_name, provider, model_name, default_params, industry, is_active, description, created_at, updated_at FROM ai_model_preset WHERE id = $1 OR preset_code = $1',
      [id],
    )
    return result.rows[0] ? mapPresetRow(result.rows[0]) : null
  }

  async createStoreConfig(input: NewStoreConfig): Promise<AiModelStoreConfig> {
    return withTenantSession(
      { tenantId: input.tenantId, storeId: input.storeId, userId: input.createdBy },
      async (client) => {
        const id = `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const endpointEnc = encryptField(input.endpointUrl)
        const apiKeyEnc = encryptField(input.apiKey)

        await client.query(
          `INSERT INTO ai_model_store_config
           (id, tenant_id, store_id, config_name, provider, endpoint_url_enc, api_key_enc,
            context_window, temperature, max_tokens, custom_headers, is_current, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, $12)`,
          [
            id,
            input.tenantId,
            input.storeId,
            input.configName,
            input.provider,
            endpointEnc,
            apiKeyEnc,
            input.contextWindow,
            input.temperature,
            input.maxTokens,
            input.customHeaders ? JSON.stringify(input.customHeaders) : null,
            input.createdBy,
          ],
        )

        // 写历史
        await this.recordHistory(client, id, input.tenantId, 'create', input.createdBy)

        return (await this.getConfigById(client, id))!
      },
    )
  }

  async listStoreConfigsByStore(storeId: string): Promise<AiModelStoreConfig[]> {
    return withTenantSession(requireTenantContext(), async (client) => {
      const result = await client.query(
        `SELECT * FROM ai_model_store_config
         WHERE store_id = $1
         ORDER BY is_current DESC, created_at DESC`,
        [storeId],
      )
      return result.rows.map(mapStoreConfigRow)
    })
  }

  async getCurrentConfig(storeId: string): Promise<AiModelStoreConfig | null> {
    return withTenantSession(requireTenantContext(), async (client) => {
      const result = await client.query(
        'SELECT * FROM ai_model_store_config WHERE store_id = $1 AND is_current = TRUE LIMIT 1',
        [storeId],
      )
      return result.rows[0] ? mapStoreConfigRow(result.rows[0]) : null
    })
  }

  async switchConfig(configId: string, operatorId: string, reason?: string): Promise<{
    config: AiModelStoreConfig
    latencyMs: number
    healthCheckOk: boolean
  }> {
    const ctx = requireTenantContext()
    const start = Date.now()

    return withTenantSession(ctx, async (client) => {
      // 1. 查目标配置 (RLS 自动过滤)
      const targetResult = await client.query(
        'SELECT * FROM ai_model_store_config WHERE id = $1',
        [configId],
      )
      if (targetResult.rows.length === 0) {
        throw new Error(`Config ${configId} not found or access denied`)
      }
      const target = mapStoreConfigRow(targetResult.rows[0])

      // 2. 健康检查 (endpoint 格式)
      const endpoint = decryptField(target.endpointUrl)
      const healthCheckOk = endpoint.startsWith('http://') || endpoint.startsWith('https://')

      // 3. 原子切换: 同 (tenant_id, store_id) 下,把其他 is_current=FALSE
      await client.query(
        `UPDATE ai_model_store_config SET is_current = (id = $1)
         WHERE tenant_id = $2 AND store_id = $3`,
        [configId, target.tenantId, target.storeId],
      )

      // 4. 写历史
      await this.recordHistory(client, configId, target.tenantId, 'activate', operatorId, reason)

      // 5. 拿最新行返回
      const refreshed = await this.getConfigById(client, configId)
      const latencyMs = Date.now() - start
      return { config: refreshed!, latencyMs, healthCheckOk }
    })
  }

  async listHistory(configId: string, limit = 50): Promise<AiModelConfigHistory[]> {
    return withTenantSession(requireTenantContext(), async (client) => {
      const result = await client.query(
        `SELECT id, config_id, tenant_id, snapshot, version_number, change_type, changed_by, changed_at, reason
         FROM ai_model_config_history
         WHERE config_id = $1
         ORDER BY version_number DESC
         LIMIT $2`,
        [configId, limit],
      )
      return result.rows.map(mapHistoryRow)
    })
  }

  async rollbackToHistory(historyId: string, operatorId: string, reason: string): Promise<AiModelStoreConfig> {
    const ctx = requireTenantContext()
    return withTenantSession(ctx, async (client) => {
      const histResult = await client.query(
        'SELECT * FROM ai_model_config_history WHERE id = $1',
        [historyId],
      )
      if (histResult.rows.length === 0) {
        throw new Error(`History ${historyId} not found`)
      }
      const hist = mapHistoryRow(histResult.rows[0])
      const snapshot = hist.snapshot as Partial<AiModelStoreConfig>

      // 应用快照 (保留 id, tenant_id, store_id, created_at)
      await client.query(
        `UPDATE ai_model_store_config SET
           config_name = $2,
           provider = $3,
           endpoint_url_enc = $4,
           api_key_enc = $5,
           context_window = $6,
           temperature = $7,
           max_tokens = $8,
           custom_headers = $9
         WHERE id = $1`,
        [
          hist.configId,
          snapshot.configName,
          snapshot.provider,
          snapshot.endpointUrl,
          snapshot.apiKeyEncrypted,
          snapshot.contextWindow,
          snapshot.temperature,
          snapshot.maxTokens,
          snapshot.customHeaders ? JSON.stringify(snapshot.customHeaders) : null,
        ],
      )

      // 写新历史
      await this.recordHistory(client, hist.configId, ctx.tenantId, 'rollback', operatorId, reason)

      return (await this.getConfigById(client, hist.configId))!
    })
  }

  // ============ PG 内部辅助 ============

  private async getConfigById(client: PgClient, id: string): Promise<AiModelStoreConfig | null> {
    const result = await client.query('SELECT * FROM ai_model_store_config WHERE id = $1', [id])
    return result.rows[0] ? mapStoreConfigRow(result.rows[0]) : null
  }

  private async recordHistory(
    client: PgClient,
    configId: string,
    tenantId: string,
    changeType: AiModelConfigHistory['changeType'],
    changedBy: string,
    reason?: string,
  ): Promise<void> {
    const id = `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const versionResult = await client.query(
      'SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM ai_model_config_history WHERE config_id = $1',
      [configId],
    )
    const versionNumber = versionResult.rows[0]?.next_version ?? 1

    // 取当前快照
    const currentResult = await client.query('SELECT * FROM ai_model_store_config WHERE id = $1', [configId])
    const snapshot = currentResult.rows[0] ?? {}

    await client.query(
      `INSERT INTO ai_model_config_history
       (id, config_id, tenant_id, snapshot, version_number, change_type, changed_by, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, configId, tenantId, JSON.stringify(snapshot), versionNumber, changeType, changedBy, reason ?? null],
    )
  }
}

// ============ 内存实现 (fallback) ============

class MemoryRepository implements AiModelConfigRepository {
  private presets = new Map<string, AiModelPreset>()
  private storeConfigs = new Map<string, AiModelStoreConfig>()
  private history: AiModelConfigHistory[] = []

  constructor() {
    this.seedPresets()
  }

  async listPresets(filter?: { provider?: AiModelProvider; industry?: string }): Promise<AiModelPreset[]> {
    let result = Array.from(this.presets.values())
    if (filter?.provider) result = result.filter((p) => p.provider === filter.provider)
    if (filter?.industry) result = result.filter((p) => p.industry === filter.industry)
    return result
  }

  async getPreset(id: string): Promise<AiModelPreset | null> {
    return this.presets.get(id) ?? null
  }

  async createStoreConfig(input: NewStoreConfig): Promise<AiModelStoreConfig> {
    const id = `cfg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = new Date().toISOString()
    const config: AiModelStoreConfig = {
      id,
      tenantId: input.tenantId,
      storeId: input.storeId,
      configName: input.configName,
      provider: input.provider,
      endpointUrl: encryptField(input.endpointUrl),
      apiKeyEncrypted: encryptField(input.apiKey),
      contextWindow: input.contextWindow,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
      customHeaders: input.customHeaders,
      isCurrent: false,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }
    this.storeConfigs.set(id, config)
    this.recordHistory(config, 'create', input.createdBy)
    return config
  }

  async listStoreConfigsByStore(storeId: string): Promise<AiModelStoreConfig[]> {
    // V9 需求 5: tenant context 强制
    const ctx = requireTenantContext()
    void ctx
    return Array.from(this.storeConfigs.values()).filter((c) => c.storeId === storeId)
  }

  async getCurrentConfig(storeId: string): Promise<AiModelStoreConfig | null> {
    const ctx = requireTenantContext()
    void ctx
    return Array.from(this.storeConfigs.values()).find((c) => c.storeId === storeId && c.isCurrent) ?? null
  }

  async switchConfig(configId: string, operatorId: string, reason?: string): Promise<{
    config: AiModelStoreConfig
    latencyMs: number
    healthCheckOk: boolean
  }> {
    const ctx = requireTenantContext()
    void ctx
    const start = Date.now()
    const target = this.storeConfigs.get(configId)
    if (!target) throw new Error(`Config ${configId} not found`)
    const endpoint = decryptField(target.endpointUrl)
    const healthCheckOk = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    for (const c of this.storeConfigs.values()) {
      if (c.storeId === target.storeId) {
        c.isCurrent = c.id === target.id
        c.updatedAt = new Date().toISOString()
      }
    }
    this.recordHistory(target, 'activate', operatorId, reason)
    return { config: target, latencyMs: Date.now() - start, healthCheckOk }
  }

  async listHistory(configId: string, limit = 50): Promise<AiModelConfigHistory[]> {
    const ctx = requireTenantContext()
    void ctx
    return this.history.filter((h) => h.configId === configId).slice(-limit).reverse()
  }

  async rollbackToHistory(historyId: string, operatorId: string, reason: string): Promise<AiModelStoreConfig> {
    const ctx = requireTenantContext()
    void ctx
    const hist = this.history.find((h) => h.id === historyId)
    if (!hist) throw new Error(`History ${historyId} not found`)
    const current = this.storeConfigs.get(hist.configId)
    if (!current) throw new Error(`Current config ${hist.configId} not found`)
    const snapshot = hist.snapshot as AiModelStoreConfig
    Object.assign(current, {
      configName: snapshot.configName,
      provider: snapshot.provider,
      endpointUrl: snapshot.endpointUrl,
      apiKeyEncrypted: snapshot.apiKeyEncrypted,
      contextWindow: snapshot.contextWindow,
      temperature: snapshot.temperature,
      maxTokens: snapshot.maxTokens,
      customHeaders: snapshot.customHeaders,
      updatedAt: new Date().toISOString(),
    })
    this.recordHistory(current, 'rollback', operatorId, reason)
    return current
  }

  private recordHistory(
    config: AiModelStoreConfig,
    changeType: AiModelConfigHistory['changeType'],
    changedBy: string,
    reason?: string,
  ): void {
    const versionNumber = this.history.filter((h) => h.configId === config.id).length + 1
    this.history.push({
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      configId: config.id,
      snapshot: { ...config },
      versionNumber,
      changeType,
      changedBy,
      changedAt: new Date().toISOString(),
      reason,
    })
    if (this.history.length > 1000) this.history = this.history.slice(-1000)
  }

  private seedPresets(): void {
    const now = new Date().toISOString()
    const presets: AiModelPreset[] = [
      {
        id: 'preset-gpt4o-general', presetCode: 'gpt4o-general', displayName: 'GPT-4o (通用)',
        provider: 'openai', modelName: 'gpt-4o',
        defaultParams: { temperature: 0.7, maxTokens: 4096, contextWindow: 128000, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
        industry: 'general', isActive: true, description: 'OpenAI GPT-4o,通用场景,推荐默认',
        createdAt: now, updatedAt: now,
      },
      {
        id: 'preset-claude-game', presetCode: 'claude-game', displayName: 'Claude 3.5 Sonnet (电玩行业)',
        provider: 'anthropic', modelName: 'claude-3-5-sonnet-20241022',
        defaultParams: { temperature: 0.5, maxTokens: 8192, contextWindow: 200000, topP: 0.95, frequencyPenalty: 0, presencePenalty: 0 },
        industry: 'arcade', isActive: true, description: '电玩游乐行业微调',
        createdAt: now, updatedAt: now,
      },
      {
        id: 'preset-qwen-family', presetCode: 'qwen-family', displayName: 'Qwen-VL (亲子娱乐)',
        provider: 'qwen', modelName: 'qwen-vl-max',
        defaultParams: { temperature: 0.6, maxTokens: 4096, contextWindow: 32000, topP: 0.9, frequencyPenalty: 0, presencePenalty: 0 },
        industry: 'family-entertainment', isActive: true, description: '亲子娱乐场景',
        createdAt: now, updatedAt: now,
      },
      {
        id: 'preset-custom', presetCode: 'custom', displayName: 'Custom 自定义',
        provider: 'custom', modelName: 'custom-model',
        defaultParams: { temperature: 0.7, maxTokens: 4096, contextWindow: 8192, topP: 1.0, frequencyPenalty: 0, presencePenalty: 0 },
        industry: 'general', isActive: true, description: '门店自填 endpoint + apiKey',
        createdAt: now, updatedAt: now,
      },
    ]
    presets.forEach((p) => this.presets.set(p.id, p))
  }
}

// ============ Row → Entity 映射 ============

function mapPresetRow(row: any): AiModelPreset {
  return {
    id: row.id,
    presetCode: row.preset_code,
    displayName: row.display_name,
    provider: row.provider,
    modelName: row.model_name,
    defaultParams: typeof row.default_params === 'string' ? JSON.parse(row.default_params) : row.default_params,
    industry: row.industry,
    isActive: row.is_active,
    description: row.description ?? undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  }
}

function mapStoreConfigRow(row: any): AiModelStoreConfig {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    storeId: row.store_id,
    configName: row.config_name,
    provider: row.provider,
    endpointUrl: row.endpoint_url_enc,
    apiKeyEncrypted: row.api_key_enc,
    contextWindow: row.context_window,
    temperature: typeof row.temperature === 'string' ? parseFloat(row.temperature) : row.temperature,
    maxTokens: row.max_tokens,
    customHeaders: row.custom_headers
      ? typeof row.custom_headers === 'string' ? JSON.parse(row.custom_headers) : row.custom_headers
      : undefined,
    isCurrent: row.is_current,
    createdBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  }
}

function mapHistoryRow(row: any): AiModelConfigHistory {
  return {
    id: row.id,
    configId: row.config_id,
    snapshot: typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot,
    versionNumber: row.version_number,
    changeType: row.change_type,
    changedBy: row.changed_by,
    changedAt: row.changed_at instanceof Date ? row.changed_at.toISOString() : row.changed_at,
    reason: row.reason ?? undefined,
  }
}

// ============ 公共 API key 脱敏工具 (转发) ============

export { maskApiKey, decryptField, decryptField as decrypt }