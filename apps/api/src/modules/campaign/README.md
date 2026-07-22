# Campaign · 营销活动模块

基于事件驱动的营销活动系统，支持条件匹配、自动触发与多类型动作分发（积分/券/盲盒/标签推荐）。

## 核心功能

1. **活动注册与管理** — 创建/更新/查询活动计划，支持 `DRAFT` → `SCHEDULED` → `ACTIVE` → `PAUSED` → `COMPLETED` 全生命周期
2. **事件触发引擎** — 监听 `payment.success` / `order.created` / `member.profile-synced` / `member.activity-recurring` 等业务事件，自动匹配符合条件的活动
3. **条件评估** — 支持 `MIN_ORDER_AMOUNT` / `MEMBER_LEVEL` / `STORE_SCOPE` / `BRAND_SCOPE` 四类条件匹配，支持多条件组合
4. **动作分发** — 匹配成功后自动执行 `AWARD_POINTS` / `ISSUE_COUPON` / `ISSUE_BLINDBOX` / `RECOMMEND_TAG` 等营销动作
5. **频次控制** — 同用户 + 同触发事件每日 ≤ 1 次，防止过度营销

## 主要依赖

| 组件 | 职责 |
|---|---|
| `CampaignController` | REST 路由层：`POST /campaigns` 注册、`GET /campaigns` 列表、`PATCH /campaigns/:id/status` 状态变更 |
| `CampaignService` | 核心业务：活动注册、条件评估、动作执行、触发匹配 |
| `CampaignTriggerService` | 事件驱动触发器：订阅 EventBus → 转换事件 → 调用 evaluateTriggers → dispatch 动作 |
| `MemberService` (imported) | 会员数据查询 |
| `LoyaltyService` (imported) | 积分发放与查询 |
| `MarketingMetricsService` (imported) | 营销指标统计 |
| `EventBusService` (infrastructure) | 事件订阅/发布基础设施 |

## 配置项

无独立模块配置项，依赖 `MemberModule` / `LoyaltyModule` / `MarketingMetricsModule`。

## 文件结构

```
campaign/
├── campaign.module.ts           # NestJS 模块定义
├── campaign.controller.ts       # REST 控制器
├── campaign.service.ts          # 核心活动服务（注册/评估/触发/分发）
├── trigger.service.ts           # 事件触发器（EventBus 包装）
├── campaign.dto.ts              # 请求/响应 DTO
├── campaign.entity.ts           # 实体/枚举/接口定义
│   ├── CampaignStatus           # DRAFT | SCHEDULED | ACTIVE | PAUSED | COMPLETED
│   ├── CampaignTrigger          # 4 种触发事件
│   ├── CampaignActionKind       # AWARD_POINTS | ISSUE_COUPON | ISSUE_BLINDBOX | RECOMMEND_TAG
│   ├── CampaignConditionType    # 4 种条件类型
│   └── CampaignDispatch         # 分发票据模型
├── campaign.contract.ts         # 对外合约接口
├── campaign.simulator.test.ts   # 模拟器测试
├── campaign-ringbeam.test.ts    # Ring Beam 集成测试
├── *.spec.ts / *.test.ts        # 单元/集成测试
└── *.e2e.test.ts                # E2E 测试
```

## API 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/campaigns` | 注册新活动 |
| GET | `/campaigns` | 查询活动列表 |
| GET | `/campaigns/:id` | 获取活动详情 |
| PATCH | `/campaigns/:id/status` | 更新活动状态 |
| POST | `/campaigns/evaluate` | 模拟触发条件评估 |

所有端点通过 `TenantGuard` 守卫，支持 `x-tenant-id` 多租户隔离。

## P-38 财务冲刺

- **盲盒履约** — ISSUE_BLINDBOX 动作直接关联盲盒 SKU 履约转化
- **积分经济** — AWARD_POINTS 驱动会员活跃与复购
- **券效率** — ISSUE_COUPON 配合折扣配置提升核销率

---

> Phase-17 T5 · Pulse-68
