# analytics — 数据分析

> 门店运营数据分析看板，面向店长与总部运营角色，提供营收、客流、商品排行、时段分布、品类占比等核心指标。

## 核心职责

- **营收分析**: 本期/上期营收展示，同/环比增长率，支持趋势视图
- **客流分析**: 客流时段分布 (09-23 时区)，客单价、留存率、新客占比
- **商品销量排行**: Top N 热销商品销量、营收、增长率排行展示
- **品类占比**: 设备体验/零售/会员/餐饮/团建等多维度营收占比
- **多标签筛选**: 概览/趋势/对比/明细 4 类分析标签，URL searchParam 驱动 SSR

## 外部依赖

| 模块 | 用途 |
|------|------|
| `@m5/ui` | `Card`, `StatusBadge`, `Tabs`, `LoadingSkeleton`, `PageShell`, `ErrorBoundary` |
| `apps/admin-web/app/bootstrap` | 应用引导、租户上下文 |
| `apps/admin-web/app/analytics/analytics-client.tsx` | 客户端组件：营收看板、商品排行、时段分布等交互 |
| `apps/admin-web/app/analytics/analysis-tabs.tsx` | 分析分类标签组件 (概览/趋势/对比/明细) |
| `apps/admin-web/app/finance` | 财务数据来源 (营收、支出数据) |
| `apps/admin-web/app/alerts` | 异常指标告警联动 |

## 页面路由

| 路由 | 说明 |
|------|------|
| `/analytics?filter=overview` | 全局数据总览 — 营收、客流、留存率、最大品类卡片 |
| `/analytics?filter=trend` | 营收与客流趋势 — 时段分布、营收趋势图 |
| `/analytics?filter=compare` | 同比环比对比 — 客户画像、留存率、新客占比对比 |
| `/analytics?filter=detail` | 商品与品类明细 — 热销商品排行、品类营收占比明细 |

## TODO

- [ ] 接入真实后端 API (当前为 Mock `loadAnalytics`)
- [ ] 时间段选择器 (日/周/月/自定义) — 支持灵活时间聚合
- [ ] 图表可视化 (Chart.js / ECharts) — 营收曲线、柱状图、饼图
- [ ] 数据下钻 — 点击品类或商品跳转详细报表
- [ ] 对比分析 — 多门店/多品牌/多时段对比
- [ ] 导出报表 (PDF/Excel)
- [ ] 移动端适配 — 卡片排布在窄屏下优化
- [ ] 指标异常告警阈值配置
