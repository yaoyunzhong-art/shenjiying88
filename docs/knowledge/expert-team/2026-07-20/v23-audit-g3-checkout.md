# V23 审计 · G3 收银+交易组
> 日期: 2026-07-20 · 评审专家: E13李收银 + E?? 
> 版本: V23 v1.2

## 总体评级
🟢 **通过**

## 评审意见

### 1️⃣ 50条E2E链全面通过，但"数量达标≠链路健康"

V23 达成 50 条 E2E 链全通过（从 V22 的 43→50），🧪E2E 箍在 V23 首日即得到满足。Cashier 模块有 1,333 个测试/27 source files，P-38 Finance 368 个测试全通过。这一数据表明**交易链路的自动化验收已具备基础**。

**但 G3 发现以下结构性风险：**

- **Mock→真实 API 切换不完整**：虽然 Cashier SDK 已完成去 Mock（`12d77daf0` commit），但 member lookup 仍使用 in-memory seed data（`7f3af9a85` commit）。这意味着 POS 流程中"会员身份识别"这个关键步骤在测试环境中不是真正的数据库查询——如果生产环境遇到数据库连接超时、索引失效或 cache miss，E2E 测试不会捕获到。
- **Finance 模块全内存**：ledger/account/settlement/invoice 全部使用 in-memory Map。P-38 的 368 个测试覆盖了业务逻辑，但**没有覆盖持久化层**——测试通过只能证明内存中的业务逻辑正确，不能证明数据库读写正确。
- **E2E 链未区分"关键链"和"非关键链"**：50 条链中哪些是收银核心链（POS→Cashier→PaymentGateway→Finance 闭环），哪些是辅助链（如 promotions list、member profile）？如果全部 50 条链同等权重，核心链的问题可能被非核心链的通过掩盖。

**建议**：将 50 条 E2E 链按重要性分级：

| 等级 | 定义 | 链数（建议） | 验收标准 |
|:----:|:-----|:-----------:|:---------|
| 🔴 关键 | 收银/支付/退款闭环 | 8-10条 | 100%通过·可自动回滚 |
| 🟡 重要 | 会员/优惠/库存联动 | 15-20条 | 100%通过·可延迟修复 |
| 🟢 常规 | 辅助功能链 | 20-25条 | 非阻塞 |

这样当 50 条链不能全部通过时，团队可以快速判断影响范围。

### 2️⃣ Checkout 闭环已验证，但"基建干扰交易链"的风险被低估

V23 roadmap 正确识别了"基建不影响收银可用性"（G3 评审意见）："基础建设不影响收银可用性"。但 G3 认为这个风险被严重低估了：

**基建的哪些操作会直接影响收银：**

| 基建操作 | 影响的交易能力 | 风险等级 |
|:---------|:--------------|:--------:|
| nginx 配置变更 → 重载失败 | API 入口 502/503 → 收银不可用 | 🔴 P0 |
| Docker compose 停服升级 | 整个 stack 重启 → 收银暂时中断 | 🔴 P0 |
| 数据库迁移（Prisma migrate） | 表锁/索引重建 → 查询延迟 | 🟡 P1 |
| CI 首次 push → 自动构建 | 构建占用资源 → 本地开发卡顿 | 🟡 P1 |
| SSL 证书变更 | HTTPS 握手失败 → API 不可达 | 🔴 P0 |

**V23 双轨制中，轨道A（基建60%）和轨道B（功能40%）在同一个代码库、同一个环境中执行。这意味着收银模块的正常开发可能会被基建操作打断。**

**缓解建议**：
- 基建变更在**独立容器/环境**验证后，再合入主线
- 关键的 nginx/Docker 变更安排在低峰时段（深夜/凌晨）
- 增加`docker-compose restart`后的自动 smoke test（至少 5 条核心 E2E 链）

### 3️⃣ 50→60 E2E 链目标 +10 条应聚焦收银边缘场景

V23 目标 E2E 链从 50→60（+10 条）。G3 评审认为当前 50 条链已覆盖主流程，新增的 10 条应该聚焦收银的边缘场景而非水平扩展：

**推荐的 +10 条链分布：**

| # | E2E 链 | 收银子场景 | 优先级 |
|:-:|:-------|:-----------|:------:|
| 1 | 支付超时→自动取消订单 | checkout timeout | P0 |
| 2 | 退款→库存回滚→会员积分恢复 | refund full rollback | P0 |
| 3 | 两笔订单同时支付→并发扣减 | checkout concurrency | P1 |
| 4 | Offline 模式→网络恢复→数据同步 | cashier offline sync | P1 |
| 5 | 多币种支付→汇率锁定→退款还原 | currency lock+refund | P1 |
| 6 | 支付失败→Retry→最终成功 | payment retry | P1 |
| 7 | 优惠券与满减叠加→Order total 计算 | campaign+checkout | P1 |
| 8 | 跨门店购买→物流分拆→运费计算 | multi-store checkout | P2 |
| 9 | 会员等级折扣+限时促销的优先级 | discount priority | P2 |
| 10 | 第三方 adapter 失败→fallback 处理 | gateway failover | P2 |

**G3 特别关注第1条和第3条**：支付超时处理和并发扣减是收银系统最容易被忽略的边角，也是生产事故最频发的两类 bug。

### 4️⃣ Cashier 模块代码完善但生产就绪度不足

Cashier 模块从代码维度看非常扎实：27 source files、1,333 tests、37 test files、3 种 tenant 隔离 helper 函数（`tenantSafeGet`/`tenantFilter`/`assertSameTenant`）。

**但 G3 梳理了 Cashier 上线前必须处理的 5 个问题：**

| # | 问题 | 文件 | 状态 | 风险 |
|:-:|:-----|:-----|:----:|:----:|
| 1 | Member lookup 是内存 seed data | `7f3af9a85` | ❌ | 生产不能使用 |
| 2 | Offline sync 无冲突检测 | `cashier-offline.service.ts` | ❌ | 离线数据同步冲突 |
| 3 | 交易流水号生成无去重逻辑 | payment flow | ⚠️ | 分布式环境下重复 |
| 4 | 支付超时处理不完整 | checkout flow | ⚠️ | 用户等待超时无反馈 |
| 5 | 退款操作无幂等性 | payment-gateway | ⚠️ | 多次退款风险 |

**这 5 个问题都不是架构问题，而是生产就绪度问题**——测试环境通过不代表生产环境可用。

## 关注点

### 🔴 Finance 模块从内存→DB 的迁移风险

P-38 Finance 作为一个 47 source files 的大模块，全部使用 in-memory Map 存储 ledger/account/settlement/invoice。一旦切到真实数据库：

- **Migration 风险**：内存中的数据不会自动迁移到数据库，存量数据（如果有）会丢失
- **Schema 设计**：需要补一套完整的 Prisma schema，测试需从 mock Prisma 切换到真实 Prisma Client
- **性能差异**：内存 Map 的 O(1) 查询 vs DB 的 SQL 查询延迟完全不同，API 响应时间可能翻倍

**G3 建议**：Finance 迁移应作为 V23 Phase 2 的 P0 任务，但不是"一次全部迁移"，而是分步：
1. 先迁移 ledger + account（无关联数据，独立表）
2. 再迁移 settlement + invoice（需要关联查询）
3. 最后迁移 reconciliation data（最复杂）

每一步完成 + 对应 E2E 测试通过 → 再进入下一步。

### 🟡 支付 Adapter 的 WeChat/Alipay 对接

当前 WeChat/Alipay adapter 使用 stub 注入开发 Secret。虽然 V22 的 Cashier SDK 去 Mock 完成了 POS/checkout/payment/refund 的 E2E 验证，但 adapter 层面仍然是假的：

- 没有真实的签名算法（WeChat 支付需要 MD5/HMAC 签名）
- 没有真实的回调处理（notify URL 和订单状态变更逻辑）
- 没有错误码映射（WeChat 的 return_code/result_code vs 系统内部状态）

**如果从 stub 切换到真实 adapter**，预计需要新增：
- 至少 3 个 service 文件（WeChat pay/query/refund）
- 签名工具类（MD5、HMAC-SHA256）
- 错误映射表（30+ 错误码）
- 测试环境沙箱切换逻辑

**建议**：将 WeChat/Alipay adapter 的真实化排入 V23 Phase 2 或 Phase 3。

### 🟢 E2E 链 50→60 目标合理，但需要基础设施支持

E2E 链从 43→50 是在没有 CI、没有 Docker、全本地开发完成的。50→60 需要：
- 新的 E2E 测试增加 Prisma 种子数据
- 测试可能依赖 Finance 的 DB 持久化（当前是内存，不易复用 seed data）
- 更复杂的场景（离线同步、并发支付）需要多实例测试环境

**随着 E2E 链复杂度上升**，本地 E2E 的运行时间也会增加。如果 60 条链需要 >15 分钟才能跑完，开发者的本地体验会显著下降。

**建议**：在 Phase 2 的 CI 搭建中，配置 GitHub Actions 的 `matrix.e2e` 并行执行 E2E 链（拆分到 4-6 个并行 job），将整体 E2E 验收时间控制在 5 分钟以内。

## 建议

### 1. 建立收银核心链「5 条生命线」——每日自动 smoke test

从 50 条 E2E 链中选出 5 条收银核心链，配置为一个独立的 `smoke-test` 脚本：

```bash
# e2e/smoke-test.sh — 收银5条生命线
# 1. POS 开单→商品扫码→价格计算→提交
# 2. 会员识别→积分抵扣→余额支付→成功
# 3. 支付失败→退款→订单→取消→库存恢复
# 4. 多商品→满减优惠→多种支付→拆分支付
# 5. Offline→断网创建订单→恢复→同步
```

在每次基建变更后（Dockerfile 修改、nginx 重载、数据库迁移）**自动触发**这条 smoke test。V23 时间预算表中的 16:00-17:00"验收：build+CI"阶段应对应运行这套 smoke test。

**预期成本**：5 条链约 2-3 分钟，加上 docker-compose restart 约 30 秒 → 3-4 分钟即可确认收银可用。

### 2. Cashier Offline Sync 的冲突检测机制

当前 `cashier-offline.service.ts` 有 2 个文件，但缺少冲突检测。在离线模式下：
- 用户 A 在门店 1 购买了最后一件商品
- 同时用户 B 在门店 2 也下单了同一件商品（网络离线，无法同步库存）
- 网络恢复后，同步阶段需要检测库存冲突

**实现方案**：
```typescript
// conflict-resolver.ts — 轻量级冲突检测
type ConflictResult = 
  | { type: 'RESOLVED' }  // 无冲突，直接同步
  | { type: 'OVER_LIMIT', itemId: string, available: number, requested: number } // 库存不足
  | { type: 'PRICE_CHANGED', itemId: string, oldPrice: number, newPrice: number } // 价格变化
  | { type: 'ORDER_CONFLICT', orderId: string, reason: string } // 订单冲突
```

**建议**：在 V23 Phase 2 的 E2E 链 50→60 中，优先实现 offline conflict detection（对应上面的 #4 链：Offline→断网创建订单→恢复→同步）。

### 3. PaymentGateway 错误映射表 + 重试策略

当前 E2E 链覆盖了"支付成功→退款成功"的理想路径。但生产场景中，支付失败是常态：

| 失败场景 | 当前处理 | 需要补充 |
|:---------|:--------:|:---------|
| WeChat 返回 SYSTEMERROR | ❌ 无处理 | 自动重试 3 次 + 指数退避 |
| 余额不足 | ❌ 无特殊处理 | 提示用户换支付方式 |
| 超时未支付 | ⚠️ 订单状态未知 | 订单→挂起 + 定时关闭 |
| 金额不一致 | ❌ 无对账 | 标记异常 + 人工审核 |
| 重复支付（同一订单两次扣款） | ❌ 无幂等 | 订单级别幂等 + 自动退款 |

**建议**：在 V23 Phase 2 的"real API 接入"子任务中，优先实现错误映射和幂等性。建议先定义一个 `PaymentResult` 接口，覆盖上述所有场景。

---

**G3 最终评级: 🟢 通过**

虽无条件通过，但 G3 提出以下**硬性要求**（Phase 1 内必须完成）：
1. Cashier member lookup 从 seed data 切换到真实 DB（P0）
2. 确定 5 条收银核心链 + smoke test 脚本
3. Finance 内存→DB 迁移的分步计划

以上 3 项如在 Phase 1 结束（7/26）仍未启动，G3 保留升级 G3 签注为🟡有条件通过的权利。

*🐜 G3 收银+交易组 · V23 审计 · 2026-07-20 23:10 CST*
