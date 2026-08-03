# 角色-权限-流程一致性审计表

## 1. 目的

本表用于承接《角色工作台能力矩阵》，把每个角色的工作台入口、页面门禁、正式权限角色、关键流程和当前缺口统一落到同一张审计表中。

本表当前定位为 `M1 角色与权限闭环` 的第一版底稿，重点先完成“是否具备一致性审计坐标系”的冻结，不提前宣称所有角色已经前后端闭环。

## 2. 审计判定规则

1. `已冻结`：角色口径、入口、关键流程和审计坐标已明确。
2. `待核 API`：页面入口与角色口径已存在，但尚未逐项核到真实 API / metadata / 回归证据。
3. `待补正式角色`：后端尚未形成稳定正式角色或权限包，当前只能做风险占位。
4. `待补 Pad 穿透`：现场角色除工作台目录外，还没有把 `Pad 页面 -> API -> 权限 -> 测试` 证据补齐。

## 3. 统一证据引用

| evidenceId | level | 摘要 | 来源 |
| --- | --- | --- | --- |
| `EV-ROLE-0001` | `A` | 工作台目录与 `workbench.read` 门禁已存在。 | `apps/admin-web/app/workbench/page.tsx` |
| `EV-ROLE-0002` | `A` | 工作台 bootstrap actor 已带 `OPERATIONS`、`TENANT_ADMIN`、`workbench.read`、`foundation.governance.read`。 | `apps/admin-web/app/bootstrap.ts` |
| `EV-ROLE-0003` | `A` | 共享契约已冻结 10 个角色、渠道与导航能力。 | `packages/types/src/index.ts` |
| `EV-ROLE-0004` | `B` | 角色主数据字典已冻结业务角色、工作台角色、正式权限角色和旧 RBAC 映射。 | `docs/knowledge/role-master-dictionary.md` |
| `EV-ROLE-0005` | `A` | API 稳定正式角色和权限包已定义。 | `apps/api/src/modules/permission/rbac.service.ts` |
| `EV-ROLE-0006` | `A` | 前端工作台角色到后端 tenant-config 仍存在 `operator` 回落映射。 | `packages/types/src/index.ts` |
| `EV-ROLE-0008` | `A` | 工作台动态详情页统一挂 `workbench.read`，并展示导航模块、治理概览和能力入口。 | `apps/admin-web/app/workbench/[role]/page.tsx` |
| `EV-ROLE-0009` | `A` | Pad 角色详情页仅允许 `channel === 'PAD'` 的角色进入，并统一挂 `workbench.read`。 | `apps/admin-web/app/pad/[role]/page.tsx` |

## 4. 一致性审计主表

| auditId | 业务角色名 | 工作台角色名 | 页面入口与门禁 | 权限正式角色名 | 关键流程 | 当前状态 | 主要缺口 | 下一步动作 | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `AUDIT-ROLE-0001` | 平台管理员 | `SUPER_ADMIN` | `/workbench/super_admin`；目录与详情统一 `workbench.read` | `PLATFORM_ADMIN` | 租户治理 -> 身份授权 -> 配置治理 -> 审计中心 | 已冻结，待核 API | `SUPER_ADMIN` / `PLATFORM_ADMIN` 双名并存，尚未逐页核对 API 权限元数据 | 逐项核 `tenants`、`identity-access`、`configuration`、`audit-trail` 页面与 API 的权限一致性 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` `EV-ROLE-0008` |
| `AUDIT-ROLE-0002` | 租户管理员 | `TENANT_ADMIN` | `/workbench/tenant_admin`；目录与详情统一 `workbench.read` | `TENANT_ADMIN` | 品牌矩阵 -> 渠道编排 -> 配置治理 -> 官网入口 -> 国际化 | 已冻结，待核 API | bootstrap actor 已有角色，但具体页面和真实 API 链路尚未逐项闭环 | 核品牌矩阵、渠道编排、配置治理、ToB 官网入口的页面门禁与 API 权限 | `EV-ROLE-0001` `EV-ROLE-0002` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` `EV-ROLE-0008` |
| `AUDIT-ROLE-0003` | 品牌经理 | `BRAND_MANAGER` | `/workbench/brand_manager`；目录与详情统一 `workbench.read` | 暂按 `TENANT_ADMIN` 子集管理 | 会员运营 -> 营销投放 -> 品牌官网 -> 本地化投放 | 已冻结，待补正式角色 | 前端角色已存在，但后端没有同名稳定正式角色和权限包 | 先补正式角色与最低权限口径，再核营销、会员、品牌官网链路 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` `EV-ROLE-0008` |
| `AUDIT-ROLE-0004` | 店长 | `STORE_MANAGER` | `/workbench/store_manager`；目录与详情统一 `workbench.read` | `STORE_MANAGER` | 门店日报 -> 现场调度 -> 预约排队 -> 异常预警 | 已冻结，待核 API | 工作台职责清晰，但预约、排队、日报的真实 API 与测试证据尚未拉齐 | 核门店日报、现场调度、预约排队页面对应 API、tenant scope 和回归证据 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` `EV-ROLE-0008` |
| `AUDIT-ROLE-0005` | 导玩员 / 导购 | `GUIDE` | `/workbench/guide`；`/pad/guide`；目录、详情、Pad 统一 `workbench.read` | `SALES_GUIDE` | 会员接待 -> 推荐转化 -> 线索跟进 -> 回访 | 已冻结，待补 Pad 穿透 | 页面名 `GUIDE` 与正式角色名 `SALES_GUIDE` 存在双名；Pad 到 API 的真实链路尚未审完 | 补 `Pad 页面 -> API -> 权限 -> 测试` 穿透证据，并固定双名映射 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` `EV-ROLE-0008` `EV-ROLE-0009` |
| `AUDIT-ROLE-0006` | 收银员 / 前台 | `CASHIER` | `/workbench/cashier`；`/pad/cashier`；目录、详情、Pad 统一 `workbench.read` | `CASHIER` | 收银核销 -> 储值支付 -> 退款 -> 离线兜底 | 已冻结，待补 Pad 穿透 | “前台”别名仍可能在页面或文档里漂移；Pad 交易链路尚未逐项核 API 与测试 | 对齐“前台= `CASHIER`”口径，并审收银、退款、离线能力链路 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0005` `EV-ROLE-0008` `EV-ROLE-0009` |
| `AUDIT-ROLE-0007` | 仓库人员 | `WAREHOUSE` | `/workbench/warehouse`；目录与详情统一 `workbench.read` | 待补正式角色 | 库存盘点 -> 出入库 -> 调拨 -> 损耗复盘 | 已冻结，待补正式角色 | 前端工作台存在，但后端仍回落到 `operator` 占位，无法给出正式权限闭环结论 | 先补仓储正式角色与权限包，再核库存、调拨、回执 API | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` `EV-ROLE-0008` |
| `AUDIT-ROLE-0008` | 教练 | `COACH` | `/workbench/coach`；`/pad/coach`；目录、详情、Pad 统一 `workbench.read` | 待补正式角色 | 会员接待 -> 课程排期 -> 考勤签到 -> 裂变推广 | 已冻结，待补正式角色 + Pad 穿透 | 前端角色已存在，但后端无稳定同名正式角色；Pad 现场链路尚未穿透 | 先补正式角色，再核课程、签到、回执和会员隐私审计链路 | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` `EV-ROLE-0008` `EV-ROLE-0009` |
| `AUDIT-ROLE-0009` | 运营人员 | `OPERATIONS` | `/workbench/operations`；目录与详情统一 `workbench.read` | 待补正式角色 | 任务分派 -> 运营回执 -> 治理审批 -> 告警 triage -> 审计复盘 | 已冻结，待补正式角色 | bootstrap 已承认该角色，但后端正式角色仍回落到 `operator`；治理链路未逐页核 API | 先补运营正式角色与权限包，再核 approvals、alerts、operations、audit-trail | `EV-ROLE-0001` `EV-ROLE-0002` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` `EV-ROLE-0008` |
| `AUDIT-ROLE-0010` | 财务人员 | `FINANCE` | `/workbench/finance`；目录与详情统一 `workbench.read` | 待补正式角色 | 对账 -> 退款 -> 税务配置 -> 审计复盘 | 已冻结，待补正式角色 | 财务工作台能力已存在，但后端无同名稳定正式角色；财务链路易被误判为已闭环 | 先补财务正式角色与权限包，再核 finance、audit-trail、configuration 关联 API | `EV-ROLE-0001` `EV-ROLE-0003` `EV-ROLE-0004` `EV-ROLE-0006` `EV-ROLE-0008` |

## 5. 当前审计结论

1. `10` 个工作台角色都已具备“角色名 + 页面入口 + 关键流程”的审计坐标。
2. 高置信完成“工作台角色名 <-> 正式权限角色名”映射的角色为：
   - `SUPER_ADMIN` <-> `PLATFORM_ADMIN`
   - `TENANT_ADMIN` <-> `TENANT_ADMIN`
   - `STORE_MANAGER` <-> `STORE_MANAGER`
   - `GUIDE` <-> `SALES_GUIDE`
   - `CASHIER` <-> `CASHIER`
3. 当前不能给出“前后端角色完全对齐”结论的角色为：
   - `BRAND_MANAGER`
   - `WAREHOUSE`
   - `COACH`
   - `OPERATIONS`
   - `FINANCE`
4. 现场角色当前不能给出“流程已闭环”结论，除非补齐：
   - `Pad 页面`
   - `真实 API`
   - `权限元数据`
   - `测试 / 回归`

## 6. 优先级建议

### 6.1 P0

- `OPERATIONS`
- `FINANCE`
- `GUIDE`
- `CASHIER`

原因：

- 涉及治理、审批、审计、交易和现场动作，是高风险角色面。

### 6.2 P1

- `BRAND_MANAGER`
- `STORE_MANAGER`
- `WAREHOUSE`
- `COACH`

原因：

- 工作台已存在，但要么正式角色未补齐，要么关键流程仍需继续穿透。

### 6.3 P2

- `SUPER_ADMIN`
- `TENANT_ADMIN`

原因：

- 角色映射已经较稳定，当前重点是逐域做页面/API 一致性回扫。

## 7. 关联文档

- `docs/knowledge/role-workbench-capability-matrix.md`
- `docs/knowledge/role-master-dictionary.md`
- `docs/knowledge/evidence-field-standard.md`
- `docs/knowledge/expert54-full-process-audit-plan.md`
