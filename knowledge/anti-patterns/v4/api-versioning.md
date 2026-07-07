# API 版本管理反模式 v4

## 元信息
- **编号**: AP-W16 (Anti-Pattern Watch #16)
- **分类**: API 治理 / 版本管理
- **发现**: 2026-06-27 Phase-44 开放 API 设计
- **影响**: 升级破坏 / 兼容性差 / 客户端混乱
- **修复耗时**: 持续治理

---

## 现象描述

SaaS 平台 API 演进常见问题:

1. **强制升级**: API 改了,客户端全部崩溃
2. **多版本并存**: v1/v2/v3 同时维护,负担重
3. **破坏性变更**: 无预警,导致生产事故
4. **废弃流程**: 通知客户端困难,旧调用永久存在

---

## 根因分析

### 1. 无版本策略

```typescript
// ❌ 反例: 无版本
@Controller('api/orders')
export class OrderController {
  @Get()
  list() { /* v1 实现 */ }
  
  // 改了之后所有客户端崩
  @Get()
  list() { /* v2 实现: 字段全改了 */ }
}
```

### 2. 路径版本 vs Header 版本

```typescript
// 方案 A: URL 路径版本
@Controller('api/v1/orders')     // v1
@Controller('api/v2/orders')     // v2
// ✅ 优点: 直观,易路由
// ❌ 缺点: 控制器重复

// 方案 B: Header 版本
@Get({ headers: { 'API-Version': '2' } })
// ✅ 优点: 同一控制器
// ❌ 缺点: 难调试,需中间件

// 方案 C (推荐): URI 路径 + 自动 redirect
@Controller('api/orders')
@Get('v2')
listV2() { /* v2 实现 */ }
```

---

## 修复方案 (Phase-44 实战)

### 1. URI 路径版本

```typescript
@Controller('api/v1/cashier')
export class CashierV1Controller {
  @Get('orders')
  list() { /* v1 实现 */ }
}

@Controller('api/v2/cashier')
export class CashierV2Controller {
  @Get('orders')
  list() { /* v2 实现 */ }
}
```

### 2. 向后兼容 (Additive 变更)

```typescript
// v1 字段: id, totalAmount
interface OrderV1 {
  id: string
  totalAmount: number
}

// v2 新增字段 (不删除 v1)
interface OrderV2 {
  id: string
  totalAmount: number
  totalCents: number           // v2 新增
  currency: string             // v2 新增
  version: 2                   // 标记版本
}
```

### 3. 废弃警告 (Deprecation Header)

```typescript
@Get('v1/orders')
@Header('Deprecation', 'true')
@Header('Sunset', '2026-12-31')  // 截止日期
@Header('Link', '</api/v2/orders>; rel="successor-version"')
listV1() {
  logger.warn('v1/orders called, will sunset 2026-12-31')
  return this.list()
}
```

### 4. 客户端强制升级

```typescript
// 中间件: 老版本请求 → 警告头
function deprecationWarning(req, res, next) {
  if (req.path.startsWith('/api/v1/')) {
    res.setHeader('Deprecation', 'true')
    res.setHeader('Sunset', '2026-12-31')
    metrics.increment('api.v1.requests')
  }
  next()
}
```

### 5. OpenAPI 多版本文档

```typescript
// 生成 v1 和 v2 两套文档
const v1Config = new DocumentBuilder().setVersion('1.0').build()
const v2Config = new DocumentBuilder().setVersion('2.0').build()

const v1Doc = SwaggerModule.createDocument(app, v1Config, {
  include: [CashierV1Module]
})
const v2Doc = SwaggerModule.createDocument(app, v2Config, {
  include: [CashierV2Module]
})

SwaggerModule.setup('api/docs/v1', app, v1Doc)
SwaggerModule.setup('api/docs/v2', app, v2Doc)
```

---

## 预防机制 (R-07 V2)

### 1. CHANGELOG 强制

```markdown
# API Changelog

## [2.0.0] - 2026-XX-XX (Breaking)
- POST /api/orders: `totalAmount` (number) → `totalCents` (integer)
- 移除 `GET /api/orders/legacy-search`
- 升级指南: /docs/migration/v1-to-v2

## [1.1.0] - 2026-XX-XX (Additive)
- POST /api/orders 新增 `currency` 字段
- GET /api/orders 新增 `?include=member` 参数
```

### 2. SemVer 规范

```
MAJOR.MINOR.PATCH

MAJOR: 破坏性变更 (必须主版本升级)
MINOR: 新增功能 (向后兼容)
PATCH: 修复 bug (向后兼容)
```

### 3. CI 检查 Breaking Change

```bash
# openapi-diff
npx oasdiff breaking api-v1.yaml api-v2.yaml
# 输出: Breaking changes detected!

# 阻断 merge if breaking change 未标记
```

### 4. SDK 强制版本

```typescript
// @m5/sdk 自动绑定 API 版本
const sdk = new SDK({
  apiKey: 'xxx',
  apiVersion: '2.0',  // 强制 v2
  fallbackVersion: '1.0'  // 兼容回退
})

// 调用时自动加版本头
sdk.orders.list()  // GET /api/v2/orders
```

---

## 经验教训

> 🦞 **"没有版本策略 = 永远不能改 API"**

1. **Additive > Breaking**: 默认加字段,不删字段
2. **Sunset 流程**: 通知 + 宽限期 + 强制升级
3. **OpenAPI 驱动**: schema 是契约
4. **SemVer 强制**: MAJOR 才允许 breaking
5. **客户端治理**: SDK 强制最新版本

---

## 相关反模式

- [api-design.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/api-design.md): API 设计
- [event-bus-design.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/event-bus-design.md): 事件版本

---

> 🦞 **"API 版本 = 产品契约"**