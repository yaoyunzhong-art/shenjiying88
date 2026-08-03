---
module: ai-rule-engine
date: 2026-07-24
status: 草稿
author: 树哥A
tags: [acceptance, ai-rule-engine, 圈梁五道箍]
---

# AI 规则引擎 — 验收文档

## 1. 验收范围

本验收涵盖 AI 规则引擎 (`apps/api/src/modules/ai-rule-engine/`) 的全部功能入口，包括：

- **单次评估（evaluate）**：成员等级评估、设备异常检测
- **批量评估（evaluate/batch）**：一次请求评估多个成员和设备
- **风险评分（evaluate/risk-score）**：成员/设备/门店综合风险评分
- **引擎管理（engines）**：引擎状态查询、详情查看、配置更新、重置
- **模拟器（simulators）**：单次模拟运行、批量模拟运行
- **多租户隔离**：通过 TenantGuard 实现 RLS

验收环境：staging · tenantId=tenant-a | tenantId=tenant-b

---

## 2. 测试用例清单

| # | 测试用例 | 类型 | 优先级 |
|---|---------|------|--------|
| TC-01 | 成员等级评估 — 高消费会员升级 | 功能测试 | P0 |
| TC-02 | 成员等级评估 — 低频访客维持等级 | 功能测试 | P0 |
| TC-03 | 设备异常检测 — CPU 超阈值触发告警 | 功能测试 | P0 |
| TC-04 | 设备异常检测 — 正常指标无告警 | 功能测试 | P0 |
| TC-05 | 批量评估 — 10 条混合请求分发 | 功能测试 | P1 |
| TC-06 | 风险评分 — 会员退款率异常 | 功能测试 | P0 |
| TC-07 | 引擎管理 — 获取全部引擎状态列表 | 功能测试 | P1 |
| TC-08 | 引擎配置更新 — 修改 matchStrategy | 功能测试 | P1 |
| TC-09 | 模拟器 — 单次模拟运行 | 功能测试 | P1 |
| TC-10 | 模拟器 — 批量 1000 轮模拟并统计 | 功能测试 | P0 |
| TC-11 | 引擎重置 — 恢复出厂配置 | 功能测试 | P2 |
| TC-12 | 多租户隔离 — tenant-a 数据不暴露给 tenant-b | 安全测试 | P0 |
| TC-13 | 无效评估类型 — 返回 400 BadRequest | 异常测试 | P2 |
| TC-14 | 引擎 ID 不存在 — 返回 404 | 异常测试 | P2 |
| TC-15 | 批量评估 — 部分失败返回 succeeded/failed 计数 | 异常测试 | P1 |

---

## 3. 通过标准

### 3.1 功能通过标准

| 条件 | 标准 |
|------|------|
| TC-01 ~ TC-10 全部通过 | ✅ 有条件的全通过 → PASS |
| TC-11 ~ TC-12 通过 | ✅ PASS |
| TC-13 ~ TC-15 错误处理 | ✅ 符合 NestJS 异常过滤器预期 → PASS |
| 所有 POST 接口 | ✅ 返回 HTTP 201 或 200，响应体符合 entity 接口定义 |

### 3.2 非功能通过标准

| 维度 | 标准 |
|------|------|
| 响应时间（单次评估） | ≤ 200ms |
| 响应时间（批量 10 条） | ≤ 500ms |
| 模拟器 1000 轮 | ≤ 3000ms |
| 多租户隔离 | 零泄露，通过自动化断言 |

### 3.3 自动化测试覆盖率

| 文件 | 是否通过 |
|------|---------|
| `ai-rule-engine.controller.test.ts` | ✅ |
| `ai-rule-engine.service.test.ts` | ✅ |
| `ai-rule-engine.dto.test.ts` | ✅ |
| `ai-rule-engine.entity.test.ts` | ✅ |
| `ai-rule-engine.module.test.ts` | ✅ |
| `ai-rule-engine.contract.test.ts` | ✅ |
| `ai-rule-engine.e2e.test.ts` | ✅ |
| `ai-rule-engine.stress.test.ts` | ✅ |
| `ai-rule-engine.simulator.test.ts` | ✅ |
| `rule-engine.test.ts` | ✅ |
| `ai-rule-engine.role.test.ts` | ✅ |
| `ai-rule-engine.role-v2.test.ts` | ✅ |
| `ai-rule-engine.role-v3.test.ts` | ✅ |
| `ai-rule-engine.role-v4.test.ts` | ✅ |
| `ai-rule-engine.role-v5.test.ts` | ✅ |
| `ai-rule-engine.role-v6.test.ts` | ✅ |
| `ai-rule-engine.role-extended.test.ts` | ✅ |
| `ai-rule-engine.diagnosis-v2.test.ts` | ✅ |
| `ai-rule-engine.ringbeam.test.ts` | ✅ |

---

## 4. 边界场景

### 4.1 成员等级评估边界

| 场景 | 预期行为 |
|------|---------|
| 消费金额 = 9999.99 (略低于 Gte 10000) | 不触发 high-spend 条件 |
| 消费金额 = 10000.00 (等于 Gte 值) | 触发 high-spend 条件 |
| 积分 = 0 | 仅靠消费和到访评估 |
| 所有字段均为 0 | 无规则匹配，返回最低等级 |
| memberId 为空字符串 | 引擎应正常评估，但审计需记录 |

### 4.2 设备异常检测边界

| 场景 | 预期行为 |
|------|---------|
| CPU > 90% 但错误率 = 0 | 可能仅 CPU 异常 |
| 所有指标极限值（CPU=100%, 延迟=MAX） | 多重条件触发 |
| 指标缺字段（uptimeHours 缺失） | 应视为 0 或跳过此规则 |
| 批量评估中部分设备异常 | only 异常项返回 anomalyType |

### 4.3 风险评分边界

| 场景 | 预期行为 |
|------|---------|
| refundCount = 0, 无异常记录 | 风险评分低 |
| refundCount = 30 但 activeDays = 2 | 退款占比畸高，高风险 |
| subjectType='store' 的设备异常偏高 | 门店级风险上升 |
| 所有指标全为空/0 | 返回最低风险等级 |

### 4.4 模拟器边界

| 场景 | 预期行为 |
|------|---------|
| rounds = 1 | 单轮，matchRate 应为 0 或 1 |
| rounds = 0 | 应返回错误或按默认值执行 |
| conditionOverrides 传递无效 conditionId | 忽略无效 override，不报错 |
| 批量模拟中 timeoutMs 超过引擎阈值 | 引擎限时打断 |

---

## 5. 验收结论记录

| 检查项 | 结果 | 备注 |
|--------|------|------|
| P0 用例全部通过 | ⬜ | 待执行 |
| P1 用例全部通过 | ⬜ | 待执行 |
| 多租户隔离确认 | ⬜ | 待执行 |
| 自动化测试全部绿色 | ⬜ | 待执行 |
| 边界场景覆盖 | ⬜ | 待执行 |
| 最终结论 | ⬜ | |
