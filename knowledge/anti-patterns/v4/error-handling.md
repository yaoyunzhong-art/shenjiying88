# 反模式库 v4 · error-handling (错误处理)

> **创建时间**: 2026-06-27 22:38 CST (1h 冲刺 Part 6)
> **分类**: 代码质量 · 可靠性
> **目标读者**: 全栈工程师

---

## 1. 4 类错误处理哲学

### 1.1 返回值 (C 风格)
```typescript
// C 风格: 返回码 + 输出参数
async function createOrder(data, callback) {
  if (!data.tenantId) return callback(new Error('tenantId required'))
  // ...
}
```

### 1.2 异常抛出 (Java/C++ 风格)
```typescript
async function createOrder(data: OrderInput): Promise<Order> {
  if (!data.tenantId) throw new BadRequestException('tenantId required')
  // ...
}
```

### 1.3 Result Type (Rust/Swift)
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

async function createOrder(data: OrderInput): Promise<Result<Order, OrderError>> {
  if (!data.tenantId) return { ok: false, error: { code: 'TENANT_REQUIRED' } }
  // ...
}
```

### 1.4 Maybe/Monad (函数式)
```typescript
type Maybe<T> = T | null

async function createOrder(data: OrderInput): Promise<Maybe<Order>> {
  if (!data.tenantId) return null
  // ...
}
```

**神机营选型**: NestJS 异常抛出 (统一 Exception Filter)

---

## 2. ❌ 反模式 1: 吞掉异常

```typescript
// BAD: try/catch 但吞掉错误
async function processOrder(orderId: string) {
  try {
    await orderService.markPaid(orderId)
  } catch (e) {
    console.log('error')  // 只 log,不知道出了什么错
    // 没有 rethrow,没有返回值,没有通知
  }
}
```

**问题**:
- 调用方不知道失败
- 没有审计追踪
- 监控告警缺失

### ✅ 最佳实践: 结构化日志 + rethrow

```typescript
async function processOrder(orderId: string, traceId: string) {
  try {
    await orderService.markPaid(orderId)
  } catch (e) {
    logger.error({
      orderId, traceId, action: 'markPaid', err: e
    }, 'order markPaid failed')
    throw e  // rethrow 让上层处理
  }
}
```

---

## 3. ❌ 反模式 2: catch (e: any)

```typescript
// BAD: any 丢失类型信息
async function createOrder(data: any) {  // 任何类型都行!
  try {
    return await db.orders.create({ data })
  } catch (e: any) {  // 不知道 e 是什么
    if (e.code === 'P2002') {  // Prisma 唯一约束违反
      // ... 但 e.code 类型是 any
    }
  }
}
```

### ✅ 最佳实践: 精确类型 + 守卫

```typescript
import { Prisma } from '@prisma/client'

async function createOrder(data: OrderInput): Promise<Order> {
  try {
    return await db.orders.create({ data })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new ConflictException(`Order ${data.orderNo} already exists`)
      }
      throw new InternalServerErrorException('DB error')
    }
    throw e  // 未预期的错误,重新抛出
  }
}
```

---

## 4. ❌ 反模式 3: 错误信息泄露

```typescript
// BAD: 直接把内部错误暴露给用户
async function createOrder(data) {
  try {
    return await db.orders.create({ data })
  } catch (e) {
    throw new Error(`DB error: ${e.message}, SQL: ${e.query}, params: ${JSON.stringify(e.params)}`)
    // 用户看到了 SQL 语句!严重安全漏洞
  }
}
```

**问题**:
- SQL 注入风险 (暴露 schema)
- 内部路径泄露
- 攻击者收集情报

### ✅ 最佳实践: 区分内部/外部错误

```typescript
class OrderService {
  async create(data: OrderInput): Promise<Order> {
    try {
      return await db.orders.create({ data })
    } catch (e) {
      // 内部详细日志
      logger.error({
        err: e, action: 'createOrder', tenantId: data.tenantId,
        sql: e.query, params: e.params  // 内部日志可以详细
      }, 'DB error during order creation')

      // 外部友好错误
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException('Order creation conflict')
      }
      throw new InternalServerErrorException('Order creation failed')  // 模糊信息
    }
  }
}
```

---

## 5. ❌ 反模式 4: 没有错误边界 (React)

```tsx
// BAD: 一个组件报错整个页面崩
function CheckoutPage() {
  return (
    <div>
      <Header />
      <PaymentForm />  {/* 如果 PaymentForm 抛错,整个页面挂 */}
      <OrderSummary />
    </div>
  )
}
```

### ✅ 最佳实践: Error Boundary

```tsx
// GOOD: Error Boundary 隔离错误
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    logger.error({ err: error, info: errorInfo }, 'React component error')
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}

function CheckoutPage() {
  return (
    <ErrorBoundary>
      <Header />
      <ErrorBoundary>
        <PaymentForm />  {/* 局部错误不会影响整页 */}
      </ErrorBoundary>
      <ErrorBoundary>
        <OrderSummary />
      </ErrorBoundary>
    </div>
  )
}
```

---

## 6. ❌ 反模式 5: 异步错误未捕获

```typescript
// BAD: async 函数 fire-and-forget
async function createOrder(data) {
  setImmediate(async () => {
    await sendEmail(order)  // 错误吞掉!
  })
}

// 调用
async function controller(req, res) {
  const order = await orderService.create(req.body)
  res.json(order)  // 立即返回,email 可能失败但不影响
  // 但 email 失败没人知道!
}
```

**问题**: unhandled promise rejection,Node.js 进程可能崩溃

### ✅ 最佳实践: 显式错误处理

```typescript
async function controller(req, res) {
  const order = await orderService.create(req.body)
  res.json(order)

  // 异步通知,但显式处理错误
  sendEmail(order).catch(e => {
    logger.error({ orderId: order.id, err: e }, 'email send failed')
    // 通知 ops 但不影响主流程
    notifyOps({ message: 'email failed', orderId: order.id })
  })
}
```

---

## 7. ❌ 反模式 6: HTTP 状态码滥用

```typescript
// BAD: 所有错误都用 500
async function controller(req, res) {
  try {
    const order = await orderService.create(req.body)
    res.json(order)
  } catch (e) {
    res.status(500).json({ error: e.message })
    // 验证错误也 500? 客户端怎么区分?
  }
}
```

### ✅ 最佳实践: 语义化状态码

| 状态码 | 含义 | 何时用 |
|--------|------|--------|
| 400 | Bad Request | 参数错误 |
| 401 | Unauthorized | 未登录 |
| 403 | Forbidden | 无权限 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突 (重复) |
| 422 | Unprocessable Entity | 业务规则违反 |
| 429 | Too Many Requests | 限流 |
| 500 | Internal Server Error | 服务器内部错误 |
| 503 | Service Unavailable | 服务降级 |

```typescript
async function controller(req, res) {
  try {
    const order = await orderService.create(req.body)
    res.status(201).json(order)
  } catch (e) {
    if (e instanceof BadRequestException) return res.status(400).json({ error: e.message })
    if (e instanceof UnauthorizedException) return res.status(401).json({ error: 'Unauthorized' })
    if (e instanceof NotFoundException) return res.status(404).json({ error: e.message })
    if (e instanceof ConflictException) return res.status(409).json({ error: e.message })
    logger.error({ err: e }, 'unexpected error')
    res.status(500).json({ error: 'Internal server error' })  // 模糊信息
  }
}
```

---

## 8. 全局错误处理 (NestJS)

```typescript
// 全局 Exception Filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const traceId = request.headers['x-trace-id']

    let status: number
    let message: string
    let code: string

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      message = typeof res === 'string' ? res : (res as any).message
      code = (res as any).code ?? 'HTTP_ERROR'
    } else {
      status = 500
      message = 'Internal server error'
      code = 'INTERNAL_ERROR'

      // 内部详细日志
      logger.error({
        err: exception, traceId, path: request.url, action: request.method
      }, 'unhandled exception')
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      traceId,  // 用于客户端追踪
      timestamp: new Date().toISOString()
    })
  }
}
```

---

## 9. 神机营落地规范

### 错误分类

| 错误类型 | HTTP 状态 | 业务码 | 客户端处理 |
|----------|----------|--------|-----------|
| TenantRequired | 400 | TENANT_REQUIRED | 弹窗重新登录 |
| OrderNotFound | 404 | ORDER_NOT_FOUND | 跳转到列表 |
| InsufficientStock | 422 | STOCK_INSUFFICIENT | 显示缺货提示 |
| PaymentTimeout | 408 | PAYMENT_TIMEOUT | 重新支付 |
| SystemError | 500 | INTERNAL_ERROR | 重试或联系客服 |

### 错误响应统一格式

```json
{
  "statusCode": 400,
  "code": "TENANT_REQUIRED",
  "message": "tenantId is required",
  "traceId": "abc123",
  "timestamp": "2026-06-27T22:30:00.000Z",
  "details": {} // 可选,补充信息
}
```

---

## 10. 关联反模式

- [async-try-catch-pattern.md](async-try-catch-pattern.md): 异步 try/catch
- [api-design.md](api-design.md): API 错误响应
- [observability.md](observability.md): 错误日志监控

---

> 🦞 **"错误处理不是事后补救 = 第一公民 = 直接决定生产稳定性"**
> **"好的错误处理 = 用户友好 + 内部详细 + 监控告警"**