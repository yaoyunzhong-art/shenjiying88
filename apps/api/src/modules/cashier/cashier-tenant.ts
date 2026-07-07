/**
 * cashier-tenant.ts
 *
 * Cashier 模块的跨租户防护 helper.
 *
 * 由来: order / payment / refund 3 service 共 11 处 `if (x.tenantId !== y)` 模式
 * 散落, 行为分裂 3 种:
 *   - tenantSafeGet: 公开读, 跨租户返回 null (由 ViewModel 转 403)
 *   - tenantFilter: 公开读列表, 跨租户从结果过滤掉
 *   - assertSameTenant: 内部/写, 跨租户抛 BadRequest, 缺失抛 NotFound
 *
 * 11 处模板:
 *   order.service.ts:    getById / getItems / getByIdInternal / list 内联过滤
 *   payment.service.ts:  create / confirm / query / getById / listByOrder
 *   refund.service.ts:   create / confirm / getById / listByOrder
 *
 * 集中后: 3 个 helper, 3 套行为契约 1 处定义, 错误码/not-found 文案集中维护,
 * 未来加 tenant 维度 (子租户 / 多 region / 软删除) 1 处扩展.
 */

import { BadRequestException, NotFoundException } from '@nestjs/common'

/** 任何含 tenantId 字段的实体都满足 (Order / Payment / Refund 全部符合) */
export interface TenantScoped {
  tenantId: string
}

// ─── 公开读: 返回 null (不抛错) ──────────────────────

/**
 * 公开读 (getById 模式): 实体缺失或跨租户一律返回 null.
 * 由 ViewModel 层把 null 统一转 404 / 403, 业务层不感知错误响应.
 *
 * 之前 order/payment/refund 3 service 的 getById 各 1 段 3 行模板:
 *   const x = this.X.get(id)
 *   if (!x) return null
 *   if (x.tenantId !== tenantId) return null
 *   return x
 */
export function tenantSafeGet<T extends TenantScoped>(
  entity: T | undefined,
  tenantId: string
): T | null {
  if (!entity) return null
  if (entity.tenantId !== tenantId) return null
  return entity
}

// ─── 公开读列表: 过滤掉跨租户 ──────────────────────────

/**
 * 公开读列表 (listByOrder 模式): 跨租户元素从结果中过滤掉.
 * 注意: 输入是 Iterable (Map.values() 直接传入), 输出是新数组.
 *
 * 之前 order/payment/refund 各 1 段:
 *   return Array.from(this.X.values()).filter((x) => x.tenantId === tenantId).filter(...).sort(...)
 */
export function tenantFilter<T extends TenantScoped>(
  entities: Iterable<T>,
  tenantId: string
): T[] {
  return [...entities].filter((e) => e.tenantId === tenantId)
}

// ─── 内部/写: 缺失抛 NotFound, 跨租户抛 BadRequest ─────────

/**
 * 内部/写 (confirm/query/create/getByIdInternal 模式):
 *   - entity undefined → 抛 NotFoundException(notFoundMessage)
 *   - entity.tenantId !== tenantId → 抛 BadRequestException(errorCode)
 *     可选 errorDetail 拼成 { error: errorCode, ...errorDetail } 对象结构
 *     (order.service.ts 的 getByIdInternal 用这种 detail 形式)
 *
 * 调用方传入:
 *   - errorCode: 例如 'cross_tenant_order_access'
 *   - notFoundMessage: 例如 'order {id} not found'
 *   - errorDetail (可选): 例如 { message: 'order belongs to a different tenant' }
 */
export function assertSameTenant<T extends TenantScoped>(
  entity: T | undefined,
  tenantId: string,
  errorCode: string,
  notFoundMessage: string,
  errorDetail?: Record<string, unknown>
): T {
  if (!entity) throw new NotFoundException(notFoundMessage)
  if (entity.tenantId !== tenantId) {
    if (errorDetail) {
      throw new BadRequestException({ error: errorCode, ...errorDetail })
    }
    throw new BadRequestException(errorCode)
  }
  return entity
}
