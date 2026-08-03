# P-54 Phase 90 · Storefront 财务页真数据化需求卡
> 创建: 2026-07-20 · PRD-019-EXT: Storefront Finance Real Data (v1.1)
> 状态: 🟢 已签发，开发中

## 业务概述
把 `storefront-web/app/finance` 从 mock 页面改成真实财务页面，
让已打通的 `finance ledger` 在前台真正可见、可查、可验收。

## 唯一主线

### 1️⃣ Revenue Summary
- **接口**: `GET /api/finance/revenue/summary?startDate=&endDate=`
- **目标**: 近一段时间营收、总支出、净利润、订单量全部显示真实值
- **护栏**: 页面不允许再依赖 `MONTHLY_DATA` 作为摘要主数据

### 2️⃣ Ledger Records
- **接口**: `GET /api/finance/ledgers?page=1&limit=20`
- **目标**: 对账流水列表显示真实 ledger 数据
- **护栏**: 页面不允许再依赖 `TRANSACTIONS` 静态数组

### 3️⃣ Trend Aggregation
- **来源**: 从真实 ledger 数据按月聚合
- **目标**: 趋势图根据近 6 个月真实数据生成
- **护栏**: 不臆造 mock 月度数据

### 4️⃣ UX States
- **目标**: loading / error (可重试) / empty 三态齐全
- **护栏**: 用户必须知道页面是在加载、失败还是暂无真实流水

### 5️⃣ Test & Acceptance
- **测试文件**:
  - `app/finance/page.test.ts` — 页面接线与三态
  - `lib/__tests__/storefront-finance.test.ts` — helper 映射与聚合
- **验收**: 回写 `docs/knowledge/acceptance/2026-07-20-p54-checkout-revenue-acceptance.md`

## 关键文件

```text
docs/knowledge/prd/prd-storefront-finance-real-data.md
docs/knowledge/requirement-cards/2026-07-20-P54-storefront-finance-real-data.md
apps/storefront-web/lib/storefront-finance.ts             ← NEW
apps/storefront-web/lib/__tests__/storefront-finance.test.ts  ← NEW
apps/storefront-web/app/finance/page.tsx                   ← MODIFIED
apps/storefront-web/app/finance/page.test.ts               ← MODIFIED
```

## 完成判定

- [ ] 财务摘要已接真数据（不用 MONTHLY_DATA）
- [ ] 对账流水已接真数据（不用 TRANSACTIONS）
- [ ] 趋势图已由真实 ledger 数据聚合
- [ ] 页面三态（loading/error+retry/empty）齐全
- [ ] helper 映射与聚合测试通过
- [ ] 页面测试通过 & TSC 0 错误
