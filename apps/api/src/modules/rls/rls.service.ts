/**
 * rls.service.ts — RLS Service (canonical name)
 *
 * Row-Level Security 模块入口。
 * 统一导出多租户数据隔离策略管理的全部类型与服务。
 *
 * ═══ 导出概览 ═══════════════════════════════════════════════════════
 *
 * 服务类 ───────────────────────
 *   RlsService                RLS 策略生命周期管理
 *
 * 实体类型 ─────────────────────
 *   RlsStatusEntry            RLS 启用状态 (schema/table/enabled)
 *   RlsTableInfo              表级 RLS 信息
 *   PolicyInfo                行级安全策略 (command/roles/using/check)
 *   TenantPoolEntry           租户连接池 (tenantId/database/status)
 *   AuditLogEntry             策略变更审计日志
 *
 * SQL 生成器 ──────────────────
 *   generateRlsStatusSql      查询 RLS 全局启用状态
 *   generateGetPolicySql      获取指定表的所有策略
 *   generateListPoliciesSql   列出数据库全部策略
 *   generateEnableRlsSql      启用指定表的 RLS
 *   generateForceRlsSql       强制指定表的 RLS
 *   generateCreatePolicySql   创建行级安全策略
 *   generateUpdatePolicySql   更新行级安全策略
 *   generateDropPolicySql     删除行级安全策略
 *   buildTenantFilter         构建 tenantId 过滤 WHERE 子句
 *   setTenantContext           设置当前会话租户上下文
 *   withTenant                 在 tenant 上下文中执行回调
 *   tenantAwareQuery           tenant 感知的原始查询
 *
 * ─── 校验工具 ─────────────────────
 *   validateName              验证表名/列名合法性
 *
 * 校验工具 ─────────────────────
 *   validateName              验证表名/列名合法性
 *
 * DTO ──────────────────────────
 *   RlsStatusQueryDto / EnableRlsDto / CreatePolicyDto
 *   GetPolicyDto / ListPoliciesDto / UpdatePolicyDto
 *   DeletePolicyDto / VerifyFilterDto / SetupIsolationDto
 *   InitPoolDto / VerifyAccessDto / GetAuditLogDto
 *
 * ═══ 使用示例 ═══════════════════════════════════════════════════════
 *
 *   import { RlsService, PolicyInfo } from './rls.service'
 *   const svc = app.get(RlsService)
 *   const sql = svc.enableRls('orders')
 *   const policySql = svc.createPolicy('orders', 'tenant_isolation', {
 *     using: 'tenant_id = current_setting(\'app.tenant_id\')',
 *   })
 *
 * @module Rls
 */

export { RlsService } from './rls.helper'

// ─── 实体类型 ───────────────────────────────────────────────────────────────
export type {
  RlsStatusEntry,
  RlsTableInfo,
  PolicyInfo,
  TenantPoolEntry,
  AuditLogEntry,
} from './rls.helper'

// ─── SQL 生成工具 ───────────────────────────────────────────────────────────
export {
  generateRlsStatusSql,
  generateGetPolicySql,
  generateListPoliciesSql,
  generateEnableRlsSql,
  generateForceRlsSql,
  generateCreatePolicySql,
  generateUpdatePolicySql,
  generateDropPolicySql,
  generateVerifyTenantFilterSql,
  generatePolicyTestSql,
  validateName,
} from './rls.helper'

// ─── DTO ────────────────────────────────────────────────────────────────────
export {
  RlsStatusQueryDto,
  EnableRlsDto,
  CreatePolicyDto,
  GetPolicyDto,
  ListPoliciesDto,
  UpdatePolicyDto,
  DeletePolicyDto,
  VerifyFilterDto,
  SetupIsolationDto,
  InitPoolDto,
  VerifyAccessDto,
  GetAuditLogDto,
} from './rls.dto'

// ─── RLS 常量 ───────────────────────────────────────────────────────────────
export const RLS_DEFAULT_TENANT_COLUMN = 'tenant_id'
export const RLS_POLICY_PREFIX = 'tenant_isolation_policy'
export const RLS_PERMISSIVE_POLICY_TYPE = 'permissive' as const
export const RLS_RESTRICTIVE_POLICY_TYPE = 'restrictive' as const
export const VALID_POLICY_COMMANDS = ['all', 'select', 'insert', 'update', 'delete'] as const
