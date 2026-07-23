# V23 侦察兵全场景赋能 · 动态定价+营销活动方案  (包3/4)

## 一、概述

| 项目 | 内容 |
|------|------|
| 场景 | 场景E: 动态价格体系搭建 · 场景F: 精准营销活动方案策划 |
| 端点 | POST /intelligence/pricing-strategy · POST /intelligence/marketing-campaign |
| 数据源 | price-monitor + IntelligenceAiService + scout.getPrices |
| 关联 | [RQ-50-02] |

## 二、场景E: 动态价格体系搭建

### 2.1 接口定义

**POST /intelligence/pricing-strategy**

**输入:**
```json
{
  "city": "上海",
  "district": "徐汇",
  "scenario": "new_store | competitor_reaction | seasonal",
  "budget": 300000,
  "storeTier": "low | mid | high"
}
```

**输出:**
```json
{
  "scenario": "new_store",
  "city": "上海",
  "district": "徐汇",
  "marketContext": { "avgMarketPrice": 128, "competitorCount": 8, "priceRange": { "min": 68, "max": 198 } },
  "priceItems": [ ...6项价目... ],
  "strategyExplanation": "定价策略说明",
  "revenueImpact": { "estimatedMonthlyRevenue": 4896000, "estimatedMonthlyProfit": 1566720, "expectedGrowthPercent": -15, "paybackImpact": "..." }
}
```

### 2.2 三种场景策略

| 场景 | 核心思路 |
|------|----------|
| `new_store` | 渗透定价法 — 低于同城均价10-15%快速获客 |
| `competitor_reaction` | 价值捍卫法 — 增值服务对抗降价 |
| `seasonal` | 峰谷差异法 — 旺季溢价15-25%，淡季折扣10-20% |

### 2.3 价目表 (6项) 与价格弹性

| 品类 | 弹性系数 |
|------|----------|
| 单人畅玩票 | -1.2 |
| 双人畅玩票 | -0.9 |
| 亲子套票 | -0.7 |
| 月卡会员 | -0.5 |
| 季卡会员 | -0.4 |
| 充值套餐 | -0.3 |

## 三、场景F: 精准营销活动方案策划

### 3.1 接口定义

**POST /intelligence/marketing-campaign**

**输入:**
```json
{ "city": "上海", "district": "徐汇", "season": "summer", "budget": 50000 }
```

**输出:** 6大类方案 + 推荐方案

### 3.2 6大类方案

| # | 类型 | 方案 | 预算占比 |
|---|------|------|----------|
| 1 | douyin_group | 抖音团购套餐 | 15% |
| 2 | weekend_tournament | 周末主题比赛 | 12% |
| 3 | member_day | 会员日专属优惠 | 8% |
| 4 | ip_collaboration | IP联名主题活动 | 40% |
| 5 | summer_limited | 暑假限定畅玩季 | 20% |
| 6 | blindbox_lottery | 盲盒抽奖(合规版) | 10% |

### 3.3 方案模板

每个方案含: type, name, description, pros(4), cons(3-4), estimatedEffect, applicableScenarios(4), costEstimate
