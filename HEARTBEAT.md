# 🦞 验收脉冲 HEARTBEAT

> 自动维护: 每30min脉冲触发
> 当前: 2026-07-13 00:21 (CST) · pulse#378 | 龙虾哥验收·第二段

---

## 系统状态快照

| 指标 | 值 | 趋势 |
|------|-----|------|
| TSC (apps模块) | ✅ **5/7 全绿(缓存)** | api 4✖(TS1109/TS1003) + mobile 1✖(TS5098) — 未force |
| TSC (packages模块) | ✅ **4/4 全绿** | domain / sdk / types / ui 均通过 |
| 全量测试 @m5/app (force✅) | ✅ **222/222 全绿** | 已验证零cache |
| 全量测试 @m5/tob-web (force✅) | ❌ **1,581/1,585 (4 failures)** | 同前: customers常量 + sports-ants空状态 + 跨模块 + news页面 |
| 全量测试 @m5/miniapp | ✅ **494/494 全绿** | 稳定(缓存) |
| 全量测试 @m5/mobile | ✅ **314/314 全绿(28 files)** | 稳定 |
| 全量测试 @m5/storefront-web (force⚠️) | ❌ **4,676/4,763 (87 failures)** | 🔴 **缓存遮罩揭示 — 新增87✖(原0✖→87✖)** |
| 全量测试 @m5/domain | ✅ **95/95 全绿** | 稳定 |
| 全量测试 @m5/types | ✅ **41/41 全绿** | 稳定 |
| 全量测试 @m5/sdk | ✅ **19/19 全绿** | 稳定 |
| 全量测试 @m5/ui | ⚠️ **3,954/4,081 (127 cancelled)** | 通过率96.89%(缓存) |
| 全量测试 @m5/admin-web | ⚠️ **707/874 (167 cancelled)** | 通过率80.89%(缓存) |
| **总体(force已知)** | **7,643/7,974 通过(91 fail + 294 cancelled)** | ❌ **不健康** |
| 仓库提交数 | ~1099+ | 待提交 |
| 连续稳态 | 0🏆 (中断) | 累计5+脉冲P0残值 |

## 本轮全量回归发现 (pulse#378)

| 问题 | 严重度 | 说明 |
|------|--------|------|
| **🔴 @m5/storefront-web 87✖** (NEW) | 🔴 **P0** | **缓存遮罩揭示**: 库存盘点(Stocktaking)全模块✖ + StoreManagerDashboard✖ + point-history filter bar✖ + cancelled状态✖ |
| @m5/tob-web 4✖ (chronic) | 🔴 **P0** | customers-data缺常量定义 + sports-ants缺空状态/错误边界 + 跨模块空数据 + news page |
| apps/api TSC 4✖ (chronic) | 🔴 **P0** | `cashier.role-extended.test.ts` 第333行语法错误 |
| apps/mobile TSC 1✖ (chronic) | 🟡 **P1** | tsconfig `customConditions` 与 `moduleResolution` 不兼容 |
| @m5/ui 127 cancelled | 🟡 **P1** | 疑似vitest池或超时，非失败 |
| @m5/admin-web 167 cancelled | 🟡 **P1** | 疑似vitest池或超时，非失败 |

## ⏱️ 本轮修复摘要 (pulse#378 全量回归扫描)

**关键发现**: 缓存遮罩导致 storefront-web 87✖未在前5个脉冲中被发现。dispatch-371原定目标已过时(原218✖→当前87✖)。需新派dispatch-372专修storefront。

**待修复清单:**
- **🔴 dispatch-372**: @m5/storefront-web 87✖ — StocktakingPage(库存盘点全模块~20✖) + StoreManagerDashboard(客户端组件~8✖) + point-history(~2✖) + cancelled状态(~2✖) + 其余~55✖
- @m5/tob-web 4✖ — customers-data常量 + sports-ants空状态/错误边界 (chronic)
- apps/api TSC 4✖ — cashier.role-extended.test.ts 语法错误 (chronic)
- apps/mobile TSC — tsconfig.json `customConditions` 配置修复 (chronic)

## 📊 闭环追踪

| 派单 | 目标 | 本轮状态 | 存活脉冲 |
|------|------|---------|---------|
| dispatch-371 | store218✖+tob4✖+appTSC+miniapp4✖ | 🔴 原storefront目标过时(218→87✖)，应归档 | 6+ |
| **dispatch-372**(新) | storefront 87✖ | 🆕 本脉冲派出 | 0 |
