# 🌲 dispatch-372 · 缓存遮罩揭示—storefront-web 87✖

> 源于 force 跑分验证揭示 storefront-web 缓存遮罩
> 脉冲: pulse#378 · 2026-07-13 00:21
> **前置**: dispatch-371 原storefront目标218✖已过时(当前force揭示87✖)
> **状态**: 🔴 新派 — 87✖全部需修复

---

## 📋 故障详情

### @m5/storefront-web 87✖ (force验证)

| 分类 | 约计 | 典型失败 |
|------|------|---------|
| StocktakingPage 库存盘点 | ~20✖ | should have client component file, should export StocktakingPageClient, should contain expected data... |
| StoreManagerDashboard | ~8✖ | 应导入 StoreManagerDashboardClient, 应返回 JSX 组件 |
| point-history filter bar | ~2✖ | renders filter bar options, should have filter bar |
| cancelled 状态记录 | ~2✖ | cancelled 状态记录应有 completedAt |
| 模块导入稳定 | ~2✖ | useMemo/useState 正确使用, 模块导入稳定 |
| 其余 | ~55✖ | 等待完整列表 |

**根因分析**: 这些测试均因待实现页面/组件不存在而失败。P-35~P-40店A冲刺已完成6页面(3619行/133测试)，但storefront-web大量页面模板尚未实现。

---

## 🔥 修复约束

| 项目 | 优先级 | 存活脉冲数 | 修复要求 |
|------|--------|-----------|---------|
| StocktakingPage | 🔴 P0 | 0 | 库存盘点全模块骨架+测试 |
| StoreManagerDashboard | 🔴 P0 | 0 | 门店管理仪表板 |
| point-history filter | 🟡 P1 | 0 | filter bar组件 |
| cancelled 状态 | 🟡 P1 | 0 | completedAt字段 |
| 其余85✖ | 🔴 P0 | 0 | 全部逐一修复 |

**阈值规则**: 每30min脉冲验收 ❌ 连续2次→P0升级
