---
module: loyalty
date: 2026-07-24
status: 草稿
author: 树哥A
tags: [acceptance, loyalty, 圈梁五道箍]
---

# 会员忠诚度 (Loyalty) — 验收文档

## 1. 验收范围

本验收涵盖会员忠诚度模块 (`apps/api/src/modules/loyalty/`) 的全部功能入口，包括：

- **积分账本 (Points Ledger)**: 查询会员积分流水
- **优惠券管理 (Coupon Plans)**: 创建、查询、启停、发放优惠券计划
- **优惠券核销 (Coupon Redemption)**: 核销与释放记录查询
- **盲盒管理 (Blindbox Plans)**: 创建、查询、启停、概率披露、抽盒、核销
- **盲盒审计 (Blindbox Audit)**: 抽取记录查询、完整性校验、成员概览
- **订单结算 (Order Settlement)**: 订单积分/优惠券/盲盒结算记录查询
- **多租户隔离**: TenantGuard + 请求上下文

验收环境：staging · Redis 可用 · 多租户 tenant-a / tenant-b

---

## 2. 测试用例清单

| # | 测试用例 | 类型 | 优先级 |
|---|---------|------|--------|
| TC-01 | 创建优惠券计划 — 固定金额折扣，完整参数 | 功能测试 | P0 |
| TC-02 | 创建优惠券计划 — 百分比折扣，有效期内 | 功能测试 | P0 |
| TC-03 | 优惠券计划列表 — 创建后列表中包含 | 功能测试 | P0 |
| TC-04 | 获取优惠券计划详情 — 按 planId 查询 | 功能测试 | P1 |
| TC-05 | 启停优惠券计划 — Draft → Active → Paused 状态转换 | 功能测试 | P0 |
| TC-06 | 发放优惠券 — 从计划中向成员发放 | 功能测试 | P0 |
| TC-07 | 发放超额优惠券 — 超过 remainingQuota 返回失败 | 异常测试 | P1 |
| TC-08 | 创建盲盒计划 — 设置奖励池权重 | 功能测试 | P0 |
| TC-09 | 盲盒概率披露 — 查询计划概率分布 | 功能测试 | P0 |
| TC-10 | 盲盒抽取 — 会员抽盒，配额扣减 + 生成审计日志 | 功能测试 | P0 |
| TC-11 | 盲盒抽取 — 配额不足时拒绝抽取 | 异常测试 | P1 |
| TC-12 | 盲盒审计 — 抽取记录分页查询 | 功能测试 | P1 |
| TC-13 | 盲盒审计完整性 — 链式哈希校验 | 功能测试 | P1 |
| TC-14 | 盲盒保证箱机制 — caseSize=6 时 guaranteedTier 必出 | 功能测试 | P0 |
| TC-15 | 积分流水查询 — 成员积分增减明细 | 功能测试 | P1 |
| TC-16 | 优惠券核销记录 — 按租户查询 | 功能测试 | P1 |
| TC-17 | 结算记录 — 订单结算（积分 + 优惠券 + 盲盒） | 功能测试 | P1 |
| TC-18 | 多租户隔离 — tenant-a 的 plan/记录对 tenant-b 不可见 | 安全测试 | P0 |
| TC-19 | Redis 配额 LUA 脚本 — 原子扣减竞争安全 | 性能测试 | P0 |
| TC-20 | 盲盒成员概览 — 累计抽取次数/命中保底次数 | 功能测试 | P2 |

---

## 3. 通过标准

### 3.1 功能通过标准

| 条件 | 标准 |
|------|------|
| TC-01 ~ TC-10 全部通过 | ✅ PASS |
| TC-11 ~ TC-17 全部通过 | ✅ PASS |
| TC-18 多租户隔离 | ✅ 零泄露 |
| TC-19 Redis LUA 原子扣减 | ✅ 并发下无超卖 |
| TC-20 成员概览 | ✅ 数据与抽取记录一致 |

### 3.2 非功能通过标准

| 维度 | 标准 |
|------|------|
| 优惠券计划创建 | ≤ 100ms |
| 盲盒抽取（Redis 路径） | ≤ 200ms |
| 盲盒抽取（内存回退路径） | ≤ 100ms |
| 审计日志分页查询（100 条） | ≤ 200ms |
| 链式哈希完整性校验 | ≤ 500ms |
| 多租户隔离 | 零泄露，通过自动化断言确认 |

### 3.3 自动化测试

| 文件 | 通过状态 |
|------|---------|
| `loyalty.service.test.ts` | ✅ |
| `loyalty.controller.test.ts` | ✅ |
| `loyalty.dto.test.ts` | ✅ |
| `loyalty.entity.test.ts` | ✅ |
| `loyalty.module.test.ts` | ✅ |
| `loyalty.contract.test.ts` | ✅ |
| `loyalty.e2e.test.ts` | ✅ |
| `loyalty.role.test.ts` | ✅ |
| `loyalty.role-v2.test.ts` | ✅ |
| `loyalty.role-extended.test.ts` | ✅ |
| `loyalty.ringbeam.test.ts` | ✅ |
| `loyalty.simulator.test.ts` | ✅ |
| `loyalty.dto.plan.test.ts` | ✅ |
| `loyalty-plan.e2e.test.ts` | ✅ |
| `loyalty-quota-integration.e2e.test.ts` | ✅ |

---

## 4. 边界场景

### 4.1 优惠券管理边界

| 场景 | 预期行为 |
|------|---------|
| discountValue > 价格（固定金额） | 可减至 0，不允许负值 |
| percentage discountValue > 100 | 应做上限校验，返回 400 |
| minOrderAmount = 0 | 无门槛优惠券 |
| perMemberLimit = 0 | 不可发放，返回错误 |
| validUntil < 当前时间 | 创建时即过期，状态为 Expired |
| remainingQuota 为 0 时发放 | 返回配额不足错误 |

### 4.2 盲盒抽取边界

| 场景 | 预期行为 |
|------|---------|
| quantity > remainingQuota | 拒绝，返回配额不足 |
| quantity = 0 | 拒绝，或按 1 处理（需明确策略） |
| Redis 不可用（InMemory Fallback） | 自动回退到 IN_MEMORY_FALLBACK 模式 |
| LUA 脚本原子扣减 + Redis 故障 | Redis 扣减失败，回退到内存扣减 + 告警 |
| 连续抽取 N 次后保底箱触发 | guaranteeApplied 标记为 true |
| 盲盒计划 Expired 后请求抽取 | 返回计划不可用错误 |

### 4.3 审计完整性边界

| 场景 | 预期行为 |
|------|---------|
| 审计日志链完整 | valid=true，无 broken 标记 |
| 某条日志被篡改（hash 不匹配） | valid=false, reason 包含 brokenAuditLogId |
| 审计日志为空 | valid=true（无日志不必校验） |
| 分页 offset 超过总数 | 返回空 items |

### 4.4 结算边界

| 场景 | 预期行为 |
|------|---------|
| 同一 orderId 多次结算 | 返回已存在的 settlementId |
| 同时发放积分 + 优惠券 + 盲盒 | 三条关联但独立的记录 |
| 结算时优惠券已失效（过期） | 状态标记为 FAILED |

---

## 5. 验收结论记录

| 检查项 | 结果 | 备注 |
|--------|------|------|
| P0 用例全部通过 | ⬜ | 待执行 |
| P1 用例全部通过 | ⬜ | 待执行 |
| Redis LUA 原子性验证 | ⬜ | 待执行 |
| 多租户隔离确认 | ⬜ | 待执行 |
| 盲盒审计链完整性确认 | ⬜ | 待执行 |
| 自动化测试全部绿色 | ⬜ | 待执行 |
| 最终结论 | ⬜ | |
