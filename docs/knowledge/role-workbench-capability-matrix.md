# 角色工作台能力矩阵

## 1. 目的

本矩阵用于把《角色主数据字典》中的冻结口径，进一步落成“角色 -> 工作台 -> 能力域 -> 权限映射 -> 风险状态”的可执行审计底稿。

本文件是 `54名行业与技术专家联合审计与规划方案 v2` 在 `M1 角色与权限闭环` 里的核心产物之一，后续《角色-权限-流程一致性审计表》必须复用本矩阵。

## 2. 使用规则

1. 角色描述一律同时呈现：
   - 业务角色名
   - 工作台角色名
   - 权限正式角色名
2. `已冻结` 只表示角色口径和工作台能力边界已冻结，不等于前后端权限已全部闭环。
3. 若后端尚未形成稳定正式角色或权限包，必须显式写为 `待补正式角色`，不得口头补齐。
4. Pad 现场角色除动态工作台详情外，还必须纳入 `app/pad/*` 入口审计。

## 3. 证据基线

| evidenceId | level | claimType | 摘要 | 来源 |
| --- | --- | --- | --- | --- |
| `EV-ROLE-0001` | `A` | `存在性` | 工作台目录按总部管理、门店现场、运营支持三类冻结 10 个角色，并统一挂 `workbench.read` 门禁。 | `apps/admin-web/app/workbench/page.tsx` |
| `EV-ROLE-0002` | `A` | `已门禁` | 管理后台工作台 bootstrap actor 固定带 `OPERATIONS`、`TENANT_ADMIN` 和 `workbench.read`、`foundation.governance.read`。 | `apps/admin-web/app/bootstrap.ts` |
| `EV-ROLE-0003` | `A` | `已实现` | 共享契约 `defaultRoleWorkbenchContracts` 冻结 10 个角色的渠道、描述与导航能力。 | `packages/types/src/index.ts` |
| `EV-ROLE-0004` | `B` | `已签字` | 角色主数据字典冻结业务角色、工作台角色、正式权限角色和旧 RBAC 五级映射。 | `docs/knowledge/role-master-dictionary.md` |
| `EV-ROLE-0005` | `A` | `存在性` | API 当前高置信正式角色为 `PLATFORM_ADMIN`、`TENANT_ADMIN`、`STORE_MANAGER`、`CASHIER`、`SALES_GUIDE`、`MEMBER`。 | `apps/api/src/modules/permission/rbac.service.ts` |
| `EV-ROLE-0006` | `A` | `存在风险` | 前端工作台角色到后端 tenant-config 角色存在 `operator` 回落映射，说明部分角色尚未完成正式权限角色闭环。 | `packages/types/src/index.ts` |
| `EV-ROLE-0007` | `B` | `存在性` | 管理后台 README 已把 `Dashboard`、`Workbench`、`Operations`、`Finance` 等模块列入工作台与运营总览边界。 | `apps/admin-web/README.md` |

## 4. 角色总矩阵

| 业务角色名 | 工作台角色名 | 渠道 | 权限正式角色名 | 旧 RBAC 映射 | 当前判定 | 证据 |
| --- | --- | --- | --- | --- | --- | --- |
| 平台管理员 | `SUPER_ADMIN` | `PC` | `PLATFORM_ADMIN` | `owner` | 已冻结 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` |
| 租户管理员 | `TENANT_ADMIN` | `PC` | `TENANT_ADMIN` | `admin` | 已冻结 | `EV-ROLE-0001` `EV-ROLE-0002` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` |
| 品牌经理 | `BRAND_MANAGER` | `PC` | 暂按 `TENANT_ADMIN` 子集管理 | `manager` | 角色冻结，正式权限待专项补齐 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` |
| 店长 | `STORE_MANAGER` | `PC` | `STORE_MANAGER` | `manager` | 已冻结 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` |
| 导玩员 / 导购 | `GUIDE` | `PAD` | `SALES_GUIDE` | `staff` | 已冻结 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` |
| 收银员 / 前台 | `CASHIER` | `PAD` | `CASHIER` | `staff` | 已冻结 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` |
| 仓库人员 | `WAREHOUSE` | `PC` | 待补正式角色 | `staff` | 角色冻结，正式权限待专项补齐 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` |
| 教练 | `COACH` | `PAD` | 待补正式角色 | `staff` | 角色冻结，正式权限待专项补齐 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` |
| 运营人员 | `OPERATIONS` | `PC` | 待补正式角色 | `manager` | 角色冻结，正式权限待专项补齐 | `EV-ROLE-0001` `EV-ROLE-0002` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` |
| 财务人员 | `FINANCE` | `PC` | 待补正式角色 | `manager` | 角色冻结，正式权限待专项补齐 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` |

## 5. 角色能力矩阵

| 工作台角色名 | 入口路由 | 关键职责 | 关键能力入口 | 最低权限口径 | 风险备注 |
| --- | --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | 目录 `/workbench`；详情 `/workbench/super_admin` | 平台级租户治理、身份授权、配置治理、审计与国际化治理 | 租户管理、Foundation 总览、身份与授权、配置治理、强韧性作战台、限流与配额、集成编排、审计中心 | `*` | 与后端正式角色名存在 `SUPER_ADMIN` / `PLATFORM_ADMIN` 双名映射，文档必须并列书写 |
| `TENANT_ADMIN` | 目录 `/workbench`；详情 `/workbench/tenant_admin` | 租户经营、品牌矩阵、门店网络、渠道编排与国际化治理 | 品牌矩阵、渠道编排、身份与授权、配置治理、强韧性作战台、限流与配额、集成编排、租户 ToB 官网、国际化配置 | `tenant:*` `brand:*` `store:*` | bootstrap actor 已带 `TENANT_ADMIN`，但具体页面/API 一致性仍需下一张审计表逐项核验 |
| `BRAND_MANAGER` | 目录 `/workbench`；详情 `/workbench/brand_manager` | 品牌官网、品牌活动、会员分层、商品服务和区域化投放 | 会员运营、营销投放、品牌 ToB 官网、市场与本地化 | 暂按 `TENANT_ADMIN` 子集管理 | 前端工作台已存在，后端尚未形成同名稳定正式角色和权限包 |
| `STORE_MANAGER` | 目录 `/workbench`；详情 `/workbench/store_manager` | 门店日运营、预约排队、现场资源调度和日报 | 门店日报、现场调度 | `store:read` `store:update` `order:*` `inventory:read` `inventory:update` | 工作台职责已清晰，后续需核对预约、排队、日报是否全部真实 API 闭环 |
| `GUIDE` | 目录 `/workbench`；详情 `/workbench/guide`；Pad `/pad/guide` | 客户接待、会员推荐、裂变推广与线索跟进 | 会员接待、推广转化 | `member:read` `order:create` `product:read` | 页面工作台名为 `GUIDE`，正式权限角色名必须回落到 `SALES_GUIDE` |
| `CASHIER` | 目录 `/workbench`；详情 `/workbench/cashier`；Pad `/pad/cashier` | 收银、核销、储值、退款和弱网离线兜底 | 收银核销、离线模式 | `order:create` `order:read` `payment:execute` | “前台”只能作为业务别名并入 `CASHIER`，不得分裂出第二套正式角色 |
| `WAREHOUSE` | 目录 `/workbench`；详情 `/workbench/warehouse` | 库存盘点、出入库、调拨、损耗复盘和门店库存预警 | 门店网络、品牌矩阵、租户管理、运营回执、审计中心 | 待补正式权限包，现阶段只可用 `inventory:read` `inventory:write` 作为审计占位 | 前端角色已冻结，但后端只存在 tenant-config 的 `operator` 回落，不能宣称前后端角色完全对齐 |
| `COACH` | 目录 `/workbench`；详情 `/workbench/coach`；Pad `/pad/coach` | 私教接待、课程排期、训练计划、签到考勤与裂变推广 | 会员接待、推广转化、运营回执、审计中心 | 待补正式权限包 | 前端角色已冻结，但后端尚无稳定同名正式角色；需在权限专项中补正式权限模型 |
| `OPERATIONS` | 目录 `/workbench`；详情 `/workbench/operations` | 任务分派、运营回执、治理审批、告警 triage、集成编排和审计复盘 | 运营回执、任务分派、治理审批、告警 triage、集成编排、强韧性作战、审计中心 | 当前仅高置信冻结 `workbench.read` `foundation.governance.read` | bootstrap 已明确存在该角色，但后端正式角色仍回落到 `operator`，需要专项补齐 |
| `FINANCE` | 目录 `/workbench`；详情 `/workbench/finance` | 收单、对账、退款、储值余额、税务和财务运营总览 | 限流与配额、配置治理、审计中心、强韧性作战 | 当前仅可冻结 `finance:read` `settlement:*` 作为最低口径 | 财务工作台能力已存在，但后端尚无同名稳定正式角色，需避免把页面存在误判为权限闭环 |

## 6. 角色组与审计范围

### 6.1 总部管理组

- `SUPER_ADMIN`
- `TENANT_ADMIN`
- `BRAND_MANAGER`

审计重点：

- 工作台目录与详情入口是否完整
- 总部治理能力是否已真实接到 API
- 官网、配置治理、国际化与权限是否闭环

### 6.2 门店现场组

- `STORE_MANAGER`
- `GUIDE`
- `CASHIER`
- `WAREHOUSE`
- `COACH`

审计重点：

- `PC` 与 `PAD` 渠道是否一致
- 预约、排队、收银、库存、会员接待是否真实联调
- 弱网、离线、现场操作回执是否具备证据链

### 6.3 运营支持组

- `OPERATIONS`
- `FINANCE`

审计重点：

- 审批、告警、运营回执、审计中心是否能穿透到后端能力
- 财务、结算、审计、对账是否形成真实链路
- 是否仍依赖占位角色映射或 fallback 数据

## 7. 当前冻结结论

1. `10` 个工作台角色的页面入口、职责摘要、渠道和导航能力已冻结。
2. 已与后端正式权限角色高置信对齐的角色有 `6` 个：
   - `PLATFORM_ADMIN`
   - `TENANT_ADMIN`
   - `STORE_MANAGER`
   - `CASHIER`
   - `SALES_GUIDE`
   - `MEMBER`
3. 当前尚未完成前后端正式角色闭环的工作台角色有 `5` 个：
   - `BRAND_MANAGER`
   - `WAREHOUSE`
   - `COACH`
   - `OPERATIONS`
   - `FINANCE`
4. `GUIDE`、`CASHIER`、`COACH` 属于 Pad 现场角色，后续审计不得只看 `/workbench/[role]`，必须同步检查 `/pad/[role]`。

## 8. 风险与阻断

| riskId | 风险 | 触发条件 | 当前结论 |
| --- | --- | --- | --- |
| `RISK-ROLE-0001` | 工作台角色已存在但正式权限角色未冻结 | `BRAND_MANAGER`、`WAREHOUSE`、`COACH`、`OPERATIONS`、`FINANCE` 仍通过占位映射或子集管理承接 | 阻断“前后端角色完全对齐”结论 |
| `RISK-ROLE-0002` | 页面角色名与正式角色名双名并存 | `SUPER_ADMIN` / `PLATFORM_ADMIN`、`GUIDE` / `SALES_GUIDE`、前台 / `CASHIER` | 阻断无映射的审计结论 |
| `RISK-ROLE-0003` | 只看工作台页面不看 Pad 或 API | 现场角色仅核了目录页，没有核真实渠道和 API | 阻断“角色工作台已闭环”结论 |
| `RISK-ROLE-0004` | 页面存在与权限闭环被混为一谈 | 工作台可见，但缺少正式权限包、metadata 断言或真实链路证据 | 阻断“权限已闭环”结论 |

## 9. 下一步执行建议

1. 基于本矩阵继续产出《角色-权限-流程一致性审计表》。
2. 先优先审 `OPERATIONS`、`FINANCE`、`WAREHOUSE`、`COACH`、`BRAND_MANAGER` 五类待补正式角色。
3. 对 `GUIDE`、`CASHIER`、`COACH` 补 `Pad 页面 -> API -> 权限 -> 测试` 的穿透证据。
4. 对 `SUPER_ADMIN`、`TENANT_ADMIN`、`STORE_MANAGER` 补“页面门禁 -> API 权限 -> 导航入口 -> 回归证据”一致性核验。
5. 后续所有角色结论必须附 `EV-*`、`GAP-*`、`DONE-*` 编号，不接受无编号结论。

## 10. 关联文档

- `docs/knowledge/expert54-full-process-audit-plan.md`
- `docs/knowledge/role-master-dictionary.md`
- `docs/knowledge/system-boundary-matrix.md`
- `docs/knowledge/evidence-field-standard.md`
