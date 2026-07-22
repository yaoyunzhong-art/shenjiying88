import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Optional } from '@nestjs/common'
import type { Response } from 'express'
import { Observable, tap } from 'rxjs'
import type { TenantAwareRequest } from '../../modules/tenant/tenant.types'
import { RequestGovernanceService } from '../governance/request-governance.service'

@Injectable()
export class RequestAuditInterceptor implements NestInterceptor {
  constructor(@Optional() private readonly requestGovernanceService?: RequestGovernanceService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const http = context.switchToHttp()
    const req = http.getRequest<TenantAwareRequest>()
    const res = http.getResponse<Response>()

    this.requestGovernanceService?.ensureRequestContext(req)

    return next.handle().pipe(
      tap({
        next: () => {
          this.requestGovernanceService?.recordRequestSuccess(req, res)
        }
      })
    )
  }
}
