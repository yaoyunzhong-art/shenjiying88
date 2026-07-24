# finance — 财务管理模块

> 多租户零售平台 Payment & Refund 全生命周期管控中枢
> Phase-38 T168 财务冲刺核心交付模块

**路径**: `apps/admin-web/app/finance/`

---

## 模块概述

财务管理模块是 shenjiying88 平台的核心业务模块之一，承担支付收银、退款审批、自动对账、预算管控与损益分析五大职能。使用反模式 v4 安全防御体系（幂等键 + 乐观锁 + 状态机 + 多租户隔离），保障交易资金安全与账务一致性。

---

## 核心功能

| 功能 | 说明 |
|------|------|
| **Payment 全生命周期管理** | 创建 → PENDING → SUCCESS/FAILED → REFUNDED，支持多渠道支付 |
| **Refund 审批流程** | REQUESTED → APPROVED → COMPLETED / REJECTED，含管理员审批双层校验 |
| **多渠道支付接入** | 微信支付、支付宝、银行卡、现金、余额支付 |
| **幂等键保护** | 前端生成 UUID idempotency-key，同 key 重复请求返回原记录 |
| **乐观锁并发控制** | version 字段保证写入一致性，冲突时拒绝过时写入 |
| **状态机校验** | 非法状态转换 UI 级禁用（如 PENDING → REFUNDED 直接拦截） |
| **财务 Dashboard** | 营收/支出/对账完成率等关键财务指标实时展示 |
| **预算管理** | 预算编制、执行跟踪、偏差分析 |
| **发票管理** | 发票开具、查询、作废 |
| **对账管理** | 交易对账、差异定位（discrepancies）、规则引擎 |
| **支出管理** | 供应商付款、批量打款 |
| **损益分析** | 收入/成本/费用分维度展示 |
| **Cron 超时清理** | 超时 PENDING 支付自动过期清理 |

---

## 目录结构

```
finance/
├── [id]/                       # 单笔交易详情页
│   ├── loading.tsx             # 骨架屏加载态
│   ├── page.test.ts            # Node Test 单元测试
│   ├── page.test.tsx           # React Testing Library 组件测试
│   └── page.tsx                # Payment/Refund 完整详情
├── budget/                     # 预算管理
│   ├── loading.tsx
│   ├── page.test.ts
│   ├── page.test.tsx
│   └── page.tsx
├── dashboard/                  # 财务概览仪表盘
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── invoices/                   # 发票管理
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── payouts/                    # 支出管理
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── profit-loss/                # 损益分析
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── reconciliation/             # 对账管理
│   ├── discrepancies/
│   │   └── [id]/
│   │       ├── loading.tsx
│   │       ├── page.test.tsx
│   │       └── page.tsx
│   ├── rules/                  # 对账规则配置
│   │   ├── loading.tsx
│   │   ├── page.test.tsx
│   │   └── page.tsx
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── rules/                      # 财务规则配置（凭证规则、费用规则）
│   ├── loading.tsx
│   ├── page.test.tsx
│   └── page.tsx
├── components/                 # (预留) 共享组件
├── hooks/                      # (预留) 自定义 hooks
├── loading.tsx                 # 页面级加载态
├── not-found.tsx               # 404 页面
├── error.tsx                   # ErrorBoundary 兜底
├── page.tsx                    # 主页: Payment & Refund 列表
├── page.test.ts                # Node Test 页面测试
├── page.test.tsx               # React Testing Library 测试
├── finance.test.ts             # 核心业务逻辑单元测试
└── README.md                   # 本文件
```

---

## 核心数据模型

### Payment

```typescript
interface Payment {
  id: string              // 支付单 ID
  tenantId: string        // 租户 ID（多租户隔离）
  orderId: string         // 关联订单 ID
  amountCents: number     // 金额（分），前端 UI 用 formatAmount 转换
  currency: string        // 币种: CNY / USD / EUR
  method: PaymentMethod   // 支付方式: WECHAT | ALIPAY | CARD | CASH | BALANCE
  status: PaymentStatus   // 状态: PENDING | SUCCESS | FAILED | REFUNDED
  version: number         // 乐观锁版本号，update 必传
  idempotencyKey: string  // 幂等键 UUID v4
  transactionId?: string  // 第三方交易流水号
  failureReason?: string  // 失败原因
  createdAt: string       // 创建时间
}
```

### Refund

```typescript
interface Refund {
  id: string              // 退款单 ID
  tenantId: string        // 租户 ID
  paymentId: string       // 关联 Payment ID
  orderId: string         // 关联订单 ID
  amountCents: number     // 退款金额（分）
  reason: string          // 退款原因
  status: RefundStatus    // 状态: REQUESTED | APPROVED | COMPLETED | REJECTED
  version: number         // 乐观锁版本号
  requestedBy: string     // 申请人
  createdAt: string       // 创建时间
}
```

### State Machine

```
Payment:  PENDING ──→ SUCCESS ──→ REFUNDED
              │                     ↑
              └──→ FAILED ──────────┘
              
Refund:   REQUESTED ──→ APPROVED ──→ COMPLETED
              │
              └──→ REJECTED
```

### STATUS_COLORS 映射

| 状态 | 背景色 | 前景色 |
|------|--------|--------|
| PENDING | `#fef3c7` | `#92400e` |
| SUCCESS | `#d1fae5` | `#065f46` |
| FAILED | `#fee2e2` | `#991b1b` |
| REFUNDED | `#e5e7eb` | `#374151` |
| REQUESTED | `#dbeafe` | `#1e40af` |
| APPROVED | `#fef3c7` | `#92400e` |
| COMPLETED | `#d1fae5` | `#065f46` |
| REJECTED | `#fee2e2` | `#991b1b` |

---

## API 端点

| Method | Endpoint | 说明 |
|--------|----------|------|
| GET | `/api/finance/payments?tenantId={id}` | 获取支付列表（分页+筛选） |
| GET | `/api/finance/payments/{id}?tenantId={id}` | 单笔支付详情 |
| POST | `/api/finance/payments` | 创建支付（需传入 idempotency-key header） |
| PUT | `/api/finance/payments/{id}` | 更新支付（需传 version 乐观锁） |
| GET | `/api/finance/refunds?tenantId={id}` | 获取退款列表 |
| GET | `/api/finance/refunds/{id}?tenantId={id}` | 退款详情 |
| POST | `/api/finance/refunds` | 创建退款申请 |
| PUT | `/api/finance/refunds/{id}/approve` | 审批退款（双校验: 权限 + version） |
| GET | `/api/finance/budget?tenantId={id}` | 预算数据 |
| GET | `/api/finance/invoices?tenantId={id}` | 发票列表 |
| GET | `/api/finance/reconciliation?tenantId={id}` | 对账数据 |
| GET | `/api/finance/reconciliation/discrepancies` | 对账差异列表 |
| GET | `/api/finance/rules?tenantId={id}` | 财务规则 |

---

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `@m5/ui` | Card, StatusBadge, Tabs, DataTable 等 UI 组件库 |
| `@m5/sdk` | API 客户端 & 幂等键注入 (idempotency-key) |
| `@m5/types` | Payment, Refund 等 TypeScript 业务类型 |
| `apps/admin-web/app/bootstrap` | 应用引导、租户上下文初始化 |
| `apps/admin-web/app/components` | 通用组件 (DetailActionBar 等) |
| `apps/admin-web/app/alerts` | 异常交易告警联动 |

---

## 使用示例

### 格式化金额

```typescript
formatAmount(9900)              // → "¥99.00"
formatAmount(129900, 'CNY')     // → "¥1299.00"
formatAmount(1000, 'USD')       // → "USD 10.00"
formatAmount(0)                 // → "¥0.00"
formatAmount(-500)              // → "¥-5.00"
```

### 生成幂等键

```typescript
const idempotencyKey = generateUUID()
// → "a1b2c3d4-e5f6-4789-abcd-ef0123456789"
```

### 状态机校验

```typescript
canTransition('PENDING', 'SUCCESS')    // → true
canTransition('PENDING', 'REFUNDED')   // → false（必须先 SUCCESS）
canTransition('FAILED', 'SUCCESS')     // → false（不可逆转）
canTransitionRefund('REQUESTED', 'APPROVED')   // → true
canTransitionRefund('REJECTED', 'APPROVED')    // → false
```

### 筛选支付列表

```typescript
filterPaymentsByStatus(payments, 'SUCCESS')     // 所有成功支付
filterPaymentsByMethod(payments, 'WECHAT')      // 微信支付
```

---

## 测试说明

测试文件覆盖情况及运行方式：

### 测试文件

| 文件 | 类型 | 覆盖范围 |
|------|------|----------|
| `finance.test.ts` | Node Test (node:test) | 正例 10+ / 反例 8 / 边界 5 — 核心业务逻辑 |
| `page.test.ts` | Node Test | 页面级数据流、状态机、辅助函数 |
| `page.test.tsx` | React Testing Library | UI 组件渲染、用户交互 |
| `[id]/page.test.ts` | Node Test | 详情页逻辑 |
| `[id]/page.test.tsx` | React Testing Library | 详情页渲染 |
| `budget/page.test.ts` | Node Test | 预算页面逻辑 |
| `dashboard/page.test.tsx` | RTL | 仪表盘渲染 |
| 各子目录 `page.test.tsx` | RTL | 各子页面组件 |

### 运行测试

```bash
# 运行所有财务模块测试
node --test apps/admin-web/app/finance/finance.test.ts

# 运行页面级 Node Test
node --test apps/admin-web/app/finance/page.test.ts

# 运行所有子目录测试
find apps/admin-web/app/finance -name '*.test.ts' -o -name '*.test.tsx' | xargs node --test
```

### 测试类型

测试采用 **L1 JMeter 模式**，每种功能需覆盖：
- ✅ **正例 (Happy Path)**: 正常业务流程
- ❌ **反例 (Error Path)**: 非法输入、状态违例
- ⚠️ **边界 (Edge Case)**: 空值、极值、0 值

---

## 安全基线 (Security Baseline)

- ✅ **幂等键 (idempotency-key)** — UUID v4，重复请求返回原记录
- ✅ **乐观锁 (version)** — 写入冲突检测，version 不匹配拒绝写入
- ✅ **状态机校验** — Payment/Refund 合法状态流转，UI 禁用非法按钮
- ✅ **多租户隔离 (TenantGuard)** — 每个请求携带 tenantId，数据严格隔离
- ✅ **输入校验** — 金额非负、渠道白名单
- ✅ **边界三态覆盖** — loading / error / not-found 每页面全覆盖

---

## 注意事项

1. **幂等键必传**: 创建 Payment 时前端必须生成 UUID 作为 `idempotencyKey`，后端同 key 返回原记录
2. **乐观锁**: 任何 update 操作必须传入当前 `version`，后端 version 不匹配返回 409 Conflict
3. **状态不可逆转**: `SUCCESS` → `FAILED` 或 `FAILED` → `SUCCESS` 均为非法转换
4. **金额分单位**: 所有金额以"分"为单位存储，前端展示用 `formatAmount` 转换为元
5. **Cron 超时清理**: PENDING 状态超过 N 分钟的支付会被自动标记为 FAILED
6. **多租户注意**: 所有 API 请求必须携带 `tenantId`，同一页面内切换租户触发数据刷新
7. **Mock 数据**: 开发模式使用前端 Mock 数据，生产环境指向真实 API
