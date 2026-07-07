# 反模式库 v4 · test-pyramid (测试金字塔)

> **创建时间**: 2026-06-27 22:38 CST (1h 冲刺 Part 6)
> **分类**: 质量保障 · 测试策略
> **目标读者**: 全栈工程师 + QA

---

## 1. 测试金字塔 (Mike Cohn)

```
       /\
      /E2E\         <- 少量 (慢 + 脆)
     /------\
    /  集成  \      <- 中量 (中等速度)
   /----------\
  /   单元测试  \   <- 大量 (快 + 稳)
 /----------------\
```

### 三层比例推荐

| 层级 | 比例 | 速度 | 用途 |
|------|------|------|------|
| 单元测试 | 70% | < 1s/测试 | 函数/方法正确性 |
| 集成测试 | 20% | 1-10s/测试 | 模块协作 |
| E2E 测试 | 10% | 10-60s/测试 | 用户场景 |

---

## 2. ❌ 反模式 1: 反金字塔 (E2E 重)

```typescript
// BAD: 全是 E2E,没有单元测试
describe('Order E2E', () => {
  it('should create order', async () => {
    const response = await fetch('/api/orders', { method: 'POST', body: ... })
    expect(response.status).toBe(201)
    // ... 30s 一个测试
  })
  it('should list orders', async () => {
    // 又 30s
  })
  // ... 200 E2E 测试,跑完 100 分钟
})
```

**问题**:
- 慢: 全跑 100+ 分钟,CI 卡死
- 脆: 改 UI 一行,200 测试全 fail
- 难定位: 失败不知道哪一层错

### ✅ 最佳实践: 70/20/10 分布

```typescript
// GOOD: 单元测试为主 (70%)
describe('OrderService.create', () => {
  it('should throw on invalid amount', () => {
    expect(() => orderService.create({ amount: -1 }))
      .toThrow(BadRequestException)
  })
  it('should generate order number', () => {
    const order = orderService.create({ amount: 100, tenantId: 't1' })
    expect(order.orderNo).toMatch(/^ORD-\d{8}-\d{5}$/)
  })
  // 100 单元测试 < 5s
})

// 集成测试 (20%)
describe('OrderService + Prisma', () => {
  it('should persist order to DB', async () => {
    const order = await orderService.create({ ... })
    const fetched = await prisma.order.findUnique({ where: { id: order.id } })
    expect(fetched.amount).toBe(100)
  })
  // 20 集成测试 < 60s
})

// E2E 测试 (10%)
describe('Order API E2E', () => {
  it('should complete full flow', async () => {
    // login -> create -> pay -> fulfill -> refund
    // 10 E2E 测试 < 5min
  })
})
```

---

## 3. ❌ 反模式 2: 测试实现细节

```typescript
// BAD: 测了内部实现 (而不是行为)
describe('calculateDiscount', () => {
  it('should call private helper', () => {
    const spy = jest.spyOn(order, 'privateHelper')
    order.calculateDiscount(100)
    expect(spy).toHaveBeenCalled()  // 测了"调了什么",不是"做了什么"
  })
})
```

**问题**: 重构时测试全 fail (但行为没变)

### ✅ 最佳实践: 测行为 (Behavior-Driven)

```typescript
// GOOD: 测结果,不是实现
describe('calculateDiscount', () => {
  it('should apply 10% discount for orders over ¥1000', () => {
    expect(order.calculateDiscount(1500)).toBe(1350)  // 1500 * 0.9
  })

  it('should not apply discount for orders under ¥100', () => {
    expect(order.calculateDiscount(50)).toBe(50)
  })
})
```

---

## 4. ❌ 反模式 3: 没有 AAA 结构

```typescript
// BAD: 所有逻辑混在一起,难以阅读
it('should process order', async () => {
  const order = await orderService.create({ tenantId: 't1', amount: 100, items: [...] })
  expect(order).toBeDefined()
  expect(order.status).toBe('DRAFT')
  const paid = await orderService.markPaid(order.id)
  expect(paid.status).toBe('PAID')
  // 没有清晰的 setup/action/assert 分离
})
```

### ✅ 最佳实践: AAA + 单一职责

```typescript
// GOOD: Arrange / Act / Assert 三段式
it('should transition order from DRAFT to PAID', async () => {
  // Arrange (准备)
  const order = await orderService.create({ tenantId: 't1', amount: 100 })

  // Act (执行)
  const paid = await orderService.markPaid(order.id)

  // Assert (断言)
  expect(paid.status).toBe('PAID')
  expect(paid.paidAt).toBeDefined()
})
```

---

## 5. ❌ 反模式 4: Flaky 测试

```typescript
// BAD: 依赖时间/网络/并发
it('should expire order after 30 minutes', async () => {
  const order = await orderService.create({ tenantId: 't1' })
  await sleep(31 * 60 * 1000)  // 真等 31 分钟!
  expect(order.status).toBe('EXPIRED')
})
```

**问题**: CI 等 31 分钟,绝对 flake

### ✅ 最佳实践: 注入时钟

```typescript
// GOOD: 时钟可注入
interface Clock {
  now(): Date
}

class RealClock implements Clock {
  now() { return new Date() }
}

class FakeClock implements Clock {
  constructor(private current: Date) {}
  now() { return this.current }
  advance(ms: number) { this.current = new Date(this.current.getTime() + ms) }
}

it('should expire order after 30 minutes', () => {
  const clock = new FakeClock(new Date('2026-06-27T10:00:00Z'))
  const order = orderService.create({ tenantId: 't1', clock })

  clock.advance(31 * 60 * 1000)  // 瞬间推进 31 分钟

  expect(orderService.checkExpiry(order, clock)).toBe(true)
})
```

---

## 6. ❌ 反模式 5: 没有 Test Fixture 复用

```typescript
// BAD: 每个测试重复 setup
it('test 1', async () => {
  const tenant = await createTenant({ code: 't1', name: 'Tenant 1' })
  const user = await createUser({ tenantId: tenant.id, mobile: '138...' })
  const order = await createOrder({ tenantId: tenant.id, amount: 100, userId: user.id })
  // ... 50 行重复
})

it('test 2', async () => {
  // 又 50 行重复
})
```

### ✅ 最佳实践: Factory + Fixture

```typescript
// GOOD: Factory 函数 + beforeEach
const factory = {
  tenant: (overrides = {}) => ({
    code: 't1', name: 'Tenant 1', ...overrides
  }),
  user: (overrides = {}) => ({
    mobile: '13800001111', role: 'admin', ...overrides
  }),
  order: (overrides = {}) => ({
    amount: 100, status: 'DRAFT', ...overrides
  })
}

describe('OrderService', () => {
  let tenant, user

  beforeEach(async () => {
    tenant = await db.tenant.create({ data: factory.tenant() })
    user = await db.user.create({ data: factory.user({ tenantId: tenant.id }) })
  })

  it('should create order', async () => {
    const order = await orderService.create({
      tenantId: tenant.id,
      userId: user.id,
      ...factory.order()
    })
    expect(order.tenantId).toBe(tenant.id)
  })
})
```

---

## 7. ❌ 反模式 6: 100% 覆盖率迷信

```typescript
// BAD: 追求 100% 覆盖率,写无意义测试
it('should call logger.info', () => {
  const spy = jest.spyOn(logger, 'info')
  orderService.create({ ... })
  expect(spy).toHaveBeenCalled()  // 测了 log,没测逻辑
})

// getter/setter 也要测试
it('should get status', () => {
  const o = new Order('DRAFT')
  expect(o.status).toBe('DRAFT')  // 无意义测试
})
```

**问题**: 100% 覆盖率 ≠ 100% 质量

### ✅ 最佳实践: 关键路径 100%,其他 70%+

| 代码 | 覆盖率目标 | 原因 |
|------|-----------|------|
| 核心业务 (订单/支付) | 100% | 钱相关 |
| 状态机 | 100% | 边界多 |
| 工具函数 (lodash-style) | 70% | 简单 |
| 第三方 SDK 包装 | 50% | mock 难 |
| UI 组件 | 60% | 易碎 |

**关键指标**: 变更覆盖率 (Delta Coverage) > 80%

---

## 8. 神机营落地策略

### Phase-25~34: 单元测试 100% (Phase-35 175/175 验证)
- 单元/集成/E2E = 70/20/10
- 单次 CI 全跑: < 10 分钟
- Pulse-95: 7801 测试全绿

### 测试组织

```
apps/api/src/modules/cashier/
  order.service.ts
  order.service.test.ts          <- 单元 (同目录,*.test.ts)
  order.service.spec.ts          <- 集成 (*.spec.ts)
apps/api/test/
  e2e/
    cashier-e2e.test.ts         <- E2E
```

### package.json 脚本

```json
{
  "scripts": {
    "test:unit": "node --import tsx --test src/**/*.test.ts",
    "test:integration": "node --import tsx --test src/**/*.spec.ts",
    "test:e2e": "node --import tsx --test test/e2e/**/*.test.ts",
    "test": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:coverage": "c8 npm test"
  }
}
```

---

## 9. 实战检查清单

新代码提交前:

- [ ] 单元测试覆盖核心逻辑
- [ ] 集成测试覆盖关键交互
- [ ] E2E 测试覆盖用户路径
- [ ] 覆盖率: 核心 100%,其他 70%+
- [ ] 测试运行 < 10 分钟
- [ ] 没有 flaky 测试 (3 次连续运行通过)
- [ ] 没有依赖网络/时间/顺序
- [ ] AAA 结构清晰
- [ ] 测行为不测实现
- [ ] CI 自动运行 + 报告

---

## 10. 关联反模式

- [dead-test-code.md](dead-test-code.md): 删除旧测试
- [esm-cwd-tsx-loader.md](esm-cwd-tsx-loader.md): 测试加载
- [async-try-catch-pattern.md](async-try-catch-pattern.md): 异步测试

---

> 🦞 **"测试金字塔 = 70% 单元 + 20% 集成 + 10% E2E = 质量 + 速度平衡"**
> **"反金字塔 = 100% E2E = CI 噩梦"**