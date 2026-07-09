/**
 * 🐜 自动: [ai-model-config] [A] contract 补全
 *
 * AI Model Config：跨模块合约类型
 * 定义 ai-model-config 模块对外暴露的稳定合约接口，
 * 供其它模块（ai-cs, ai-diagnosis, ai-rag 等）消费。
 */
import type {
  AiModelProvider,
  IndustryType,
  AiModelConfig,
  AiModelPreset,
  ConfigSnapshot,
} from './ai-model-config.entity'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * AI 模型配置合约（跨模块安全子集）
 */
export interface AiModelConfigContract {
  configId: string
  storeId: string
  provider: AiModelProvider
  modelName: string
  temperature: number
  maxTokens: number
  industryType: IndustryType
  isActive: boolean
}

/**
 * 预设配置合约（跨模块安全子集）
 */
export interface AiModelPresetContract {
  presetId: string
  name: string
  provider: AiModelProvider
  modelName: string
  industryType: IndustryType
}

/**
 * 快照合约（跨模块安全子集）
 */
export interface ConfigSnapshotContract {
  snapshotId: string
  configId: string
  createdAt: string
  changeType: string
}

// ─── 枚举合约 ───────────────────────────────────────────────────────────

export type AiModelProviderContract = Extract<AiModelProvider, 'openai' | 'anthropic' | 'qwen' | 'deepseek'>
export type IndustryTypeContract = IndustryType

// ─── 合约工厂函数 ───────────────────────────────────────────────────────

/**
 * 从完整配置创建合约子集
 */
export function toAiModelConfigContract(full: AiModelConfig): AiModelConfigContract {
  return {
    configId: full.configId,
    storeId: full.storeId,
    provider: full.provider,
    modelName: full.modelName,
    temperature: full.temperature,
    maxTokens: full.maxTokens,
    industryType: full.industryType,
    isActive: full.isActive,
  }
}

/**
 * 从完整预设创建合约子集
 */
export function toAiModelPresetContract(full: AiModelPreset): AiModelPresetContract {
  return {
    presetId: full.presetId,
    name: full.name,
    provider: full.provider,
    modelName: full.modelName,
    industryType: full.industryType,
  }
}

// ─── 导出原始类型子集 ───────────────────────────────────────────────────

export type { AiModelConfig, AiModelProvider, IndustryType }
