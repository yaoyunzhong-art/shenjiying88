# Phase-43 数据分析 Spec · V1 启动版

> **创建时间**: 2026-06-27 22:08 CST (1h 冲刺)
> **Phase**: P2 智能化 (Phase-41~44, 4 phase)
> **预计**: 1 天

---

## 1. 业务目标

数据分析是 SaaS 平台洞察核心:
- **用户行为分析**: 点击/浏览/停留/转化漏斗
- **业务指标看板**: DAU/MAU/留存/付费转化
- **归因分析**: 多触点贡献度分析
- **预测分析**: 销量/库存/会员流失预测
- **异常检测**: 实时业务异常告警

依赖 Phase-39 报表 + Phase-40 推荐。

---

## 2. 数据模型

### BehaviorEvent (行为事件)
```typescript
interface BehaviorEvent {
  id: string
  tenantId: string
  userId: string
  sessionId: string
  event: 'PAGE_VIEW' | 'CLICK' | 'SCROLL' | 'ADD_TO_CART' | 'CHECKOUT' | 'PURCHASE'
  properties: Record<string, unknown>
  page?: string
  duration?: number              // ms
  timestamp: string
}
```

### Funnel (漏斗)
```typescript
interface Funnel {
  id: string
  tenantId: string
  name: string                   // "购买转化漏斗"
  steps: FunnelStep[]
  timeWindow: number             // hours
  
  metrics?: {
    totalEntered: number
    stepConversions: number[]    // 每步转化人数
    overallConversion: number    // 0-1
  }
}

interface FunnelStep {
  name: string
  event: string                  // 'PAGE_VIEW' | 'PURCHASE' | etc.
  filter?: Record<string, unknown>
}
```

### Prediction (预测模型)
```typescript
interface PredictionModel {
  id: string
  tenantId: string
  type: 'CHURN' | 'LTV' | 'SALES_FORECAST' | 'INVENTORY_DEMAND'
  config: Record<string, unknown>
  accuracy: number               // 0-1
  lastTrainedAt: string
  enabled: boolean
}
```

---

## 3. 任务卡 (T173)

| T-NN | 标题 | 估时 |
|------|------|------|
| T173-1 | 行为埋点 SDK | 0.25d |
| T173-2 | 漏斗 + 留存分析 | 0.25d |
| T173-3 | 预测模型框架 | 0.5d |

**总计**: 1 天

---

## 4. Champion 督导
- E44 周技术总监 (ML 模型)
- E19 王运营总监 (分析使用方)
- E41 王董事长 (集团 BI)

---

## 5. 关键决策待定
1. **埋点方式**: 代码埋点 / 全埋点 / 服务端埋点?
2. **存储**: ClickHouse / Doris / Postgres?
3. **预测模型**: 自研 / AutoML / 第三方?
4. **归因模型**: 首次/末次/线性/时间衰减?
5. **实时性**: T+0 / T+1?

---

> 🦞 **"Phase-43 数据分析 = P2 智能化第 3 步 = 决策驾驶舱"**
---

## V3 Decision Lock · 2026-06-27 22:25 CST

### D1 OLAP Engine: ClickHouse (V1) + Doris (V2 multi-tenant)
- V1: ClickHouse 单租户版 (高性能聚合)
- V2: Doris 多租户版 (支持数据隔离)
- 同步: CDC (Debezium) → 准实时 5min

### D2 Data Freshness: Near real-time 5min
- CDC + Kafka + ClickHouse
- 准实时: < 5min 延迟
- 离线: T+1 凌晨 ETL (深度聚合)

### D3 Cohort Analysis: Weekly + Monthly default
- Default: Weekly cohort (业务最常用)
- 高级: Monthly cohort (战略决策)
- 自定义: Daily (短期活动)
- 保留率窗口: 1/2/3/4/8/12/24 周

### D4 Dashboard: ECharts + 自定义配置
- 图表: ECharts (百度开源,中文友好)
- 拖拽: react-grid-layout (自定义布局)
- 主题: 暗色/亮色 切换
- 权限: 角色 (admin/viewer/editor)

### D5 Storage: ClickHouse (聚合) + PG (明细)
- ClickHouse: 聚合数据 (P99 < 100ms)
- PostgreSQL: 原始明细 (审计/合规)
- Redis: 缓存热点看板

### D6 Permission: RBAC + 数据行级隔离
- 角色: admin / analyst / viewer
- 行级: tenant_id 强制 WHERE
- 列级: 敏感字段脱敏 (mobile/身份证)

---

## 现状盘点

- 新增文件: 7 个 (olap-engine / cohort-analysis / dashboard-config / echarts-wrapper / kpi-snapshot / real-time-cdc / cache-layer)
- 修改文件: 3 个 (Prisma Dashboard/KpiSnapshot 2 表 + ClickHouse init + app.module)
- 测试: 22+ 断言 (多维查询 / Cohort 矩阵 / 仪表盘配置 / CDC 同步)

> Phase-43 = Data Analytics = OLAP + Cohort + 大屏 = 数据驱动决策
