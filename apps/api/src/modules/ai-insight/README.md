# AI 经营洞察模块 / AI Business Insight Module

## 模块概述 / Module Overview

AI 经营洞察模块为运营管理提供**KPI 看板、洞察报告、异常检测、趋势预测、仪表盘摘要**五大核心能力。通过聚合 KPI 指标数据，进行环比/同比分析、3-sigma 异常检测、线性回归趋势预测，帮助企业管理者快速掌握经营状况、发现异常、生成报告并预测未来走势。

**业务定位 / Business Role**：管理层和运营者的决策驾驶舱 — 通过一个模块了解全局经营 KPI、异常告警和趋势走向。

---

## 核心功能 / Core Features

| 功能 | 说明 |
|------|------|
| KPI 看板          | 按分类/门店筛选查看 KPI 指标（日营收/客单价/会员/到店/游戏/运营） |
| 洞察报告          | 生成营收/会员/到店/游戏/综合类型的聚合分析报告 |
| 异常检测          | 基于 3-sigma 规则自动检测指标异常（低/中/高/严重） |
| 异常管理          | 确认/解决异常，支持状态流转（open → acknowledged → resolved） |
| 趋势预测          | 基于线性回归的 7 天预测，含置信度评估 |
| 仪表盘摘要        | 今日/本周/本月 KPI 聚合摘要，含活跃异常数和报告数 |
| 深度归因分析      | Shapley Value 归因驱动的多维度贡献分解 |
| 指标预测          | 6 周期时序预测（含区间） |
| 数据质量报告      | 完整性/准确性/一致性/及时性/唯一性五维评分 |
| 洞察推荐          | 识别机会/风险/趋势/异常四类洞察并给出建议 |
| 多维下钻分析      | 按渠道→门店→时段逐级下钻 |
| 同行对标          | 与行业平均/顶尖企业的指标对比 |
| 时间维度对比      | 环比/同比/目标完成率多维度对比 |
| 相关性分析      | 热力图形式展示指标间相关系数 |
| 自定义报告配置    | 灵活选择指标/维度/过滤器构建报告 |
| 仪表盘 Widget     | 可拖拽的自定义看板组件 |
| 告警规则          | 基于阈值的自动告警规则引擎 |

---

## 架构图 / Architecture Diagram

```mermaid
graph TD
    subgraph 外部调用 / External
        B[运营管理系统 / Operations]
        C[管理后台 / Admin Panel]
        D[数据看板 / Dashboard]
        E[ai-recommend / 推荐模块]
        F[ai-rule-engine / 规则引擎]
    end

    subgraph AiInsightModule
        Controller[AiInsightController<br/>REST API 端点]
        
        subgraph Services
            S1[AiInsightService<br/>KPI / 报告 / 异常 / 预测 / 仪表盘]
            S2[AdvancedInsightService<br/>深度归因 / 同行对标 / 下钻 / 质量 / 推荐]
        end
        
        Entity[Entity / 实体定义<br/>InsightReport / KPI / Anomaly / Trend / DashboardSummary]
        Contract[Contract / 合约<br/>跨模块安全子集]
        DTO[DTO / 请求校验<br/>class-validator + reflect-metadata]
    end

    subgraph 数据源 / Data Source
        MemStore[In-Memory Seed Data<br/>KPI[] / Anomaly[] / Trend[] / Report[]]
    end

    B --> Controller
    C --> Controller
    D --> Controller
    E -->|跨模块合约消费| Contract
    F --> Contract

    Controller --> S1
    Controller --> S2
    S1 --> MemStore
    S2 --> S1

    Contract -.->|输出合约子集| 外部模块
```

---

## API 端点 / API Endpoints

### KPI 看板 / KPI Dashboard

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/ai-insight/kpis`           | KPI 列表（支持 storeId/category 过滤） |
| GET  | `/ai-insight/kpis/:kpiId`    | 单个 KPI 详情 |

### 洞察报告 / Insight Reports

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai-insight/reports`          | 生成洞察报告 |
| GET  | `/ai-insight/reports`          | 查询报告列表（支持 storeId/type/limit） |

### 异常检测 / Anomaly Detection

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai-insight/anomalies/detect`                 | 执行异常检测（3-sigma） |
| GET  | `/ai-insight/anomalies`                        | 查询异常列表 |
| PUT  | `/ai-insight/anomalies/:anomalyId/acknowledge` | 确认异常 |
| PUT  | `/ai-insight/anomalies/:anomalyId/resolve`     | 解决异常 |

### 趋势预测 / Trend Forecast

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/ai-insight/forecasts`            | 生成趋势预测 |
| GET  | `/ai-insight/forecasts/:trendId`   | 获取预测详情 |

### 仪表盘 / Dashboard

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/ai-insight/dashboard` | 获取仪表盘摘要（今日/本周/本月） |

---

## 配置说明 / Configuration

本模块基于**内存模拟数据**运行，初始化时自动创建 3 家门店 × 10 个 KPI 指标，以及 3 条示例异常记录。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `TENANT_GUARD` | 中间件 | 启用 | 租户隔离守卫（基于 x-tenant-id header） |
| `x-tenant-id` | Header | `default` | 租户标识 |
| `KPI 种子数据` | 初始化 | 30 条 | 3 门店 × 10 指标 |
| `异常种子数据` | 初始化 | 3 条 | 1 open / 1 acknowledged / 1 resolved |

---

## 依赖关系 / Dependencies

| 依赖模块 | 方向 | 说明 |
|----------|------|------|
| `@nestjs/common` | 框架 | NestJS 核心 |
| `class-validator / class-transformer` | 外部 | DTO 校验与转换 |
| `reflect-metadata` | 外部 | 装饰器元数据 |
| `../agent/tenant.guard` | 内部 | 租户隔离守卫 |

**跨模块合约消费方 / Contract Consumers**：
- `ai-recommend` — 基于洞察推荐优化策略
- `ai-rule-engine` — 洞察驱动规则调优
- `observability` — 经营指标可观测

---

## 核心算法 / Core Algorithms

### 异常检测 — 3-sigma 规则 / Anomaly Detection

```
均值   μ = Σ(values) / n
标准差 σ = √(Σ(value - μ)² / n)
上界   = μ + 3σ
下界   = μ - 3σ
异常   = value > 上界 || value < 下界
严重等级: 偏差 > 50% → critical / > 30% → high / > 15% → medium
```

### 趋势预测 — 线性回归 / Trend Forecast

```
y = intercept + slope × x

slope     = (n·Σxy - Σx·Σy) / (n·Σx² - (Σx)²)
intercept = (Σy - slope·Σx) / n
预测天数  = 7 天（可扩展）
置信度    = R² × (1 - 1/n)
```

### 仪表盘聚合 / Dashboard Summary

```
今日/本周/本月三组聚合：
  营收   = Σ(KPI.category === 'revenue')
  会员   = Σ(KPI.category === 'member')
  到店   = Σ(KPI.category === 'attendance')
  游戏   = Σ(KPI.category === 'game')
  同比   = 模拟值 (-10% ~ +30%)
```

---

## 实体类型 / Entity Types

| 实体 | 说明 | 关键字段 |
|------|------|----------|
| KPI | 关键绩效指标 | name, category, value, target, trend, unit |
| InsightReport | 洞察报告 | type, summary, metrics, trends, anomalies |
| Anomaly | 异常检测结果 | metric, value, expectedValue, deviationPercent, severity, status |
| Trend | 趋势预测 | metric, forecast[], confidence |
| DashboardSummary | 仪表盘摘要 | today, thisWeek, thisMonth, activeAnomalies |
| SummaryPeriod | 周期摘要 | revenue, members, attendance, games, yoyPercent |

---

## 测试 / Testing

模块测试覆盖：
- **单元测试** — service 层 KPI/报告/异常/预测/仪表盘
- **进阶测试** — advanced service 归因/对标/下钻/质量
- **契约测试** — contract 映射器转换
- **综合测试** — 全场景集成
- **趋势综合测试** — 趋势预测 + 异常检测全场景
- **E2E 测试** — 全链路端点测试
- **角色测试** — 多角色权限场景
- **RingBeam 测试** — 圈梁集成测试
