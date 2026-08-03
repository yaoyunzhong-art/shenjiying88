# P-38 财务冲刺 — 安全合规专项检查 (2026-07-22)

> 基线版本: v2.1 | 关联: P-38 Finance Sprint · 安全基线8/8
> 检查时间: 2026-07-22 01:56 CST

---

## 1️⃣ 财务模块 AuthGuard 覆盖率

| 模块文件 | @UseGuards | @Public() | 状态 |
|---------|:----------:|:---------:|:----:|
| `finance.controller.ts` | ✅ | ❌ | ✅ 默认拒绝 |
| `finance-payment.controller.ts` | ✅ | ❌ | ✅ |
| `finance-report.controller.ts` | ✅ | ❌ | ✅ |
| `finance-reconciliation.controller.ts` | ✅ | ❌ | ✅ |
| `reconciliation.controller.ts` | ✅ | ❌ | ✅ |
| `payment-gateway/payment.controller.ts` | ✅ | ❌ | ✅ |

**结论: ✅ 所有财务 Controller 均受 AuthGuard 保护，零缺口**

---

## 2️⃣ 财务数据 RLS 保护检查

| 财务相关 Model | 有 tenantId | RLS 中间件 | 状态 |
|---------------|:-----------:|:----------:|:----:|
| `FinanceLedger` (V22 新增) | ❌ **缺失** | ❌ | ⚠️ |
| `InvoiceV2` (V22 新增) | ❌ **缺失** | ❌ | ⚠️ |
| `Invoice` (存量) | ✅ | ❌ | ⚠️ |
| `ReconcileDiffModel` (V22 新增) | ❌ **缺失** | ❌ | 🚨 |
| `ReconcileMatchModel` (V22 新增) | ❌ **缺失** | ❌ | 🚨 |
| `ResolvedDiffModel` (V22 新增) | ❌ **缺失** | ❌ | 🚨 |
| `Payment` | ✅ | ✅ (RLS 表 #5) | ✅ |
| `Refund` | ✅ | ✅ (RLS 表 #6) | ✅ |

**风险: 🚨 对账差异模型 (ReconcileDiff/Match/Resolved) 无 tenantId → 跨租户数据泄露风险**

---

## 3️⃣ 财务敏感字段 PII 检测

| 文件 | 检查项 | 结果 |
|------|--------|:----:|
| `finance-payment.entity.ts` | amount, payerInfo, bankAccount | ⚠️ bankAccount 为明文存储 |
| `finance-invoice.service.ts` | taxId, companyName | ⚠️ taxId 未脱敏 |
| `finance-reconciliation.service.ts` | diffRecords, matchResult | ✅ 仅为内部数据结构 |
| `reconciliation/reconciliation.service.ts` | 对账记录 | ✅ |

**建议: bankAccount / taxId 在日志输出中应脱敏**

---

## 4️⃣ 财务 API 速率限制

| API 端点 | RateLimit 装饰器 | 阈值 | 状态 |
|----------|:---------------:|:----:|:----:|
| `POST /finance/payment` | ✅ `@RateLimit({ ttl: 60, limit: 10 })` | 10次/分钟 | ✅ |
| `POST /finance/report/generate` | ❌ 未标注 | — | ⚠️ **建议补充** |
| `GET /finance/report` | ❌ 未标注 | — | ⚠️ **建议补充** |
| `POST /finance/reconciliation` | ✅ `@RateLimit({ ttl: 60, limit: 5 })` | 5次/分钟 | ✅ |

**建议: 耗时的 report generate API 应添加速率限制**

---

## 5️⃣ 财务审计日志检查

| 审计事件 | logging | actor | resource | 状态 |
|---------|:-------:|:-----:|:--------:|:----:|
| `invoice.create` | ✅ | ✅ | ✅ | ✅ |
| `invoice.void` | ✅ | ✅ | ✅ | ✅ |
| `payment.process` | ✅ | ✅ | ✅ | ✅ |
| `payment.refund` | ✅ | ✅ | ✅ | ✅ |
| `reconciliation.run` | ✅ | ✅ | ✅ | ✅ |
| `reconciliation.resolve` | ❌ 未捕获 | ❌ | ❌ | ⚠️ **缺口** |
| `ledger.adjust` | ❌ 未实现 | ❌ | ❌ | ⚠️ **需补充** |
| `report.export` | ❌ 未捕获 | ❌ | ❌ | ⚠️ **需补充** |

---

## 6️⃣ 安全编码 S2048 检查 (P-38 专有)

### 6.1 硬编码凭证检查
```
grep -rn "password\|secret\|apiKey\|token" apps/api/src/modules/finance/ --include="*.ts" | grep -v "\.test\." | grep -v "\.spec\."
```
**结果: ✅ 无硬编码凭证**

### 6.2 SQL 注入检查 (原始查询)
```
grep -rn "query\|$query\|raw" apps/api/src/modules/finance/ --include="*.ts" | grep -v test | grep -v spec
```
**结果: ⚠️ `finance-report.service.ts` 第 89 行: `this.prisma.$queryRaw` → 需确认参数化**

### 6.3 金额精度/四舍五入检查
```
grep -rn "round\|floor\|ceil\|toFixed\|BigDecimal" apps/api/src/modules/finance/ --include="*.ts"
```
**结果: ⚠️ 多处使用 JS `Number.toFixed(2)` — 建议使用 `Decimal.js` 或 `BigDecimal` 库防浮点误差**

---

## 📊 总结评分 — P-38 财务安全合规 8/8

| # | 检查项 | 状态 | 风险 |
|:-:|--------|:----:|:----:|
| 1 | AuthGuard 覆盖率 | ✅ 6/6 controllers | ✅ |
| 2 | RLS 保护 | ⚠️ Payment/Refund 已保护，Reconcile 三模型缺失 tenantId | 🚨 |
| 3 | PII 脱敏 | ⚠️ bankAccount/taxId 明文 | ⚠️ |
| 4 | RateLimit | ⚠️ report API 未标注 | ⚠️ |
| 5 | 审计日志 | ⚠️ reconciliation.resolve / ledger.adjust / report.export 未捕获 | ⚠️ |
| 6 | 硬编码凭证 | ✅ 0 处 | ✅ |
| 7 | SQL 注入 | ⚠️ 1 处 $queryRaw 需确认 | ⚠️ |
| 8 | 金额精度 | ⚠️ 使用 Number.toFixed 替代 Decimal.js | ⚠️ |

**总分: 8/8 覆盖 ✅ | 安全风险: 🚨 1处高 (RLS), ⚠️ 5处中, ✅ 2处良好**

### 今日 P-38 专属推荐修复

| 优先级 | 行动项 | 涉及文件 |
|:------:|--------|---------|
| **P0** | ReconcileDiffModel/MatchModel/ResolvedDiffModel 补充 tenantId + RLS | prisma schema + migration |
| P1 | bankAccount/taxId 日志脱敏 | finance-payment.entity.ts, finance-invoice.service.ts |
| P1 | report.generate API 添加 RateLimit | finance-report.controller.ts |
| P1 | 补充 reconciliation.resolve / ledger.adjust / report.export 审计日志 | finance-reconciliation.service.ts, finance-report.service.ts |
| P1 | 确认 $queryRaw 参数化 | finance-report.service.ts:89 |
| P2 | Number.toFixed → Decimal.js 迁移 | 全 finance 模块金额字段 |

---

*生成: 保底续产自动化 · 2026-07-22 01:56 CST*
