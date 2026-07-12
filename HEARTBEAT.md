# 🦞 验收脉冲 HEARTBEAT

> 自动维护: 每30min脉冲触发
> 当前: 2026-07-13 00:01 (CST) · pulse#377 | 龙虾哥测试·第一段

---

## 系统状态快照

| 指标 | 值 | 趋势 |
|------|-----|------|
| TSC (apps模块) | ✅ **5/7 全绿** | api 4✖(TS1109/TS1003) + mobile 1✖(TS5098) |
| TSC (packages模块) | ✅ **4/4 全绿** | domain / sdk / types / ui 均通过 |
| 全量测试 @m5/tob-web | ❌ **1,581/1,585 (4 failures)** | customers反例+sports-ants空状态+跨模块+错误边界 |
| 全量测试 @m5/miniapp | ✅ **494/494 全绿** | 稳定 |
| 全量测试 @m5/app (第2轮) | ✅ **222/222 全绿** | 第1轮21✖(React Error Boundary) 第2轮成功 |
| 全量测试 @m5/domain | ✅ **95/95 全绿** | 稳定 |
| 全量测试 @m5/types | ✅ **41/41 全绿** | 稳定 |
| 全量测试 @m5/sdk | ✅ **19/19 全绿** | 稳定 |
| 全量测试 @m5/ui | ⚠️ **3,954/4,081 (127 cancelled)** | 通过率96.89% |
| 全量测试 @m5/admin-web | ⚠️ **707/874 (167 cancelled)** | 通过率80.89% |
| **总体** | **7,148/7,467 通过 (25 fail + 294 cancelled)** | ❌ **不健康** |
| 仓库提交数 | ~1099+ | 待提交 |
| 连续稳态 | 0🏆 (中断) | 累计5+脉冲P0残值 |

## 本轮全量回归发现

| 问题 | 严重度 | 说明 |
|------|--------|------|
| @m5/tob-web 4✖ test | 🔴 **P0** | customers-data缺常量定义 + sports-ants缺空状态/错误边界 + 跨模块空数据 |
| apps/api TSC 4✖ | 🔴 **P0** | `cashier.role-extended.test.ts` 第333行语法错误 |
| apps/mobile TSC 1✖ | 🟡 **P1** | tsconfig `customConditions` 与 `moduleResolution` 不兼容 |
| @m5/ui 127 cancelled | 🟡 **P1** | 疑似vitest池或超时，非失败 |
| @m5/admin-web 167 cancelled | 🟡 **P1** | 疑似vitest池或超时，非失败 |

## ⏱️ 本轮修复摘要 (pulse#377 全量回归扫描)

**仅测试、统计、报告 — 不写业务代码**

**测试健康度报告**: `reports/test-health-20260713.md`
**HEARTBEAT矩阵**: 已更新本表

**待修复清单（需人工干预）:**
- @m5/tob-web 4✖ — customers-data常量 + sports-ants空状态/错误边界
- apps/api TSC 4✖ — cashier.role-extended.test.ts 语法错误
- apps/mobile TSC — tsconfig.json `customConditions` 配置修复
