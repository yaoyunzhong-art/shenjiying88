# 活动效果评估模块 (Campaign Performance)

营销活动效果的评估与统计分析模块，提供活动创建、效果查询、ROI 计算、多维度汇总等功能。

## 一、模块概述

**业务定位**: 连锁门店场景下的营销活动效果评估子系统，支撑运营团队追踪各类型营销活动的投入产出比，为活动决策提供数据依据。

**业务目标**:
- 统一管理门店各类营销活动（折扣/优惠券/抽奖/新人/会员）
- 实时查询活动效果指标（参与人数、新增会员、营收、ROI）
- 多维度汇总分析，支持按门店/类型/时间筛选

**核心能力**:
| 能力 | 说明 |
|------|------|
| 活动管理 | 创建、查询、列表筛选（类型/状态/时间/门店） |
| 效果评估 | 自动计算 ROI（营收 / 成本 × 100%） |
| 汇总统计 | 总预算/总成本/总营收/平均 ROI/参与人数/新增会员 |

**模块依赖**:
- `PrismaModule` — 数据库访问（当前使用 Mock 数据，可切换）
- `TenantGuard` — 多租户隔离守卫
- Swagger (`@nestjs/swagger`) — API 文档自动生成

---

## 二、架构图

```
                          ┌──────────────────────────────────────────┐
                          │         CampaignPerformanceModule         │
                          │                                           │
                          │  ┌─────────────────────────────────────┐  │
                          │  │        CampaignPerformanceController │  │
                          │  │                                     │  │
                          │  │  GET  /campaign-performance         │  │
                          │  │  GET  /campaign-performance/summary │  │
                          │  │  GET  /campaign-performance/:id     │  │
                          │  │  POST /campaign-performance         │  │
                          │  └──────────────┬──────────────────────┘  │
                          │                 │                         │
                          │  ┌──────────────▼──────────────────────┐  │
                          │  │        CampaignPerformanceService   │  │
                          │  │                                     │  │
                          │  │  ┌────────────┐  ┌───────────────┐  │  │
                          │  │  │ 活动管理     │  │ 效果评估计算   │  │  │
                          │  │  │ listCampaign│  │ computeROI    │  │  │
                          │  │  │ getCampaign │  │ getSummary    │  │  │
                          │  │  │ createCampa.│  │ toPerfDto     │  │  │
                          │  │  └──────┬─────┘  └───────┬───────┘  │  │
                          │  │         │                 │         │  │
                          │  │         └───────┬─────────┘         │  │
                          │  │                 │                   │  │
                          │  │                 ▼                   │  │
                          │  │          ┌──────────┐               │  │
                          │  │          │campaigns │               │  │
                          │  │          │ Map      │               │  │
                          │  │          └──────────┘               │  │
                          │  └────────────────────────────────────┘  │
                          │                                           │
                          │  外部依赖:                                │
                          │    tenants/tenant.guard ── 多租户守卫     │
                          │    prisma/prisma.module ── 数据库访问模块  │
                          └──────────────────────────────────────────┘

数据流:
  列表查询 ──→ GET /?type=discount&status=active
           ──→ Controller 解析 Query DTO
           ──→ Service.listCampaigns(filter)
           ──→ 过滤/排序 records
           ──→ toPerformanceDto() 转换
           ──→ 返回 { items, total, summary }

  创建活动 ──→ POST / { campaignName, type, budget, ... }
           ──→ Controller 解析 Body DTO (ValidationPipe)
           ──→ Service.createCampaign(input)
           ──→ 存入 campaignStore
           ──→ 返回 DTO
```

---

## 三、核心表结构

### CampaignRecord (活动记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 活动 ID，UUID |
| name | string | 活动名称 |
| type | CampaignType | 活动类型（枚举） |
| status | CampaignStatus | 活动状态（枚举） |
| storeId | string | 所属门店 ID |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |
| budget | number | 预算金额（元） |
| cost | number | 实际支出（元） |
| participants | number | 参与人数 |
| newMembers | number | 新增会员数 |
| revenue | number | 营收金额（元） |
| satisfaction | number | 满意度评分（1-5） |
| createdAt / updatedAt | string | 时间戳 |

### CampaignType 枚举

| 枚举值 | 说明 |
|--------|------|
| `discount` | 折扣促销 |
| `coupon` | 优惠券 |
| `lucky_draw` | 抽奖活动 |
| `new_user` | 新用户活动 |
| `vip` | 会员专属 |

### CampaignStatus 枚举

| 枚举值 | 说明 |
|--------|------|
| `planned` | 计划中 |
| `active` | 进行中 |
| `completed` | 已完成 |
| `cancelled` | 已取消 |

### ROI 计算方式

```
ROI = (revenue / cost) × 100%

示例:
  revenue = 100,000, cost = 20,000
  ROI = 500%
```

---

## 四、关键 API / Service 接口

### REST API (Controller)

| 方法 | 路径 | 查询/请求体 | 返回 | 说明 |
|------|------|-------------|------|------|
| GET | `/campaign-performance` | `CampaignQueryDto` | `CampaignPerformanceListDto` | 活动列表 + 汇总（支持过滤） |
| GET | `/campaign-performance/summary` | `CampaignQueryDto` | `CampaignSummaryDto` | 仅返回汇总数据 |
| GET | `/campaign-performance/:id` | `:id` | `CampaignPerformanceDto \| null` | 单条活动详情 |
| POST | `/campaign-performance` | `CreateCampaignDto` | `CampaignPerformanceDto` | 创建活动记录 |

### CampaignQueryDto 过滤条件

| 字段 | 类型 | 说明 |
|------|------|------|
| storeId | string? | 门店 ID |
| startDate | string? | 开始日期下限 |
| endDate | string? | 结束日期上限 |
| campaignType | CampaignType? | 活动类型 |
| status | CampaignStatus? | 活动状态 |

### CampaignPerformanceService

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `listCampaigns(filter?)` | `CampaignQueryDto` | `CampaignRecord[]` | 列表查询（含过滤+排序） |
| `getCampaign(id)` | `string` | `CampaignRecord \| undefined` | 单条详情 |
| `getSummary(filter?)` | `CampaignQueryDto` | `{totalCampaigns, totalBudget, totalCost, totalRevenue, avgROI, totalParticipants, newMembersAcquired}` | 汇总统计 |
| `createCampaign(input)` | `CreateCampaignDto` | `CampaignRecord` | 创建活动 |

---

## 五、配置 / 部署 / 测试指引

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| 无 | 当前模块无额外环境变量 | — |

### 模块注册

```typescript
// 在 feature 模块中引入
import { CampaignPerformanceModule } from './campaign-performance/campaign-performance.module'

@Module({
  imports: [CampaignPerformanceModule],
})
export class FeatureModule {}
```

### 测试命令

```bash
# 运行全部测试
cd apps/api && npx jest campaign-performance

# 运行角色扩展测试
cd apps/api && npx jest campaign-performance.role-extended

# 运行基础测试
cd apps/api && npx jest campaign-performance.test

# 带覆盖率报告
cd apps/api && npx jest campaign-performance --coverage
```

### 测试文件说明

| 文件 | 类型 | 覆盖范围 |
|------|------|----------|
| `campaign-performance.test.ts` | 单元测试 | Service 核心逻辑（CRUD/ROI/汇总） |
| `campaign-performance.role-extended.test.ts` | 角色扩展测试 | 多角色权限场景 |

### 部署注意事项

- 当前使用 `Map<string, CampaignRecord>` 内存存储，`seedMockCampaigns()` 在首次调用时自动注入 Mock 数据
- 引入 `PrismaModule` 但尚未切换为实际数据库——需替换 `listCampaigns`/`createCampaign` 等方法的存储逻辑
- 所有端点受 `TenantGuard` 保护，需在请求头传递 `x-tenant-id` 或通过其他机制注入租户信息
- `ValidationPipe` 已启用 `whitelist: true`，自动剔除多余字段
