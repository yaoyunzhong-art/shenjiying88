# PLAN-REV-B2 · 税务/发票显式子任务流

> 创建: 2026-07-19
> 关联行动卡: `PLAN-REV-B2`
> 截止: 2026-07-21
> 目标: 将 `税务/发票` 从“尾项要求”升级为“可派工、可验收、可复签”的显式子任务流

---

## 1. 当前结论

- 当前状态: `✅ 已完成显式子任务流拆解`
- 结论说明:
  - 仓库已存在 `finance` 发票接口、税率配置、对账服务、报表入口与工作台导航骨架
  - 当前问题不是“完全没有税务/发票能力”，而是“能力分散、数据未持久化、前台页面未闭环、流程未显式拆解”
  - 本卡的完成目标是把 `税务/发票` 明确拆成可执行子流，不等于税务系统已上线

---

## 2. 唯一主线

### 2.1 主承接模块

| 域 | 主落点 | 原因 |
|----|--------|------|
| 业务发票域 | [finance.module.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.module.ts) | 已有 `invoice / settlement / reconciliation / transactions` 骨架 |
| 上游业务源 | [cashier.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/cashier/cashier.controller.ts) | 订单、支付、退款、税额字段可作为发票触发源 |
| 税率配置源 | [schema.prisma](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/prisma/schema.prisma) / [market.entity.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/market/market.entity.ts) | 已存在 `taxMode / taxRate / invoiceProvider` 基础字段 |

### 2.2 非主线模块

| 模块 | 当前定位 | 处理原则 |
|------|----------|----------|
| `billing` | SaaS 账单/订阅计费发票 | 不作为门店业务发票主线 |
| `saas-billing` | 平台级计费旁路 | 保留，不与业务发票混用 |

---

## 3. 当前证据

| 类型 | 证据 | 说明 |
|------|------|------|
| 发票接口 | [finance.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.controller.ts) | 已有创建、查询、开具、作废发票接口 |
| 发票服务 | [finance.service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.service.ts) | 已有 `draft -> issued -> cancelled` 基础状态流 |
| 发票 DTO | [finance.dto.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.dto.ts) | 已有 `orderId/type/amount/taxAmount/buyerInfo/status` |
| 工作台入口 | [workbench.entity.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/workbench/workbench.entity.ts) | 已预埋 `发票管理 / 税务申报 / 配置治理` |
| 税率配置页 | [tax-rates/page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/settings/tax-rates/page.tsx) | 已有税率管理页面骨架 |
| 税务报表页 | [tax-report/page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/reports/tax-report/page.tsx) | 已有报表入口骨架 |
| 财务审计 | [p38-finance-audit.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/docs/knowledge/p38-finance-audit.md) | 已明确 P-38 财务主线存在重大缺口 |

---

## 4. 显式子任务流

### B2-1 税务规则与配置流

- 目标:
  - 明确税率来源、税模式、开票 provider、市场覆盖与租户覆盖规则
- 主文件:
  - [schema.prisma](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/prisma/schema.prisma)
  - [market.entity.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/market/market.entity.ts)
  - [tax-rates/page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/settings/tax-rates/page.tsx)
- 输出物:
  - 税率配置规则表
  - provider 配置落点说明
  - 管理端税率配置页对接计划

### B2-2 发票申请流

- 目标:
  - 从订单/客户中心/门店后台发起开票申请
  - 补齐发票抬头、税号、邮箱、类型、申请状态
- 主文件:
  - [finance.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.controller.ts)
  - [finance.dto.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.dto.ts)
- 输出物:
  - 发票申请字段清单
  - 订单侧申请入口任务
  - 客户中心申请入口任务

### B2-3 开票与状态流

- 目标:
  - 显式定义 `draft -> issued -> cancelled`
  - 后续可扩展 `red-flush / reissue / archived`
- 主文件:
  - [finance.service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.service.ts)
  - [finance.entity.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.entity.ts)
- 输出物:
  - 发票状态机
  - 开具/作废/重开规则表
  - 税额计算与总额归并规则

### B2-4 退款、作废、红冲协同流

- 目标:
  - 收银退款与发票状态联动
  - 支持作废、红冲、重开的规则预留
- 主文件:
  - [cashier.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/cashier/cashier.controller.ts)
  - [finance.controller.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.controller.ts)
- 输出物:
  - 退款联动规则
  - 红冲预留字段与状态扩展表
  - 收银与财务映射表

### B2-5 持久化与归档流

- 目标:
  - 将当前内存态发票升级为 Prisma 持久化
  - 补发票档案、申请记录、操作留痕
- 主文件:
  - [finance.service.ts](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/src/modules/finance/finance.service.ts)
  - [schema.prisma](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/api/prisma/schema.prisma)
- 输出物:
  - Prisma 模型清单
  - 迁移任务
  - 审计留痕字段清单

### B2-6 管理端与报表流

- 目标:
  - 补 `admin-web/finance/invoices`
  - 让税务报表、结算报表从占位页变为真实页面
- 主文件:
  - [tax-report/page.tsx](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app/reports/tax-report/page.tsx)
  - `apps/admin-web/app/finance/invoices` `待新增`
- 输出物:
  - 发票管理页
  - 税务报表页
  - 结算/对账联动页

---

## 5. 缺口清单

| 缺口 | 当前事实 | 严重度 |
|------|----------|:------:|
| 发票持久化 | 当前主要为内存态 `Map` | 🔴 |
| 业务发票与 SaaS 发票语义混杂 | `finance / billing / saas-billing` 三套语义并存 | 🔴 |
| 发票申请入口 | 未见真实订单详情/客户中心申请页 | 🔴 |
| 前台发票管理页 | `admin-web` 未见真实 `finance/invoices` 页面 | 🔴 |
| 税务报表 | 当前仍偏占位页 | 🟡 |
| 退款红冲联动 | 规则未显式化 | 🟡 |

---

## 6. 完成定义

### 达到“显式子任务流已建立”

满足以下条件即可:

1. 已明确唯一主线模块
2. 已拆出至少 5 个可派工子流
3. 每个子流均有主文件、输出物、缺口说明
4. 已回写复签材料和状态页

### 达到“税务/发票系统可上线”

必须额外满足:

1. Prisma 持久化落地
2. 申请页、管理页、报表页真实可用
3. 收银退款与发票状态联动
4. 有浏览器验收与测试证据

---

## 7. 当前负责人

| 角色 | 负责人 | 当前动作 |
|------|--------|----------|
| 财务业务链 | `E10` | 确认发票申请、开票、作废、报表口径 |
| 技术主线 | `E36` | 收口 `finance` 为业务税务/发票唯一主线 |
| 文档与复签链 | `E50` | 形成子任务流、回写计划与状态材料 |

---

## 8. 下一刀

1. 基于本卡新增 `admin-web/finance/invoices` 页面任务
2. 设计 `Invoice / InvoiceApplication / InvoiceArchive` Prisma 模型
3. 明确 `cashier -> finance invoice` 的业务触发点
4. 进入 `PLAN-REV-C1`，补 `checkout` 金额链浏览器验收
