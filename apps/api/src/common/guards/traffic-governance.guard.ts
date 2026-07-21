import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Response } from 'express'
import type { TenantAwareRequest } from '../../modules/tenant/tenant.types'
import {
  RATE_LIMIT_METADATA_KEY,
  type RateLimitMetadata
} from '../governance/request-governance.decorator'
import { RequestGovernanceService } from '../governance/request-governance.service'

@Injectable()
export class TrafficGovernanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestGovernanceService: RequestGovernanceService
  ) {}

  async canActivate(context: ExecutionContext) {
    if (context.getType() !== 'http') {
      return true
    }

    if (!this.reflector?.getAllAndOverride) {
      return true
    }

    const metadata = this.reflector.getAllAndOverride<RateLimitMetadata>(RATE_LIMIT_METADATA_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!metadata) {
      return true
    }

    const http = context.switchToHttp()
    const req = http.getRequest<TenantAwareRequest>()
    const res = http.getResponse<Response>()
    if (!this.requestGovernanceService) {
      return true
    }

    const decision = await this.requestGovernanceService.evaluateRateLimit(req, metadata)

    this.requestGovernanceService.applyRateLimitHeaders(res, decision)

    if (!decision.allowed) {
      throw new HttpException(`Rate limit exceeded for ${decision.scopeKey}`, HttpStatus.TOO_MANY_REQUESTS)
    }

    return true
  }
}
