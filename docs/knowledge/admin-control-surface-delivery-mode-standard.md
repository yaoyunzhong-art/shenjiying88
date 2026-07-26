# Admin 控制面数据来源态标注规范

## 1. 目的

本文件用于统一 `admin-web` 中预约、财务、会员三类控制面的数据来源态标注规则，解决当前页面虽然存在，但用户和审计视角无法一眼区分：

- 真实 API
- fallback
- mock

的问题。

本规范用于支撑后续页面级审计、复签与真实链路回扫，不替代权限门禁与功能验收。

## 2. 适用范围

当前第一批必须执行本规范的页面域：

1. 预约控制面
2. 财务控制面
3. 会员控制面

后续可推广到：

- 审批
- 治理
- 报表

## 3. 统一字段

### 3.1 标准字段

所有控制面页面统一增加以下语义字段：

- `deliveryMode`
  - 允许值：`'api' | 'fallback' | 'mock'`
- `dataSourceLabel`
  - 允许值：`'真实 API' | 'fallback' | 'mock'`

### 3.2 定义

#### `api`

页面核心数据来自真实后端接口，且当前渲染结果未依赖本地假数据兜底。

#### `fallback`

页面优先请求真实接口，但在异常或缺失时退回本地默认数据、快照数据或兼容数据。

#### `mock`

页面核心数据直接来自本地常量、页面内数组、假 fetch、演示数据，未接真实后端真源。

## 4. 判定规则

| 场景 | deliveryMode |
| --- | --- |
| 真实接口成功返回并渲染主视图 | `api` |
| 先请求接口，失败后退默认值 / 快照 | `fallback` |
| 只用 `MOCK_*`、本地 `DATA`、假 fetch、前端生成数据 | `mock` |

补充规则：

1. 只要主视图核心区域依赖本地假数据，就不能标成 `api`。
2. 页面局部小组件仍有 mock，但主表 / 主卡 / 主列表是真接口时，可先标 `fallback`，并在风险备注中写明局部 mock。
3. 不允许省略来源态；没有标注就视为审计未完成。

## 5. 现有可复用模式

### 5.1 会员域

会员域已有最成熟的来源态模式：

- `deliveryMode: 'api' | 'fallback'`

可直接扩成：

- `deliveryMode: 'api' | 'fallback' | 'mock'`

可复用证据：

- `apps/admin-web/app/members-view-model.ts`
- `apps/admin-web/app/members/page.tsx`

### 5.2 财务域

财务域已经存在：

- api -> fallback
- mock-only

两类实现，但多数页面还没有显式渲染统一来源态文案。

### 5.3 预约域

预约域当前只有业务来源字段，如：

- 小程序
- 电话
- 到店

这不是数据来源态，不能替代 `deliveryMode`。

## 6. 页面域首批判定

| 页面 | 当前判定 | 原因 |
| --- | --- | --- |
| `apps/admin-web/app/members/page.tsx` | `api` 或 `fallback` | 页面已优先消费真实 `/members/persistent`，并显式展示来源态 |
| `apps/admin-web/app/members/[id]/page.tsx` | `mock` | 详情完全依赖 mock member / points / recharges / visits |
| `apps/admin-web/app/members/cards/page.tsx` | `mock` | 全部基于 `MOCK_MEMBER_CARDS` |
| `apps/admin-web/app/members/tiers/page.tsx` | `mock` | 全部基于 `MOCK_TIERS` |
| `apps/admin-web/app/members/reports/page.tsx` | `mock` | 报表数据由本地生成函数得到 |
| `apps/admin-web/app/finance/page.tsx` | `mock` | 数据仍是 mock fetch + 本地数组 |
| `apps/admin-web/app/finance/[id]/page.tsx` | `mock` | 详情以 `MOCK_PAYMENT / MOCK_REFUNDS` 初始化 |
| `apps/admin-web/app/finance/payouts/page.tsx` | `mock` | 明写 `Mock fetch` 与 `Mock API` |
| `apps/admin-web/app/finance/rules/page.tsx` | `fallback` | 请求失败退回 `DEFAULT_RULES` |
| `apps/admin-web/app/finance/reconciliation/rules/page.tsx` | `fallback` | 请求失败退回 `defaultRules` |
| `apps/admin-web/app/finance/reconciliation/discrepancies/[id]/page.tsx` | `fallback` | 请求失败退回 `defaultDetail` |
| `apps/admin-web/app/stores/[id]/reservations/page.tsx` | `mock` | 核心数据为本地 `DATA` |
| `apps/admin-web/app/stores/[id]/finance/page.tsx` | `mock` | 核心交易列表为本地 `TRANSACTIONS` |

## 7. 展示规范

### 7.1 页面级展示

每个控制面页面至少在标题区或摘要区展示：

- `当前数据源：真实 API`
- `当前数据源：fallback`
- `当前数据源：mock`

### 7.2 样式建议

统一使用状态 badge 或说明文案，避免不同页面各自发明词：

- `真实 API`
- `fallback`
- `mock`

禁止使用以下混乱文案替代：

- 真数据中
- 半联调
- 暂时数据
- Demo 模式

除非同时保留标准来源态。

### 7.3 审计附注

若页面为 `fallback` 或 `mock`，必须额外补一句：

- `该页面当前不可作为闭环复签证据`

## 8. 实施顺序

### 8.1 第一批

- `members`
- `members/[id]`
- `members/cards`
- `members/tiers`
- `members/reports`

### 8.2 第二批

- `finance`
- `finance/[id]`
- `finance/payouts`
- `finance/rules`
- `finance/reconciliation/*`

### 8.3 第三批

- `stores/[id]/reservations`
- `stores/[id]/finance`

## 9. 当前冻结结论

1. Admin 控制面统一使用：
   - `deliveryMode`
   - `dataSourceLabel`
2. 允许值只有：
   - `api`
   - `fallback`
   - `mock`
3. 当前会员域模式最成熟，应作为三域统一模板。
4. 没有来源态标注的控制面页面，不得计入可信闭环完成率。

## 10. 下一步执行建议

1. 先在会员域页面补齐完整三态。
2. 再对财务域和预约域逐页落标。
3. 落标完成后，再生成“可信控制面完成率”统计，而不是继续沿用页面存在率。

## 11. 关联文档

- `docs/knowledge/member-domain-canonical-model.md`
- `docs/knowledge/member-chain-trace-audit.md`
- `docs/knowledge/checkout-payment-chain-trace-audit.md`
- `docs/knowledge/booking-chain-trace-audit.md`
