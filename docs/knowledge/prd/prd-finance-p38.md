# PRD-007: 财务对账 — Financial Reconciliation (P-38)

> 版本: v1.0 · 签发人: 🦞 龙虾哥 · 对接专家: E10 财务
> 发布日期: 2026-07-13 · 状态: 🟢 已签发
> 关联Phase: P-38

---

## 1. 业务背景

### 1.1 为什么要做
店长每天需要知道营收、退款、对账。当前没有对账系统，收银数据都在订单表里，但缺少日结/月结功能。

### 1.2 成功标准
- 日结报表自动生成（每天凌晨）
- 店长查看昨日营收 ≤5秒
- 支持手动退款

## 2. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-38-01 | 日结报表 | P0 | 每天00:05自动汇总昨日所有订单，生成日报 |
| RQ-38-02 | 报表查看 | P0 | 按日期范围查询，展示总收入/退款/净收入/订单数 |
| RQ-38-03 | 订单明细 | P0 | 查看某日所有订单列表，点击看详情 |
| RQ-38-04 | 退款处理 | P0 | 选择订单→输入退款金额→退款→更新状态 |
| RQ-38-05 | 支付渠道对账 | P1 | 微信支付总额 vs 系统记录 比对 |
| RQ-38-06 | 异常标记 | P1 | 金额/数量异常的订单自动标红 |

## 3. 验收卡

| 卡ID | 场景 | 前置 | 预期 |
|:----|:-----|:-----|:-----|
| AC-38-01 | 日结: 查昨天营收 | 有10笔订单 | 展示10笔总计 |
| AC-38-02 | 日结: 无订单日 | 昨日无订单 | 展示"0" |
| AC-38-03 | 退款: 全单退款 | 订单金额100元 | 退款100, 订单状态=refunded |
| AC-38-04 | 退款: 部分退款 | 订单含3件商品 | 退指定金额, 剩余商品 |
| AC-38-05 | 对账: 微信总额匹配 | 5笔微信支付 | 微信金额=系统金额 ✅ |
| AC-38-06 | 异常: 金额>10000标记 | 某订单金额50000 | 该行标红 |

## 4. 数据模型

```typescript
interface DailyReport {
  date: string;
  totalRevenue: number;
  totalRefund: number;
  netRevenue: number;
  orderCount: number;
  paymentBreakdown: { wechat: number; balance: number; cash: number };
}

interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason: string;
  operator: string;
  createdAt: Date;
}
```
