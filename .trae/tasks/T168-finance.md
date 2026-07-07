# T168 财务模块 · Payment + Refund + 幂等键 (Phase-38)

> 🦞 **"T168 = Payment 支付单 + Refund 退款单 + Idempotency Key + 乐观锁 + 状态机 = 业务闭环"**
> 🏆 **目标**: Phase-38 step 1 100% 收官, P1 业务深耕 4/6 完成

---

## 1. 背景

Phase-6 finance 模块已实现 **Ledger/Account/Settlement/Invoice** 基础能力。

T168 在此基础上**新增 P1 业务深耕能力**:
- **Payment 支付单**: 订单→支付单 (PENDING → SUCCESS / FAILED / REFUNDED)
- **Refund 退款单**: 退款请求 (REQUESTED → APPROVED → COMPLETED / REJECTED)
- **Idempotency Key**: 防止重复扣款 (12-factor API 契约)
- **乐观锁**: version 字段 (DR-36/DR-37 一致)
- **状态机**: 反模式 v4 state-machine-pattern 防御
- **Cron 超时清理**: PENDING > 15min 自动 FAILED

---

## 2. 范围

### 2.1 新增文件

**API** (`apps/api/src/modules/finance/`):
- `finance-payment.entity.ts` (约 110 行) - Payment + Refund + Idempotency 实体
- `finance-payment.service.ts` (约 480 行) - @Injectable 业务逻辑
- `finance-payment.controller.ts` (约 180 行) - 15 endpoint
- `finance-payment.cron.ts` (约 130 行) - 超时清理 + 对账
- `finance-payment.module.ts` (约 25 行) - @Module
- `finance-payment.test.ts` (约 280 行) - 19+ 单测
- `finance-payment.controller.test.ts` (约 360 行) - 35+ 控制器测试
- `finance-payment.module.test.ts` (约 50 行) - 14+ 模块测试

**前端**:
- `apps/admin-web/app/finance/page.tsx` (约 400 行) - 财务页面 (Payment/Refund 列表 + 创建对话框)

**反模式库 v4**:
- `knowledge/anti-patterns/v4/idempotency-key-pattern.md` (约 200 行)

**任务卡**: `.trae/tasks/T168-finance.md` (本文件)

**E2E**: `scripts/phase38-e2e-finance.ts` (待创建)

### 2.2 不修改现有文件

- `finance.service.ts` (Phase-6 Ledger/Account/Settlement/Invoice) - 不动
- `finance.controller.ts` (Phase-6) - 不动
- `finance.module.ts` - 不动 (新增独立 FinancePaymentModule)

---

## 3. 验收标准 (AC)

### AC-1: Payment 实体定义
- [ ] `Payment` 接口含 id/tenantId/orderId/amountCents/currency/method/status/version/idempotencyKey
- [ ] `PaymentStatus` 枚举: PENDING / SUCCESS / FAILED / REFUNDED
- [ ] `PaymentMethod` 枚举: WECHAT / ALIPAY / CARD / CASH / BALANCE

### AC-2: Refund 实体定义
- [ ] `Refund` 接口含 id/tenantId/paymentId/orderId/amountCents/reason/status/version/requestedAt/approvedAt/completedAt
- [ ] `RefundStatus` 枚举: REQUESTED / APPROVED / COMPLETED / REJECTED

### AC-3: PaymentService 创建 Payment
- [ ] `create(input)` 校验 amountCents > 0
- [ ] 同 (tenantId, idempotencyKey) 已存在 PENDING/SUCCESS 直接返回 (幂等)
- [ ] 写入审计 audit log
- [ ] 初始 status=PENDING, version=1

### AC-4: 状态机 (反模式 v4 state-machine-pattern)
- [ ] PENDING → SUCCESS (markSuccess)
- [ ] PENDING → FAILED (markFailed)
- [ ] SUCCESS → REFUNDED (markRefunded - 通过 completeRefund 触发)
- [ ] 跳级防御 (e.g. PENDING → REFUNDED 直接抛 ConflictException)

### AC-5: 乐观锁 (反模式 v4 optimistic-lock-pattern)
- [ ] `update(id, tenantId, version, patch)` 校验 version
- [ ] version 冲突抛 ConflictException, 客户端 retry

### AC-6: 幂等键 (反模式 v4 idempotency-key-pattern)
- [ ] `getByIdempotencyKey(tenantId, key)` 返回已有 Payment (若存在)
- [ ] 创建时强制 idempotencyKey 必填
- [ ] 同 key 创建 → 返回原 Payment + audit log 标记 "duplicate suppressed"

### AC-7: Refund 状态机
- [ ] `requestRefund(input)` 创建 status=REQUESTED
- [ ] `approveRefund(id, tenantId, approver)` REQUESTED → APPROVED
- [ ] `rejectRefund(id, tenantId, reason)` REQUESTED → REJECTED
- [ ] `completeRefund(id, tenantId)` APPROVED → COMPLETED, 触发 Payment.status = REFUNDED + 联动 Ledger.REFUND

### AC-8: 跨租户防御
- [ ] `getById(id, tenantId)` 跨租户返回 null
- [ ] `markSuccess(id, wrongTenant)` 抛 NotFoundException
- [ ] `requestRefund(input)` tenantId 必填

### AC-9: Cron 超时清理
- [ ] `InventoryPaymentCron` 不存在, 是 `FinancePaymentCron.sweepExpiredPayments()`
- [ ] PENDING > 15min 自动 FAILED + reason="timeout by cron"
- [ ] 重入锁 (scanInProgress)

### AC-10: 联动 Ledger
- [ ] Payment SUCCESS 触发 Ledger.REVENUE 流水 (amount = amountCents, balance = 当前 + amount)
- [ ] Refund COMPLETED 触发 Ledger.REFUND 流水 (amount = refundAmount, balance = 当前 - amount)
- [ ] 跨租户隔离 (Ledger.tenantId = Payment.tenantId)

### AC-11: 审计日志
- [ ] `auditLogs[paymentId] = [AuditEntry...]`
- [ ] 每次状态变更写入 audit entry (action/from/to/actor/at)

### AC-12: Controller 路由
- [ ] `POST /api/finance/payments` - 创建 Payment
- [ ] `GET /api/finance/payments/:id` - 查询
- [ ] `GET /api/finance/payments` - 列表 (filter by status/method)
- [ ] `POST /api/finance/payments/:id/success` - 标记成功
- [ ] `POST /api/finance/payments/:id/fail` - 标记失败
- [ ] `PUT /api/finance/payments/:id` - 更新 (乐观锁)
- [ ] `POST /api/finance/payments/:id/refunds` - 创建 Refund
- [ ] `GET /api/finance/payments/:id/refunds` - Refund 列表
- [ ] `POST /api/finance/refunds/:rid/approve` - 批准
- [ ] `POST /api/finance/refunds/:rid/reject` - 拒绝
- [ ] `POST /api/finance/refunds/:rid/complete` - 完成
- [ ] `GET /api/finance/refunds/:rid` - 查询 Refund
- [ ] `GET /api/finance/refunds` - 列表
- [ ] `GET /api/finance/payments/:id/audit` - 审计日志
- [ ] `GET /api/finance/cron/metrics` - Cron 指标

### AC-13: admin-web 页面
- [ ] 'use client' React 组件
- [ ] Payment 列表 (status 筛选 / method 筛选)
- [ ] 创建 Payment 对话框
- [ ] Refund 列表
- [ ] 状态徽章 (PENDING 黄色 / SUCCESS 绿色 / FAILED 红色 / REFUNDED 灰色)
- [ ] Toast 反馈

### AC-14: 反模式库 v4
- [ ] `idempotency-key-pattern.md` 8 反模式 + 8 实施清单

---

## 4. 实施步骤

### Step 1: 任务卡 + 反模式库
- [x] `.trae/tasks/T168-finance.md`
- [ ] `knowledge/anti-patterns/v4/idempotency-key-pattern.md`

### Step 2: 实体 + Service + Controller + Cron + Module
- [ ] `finance-payment.entity.ts`
- [ ] `finance-payment.service.ts`
- [ ] `finance-payment.controller.ts`
- [ ] `finance-payment.cron.ts`
- [ ] `finance-payment.module.ts`
- [ ] 注册到 `app.module.ts`

### Step 3: 测试
- [ ] `finance-payment.test.ts` (19+ 单测)
- [ ] `finance-payment.controller.test.ts` (35+)
- [ ] `finance-payment.module.test.ts` (14+)
- [ ] 验证: `node --import tsx --test` 全 PASS
- [ ] 验证: `npx tsc --noEmit` 0 error

### Step 4: admin-web
- [ ] `apps/admin-web/app/finance/page.tsx`

### Step 5: E2E + HEARTBEAT
- [ ] `scripts/phase38-e2e-finance.ts` (10+ AC E2E)
- [ ] HEARTBEAT Part 18 战报
- [ ] race-safe atomic commit

---

## 5. 风险

### 风险 1: 与现有 finance.service.ts / finance.controller.ts 重叠
- **缓解**: T168 走独立文件 `finance-payment.*`, 路由前缀 `/api/finance/payments` + `/api/finance/refunds`
- **不修改**: 现有 `finance.service.ts` 的 Ledger/Account/Settlement/Invoice

### 风险 2: 幂等键冲突
- **缓解**: Idempotency Key 强制 (tenantId, key) 唯一, 复用返回原 Payment

### 风险 3: 退款联动 Ledger 失败
- **缓解**: 退款 + 流水 在同一事务边界 (虽然 in-memory Map 是伪事务, 但 catch + rollback 写回)

### 风险 4: race-safe cron checkout HEAD -- reset
- **缓解**: race-safe atomic commit + HEARTBEAT 立即 commit, 不用 git checkout -- file

---

## 6. DR-38 决策

- **DR-38 决策 1**: Payment 状态机 `PENDING → SUCCESS/FAILED/REFUNDED` (单向不回退)
- **DR-38 决策 2**: Refund 状态机 `REQUESTED → APPROVED → COMPLETED` 或 `REQUESTED → REJECTED`
- **DR-38 决策 3**: 幂等键必填, 服务端强制唯一索引 (in-memory Map)
- **DR-38 决策 4**: 路由独立 `/api/finance/payments` + `/api/finance/refunds`
- **DR-38 决策 5**: Payment SUCCESS 联动 Ledger.REVENUE, Refund COMPLETED 联动 Ledger.REFUND (跨调用 finance.recordLedger)

---

## 7. 进度跟踪

- [ ] Step 1: 任务卡 + 反模式库
- [ ] Step 2: 实体 + Service + Controller + Cron + Module
- [ ] Step 3: 测试 (60+ 单测)
- [ ] Step 4: admin-web
- [ ] Step 5: E2E + HEARTBEAT + commit

---

> **"T168 = Payment + Refund + Idempotency = 12-factor API 业务契约"**