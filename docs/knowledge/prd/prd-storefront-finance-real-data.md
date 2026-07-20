# PRD-019-EXT: Storefront Finance 真数据化 — Phase 90 Real Data (P-54 Phase 90)

> 版本: v1.1 · 签发人: 树哥 · 对接主线: V5.1 / Top10 / P-54
> 发布日期: 2026-07-20 · 状态: 🟢 已签发
> 关联 PRD: `PRD-017 Checkout 收入主链闭环` / `PRD-018 Transactions 自动落财务流水`

---

## 1. 业务背景

`storefront checkout → payment → result → transactions → finance ledger` 已基本闭环，但 `apps/storefront-web/app/finance/page.tsx` 仍停留在 mock 页面阶段：

- 摘要卡片使用 `MONTHLY_DATA` 本地伪数据
- 趋势图使用本地月度数组
- 对账记录使用 `TRANSACTIONS` 本地静态流水
- 无真实加载态、失败态、空态

这会导致上一阶段已经打通的 `finance ledger` 无法在前台页面被消费，也就无法确认 Top10 的第 10 项是否真正闭环。

## 2. 成功标准

- 页面摘要来自真实 `GET /api/finance/revenue/summary`
- 页面流水来自真实 `GET /api/finance/ledgers`
- 趋势图使用真实 ledger 聚合结果生成（近 6 个月按月聚集）
- 页面具备 loading（加载中）、error（失败可重试）、empty（空态解释）
- 页面测试与验收卡证据补齐

## 3. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-19-01 | 财务摘要真数据化 | P0 | 页面不再使用本地 `MONTHLY_DATA`，摘要来自 `GET /finance/revenue/summary` |
| RQ-19-02 | 对账流水真数据化 | P0 | 页面不再使用本地 `TRANSACTIONS`，记录来自 `GET /finance/ledgers` |
| RQ-19-03 | 趋势图真实聚合 | P0 | 趋势图根据近 6 个月 ledger 数据按月聚合得到 |
| RQ-19-04 | 页面三态补齐 | P0 | 必须具备 loading / error (含 retry) / empty |
| RQ-19-05 | 查询与筛选保留 | P1 | 类型筛选、关键词筛选、日期范围筛选可用 |
| RQ-19-06 | 测试与验收回写 | P0 | finance page test、验收卡、对齐台账完成回写 |

## 4. 范围

### In Scope

- `apps/storefront-web/app/finance/page.tsx`
- `apps/storefront-web/app/finance/page.test.ts`
- `apps/storefront-web/lib/storefront-finance.ts`
- `apps/storefront-web/lib/__tests__/storefront-finance.test.ts`

### Out of Scope

- `finance ledger` 持久化重构
- finance admin 页面改造
- settlement / invoice / reconciliation 大改
- 新增后端财务接口

## 5. 技术方案

1. 新增 `lib/storefront-finance.ts` helper，统一封装：
   - `getRevenueSummary(startDate?, endDate?)` → `GET /api/finance/revenue/summary`
   - `getLedgers(page?, limit?)` → `GET /api/finance/ledgers`
   - `aggregateMonthlyTrend(ledgers)` → 按月聚合近 6 个月数据
2. `finance/page.tsx` 改为通过 helper 通过 `useEffect` + `fetch` 拉取真实数据
3. 页面加载失败时提供重试入口按钮
4. 空数据时提供解释态，而不是直接显示 0
5. 测试从 mock 数据工厂升级为真实 helper 接线护栏

## 6. 风险与回滚

| 风险 | 等级 | 缓解措施 |
|---|---|---|
| 前端接线后页面空白 | 高 | 先补 helper 映射测试，再改页面 |
| finance ledger 当前可能无数据 | 中 | UI 空态妥善展示，不臆造数据 |
| 筛选与 recordedAt 口径偏差 | 中 | 统一由 helper 生成 ISO 边界 |

### 回滚原则

- 如真数据接线引发页面不可用，优先回滚 `finance/page.tsx` 与新 helper
- 不回滚已完成的 `transactions → finance ledger` 自动落账
- 验收卡保留失败证据与回滚点

## 7. 测试策略

- 单测：
  - `apps/storefront-web/lib/__tests__/storefront-finance.test.ts` — helper 映射+聚合护栏
  - `apps/storefront-web/app/finance/page.test.ts` — 页面接线
- 定向回归：
  - `pnpm --dir apps/storefront-web exec node --import tsx --test 'app/finance/page.test.ts'`
- 验收：
  - 回写 `docs/knowledge/acceptance/2026-07-20-p54-checkout-revenue-acceptance.md`

## 8. 完成定义

1. ✅ PRD / 需求卡 / kickoff 齐全
2. ✅ `finance/page.tsx` 去 mock
3. ✅ 摘要、流水、趋势均来自真实数据
4. ✅ 页面三态 (loading/error(含retry)/empty) 齐全
5. ✅ 测试通过且 TSC 0 错误
6. ✅ 验收卡与对齐台账已回写
