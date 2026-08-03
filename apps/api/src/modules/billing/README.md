# billing — 计费结算模块

> 版本: V23 | 维护人: 树哥A | 最后更新: 2026-07-28

## 概述

计费结算模块提供多租户用量计费核心能力，涵盖账单计算、折扣策略、发票管理和支付状态跟踪。支持四级定价套餐（free/basic/pro/enterprise），阶梯折扣与优惠码并存的灵活性策略。

**设计原则:**
- 用量驱动计费 → 按 API 调用/存储/带宽/坐席线性计费
- 多级折扣 → 批量阶梯 + 优惠码双重叠加
- Invoice 闭环 → 计算→开票→支付→状态追踪
- 租户隔离 → 所有数据按 tenantId 隔离

**边界约束:**
- ❌ 不处理 SaaS 套餐/订阅管理（见 `saas-billing` 模块）
- ❌ 不处理实际资金支付渠道对接（对外只暴露 Invoice 状态）
- ❌ 不处理财务记账/报表（见 `reports` 模块）
- ✅ 聚焦 用量→费用 → Invoice → 支付状态 的闭环

## 核心能力

| 能力 | 说明 |
|------|------|
| ✅ 账单计算 | 按用量(API/存储/带宽/坐席) + 套餐层级计算费用 |
| ✅ 折扣策略 | 批量阶梯折扣(5%/10%/15%) + 优惠码(百分比/固定金额) |
| ✅ 发票管理 | 发票生成、列表查询、生命周期管理 |
| ✅ 支付管理 | 支付标记、状态查询、支付记录追踪 |
| ✅ 计费统计 | 总体计费/已收/待收汇总统计 |
| ✅ 多币种支持 | CNY / USD / EUR 三种货币 |
| ✅ 多租户隔离 | TenantGuard + RBAC 权限控制 |

## 技术架构

### 模块依赖

```
BillingModule
├── BillingController    → REST API (TenantGuard + RBAC)
├── BillingService       → 核心计费引擎
│   ├── calculateBill()  → 用量按定价表计算
│   ├── applyDiscount()  → 折扣策略引擎
│   ├── generateInvoice()→ 发票生成
│   ├── payInvoice()     → 支付标记
│   └── getBillingStats()→ 统计汇总
└── 外部依赖:
    └── TenantGuard       → 多租户隔离
    └── IdentityAccess    → 权限装饰器
```

### 定价模型

**四级定价表 (hardcoded in service):**

| 套餐 | 基础月费 | API调用(元/次) | 存储(元/GB) | 带宽(元/GB) | 坐席(元/个) |
|------|----------|----------------|-------------|-------------|-------------|
| free | ¥0 | ¥0 | ¥0 | ¥0 | ¥0 |
| basic | ¥99 | ¥0.001 | ¥0.10 | ¥0.05 | ¥10 |
| pro | ¥499 | ¥0.0005 | ¥0.08 | ¥0.03 | ¥8 |
| enterprise | ¥2,999 | ¥0.0002 | ¥0.05 | ¥0.02 | ¥5 |

**折扣策略:**

| 类型 | 条件 | 折扣 | 说明 |
|------|------|------|------|
| 阶梯 | 总额 ≥ ¥1,000 | 5% | 自动批量折扣 |
| 阶梯 | 总额 ≥ ¥5,000 | 10% | 大客户折扣 |
| 阶梯 | 总额 ≥ ¥10,000 | 15% | 企业批量折扣 |
| 优惠码 | NEWUSER20 | 20%减至¥500封顶 | 新客(basic/pro) |
| 优惠码 | ANNUAL30 | 30%减至¥5,000封顶 | 年付优惠 |
| 优惠码 | VIP100 | 固定减¥100(满¥200) | VIP(pro/enterprise) |

**税费:** 13% VAT (硬编码)

### 状态模型

**发票状态机:**
```
draft → issued → paid → cancelled
```

### 实体类型

| 实体 | 核心字段 | 说明 |
|------|----------|------|
| `BillRequest` | tenantId, tier, usage, billingPeriod, currency, couponCode | 账单计算请求 |
| `BillResult` | tenantId, tier, lineItems, subtotal, discountAmount, taxAmount, total | 账单计算结果 |
| `Invoice` | id, tenantId, invoiceNo, status, lineItems, totalAmount, dueAt | 发票 |
| `PaymentInfo` | invoiceId, paymentId, status, amount, method, paidAt | 支付信息 |
| `DiscountPolicy` | code, type(percentage/fixed), value, minAmount, maxAmount | 折扣策略 |

## 配置说明

### 隐式配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 定价表 | 四级硬编码 | ⚠️ 应迁移至数据库/配置中心 |
| 折扣策略 | 3个内置优惠码 | ⚠️ 应支持动态新增/编辑 |
| 税率 | 13% (VAT) | 硬编码，需支持按地区配置 |
| 账单周期 | 按请求传递 | 支持自定义起止时间 |
| 数据存储 | 内存数组 | ⚠️ 生产需迁移至数据库 |

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| 无 | - | 当前模块无独立环境变量，所有配置硬编码 |

> **后续优化:** 定价表和折扣策略应从硬编码迁移至数据库/配置中心管理，支持动态定价。

## API / 接口

### REST API 端点

| 方法 | 路径 | 权限 | 说明 |
|:-----|:-----|:-----|:-----|
| POST | `/api/billing/calculate` | `settlement:read` | 根据用量和套餐计算费用 |
| POST | `/api/billing/invoices` | `settlement:approve` | 先生成账单再生成发票 |
| GET | `/api/billing/invoices` | `settlement:read` | 列出指定租户的发票 |
| GET | `/api/billing/invoices/:id` | `settlement:read` | 查询发票详情 |
| POST | `/api/billing/invoices/:id/pay` | `settlement:pay` | 支付指定发票 |
| GET | `/api/billing/payments/:invId` | `settlement:read` | 查询支付状态 |
| GET | `/api/billing/discounts` | `settlement:read` | 列出所有折扣策略 |
| GET | `/api/billing/stats` | `settlement:read` | 获取计费统计 |

### 请求/响应示例

**计算账单:**
```bash
curl -X POST http://localhost:3000/api/billing/calculate \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "demo-tenant",
    "tier": "pro",
    "usage": { "apiCalls": 10000, "storageGB": 50, "bandwidthGB": 200, "seats": 10 },
    "billingPeriod": { "start": "2026-07-01", "end": "2026-07-31" },
    "currency": "CNY"
  }'
```

**生成发票:**
```bash
curl -X POST http://localhost:3000/api/billing/invoices \
  -H "x-tenant-id: demo-tenant" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "demo-tenant",
    "tier": "basic",
    "usage": { "apiCalls": 5000, "storageGB": 20, "bandwidthGB": 100, "seats": 5 },
    "billingPeriod": { "start": "2026-07-01", "end": "2026-07-31" },
    "currency": "CNY",
    "couponCode": "NEWUSER20"
  }'
```

### RBAC 角色权限说明

| 权限标识 | 适用范围 | 分配对象 |
|----------|----------|----------|
| `settlement:read` | 账单计算、发票查询、支付状态、折扣列表、统计 | 财务人员 / 运营人员 |
| `settlement:approve` | 生成发票 | 财务主管 |
| `settlement:pay` | 支付发票标记 | 出纳 / 财务主管 |

### 数据安全注意事项

- 所有端点强制 `@UseGuards(TenantGuard)` + `@RequireTenantScope()` 多重租户隔离
- 发票金额等敏感数据通过 RBAC 权限控制访问
- 支付状态仅允许授权用户查看
- ⚠️ 所有数据当前存储于内存，重启后丢失，生产环境必须使用持久化数据库
- ⚠️ 折扣码使用次数计数器在内存中，重启后重置

## 监控指标

### 关键监控指标

| 指标 | 类型 | 说明 | 建议阈值 |
|------|------|------|----------|
| `billing.calculate.count` | Counter | 账单计算请求次数 | - |
| `billing.invoice.created` | Counter | 发票生成数量 | - |
| `billing.discount.used` | Counter | 优惠码使用次数 | - |
| `billing.revenue.total` | Gauge | 总收入(gauge) | - |
| `billing.pending.amount` | Gauge | 待收款总额 | 🟡 持续增长 |
| `billing.invoice.draft` | Gauge | 草稿发票数 | 🟡 > 100 |
| `billing.payment.success.rate` | Gauge | 支付成功率 | 🔴 < 95% |

### 告警规则

| 告警名称 | 条件 | 级别 | 响应 |
|----------|------|------|------|
| 待收款过高 | pendingAmount > ¥100,000 | P1 | 通知财务催收 |
| 优惠码滥用 | 单个优惠码使用 > 80% 上限 | P2 | 评估是否调整策略 |
| 开票失败 | 连续 5 次 calculate 返回错误 | P2 | 检查定价表配置 |
| 草稿堆积 | draft 发票数 > 100 | P3 | 提醒清理过期草稿 |

## 运维要求

### 健康检查

```bash
# 计算接口存活检测
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/billing/calculate \
  -H "x-tenant-id: health-check" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"health-check","tier":"free","usage":{"apiCalls":0,"storageGB":0,"bandwidthGB":0,"seats":0},"billingPeriod":{"start":"2026-07-01","end":"2026-07-31"},"currency":"CNY"}'
# 预期: 200

# 统计接口存活检测
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/billing/stats \
  -H "x-tenant-id: health-check" \
  -H "Authorization: Bearer <token>"
# 预期: 200
```

### 故障恢复

| 场景 | 影响 | 恢复步骤 |
|------|------|----------|
| 内存数据丢失 | 所有发票/支付记录丢失 | 1. 迁移至数据库存储<br>2. 配置定时数据备份<br>3. 从财务系统重建发票数据 |
| 定价表变更 | 新账单使用错误价格 | 1. 更新 PRICING_TABLE 配置<br>2. 确保历史发票不受影响<br>3. 添加定价版本号支持 |
| 折扣码耗尽 | 用户无法使用优惠码 | 1. 检查 currentUses 计数器<br>2. 手动重置或增加 maxUses<br>3. 补充新的折扣码 |
| 税控问题 | 税金计算错误 | 1. 确认 TAX_RATE 配置<br>2. 按地区区分税率<br>3. 对接财务系统验证 |

### 测试指引

```bash
# 服务层测试
npx jest apps/api/src/modules/billing/billing.service.test.ts
npx jest apps/api/src/modules/billing/billing.service.spec.ts
npx jest apps/api/src/modules/billing/billing.service.full.test.ts
npx jest apps/api/src/modules/billing/billing.service-extra.spec.ts
npx jest apps/api/src/modules/billing/billing.service.edge.test.ts

# 控制器 + E2E
npx jest apps/api/src/modules/billing/billing.controller.test.ts
npx jest apps/api/src/modules/billing/billing.controller.metadata.test.ts
npx jest apps/api/src/modules/billing/billing.e2e.test.ts

# 角色权限测试
npx jest apps/api/src/modules/billing/billing.role-extended.test.ts
npx jest apps/api/src/modules/billing/billing.entity.boost.test.ts
npx jest apps/api/src/modules/billing/billing.service.bonus.spec.ts
```

> 共 12 个测试文件，覆盖 Service 核心逻辑 + Controller + E2E + RBAC 角色 + 边界条件 + 元数据验证。
