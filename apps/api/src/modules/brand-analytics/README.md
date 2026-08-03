# 品牌分析模块 (Brand Analytics)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块提供品牌分析能力，涵盖 KPI 追踪、渠道归因、品牌声量监测、健康度评估、内容表现分析、报告自动生成、ROI 计算及市场占比分析。

- **KPI 指标** — 曝光量、点击量、CTR、转化率、互动率等多维度指标追踪
- **渠道归因** — 7 大渠道归因分析，支持多模型对比（首次/末次/线性/时间衰减/位置）
- **品牌声量** — 跨平台声量监测 & 情感分析
- **健康度** — 品牌健康度综合评分（知名度/互动/美誉/忠诚/内容）
- **内容表现** — 多类型内容效果分析
- **报告生成** — 周期性品牌分析报告自动生成
- **ROI 计算** — 成本/营收/ROI/ROAS/净利
- **市场占比** — 品牌市场占有率排名
- **综合查询** — 单接口聚合 KPI/归因/声量/健康/内容
- **品牌对比** — 多品牌 KPI 与健康度横向对比
- **竞品对比** — 主品牌 vs 竞品差异分析
- **热门内容** — 按类型/平台筛选品牌热门内容
- **健康度趋势** — 月度健康度变化趋势可视化
- **内容建议** — 内容优化建议

边界约束:
- ❌ 不处理广告投放或渠道对接（仅在内部模拟计算）
- ❌ 不处理用户画像或 CRM 数据管理（见 `member` / `user` 模块）
- ❌ 不依赖外部 AI API（使用本地 mock 数据）
- ✅ 聚焦品牌分析指标采集与计算

═══════════════════════════════════════
箍二: 核心功能列表
═══════════════════════════════════════

| 功能 | 端点 | 描述 | 状态 |
|------|------|------|------|
| KPI 查询 | `GET /brand-analytics/kpi/:brandId` | 查品牌 KPI 指标（按时间范围） | ✅ IMPLEMENTED |
| KPI 记录 | `POST /brand-analytics/kpi` | 录入 KPI 数据 | ✅ IMPLEMENTED |
| 渠道归因 | `GET /brand-analytics/attribution/:brandId` | 7 大渠道归因分析 | ✅ IMPLEMENTED |
| 归因模型对比 | `GET /brand-analytics/attribution/:brandId/compare` | 5 种归因模型结果对比 | ✅ IMPLEMENTED |
| 品牌声量 | `GET /brand-analytics/mentions/:brandId` | 跨平台声量监测（可筛选平台） | ✅ IMPLEMENTED |
| 声量记录 | `POST /brand-analytics/mentions` | 录入品牌声量数据 | ✅ IMPLEMENTED |
| 健康度 | `GET /brand-analytics/health/:brandId` | 5 维度健康度评分 | ✅ IMPLEMENTED |
| 更新健康度 | `PATCH /brand-analytics/health/:brandId` | 部分更新健康度 | ✅ IMPLEMENTED |
| 内容表现 | `GET /brand-analytics/content/:brandId` | 内容效果分析 | ✅ IMPLEMENTED |
| 内容记录 | `POST /brand-analytics/content` | 录入内容表现 | ✅ IMPLEMENTED |
| 生成报告 | `POST /brand-analytics/report/:brandId` | 生成品牌分析报告 | ✅ IMPLEMENTED |
| 报告列表 | `GET /brand-analytics/reports/:brandId` | 历史报告列表 | ✅ IMPLEMENTED |
| 报告详情 | `GET /brand-analytics/report/:id` | 单份报告详情 | ✅ IMPLEMENTED |
| ROI 计算 | `GET /brand-analytics/roi/:brandId` | ROI/ROAS/净利计算 | ✅ IMPLEMENTED |
| 市场占比 | `GET /brand-analytics/market-share` | 品牌市场占有率排名 | ✅ IMPLEMENTED |
| 综合查询 | `GET /brand-analytics/analytics/:brandId` | KPI/归因/声量/健康/内容一并返回 | ✅ IMPLEMENTED |
| 品牌对比 | `POST /brand-analytics/compare` | 多品牌 KPI 与健康度对比 | ✅ IMPLEMENTED |
| 竞品对比 | `POST /brand-analytics/competitors` | 主品牌 vs 竞品差异分析 | ✅ IMPLEMENTED |
| 热门内容 | `GET /brand-analytics/top-content/:brandId` | 按类型/平台筛选热门内容 | ✅ IMPLEMENTED |
| 健康度趋势 | `GET /brand-analytics/health/:brandId/trend` | 月度健康度变化趋势 | ✅ IMPLEMENTED |
| 内容建议 | `GET /brand-analytics/content-suggestions/:contentId` | 内容优化建议 | ✅ IMPLEMENTED |

═══════════════════════════════════════
箍三: 架构说明 — 目录结构
═══════════════════════════════════════

```
apps/api/src/modules/brand-analytics/
├── brand-analytics.module.ts       — NestJS 模块定义
├── brand-analytics.controller.ts   — REST 控制器 (21 端点)
├── brand-analytics.service.ts      — 业务逻辑 (内置 Mock Map)
├── brand-analytics.dto.ts          — class-validator DTO
├── brand-analytics.entity.ts       — 实体类型定义
├── ACCEPTANCE.md                   — 验收标准
├── README.md                       — 本文件
├── index.ts                        — 模块导出入口
├── brand-analytics.controller.spec.ts — 控制器单元测试
├── brand-analytics.service.spec.ts    — 服务层单元测试
├── brand-analytics.dto.spec.ts        — DTO 校验测试
└── __tests__/
    └── brand-analytics.e2e-spec.ts  — E2E 集成测试 (8 业务域, 14 组)
```

═══════════════════════════════════════
箍四: 关键接口 / 数据结构
═══════════════════════════════════════

### REST 端点

| 方法 | 路由 | 认证 | 描述 |
|------|------|------|------|
| GET | `/brand-analytics/kpi/:brandId` | TrafficGovernanceGuard | KPI 查询 |
| POST | `/brand-analytics/kpi` | TrafficGovernanceGuard | KPI 记录 |
| GET | `/brand-analytics/attribution/:brandId` | TrafficGovernanceGuard | 渠道归因 |
| GET | `/brand-analytics/attribution/:brandId/compare` | TrafficGovernanceGuard | 归因模型对比 |
| GET | `/brand-analytics/mentions/:brandId` | TrafficGovernanceGuard | 品牌声量 |
| POST | `/brand-analytics/mentions` | TrafficGovernanceGuard | 声量记录 |
| GET | `/brand-analytics/health/:brandId` | TrafficGovernanceGuard | 健康度 |
| PATCH | `/brand-analytics/health/:brandId` | TrafficGovernanceGuard | 更新健康度 |
| GET | `/brand-analytics/content/:brandId` | TrafficGovernanceGuard | 内容表现 |
| POST | `/brand-analytics/content` | TrafficGovernanceGuard | 内容记录 |
| POST | `/brand-analytics/report/:brandId` | TrafficGovernanceGuard | 生成报告 |
| GET | `/brand-analytics/reports/:brandId` | TrafficGovernanceGuard | 报告列表 |
| GET | `/brand-analytics/report/:id` | TrafficGovernanceGuard | 报告详情 |
| GET | `/brand-analytics/roi/:brandId` | TrafficGovernanceGuard | ROI 计算 |
| GET | `/brand-analytics/market-share` | TrafficGovernanceGuard | 市场占比 |
| GET | `/brand-analytics/analytics/:brandId` | TrafficGovernanceGuard | 综合查询 |
| POST | `/brand-analytics/compare` | TrafficGovernanceGuard | 品牌对比 |
| POST | `/brand-analytics/competitors` | TrafficGovernanceGuard | 竞品对比 |
| GET | `/brand-analytics/top-content/:brandId` | TrafficGovernanceGuard | 热门内容 |
| GET | `/brand-analytics/health/:brandId/trend` | TrafficGovernanceGuard | 健康度趋势 |
| GET | `/brand-analytics/content-suggestions/:contentId` | TrafficGovernanceGuard | 内容建议 |

### 核心数据结构

```typescript
interface BrandKPIMetrics {
  impressions: number          // 曝光量
  clicks: number               // 点击量
  clickRate: number            // CTR
  conversions: number          // 转化数
  conversionRate: number       // 转化率
  engagementRate: number       // 互动率
  shareCount: number           // 分享数
  commentCount: number         // 评论数
  likeCount: number            // 点赞数
  avgEngagementTime: number    // 平均互动时长(秒)
  bounceRate: number           // 跳出率
  costPerClick: number         // CPC
  costPerMille: number         // CPM
  returnOnAdSpend: number      // ROAS
}

// 渠道归因
interface ChannelAttribution {
  channel: string
  channelName: string          // 中文名
  touchpoints: number
  attributedRevenue: number
  attributedConversions: number
}

// 品牌健康度 (0-100)
interface BrandHealthScore {
  overallScore: number
  dimensions: {
    awareness:    { score, trend, description }
    engagement:   { score, trend, description }
    reputation:   { score, trend, description }
    loyalty:      { score, trend, description }
    content:      { score, trend, description }
  }
}

// ROI 结果
interface ROICalculation {
  brandId: string
  totalCost: number
  totalRevenue: number
  roi: number           // 百分比
  roas: number          // 倍数
  netProfit: number
}
```

### 新增端点请求/响应

#### 综合查询
```bash
GET /brand-analytics/analytics/:brandId?startDate=2026-01-01&endDate=2026-12-31&granularity=month
```
返回 `{ kpis, attribution, mentions, health, content }` 全部维度。

#### 品牌对比
```bash
POST /brand-analytics/compare
{ "brandIds": ["brand-1","brand-2"], "startDate": "2026-01-01", "endDate": "2026-12-31" }
```

#### 竞品对比
```bash
POST /brand-analytics/competitors
{ "brandId": "brand-1", "competitorIds": ["comp-1","comp-2"], "startDate": "2026-01-01", "endDate": "2026-12-31" }
```

#### 热门内容
```bash
GET /brand-analytics/top-content/:brandId?contentType=video&platform=douyin&startDate=2026-01-01&endDate=2026-12-31
```

#### 健康度趋势
```bash
GET /brand-analytics/health/:brandId/trend?months=6
```

#### 内容建议
```bash
GET /brand-analytics/content-suggestions/:contentId
```

═══════════════════════════════════════
箍五: 配置项
═══════════════════════════════════════

| 配置 | 值 | 说明 |
|------|-----|------|
| 模拟渠道数 | 7 个 | social/search/email/display/direct/referral/organic |
| 归因模型 | 5 种 | first_touch/last_touch/linear/time_decay/position_based |
| 健康度维度 | 5 个 | awareness/engagement/reputation/loyalty/content |
| 支持平台 | 6 个 | weibo/douyin/xiaohongshu/bilibili/wechat/zhihu |
| 报告类型 | 4 种 | daily/weekly/monthly/quarterly |
| 默认健康度 | 78 分 | 初始化 default 数据 |
| 内容类型 | 5 种 | image/video/article/live/audio |
| 粒度选项 | 3 种 | day/week/month |
| 守卫类型 | TrafficGovernanceGuard | 流量治理守卫 |

> 当前使用内存 Map 存储模拟数据，生产环境应接入数据库/数据仓库。

═══════════════════════════════════════
箍六: 依赖关系
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `TrafficGovernanceGuard` | 流量治理守卫 |
| 上游依赖 | `class-validator` / `class-transformer` | DTO 校验 |
| 内部依赖 | `BrandAnalyticsService` | 所有业务逻辑 |
| 下游消费 | 无（独立模块） | 暂不对外暴露 |

═══════════════════════════════════════
箍七: 使用示例
═══════════════════════════════════════

### KPI 查询

```bash
curl "http://localhost:3000/api/brand-analytics/kpi/brand-1?startDate=2026-01-01&endDate=2026-07-29" \
  -H "x-identity-id: user-demo"
```

### KPI 记录

```bash
curl -X POST http://localhost:3000/api/brand-analytics/kpi \
  -H "Content-Type: application/json" \
  -H "x-identity-id: user-demo" \
  -d '{
    "brandId": "brand-1",
    "tenantId": "tenant-demo",
    "metrics": {
      "impressions": 50000,
      "clicks": 2500,
      "clickRate": 5.0,
      "conversions": 150,
      "conversionRate": 6.0,
      "engagementRate": 3.2,
      "shareCount": 320,
      "commentCount": 180,
      "likeCount": 1200,
      "avgEngagementTime": 45,
      "bounceRate": 35.5,
      "costPerClick": 2.5,
      "costPerMille": 15.0,
      "returnOnAdSpend": 3.8
    }
  }'
```

### 品牌健康度

```bash
curl http://localhost:3000/api/brand-analytics/health/brand-1 \
  -H "x-identity-id: user-demo"
```

### ROI 计算

```bash
curl "http://localhost:3000/api/brand-analytics/roi/brand-1?startDate=2026-01-01&endDate=2026-07-29" \
  -H "x-identity-id: user-demo"
```

### 生成报告

```bash
curl -X POST http://localhost:3000/api/brand-analytics/report/brand-1 \
  -H "Content-Type: application/json" \
  -H "x-identity-id: user-demo" \
  -d '{"reportType": "monthly"}'
```

### 市场占比

```bash
curl http://localhost:3000/api/brand-analytics/market-share \
  -H "x-identity-id: user-demo"
```

### 综合查询

```bash
curl "http://localhost:3000/api/brand-analytics/analytics/brand-1?startDate=2026-01-01&endDate=2026-12-31&granularity=month" \
  -H "x-identity-id: user-demo"
```

### 品牌对比

```bash
curl -X POST http://localhost:3000/api/brand-analytics/compare \
  -H "Content-Type: application/json" \
  -H "x-identity-id: user-demo" \
  -d '{"brandIds": ["brand-1","brand-2"], "startDate": "2026-01-01", "endDate": "2026-12-31"}'
```

### 竞品对比

```bash
curl -X POST http://localhost:3000/api/brand-analytics/competitors \
  -H "Content-Type: application/json" \
  -H "x-identity-id: user-demo" \
  -d '{"brandId": "brand-1", "competitorIds": ["comp-1","comp-2"], "startDate": "2026-01-01", "endDate": "2026-12-31"}'
```

### 热门内容

```bash
curl "http://localhost:3000/api/brand-analytics/top-content/brand-1?contentType=video&platform=douyin&startDate=2026-01-01&endDate=2026-12-31" \
  -H "x-identity-id: user-demo"
```

### 健康度趋势

```bash
curl "http://localhost:3000/api/brand-analytics/health/brand-1/trend?months=6" \
  -H "x-identity-id: user-demo"
```

### 内容建议

```bash
curl "http://localhost:3000/api/brand-analytics/content-suggestions/content-1" \
  -H "x-identity-id: user-demo"
```

═══════════════════════════════════════
箍八: 测试状态
═══════════════════════════════════════

| 测试文件 | 覆盖范围 | Tests |
|----------|----------|-------|
| `brand-analytics.service.spec.ts` | KPI / 归因 / 声量 / 健康度 / 内容 / 报告 / ROI / 市场占比 / 综合查询 | ✅ |
| `brand-analytics.controller.spec.ts` | 全部 21 端点路由绑定（含 V24 Phase1 新增 7 端点） | ✅ |
| `brand-analytics.dto.spec.ts` | 13 个 DTO 类：日期格式 / 必填字段 / 枚举 / 边界 / 数组长度 | ✅ |
| `__tests__/brand-analytics.e2e-spec.ts` | 8 业务域 14 组完整链路集成测试 | ✅ |

═══════════════════════════════════════
箍九: 迭代历史
═══════════════════════════════════════

| 阶段 | 内容 | 日期 |
|------|------|------|
| V24 Phase1 | 新增 7 端点：综合查询 / 品牌对比 / 竞品对比 / 热门内容 / 健康度趋势 / 内容建议；DTO 扩充至 13 个；ACCEPTANCE.md 补全 | 2026-07-29 |
| 初始发布 | 14 端点基础功能：KPI / 归因 / 声量 / 健康度 / 内容 / 报告 / ROI / 市场占比 | 2026-07 |
