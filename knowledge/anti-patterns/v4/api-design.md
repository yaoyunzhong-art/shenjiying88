# API 设计反模式 v4

## 元信息
- **编号**: AP-W13 (Anti-Pattern Watch #13)
- **分类**: API / REST / NestJS
- **发现**: 2026-06-27 Phase-35/36 controller 设计 review
- **影响**: 接口不一致 / 难调试 / 难维护
- **修复耗时**: 24 文件 controller review

---

## 现象描述

SaaS 平台 API 设计常见问题:

1. **路径不一致**: `/api/cashier/orders` vs `/api/orders/cashier`
2. **动词命名**: `/api/createOrder` vs `POST /api/orders`
3. **租户隔离混乱**: 部分接口强校验,部分接口弱校验
4. **错误响应不统一**: 各模块 error code 格式不同
5. **缺少分页/排序约定**: list 接口参数不一致

---

## 根因分析

### 1. 无全局规范

- ❌ 没有 API design guideline 文档
- ❌ Controller 自由发挥
- ❌ Code review 未检查一致性

### 2. REST 原则违反

```typescript
// ❌ 反例: 动词路径
@Controller('api')
export class OrderController {
  @Post('createOrder')    // 错: 应该是 POST /api/orders
  @Post('deleteOrder')    // 错: 应该是 DELETE /api/orders/:id
  @Post('updateOrder')    // 错: 应该是 PATCH /api/orders/:id
}

// ✅ 正例: 资源命名
@Controller('api/orders')
export class OrderController {
  @Post()                // POST /api/orders
  @Get(':id')            // GET /api/orders/:id
  @Patch(':id')          // PATCH /api/orders/:id
  @Delete(':id')         // DELETE /api/orders/:id
}
```

### 3. 租户隔离不一致

```typescript
// ❌ 反例 A: 无隔离
@Get('all')
all() { return this.service.findAll() }

// ❌ 反例 B: 弱隔离 (应用层判断)
@Get(':id')
getById(@Param('id') id: string) {
  const order = this.service.findById(id)
  if (order.tenantId !== this.tenantId) throw new ForbiddenException()
}

// ✅ 正例: 强隔离 (service 层强制)
@Get(':id')
getById(@Param('id') id: string) {
  return this.service.getById(id, this.tenantId)  // 服务层返回 null if 跨租户
}
```

### 4. 错误响应不统一

```typescript
// ❌ 反例 A
throw new HttpException('order not found', 404)
// 响应: { "message": "order not found", "statusCode": 404 }

// ❌ 反例 B
return { error: 'order_not_found', code: 'NOT_FOUND' }
// 响应: { "error": "order_not_found", "code": "NOT_FOUND" }

// ✅ 正例: NestJS 标准 + 错误码
throw new NotFoundException({
  error: 'order_not_found',     // 错误码 (snake_case)
  message: 'Order does not exist',
  details: { orderId: id }
})
// 响应: { "error": "order_not_found", "message": "...", "details": {...}, "statusCode": 404 }
```

---

## 数学证明 · API 一致性价值

设:
- `N` = 接口数量
- `P(不一致)` = 接口不一致概率
- `T_debug` = 单个不一致 debug 时间

总调试成本:
```
T_total = N × P(不一致) × T_debug
```

若 N=100, P=0.2, T=30min:
```
T_total = 100 × 0.2 × 30 = 600 min = 10 小时
```

如果统一规范降低 P=0.05:
```
T_total = 100 × 0.05 × 30 = 150 min = 2.5 小时
```

节省 7.5 小时/迭代。

---

## 修复方案 (Phase-35/36 实战)

### 1. 路径规范

```
GET    /api/{module}              列表
POST   /api/{module}              创建
GET    /api/{module}/:id          详情
PATCH  /api/{module}/:id          更新
DELETE /api/{module}/:id          删除
GET    /api/{module}/:id/{sub}    子资源
POST   /api/{module}/:id/{action} 动作 (cancel/refund)
```

### 2. 强租户隔离 (Service 层)

```typescript
// ✅ service 强制 tenantId
@Injectable()
export class OrderService {
  getById(id: string, tenantId: string): Order | null {
    const order = this.orders.get(id)
    if (!order) return null
    if (order.tenantId !== tenantId) return null  // 跨租户返回 null
    return order
  }
  
  private getByIdInternal(id: string, tenantId: string): Order {
    const order = this.orders.get(id)
    if (!order) throw new NotFoundException(`order ${id} not found`)
    if (order.tenantId !== tenantId) {
      throw new BadRequestException({
        error: 'cross_tenant_order_access',
        message: 'order belongs to a different tenant'
      })
    }
    return order
  }
}
```

### 3. 统一错误响应

```typescript
// apps/api/src/common/error-response.ts
export interface ErrorResponse {
  error: string                 // 错误码 (snake_case)
  message: string
  details?: Record<string, unknown>
  statusCode: number
  timestamp: string
  requestId?: string
}

// 错误码规范
const ERROR_CODES = {
  ORDER_NOT_FOUND: 'order_not_found',
  CROSS_TENANT_ACCESS: 'cross_tenant_order_access',
  INVALID_STATE_TRANSITION: 'invalid_order_state_transition',
  VERSION_CONFLICT: 'order_version_conflict',
  IDEMPOTENT_REPLAY: 'idempotent_replay',
  UNAUTHORIZED: 'unauthorized',
  RATE_LIMITED: 'rate_limited'
} as const
```

### 4. 分页/排序约定

```typescript
// ✅ 统一 list 接口
interface ListQuery {
  page?: number          // 默认 1
  pageSize?: number      // 默认 20, 最大 100
  sortBy?: string        // 字段名
  sortOrder?: 'asc' | 'desc'  // 默认 desc
  filter?: Record<string, unknown>
}

interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

### 5. SSE 端点

```
GET /api/{module}/events              全资源流
GET /api/{module}/:id/events          单资源流
GET /api/{module}/events?lastEventId=xxx   重连
```

---

## 预防机制 (R-07 V2)

### 1. API Design Guideline 文档

```markdown
# 神机营 API 设计规范 v1.0

## 路径
- 资源名:复数 (orders, members)
- 嵌套:< 3 层
- 动词:仅用于动作 (cancel/refund)

## HTTP 方法
- GET:查询
- POST:创建
- PATCH:部分更新
- PUT:完整替换 (避免)
- DELETE:删除

## 错误响应
- 4xx:客户端错误
- 5xx:服务端错误
- error 字段:snake_case 错误码

## 租户隔离
- 所有 service 方法必带 tenantId 参数
- controller 层从 JWT 提取 tenantId
```

### 2. NestJS Decorator 强制

```typescript
// @UseGuards(TenantGuard) 装饰在 controller 顶部
@Controller('api/orders')
@UseGuards(TenantGuard)
export class OrderController {
  // 所有方法自动校验 tenantId
}
```

### 3. OpenAPI 自动生成

```typescript
// apps/api/src/main.ts
const config = new DocumentBuilder()
  .setTitle('神机营 API')
  .setVersion('4.0')
  .addBearerAuth()
  .build()
const document = SwaggerModule.createDocument(app, config)
SwaggerModule.setup('api/docs', app, document)
```

### 4. E2E 测试覆盖

```typescript
test('list 接口分页约定', async () => {
  const res = await request(app).get('/api/orders?page=2&pageSize=10')
  expect(res.body).toMatchObject({
    items: expect.any(Array),
    total: expect.any(Number),
    page: 2,
    pageSize: 10,
    totalPages: expect.any(Number)
  })
})
```

---

## 经验教训

> 🦞 **"API 是 SaaS 的脸面,不一致 = 不专业"**

1. **资源路径优先**: 名词复数,避免动词
2. **强租户隔离**: Service 层强制,不依赖 controller
3. **错误码统一**: snake_case 字符串,避免数字
4. **分页约定**: page + pageSize + total
5. **OpenAPI 文档**: 自动生成,无需手写

---

## 相关反模式

- [tsx-decorator-pitfall.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/tsx-decorator-pitfall.md): NestJS 装饰器
- [concurrency-safety.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/concurrency-safety.md): 并发 API

---

> 🦞 **"好的 API 是 SaaS 的招牌"**