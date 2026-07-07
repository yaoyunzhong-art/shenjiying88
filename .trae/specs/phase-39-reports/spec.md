# Phase-39 数据报表 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:02 CST
> **创建人**: 🦞 龙虾哥 (后台 22h 大脑级)
> **状态**: 🟡 框架版,等 Phase-38 完成后启动
> **预计**: 1.5 天工期

---

## 0. 现状盘点 (派发前必做)

**⚠️ 必须做**:派发 T169 任务卡前,先盘点数据报表模块。

待验证:
- `apps/api/src/modules/reports/` 或 `analytics/` 是否存在
- 报表引擎 (Cube.js / Metabase / 自研)
- 与 Phase-35~38 数据集成

---

## 1. 业务目标

数据报表是 SaaS 平台决策核心:
- **运营报表**: 日/周/月营收、订单量、客单价
- **会员报表**: 会员增长、等级分布、消费力
- **库存报表**: 周转率、滞销品、预警
- **财务报表**: 营收成本、利润、税务
- **自定义报表**: 老板/运营自助配置

依赖 Phase-35~38 全部数据源。

---

## 2. 数据模型 (待详细化)

### Report (报表定义)
```typescript
interface Report {
  id: string
  tenantId: string
  brandId?: string
  name: string
  type: 'SALES' | 'MEMBER' | 'INVENTORY' | 'FINANCE' | 'CUSTOM'
  config: ReportConfig         // 维度/度量/筛选
  schedule?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  recipients?: string[]         // 邮箱
  createdBy: string
  createdAt: string
}

interface ReportConfig {
  dimensions: string[]          // ['date', 'category', 'region']
  measures: Array<{ field: string; agg: 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' }>
  filters: Array<{ field: string; op: string; value: unknown }>
  chartType: 'LINE' | 'BAR' | 'PIE' | 'TABLE'
}
```

### Dashboard (仪表盘)
```typescript
interface Dashboard {
  id: string
  tenantId: string
  name: string
  widgets: DashboardWidget[]
  layout: DashboardLayout
  isDefault: boolean
  createdBy: string
}

interface DashboardWidget {
  reportId: string
  position: { x: number; y: number; w: number; h: number }
  refreshIntervalSec?: number
}
```

---

## 3. 任务卡 (T169 · 待拆)

| T-NN | 标题 | 估时 | 依赖 |
|------|------|------|------|
| T169-1 | 报表引擎 + 4 类预设报表 | 0.5d | - |
| T169-2 | 仪表盘 + 自定义配置 | 0.5d | T169-1 |
| T169-3 | 定时报表 + 邮件推送 | 0.5d | T169-1 |
| T169-4 | E2E + KPI 集成 | 0.5d | 全部 |

**总计**: 2 天

---

## 4. Champion 督导

- **E42 李事业部总经理** (Phase-35~39)
- **E19 王运营总监** (报表使用方)
- **E41 王集团董事长** (跨业务线报表)

---

## 5. 关键决策待定 (Open Questions)

1. **报表引擎**: 自研 vs 集成 Cube.js / Metabase?
2. **数据更新**: 实时 vs T+1?
3. **存储**: OLAP (ClickHouse) vs OLTP (Postgres)?
4. **权限**: 报表按租户隔离 vs 按角色?
5. **可视化**: ECharts / AntV / 自研?

**待大飞哥决策**: 🟡 P1 优先级

---

## 6. 上下游依赖

### 上游 (✅ 已就位)
- Phase-30 SSE 集成层
- Phase-31 多租户隔离
- Phase-33 EventStore
- Phase-35~38 (4 类数据源)
- Phase-36 会员

### 下游 (待建)
- Phase-40 智能推荐 (基于报表数据)
- 老板 E41/E42/E43/E44 (多层级报表)

---

## 7. 反模式预引用

- [naming-consistency.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/naming-consistency.md): 派发前盘点
- [concurrency-safety.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/concurrency-safety.md): 报表缓存一致性

---

> 🦞 **"Phase-39 报表 = 数据驱动决策 = 业务深耕第 5 步"**

待 Phase-38 完成后启动 T169。