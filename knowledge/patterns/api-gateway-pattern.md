# Pattern · API Gateway (API 网关模式)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 适用: 微服务架构 / 多端统一入口 / 跨切关注点
> 来源: 神机营 NestJS 多 app (api / admin-web / app-web) 统一网关

---

## 1. 🎯 问题

多服务 / 多端场景:
- ❌ 每个服务都要实现鉴权 / 限流 / 日志
- ❌ 客户端对接 N 个服务 (耦合)
- ❌ 跨服务调用复杂 (服务发现 / 负载均衡)

API Gateway = **统一入口**,集中处理跨切关注点。

---

## 2. 🏗️ 职责

```
   ┌─────────────────────────────────────┐
   │      API Gateway (e.g. Kong)        │
   │                                     │
   │  ✅ Authentication (JWT 校验)       │
   │  ✅ Rate Limiting (限流)            │
   │  ✅ Request Routing (路由)          │
   │  ✅ Load Balancing (负载均衡)        │
   │  ✅ Circuit Breaker (熔断)          │
   │  ✅ Logging / Metrics (可观测)      │
   │  ✅ Caching (缓存)                  │
   │  ✅ Transformation (协议转换)        │
   └─────────────────────────────────────┘
              ↓
   ┌────────┬────────┬────────┐
   ↓        ↓        ↓        ↓
[Auth]  [Order]  [Coupon]  [Member]
```

---

## 3. 📐 神机营实现 (NestJS 自建网关)

```typescript
// apps/api-gateway/src/gateway.controller.ts
@Controller('api/v1')
@UseGuards(JwtAuthGuard, RateLimitGuard, TenantIsolationGuard)
@UseInterceptors(LoggingInterceptor, MetricsInterceptor)
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly auth: ClientProxy,
    @Inject('ORDER_SERVICE') private readonly order: ClientProxy,
    @Inject('COUPON_SERVICE') private readonly coupon: ClientProxy,
  ) {}

  // 路由转发
  @Post('auth/login')
  async login(@Body() dto: LoginDto) {
    return firstValueFrom(this.auth.send('auth.login', dto))
  }

  @Post('orders')
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: Request) {
    // 注入 tenantId (从 JWT)
    return firstValueFrom(this.order.send('order.create', {
      ...dto,
      tenantId: req.user.tenantId,
    }))
  }

  @Post('coupons/redeem')
  async redeemCoupon(@Body() dto: RedeemDto) {
    return firstValueFrom(this.coupon.send('coupon.redeem', dto))
  }
}
```

---

## 4. 📐 关键拦截器

### 4.1 Logging Interceptor

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const start = Date.now()
    const req = ctx.switchToHttp().getRequest()
    return next.handle().pipe(
      tap(() => {
        this.logger.log({
          method: req.method,
          path: req.url,
          status: ctx.switchToHttp().getResponse().statusCode,
          latencyMs: Date.now() - start,
          userId: req.user?.id,
          tenantId: req.user?.tenantId,
        })
      }),
    )
  }
}
```

### 4.2 Tenant Isolation Guard

```typescript
@Injectable()
export class TenantIsolationGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest()
    const tenantId = req.user?.tenantId
    if (!tenantId) throw new UnauthorizedException('missing tenant context')

    // URL path 中的 tenantId 必须与 JWT 一致
    const urlTenantId = req.params.tenantId || req.query.tenantId
    if (urlTenantId && urlTenantId !== tenantId) {
      throw new ForbiddenException('tenant mismatch')
    }
    return true
  }
}
```

---

## 5. 📊 Kong / Nginx 替代方案

| 方案 | 适用 | 优点 | 缺点 |
|---|---|---|---|
| Kong | 大型 / 高并发 | 插件丰富 (限流/熔断/OAuth) | 运维复杂 |
| Nginx + Lua | 中型 | 性能高 | 需写 Lua 脚本 |
| AWS API Gateway | 云原生 | 无运维 | 绑定云厂商 |
| NestJS 自建 | 中小 / TS 全栈 | 复用现有代码 | 性能 < Nginx |
| **Envoy** | Service Mesh | 强大 | 学习曲线陡 |

---

## 6. 🔗 关联

- [throttling-pattern.md](./throttling-pattern.md) · 限流 (网关层)
- [circuit-breaker.md](./circuit-breaker.md) · 熔断 (网关层)
- [multi-tenant-isolation.md](../best-practices/multi-tenant-isolation.md) · 多租户
