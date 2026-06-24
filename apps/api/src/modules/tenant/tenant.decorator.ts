import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { TenantAwareRequest } from './tenant.types'

export const TenantContext = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest<TenantAwareRequest>()
  return req.tenantContext
})
