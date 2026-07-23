/**
 * 付费授权 - Guard + 装饰器 (V9 需求 2 · V10 Day 4)
 *
 * 使用:
 *   @UseGuards(LicenseGuard)
 *   @RequireLicense('ai.capability')
 *   async someControllerMethod() { ... }
 *
 * 或 service 层直接调用:
 *   await licenseService.requireLicense('ai.capability')
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  applyDecorators,
  UseGuards,
  createParamDecorator,
} from '@nestjs/common'
import type { Request } from 'express'
import { LicenseService } from './license.service'
import { LICENSE_GUARD_KEY, type LicenseGuardMeta, type LicenseScope } from './license.entity'

// ============ 装饰器 ============

/** @RequireLicense('ai.capability') */
export const RequireLicense = (
  scope: LicenseScope,
  options?: { allowTrial?: boolean },
) => {
  const meta: LicenseGuardMeta = { scope, allowTrial: options?.allowTrial ?? false }
  return applyDecorators(
    SetMetadata(LICENSE_GUARD_KEY, meta),
    UseGuards(LicenseGuard),
  )
}

// ============ Guard ============

@Injectable()
export class LicenseGuard implements CanActivate {
  constructor(private readonly licenseService: LicenseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta: LicenseGuardMeta | undefined = this.reflector(context)
    if (!meta) return true // 没设置 @RequireLicense 装饰器,放行

    const req = context.switchToHttp().getRequest<Request>()
    const user = (req as unknown as { user?: Record<string, unknown> }).user ?? {}
    if (!user.tenantId) {
      throw new Error('[LicenseGuard] Missing tenantId in req.user')
    }

    const ctx = {
      tenantId: user.tenantId,
      storeId: user.storeId ?? req.query?.storeId ?? req.body?.storeId,
      userId: user.id ?? user.userId,
      role: user.role,
    }

    // 在 tenant context 内执行 license 检查
    const { runWithTenant } = await import('../../common/context/tenant-context')
    await runWithTenant(ctx, async () => {
      const result = await this.licenseService.checkLicense({
        scope: meta.scope,
        storeId: ctx.storeId,
      })

      if (!result.allowed) {
        if (meta.allowTrial && result.license?.activationSource === 'trial') {
          // 允许试用通过
          return
        }
        // 透传到 requireLicense 的 throw
        await this.licenseService.requireLicense(ctx.tenantId, ctx.userId, meta.scope, ctx.storeId)
      }
    })

    return true
  }

  private reflector(ctx: ExecutionContext): LicenseGuardMeta | undefined {
    // 简化: 不用 Reflector,直接从 handler 取 metadata (NestJS 自动注入)
    const handler = ctx.getHandler()
    return Reflect.getMetadata(LICENSE_GUARD_KEY, handler)
  }
}

// ============ Param 装饰器 (取当前 license) ============

/** @CurrentLicense() license: License */
export const CurrentLicense = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<Request>()
  return (req as unknown as { license?: Record<string, unknown> }).license ?? null
})