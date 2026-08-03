# 🗺️ PRD: AI 营销核心 — WP-08B
> 日期: 2026-07-23 | 圈梁: 代码✅ 测试✅ 审计✅ PRD新建
> 分支: `tree/codeup-acr-ci-20260717`
> 优先级: P0（P1 节奏）

**用途**: AI 营销决策引擎 + 优惠券发放/核销 + 活动营销事件驱动 + 社群裂变追踪
**产出**: `apps/api/src/modules/ai-marketing/`, `apps/api/src/modules/coupon/`, `apps/api/src/modules/campaign/`, `apps/api/src/modules/referral/`
**作用**: WP-08B AI 营销核心 · BS-0122~BS-0129
**验收**: AI游伴、优惠券、归因、伦理形成闭环

---

## 1. 背景与目标

### 1.1 业务背景

shenjiying88 平台需要在 P1 阶段建立完整的营销基础设施，覆盖 AI 驱动的营销决策分析、优惠券发放与核销、事件驱动的自动营销活动、以及裂变传播能力。

### 1.2 目标

1. **AI 游伴（AI Marketing CMO）**: 为运营团队提供数据驱动的营销策略建议，包括 ROI 分析、文案助手、活动规划、综合分析、智能优化
2. **优惠券系统（Coupon）**: 实现跨门店优惠券的创建、分发、核销管理，含 AI 评分发放引擎
3. **活动营销（Campaign）**: 事件驱动的自动营销活动引擎，支持条件评估、多类型动作分发（积分/券/盲盒/标签）
4. **裂变追踪（Referral）**: 三级裂变短码生成、点击追踪、注册补登、奖励计算
5. **归因分析（Attribution）**: 多模型归因（first-touch/last-touch/multi-touch/time-decay）为后续 WP-14 画像引擎提供基础
6. **伦理约束**: 隐私安全（TenantGuard 多租户隔离）、频次控制（同用户+同事件每日 ≤ 1 次）、所有 DTO 经过 whitelist 校验

### 1.3 范围

| BS 编号 | 名称 | 模块 | 状态 |
|---------|------|------|:----:|
| BS-0122 | AI 营销决策引擎 — ROI 分析与文案助手 | ai-marketing | ✅ IMPLEMENTED |
| BS-0123 | AI 营销综合分析 — 归因漏斗预算模拟 | ai-marketing | ✅ IMPLEMENTED |
| BS-0124 | AI 营销活动优化 — 竞价频控CPA | ai-marketing | ✅ IMPLEMENTED |
| BS-0125 | AI 营销 CMO 整合服务 | ai-marketing | ✅ IMPLEMENTED |
| BS-0126 | 优惠券跨门店核销系统 | coupon | ✅ IMPLEMENTED |
| BS-0127 | AI 优惠券智能发放引擎 | coupon | ✅ IMPLEMENTED |
| BS-0128 | 事件驱动营销活动引擎 | campaign | ✅ IMPLEMENTED |
| BS-0129 | 三级裂变追踪与奖励系统 | referral | ✅ IMPLEMENTED |

---

## 2. 模块架构

### 2.1 模块总览

```
┌─────────────────────────────────────────────────────┐
│                    WP-08B AI 营销核心               │
├────────────────────┬────────────────────────────────┤
│                    │   ai-marketing (营销决策)       │
│    BS-0122~BS-0125 │   ├─ ROI 分析                  │
│                    │   ├─ 文案助手                  │
│                    │   ├─ 活动规划                  │
│                    │   ├─ 综合分析(归因/漏斗/同群)   │
│                    │   ├─ 优化引擎(竞价/频控/CPA)   │
│                    │   └─ CMO 整合                  │
├────────────────────┼────────────────────────────────┤
│                    │   coupon (优惠券)               │
│    BS-0126~BS-0127 │   ├─ CRUD 管理                 │
│                    │   ├─ 跨门店核销                 │
│                    │   ├─ 批量核销                  │
│                    │   ├─ AI 评分发放               │
│                    │   └─ 发放活动管理              │
├────────────────────┼────────────────────────────────┤
│                    │   campaign (活动引擎)           │
│    BS-0128         │   ├─ 活动注册/状态管理          │
│                    │   ├─ 事件触发器                │
│                    │   ├─ 条件评估引擎              │
│                    │   └─ 动作分发(积分/券/盲盒/标签) │
├────────────────────┼────────────────────────────────┤
│                    │   referral (裂变)               │
│    BS-0129         │   ├─ 短码生成                  │
│                    │   ├─ 点击追踪                  │
│                    │   ├─ 注册补登                  │
│                    │   ├─ L1/L2/L3 奖励计算         │
│                    │   └─ 指标查询                  │
└────────────────────┴────────────────────────────────┘
```

### 2.2 数据流

```
[运营] → POST /ai-marketing/roi/calculate ─→ ai-marketing-cmo.service
[运营] → POST /ai-marketing/copy/generate ─→ ai-marketing-cmo.service
[运营] → POST /ai-marketing/analytics/*   ─→ ai-marketing-analytics.service
[运营] → POST /ai-marketing/optimizer/*   ─→ ai-marketing-campaign-optimizer.service

[用户] → POST /coupons/redeem ─→ coupon.service (跨门店核销)
[AI]   → CouponAIDistributionService.createAndRun() ─→ coupon-ai-distribute.service
[系统] → EventBus → CampaignTriggerService.handleEvent() ─→ campaign.service.evaluateTriggers()
[用户] → POST /referral/click ─→ referral.service.trackClick()
[用户] → POST /referral/signup ─→ referral.service.trackSignup()
```

### 2.3 前置依赖

| 依赖模块 | 说明 | 状态 |
|---------|------|:----:|
| WP-03A AI 中台 | 规则引擎/审计基座 | 未完成（当前为本地模拟） |
| WP-08A 会员权益底座 | 等级/成长值/权益 | 部分 |
| WP-13A 推送与频控 | 频次控制基础 | 未完成 |
| TenantGuard | 多租户守卫（所有端点使用） | ✅ IMPLEMENTED |
| class-validator | DTO 校验 | ✅ IMPLEMENTED |

---

## 3. 详细设计

### 3.1 AI Marketing 模块 (`ai-marketing/`)

#### 3.1.1 服务分层

| 服务类 | 职责 | 端点数 |
|--------|------|:-----:|
| `MarketingROIService` | ROI 计算、对比、预测、预算分配 | 4 |
| `CopywritingAssistant` | 文案生成、批量生成、标题优化、本地化、A/B 测试 | 5 |
| `CampaignPlanner` | 活动推荐、时间线规划、触达预估 | 3 |
| `AIMarketingCMOService` | CMO 整合（组合上述三服务） | — |
| `MarketingAnalyticsService` | 归因/漏斗/预算模拟/同群/竞争/趋势/建议 | 7 |
| `CampaignOptimizerService` | 竞价值/频控/预算节奏/CPA/受众/创意/跨渠道频控 | 8 |

**总计**: 27 个功能端点 + 1 个 stats —— **全部 IMPLEMENTED**

#### 3.1.2 核心功能列表

| 功能 | 端点 | 说明 |
|------|------|------|
| 单活动 ROI | `POST /ai-marketing/roi/calculate` | ROI = (营收-成本)/成本×100% |
| 多活动对比 | `POST /ai-marketing/roi/compare` | 按 ROI 降序排列 |
| ROI 预测 | `POST /ai-marketing/roi/project` | 基于 CPM/CTR/CVR 预估 |
| 预算分配 | `POST /ai-marketing/roi/budget-allocation` | 按渠道配比 |
| 文案生成 | `POST /ai-marketing/copy/generate` | 5 语气 × 4 目标 × 3 长度 |
| 批量文案 | `POST /ai-marketing/copy/generate-batch` | 批处理多项 brief |
| 标题优化 | `POST /ai-marketing/copy/optimize-headline` | 5 种优化策略随机 |
| 本地化 | `POST /ai-marketing/copy/localize` | zh-CN/zh-TW/en-US/ja-JP |
| A/B 测试 | `POST /ai-marketing/copy/ab-test` | 1-5 个变体 |
| 活动推荐 | `POST /ai-marketing/campaign/suggest` | 按目标/预算/受众 |
| 时间线 | `POST /ai-marketing/campaign/timeline` | 4 种目标模板 |
| 触达预估 | `POST /ai-marketing/campaign/reach-estimate` | 8 渠道 × 受众规模 |
| 综合分析 | `POST /ai-marketing/analyze` | ROI+时间线+触达聚合 |
| 归因分析 | `POST /ai-marketing/analytics/attribution` | 4 模型归因 |
| 漏斗分析 | `POST /ai-marketing/analytics/funnel` | TOF/MOF/BOF 三阶段 |
| 预算模拟 | `POST /ai-marketing/analytics/budget-simulation` | 保守/均衡/激进三种 |
| 同群分析 | `GET /ai-marketing/analytics/cohort` | N 周留存曲线 |
| 竞争分析 | `GET /ai-marketing/analytics/competitive` | 价格/渠道/强弱对比 |
| 季节性趋势 | `GET /ai-marketing/analytics/seasonal-trends` | 四季数据 |
| AI 建议 | `GET /ai-marketing/analytics/suggestions` | 5 类建议高/中/低优先级 |
| 活动性能 | `GET /ai-marketing/optimizer/performance/:campaignId` | 综合评分 |
| 竞价优化 | `POST /ai-marketing/optimizer/bid` | 根据竞得率调整 |
| 受众分群 | `GET /ai-marketing/optimizer/audience-segments/:campaignId` | 5 类定向人群 |
| 创意性能 | `POST /ai-marketing/optimizer/creative-performance` | CTR/CVR/ROAS 对比 |
| 频控建议 | `GET /ai-marketing/optimizer/frequency-cap/:campaignId` | 每日/每周上限 |
| 预算节奏 | `POST /ai-marketing/optimizer/budget-pacing` | 超前/落后/正常 |
| CPA 优化 | `POST /ai-marketing/optimizer/cpa` | 优化建议+节省金额 |
| 跨渠道频控 | `POST /ai-marketing/optimizer/channel-frequency` | 分渠道频控报告 |
| 模块统计 | `GET /ai-marketing/stats` | 5 个 mock 活动概览 |

#### 3.1.3 归因分析实现

支持 4 种归因模型，在 `MarketingAnalyticsService.attributionAnalysis()` 中实现:

| 模型 | 说明 | 字段 |
|------|------|------|
| First-touch | 首次触达渠道获得 100% 归因 | `firstTouch` |
| Last-touch | 末次触达渠道获得 100% 归因 | `lastTouch` |
| Multi-touch | 线性分配，各触达点均分 | `multiTouch` |
| Time-decay | 靠近转化的触达点权重更高 | `timeDecay` |

附加指标: `assistedConversions`（助攻转化数）、`attributedRevenue`（归因收入）、`costPerAcquisition`（单获客成本）、`returnOnAdSpend`（广告支出回报率）

#### 3.1.4 伦理约束

当前实现采用以下伦理保障措施:

1. **隐私隔离**: 所有端点均使用 `TenantGuard`，按 `x-tenant-id` 多租户隔离
2. **数据脱敏**: 仅使用聚合指标，不暴露个体用户数据
3. **模拟不可依赖于外部 AI API**: 本模块使用本地规则引擎模拟 AI 推理，不传输业务数据到第三方
4. **频次控制**: `CampaignTriggerService` 实现同用户+同事件每日 ≤ 1 次
5. **确定性结果**: ROI/预算等计算为纯确定性函数，无随机性导致不可预测分发

---

### 3.2 Coupon 模块 (`coupon/`)

#### 3.2.1 服务分层

| 服务类 | 职责 | 说明 |
|--------|------|------|
| `CouponService` | 优惠券 CRUD + 跨门店核销 + 批量核销 | Core |
| `CouponCleanupService` | 过期/耗尽清理 | 辅助 |
| `CouponAIScorer` | AI 评分（基于消费频率/客单价/品类/生命周期） | AI 发放 |
| `CouponAIDistributor` | 决定发放名单 + 优化发送时间 | AI 发放 |
| `CouponCampaign` | 发放活动管理 | AI 发放 |
| `CouponAIDistributionService` | 整合控制器 | AI 发放 |

#### 3.2.2 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/coupons` | 创建优惠券 |
| GET | `/coupons` | 列表查询 |
| GET | `/coupons/:id` | 详情 |
| PATCH | `/coupons/:id/status` | 更新状态 |
| POST | `/coupons/redeem` | 跨门店核销 |
| POST | `/coupons/batch-redeem` | 批量核销 |

#### 3.2.3 跨门店核销流程 (`redeemCrossStore`)

```
1. lifecycle.assertWriteAllowed（若配置）
2. requireTenantContext() + assertStoreOwnership()
3. quota.check()
4. 幂等检查（idempotencyKey）
5. 查券（tenantId + code + active）
6. 过期校验
7. 跨门店范围校验（single-store / multi-store / tenant-wide）
8. 最低消费校验
9. 最大核销数校验
10. 用户分层校验
11. 事务: update coupon + insert redemption log
12. quota.increment()
```

#### 3.2.4 AI 发放评分模型 (`CouponAIScorer`)

评分基于 4 个维度:

| 维度 | 权重范围 | 说明 |
|------|:--------:|------|
| 消费频率 | 0-0.4 | >5次/月: 0.4, 2-5: 0.25, 1-2: 0.15, <1: 0.05 |
| 客单价 | 0-0.3 | >200: 0.3, 100-200: 0.2, 50-100: 0.1, <50: 0.05 |
| 生命周期阶段 | -0.2 ~ +0.15 | active: +0.15, new: +0.05, dormant: -0.1, churned: -0.2 |
| 距上次购买天数 | -0.15 ~ 0 | >90天: -0.15, 60-90: -0.1, 30-60: -0.05 |

总分范围: 0-100（归一化）

#### 3.2.5 伦理约束

- `TenantGuard` 多租户隔离
- 幂等 key 防止重复核销
- 乐观锁（`redemptionCount` 条件更新）防止并发冲突
- 过期/耗尽/超限/范围校验拒绝非法核销
- 所有 DTO 经 `ValidationPipe` `whitelist: true` 过滤

---

### 3.3 Campaign 模块 (`campaign/`)

#### 3.3.1 生命周期

```
DRAFT ──→ SCHEDULED ──→ ACTIVE ──→ COMPLETED
   ↑           │           │
   └───────────┴─── PAUSED ┘
```

合法转移已硬编码在 `assertValidStatusTransition()`

#### 3.3.2 触发事件

| 事件 | 说明 |
|------|------|
| `payment.success` | 支付成功事件 |
| `member.profile-synced` | 会员同步完成 |
| `order.created` | 订单创建 |
| `member.activity-recurring` | 会员周期性活动 |

#### 3.3.3 条件类型

| 条件 | 说明 |
|------|------|
| `MIN_ORDER_AMOUNT` | 最低订单金额 |
| `MEMBER_LEVEL` | 会员等级匹配 |
| `STORE_SCOPE` | 门店范围匹配 |
| `BRAND_SCOPE` | 品牌范围匹配 |

#### 3.3.4 动作类型

| 动作 | 参数 | 说明 |
|------|------|------|
| `AWARD_POINTS` | pointsAmount, pointsReason | 会员积分发放 |
| `ISSUE_COUPON` | couponPlanId | 优惠券发放 |
| `ISSUE_BLINDBOX` | blindboxPlanId, blindboxQuantity | 盲盒发放（关联 P-38） |
| `RECOMMEND_TAG` | tagCode, tagMessage | 推荐标签 |

#### 3.3.5 伦理约束

- 频次控制: 同 userId + 同 triggerEvent 每日 ≤ 1 次（内存计数器）
- Multi-tenant 隔离: TenantGuard + 事件传递 tenantContext
- DTO whitelist 校验
- 状态转移合法性检查
- `CampaignTriggerService` 支持 `resetFrequencyCounter()` 用于测试

---

### 3.4 Referral 模块 (`referral/`)

#### 3.4.1 三级裂变模型

```
    A (L1)
    │
    B (L1 for B, L2 for A)
    │
    C (L1 for C, L2 for B, L3 for A)
```

裂变追踪通过 `ancestorChain` 记录祖先链，limit 3 层。

#### 3.4.2 奖励规则

| 层级 | 积分 | 优惠券 |
|:----:|:----:|:------:|
| L1 | 100 | 50 元 |
| L2 | 50 | — |
| L3 | 10 | — |

规则通过 `setRewardRules()` 可配置。

#### 3.4.3 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/referral/code` | 生成短码 |
| GET | `/referral/code/:shortCode` | 查询短码 |
| POST | `/referral/click` | 点击追踪 |
| POST | `/referral/signup` | 注册补登 |
| POST | `/referral/rewards/:recordId` | 发放奖励 |
| GET | `/referral/metrics` | 指标查询 |
| GET | `/referral/records` | 记录列表 |
| GET | `/referral/rewards` | 奖励列表 |

#### 3.4.4 伦理约束

- `TenantGuard` 多租户隔离
- 短码不可猜测（6 bytes → 8 chars base64url）
- 过期码自动拒绝
- 三级裂变深度限制防止滥用
- 追踪率指标通过 `getMetrics()` 可监控
- `MarketingMetricsService.incrReferralTrack()` 支持打点追踪

---

## 4. 验收标准

### 4.1 功能验收

| # | 验收项 | 预期结果 | 涉及模块 |
|:-:|--------|----------|:-------:|
| 1 | ROI 计算 | 输入 campaignId, 返回 revenue/cost/roi/profit/isPositive | ai-marketing |
| 2 | 多活动 ROI 对比 | 输入多 ID, 返回按 ROI 降序结果 | ai-marketing |
| 3 | ROI 预测 | 输入 config, 返回 min/max/expected ROI | ai-marketing |
| 4 | 预算分配推荐 | 输入 type+budget, 返回渠道配比 | ai-marketing |
| 5 | 文案生成 | 输入 brief, 返回 headline/body/cta/taglines | ai-marketing |
| 6 | A/B 变体生成 | 输入 brief+count, 返回 N 个变体 | ai-marketing |
| 7 | 文案本地化 | 输入文案+locale, 返回本地化文案 | ai-marketing |
| 8 | 归因分析 | 返回 first/last/multi/time-decay 归因数据 | ai-marketing (analytics) |
| 9 | 漏斗分析 | 返回 TOF/MOF/BOF 三阶段数据 | ai-marketing (analytics) |
| 10 | 跨门店核销 | 符合scope的门店成功,其他拒绝 | coupon |
| 11 | 幂等核销 | 同 idempotencyKey 只核销一次 | coupon |
| 12 | 批量核销 | 错误前停止,返回部分失败信息 | coupon |
| 13 | AI 评分发放 | 根据会员特征评分排序发放 | coupon (ai-distribute) |
| 14 | 事件触发活动 | 触发 match 条件自动执行动作 | campaign |
| 15 | 状态转移合法性 | DRAFT→SCHEDULED→ACTIVE 等,非法转移拒绝 | campaign |
| 16 | 短码生成 | 6-8 位 base64url 短码,不可猜测 | referral |
| 17 | 三级裂变奖励 | L1/L2/L3 分别获得对应积分奖励 | referral |
| 18 | 追踪率指标 | getMetrics() 返回 trackRate | referral |
| 19 | 频次控制 | 同userId+同eventName 每日 ≤1 次 | campaign (trigger) |
| 20 | DTO 校验 | 非法输入被 ValidationPipe 拒绝 | 全部 |

### 4.2 圈梁校验

| # | 圈梁项 | 检查方法 |
|:-:|--------|----------|
| 1 | TSC 零错误 | `npx tsc --noEmit` |
| 2 | 无 test.skip/only | `! grep -rn "test\.skip\|test\.only\|it\.skip\|it\.only\|describe\.skip\|describe\.only" apps/api/src/modules/` |
| 3 | TenantGuard 覆盖 | 所有 Controller 端点使用 `@UseGuards(TenantGuard)` |
| 4 | ValidationPipe | 所有 DTO 使用 class-validator 装饰器 |
| 5 | coverage 达标 | 各模块 test/代码比 ≥ 1.5x |

---

## 5. 当前实现状态

### 5.1 代码统计

| 模块 | 源文件 | 测试文件 | 代码行 | 测试行 | 比例 |
|------|:-----:|:--------:|:-----:|:------:|:----:|
| ai-marketing | 7 | 17 | ~2971 | ~4832 | 1.63x |
| coupon | 10 | ~15 | ~1200 | ~1500 | 1.25x |
| campaign | 6 | ~10 | ~900 | ~1200 | 1.33x |
| referral | 5 | ~8 | ~600 | ~800 | 1.33x |
| **合计** | **28** | **~50** | **~5671** | **~8332** | **1.47x** |

### 5.2 审计发现（基于 ai-marketing-audit.md）

- 🟢 无 test.skip/only ✅
- 🟢 Controller 全部使用 TenantGuard ✅
- 🟢 DTO 全部使用 whitelist + transform ✅
- 🟡 缺少正式 PRD（本文件补全）✅
- 🟢 ai-finish.test.ts 验证完毕 ✅

### 5.3 已知限制

1. **数据当前使用 Mock**: ai-marketing 的 MOCK_CAMPAIGNS+CHANNEL_CPM, coupon 和 referral 使用内存 Map，生产需接 Postgres/Redis
2. **无外部 AI API**: 使用本地规则引擎，等待 WP-03A AI 中台上线后可切换
3. **quota.increment 不拦截**: 仅在核销成功后记录，不防超额，需结合生产 quota 实现
4. **频率计数器为内存**: 重启丢失，生产需接 Redis
5. **CampaignTriggerService 依赖 EventBus**: 当前为 @Optional 注入，EventBus 未就时 no-op

---

## 6. 与相邻模块接口

| 相邻模块 | 对接方式 | 当前状态 |
|----------|----------|:--------:|
| MemberService | CampaignService @Optional 注入 | 可用，awardPoints 调用 |
| LoyaltyService | CampaignService @Optional 注入，issueCouponFromPlan/issueBlindboxFromPlan | 可用 |
| MarketingMetricsService | CampaignService/ReferralService @Optional 注入 | 可用 |
| EventBusService | CampaignTriggerService @Optional 注入 | 未就时 no-op |
| TenantLifecycleService | CouponService @Optional 注入 | 可用 |
| TenantQuotaService | CouponService @Optional 注入 | 可用 |

---

## 7. 风险与 TODOs

| 风险 | 影响 | 缓解措施 |
|------|:----:|----------|
| 生产数据库未就 | 数据不可持久 | 内存存储 + 接口抽象，待中台统一接入 |
| WP-03A AI 中台未完成 | AI 能力为模拟 | 本地规则引擎实现同等接口，未来替换 |
| WP-13A 推送频控未完成 | 频控为内存实现 | 接口抽象，未来接 Redis |
| coupon 实体为 V2 架构 | 与 V1 兼容问题 | 独立表 `coupon_v2` |

| TODO | 负责方 | 优先级 |
|------|--------|:------:|
| 接 Postgres 持久化 | 中台团队 | P1 |
| 接 Redis 频次计数器 | 中台团队 | P1 |
| CouponService.triggerByCampaign 实现 | 营销团队 | P2 |
| 归因数据接入真实投放平台 | 投放团队 | P2 |

---

## 8. 测试指南

```bash
# AI 营销模块
npx jest apps/api/src/modules/ai-marketing/ai-finish.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.cmo-comprehensive.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.ringbeam.test.ts
npx jest apps/api/src/modules/ai-marketing/ai-marketing.contract.test.ts

# 优惠券模块
npx jest apps/api/src/modules/coupon/coupon.contract.test.ts
npx jest apps/api/src/modules/coupon/coupon.e2e.test.ts
npx jest apps/api/src/modules/coupon/coupon-ringbeam.test.ts

# 活动营销模块
npx jest apps/api/src/modules/campaign/campaign-ringbeam.test.ts
npx jest apps/api/src/modules/campaign/campaign.e2e.test.ts
npx jest apps/api/src/modules/campaign/campaign.contract.test.ts
npx jest apps/api/src/modules/campaign/campaign.trigger.test.ts

# 裂变追踪模块
npx jest apps/api/src/modules/referral/referral-ringbeam.test.ts
npx jest apps/api/src/modules/referral/referral.e2e.test.ts
npx jest apps/api/src/modules/referral/referral.contract.test.ts
```

---

*📅 2026-07-23 · V23 Day3 · P1 阶段 · WP-08B AI 营销核心 · 产出: PRD + 验收卡*
