/**
 * AI 模型切换器 - 类型定义 (V9 需求 1 · V10 Day 1)
 *
 * 与后端 apps/api/src/modules/ai-model-config/ai-model-config.entity.ts 同步
 * 5 端共享类型 (PC / H5 / APP / Pad / 小程序)
 */

// ============ 枚举 (与后端一致) ============

export type AiModelProvider =
  | 'openai'
  | 'anthropic'
  | 'qwen'
  | 'custom'

export type IndustryType =
  | 'general'
  | 'arcade'
  | 'family-entertainment'
  | 'shopping-mall'

export type ConfigChangeType = 'create' | 'update' | 'rollback' | 'activate'

// ============ 系统预设 ============

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

export interface AiModelPreset {
  id: string
  presetCode: string
  displayName: string
  provider: AiModelProvider
  modelName: string
  defaultParams: AiModelDefaultParams
  industry: IndustryType
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

// ============ 门店配置 ============

export interface AiModelStoreConfig {
  id: string
  tenantId: string
  storeId: string
  configName: string
  provider: AiModelProvider
  endpointUrl: string
  /** 后端 AES-256 加密,前端只读脱敏 (例如 sk-****-****-1234) */
  apiKeyMasked: string
  contextWindow: number
  temperature: number
  maxTokens: number
  customHeaders?: Record<string, string>
  isCurrent: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============ 历史快照 ============

export interface AiModelConfigHistory {
  id: string
  configId: string
  snapshot: Partial<AiModelStoreConfig>
  versionNumber: number
  changeType: ConfigChangeType
  changedBy: string
  changedAt: string
  reason?: string
}

// ============ 请求 / 响应 ============

export interface SwitchAiModelRequest {
  configId: string
  reason?: string
}

export interface SwitchAiModelResponse {
  config: AiModelStoreConfig
  latencyMs: number
  healthCheckOk: boolean
}

export interface CreateAiModelConfigRequest {
  configName: string
  provider: AiModelProvider
  endpointUrl: string
  apiKey: string
  contextWindow: number
  temperature: number
  maxTokens: number
  customHeaders?: Record<string, string>
}

export interface RollbackAiModelRequest {
  historyId: string
  reason?: string
}

// ============ 组件 Props ============

export interface AiModelSwitcherProps {
  /** 当前门店 ID (必填) */
  storeId: string
  /** 当前生效的配置 ID (受控) */
  currentConfigId?: string
  /** 切换回调 */
  onSwitch?: (response: SwitchAiModelResponse) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 是否显示历史回滚入口 */
  showHistory?: boolean
  /** 端类型 (用于适配 PC/H5/APP/Pad/小程序) */
  device?: 'pc' | 'h5' | 'app' | 'pad' | 'miniapp'
  /** 自定义类名 */
  className?: string
  /** 自定义样式 */
  style?: React.CSSProperties
  /** API base URL */
  apiBase?: string
}