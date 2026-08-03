# Webhook 模块 (Webhook)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块提供统一的第三方系统 Webhook 事件推送能力，支持异步事件广播与端点管理:

- **端点管理** — 注册、更新、删除、查询 Webhook 接收端点
- **事件订阅** — 按事件类型订阅，支持条件过滤
- **事件推送** — 签名鉴权、指数退避重试、投递日志追踪
- **平台适配** — 飞书/钉钉/企微/通用四种签名策略
- **事件总线** — 应用内事件广播机制，支持通配符监听
- **静态事件源** — 9 个内置预定义事件类型（许可证、金丝雀、监控、洞察、配置等）

边界约束:
- ❌ 不处理 HTTP 请求的鉴权（仅做签名验签，鉴权由 TenantGuard 统一处理）
- ❌ 不处理第三方平台的 OAuth 授权码交换
- ❌ 不持久化投递记录到数据库（当前为内存存储，生产需接持久层）
- ✅ 聚焦端点管理 → 事件匹配 → 签名推送 → 重试日志的完整闭环

═══════════════════════════════════════
箍二: 核心功能列表
═══════════════════════════════════════

| 功能 | 端点 | 描述 | 状态 |
|------|------|------|------|
| 注册端点 | `POST /webhook/endpoints` | 注册新的 Webhook 接收端（URL + Secret + 事件列表） | ✅ IMPLEMENTED |
| 获取端点列表 | `GET /webhook/endpoints` | 获取所有注册的 Webhook 端点 | ✅ IMPLEMENTED |
| 获取单端点 | `GET /webhook/endpoints/:id` | 按 ID 获取单个 Webhook 端点详情 | ✅ IMPLEMENTED |
| 更新端点 | `PATCH /webhook/endpoints/:id` | 更新端点的 URL/Secret/事件/激活状态 | ✅ IMPLEMENTED |
| 删除端点 | `DELETE /webhook/endpoints/:id` | 删除 Webhook 端点及其关联订阅 | ✅ IMPLEMENTED |
| 测试推送 | `POST /webhook/endpoints/:id/test` | 向端点发送测试事件 | ✅ IMPLEMENTED |
| 投递日志 | `GET /webhook/endpoints/:id/deliveries` | 查询指定端点的投递历史 | ✅ IMPLEMENTED |
| 事件列表 | `GET /webhook/events` | 获取内置支持的事件类型列表 | ✅ IMPLEMENTED |
| 内部事件发射 | `POST /webhook/internal/emit` | 应用内部广播事件到事件总线 | ✅ IMPLEMENTED |

### 内部服务能力

| 功能 | 方法 | 描述 |
|------|------|------|
| 订阅事件 | `subscribe()` | 为特定端点+事件类型建立订阅，支持条件过滤 |
| 退订事件 | `unsubscribe()` | 取消事件订阅 |
| 事件发射 | `emit()` | 匹配所有活跃订阅并异步投递 |
| 签名 | `signPayload()` | HMAC-SHA256 签名（统一通用策略） |
| 验签 | `verifySignature()` | 使用 timingSafeEqual 安全验证签名 |
| 重试投递 | `retryDelivery()` | 按 DeliveryLog ID 手动重试失败的投递 |

═══════════════════════════════════════
箍三: 架构说明 — 目录结构
═══════════════════════════════════════

```
apps/api/src/modules/webhook/
├── webhook.module.ts              — 全局 NestJS 模块定义, 导出 WebhookService
├── webhook.controller.ts          — REST 控制器 (9 端点)
├── webhook.service.ts             — 核心服务: 端点/订阅/投递/签名/重试
├── webhook.dto.ts                 — 请求/响应 DTO (Create/Update/Test)
├── webhook.entity.ts              — 实体类型定义: 端点/投递/状态/事件类型
├── webhook.contract.ts            — 跨模块合约类型适配器
├── webhook.platforms.ts           — 平台适配器: 飞书/钉钉/企微/通用
├── webhook.eventbus.ts            — 内存事件总线 (支持通配符 `*` 监听)
│
├── webhook.controller.test.ts     — 控制器单元测试
├── webhook.controller.spec.ts     — 控制器 spec
├── webhook.dto.test.ts            — DTO 校验测试
├── webhook.entity.test.ts         — 实体测试
├── webhook.contract.test.ts       — 合约测试
├── webhook.module.test.ts         — 模块测试
├── webhook.service.test.ts        — 服务层测试
├── webhook.service.spec.ts        — 服务层 spec
├── webhook.e2e.test.ts            — E2E 端到端测试
├── webhook.role.test.ts           — 角色权限测试
├── webhook.role-extended.test.ts  — 角色权限扩展测试
├── webhook.role-v3.test.ts        — 角色(v3)测试
├── webhook.ringbeam.test.ts       — RingBeam 集成测试
└── _debug.test.ts                 — 调试测试
```

═══════════════════════════════════════
箍四: 关键接口 / 数据结构
═══════════════════════════════════════

### REST 端点

| 方法 | 路由 | 认证 | 描述 |
|------|------|------|------|
| POST | `/webhook/endpoints` | TenantGuard | 注册新端点 |
| GET | `/webhook/endpoints` | TenantGuard | 端点列表 |
| GET | `/webhook/endpoints/:id` | TenantGuard | 端点详情 |
| PATCH | `/webhook/endpoints/:id` | TenantGuard | 更新端点 |
| DELETE | `/webhook/endpoints/:id` | TenantGuard | 删除端点 |
| POST | `/webhook/endpoints/:id/test` | TenantGuard | 测试推送 |
| GET | `/webhook/endpoints/:id/deliveries` | TenantGuard | 投递日志 |
| GET | `/webhook/events` | TenantGuard | 事件类型列表 |
| POST | `/webhook/internal/emit` | TenantGuard | 内部事件广播 |

### 内置事件类型

```typescript
// 9 个内置预定义事件：
type BuiltinEvent =
  | 'license.expired'            // 许可证到期
  | 'canary.created'             // 金丝雀发布创建
  | 'canary.promoted'            // 金丝雀发布升级
  | 'canary.rolled_back'         // 金丝雀发布回滚
  | 'canary.completed'           // 金丝雀发布完成
  | 'monitoring.alert.fired'     // 监控告警触发
  | 'monitoring.alert.resolved'  // 监控告警恢复
  | 'insight.generated'          // 洞察报告生成
  | 'tenant.config.updated'      // 租户配置更新

// 完整运行时事件类型:
type WebhookEventType =
  | 'order.created'
  | 'order.paid'
  | 'order.refunded'
  | 'points.earned'
  | 'points.redeemed'
  | 'points.adjusted'
  | 'coupon.issued'
  | 'coupon.used'
  | 'coupon.expired'
  | 'inventory.low'
  | 'inventory.out'
  | 'inventory.restock'
  | 'user.registered'
  | 'user.upgraded'
```

### 核心数据结构

```typescript
// Webhook 端点
interface WebhookEndpoint {
  id: string
  url: string
  secret: string
  events: WebhookEventType[]
  active: boolean
  retryPolicy: { maxRetries: number; backoffMs: number }
  createdAt: Date
}

// 事件订阅
interface WebhookSubscription {
  id: string
  endpointId: string
  event: WebhookEventType
  filters?: Record<string, string>
  active: boolean
}

// 投递日志
interface DeliveryLog {
  id: string
  subscriptionId: string
  event: WebhookEventType
  payload: Record<string, unknown>
  attempt: number
  status: 'pending' | 'success' | 'failed'
  responseCode?: number
  responseBody?: string
  error?: string
  createdAt: Date
  deliveredAt?: Date
}

// 事件总线负载
interface WebhookEventPayload {
  eventType: WebhookEventType
  eventId: string
  timestamp: string
  tenantId: string
  data: Record<string, unknown>
}
```

### 投递流程

```
emit(event, payload)
  ↓
WebhookService.emit()
  ├─ 查找所有匹配的活动订阅
  ├─ 应用订阅级条件过滤
  └─ deliverAsync() 异步投递（最多 5 次重试）
      ├─ signPayload() → HMAC-SHA256 签名
      ├─ POST → endpoint.url
      │   Headers: Content-Type, X-Webhook-Signature, X-Webhook-Event
      ├─ 200-299 → deliveredAt = now
      └─ 其他 → 指数退避重试 (1s → 2s → 4s → 8s → 16s → 32s)
```

═══════════════════════════════════════
箍五: 配置项
═══════════════════════════════════════

| 配置 | 默认值 | 说明 |
|------|--------|------|
| 默认重试策略 | maxRetries=5, backoffMs=1000 | 指数退避，最大间隔 64s |
| 每端点日志上限 | 1000 条 | 超过时从头部截断 |
| 签名算法 | HMAC-SHA256 (hex) | 通用端点的默认签名策略 |
| 平台适配器 | 4 种 | 飞书/钉钉/企微/通用 |

═══════════════════════════════════════
箍六: 依赖关系
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `agent/tenant.guard` | 多租户守卫, 所有端点使用 |
| 上游依赖 | `@Global()` 作用域 | 模块声明为全局，其他模块可直接注入 WebhookService |
| 内部依赖 | `webhookEventBus` | 单例事件总线，支持 `*` 通配符监听 |
| 内部依赖 | `WebhookService` | 端点/订阅/投递/签名核心逻辑 |
| 内部依赖 | `PlatformAdapter` | 飞书/钉钉/企微平台签名与消息格式化 |

═══════════════════════════════════════
箍七: 使用示例
═══════════════════════════════════════

### 注册 Webhook 端点

```bash
curl -X POST http://localhost:3000/api/webhook/endpoints \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{
    "url": "https://hooks.example.com/webhook",
    "secret": "my-secret-key",
    "events": ["order.paid", "order.refunded"]
  }'
```

### 获取端点列表

```bash
curl http://localhost:3000/api/webhook/endpoints \
  -H "x-tenant-id: tenant-demo"
```

### 获取内置事件类型

```bash
curl http://localhost:3000/api/webhook/events \
  -H "x-tenant-id: tenant-demo"
```

### 更新端点

```bash
curl -X PATCH http://localhost:3000/api/webhook/endpoints/<endpoint-id> \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{"active": false}'
```

### 测试推送事件

```bash
curl -X POST http://localhost:3000/api/webhook/endpoints/<endpoint-id>/test \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{
    "eventType": "order.paid",
    "customPayload": {"orderId": "ord-123", "amount": 99.99}
  }'
```

### 查看投递日志

```bash
curl "http://localhost:3000/api/webhook/endpoints/<endpoint-id>/deliveries?limit=10" \
  -H "x-tenant-id: tenant-demo"
```

### 代码中注入

```typescript
@Injectable()
export class SomeService {
  constructor(
    private readonly webhookService: WebhookService,
  ) {}

  async notifyOrderPaid(orderId: string) {
    // 触发事件推送（所有匹配的 Webhook 端点会收到通知）
    await this.webhookService.emit('order.paid', {
      orderId,
      paidAt: new Date().toISOString(),
      amount: 99.99,
    })
  }
}
```

### 事件总线订阅

```typescript
import { webhookEventBus } from './webhook.eventbus'

// 订阅特定事件
webhookEventBus.on('order.paid', async (payload) => {
  console.log('订单已支付:', payload)
})

// 订阅所有事件
webhookEventBus.on('*', (payload) => {
  console.log('收到事件:', payload.eventType)
})
```

### 运行测试

```bash
# Webhook 模块全量测试
npx jest apps/api/src/modules/webhook/webhook.controller.test.ts
npx jest apps/api/src/modules/webhook/webhook.service.test.ts
npx jest apps/api/src/modules/webhook/webhook.dto.test.ts
npx jest apps/api/src/modules/webhook/webhook.e2e.test.ts
npx jest apps/api/src/modules/webhook/webhook.module.test.ts
npx jest apps/api/src/modules/webhook/webhook.role.test.ts
npx jest apps/api/src/modules/webhook/webhook.ringbeam.test.ts
```
