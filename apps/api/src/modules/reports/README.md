# 报表模块 (Reports)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块是 BI 多维报表中心（Phase-39 T169），提供门店经营数据的聚合、查询、导出与缓存能力:

**10 个内置报表服务:**
1. `revenue-report` — 营收报表（按时间段聚合）
2. `inventory-turnover` — 库存周转率
3. `member-growth` — 会员增长趋势
4. `refund-rate` — 退款率分析
5. `order-conversion` — 订单转化率
6. `product-ranking` — 商品销量排行（topN）
7. `payment-mix` — 支付渠道分布
8. `hourly-heatmap` — 时段热力图
9. `channel-funnel` — 渠道转化漏斗
10. `inventory-alert` — 库存预警

**5 个数据源适配器:**
- `OrderAdapter` / `PaymentAdapter` / `RefundAdapter` / `MemberAdapter` / `InventoryAdapter`

**4 个核心服务层:**
- `ReportAggregationService` — 聚合计算引擎
- `ReportCacheService` — 报表缓存管理（支持过期策略 + 主动失效）
- `ReportExportService` — 报表导出（CSV / JSON / HTML）
- `ReportQueryService` — 通用报表查询

边界约束:
- ❌ 不处理计费结算（见 `billing` 模块）
- ❌ 不处理支付发起/回调（见 `cashier` 模块）
- ❌ 不处理 SaaS 订阅配额（见 `saas-billing` 模块）
- ✅ 只做数据查询、聚合、缓存、导出

═══════════════════════════════════════
箍二: 依赖关系清单
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `agent/tenant.guard` | 租户多租隔离守卫 |
| 上游依赖 | NestJS 核心 | 框架装饰器 + 依赖注入 |
| 下游适配 | `datasources/` (5 adapter) | Order/Payment/Refund/Member/Inventory 数据源适配 |
| 下游使用 | 外部前端 | 消费 REST API (`/api/reports/*`) |
| 下游使用 | 模块内 exports | ReportService/Aggregation/Cache/Export/Query 可供其他模块注入 |

═══════════════════════════════════════
箍三: 领域事件/消息契约
═══════════════════════════════════════

所有 API 均为同步查询接口:

| API 端点 | 方法 | 参数 | 返回 |
|----------|------|------|------|
| `/api/reports/revenue` | GET | `tenantId, from, to` | 营收报表 |
| `/api/reports/inventory` | GET | `tenantId, from, to` | 库存周转率 |
| `/api/reports/member` | GET | `tenantId, from, to` | 会员增长 |
| `/api/reports/refund` | GET | `tenantId, from, to` | 退款率 |
| `/api/reports/order` | GET | `tenantId, from, to` | 订单转化率 |
| `/api/reports/product-ranking` | GET | `tenantId, from, to, topN` | 商品排行 |
| `/api/reports/payment-mix` | GET | `tenantId, from, to` | 支付渠道分布 |
| `/api/reports/hourly-heatmap` | GET | `tenantId, from, to` | 时段热力图 |
| `/api/reports/channel-funnel` | GET | `tenantId, from, to` | 渠道漏斗 |
| `/api/reports/inventory-alert` | GET | `tenantId` | 库存预警 |
| `/api/reports/definitions` | GET | `tenantId` | 报表定义列表 |
| `/api/reports/definitions` | POST | `CreateReportDefinitionInput` | 创建报表定义 |
| `/api/reports/definitions/:id` | GET | `tenantId` | 查询报表定义 |
| `/api/reports/definitions/:id` | PUT | `UpdateReportDefinitionInput` | 更新报表定义 |
| `/api/reports/definitions/:id` | DELETE | `tenantId` | 删除报表定义 |
| `/api/reports/export` | GET | `type, format, tenantId, from, to` | CSV/JSON/HTML 导出 |
| `/api/reports/cache/invalidate` | POST | — | 主动缓存失效 |

═══════════════════════════════════════
箍四: 配置与环境变量声明
═══════════════════════════════════════

本模块当前无独立环境变量。图表缓存策略:

| 配置项 | 说明 | 建议值 |
|--------|------|--------|
| 缓存 TTL | 报表缓存过期时间 | 5 分钟（硬编码中） |
| 缓存失效 | 主动失效端点 `POST /api/reports/cache/invalidate` | 收到更新时调用 |
| 导出格式 | CSV / JSON / HTML | 当前支持三种格式 |

> 后续优化: 缓存 TTL、聚合批次大小、导出模版路径等应迁移至配置中心。

═══════════════════════════════════════
箍五: 测试覆盖承诺与入口指引
═══════════════════════════════════════

```
apps/api/src/modules/reports/
├── datasources/
│   ├── inventory.adapter.ts
│   ├── member.adapter.ts
│   ├── order.adapter.ts
│   ├── payment.adapter.ts
│   └── refund.adapter.ts
├── reports/
│   ├── channel-funnel.service.ts
│   ├── hourly-heatmap.service.ts
│   ├── inventory-alert.service.ts
│   ├── inventory-turnover.service.ts
│   ├── member-growth.service.ts
│   ├── order-conversion.service.ts
│   ├── payment-mix.service.ts
│   ├── product-ranking.service.ts
│   ├── refund-rate.service.ts
│   └── revenue-report.service.ts
├── report-aggregation.service.ts        + .test.ts
├── report-cache.service.ts              + .test.ts
├── report-export.service.ts             + .spec.ts + .test.ts
├── report-query.service.ts              + .test.ts
├── report.contract.ts                   + .test.ts
├── report.controller.ts                 + .spec.ts + .test.ts
├── report.dto.ts                        + .test.ts
├── report.module.ts                     + .test.ts
├── report.service.ts                    + .test.ts
├── report.app.e2e.test.ts
├── report.e2e.test.ts
└── README.md                            — 本文档
```

运行测试:

```bash
# 报表模块全量测试
npx jest apps/api/src/modules/reports/report.service.test.ts
npx jest apps/api/src/modules/reports/report.controller.test.ts
npx jest apps/api/src/modules/reports/report.module.test.ts
npx jest apps/api/src/modules/reports/report.e2e.test.ts
npx jest apps/api/src/modules/reports/report.app.e2e.test.ts
npx jest apps/api/src/modules/reports/report-aggregation.service.test.ts
npx jest apps/api/src/modules/reports/report-cache.service.test.ts
npx jest apps/api/src/modules/reports/report-export.service.test.ts
npx jest apps/api/src/modules/reports/report-query.service.test.ts
npx jest apps/api/src/modules/reports/report.contract.test.ts
npx jest apps/api/src/modules/reports/report.dto.test.ts

# 各内置报表服务测试
npx jest apps/api/src/modules/reports/report-aggregation.test.ts
npx jest apps/api/src/modules/reports/report-cache.test.ts
npx jest apps/api/src/modules/reports/report-export.test.ts
npx jest apps/api/src/modules/reports/report-query.test.ts
```

覆盖承诺: 分层全覆盖（Controller + Service + Module + E2E + Contract + aggregation/cache/export/query），含 5 数据源适配器 + 10 个内置报表服务，测试文件 17+ 个，总约 260 KB。
