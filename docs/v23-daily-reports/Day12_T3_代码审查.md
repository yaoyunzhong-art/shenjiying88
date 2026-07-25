# V23 Day12 T3: 店A关键模块代码审查

**时间**: 2026-07-25 22:16  
**审查人**: 树哥 Trae  
**模块**: Cashier / Order

---

## 一、审计概览

| 模块 | 文件数（不含 spec） | TODO/FIXME 数 | 测试文件数 |
|------|-------------------|---------------|-----------|
| cashier | 70 | 4 | 24 |
| order（含 purchase-order/procurement-order） | 24 | 0 | 9 |

**TODO/FIXME 扫描结果**:
- `cashier-prisma-store.ts:9` — Prisma 表定义未完成，各方法待实现
- `payment.service.ts:26` — Phase-46 对接微信/支付宝
- `cashier-id.ts:17` — 文档注释含 XXX 示例（非缺陷）

---

## 二、深度审查文件

### 2.1 `order.service.ts`（225 行）

**评分**: ⚠️ B+

**优点**:
- ✅ 状态机驱动（`transitionOrder`）完全符合 DR-36 决策
- ✅ 幂等键设计清晰（`clientOrderId` + `tenantId`）
- ✅ 乐观锁更新（`updateWithVersion`）
- ✅ 跨租户隔离严格（`getById` / `getByIdInternal` 均校验 tenantId）
- ✅ SSE 事件总线集成（`CashierEventEmitter`），可选注入

**问题**:

| # | 严重度 | 行号 | 描述 | 修复 |
|---|--------|------|------|------|
| 1 | 🔴 高 | — | **缺少测试文件** — `order.service.spec.ts` 不存在。PaymentService 有 32+9=41 个测试，OrderService 无任何 vitest 测试。状态变更、幂等逻辑、退款计算等核心路径均无自动化覆盖。 | 如下方修复建议 |
| 2 | 🟡 中 | 28-37 | **模块级可变状态** — `orderSeq` / `orderItemSeq` 为模块级 let，多进程/集群场景下无并发安全，重启后序号归零导致 ID 重复。 | 建议改用 Prisma 自增或 UUID |
| 3 | 🟡 中 | 100 | **硬编码商品名** — `productName: \`(商品 ${it.productId})\`` 为占位文本，缺少真实商品名 JOIN | 接入 ProductService 查询 |
| 4 | 🟢 低 | 71-72 | `@Optional()` 注入 eventEmitter 但无事件发射失败的重试/缓冲机制 | 非紧急，可后续加 |

**修复建议（最高优先级）**:
为 `order.service.ts` 创建 `order.service.spec.ts`，至少覆盖以下场景:
- `create` — 正常创建/幂等/参数校验/总价为负
- `submit` — DRAFT→PENDING/非法状态转移
- `cancel` — 任意→CANCELED/终态拒绝
- `markPaid` — PENDING→PAID/幂等（已 PAID 再次调用）
- `fulfill` — PAID→FULFILLED
- `applyRefund` — 部分退款/全额退款状态跳转
- `updateWithVersion` — 版本冲突抛 400
- `getById` / `list` — 跨租户过滤

### 2.2 `payment.service.ts`（415 行）

**评分**: ✅ A-

**优点**:
- ✅ 完整的三层幂等设计（orderId+method 幂等、providerTxnId 唯一性、confirm 幂等）
- ✅ 支付渠道注册表抽象（`PaymentChannelRegistry` + 主备切换）
- ✅ 计费墙集成（`BillingWall` guard + recordUsage）
- ✅ 支付网关 mock 降级安全（`ENABLE_MOCK_PAYMENT_GATEWAY` + NODE_ENV 判断）
- ✅ 全面参数校验（tenantId、orderId、amountCents、order status）
- ✅ Query 作为 confirm 回调的兜底机制

**问题**:

| # | 严重度 | 行号 | 描述 | 修复 |
|---|--------|------|------|------|
| 1 | 🟢 低 | 171-174 | **死代码** — `order.tenantId !== opts.tenantId` 检查永远不可达，因为 `getById` 已返回 null | 保留作为防御编程 |
| 2 | 🟢 低 | 255 | `void prepay` — prepay 结果未返回给调用方，前端无法获取支付参数 | Phase-45 对接时需修复 |

**测试状态**: 41 个测试全部通过 ✅（4 个因 NestJS exception message 匹配问题修复后通过）

---

## 三、TypeScript 类型安全

- ✅ 状态机类型严格（`OrderStatus` / `PaymentStatus` 为 string union）
- ✅ `@m5/types` 共享类型包被正确引用
- ⚠️ `order.service.ts` 中 `paymentMethod: method as Order['paymentMethod']` 使用了类型断言（行 196），但上游 `method` 参数为 `string`，有类型安全问题
- ⚠️ `applyRefund` 参数 `refundAmountCents` 为 `number`，未做非负校验

---

## 四、错误处理评估

| 模块 | 输入校验 | 状态机守卫 | 租户隔离 | 幂等处理 | 评分 |
|------|---------|-----------|---------|---------|------|
| OrderService | ✅ 完整 | ✅ transitionOrder | ✅ getByIdInternal | ✅ clientOrderId | A |
| PaymentService | ✅ 完整 | ✅ transitionPayment | ✅ getById 过滤 | ✅ 三层幂等 | A |

---

## 五、测试覆盖率摘要

| 模块 | 文件 | 测试数 | 通过 | 缺失测试 |
|------|------|--------|------|----------|
| PaymentService | payment.service.spec.ts | 32 | 32 ✅ | — |
| PaymentService | payment.service.test.ts | 9 | 9 ✅ | — |
| OrderService | — | 0 | — | 🔴 **完全缺失** |
| OrderStateMachine | order-state-machine.test.ts | 待检查 | 待检查 | — |

---

## 六、修复记录

### 测试修复 (payment.service.spec.ts)
修复了 4 个因 NestJS `BadRequestException` 对象与 `toThrow(string)` 匹配方式不兼容的测试用例:
1. **cross-tenant access**: `toThrow('cross_tenant_payment_access')` → `toThrow(NotFoundException)` — 实际行为是 `getById` 返回 null 触发 NotFound
2. **order not PENDING**: `toThrow('order_not_pending')` → `toThrow(/order.*PENDING/i)` — message 为 "order must be PENDING to create payment"
3. **amount mismatch**: `toThrow('amount_mismatch')` → `toThrow(BadRequestException)` — 错误对象内 error code 不在 message 中
4. **callback mismatch**: `toThrow('payment_callback_mismatch')` → `toThrow(/already bound/)` — 同上

---

## 七、总结

| 维度 | OrderService | PaymentService |
|------|-------------|----------------|
| 代码质量 | B+ | A- |
| 类型安全 | B+ | A- |
| 错误处理 | A | A |
| 测试覆盖 | 🔴 D | A |
| 可扩展性 | B | A |

**核心问题**: OrderService 缺少单元测试，这是高优先级风险。

**建议下次迭代**: 
1. 为 OrderService 创建完整测试套件
2. 检查其他 cashier 子模块的测试覆盖（refund.service.ts、order-state-machine.ts 等）
3. 修复 `paymentMethod` 类型断言的安全隐患
