import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import type { Response } from 'express'
import type { TenantAwareRequest } from '../../modules/tenant/tenant.types'
import { RequestGovernanceService } from '../governance/request-governance.service'

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly requestGovernanceService: RequestGovernanceService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      return
    }

    const ctx = host.switchToHttp()
    const request = ctx.getRequest<TenantAwareRequest>()
    const response = ctx.getResponse<Response>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const message = exception instanceof Error ? exception.message : 'Internal server error'

    this.requestGovernanceService.recordRequestFailure(
      request,
      status,
      message,
      exception instanceof Error ? exception.name : 'UnhandledException'
    )

    response.status(status).json({
      success: false,
      message,
      data: null,
      timestamp: new Date().toISOString()
    })
  }
}
