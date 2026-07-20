/**
 * rls.middleware-prisma.ts — Prisma 中间件: 数据库层 tenantId 自动注入
 *
 * 🐜 V20: 安全基线修复 — 数据库层 RLS 拦截 (安全基线 #3)
 *
 * 职责:
 *   通过 Prisma v6 `$extends` query middleware ($allOperations)
 *   在执行查询/变更前自动注入 tenantId 过滤条件。
 *   tenantId 来源: `AsyncLocalStorage` (nest `tenant-context.ts`)
 *
 * 与 RLS policy 的关系:
 *   - PostgreSQL RLS policy (SET app.tenant_id): 数据库层面的强制隔离
 *   - 本中间件: 应用层的 Prisma query 拦截，双保险
 *   两者互补，不冲突。
 *
 * 设计原则:
 *   - 只对白名单中具有 tenantId 字段的模型做注入
 *   - 创建时自动填充 tenantId
 *   - 查询/更新/删除时自动附加 WHERE tenantId = ?
 *   - 跳过 queryRaw / executeRaw (原始 SQL 已有 RLS policy 保护)
 *   - 用户已显式指定 tenantId 条件时不覆盖
 *   - 无租户上下文时降级为不注入（兼容维护/初始化脚本）
 *
 * 使用方式:
 *   ```ts
 *   // prisma.service.ts
 *   import { createRlsExtension } from '../modules/rls/rls.middleware-prisma'
 *
 *   async onModuleInit() {
 *     const extClient = this.$extends(createRlsExtension())
 *     this._applyExtension(extClient)
 *     await this.$connect()
 *   }
 *   ```
 *
 * 安全基线修复项: #3 RLS 模块 — 数据库层拦截
 */

import { getTenantContext } from '../../common/context/tenant-context'

// ── 已知包含 tenantId 字段且需要中间件自动注入的业务模型白名单 ──
// 从 schema.prisma 中识别。
// 不在白名单中的模型（如 Tenant, Brand, User, AuditLog 等）不自动注入。
// 只包含具有 tenantId 列的实际业务模型（排除系统/身份模型）。
const TENANT_AWARE_MODELS = new Set([
  // ── 核心业务模型（required tenantId） ──
  'Store',
  'MemberProfile',
  'MemberProfileExtension',
  'LytMemberSnapshot',
  'LytOrderSnapshot',
  'LytPaymentSnapshot',
  'MemberOperationsTask',
  'MemberOperationsExecutionReceipt',
  'LytConnection',
  'CustomDomain',
  'FoundationAlertAcknowledgement',
  'EdgeNode',
  'ConfigAuditLog',
  'MarketingPushDecisionLog',
  'InspectionTask',
  'InvoiceV2',
  'FinanceLedger',
  'FinanceAccount',
  'FinanceSettlement',

  // ── 扩展业务模型（optional tenantId，有上下文时注入） ──
  'RegionalConfigOverride',
  'PortalSite',
  'IdentityAccount',
  'OrganizationNode',
  'AccessPolicy',
  'GovernanceApproval',
  'ConfigEntry',
  'SecretAsset',
  'CertificateAsset',
  'DomainEvent',
  'WebhookSubscription',
  'NotificationTemplate',
  'NotificationDispatch',
  'FileAsset',
  'OpenPlatformApp',
  'RateLimitPolicy',
  'FeatureFlag',
  'BackupSnapshot',
  'RestoreRun',
  'PiiPolicy',
  'AiModelConfig',
  'AiExecutionRecord',
  'ReconciliationReportModel',
])

// ── 查询操作（需要 WHERE tenantId 注入） ──────────────────────
const ACTIONS_WHERE = new Set([
  'findUnique',
  'findMany',
  'findFirst',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'aggregate',
  'count',
  'groupBy',
])

// ── 创建操作（需要 data.tenantId 注入） ──────────────────────
const ACTIONS_CREATE = new Set([
  'create',
  'createMany',
  'upsert',
])

/**
 * 创建 Prisma v6 `$extends` 扩展参数对象，注册 $allOperations query 中间件。
 *
 * 该扩展拦截所有模型的所有操作，对 tenant-aware 模型自动注入 tenantId：
 *
 *   创建 (create / createMany / upsert)
 *     → 为 data 自动填充 tenantId（若用户未指定）
 *
 *   查询 (findMany / findFirst / findUnique / aggregate / count / groupBy)
 *     → 在 where 中附加 tenantId = ?（若用户未指定）
 *
 *   更新 (update / updateMany / upsert)
 *     → 在 where 和/或 data 中处理 tenantId
 *
 *   删除 (delete / deleteMany)
 *     → 在 where 中附加 tenantId = ?（若用户未指定）
 *
 * @example
 *   const extClient = prisma.$extends(createRlsExtension())
 */
export function createRlsExtension() {
  return {
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }: any) {
          // ── 1. 获取租户上下文 ──────────────────────────
          const ctx = getTenantContext()
          if (!ctx?.tenantId) {
            // 无租户上下文: 降级 — 不注入，不拦截
            // 确保维护脚本/CLI 工具/测试不受影响
            return query(args)
          }

          const modelName = model as string
          // ── 2. 非 tenant-aware 模型跳过 ──────────────
          if (!TENANT_AWARE_MODELS.has(modelName)) {
            return query(args)
          }

          const tenantId = ctx.tenantId

          // ── 3. 查询/更新/删除类: WHERE 注入 ──────────
          if (ACTIONS_WHERE.has(operation)) {
            const existingWhere = args?.where ?? {}
            if (!('tenantId' in existingWhere)) {
              args = {
                ...args,
                where: {
                  ...existingWhere,
                  tenantId,
                },
              }
            }
          }

          // ── 4. 创建类: data.tenantId 注入 ─────────────
          if (operation === 'create' || operation === 'upsert') {
            const data = args?.data ?? {}
            if (!('tenantId' in data)) {
              args = {
                ...args,
                data: {
                  ...data,
                  tenantId,
                },
              }
            }
          }

          if (operation === 'createMany') {
            const dataArr = args?.data
            if (Array.isArray(dataArr)) {
              args = {
                ...args,
                data: dataArr.map(
                  (item: any) =>
                    item && !('tenantId' in item)
                      ? { ...item, tenantId }
                      : item,
                ),
              }
            }
          }

          return query(args)
        },
      },
    },
  } as const
}

/**
 * 便利函数：创建并返回一个应用了 RLS 中间件的 PrismaClient。
 * 适用于 CLI 脚本、测试等需要独立 client 的场景。
 *
 * @example
 *   const client = createRlsClient()
 *   await client.memberProfile.findMany() // 自动注入 tenantId
 */
export function createRlsClient(): ReturnType<typeof import('@prisma/client').PrismaClient['prototype']['$extends']> {
  const { PrismaClient } = require('@prisma/client') as typeof import('@prisma/client')
  const client = new PrismaClient()
  return client.$extends(createRlsExtension())
}
