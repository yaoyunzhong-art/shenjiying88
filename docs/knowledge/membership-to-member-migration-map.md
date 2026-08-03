# membership 到 member 路由映射与迁移清单

## 1. 目的

本文件用于把历史兼容层 `membership` 的路由逐项映射到正式会员域 `member`，形成可执行的迁移清单。

本文件承接：

- `docs/knowledge/member-domain-canonical-model.md`

目标是回答三件事：

1. 哪些 `/membership` 路由可以直接迁到 `/members`
2. 哪些能力需要先做语义合并再迁移
3. 哪些 `/membership` 能力在 `member` 中暂无等价实现，必须先补能力后迁移

## 2. 统一前提

本文件默认以下结论已经冻结：

1. 会员域正式产品口径统一为：
   - `会员域 Member`
2. 会员域正式接口前缀统一为：
   - `/members`
3. `/membership` 只视为：
   - `历史兼容 / 迁移层`

## 3. 迁移分组

### 3.1 可直接映射

满足以下条件即可直接映射：

- `member` 已存在同语义能力
- 当前真实前端已优先消费 `member`
- 迁移主要是文档、调用口径或路由别名收口

### 3.2 需语义合并

满足以下条件归入本组：

- 两边都已有能力
- 但命名、返回结构、职责边界不完全一致

### 3.3 需补能力后迁移

满足以下条件归入本组：

- `membership` 有能力
- `member` 暂无清晰等价正式接口

## 4. 一对一映射表

| membership 路由 | member 对应 | 迁移类型 | 说明 |
| --- | --- | --- | --- |
| `POST /membership/register` | `POST /members/register` 或 `POST /members/persistent/register` | 需语义合并 | `member` 当前同时有轻量注册与持久化注册，两者需先冻结唯一正式注册入口 |
| `GET /membership/:id` | `GET /members/:memberId` 或 `GET /members/persistent/:memberId` | 需语义合并 | `member` 同时有基础档案与持久化档案，两套读取语义要先分清 |
| `GET /membership` | `GET /members` 或 `GET /members/persistent` | 需语义合并 | 现有前端更偏使用 `persistent` 列表，建议正式列表主线收敛到持久化档案 |
| `GET /membership/:id/upgrade` | `GET /members/:memberId/upgrade-check` | 可直接映射 | 两者都表达升级检查 / 进度语义，`member` 可作为正式主线 |
| `POST /membership/register` 对应前端注册场景 | `POST /members/persistent/register` | 可直接映射 | 若按正式主档案口径推进，建议 TOC / Admin 新注册统一走持久化注册 |

## 5. 需语义合并表

| 能力域 | membership | member | 当前问题 | 推荐结论 |
| --- | --- | --- | --- | --- |
| 注册 | `POST /membership/register` | `POST /members/register`、`POST /members/persistent/register` | `member` 有两个注册入口 | 正式主线统一为 `POST /members/persistent/register`，轻量注册保留兼容期 |
| 按 ID 查询 | `GET /membership/:id` | `GET /members/:memberId`、`GET /members/persistent/:memberId` | `member` 同时有基础档案和持久化档案 | 正式主线统一到持久化档案读取 |
| 列表查询 | `GET /membership` | `GET /members`、`GET /members/persistent` | 前端真实消费更偏 `/members/persistent` | 正式列表统一为持久化列表 |
| 等级信息 | `GET /membership/:id/level` | `POST /members/persistent/:memberId/level`、`GET /members/:memberId/upgrade-check` | `member` 有调级与检查，但缺显式等级详情读取接口 | 先给 `member` 补显式等级详情，再关闭 `/membership/:id/level` |
| 积分累计 / 回滚 | `POST /membership/:id/points/earn`、`redeem`、`adjust` | `POST /members/persistent/:memberId/points/award`、`rollback`、`POST /members/:memberId/add-points` | 命名和业务语义不统一 | 正式主线统一到 `persistent` 积分主账动作 |
| 余额主账 | `POST /membership/:id/balance/recharge`、`pay`、`history` | `GET /members/:memberId/balance`、`POST /members/persistent/:memberId/payment-activity` | `member` 只有余额概览和支付活动，没有显式充值 / 支付 / 流水接口 | 先补 `member` 余额主账动作，再迁移 |
| 统计 | `GET /membership/stats` | `GET /members/bootstrap`、持久化列表聚合能力 | 没有直接等价统计接口 | 先明确统计需求归属，再补正式统计接口 |

## 6. 需补能力后迁移表

| membership 路由 | member 现状 | 缺口 | 迁移建议 |
| --- | --- | --- | --- |
| `POST /membership/get-or-create` | 无直接等价正式接口 | `member` 缺显式 `get-or-create` 语义 | 若三端仍需要手机号幂等建档，补 `POST /members/get-or-create` 后再迁 |
| `GET /membership/phone/:phone` | 无直接等价正式接口 | `member` 缺手机号查人标准接口 | 补 `GET /members/phone/:phone` 或在持久化列表提供 phone 精确查询 |
| `PUT /membership/:id` | `member` 无标准 `PUT` 更新接口，只有 `persistent/:id/profile` | REST 语义不一致 | 正式统一到 `POST /members/persistent/:memberId/profile`，并补映射说明 |
| `DELETE /membership/:id` | `member` 无删除接口 | 主档案删除语义缺失 | 先判定是否允许会员删除，再决定迁不迁 |
| `GET /membership/levels` | `member` 无等级配置读取接口 | 配置读取缺口 | 补 `GET /members/levels` 后迁移 |
| `GET /membership/:id/level` | `member` 无显式等级详情读取接口 | 详情读取缺口 | 补 `GET /members/:memberId/level` |
| `POST /membership/:id/refresh-level` | `member` 无自动刷新等级接口 | 自动刷新缺口 | 补 `POST /members/:memberId/refresh-level` 或明确由升级检查替代 |
| `GET /membership/:id/points/history` | `member` 无显式积分流水读取接口 | 流水查询缺口 | 补 `GET /members/:memberId/points/history` |
| `POST /membership/:id/points/adjust` | `member` 无显式统一 adjust 接口 | 调整动作命名缺口 | 统一到 `award / rollback` 或补 `adjust` |
| `POST /membership/:id/balance/recharge` | `member` 无显式充值接口 | 充值主账缺口 | 补 `POST /members/:memberId/balance/recharge` |
| `POST /membership/:id/balance/pay` | `member` 无显式余额支付接口 | 支付主账缺口 | 补 `POST /members/:memberId/balance/pay` |
| `GET /membership/:id/balance/history` | `member` 无显式余额流水接口 | 流水缺口 | 补 `GET /members/:memberId/balance/history` |
| `GET /membership/stats` | `member` 无显式 stats 接口 | 统计缺口 | 补 `GET /members/stats` |

## 7. 前端影响面

### 7.1 当前真实消费主线

当前高置信真实前端消费已明显偏向 `member`：

- Admin：`/members/persistent` 与 `/members/*`
- Miniapp：`/members/persistent`、`/members/login`、`/members/sessions/:token`
- Storefront：`/members/register`、`/members/:id`、`/members/:id/balance`
- TOB：内部 `/api/member/*` 聚合

结论：

- 当前迁移的重点不是“改前端直连 `/membership`”，而是“收口历史文档和后端兼容层”。

### 7.2 当前风险点

尽管前端主线已偏 `member`，但仍存在三类风险：

1. 文档仍把 P-36 正式能力记在 `membership`
2. 测试、README、旧审计材料仍把 `membership` 当作正式模块
3. `member` 尚未补齐 `membership` 的若干显式查询 / 统计 / 余额接口

## 8. 迁移顺序

### 8.1 第一阶段：冻结与禁增

- 冻结正式口径为 `member`
- 禁止任何新增前端或新需求直连 `/membership`
- 为 `membership` README、PRD、审计文档补“历史兼容层”说明

### 8.2 第二阶段：补 member 缺口

- 补手机号查询
- 补等级配置 / 等级详情
- 补积分流水
- 补余额充值 / 支付 / 流水
- 补 stats

### 8.3 第三阶段：路由收口

- 为 `/membership` 每条仍必要的接口挂兼容映射说明
- 把可直接映射的路由迁到 `/members`
- 保留短期别名兼容

### 8.4 第四阶段：清理兼容层

- 迁移完成后统计 `/membership` 剩余调用
- 若无活跃调用，降级为内部兼容模块或计划下线

## 9. 阻断项

| riskId | 阻断项 | 影响 |
| --- | --- | --- |
| `RISK-MIG-0001` | `member` 尚未补齐 `membership` 的显式余额与流水接口 | 无法彻底关停 `/membership` |
| `RISK-MIG-0002` | `member` 同时存在基础档案与持久化档案两套读写语义 | 注册 / 查询映射不够单一 |
| `RISK-MIG-0003` | P-36 文档体系仍以 `membership` 命名 | 需求、实现、验收继续分裂 |
| `RISK-MIG-0004` | 测试与 README 仍会把 `membership` 误当正式能力 | 评审和复签口径继续漂移 |

## 10. 当前冻结结论

1. 可立即冻结的正式映射方向是：
   - `membership -> member`
2. 当前不能直接删除 `/membership`，因为 `member` 仍缺若干显式等价接口。
3. 当前最优迁移策略不是“先删兼容层”，而是：
   - 先补 `member`
   - 再收 `/membership`

## 11. 下一步执行建议

1. 先补一份《会员域缺口补齐清单》，把 `member` 需要新增的等价接口列全。
2. 回扫 P-36 PRD / 验收卡，把“正式实现域 = member”写入文档。
3. 若进入实现阶段，优先补：
   - phone 查询
   - level 配置 / 详情
   - points history
   - balance recharge / pay / history
   - stats

## 12. 关联文档

- `docs/knowledge/member-domain-canonical-model.md`
- `docs/knowledge/member-chain-trace-audit.md`
- `docs/knowledge/evidence-field-standard.md`
