# 会员域正式口径统一表

## 1. 目的

本文件用于正式收敛当前会员域 `member` 与 `membership` 双口径并存问题，统一：

1. 产品口径
2. API 正式口径
3. 前端消费口径
4. PRD / 验收映射口径
5. 迁移策略

本文件是 `会员主链穿透审计表` 的直接收口文档，用于关闭 `GAP-LINK-0003` 的“正式口径未统一”风险。

## 2. 当前问题

当前仓内并存两套会员 API：

1. `member`
   - 路由前缀：`/members`
2. `membership`
   - 路由前缀：`/membership`

两者都覆盖以下核心会员语义：

- 注册
- 查询
- 等级
- 积分
- 余额

这导致：

- 三端无法用单一正式口径验收
- PRD 与实现映射容易双写
- 前端消费点与后端模块命名持续漂移

## 3. 统一结论

### 3.1 产品口径

会员域对外正式名称统一为：

- `会员域 Member`

禁止继续把：

- `Membership 模块`
- `Member 模块`

作为两套并列正式产品能力来描述。

### 3.2 API 口径

会员域对外正式接口前缀统一为：

- `/members`

统一后规则：

1. 新需求只允许挂到 `/members`。
2. 新前端消费点只允许直连 `member` 域标准接口。
3. `/membership` 只保留为历史兼容 / 迁移层，不再作为新增需求承载面。

### 3.3 验收口径

后续会员域验收一律使用以下映射主线：

- `PRD / 验收卡 -> /members 标准接口 -> 前端真实消费点 -> 自动化用例`

不再接受：

- `PRD 记在 membership`
- 前端实际走 members
- 验收再回头解释为“本质等价”

这种口头映射。

## 4. 现状证据

| evidenceId | level | 摘要 | 来源 |
| --- | --- | --- | --- |
| `EV-MEM-CAN-0001` | `A` | `member` 与 `membership` 两套控制器都覆盖注册、查询、等级、积分、余额语义。 | `apps/api/src/modules/member/member.controller.ts` `apps/api/src/modules/membership/membership.controller.ts` |
| `EV-MEM-CAN-0002` | `A` | Admin 主消费点优先接 `/members/persistent` 与 `/members/*`。 | `apps/admin-web/app/members-view-model.ts` |
| `EV-MEM-CAN-0003` | `A` | Miniapp 启动链优先消费 `/members/persistent`、`/members/login`、`/members/sessions/:token`。 | `apps/miniapp/src/market-bootstrap.ts` |
| `EV-MEM-CAN-0004` | `A` | Storefront 主消费点优先使用 `/members/register`、`/members/:id`、`/members/:id/balance`。 | `apps/storefront-web/lib/storefront-transactions.ts` |
| `EV-MEM-CAN-0005` | `A` | TOB 会员中心消费内部 `/api/member/*` 聚合接口。 | `apps/tob-web/app/member-center/member-center-service.ts` |
| `EV-MEM-CAN-0006` | `B` | `membership` 的 P-36 PRD / 验收映射最完整，但前端活跃消费并未统一走 `/membership`。 | `docs/prd/member-p36/prd-member-p36.md` `docs/acceptance/member-p36/acceptance-member-p36.md` |
| `EV-MEM-CAN-0007` | `B` | 会员主链审计已把双口径并存列为核心断点。 | `docs/knowledge/member-chain-trace-audit.md` |

## 5. 职责拆分

### 5.1 `member` 的正式职责

`member` 统一定义为会员域正式主线，负责：

1. 会员主数据
2. 登录态关联的会员档案
3. 持久化会员档案 / 运营画像
4. 等级、积分、余额主账
5. 运营回执、审批与治理相关输出
6. 对三端提供统一会员查询与操作入口

### 5.2 `membership` 的历史职责

`membership` 统一定义为：

- `P-36 历史实现 / 兼容层`

保留目的仅限于：

1. 迁移期兼容既有测试或旧路由
2. 为历史文档与旧实现提供可追溯关系

明确禁止：

1. 为 `membership` 新增前端直接消费
2. 为 `membership` 继续扩新业务能力
3. 在新 PRD 中把 `membership` 当作正式主模块

## 6. 重叠能力映射

| 能力 | `member` | `membership` | 统一结论 |
| --- | --- | --- | --- |
| 注册 | `/members/register` | `/membership/register` | 统一收敛到 `member` |
| 查询 / 列表 | `/members` `/members/:id` | `/membership` `/membership/:id` | 统一收敛到 `member` |
| 等级 | 升级检查 / 手工调级 | 等级详情 / 升级进度 / 刷新等级 | 统一收敛到 `member`，保留兼容映射 |
| 积分 | 发放 / 回滚 / 活动记录 | earn / redeem / history / adjust | 统一收敛到 `member` |
| 余额 | 余额概览 / 支付活动 | recharge / pay / history | 统一收敛到 `member` |
| 统计 / 运营 | 持久化档案 / 画像 / 回执 / LYT 快照 | 基础统计 | 正式主线归 `member` |

## 7. 前端消费统一规则

### 7.1 Admin

- 正式消费域：`member`
- 当前主入口：`/members/persistent`、`/members/*`

### 7.2 TOC

- 正式消费域：`member`
- 登录认证仍可经 `auth`，但登录后的会员业务查询统一归 `member`

### 7.3 TOB

- 正式消费域：`member`
- 内部聚合层也必须以 `member` 为唯一会员数据主源

### 7.4 Miniapp / App

- 正式消费域：`member`
- 不允许新链路直接接 `/membership`

## 8. 文档统一规则

1. 新文档里统一使用：
   - `会员域 Member`
2. 历史文档引用 `membership` 时，必须补一句：
   - `该名称对应历史实现层，正式域口径已统一收敛到 member`
3. P-36 及后续会员需求卡需要追加一列：
   - `正式实现域`
   - 值固定为 `member`

## 9. 迁移策略

### 9.1 第一阶段

- 冻结正式口径
- 禁止新增 `/membership` 直连消费
- 为现有 PRD / 审计文档补充“正式实现域 = member”

### 9.2 第二阶段

- 梳理 `/membership` 与 `/members` 的一对一路由映射
- 为 `/membership` 标注兼容层状态
- 新增迁移清单与下线时序

### 9.3 第三阶段

- 前端遗留消费全部迁到 `member`
- 兼容期结束后，评估 `/membership` 是否降级只保留别名或完全下线

## 10. 当前冻结结论

1. 会员域只有一套正式能力，名称叫：
   - `会员域 Member`
2. 正式接口前缀只有一套：
   - `/members`
3. `/membership` 从本文件起只视为：
   - `历史兼容 / 迁移层`
4. 会员域验收只认：
   - `member` 域实现
   - 三端真实消费链
   - 自动化证据

## 11. 下一步执行建议

1. 继续产出《membership -> member 路由映射与迁移清单》。
2. 回扫会员域 PRD、需求卡、验收卡，补“正式实现域 = member”字段。
3. 对 TOC 注册、会员卡、Admin 会员详情、TOB 会员经营视图按统一口径继续补链。

## 12. 关联文档

- `docs/knowledge/member-chain-trace-audit.md`
- `docs/knowledge/cross-end-link-breakpoints.md`
- `docs/knowledge/evidence-field-standard.md`
