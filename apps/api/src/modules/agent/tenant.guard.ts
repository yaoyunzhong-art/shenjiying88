/**
 * Phase-31 TenantGuard: 强制 tenantId 注入
 *
 * 行为:
 *   1. 从 `x-tenant-id` header 读取 tenantId
 *   2. 缺失 → 401 UnauthorizedException
 *   3. 存在 → 写入 request.tenantId 供 controller 使用
 *
 * 应用:
 *   @UseGuards(TenantGuard)
 *   @Post('sessions/run')
 *   runSession(@Headers('x-tenant-id') tenantId: string, ...) { ... }
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.headers['X-Tenant-Id'] ||
      request.query?.tenantId

    if (!tenantId || typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new UnauthorizedException('Missing x-tenant-id header')
    }

    // 写入 request 供下游 controller / service 使用
    request.tenantId = tenantId.trim()
    return true
  }
}