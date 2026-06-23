import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import type { Response } from 'express'
import { TrustGovernanceService } from '../../modules/foundation/trust-governance/trust-governance.service'
import type {
  RequestGovernanceContext,
  RequestRateLimitDecision,
  TenantAwareRequest
} from '../../modules/tenant/tenant.types'
import type { RateLimitMetadata } from './request-governance.decorator'

type AppliedRateLimitDecision = RequestRateLimitDecision & {
  applied: true
  scopeKey: string
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSeconds: number
  state: Record<string, unknown>
}

@Injectable()
export class RequestGovernanceService {
  constructor(private readonly trustGovernanceService: TrustGovernanceService) {}

  ensureRequestContext(req: TenantAwareRequest): RequestGovernanceContext {
    if (req.governanceContext?.requestId) {
      return req.governanceContext
    }

    req.governanceContext = {
      requestId: req.header('x-request-id')?.trim() || randomUUID(),
      startedAt: Date.now()
    }

    return req.governanceContext
  }

  async evaluateRateLimit(req: TenantAwareRequest, metadata: RateLimitMetadata): Promise<AppliedRateLimitDecision> {
    const context = this.ensureRequestContext(req)
    const scopeBy: Array<NonNullable<RateLimitMetadata['scopeBy']>[number]> = metadata.scopeBy?.length
      ? metadata.scopeBy
      : ['route', 'tenant', 'actor', 'ip']
    const path = this.resolvePath(req)
    const routeKey = `${req.method}:${path}`
    const scopeEntries = scopeBy
      .map((scope) => this.resolveScopeValue(scope, req, routeKey))
      .filter((value): value is string => Boolean(value))
    const scopeKey = [metadata.prefix ?? 'http', ...scopeEntries].join('|')
    const decision = await this.trustGovernanceService.evaluateRateLimit({
      scopeKey,
      limit: metadata.limit,
      windowSeconds: metadata.windowSeconds,
      blockSeconds: metadata.blockSeconds
    })

    const appliedDecision: AppliedRateLimitDecision = {
      applied: true,
      scopeKey: decision.scopeKey,
      allowed: decision.allowed,
      limit: decision.limit,
      remaining: decision.remaining,
      retryAfterSeconds: decision.retryAfterSeconds,
      state: decision.state as Record<string, unknown>
    }

    context.rateLimit = appliedDecision

    return appliedDecision
  }

  applyRateLimitHeaders(res: Response, decision: AppliedRateLimitDecision) {
    res.setHeader('X-RateLimit-Limit', String(decision.limit))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(decision.remaining, 0)))
    res.setHeader('X-RateLimit-Scope', decision.scopeKey)

    if (decision.retryAfterSeconds > 0) {
      res.setHeader('Retry-After', String(decision.retryAfterSeconds))
    }
  }

  recordRequestSuccess(req: TenantAwareRequest, res: Response) {
    this.recordAudit(req, res.statusCode, 'http.request.completed')
  }

  recordRequestFailure(
    req: TenantAwareRequest,
    statusCode: number,
    message: string,
    errorName = 'UnhandledException'
  ) {
    const eventType =
      statusCode === 429
        ? 'http.request.rate-limited'
        : statusCode === 401 || statusCode === 403
          ? 'http.request.denied'
          : 'http.request.failed'

    this.recordAudit(req, statusCode, eventType, {
      errorName,
      errorMessage: message
    })
  }

  private recordAudit(
    req: TenantAwareRequest,
    statusCode: number,
    eventType: string,
    extraDetails: Record<string, unknown> = {}
  ) {
    const context = this.ensureRequestContext(req)
    const durationMs = Math.max(Date.now() - context.startedAt, 0)

    this.trustGovernanceService.recordAudit(
      eventType,
      {
        requestId: context.requestId,
        method: req.method,
        path: this.resolvePath(req),
        originalUrl: req.originalUrl ?? req.url,
        statusCode,
        durationMs,
        ip: this.resolveIp(req),
        userAgent: req.header('user-agent') ?? undefined,
        tenantContext: req.tenantContext,
        actorId: req.actorContext?.actorId,
        actorType: req.actorContext?.actorType,
        rateLimit: context.rateLimit,
        ...extraDetails
      },
      {
        tenantId: req.tenantContext?.tenantId,
        actorId: req.actorContext?.actorId,
        source: 'http',
        riskLevel: statusCode >= 500 ? 'high' : statusCode >= 400 ? 'medium' : 'low'
      }
    )
  }

  private resolvePath(req: TenantAwareRequest) {
    if (req.route?.path) {
      return `${req.baseUrl ?? ''}${req.route.path}`
    }

    return (req.originalUrl ?? req.url).split('?')[0]
  }

  private resolveIp(req: TenantAwareRequest) {
    const forwarded = req.header('x-forwarded-for')?.split(',')[0]?.trim()

    return forwarded || req.ip || req.socket?.remoteAddress || undefined
  }

  private resolveScopeValue(
    scope: NonNullable<RateLimitMetadata['scopeBy']>[number],
    req: TenantAwareRequest,
    routeKey: string
  ) {
    switch (scope) {
      case 'tenant':
        return `tenant:${req.tenantContext?.tenantId ?? 'public'}`
      case 'actor':
        return `actor:${req.actorContext?.actorId ?? 'anonymous'}`
      case 'ip':
        return `ip:${this.resolveIp(req) ?? 'unknown'}`
      case 'route':
        return `route:${routeKey}`
      default:
        return undefined
    }
  }
}
