/**
 * tenant-llm.service.ts — Tenant LLM Service (canonical name)
 *
 * 多租户 LLM 配置模块入口。
 * 统一导出 LLM 配置管理 & 地理路由的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   TenantLLMService           LLM 配置管理 & 多租户配额
 *   I18nGeoService             国际化 & 地理路由 (按区域选择 LLM)
 *   TenantLLMGateway           LLM 网关 (请求分发 & 限流 & 容错)
 *
 * 实体类型 ─────────────────────
 *   LlmModelConfig             LLM 模型配置 (provider/model/key/region)
 *   TenantQuota                租户配额 (tokens/并发/预算/重置策略)
 *   UsageRecord                用量记录 (model/tokens/cost/timestamp)
 *   RegionConfig               区域配置 (regionCode/endpoint/latency)
 *   GeoRoutingRule             地理路由规则 (region/priority/weight)
 *
 * DTO ──────────────────────────
 *   LlmProvider                LLM 提供商枚举
 *   LlmConfigStatus            配置状态枚举
 *   CreateLlmConfigDto         创建配置
 *   UpdateLlmConfigDto         更新配置
 *   ApplyLlmConfigDto          申请配置
 *   ApproveLlmConfigDto        审批配置
 *   LlmConfigQueryDto          查询参数
 *   LlmStatsResponseDto        统计响应
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { TenantLLMService, LlmModelConfig, TenantQuota } from './tenant-llm.service'
 *   const svc = app.get(TenantLLMService)
 *   const models = svc.getModelsByTenant(tenantId)
 *   const quota = svc.getQuota(tenantId, modelId)
 *
 * @module TenantLLM
 */

export { TenantLLMService } from './llm-config.service'
export { I18nGeoService } from './i18n-geo.service'
export { TenantLLMGateway } from './llm-gateway'

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  LLMProvider,
  LLMConfigStatus,
  LLMCallResult,
  LLMCallRequest,
  ToolDefinition,
  LLMStats,
  LLMCallLog,
  LLMAuditLog,
  LLMApprovalOptions,
  LLMPermission,
  TenantLLMConfig,
  CreateLLMConfigRequest,
  UpdateLLMConfigRequest,
  ApplyLLMConfigRequest,
  GlobalRegionConfig,
} from './llm-config.entity'
export { LLM_CONFIG_SERVICE } from './llm-config.entity'

// ─── DTO ────────────────────────────────────────────────────────────────────
export {
  LlmProvider,
  LlmConfigStatus,
  CreateLlmConfigDto,
  UpdateLlmConfigDto,
  ApplyLlmConfigDto,
  ApproveLlmConfigDto,
  LlmConfigQueryDto,
  LlmStatsResponseDto,
} from './tenant-llm.dto'

// ─── 实用常量 ───────────────────────────────────────────────────────────────
export const DEFAULT_TENANT_QUOTA_TOKENS_PER_DAY = 1_000_000
export const DEFAULT_TENANT_CONCURRENCY = 5
export const LLM_PROVIDER_PRIORITY: string[] = ['deepseek', 'claude', 'openai']
export const REGION_LATENCY_THRESHOLD_MS = 200
export const GEO_ROUTING_DEFAULT_WEIGHT = 1.0
export const TENANT_QUOTA_RESET_CRON = '0 0 * * *' // daily at midnight
export const LLM_USAGE_WARNING_THRESHOLD = 0.8 // 80% usage triggers warning
export const LLM_REQUEST_TIMEOUT_MS = 30_000
export const LLM_RETRY_MAX_ATTEMPTS = 3
export const LLM_RETRY_BASE_DELAY_MS = 1_000
export const LLM_CIRCUIT_BREAKER_THRESHOLD = 5 // errors within window
export const LLM_CIRCUIT_BREAKER_WINDOW_MS = 60_000
export const LLM_LOG_LEVEL = 'info' as const
export const LLM_CACHE_ENABLED = true
export const LLM_CACHE_TTL_MS = 300_000
