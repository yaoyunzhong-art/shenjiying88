# Best Practice · Error Handling (错误处理规范)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🔴 P0
> 来源: NestJS 异常体系 + Phase-15+ 实战

---

## 1. 🎯 目标

统一错误处理,确保:
- ✅ 错误类型明确 (业务 vs 系统)
- ✅ HTTP 状态码准确
- ✅ 客户端错误信息清晰
- ✅ 内部错误信息脱敏

---

## 2. 📐 错误分类

| 类型 | HTTP 状态 | 示例 | 是否重试 |
|---|---|---|---|
| 业务错误 (可预期) | 400 / 409 / 422 | 参数校验失败 / 资源已存在 / 配额超限 | ❌ |
| 认证错误 | 401 / 403 | 未登录 / 无权限 | ❌ |
| 资源不存在 | 404 | 会员不存在 | ❌ |
| 系统错误 (不可预期) | 500 | DB 故障 / 编程错误 | ⚠️ |
| 依赖不可用 | 503 | LLM Provider 不可用 / Redis 故障 | ✅ |

---

## 3. ✅ 自定义业务异常

```typescript
// apps/api/src/common/exceptions/business.exceptions.ts
import { HttpException, HttpStatus } from '@nestjs/common'

export class BusinessException extends HttpException {
  constructor(
    public readonly code: string,        // 'QUOTA_EXCEEDED'
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: any,       // 详细上下文 (脱敏)
  ) {
    super({ code, message, details }, status)
  }
}

// 使用示例
if (current >= limit) {
  throw new BusinessException(
    'QUOTA_EXCEEDED',
    `Tenant ${tenantId} 配额已用完: ${current}/${limit}`,
    HttpStatus.PAYMENT_REQUIRED,  // 402
    { tenantId, current, limit, resource: 'member' }
  )
}
```

---

## 4. ✅ 全局异常过滤器

```typescript
// apps/api/src/common/filters/all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly logger: Logger,
    @Inject('METRICS') private readonly metrics: MetricsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const req = ctx.getRequest<Request>()
    const res = ctx.getResponse<Response>()

    let status: number
    let body: any
    let errorCode: string

    if (exception instanceof BusinessException) {
      status = exception.getStatus()
      body = exception.getResponse()
      errorCode = (body as any).code
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      const r = exception.getResponse()
      body = typeof r === 'string' ? { code: 'HTTP_ERROR', message: r } : r
      errorCode = (body as any).code ?? `HTTP_${status}`
    } else {
      // 系统错误
      status = 500
      const err = exception as Error
      this.logger.error({
        message: err.message,
        stack: err.stack,
        path: req.url,
        method: req.method,
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
      }, 'unhandled exception')

      body = {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',  // 内部错误对外脱敏
      }
      errorCode = 'INTERNAL_ERROR'
    }

    // Metrics
    this.metrics.increment('http.errors', { code: errorCode, status })

    res.status(status).json({
      success: false,
      error: body,
      timestamp: new Date().toISOString(),
      path: req.url,
    })
  }
}

// main.ts 注册
app.useGlobalFilters(new AllExceptionsFilter(logger, metrics))
```

---

## 5. ✅ 错误日志规范

```typescript
// ✅ 结构化错误日志
this.logger.error({
  event: 'member.register.failed',
  tenantId: dto.tenantId,
  memberId: result?.id,
  errorCode: err.code,
  errorMessage: err.message,
  errorStack: err.stack,
  requestId: req.id,
  durationMs: Date.now() - start,
}, 'member registration failed')

// ❌ 反例: 自由文本
this.logger.error('注册失败了')
```

---

## 6. ✅ 错误重试 vs 不重试

```typescript
// ❌ 不重试: 业务错误
if (err instanceof QuotaExceededException) {
  return res.status(402).json({ code: 'QUOTA_EXCEEDED' })
}

// ✅ 重试: 系统/依赖错误
if (err instanceof NetworkError || err instanceof TimeoutError) {
  await retryWithBackoff(() => this.call(), { maxAttempts: 3 })
}
```

---

## 7. ✅ 必须遵守

- [ ] 所有业务错误用 BusinessException
- [ ] 系统错误对外脱敏 (message = 'Internal server error')
- [ ] 错误日志结构化 JSON
- [ ] 错误 metrics 上报 (按 code 分组)
- [ ] 5xx 错误立即 P0 告警

---

## 8. 🔗 关联

- [logging-standards.md](./logging-standards.md) · 日志
- [multi-tenant-isolation.md](./multi-tenant-isolation.md) · 租户错误
