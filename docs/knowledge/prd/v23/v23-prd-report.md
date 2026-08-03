# 🗺️ PRD: 数据报表模块（营收/客流/转化）

> 状态: 🟢 已交付
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅(321 tests) TSC✅ 审计✅ PRD补写
> 关联Phase: V23
> 产出: `apps/api/src/modules/report/`

---

## 1. 业务背景

数据报表是管理层的核心功能，提供门店级营收、客流、转化率三个关键指标的聚合展示能力。

**现有基础**: `apps/api/src/modules/report/` 已在 V10 Day 7 完成报表/看板管理基础能力（报表 CRUD、数据注入、维度聚合、看板布局 CRUD）。

**本次新增**: 三个面向管理层的专用报表端点，快速获取营收、客流、转化数据。

**业务收益**:
- 管理层无需手动构造聚合查询即可获取门店经营关键指标
- 统一的三维指标口径，避免数据分析口径不一致
- 为总览看板卡片提供直接数据源

---

## 2. 需求卡

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-REPORT-01 | 营收报表端点 `GET /report/revenue` | P2 | 聚合 sales.amount 按门店维度返回，支持 period/from/to 参数 |
| RQ-REPORT-02 | 客流报表端点 `GET /report/traffic` | P2 | 聚合 sales.traffic 按门店维度返回，支持参数查询 |
| RQ-REPORT-03 | 转化报表端点 `GET /report/conversion` | P2 | 聚合 sales.conversion 按门店维度返回，支持参数查询 |
| RQ-REPORT-04 | 新增客流/转化指标到实体类型 | P2 | ReportMetric 新增 sales.traffic / sales.conversion |
| RQ-REPORT-05 | 英文名/单位/标签与现有体系一致 | P2 | METRIC_LABELS / METRIC_UNITS 同步更新 |

---

## 3. 验收卡

| AC | 场景 | 前置 | 预期 |
|:---|:-----|:-----|:-----|
| AC-REPORT-01 | 店长查看营收汇总 | 种子数据含 sales.amount | 返回各门店营收值，均为 >0 数字 |
| AC-REPORT-02 | 客流报表无数据时 | 未注入 sales.traffic | 返回空的 totals 不抛异常 |
| AC-REPORT-03 | 客流数据注入后聚合 | 注入 3 条客流量数据 | totals 正确求和（store-001=650） |
| AC-REPORT-04 | 转化率数据聚合 | 注入 2 条转化数据 | totals 正确（store-001=15.2%） |
| AC-REPORT-05 | 路由元数据注册 | 所有新端点通过检查 | 14 个路由全部注册正确 |

---

## 4. 数据模型

### 新增指标类型

```typescript
export type ReportMetric =
  | 'sales.amount'        // 销售额
  | 'sales.count'         // 订单数
  | 'sales.traffic'       // 客流/到店人数  (★ V23 新增)
  | 'sales.conversion'    // 转化率 (%)    (★ V23 新增)
  | 'member.new'          // 新增会员
  | 'member.active'       // 活跃会员
  | 'inventory.turnover'  // 库存周转
  | 'marketing.roi'       // 营销 ROI
  | 'ai.tokens'           // AI 调用 token
  | 'ai.latency'          // AI 响应延迟

export const METRIC_LABELS: Record<ReportMetric, string> = {
  'sales.traffic': '客流量',     // ★ V23 新增
  'sales.conversion': '转化率',   // ★ V23 新增
  // ... 其余与 V10 一致
}

export const METRIC_UNITS: Record<ReportMetric, string> = {
  'sales.traffic': '人',         // ★ V23 新增
  'sales.conversion': '%',       // ★ V23 新增
  // ... 其余与 V10 一致
}
```

### 新增 API 端点

| 方法 | 路径 | 查询参数 | 响应 |
|:----|:-----|:---------|:-----|
| GET | `/report/revenue` | `period`, `from?`, `to?` | `{ period, from?, to?, totals: Record<string, number> }` |
| GET | `/report/traffic` | `period`, `from?`, `to?` | `{ period, from?, to?, totals: Record<string, number> }` |
| GET | `/report/conversion` | `period`, `from?`, `to?` | `{ period, from?, to?, totals: Record<string, number> }` |

---

## 5. 接口草图

```typescript
// Controller
@Get('revenue')
revenueReport(
  @Query('period') period: ReportPeriod,
  @Query('from') from?: string,
  @Query('to') to?: string,
): { period: ReportPeriod; from?: string; to?: string; totals: Record<string, number> }

@Get('traffic')
trafficReport(
  @Query('period') period: ReportPeriod,
  @Query('from') from?: string,
  @Query('to') to?: string,
): { period: ReportPeriod; from?: string; to?: string; totals: Record<string, number> }

@Get('conversion')
conversionReport(
  @Query('period') period: ReportPeriod,
  @Query('from') from?: string,
  @Query('to') to?: string,
): { period: ReportPeriod; from?: string; to?: string; totals: Record<string, number> }
```

---

## 6. 不在范围

- 不新增数据库表/实体（沿用内存数据源方案）
- 不修改看板 CRUD 流程
- 不新增数据注入端点（沿用 `POST /report/ingest`）
- 不涉及 admin-web/storefront 前端改动
- 不新增角色权限控制（沿用 TenantGuard）

---

## 7. 影响面

| 端 | 影响范围 | 说明 |
|:---|:---------|:-----|
| ✅ API | `report.controller.ts` +3 端点 | 非破坏性新增，旧端点不变 |
| ✅ API | `report.entity.ts` +2 指标 | METRIC_LABELS/UNITS 从 8→10 |
| ✅ API | `report.contract.ts` +3 合约 | 新增 Revenue/Traffic/ConversionContract |
| ✅ API | `report.dto.ts` +3 DTO | 对应响应 DTO |
| ❌ admin-web | 无 | 暂不涉及 |
| ❌ storefront | 无 | 暂不涉及 |

---

## 8. 验证方式

| 项 | 方法 | 说明 |
|:---|:-----|:-----|
| 单元测试 | `vitest run src/modules/report/` | 321 测试全部通过 |
| 路由元数据 | `report.controller.test.ts` | 14 个路由验证（含 V23 新增 3 个） |
| TSC | `tsc --noEmit` | 零错误 |
| 数据聚合验证 | 注入+聚合测试 | 注入营收/客流/转化数据后验证 totals 正确 |
