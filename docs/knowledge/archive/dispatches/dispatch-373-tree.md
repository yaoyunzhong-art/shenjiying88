# 🌲 dispatch-373 · tob-web 4✖慢性残值(非api缓存揭示/持续)

> 源自 pulse#379 force验收揭示: storefront 87✖✅闭环·tob 4✖恒定
> 脉冲: pulse#379 · 2026-07-13 00:51
> **前置**: dispatch-371 中tob 4✖原定约束 (P1, 存活5+脉冲)
> **状态**: 🔴 新派 — 4✖慢性残值(force 1,581/1,585)

---

## 📋 故障详情

### @m5/tob-web 4✖ (force·1,581/1,585 pass / 4 fail)

| # | 测试 | 失败描述 | 优先级 |
|---|------|---------|--------|
| 1 | customers-data 常量 | 应定义 CUSTOMER_STATUSES / CUSTOMER_TIERS / CUSTOMER_INDUSTRIES | 🟡 P1 |
| 2 | 空状态"暂无数据" | 应展示 "暂无数据" 空状态（过滤无结果时） | 🟡 P1 |
| 3 | 错误/加载异常兜底 | 应包含页面错误/加载异常时的兜底处理 | 🟡 P1 |
| 4 | sports-ants news/[id] | app/sports-ants/news/[id]/page.test.ts 测试失败 | 🟡 P1 |

**根因分析**: 4个测试均属"反例"检验——数据常量未定义、空状态组件未实现、错误边界未覆盖、news详情页模板未完成。非功能性bug，属于测试先行(尚未实现功能)。

---

## 🔥 修复约束

| # | 项目 | 优先级 | 存活脉冲数 | 修复要求 |
|---|------|--------|-----------|---------|
| 1 | customers-data 常量 | 🟡 P1 | 0(新派) | `apps/tob-web/lib/constants.ts` 定义 CUSTOMER_STATUSES / CUSTOMER_TIERS / CUSTOMER_INDUSTRIES |
| 2 | 空状态组件 | 🟡 P1 | 0(新派) | 过滤无结果时渲染 `<EmptyState>` 含 "暂无数据" |
| 3 | 错误边界兜底 | 🟡 P1 | 0(新派) | 页面错误/加载异常时的ErrorBoundary/fallback |
| 4 | news/[id] page | 🟡 P1 | 0(新派) | `apps/tob-web/app/sports-ants/news/[id]/page.tsx` 骨架组件 |

**阈值规则**: 每30min脉冲验收 ❌ 持续3+脉冲→P0升级

---

## ⏱️ 行动项

| 角色 | 任务 | 文件 |
|------|------|------|
| 树哥1 | 补全 customers-data 常量 | `apps/tob-web/lib/constants.ts` — 5+条CUSTOMER_STATUSES、3+ tier、3+ industry |
| 树哥2 | 补空状态组件 | 过滤无结果返回空状态UI |
| 树哥3 | 补ErrorBoundary | 页面级错误兜底组件 |
| 树哥4 | news详情页骨架 | `apps/tob-web/app/sports-ants/news/[id]/page.tsx` |
