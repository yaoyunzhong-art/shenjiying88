# Day12 T6: OrderService 测试补充

**Date:** 2026-07-25
**Reporter:** 树哥 Trae (神机营后端)
**Audience:** 大飞哥

## 执行摘要

T6 是 T3 审查发现**最高风险项** — OrderService 完全缺测试。今天补充了完整 spec。

## 审计结果

```
apps/api/src/modules/cashier/order.service.ts         ← OrderService (无 spec)
apps/api/src/modules/cashier/order-state-machine.ts     ← 状态机 (已有 test)
apps/api/src/modules/inventory/purchase-order.service.spec.ts  ← 另一个 order 模块 (已有 spec)
```

确认：**cashier/OrderService 无任何测试文件**。

## 测试覆盖

写了 `apps/api/src/modules/cashier/order.service.spec.ts`，**50 个测试用例**，全通过。

### 测试分布

| 分类 | 用例数 | 覆盖内容 |
|------|--------|---------|
| 创建订单 | 13 | 正常创建、金额计算、行项存储、幂等键、跨租户幂等、参数校验、totalCents 负数防御、memberId/null/metadata、SSE created 事件 |
| 状态流转 | 12 | DRAFT→PENDING→PAID→FULFILLED→REFUNDED 全链路、部分退款累进、非法转移拦截（3 类）、markPaid 幂等（PAID/FULFILLED） |
| SSE 事件 | 7 | order.created/submitted/paid/fulfilled/canceled/refunded/partially_refunded、无 emitter 不抛错 |
| 乐观锁 | 3 | 版本匹配更新、版本冲突抛错、错误体含 current/provided 值 |
| 租户隔离 | 7 | 跨租户查询 null/空数组、submit/cancel/markPaid/fulfill 拒绝、不存在订单 NotFound |
| 列表查询 | 7 | 租户过滤、按 status/memberId 过滤、分页三页验证、日期范围过滤、空结果、排序 |
| 完整生命周期 | 1 | DRAFT→PENDING→PAID→FULFILLED→REFUNDED 完整 happy path |

### 关键场景覆盖

- ✅ **幂等键**: 同一 (tenantId, clientOrderId) 返回同一订单，跨租户允许同键
- ✅ **状态转移**: 拒绝 DRAFT→PAID、PENDING→FULFILLED、CANCELED→任意
- ✅ **乐观锁**: version 不匹配抛 `order_version_conflict` 含 current/provided
- ✅ **租户隔离**: 所有操作 (getById, getItems, submit, cancel, markPaid, fulfill, applyRefund) 跨租户均拒绝
- ✅ **金额防御**: totalCents < 0 抛错，整数分计算
- ✅ **SSE 全链路**: 7 类事件 + 无 emitter 防御
- ✅ **参数校验**: 空 tenantId/clientOrderId/items 抛 400
- ✅ **分页**: boundary 验证 (10+10+5)

## 验证

```
npx vitest run order.service.spec.ts  →  50/50 passed
npx tsc --noEmit                     →  clean (exit 0)
```

## 提交

```
git add -A && git commit -m "test(api): T6 OrderService spec"
```

## 风险缓解

- 🟢 **T3 高风险项已消除** — OrderService 从 0 测试 → 50 测试
- 🟡 **in-memory 实现** — 真实 Postgres 后需重写适配层测试
- 🟢 **原子性** — 订单号序列是模块级 integer，vitest `isolate: false` 配置兼容
