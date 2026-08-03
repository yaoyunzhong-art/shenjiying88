# V23 交易主链去Mock方案

> 生成: 2026-07-23 09:30 · 🦞 龙虾哥
> 状态: 🟢 方案就绪 · 待大飞哥确认后由树哥集群执行

---

## 一、现状分析

### 当前链路依赖图

```
TransactionsService
  ├── CashierService        (new 真实实例, 但存储用内存 Map)
  │     ├── CashierOrder    (内存 Map)
  │     └── CashierPayment  (内存 Map)
  ├── LoyaltyService        (new 真实实例, 存储用内存 Map)
  ├── MemberService         (new 真实实例, 存储用内存 Map)
  ├── FinanceService        (Optional, 部分用内存)
  └── PrismaService         (Optional, LYT快照层面已接数据库)
```

### 哪些已经是真实的
- `TransactionsService` → `PrismaService`（lytOrderSnapshot / lytPaymentSnapshot 已走数据库 upsert/find）
- `CashierService` → 业务逻辑真实，**但存储层在内存**
- `LoyaltyService` → 业务逻辑真实，**但存储层在内存**
- `MemberService` → 业务逻辑真实，**但存储层在内存**
- `FinanceService` → 部分真实，部分内存

### 哪些是 Mock

**严格意义上的 mock（模拟外部支付网关）：**
- `apps/api/src/__mocks__/pg.ts` — 支付网关 mock
- `apps/api/src/__mocks__/tenant.guard.ts` — 租户守卫 mock

**内存存储（功能真实但无持久化）：**
- `CashierService`: orders Map + payments Map（最核心的交易数据在内存）
- `LoyaltyService`: settlements/pointsLedger/couponRedemptions/blindboxFulfillments 全在内存
- `MemberService`: members Map（注册数据在内存）
- `FinanceService`: ledgers（部分在内存）

### 影响范围

| 模块 | 影响 | 去Mock优先级 |
|:----|:----|:-----------:|
| **CashierService** | 交易核心订单+支付数据→无持久化 | **P0** |
| **LoyaltyService** | 积分/优惠券/盲盒→无持久化 | **P1** |
| **MemberService** | 会员注册→无持久化 | **P2** |
| **FinanceService** | 账务日志→部分持久化 | **P2** |
| **pg.ts mock** | 支付网关外部调用→模拟 | **P3 (需真实支付SDK接入)** |

---

## 二、去Mock策略

### 核心原则
1. **存储服务化** — 将内存 Map 抽离为独立的 `*Store` 接口 + Prisma 实现
2. **兼容测试** — 保留内存实现作为 test 时的 fallback，不破坏现有 2000+ 测试
3. **渐进式替换** — P0→P1→P2→P3 逐层推进，每层独立可验证
4. **圈梁四道箍** — 每层完成后跑 TSC + 测试 + 圈梁表更新 + PRD标记

### P0: CashierService → Prisma（今日执行）

**当前内存实现：**
```typescript
// cashier.service.ts
private readonly orders = new Map<string, CashierOrder>()
private readonly payments = new Map<string, CashierPayment[]>()
```

**改造方案：**
```typescript
// 新增 cashier-store.interface.ts
interface ICashierStore {
  saveOrder(order: CashierOrder): Promise<void>
  getOrder(orderId: string): Promise<CashierOrder | undefined>
  listOrders(tenantId: string): Promise<CashierOrder[]>
  savePayment(payment: CashierPayment): Promise<void>
  listPayments(tenantId: string): Promise<CashierPayment[]>
  // ... 其余方法
}

// cashier-memory-store.ts (保留为测试用)
class CashierMemoryStore implements ICashierStore { ... }

// cashier-prisma-store.ts (新生产实现)
class CashierPrismaStore implements ICashierStore { ... }
```

**CashierService 改造：构造函数改为接受 `ICashierStore`，生产注入 PrismaStore，测试注入 MemoryStore。**

### P1: LoyaltyService → Prisma

**改造范围较广**，涉及积分的4个子存储 + 优惠券 + 盲盒，建议在 P0 完成验收后启动。

---

## 三、今日执行计划

### 时间线

| 时段 | 执行 | 内容 |
|:----|:-----|:-----|
| 09:30~10:30 | 🐜 路A | P0 第一步: 创建 `cashier-store.interface.ts` + `CashierMemoryStore`（从 service 中抽离）+ `CashierPrismaStore` 骨架 |
| 10:30~11:00 | 🐜 路B | P0 第二步: CashierService 改造→接受 ICashierStore 构造函数参数 |
| 11:00~12:00 | 🦞 龙虾哥 | 📚 固定知识日采（不可移动） |
| 12:00~13:00 | 🍚 无人值守 | 心跳保底 |
| 13:00~14:00 | 🐜 路C | P0 第三步: CashierPrismaStore 完整 Prisma 读写实现 |
| 14:00~15:00 | 🧠 午会 | 固定（Gate2-4签署） |
| 15:00~16:00 | 🐜 路A/路B | P0 验收: 全部测试通过 + 圈梁表 + PRD 标记 |
| 16:00~17:00 | 🐜 路C | P1 启动: CashierPrismaStore 验收后→LoyaltyService 存储服务化 |
| 17:00~18:00 | 🐜 三路并行 | 边缘修复 + 保底续产 |
| 18:00~19:00 | 🍚 无人值守 | 休息 |
| 20:00~21:00 | 🧠 晚会 | 固定（6道门签署） |
| 22:00 | 📚 知识衰减+🌙 晚间收盘 | 固定cron |
| 23:00~ | 🌙 凌晨 | 自进化检查 + 凌晨脉冲 |

### 圈梁验证标准（每步完成后都要跑）

```
① TSC通过: pnpm turbo typecheck
② 测试通过: pnpm turbo test
③ 圈梁表更新: docs/knowledge/phase-to-module-mapping.md
④ PRD标记: docs/knowledge/prd-checklist.md
```

---

## 四、风险与缓解

| 风险 | 可能性 | 影响 | 缓解 |
|:----|:------:|:----:|:-----|
| PrismaStore 写测试时需数据库 | 高 | 阻塞 | 先跑内存Store测试通过→再跑PrismaStore集成测试 |
| CashierService 构造签名变化影响200+测试 | 中 | 大 | DI模式+Optional回退 |
| P0 验收失败→回滚影响全天 | 低 | 中 | 保留内存Store作为回退选项 |
| 知识日采打断开发节奏 | 高 | 中 | 固定窗口不可移动，日采前后分别启动 |

---

## 五、验收标准

### P0 验收（今天必须完成）
- [ ] `cashier-store.interface.ts` 文件存在，定义完整接口
- [ ] `CashierMemoryStore` 从 service 抽离，所有现有测试通过
- [ ] `CashierPrismaStore` 骨架创建（至少实现 saveOrder/getOrder）
- [ ] `CashierService` 构造函数接受 `ICashierStore`（Option+fallback 到 MemoryStore）
- [ ] TSC 全绿
- [ ] 所有测试 0 fail
- [ ] 圈梁表更新
- [ ] PRD 已标记

### P0 验证测试
- [ ] 用 MemoryStore 运行全部 cashier 测试: 0 fail
- [ ] 用 PrismaStore（mock prisma）运行 cashier 关键测试: 0 fail
- [ ] E2E 测试: transactions.e2e.test.ts 通过
