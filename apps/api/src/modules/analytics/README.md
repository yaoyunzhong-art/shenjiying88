# Analytics · 运营分析模块

提供多租户运营分析看板的核心数据服务，涵盖运营快照、健康诊断与智能推荐三大能力。

## 核心功能

1. **运营快照 (Operation Snapshot)** — 按租户/品牌/门店维度聚合关键运营指标（支付、积分、盲盒、会员等），含趋势标记 (`UP` / `DOWN` / `FLAT`)
2. **健康诊断 (Diagnostics)** — 基于预定义诊断规则引擎（PaymentHealth / CouponPerformance / BlindboxEngagement / MemberActivity / PointEconomy / ConcentrationRisk），自动识别异常并生成 actionable 建议
3. **智能推荐 (Recommendations)** — 根据诊断结果生成优先级排序的改进行动方案（如检查支付网关、发起盲盒促销等）
4. **多级 Scope** — 支持 `TENANT` → `BRAND` → `STORE` 三级数据粒度和权限隔离

## 主要依赖

| 组件 | 职责 |
|---|---|
| `AnalyticsController` | REST 路由层：`GET /analytics/snapshot` / `diagnostics` / `recommendations` |
| `AnalyticsService` | 核心业务：运营快照聚合、诊断规则评估、推荐生成 |
| `LoyaltyService` (imported) | 忠诚度积分/等级数据 |
| `MarketingMetricsService` (imported) | 营销效果指标数据 |
| `TenantGuard` | 租户级别权限守卫 |

## 配置项

无独立模块配置项，依赖 `LoyaltyModule` 和 `MarketingMetricsModule` 的配置注入。

## 文件结构

```
analytics/
├── analytics.module.ts          # NestJS 模块定义
├── analytics.controller.ts      # REST 控制器 (3 个 GET 端点)
├── analytics.service.ts         # 核心分析服务
├── analytics.dto.ts             # 请求 DTO (scope/brandId/storeId)
├── analytics.entity.ts          # 实体/枚举/接口定义
│   ├── AnalyticsScope           # TENANT | BRAND | STORE
│   ├── DiagnosticSeverity       # INFO | WARNING | CRITICAL
│   ├── DiagnosticCategory       # 6 种诊断分类
│   ├── OperationSnapshot        # 运营快照模型
│   ├── Diagnostic               # 诊断模型
│   └── DiagnosticRecommendation # 推荐行动模型
├── analytics.contract.ts        # 对外合约接口
├── analytics.simulator.test.ts  # 模拟器测试
├── analytics-ringbeam.test.ts   # Ring Beam 集成测试
├── *.spec.ts / *.test.ts        # 单元/集成测试
└── *.e2e.test.ts                # E2E 测试
```

## API 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/analytics/snapshot` | 获取运营快照 |
| GET | `/analytics/diagnostics` | 获取健康诊断列表 |
| GET | `/analytics/recommendations` | 获取智能推荐列表 |

所有端点均通过 `TenantGuard` 守卫，支持 `x-tenant-id` 多租户隔离。

## P-38 财务冲刺

- 诊断规则引擎直接关联财务健康指标（支付成功率、履约转化率、积分经济）
- 推荐行动落地可驱动 GMV 修复（如盲盒促销、支付网关检查）

---

> Phase-17 · Pulse-68
