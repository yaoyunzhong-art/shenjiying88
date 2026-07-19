/**
 * tenant-llm.service.ts — Tenant LLM Service (canonical name)
 *
 * 多租户 LLM 配置模块入口。
 * 统一导出 LLM 配置管理 & 地理路由的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   TenantLLMService        LLM 配置管理 & 多租户配额
 *   I18nGeoService          国际化 & 地理路由 (按区域选择 LLM)
 *   TenantLLMGateway        LLM 网关 (请求分发 & 限流 & 容错)
 *
 * 实体类型 ─────────────────────
 *   LlmModelConfig          LLM 模型配置 (provider/model/key)
 *   TenantQuota             租户配额 (tokens/并发/预算)
 *   UsageRecord             用量记录
 *   RegionConfig            区域配置
 *   GeoRoutingRule          地理路由规则
 *
 * DTO 类型 ─────────────────────
 *   LlmProvider             LLM 提供商枚举
 *   LlmConfigStatus         配置状态枚举
 *   CreateLlmConfigDto      创建配置 DTO
 *   UpdateLlmConfigDto      更新配置 DTO
 *   ApplyLlmConfigDto       申请配置 DTO
 *   ApproveLlmConfigDto     审批配置 DTO
 *   LlmConfigQueryDto       查询参数 DTO
 *   LlmStatsResponseDto     统计响应 DTO
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
  LlmModelConfig,
  TenantQuota,
  UsageRecord,
  RegionConfig,
  GeoRoutingRule,
} from './llm-config.entity'

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
