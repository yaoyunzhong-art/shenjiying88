/**
 * AI 模型配置 - 实体定义 (V9 需求 1 · V10 Day 1)
 *
 * 设计目标：
 * - 系统预设 (4 个包：GPT-4o / Claude 3.5 / Qwen-VL / Custom)
 * - 门店自主配置 (6 类参数全量可调)
 * - 历史版本快照 (90 天保留)
 * - 多租户隔离 (store_id 关联)
 */

// ============ 跨模块合约补全 (V11) ============

/**
 * AI 模型配置合约实体 (跨模块安全子集)
 * 与 ai-model-config.contract.ts 中的 toAiModelConfigContract 配合
 */
export interface AiModelConfig {
  /** 配置 ID */
  configId: string
  /** 门店 ID */
  storeId: string
  /** 提供商 */
  provider: AiModelProvider
  /** 模型名 */
  modelName: string
  /** 温度系数 */
  temperature: number
  /** 最大生成长度 */
  maxTokens: number
  /** 行业适配类型 */
  industryType: IndustryType
  /** 是否启用 */
  isActive: boolean
}

/**
 * 配置快照合约类型 (跨模块安全子集)
 */
export interface ConfigSnapshot {
  snapshotId: string
  configId: string
  createdAt: string
  changeType: string
}

// ============ 以下为原始定义 ============

/** AI 模型提供商 */
export type AiModelProvider =
  | 'openai'      // GPT-4o / GPT-4-turbo
  | 'anthropic'   // Claude 3.5 Sonnet
  | 'qwen'        // 通义千问 Qwen-VL
  | 'deepseek'    // DeepSeek V3 / R1
  | 'custom'      // 自定义 (用户自填 endpoint)

/** 行业适配类型 */
export type IndustryType =
  | 'general'             // 通用
  | 'arcade'              // 电玩游乐
  | 'family-entertainment'// 亲子娱乐
  | 'shopping-mall'       // 商场

/** 配置变更类型 (历史版本) */
export type ConfigChangeType = 'create' | 'update' | 'rollback' | 'activate'

// ============ 系统预设配置 (只读) ============

/**
 * 系统预设配置
 * - 由平台方维护
 * - 门店可选其一作为默认配置
 * - 不可修改 (只读)
 */
export interface AiModelPreset {
  /** 主键 */
  id: string
  /** 预设代号 (unique, 例如 "gpt4o-general") */
  presetCode: string
  /** 显示名称 */
  displayName: string
  /** 提供商 */
  provider: AiModelProvider
  /** 模型名 */
  modelName: string
  /** 默认参数 (温度/上下文窗口/最大长度等) */
  defaultParams: AiModelDefaultParams
  /** 行业适配 */
  industry: IndustryType
  /** 预设 ID 别名 (contract 兼容) */
  presetId: string
  /** 显示名称别名 (contract 兼容) */
  name: string
  /** 行业类型别名 (contract 兼容) */
  industryType: IndustryType
  /** 是否启用 */
  isActive: boolean
  /** 描述 */
  description?: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

/** AI 模型默认参数 */
export interface AiModelDefaultParams {
  /** 温度系数 0.0 - 2.0 */
  temperature: number
  /** 最大生成长度 1 - 32000 */
  maxTokens: number
  /** 上下文窗口大小 (token 数) */
  contextWindow: number
  /** Top-p 采样 0.0 - 1.0 */
  topP: number
  /** 频率惩罚 -2.0 - 2.0 */
  frequencyPenalty: number
  /** 存在惩罚 -2.0 - 2.0 */
  presencePenalty: number
  /** 自定义请求头 (JSON) */
  customHeaders?: Record<string, string>
}

// ============ 门店自主配置 (可写) ============

/**
 * 门店自主配置
 * - 6 类参数全量可调
 * - AES-256 加密存储 (apiKey, endpoint)
 * - 一键切换 + 90 天历史
 */
export interface AiModelStoreConfig {
  /** 主键 */
  id: string
  /** 租户 ID */
  tenantId: string
  /** 门店 ID */
  storeId: string
  /** 配置名称 */
  configName: string
  /** 提供商 */
  provider: AiModelProvider
  /** 请求域名 (encrypted at rest) */
  endpointUrl: string
  /** API 密钥 (encrypted at rest, masked in API response) */
  apiKeyEncrypted: string
  /** 上下文窗口 */
  contextWindow: number
  /** 温度系数 */
  temperature: number
  /** 最大生成长度 */
  maxTokens: number
  /** 自定义请求头 */
  customHeaders?: Record<string, string>
  /** 是否当前生效 */
  isCurrent: boolean
  /** 创建者 ID */
  createdBy: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
}

// ============ 历史版本快照 ============

/**
 * 配置历史快照
 * - 每次变更生成一条
 * - 90 天保留期
 * - 支持回滚
 */
export interface AiModelConfigHistory {
  /** 主键 */
  id: string
  /** 配置 ID */
  configId: string
  /** 配置快照 (JSON 完整结构) */
  snapshot: Partial<AiModelStoreConfig>
  /** 版本号 */
  versionNumber: number
  /** 变更类型 */
  changeType: ConfigChangeType
  /** 变更者 ID */
  changedBy: string
  /** 变更时间 */
  changedAt: string
  /** 回滚理由 (仅 rollback 类型) */
  reason?: string
}

// ============ 切换请求 ============

/** 切换大模型请求 */
export interface SwitchAiModelRequest {
  /** 目标配置 ID */
  configId: string
  /** 切换原因 (审计日志) */
  reason?: string
}

/** 切换响应 */
export interface SwitchAiModelResponse {
  /** 新生效的配置（已脱敏） */
  config: Omit<AiModelStoreConfig, 'apiKeyEncrypted'> & { apiKeyMasked: string }
  /** 切换耗时 ms */
  latencyMs: number
  /** 健康检查通过 */
  healthCheckOk: boolean
}