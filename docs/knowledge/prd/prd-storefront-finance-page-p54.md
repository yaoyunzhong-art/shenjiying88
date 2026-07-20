# PRD-019: Storefront 财务页真数据化 — Finance Page Real Data (P-54 Phase 90)

> 版本: v1.0 · 签发人: 树哥 · 对接主线: V5.1 / Top10 / P-54
> 发布日期: 2026-07-20 · 状态: 🟢 已签发
> 关联 PRD: `PRD-017 Checkout 收入主链闭环` / `PRD-018 Transactions 自动落财务流水`

---

## 1. 业务背景

`storefront checkout -> payment -> result -> transactions -> finance ledger` 已基本闭环，但 `apps/storefront-web/app/finance/page.tsx` 仍停留在 mock 页面阶段：

- 摘要卡片使用本地伪数据
- 趋势图使用本地月度数组
- 对账记录使用本地静态流水
- 无真实加载态、失败态、空态

这会导致上一阶段已经打通的 `finance ledger` 无法在前台页面被消费，也就无法确认 Top10 的第 10 项是否真正闭环。

## 2. 成功标准

- 页面摘要来自真实 `finance/revenue/summary`
- 页面流水来自真实 `finance/ledgers`
- 趋势图使用真实 ledger 聚合结果生成
- 页面具备加载中、失败可重试、空态解释
- 页面测试与验收卡证据补齐

## 3. 功能需求

| RQ | 标题 | 优先级 | 验收标准 |
|:---|:-----|:------:|:---------|
| RQ-19-01 | 财务摘要真数据化 | P0 | 页面不再使用本地 `MONTHLY_DATA` 作为主数据源，摘要来自 `/finance/revenue/summary` |
| RQ-19-02 | 对账流水真数据化 | P0 | 页面不再使用本地 `TRANSACTIONS`，记录来自 `/finance/ledgers` |
| RQ-19-03 | 趋势图真实聚合 | P0 | 趋势图根据近 6 个月 ledger 聚合得到 |
| RQ-19-04 | 页面三态补齐 | P0 | 必须具备 loading / error / empty / retry |
| RQ-19-05 | 查询与筛选保留 | P1 | 类型筛选、关键词筛选、日期范围筛选仍可用 |
| RQ-19-06 | 测试与验收回写 | P0 | finance page test、验收卡、对齐台账完成回写 |

## 4. 范围

### In Scope

- `apps/storefront-web/app/finance/page.tsx`
- `apps/storefront-web/app/finance/page.test.ts`
- `apps/storefront-web/lib/` 下新增 storefront finance helper
- `docs/knowledge/acceptance/2026-07-20-p54-checkout-revenue-acceptance.md`
- `docs/knowledge/task-log/2026-07-20-v51-top10-alignment-ledger.md`

### Out of Scope

- `finance ledger` 持久化重构
- finance admin 页面改造
- settlement / invoice / reconciliation 大改
- 新增后端财务接口

## 5. 技术方案

1. 新增 `storefront-finance.ts` helper，统一封装:
   - `GET /finance/revenue/summary`
   - `GET /finance/ledgers`
   - ledger -> 页面视图模型映射
   - 近 6 个月趋势聚合
2. `finance/page.tsx` 改为通过 helper 拉取真实数据
3. 页面加载失败时提供重试入口
4. 空数据时提供解释态，而不是直接显示 mock
5. 测试从“mock 数据工厂冒烟”升级为“真实 helper 接线与映射护栏”

## 6. 风险与回滚

| 风险 | 等级 | 缓解措施 |
|---|---|---|
| 前端接线后页面空白 | 高 | 先补 helper 映射测试，再改页面 |
| finance ledger 当前只有 revenue/refund 数据 | 中 | UI 明确按真实数据展示，不臆造 expense |
| 时间范围筛选与 recordedAt 口径偏差 | 中 | 统一由 helper 生成 ISO 边界 |

### 回滚原则

- 如真数据接线引发页面不可用，优先回滚 `finance/page.tsx` 与新 helper
- 不回滚已完成的 `transactions -> finance ledger` 自动落账
- 验收卡保留失败证据与回滚点

## 7. 测试策略

- 单测:
  - `apps/storefront-web/app/finance/page.test.ts`
- 定向回归:
  - `pnpm --dir apps/storefront-web exec node --import tsx --test app/finance/page.test.ts`
- 验收:
  - 回写 `2026-07-20-p54-checkout-revenue-acceptance.md`
  - 回写 `2026-07-20-v51-top10-alignment-ledger.md`

## 8. 完成定义

满足以下条件才算本轮完成:

1. 已有 PRD / 需求卡 / kickoff
2. `finance/page.tsx` 去 mock
3. 摘要、流水、趋势均来自真实数据
4. 页面三态和重试齐全
5. 测试通过且无新增 diagnostics
6. 验收卡与对齐台账已回写
