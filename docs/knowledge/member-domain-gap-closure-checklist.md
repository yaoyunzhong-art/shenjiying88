# member 域缺口补齐清单

## 1. 目的

本文件用于承接：

- `docs/knowledge/member-domain-canonical-model.md`
- `docs/knowledge/membership-to-member-migration-map.md`

目标是把 `member` 为了承接历史兼容层 `membership` 还需要补齐的正式能力一次列全，明确：

1. 哪些缺口只是路由未补
2. 哪些缺口属于主账能力未落地
3. 哪些接口虽然已存在，但当前仍是占位或空返回，不能算闭环
4. `membership` 兼容层在什么前提下才能开始收口

## 2. 当前冻结结论

当前会员域的正式产品口径仍然冻结为：

- `会员域 Member`
- 正式接口前缀：`/members`

但基于当前源码，`member` 还不能直接替代 `membership` 作为唯一完整会员后端面，原因不是“没有 controller”，而是同时存在以下三类问题：

1. `membership` 仍保留若干 `member` 没有的显式正式接口
2. `member` 某些能力只做到概览或运营回执，尚未形成可迁移的主账动作
3. `member` 某些读取接口当前仅返回空数组或占位值，不能作为正式能力验收

## 3. 缺口分层

### 3.1 路由缺口

定义：

- `membership` 已有真实业务路由
- `member` 缺少等价正式路由或缺少统一命名

### 3.2 主账能力缺口

定义：

- `member` 已有部分相关能力
- 但没有形成可独立验收的主账动作、流水模型或统计模型

### 3.3 占位能力缺口

定义：

- `member` controller 已挂路由
- 但当前返回空数组、空对象或硬编码占位值
- 不能作为迁移完成依据

## 4. 核心缺口清单

| gapId | 缺口域 | 现状 | 证据 | 风险等级 | 补齐结论 |
| --- | --- | --- | --- | --- | --- |
| `GAP-MEMBER-001` | 幂等建档 | `membership` 有 `POST /membership/get-or-create`，`member` 无等价接口 | `membership.controller.ts` `getOrCreate` | `P0` | 补 `POST /members/get-or-create` 或明确注册接口内置幂等建档语义 |
| `GAP-MEMBER-002` | 手机号精确查询 | `membership` 有 `GET /membership/phone/:phone`，`member` 无标准 phone 查询接口 | `membership.controller.ts` `findByPhone` | `P0` | 补 `GET /members/phone/:phone` 或在持久化列表中提供等价精确查询能力 |
| `GAP-MEMBER-003` | 等级配置读取 | `membership` 有 `GET /membership/levels`，`member` 无 `GET /members/levels` | `membership.controller.ts` `getLevels` | `P0` | 补正式等级配置读取接口，避免前端继续依赖历史模块 |
| `GAP-MEMBER-004` | 等级详情读取 | `membership` 有 `GET /membership/:id/level`，`member` 只有调级与升级检查 | `membership.controller.ts` `getLevel` + `member.controller.ts` `overridePersistentLevel` | `P0` | 补 `GET /members/:memberId/level` |
| `GAP-MEMBER-005` | 自动刷新等级 | `membership` 有 `POST /membership/:id/refresh-level`，`member` 无自动刷新接口 | `membership.controller.ts` `refreshLevel` | `P1` | 明确是保留独立刷新动作，还是统一折叠进升级检查 |
| `GAP-MEMBER-006` | 积分流水 | `membership` 有 `GET /membership/:id/points/history`，`member` 无显式等价路由 | `membership.controller.ts` `pointsHistory` | `P0` | 补 `GET /members/:memberId/points/history`，并对齐持久化主档案语义 |
| `GAP-MEMBER-007` | 积分统一调整语义 | `membership` 有 `adjust`，`member` 只有 `award` / `rollback` / `add-points`，命名分裂 | 两套 controller 对比 | `P1` | 冻结唯一正式动作命名，避免前后端和 PRD 再次双写 |
| `GAP-MEMBER-008` | 余额充值 | `membership` 有 `POST /membership/:id/balance/recharge`，`member` 无显式充值接口 | `membership.controller.ts` `recharge` | `P0` | 补 `POST /members/:memberId/balance/recharge` |
| `GAP-MEMBER-009` | 余额支付 | `membership` 有 `POST /membership/:id/balance/pay`，`member` 无显式余额支付接口 | `membership.controller.ts` `payWithBalance` | `P0` | 补 `POST /members/:memberId/balance/pay` |
| `GAP-MEMBER-010` | 余额流水 | `membership` 有 `GET /membership/:id/balance/history`，`member` 无显式流水接口 | `membership.controller.ts` `balanceHistory` | `P0` | 补 `GET /members/:memberId/balance/history` |
| `GAP-MEMBER-011` | 会员统计 | `membership` 有 `GET /membership/stats`，`member` 无显式 `GET /members/stats` | `membership.controller.ts` `stats` | `P0` | 补正式 stats 接口，不能再用 bootstrap 或列表聚合替代 |
| `GAP-MEMBER-012` | 删除语义 | `membership` 有 `DELETE /membership/:id`，`member` 无删除接口 | `membership.controller.ts` `delete` | `P1` | 先冻结“会员是否允许删除”产品口径，再决定是否迁移 |
| `GAP-MEMBER-013` | 更新语义统一 | `membership` 有 `PUT /membership/:id`，`member` 当前主线是 `POST /members/persistent/:memberId/profile` | 两套 controller 对比 | `P1` | 正式冻结 `persistent profile` 为唯一更新主线，并补映射说明 |

## 5. 占位与假闭环清单

以下路由虽已存在于 `member`，但当前不能计入“已补齐”：

| gapId | member 路由 | 当前实现 | 风险等级 | 结论 |
| --- | --- | --- | --- | --- |
| `GAP-MEMBER-101` | `GET /members/:memberId/payments` | 直接返回 `[]` | `P1` | 支付方式/支付记录能力仍是占位 |
| `GAP-MEMBER-102` | `GET /members/:memberId/login-history` | 直接返回 `[]` | `P1` | 登录记录未形成正式会员审计视图 |
| `GAP-MEMBER-103` | `GET /members/:memberId/security-events` | 直接返回 `[]` | `P1` | 安全事件未接入正式会员域查询 |
| `GAP-MEMBER-104` | `GET /members/:memberId/churn/predictions` | 直接返回 `[]` | `P2` | 流失预测只是路由占位 |
| `GAP-MEMBER-105` | `GET /members/:memberId/churn/diagnosis` | 直接返回 `[]` | `P2` | 流失诊断只是路由占位 |
| `GAP-MEMBER-106` | `GET /members/:memberId/balance` | 返回 `balance: 0`、`frozenPoints: 0`、`couponCount: 0` 占位值 | `P0` | 余额、冻结积分、券包计数尚未接主账，当前只剩积分概览可信 |

## 6. 主账能力判断

### 6.1 已有高置信能力

当前 `member` 已具备、可以作为正式主线继续扩展的能力：

- 持久化注册：`registerPersistent`
- 持久化档案读取：`getPersistentProfile`
- 持久化列表：`listPersistentProfiles`
- 会员画像与运营任务：`getOperationsProfile`
- 积分发放 / 回滚：`awardPoints`、`rollbackPoints`
- 手工调级：`overridePersistentLevel`
- 支付活动回执：`recordPaymentActivity`
- 登录态：`login`、`getSession`

结论：

- `member` 已经具备“正式主线骨架”
- 当前问题不在于要不要以 `member` 为正式域
- 当前问题在于还缺少可替代 `membership` 的主账读写面

### 6.2 未形成正式主账的能力

以下能力虽然在 `member` 已出现局部能力，但还没有形成正式可迁移闭环：

| gapId | 能力 | 当前状态 | 风险等级 | 补齐要求 |
| --- | --- | --- | --- | --- |
| `GAP-MEMBER-201` | 余额主账 | 只有余额概览与支付活动回执，没有充值 / 支付 / 流水动作 | `P0` | 补齐余额主账动作和流水查询 |
| `GAP-MEMBER-202` | 冻结积分 | `getMemberBalance` 返回固定 `0` | `P1` | 明确冻结积分来源模型并接入 |
| `GAP-MEMBER-203` | 券包计数 | `getMemberBalance` 返回固定 `0` | `P1` | 从券模块或聚合层接入正式计数 |
| `GAP-MEMBER-204` | 等级详情与配置 | 已有手工调级与升级检查，但缺读取面 | `P0` | 增加等级配置读取与会员等级详情读取 |
| `GAP-MEMBER-205` | 积分流水查询 | 已有积分变更动作，没有正式查询接口 | `P0` | 增加标准流水查询接口 |
| `GAP-MEMBER-206` | 聚合统计 | 现有 bootstrap 不是正式 stats | `P0` | 补 `GET /members/stats`，冻结输出口径 |

## 7. 收口前置条件

`membership` 兼容层不得下线，至少要先满足以下条件：

1. `member` 已补齐 `get-or-create` 与 `phone` 查询
2. `member` 已补齐等级配置、等级详情、积分流水
3. `member` 已补齐余额充值、余额支付、余额流水
4. `member` 的 `balance` 不再返回占位值
5. `member` 已提供正式 stats 接口
6. `member` 的更新语义与注册语义已冻结为唯一主线
7. README、PRD、验收卡已写明：
   - `membership` = 历史兼容层
   - `member` = 正式实现域

## 8. 推荐施工顺序

### 8.1 第一批

- `GET /members/phone/:phone`
- `POST /members/get-or-create`
- `GET /members/levels`
- `GET /members/:memberId/level`

理由：

- 这批优先收掉注册、查人、等级读取三类高频历史依赖

### 8.2 第二批

- `GET /members/:memberId/points/history`
- `POST /members/:memberId/balance/recharge`
- `POST /members/:memberId/balance/pay`
- `GET /members/:memberId/balance/history`

理由：

- 这批决定 `membership` 是否还能继续作为积分 / 余额主账唯一来源

### 8.3 第三批

- `GET /members/stats`
- `POST /members/:memberId/refresh-level` 或正式替代说明
- 更新 / 删除语义冻结与兼容说明

理由：

- 这批用于把管理面和文档面口径完全收平

## 9. 证据登记

### 9.1 证据 A

- evidenceId: `EV-MEMBER-GAP-0001`
- title: `member` 已具备持久化注册与持久化档案骨架
- domain: `会员域`
- scope: `api`
- entityType: `服务`
- entityName: `MemberService`
- claimType: `已实现`
- sourceType: `源码`
- evidenceLevel: `A`
- sourcePath: `apps/api/src/modules/member/member.service.ts`
- sourceRef: `registerPersistent / getPersistentProfile / listPersistentProfiles`
- capturedAt: `2026-07-26`
- owner: `树哥`
- status: `有效`
- summary: `member` 已具备持久化会员注册、档案读取和列表能力，足以承接正式主线骨架

- evidenceId: `EV-MEMBER-GAP-0002`
- title: `membership` 仍保留幂等建档与手机号查询
- domain: `会员域`
- scope: `api`
- entityType: `控制器`
- entityName: `MembershipController`
- claimType: `存在缺口`
- sourceType: `源码`
- evidenceLevel: `A`
- sourcePath: `apps/api/src/modules/membership/membership.controller.ts`
- sourceRef: `getOrCreate / findByPhone`
- capturedAt: `2026-07-26`
- owner: `树哥`
- status: `有效`
- summary: `membership` 仍拥有 `member` 不具备的幂等建档与手机号查询路由，兼容层暂不能下线

- evidenceId: `EV-MEMBER-GAP-0003`
- title: `membership` 仍保留等级、积分、余额、统计读取面
- domain: `会员域`
- scope: `api`
- entityType: `控制器`
- entityName: `MembershipController`
- claimType: `存在缺口`
- sourceType: `源码`
- evidenceLevel: `A`
- sourcePath: `apps/api/src/modules/membership/membership.controller.ts`
- sourceRef: `getLevels / getLevel / pointsHistory / recharge / payWithBalance / balanceHistory / stats`
- capturedAt: `2026-07-26`
- owner: `树哥`
- status: `有效`
- summary: `membership` 仍承担完整等级读取、积分流水、余额主账和统计职责，`member` 尚未等价补齐

- evidenceId: `EV-MEMBER-GAP-0004`
- title: `member` 余额概览仍含占位值
- domain: `会员域`
- scope: `api`
- entityType: `服务`
- entityName: `MemberService.getMemberBalance`
- claimType: `存在风险`
- sourceType: `源码`
- evidenceLevel: `A`
- sourcePath: `apps/api/src/modules/member/member.service.ts`
- sourceRef: `getMemberBalance`
- capturedAt: `2026-07-26`
- owner: `树哥`
- status: `有效`
- summary: `balance`、`frozenPoints`、`couponCount` 当前仍返回占位值，说明余额与券包主账尚未接入

- evidenceId: `EV-MEMBER-GAP-0005`
- title: `member` 存在多个空返回占位接口
- domain: `会员域`
- scope: `api`
- entityType: `控制器`
- entityName: `MemberController`
- claimType: `存在风险`
- sourceType: `源码`
- evidenceLevel: `A`
- sourcePath: `apps/api/src/modules/member/member.controller.ts`
- sourceRef: `getPayments / getLoginHistory / getSecurityEvents / getChurnPredictions / getChurnDiagnosis`
- capturedAt: `2026-07-26`
- owner: `树哥`
- status: `有效`
- summary: 多个 `member` 路由当前直接返回空数组，只能视为占位，不能计入已补齐能力

- evidenceId: `EV-MEMBER-GAP-0006`
- title: `member` 被仓内定位为全量会员管理主线
- domain: `会员域`
- scope: `api`
- entityType: `文档`
- entityName: `member README`
- claimType: `已实现`
- sourceType: `源码文档`
- evidenceLevel: `A`
- sourcePath: `apps/api/src/modules/member/README.md`
- sourceRef: `用途`
- capturedAt: `2026-07-26`
- owner: `树哥`
- status: `有效`
- summary: README 已把 `member` 定义为全量会员管理主线，说明迁移方向本身没有问题

## 10. 当前冻结结论

1. `member` 作为正式会员域方向正确，不需要回退到 `membership`。
2. 当前真正缺的不是“再定口径”，而是把 `member` 的查询、等级、积分、余额、统计读写面补齐。
3. 在 `GAP-MEMBER-001` 到 `GAP-MEMBER-011` 未关闭前，`membership` 只能继续作为历史兼容层保留。
4. 在 `GAP-MEMBER-101` 到 `GAP-MEMBER-106` 未关闭前，`member` 现有部分接口不得被标记为“已闭环”。

## 11. 下一步执行建议

1. 先补 `phone` 查询、`get-or-create`、等级读取两类高频显式路由。
2. 再补积分流水与余额主账动作，并把 `getMemberBalance` 从占位值改为正式聚合。
3. 最后补 `stats` 与更新 / 删除语义说明，回扫 PRD、验收卡、README 的正式实现域字段。
