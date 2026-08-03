# AI 营销模块 (AIMarketing)

═══════════════════════════════════════
箍一: 模块职责边界声明
═══════════════════════════════════════

本模块提供 AI 驱动的营销决策支持能力，模拟"营销参谋/CMO 助理"角色，为运营团队提供数据驱动的营销策略建议:

- **ROI 分析** — 活动级 ROI 计算、跨活动对比、新活动 ROI 预测、最优预算分配
- **文案助手** — 营销文案自动生成、标题优化、多语言本地化、A/B 测试变体生成、批量生成
- **活动规划** — 活动类型推荐、时间线规划、渠道触达预估
- **综合分析** — 营销全景分析、归因分析、漏斗分析、预算模拟、同群分析、竞争对手分析、季节性趋势
- **智能优化** — 活动性能概览、智能竞价优化、受众分群推荐、创意素材性能、频控建议、预算节奏分析、CPA 优化

边界约束:
- ❌ 不处理实际的广告投放或渠道对接（仅在内部模拟计算）
- ❌ 不处理用户画像或 CRM 数据管理（见 `member` / `user` 模块）
- ❌ 不依赖外部 AI API（使用本地规则引擎模拟 AI 推理）
- ✅ 聚焦营销决策分析的算法与策略层

═══════════════════════════════════════
箍二: 核心功能列表
═══════════════════════════════════════

| 功能 | 端点 | 描述 | 状态 |
|------|------|------|------|
| 单活动 ROI | `POST /ai-marketing/roi/calculate` | 计算单个营销活动的 ROI、利润率 | ✅ IMPLEMENTED |
| 多活动对比 | `POST /ai-marketing/roi/compare` | 对比多个活动的 ROI 表现 | ✅ IMPLEMENTED |
| ROI 预测 | `POST /ai-marketing/roi/project` | 根据预算/CPM/CTR/转化率预测新活动 ROI | ✅ IMPLEMENTED |
| 预算分配 | `POST /ai-marketing/roi/budget-allocation` | 按活动类型推荐最优渠道预算配比 | ✅ IMPLEMENTED |
| 文案生成 | `POST /ai-marketing/copy/generate` | 根据产品/目标/受众/语气生成营销文案 | ✅ IMPLEMENTED |
| 批量文案生成 | `POST /ai-marketing/copy/generate-batch` | 批量生成多条营销文案（含元信息） | ✅ IMPLEMENTED |
| 标题优化 | `POST /ai-marketing/copy/optimize-headline` | 优化标题文案 | ✅ IMPLEMENTED |
| 文案本地化 | `POST /ai-marketing/copy/localize` | 将文案本地化为指定语言/地区 | ✅ IMPLEMENTED |
| A/B 测试变体 | `POST /ai-marketing/copy/ab-test` | 为同一 brief 生成多个 A/B 测试变体 | ✅ IMPLEMENTED |
| 活动类型推荐 | `POST /ai-marketing/campaign/suggest` | 根据目标/预算/受众推荐活动类型 | ✅ IMPLEMENTED |
| 时间线规划 | `POST /ai-marketing/campaign/timeline` | 生成营销活动执行时间线 | ✅ IMPLEMENTED |
| 触达预估 | `POST /ai-marketing/campaign/reach-estimate` | 按受众规模+渠道预估触达和曝光 | ✅ IMPLEMENTED |
| 综合分析 | `POST /ai-marketing/analyze` | 聚合 ROI + 时间线 + 触达的全面分析 | ✅ IMPLEMENTED |
| 归因分析 | `POST /ai-marketing/analytics/attribution` | 跨活动渠道归因分析 | ✅ IMPLEMENTED |
| 漏斗分析 | `POST /ai-marketing/analytics/funnel` | 营销漏斗各阶段转化分析 | ✅ IMPLEMENTED |
| 预算模拟 | `POST /ai-marketing/analytics/budget-simulation` | 不同预算分配策略模拟 | ✅ IMPLEMENTED |
| 同群分析 | `GET /ai-marketing/analytics/cohort` | 用户同群留存/转化分析 | ✅ IMPLEMENTED |
| 竞争对手分析 | `GET /ai-marketing/analytics/competitive` | 市场竞品营销策略分析 | ✅ IMPLEMENTED |
| 季节性趋势 | `GET /ai-marketing/analytics/seasonal-trends` | 行业季节性营销趋势 | ✅ IMPLEMENTED |
| AI 建议 | `GET /ai-marketing/analytics/suggestions` | AI 生成的营销优化建议 | ✅ IMPLEMENTED |
| 活动性能 | `GET /ai-marketing/optimizer/performance/:campaignId` | 活动性能关键指标概览 | ✅ IMPLEMENTED |
| 竞价优化 | `POST /ai-marketing/optimizer/bid` | 智能实时竞价出价优化 | ✅ IMPLEMENTED |
| 受众分群 | `GET /ai-marketing/optimizer/audience-segments/:campaignId` | 受众分群推荐 | ✅ IMPLEMENTED |
| 创意性能 | `POST /ai-marketing/optimizer/creative-performance` | 创意素材效果分析 | ✅ IMPLEMENTED |
| 频控建议 | `GET /ai-marketing/optimizer/frequency-cap/:campaignId` | 曝光频次控制建议 | ✅ IMPLEMENTED |
| 预算节奏 | `POST /ai-marketing/optimizer/budget-pacing` | 预算消耗节奏分析与预警 | ✅ IMPLEMENTED |
| CPA 优化 | `POST /ai-marketing/optimizer/cpa` | 单客户获取成本优化建议 | ✅ IMPLEMENTED |
| 跨渠道频控 | `POST /ai-marketing/optimizer/channel-frequency` | 跨渠道频控报告 | ✅ IMPLEMENTED |
| 模块统计 | `GET /ai-marketing/stats` | 模块内所有活动概览统计 | ✅ IMPLEMENTED |

═══════════════════════════════════════
箍三: 架构说明 — 目录结构
═══════════════════════════════════════

```
apps/api/src/modules/ai-marketing/
├── ai-marketing.module.ts                — NestJS 模块定义, 导出 6 个子服务
├── ai-marketing.controller.ts            — REST 控制器 (29 端点)
├── ai-marketing.service.ts               — 聚合服务: 统一暴露子服务 API
├── ai-marketing.dto.ts                   — class-validator DTO (20+ 请求/响应 DTO)
├── ai-marketing.entity.ts                — 实体类型定义
├── ai-marketing.contract.ts              — 跨模块合约类型
│
├── ai-marketing-cmo.service.ts           — CMO 服务: MarketingROIService / CopywritingAssistant / CampaignPlanner
├── ai-marketing-analytics.service.ts     — 营销分析服务: 归因/漏斗/同群/预算模拟
├── ai-marketing-campaign-optimizer.service.ts — 活动优化服务: 竞价/频控/预算节奏/CPA
│
├── ai-marketing.controller.spec.ts       — 控制器单元测试
├── ai-marketing.controller.test.ts       — 控制器测试
├── ai-marketing.controller.extended.test.ts — 控制器扩展测试
├── ai-marketing.dto.test.ts              — DTO 校验测试
├── ai-marketing.entity.test.ts           — 实体测试
├── ai-marketing.contract.test.ts         — 合约测试
├── ai-marketing.module.test.ts           — 模块测试
├── ai-marketing.service.test.ts          — 服务层测试
├── ai-marketing.service.spec.ts          — 服务层 spec
├── ai-marketing.service.spec.deep.ts     — 服务层深度 spec
├── ai-marketing.e2e.test.ts              — E2E 端到端测试
├── ai-marketing.e2e.enhanced.test.ts     — 增强 E2E 测试
├── ai-marketing.role.test.ts             — 角色权限测试
├── ai-marketing.role-extended.test.ts    — 角色权限扩展测试
├── ai-marketing.role-scenario.test.ts    — 角色场景测试
├── ai-marketing.ringbeam.test.ts         — RingBeam 集成测试
├── ai-marketing.cmo.test.ts              — CMO 服务功能测试
├── ai-marketing-cmo-spec.ts              — CMO 服务 spec
├── ai-marketing.cmo-comprehensive.test.ts— CMO 全面测试
├── ai-marketing-analytics.spec.ts        — 分析服务 spec
├── ai-marketing-service-test.ts          — 综合服务测试
└── ai-finish.test.ts                     — 完结验证测试
```

═══════════════════════════════════════
箍四: 关键接口 / 数据结构
═══════════════════════════════════════

### REST 端点

| 方法 | 路由 | 认证 | 描述 |
|------|------|------|------|
| POST | `/ai-marketing/roi/calculate` | TenantGuard | 单活动 ROI |
| POST | `/ai-marketing/roi/compare` | TenantGuard | 多活动 ROI 对比 |
| POST | `/ai-marketing/roi/project` | TenantGuard | 新活动 ROI 预测 |
| POST | `/ai-marketing/roi/budget-allocation` | TenantGuard | 最优预算分配 |
| POST | `/ai-marketing/copy/generate` | TenantGuard | 文案生成 |
| POST | `/ai-marketing/copy/generate-batch` | TenantGuard | 批量文案生成 |
| POST | `/ai-marketing/copy/optimize-headline` | TenantGuard | 标题优化 |
| POST | `/ai-marketing/copy/localize` | TenantGuard | 文案本地化 |
| POST | `/ai-marketing/copy/ab-test` | TenantGuard | A/B 测试变体生成 |
| POST | `/ai-marketing/campaign/suggest` | TenantGuard | 活动类型推荐 |
| POST | `/ai-marketing/campaign/timeline` | TenantGuard | 活动时间线规划 |
| POST | `/ai-marketing/campaign/reach-estimate` | TenantGuard | 触达预估 |
| POST | `/ai-marketing/analyze` | TenantGuard | 综合分析 |
| POST | `/ai-marketing/analytics/attribution` | TenantGuard | 归因分析 |
| POST | `/ai-marketing/analytics/funnel` | TenantGuard | 漏斗分析 |
| POST | `/ai-marketing/analytics/budget-simulation` | TenantGuard | 预算分配模拟 |
| GET  | `/ai-marketing/analytics/cohort` | TenantGuard | 同群分析 |
| GET  | `/ai-marketing/analytics/competitive` | TenantGuard | 竞争对手分析 |
| GET  | `/ai-marketing/analytics/seasonal-trends` | TenantGuard | 季节性趋势 |
| GET  | `/ai-marketing/analytics/suggestions` | TenantGuard | AI 营销建议 |
| GET  | `/ai-marketing/optimizer/performance/:campaignId` | TenantGuard | 活动性能概览 |
| POST | `/ai-marketing/optimizer/bid` | TenantGuard | 竞价优化 |
| GET  | `/ai-marketing/optimizer/audience-segments/:campaignId` | TenantGuard | 受众分群推荐 |
| POST | `/ai-marketing/optimizer/creative-performance` | TenantGuard | 创意素材性能 |
| GET  | `/ai-marketing/optimizer/frequency-cap/:campaignId` | TenantGuard | 频控建议 |
| POST | `/ai-marketing/optimizer/budget-pacing` | TenantGuard | 预算节奏分析 |
| POST | `/ai-marketing/optimizer/cpa` | TenantGuard | CPA 优化 |
| POST | `/ai-marketing/optimizer/channel-frequency` | TenantGuard | 跨渠道频控报告 |
| GET  | `/ai-marketing/stats` | TenantGuard | 模块概览统计 |

### 核心数据结构

```typescript
// ROI 结果
interface ROIResult {
  campaignId: string
  revenue: number       // 营收
  cost: number          // 成本
  roi: number           // ROI 比率
  roiPercent: number    // ROI 百分比 (保留2位小数)
  profit: number        // 利润
  isPositive: boolean   // 是否盈利
}

// 文案生成结果
interface GeneratedCopy {
  headline: string      // 标题
  body: string          // 正文
  cta: string           // 行动号召
  taglines: string[]    // 标语列表
}

// 文案生成指令
interface CopyBrief {
  product: string                        // 产品名称
  goal: 'awareness' | 'conversion' | 'retention' | 're-engagement'  // 目标
  audience: string                       // 目标受众描述
  tone?: 'formal' | 'casual' | 'humorous' | 'inspirational'  // 语气
  length?: 'short' | 'medium' | 'long'  // 长度
  cta?: string                           // 自定义行动号召
}

// 活动类型 / 渠道枚举
type CampaignType = 'brand' | 'performance' | 'social' | 'email' | 'promotion' | 'kOL'
type Channel = 'wechat' | 'weibo' | 'douyin' | 'xiaohongshu' | 'bilibili' | 'offline' | 'email' | 'sms'
```

═══════════════════════════════════════
箍五: 配置项
═══════════════════════════════════════

| 配置 | 值 | 说明 |
|------|-----|------|
| 模拟活动数 | 5 个 (camp-001 ~ camp-005) | 内置模拟数据集 |
| 支持渠道 | 8 个 | wechat/weibo/douyin/xiaohongshu/bilibili/offline/email/sms |
| 支持活动类型 | 6 个 | brand/performance/social/email/promotion/kOL |
| 本地化语言 | 4 个 | zh-CN/zh-TW/en-US/ja-JP |

> 当前使用模拟数据 (`MOCK_CAMPAIGNS` Map 和 `CHANNEL_CPM` 定价表), 生产环境应接入真实营销数据源。

═══════════════════════════════════════
箍六: 依赖关系
═══════════════════════════════════════

| 依赖方向 | 模块/组件 | 说明 |
|----------|-----------|------|
| 上游依赖 | `agent/tenant.guard` | 多租户守卫, 所有端点使用 |
| 上游依赖 | `class-validator` / `class-transformer` | DTO 校验 (whitelist + transform) |
| 内部依赖 | `MarketingROIService` | ROI 计算、对比、预测、预算分配 |
| 内部依赖 | `CopywritingAssistant` | 文案生成、优化、本地化、A/B 测试 |
| 内部依赖 | `CampaignPlanner` | 活动规划、时间线、触达预估 |
| 内部依赖 | `AIMarketingCMOService` | CMO 综合策略分析 |
| 内部依赖 | `MarketingAnalyticsService` | 归因/漏斗/同群/竞争/趋势分析 |
| 内部依赖 | `CampaignOptimizerService` | 竞价/频控/预算节奏/CPA 优化 |

═══════════════════════════════════════
箍七: 使用示例
═══════════════════════════════════════

### 单活动 ROI 计算

```bash
curl -X POST http://localhost:3000/api/ai-marketing/roi/calculate \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{"campaignId": "camp-001"}'
```

### 文案生成

```bash
curl -X POST http://localhost:3000/api/ai-marketing/copy/generate \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{
    "product": "夏季冰咖啡",
    "goal": "conversion",
    "audience": "25-35岁白领女性",
    "tone": "casual",
    "length": "short",
    "cta": "立即领取新品券"
  }'
```

### ROI 预测

```bash
curl -X POST http://localhost:3000/api/ai-marketing/roi/project \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{
    "type": "performance",
    "budget": 50000,
    "expectedCPM": 100,
    "expectedCTR": 2.5,
    "expectedConversionRate": 3.0,
    "averageOrderValue": 120
  }'
```

### A/B 测试变体生成

```bash
curl -X POST http://localhost:3000/api/ai-marketing/copy/ab-test \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo" \
  -d '{
    "brief": "618年中大促满减活动",
    "count": 3
  }'
```

### 模块统计概览

```bash
curl http://localhost:3000/api/ai-marketing/stats \
  -H "x-tenant-id: tenant-demo"
```

### 代码中注入

```typescript
@Injectable()
export class SomeService {
  constructor(
    private readonly marketingService: AiMarketingService,
  ) {}

  async analyzeCampaign(campaignId: string) {
    const roi = await this.marketingService.calculateCampaignROI(campaignId)
    const suggestions = await this.marketingService.analyzeMarketing(campaignId)
    return { roi, suggestions }
  }
}
```

### 运行测试

```bash
# AI 营销模块全量测试
npx jest apps/api/src/modules/ai-marketing/ai-marketing.controller.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.service.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.dto.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.e2e.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.role.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.cmo.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.ringbeam.test.ts
```
