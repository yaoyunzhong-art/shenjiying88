/**
 * tenant-quota-enforcement.util.ts — Phase-15 task B
 *
 * 业务层 quota + lifecycle 联合守卫 helper。
 *
 * 设计:
 *   - 纯函数,无 NestJS 依赖(可被任意 service 复用)
 *   - guard() 一站式检查: lifecycle 写权限 + quota 余量 + 跨租户隔离
 *   - reserveQuotaAndCreate() 包装模式: 先 reserve,失败抛错;成功执行回调
 *
 * 使用模式:
 *   - registerBrand({ tenantId, ... }):
 *       await assertCanWriteResource(tenantId, lifecycleSvc, QuotaResourceKind.Brand)
 *       const result = quotaSvc.reserve(tenantId, QuotaResourceKind.Brand)
 *       if (!result.allowed) throw new QuotaExceededException(result)
 *       // ... 创建 brand 业务逻辑
 *
 *   - inviteMember({ tenantId, ... }):
 *       同上,kind = QuotaResourceKind.Member
 *
 *   - registerCouponPlan({ tenantId, ... }):
 *       同上,kind = QuotaResourceKind.Campaign
 *
 *   - recordApiCall(tenantId):
 *       quotaSvc.increment(tenantId, QuotaResourceKind.ApiCall)
 *       (允许超限,只用于 metrics,不阻断)
 */

import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus
} from '@nestjs/common'
import { TenantLifecycleService } from './tenant-lifecycle.service'
import { TenantQuotaService } from './tenant-quota.service'
import {
  type QuotaCheckResult,
  QuotaResourceKind
} from './tenant-quota.entity'

/**
 * Quota 超限异常 (HTTP 429 Too Many Requests)
 */
export class QuotaExceededException extends HttpException {
  constructor(public readonly checkResult: QuotaCheckResult) {
    super(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: checkResult.reason ?? 'Quota exceeded',
        error: 'QUOTA_EXCEEDED',
        resource: checkResult.resource,
        currentUsage: checkResult.currentUsage,
        limit: checkResult.limit,
        exceeded: checkResult.exceeded
      },
      HttpStatus.TOO_MANY_REQUESTS
    )
    this.name = 'QuotaExceededException'
  }
}

/**
 * Tenant lifecycle 阻止写异常 (HTTP 409 Conflict)
 */
export class TenantLifecycleBlockedException extends ConflictException {
  constructor(public readonly tenantId: string, public readonly currentStatus: string) {
    super(
      `Tenant ${tenantId} lifecycle status ${currentStatus} blocks write operations`
    )
  }
}

/**
 * 写操作前置守卫: lifecycle 写权限 + quota 余量检查
 *
 * @throws TenantLifecycleBlockedException 当 tenant lifecycle 阻止写
 * @throws QuotaExceededException 当配额已满
 */
export function assertCanWriteResource(
  tenantId: string,
  lifecycle: TenantLifecycleService,
  quota: TenantQuotaService,
  kind: QuotaResourceKind
): void {
  // 1. lifecycle 写权限检查
  if (!lifecycle.canWrite(tenantId)) {
    throw new TenantLifecycleBlockedException(tenantId, lifecycle.getStatus(tenantId))
  }

  // 2. quota 余量检查(非 reserve 模式,只检查不占位)
  const check = quota.check(tenantId, kind)
  if (!check.allowed) {
    throw new QuotaExceededException(check)
  }
}

/**
 * Reserve-and-create 包装器: 失败抛异常,成功执行 callback 并返回 callback 结果
 *
 * @param tenantId 目标 tenant
 * @param lifecycle lifecycle service
 * @param quota quota service
 * @param kind 资源类型
 * @param createFn 创建函数 (reserve 成功后才调用)
 * @returns createFn 的返回值
 */
export async function reserveQuotaAndCreate<T>(
  tenantId: string,
  lifecycle: TenantLifecycleService,
  quota: TenantQuotaService,
  kind: QuotaResourceKind,
  createFn: () => T | Promise<T>
): Promise<T> {
  // 1. lifecycle 写权限
  if (!lifecycle.canWrite(tenantId)) {
    throw new TenantLifecycleBlockedException(tenantId, lifecycle.getStatus(tenantId))
  }

  // 2. reserve (占位 + 失败抛错)
  const result = quota.reserve(tenantId, kind)
  if (!result.allowed) {
    throw new QuotaExceededException(result)
  }

  // 3. 执行业务回调(reserve 已成功,即使回调失败 usage 已被占用 — 后续可考虑 release)
  try {
    return await createFn()
  } catch (err) {
    // 业务回调失败时回滚 reserve,避免配额泄漏
    quota.decrement(tenantId, kind)
    throw err
  }
}

/**
 * 同步版本 reserve-and-create (createFn 非 async)
 */
export function reserveQuotaAndCreateSync<T>(
  tenantId: string,
  lifecycle: TenantLifecycleService,
  quota: TenantQuotaService,
  kind: QuotaResourceKind,
  createFn: () => T
): T {
  if (!lifecycle.canWrite(tenantId)) {
    throw new TenantLifecycleBlockedException(tenantId, lifecycle.getStatus(tenantId))
  }

  const result = quota.reserve(tenantId, kind)
  if (!result.allowed) {
    throw new QuotaExceededException(result)
  }

  try {
    return createFn()
  } catch (err) {
    quota.decrement(tenantId, kind)
    throw err
  }
}

/**
 * API call 计数(非阻塞,允许超限)
 *
 * 使用场景: 每个 HTTP 请求后调用,记录 tenant 的 API 调用量
 * 业务方应自行限流,这里只计数
 */
export function recordApiCall(
  tenantId: string,
  quota: TenantQuotaService,
  delta = 1
): void {
  try {
    quota.increment(tenantId, QuotaResourceKind.ApiCall, delta)
  } catch {
    // 计数失败不影响主流程
  }
}

/**
 * 删除资源时释放 quota (用于 deleteBrand / deleteMember / deleteCampaign 等)
 */
export function releaseQuota(
  tenantId: string,
  quota: TenantQuotaService,
  kind: QuotaResourceKind,
  delta = 1
): void {
  try {
    quota.decrement(tenantId, kind, delta)
  } catch {
    // release 失败不阻断主流程
  }
}

/**
 * 装饰器工厂: 在 service 方法上声明所需的 quota kind
 *
 * 使用:
 *   class BrandService {
 *     constructor(private readonly quota: TenantQuotaService, ...) {}
 *
 *     @QuotaGated(QuotaResourceKind.Brand)
 *     registerBrand(input: { tenantId: string }) { ... }
 *   }
 *
 * 注: 此装饰器要求 service 注入 TenantQuotaService + TenantLifecycleService
 */
export function QuotaGated(kind: QuotaResourceKind) {
  return function (
    _target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const original = descriptor.value as (...args: unknown[]) => unknown
    descriptor.value = function (this: QuotaGatedContext, ...args: unknown[]): unknown {
      const [firstArg] = args
      const tenantId = (firstArg as { tenantId?: string } | undefined)?.tenantId
      if (!tenantId) {
        throw new Error(
          `@QuotaGated on ${propertyKey}: first arg must have tenantId field`
        )
      }
      assertCanWriteResource(tenantId, this.lifecycle, this.quota, kind)
      return original.apply(this, args)
    }
    return descriptor
  }
}

/**
 * QuotaGated 装饰器要求的 service context 接口
 */
export interface QuotaGatedContext {
  quota: TenantQuotaService
  lifecycle: TenantLifecycleService
}

/** Re-export 供 e2e 测试用 */
export { ConflictException, ForbiddenException }