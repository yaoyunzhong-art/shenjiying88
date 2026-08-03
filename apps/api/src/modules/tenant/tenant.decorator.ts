import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import { getTenantContext } from '../../common/context/tenant-context'
import type { TenantAwareRequest } from './tenant.types'

export const TenantContext = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<TenantAwareRequest | undefined>()
  return request?.tenantContext ?? getTenantContext() ?? null
})
