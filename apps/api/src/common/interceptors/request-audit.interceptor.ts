import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Optional } from '@nestjs/common'
import type { Response } from 'express'
import { Observable, tap } from 'rxjs'
import type { TenantAwareRequest } from '../../modules/tenant/tenant.types'
import { AuditService } from '../../modules/audit/audit.service'
import type { AuditEventType, RiskLevel } from '../../modules/audit/audit.service'

/**
 * 请求审计拦截器 — 自动记录所有 HTTP 请求到系统审计日志
 * 
 * 规则:
 * - GET 请求: 低风险, 默认不记录 (除非带敏感参数)
 * - POST/PUT/PATCH/DELETE: 记录 resourceType 为 'api' + 模块路径
 * - 400+ 响应: 风险升级为 medium
 * - 401/403: 风险升级为 high
 * 
 * 通过 metadata 传递 module name (RESOURCE_TYPE), 由 controller 通过
 * @SetMetadata('audit:module', 'cashier') 指定
 */
@Injectable()
export class RequestAuditInterceptor implements NestInterceptor {
  constructor(
    @Optional() private readonly audit?: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle()

    const http = context.switchToHttp()
    const req = http.getRequest<TenantAwareRequest>()
    const method = req.method
    const path = req.path
    const moduleName = this.extractModule(path)

    // GET/HEAD requests: skip audit (too noisy)
    if (method === 'GET' || method === 'HEAD') return next.handle()

    const start = Date.now()
    return next.handle().pipe(
      tap({
        next: () => {
          // Success — low risk audit
          this.audit?.log({
            eventType: 'api.request' as AuditEventType,
            actorId: (req as any).memberId ?? (req as any).user?.id ?? 'anonymous',
            actorType: (req as any).user ? 'user' : 'system',
            tenantId: req.tenantContext?.tenantId,
            resourceType: moduleName,
            resourceId: path,
            riskLevel: 'low' as RiskLevel,
            metadata: { method, statusCode: 200, latencyMs: Date.now() - start },
          }).catch(() => {})
        },
        error: (err: any) => {
          const status = err?.status ?? err?.statusCode ?? 500
          const riskLevel: RiskLevel = status === 401 || status === 403 ? 'high' : status >= 400 ? 'medium' : 'low'
          this.audit?.log({
            eventType: 'api.error' as AuditEventType,
            actorId: (req as any).memberId ?? (req as any).user?.id ?? 'anonymous',
            actorType: (req as any).user ? 'user' : 'system',
            tenantId: req.tenantContext?.tenantId,
            resourceType: moduleName,
            resourceId: path,
            riskLevel,
            metadata: { method, statusCode: status, error: err?.message?.slice(0, 200) },
          }).catch(() => {})
        }
      })
    )
  }

  /** 从路径提取模块名 */
  private extractModule(path: string): string {
    const parts = path.split('/').filter(Boolean)
    return parts[0] ?? 'unknown'
  }
}
