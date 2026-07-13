/**
 * Phase-35: 智能体接入模块 - LLM配置实体与服务
 *
 * 为每个单租户、单店、单站点提供完全隔离的大模型接入能力
 */

import { Module, Global } from '@nestjs/common'
import { TenantLLMController } from './llm-config.controller'
import { TenantLLMService } from './llm-config.service'
import { TenantLLMGateway } from './llm-gateway'
// @ts-ignore
import { TenantScopeGuard } from '../../agent/tenant.guard'

export const LLM_CONFIG_SERVICE = 'LLM_CONFIG_SERVICE'

@Module({
  controllers: [TenantLLMController],
  providers: [
    TenantLLMService,
    TenantLLMGateway,
    {
      provide: LLM_CONFIG_SERVICE,
      useExisting: TenantLLMService,
    },
  ],
  exports: [TenantLLMService, TenantLLMGateway, LLM_CONFIG_SERVICE],
})
export class TenantLLMModule {}

// ── Types & Interfaces ──

/** LLM 服务提供商 */
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'qwen' | 'moonshot' | 'minimax' | 'custom'

/** LLM 配置状态 */
export type LLMConfigStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

/** LLM 调用结果 */
export interface LLMCallResult {
  content: string
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error'
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  latencyMs: number
  error?: string
}

/** LLM 调用请求 */
export interface LLMCallRequest {
  configId: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  temperature?: number
  maxTokens?: number
  tools?: ToolDefinition[]
}

/** 工具定义 */
export interface ToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties?: Record<string, unknown>
    required?: string[]
  }
}

/** 调用统计 */
export interface LLMStats {
  totalCalls: number
  successCalls: number
  failedCalls: number
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  totalCost: number
  currency: string
  avgLatencyMs: number
  periodStart: string
  periodEnd: string
  /** 成功率 (0-100), undefined when totalCalls === 0 */
  successRate?: number
}

/** 调用日志 */
export interface LLMCallLog {
  id: string
  configId: string
  tenantId: string
  sessionId?: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costEstimate: number
  currency: string
  latencyMs: number
  status: 'success' | 'error' | 'timeout'
  errorMessage?: string
  createdAt: string
}

/** 审批与治理审计日志 */
export interface LLMAuditLog {
  id: string
  tenantId: string
  configId: string
  action: 'apply' | 'approve' | 'reject' | 'approve_denied'
  actorId: string
  actorRole?: string
  success: boolean
  reason?: string
  createdAt: string
  metadata?: Record<string, unknown>
}

/** 审批选项 */
export interface LLMApprovalOptions {
  permissions?: string[]
  actorRole?: string
  reason?: string
}

/** 权限配置 */
export interface LLMPermission {
  roleId: string
  roleName: string
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  allowedTools: string[]
}

/** 站点LLM配置 */
export interface TenantLLMConfig {
  id: string
  tenantId: string
  siteId?: string
  storeId?: string

  // 模型信息
  name: string
  provider: LLMProvider
  modelName: string
  apiEndpoint?: string

  // 参数
  temperature: number
  maxTokens: number
  topP?: number

  // 配额
  quotaLimit?: number
  quotaUsed?: number
  quotaAlertThreshold?: number

  // 状态
  status: LLMConfigStatus
  enabled: boolean

  // 时间戳
  createdAt: string
  updatedAt: string
  approvedAt?: string
  approvedBy?: string
}

/** 创建配置请求 */
export interface CreateLLMConfigRequest {
  name: string
  provider: LLMProvider
  modelName: string
  apiEndpoint?: string
  apiKey: string
  temperature?: number
  maxTokens?: number
  topP?: number
  quotaLimit?: number
  quotaAlertThreshold?: number
  siteId?: string
  storeId?: string
}

/** 更新配置请求 */
export interface UpdateLLMConfigRequest {
  name?: string
  provider?: LLMProvider
  modelName?: string
  apiEndpoint?: string
  apiKey?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  quotaLimit?: number
  quotaAlertThreshold?: number
  enabled?: boolean
}

/** 接入申请请求 */
export interface ApplyLLMConfigRequest {
  configId: string
  useCase: string
  expectedVolume: number
  businessJustification?: string
}

/** 全球化配置 */
export interface GlobalRegionConfig {
  regionCode: string
  regionName: string
  language: string
  currency: string
  timezone: string
  socialChannels: string[]
}
