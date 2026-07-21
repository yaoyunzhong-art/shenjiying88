# 🗺️ PRD: 分润计算引擎模块 (G10审计条件)
> 日期: 2026-07-21 | 圈梁: 代码✅ 测试✅(15+ tests) 审计✅ PRD已写入

**用途**: G10审计条件要求分润计算引擎+效果追踪回流。品牌联名模块已有分润比例参考（collab模块的revenueShareRate），需建立独立的分润模块实现规则管理、金额计算、结算回流全链路。
**产出**: `apps/api/src/modules/royalty/`
**作用**: V23 Phase 1核心功能

---

## 1. 概述

分润计算引擎模块负责品牌联名活动中的分润全生命周期管理，包括分润规则的定义、订单层面的分润金额计算、以及分润结算回流追踪。该模块采用**计算器模式**（Calculator Pattern）实现分润计算逻辑，支持多种分润类型。

### 核心功能

| 功能 | 描述 | 端点 |
|:----|:-----|:-----|
| 创建分润规则 | 新增分润规则（默认 ACTIVE 状态） | `POST /api/royalty/rules` |
| 查询规则列表 | 按租户+品牌/类型/状态过滤 | `GET /api/royalty/rules` |
| 查询规则详情 | 按ID查询单一规则 | `GET /api/royalty/rules/:ruleId` |
| 更新规则 | 部分更新规则字段 | `PATCH /api/royalty/rules/:ruleId` |
| 删除规则 | 删除指定规则 | `DELETE /api/royalty/rules/:ruleId` |
| 分润计算 | 输入订单信息计算分润金额 | `POST /api/royalty/calculate` |
| 查询计算结果 | 查询历史分润计算结果列表 | `GET /api/royalty/calculations` |
| 查询计算详情 | 按ID查询单一计算记录 | `GET /api/royalty/calculations/:calculationId` |
| 批量结算回流 | 结算指定分润记录（标记已回流） | `POST /api/royalty/settle` |

### 紧耦合关系

```
分润规则(RoyaltyRule) ──→ 品牌订单(brandId + orderId) ──→ 分润计算结果(RoyaltyCalculation)
        │                       │                                  │
        ├─ 规则匹配逻辑          └─ 订单金额输入                      ├─ 快照规则参数
        ├─ 分润类型/率                                                  └─ 结算回流标记
        └─ 有效时间窗口
```

## 2. 实体定义

### RoyaltyRule

| 字段 | 类型 | 必需 | 说明 |
|:----|:----|:----:|:-----|
| ruleId | string | ✅ | 唯一标识 |
| tenantId | string | ✅ | 租户ID（RLS多租户隔离） |
| brandId | string | ✅ | 关联品牌ID |
| collabProjectId | string | ❌ | 关联联名项目ID（支持项目级分润） |
| name | string | ✅ | 分润规则名称（1-128字符） |
| royaltyType | RoyaltyType | ✅ | 分润类型 |
| rate | number | ✅ | 分润率（0-100，百分比） |
| fixedAmount | number | ✅ | 固定分润金额（分） |
| tierConfig | string | ❌ | 阶梯分润配置 JSON |
| status | RoyaltyStatus | ✅ | 规则状态 |
| effectiveDate | string(ISO8601) | ✅ | 生效时间 |
| expirationDate | string(ISO8601) | ❌ | 失效时间 |
| description | string | ❌ | 规则描述（最多500字符） |
| createdAt | string | ✅ | 创建时间 |
| updatedAt | string | ✅ | 更新时间 |

### RoyaltyCalculation

| 字段 | 类型 | 必需 | 说明 |
|:----|:----|:----:|:-----|
| calculationId | string | ✅ | 分润结算单唯一标识 |
| tenantId | string | ✅ | 租户ID |
| ruleId | string | ✅ | 关联分润规则ID |
| brandId | string | ✅ | 关联品牌ID |
| orderId | string | ✅ | 关联品牌订单ID |
| orderAmount | number | ✅ | 订单金额（分） |
| appliedRate | number | ✅ | 计算时分润率（快照） |
| appliedType | RoyaltyType | ✅ | 计算时分润类型（快照） |
| royaltyAmount | number | ✅ | 分润金额（分，最终结算值） |
| description | string | ❌ | 计算说明 |
| calculatedAt | string | ✅ | 计算时间 |
| settled | boolean | ✅ | 是否已结算回流 |
| settledAt | string | ❌ | 结算回流时间 |

### RoyaltyType 枚举

| 值 | 含义 | 计算方式 |
|:--|:-----|:---------|
| REVENUE_SHARE | 按销售额比例 | `orderAmount × rate / 100` |
| FIXED_AMOUNT | 按固定金额 | `fixedAmount` |
| TIERED | 按阶梯 | 匹配 tierConfig 阶梯 |

### RoyaltyStatus 枚举

| 值 | 含义 |
|:--|:-----|
| ACTIVE | 生效中 |
| INACTIVE | 已停用 |
| EXPIRED | 已过期 |

## 3. API接口

### POST /api/royalty/rules
创建分润规则。
- Guard: @UseGuards(TenantGuard)
- Header: `x-tenant-id`
- Body: CreateRoyaltyRuleDto

### GET /api/royalty/rules
查询分润规则列表。
- Query: brandId, royaltyType, status, collabProjectId (all optional)

### GET /api/royalty/rules/:ruleId
查询分润规则详情。

### PATCH /api/royalty/rules/:ruleId
更新分润规则。

### DELETE /api/royalty/rules/:ruleId
删除分润规则。

### POST /api/royalty/calculate
分润计算接口。输入品牌订单信息，自动匹配有效规则，计算分润金额。
- Body: CalculateRoyaltyDto
- 规则匹配优先级：指定 ruleId > collabProjectId 项目级规则 > 品牌级最新有效规则

### GET /api/royalty/calculations
查询分润计算结果列表。
- Query: brandId, ruleId, settled, startDate, endDate (all optional)

### GET /api/royalty/calculations/:calculationId
查询分润计算详情。

### POST /api/royalty/settle
批量结算回流分润记录。
- Body: SettleRoyaltyDto (calculationIds)
- 已结算记录不可重复结算

## 4. 测试覆盖

### Service 测试（正例 + 反例 + 边界）

**正例（≥11个）：**
- ✅ createRule RevenueShare 分润规则
- ✅ createRule FixedAmount 分润规则
- ✅ createRule 关联联名项目
- ✅ findRuleById 找到有效规则
- ✅ findAllRules 返回规则列表支持品牌过滤
- ✅ updateRule 更新规则字段
- ✅ deleteRule 删除规则
- ✅ calculate RevenueShare 正确计算
- ✅ calculate FixedAmount 正确计算
- ✅ findAllCalculations 支持过滤
- ✅ settleCalculations 批量结算
- ✅ findCalculationById 找到有效计算结果

**反例（≥7个）：**
- ✅ 拒绝分润率超过100
- ✅ 拒绝RevenueShare分润率为0
- ✅ 拒绝FixedAmount金额为0
- ✅ 拒绝过期时间早于生效时间
- ✅ 跨租户不可见
- ✅ 不存在的规则更新抛异常
- ✅ 跨租户不可删除
- ✅ 无匹配规则计算抛异常
- ✅ 重复结算抛异常

**边界值（≥6个）：**
- ✅ 分润率0和100边界值
- ✅ 订单金额为0
- ✅ 极小金额向下取整
- ✅ 指定ruleId计算
- ✅ 指定collabProjectId匹配项目级规则
- ✅ 空租户返回空列表
- ✅ 空结果返回空数组

### Controller 测试

**正例：** create/findAll/findById/update/delete/calculate/settle/findAllCalculations/findCalculationById 各端点
**反例：** 参数错误/规则不存在/null返回
**边界值：** 空列表/找不到返回null

## 5. 安全

- 所有端点使用 `@UseGuards(TenantGuard)` 多租户隔离
- Service层按 `tenantId` 过滤数据，跨租户不可见
- 分润计算结果禁止重复结算
- 分润金额快照保存计算时的规则参数

## 6. 与collab模块的关系

collab模块的 `revenueShareRate` 字段在联名项目层定义了分润比例。
本模块在此基础上实现具体计算：
- collab层面：定义"分多少比例"（项目合约层面）
- royalty层面：实现"怎么算、算多少、回流的全流程"
- 紧耦合：royalty规则可关联 `collabProjectId`，计算时优先匹配项目级规则

---

