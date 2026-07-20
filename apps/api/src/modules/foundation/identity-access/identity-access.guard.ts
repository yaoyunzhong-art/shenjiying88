import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { TenantAwareRequest, TenantScopeRequirement } from '../../tenant/tenant.types'
import {
  PERMISSIONS_METADATA_KEY,
  ROLES_METADATA_KEY,
  TENANT_SCOPE_METADATA_KEY,
  type TenantScopeMetadata
} from './identity-access.decorator'
import { IdentityAccessService } from './identity-access.service'
import { IS_PUBLIC_KEY } from './public.decorator'

@Injectable()
export class IdentityAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly identityAccessService: IdentityAccessService
  ) {}

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? false
    )
  }

  private resolveScopeRequirement(
    req: TenantAwareRequest,
    metadata?: TenantScopeMetadata
  ): TenantScopeRequirement {
    const readParam = (key?: string) => {
      if (!key) {
        return undefined
      }

      const value = req.params?.[key]
      return Array.isArray(value) ? value[0] : value
    }
    const useRequestTenant = metadata?.useRequestTenant !== false

    return {
      tenantId: readParam(metadata?.tenantIdParam) ?? (useRequestTenant ? req.tenantContext?.tenantId : undefined),
      brandId: readParam(metadata?.brandIdParam) ?? (useRequestTenant ? req.tenantContext?.brandId : undefined),
      storeId: readParam(metadata?.storeIdParam) ?? (useRequestTenant ? req.tenantContext?.storeId : undefined)
    }
  }

  canActivate(context: ExecutionContext) {
    // ── [1] 白名单: @Public() 标记的端点直接放行 ──
    if (this.isPublic(context)) {
      return true
    }

    const roles =
      this.reflector.getAllAndOverride<string[]>(ROLES_METADATA_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? []
    const permissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_METADATA_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? []
    const tenantScopeMetadata = this.reflector.getAllAndOverride<TenantScopeMetadata>(
      TENANT_SCOPE_METADATA_KEY,
      [context.getHandler(), context.getClass()]
    )

    // ── [2] 没有 roles / permissions / tenantScope → 默认拒绝 ──
    //     不再像旧版那样自动放行。没有被 @Public() 标记且没有认证元数据的端点,
    //     必须通过 @Public()  显式声明为公开,否则拒绝。
    // ────────────────────────────────────────────────────────────
    if (roles.length === 0 && permissions.length === 0 && !tenantScopeMetadata) {
      throw new UnauthorizedException(
        'This endpoint is not publicly accessible. Mark with @Public() or provide authentication.'
      )
    }

    const req = context.switchToHttp().getRequest<TenantAwareRequest>()
    const actorContext = req.actorContext

    if (!actorContext?.authenticated) {
      throw new UnauthorizedException('Missing actor context headers.')
    }

    if (!this.identityAccessService.hasAnyRole(actorContext, roles)) {
      throw new ForbiddenException(`Required role not satisfied: ${roles.join(', ')}`)
    }

    if (!this.identityAccessService.hasAllPermissions(actorContext, permissions)) {
      throw new ForbiddenException(`Required permission not satisfied: ${permissions.join(', ')}`)
    }

    if (
      tenantScopeMetadata &&
      !this.identityAccessService.validateTenantScope(
        req.tenantContext,
        actorContext,
        this.resolveScopeRequirement(req, tenantScopeMetadata)
      )
    ) {
      throw new ForbiddenException('Tenant scope validation failed.')
    }

    return true
  }
}
