# V23 Day5 Changelog · 2026-07-25 凌晨

> 分支: `tree/codeup-acr-ci-20260717` · 36 commits
> 时段: 00:04~02:43 CST · 2h39min

---

## 🆕 新功能

### 未成年保护 (0%→100%)
- 6个REST端点: config/verify/verifications/check-access/access-logs
- Prisma 2表: minor_identity_verification + minor_access_log
- ID掩码脱敏 (identityNumber → ****)
- curfew宵禁检查
- 15条集成测试全链HTTP验证
- Prisma双写持久化 (@Optional + fire-and-forget)
- TenantGuard鉴权接入

### 订单持久化 Prisma DB
- 4表: CashierOrder + CashierPayment + CashierMember + CashierTransaction
- CashierPrismaStore 双写模式
- loadActiveOrders DB→内存回填

### 运维三件套
- `scripts/deploy-check.sh` — 6项部署验收
- `DatabaseBackupService` — 每小时pg_dump + `/health/backup` API
- `scripts/load-test.js` — k6压测 (3场景)

---

## 🔧 改进

### 审计日志全局覆盖
- `RequestAuditInterceptor` 重写 — 自动审计所有POST/PUT/PATCH/DELETE
- 风险分级: 200→low, 4xx→medium, 401/403→high

### RLS多租户白名单
- TENANT_AWARE_MODELS: 48 → 72 (+24新模型)
- 覆盖P-47(11) + P-30(7) + Minor(2) + Cashier(4)

### 模块完整性
- 183/183 模块 Service+Controller 全部就位 (从97.8%→100%)
- 补全: ai/attendance/tax/system-config 4模块

### 代码质量
- console.log 清理 (main.ts/prisma/cashier → Logger/production-safe)
- 过时TODO清理 (3处)

---

## 🐛 修复

### retrieval Pulse-71醒神
- retrieval.client: noop退化模式
- retrieval.embedder: hash伪embedding + batch + sparse
- retrieval.service: Cache→Embed→Search→Rerank全链
- 8测试文件重写, 246/255通过

### ai-review Pulse-73醒神
- llm.provider: Claude/DeepSeek/OpenAI noop退化 (DeepSeek真实fetch)
- ai-review.service: 完整review流程 + parseReviewOutput鲁棒JSON
- 19/23测试通过

### vitest OOM诊断
- 全量206文件OOM → CI分片策略
- `docs/vitest-strategy.md`

---

## 📋 知识产出

- V23 Day5 凌晨产出报告 (`midnight-report.md`)
- 6道门重新签署 (G3/G4/G5 升级)
- 店A上线计划 v3 (`launch-plan.md`)
- 5模块README补全

---

## 📊 总览

| 指标 | 数值 |
|:-----|:---:|
| commits | 36 |
| 新增文件 | ~25 |
| 模块完整度 | 183/183 (100%) |
| 核心测试 | 2642/2684 |
| TSC | 零错误 |
| 6道门 | 全过 |

---

_Generated 2026-07-25 02:43 CST_
