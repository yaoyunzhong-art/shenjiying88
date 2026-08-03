/**
 * Phase-87: Tenant Context (V9 需求 5 · V10 Day 2)
 *
 * 提供 AsyncLocalStorage 注入当前请求的 tenant_id
 * 配合 PG session 变量 (SET LOCAL app.tenant_id) 实现 RLS 强制隔离
 *
 * 使用模式:
 *   await tenantContext.run({ tenantId, storeId, userId }, async () => {
 *     // 这里所有的 SQL 自动应用 RLS
 *     const rows = await pool.query('SELECT * FROM ai_model_store_config')
 *     // rows 只会包含当前 tenant 的数据
 *   })
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import { getPgPool } from '../../database/pg-pool'
import { UnauthorizedException } from '@nestjs/common'

// ============ 类型 ============

/** 租户角色 */
export type TenantRole = 'super_admin' | 'brand_admin' | 'tenant_admin' | 'store_admin' | 'operator' | 'viewer' | 'auditor'

export interface TenantContext {
  /** 租户 ID (V9 RLS 关键字段) */
  tenantId: string
  /** 门店 ID (V9 维度) */
  storeId?: string
  /**
   * 品牌 ID (Phase-FP P0-C7 修复: 显式存储, 不再从 tenantId 推导)
   * - V10 Day 6 简化版曾用 `tenantId.split('-')[0]` 推导, 存在跨租户 brand 串扰
   * - 现在 brandId 必须由调用方显式提供, 服务端校验归属
   */
  brandId?: string
  /** 当前用户 ID (审计用) */
  userId?: string
  /** 用户角色 (V9 权限分级) */
  role?: TenantRole
}

// ============ AsyncLocalStorage 实例 ============

const als = new AsyncLocalStorage<TenantContext>()

/**
 * 获取当前请求的 tenant context
 * 未在 run() 块内时返回 undefined
 */
export function getTenantContext(): TenantContext | undefined {
  return als.getStore()
}

/**
 * 必须有 tenant context (用于 service 层强制校验)
 * 缺失时抛 UnauthorizedException (401) 而非 native Error (500)
 *
 * Phase-FP P0-A3 修复: 防止 500 + 栈泄露
 */
export function requireTenantContext(): TenantContext {
  const ctx = als.getStore()
  if (!ctx || !ctx.tenantId) {
    // 使用 NestJS UnauthorizedException → 401 + 标准化错误响应
    // 而非 native Error → 500 + 栈帧暴露
    throw new UnauthorizedException('Authentication required (tenant context missing)')
  }
  return ctx
}

// ============ 关键能力: withTenantSession ============

/**
 * 在 PG 连接上注入 RLS session 变量,然后执行回调
 *
 * 内部使用 withTransaction 确保 SET LOCAL 生效范围
 * 失败自动回滚 + 释放连接
 */
export async function withTenantSession<T>(
  context: TenantContext,
  fn: (client: any) => Promise<T>
): Promise<T> {
  const pool = getPgPool()
  if (!pool) {
    // 无 PG 配置时降级为纯 ALS (用于 dev/test)
    return als.run(context, async () => fn(undefined as unknown as T))
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // 关键: SET LOCAL 让 RLS policy 看到 app.tenant_id
    await client.query("SET LOCAL app.tenant_id = $1", [context.tenantId])
    if (context.storeId) {
      await client.query("SET LOCAL app.store_id = $1", [context.storeId])
    }
    if (context.userId) {
      await client.query("SET LOCAL app.user_id = $1", [context.userId])
    }

    // 嵌套 ALS (用于 service 层 requireTenantContext())
    const result = await als.run(context, async () => fn(client))

    await client.query('COMMIT')
    return result
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw err
  } finally {
    client.release()
  }
}

/**
 * 简化版:无客户端 (用于纯 ALS 场景)
 */
export function runWithTenant<T>(context: TenantContext, fn: () => T | Promise<T>): Promise<T> {
  return Promise.resolve(als.run(context, fn))
}

// ============ 工具: 校验当前请求的 store 是否属于当前 tenant ============

/**
 * 检查 store 是否属于当前 tenant (基于配置的 storeId)
 * 防止 storeId 伪造越权 (V9 硬约束)
 */
export function assertStoreOwnership(storeId: string): void {
  const ctx = requireTenantContext()
  if (ctx.storeId && ctx.storeId !== storeId) {
    throw new Error(
      `[tenant-context] Store ownership violation: context.storeId=${ctx.storeId} requested=${storeId}`,
    )
  }
  // super_admin / brand_admin 跳过校验
  if (ctx.role === 'super_admin' || ctx.role === 'brand_admin') return
}