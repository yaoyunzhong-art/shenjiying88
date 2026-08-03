# 角色主数据字典

## 1. 目的

本字典用于冻结以下四类角色口径，避免在专家审计、权限对齐、工作台审计和联调验收中出现“同一角色多种叫法”的伪差异：

1. 业务角色名
2. 页面/工作台角色名
3. 后端权限正式角色名
4. 旧 RBAC 五级角色映射

本字典是 `54名行业与技术专家联合审计与规划方案 v2` 的前置 gate 之一，未冻结前不得正式启动角色工作台审计轮。

## 2. 适用范围

- `apps/admin-web`
- `apps/tob-web`
- `apps/storefront-web`
- `apps/api`
- `apps/app`
- `apps/miniapp`
- 相关共享契约与 SDK

## 3. 角色口径分层

### 3.1 业务角色层

面向产品、运营、业务和评审会议使用，例如：

- 平台管理员
- 租户管理员
- 品牌经理
- 店长
- 前台 / 收银员
- 导玩员 / 导购
- 仓库人员
- 教练
- 运营人员
- 财务人员
- 会员 / 消费者

### 3.2 工作台角色层

面向 `admin-web` 工作台目录和页面路由使用，当前以字符串常量出现：

- `SUPER_ADMIN`
- `TENANT_ADMIN`
- `BRAND_MANAGER`
- `STORE_MANAGER`
- `GUIDE`
- `CASHIER`
- `WAREHOUSE`
- `COACH`
- `OPERATIONS`
- `FINANCE`

### 3.3 权限正式角色层

面向后端权限契约、角色定义和权限包使用，当前高置信正式角色包括：

- `PLATFORM_ADMIN`
- `TENANT_ADMIN`
- `STORE_MANAGER`
- `CASHIER`
- `SALES_GUIDE`
- `MEMBER`

### 3.4 旧 RBAC 五级角色层

当前 `rbac.service.ts` 仍保留一套较早期的抽象五级角色：

- `owner`
- `admin`
- `manager`
- `staff`
- `guest`

该层可视为兼容层，不可再直接作为业务审计和工作台评审的主口径。

## 4. 冻结原则

1. 专家评审、需求对齐、缺口审计一律以“业务角色名 + 权限正式角色名”双列呈现。
2. 页面工作台使用的角色名必须映射到正式角色名，不允许只出现页面别名。
3. 旧 RBAC 五级角色只允许作为“历史兼容映射”出现，不允许直接充当最终角色定义。
4. 所有权限、门禁、工作台和 API 审计结论都必须能回落到本字典。

## 5. 角色主字典

| 业务角色名 | 工作台角色名 | 权限正式角色名 | 旧 RBAC 五级映射 | 主要职责 | 核心权限口径 |
| --- | --- | --- | --- | --- | --- |
| 平台管理员 | `SUPER_ADMIN` | `PLATFORM_ADMIN` | `owner` | 全局平台治理、跨租户管理、系统级审计 | `*` |
| 租户管理员 | `TENANT_ADMIN` | `TENANT_ADMIN` | `admin` | 租户治理、品牌/门店配置、权限分配 | `tenant:*` `brand:*` `store:*` |
| 品牌经理 | `BRAND_MANAGER` | 暂按 `TENANT_ADMIN` 子集管理 | `manager` | 品牌官网、品牌运营、品牌配置 | `brand:*` `store:read` |
| 店长 | `STORE_MANAGER` | `STORE_MANAGER` | `manager` | 门店经营、人员、库存、营收、审批 | `store:read` `order:*` |
| 收银员 | `CASHIER` | `CASHIER` | `staff` | 收银、支付、订单创建、班次交接 | `order:create` `payment:execute` |
| 前台 | 页面常以“前台”出现 | 暂并入 `CASHIER` | `staff` | 接待、开单、叫号、会员查询 | `order:create` `payment:execute` |
| 导玩员 / 导购 | `GUIDE` | `SALES_GUIDE` | `staff` | 客户接待、导购、巡检、推荐、客户服务 | `member:read` `order:create` `product:read` |
| 仓库人员 | `WAREHOUSE` | 待补正式角色 | `staff` | 库存盘点、出入库、调拨执行 | `inventory:read` `inventory:write` |
| 教练 | `COACH` | 待补正式角色 | `staff` | 教练服务、课程与陪练执行 | 待补正式权限包 |
| 运营人员 | `OPERATIONS` | 待补正式角色 | `manager` | 平台运营、活动、监控、治理联动 | `workbench.read` `foundation.governance.read` |
| 财务人员 | `FINANCE` | 待补正式角色 | `manager` | 财务报表、结算、发票、对账 | `finance:read` `settlement:*` |
| 会员 / 消费者 | 无后台工作台 | `MEMBER` | `guest` 到独立会员角色 | 门店消费、预约、下单、会员权益 | `member:read` `member:update` `order:create` |

## 6. 当前冲突与冻结处理

### 6.1 `SUPER_ADMIN` vs `PLATFORM_ADMIN`

- 现状：
  - `admin-web` 工作台使用 `SUPER_ADMIN`
  - 后端权限正式角色使用 `PLATFORM_ADMIN`
- 冻结结论：
  - 业务角色名：平台管理员
  - 工作台角色名：`SUPER_ADMIN`
  - 权限正式角色名：`PLATFORM_ADMIN`
- 处理规则：
  - 所有审计文档必须同时写明这两个名称，避免误判为两个不同角色

### 6.2 `GUIDE` vs `SALES_GUIDE`

- 现状：
  - `admin-web` 工作台使用 `GUIDE`
  - 后端权限契约更稳定的是 `SALES_GUIDE`
- 冻结结论：
  - 业务角色名：导玩员 / 导购
  - 工作台角色名：`GUIDE`
  - 权限正式角色名：`SALES_GUIDE`
- 处理规则：
  - 后续接口、权限矩阵、门禁和测试文档统一以 `SALES_GUIDE` 为正式角色名
  - 页面允许继续使用 `GUIDE`，但必须可映射

### 6.3 前台 vs `CASHIER`

- 现状：
  - 部分页面/文档会写“前台”
  - 权限与工作台更稳定的是 `CASHIER`
- 冻结结论：
  - “前台”视为业务别名，不单独建正式角色
  - 正式角色统一并入 `CASHIER`

### 6.4 `BRAND_MANAGER` / `WAREHOUSE` / `COACH` / `OPERATIONS` / `FINANCE`

- 现状：
  - 工作台已存在这些角色
  - 后端权限契约里尚未形成同等稳定的正式角色定义
- 冻结结论：
  - 当前先保留工作台角色名
  - 需要在后续权限专项里补齐正式角色与权限包
- 审计要求：
  - 未补齐前，不得宣称这几个角色已经完成“前后端角色完全对齐”

## 7. 角色到权限包的最低映射

### 7.1 已高置信冻结

1. `PLATFORM_ADMIN`
   - 全局平台治理
   - 通配权限 `*`
2. `TENANT_ADMIN`
   - 租户治理、品牌与门店配置
   - 典型权限：`tenant:*` `brand:*` `store:*`
3. `STORE_MANAGER`
   - 门店经营与审批
   - 典型权限：`store:read` `order:*`
4. `CASHIER`
   - 收银与支付执行
   - 典型权限：`order:create` `payment:execute`
5. `SALES_GUIDE`
   - 导购、接待、客户服务
   - 典型权限：`member:read` `order:create` `product:read`
6. `MEMBER`
   - 会员中心、订单与权益
   - 典型权限：`member:read` `member:update` `order:create`

### 7.2 待补正式权限包

以下角色当前只能作为工作台角色冻结，权限正式定义仍待专项补齐：

- `BRAND_MANAGER`
- `WAREHOUSE`
- `COACH`
- `OPERATIONS`
- `FINANCE`

## 8. 审计使用规则

### 8.1 文档产物强制字段

后续所有角色相关审计表至少必须包含：

1. 业务角色名
2. 工作台角色名
3. 权限正式角色名
4. 旧 RBAC 映射
5. 页面入口
6. API / 权限门禁
7. 当前状态

### 8.2 不允许的写法

以下写法后续一律视为不合格：

- 只写“店长”“导玩员”，不写正式角色名
- 只写 `GUIDE`，不标注它对应 `SALES_GUIDE`
- 继续把 `owner/admin/manager/staff/guest` 当作最终业务角色
- 把“前台”和 `CASHIER` 分裂成两套正式角色

## 9. 后续补齐任务

1. 为 `BRAND_MANAGER` 补正式权限角色与权限包
2. 为 `WAREHOUSE` 补正式权限角色与权限包
3. 为 `COACH` 补正式权限角色与权限包
4. 为 `OPERATIONS` 补正式权限角色与权限包
5. 为 `FINANCE` 补正式权限角色与权限包
6. 输出《角色工作台能力矩阵》时强制复用本字典

## 10. 证据来源

- 工作台角色目录：
  - `apps/admin-web/app/workbench/page.tsx`
- 工作台 bootstrap 角色：
  - `apps/admin-web/app/bootstrap.ts`
- 权限正式角色契约：
  - `apps/api/src/modules/permission/permission.contract.test.ts`
- 旧 RBAC 五级角色：
  - `apps/api/src/modules/rbac/rbac.service.ts`
