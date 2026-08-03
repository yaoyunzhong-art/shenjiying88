# 联盟管理 (Alliances)

## 功能概述

联盟管理模块负责企业与外部合作伙伴之间的联盟关系管理，涵盖联盟伙伴的招募、准入审核、合作协议签署、业务协同、绩效评估、结算分账及关系终止的全生命周期。支持多种联盟模式，包括分销联盟、渠道联盟、技术联盟、品牌联名等。提供联盟活动管理、佣金规则配置、业绩数据看板、自动分账结算等功能。与订单、合同、财务、CRM等模块深度集成，实现从合作引入到业务交付的完整闭环管理。

## 核心概念

- **联盟伙伴**：与企业建立正式合作关系的合作伙伴，包含商户、渠道商、技术合作方等
- **联盟类型**：定义合作模式的分类，如分销联盟、渠道联盟、技术联盟、IP联名
- **合作协议**：联盟关系的法律基础文档，约定合作范围、分成比例、结算周期等
- **联盟活动**：联盟伙伴参与的具体营销/业务活动，如联合推广、分销活动
- **佣金规则**：计算联盟伙伴收益的规则配置，支持固定佣金、比例佣金、阶梯佣金
- **结算周期**：联盟伙伴收益的结算频率，如周结、月结、按活动结算
- **分账记录**：每次结算的详细分账明细，包含订单级分账数据
- **联盟等级**：基于合作深度和贡献度的伙伴等级体系，不同等级享有不同的权益和分成比例
- **绩效评估**：对联盟伙伴的定期绩效评分，含销售额、转化率、客户满意度等维度

## 主要页面/路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/alliances` | 联盟总览 | 联盟数据看板：伙伴总数、活跃度、GMV、分成金额 |
| `/alliances/partners` | 伙伴列表 | 联盟伙伴查询、筛选、列表管理 |
| `/alliances/partners/create` | 新增伙伴 | 招募新联盟伙伴，填写基本信息、合作意向 |
| `/alliances/partners/:id` | 伙伴详情 | 伙伴全景视图：基本信息、合作协议、业绩、结算记录 |
| `/alliances/partners/:id/edit` | 编辑伙伴 | 修改伙伴信息、等级调整、状态变更 |
| `/alliances/agreements` | 合作协议 | 合作协议管理，含模板管理、签署、续签 |
| `/alliances/agreements/create` | 签署协议 | 选择模板、配置条款、发起到对方签署 |
| `/alliances/campaigns` | 联盟活动 | 联盟营销活动管理，活动创建、执行、复盘 |
| `/alliances/commissions` | 佣金管理 | 佣金规则配置、模拟计算、历史查询 |
| `/alliances/settlements` | 结算管理 | 结算单列表、结算执行、结算详情 |
| `/alliances/settlements/:id` | 结算详情 | 结算明细，含订单级分账数据 |
| `/alliances/performance` | 绩效评估 | 伙伴绩效数据、评分管理、排行榜 |
| `/alliances/reports` | 联盟报表 | 多维度联盟数据分析报表 |

## 相关服务/API

| 服务 | 用途 |
|------|------|
| `AlliancePartnerService` | 伙伴管理 CRUD、等级管理、状态流转 |
| `AllianceAgreementService` | 合作协议管理、模板管理、签署流程 |
| `AllianceCampaignService` | 联盟活动管理、活动配置、参与管理 |
| `CommissionRuleService` | 佣金规则配置、规则匹配引擎 |
| `AllianceSettlementService` | 结算单生成、分账计算、结算执行 |
| `AlliancePerformanceService` | 绩效数据采集、评分计算、数据分析 |
| `AllianceFinanceService` | 财务对账、发票管理、付款处理 |
| `AllianceNotificationService` | 通知推送：结算通知、活动通知、预警 |

## 使用示例

### 创建联盟伙伴

```typescript
// 新增分销联盟伙伴
const partner = await alliancePartnerService.create({
  name: '某某数码科技',
  type: 'distribution', // 分销联盟
  level: 'silver', // 银牌伙伴
  contactInfo: {
    name: '张三',
    phone: '13800138000',
    email: 'zhang@example.com',
  },
  businessScope: ['手机配件', '智能穿戴'],
  channels: ['wechat-mp', 'xiaohongshu'],
  taxInfo: {
    taxId: '91110108...',
    bankAccount: '...',
  },
});

// 初始化等级和分成比例
await alliancePartnerService.setLevel(partner.id, {
  level: 'silver',
  commissionRate: 5.0, // 基础佣金 5%
  privileges: ['exclusive_product', 'priority_support'],
});
```

### 配置佣金规则

```typescript
// 配置阶梯佣金规则
await commissionRuleService.create({
  partnerType: 'distribution',
  effectiveDate: '2026-07-01',
  rules: [
    {
      ruleName: '月度业绩阶梯佣金',
      type: 'tiered',
      tiers: [
        { minAmount: 0, maxAmount: 100000, rate: 3.0 },   // 0-10万: 3%
        { minAmount: 100000, maxAmount: 500000, rate: 5.0 }, // 10-50万: 5%
        { minAmount: 500000, maxAmount: null, rate: 8.0 },   // 50万+: 8%
      ],
      baseOn: 'monthly_gmv', // 基于月GMV
    },
    {
      ruleName: '新品推广额外奖励',
      type: 'fixed',
      amount: 5000, // 每推广一款新品额外奖励5000元
      conditions: {
        productCategory: 'new_arrival',
        minSalesCount: 50,
      },
    },
  ],
});
```

### 执行联盟结算

```typescript
// 生成月度结算单
const settlement = await allianceSettlementService.generate({
  partnerId: partner.id,
  period: { year: 2026, month: 7 },
  includeOrders: [
    { orderId: 'ord-202607-0001', amount: 50000, commission: 2500 },
    { orderId: 'ord-202607-0002', amount: 30000, commission: 900 },
    { orderId: 'ord-202607-0003', amount: 120000, commission: 6000 },
  ],
  additionalRewards: [
    { name: '新品推广奖励', amount: 5000 },
  ],
});

// 确认结算单
await allianceSettlementService.confirm(settlement.id);

// 执行付款（推送到财务系统）
await allianceFinanceService.processPayment(settlement.id, {
  paymentMethod: 'bank_transfer',
  scheduledDate: '2026-08-15',
});
```

### 联盟绩效评估

```typescript
const performance = await alliancePerformanceService.evaluate({
  partnerId: partner.id,
  period: { year: 2026, quarter: 2 },
  dimensions: {
    gmv: { weight: 40, score: 85 },
    conversion: { weight: 20, score: 90 },
    returnRate: { weight: 15, score: 88 },
    customerSatisfaction: { weight: 15, score: 92 },
    collaboration: { weight: 10, score: 95 },
  },
});

// 根据绩效调整等级
if (performance.totalScore >= 90) {
  await alliancePartnerService.upgradeLevel(partner.id, 'gold');
}
```
