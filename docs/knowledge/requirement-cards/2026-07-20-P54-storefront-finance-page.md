# P-54 Phase 90 · Storefront 财务页真数据化需求卡
> 创建: 2026-07-20 · PRD-019: Storefront Finance Page Real Data (v1.0)
> 状态: 🟡 已签发，开发中

## 业务概述
本卡只打一仗: 把 `storefront-web/finance` 从 mock 页面改成真实财务页面，让上一阶段已经打通的 `finance ledger` 在前台真正可见、可查、可验收。

## 唯一主线

### 1️⃣ Revenue Summary
- **入口**: `/finance/revenue/summary`
- **目标**: 近一段时间营收、退款、净收入、流水数全部显示真实值
- **护栏**: 页面不允许再依赖 `MONTHLY_DATA` 作为摘要主数据

### 2️⃣ Ledger Records
- **入口**: `/finance/ledgers`
- **目标**: 对账列表显示真实 ledger
- **护栏**: 页面不允许再依赖 `TRANSACTIONS` 静态数组

### 3️⃣ Trend Aggregation
- **入口**: helper 聚合
- **目标**: 趋势图根据真实 ledger 生成近 6 个月数据
- **护栏**: 不臆造 mock 月度数据

### 4️⃣ UX States
- **目标**: loading / error / empty / retry 全齐
- **护栏**: 用户必须知道页面是在加载、失败还是暂无真实流水

### 5️⃣ Regression & Acceptance
- **测试**: `app/finance/page.test.ts`
- **目标**: helper 映射、页面接线、三态与筛选都要有护栏

## 关键文件

```text
apps/storefront-web/app/finance/page.tsx
apps/storefront-web/app/finance/page.test.ts
apps/storefront-web/lib/storefront-finance.ts
docs/knowledge/acceptance/2026-07-20-p54-checkout-revenue-acceptance.md
docs/knowledge/task-log/2026-07-20-v51-top10-alignment-ledger.md
```

## 验证命令

```bash
pnpm --dir apps/storefront-web exec node --import tsx --test app/finance/page.test.ts
```

## 完成判定

- 财务摘要已接真数据
- 对账流水已接真数据
- 趋势图已由真实 ledger 聚合
- 页面三态已补齐
- 验收卡与台账已回写
