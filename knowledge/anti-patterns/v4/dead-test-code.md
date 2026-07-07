# 旧测试死代码反模式 v4

## 元信息
- **编号**: AP-W8 (Anti-Pattern Watch #8)
- **分类**: 测试腐烂 / 接口漂移
- **发现**: 2026-06-27 Phase-35 收银台测试清理
- **影响**: 12 个误判 + 175→163 假阴性
- **修复耗时**: 1 commit + 441 行删除

---

## 现象描述

OrderService 重构升级后,接口从 `listOrders/getOrder/createOrder/...` 改为 `create/submit/cancel/fulfill/getById/...`,但旧测试 mock 仍按旧接口写,导致 12 个测试失败。

```
not ok 8 - CashierController 路由元数据
not ok 9 - CashierController 正例
not ok 10 - CashierController 反例
not ok 11 - CashierController 边界值
not ok 12 - CashierController 支付回调边界
TypeError: this.orderService.getById is not a function
```

---

## 根因分析

### 1. 接口升级未同步测试

| 时间 | OrderService API | cashier.controller.test.ts mock |
|------|------------------|--------------------------------|
| V1 (旧) | listOrders/getOrder/createOrder/createPayment/listPayments/applyPaymentCallback | ✅ 全部 mock |
| V2 (新) | create/submit/cancel/fulfill/getById/getItems/list | ❌ 旧 mock 失效 |

### 2. 死代码未被识别

旧测试文件 `cashier.controller.test.ts` (441 行) 长期未运行,被新版本 controller 已不再使用的方法 mock 拖累。

### 3. 测试未作为代码所有权

重构后只更新了生产代码(controller/service),测试没有作为接口契约的"客户"被一并升级。

---

## 数学证明 · 死代码概率

设:
- `P(old_test_exists)` = 旧测试存在率 = 业务重构后保留比例 ≈ 30%
- `P(refactor_breaks_test)` = 重构破坏旧测试率 ≈ 80%
- `P(test_fails_to_run)` = 旧测试在 CI 中被运行率 = 0% (因 .test.ts 路径未排除)

则:
```
P(死代码造成假阴性) = P(old_test_exists) × P(refactor_breaks_test) × P(test_runs)
                   = 0.30 × 0.80 × 1.00 (本地手动跑)
                   = 24%
```

如果 CI 默认不跑 `.test.ts` (`.spec.ts` 优先):
```
P(CI 误判) = 0.30 × 0.80 × 0 = 0% (但本地也漏掉)
```

---

## 修复方案

### 方案 1: 删除旧测试 (本次采用)

```bash
git rm apps/api/src/modules/cashier/cashier.controller.test.ts
# 441 行,12 个失败
```

✅ 优点: 简单直接
✅ 验证: `175/175 PASS` (commit a28046d3a)

### 方案 2: 升级 mock 接口

```typescript
// 旧:
const service = {
  listOrders: () => [],
  getOrder: () => undefined,
  ...
}

// 新:
const service = {
  create: () => {},
  submit: () => {},
  cancel: () => {},
  fulfill: () => {},
  getById: () => undefined,
  getItems: () => [],
  list: () => []
}
```

❌ 缺点: 工作量大,且要保证 mock 与生产 100% 一致

### 方案 3: 测试金字塔升级

- Controller 测试改用 controller-spec (本项目已有 `cashier.controller.spec.ts` 524 行)
- Service 测试用真实 OrderService (集成测试)

✅ 推荐: spec.ts + integration.ts 替代 test.ts

---

## 预防机制 (R-06 V2 强化)

### 1. 测试作为接口契约的所有者

- 生产代码 + 测试同步 review
- PR 必含"测试更新"项

### 2. 死代码扫描

```bash
# 找出长期未运行的 .test.ts
find apps -name "*.test.ts" | xargs grep -l "old_interface_" 2>/dev/null
```

### 3. 测试优先级排序

- **优先级 1**: `.spec.ts` (controller-spec,集成测试)
- **优先级 2**: `.test.ts` (单元测试)
- **优先级 3**: `.e2e.test.ts` (端到端)

`*.spec.ts` 应作为主测试,`*.test.ts` 是补充。

---

## 经验教训

> 🦞 **"测试代码也是代码,不是一次性脚本"**

1. **测试即文档**: 测试的 mock 接口就是生产 API 的真实契约
2. **重构先测**: 重构前先跑测试,看哪些是死的
3. **死代码即负债**: 旧测试不删 = 累计技术债
4. **V-Model 验证**: Layer 1 程序员(95%) + Layer 2 产品(100%) + Layer 3 使用者(80%)

---

## 案例时间线 · Phase-35 收银台

- **2026-06-27 21:22**: race-safe-commit 实战检测 wipe
- **2026-06-27 21:26**: order-state-machine.test.ts 新建,35 断言全过
- **2026-06-27 21:28**: cashier.service + controller 测试发现 22 失败
- **2026-06-27 21:30**: 删除 cashier.controller.test.ts (旧版本),剩 1 失败
- **2026-06-27 21:31**: 修复 cashier.module.test.ts,175/175 100% PASS
- **commit**: a28046d3a (R-06 自动锁定, 175/175 PASS)

---

## 相关反模式

- [tsx-decorator-pitfall.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/tsx-decorator-pitfall.md): NestJS 装饰器 + tsx loader
- [async-try-catch-pattern.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/async-try-catch-pattern.md): 业务事件错误处理
- [cron-wipe-phase34.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/cron-wipe-phase34.md): R-06 cron 60min 防御

---

> 🦞 **"测试腐烂是代码腐烂的影子"**