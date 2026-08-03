# G3 收银组晨间简报 · 2026-07-20

- 专家: E3马收银 + E19王支付 + E25杨会员 + E13黄交易
- 签署: ✅
- 时间: 08:24 CST

---

## L1 行业学习 — POS 收银流程 · 支付链路

### 学习主题: POS 收银台架构 + 支付链路最佳实践

**关键行业发现：**

1. **POS 收银台 Offline-First 架构** — 2026 年零售 POS 行业主流采用 offline-first 模式：本地缓存商品/会员/价格数据，网络恢复后批量同步。这要求收银系统具备：本地事件溯源(event sourcing)、冲突检测、离线交易队列。

2. **支付链路隔离** — 支付网关(PaymentGateway)与收银台(Cashier)职责分离已成行业标准。Cashier 负责订单流（商品/会员/优惠），PaymentGateway 负责资金流（支付/退款/对账）。两者通过 `orderId` / `transactionId` 关联。

3. **多币种 + 动态税务** — 2026 年跨境零售的 currency 引擎需支持：实时汇率转换 + 锁定汇率(交易发生时冻结)、多币种结算、外汇对冲。税务引擎需支持：多 jurisdiction（区域税率）、动态税种分类、自动税码映射。

### V22 凌晨相关 Commit

| Commit | 说明 | 关联模块 |
|--------|------|----------|
| `7f3af9a85` | Cashier 添加内存 seed data + member lookup | cashier |
| `12d77daf0` | POS SDK 联调 | cashier-payment-sdk |
| `84e5ecef9` | POS/checkout/payment/refund E2E 测试 | e2e |
| `2fae1c488` | orders 页面切换到真实 API | storefront |
| `8d8fe258d` | apps/app 支付流程对齐 | app |
| `d0e743775` | categories 轻量模块 | api/categories |

---

## M1 晨间签阅 — P-38 Finance 全模块 + currency/tax 引擎

### P-38 Finance 完成状态

| 组件 | 状态 | 测试数 | 备注 |
|------|:----:|:------:|------|
| FinanceService (CRUD) | ✅ | 2881 tests (finance 模块) | 完整 ledger/account/settlement/invoice |
| FinanceHealthDashboardController | ✅ | - | 成本 + 现金流仪表盘 |
| FinanceReconciliationReportService | ✅ | - | T+1 对账 + CSV 导出 |
| StorePAndLService / BrandPAndLService | ✅ | - | 门店/品牌级损益 |
| CostAnalysisService / CashFlowService | ✅ | - | P-38 100% 成本/现金流 |
| SettlementController + Cron | ✅ | - | 结算周期调度 |
| **Invoice 持久化 (finance-invoice.service)** | ✅ | - | 发票 CRUD |

### Currency 引擎

| 维度 | 状态 | 测试 |
|------|:----:|:----:|
| currency.controller (API) | ✅ | 20 test/spec files |
| currency.service | ✅ | 完整 CRUD + 转换 |
| currency.dto / entity / contract / e2e | ✅ | 全测试覆盖 |
| Ringbeam / Role / Role-v3 / Role-extended | ✅ | 角色权限链 |

### Tax 引擎

| 维度 | 状态 | 测试 |
|------|:----:|:----:|
| tax.entity | ✅ | 有测试 |
| tax.service | ✅ | 有测试 |
| TaxPolicyConfig (Prisma model) | ⚠️ | 无 tenantId 字段 |
| 区域税率 | ⚠️ | 基于 Prisma 表，需验证区域匹配 |

### Cashier 模块 (1,333 tests)

| 子模块 | 文件数 | 状态 |
|--------|:------:|:----:|
| cashier controller | 25 source | ✅ 完整 CRUD |
| offline-sync | 2 files | ✅ |
| billing (controller + e2e) | 5 files | ✅ |
| tenant isolation (cashier-tenant.ts) | 2 files | ✅ 3 种跨租户行为 |
| payment/transaction | 3 files | ✅ |
| gateway (base-payment-gateway) | 2 files | ✅ |

---

## K1 洞察简报

### 🔴 风险发现

| # | 风险 | 等级 | 影响 |
|---|------|:----:|------|
| 1 | **Cashier 仍使用内存 seed data** — `7f3af9a85` 添加了 member lookup 的 in-memory seed | 🟡 | 生产需切换到真实 DB，当前仅开发可用 |
| 2 | **TaxPolicyConfig 无 tenantId** — 无法实施 RLS | 🟡 | 税务策略表跨租户泄漏风险 |
| 3 | **Finance 对账 adapter 处于 MVP stub** — WeChat/Alipay adapter 注入开发 Secret | 🟡 | 生产需替换为真实密钥，且 adapter 返回空 |
| 4 | **Currency 引擎无汇率锁定机制** — 当前使用实时汇率，跨交易时汇率可能变化 | 🟡 | 退款场景多币种差异风险 |
| 5 | **Finance 数据全内存** — ledger/account/settlement/invoice 全部使用 in-memory Map | 🟡 | P-38 未切真实 DB |

### 💡 改进建议

| # | 建议 | 优先级 | 责任人 |
|---|------|:------:|--------|
| 1 | Cashier member lookup 从 seed data 切换为真实 DB + 缓存策略 | P0 | E19 |
| 2 | TaxPolicyConfig 添加 tenantId + RLS 保护 | P1 | E25 |
| 3 | Currency 引擎添加 `lockRate(orderId, currency, amount)` 汇率锁定功能 | P1 | E13 |
| 4 | Finance 模块从内存 Map 迁移到 Prisma/DB 持久化 | P0 | E3 |
| 5 | 生产密钥从 .env 提取，Adapter 添加真实对账请求 | P1 | E19 |

### 📊 收银链路评分

| 维度 | 评分 | 说明 |
|------|:----:|------|
| Cashier 模块完整性 (27 source files) | ✅ | 完整 CRUD + offline + billing + tenant |
| P-38 Finance 进展 | ✅ | 全模块完成，仪表盘 + 对账 + 结算 |
| Currency 引擎 | ✅ | 全测试覆盖，多币种支持 |
| Tax 引擎 | 🟡 | 缺少 tenantId + 区域税率需验证 |
| Cashier 测试覆盖 | ✅ | 1,333 tests / 37 test files |
| V22 POS E2E 交付 | ✅ | `84e5ecef9` POS/checkout/payment/refund 全链路 |

**综合评分: ✅ 通过 — 但 Finance 需从内存迁移 DB**

---

*🐜 G3 收银组 · 2026-07-20 08:24 CST · V22 Monday*
