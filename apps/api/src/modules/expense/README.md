# Expense Module — 费用管理模块

## 模块概述

Expense Module 提供企业费用报销的全流程管理，涵盖费用申请创建、提交审批、审核通过/驳回、财务打款报销、申请取消等完整生命周期。支持 9 种费用类别、多门店维度统计汇总，内置审批历史追踪。基于 NestJS Global Module + TenantGuard 多租户架构。

## 核心功能

- **费用申请 CRUD** — 创建/查询/列表/删除费用申请，删除仅限草稿状态
- **审批流程** — 提交流程（draft → pending），审批通过/驳回（pending → approved/rejected）
- **报销打款** — 已审批通过的单据执行报销（approved → reimbursed），支持 4 种打款方式
- **申请取消** — 任意状态可取消（reimbursed 除外），取消后不可恢复
- **费用统计汇总** — 按周期、门店维度统计总金额/已报销/待审批/已驳回/按类别汇总
- **审批历史记录** — 完整记录每次操作（创建、提交、审批、驳回、报销、取消）
- **多条件筛选** — 按状态/类别/申请人/门店/日期范围过滤费用列表
- **种子数据** — 初始化 3 条演示数据（已审批、待审批、已报销各一条）

## 费用状态流转

```
draft ──提交──→ pending ──审批通过──→ approved ──报销──→ reimbursed
                  │                        │
                  ├──审批驳回──→ rejected    └──取消──→ cancelled
                  │
                  └──取消──→ cancelled
```

## 费用类别

| 类别 | 中文名 | 说明 |
|------|--------|------|
| travel | 差旅交通 | 出差交通费用 |
| accommodation | 住宿 | 酒店住宿费用 |
| meals | 餐饮招待 | 客户招待用餐 |
| office | 办公用品 | 办公耗材采购 |
| equipment | 设备采购 | 办公设备购买 |
| marketing | 市场推广 | 营销活动费用 |
| training | 培训教育 | 员工培训费用 |
| maintenance | 维修保养 | 设备维修保养 |
| other | 其他 | 其他费用 |

## 核心接口

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/expense/create` | 创建费用申请（草稿） |
| POST | `/expense/submit/:id` | 提交审批（draft → pending） |
| POST | `/expense/approve/:id` | 审批操作（approve/reject） |
| POST | `/expense/reimburse/:id` | 执行报销打款 |
| POST | `/expense/cancel/:id` | 取消申请 |
| GET | `/expense/:id` | 获取费用申请详情（含审批历史） |
| GET | `/expense/list` | 费用申请列表（支持多条件筛选） |
| DELETE | `/expense/:id` | 删除费用申请（仅 draft） |
| GET | `/expense/summary` | 费用统计汇总 |

### 筛选参数（`/expense/list`）

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 按状态筛选 |
| category | string | 按费用类别筛选 |
| applicantId | string | 按申请人筛选 |
| storeId | string | 按门店筛选 |
| from | string (ISO) | 创建日期起 |
| to | string (ISO) | 创建日期止 |

### 统计参数（`/expense/summary`）

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| period | string | 否 | 周期（默认 monthly） |
| from | string (ISO) | 是 | 起始日期 |
| to | string (ISO) | 是 | 结束日期 |
| storeId | string | 否 | 按门店过滤 |

## 合约接口（跨模块消费）

- `ExpenseReimbursementContract` — 费用申请安全子集
- `ExpenseDetailContract` — 费用明细（含审批历史）
- `ExpenseApprovalRecordContract` — 审批记录安全子集
- `ExpenseSummaryContract` — 统计摘要安全子集
- 转换函数：`toExpenseReimbursementContract`, `toExpenseDetailContract`, `toExpenseSummaryContract`

## DTO（数据验证）

| DTO | 用途 | 必需字段 |
|-----|------|----------|
| `CreateExpenseDto` | 创建请求 | title, category, amount, applicantId, applicantName, storeId, expenseDate, description |
| `ApproveExpenseDto` | 审批请求 | action, approverId, approverName |
| `ReimburseExpenseDto` | 报销请求 | method, account, operatorId, operatorName |
| `ListExpenseQueryDto` | 列表查询 | 全部可选 |
| `ExpenseSummaryQueryDto` | 统计查询 | from, to |

## 配置说明

当前版本为内存存储模式，内置 seed 数据（3 条演示记录）。Module 声明为 `@Global()`，全局可用无需在其它模块重复导入。

**未来扩展：**
- 接入 PostgreSQL 持久化 + TypeORM Repository
- 添加审批流配置（多级审批、会签）
- 对接财务系统自动打款
- 添加费用预算额度管理
- 附件上传与存储服务（OSS/S3）

## 依赖

- NestJS Common（Global Module）
- `TenantGuard`（多租户守卫，来自 `agent/tenant.guard`）
