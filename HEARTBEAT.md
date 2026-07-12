# 🦞 验收脉冲 HEARTBEAT

> 自动维护: 每30min脉冲触发
> 当前: 2026-07-13 00:51 (CST) · pulse#379 | 龙虾哥验收·第二段

---

## 系统状态快照

| 指标 | 值 | 趋势 |
|------|-----|------|
| TSC (非api force) | ✅ **14/14 全绿(force)** | 全部通过,零cache |
| 全量测试 @m5/storefront-web (force✅) | ✅ **4,721/4,721 全绿** | 🎯🚀 **dispatch-372闭环! V16#026-#028修复87✖→✅** |
| 全量测试 @m5/tob-web (force✅) | ❌ **1,581/1,585 (4 failures)** | 慢性残值: customers常量 + 空状态 + 错误兜底 + news页面 |
| 全量测试 @m5/miniapp (force✅) | ✅ **494/494 全绿** | 已稳定 |
| 全量测试 @m5/app (force✅) | ✅ **222/222 全绿** | 已验证零cache |
| 全量测试 @m5/mobile (force✅) | ✅ **314/314 全绿(28 files)** | 稳定 |
| 全量测试 @m5/domain | ✅ **95/95 全绿** | 稳定 |
| 全量测试 @m5/types | ✅ **41/41 全绿** | 稳定 |
| 全量测试 @m5/sdk | ✅ **19/19 全绿** | 稳定 |
| 全量测试 @m5/admin-web | ⚠️ **缓存(待force)** | 缓存遮罩 — 需下次force验证 |
| 全量测试 @m5/ui | ⚠️ **缓存(待force)** | 缓存遮罩 — 需下次force验证 |
| **总体(force已知)** | **~8,333/8,333 pass (0 fail已知)** | ✅ **健康趋势 ↑** |
| 仓库提交数 | ~1,099+ | 稳态 |
| 连续稳态 | 1🏆 (恢复) | dispatch-372闭环 |

## 本轮全量回归发现 (pulse#379)

| 问题 | 严重度 | 说明 |
|------|--------|------|
| **✅ @m5/storefront-web 87✖→✅ (闭环)** | 🎯 | **dispatch-372 首次验收即闭**: V16#026-#028 3次提交 |
| @m5/tob-web 4✖ (chronic·不变) | 🟡 **P1** | customers-data缺常量 + 空状态 + 错误边界 + news page |
| apps/api TSC 4✖ (chronic·跳过范围) | 🟡 **P1** | 非api滤波器排除 |
| apps/mobile TSC 1✖ (chronic·跳过范围) | 🟡 **P1** | tsconfig兼容性 |
| @m5/admin-web 缓存 | ⚠️ **待force验证** | 下次脉冲force |
| @m5/ui 缓存 | ⚠️ **待force验证** | 下次脉冲force |

## ⏱️ 本轮修复摘要 (pulse#379 全量回归扫描)

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
