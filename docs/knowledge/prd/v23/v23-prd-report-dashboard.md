# V23 PRD · WP-04C 报表与战略看板 (BS-0081 ~ BS-0082)

> **阶段**: P1 · WP-04C子阶段C  
> **BS引用**: [BS-0081, BS-0082]  
> **前置依赖**: WP-04A (财务核算主链)  
> **验收关联**: `docs/knowledge/acceptance/2026-07-23-wp-04c-acceptance.md`  
> **状态**: ⬜ 未开工 · 现状记录

---

## 1. 现状扫描总结

### 1.1 现有报表模块 (`apps/api/src/modules/reports/`)

| 维度 | 现状 |
|------|------|
| **内置报表** | 10个: revenue / inventory / member / refund / order / product-ranking / payment-mix / hourly-heatmap / channel-funnel / inventory-alert |
| **数据源** | 5个适配器: Order / Payment / Refund / Member / Inventory (全部内存模拟) |
| **核心服务** | Aggregation / Cache / Export / Query |
| **API路由** | 10个 GET 报表端点 + definitions CRUD + export + cache/invalidate |
| **测试** | 17+ 测试文件 ~260KB |
| **数据口径** | 每个报表独立生成，**无跨报表校验** |

### 1.2 现有分析模块

| 模块 | 定位 | 数据源 |
|------|------|--------|
| `analytics (v1)` | 运营快照 + 健康诊断 + 推荐 | LoyaltyService + MarketingMetricsService (内存) |
| `analytics-v2` | 事件采集 + CDC + Cohort/漏斗/留存/指标聚合 | 内存适配器 |
| `ai-insight` | 决策驾驶舱: KPI看板/异常检测/趋势预测/仪表盘 | 内存模拟种子数据 |
| `ai-sales-insight` | 销售KPI驾驶舱 | 内存模拟 |
| `health-dashboard` | 租户健康度仪表板 + Grafana导出 | HealthScoreService |
| `finance-report` | 财务P&L/资产负债表/现金流/对账报表 | FinanceService 收入摘要 |

### 1.3 报表口径一致性现状

| 检查项 | 是否存在 | 说明 |
|--------|----------|------|
| 跨报表数据校验 | ❌ 无 | 每个报表独立查询，无联动校验 |
| 报表与台账一致性 | ❌ 无 | 无 mechanism 确保 reports.revenue 与 finance.revenue.summary 一致 |
| 数据对账管道 | ⚠️ 部分 | finance/reconciliation 模块有支付渠道对账（内部vs外部），但与 reports 模块无关 |
| 数据质量报告 | ⚠️ 模拟 | ai-insight-advanced 有 DataQualityReport，基于随机数 |
| 口径元数据注册 | ❌ 无 | 无统一口径定义/版本管理 |

### 1.4 战略看板 / 管理驾驶舱现状

| 功能 | 状态 | 说明 |
|------|------|------|
| 统一战略看板 | ❌ 无 | 无可聚合 reports+analytics+finance 的统一入口 |
| 经营KPI看板 | ⚠️ 模拟 | ai-insight 提供完整KPI看版+异常+趋势+仪表盘，但全为模拟数据 |
| 管理驾驶舱 | ⚠️ 分散 | ai-insight自称"决策驾驶舱"，但未对接真实报表数据管道 |
| 品牌看板 | ⚠️ 基础 | brand-operations 有 BrandDashboardData，品牌维度 |
| 运营快照 | ✅ 可用 | analytics v1 提供运营快照/诊断/推荐 |
| 工作台导航 | ✅ 可用 | workbench 支持角色化导航，有 kpi-dashboard 等占位链接 |

---

## 2. BS-0081 报表口径一致性

### 2.1 必须项 (P0 on P1)

1. **口径元数据注册表**
   - 统一记录每个报表的: 数据源 → 聚合规则 → 口径版本 → 适用范围
   - 存放在 `reports/` 模块或共享的 `cross-module/` 服务中

2. **跨报表校验引擎** (核心缺失)
   - 例: `revenue-report.totalRevenue` === `sum(order-conversion.orderAmount) × avg.unitPrice`
   - 例: `refund-rate.totalRefundAmount ≤ revenue-report.totalRevenue`
   - 例: `payment-mix` 各渠道金额之和 === `revenue-report.totalRevenue`
   - 内部: `revenue-report.totalRevenue` 应约等于 `finance/revenue.summary.totalRevenue`

3. **台账核对**
   - 报表数据 vs 基础台账 (orders, payments, refunds tables) 的核对脚本
   - 比对差异报告 (diff report)

### 2.2 建议项 (P1 on P1)

4. **口径变更审批**
   - 口径修改需审批流程 (复用 governance-approval)
   - 口径变更自动触发校验回归

5. **口径版本追踪**
   - 提供历史口径回溯能力
   - 报表结果附带口径版本指纹

---

## 3. BS-0082 战略看板

### 3.1 必须项 (P0 on P1)

1. **统一战略看板 API**
   - 可选路径: 在 `ai-insight` 模块上增强（已有决策驾驶舱定位）
   - 或新建 `strategic-dashboard` 模块
   - 必须对接真实报表数据管道，**不再使用模拟数据**

2. **经营总览**
   - 营收/订单/会员/库存 四维概览
   - 同比/环比/目标达成率
   - 异常标记与预警

3. **看板卡片**
   - 营收卡片: 当日/本周/当月 营收 + 趋势
   - 订单卡片: 订单量 + 转化率 + 客单价
   - 会员卡片: 新增会员 + 活跃会员 + 留存率
   - 库存卡片: 库存周转率 + 预警数量

### 3.2 建议项 (P1 on P1)

4. **下钻能力**
   - 看板维度: 租户 → 品牌 → 门店
   - 时间维度: 年 → 月 → 周 → 日
   - 异常下钻: 点击预警可直接跳转详情

5. **自定义看板**
   - 可拖拽 Widget (ai-insight-advanced 已有 DashboardWidget 类型定义)
   - 订阅与推送

6. **多角色视图**
   - 复用 workbench 的角色-能力映射

---

## 4. 覆盖度矩阵

| 角色 | 当前覆盖 | GAP |
|------|----------|-----|
| **门店经理** | daily-report (占位) + workbench导航 | 无真实门店看板 |
| **品牌经理** | brand-operations dashboard (基础) | 无战略指标 |  
| **财务** | finance-report (P&L/资产负债表) + workbench | 报表口径无校验 |
| **管理层** | ai-insight (全模拟) | 无真实战略看板 |
| **运营** | analytics v1 snapshot + diagnostics | 无运营报表看板 |

---

## 5. 技术方案建议

### 方案 A: 在 ai-insight 上增强 (推荐)

```
ai-insight/
├── services/
│   ├── ai-insight.service.ts        ← 已有，增强真实数据通路
│   └── strategic-dashboard.service.ts  ← 新增：战略看板聚合
├── strategic/
│   ├── dashboard-aggregator.ts       ← 从 reports/finance/analytics 聚合
│   ├── cross-report-validator.ts     ← 校验引擎
│   └── metrics-registry.ts           ← 口径元数据
```

**理由**: ai-insight 已有 决策驾驶舱定位、KPI看板、异常检测、趋势预测接口，只需将内存模拟数据替换为真实报表管道。

### 方案 B: 新建 strategic-dashboard 模块

```
strategic-dashboard/
├── strategic-dashboard.module.ts
├── strategic-dashboard.controller.ts  ← /api/strategic-dashboard/*
├── strategic-dashboard.service.ts
├── dashboard-aggregator.ts
├── cross-report-validator.ts
└── metrics-registry.ts
```

**理由**: 职责更清晰，与 AI 洞察解耦。

---

## 6. 验收要点

1. ✅ 10个报表服务运行正常，路由可访问
2. ✅ 报表口径元数据注册表可用
3. ✅ 跨报表校验至少覆盖: revenue ≈ payment-sum, refund ≤ revenue, inventory-count ≥ alert-count
4. ✅ 台账核对脚本可用
5. ✅ 战略看板API返回真实聚合数据 (不再使用模拟)
6. ✅ 看板包含 营收/订单/会员/库存 四维
7. ✅ 看板支持同比/环比/目标达成率
8. ✅ 无 test.skip / only
9. ✅ TSC 零错误
10. ✅ 测试全绿

---

## 7. 风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| ai-insight 模拟数据替换工作量大 | 中 | 渐进式替换: 先替换营收/订单维 |
| 跨模块耦合 (reports↔finance↔analytics) | 高 | 通过 contract 合约层交互, 不直接依赖内部 |
| 口径一致性规则可能随业务频繁变化 | 中 | 口径元数据注册表分离配置与逻辑 |
