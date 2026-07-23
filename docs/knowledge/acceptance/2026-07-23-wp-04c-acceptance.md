# WP-04C 报表与战略看板 · 验收卡

> **日期**: 2026-07-23  
> **阶段**: P1 · WP-04C  
> **工作包**: 报表口径一致性 (BS-0081) + 战略看板 (BS-0082)  
> **前置依赖**: WP-04A (财务核算主链)  
> **当前状态**: ⬜ 未开工 · 基线记录  
> **Blockers**: 无

---

## 1. 基线确认 (现状记录)

### 1.1 报表模块现有成果

| 检查项 | 结果 | 备注 |
|--------|------|------|
| 10个内置报表 | ✅ 存在 | revenue/inventory/member/refund/order/product-ranking/payment-mix/hourly-heatmap/channel-funnel/inventory-alert |
| 5个数据源适配器 | ✅ 存在 | Order/Payment/Refund/Member/Inventory |
| 4个核心服务 | ✅ 存在 | Aggregation/Cache/Export/Query |
| REST API | ✅ 可用 | 10个报表端点 + definitions CRUD + export + cache |
| 测试覆盖 | ✅ 17+ | unit + e2e + contract + ringbeam |

### 1.2 跨报表校验

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 跨报表数据校验 | ❌ 缺失 | 无校验引擎 |
| 口径定义元数据 | ❌ 缺失 | 无注册表 |
| 台账核对 | ❌ 缺失 | 无核对脚本 |
| 口径变更审批 | ❌ 缺失 | 未集成 governance-approval |
| 口径版本追踪 | ❌ 缺失 | 无版本指纹 |

### 1.3 战略看板

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 决策驾驶舱 (ai-insight) | ⚠️ 存在但模拟 | 接口结构完整，全模拟数据 |
| 统一战略看板 API | ❌ 缺失 | 无真实聚合入口 |
| 经营总览 (营收/订单/会员/库存) | ❌ 缺失 | 四维聚合不可用 |
| 同比/环比/目标达成率 | ⚠️ 模拟 | ai-insight 有但为随机数 |
| 下钻能力 | ❌ 缺失 | 无维度下钻 |
| 自定义看板 Widget | ⚠️ 类型定义存在 | DashboardWidget 类型已定义但未实现 |
| 多角色视图 | ⚠️ 基础 | workbench 角色导航可用 |

---

## 2. 当前缺口清单

### Priority 0 (必须项 — 构成最小可验收包)

| # | 项目 | BS | 关联模块 |
|---|------|----|----------|
| GAP-01 | **跨报表校验引擎** — 验证 revenue = f(order, payment) 等关联一致性 | BS-0081 | reports |
| GAP-02 | **口径元数据注册表** — 统一管理报表口径定义、版本、数据源映射 | BS-0081 | reports/cross-module |
| GAP-03 | **台账核对** — 报表与基础表 (orders/payments/refunds) 的差异核对 | BS-0081 | reports/finance |
| GAP-04 | **统一战略看板 API** — 在 ai-insight 上增强或新建模块，对接真实数据 | BS-0082 | ai-insight / strategic-dashboard |
| GAP-05 | **经营总览四维** — 营收/订单/会员/库存 概览卡片 | BS-0082 | ai-insight / strategic-dashboard |

### Priority 1 (建议项)

| # | 项目 | BS |
|---|------|----|
| GAP-06 | 口径变更审批 (复用 governance-approval) | BS-0081 |
| GAP-07 | 口径版本历史回溯 | BS-0081 |
| GAP-08 | 同比/环比/目标达成率 | BS-0082 |
| GAP-09 | 维度下钻 (租户→品牌→门店, 年→月→周→日) | BS-0082 |
| GAP-10 | 自定义看板 Widget (拖拽) | BS-0082 |

---

## 3. 四要素检查

### 3.1 代码
- [ ] GAP-01: `cross-report-validator.ts` — 校验规则注册与执行
- [ ] GAP-02: `metrics-registry.ts` — 口径元数据存储/查询/版本管理
- [ ] GAP-03: `ledger-consistency-check.ts` — 报表⇄台账核对
- [ ] GAP-04: `strategic-dashboard.service.ts` — 看板核心编排
- [ ] GAP-05: 看板卡片轮询控制器
- [ ] 现有代码零破坏

### 3.2 配置
- [ ] NestJS Module 注册
- [ ] 校验规则配置文件或注册表
- [ ] 不破坏现有 `reports/` / `ai-insight/` / `finance/` 配置

### 3.3 证据
- [ ] 10个报表路由可用
- [ ] 校验引擎对: revenue ≈ payment-sum
- [ ] 校验引擎对: refund ≤ revenue
- [ ] 台账核对返回差异报告
- [ ] 看板API返回真实聚合数据
- [ ] 四维卡片数据正确
- [ ] 测试覆盖 ≥ 80%
- [ ] TSC 零错误

### 3.4 回滚
- [ ] 提交按功能拆分，可逐个 revert
- [ ] 配置变更 backward compatible
- [ ] 现有路由 / 接口不变

---

## 4. 圈梁/合规检查

| 检查项 | 要求 |
|--------|------|
| test.skip/only | ❌ 禁止 |
| TSC 错误 | 零 |
| 禁止重写已有功能 | 仅增强, 不改现有报表服务内部逻辑 |
| 四要素齐全 | 代码 + 配置 + 证据 + 回滚 |
| 前缀 | `feat(report): WP-04C 报表与战略看板` |

---

## 5. 验收人签章

| 角色 | 签字 | 日期 |
|------|------|------|
| 开发完成 | ⬜ | |
| Code Review | ⬜ | |
| 测试验证 | ⬜ | |
| 产品确认 | ⬜ | |

---

## Appendix A: 现状扫描证据路径

```
apps/api/src/modules/reports/
├── report.service.ts           — 报表查询编排 (route to 10 sub-services)
├── report.controller.ts        — 19个端点 (10报表 + definitions CRUD + exports + cache)
├── reports/                    — 10个子报表服务
├── datasources/                — 5个适配器
├── report-aggregation.service.ts
├── report-cache.service.ts
├── report-export.service.ts
├── report-query.service.ts
├── report.contract.ts
├── reports.entity.ts
├── report.dto.ts
├── report.module.ts
└── README.md                   — 完整README含端点列表、测试命令

apps/api/src/modules/analytics/
├── analytics.service.ts        — 运营快照 + 6条诊断规则 + 推荐
└── analytics.entity.ts         — AnalyicsScope/DiagnosticSeverity/OperationSnapshot

apps/api/src/modules/analytics-v2/
├── analytics-v2.service.ts     — 主编排 (事件→CDC→cohort→漏斗→留存→指标)
└── services/metrics.service.ts — 仪表板汇总/实时指标/健康报告

apps/api/src/modules/health-dashboard/
├── health-dashboard.service.ts  — 健康度仪表板 + Grafana导出 + 告警
└── health-score.service.ts      — 租户健康分计算

apps/api/src/modules/ai-insight/
├── ai-insight.service.ts        — KPI看板/报告/异常/趋势/仪表盘 (全模拟)
├── ai-insight-advanced.service.ts — 归因/预测/质量/推荐/下钻/对标/Widget
└── README.md                    — "管理层决策驾驶舱"

apps/api/src/modules/finance/
├── finance-report.service.ts    — P&L/资产负债表/现金流/对账报表
└── reconciliation/              — 支付渠道对账
```

> 本验收卡记录了 WP-04C 开工前的基线状态。所有缺口 (GAP-01~10) 需要在开发完成后逐项确认关闭。
